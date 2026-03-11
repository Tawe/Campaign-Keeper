"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedCampaign, requireOwnedDoc, requireUser } from "@/lib/auth/actions";
import { PLAYERS_COL } from "@/lib/firebase/db";
import { handlePortraitUpdate, deletePortrait } from "@/lib/storage/s3";

export interface CharacterInput {
  charId: string;
  name: string;
  class: string | null;
  race: string | null;
  level: number | null;
  statsLink: string | null;
  portraitUrl: string | null;
}

type ExistingCharDoc = { charId?: string; portraitPath?: string | null };

async function processCharacterPortraits(
  characters: CharacterInput[],
  existingChars: ExistingCharDoc[]
): Promise<Map<string, string | null>> {
  const existingByCharId = new Map(
    existingChars
      .filter((c) => c.charId)
      .map((c) => [c.charId!, c.portraitPath ?? null])
  );

  // Delete portraits for removed characters
  const newCharIds = new Set(characters.map((c) => c.charId).filter(Boolean));
  for (const [charId, path] of existingByCharId) {
    if (!newCharIds.has(charId)) {
      await deletePortrait(path);
    }
  }

  const result = new Map<string, string | null>();
  await Promise.all(
    characters.map(async (c) => {
      if (!c.charId) {
        result.set("", null);
        return;
      }
      const oldPath = existingByCharId.get(c.charId) ?? null;
      const { portraitPath } = await handlePortraitUpdate("character", c.charId, c.portraitUrl ?? "", oldPath);
      result.set(c.charId, portraitPath);
    })
  );
  return result;
}

function buildCharacterDocs(characters: CharacterInput[], portraitMap: Map<string, string | null>) {
  return characters
    .filter((c) => c.name.trim())
    .map((c) => ({
      charId: c.charId,
      name: c.name.trim(),
      nameLower: c.name.trim().toLowerCase(),
      class: c.class?.trim() || null,
      race: c.race?.trim() || null,
      level: c.level ?? null,
      statsLink: c.statsLink?.trim() || null,
      portraitPath: portraitMap.get(c.charId) ?? null,
    }));
}

export interface PlayerInput {
  campaignId: string;
  name: string;
  portraitUrl: string | null;
  characters: CharacterInput[];
}

export async function createPlayer(input: PlayerInput) {
  const user = await requireUser();
  await requireOwnedCampaign(input.campaignId);
  const now = FieldValue.serverTimestamp();
  const ref = adminDb().collection(PLAYERS_COL).doc();
  const { portraitPath } = await handlePortraitUpdate("player", ref.id, input.portraitUrl ?? "", null);

  const charPortraitMap = await processCharacterPortraits(input.characters, []);

  await ref.set({
    campaignId: input.campaignId,
    userId: user.uid,
    name: input.name.trim(),
    portraitPath,
    portraitUrl: null,
    characters: buildCharacterDocs(input.characters, charPortraitMap),
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath(`/campaigns/${input.campaignId}/players`);
  revalidatePath(`/campaigns/${input.campaignId}`);
  redirect(`/campaigns/${input.campaignId}/players`);
}

export async function updatePlayer(playerId: string, input: PlayerInput) {
  const { doc } = await requireOwnedDoc("player", playerId);
  const db = adminDb();
  const now = FieldValue.serverTimestamp();
  const actualCampaignId = doc.data()?.campaignId as string;
  if (actualCampaignId !== input.campaignId) {
    throw new Error("Player does not belong to that campaign.");
  }
  const previousPortraitPath = (doc.data()?.portraitPath as string | null) ?? null;
  const { portraitPath: nextPortraitPath } = await handlePortraitUpdate(
    "player",
    playerId,
    input.portraitUrl ?? "",
    previousPortraitPath
  );

  const existingChars = (doc.data()?.characters ?? []) as ExistingCharDoc[];
  const charPortraitMap = await processCharacterPortraits(input.characters, existingChars);

  await db.collection(PLAYERS_COL).doc(playerId).update({
    name: input.name.trim(),
    portraitPath: nextPortraitPath,
    portraitUrl: null,
    characters: buildCharacterDocs(input.characters, charPortraitMap),
    updatedAt: now,
  });

  revalidatePath(`/campaigns/${input.campaignId}/players`);
  revalidatePath(`/campaigns/${input.campaignId}`);
  redirect(`/campaigns/${input.campaignId}/players`);
}

/** Called by the player themselves to update their display name and characters. */
export async function updateMyProfile(
  playerId: string,
  name: string,
  characters: CharacterInput[]
) {
  const user = await requireUser();
  const db = adminDb();
  const doc = await db.collection(PLAYERS_COL).doc(playerId).get();
  if (!doc.exists || doc.data()?.playerUserId !== user.uid) {
    throw new Error("Not authorized");
  }
  const campaignId = doc.data()?.campaignId as string;

  const existingChars = (doc.data()?.characters ?? []) as ExistingCharDoc[];
  const charPortraitMap = await processCharacterPortraits(characters, existingChars);

  await db.collection(PLAYERS_COL).doc(playerId).update({
    name: name.trim(),
    characters: buildCharacterDocs(characters, charPortraitMap),
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/player/campaigns/${campaignId}`);
}

export async function deletePlayer(playerId: string, campaignId: string) {
  const { doc } = await requireOwnedDoc("player", playerId);
  const db = adminDb();
  const actualCampaignId = (doc.data()?.campaignId as string) || campaignId;
  await handlePortraitUpdate("player", playerId, "", (doc.data()?.portraitPath as string | null) ?? null);

  // Delete all character portraits
  const chars = (doc.data()?.characters ?? []) as ExistingCharDoc[];
  await Promise.all(chars.map((c) => deletePortrait(c.portraitPath)));

  await db.collection(PLAYERS_COL).doc(playerId).delete();

  revalidatePath(`/campaigns/${actualCampaignId}/players`);
  revalidatePath(`/campaigns/${actualCampaignId}`);
  redirect(`/campaigns/${actualCampaignId}/players`);
}
