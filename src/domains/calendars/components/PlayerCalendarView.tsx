"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CalendarMonthGrid } from "./CalendarMonthGrid";
import type { Calendar, CampaignEvent, Session } from "@/types";

interface Props {
  campaignId: string;
  calendar: Calendar;
  sessions: Session[];
  events: CampaignEvent[];
}

function getStartOffset(
  monthIdx: number,
  selectedYear: number,
  calendar: Calendar,
): number {
  const numWeekdays = calendar.weekdays.length;
  if (numWeekdays === 0) return 0;
  const anchorYear = calendar.start_year ?? selectedYear;
  const daysPerYear = calendar.months.reduce((sum, m) => sum + m.days, 0);
  const daysBeforeMonth = calendar.months
    .slice(0, monthIdx - 1)
    .reduce((sum, m) => sum + m.days, 0);
  const totalDays = (selectedYear - anchorYear) * daysPerYear + daysBeforeMonth;
  return ((totalDays % numWeekdays) + numWeekdays) % numWeekdays;
}

export function PlayerCalendarView({ campaignId, calendar, sessions, events }: Props) {
  const datedSessions = sessions.filter((s) => s.in_game_date !== null);
  const undatedSessions = sessions.filter((s) => s.in_game_date === null);
  const datedEvents = events.filter((e) => e.start_date !== null);
  const undatedEvents = events.filter((e) => e.start_date === null);

  const allYears = new Set<number>([
    ...datedSessions.map((s) => s.in_game_date!.year),
    ...datedEvents.map((e) => e.start_date!.year),
  ]);
  if (calendar.start_year != null) allYears.add(calendar.start_year);

  const sortedYears = [...allYears].sort((a, b) => a - b);
  const defaultYear = sortedYears[sortedYears.length - 1] ?? null;
  const [selectedYear, setSelectedYear] = useState<number | null>(defaultYear);

  const yearIdx = selectedYear != null ? sortedYears.indexOf(selectedYear) : -1;
  const prevYear = yearIdx > 0 ? sortedYears[yearIdx - 1] : null;
  const nextYear = yearIdx < sortedYears.length - 1 ? sortedYears[yearIdx + 1] : null;

  const yearSessions =
    selectedYear != null
      ? datedSessions.filter((s) => s.in_game_date!.year === selectedYear)
      : [];
  const yearEvents =
    selectedYear != null
      ? datedEvents.filter((e) => e.start_date!.year === selectedYear)
      : [];

  return (
    <div className="space-y-6">
      {/* Calendar header */}
      <div className="paper-panel px-5 py-4 sm:px-6 space-y-2">
        <p className="ds-section-header">Calendar</p>
        <h2 className="ink-title text-2xl">{calendar.name}</h2>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span>{calendar.months.length} months</span>
          {calendar.year_label && <span>{calendar.year_label}</span>}
          {calendar.weekdays.length > 0 && (
            <span>{calendar.weekdays.join(" · ")}</span>
          )}
        </div>
      </div>

      {/* Year navigation */}
      {sortedYears.length > 0 && selectedYear != null && (
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => prevYear != null && setSelectedYear(prevYear)}
            disabled={prevYear == null}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-serif text-2xl text-foreground">
            {selectedYear}
            {calendar.year_label ? ` ${calendar.year_label}` : ""}
          </h2>
          <button
            type="button"
            onClick={() => nextYear != null && setSelectedYear(nextYear)}
            disabled={nextYear == null}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Month grids */}
      {sortedYears.length > 0 && selectedYear != null ? (
        <div className="space-y-4">
          {calendar.months.map((monthDef, i) => {
            const monthIdx = i + 1;
            return (
              <CalendarMonthGrid
                key={monthIdx}
                monthDef={monthDef}
                weekdays={calendar.weekdays}
                startOffset={getStartOffset(monthIdx, selectedYear, calendar)}
                sessions={yearSessions.filter((s) => s.in_game_date!.month === monthIdx)}
                events={yearEvents.filter((e) => e.start_date!.month === monthIdx)}
                sessionHref={(id) => `/player/campaigns/${campaignId}/sessions/${id}`}
              />
            );
          })}
        </div>
      ) : (
        <div className="paper-panel px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No sessions or events have in-game dates yet.
          </p>
        </div>
      )}

      {/* Undated */}
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
