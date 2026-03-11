import Link from "next/link";
import type { Faction } from "@/types";

interface FactionCardProps {
  faction: Faction;
  campaignId: string;
}

export function FactionCard({ faction, campaignId }: FactionCardProps) {
  return (
    <Link
      href={`/campaigns/${campaignId}/factions/${faction.id}`}
      className="flex items-center justify-between py-2 px-3 hover:bg-muted rounded-md transition-colors"
    >
      <span className="font-medium text-sm">{faction.name}</span>
      {faction.public_info && (
        <span className="text-xs text-muted-foreground truncate max-w-[240px] ml-4">
          {faction.public_info}
        </span>
      )}
    </Link>
  );
}
