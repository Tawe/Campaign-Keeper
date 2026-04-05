import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getGlobalMapsWithCampaigns } from "@/domains/maps/queries";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";

export default async function GlobalMapsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { maps, mapCampaigns, campaignMap } = await getGlobalMapsWithCampaigns(user.uid);

  return (
    <div className="page-shell max-w-5xl space-y-8">
      <PageHeader
        title="Maps"
        eyebrow="Vault"
        backHref="/app/dashboard"
        backLabel="Dashboard"
      />

      {maps.length === 0 ? (
        <EmptyState
          title="No maps yet"
          description="Maps appear here once they are linked to at least one campaign."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {maps.map((map) => (
            <div key={map.id} className="overflow-hidden rounded-lg border border-border/50">
              <Link href={`/app/maps/${map.id}`} className="block">
                {map.image_url ? (
                  <Image
                    src={map.image_url}
                    alt={map.name}
                    width={480}
                    height={200}
                    unoptimized
                    className="h-40 w-full object-cover"
                  />
                ) : null}
                <div className="space-y-2 p-4">
                  <p className="font-medium text-foreground">{map.name}</p>
                  <div className="flex flex-wrap gap-1">
                    {(mapCampaigns.get(map.id) ?? []).map(({ campaignId, playerVisible }) => (
                      <Badge key={campaignId} variant="outline" className="text-xs">
                        {(campaignMap.get(campaignId)?.name ?? campaignId) + (playerVisible ? " • players" : " • DM")}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
