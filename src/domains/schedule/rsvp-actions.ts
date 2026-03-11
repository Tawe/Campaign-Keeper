"use server";

import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { ATTENDANCE_COL } from "@/lib/firebase/db";
import type { AttendanceStatus } from "@/types";

export async function respondToRsvp(
  token: string,
  status: AttendanceStatus,
  message: string
) {
  const db = adminDb();
  const snap = await db
    .collection(ATTENDANCE_COL)
    .where("rsvpToken", "==", token)
    .limit(1)
    .get();

  if (snap.empty) throw new Error("Invalid RSVP link.");

  const doc = snap.docs[0];
  const campaignId = doc.data().campaignId as string;

  await doc.ref.update({
    status,
    message: message.trim() || null,
    respondedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  revalidatePath(`/campaigns/${campaignId}/schedule`);
}
