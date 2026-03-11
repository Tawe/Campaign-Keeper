import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignCalendar } from "@/domains/calendars/queries";
import { getCampaignSessions } from "@/domains/sessions/queries";
import { getCampaignEvents } from "@/domains/events/queries";
import type { Session, CampaignEvent } from "@/types";

export default async function PlayerCalendarPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [calendar, sessions, events] = await Promise.all([
    getCampaignCalendar(campaignId),
    getCampaignSessions(campaignId),
    getCampaignEvents(campaignId),
  ]);

  if (!calendar) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No calendar has been set up for this campaign yet.
      </p>
    );
  }

  const datedSessions = sessions.filter((s) => s.in_game_date !== null);
  const undatedSessions = sessions.filter((s) => s.in_game_date === null);
  const datedEvents = events.filter((e) => e.start_date !== null);
  const undatedEvents = events.filter((e) => e.start_date === null);

  // Group: year → month → sessions
  const grouped = new Map<number, Map<number, Session[]>>();
  for (const s of datedSessions) {
    const { year, month } = s.in_game_date!;
    if (!grouped.has(year)) grouped.set(year, new Map());
    const byMonth = grouped.get(year)!;
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(s);
  }

  // Group events: year → month → events
  const groupedEvents = new Map<number, Map<number, CampaignEvent[]>>();
  for (const e of datedEvents) {
    const { year, month } = e.start_date!;
    if (!groupedEvents.has(year)) groupedEvents.set(year, new Map());
    const byMonth = groupedEvents.get(year)!;
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(e);
  }

  const allYears = new Set([...grouped.keys(), ...groupedEvents.keys()]);
  const sortedYears = [...allYears].sort((a, b) => a - b);

  type Entry =
    | { kind: "session"; day: number; session: Session }
    | { kind: "event"; day: number; event: CampaignEvent };

  return (
    <div className="space-y-8">
      <div className="paper-panel px-5 py-4 sm:px-6 space-y-2">
        <p className="ds-section-header">Calendar</p>
        <h2 className="ink-title text-2xl">{calendar.name}</h2>
        {calendar.year_label && (
          <p className="text-sm text-muted-foreground">Year label: {calendar.year_label}</p>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>{calendar.months.length} months</span>
          {calendar.weekdays.length > 0 && (
            <span>{calendar.weekdays.join(", ")}</span>
          )}
        </div>
      </div>

      {sortedYears.length === 0 && undatedSessions.length === 0 && undatedEvents.length === 0 && (
        <div className="paper-panel px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No sessions or events have in-game dates yet.
          </p>
        </div>
      )}

      {sortedYears.map((year) => {
        const byMonth = grouped.get(year) ?? new Map<number, Session[]>();
        const eventsByMonth = groupedEvents.get(year) ?? new Map<number, CampaignEvent[]>();
        const allMonths = new Set([...byMonth.keys(), ...eventsByMonth.keys()]);
        const sortedMonths = [...allMonths].sort((a, b) => a - b);

        return (
          <div key={year} className="space-y-4">
            <h2 className="font-serif text-xl text-foreground">
              {year} {calendar.year_label}
            </h2>
            {sortedMonths.map((monthIdx) => {
              const monthName = calendar.months[monthIdx - 1]?.name ?? `Month ${monthIdx}`;
              const monthSessions = (byMonth.get(monthIdx) ?? []).sort(
                (a, b) => a.in_game_date!.day - b.in_game_date!.day
              );
              const monthEvents = (eventsByMonth.get(monthIdx) ?? []).sort(
                (a, b) => a.start_date!.day - b.start_date!.day
              );

              const entries: Entry[] = [
                ...monthSessions.map((s): Entry => ({ kind: "session", day: s.in_game_date!.day, session: s })),
                ...monthEvents.map((e): Entry => ({ kind: "event", day: e.start_date!.day, event: e })),
              ].sort((a, b) => a.day - b.day);

              return (
                <div key={monthIdx} className="paper-panel px-5 py-4 sm:px-6">
                  <h3 className="text-sm font-semibold text-foreground mb-3">{monthName}</h3>
                  <div className="space-y-2">
                    {entries.map((entry) =>
                      entry.kind === "session" ? (
                        <Link
                          key={`s-${entry.session.id}`}
                          href={`/player/campaigns/${campaignId}/sessions/${entry.session.id}`}
                          className="flex items-baseline gap-3 hover:opacity-80 transition-opacity"
                        >
                          <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">
                            Day {entry.session.in_game_date!.day}
                          </span>
                          <span className="text-sm text-foreground">
                            {entry.session.title ?? entry.session.date}
                          </span>
                        </Link>
                      ) : (
                        <div
                          key={`e-${entry.event.id}`}
                          className="flex items-baseline gap-3"
                        >
                          <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">
                            {entry.event.end_date && entry.event.end_date.day !== entry.event.start_date!.day
                              ? `${entry.event.start_date!.day}–${entry.event.end_date.day}`
                              : `Day ${entry.event.start_date!.day}`}
                          </span>
                          <span className="text-sm text-foreground flex items-center gap-1.5">
                            <span className="text-muted-foreground">◆</span>
                            {entry.event.title}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}

      {(undatedSessions.length > 0 || undatedEvents.length > 0) && (
        <div className="space-y-2">
          <h2 className="font-serif text-lg text-muted-foreground">Undated</h2>
          <div className="paper-panel px-5 py-4 sm:px-6 space-y-2">
            {undatedSessions.map((s) => (
              <Link
                key={s.id}
                href={`/player/campaigns/${campaignId}/sessions/${s.id}`}
                className="flex items-baseline gap-3 hover:opacity-80 transition-opacity"
              >
                <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">—</span>
                <span className="text-sm text-foreground">{s.title ?? s.date}</span>
              </Link>
            ))}
            {undatedEvents.map((e) => (
              <div key={e.id} className="flex items-baseline gap-3">
                <span className="text-xs font-medium text-muted-foreground w-12 shrink-0">—</span>
                <span className="text-sm text-foreground flex items-center gap-1.5">
                  <span className="text-muted-foreground">◆</span>
                  {e.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
