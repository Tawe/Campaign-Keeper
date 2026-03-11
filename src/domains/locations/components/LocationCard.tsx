import Link from "next/link";
import { formatDateShort } from "@/lib/utils";
import type { LocationWithLastVisit } from "@/types";

interface LocationCardProps {
  location: LocationWithLastVisit;
  campaignId: string;
}

export function LocationCard({ location, campaignId }: LocationCardProps) {
  return (
    <Link
      href={`/campaigns/${campaignId}/locations/${location.id}`}
      className="flex items-center justify-between py-2 px-3 hover:bg-muted rounded-md transition-colors"
    >
      <span className="font-medium text-sm">{location.name}</span>
      {location.last_visited && (
        <span className="text-xs text-muted-foreground shrink-0 ml-4">
          {formatDateShort(location.last_visited)}
        </span>
      )}
    </Link>
  );
}
