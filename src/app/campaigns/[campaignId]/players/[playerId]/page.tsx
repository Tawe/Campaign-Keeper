import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toPlayer } from "@/lib/firebase/converters";
import { PLAYERS_COL, SESSIONS_COL } from "@/lib/firebase/db";
import { Portrait } from "@/components/shared/Portrait";
import { MetaStrip, SectionFrame, StackedList } from "@/components/shared/editorial";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { formatDateShort } from "@/lib/utils";

export default async function PlayerDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; playerId: string }>;
}) {
  const { campaignId, playerId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const db = adminDb();

  const [playerDoc, sessionsSnap] = await Promise.all([
    db.collection(PLAYERS_COL).doc(playerId).get(),
    db.collection(SESSIONS_COL).where("campaignId", "==", campaignId).orderBy("date", "desc").get(),
  ]);

  if (!playerDoc.exists || playerDoc.data()?.userId !== user.uid) notFound();
  const player = toPlayer(playerDoc);
  if (player.campaign_id !== campaignId) notFound();

  // Build per-character session list from session docs
  const sessions = sessionsSnap.docs.map((doc) => ({
    id: doc.id,
    date: doc.data().date as string,
    title: (doc.data().title ?? null) as string | null,
    characters: (doc.data().characters ?? []) as { name: string; statusAtEnd: string }[],
  }));

  const charSessionMap = new Map<
    string,
    { id: string; date: string; title: string | null; statusAtEnd: string }[]
  >();
  for (const char of player.characters) {
    charSessionMap.set(char.name.toLowerCase(), []);
  }
  for (const session of sessions) {
    for (const sc of session.characters) {
      const key = sc.name.toLowerCase();
      if (charSessionMap.has(key)) {
        charSessionMap.get(key)!.push({
          id: session.id,
          date: session.date,
          title: session.title,
          statusAtEnd: sc.statusAtEnd,
        });
      }
    }
  }

  return (
    <div className="reading-shell space-y-6">
      <PageHeader
        title={player.name}
        eyebrow="Player Record"
        backHref={`/campaigns/${campaignId}/players`}
        backLabel="Players"
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/campaigns/${campaignId}/players/${playerId}/edit`}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Link>
          </Button>
        }
      />
      <div className="paper-panel px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Portrait src={player.portrait_url} alt={player.name} className="h-28 w-28 shrink-0" />
          <MetaStrip
            className="flex-1"
            items={[
              `${player.characters.length} character${player.characters.length === 1 ? "" : "s"}`,
              player.characters.some((char) => char.stats_link) ? "Includes sheet links" : "No sheet links yet",
            ]}
          />
        </div>
      </div>

      {player.characters.length === 0 ? (
        <p className="text-sm text-muted-foreground">No characters assigned yet.</p>
      ) : (
        <div className="space-y-8">
          {player.characters.map((char) => {
            const charSessions = charSessionMap.get(char.name.toLowerCase()) ?? [];
            const meta = [char.class, char.race, char.level ? `Lvl ${char.level}` : null]
              .filter(Boolean)
              .join(" · ");
            return (
              <SectionFrame
                key={char.name}
                title={char.name}
                eyebrow="Character"
                description={meta || undefined}
                action={char.stats_link ? (
                  <a
                    href={char.stats_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
                  >
                    Open stats
                    <ExternalLink className="h-4 w-4" />
                  </a>
                ) : undefined}
              >
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sessions
                </h3>
                {charSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
                ) : (
                  <StackedList>
                    {charSessions.map((session) => (
                      <Link
                        key={session.id}
                        href={`/campaigns/${campaignId}/sessions/${session.id}`}
                        className="block px-4 py-3 text-sm font-medium transition-colors hover:bg-accent/45"
                      >
                        {session.title ?? "Untitled session"}{" "}
                        <span className="text-muted-foreground font-normal">
                          ({formatDateShort(session.date)})
                        </span>
                        {session.statusAtEnd && (
                          <span className="ml-2 text-xs text-muted-foreground font-normal">
                            — {session.statusAtEnd}
                          </span>
                        )}
                      </Link>
                    ))}
                  </StackedList>
                )}
              </SectionFrame>
            );
          })}
        </div>
      )}
    </div>
  );
}
