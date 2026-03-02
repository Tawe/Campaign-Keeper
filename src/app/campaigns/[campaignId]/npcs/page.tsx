import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toNpc } from "@/lib/firebase/converters";
import { NPCS_COL, NPC_MENTIONS_COL, SESSIONS_COL } from "@/lib/firebase/db";
import { NpcIndex } from "@/components/npcs/NpcIndex";
import { EmptyState } from "@/components/shared/EmptyState";
import { MetaStrip } from "@/components/shared/editorial";
import { PageHeader } from "@/components/shared/PageHeader";
import type { NpcWithLastMention } from "@/types";

export default async function NpcsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const db = adminDb();

  const [npcsSnap, sessionsSnap] = await Promise.all([
    db.collection(NPCS_COL).where("campaignId", "==", campaignId).orderBy("name").get(),
    db.collection(SESSIONS_COL).where("campaignId", "==", campaignId).orderBy("date", "desc").get(),
  ]);

  const sessions = sessionsSnap.docs.map((doc) => ({
    id: doc.id,
    date: doc.data().date as string,
  }));

  // Fetch mentions in batches to compute last_mentioned per NPC
  const npcMap = new Map<string, NpcWithLastMention>();
  npcsSnap.docs.forEach((doc) => {
    const npc = toNpc(doc);
    npcMap.set(doc.id, {
      ...npc,
      last_mentioned: "",
      last_session_id: "",
    });
  });

  if (sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.id);
    for (let i = 0; i < sessionIds.length; i += 30) {
      const chunk = sessionIds.slice(i, i + 30);
      const mentionsSnap = await db
        .collection(NPC_MENTIONS_COL)
        .where("sessionId", "in", chunk)
        .get();

      mentionsSnap.docs.forEach((doc) => {
        const d = doc.data();
        const existing = npcMap.get(d.npcId);
        if (!existing) return;
        const sessionDate = sessions.find((s) => s.id === d.sessionId)?.date ?? "";
        if (!existing.last_mentioned || sessionDate > existing.last_mentioned) {
          npcMap.set(d.npcId, {
            ...existing,
            last_mentioned: sessionDate,
            last_session_id: d.sessionId,
          });
        }
      });
    }
  }

  const npcs = Array.from(npcMap.values()).sort(
    (a, b) => b.last_mentioned.localeCompare(a.last_mentioned)
  );

  return (
    <div className="page-shell max-w-4xl">
      <PageHeader
        title="NPCs"
        eyebrow="Cast Index"
        backHref={`/campaigns/${campaignId}`}
        backLabel="Dashboard"
      />
      <div className="mb-6">
        <MetaStrip
          items={[
            `${npcs.length} NPC${npcs.length === 1 ? "" : "s"}`,
            npcs.some((npc) => npc.stats_link || npc.portrait_url)
              ? "Portraits and stat links supported"
              : "Add portraits and stat links from each NPC page",
          ]}
        />
      </div>
      {npcs.length === 0 ? (
        <EmptyState
          title="No NPCs recorded yet"
          description="NPCs appear here once they are mentioned in session notes. From each NPC page you can add portraits and stat links."
        />
      ) : (
        <NpcIndex npcs={npcs} campaignId={campaignId} />
      )}
    </div>
  );
}
