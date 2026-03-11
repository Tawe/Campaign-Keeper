"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarSetupForm } from "./CalendarSetupForm";
import type { Calendar, CampaignEvent, Session } from "@/types";

interface OtherCampaign {
  campaignId: string;
  campaignName: string;
  calendar: Calendar;
}

interface Props {
  campaignId: string;
  calendar: Calendar;
  sessions: Session[];
  events: CampaignEvent[];
  otherCampaigns: OtherCampaign[];
}

export function CalendarView({ campaignId, calendar, sessions, events, otherCampaigns }: Props) {
  const [editing, setEditing] = useState(false);

  // Split sessions into dated and undated
  const datedSessions = sessions.filter((s) => s.in_game_date !== null);
  const undatedSessions = sessions.filter((s) => s.in_game_date === null);

  // Split events into dated and undated
  const datedEvents = events.filter((e) => e.start_date !== null);
  const undatedEvents = events.filter((e) => e.start_date === null);

  // Group: year → month (1-based) → sessions[]
  const grouped = new Map<number, Map<number, Session[]>>();
  for (const session of datedSessions) {
    const { year, month } = session.in_game_date!;
    if (!grouped.has(year)) grouped.set(year, new Map());
    const byMonth = grouped.get(year)!;
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(session);
  }

  // Group events: year → month (1-based) → events[]
  const groupedEvents = new Map<number, Map<number, CampaignEvent[]>>();
  for (const event of datedEvents) {
    const { year, month } = event.start_date!;
    if (!groupedEvents.has(year)) groupedEvents.set(year, new Map());
    const byMonth = groupedEvents.get(year)!;
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(event);
  }

  // Merge years from both grouped and groupedEvents
  const allYears = new Set([...grouped.keys(), ...groupedEvents.keys()]);
  // Sort years ascending
  const sortedYears = [...allYears].sort((a, b) => a - b);

  if (editing) {
    return (
      <CalendarSetupForm
        campaignId={campaignId}
        initial={calendar}
        otherCampaigns={otherCampaigns}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Calendar definition summary */}
      <div className="paper-panel px-5 py-4 sm:px-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="ds-section-header">Calendar</p>
            <h1 className="ink-title text-3xl sm:text-[2.4rem]">{calendar.name}</h1>
            {calendar.year_label && (
              <p className="text-sm text-muted-foreground mt-1">Year label: {calendar.year_label}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="shrink-0">
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>{calendar.months.length} months</span>
          {calendar.weekdays.length > 0 && (
            <span>{calendar.weekdays.join(", ")}</span>
          )}
        </div>
      </div>

      {/* Session timeline by in-game date */}
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
              const monthDef = calendar.months[monthIdx - 1];
              const monthName = monthDef?.name ?? `Month ${monthIdx}`;
              const monthSessions = (byMonth.get(monthIdx) ?? [])
                .sort((a, b) => a.in_game_date!.day - b.in_game_date!.day);
              const monthEvents = (eventsByMonth.get(monthIdx) ?? [])
                .sort((a, b) => a.start_date!.day - b.start_date!.day);

              // Merge sessions and events into a single sorted list
              type Entry =
                | { kind: "session"; day: number; session: Session }
                | { kind: "event"; day: number; event: CampaignEvent };
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
                          href={`/campaigns/${campaignId}/sessions/${entry.session.id}`}
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
                        <Link
                          key={`e-${entry.event.id}`}
                          href={`/campaigns/${campaignId}/events/${entry.event.id}`}
                          className="flex items-baseline gap-3 hover:opacity-80 transition-opacity"
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
                        </Link>
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
            {undatedSessions.map((session) => (
              <Link
                key={session.id}
                href={`/campaigns/${campaignId}/sessions/${session.id}`}
                className="flex items-baseline gap-3 hover:opacity-80 transition-opacity"
              >
                <span className="text-xs text-muted-foreground w-24 shrink-0">{session.date}</span>
                <span className="text-sm text-foreground">{session.title ?? "Untitled session"}</span>
              </Link>
            ))}
            {undatedEvents.map((event) => (
              <Link
                key={event.id}
                href={`/campaigns/${campaignId}/events/${event.id}`}
                className="flex items-baseline gap-3 hover:opacity-80 transition-opacity"
              >
                <span className="text-xs text-muted-foreground w-24 shrink-0 flex items-center gap-1">
                  <span>◆</span> Event
                </span>
                <span className="text-sm text-foreground">{event.title}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
