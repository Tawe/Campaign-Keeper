import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getGlobalLocationsWithCampaigns } from "@/domains/locations/queries";
import { deleteLocationPermanently } from "@/domains/locations/actions";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { VaultDeleteButton } from "@/components/shared/VaultDeleteButton";
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
            return (
              <div
                key={loc.id}
                className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
              >
                <Link
                  href={`/app/locations/${loc.id}`}
                  className="min-w-0 flex-1 hover:opacity-80"
                >
                  <p className="font-medium text-foreground truncate">{loc.name}</p>
                </Link>
                <div className="flex flex-wrap gap-1.5 justify-end shrink-0 items-center">
                  <VaultDeleteButton
                    entityName={loc.name}
                    description="This will permanently delete this location from all campaigns and the vault. Sub-locations will have their parent cleared. This cannot be undone."
                    action={deleteLocationPermanently.bind(null, loc.id)}
                  />
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
