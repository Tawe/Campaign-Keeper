"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { randomUUID } from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedCampaign, requireUser } from "@/lib/auth/actions";
import { CAMPAIGNS_COL, PLAYERS_COL } from "@/lib/firebase/db";
import { assertMaxLength, MAX_NAME_LENGTH } from "@/lib/validation";
import { toCampaign } from "@/lib/firebase/converters";
import { handlePortraitUpdate } from "@/lib/storage/s3";

export async function createCampaign(formData: FormData) {
  const user = await requireUser();

  const name = (formData.get("name") as string).trim();
  const system = ((formData.get("system") as string) || "").trim() || null;

  assertMaxLength(name, MAX_NAME_LENGTH, "Campaign name");
  if (system) assertMaxLength(system, MAX_NAME_LENGTH, "System");

  const now = FieldValue.serverTimestamp();
  const db = adminDb();

  const ref = await db.collection(CAMPAIGNS_COL).add({
    userId: user.uid,
    name,
    system,
    participants: [],
    inviteToken: randomUUID(),
    playerUserIds: [],
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/");
  revalidatePath("/app/dashboard");
  redirect(`/campaigns/${ref.id}`);
}

export async function updateCampaign(id: string, formData: FormData) {
  await requireOwnedCampaign(id);

  const name = (formData.get("name") as string).trim();
  const system = ((formData.get("system") as string) || "").trim() || null;

  assertMaxLength(name, MAX_NAME_LENGTH, "Campaign name");
  if (system) assertMaxLength(system, MAX_NAME_LENGTH, "System");

  await adminDb().collection(CAMPAIGNS_COL).doc(id).update({
    name,
    system,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${id}`);
  revalidatePath("/");
  revalidatePath("/app/dashboard");
}

export async function updateCampaignImage(campaignId: string, value: string) {
  await requireOwnedCampaign(campaignId);

  const db = adminDb();
  const doc = await db.collection(CAMPAIGNS_COL).doc(campaignId).get();
  const previousImagePath = (doc.data()?.imagePath as string | null) ?? null;
  const { portraitPath } = await handlePortraitUpdate("campaign", campaignId, value, previousImagePath);

  await db.collection(CAMPAIGNS_COL).doc(campaignId).update({
    imagePath: portraitPath,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${campaignId}`);
}

export async function deleteCampaign(id: string) {
  await requireOwnedCampaign(id);
  await adminDb().collection(CAMPAIGNS_COL).doc(id).delete();
  revalidatePath("/");
  revalidatePath("/app/dashboard");
  redirect("/app/dashboard");
}

export async function joinCampaign(campaignId: string, token: string) {
  const user = await requireUser();
  const db = adminDb();

  const campaignDoc = await db.collection(CAMPAIGNS_COL).doc(campaignId).get();
  if (!campaignDoc.exists) throw new Error("Campaign not found");

  const campaign = toCampaign(campaignDoc);
  if (campaign.invite_token !== token) throw new Error("Invalid invite token");

  // Check if this user already has a player record in this campaign
  const existing = await db
    .collection(PLAYERS_COL)
    .where("campaignId", "==", campaignId)
    .where("playerUserId", "==", user.uid)
    .limit(1)
    .get();

  if (!existing.empty) {
    // Already joined — just redirect
    redirect(`/player/campaigns/${campaignId}`);
  }

  const now = FieldValue.serverTimestamp();

  // Create a player record for this user
  await db.collection(PLAYERS_COL).add({
    campaignId,
    userId: campaign.user_id,
    name: user.email ?? "Player",
    portraitPath: null,
    portraitUrl: null,
    playerUserId: user.uid,
    playerEmail: user.email ?? null,
    characters: [],
    createdAt: now,
    updatedAt: now,
  });

  // Add user to campaign's playerUserIds
  await db.collection(CAMPAIGNS_COL).doc(campaignId).update({
    playerUserIds: FieldValue.arrayUnion(user.uid),
    updatedAt: now,
  });

  revalidatePath(`/player/campaigns/${campaignId}`);
  redirect(`/player/campaigns/${campaignId}`);
}
