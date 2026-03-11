import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { CampaignEvent, Calendar } from "@/types";

interface Props {
  event: CampaignEvent;
  campaignId: string;
  calendar?: Calendar | null;
}

function formatDate(date: { year: number; month: number; day: number }, calendar?: Calendar | null): string {
  const monthName = calendar?.months[date.month - 1]?.name ?? `Month ${date.month}`;
  const yearLabel = calendar?.year_label ? ` ${calendar.year_label}` : "";
  return `${monthName} ${date.day}, ${date.year}${yearLabel}`;
}

export function EventCard({ event, campaignId, calendar }: Props) {
  const dateRange = event.start_date
    ? event.end_date
      ? `${formatDate(event.start_date, calendar)} — ${formatDate(event.end_date, calendar)}`
      : formatDate(event.start_date, calendar)
    : null;

  return (
    <Link
      href={`/campaigns/${campaignId}/events/${event.id}`}
      className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground truncate">{event.title}</p>
        {dateRange && (
          <p className="text-xs text-muted-foreground mt-0.5">{dateRange}</p>
        )}
        {event.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{event.description}</p>
        )}
      </div>
      {event.event_type && (
        <Badge variant="outline" className="text-xs shrink-0">{event.event_type}</Badge>
      )}
    </Link>
  );
}
