import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignLocations } from "@/domains/locations/queries";
import { CampaignMapVisibilityToggle } from "@/domains/maps/components/CampaignMapVisibilityToggle";
import { MapImageEditor } from "@/domains/maps/components/MapImageEditor";
import { MapLocationSelector } from "@/domains/maps/components/MapLocationSelector";
import { MapPinManager } from "@/domains/maps/components/MapPinManager";
import { getMapTargetsForCampaign, getMapWithCampaignData } from "@/domains/maps/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionFrame } from "@/components/shared/editorial";

export default async function CampaignMapDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; mapId: string }>;
}) {
  const { campaignId, mapId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [data, targets, locations] = await Promise.all([
    getMapWithCampaignData(mapId, campaignId),
    getMapTargetsForCampaign(campaignId),
    getCampaignLocations(campaignId),
  ]);
  if (!data) notFound();

  const { map, pins, linkedLocation } = data;

  return (
    <div className="reading-shell space-y-6">
      <PageHeader
        title={map.name}
        eyebrow="Map"
        backHref={`/campaigns/${campaignId}/maps`}
        backLabel="Maps"
      />

      {linkedLocation ? (
        <div className="rounded-2xl border border-border/80 px-4 py-3 text-sm">
          Linked location:{" "}
          <Link href={`/campaigns/${campaignId}/locations/${linkedLocation.id}`} className="font-medium text-primary hover:underline">
            {linkedLocation.name}
          </Link>
        </div>
      ) : null}

      <CampaignMapVisibilityToggle
        mapId={map.id}
        campaignId={campaignId}
        playerVisible={map.player_visible}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <MapLocationSelector
          mapId={map.id}
          campaignId={campaignId}
          currentLocationId={map.location_id}
          locations={locations.map((location) => ({ id: location.id, name: location.name }))}
        />
        <MapImageEditor mapId={map.id} campaignId={campaignId} imageUrl={map.image_url} />
      </div>

      <SectionFrame
        title="Interactive pins"
        eyebrow="Map Editor"
        description="Pins preview their linked location on hover and open it on click."
      >
        <MapPinManager
          map={map}
          pins={pins}
          locationTargets={targets.locations}
          mapTargets={targets.maps}
        />
      </SectionFrame>
    </div>
  );
}
