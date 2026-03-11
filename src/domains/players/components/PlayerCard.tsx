import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { Portrait } from "@/components/shared/Portrait";
import { Button } from "@/components/ui/button";
import { DeletePlayerButton } from "./DeletePlayerButton";
import { formatDateShort } from "@/lib/utils";
import type { Player } from "@/types";

interface CharacterStats {
  sessionCount: number;
  lastSeen: string | null;   // session date string YYYY-MM-DD
  lastStatus: string | null;
}

interface PlayerCardProps {
  player: Player;
  characterStats: Map<string, CharacterStats>; // keyed by nameLower
  campaignId: string;
}

export function PlayerCard({ player, characterStats, campaignId }: PlayerCardProps) {
  return (
    <div className="paper-panel overflow-hidden">
      <div className="flex items-center justify-between gap-4 bg-panel/60 px-4 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <Portrait src={player.portrait_url} alt={player.name} className="h-14 w-14 shrink-0" />
          <div className="min-w-0">
            <Link href={`/campaigns/${campaignId}/players/${player.id}`} className="font-serif text-xl tracking-[-0.02em] hover:underline underline-offset-2">
              {player.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {player.characters.length} character{player.characters.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" asChild>
            <Link href={`/campaigns/${campaignId}/players/${player.id}/edit`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <DeletePlayerButton
            playerId={player.id}
            campaignId={campaignId}
            playerName={player.name}
          />
        </div>
      </div>

      {/* Characters */}
      {player.characters.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground italic">No characters assigned.</p>
      ) : (
        <div className="divide-y">
          {player.characters.map((char) => {
            const stats = characterStats.get(char.name.toLowerCase());
            const meta = [char.class, char.race, char.level ? `Lvl ${char.level}` : null]
              .filter(Boolean)
              .join(" · ");
            return (
              <div key={char.name} className="px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{char.name}</p>
                    {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
                    {char.stats_link && (
                      <a
                        href={char.stats_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2"
                      >
                        Stats
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">
                      {stats?.sessionCount ?? 0}{" "}
                      <span className="text-muted-foreground font-normal text-xs">
                        {stats?.sessionCount === 1 ? "session" : "sessions"}
                      </span>
                    </p>
                    {stats?.lastSeen && (
                      <p className="text-xs text-muted-foreground">
                        Last: {formatDateShort(stats.lastSeen)}
                        {stats.lastStatus && ` · ${stats.lastStatus}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
