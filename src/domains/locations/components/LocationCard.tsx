import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import type { LocationWithLastVisit } from "@/types";

interface LocationCardProps {
  location: LocationWithLastVisit;
  campaignId: string;
}

export function LocationCard({ location, campaignId }: LocationCardProps) {
  return (
    <Link href={`/campaigns/${campaignId}/locations/${location.id}`} className="block group">
      <div className="relative overflow-hidden rounded-lg border border-border/50 transition hover:shadow-md">
        {location.image_url ? (
          <>
            <Image
              src={location.image_url}
              alt={location.name}
              width={480}
              height={160}
              unoptimized
              className="h-36 w-full object-cover transition group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="font-medium text-white drop-shadow truncate">{location.name}</p>
              {location.terrain.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {location.terrain.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="border-white/20 bg-black/30 text-xs text-white/80 backdrop-blur-sm"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-muted/30 p-4 hover:bg-muted/50 transition-colors">
            <p className="font-medium text-foreground truncate">{location.name}</p>
            {location.terrain.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {location.terrain.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
