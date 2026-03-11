"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireOwnedCampaign } from "@/lib/auth/actions";
import { SCHEDULED_SESSIONS_COL, ATTENDANCE_COL, CAMPAIGNS_COL, PLAYERS_COL } from "@/lib/firebase/db";
import { sendEmail } from "@/lib/email/resend";
import { buildInviteEmail } from "@/lib/email/templates";

export interface CreateScheduledSessionInput {
  campaignId: string;
  date: string;         // YYYY-MM-DD
  time: string;         // HH:MM or ""
  title: string;
  notes: string;
}

export async function createScheduledSession(input: CreateScheduledSessionInput) {
  const { user } = await requireOwnedCampaign(input.campaignId);
  const now = FieldValue.serverTimestamp();
  const ref = adminDb().collection(SCHEDULED_SESSIONS_COL).doc();

  await ref.set({
    campaignId: input.campaignId,
    userId: user.uid,
    date: input.date,
    time: input.time.trim() || null,
    title: input.title.trim() || null,
    notes: input.notes.trim() || null,
    status: "upcoming",
    inviteEmailSentAt: null,
    reminderEmailSentAt: null,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath(`/campaigns/${input.campaignId}/schedule`);
  redirect(`/campaigns/${input.campaignId}/schedule`);
}

export async function cancelScheduledSession(sessionId: string, campaignId: string) {
  await requireOwnedCampaign(campaignId);
  await adminDb().collection(SCHEDULED_SESSIONS_COL).doc(sessionId).update({
    status: "cancelled",
    updatedAt: FieldValue.serverTimestamp(),
  });
  revalidatePath(`/campaigns/${campaignId}/schedule`);
}

export async function sendInviteEmails(scheduledSessionId: string, campaignId: string) {
  await requireOwnedCampaign(campaignId);
  const db = adminDb();

  // Load session + campaign
  const [sessionDoc, campaignDoc] = await Promise.all([
    db.collection(SCHEDULED_SESSIONS_COL).doc(scheduledSessionId).get(),
    db.collection(CAMPAIGNS_COL).doc(campaignId).get(),
  ]);

  if (!sessionDoc.exists) throw new Error("Session not found.");
  const session = sessionDoc.data()!;
  const campaign = campaignDoc.data()!;

  // Load all players with an email
  const playersSnap = await db
    .collection(PLAYERS_COL)
    .where("campaignId", "==", campaignId)
    .get();

  const eligiblePlayers = playersSnap.docs
    .map((d) => ({ id: d.id, name: d.data().name as string, email: d.data().playerEmail as string | null }))
    .filter((p): p is { id: string; name: string; email: string } => !!p.email);

  if (eligiblePlayers.length === 0) {
    throw new Error("No players have email addresses set.");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const now = FieldValue.serverTimestamp();
  const batch = db.batch();
  const emailPromises: Promise<void>[] = [];

  for (const player of eligiblePlayers) {
    // Check if attendance record already exists for this player + session
    const existingSnap = await db
      .collection(ATTENDANCE_COL)
      .where("scheduledSessionId", "==", scheduledSessionId)
      .where("playerId", "==", player.id)
      .limit(1)
      .get();

    let rsvpToken: string;

    if (existingSnap.empty) {
      rsvpToken = randomUUID();
      const attendanceRef = db.collection(ATTENDANCE_COL).doc();
      batch.set(attendanceRef, {
        scheduledSessionId,
        campaignId,
        userId: session.userId,
        playerId: player.id,
        playerName: player.name,
        playerEmail: player.email,
        rsvpToken,
        status: "pending",
        message: null,
        respondedAt: null,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      rsvpToken = existingSnap.docs[0].data().rsvpToken as string;
    }

    const { subject, html } = buildInviteEmail({
      playerName: player.name,
      campaignName: campaign.name as string,
      date: session.date as string,
      time: (session.time as string | null) ?? null,
      notes: (session.notes as string | null) ?? null,
      rsvpToken,
      appUrl,
    });

    emailPromises.push(sendEmail({ to: player.email, subject, html }));
  }

  await batch.commit();
  await Promise.all(emailPromises);

  await db.collection(SCHEDULED_SESSIONS_COL).doc(scheduledSessionId).update({
    inviteEmailSentAt: now,
    updatedAt: now,
  });

  revalidatePath(`/campaigns/${campaignId}/schedule`);
}

export async function updateScheduleSettings(
  campaignId: string,
  scheduleCadence: string,
  reminderDaysBefore: string
) {
  await requireOwnedCampaign(campaignId);
  const days = reminderDaysBefore.trim() ? parseInt(reminderDaysBefore, 10) : null;

  await adminDb()
    .collection(CAMPAIGNS_COL)
    .doc(campaignId)
    .update({
      scheduleCadence: scheduleCadence.trim() || null,
      reminderDaysBefore: typeof days === "number" && !isNaN(days) && days > 0 ? days : null,
      updatedAt: FieldValue.serverTimestamp(),
    });

  revalidatePath(`/campaigns/${campaignId}/schedule`);
}
