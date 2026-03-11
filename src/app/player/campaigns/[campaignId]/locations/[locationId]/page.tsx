import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, MapPin } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import {
  getLocationWithCampaignData,
  getNpcsAtLocation,
  getLocationPath,
  getSublocations,
} from "@/domains/locations/queries";
import { PageHeader } from "@/components/shared/PageHeader";
import { SectionFrame, StackedList } from "@/components/shared/editorial";
import { Badge } from "@/components/ui/badge";
import { Portrait } from "@/components/shared/Portrait";
import { formatDateShort } from "@/lib/utils";

export default async function PlayerLocationDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; locationId: string }>;
}) {
  const { campaignId, locationId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await getLocationWithCampaignData(locationId, campaignId);
  if (!data) notFound();

  const { location, sessionMap } = data;

  const [breadcrumb, sublocations, npcsHere] = await Promise.all([
    getLocationPath(locationId),
    getSublocations(locationId, campaignId),
    getNpcsAtLocation(campaignId, location.name),
  ]);

  const sessionList = Array.from(sessionMap.values()).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      {breadcrumb.length > 1 && (
        <nav className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {i < breadcrumb.length - 1 ? (
                <Link
                  href={`/player/campaigns/${campaignId}/locations/${crumb.id}`}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.name}
                </Link>
              ) : (
                <span className="text-foreground">{crumb.name}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <PageHeader
        title={location.name}
        eyebrow="Location"
        backHref={`/player/campaigns/${campaignId}/locations`}
        backLabel="Locations"
      />

      {location.image_url && (
        <div className="relative h-48 w-full overflow-hidden rounded-xl sm:h-64">
          <Image src={location.image_url} alt={location.name} fill unoptimized className="object-cover" />
        </div>
      )}

      <div className="paper-panel space-y-3 px-5 py-5 sm:px-6">
        {location.terrain.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {location.terrain.map((t) => (
              <Badge key={t} variant="secondary" className="font-normal text-xs">{t}</Badge>
            ))}
          </div>
        )}
        {location.public_info && (
          <p className="text-sm text-foreground/80 leading-relaxed">{location.public_info}</p>
        )}
      </div>

      {sublocations.length > 0 && (
        <SectionFrame title="Sub-locations" eyebrow="Areas">
          <StackedList>
            {sublocations.map((sub) => (
              <Link
                key={sub.id}
                href={`/player/campaigns/${campaignId}/locations/${sub.id}`}
                className="flex items-center gap-2 px-4 py-3 hover:bg-muted transition-colors"
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm font-medium">{sub.name}</span>
              </Link>
            ))}
          </StackedList>
        </SectionFrame>
      )}

      {npcsHere.length > 0 && (
        <SectionFrame title="NPCs Here" eyebrow="Characters">
          <StackedList>
            {npcsHere.map((npc) => (
              <Link
                key={npc.id}
                href={`/player/campaigns/${campaignId}/npcs/${npc.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
              >
                <Portrait src={npc.portrait_url} alt={npc.name} className="h-8 w-8 shrink-0" />
                <span className="text-sm font-medium">{npc.name}</span>
              </Link>
            ))}
          </StackedList>
        </SectionFrame>
      )}

      {sessionList.length > 0 && (
        <SectionFrame title="Visit History" eyebrow="Sessions">
          <StackedList>
            {sessionList.map((session) => (
              <Link
                key={session.id}
                href={`/player/campaigns/${campaignId}/sessions/${session.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium">{session.title ?? "Untitled session"}</span>
                <span className="text-xs text-muted-foreground">{formatDateShort(session.date)}</span>
              </Link>
            ))}
          </StackedList>
        </SectionFrame>
      )}
    </div>
  );
}
