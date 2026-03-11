import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/session";
import { getFactionWithCampaignData, getNpcsInFaction } from "@/domains/factions/queries";
import { getEventsForFaction } from "@/domains/events/queries";
import { EventCard } from "@/domains/events/components/EventCard";
import { updateFactionInfo } from "@/domains/factions/actions";
import { FactionDeleteActions } from "@/domains/factions/components/FactionDeleteActions";
import { PageHeader } from "@/components/shared/PageHeader";
import { InlineEditor } from "@/components/shared/InlineEditor";
import { InlineInputEditor } from "@/components/shared/InlineInputEditor";
import { SectionFrame, StackedList } from "@/components/shared/editorial";
import { Badge } from "@/components/ui/badge";
import { Portrait } from "@/components/shared/Portrait";

export default async function FactionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string; factionId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { campaignId, factionId } = await params;
  const { from } = await searchParams;
  const fromVault = from === "vault";
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const faction = await getFactionWithCampaignData(factionId, campaignId);
  if (!faction) notFound();

  const [members, events] = await Promise.all([
    getNpcsInFaction(campaignId, faction.name),
    getEventsForFaction(campaignId, factionId),
  ]);

  return (
    <div className="reading-shell space-y-6">
      <PageHeader
        title={faction.name}
        eyebrow="Faction"
        backHref={fromVault ? "/app/factions" : `/campaigns/${campaignId}/factions`}
        backLabel={fromVault ? "Vault" : "Factions"}
        action={<FactionDeleteActions factionId={factionId} campaignId={campaignId} fromVault={fromVault} />}
      />

      {/* Meta badges */}
      {(faction.faction_type || faction.influence || faction.alignment || faction.status) && (
        <div className="flex flex-wrap gap-1.5">
          {faction.faction_type && <Badge variant="secondary">{faction.faction_type}</Badge>}
          {faction.influence && <Badge variant="outline">{faction.influence}</Badge>}
          {faction.alignment && <Badge variant="outline">{faction.alignment}</Badge>}
          {faction.status && <Badge variant="outline">{faction.status}</Badge>}
        </div>
      )}

      {/* Core attributes */}
      <div className="grid grid-cols-2 gap-3">
        <InlineInputEditor
          label="Type"
          value={faction.faction_type}
          placeholder="Religion, Military, Criminal…"
          action={updateFactionInfo.bind(null, factionId, campaignId, "factionType")}
        />
        <InlineInputEditor
          label="Influence"
          value={faction.influence}
          placeholder="Local, Regional, Global…"
          action={updateFactionInfo.bind(null, factionId, campaignId, "influence")}
        />
        <InlineInputEditor
          label="Alignment"
          value={faction.alignment}
          placeholder="Neutral Evil…"
          action={updateFactionInfo.bind(null, factionId, campaignId, "alignment")}
        />
        <InlineInputEditor
          label="Status"
          value={faction.status}
          placeholder="Active, Defunct…"
          action={updateFactionInfo.bind(null, factionId, campaignId, "status")}
        />
        <InlineInputEditor
          label="Founded"
          value={faction.founded}
          placeholder="1358 DR…"
          action={updateFactionInfo.bind(null, factionId, campaignId, "founded")}
        />
        <InlineInputEditor
          label="Disbanded"
          value={faction.disbanded}
          placeholder="1372 DR…"
          action={updateFactionInfo.bind(null, factionId, campaignId, "disbanded")}
        />
        <InlineInputEditor
          label="Members"
          value={faction.member_count}
          placeholder="12,000…"
          action={updateFactionInfo.bind(null, factionId, campaignId, "memberCount")}
        />
        <InlineInputEditor
          label="Home base"
          value={faction.home_base}
          placeholder="Waterdeep…"
          action={updateFactionInfo.bind(null, factionId, campaignId, "homeBase")}
        />
      </div>

      {/* People & relations */}
      <div className="space-y-3">
        <InlineInputEditor
          label="Leaders"
          value={faction.leader_names.length > 0 ? faction.leader_names.join(", ") : null}
          placeholder="Comma-separated names…"
          action={updateFactionInfo.bind(null, factionId, campaignId, "leaderNames")}
        />
        <InlineInputEditor
          label="Allegiances"
          value={faction.allegiances.length > 0 ? faction.allegiances.join(", ") : null}
          placeholder="Allied factions, comma-separated…"
          action={updateFactionInfo.bind(null, factionId, campaignId, "allegiances")}
        />
        <InlineInputEditor
          label="Enemies"
          value={faction.enemies.length > 0 ? faction.enemies.join(", ") : null}
          placeholder="Enemy factions, comma-separated…"
          action={updateFactionInfo.bind(null, factionId, campaignId, "enemies")}
        />
      </div>

      {/* Notes */}
      <div className="space-y-3">
        <InlineEditor
          label="What players know"
          value={faction.public_info}
          placeholder="Add public information about this faction…"
          action={updateFactionInfo.bind(null, factionId, campaignId, "publicInfo")}
        />
        <InlineEditor
          label="DM notes"
          value={faction.private_notes}
          placeholder="Add private DM notes…"
          dmOnly
          action={updateFactionInfo.bind(null, factionId, campaignId, "privateNotes")}
        />
      </div>

      {/* Members */}
      <SectionFrame
        title="Members"
        eyebrow="Roster"
        description={`NPCs whose faction list includes ${faction.name}.`}
      >
        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No NPCs assigned to this faction yet. Set a faction on an NPC record to add them here.
          </p>
        ) : (
          <StackedList>
            {members.map((npc) => (
              <Link
                key={npc.id}
                href={`/campaigns/${campaignId}/npcs/${npc.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
              >
                <Portrait src={npc.portrait_url} alt={npc.name} className="h-8 w-8 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">{npc.name}</span>
                  {npc.status && (
                    <span className="ml-2 text-xs text-muted-foreground">{npc.status}</span>
                  )}
                </div>
                {npc.disposition && (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {npc.disposition}
                  </Badge>
                )}
              </Link>
            ))}
          </StackedList>
        )}
      </SectionFrame>

      {/* Events */}
      <SectionFrame
        title="Events"
        eyebrow="World History"
        description={`Major events involving ${faction.name}.`}
      >
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events linked yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <EventCard key={event.id} event={event} campaignId={campaignId} />
            ))}
          </div>
        )}
      </SectionFrame>
    </div>
  );
}
