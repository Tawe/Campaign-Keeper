import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import {
  getLocationWithCampaignData,
  getNpcsAtLocation,
  getLocationPath,
  getSublocations,
} from "@/domains/locations/queries";
import { getCampaignLocations } from "@/domains/locations/queries";
import { getEventsForLocation } from "@/domains/events/queries";
import { EventCard } from "@/domains/events/components/EventCard";
import { updateLocationInfo } from "@/domains/locations/actions";
import { LocationImageEditor } from "@/domains/locations/components/LocationImageEditor";
import { LocationGalleryEditor } from "@/domains/locations/components/LocationGalleryEditor";
import { LocationDeleteActions } from "@/domains/locations/components/LocationDeleteActions";
import { LocationParentSelector } from "@/domains/locations/components/LocationParentSelector";
import { PageHeader } from "@/components/shared/PageHeader";
import { ImageGallerySection } from "@/components/shared/ImageGallerySection";
import { InlineEditor } from "@/components/shared/InlineEditor";
import { InlineInputEditor } from "@/components/shared/InlineInputEditor";
import { SectionFrame, StackedList } from "@/components/shared/editorial";
import { Badge } from "@/components/ui/badge";
import { Portrait } from "@/components/shared/Portrait";
import { formatDateShort } from "@/lib/utils";
import { AddMapForm } from "@/domains/maps/components/AddMapForm";
import { getAvailableMaps, getMapsForLocation } from "@/domains/maps/queries";

