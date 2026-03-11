import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import {
  NPCS_COL,
  CAMPAIGN_NPCS_COL,
  LOCATIONS_COL,
  CAMPAIGN_LOCATIONS_COL,
  LOCATION_VISITS_COL,
} from "@/lib/firebase/db";
import type { NpcMentionInput, CreateSessionInput } from "@/domains/sessions/actions";

export async function findOrCreateNpc(
  db: ReturnType<typeof adminDb>,
  campaignId: string,
  userId: string,
  mention: NpcMentionInput,
  input: CreateSessionInput,
  now: ReturnType<typeof FieldValue.serverTimestamp>,
) {
  const trimmedName = mention.name.trim();
  const nameLower = trimmedName.toLowerCase();
  const sessionStatus =
    input.npcStatuses.find((s) => s.name.trim().toLowerCase() === nameLower)?.statusAtEnd?.trim() || null;
  const sessionLastScene =
    input.startingLocation?.trim() || input.locationsVisited.filter(Boolean)[0] || null;

  const globalNpcSnap = await db
    .collection(NPCS_COL)
    .where("userId", "==", userId)
    .where("nameLower", "==", nameLower)
    .limit(1)
    .get();

  let npcId: string;
  if (!globalNpcSnap.empty) {
    const doc = globalNpcSnap.docs[0];
    npcId = doc.id;
    await doc.ref.update({
      name: trimmedName,
      nameLower,
      updatedAt: now,
    });
  } else {
    const ref = await db.collection(NPCS_COL).add({
      userId,
      name: trimmedName,
      nameLower,
      portraitPath: null,
      portraitUrl: null,
      statsLink: null,
      publicInfo: null,
      privateNotes: null,
      createdAt: now,
      updatedAt: now,
    });
    npcId = ref.id;
  }

  const campaignNpcSnap = await db
    .collection(CAMPAIGN_NPCS_COL)
    .where("campaignId", "==", campaignId)
    .where("npcId", "==", npcId)
    .limit(1)
    .get();

  if (!campaignNpcSnap.empty) {
    const campaignDoc = campaignNpcSnap.docs[0];
    const currentLastSeenDate: string = campaignDoc.data().lastSeenDate ?? "";
    const updatePayload: Record<string, unknown> = {
      name: trimmedName,
      nameLower,
      ...(mention.disposition && { disposition: mention.disposition }),
      updatedAt: now,
    };
    if (input.date >= currentLastSeenDate) {
      updatePayload.lastSeenDate = input.date;
      if (sessionStatus) updatePayload.status = sessionStatus;
      if (sessionLastScene) updatePayload.lastScene = sessionLastScene;
    }
    await campaignDoc.ref.update(updatePayload);
    return { npcId, campaignNpcId: campaignDoc.id, npcName: trimmedName };
  }

  const legacyNpcSnap = await db
    .collection(NPCS_COL)
    .where("campaignId", "==", campaignId)
    .where("nameLower", "==", nameLower)
    .limit(1)
    .get();
  const legacy = !legacyNpcSnap.empty ? legacyNpcSnap.docs[0].data() : null;

  const campaignRef = await db.collection(CAMPAIGN_NPCS_COL).add({
    campaignId,
    npcId,
    userId,
    name: trimmedName,
    nameLower,
    disposition: mention.disposition ?? legacy?.disposition ?? null,
    status: sessionStatus ?? legacy?.status ?? null,
    lastScene: sessionLastScene ?? legacy?.lastScene ?? null,
    lastSeenDate: input.date,
    publicInfo: legacy?.publicInfo ?? null,
    privateNotes: legacy?.privateNotes ?? legacy?.notes ?? null,
    createdAt: now,
    updatedAt: now,
  });

  return { npcId, campaignNpcId: campaignRef.id, npcName: trimmedName };
}

export async function upsertLocations(
  db: ReturnType<typeof adminDb>,
  campaignId: string,
  userId: string,
  sessionId: string,
  locations: string[],
  now: ReturnType<typeof FieldValue.serverTimestamp>,
) {
  for (const name of locations) {
    if (!name.trim()) continue;
    const trimmedName = name.trim();
    const nameLower = trimmedName.toLowerCase();

    const globalLocationSnap = await db
      .collection(LOCATIONS_COL)
      .where("userId", "==", userId)
      .where("nameLower", "==", nameLower)
      .limit(1)
      .get();

    let locationId: string;
    if (!globalLocationSnap.empty) {
      const doc = globalLocationSnap.docs[0];
      locationId = doc.id;
      await doc.ref.update({
        name: trimmedName,
        nameLower,
        updatedAt: now,
      });
    } else {
      const ref = await db.collection(LOCATIONS_COL).add({
        userId,
        name: trimmedName,
        nameLower,
        createdAt: now,
        updatedAt: now,
      });
      locationId = ref.id;
    }

    const campaignLocationSnap = await db
      .collection(CAMPAIGN_LOCATIONS_COL)
      .where("campaignId", "==", campaignId)
      .where("locationId", "==", locationId)
      .limit(1)
      .get();

    let campaignLocationId: string;
    if (!campaignLocationSnap.empty) {
      const doc = campaignLocationSnap.docs[0];
      campaignLocationId = doc.id;
      await doc.ref.update({
        name: trimmedName,
        nameLower,
        updatedAt: now,
      });
    } else {
      const legacyLocationSnap = await db
        .collection(LOCATIONS_COL)
        .where("campaignId", "==", campaignId)
        .where("nameLower", "==", nameLower)
        .limit(1)
        .get();
      const legacy = !legacyLocationSnap.empty ? legacyLocationSnap.docs[0].data() : null;
      const ref = await db.collection(CAMPAIGN_LOCATIONS_COL).add({
        campaignId,
        locationId,
        userId,
        name: trimmedName,
        nameLower,
        publicInfo: legacy?.publicInfo ?? null,
        privateNotes: legacy?.privateNotes ?? null,
        createdAt: now,
        updatedAt: now,
      });
      campaignLocationId = ref.id;
    }

    await db.collection(LOCATION_VISITS_COL).add({
      campaignLocationId,
      locationId,
      sessionId,
      campaignId,
      userId,
      locationName: trimmedName,
      createdAt: now,
    });
  }
}
