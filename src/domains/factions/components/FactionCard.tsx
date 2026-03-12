import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Faction } from "@/types";

interface FactionCardProps {
  faction: Faction;
  campaignId: string;
}

export function FactionCard({ faction, campaignId }: FactionCardProps) {
  return (
    <Link href={`/campaigns/${campaignId}/factions/${faction.id}`} className="block group">
      <div className="bg-muted/30 p-4 hover:bg-muted/50 transition-colors rounded-lg border border-border/50 min-h-[100px]">
        <p className="font-serif text-lg font-medium text-foreground truncate">
          {faction.name}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {faction.faction_type && (
            <Badge variant="outline" className="text-xs">
              {faction.faction_type}
            </Badge>
          )}
          {faction.alignment && (
            <Badge variant="secondary" className="text-xs font-normal">
              {faction.alignment}
            </Badge>
          )}
          {faction.status && (
            <Badge variant="secondary" className="text-xs font-normal">
              {faction.status}
            </Badge>
          )}
          {faction.influence && (
            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
              {faction.influence}
            </Badge>
          )}
        </div>
        {faction.leader_names.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground truncate">
            Led by {faction.leader_names.join(", ")}
          </p>
        )}
      </div>
    </Link>
  );
}
