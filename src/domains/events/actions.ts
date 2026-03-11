"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedCampaign, requireUser } from "@/lib/auth/actions";
import { CAMPAIGN_EVENTS_COL, EVENTS_COL } from "@/lib/firebase/db";
import { deletePortrait, handlePortraitUpdate } from "@/lib/storage/s3";
import {
  assertMaxLength,
  assertMaxItems,
  MAX_NAME_LENGTH,
  MAX_SHORT_TEXT_LENGTH,
  MAX_LONG_TEXT_LENGTH,
  MAX_ARRAY_ITEMS,
} from "@/lib/validation";

export async function createEvent(campaignId: string, title: string) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const trimmed = title.trim();
  if (!trimmed) throw new Error("Event title is required.");
  assertMaxLength(trimmed, MAX_NAME_LENGTH, "Event title");

  const db = adminDb();
  const now = FieldValue.serverTimestamp();

  // Create global event doc
  const eventRef = await db.collection(EVENTS_COL).add({
    userId: user.uid,
    title: trimmed,
    titleLower: trimmed.toLowerCase(),
    eventType: null,
    startDate: null,
    endDate: null,
    description: "",
    privateNotes: "",
    createdAt: now,
    updatedAt: now,
  });

  // Link to campaign with deterministic ID
  await db.collection(CAMPAIGN_EVENTS_COL).doc(`${campaignId}_${eventRef.id}`).set({
    campaignId,
    eventId: eventRef.id,
    userId: user.uid,
    title: trimmed,
    titleLower: trimmed.toLowerCase(),
    npcIds: [],
    locationId: null,
    factionIds: [],
    playerIds: [],
    sessionIds: [],
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath(`/campaigns/${campaignId}/events`);
  return eventRef.id;
}

export async function linkEventToCampaign(campaignId: string, eventId: string) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const db = adminDb();
  const globalDoc = await db.collection(EVENTS_COL).doc(eventId).get();
  if (!globalDoc.exists || globalDoc.data()?.userId !== user.uid) {
    throw new Error("Event not found.");
  }

  const event = globalDoc.data()!;
  const linkRef = db.collection(CAMPAIGN_EVENTS_COL).doc(`${campaignId}_${eventId}`);
  const existing = await linkRef.get();
  if (!existing.exists) {
    await linkRef.set({
      campaignId,
      eventId,
      userId: user.uid,
      title: event.title,
      titleLower: event.titleLower,
      npcIds: [],
      locationId: null,
      factionIds: [],
      playerIds: [],
      sessionIds: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  revalidatePath(`/campaigns/${campaignId}/events`);
  return eventId;
}

const GLOBAL_STRING_FIELDS = ["title", "eventType", "description", "privateNotes"] as const;
type GlobalStringField = typeof GLOBAL_STRING_FIELDS[number];

export async function updateEventField(
  eventId: string,
  campaignId: string,
  field: GlobalStringField,
  value: string,
) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const db = adminDb();
  const globalDoc = await db.collection(EVENTS_COL).doc(eventId).get();
  if (!globalDoc.exists || globalDoc.data()?.userId !== user.uid) {
    throw new Error("Event not found.");
  }

  const updateData: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (field === "title") {
    const trimmed = value.trim();
    if (!trimmed) throw new Error("Title is required.");
    assertMaxLength(trimmed, MAX_NAME_LENGTH, "Title");
    updateData.title = trimmed;
    updateData.titleLower = trimmed.toLowerCase();
    // Also update denormalized title in campaign_events doc
    await db.collection(CAMPAIGN_EVENTS_COL).doc(`${campaignId}_${eventId}`).update({
      title: trimmed,
      titleLower: trimmed.toLowerCase(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else if (field === "eventType") {
    const trimmed = value.trim();
    if (trimmed) assertMaxLength(trimmed, MAX_SHORT_TEXT_LENGTH, "Event type");
    updateData.eventType = trimmed || null;
  } else {
    const trimmed = value.trim();
    if (trimmed) assertMaxLength(trimmed, MAX_LONG_TEXT_LENGTH, field === "description" ? "Description" : "DM notes");
    updateData[field] = trimmed || "";
  }

  await db.collection(EVENTS_COL).doc(eventId).update(updateData);

  revalidatePath(`/campaigns/${campaignId}/events`);
  revalidatePath(`/campaigns/${campaignId}/events/${eventId}`);
}

export async function updateEventDates(
  eventId: string,
  campaignId: string,
  field: "startDate" | "endDate",
  date: { year: number; month: number; day: number } | null,
) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const db = adminDb();
  const globalDoc = await db.collection(EVENTS_COL).doc(eventId).get();
  if (!globalDoc.exists || globalDoc.data()?.userId !== user.uid) {
    throw new Error("Event not found.");
  }

  await db.collection(EVENTS_COL).doc(eventId).update({
    [field]: date ?? null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${campaignId}/events`);
  revalidatePath(`/campaigns/${campaignId}/events/${eventId}`);
  revalidatePath(`/campaigns/${campaignId}/calendar`);
}

export async function updateEventAssociations(
  eventId: string,
  campaignId: string,
  assoc: {
    npcIds?: string[];
    locationId?: string | null;
    factionIds?: string[];
    playerIds?: string[];
    sessionIds?: string[];
  },
) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  if (assoc.npcIds !== undefined) assertMaxItems(assoc.npcIds, MAX_ARRAY_ITEMS, "NPCs");
  if (assoc.factionIds !== undefined) assertMaxItems(assoc.factionIds, MAX_ARRAY_ITEMS, "Factions");
  if (assoc.playerIds !== undefined) assertMaxItems(assoc.playerIds, MAX_ARRAY_ITEMS, "Players");
  if (assoc.sessionIds !== undefined) assertMaxItems(assoc.sessionIds, MAX_ARRAY_ITEMS, "Sessions");

  const db = adminDb();
  const linkRef = db.collection(CAMPAIGN_EVENTS_COL).doc(`${campaignId}_${eventId}`);
  const linkDoc = await linkRef.get();
  if (!linkDoc.exists || linkDoc.data()?.userId !== user.uid) {
    throw new Error("Event not linked to this campaign.");
  }

  const update: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (assoc.npcIds !== undefined) update.npcIds = assoc.npcIds;
  if (assoc.locationId !== undefined) update.locationId = assoc.locationId;
  if (assoc.factionIds !== undefined) update.factionIds = assoc.factionIds;
  if (assoc.playerIds !== undefined) update.playerIds = assoc.playerIds;
  if (assoc.sessionIds !== undefined) update.sessionIds = assoc.sessionIds;

  await linkDoc.ref.update(update);

  revalidatePath(`/campaigns/${campaignId}/events/${eventId}`);
  revalidatePath(`/campaigns/${campaignId}/calendar`);
}

export async function updateEventImage(
  eventId: string,
  campaignId: string,
  value: string,
) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const db = adminDb();
  const globalDoc = await db.collection(EVENTS_COL).doc(eventId).get();
  if (!globalDoc.exists || globalDoc.data()?.userId !== user.uid) {
    throw new Error("Event not found.");
  }

  const previousImagePath = (globalDoc.data()?.imagePath as string | null) ?? null;
  const { portraitPath } = await handlePortraitUpdate("event", eventId, value, previousImagePath);

  await db.collection(EVENTS_COL).doc(eventId).update({
    imagePath: portraitPath,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${campaignId}/events/${eventId}`);
  revalidatePath(`/campaigns/${campaignId}/events`);
}

export async function deleteEvent(eventId: string, campaignId: string) {
  const user = await requireUser();
  await requireOwnedCampaign(campaignId);

  const db = adminDb();
  const globalDoc = await db.collection(EVENTS_COL).doc(eventId).get();
  if (!globalDoc.exists || globalDoc.data()?.userId !== user.uid) {
    throw new Error("Event not found.");
  }
  const imagePath = (globalDoc.data()?.imagePath as string | null) ?? null;

  const batch = db.batch();
  batch.delete(db.collection(EVENTS_COL).doc(eventId));

  const campaignLinks = await db.collection(CAMPAIGN_EVENTS_COL).where("eventId", "==", eventId).get();
  campaignLinks.docs.forEach((d) => batch.delete(d.ref));

  await batch.commit();
  await deletePortrait(imagePath);

  revalidatePath(`/campaigns/${campaignId}/events`);
  revalidatePath(`/campaigns/${campaignId}/calendar`);
}
