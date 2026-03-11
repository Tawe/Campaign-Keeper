import type { AttendanceStatus } from "@/types";

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  pending: "No response yet",
  attending: "Attending",
  not_attending: "Can't Make It",
  maybe: "Maybe",
};

function button(href: string, label: string, color: string) {
  return `
    <a href="${href}" style="display:inline-block;padding:12px 24px;background:${color};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px;margin:4px 6px 4px 0;">
      ${label}
    </a>`;
}

function layout(body: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#faf9f5;border-radius:12px;border:1px solid #e2ddd6;overflow:hidden;max-width:100%;">
      <tr><td style="padding:32px 36px;border-bottom:1px solid #e2ddd6;background:#f0ede6;">
        <p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#888;">Campaign Keeper</p>
      </td></tr>
      <tr><td style="padding:32px 36px;">${body}</td></tr>
      <tr><td style="padding:16px 36px;border-top:1px solid #e2ddd6;">
        <p style="margin:0;font-size:12px;color:#aaa;">You received this because you're a player in this campaign.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

export function buildInviteEmail({
  playerName,
  campaignName,
  date,
  time,
  notes,
  rsvpToken,
  appUrl,
}: {
  playerName: string;
  campaignName: string;
  date: string;      // YYYY-MM-DD
  time: string | null;
  notes: string | null;
  rsvpToken: string;
  appUrl: string;
}) {
  const base = `${appUrl}/rsvp/${rsvpToken}`;
  const dateDisplay = formatDateForEmail(date);
  const timeDisplay = time ? formatTimeForEmail(time) : null;

  const body = `
    <h1 style="margin:0 0 4px;font-size:22px;color:#1a1814;">Session scheduled</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#888;">${campaignName}</p>

    <table style="background:#f0ede6;border-radius:8px;padding:16px 20px;margin:0 0 24px;width:100%;box-sizing:border-box;" cellpadding="0" cellspacing="0">
      <tr><td>
        <p style="margin:0;font-size:18px;font-weight:700;color:#1a1814;">${dateDisplay}${timeDisplay ? ` · ${timeDisplay}` : ""}</p>
      </td></tr>
    </table>

    ${notes ? `<p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.6;">${notes.replace(/\n/g, "<br>")}</p>` : ""}

    <p style="margin:0 0 12px;font-size:14px;color:#666;">Hey ${playerName} — are you in?</p>

    <div style="margin:0 0 28px;">
      ${button(`${base}?preselect=attending`, "✓ Attending", "#2d6a4f")}
      ${button(`${base}?preselect=maybe`, "? Maybe", "#b45309")}
      ${button(`${base}?preselect=not_attending`, "✗ Can't Make It", "#9b2335")}
    </div>

    <p style="margin:0;font-size:12px;color:#aaa;">
      You can also <a href="${base}" style="color:#888;">update your response</a> at any time.
    </p>`;

  return {
    subject: `Session scheduled: ${dateDisplay} — ${campaignName}`,
    html: layout(body),
  };
}

export function buildReminderEmail({
  playerName,
  campaignName,
  date,
  time,
  daysUntil,
  currentStatus,
  rsvpToken,
  appUrl,
}: {
  playerName: string;
  campaignName: string;
  date: string;
  time: string | null;
  daysUntil: number;
  currentStatus: AttendanceStatus;
  rsvpToken: string;
  appUrl: string;
}) {
  const base = `${appUrl}/rsvp/${rsvpToken}`;
  const dateDisplay = formatDateForEmail(date);
  const timeDisplay = time ? formatTimeForEmail(time) : null;
  const dayLabel = daysUntil === 1 ? "tomorrow" : `in ${daysUntil} days`;

  const body = `
    <h1 style="margin:0 0 4px;font-size:22px;color:#1a1814;">Session reminder</h1>
    <p style="margin:0 0 20px;font-size:14px;color:#888;">${campaignName}</p>

    <table style="background:#f0ede6;border-radius:8px;padding:16px 20px;margin:0 0 24px;width:100%;box-sizing:border-box;" cellpadding="0" cellspacing="0">
      <tr><td>
        <p style="margin:0;font-size:18px;font-weight:700;color:#1a1814;">${dateDisplay}${timeDisplay ? ` · ${timeDisplay}` : ""}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#666;">That's ${dayLabel}</p>
      </td></tr>
    </table>

    <p style="margin:0 0 16px;font-size:15px;color:#444;">
      Hey ${playerName} — just a reminder about the upcoming session.
      Your current status: <strong>${STATUS_LABELS[currentStatus]}</strong>.
    </p>

    ${button(base, "Update your response →", "#4b3f2f")}`;

  return {
    subject: `Reminder: ${campaignName} session ${dayLabel}`,
    html: layout(body),
  };
}

function formatDateForEmail(date: string): string {
  // date is YYYY-MM-DD; format as "Fri, Jan 17, 2025"
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeForEmail(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}
