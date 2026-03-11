import { adminDb } from "@/lib/firebase/admin";
import { POLL_RESPONSES_COL } from "@/lib/firebase/db";
import type { PollResponse } from "@/types";

export async function getSessionPollResponses(sessionId: string): Promise<PollResponse[]> {
  const db = adminDb();
  const snap = await db
    .collection(POLL_RESPONSES_COL)
    .where("sessionId", "==", sessionId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((doc) => {
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
}
