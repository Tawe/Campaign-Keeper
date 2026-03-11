import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getSessionWithDetails } from "@/domains/sessions/queries";
import { getCampaignPlayers } from "@/domains/players/queries";
import { getEventsForSession } from "@/domains/events/queries";
import { EventCard } from "@/domains/events/components/EventCard";
import { generatePlayerRecap, generateDmRecap } from "@/lib/recap";
import { CopyShareLinkButton } from "@/domains/sessions/components/CopyShareLinkButton";
import { RecapTabs } from "@/domains/sessions/components/RecapTabs";
import { SessionDetails } from "@/domains/sessions/components/SessionDetails";
import { DmReflectionView } from "@/domains/sessions/components/DmReflectionView";
import { SessionActions } from "@/domains/sessions/components/SessionActions";
import { PollResults } from "@/domains/polls/components/PollResults";
import { MetaStrip, SectionFrame } from "@/components/shared/editorial";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateShort } from "@/lib/utils";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; sessionId: string }>;
}) {
  const { campaignId, sessionId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [data, players, events] = await Promise.all([
    getSessionWithDetails(sessionId, campaignId),
    getCampaignPlayers(campaignId),
    getEventsForSession(campaignId, sessionId),
  ]);

  if (!data) notFound();

  const { session, threads, mentions, pollResponses } = data;

  // Build charNameLower → { playerName, playerId } for display in session details
  const characterOwners = new Map<string, { playerName: string; playerId: string }>();
  players.forEach((player) => {
    player.characters.forEach((c) => {
      characterOwners.set(c.name.toLowerCase(), { playerName: player.name, playerId: player.id });
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
        title="Events"
        eyebrow="World History"
        description="Major events that occurred during this session."
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
