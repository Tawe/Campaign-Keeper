import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignPlayers } from "@/domains/players/queries";
import { Panel } from "@/components/ui/panel";
import { Portrait } from "@/components/shared/Portrait";
import { Badge } from "@/components/ui/badge";

export default async function PlayerRosterPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const players = await getCampaignPlayers(campaignId);
  const joined = players.filter((p) => p.player_user_id !== null);

  if (joined.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No players have joined yet.</p>;
  }

  return (
    <div className="space-y-3">
      {joined.map((player) => (
        <Panel key={player.id} className="px-4 py-4 space-y-3">
          <div className="flex items-center gap-3">
            <Portrait src={player.portrait_url} alt={player.name} className="h-10 w-10 shrink-0" />
            <div>
              <p className="font-medium text-sm">{player.name}</p>
              {player.characters.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {player.characters.length} character{player.characters.length > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          {player.characters.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-border/50">
              {player.characters.map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{c.name}</span>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {c.class && <Badge variant="secondary" className="text-xs font-normal">{c.class}</Badge>}
                    {c.race && <Badge variant="outline" className="text-xs font-normal">{c.race}</Badge>}
                    {c.level && <span className="text-xs text-muted-foreground">Lvl {c.level}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}
