"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Calendar, InGameDate } from "@/types";

interface Props {
  calendar: Calendar;
  value: InGameDate | null;
  onChange: (date: InGameDate | null) => void;
}

export function InGameDatePicker({ calendar, value, onChange }: Props) {
  const year = value?.year ?? "";
  const month = value?.month ?? "";
  const day = value?.day ?? "";

  const selectedMonth = value?.month ? calendar.months[value.month - 1] : null;
  const maxDays = selectedMonth?.days ?? 999;

  function handleYear(raw: string) {
    const y = parseInt(raw, 10);
    if (!raw.trim()) { onChange(null); return; }
    onChange({ year: isNaN(y) ? 1 : y, month: value?.month ?? 1, day: value?.day ?? 1 });
  }

  function handleMonth(raw: string) {
    const m = parseInt(raw, 10);
    if (!value) return;
    const newMonth = calendar.months[m - 1];
    const clampedDay = Math.min(value.day, newMonth?.days ?? value.day);
    onChange({ ...value, month: m, day: clampedDay });
  }

  function handleDay(raw: string) {
    if (!value) return;
    const d = parseInt(raw, 10);
    onChange({ ...value, day: isNaN(d) ? 1 : Math.max(1, Math.min(d, maxDays)) });
  }

  return (
    <div className="space-y-2">
      <Label>In-game date</Label>
      <p className="text-xs text-muted-foreground -mt-1">Optional. Set the in-game date for the calendar view.</p>
      <div className="flex gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Year</Label>
          <Input
            type="number"
            value={year}
            onChange={(e) => handleYear(e.target.value)}
            placeholder="1374"
            className="w-24"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Month</Label>
          <Select
            value={month ? String(month) : ""}
            onValueChange={handleMonth}
            disabled={!value}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              {calendar.months.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Day</Label>
          <Input
            type="number"
            value={day}
            onChange={(e) => handleDay(e.target.value)}
            min={1}
            max={maxDays}
            placeholder="1"
            disabled={!value}
            className="w-20"
          />
        </div>
      </div>
    </div>
  );
}
