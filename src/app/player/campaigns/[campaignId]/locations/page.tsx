import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignLocations } from "@/domains/locations/queries";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";

export default async function PlayerLocationsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const locations = await getCampaignLocations(campaignId);

  if (locations.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No locations in this campaign yet.</p>;
  }

  return (
    <Panel className="divide-y divide-border overflow-hidden">
      {locations.map((location) => (
        <div key={location.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">{location.name}</p>
            {location.terrain.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {location.terrain.map((t) => (
                  <Badge key={t} variant="secondary" className="font-normal normal-case text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
            {location.public_info && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{location.public_info}</p>
            )}
          </div>
          {location.last_visited && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatDateShort(location.last_visited)}
            </span>
          )}
        </div>
      ))}
    </Panel>
  );
}
