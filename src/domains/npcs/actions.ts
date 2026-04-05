"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedCampaign, requireOwnedDoc, requireUser } from "@/lib/auth/actions";
import { CAMPAIGN_NPCS_COL, NPC_MENTIONS_COL, NPCS_COL } from "@/lib/firebase/db";
import { deletePortrait, handleGalleryAdd, handlePortraitUpdate } from "@/lib/storage/s3";
import {
  assertMaxLength,
  assertMaxItems,
  MAX_NAME_LENGTH,
  MAX_SHORT_TEXT_LENGTH,
  MAX_LONG_TEXT_LENGTH,
  MAX_ARRAY_ITEMS,
} from "@/lib/validation";

const MAX_GALLERY_IMAGES = Math.min(MAX_ARRAY_ITEMS, 24);
type GalleryEntry = string | { path: string; caption: string | null };

function normalizeGalleryEntries(value: unknown): GalleryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<GalleryEntry[]>((entries, item) => {
    if (typeof item === "string" && item.trim()) {
      entries.push(item);
      return entries;
    }
    if (!item || typeof item !== "object") return entries;
    const entry = item as { path?: unknown; caption?: unknown };
    if (typeof entry.path !== "string" || !entry.path.trim()) return entries;
    entries.push({
      path: entry.path.trim(),
      caption: typeof entry.caption === "string" && entry.caption.trim() ? entry.caption.trim() : null,
    });
    return entries;
  }, []);
}

