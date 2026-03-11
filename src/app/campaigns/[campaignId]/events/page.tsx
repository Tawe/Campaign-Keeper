import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignEvents, getAvailableEvents } from "@/domains/events/queries";
import { EventCard } from "@/domains/events/components/EventCard";
import { AddEventForm } from "@/domains/events/components/AddEventForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { getCampaignCalendar } from "@/domains/calendars/queries";

export default async function EventsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [events, availableEvents, calendar] = await Promise.all([
    getCampaignEvents(campaignId),
    getAvailableEvents(user.uid, campaignId),
    getCampaignCalendar(campaignId),
  ]);

  return (
    <div className="page-shell max-w-5xl space-y-10">
      <PageHeader
        title="Events"
        eyebrow="Campaign"
        backHref={`/campaigns/${campaignId}`}
        backLabel="Dashboard"
      />

      <AddEventForm campaignId={campaignId} availableEvents={availableEvents} />

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Record battles, political upheavals, disasters, and other major happenings in your world."
        />
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <EventCard key={event.id} event={event} campaignId={campaignId} calendar={calendar} />
          ))}
        </div>
      )}
    </div>
  );
}
