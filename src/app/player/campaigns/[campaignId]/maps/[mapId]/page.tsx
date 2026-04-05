import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { MapCanvas } from "@/domains/maps/components/MapCanvas";
import { getMapWithCampaignData } from "@/domains/maps/queries";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function PlayerMapDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; mapId: string }>;
}) {
  const { campaignId, mapId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await getMapWithCampaignData(mapId, campaignId, { playerView: true });
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.map.name}
        eyebrow="Map"
        backHref={`/player/campaigns/${campaignId}/maps`}
        backLabel="Maps"
      />
      {data.linkedLocation ? (
        <p className="text-sm text-muted-foreground">
          Linked location:{" "}
          <Link href={`/player/campaigns/${campaignId}/locations/${data.linkedLocation.id}`} className="font-medium text-primary hover:underline">
            {data.linkedLocation.name}
          </Link>
        </p>
      ) : null}
      <MapCanvas imageUrl={data.map.image_url} mapName={data.map.name} pins={data.pins} />
    </div>
  );
}
