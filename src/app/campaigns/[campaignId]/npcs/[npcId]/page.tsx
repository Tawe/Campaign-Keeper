import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toNpc, toSession } from "@/lib/firebase/converters";
import { NPCS_COL, NPC_MENTIONS_COL, SESSIONS_COL } from "@/lib/firebase/db";
import { NpcProfileEditor } from "@/components/npcs/NpcProfileEditor";
import { InlineInputEditor } from "@/components/shared/InlineInputEditor";
import { MetaStrip, SectionFrame, StackedList } from "@/components/shared/editorial";
import { PageHeader } from "@/components/shared/PageHeader";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { InlineEditor } from "@/components/shared/InlineEditor";
import { Portrait } from "@/components/shared/Portrait";
import { Badge } from "@/components/ui/badge";
import { updateNpcInfo } from "@/app/actions/npcs";
import { formatDateShort } from "@/lib/utils";
import type { NpcDisposition } from "@/types";

const dispositionColors: Record<string, string> = {
  ally: "text-green-700 border-green-300 bg-green-50",
  enemy: "text-red-700 border-red-300 bg-red-50",
  neutral: "text-blue-700 border-blue-300 bg-blue-50",
  unknown: "text-gray-600 border-gray-300 bg-gray-50",
};

export default async function NpcDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; npcId: string }>;
}) {
  const { campaignId, npcId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const db = adminDb();

  const [npcDoc, mentionsSnap] = await Promise.all([
    db.collection(NPCS_COL).doc(npcId).get(),
    db.collection(NPC_MENTIONS_COL).where("npcId", "==", npcId).orderBy("createdAt").get(),
  ]);

  if (!npcDoc.exists) notFound();
  const npc = toNpc(npcDoc);
  if (npc.campaign_id !== campaignId) notFound();

  // Fetch sessions for each mention to get date/title
  const sessionIds = [...new Set(mentionsSnap.docs.map((d) => d.data().sessionId))];
  const sessionMap = new Map<string, { id: string; date: string; title: string | null }>();

  await Promise.all(
    sessionIds.map(async (sid) => {
      const doc = await db.collection(SESSIONS_COL).doc(sid).get();
      if (doc.exists) {
        const s = toSession(doc);
        sessionMap.set(sid, { id: s.id, date: s.date, title: s.title });
      }
    })
  );

  return (
    <div className="reading-shell space-y-6">
      <PageHeader
        title={npc.name}
        eyebrow="NPC Record"
        backHref={`/campaigns/${campaignId}/npcs`}
        backLabel="NPCs"
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
      </div>
    </div>
  );
}
