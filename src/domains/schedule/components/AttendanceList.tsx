import type { Attendance, AttendanceStatus } from "@/types";

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; className: string }
> = {
  attending:     { label: "Attending",     className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  maybe:         { label: "Maybe",         className: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  not_attending: { label: "Can't Make It", className: "bg-rose-500/15 text-rose-700 dark:text-rose-400" },
  pending:       { label: "No response",   className: "bg-muted text-muted-foreground" },
};

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

export function AttendanceSummary({ attendance }: { attendance: Attendance[] }) {
  const counts = {
    attending:     attendance.filter((a) => a.status === "attending").length,
    maybe:         attendance.filter((a) => a.status === "maybe").length,
    not_attending: attendance.filter((a) => a.status === "not_attending").length,
    pending:       attendance.filter((a) => a.status === "pending").length,
  };

  return (
    <div className="flex flex-wrap gap-2 text-sm">
      {counts.attending > 0 && (
        <span className="text-emerald-700 dark:text-emerald-400 font-medium">✓ {counts.attending}</span>
      )}
      {counts.maybe > 0 && (
        <span className="text-amber-700 dark:text-amber-400 font-medium">? {counts.maybe}</span>
      )}
      {counts.not_attending > 0 && (
        <span className="text-rose-700 dark:text-rose-400 font-medium">✗ {counts.not_attending}</span>
      )}
      {counts.pending > 0 && (
        <span className="text-muted-foreground">• {counts.pending} pending</span>
      )}
      {attendance.length === 0 && (
        <span className="text-muted-foreground text-xs">No invites sent yet</span>
      )}
    </div>
  );
}

export function AttendanceList({ attendance }: { attendance: Attendance[] }) {
  if (attendance.length === 0) return null;

  const order: AttendanceStatus[] = ["attending", "maybe", "not_attending", "pending"];
  const sorted = [...attendance].sort(
    (a, b) => order.indexOf(a.status) - order.indexOf(b.status)
  );

  return (
    <div className="divide-y divide-border/50">
      {sorted.map((a) => (
        <div key={a.id} className="flex items-start gap-3 py-2.5">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{a.player_name}</p>
            {a.message && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{a.message}</p>
            )}
          </div>
          <AttendanceBadge status={a.status} />
        </div>
      ))}
    </div>
  );
}
