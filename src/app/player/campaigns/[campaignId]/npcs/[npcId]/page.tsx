import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import { ExternalLink, User } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import { getNpcWithCampaignData, getNpcMentionHistory } from "@/domains/npcs/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionFrame, StackedList } from "@/components/shared/editorial";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import type { NpcDisposition } from "@/types";
import Link from "next/link";

const dispositionColors: Record<string, string> = {
  ally: "bg-public/80 text-[var(--public-foreground)] border-transparent",
  enemy: "bg-destructive/15 text-destructive border-transparent",
  neutral: "bg-secondary text-secondary-foreground border-transparent",
  unknown: "bg-muted text-muted-foreground border-transparent",
};

export default async function PlayerNpcDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; npcId: string }>;
}) {
  const { campaignId, npcId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [npc, history] = await Promise.all([
    getNpcWithCampaignData(npcId, campaignId),
    getNpcMentionHistory(npcId, campaignId),
  ]);
  if (!npc) notFound();

  const { mentionsSnap, sessionMap } = history;
  const publicMentions = mentionsSnap.docs.filter((d) => d.data().visibility === "public");

  const identityParts = [npc.race, npc.sex, npc.age ? `Age ${npc.age}` : null, npc.alignment].filter(Boolean) as string[];
  const classDisplay = npc.npc_class.length > 0
    ? npc.npc_class.map((c) => `${c.name} ${c.level}`).join(" / ")
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={npc.name}
        eyebrow="NPC"
        backHref={`/player/campaigns/${campaignId}/npcs`}
        backLabel="NPCs"
      />

      <div className="paper-panel space-y-4 px-5 py-5 sm:px-6">
        <div className="flex gap-4">
          {npc.portrait_url ? (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
              <Image src={npc.portrait_url} alt={npc.name} fill unoptimized className="object-cover" />
            </div>
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-muted">
              <User className="h-10 w-10 text-muted-foreground/30" />
            </div>
          )}
          <div className="space-y-2">
            {npc.disposition && (
              <Badge variant="outline" className={dispositionColors[npc.disposition as NpcDisposition] ?? ""}>
                {npc.disposition}
              </Badge>
            )}
            {identityParts.length > 0 && (
              <p className="text-sm text-muted-foreground">{identityParts.join(" · ")}</p>
            )}
            {classDisplay && (
              <p className="text-sm text-muted-foreground">{classDisplay}</p>
            )}
            {npc.faction_names.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {npc.faction_names.map((name) => (
                  <Badge key={name} variant="secondary" className="text-xs font-normal">{name}</Badge>
                ))}
              </div>
            )}
            {npc.stats_link && (
              <a
                href={npc.stats_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
              >
                Stats <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {npc.public_info && (
          <p className="text-sm text-foreground/80 leading-relaxed">{npc.public_info}</p>
        )}
      </div>

      {publicMentions.length > 0 && (
        <SectionFrame title="Session Appearances" eyebrow="History">
          <StackedList>
            {publicMentions.map((doc) => {
              const d = doc.data();
              const session = sessionMap.get(d.sessionId);
              return (
                <div key={doc.id} className="space-y-0.5 px-4 py-3">
                  {session ? (
                    <Link
                      href={`/player/campaigns/${campaignId}/sessions/${session.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {session.title ?? "Untitled session"}{" "}
                      <span className="text-muted-foreground font-normal">({formatDateShort(session.date)})</span>
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unknown session</span>
                  )}
                  {d.note && <p className="text-sm text-muted-foreground">{d.note}</p>}
                </div>
              );
            })}
          </StackedList>
        </SectionFrame>
      )}
    </div>
  );
}
