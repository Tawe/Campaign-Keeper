"use client";

import { useState, useTransition } from "react";
import { Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { saveCalendar } from "@/domains/calendars/actions";
import { MonthEditor } from "./MonthEditor";
import type { Calendar, CalendarMonth } from "@/types";

interface OtherCampaign {
  campaignId: string;
  campaignName: string;
  calendar: Calendar;
}

interface Props {
  campaignId: string;
  initial?: Calendar | null;
  otherCampaigns: OtherCampaign[];
  onCancel?: () => void;
}

const inputBase =
  "rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full";
const labelBase = "block text-xs font-medium text-muted-foreground mb-1";

export function CalendarSetupForm({ campaignId, initial, otherCampaigns, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [yearLabel, setYearLabel] = useState(initial?.year_label ?? "");
  const [startYear, setStartYear] = useState<string>(
    initial?.start_year != null ? String(initial.start_year) : ""
  );
  const [months, setMonths] = useState<CalendarMonth[]>(
    initial?.months ?? [{ name: "", days: 30 }]
  );
  const [weekdays, setWeekdays] = useState<string[]>(
    initial?.weekdays ?? [""]
  );
  const [showImport, setShowImport] = useState(false);
  const [isPending, startTransition] = useTransition();

  function applyImport(calendar: Calendar) {
    setName(calendar.name);
    setYearLabel(calendar.year_label);
    setStartYear(calendar.start_year != null ? String(calendar.start_year) : "");
    setMonths(calendar.months);
    setWeekdays(calendar.weekdays);
    setShowImport(false);
  }

  function updateWeekday(i: number, value: string) {
    setWeekdays((prev) => prev.map((w, idx) => (idx === i ? value : w)));
  }

  function moveWeekday(i: number, dir: -1 | 1) {
    setWeekdays((prev) => {
      const next = [...prev];
      const j = i + dir;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function removeWeekday(i: number) {
    setWeekdays((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addWeekday() {
    setWeekdays((prev) => [...prev, ""]);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        const parsed = startYear.trim() ? parseInt(startYear, 10) : null;
        await saveCalendar(campaignId, {
          name,
          yearLabel,
          startYear: parsed,
          months,
          weekdays: weekdays.filter(Boolean),
        });
        onCancel?.();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to save calendar");
      }
    });
  }

  return (
    <div className="paper-panel space-y-6 px-5 py-5 sm:px-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-foreground">
          {initial ? "Edit calendar" : "Set up calendar"}
        </h2>
        {otherCampaigns.length > 0 && (
          <button
            type="button"
            onClick={() => setShowImport((v) => !v)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Import from another campaign
          </button>
        )}
      </div>

      {showImport && (
        <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
          <p className="text-xs text-muted-foreground">Select a campaign to import its calendar definition:</p>
          <div className="space-y-1">
            {otherCampaigns.map(({ campaignId: cid, campaignName, calendar }) => (
              <button
                key={cid}
                type="button"
                onClick={() => applyImport(calendar)}
                className="w-full text-left rounded px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                <span className="font-medium">{campaignName}</span>
                <span className="ml-2 text-xs text-muted-foreground">{calendar.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelBase}>Calendar name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Calendar of Harptos"
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase}>Year label</label>
          <input
            type="text"
            value={yearLabel}
            onChange={(e) => setYearLabel(e.target.value)}
            placeholder="DR"
            className={inputBase}
          />
        </div>
        <div>
          <label className={labelBase}>Campaign start year</label>
          <input
            type="number"
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            placeholder="1492"
            className={inputBase}
          />
        </div>
      </div>

      <div>
        <label className={labelBase}>Months</label>
        <p className="text-xs text-muted-foreground mb-2">Name and number of days for each month.</p>
        <MonthEditor months={months} onChange={setMonths} />
      </div>

      <div>
        <label className={labelBase}>Weekdays</label>
        <p className="text-xs text-muted-foreground mb-2">Day names in order (e.g. 1st, 2nd… or Moonday, Twoday…).</p>
        <div className="space-y-1.5">
          {weekdays.map((w, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveWeekday(i, -1)}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                  aria-label="Move up"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveWeekday(i, 1)}
                  disabled={i === weekdays.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                  aria-label="Move down"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={w}
                onChange={(e) => updateWeekday(i, e.target.value)}
                placeholder={`Day ${i + 1}`}
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring flex-1"
              />
              <button
                type="button"
                onClick={() => removeWeekday(i)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove weekday"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addWeekday}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add weekday
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? "Saving…" : "Save calendar"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
