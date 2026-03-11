import { notFound } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { SCHEDULED_SESSIONS_COL, CAMPAIGNS_COL } from "@/lib/firebase/db";
import { getAttendanceByToken } from "@/domains/schedule/queries";
import { RsvpForm } from "./RsvpForm";

function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

function formatTime(time: string): string {
  const [h, min] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(min).padStart(2, "0")} ${ampm}`;
}

export default async function RsvpPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ preselect?: string }>;
}) {
  const [{ token }, { preselect }] = await Promise.all([params, searchParams]);

  const attendance = await getAttendanceByToken(token);
  if (!attendance) notFound();

  const db = adminDb();
  const [sessionDoc, campaignDoc] = await Promise.all([
    db.collection(SCHEDULED_SESSIONS_COL).doc(attendance.scheduled_session_id).get(),
    db.collection(CAMPAIGNS_COL).doc(attendance.campaign_id).get(),
  ]);

  if (!sessionDoc.exists || !campaignDoc.exists) notFound();

  const session = sessionDoc.data()!;
  const campaign = campaignDoc.data()!;

  const validStatuses = ["attending", "maybe", "not_attending"] as const;
  type ValidStatus = typeof validStatuses[number];
  const initialStatus: ValidStatus | undefined =
    preselect && validStatuses.includes(preselect as ValidStatus)
      ? (preselect as ValidStatus)
      : attendance.status !== "pending"
        ? (attendance.status as ValidStatus)
        : undefined;

  return (
    <div className="min-h-screen bg-[#f5f4f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-[#e2ddd6] bg-[#faf9f5] overflow-hidden shadow-sm">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[#e2ddd6] bg-[#f0ede6]">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              {campaign.name as string}
            </p>
            <h1 className="font-serif text-2xl text-foreground">
              {formatDate(session.date as string)}
            </h1>
            {session.time && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatTime(session.time as string)}
              </p>
            )}
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="px-6 py-4 border-b border-[#e2ddd6]">
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {session.notes as string}
              </p>
            </div>
          )}

          {/* RSVP form */}
          <div className="px-6 py-5">
            <p className="text-sm text-muted-foreground mb-4">
              Hey <strong className="text-foreground">{attendance.player_name}</strong>, are you in?
            </p>
            <RsvpForm
              token={token}
              initialStatus={initialStatus}
              initialMessage={attendance.message ?? ""}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
