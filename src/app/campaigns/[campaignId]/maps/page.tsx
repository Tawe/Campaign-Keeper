import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignLocations } from "@/domains/locations/queries";
import { AddMapForm } from "@/domains/maps/components/AddMapForm";
import { MapCard } from "@/domains/maps/components/MapCard";
import { getAvailableMaps, getCampaignMaps } from "@/domains/maps/queries";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function CampaignMapsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [maps, availableMaps, locations] = await Promise.all([
    getCampaignMaps(campaignId),
    getAvailableMaps(user.uid, campaignId),
    getCampaignLocations(campaignId),
  ]);

  return (
    <div className="page-shell max-w-5xl space-y-10">
      <PageHeader
        title="Maps"
        eyebrow="Campaign"
        backHref={`/campaigns/${campaignId}`}
        backLabel="Dashboard"
      />
      <AddMapForm
        campaignId={campaignId}
        availableMaps={availableMaps}
        availableLocations={locations.map((location) => ({ id: location.id, name: location.name }))}
      />
      {maps.length === 0 ? (
        <EmptyState
          title="No maps linked yet"
          description="Upload a reusable vault map and add interactive pins for locations."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {maps.map((map) => (
            <MapCard key={map.id} map={map} />
          ))}
        </div>
      )}
    </div>
  );
}
