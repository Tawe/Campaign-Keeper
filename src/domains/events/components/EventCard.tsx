import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { CampaignEvent, Calendar } from "@/types";

interface Props {
  event: CampaignEvent;
  campaignId: string;
  calendar?: Calendar | null;
  variant?: "row" | "card";
}

function formatDate(date: { year: number; month: number; day: number }, calendar?: Calendar | null): string {
  const monthName = calendar?.months[date.month - 1]?.name ?? `Month ${date.month}`;
  const yearLabel = calendar?.year_label ? ` ${calendar.year_label}` : "";
  return `${monthName} ${date.day}, ${date.year}${yearLabel}`;
}

export function EventCard({ event, campaignId, calendar, variant = "row" }: Props) {
  const dateRange = event.start_date
    ? event.end_date
      ? `${formatDate(event.start_date, calendar)} — ${formatDate(event.end_date, calendar)}`
      : formatDate(event.start_date, calendar)
    : null;

  if (variant === "card") {
    return (
      <Link href={`/campaigns/${campaignId}/events/${event.id}`} className="block group">
        <div className="relative overflow-hidden rounded-lg border border-border/50 transition hover:shadow-md">
          {event.image_url ? (
            <>
              <Image
                src={event.image_url}
                alt={event.title}
                width={480}
                height={160}
                unoptimized
                className="h-36 w-full object-cover transition group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="font-medium text-white drop-shadow truncate">{event.title}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {event.event_type && (
                    <Badge
                      variant="outline"
                      className="border-white/20 bg-black/30 text-xs text-white/80 backdrop-blur-sm"
                    >
                      {event.event_type}
                    </Badge>
                  )}
                  {dateRange && (
                    <Badge
                      variant="outline"
                      className="border-white/20 bg-black/30 text-xs text-white/80 backdrop-blur-sm"
                    >
                      {dateRange}
                    </Badge>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
              <p className="font-medium text-foreground truncate">{event.title}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {event.event_type && (
                  <Badge variant="outline" className="text-xs">{event.event_type}</Badge>
                )}
                {dateRange && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">{dateRange}</Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>
    );
  }

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
