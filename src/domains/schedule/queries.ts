import { cache } from "react";
import { adminDb } from "@/lib/firebase/admin";
import { SCHEDULED_SESSIONS_COL, ATTENDANCE_COL } from "@/lib/firebase/db";
import { toScheduledSession, toAttendance } from "@/lib/firebase/converters";
import type { Attendance, ScheduledSession, ScheduledSessionWithAttendance } from "@/types";

export const getScheduledSessions = cache(async (campaignId: string): Promise<ScheduledSession[]> => {
  const snap = await adminDb()
    .collection(SCHEDULED_SESSIONS_COL)
    .where("campaignId", "==", campaignId)
    .orderBy("date", "asc")
    .get();
  return snap.docs.map(toScheduledSession);
});

export const getScheduledSessionsWithAttendance = cache(
  async (campaignId: string): Promise<ScheduledSessionWithAttendance[]> => {
    const sessions = await getScheduledSessions(campaignId);
    if (sessions.length === 0) return [];

    const sessionIds = sessions.map((s) => s.id);

    // Firestore `in` queries support max 30 items; chunk if needed
    const chunks: string[][] = [];
    for (let i = 0; i < sessionIds.length; i += 30) {
      chunks.push(sessionIds.slice(i, i + 30));
    }

    const allAttendance: Attendance[] = [];
    for (const chunk of chunks) {
      const snap = await adminDb()
        .collection(ATTENDANCE_COL)
        .where("scheduledSessionId", "in", chunk)
        .get();
      allAttendance.push(...snap.docs.map(toAttendance));
    }

    const bySession = new Map<string, Attendance[]>();
    for (const a of allAttendance) {
      const arr = bySession.get(a.scheduled_session_id) ?? [];
      arr.push(a);
      bySession.set(a.scheduled_session_id, arr);
    }

    return sessions.map((s) => ({
      ...s,
      attendance: bySession.get(s.id) ?? [],
    }));
  }
);

export async function getAttendanceByToken(token: string): Promise<Attendance | null> {
  const snap = await adminDb()
    .collection(ATTENDANCE_COL)
    .where("rsvpToken", "==", token)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return toAttendance(snap.docs[0]);
}

export async function getScheduledSessionById(id: string): Promise<ScheduledSession | null> {
  const doc = await adminDb().collection(SCHEDULED_SESSIONS_COL).doc(id).get();
  if (!doc.exists) return null;
  return toScheduledSession(doc);
}
