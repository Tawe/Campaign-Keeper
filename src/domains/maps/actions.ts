"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedCampaign, requireOwnedDoc, requireUser } from "@/lib/auth/actions";
import {
  CAMPAIGN_MAP_PINS_COL,
  CAMPAIGN_MAPS_COL,
  CAMPAIGN_LOCATIONS_COL,
  LOCATIONS_COL,
  MAP_PINS_COL,
  MAPS_COL,
} from "@/lib/firebase/db";
import { deletePortrait, handlePortraitUpdate } from "@/lib/storage/s3";
import {
  assertMaxLength,
  MAX_LONG_TEXT_LENGTH,
  MAX_NAME_LENGTH,
  MAX_SHORT_TEXT_LENGTH,
} from "@/lib/validation";
import type { MapPinTargetType, Visibility } from "@/types";

function revalidateMapPaths(campaignId: string, mapId?: string, locationId?: string | null) {
  revalidatePath("/app/maps");
  revalidatePath(`/campaigns/${campaignId}/maps`);
  revalidatePath(`/player/campaigns/${campaignId}/maps`);
  if (mapId) {
    revalidatePath(`/app/maps/${mapId}`);
    revalidatePath(`/campaigns/${campaignId}/maps/${mapId}`);
    revalidatePath(`/player/campaigns/${campaignId}/maps/${mapId}`);
  }
  if (locationId) {
    revalidatePath(`/campaigns/${campaignId}/locations/${locationId}`);
    revalidatePath(`/player/campaigns/${campaignId}/locations/${locationId}`);
  }
}

