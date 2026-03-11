"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { requireOwnedCampaign, requireOwnedDoc, requireUser } from "@/lib/auth/actions";
import { adminDb } from "@/lib/firebase/admin";
import {
  SESSIONS_COL,
  THREADS_COL,
  NPC_MENTIONS_COL,
  LOCATION_VISITS_COL,
} from "@/lib/firebase/db";
import { findOrCreateNpc, upsertLocations } from "@/lib/services/session-sync";
import type { InGameDate, NpcDisposition, Visibility, CombatDifficulty } from "@/types";
import {
  assertMaxLength,
  assertMaxItems,
  MAX_NAME_LENGTH,
  MAX_LONG_TEXT_LENGTH,
  MAX_ARRAY_ITEMS,
  MAX_TAG_ITEMS,
} from "@/lib/validation";

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
  inGameDate: InGameDate | null;
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

function validateSessionInput(input: CreateSessionInput) {
  if (input.title) assertMaxLength(input.title, MAX_NAME_LENGTH, "Session title");
  assertMaxLength(input.privateNotes, MAX_LONG_TEXT_LENGTH, "Private notes");
  assertMaxItems(input.tags, MAX_TAG_ITEMS, "Tags");
  assertMaxItems(input.publicHighlights, MAX_ARRAY_ITEMS, "Highlights");
  assertMaxItems(input.threads, MAX_ARRAY_ITEMS, "Threads");
  assertMaxItems(input.npcMentions, MAX_ARRAY_ITEMS, "NPC mentions");
  assertMaxItems(input.locationsVisited, MAX_ARRAY_ITEMS, "Locations visited");
  assertMaxItems(input.characters, MAX_ARRAY_ITEMS, "Characters");
  assertMaxItems(input.loot, MAX_ARRAY_ITEMS, "Loot");
  input.threads.forEach((t) => assertMaxLength(t.text, MAX_LONG_TEXT_LENGTH, "Thread text"));
}

export async function createSession(input: CreateSessionInput) {
  const user = await requireUser();
  await requireOwnedCampaign(input.campaignId);
  validateSessionInput(input);
  const db = adminDb();
  const now = FieldValue.serverTimestamp();

  // 1. Create session document
  const sessionRef = await db.collection(SESSIONS_COL).add({
    campaignId: input.campaignId,
    userId: user.uid,
    shareToken: createShareToken(),
    date: input.date,
    inGameDate: input.inGameDate ?? null,
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

    const { npcId, campaignNpcId, npcName } = await findOrCreateNpc(
      db,
      input.campaignId,
      user.uid,
      mention,
      input,
      now
    );

    const mentionData = {
      campaignNpcId,
      npcId,
      sessionId: sessionRef.id,
      campaignId: input.campaignId,
      userId: user.uid,
      visibility: mention.visibility,
      note: mention.mentionNote || null,
      npcName,
      npcDisposition: mention.disposition,
      createdAt: now,
    };
    await db.collection(NPC_MENTIONS_COL).add(mentionData);
  }

  // 4. Upsert locations and write visits
  await upsertLocations(db, input.campaignId, user.uid, sessionRef.id, input.locationsVisited, now);

  revalidatePath(`/campaigns/${input.campaignId}`);
  redirect(`/campaigns/${input.campaignId}/sessions/${sessionRef.id}`);
}

export async function updateSession(sessionId: string, input: CreateSessionInput) {
  const { user } = await requireOwnedDoc("session", sessionId);
  await requireOwnedCampaign(input.campaignId);
  validateSessionInput(input);
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
    inGameDate: input.inGameDate ?? null,
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
    const { npcId, campaignNpcId, npcName } = await findOrCreateNpc(
      db,
      input.campaignId,
      user.uid,
      mention,
      input,
      now
    );

    await db.collection(NPC_MENTIONS_COL).add({
      campaignNpcId,
      npcId,
      sessionId,
      campaignId: input.campaignId,
      userId: user.uid,
      visibility: mention.visibility,
      note: mention.mentionNote || null,
      npcName,
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
