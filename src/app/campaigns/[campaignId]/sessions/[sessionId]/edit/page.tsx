import { notFound, redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toSession, toNpc } from "@/lib/firebase/converters";
import { SESSIONS_COL, THREADS_COL, NPC_MENTIONS_COL, NPCS_COL, PLAYERS_COL, LOCATIONS_COL } from "@/lib/firebase/db";
import { SessionForm } from "@/components/sessions/SessionForm";
import { PageHeader } from "@/components/shared/PageHeader";
import type { SessionFormInitialValues } from "@/components/sessions/SessionForm";
import type { NpcDisposition, Visibility } from "@/types";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ campaignId: string; sessionId: string }>;
}) {
  const { campaignId, sessionId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const db = adminDb();

  const [sessionDoc, threadsSnap, mentionsSnap, npcsSnap, playersSnap, locationsSnap] = await Promise.all([
    db.collection(SESSIONS_COL).doc(sessionId).get(),
    db.collection(THREADS_COL).where("sessionId", "==", sessionId).orderBy("createdAt").get(),
    db.collection(NPC_MENTIONS_COL).where("sessionId", "==", sessionId).get(),
    db.collection(NPCS_COL).where("campaignId", "==", campaignId).orderBy("name").get(),
    db.collection(PLAYERS_COL).where("campaignId", "==", campaignId).get(),
    db.collection(LOCATIONS_COL).where("campaignId", "==", campaignId).orderBy("name").get(),
  ]);

  if (!sessionDoc.exists) notFound();
  const session = toSession(sessionDoc);
  if (session.campaign_id !== campaignId || sessionDoc.data()?.userId !== user.uid) notFound();

  const existingNpcs = npcsSnap.docs.map(toNpc);
  const existingPlayers = playersSnap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name as string,
    characters: ((doc.data().characters ?? []) as { name: string }[]).map((c) => ({ name: c.name })),
  }));
  const existingLocationNames = locationsSnap.docs.map((doc) => doc.data().name as string);

  const r = session.dm_reflection;
  const initialValues: SessionFormInitialValues = {
    date: session.date,
    title: session.title ?? "",
    startingLocation: session.starting_location ?? "",
    timePassed: session.time_passed ?? "",
    characters: session.characters.length > 0
      ? session.characters.map((c) => ({ name: c.name, statusAtEnd: c.status_at_end }))
      : [{ name: "", statusAtEnd: "" }],
    npcs: (() => {
      // Build a name→statusAtEnd map from session.npc_statuses
      const statusMap = new Map<string, string>();
      session.npc_statuses.forEach((s) => statusMap.set(s.name.toLowerCase(), s.status_at_end));

      // Start with mention rows (they carry disposition/visibility/note)
      const mentionRows = mentionsSnap.docs.map((doc) => {
        const d = doc.data();
        const name = d.npcName as string;
        return {
          name,
          disposition: (d.npcDisposition ?? "") as NpcDisposition | "",
          visibility: d.visibility as Visibility,
          mentionNote: (d.note ?? "") as string,
          statusAtEnd: statusMap.get(name.toLowerCase()) ?? "",
        };
      });

      // Add any npc_statuses entries not already covered by a mention
      const mentionNames = new Set(mentionRows.map((r) => r.name.toLowerCase()));
      const extraRows = session.npc_statuses
        .filter((s) => !mentionNames.has(s.name.toLowerCase()))
        .map((s) => ({
          name: s.name,
          disposition: "" as NpcDisposition | "",
          visibility: "public" as Visibility,
          mentionNote: "",
          statusAtEnd: s.status_at_end,
        }));

      const rows = [...mentionRows, ...extraRows];
      return rows.length > 0
        ? rows
        : [{ name: "", disposition: "" as NpcDisposition | "", visibility: "public" as Visibility, mentionNote: "", statusAtEnd: "" }];
    })(),
    locationsVisited: session.locations_visited ?? [],
    loot: session.loot,
    highlights: session.public_highlights.length > 0 ? session.public_highlights : ["", "", ""],
    privateNotes: session.private_notes,
    tags: session.tags,
    threads: threadsSnap.docs.map((doc) => {
      const d = doc.data();
      return { text: d.text as string, visibility: d.visibility as Visibility };
    }),
    dmReflection: {
      plotAdvancement: r?.plot_advancement ?? null,
      keyEvents: r?.key_events.length ? r.key_events : [""],
      mostEngaged: r?.most_engaged.length ? r.most_engaged : [""],
      leastEngaged: r?.least_engaged.length ? r.least_engaged : [""],
      memorableMoments: r?.memorable_moments.length ? r.memorable_moments : [""],
      combatDifficulty: r?.combat_difficulty ?? null,
      combatBalanceIssues: r?.combat_balance_issues ?? "",
      pacing: r?.pacing ?? "",
      whereSlowedDown: r?.where_slowed_down ?? "",
      nextSessionPrep: r?.next_session_prep ?? "",
      personalReflection: r?.personal_reflection ?? "",
    },
  };

  return (
    <div className="reading-shell">
      <PageHeader
        title="Edit session"
        eyebrow="Revision"
        backHref={`/campaigns/${campaignId}/sessions/${sessionId}`}
        backLabel="Session"
      />
      <SessionForm
        campaignId={campaignId}
        existingNpcs={existingNpcs}
        existingPlayers={existingPlayers}
        existingLocationNames={existingLocationNames}
        sessionId={sessionId}
        initialValues={initialValues}
      />
    </div>
  );
}
