"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CalendarSetupForm } from "./CalendarSetupForm";
import { CalendarMonthGrid } from "./CalendarMonthGrid";
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

export function CalendarView({ campaignId, calendar, sessions, events, otherCampaigns }: Props) {
  const [editing, setEditing] = useState(false);

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

  const minYear = sortedYears.length > 0 ? sortedYears[0] : null;
  const maxYear = sortedYears.length > 0 ? sortedYears[sortedYears.length - 1] : null;
  const prevYear = selectedYear != null && minYear != null && selectedYear > minYear - 1 ? selectedYear - 1 : null;
  const nextYear = selectedYear != null && maxYear != null && selectedYear < maxYear + 1 ? selectedYear + 1 : null;

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
      <div className="paper-panel px-5 py-4 sm:px-6 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="ds-section-header">Calendar</p>
            <h1 className="ink-title text-3xl sm:text-[2.4rem]">{calendar.name}</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="shrink-0">
            <Pencil className="h-4 w-4 mr-1.5" />
            Edit
          </Button>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
          <span>{calendar.months.length} months</span>
          {calendar.year_label && <span>{calendar.year_label}</span>}
          {calendar.start_year != null && (
            <span>
              starts {calendar.start_year}
              {calendar.year_label ? ` ${calendar.year_label}` : ""}
            </span>
          )}
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
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) setSelectedYear(v);
              }}
              className="w-24 bg-transparent text-center font-serif text-2xl text-foreground focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              aria-label="Year"
            />
            {calendar.year_label && (
              <span className="font-serif text-2xl text-muted-foreground">{calendar.year_label}</span>
            )}
          </div>
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
                sessionHref={(id) => `/campaigns/${campaignId}/sessions/${id}`}
                eventHref={(id) => `/campaigns/${campaignId}/events/${id}`}
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
            {undatedSessions.map((session) => (
              <Link
                key={session.id}
                href={`/campaigns/${campaignId}/sessions/${session.id}`}
                className="flex items-baseline gap-3 hover:opacity-80 transition-opacity"
              >
                <span className="text-xs text-muted-foreground w-24 shrink-0">
                  {session.date}
                </span>
                <span className="text-sm text-foreground">
                  {session.title ?? "Untitled session"}
                </span>
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
