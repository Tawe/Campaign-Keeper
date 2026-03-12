import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { toFaction, toCampaignFaction, toCampaign } from "@/lib/firebase/converters";
import {
  CAMPAIGNS_COL,
  CAMPAIGN_FACTIONS_COL,
  FACTIONS_COL,
} from "@/lib/firebase/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionFrame } from "@/components/shared/editorial";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Panel } from "@/components/ui/panel";

export default async function FactionVaultDetailPage({
  params,
}: {
  params: Promise<{ factionId: string }>;
}) {
  const { factionId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = adminDb();
  const [globalDoc, campaignFactionsSnap] = await Promise.all([
    db.collection(FACTIONS_COL).doc(factionId).get(),
    db.collection(CAMPAIGN_FACTIONS_COL).where("factionId", "==", factionId).where("userId", "==", user.uid).get(),
  ]);

  if (!globalDoc.exists || globalDoc.data()?.userId !== user.uid) notFound();

  const faction = toFaction(globalDoc);
  const campaignFactions = campaignFactionsSnap.docs.map(toCampaignFaction);

  const campaignIds = [...new Set(campaignFactions.map((cf) => cf.campaign_id))];
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
      <PageHeader
        title={faction.name}
        eyebrow="Faction"
        backHref="/app/factions"
        backLabel="Factions"
      />

      <div className="flex flex-wrap gap-1.5">
        {faction.faction_type && <Badge variant="outline">{faction.faction_type}</Badge>}
        {faction.alignment && <Badge variant="outline">{faction.alignment}</Badge>}
        {faction.founded && (
          <Badge variant="outline" className="text-muted-foreground">
            Founded {faction.founded}
          </Badge>
        )}
      </div>

      {campaignFactions.length > 0 && (
        <>
          <Separator />
          <SectionFrame title="Campaigns" eyebrow="Usage">
            <div className="space-y-4">
              {campaignFactions.map((cf) => {
                const campaignName = campaignMap.get(cf.campaign_id) ?? cf.campaign_id;
                return (
                  <Panel key={cf.campaign_id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/campaigns/${cf.campaign_id}/factions/${factionId}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {campaignName}
                      </Link>
                      <div className="flex gap-1.5">
                        {cf.status && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {cf.status}
                          </Badge>
                        )}
                        {cf.influence && (
                          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                            {cf.influence}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      {cf.home_base && (
                        <p className="text-muted-foreground">
                          Base: <span className="text-foreground">{cf.home_base}</span>
                        </p>
                      )}
                      {cf.member_count && (
                        <p className="text-muted-foreground">
                          Members: <span className="text-foreground">{cf.member_count}</span>
                        </p>
                      )}
                      {cf.disbanded && (
                        <p className="text-muted-foreground">
                          Disbanded: <span className="text-foreground">{cf.disbanded}</span>
                        </p>
                      )}
                    </div>

                    {cf.leader_names.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Leaders: <span className="text-foreground">{cf.leader_names.join(", ")}</span>
                      </p>
                    )}
                    {cf.allegiances.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Allies: <span className="text-foreground">{cf.allegiances.join(", ")}</span>
                      </p>
                    )}
                    {cf.enemies.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Enemies: <span className="text-foreground">{cf.enemies.join(", ")}</span>
                      </p>
                    )}
                    {cf.public_info && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                          Public
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{cf.public_info}</p>
                      </div>
                    )}
                    {cf.private_notes && (
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                          Notes
                        </p>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{cf.private_notes}</p>
                      </div>
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
