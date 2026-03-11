import { adminDb } from "@/lib/firebase/admin";
import { toThread, toSession } from "@/lib/firebase/converters";
import { THREADS_COL, SESSIONS_COL } from "@/lib/firebase/db";
import type { Thread, Session } from "@/types";

export async function getThread(threadId: string): Promise<{
  thread: Thread;
  originSession: Session | null;
} | null> {
  const db = adminDb();
  const threadDoc = await db.collection(THREADS_COL).doc(threadId).get();
  if (!threadDoc.exists) return null;

  const thread = toThread(threadDoc);
  const originSessionDoc = await db.collection(SESSIONS_COL).doc(thread.session_id).get();
  const originSession = originSessionDoc.exists ? toSession(originSessionDoc) : null;

  return { thread, originSession };
}

export async function getCampaignThreads(campaignId: string): Promise<Thread[]> {
  const db = adminDb();
  const snap = await db
    .collection(THREADS_COL)
    .where("campaignId", "==", campaignId)
    .orderBy("createdAt", "asc")
    .get();
  return snap.docs.map(toThread);
}
