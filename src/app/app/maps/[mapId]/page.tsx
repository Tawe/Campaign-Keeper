import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getSessionUser } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { toCampaign, toCampaignMap } from "@/lib/firebase/converters";
import { CAMPAIGNS_COL, CAMPAIGN_MAPS_COL } from "@/lib/firebase/db";
import { deleteMapPermanently } from "@/domains/maps/actions";
import { getVaultMap } from "@/domains/maps/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionFrame } from "@/components/shared/editorial";
import { VaultDeleteButton } from "@/components/shared/VaultDeleteButton";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";

export default async function MapVaultDetailPage({
  params,
}: {
  params: Promise<{ mapId: string }>;
}) {
  const { mapId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const map = await getVaultMap(mapId, user.uid);
  if (!map) notFound();

  const campaignLinksSnap = await adminDb()
    .collection(CAMPAIGN_MAPS_COL)
    .where("mapId", "==", mapId)
    .where("userId", "==", user.uid)
    .get();
  const campaignLinks = campaignLinksSnap.docs.map(toCampaignMap);
  const campaignDocs = campaignLinks.length > 0
    ? await adminDb().getAll(...campaignLinks.map((link) => adminDb().collection(CAMPAIGNS_COL).doc(link.campaign_id)))
    : [];
  const campaignNameById = new Map(campaignDocs.filter((doc) => doc.exists).map((doc) => [doc.id, toCampaign(doc).name]));

  return (
    <div className="page-shell max-w-3xl space-y-8">
      {map.image_url ? (
        <div className="relative h-72 overflow-hidden rounded-2xl">
          <Image src={map.image_url} alt={map.name} fill unoptimized className="object-contain" />
        </div>
      ) : null}

      <PageHeader
        title={map.name}
        eyebrow="Map"
        backHref="/app/maps"
        backLabel="Maps"
        action={
          <VaultDeleteButton
            entityName={map.name}
            description="This will permanently delete this map and all of its pins from every campaign."
            action={deleteMapPermanently.bind(null, map.id)}
            redirectHref="/app/maps"
          />
        }
      />

      <SectionFrame title="Campaigns" eyebrow="Usage">
        <div className="space-y-3">
          {campaignLinks.map((link) => (
            <Panel key={link.campaign_id} className="space-y-2 p-4">
              <Link href={`/campaigns/${link.campaign_id}/maps/${map.id}`} className="font-medium text-foreground hover:text-primary">
                {campaignNameById.get(link.campaign_id) ?? link.campaign_id}
              </Link>
              <div>
                <Badge variant={link.player_visible ? "public" : "private"} className="text-xs">
                  {link.player_visible ? "Player visible" : "DM only"}
                </Badge>
              </div>
            </Panel>
          ))}
        </div>
      </SectionFrame>
    </div>
  );
}