export default async function LocationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string; locationId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { campaignId, locationId } = await params;
  const { from } = await searchParams;
  const fromVault = from === "vault";
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await getLocationWithCampaignData(locationId, campaignId);
  if (!data) notFound();

  const { location, sessionMap } = data;

  const [breadcrumb, sublocations, npcsHere, allCampaignLocations, events, maps, availableMaps] = await Promise.all([
    getLocationPath(locationId),
    getSublocations(locationId, campaignId),
    getNpcsAtLocation(campaignId, location.name),
    getCampaignLocations(campaignId),
    getEventsForLocation(campaignId, locationId),
    getMapsForLocation(campaignId, locationId),
    getAvailableMaps(user.uid, campaignId),
  ]);

  // Selector should exclude self and its descendants (simple: exclude self)
  const parentOptions = allCampaignLocations
    .filter((l) => l.id !== locationId)
    .map((l) => ({ id: l.id, name: l.name }));

  const sessionList = Array.from(sessionMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  const visitedCharacterMap = new Map<string, string>();
  sessionList.forEach((session) => {
    session.characterNames.forEach((name) => {
      const key = name.toLowerCase();
      if (!visitedCharacterMap.has(key)) visitedCharacterMap.set(key, name);
    });
  });
  const visitedCharacters = Array.from(visitedCharacterMap.values()).sort((a, b) => a.localeCompare(b));

  return (
    <div className="reading-shell space-y-6">
      {/* Header image */}
      {location.image_url && (
        <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-border/80 sm:h-80">
          <Image
            src={location.image_url}
            alt={location.name}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      )}

      <PageHeader
        title={location.name}
        eyebrow={
          breadcrumb.length > 1
            ? breadcrumb
                .slice(0, -1)
                .map((l) => l.name)
                .join(" / ")
            : "Location"
        }
        backHref={fromVault ? "/app/locations" : `/campaigns/${campaignId}/locations`}
        backLabel={fromVault ? "Vault" : "Locations"}
        action={<LocationDeleteActions locationId={locationId} campaignId={campaignId} fromVault={fromVault} />}
      />

      {/* Breadcrumb path */}
      {breadcrumb.length > 1 && (
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.id} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              {crumb.id === locationId ? (
                <span className="text-foreground font-medium">{crumb.name}</span>
              ) : (
                <Link
                  href={`/campaigns/${campaignId}/locations/${crumb.id}`}
                  className="hover:text-foreground hover:underline"
                >
                  {crumb.name}
                </Link>
              )}
            </span>
          ))}
        </nav>
      )}

      {/* Terrain badges */}
      {location.terrain.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {location.terrain.map((tag) => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      )}

      {/* Terrain editor */}
      <InlineInputEditor
        label="Terrain"
        value={location.terrain.length > 0 ? location.terrain.join(", ") : null}
        placeholder="Village, Dungeon, Forest… (comma-separated)"
        action={updateLocationInfo.bind(null, locationId, campaignId, "terrain")}
      />

      <div className="space-y-4">
        <InlineEditor
          label="What players know"
          value={location.public_info}
          placeholder="Add public information about this location…"
          action={updateLocationInfo.bind(null, locationId, campaignId, "publicInfo")}
        />
        <InlineEditor
          label="DM notes"
          value={location.private_notes}
          placeholder="Add private DM notes…"
          dmOnly
          action={updateLocationInfo.bind(null, locationId, campaignId, "privateNotes")}
        />
      </div>

      {/* Image upload */}
      <LocationImageEditor
        locationId={locationId}
        campaignId={campaignId}
        imageUrl={location.image_url}
      />

      {/* Hierarchy */}
      <div className="grid grid-cols-2 gap-3">
        <LocationParentSelector
          locationId={locationId}
          campaignId={campaignId}
          currentParentId={location.parent_location_id}
          availableLocations={parentOptions}
        />

        {sublocations.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Sublocations</p>
            <div className="flex flex-wrap gap-1.5">
              {sublocations.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/campaigns/${campaignId}/locations/${sub.id}`}
                  className="text-sm text-primary hover:underline"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* NPCs here */}
      {npcsHere.length > 0 && (
        <SectionFrame
          title="NPCs Here"
          eyebrow="Last Seen"
          description={`NPCs whose last known location is ${location.name}.`}
        >
          <div className="flex flex-wrap gap-3">
            {npcsHere.map((npc) => (
              <Link
                key={npc.id}
                href={`/campaigns/${campaignId}/npcs/${npc.id}`}
                className="flex items-center gap-2 rounded-lg border border-border/80 px-3 py-2 hover:bg-muted transition-colors"
              >
                <Portrait src={npc.portrait_url} alt={npc.name} className="h-8 w-8 shrink-0" />
                <span className="text-sm font-medium">{npc.name}</span>
                {npc.status && (
                  <span className="text-xs text-muted-foreground">— {npc.status}</span>
                )}
              </Link>
            ))}
          </div>
        </SectionFrame>
      )}

      {/* Party visits */}
      {visitedCharacters.length > 0 && (
        <SectionFrame title="Players Visited" eyebrow="Party Connections">
          <div className="flex flex-wrap gap-2">
            {visitedCharacters.map((name) => (
              <Badge key={name} variant="secondary" className="font-normal">
                {name}
              </Badge>
            ))}
          </div>
        </SectionFrame>
      )}

      {/* Events */}
      <SectionFrame
        title="Events"
        eyebrow="World History"
        description="Major events that took place at this location."
      >
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events linked yet.</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <EventCard key={event.id} event={event} campaignId={campaignId} />
            ))}
          </div>
        )}
      </SectionFrame>

      <SectionFrame
        title="Maps"
        eyebrow="Atlas"
        description="Reusable vault maps linked to this location. Hover pins to preview linked locations; click pins to open them."
      >
        <div className="space-y-4">
          <AddMapForm
            campaignId={campaignId}
            availableMaps={availableMaps}
            availableLocations={allCampaignLocations.map((entry) => ({ id: entry.id, name: entry.name }))}
            defaultLocationId={locationId}
          />
          {maps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No maps linked yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {maps.map((map) => (
                <Link
                  key={map.id}
                  href={`/campaigns/${campaignId}/maps/${map.id}`}
                  className="rounded-xl border border-border/80 px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  {map.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </SectionFrame>

      {/* Session history */}
      <SectionFrame
        title="Sessions"
        eyebrow="Visit History"
        description="Every session where this location was visited."
      >
        {sessionList.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
        ) : (
          <StackedList>
            {sessionList.map((session) => (
              <Link
                key={session.id}
                href={`/campaigns/${campaignId}/sessions/${session.id}`}
                className="block px-4 py-3 hover:bg-muted transition-colors text-sm font-medium"
              >
                {session.title ?? "Untitled session"}{" "}
                <span className="text-muted-foreground font-normal">
                  ({formatDateShort(session.date)})
                </span>
              </Link>
            ))}
          </StackedList>
        )}
      </SectionFrame>

      <div className="space-y-4">
        <LocationGalleryEditor
          locationId={locationId}
          campaignId={campaignId}
          images={location.gallery_images}
        />
        <ImageGallerySection
          title="Gallery"
          eyebrow="Maps & Images"
          description="Maps, landmark art, travel sketches, and other visuals for this location."
          images={location.gallery_images}
          emptyMessage="No gallery images yet."
        />
      </div>
    </div>
  );
}
