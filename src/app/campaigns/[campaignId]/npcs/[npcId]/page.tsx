import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import { getNpcWithCampaignData, getNpcMentionHistory } from "@/domains/npcs/queries";
import { getEventsForNpc } from "@/domains/events/queries";
import { EventCard } from "@/domains/events/components/EventCard";
import { NpcProfileEditor } from "@/domains/npcs/components/NpcProfileEditor";
import { updateNpcInfo } from "@/domains/npcs/actions";
import { InlineInputEditor } from "@/components/shared/InlineInputEditor";
import { NpcClassEditor } from "@/domains/npcs/components/NpcClassEditor";
import { MetaStrip, SectionFrame, StackedList } from "@/components/shared/editorial";
import { PageHeader } from "@/components/shared/PageHeader";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { InlineEditor } from "@/components/shared/InlineEditor";
import { Portrait } from "@/components/shared/Portrait";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import type { NpcDisposition } from "@/types";

const dispositionColors: Record<string, string> = {
  ally: "bg-public/80 text-[var(--public-foreground)] border-transparent",
  enemy: "bg-destructive/15 text-destructive border-transparent",
  neutral: "bg-secondary text-secondary-foreground border-transparent",
  unknown: "bg-muted text-muted-foreground border-transparent",
};

export default async function NpcDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string; npcId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { campaignId, npcId } = await params;
  const { from } = await searchParams;
  const fromVault = from === "vault";
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [npc, history, events] = await Promise.all([
    getNpcWithCampaignData(npcId, campaignId),
    getNpcMentionHistory(npcId, campaignId),
    getEventsForNpc(campaignId, npcId),
  ]);

  if (!npc) notFound();

  const { mentionsSnap, sessionMap } = history;

  const metCharacterMap = new Map<string, string>();
  sessionMap.forEach((session) => {
    session.characterNames.forEach((name) => {
      const key = name.toLowerCase();
      if (!metCharacterMap.has(key)) metCharacterMap.set(key, name);
    });
  });
  const metCharacters = Array.from(metCharacterMap.values()).sort((a, b) => a.localeCompare(b));

  return (
    <div className="reading-shell space-y-6">
      <PageHeader
        title={npc.name}
        eyebrow="NPC Record"
        backHref={fromVault ? "/app/npcs" : `/campaigns/${campaignId}/npcs`}
        backLabel={fromVault ? "Vault" : "NPCs"}
      />

      <div className="paper-panel space-y-5 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Portrait src={npc.portrait_url} alt={npc.name} className="h-28 w-28 shrink-0" />
          <div className="flex-1 space-y-3">
            <MetaStrip
              items={[
                npc.disposition ? (
                  <Badge
                    variant="outline"
                    className={dispositionColors[npc.disposition as NpcDisposition] ?? ""}
                  >
                    {npc.disposition}
                  </Badge>
                ) : null,
                npc.status || "No status yet",
                npc.last_scene ? `Last seen: ${npc.last_scene}` : null,
              ]}
            />
            <NpcProfileEditor npcId={npcId} campaignId={campaignId} portraitUrl={npc.portrait_url} />
          </div>
        </div>

        <InlineInputEditor
          label="Stats link"
          value={npc.stats_link}
          placeholder="Add a stat block, sheet, or reference link…"
          action={updateNpcInfo.bind(null, npcId, campaignId, "statsLink")}
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-2">
          {npc.disposition && (
            <Badge
              variant="outline"
              className={dispositionColors[npc.disposition as NpcDisposition] ?? ""}
            >
              {npc.disposition}
            </Badge>
          )}
          {npc.stats_link && (
            <a
              href={npc.stats_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
            >
              Open stats
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InlineEditor
            label="Status"
            value={npc.status}
            placeholder="Alive, captured, dead…"
            action={updateNpcInfo.bind(null, npcId, campaignId, "status")}
          />
          <InlineEditor
            label="Last seen"
            value={npc.last_scene}
            placeholder="Where they were last seen…"
            action={updateNpcInfo.bind(null, npcId, campaignId, "lastScene")}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <InlineEditor
            label="Race"
            value={npc.race}
            placeholder="Human, Elf…"
            action={updateNpcInfo.bind(null, npcId, campaignId, "race")}
          />
          <InlineEditor
            label="Sex"
            value={npc.sex}
            placeholder="Female, Male…"
            action={updateNpcInfo.bind(null, npcId, campaignId, "sex")}
          />
          <InlineEditor
            label="Age"
            value={npc.age}
            placeholder="35, 860…"
            action={updateNpcInfo.bind(null, npcId, campaignId, "age")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InlineEditor
            label="Alignment"
            value={npc.alignment}
            placeholder="Neutral Good…"
            action={updateNpcInfo.bind(null, npcId, campaignId, "alignment")}
          />
          <NpcClassEditor npcId={npcId} campaignId={campaignId} classes={npc.npc_class} />
        </div>

        <InlineEditor
          label="Factions"
          value={npc.faction_names.length > 0 ? npc.faction_names.join(", ") : null}
          placeholder="Comma-separated faction names…"
          action={updateNpcInfo.bind(null, npcId, campaignId, "factionNames")}
        />

        <div className="space-y-3">
          <InlineEditor
            label="What players know"
            value={npc.public_info}
            placeholder="Add public information about this NPC…"
            action={updateNpcInfo.bind(null, npcId, campaignId, "publicInfo")}
          />
          <InlineEditor
            label="DM notes"
            value={npc.private_notes}
            placeholder="Add private DM notes…"
            dmOnly
            action={updateNpcInfo.bind(null, npcId, campaignId, "privateNotes")}
          />
        </div>

        <SectionFrame
          title="Players Met"
          eyebrow="Party Connections"
          description="Player characters who have met this NPC."
        >
          {metCharacters.length === 0 ? (
            <p className="text-sm text-muted-foreground">No player characters recorded yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {metCharacters.map((name) => (
                <Badge key={name} variant="secondary" className="font-normal">
                  {name}
                </Badge>
              ))}
            </div>
          )}
        </SectionFrame>

        <SectionFrame
          title="Appearances"
          eyebrow="Session History"
          description="Every session where this NPC was mentioned."
        >
          {mentionsSnap.empty ? (
            <p className="text-sm text-muted-foreground">No appearances recorded.</p>
          ) : (
            <StackedList>
              {mentionsSnap.docs.map((doc) => {
                const d = doc.data();
                const session = sessionMap.get(d.sessionId);
                return (
                  <div key={doc.id} className="space-y-1 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      {session ? (
                        <Link
                          href={`/campaigns/${campaignId}/sessions/${session.id}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {session.title ?? "Untitled session"}{" "}
                          <span className="text-muted-foreground font-normal">
                            ({formatDateShort(session.date)})
                          </span>
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unknown session</span>
                      )}
                      <VisibilityBadge visibility={d.visibility} />
                    </div>
                    {d.note && (
                      <p className="text-sm text-muted-foreground">{d.note}</p>
                    )}
                  </div>
                );
              })}
            </StackedList>
          )}
        </SectionFrame>
        <SectionFrame
          title="Events"
          eyebrow="World History"
          description="Major events this NPC was involved in."
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
    </div>
  );
}
