import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getSessionUser } from "@/lib/firebase/session";
import { getEventWithCampaignData } from "@/domains/events/queries";
import { getCampaignNpcs } from "@/domains/npcs/queries";
import { getCampaignLocations } from "@/domains/locations/queries";
import { getCampaignFactions } from "@/domains/factions/queries";
import { getCampaignPlayers } from "@/domains/players/queries";
import { getCampaignSessions } from "@/domains/sessions/queries";
import { getCampaignCalendar } from "@/domains/calendars/queries";
import { updateEventField } from "@/domains/events/actions";
import { EventDeleteActions } from "@/domains/events/components/EventDeleteActions";
import { EventAssociationsEditor } from "@/domains/events/components/EventAssociationsEditor";
import { EventDateEditor } from "@/domains/events/components/EventDateEditor";
import { EventImageEditor } from "@/domains/events/components/EventImageEditor";
import { PageHeader } from "@/components/shared/PageHeader";
import { InlineEditor } from "@/components/shared/InlineEditor";
import { InlineInputEditor } from "@/components/shared/InlineInputEditor";
import { Badge } from "@/components/ui/badge";

function formatDate(
  date: { year: number; month: number; day: number },
  calendar?: { months: { name: string; days: number }[]; year_label?: string } | null,
): string {
  const monthName = calendar?.months[date.month - 1]?.name ?? `Month ${date.month}`;
  const yearLabel = calendar?.year_label ? ` ${calendar.year_label}` : "";
  return `${monthName} ${date.day}, ${date.year}${yearLabel}`;
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; eventId: string }>;
}) {
  const { campaignId, eventId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [event, npcs, locations, factions, players, sessions, calendar] = await Promise.all([
    getEventWithCampaignData(eventId, campaignId),
    getCampaignNpcs(campaignId),
    getCampaignLocations(campaignId),
    getCampaignFactions(campaignId),
    getCampaignPlayers(campaignId),
    getCampaignSessions(campaignId),
    getCampaignCalendar(campaignId),
  ]);

  if (!event) notFound();

  const dateRange = event.start_date
    ? event.end_date
      ? `${formatDate(event.start_date, calendar)} — ${formatDate(event.end_date, calendar)}`
      : formatDate(event.start_date, calendar)
    : null;

  return (
    <div className="reading-shell space-y-6">
      {/* Header image */}
      {event.image_url && (
        <div className="relative h-48 w-full overflow-hidden rounded-xl border border-border/80 sm:h-64">
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      )}

      <PageHeader
        title={event.title}
        eyebrow="Event"
        backHref={`/campaigns/${campaignId}/events`}
        backLabel="Events"
        action={<EventDeleteActions eventId={eventId} campaignId={campaignId} />}
      />

      {/* Meta badges */}
      {(event.event_type || dateRange) && (
        <div className="flex flex-wrap gap-1.5">
          {event.event_type && <Badge variant="secondary">{event.event_type}</Badge>}
          {dateRange && <Badge variant="outline">{dateRange}</Badge>}
        </div>
      )}

      {/* Core fields */}
      <div className="grid grid-cols-2 gap-3">
        <InlineInputEditor
          label="Event type"
          value={event.event_type}
          placeholder="Battle, Natural Disaster, Treaty…"
          action={updateEventField.bind(null, eventId, campaignId, "eventType")}
        />
      </div>

      {/* Dates — only show if campaign has a calendar */}
      {calendar ? (
        <div className="grid grid-cols-2 gap-3">
          <EventDateEditor
            eventId={eventId}
            campaignId={campaignId}
            field="startDate"
            label="Start date"
            value={event.start_date}
            calendar={calendar}
          />
          <EventDateEditor
            eventId={eventId}
            campaignId={campaignId}
            field="endDate"
            label="End date"
            value={event.end_date}
            calendar={calendar}
          />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Set up a{" "}
          <a href={`/campaigns/${campaignId}/calendar`} className="underline underline-offset-2">
            campaign calendar
          </a>{" "}
          to record in-game dates.
        </p>
      )}

      {/* Write-up */}
      <div className="space-y-3">
        <InlineEditor
          label="Description"
          value={event.description}
          placeholder="Write up what happened during this event…"
          action={updateEventField.bind(null, eventId, campaignId, "description")}
        />
        <InlineEditor
          label="DM notes"
          value={event.private_notes}
          placeholder="Private notes, hidden motivations, future consequences…"
          dmOnly
          action={updateEventField.bind(null, eventId, campaignId, "privateNotes")}
        />
      </div>

      {/* Image upload */}
      <EventImageEditor
        eventId={eventId}
        campaignId={campaignId}
        imageUrl={event.image_url}
      />

      {/* Associations */}
      <EventAssociationsEditor
        eventId={eventId}
        campaignId={campaignId}
        event={event}
        npcs={npcs}
        locations={locations}
        factions={factions}
        players={players}
        sessions={sessions}
      />
    </div>
  );
}
