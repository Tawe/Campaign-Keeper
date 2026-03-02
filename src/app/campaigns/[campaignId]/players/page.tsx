import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toPlayer } from "@/lib/firebase/converters";
import { PLAYERS_COL, SESSIONS_COL } from "@/lib/firebase/db";
import { PlayerCard } from "@/components/players/PlayerCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { MetaStrip } from "@/components/shared/editorial";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import type { Session } from "@/types";

export default async function PlayersPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const db = adminDb();

  const [playersSnap, sessionsSnap] = await Promise.all([
    db.collection(PLAYERS_COL).where("campaignId", "==", campaignId).orderBy("name").get(),
    db.collection(SESSIONS_COL).where("campaignId", "==", campaignId).orderBy("date", "desc").get(),
  ]);

  const players = playersSnap.docs.map(toPlayer);
  const sessions: Session[] = sessionsSnap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      campaign_id: d.campaignId,
      date: d.date as string,
      characters: (d.characters ?? []) as { name: string; status_at_end: string }[],
      // other fields not needed for stats
      title: null, public_highlights: [], private_notes: "", tags: [],
      starting_location: null, time_passed: null, npc_statuses: [], loot: [],
      locations_visited: [],
      dm_reflection: null, share_token: doc.id, created_at: "", updated_at: "",
    };
  });

  // Build per-character stats from session history
  type CharStats = { sessionCount: number; lastSeen: string | null; lastStatus: string | null };
  const statsMap = new Map<string, CharStats>();

  for (const session of sessions) {
    for (const sc of session.characters) {
      const key = sc.name.toLowerCase();
      const existing = statsMap.get(key);
      const isNewer = !existing?.lastSeen || session.date > existing.lastSeen;
      statsMap.set(key, {
        sessionCount: (existing?.sessionCount ?? 0) + 1,
        lastSeen: isNewer ? session.date : (existing?.lastSeen ?? null),
        lastStatus: isNewer ? sc.status_at_end : (existing?.lastStatus ?? null),
      });
    }
  }

  return (
    <div className="page-shell max-w-4xl">
      <PageHeader
        title="Players"
        eyebrow="Roster"
        backHref={`/campaigns/${campaignId}`}
        backLabel="Dashboard"
        action={
          <Button asChild size="sm">
            <Link href={`/campaigns/${campaignId}/players/new`}>
              <Plus className="h-4 w-4 mr-1" /> Add player
            </Link>
          </Button>
        }
      />
      <div className="mb-6">
        <MetaStrip
          items={[
            `${players.length} player${players.length === 1 ? "" : "s"}`,
            players.length > 0 ? "Each record can include portrait art and stat links" : "Add players and link their character sheets",
          ]}
        />
      </div>

      {players.length === 0 ? (
        <EmptyState
          title="No players yet"
          description="Build the roster with portraits, character details, and sheet links."
          actionLabel="Add your first player"
          actionHref={`/campaigns/${campaignId}/players/new`}
        />
      ) : (
        <div className="space-y-4">
          {players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              characterStats={statsMap}
              campaignId={campaignId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
