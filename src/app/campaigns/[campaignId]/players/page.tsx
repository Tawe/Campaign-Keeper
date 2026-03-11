import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignPlayersWithStats } from "@/domains/players/queries";
import { PlayerCard } from "@/domains/players/components/PlayerCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { MetaStrip } from "@/components/shared/editorial";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";

export default async function PlayersPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { players, statsMap } = await getCampaignPlayersWithStats(campaignId);

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
