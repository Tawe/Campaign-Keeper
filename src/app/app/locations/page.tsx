import Link from "next/link";
import Image from "next/image";
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => {
            const campaigns = locationCampaigns.get(loc.id) ?? [];
            return (
              <div key={loc.id} className="relative overflow-hidden rounded-lg border border-border/50 group transition hover:shadow-md">
                <Link href={`/app/locations/${loc.id}`} className="block">
                  {loc.image_url ? (
                    <>
                      <Image
                        src={loc.image_url}
                        alt={loc.name}
                        width={480}
                        height={160}
                        unoptimized
                        className="h-36 w-full object-cover transition group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <p className="font-medium text-white drop-shadow truncate">{loc.name}</p>
                        {loc.terrain.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {loc.terrain.map((t) => (
                              <Badge
                                key={t}
                                variant="outline"
                                className="border-white/20 bg-black/30 text-xs text-white/80 backdrop-blur-sm"
                              >
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
                      <p className="font-medium text-foreground truncate">{loc.name}</p>
                      {loc.terrain.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {loc.terrain.map((t) => (
                            <Badge key={t} variant="outline" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Link>
                {/* Campaign badges + delete — overlaid top-right */}
                <div className="absolute top-2 right-2 flex flex-wrap gap-1 items-center justify-end">
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
                        <Badge
                          variant="outline"
                          className={
                            loc.image_url
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
