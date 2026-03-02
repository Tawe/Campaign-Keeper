import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toCampaign, toSession, toThread } from "@/lib/firebase/converters";
import { CAMPAIGNS_COL, SESSIONS_COL, THREADS_COL, NPC_MENTIONS_COL, PLAYERS_COL, LOCATIONS_COL } from "@/lib/firebase/db";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { MetaStrip, SectionFrame, StackedList } from "@/components/shared/editorial";
import { SessionCard } from "@/components/sessions/SessionCard";
import { ThreadList } from "@/components/threads/ThreadList";
import { NpcIndex } from "@/components/npcs/NpcIndex";
import { DeleteCampaignButton } from "@/components/campaigns/DeleteCampaignButton";
import type { NpcWithLastMention } from "@/types";

export default async function CampaignDashboardPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const db = adminDb();

  const [campaignDoc, sessionsSnap, threadsSnap, playersSnap, locationsSnap] = await Promise.all([
    db.collection(CAMPAIGNS_COL).doc(campaignId).get(),
    db.collection(SESSIONS_COL).where("campaignId", "==", campaignId).orderBy("date", "desc").get(),
    db.collection(THREADS_COL).where("campaignId", "==", campaignId).orderBy("createdAt", "asc").get(),
    db.collection(PLAYERS_COL).where("campaignId", "==", campaignId).get(),
    db.collection(LOCATIONS_COL).where("campaignId", "==", campaignId).get(),
  ]);

  if (!campaignDoc.exists || campaignDoc.data()?.userId !== user.uid) notFound();

  const campaign = toCampaign(campaignDoc);
  const sessions = sessionsSnap.docs.map(toSession);
  const threads = threadsSnap.docs.map(toThread);
  const openThreads = threads.filter((t) => t.status === "open");
  const playerCount = playersSnap.size;
  const locationCount = locationsSnap.size;

  // Build NPC index from mentions (denormalized npcName/npcDisposition in mention docs)
  const npcMap = new Map<string, NpcWithLastMention>();

  if (sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.id);
    // Fetch mentions in batches of 30 (Firestore 'in' limit)
    for (let i = 0; i < sessionIds.length; i += 30) {
      const chunk = sessionIds.slice(i, i + 30);
      const mentionsSnap = await db
        .collection(NPC_MENTIONS_COL)
        .where("sessionId", "in", chunk)
        .get();

      mentionsSnap.docs.forEach((doc) => {
        const d = doc.data();
        const existing = npcMap.get(d.npcId);
        const sessionDate = sessions.find((s) => s.id === d.sessionId)?.date ?? "";
        if (!existing || sessionDate > existing.last_mentioned) {
          npcMap.set(d.npcId, {
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
    <div className="page-shell max-w-4xl space-y-6">
      <PageHeader
        title={campaign.name}
        eyebrow="Campaign Record"
        subtitle={[campaign.system, campaign.participants.join(", ")]
          .filter(Boolean)
          .join(" · ")}
        backHref="/"
        backLabel="Campaigns"
        action={
          <>
            <DeleteCampaignButton campaignId={campaignId} campaignName={campaign.name} />
            <Button asChild variant="outline" size="icon">
              <Link href={`/campaigns/${campaignId}/search`} aria-label="Search">
                <Search className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/campaigns/${campaignId}/sessions/new`}>
                <Plus className="h-4 w-4 mr-1" /> Log session
              </Link>
            </Button>
          </>
        }
      />
      <MetaStrip
        items={[
          campaign.system || null,
          `${sessions.length} session${sessions.length === 1 ? "" : "s"}`,
          `${openThreads.length} open thread${openThreads.length === 1 ? "" : "s"}`,
          `${npcs.length} NPC${npcs.length === 1 ? "" : "s"}`,
          `${playerCount} player${playerCount === 1 ? "" : "s"}`,
          `${locationCount} location${locationCount === 1 ? "" : "s"}`,
        ]}
      />

      <SectionFrame
        title="Sessions"
        eyebrow="Timeline"
        description="Reverse-chronological session history with the recap and tags you will actually need before the next game."
      >
        {sessions.length === 0 ? (
          <EmptyState
            title="No sessions yet"
            description="Log your first session to get started."
            actionLabel="Log session"
            actionHref={`/campaigns/${campaignId}/sessions/new`}
          />
        ) : (
          <StackedList>
            {sessions.map((session, i) => (
              <SessionCard
                key={session.id}
                session={session}
                campaignId={campaignId}
                index={sessions.length - i}
              />
            ))}
          </StackedList>
        )}
      </SectionFrame>

      <SectionFrame
        title="Open Threads"
        eyebrow="Continuity"
        description="Unresolved hooks stay visible here so the campaign never loses momentum."
        tone="inset"
      >
        {openThreads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open threads.</p>
        ) : (
          <ThreadList threads={openThreads} campaignId={campaignId} />
        )}
      </SectionFrame>

      <SectionFrame
        title="NPCs"
        eyebrow="Cast"
        description="Recent names, dispositions, and last mention dates at a glance."
        action={npcs.length > 0 ? (
          <Link
            href={`/campaigns/${campaignId}/npcs`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            View all
          </Link>
        ) : undefined}
      >
        {npcs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No NPCs recorded yet.</p>
        ) : (
          <NpcIndex npcs={npcs} campaignId={campaignId} />
        )}
      </SectionFrame>

      <SectionFrame
        title="Locations"
        eyebrow="World State"
        tone="inset"
        action={
          <Link
            href={`/campaigns/${campaignId}/locations`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {locationCount === 0 ? "Add locations" : `${locationCount} location${locationCount === 1 ? "" : "s"}`}
          </Link>
        }
      >
        {locationCount === 0 ? (
          <p className="text-sm text-muted-foreground">No locations recorded yet. Add locations by listing them in session notes.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {locationCount} location{locationCount === 1 ? "" : "s"} discovered.{" "}
            <Link href={`/campaigns/${campaignId}/locations`} className="underline underline-offset-2 hover:text-foreground transition-colors">
              View all →
            </Link>
          </p>
        )}
      </SectionFrame>

      <SectionFrame
        title="Players"
        eyebrow="Roster"
        tone="inset"
        action={
          <Link
            href={`/campaigns/${campaignId}/players`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {playerCount === 0 ? "Add players" : `${playerCount} player${playerCount === 1 ? "" : "s"}`}
          </Link>
        }
      >
        {playerCount === 0 ? (
          <p className="text-sm text-muted-foreground">No players added yet.</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {playerCount} player{playerCount === 1 ? "" : "s"} in the roster.{" "}
            <Link href={`/campaigns/${campaignId}/players`} className="underline underline-offset-2 hover:text-foreground transition-colors">
              View roster →
            </Link>
          </p>
        )}
      </SectionFrame>
    </div>
  );
}
