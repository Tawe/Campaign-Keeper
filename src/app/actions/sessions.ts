"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { requireOwnedCampaign, requireOwnedDoc, requireUser } from "@/app/actions/_auth";
import { adminDb } from "@/lib/firebase/admin";
import {
  SESSIONS_COL,
  THREADS_COL,
  NPCS_COL,
  NPC_MENTIONS_COL,
  LOCATIONS_COL,
  LOCATION_VISITS_COL,
} from "@/lib/firebase/db";
import type { NpcDisposition, Visibility, CombatDifficulty } from "@/types";

export interface NpcMentionInput {
  name: string;
  disposition: NpcDisposition | null;
  npcNote: string | null;
  visibility: Visibility;
  mentionNote: string | null;
}

export interface ThreadInput {
  text: string;
  visibility: Visibility;
}

export interface DmReflectionInput {
  plotAdvancement: boolean | null;
  keyEvents: string[];
  mostEngaged: string[];
  leastEngaged: string[];
  memorableMoments: string[];
  combatDifficulty: CombatDifficulty | null;
  combatBalanceIssues: string;
  pacing: string;
  whereSlowedDown: string;
  nextSessionPrep: string;
  personalReflection: string;
}

export interface CreateSessionInput {
  campaignId: string;
  date: string;
  title: string | null;
  publicHighlights: string[];
  privateNotes: string;
  tags: string[];
  startingLocation: string | null;
  timePassed: string | null;
  characters: { name: string; statusAtEnd: string }[];
  npcStatuses: { name: string; statusAtEnd: string }[];
  loot: string[];
  locationsVisited: string[];
  dmReflection: DmReflectionInput;
  threads: ThreadInput[];
  npcMentions: NpcMentionInput[];
}

function createShareToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function createSession(input: CreateSessionInput) {
  const user = await requireUser();
  await requireOwnedCampaign(input.campaignId);
  const db = adminDb();
  const now = FieldValue.serverTimestamp();

  // 1. Create session document
  const sessionRef = await db.collection(SESSIONS_COL).add({
    campaignId: input.campaignId,
    userId: user.uid,
    shareToken: createShareToken(),
    date: input.date,
    title: input.title,
    publicHighlights: input.publicHighlights.filter(Boolean),
    privateNotes: input.privateNotes,
    tags: input.tags,
    startingLocation: input.startingLocation || null,
    timePassed: input.timePassed || null,
    characters: input.characters.filter((c) => c.name.trim()),
    npcStatuses: input.npcStatuses.filter((n) => n.name.trim()),
    loot: input.loot,
    locationsVisited: input.locationsVisited.filter(Boolean),
    dmReflection: {
      plotAdvancement: input.dmReflection.plotAdvancement,
      keyEvents: input.dmReflection.keyEvents.filter(Boolean),
      mostEngaged: input.dmReflection.mostEngaged.filter(Boolean),
      leastEngaged: input.dmReflection.leastEngaged.filter(Boolean),
      memorableMoments: input.dmReflection.memorableMoments.filter(Boolean),
      combatDifficulty: input.dmReflection.combatDifficulty,
      combatBalanceIssues: input.dmReflection.combatBalanceIssues,
      pacing: input.dmReflection.pacing,
      whereSlowedDown: input.dmReflection.whereSlowedDown,
      nextSessionPrep: input.dmReflection.nextSessionPrep,
      personalReflection: input.dmReflection.personalReflection,
    },
    createdAt: now,
    updatedAt: now,
  });

  // 2. Batch-write threads
  const validThreads = input.threads.filter((t) => t.text.trim());
  if (validThreads.length > 0) {
    const batch = db.batch();
    validThreads.forEach((t) => {
      const ref = db.collection(THREADS_COL).doc();
      batch.set(ref, {
        campaignId: input.campaignId,
        sessionId: sessionRef.id,
        userId: user.uid,
        text: t.text.trim(),
        visibility: t.visibility,
        status: "open",
        resolvedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    });
    await batch.commit();
  }

  // 3. Upsert NPCs and write mentions
  for (const mention of input.npcMentions) {
    if (!mention.name.trim()) continue;

    const nameLower = mention.name.trim().toLowerCase();

    // Derive status and last scene for this NPC from this session
    const sessionStatus =
      input.npcStatuses.find((s) => s.name.trim().toLowerCase() === nameLower)?.statusAtEnd?.trim() || null;
    const sessionLastScene =
      input.startingLocation?.trim() || input.locationsVisited.filter(Boolean)[0] || null;

    // Look for existing NPC in this campaign (case-insensitive)
    const existingSnap = await db
      .collection(NPCS_COL)
      .where("campaignId", "==", input.campaignId)
      .where("nameLower", "==", nameLower)
      .limit(1)
      .get();

    let npcId: string;

    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      npcId = existingDoc.id;
      const currentLastSeenDate: string = existingDoc.data().lastSeenDate ?? "";
      const updatePayload: Record<string, unknown> = {
        ...(mention.disposition && { disposition: mention.disposition }),
        updatedAt: now,
      };
      // Only update status/lastScene if this session is the most recent for this NPC
      if (input.date >= currentLastSeenDate) {
        updatePayload.lastSeenDate = input.date;
        if (sessionStatus) updatePayload.status = sessionStatus;
        if (sessionLastScene) updatePayload.lastScene = sessionLastScene;
      }
      await existingDoc.ref.update(updatePayload);
    } else {
      // Create new NPC
      const npcRef = await db.collection(NPCS_COL).add({
        campaignId: input.campaignId,
        userId: user.uid,
        name: mention.name.trim(),
        nameLower,
        disposition: mention.disposition,
        portraitPath: null,
        portraitUrl: null,
        statsLink: null,
        status: sessionStatus,
        lastScene: sessionLastScene,
        lastSeenDate: input.date,
        publicInfo: null,
        privateNotes: null,
        createdAt: now,
        updatedAt: now,
      });
      npcId = npcRef.id;
    }

    // Upsert mention (check if this npc+session combo already exists)
    const mentionSnap = await db
      .collection(NPC_MENTIONS_COL)
      .where("npcId", "==", npcId)
      .where("sessionId", "==", sessionRef.id)
      .limit(1)
      .get();

    const mentionData = {
      npcId,
      sessionId: sessionRef.id,
      campaignId: input.campaignId,
      userId: user.uid,
      visibility: mention.visibility,
      note: mention.mentionNote || null,
      npcName: mention.name.trim(),
      npcDisposition: mention.disposition,
      createdAt: now,
    };

    if (!mentionSnap.empty) {
      await mentionSnap.docs[0].ref.set(mentionData, { merge: true });
    } else {
      await db.collection(NPC_MENTIONS_COL).add(mentionData);
    }
  }

  // 4. Upsert locations and write visits
  await upsertLocations(db, input.campaignId, user.uid, sessionRef.id, input.locationsVisited, now);

  revalidatePath(`/campaigns/${input.campaignId}`);
  redirect(`/campaigns/${input.campaignId}/sessions/${sessionRef.id}`);
}

export async function updateSession(sessionId: string, input: CreateSessionInput) {
  const { user } = await requireOwnedDoc("session", sessionId);
  await requireOwnedCampaign(input.campaignId);
  const db = adminDb();
  const now = FieldValue.serverTimestamp();

  // Verify ownership
  const sessionDoc = await db.collection(SESSIONS_COL).doc(sessionId).get();
  if (!sessionDoc.exists || sessionDoc.data()?.userId !== user.uid) {
    throw new Error("Session not found.");
  }
  if ((sessionDoc.data()?.campaignId as string) !== input.campaignId) {
    throw new Error("Session does not belong to that campaign.");
  }

  // 1. Update session document
  await db.collection(SESSIONS_COL).doc(sessionId).update({
    date: input.date,
    title: input.title,
    publicHighlights: input.publicHighlights.filter(Boolean),
    privateNotes: input.privateNotes,
    tags: input.tags,
    startingLocation: input.startingLocation || null,
    timePassed: input.timePassed || null,
    characters: input.characters.filter((c) => c.name.trim()),
    npcStatuses: input.npcStatuses.filter((n) => n.name.trim()),
    loot: input.loot,
    locationsVisited: input.locationsVisited.filter(Boolean),
    dmReflection: {
      plotAdvancement: input.dmReflection.plotAdvancement,
      keyEvents: input.dmReflection.keyEvents.filter(Boolean),
      mostEngaged: input.dmReflection.mostEngaged.filter(Boolean),
      leastEngaged: input.dmReflection.leastEngaged.filter(Boolean),
      memorableMoments: input.dmReflection.memorableMoments.filter(Boolean),
      combatDifficulty: input.dmReflection.combatDifficulty,
      combatBalanceIssues: input.dmReflection.combatBalanceIssues,
      pacing: input.dmReflection.pacing,
      whereSlowedDown: input.dmReflection.whereSlowedDown,
      nextSessionPrep: input.dmReflection.nextSessionPrep,
      personalReflection: input.dmReflection.personalReflection,
    },
    updatedAt: now,
  });

  // 2. Replace threads: delete existing, write new
  const existingThreadsSnap = await db
    .collection(THREADS_COL)
    .where("sessionId", "==", sessionId)
    .get();
  const batch = db.batch();
  existingThreadsSnap.docs.forEach((doc) => batch.delete(doc.ref));
  input.threads.filter((t) => t.text.trim()).forEach((t) => {
    const ref = db.collection(THREADS_COL).doc();
    batch.set(ref, {
      campaignId: input.campaignId,
      sessionId,
      userId: user.uid,
      text: t.text.trim(),
      visibility: t.visibility,
      status: "open",
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  });
  await batch.commit();

  // 3. Replace NPC mentions: delete existing, upsert NPCs and write new mentions
  const existingMentionsSnap = await db
    .collection(NPC_MENTIONS_COL)
    .where("sessionId", "==", sessionId)
    .get();
  const mentionBatch = db.batch();
  existingMentionsSnap.docs.forEach((doc) => mentionBatch.delete(doc.ref));
  await mentionBatch.commit();

  for (const mention of input.npcMentions) {
    if (!mention.name.trim()) continue;
    const nameLower = mention.name.trim().toLowerCase();

    const sessionStatus =
      input.npcStatuses.find((s) => s.name.trim().toLowerCase() === nameLower)?.statusAtEnd?.trim() || null;
    const sessionLastScene =
      input.startingLocation?.trim() || input.locationsVisited.filter(Boolean)[0] || null;

    const existingSnap = await db
      .collection(NPCS_COL)
      .where("campaignId", "==", input.campaignId)
      .where("nameLower", "==", nameLower)
      .limit(1)
      .get();

    let npcId: string;
    if (!existingSnap.empty) {
      const existingDoc = existingSnap.docs[0];
      npcId = existingDoc.id;
      const currentLastSeenDate: string = existingDoc.data().lastSeenDate ?? "";
      const updatePayload: Record<string, unknown> = {
        ...(mention.disposition && { disposition: mention.disposition }),
        updatedAt: now,
      };
      if (input.date >= currentLastSeenDate) {
        updatePayload.lastSeenDate = input.date;
        if (sessionStatus) updatePayload.status = sessionStatus;
        if (sessionLastScene) updatePayload.lastScene = sessionLastScene;
      }
      await existingDoc.ref.update(updatePayload);
    } else {
      const npcRef = await db.collection(NPCS_COL).add({
        campaignId: input.campaignId,
        userId: user.uid,
        name: mention.name.trim(),
        nameLower,
        disposition: mention.disposition,
        portraitPath: null,
        portraitUrl: null,
        statsLink: null,
        status: sessionStatus,
        lastScene: sessionLastScene,
        lastSeenDate: input.date,
        publicInfo: null,
        privateNotes: null,
        createdAt: now,
        updatedAt: now,
      });
      npcId = npcRef.id;
    }

    await db.collection(NPC_MENTIONS_COL).add({
      npcId,
      sessionId,
      campaignId: input.campaignId,
      userId: user.uid,
      visibility: mention.visibility,
      note: mention.mentionNote || null,
      npcName: mention.name.trim(),
      npcDisposition: mention.disposition,
      createdAt: now,
    });
  }

  // 4. Replace location visits: delete existing, re-upsert locations and write new visits
  const existingVisitsSnap = await db
    .collection(LOCATION_VISITS_COL)
    .where("sessionId", "==", sessionId)
    .get();
  const visitBatch = db.batch();
  existingVisitsSnap.docs.forEach((doc) => visitBatch.delete(doc.ref));
  await visitBatch.commit();

  await upsertLocations(db, input.campaignId, user.uid, sessionId, input.locationsVisited, now);

  revalidatePath(`/campaigns/${input.campaignId}`);
  revalidatePath(`/campaigns/${input.campaignId}/sessions/${sessionId}`);
  redirect(`/campaigns/${input.campaignId}/sessions/${sessionId}`);
}

export async function deleteSession(id: string, campaignId: string) {
  const { doc } = await requireOwnedDoc("session", id);
  const actualCampaignId = (doc.data()?.campaignId as string) || campaignId;
  await adminDb().collection(SESSIONS_COL).doc(id).delete();
  revalidatePath(`/campaigns/${actualCampaignId}`);
  redirect(`/campaigns/${actualCampaignId}`);
}

export async function ensureSessionShareToken(sessionId: string) {
  const { doc } = await requireOwnedDoc("session", sessionId);
  const existingToken = doc.data()?.shareToken as string | undefined;
  if (existingToken) return existingToken;

  const shareToken = createShareToken();
  await doc.ref.update({
    shareToken,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return shareToken;
}

export async function rotateSessionShareToken(sessionId: string) {
  const { doc } = await requireOwnedDoc("session", sessionId);
  const shareToken = createShareToken();
  const campaignId = doc.data()?.campaignId as string;

  await doc.ref.update({
    shareToken,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
  return shareToken;
}

export async function disableSessionShareToken(sessionId: string) {
  const { doc } = await requireOwnedDoc("session", sessionId);
  const campaignId = doc.data()?.campaignId as string;

  await doc.ref.update({
    shareToken: null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${campaignId}/sessions/${sessionId}`);
}

async function upsertLocations(
  db: ReturnType<typeof adminDb>,
  campaignId: string,
  userId: string,
  sessionId: string,
  locations: string[],
  now: ReturnType<typeof FieldValue.serverTimestamp>,
) {
  for (const name of locations) {
    if (!name.trim()) continue;
    const nameLower = name.trim().toLowerCase();

    const existingSnap = await db
      .collection(LOCATIONS_COL)
      .where("campaignId", "==", campaignId)
      .where("nameLower", "==", nameLower)
      .limit(1)
      .get();

    let locationId: string;

    if (!existingSnap.empty) {
      locationId = existingSnap.docs[0].id;
    } else {
      const ref = await db.collection(LOCATIONS_COL).add({
        campaignId,
        userId,
        name: name.trim(),
        nameLower,
        publicInfo: null,
        privateNotes: null,
        createdAt: now,
        updatedAt: now,
      });
      locationId = ref.id;
    }

    await db.collection(LOCATION_VISITS_COL).add({
      locationId,
      sessionId,
      campaignId,
      userId,
      locationName: name.trim(),
      createdAt: now,
    });
  }
}
