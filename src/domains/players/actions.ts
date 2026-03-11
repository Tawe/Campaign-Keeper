"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedCampaign, requireOwnedDoc, requireUser } from "@/lib/auth/actions";
import { PLAYERS_COL } from "@/lib/firebase/db";
import { handlePortraitUpdate } from "@/lib/storage/s3";

export interface CharacterInput {
  name: string;
  class: string | null;
  race: string | null;
  level: number | null;
  statsLink: string | null;
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

  await ref.set({
    campaignId: input.campaignId,
    userId: user.uid,
    name: input.name.trim(),
    portraitPath,
    portraitUrl: null,
    characters: input.characters
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name.trim(),
        nameLower: c.name.trim().toLowerCase(),
        class: c.class?.trim() || null,
        race: c.race?.trim() || null,
        level: c.level ?? null,
        statsLink: c.statsLink?.trim() || null,
      })),
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

  await db.collection(PLAYERS_COL).doc(playerId).update({
    name: input.name.trim(),
    portraitPath: nextPortraitPath,
    portraitUrl: null,
    characters: input.characters
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name.trim(),
        nameLower: c.name.trim().toLowerCase(),
        class: c.class?.trim() || null,
        race: c.race?.trim() || null,
        level: c.level ?? null,
        statsLink: c.statsLink?.trim() || null,
      })),
    updatedAt: now,
  });

  revalidatePath(`/campaigns/${input.campaignId}/players`);
  revalidatePath(`/campaigns/${input.campaignId}`);
  redirect(`/campaigns/${input.campaignId}/players`);
}

export async function deletePlayer(playerId: string, campaignId: string) {
  const { doc } = await requireOwnedDoc("player", playerId);
  const db = adminDb();
  const actualCampaignId = (doc.data()?.campaignId as string) || campaignId;
  await handlePortraitUpdate("player", playerId, "", (doc.data()?.portraitPath as string | null) ?? null);

  await db.collection(PLAYERS_COL).doc(playerId).delete();

  revalidatePath(`/campaigns/${actualCampaignId}/players`);
  revalidatePath(`/campaigns/${actualCampaignId}`);
  redirect(`/campaigns/${actualCampaignId}/players`);
}
