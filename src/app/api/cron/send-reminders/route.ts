import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { SCHEDULED_SESSIONS_COL, ATTENDANCE_COL, CAMPAIGNS_COL } from "@/lib/firebase/db";
import { toAttendance } from "@/lib/firebase/converters";
import { sendEmail } from "@/lib/email/resend";
import { buildReminderEmail } from "@/lib/email/templates";

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return new NextResponse("Cron not configured", { status: 500 });
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const db = adminDb();
  const today = new Date().toISOString().slice(0, 10);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Get all campaigns with a reminder window set
  const campaignsSnap = await db
    .collection(CAMPAIGNS_COL)
    .where("reminderDaysBefore", "!=", null)
    .get();

  let emailsSent = 0;
  let errors = 0;

  for (const campaignDoc of campaignsSnap.docs) {
    const reminderDays = campaignDoc.data().reminderDaysBefore as number;
    const campaignName = campaignDoc.data().name as string;

    // Deadline = today + reminderDays
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + reminderDays);
    const deadlineStr = deadline.toISOString().slice(0, 10);

    // Find upcoming sessions within the reminder window that haven't been reminded
    const sessionsSnap = await db
      .collection(SCHEDULED_SESSIONS_COL)
      .where("campaignId", "==", campaignDoc.id)
      .where("status", "==", "upcoming")
      .where("reminderEmailSentAt", "==", null)
      .where("date", ">=", today)
      .where("date", "<=", deadlineStr)
      .get();

    for (const sessionDoc of sessionsSnap.docs) {
      const session = sessionDoc.data();

      // Get attendance records that haven't confirmed
      const attendanceSnap = await db
        .collection(ATTENDANCE_COL)
        .where("scheduledSessionId", "==", sessionDoc.id)
        .get();

      const nonConfirmed = attendanceSnap.docs
        .map(toAttendance)
        .filter((a) => a.status !== "attending");

      const daysUntil = Math.round(
        (new Date(session.date as string).getTime() - new Date(today).getTime()) / 86_400_000
      );

      const emailPromises = nonConfirmed.map(async (a) => {
        const { subject, html } = buildReminderEmail({
          playerName: a.player_name,
          campaignName,
          date: session.date as string,
          time: (session.time as string | null) ?? null,
          daysUntil,
          currentStatus: a.status,
          rsvpToken: a.rsvp_token,
          appUrl,
        });
        try {
          await sendEmail({ to: a.player_email, subject, html });
          emailsSent++;
        } catch {
          errors++;
        }
      });

      await Promise.all(emailPromises);

      await sessionDoc.ref.update({
        reminderEmailSentAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  return NextResponse.json({ emailsSent, errors });
}
