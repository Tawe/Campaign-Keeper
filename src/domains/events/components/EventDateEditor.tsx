"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { InGameDatePicker } from "@/domains/sessions/components/InGameDatePicker";
import { updateEventDates } from "@/domains/events/actions";
import type { Calendar, InGameDate } from "@/types";
import { Label } from "@/components/ui/label";

interface Props {
  eventId: string;
  campaignId: string;
  field: "startDate" | "endDate";
  label: string;
  value: InGameDate | null;
  calendar: Calendar;
}

export function EventDateEditor({ eventId, campaignId, field, label, value, calendar }: Props) {
  const router = useRouter();
  const [date, setDate] = useState<InGameDate | null>(value);
  const [, startTransition] = useTransition();

  function handleChange(next: InGameDate | null) {
    setDate(next);
    startTransition(async () => {
      try {
        await updateEventDates(eventId, campaignId, field, next);
        router.refresh();
      } catch {
        toast.error("Failed to save date");
      }
    });
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <InGameDatePicker calendar={calendar} value={date} onChange={handleChange} />
    </div>
  );
}
