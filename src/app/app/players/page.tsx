import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getGlobalPlayers } from "@/domains/players/queries";
import { Portrait } from "@/components/shared/Portrait";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";

export default async function GlobalPlayersPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { players, campaignMap } = await getGlobalPlayers(user.uid);

  return (
    <div className="page-shell max-w-5xl space-y-8">
      <PageHeader
        title="Players"
        eyebrow="Vault"
        backHref="/app/dashboard"
        backLabel="Dashboard"
      />

      {players.length === 0 ? (
        <EmptyState
          title="No players yet"
          description="Players appear here once they have been added to a campaign."
        />
      ) : (
        <div className="space-y-2">
          {players.map((player) => {
            const campaign = campaignMap.get(player.campaign_id);
            return (
              <div
                key={player.id}
                className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
              >
                <Portrait src={player.portrait_url} alt={player.name} className="h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{player.name}</p>
                  {player.characters.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {player.characters.map((c) => c.name).join(", ")}
                    </p>
                  )}
                </div>
                {campaign && (
                  <Link href={`/campaigns/${player.campaign_id}/players/${player.id}`}>
                    <Badge variant="outline" className="text-xs hover:bg-muted cursor-pointer">
                      {campaign.name}
                    </Badge>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