export async function createNpc(campaignId: string, name: string) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("NPC name is required.");
  assertMaxLength(trimmed, MAX_NAME_LENGTH, "NPC name");

  const nameLower = trimmed.toLowerCase();
  const db = adminDb();
  const now = FieldValue.serverTimestamp();

  // Create in global library
  const npcRef = await db.collection(NPCS_COL).add({
    userId: user.uid,
    name: trimmed,
    nameLower,
    portraitPath: null,
    galleryPaths: [],
    portraitUrl: null,
    statsLink: null,
    publicInfo: null,
    privateNotes: null,
    notes: null,
    race: null,
    sex: null,
    age: null,
    alignment: null,
    npcClass: [],
    createdAt: now,
    updatedAt: now,
  });

  // Link to campaign — deterministic ID prevents duplicate links
  await db.collection(CAMPAIGN_NPCS_COL).doc(`${campaignId}_${npcRef.id}`).set({
    campaignId,
    npcId: npcRef.id,
    userId: user.uid,
    name: trimmed,
    nameLower,
    disposition: null,
    status: null,
    lastScene: null,
    lastSeenDate: null,
    publicInfo: null,
    privateNotes: null,
    factionNames: [],
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath(`/campaigns/${campaignId}/npcs`);
  revalidatePath(`/app/npcs`);
  return npcRef.id;
}

export async function linkNpcToCampaign(campaignId: string, npcId: string) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const db = adminDb();
  const npcDoc = await db.collection(NPCS_COL).doc(npcId).get();
  if (!npcDoc.exists || npcDoc.data()?.userId !== user.uid) {
    throw new Error("NPC not found.");
  }

  const npc = npcDoc.data()!;
  const linkRef = db.collection(CAMPAIGN_NPCS_COL).doc(`${campaignId}_${npcId}`);
  const existing = await linkRef.get();
  if (!existing.exists) {
    await linkRef.set({
      campaignId,
      npcId,
      userId: user.uid,
      name: npc.name,
      nameLower: npc.nameLower,
      disposition: null,
      status: null,
      lastScene: null,
      lastSeenDate: null,
      publicInfo: null,
      privateNotes: null,
      factionNames: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  revalidatePath(`/campaigns/${campaignId}/npcs`);
  revalidatePath(`/app/npcs`);
  return npcId;
}

export async function updateNpcClasses(
  npcId: string,
  campaignId: string,
  classes: { name: string; level: number }[],
) {
  await requireOwnedCampaign(campaignId);
  await requireOwnedDoc("npc", npcId);
  const db = adminDb();

  await db.collection(NPCS_COL).doc(npcId).update({
    npcClass: classes,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
  revalidatePath(`/campaigns/${campaignId}/npcs`);
}

export async function updateNpcInfo(
  npcId: string,
  campaignId: string,
  field: "publicInfo" | "privateNotes" | "status" | "lastScene" | "statsLink" | "portraitUrl" | "race" | "sex" | "age" | "alignment" | "factionNames",
  value: string,
) {
  await requireOwnedCampaign(campaignId);
  const { user, doc } = await requireOwnedDoc("npc", npcId);
  const db = adminDb();

  if (field === "factionNames") {
    const names = value.split(",").map((s) => s.trim()).filter(Boolean);
    names.forEach((n) => assertMaxLength(n, MAX_NAME_LENGTH, "Faction name"));
    const linkRef = db.collection(CAMPAIGN_NPCS_COL).doc(`${campaignId}_${npcId}`);
    let linkDoc = await linkRef.get();
    if (!linkDoc.exists) {
      const snap = await db
        .collection(CAMPAIGN_NPCS_COL)
        .where("campaignId", "==", campaignId)
        .where("npcId", "==", npcId)
        .where("userId", "==", user.uid)
        .limit(1)
        .get();
      if (snap.empty) throw new Error("NPC is not linked to this campaign.");
      linkDoc = snap.docs[0];
    }
    if (linkDoc.data()?.campaignId !== campaignId) throw new Error("Campaign mismatch.");
    await linkDoc.ref.update({ factionNames: names, updatedAt: FieldValue.serverTimestamp() });
    revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
    revalidatePath(`/campaigns/${campaignId}/npcs`);
    return;
  }

  if (field === "race" || field === "sex" || field === "age" || field === "alignment") {
    const trimmed = value.trim();
    if (trimmed) assertMaxLength(trimmed, MAX_SHORT_TEXT_LENGTH, field);
    await db.collection(NPCS_COL).doc(npcId).update({
      [field]: trimmed || null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
    revalidatePath(`/campaigns/${campaignId}/npcs`);
    return;
  }

  if (field === "publicInfo" || field === "privateNotes" || field === "status" || field === "lastScene") {
    const trimmed = value.trim();
    const isLong = field === "publicInfo" || field === "privateNotes";
    if (trimmed) assertMaxLength(trimmed, isLong ? MAX_LONG_TEXT_LENGTH : MAX_SHORT_TEXT_LENGTH, field);

    // Try deterministic ID first (new docs); fall back to compound query for legacy session-seeded docs
    const linkRef = db.collection(CAMPAIGN_NPCS_COL).doc(`${campaignId}_${npcId}`);
    let linkDoc = await linkRef.get();
    if (!linkDoc.exists) {
      const snap = await db
        .collection(CAMPAIGN_NPCS_COL)
        .where("campaignId", "==", campaignId)
        .where("npcId", "==", npcId)
        .where("userId", "==", user.uid)
        .limit(1)
        .get();
      if (snap.empty) throw new Error("NPC is not linked to this campaign.");
      linkDoc = snap.docs[0];
    }
    if (linkDoc.data()?.campaignId !== campaignId) throw new Error("Campaign mismatch.");

    await linkDoc.ref.update({
      [field]: trimmed || null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
    revalidatePath(`/campaigns/${campaignId}/npcs`);
    return;
  }

  if (field === "portraitUrl") {
    const previousPortraitPath = (doc.data()?.portraitPath as string | null) ?? null;
    const { portraitPath, portraitUrl } = await handlePortraitUpdate("npc", npcId, value, previousPortraitPath);

    await db.collection(NPCS_COL).doc(npcId).update({
      portraitPath,
      portraitUrl,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
    revalidatePath(`/campaigns/${campaignId}/npcs`);
    return;
  }

  await db.collection(NPCS_COL).doc(npcId).update({
    [field]: value.trim() || null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
  revalidatePath(`/campaigns/${campaignId}/npcs`);
}

export async function addNpcGalleryImage(npcId: string, campaignId: string, value: string) {
  await requireOwnedCampaign(campaignId);
  const { doc } = await requireOwnedDoc("npc", npcId);
  const db = adminDb();
  const currentEntries = normalizeGalleryEntries(doc.data()?.galleryPaths);

  assertMaxItems([...currentEntries, "next"], MAX_GALLERY_IMAGES, "NPC gallery");
  const nextPath = await handleGalleryAdd("npc", npcId, value);

  await db.collection(NPCS_COL).doc(npcId).update({
    galleryPaths: [...currentEntries, { path: nextPath, caption: null }],
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
  revalidatePath(`/campaigns/${campaignId}/npcs`);
  revalidatePath(`/app/npcs/${npcId}`);
  revalidatePath(`/app/npcs`);
}

export async function removeNpcGalleryImage(npcId: string, campaignId: string, index: number) {
  await requireOwnedCampaign(campaignId);
  const { doc } = await requireOwnedDoc("npc", npcId);
  const db = adminDb();
  const currentEntries = normalizeGalleryEntries(doc.data()?.galleryPaths);

  if (index < 0 || index >= currentEntries.length) {
    throw new Error("Gallery image not found.");
  }

  const nextEntries = currentEntries.filter((_, currentIndex) => currentIndex !== index);
  const removed = currentEntries[index];
  await db.collection(NPCS_COL).doc(npcId).update({
    galleryPaths: nextEntries,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await deletePortrait(typeof removed === "string" ? removed : removed.path);

  revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
  revalidatePath(`/campaigns/${campaignId}/npcs`);
  revalidatePath(`/app/npcs/${npcId}`);
  revalidatePath(`/app/npcs`);
}

export async function updateNpcGalleryCaption(npcId: string, campaignId: string, index: number, caption: string) {
  await requireOwnedCampaign(campaignId);
  const { doc } = await requireOwnedDoc("npc", npcId);
  const db = adminDb();
  const currentEntries = normalizeGalleryEntries(doc.data()?.galleryPaths);

  if (index < 0 || index >= currentEntries.length) {
    throw new Error("Gallery image not found.");
  }

  const trimmed = caption.trim();
  if (trimmed) assertMaxLength(trimmed, MAX_SHORT_TEXT_LENGTH, "Caption");

  const nextEntries = currentEntries.map((entry, currentIndex) => {
    if (currentIndex !== index) return entry;
    const path = typeof entry === "string" ? entry : entry.path;
    return { path, caption: trimmed || null };
  });

  await db.collection(NPCS_COL).doc(npcId).update({
    galleryPaths: nextEntries,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
  revalidatePath(`/campaigns/${campaignId}/npcs`);
  revalidatePath(`/app/npcs/${npcId}`);
  revalidatePath(`/app/npcs`);
}

export async function removeNpcFromCampaign(npcId: string, campaignId: string) {
  const { user } = await requireOwnedCampaign(campaignId);

  const db = adminDb();
  const linkRef = db.collection(CAMPAIGN_NPCS_COL).doc(`${campaignId}_${npcId}`);
  let linkDoc = await linkRef.get();
  if (!linkDoc.exists) {
    const snap = await db
      .collection(CAMPAIGN_NPCS_COL)
      .where("campaignId", "==", campaignId)
      .where("npcId", "==", npcId)
      .where("userId", "==", user.uid)
      .limit(1)
      .get();
    if (snap.empty) throw new Error("NPC is not linked to this campaign.");
    linkDoc = snap.docs[0];
  }
  if (linkDoc.data()?.campaignId !== campaignId) throw new Error("Campaign mismatch.");
  await linkDoc.ref.delete();

  revalidatePath(`/campaigns/${campaignId}/npcs`);
  revalidatePath(`/app/npcs`);
}

export async function deleteNpcPermanently(npcId: string) {
  const { doc } = await requireOwnedDoc("npc", npcId);
  const portraitPath = (doc.data()?.portraitPath as string | null) ?? null;
  const galleryPaths = normalizeGalleryEntries(doc.data()?.galleryPaths)
    .map((entry) => typeof entry === "string" ? entry : entry.path);

  const db = adminDb();
  const batch = db.batch();

  batch.delete(db.collection(NPCS_COL).doc(npcId));

  const campaignLinks = await db.collection(CAMPAIGN_NPCS_COL).where("npcId", "==", npcId).get();
  campaignLinks.docs.forEach((d) => batch.delete(d.ref));

  const mentions = await db.collection(NPC_MENTIONS_COL).where("npcId", "==", npcId).get();
  mentions.docs.forEach((d) => batch.delete(d.ref));

  await batch.commit();
  await deletePortrait(portraitPath);
  await Promise.all(galleryPaths.map((path) => deletePortrait(path)));

  revalidatePath(`/app/npcs`);
}
