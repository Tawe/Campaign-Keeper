import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { getSessionUser } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { toLocation, toCampaignLocation, toCampaign } from "@/lib/firebase/converters";
import {
  CAMPAIGNS_COL,
  CAMPAIGN_LOCATIONS_COL,
  LOCATIONS_COL,
} from "@/lib/firebase/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionFrame } from "@/components/shared/editorial";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Panel } from "@/components/ui/panel";

export default async function LocationVaultDetailPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = adminDb();
  const [globalDoc, campaignLocsSnap] = await Promise.all([
    db.collection(LOCATIONS_COL).doc(locationId).get(),
    db.collection(CAMPAIGN_LOCATIONS_COL).where("locationId", "==", locationId).where("userId", "==", user.uid).get(),
  ]);

  if (!globalDoc.exists || globalDoc.data()?.userId !== user.uid) notFound();

  const location = toLocation(globalDoc);
  const campaignLocs = campaignLocsSnap.docs.map(toCampaignLocation);

  const campaignIds = [...new Set(campaignLocs.map((cl) => cl.campaign_id))];
  const campaignMap = new Map<string, string>();
  if (campaignIds.length > 0) {
    const campaignRefs = campaignIds.map((id) => db.collection(CAMPAIGNS_COL).doc(id));
    const campaignDocs = await db.getAll(...campaignRefs);
    campaignDocs.forEach((doc) => {
      if (doc.exists) campaignMap.set(doc.id, toCampaign(doc).name);
    });
  }

  return (
    <div className="page-shell max-w-3xl space-y-8">
      {location.image_url && (
        <div className="relative h-48 w-full overflow-hidden rounded-xl">
          <Image
            src={location.image_url}
            alt={location.name}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      )}

      <PageHeader
        title={location.name}
        eyebrow="Location"
        backHref="/app/locations"
        backLabel="Locations"
      />

      {location.terrain.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {location.terrain.map((t) => (
            <Badge key={t} variant="outline">{t}</Badge>
          ))}
        </div>
      )}

      {campaignLocs.length > 0 && (
        <>
          <Separator />
          <SectionFrame title="Campaigns" eyebrow="Usage">
            <div className="space-y-4">
              {campaignLocs.map((cl) => {
                const campaignName = campaignMap.get(cl.campaign_id) ?? cl.campaign_id;
                return (
                  <Panel key={cl.campaign_id} className="p-4 space-y-3">
                    <Link
                      href={`/campaigns/${cl.campaign_id}/locations/${locationId}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {campaignName}
                    </Link>
                    {cl.public_info && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                          Public
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{cl.public_info}</p>
                      </div>
                    )}
                    {cl.private_notes && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                          Notes
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{cl.private_notes}</p>
                      </div>
                    )}
                    {!cl.public_info && !cl.private_notes && (
                      <p className="text-sm text-muted-foreground italic">No notes for this campaign.</p>
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
