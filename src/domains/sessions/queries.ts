import { cache } from "react";
import { adminDb } from "@/lib/firebase/admin";
import { toSession, toThread } from "@/lib/firebase/converters";
import {
  NPC_MENTIONS_COL,
  POLL_RESPONSES_COL,
  SESSIONS_COL,
  THREADS_COL,
} from "@/lib/firebase/db";
import type { NpcMentionWithNpc, Npc, PollResponse, Session, Thread } from "@/types";

export const getCampaignSessions = cache(async (campaignId: string): Promise<Session[]> => {
  const db = adminDb();
  const snap = await db
    .collection(SESSIONS_COL)
    .where("campaignId", "==", campaignId)
    .orderBy("date", "desc")
    .get();
  return snap.docs.map(toSession);
});

export async function getSession(sessionId: string): Promise<Session | null> {
  const db = adminDb();
  const doc = await db.collection(SESSIONS_COL).doc(sessionId).get();
  if (!doc.exists) return null;
  return toSession(doc);
}

export async function getSessionWithDetails(sessionId: string, campaignId: string) {
  const db = adminDb();

  const [sessionDoc, threadsSnap, mentionsSnap, pollSnap] = await Promise.all([
    db.collection(SESSIONS_COL).doc(sessionId).get(),
    db.collection(THREADS_COL).where("sessionId", "==", sessionId).orderBy("createdAt").get(),
    db.collection(NPC_MENTIONS_COL).where("sessionId", "==", sessionId).get(),
    db.collection(POLL_RESPONSES_COL).where("sessionId", "==", sessionId).orderBy("createdAt", "desc").get(),
  ]);

  if (!sessionDoc.exists) return null;
  const session = toSession(sessionDoc);
  if (session.campaign_id !== campaignId) return null;

  const threads: Thread[] = threadsSnap.docs.map(toThread);

  const mentions: NpcMentionWithNpc[] = mentionsSnap.docs.map((doc) => {
    const d = doc.data();
    const fakeNpc: Npc = {
      id: d.npcId,
      campaign_id: campaignId,
      name: d.npcName,
      disposition: d.npcDisposition ?? null,
      portrait_url: null,
      stats_link: null,
      status: null,
      last_scene: null,
      public_info: null,
      private_notes: null,
      race: null,
      sex: null,
      age: null,
      alignment: null,
      npc_class: [],
      faction_names: [],
      created_at: "",
      updated_at: "",
    };
    return {
      id: doc.id,
      npc_id: d.npcId,
      session_id: sessionId,
      visibility: d.visibility,
      note: d.note ?? null,
      created_at: d.createdAt?.toDate?.()?.toISOString() ?? "",
      npc: fakeNpc,
    };
  });

  const pollResponses: PollResponse[] = pollSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      session_id: d.sessionId,
      campaign_id: d.campaignId,
      player_name: d.playerName ?? null,
      enjoyment: d.enjoyment,
      liked: d.liked ?? "",
      improve: d.improve ?? "",
      looking_forward: d.lookingForward ?? "",
      created_at: d.createdAt?.toDate?.()?.toISOString() ?? "",
    };
  });

  return { session, threads, mentions, pollResponses };
}

export async function getPublicSession(shareToken: string) {
  const db = adminDb();

  const sessionSnap = await db
    .collection(SESSIONS_COL)
    .where("shareToken", "==", shareToken)
    .limit(1)
    .get();

  if (sessionSnap.empty) return null;

  const sessionDoc = sessionSnap.docs[0];
  const session = toSession(sessionDoc);
  const sessionId = session.id;

  const [threadsSnap, mentionsSnap] = await Promise.all([
    db.collection(THREADS_COL)
      .where("sessionId", "==", sessionId)
      .where("visibility", "==", "public")
      .get(),
    db.collection(NPC_MENTIONS_COL)
      .where("sessionId", "==", sessionId)
      .where("visibility", "==", "public")
      .get(),
  ]);

  const threads: Thread[] = threadsSnap.docs.map(toThread);

  const mentions: NpcMentionWithNpc[] = mentionsSnap.docs.map((doc) => {
    const d = doc.data();
    const fakeNpc: Npc = {
      id: d.npcId,
      campaign_id: session.campaign_id,
      name: d.npcName,
      disposition: d.npcDisposition ?? null,
      portrait_url: null,
      stats_link: null,
      status: null,
      last_scene: null,
      public_info: null,
      private_notes: null,
      race: null,
      sex: null,
      age: null,
      alignment: null,
      npc_class: [],
      faction_names: [],
      created_at: "",
      updated_at: "",
    };
    return {
      id: doc.id,
      npc_id: d.npcId,
      session_id: sessionId,
      visibility: "public" as const,
      note: d.note ?? null,
      created_at: "",
      npc: fakeNpc,
    };
  });

  return { session, threads, mentions };
}
