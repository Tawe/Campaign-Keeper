import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getSessionUser } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { toEvent, toCampaignEvent, toCampaign } from "@/lib/firebase/converters";
import {
  CAMPAIGNS_COL,
  CAMPAIGN_EVENTS_COL,
  EVENTS_COL,
} from "@/lib/firebase/db";
import { deleteEventPermanently } from "@/domains/events/actions";
import { PageHeader } from "@/components/shared/PageHeader";
import { VaultDeleteButton } from "@/components/shared/VaultDeleteButton";
import { SectionFrame } from "@/components/shared/editorial";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Panel } from "@/components/ui/panel";

export default async function EventVaultDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = adminDb();
  const [globalDoc, campaignEventsSnap] = await Promise.all([
    db.collection(EVENTS_COL).doc(eventId).get(),
    db.collection(CAMPAIGN_EVENTS_COL).where("eventId", "==", eventId).where("userId", "==", user.uid).get(),
  ]);

  if (!globalDoc.exists || globalDoc.data()?.userId !== user.uid) notFound();

  const event = toEvent(globalDoc);
  const campaignEvents = campaignEventsSnap.docs.map(toCampaignEvent);

  const campaignIds = [...new Set(campaignEvents.map((ce) => ce.campaign_id))];
  const campaignMap = new Map<string, string>();
  if (campaignIds.length > 0) {
    const campaignRefs = campaignIds.map((id) => db.collection(CAMPAIGNS_COL).doc(id));
    const campaignDocs = await db.getAll(...campaignRefs);
    campaignDocs.forEach((doc) => {
      if (doc.exists) campaignMap.set(doc.id, toCampaign(doc).name);
    });
  }

  const formatDate = (d: { year: number; month: number; day: number }) =>
    `Year ${d.year}, Month ${d.month}, Day ${d.day}`;

  return (
    <div className="page-shell max-w-3xl space-y-8">
      {event.image_url && (
        <div className="relative h-48 w-full overflow-hidden rounded-xl">
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
        backHref="/app/events"
        backLabel="Events"
        action={
          <VaultDeleteButton
            entityName={event.title}
            description="This will permanently delete this event from all campaigns and the vault. This cannot be undone."
            action={deleteEventPermanently.bind(null, eventId)}
            redirectHref="/app/events"
          />
        }
      />

      <div className="flex flex-wrap gap-1.5">
        {event.event_type && <Badge variant="outline">{event.event_type}</Badge>}
        {event.start_date && (
          <Badge variant="outline" className="text-muted-foreground">
            {event.end_date
              ? `${formatDate(event.start_date)} — ${formatDate(event.end_date)}`
              : formatDate(event.start_date)}
          </Badge>
        )}
      </div>

      {event.description && (
        <p className="text-sm text-foreground whitespace-pre-wrap">{event.description}</p>
      )}

      {campaignEvents.length > 0 && (
        <>
          <Separator />
          <SectionFrame title="Campaigns" eyebrow="Usage">
            <div className="space-y-4">
              {campaignEvents.map((ce) => {
                const campaignName = campaignMap.get(ce.campaign_id) ?? ce.campaign_id;
                const associationParts: string[] = [];
                if (ce.npc_ids.length > 0) associationParts.push(`${ce.npc_ids.length} NPC${ce.npc_ids.length !== 1 ? "s" : ""}`);
                if (ce.location_id) associationParts.push("1 Location");
                if (ce.faction_ids.length > 0) associationParts.push(`${ce.faction_ids.length} Faction${ce.faction_ids.length !== 1 ? "s" : ""}`);
                if (ce.session_ids.length > 0) associationParts.push(`${ce.session_ids.length} Session${ce.session_ids.length !== 1 ? "s" : ""}`);
                return (
                  <Panel key={ce.campaign_id} className="p-4 space-y-2">
                    <Link
                      href={`/campaigns/${ce.campaign_id}/events/${eventId}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {campaignName}
                    </Link>
                    {associationParts.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {associationParts.join(" · ")}
                      </p>
                    )}
                    {associationParts.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No associations linked.</p>
                    )}
                  </Panel>
                );
              })}
            </div>
          </SectionFrame>
        </>
      )}
    </div>
  );
}
