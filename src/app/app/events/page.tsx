import Link from "next/link";
import Image from "next/image";
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => {
            const campaignIds = eventCampaigns.get(event.id) ?? [];
            return (
              <div
                key={event.id}
                className="relative overflow-hidden rounded-lg border border-border/50 group transition hover:shadow-md"
              >
                <Link href={`/app/events/${event.id}`} className="block">
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="font-medium text-white drop-shadow truncate">{event.title}</p>
                        {event.event_type && (
                          <Badge
                            variant="outline"
                            className="mt-1 border-white/20 bg-black/30 text-xs text-white/80 backdrop-blur-sm"
                          >
                            {event.event_type}
                          </Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
                      <p className="font-medium text-foreground truncate pr-8">{event.title}</p>
                      {event.event_type && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {event.event_type}
                        </Badge>
                      )}
                    </div>
                  )}
                </Link>

                {/* Campaign badges + delete — overlaid top-right */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
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
                        <Badge
                          variant="outline"
                          className={
                            event.image_url
                              ? "border-white/20 bg-black/30 text-xs text-white/80 backdrop-blur-sm hover:bg-black/50 cursor-pointer"
                              : "text-xs hover:bg-muted cursor-pointer"
                          }
                        >
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
