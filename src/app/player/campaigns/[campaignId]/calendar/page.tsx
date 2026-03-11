import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignCalendar } from "@/domains/calendars/queries";
import { getCampaignSessions } from "@/domains/sessions/queries";
import { getCampaignEvents } from "@/domains/events/queries";
import { PlayerCalendarView } from "@/domains/calendars/components/PlayerCalendarView";

export default async function PlayerCalendarPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [calendar, sessions, events] = await Promise.all([
    getCampaignCalendar(campaignId),
    getCampaignSessions(campaignId),
    getCampaignEvents(campaignId),
  ]);

  if (!calendar) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No calendar has been set up for this campaign yet.
      </p>
    );
  }

  return (
    <PlayerCalendarView
      campaignId={campaignId}
      calendar={calendar}
      sessions={sessions}
      events={events}
    />
  );
}
