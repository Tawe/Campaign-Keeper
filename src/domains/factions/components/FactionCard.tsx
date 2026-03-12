import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { Faction } from "@/types";

interface FactionCardProps {
  faction: Faction;
  campaignId: string;
}

export function FactionCard({ faction, campaignId }: FactionCardProps) {
  return (
    <Link href={`/campaigns/${campaignId}/factions/${faction.id}`} className="block group">
      <div className="relative overflow-hidden rounded-lg border border-border/50 transition hover:shadow-md">
        {faction.image_url ? (
          <>
            <Image
              src={faction.image_url}
              alt={faction.name}
              width={480}
              height={160}
              unoptimized
              className="h-36 w-full object-cover transition group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="font-serif font-medium text-white drop-shadow truncate">{faction.name}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {faction.faction_type && (
                  <Badge variant="outline" className="border-white/20 bg-black/30 text-xs text-white/80 backdrop-blur-sm">
                    {faction.faction_type}
                  </Badge>
                )}
                {faction.status && (
                  <Badge variant="outline" className="border-white/20 bg-black/30 text-xs text-white/80 backdrop-blur-sm">
                    {faction.status}
                  </Badge>
                )}
                {faction.influence && (
                  <Badge variant="outline" className="border-white/20 bg-black/30 text-xs text-white/80 backdrop-blur-sm">
                    {faction.influence}
                  </Badge>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="bg-muted/30 p-4 hover:bg-muted/50 transition-colors min-h-[100px]">
            <p className="font-serif text-lg font-medium text-foreground truncate">
              {faction.name}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {faction.faction_type && (
                <Badge variant="outline" className="text-xs">{faction.faction_type}</Badge>
              )}
              {faction.alignment && (
                <Badge variant="secondary" className="text-xs font-normal">{faction.alignment}</Badge>
              )}
              {faction.status && (
                <Badge variant="secondary" className="text-xs font-normal">{faction.status}</Badge>
              )}
              {faction.influence && (
                <Badge variant="outline" className="text-xs font-normal text-muted-foreground">{faction.influence}</Badge>
              )}
            </div>
            {faction.leader_names.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground truncate">
                Led by {faction.leader_names.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
