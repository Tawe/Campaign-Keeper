"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedCampaign, requireUser } from "@/lib/auth/actions";
import { CAMPAIGN_LOCATIONS_COL, LOCATIONS_COL } from "@/lib/firebase/db";
import { handlePortraitUpdate } from "@/lib/storage/s3";
import {
  assertMaxLength,
  MAX_NAME_LENGTH,
  MAX_SHORT_TEXT_LENGTH,
  MAX_LONG_TEXT_LENGTH,
} from "@/lib/validation";

export async function createLocation(campaignId: string, name: string) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Location name is required.");
  assertMaxLength(trimmed, MAX_NAME_LENGTH, "Location name");

  const nameLower = trimmed.toLowerCase();
  const db = adminDb();
  const now = FieldValue.serverTimestamp();

  // Create in global library
  const locRef = await db.collection(LOCATIONS_COL).add({
    userId: user.uid,
    name: trimmed,
    nameLower,
    imagePath: null,
    parentLocationId: null,
    terrain: [],
    createdAt: now,
    updatedAt: now,
  });

  // Link to campaign — deterministic ID prevents duplicate links
  await db.collection(CAMPAIGN_LOCATIONS_COL).doc(`${campaignId}_${locRef.id}`).set({
    campaignId,
    locationId: locRef.id,
    userId: user.uid,
    name: trimmed,
    nameLower,
    parentLocationId: null,
    publicInfo: null,
    privateNotes: null,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath(`/campaigns/${campaignId}/locations`);
  revalidatePath(`/app/locations`);
  return locRef.id;
}

export async function linkLocationToCampaign(campaignId: string, locationId: string) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const db = adminDb();
  const locDoc = await db.collection(LOCATIONS_COL).doc(locationId).get();
  if (!locDoc.exists || locDoc.data()?.userId !== user.uid) {
    throw new Error("Location not found.");
  }

  const loc = locDoc.data()!;
  const linkRef = db.collection(CAMPAIGN_LOCATIONS_COL).doc(`${campaignId}_${locationId}`);
  const existing = await linkRef.get();
  if (!existing.exists) {
    await linkRef.set({
      campaignId,
      locationId,
      userId: user.uid,
      name: loc.name,
      nameLower: loc.nameLower,
      publicInfo: null,
      privateNotes: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  revalidatePath(`/campaigns/${campaignId}/locations`);
  revalidatePath(`/app/locations`);
  return locationId;
}

export async function updateLocationInfo(
  locationId: string,
  campaignId: string,
  field: "publicInfo" | "privateNotes" | "imageUrl" | "terrain",
  value: string,
) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);
  const db = adminDb();

  if (field === "terrain") {
    const tags = value.split(",").map((s) => s.trim()).filter(Boolean);
    tags.forEach((t) => assertMaxLength(t, MAX_SHORT_TEXT_LENGTH, "Terrain tag"));
    const locDoc = await db.collection(LOCATIONS_COL).doc(locationId).get();
    if (!locDoc.exists || locDoc.data()?.userId !== user.uid) throw new Error("Location not found.");
    await db.collection(LOCATIONS_COL).doc(locationId).update({
      terrain: tags,
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath(`/campaigns/${campaignId}/locations/${locationId}`);
    revalidatePath(`/campaigns/${campaignId}/locations`);
    return;
  }

  if (field === "imageUrl") {
    const locDoc = await db.collection(LOCATIONS_COL).doc(locationId).get();
    if (!locDoc.exists || locDoc.data()?.userId !== user.uid) throw new Error("Location not found.");
    const previousImagePath = (locDoc.data()?.imagePath as string | null) ?? null;
    const { portraitPath } = await handlePortraitUpdate("location", locationId, value, previousImagePath);
    await db.collection(LOCATIONS_COL).doc(locationId).update({
      imagePath: portraitPath,
      updatedAt: FieldValue.serverTimestamp(),
    });
    revalidatePath(`/campaigns/${campaignId}/locations/${locationId}`);
    revalidatePath(`/campaigns/${campaignId}/locations`);
    return;
  }

  // Validate length for publicInfo / privateNotes
  const trimmed = value.trim();
  if (trimmed) assertMaxLength(trimmed, MAX_LONG_TEXT_LENGTH, field === "publicInfo" ? "Public info" : "Private notes");

  // Try deterministic ID first (new docs); fall back to compound query for legacy session-seeded docs
  const linkRef = db.collection(CAMPAIGN_LOCATIONS_COL).doc(`${campaignId}_${locationId}`);
  let linkDoc = await linkRef.get();
  if (!linkDoc.exists) {
    const snap = await db
      .collection(CAMPAIGN_LOCATIONS_COL)
      .where("campaignId", "==", campaignId)
      .where("locationId", "==", locationId)
      .where("userId", "==", user.uid)
      .limit(1)
      .get();
    if (snap.empty) throw new Error("Location is not linked to this campaign.");
    linkDoc = snap.docs[0];
  }
  if (linkDoc.data()?.campaignId !== campaignId) throw new Error("Campaign mismatch.");

  await linkDoc.ref.update({
    [field]: trimmed || null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${campaignId}/locations/${locationId}`);
  revalidatePath(`/campaigns/${campaignId}/locations`);
}

export async function updateLocationParent(
  locationId: string,
  campaignId: string,
  parentLocationId: string | null,
) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);
  const db = adminDb();

  // Verify ownership
  const locDoc = await db.collection(LOCATIONS_COL).doc(locationId).get();
  if (!locDoc.exists || locDoc.data()?.userId !== user.uid) throw new Error("Location not found.");

  // Update global doc
  await db.collection(LOCATIONS_COL).doc(locationId).update({
    parentLocationId: parentLocationId ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Denormalize into all campaign_locations docs for this location (enables sublocations query)
  const campaignLinksSnap = await db
    .collection(CAMPAIGN_LOCATIONS_COL)
    .where("locationId", "==", locationId)
    .get();
  const batch = db.batch();
  campaignLinksSnap.docs.forEach((doc) => {
    batch.update(doc.ref, { parentLocationId: parentLocationId ?? null });
  });
  await batch.commit();

  revalidatePath(`/campaigns/${campaignId}/locations/${locationId}`);
}
