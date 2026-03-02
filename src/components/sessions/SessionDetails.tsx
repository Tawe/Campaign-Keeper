import Link from "next/link";
import { StackedList } from "@/components/shared/editorial";
import { Badge } from "@/components/ui/badge";
import type { Session } from "@/types";

interface SessionDetailsProps {
  session: Session;
  characterOwners?: Map<string, { playerName: string; playerId: string }>;
}

export function SessionDetails({ session, characterOwners }: SessionDetailsProps) {
  const hasDetails =
    session.starting_location ||
    session.time_passed ||
    session.characters.length > 0 ||
    session.npc_statuses.length > 0 ||
    session.loot.length > 0 ||
    session.locations_visited.length > 0;

  if (!hasDetails) return null;

  return (
    <div className="space-y-5">
      {/* Location + Time */}
      {(session.starting_location || session.time_passed) && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {session.starting_location && (
            <span>
              <span className="text-muted-foreground">Location: </span>
              {session.starting_location}
            </span>
          )}
          {session.time_passed && (
            <span>
              <span className="text-muted-foreground">Time passed: </span>
              {session.time_passed}
            </span>
          )}
        </div>
      )}

      {/* Characters */}
      {session.characters.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Characters</p>
          <StackedList className="text-sm">
            {session.characters.map((c, i) => {
              const owner = characterOwners?.get(c.name.toLowerCase());
              return (
                <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <span className="font-medium">{c.name}</span>
                    {owner && (
                      <Link
                        href={`/campaigns/${session.campaign_id}/players`}
                        className="block text-xs text-muted-foreground hover:underline"
                      >
                        {owner.playerName}
                      </Link>
                    )}
                  </div>
                  <span className="text-muted-foreground">{c.status_at_end}</span>
                </div>
              );
            })}
          </StackedList>
        </div>
      )}

      {/* NPC Statuses */}
      {session.npc_statuses.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">NPC statuses</p>
          <StackedList className="text-sm">
            {session.npc_statuses.map((n, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <span className="font-medium">{n.name}</span>
                <span className="text-muted-foreground">{n.status_at_end}</span>
              </div>
            ))}
          </StackedList>
        </div>
      )}

      {/* Locations Visited */}
      {session.locations_visited.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Locations visited</p>
          <div className="flex flex-wrap gap-1.5">
            {session.locations_visited.map((loc) => (
              <Badge key={loc} variant="outline">{loc}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Loot */}
      {session.loot.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Loot</p>
          <div className="flex flex-wrap gap-1.5">
            {session.loot.map((item) => (
              <Badge key={item} variant="outline">{item}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
