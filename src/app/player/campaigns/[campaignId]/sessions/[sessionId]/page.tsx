import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getSessionWithDetails } from "@/domains/sessions/queries";
import { getEventsForSession } from "@/domains/events/queries";
import { EventCard } from "@/domains/events/components/EventCard";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SectionFrame, MetaStrip } from "@/components/shared/editorial";
import { PageHeader } from "@/components/shared/PageHeader";
import { formatDateShort } from "@/lib/utils";

export default async function PlayerSessionDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; sessionId: string }>;
}) {
  const { campaignId, sessionId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [data, events] = await Promise.all([
    getSessionWithDetails(sessionId, campaignId),
    getEventsForSession(campaignId, sessionId),
  ]);
  if (!data) notFound();

  const { session, threads, mentions } = data;

  const publicThreads = threads.filter((t) => t.visibility === "public");
  const publicMentions = mentions.filter((m) => m.visibility === "public");

  const title = session.title
    ? `${session.title} — ${formatDateShort(session.date)}`
    : formatDateShort(session.date);

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        eyebrow="Session"
        backHref={`/player/campaigns/${campaignId}/sessions`}
        backLabel="Sessions"
      />

      <MetaStrip
        items={[
          ...(session.in_game_date
            ? [`Year ${session.in_game_date.year}, Day ${session.in_game_date.day}`]
            : []),
          formatDateShort(session.date),
          ...session.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal normal-case tracking-[0.08em]">
              {tag}
            </Badge>
          )),
        ]}
      />

      {session.characters.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Characters:{" "}
          <span className="text-foreground">
            {session.characters.map((c) => c.name).join(", ")}
          </span>
        </p>
      )}

      {session.public_highlights.length > 0 && (
        <>
          <Separator />
          <SectionFrame title="Session Highlights" eyebrow="Recap">
            <ul className="space-y-2">
              {session.public_highlights.map((highlight, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </SectionFrame>
        </>
      )}

      {publicMentions.length > 0 && (
        <>
          <Separator />
          <SectionFrame title="NPCs Encountered" eyebrow="Cast">
            <div className="space-y-1">
              {publicMentions.map((mention) => (
                <div key={mention.id} className="flex items-start gap-2 text-sm">
                  <span className="font-medium">{mention.npc.name}</span>
                  {mention.note && (
                    <span className="text-muted-foreground">— {mention.note}</span>
                  )}
                </div>
              ))}
            </div>
          </SectionFrame>
        </>
      )}

      {publicThreads.length > 0 && (
        <>
          <Separator />
          <SectionFrame title="Story Threads" eyebrow="Threads">
            <Panel className="divide-y divide-border overflow-hidden">
              {publicThreads.map((thread) => (
                <div key={thread.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
                  <span
                    className={`flex-1 text-sm ${thread.status === "resolved" ? "text-muted-foreground line-through" : "text-foreground"}`}
                  >
                    {thread.text}
                  </span>
                </div>
              ))}
            </Panel>
          </SectionFrame>
        </>
      )}

      {events.length > 0 && (
        <>
          <Separator />
          <SectionFrame title="Events" eyebrow="World History">
            <div className="space-y-2">
              {events.map((event) => (
                <EventCard key={event.id} event={event} campaignId={campaignId} />
              ))}
            </div>
          </SectionFrame>
        </>
      )}

      <div className="pt-6 text-center">
        <Link
          href={`/share/${session.share_token}`}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          Leave feedback on this session →
        </Link>
      </div>
    </div>
  );
}