async function syncPinVisibilityAcrossCampaigns(mapId: string, pinId: string, userId: string) {
  const linksSnap = await adminDb().collection(CAMPAIGN_MAPS_COL).where("mapId", "==", mapId).where("userId", "==", userId).get();
  const batch = adminDb().batch();
  linksSnap.docs.forEach((doc) => {
    const campaignId = doc.data().campaignId as string;
    const ref = adminDb().collection(CAMPAIGN_MAP_PINS_COL).doc(`${campaignId}_${pinId}`);
    batch.set(ref, {
      campaignId,
      mapId,
      pinId,
      userId,
      visibility: "private",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();
}

async function assertPinTargetOwned(campaignId: string, userId: string, targetType: MapPinTargetType, targetId: string, mapId?: string) {
  const db = adminDb();
  if (targetType === "location") {
    const [globalLoc, campaignLoc] = await Promise.all([
      db.collection(LOCATIONS_COL).doc(targetId).get(),
      db.collection(CAMPAIGN_LOCATIONS_COL).doc(`${campaignId}_${targetId}`).get(),
    ]);
    if (!globalLoc.exists || globalLoc.data()?.userId !== userId || !campaignLoc.exists) {
      throw new Error("Location target not found.");
    }
    return;
  }

  if (mapId && mapId === targetId) {
    throw new Error("A map pin cannot point to the same map.");
  }

  const [globalMap, campaignMap] = await Promise.all([
    db.collection(MAPS_COL).doc(targetId).get(),
    db.collection(CAMPAIGN_MAPS_COL).doc(`${campaignId}_${targetId}`).get(),
  ]);
  if (!globalMap.exists || globalMap.data()?.userId !== userId || !campaignMap.exists) {
    throw new Error("Map target not found.");
  }
}

export async function createMap(campaignId: string, name: string, locationId?: string | null) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const trimmed = name.trim();
  if (!trimmed) throw new Error("Map name is required.");
  assertMaxLength(trimmed, MAX_NAME_LENGTH, "Map name");

  if (locationId) {
    const locationDoc = await adminDb().collection(LOCATIONS_COL).doc(locationId).get();
    if (!locationDoc.exists || locationDoc.data()?.userId !== user.uid) {
      throw new Error("Linked location not found.");
    }
  }

  const now = FieldValue.serverTimestamp();
  const mapRef = await adminDb().collection(MAPS_COL).add({
    userId: user.uid,
    name: trimmed,
    nameLower: trimmed.toLowerCase(),
    imagePath: null,
    locationId: locationId ?? null,
    width: null,
    height: null,
    createdAt: now,
    updatedAt: now,
  });

  await adminDb().collection(CAMPAIGN_MAPS_COL).doc(`${campaignId}_${mapRef.id}`).set({
    campaignId,
    mapId: mapRef.id,
    userId: user.uid,
    name: trimmed,
    nameLower: trimmed.toLowerCase(),
    locationId: locationId ?? null,
    playerVisible: false,
    createdAt: now,
    updatedAt: now,
  });

  revalidateMapPaths(campaignId, mapRef.id, locationId ?? null);
  return mapRef.id;
}

export async function linkMapToCampaign(campaignId: string, mapId: string) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);
  const db = adminDb();
  const mapDoc = await db.collection(MAPS_COL).doc(mapId).get();
  if (!mapDoc.exists || mapDoc.data()?.userId !== user.uid) {
    throw new Error("Map not found.");
  }

  const data = mapDoc.data()!;
  await db.collection(CAMPAIGN_MAPS_COL).doc(`${campaignId}_${mapId}`).set({
    campaignId,
    mapId,
    userId: user.uid,
    name: data.name,
    nameLower: data.nameLower,
    locationId: data.locationId ?? null,
    playerVisible: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  const pinSnap = await db.collection(MAP_PINS_COL).where("mapId", "==", mapId).get();
  const batch = db.batch();
  pinSnap.docs.forEach((doc) => {
    batch.set(db.collection(CAMPAIGN_MAP_PINS_COL).doc(`${campaignId}_${doc.id}`), {
      campaignId,
      mapId,
      pinId: doc.id,
      userId: user.uid,
      visibility: "private",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();

  revalidateMapPaths(campaignId, mapId, (data.locationId as string | null) ?? null);
}

export async function updateMapImage(mapId: string, campaignId: string, value: string) {
  await requireOwnedCampaign(campaignId);
  const { doc } = await requireOwnedDoc("map", mapId);
  const currentPath = (doc.data()?.imagePath as string | null) ?? null;
  const { portraitPath } = await handlePortraitUpdate("map", mapId, value, currentPath);
  await adminDb().collection(MAPS_COL).doc(mapId).update({
    imagePath: portraitPath,
    updatedAt: FieldValue.serverTimestamp(),
  });
  revalidateMapPaths(campaignId, mapId, (doc.data()?.locationId as string | null) ?? null);
}

export async function updateMapLocation(mapId: string, campaignId: string, locationId: string | null) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  if (locationId) {
    const locationDoc = await adminDb().collection(LOCATIONS_COL).doc(locationId).get();
    if (!locationDoc.exists || locationDoc.data()?.userId !== user.uid) {
      throw new Error("Location not found.");
    }
  }

  await adminDb().collection(MAPS_COL).doc(mapId).update({
    locationId: locationId ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  const linksSnap = await adminDb().collection(CAMPAIGN_MAPS_COL).where("mapId", "==", mapId).where("userId", "==", user.uid).get();
  const batch = adminDb().batch();
  linksSnap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      locationId: locationId ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();

  revalidateMapPaths(campaignId, mapId, locationId);
}

export async function updateCampaignMapVisibility(mapId: string, campaignId: string, visible: boolean) {
  await requireOwnedCampaign(campaignId);
  await requireOwnedDoc("map", mapId);
  await adminDb().collection(CAMPAIGN_MAPS_COL).doc(`${campaignId}_${mapId}`).update({
    playerVisible: visible,
    updatedAt: FieldValue.serverTimestamp(),
  });
  revalidateMapPaths(campaignId, mapId);
}

export async function createMapPin(input: {
  mapId: string;
  campaignId: string;
  label: string;
  x: number;
  y: number;
  targetType: MapPinTargetType;
  targetId: string;
  visibility: Visibility;
}) {
  const user = await requireUser();
  await requireOwnedCampaign(input.campaignId);
  await requireOwnedDoc("map", input.mapId);

  const label = input.label.trim();
  if (!label) throw new Error("Pin label is required.");
  assertMaxLength(label, MAX_NAME_LENGTH, "Pin label");
  if (input.x < 0 || input.x > 1 || input.y < 0 || input.y > 1) {
    throw new Error("Pin coordinates are invalid.");
  }

  await assertPinTargetOwned(input.campaignId, user.uid, input.targetType, input.targetId, input.mapId);

  const pinRef = await adminDb().collection(MAP_PINS_COL).add({
    mapId: input.mapId,
    userId: user.uid,
    label,
    x: input.x,
    y: input.y,
    icon: null,
    color: null,
    targetType: input.targetType,
    targetId: input.targetId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await syncPinVisibilityAcrossCampaigns(input.mapId, pinRef.id, user.uid);
  await updateMapPinVisibility(input.campaignId, pinRef.id, input.visibility);
  revalidateMapPaths(input.campaignId, input.mapId);
}

export async function updateMapPin(input: {
  pinId: string;
  mapId: string;
  campaignId: string;
  label: string;
  targetType: MapPinTargetType;
  targetId: string;
  visibility: Visibility;
}) {
  const user = await requireUser();
  await requireOwnedCampaign(input.campaignId);
  const { doc } = await requireOwnedDoc("map", input.mapId);

  const label = input.label.trim();
  if (!label) throw new Error("Pin label is required.");
  assertMaxLength(label, MAX_NAME_LENGTH, "Pin label");
  await assertPinTargetOwned(input.campaignId, user.uid, input.targetType, input.targetId, input.mapId);

  const pinDoc = await adminDb().collection(MAP_PINS_COL).doc(input.pinId).get();
  if (!pinDoc.exists || pinDoc.data()?.userId !== user.uid || pinDoc.data()?.mapId !== input.mapId) {
    throw new Error("Pin not found.");
  }

  await pinDoc.ref.update({
    label,
    targetType: input.targetType,
    targetId: input.targetId,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await updateMapPinVisibility(input.campaignId, input.pinId, input.visibility);
  revalidateMapPaths(input.campaignId, input.mapId, (doc.data()?.locationId as string | null) ?? null);
}

export async function updateMapPinVisibility(campaignId: string, pinId: string, visibility: Visibility) {
  const { user } = await requireOwnedCampaign(campaignId);
  assertMaxLength(visibility, MAX_SHORT_TEXT_LENGTH, "Visibility");

  const pinDoc = await adminDb().collection(MAP_PINS_COL).doc(pinId).get();
  if (!pinDoc.exists || pinDoc.data()?.userId !== user.uid) {
    throw new Error("Pin not found.");
  }

  await adminDb().collection(CAMPAIGN_MAP_PINS_COL).doc(`${campaignId}_${pinId}`).set({
    campaignId,
    mapId: pinDoc.data()!.mapId,
    pinId,
    userId: user.uid,
    visibility,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  revalidateMapPaths(campaignId, pinDoc.data()!.mapId as string);
}

export async function deleteMapPin(campaignId: string, mapId: string, pinId: string) {
  const { user } = await requireOwnedCampaign(campaignId);
  await requireOwnedDoc("map", mapId);

  const pinDoc = await adminDb().collection(MAP_PINS_COL).doc(pinId).get();
  if (!pinDoc.exists || pinDoc.data()?.userId !== user.uid || pinDoc.data()?.mapId !== mapId) {
    throw new Error("Pin not found.");
  }

  const visibilityDocs = await adminDb().collection(CAMPAIGN_MAP_PINS_COL).where("pinId", "==", pinId).where("userId", "==", user.uid).get();
  const batch = adminDb().batch();
  batch.delete(pinDoc.ref);
  visibilityDocs.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  revalidateMapPaths(campaignId, mapId);
}

export async function deleteMapPermanently(mapId: string) {
  const { user, doc } = await requireOwnedDoc("map", mapId);
  const imagePath = (doc.data()?.imagePath as string | null) ?? null;
  const db = adminDb();
  const [campaignLinks, pins, campaignPinLinks] = await Promise.all([
    db.collection(CAMPAIGN_MAPS_COL).where("mapId", "==", mapId).where("userId", "==", user.uid).get(),
    db.collection(MAP_PINS_COL).where("mapId", "==", mapId).where("userId", "==", user.uid).get(),
    db.collection(CAMPAIGN_MAP_PINS_COL).where("mapId", "==", mapId).where("userId", "==", user.uid).get(),
  ]);

  const batch = db.batch();
  batch.delete(doc.ref);
  campaignLinks.docs.forEach((link) => batch.delete(link.ref));
  pins.docs.forEach((pin) => batch.delete(pin.ref));
  campaignPinLinks.docs.forEach((pin) => batch.delete(pin.ref));
  await batch.commit();
  await deletePortrait(imagePath);
  revalidatePath("/app/maps");
}
