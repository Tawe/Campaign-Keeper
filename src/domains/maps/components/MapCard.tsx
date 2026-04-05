import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { CampaignMap } from "@/types";

interface MapCardProps {
  map: CampaignMap;
}

export function MapCard({ map }: MapCardProps) {
  return (
    <Link href={`/campaigns/${map.campaign_id}/maps/${map.id}`} className="block group">
      <div className="relative overflow-hidden rounded-lg border border-border/50 transition hover:shadow-md">
        {map.image_url ? (
          <>
            <Image
              src={map.image_url}
              alt={map.name}
              width={480}
              height={200}
              unoptimized
              className="h-40 w-full object-cover transition group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="truncate font-medium text-white drop-shadow">{map.name}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {map.player_visible ? (
                  <Badge variant="public" className="text-[11px]">Player visible</Badge>
                ) : (
                  <Badge variant="private" className="text-[11px]">DM only</Badge>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2 bg-muted/30 p-4">
            <p className="font-medium text-foreground">{map.name}</p>
            <Badge variant={map.player_visible ? "public" : "private"} className="text-[11px]">
              {map.player_visible ? "Player visible" : "DM only"}
            </Badge>
          </div>
        )}
      </div>
    </Link>
  );
}
