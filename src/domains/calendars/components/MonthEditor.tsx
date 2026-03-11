"use client";

import { Plus, X, ChevronUp, ChevronDown } from "lucide-react";
import type { CalendarMonth } from "@/types";

interface Props {
  months: CalendarMonth[];
  onChange: (months: CalendarMonth[]) => void;
}

const inputBase =
  "rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

export function MonthEditor({ months, onChange }: Props) {
  function updateRow(i: number, field: keyof CalendarMonth, raw: string) {
    onChange(
      months.map((m, idx) =>
        idx === i
          ? { ...m, [field]: field === "days" ? (parseInt(raw, 10) || 1) : raw }
          : m
      )
    );
  }

  function move(i: number, dir: -1 | 1) {
    const next = [...months];
    const j = i + dir;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function remove(i: number) {
    onChange(months.filter((_, idx) => idx !== i));
  }

  function addMonth() {
    onChange([...months, { name: "", days: 30 }]);
  }

  return (
    <div className="space-y-1.5">
      {months.map((m, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => move(i, -1)}
              disabled={i === 0}
              className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
              aria-label="Move up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === months.length - 1}
              className="text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
              aria-label="Move down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <input
            type="text"
            value={m.name}
            onChange={(e) => updateRow(i, "name", e.target.value)}
            placeholder="Hammer…"
            className={`${inputBase} flex-1`}
          />
          <input
            type="number"
            value={m.days}
            onChange={(e) => updateRow(i, "days", e.target.value)}
            min={1}
            max={999}
            placeholder="30"
            className={`${inputBase} w-20 text-center`}
          />
          <span className="text-xs text-muted-foreground w-8">days</span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Remove month"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addMonth}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Add month
      </button>
    </div>
  );
}
