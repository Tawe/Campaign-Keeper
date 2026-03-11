import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getGlobalLocationsWithCampaigns } from "@/domains/locations/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";

export default async function GlobalLocationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { locations, locationCampaigns, campaignMap } = await getGlobalLocationsWithCampaigns(user.uid);

  return (
    <div className="page-shell max-w-5xl space-y-8">
      <PageHeader
        title="Locations"
        eyebrow="Vault"
        backHref="/app/dashboard"
        backLabel="Dashboard"
      />

      {locations.length === 0 ? (
        <EmptyState
          title="No locations yet"
          description="Locations appear here once they have been visited in at least one session."
        />
      ) : (
        <div className="space-y-2">
          {locations.map((loc) => {
            const campaigns = locationCampaigns.get(loc.id) ?? [];
            const firstCampaignId = campaigns[0]?.campaignId;
            return (
              <div
                key={loc.id}
                className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
              >
                {firstCampaignId ? (
                  <Link
                    href={`/campaigns/${firstCampaignId}/locations/${loc.id}?from=vault`}
                    className="min-w-0 flex-1 hover:opacity-80"
                  >
                    <p className="font-medium text-foreground truncate">{loc.name}</p>
                  </Link>
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{loc.name}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
                  {campaigns.map(({ campaignId }) => {
                    const campaign = campaignMap.get(campaignId);
                    if (!campaign) return null;
                    return (
                      <Link key={campaignId} href={`/campaigns/${campaignId}/locations/${loc.id}`}>
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
