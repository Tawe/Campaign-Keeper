"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, MailCheck, X, ChevronDown, ChevronUp } from "lucide-react";
import { cancelScheduledSession, sendInviteEmails } from "@/domains/schedule/actions";
import { AttendanceList, AttendanceSummary } from "./AttendanceList";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ScheduledSessionWithAttendance } from "@/types";

function formatDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function formatTime(time: string): string {
  const [h, min] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(min).padStart(2, "0")} ${ampm}`;
}

interface Props {
  session: ScheduledSessionWithAttendance;
  campaignId: string;
}

export function ScheduledSessionCard({ session, campaignId }: Props) {
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const isPast = session.date < new Date().toISOString().slice(0, 10);
  const isCancelled = session.status === "cancelled";

  async function handleSendInvites() {
    setSending(true);
    try {
      await sendInviteEmails(session.id, campaignId);
      toast.success("Invites sent!");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to send invites");
    } finally {
      setSending(false);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    try {
      await cancelScheduledSession(session.id, campaignId);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to cancel");
      setCancelling(false);
    }
  }

  return (
    <div className={`paper-panel overflow-hidden ${isCancelled ? "opacity-60" : ""}`}>
      <div className="px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-serif text-lg text-foreground">
                {formatDate(session.date)}
                {session.time && (
                  <span className="text-muted-foreground"> · {formatTime(session.time)}</span>
                )}
              </p>
              {isCancelled && (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Cancelled
                </span>
              )}
              {isPast && !isCancelled && (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Past
                </span>
              )}
            </div>
            {session.title && (
              <p className="mt-0.5 text-sm text-muted-foreground">{session.title}</p>
            )}
            <div className="mt-2">
              <AttendanceSummary attendance={session.attendance} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isCancelled && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendInvites}
                  disabled={sending}
                  title={session.invite_email_sent_at ? "Resend invites" : "Send invites"}
                >
                  {session.invite_email_sent_at
                    ? <><MailCheck className="h-4 w-4 mr-1.5" /> Resend</>
                    : <><Mail className="h-4 w-4 mr-1.5" /> Send Invites</>
                  }
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Cancel session" disabled={cancelling}>
                      <X className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this session?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The session on {formatDate(session.date)} will be marked as cancelled.
                        Attendance records are kept.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel} disabled={cancelling} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {cancelling ? "Cancelling…" : "Cancel session"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {session.attendance.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpanded((v) => !v)}
                title={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {expanded && session.attendance.length > 0 && (
        <div className="border-t border-border/50 px-5 pb-2 sm:px-6">
          <AttendanceList attendance={session.attendance} />
        </div>
      )}
    </div>
  );
}
