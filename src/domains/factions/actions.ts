"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedCampaign, requireOwnedDoc, requireUser } from "@/lib/auth/actions";
import { CAMPAIGN_FACTIONS_COL, FACTIONS_COL } from "@/lib/firebase/db";
import {
  assertMaxLength,
  assertMaxItems,
  MAX_NAME_LENGTH,
  MAX_SHORT_TEXT_LENGTH,
  MAX_LONG_TEXT_LENGTH,
  MAX_ARRAY_ITEMS,
} from "@/lib/validation";

export async function createFaction(campaignId: string, name: string) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Faction name is required.");
  assertMaxLength(trimmed, MAX_NAME_LENGTH, "Faction name");

  const nameLower = trimmed.toLowerCase();
  const db = adminDb();
  const now = FieldValue.serverTimestamp();

  // Create in global library — intrinsic/historical fields only
  const factionRef = await db.collection(FACTIONS_COL).add({
    userId: user.uid,
    name: trimmed,
    nameLower,
    factionType: null,
    alignment: null,
    founded: null,
    publicInfo: null,
    privateNotes: null,
    createdAt: now,
    updatedAt: now,
  });

  // Link to campaign — deterministic ID prevents duplicate links; dynamic fields are campaign-scoped
  await db.collection(CAMPAIGN_FACTIONS_COL).doc(`${campaignId}_${factionRef.id}`).set({
    campaignId,
    factionId: factionRef.id,
    userId: user.uid,
    name: trimmed,
    nameLower,
    status: null,
    influence: null,
    disbanded: null,
    memberCount: null,
    homeBase: null,
    leaderNames: [],
    allegiances: [],
    enemies: [],
    publicInfo: null,
    privateNotes: null,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath(`/campaigns/${campaignId}/factions`);
  revalidatePath(`/app/factions`);
  return factionRef.id;
}

export async function linkFactionToCampaign(campaignId: string, factionId: string) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const db = adminDb();
  const factionDoc = await db.collection(FACTIONS_COL).doc(factionId).get();
  if (!factionDoc.exists || factionDoc.data()?.userId !== user.uid) {
    throw new Error("Faction not found.");
  }

  const faction = factionDoc.data()!;
  const linkRef = db.collection(CAMPAIGN_FACTIONS_COL).doc(`${campaignId}_${factionId}`);
  const existing = await linkRef.get();
  if (!existing.exists) {
    await linkRef.set({
      campaignId,
      factionId,
      userId: user.uid,
      name: faction.name,
      nameLower: faction.nameLower,
      status: null,
      influence: null,
      disbanded: null,
      memberCount: null,
      homeBase: null,
      leaderNames: [],
      allegiances: [],
      enemies: [],
      publicInfo: null,
      privateNotes: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  revalidatePath(`/campaigns/${campaignId}/factions`);
  revalidatePath(`/app/factions`);
  return factionId;
}

// Fields that are intrinsic/historical — stored on the global factions doc
const GLOBAL_STRING_FIELDS = ["factionType", "alignment", "founded"] as const;
// Fields that are dynamic/timeline-specific — stored on campaign_factions doc
const CAMPAIGN_STRING_FIELDS = ["status", "influence", "disbanded", "memberCount", "homeBase"] as const;
const CAMPAIGN_ARRAY_FIELDS = ["leaderNames", "allegiances", "enemies"] as const;

type GlobalStringField = typeof GLOBAL_STRING_FIELDS[number];
type CampaignStringField = typeof CAMPAIGN_STRING_FIELDS[number];
type CampaignArrayField = typeof CAMPAIGN_ARRAY_FIELDS[number];

export async function updateFactionInfo(
  factionId: string,
  campaignId: string,
  field: "publicInfo" | "privateNotes" | GlobalStringField | CampaignStringField | CampaignArrayField,
  value: string,
) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);
  const db = adminDb();

  // Intrinsic fields — write to global factions doc
  if ((GLOBAL_STRING_FIELDS as readonly string[]).includes(field)) {
    const trimmed = value.trim();
    if (trimmed) assertMaxLength(trimmed, MAX_SHORT_TEXT_LENGTH, field);
    const factionDoc = await db.collection(FACTIONS_COL).doc(factionId).get();
    if (!factionDoc.exists || factionDoc.data()?.userId !== user.uid) throw new Error("Faction not found.");
    await db.collection(FACTIONS_COL).doc(factionId).update({
      [field]: trimmed || null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath(`/campaigns/${campaignId}/factions/${factionId}`);
    revalidatePath(`/campaigns/${campaignId}/factions`);
    return;
  }

  // Campaign-specific string fields — write to campaign_factions doc
  if ((CAMPAIGN_STRING_FIELDS as readonly string[]).includes(field)) {
    const trimmed = value.trim();
    if (trimmed) assertMaxLength(trimmed, MAX_SHORT_TEXT_LENGTH, field);
    const linkRef = db.collection(CAMPAIGN_FACTIONS_COL).doc(`${campaignId}_${factionId}`);
    const linkDoc = await linkRef.get();
    if (!linkDoc.exists || linkDoc.data()?.userId !== user.uid) throw new Error("Faction is not linked to this campaign.");
    await linkDoc.ref.update({ [field]: trimmed || null, updatedAt: FieldValue.serverTimestamp() });
    revalidatePath(`/campaigns/${campaignId}/factions/${factionId}`);
    revalidatePath(`/campaigns/${campaignId}/factions`);
    return;
  }

  // Campaign-specific array fields — split comma-separated, write to campaign_factions doc
  if ((CAMPAIGN_ARRAY_FIELDS as readonly string[]).includes(field)) {
    const items = value.split(",").map((s) => s.trim()).filter(Boolean);
    assertMaxItems(items, MAX_ARRAY_ITEMS, field);
    items.forEach((item) => assertMaxLength(item, MAX_NAME_LENGTH, field));
    const linkRef = db.collection(CAMPAIGN_FACTIONS_COL).doc(`${campaignId}_${factionId}`);
    const linkDoc = await linkRef.get();
    if (!linkDoc.exists || linkDoc.data()?.userId !== user.uid) throw new Error("Faction is not linked to this campaign.");
    await linkDoc.ref.update({ [field]: items, updatedAt: FieldValue.serverTimestamp() });
    revalidatePath(`/campaigns/${campaignId}/factions/${factionId}`);
    revalidatePath(`/campaigns/${campaignId}/factions`);
    return;
  }

  // publicInfo / privateNotes — validate length and write to campaign_factions doc
  const trimmed = value.trim();
  if (trimmed) assertMaxLength(trimmed, MAX_LONG_TEXT_LENGTH, field === "publicInfo" ? "Public info" : "Private notes");

  // Try deterministic ID first (new docs); fall back to compound query for legacy session-seeded docs
  const linkRef = db.collection(CAMPAIGN_FACTIONS_COL).doc(`${campaignId}_${factionId}`);
  let linkDoc = await linkRef.get();
  if (!linkDoc.exists) {
    const snap = await db
      .collection(CAMPAIGN_FACTIONS_COL)
      .where("campaignId", "==", campaignId)
      .where("factionId", "==", factionId)
      .where("userId", "==", user.uid)
      .limit(1)
      .get();
    if (snap.empty) throw new Error("Faction is not linked to this campaign.");
    linkDoc = snap.docs[0];
  }
  if (linkDoc.data()?.campaignId !== campaignId) throw new Error("Campaign mismatch.");

  await linkDoc.ref.update({
    [field]: trimmed || null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${campaignId}/factions/${factionId}`);
  revalidatePath(`/campaigns/${campaignId}/factions`);
}

export async function removeFactionFromCampaign(factionId: string, campaignId: string) {
  const { user } = await requireOwnedCampaign(campaignId);

  const db = adminDb();
  const linkRef = db.collection(CAMPAIGN_FACTIONS_COL).doc(`${campaignId}_${factionId}`);
  let linkDoc = await linkRef.get();
  if (!linkDoc.exists) {
    const snap = await db
      .collection(CAMPAIGN_FACTIONS_COL)
      .where("campaignId", "==", campaignId)
      .where("factionId", "==", factionId)
      .where("userId", "==", user.uid)
      .limit(1)
      .get();
    if (snap.empty) throw new Error("Faction is not linked to this campaign.");
    linkDoc = snap.docs[0];
  }
  if (linkDoc.data()?.campaignId !== campaignId) throw new Error("Campaign mismatch.");
  await linkDoc.ref.delete();

  revalidatePath(`/campaigns/${campaignId}/factions`);
  revalidatePath(`/app/factions`);
}

export async function deleteFactionPermanently(factionId: string) {
  await requireOwnedDoc("faction", factionId);

  const db = adminDb();
  const batch = db.batch();

  batch.delete(db.collection(FACTIONS_COL).doc(factionId));

  const campaignLinks = await db.collection(CAMPAIGN_FACTIONS_COL).where("factionId", "==", factionId).get();
  campaignLinks.docs.forEach((d) => batch.delete(d.ref));

  await batch.commit();

  revalidatePath(`/app/factions`);
}
