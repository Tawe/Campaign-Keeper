import { notFound, redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toSession, toThread } from "@/lib/firebase/converters";
import { SESSIONS_COL, THREADS_COL, NPC_MENTIONS_COL, POLL_RESPONSES_COL, PLAYERS_COL } from "@/lib/firebase/db";
import { generatePlayerRecap, generateDmRecap } from "@/lib/recap";
import { CopyShareLinkButton } from "@/components/sessions/CopyShareLinkButton";
import { RecapTabs } from "@/components/sessions/RecapTabs";
import { SessionDetails } from "@/components/sessions/SessionDetails";
import { DmReflectionView } from "@/components/sessions/DmReflectionView";
import { SessionActions } from "@/components/sessions/SessionActions";
import { PollResults } from "@/components/polls/PollResults";
import { MetaStrip, SectionFrame } from "@/components/shared/editorial";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateShort } from "@/lib/utils";
import type { NpcMentionWithNpc, Npc, PollResponse } from "@/types";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; sessionId: string }>;
}) {
  const { campaignId, sessionId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const db = adminDb();

  const [sessionDoc, threadsSnap, mentionsSnap, pollSnap, playersSnap] = await Promise.all([
    db.collection(SESSIONS_COL).doc(sessionId).get(),
    db.collection(THREADS_COL).where("sessionId", "==", sessionId).orderBy("createdAt").get(),
    db.collection(NPC_MENTIONS_COL).where("sessionId", "==", sessionId).get(),
    db.collection(POLL_RESPONSES_COL).where("sessionId", "==", sessionId).orderBy("createdAt", "desc").get(),
    db.collection(PLAYERS_COL).where("campaignId", "==", campaignId).get(),
  ]);

  if (!sessionDoc.exists) notFound();
  const session = toSession(sessionDoc);
  if (session.campaign_id !== campaignId) notFound();

  const threads = threadsSnap.docs.map(toThread);

  // Build NpcMentionWithNpc from denormalized mention docs
  const mentions: NpcMentionWithNpc[] = mentionsSnap.docs.map((doc) => {
    const d = doc.data();
    const fakeNpc: Npc = {
      id: d.npcId,
      campaign_id: campaignId,
      name: d.npcName,
      disposition: d.npcDisposition ?? null,
      portrait_url: null,
      stats_link: null,
      status: null,
      last_scene: null,
      public_info: null,
      private_notes: null,
      created_at: "",
      updated_at: "",
    };
    return {
      id: doc.id,
      npc_id: d.npcId,
      session_id: sessionId,
      visibility: d.visibility,
      note: d.note ?? null,
      created_at: d.createdAt?.toDate?.()?.toISOString() ?? "",
      npc: fakeNpc,
    };
  });

  const pollResponses: PollResponse[] = pollSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      session_id: d.sessionId,
      campaign_id: d.campaignId,
      player_name: d.playerName ?? null,
      enjoyment: d.enjoyment,
      liked: d.liked ?? "",
      improve: d.improve ?? "",
      looking_forward: d.lookingForward ?? "",
      created_at: d.createdAt?.toDate?.()?.toISOString() ?? "",
    };
  });

  // Build charNameLower → { playerName, playerId } for display in session details
  const characterOwners = new Map<string, { playerName: string; playerId: string }>();
  playersSnap.docs.forEach((doc) => {
    const d = doc.data();
    ((d.characters ?? []) as { name: string }[]).forEach((c) => {
      characterOwners.set(c.name.toLowerCase(), { playerName: d.name as string, playerId: doc.id });
    });
  });

  const playerRecap = generatePlayerRecap(session, threads, mentions);
  const dmRecap = generateDmRecap(session, threads, mentions);

  const title = session.title
    ? `${session.title} — ${formatDateShort(session.date)}`
    : formatDateShort(session.date);

  return (
    <div className="reading-shell space-y-6">
      <PageHeader
        title={title}
        eyebrow="Session Record"
        backHref={`/campaigns/${campaignId}`}
        backLabel="Dashboard"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <MetaStrip
          className="flex-1"
          items={[
            formatDateShort(session.date),
            ...session.tags.map((tag) => <Badge key={tag} variant="secondary" className="font-normal normal-case tracking-[0.08em]">{tag}</Badge>),
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <CopyShareLinkButton sessionId={sessionId} />
          <SessionActions sessionId={sessionId} campaignId={campaignId} />
        </div>
      </div>
      <RecapTabs playerRecap={playerRecap} dmRecap={dmRecap} />

      <Separator className="my-8" />

      <SectionFrame
        title="Session Details"
        eyebrow="Reference"
        description="Quick world-state notes captured during session logging."
      >
        <SessionDetails session={session} characterOwners={characterOwners} />
      </SectionFrame>

      {session.dm_reflection && (
        <>
          <Separator className="my-8" />
          <DmReflectionView reflection={session.dm_reflection} />
        </>
      )}

      <Separator className="my-8" />

      <SectionFrame
        title="Player Feedback"
        eyebrow="Table Pulse"
        description="Post-session responses from the players who filled out the feedback prompt."
      >
        <PollResults responses={pollResponses} />
      </SectionFrame>
    </div>
  );
}
