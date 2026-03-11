"use client";

import Link from "next/link";
import type { CalendarMonth, CampaignEvent, Session } from "@/types";

interface Props {
  monthDef: CalendarMonth;
  weekdays: string[];
  startOffset: number;
  sessions: Session[];
  events: CampaignEvent[];
  sessionHref: (id: string) => string;
  eventHref?: (id: string) => string;
}

export function CalendarMonthGrid({
  monthDef,
  weekdays,
  startOffset,
  sessions,
  events,
  sessionHref,
  eventHref,
}: Props) {
  const numCols = weekdays.length || 7;

  const sessionsByDay = new Map<number, Session[]>();
  for (const s of sessions) {
    const day = s.in_game_date!.day;
    if (!sessionsByDay.has(day)) sessionsByDay.set(day, []);
    sessionsByDay.get(day)!.push(s);
  }

  const eventsByDay = new Map<number, CampaignEvent[]>();
  for (const e of events) {
    const day = e.start_date!.day;
    if (!eventsByDay.has(day)) eventsByDay.set(day, []);
    eventsByDay.get(day)!.push(e);
  }

  const totalCells = startOffset + monthDef.days;
  const numRows = Math.ceil(totalCells / numCols);
  const gridCellCount = numRows * numCols;
  const hasContent = sessions.length > 0 || events.length > 0;

  const eventPillClass =
    "block truncate rounded-sm px-1 py-0.5 mb-0.5 text-[10px] leading-snug bg-amber-500/15 text-amber-700 dark:text-amber-400";

  return (
    <div className="paper-panel overflow-hidden">
      <div
        className={`px-4 py-2.5 sm:px-5 border-b border-border flex items-center justify-between${
          !hasContent ? " opacity-40" : ""
        }`}
      >
        <h3 className="text-sm font-semibold">{monthDef.name}</h3>
        <span className="text-xs text-muted-foreground">{monthDef.days} days</span>
      </div>

      <div
        className="grid bg-border gap-px"
        style={{ gridTemplateColumns: `repeat(${numCols}, minmax(0, 1fr))` }}
      >
        {weekdays.map((wd, i) => (
          <div key={i} className="bg-muted/60 px-1 py-1.5 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {wd.length > 3 ? wd.slice(0, 3) : wd}
            </span>
          </div>
        ))}

        {Array.from({ length: gridCellCount }, (_, i) => {
          const day = i - startOffset + 1;
          const isValid = day >= 1 && day <= monthDef.days;

          if (!isValid) {
            return <div key={i} className="bg-muted/20 min-h-[2.5rem]" />;
          }

          const daySessions = sessionsByDay.get(day) ?? [];
          const dayEvents = eventsByDay.get(day) ?? [];
          const hasDayContent = daySessions.length > 0 || dayEvents.length > 0;

          return (
            <div key={i} className="bg-background min-h-[2.5rem] p-1">
              <span
                className={`text-[11px] block leading-none mb-0.5 ${
                  hasDayContent
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground/30"
                }`}
              >
                {day}
              </span>

              {daySessions.map((s) => (
                <Link
                  key={s.id}
                  href={sessionHref(s.id)}
                  title={s.title ?? s.date}
                  className="block truncate rounded-sm px-1 py-0.5 mb-0.5 text-[10px] leading-snug bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  {s.title ?? s.date}
                </Link>
              ))}

              {dayEvents.map((e) => {
                const isMultiDay =
                  e.end_date != null && e.end_date.day !== e.start_date!.day;
                const endLabel = isMultiDay
                  ? e.end_date!.month === e.start_date!.month &&
                    e.end_date!.year === e.start_date!.year
                    ? `–${e.end_date!.day}`
                    : "→"
                  : "";
                const label = `◆ ${e.title}${endLabel ? ` ${endLabel}` : ""}`;

                return eventHref ? (
                  <Link
                    key={e.id}
                    href={eventHref(e.id)}
                    title={e.title}
                    className={`${eventPillClass} hover:bg-amber-500/25 transition-colors`}
                  >
                    {label}
                  </Link>
                ) : (
                  <span key={e.id} title={e.title} className={eventPillClass}>
                    {label}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
