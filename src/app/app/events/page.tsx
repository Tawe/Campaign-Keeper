import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getGlobalEventsWithCampaigns } from "@/domains/events/queries";
import { deleteEventPermanently } from "@/domains/events/actions";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { VaultDeleteButton } from "@/components/shared/VaultDeleteButton";
import { Badge } from "@/components/ui/badge";

export default async function GlobalEventsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { events, eventCampaigns, campaignMap } = await getGlobalEventsWithCampaigns(user.uid);

  return (
    <div className="page-shell max-w-5xl space-y-8">
      <PageHeader
        title="Events"
        eyebrow="Vault"
        backHref="/app/dashboard"
        backLabel="Dashboard"
      />

      {events.length === 0 ? (
        <EmptyState
          title="No events yet"
          description="Events appear here once they have been added to a campaign."
        />
      ) : (
        <div className="space-y-2">
          {events.map((event) => {
            const campaignIds = eventCampaigns.get(event.id) ?? [];
            return (
              <div
                key={event.id}
                className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
              >
                <Link
                  href={`/app/events/${event.id}`}
                  className="min-w-0 flex-1 hover:opacity-80"
                >
                  <p className="font-medium text-foreground truncate">{event.title}</p>
                  {event.event_type && (
                    <p className="text-xs text-muted-foreground">{event.event_type}</p>
                  )}
                </Link>

                <div className="flex flex-col gap-1.5 items-end shrink-0">
                  <VaultDeleteButton
                    entityName={event.title}
                    description="This will permanently delete this event from all campaigns and the vault. This cannot be undone."
                    action={deleteEventPermanently.bind(null, event.id)}
                  />
                  {campaignIds.map((campaignId) => {
                    const campaign = campaignMap.get(campaignId);
                    if (!campaign) return null;
                    return (
                      <Link key={campaignId} href={`/campaigns/${campaignId}/events/${event.id}`}>
                        <Badge variant="outline" className="text-xs hover:bg-muted cursor-pointer">
                          {campaign.name}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
