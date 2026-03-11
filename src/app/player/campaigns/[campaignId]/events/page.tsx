import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignEvents } from "@/domains/events/queries";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";

function formatInGameDate(date: { year: number; month: number; day: number } | null): string | null {
  if (!date) return null;
  return `Year ${date.year}, Month ${date.month}, Day ${date.day}`;
}

export default async function PlayerEventsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const events = await getCampaignEvents(campaignId);

  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No events recorded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <Panel key={event.id} className="px-4 py-4 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="font-medium text-sm">{event.title}</p>
              {event.event_type && (
                <Badge variant="secondary" className="text-xs font-normal">{event.event_type}</Badge>
              )}
            </div>
            {(event.start_date) && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatInGameDate(event.start_date)}
                {event.end_date && event.end_date.day !== event.start_date.day && (
                  <> – Day {event.end_date.day}</>
                )}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-sm text-foreground/80 leading-relaxed">{event.description}</p>
          )}
        </Panel>
      ))}
    </div>
  );
}
