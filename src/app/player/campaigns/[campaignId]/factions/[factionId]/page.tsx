import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/session";
import { getFactionWithCampaignData, getNpcsInFaction } from "@/domains/factions/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionFrame, StackedList } from "@/components/shared/editorial";
import { Badge } from "@/components/ui/badge";
import { Portrait } from "@/components/shared/Portrait";

export default async function PlayerFactionDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; factionId: string }>;
}) {
  const { campaignId, factionId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const faction = await getFactionWithCampaignData(factionId, campaignId);
  if (!faction) notFound();

  const members = await getNpcsInFaction(campaignId, faction.name);

  const metaItems = [
    faction.faction_type,
    faction.influence,
    faction.alignment,
    faction.status,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <PageHeader
        title={faction.name}
        eyebrow="Faction"
        backHref={`/player/campaigns/${campaignId}/factions`}
        backLabel="Factions"
      />

      {metaItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {faction.faction_type && <Badge variant="secondary">{faction.faction_type}</Badge>}
          {faction.influence && <Badge variant="outline">{faction.influence}</Badge>}
          {faction.alignment && <Badge variant="outline">{faction.alignment}</Badge>}
          {faction.status && <Badge variant="outline">{faction.status}</Badge>}
        </div>
      )}

      <div className="paper-panel space-y-3 px-5 py-5 sm:px-6">
        {faction.home_base && (
          <p className="text-sm text-muted-foreground">Home base: <span className="text-foreground">{faction.home_base}</span></p>
        )}
        {faction.founded && (
          <p className="text-sm text-muted-foreground">Founded: <span className="text-foreground">{faction.founded}</span></p>
        )}
        {faction.member_count && (
          <p className="text-sm text-muted-foreground">Members: <span className="text-foreground">{faction.member_count}</span></p>
        )}
        {faction.leader_names.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Leader{faction.leader_names.length > 1 ? "s" : ""}: <span className="text-foreground">{faction.leader_names.join(", ")}</span>
          </p>
        )}
        {faction.allegiances.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Allies: <span className="text-foreground">{faction.allegiances.join(", ")}</span>
          </p>
        )}
        {faction.enemies.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Enemies: <span className="text-foreground">{faction.enemies.join(", ")}</span>
          </p>
        )}
        {faction.public_info && (
          <p className="text-sm text-foreground/80 leading-relaxed pt-1">{faction.public_info}</p>
        )}
      </div>

      {members.length > 0 && (
        <SectionFrame title="Members" eyebrow="Roster">
          <StackedList>
            {members.map((npc) => (
              <Link
                key={npc.id}
                href={`/player/campaigns/${campaignId}/npcs/${npc.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
              >
                <Portrait src={npc.portrait_url} alt={npc.name} className="h-8 w-8 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">{npc.name}</span>
                </div>
                {npc.disposition && (
                  <Badge variant="outline" className="shrink-0 text-xs">{npc.disposition}</Badge>
                )}
              </Link>
            ))}
          </StackedList>
        </SectionFrame>
      )}
    </div>
  );
}
