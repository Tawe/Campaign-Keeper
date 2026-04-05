import { adminDb } from "@/lib/firebase/admin";
import {
  buildMapPinPreview,
  toCampaign,
  toCampaignLocation,
  toCampaignMap,
  toMapPin,
  toLocation,
  toWorldMap,
} from "@/lib/firebase/converters";
import {
  CAMPAIGNS_COL,
  CAMPAIGN_LOCATIONS_COL,
  CAMPAIGN_MAP_PINS_COL,
  CAMPAIGN_MAPS_COL,
  LOCATIONS_COL,
  MAP_PINS_COL,
  MAPS_COL,
} from "@/lib/firebase/db";
import type { Campaign, CampaignMap, Location, MapPin, WorldMap } from "@/types";

async function getOwnedMapDoc(mapId: string, userId?: string) {
  const doc = await adminDb().collection(MAPS_COL).doc(mapId).get();
  if (!doc.exists) return null;
  if (userId && doc.data()?.userId !== userId) return null;
  return doc;
}

function mergeCampaignMap(globalMap: WorldMap, campaignMap: CampaignMap): CampaignMap {
  return {
    ...globalMap,
    campaign_id: campaignMap.campaign_id,
    player_visible: campaignMap.player_visible,
    name: campaignMap.name || globalMap.name,
  };
}

export async function getCampaignMaps(
  campaignId: string,
  options?: { playerVisibleOnly?: boolean },
): Promise<CampaignMap[]> {
  const db = adminDb();
  const linksSnap = await db
    .collection(CAMPAIGN_MAPS_COL)
    .where("campaignId", "==", campaignId)
    .get();

  const links = linksSnap.docs.map(toCampaignMap).filter((map) => (
    options?.playerVisibleOnly ? map.player_visible : true
  ));
  if (links.length === 0) return [];

  const globalDocs = await db.getAll(...links.map((map) => db.collection(MAPS_COL).doc(map.id)));
  const globalById = new Map(
    globalDocs.filter((doc) => doc.exists).map((doc) => [doc.id, toWorldMap(doc)]),
  );

  return links
    .map((link) => {
      const globalMap = globalById.get(link.id);
      return globalMap ? mergeCampaignMap(globalMap, link) : null;
    })
    .filter((map): map is CampaignMap => map !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAvailableMaps(
  userId: string,
  campaignId: string,
): Promise<{ id: string; name: string }[]> {
  const db = adminDb();
  const [allSnap, campaignSnap] = await Promise.all([
    db.collection(MAPS_COL).where("userId", "==", userId).get(),
    db.collection(CAMPAIGN_MAPS_COL).where("campaignId", "==", campaignId).get(),
  ]);
  const linked = new Set(campaignSnap.docs.map((doc) => doc.data().mapId as string));
  return allSnap.docs
    .filter((doc) => !linked.has(doc.id))
    .map((doc) => ({ id: doc.id, name: doc.data().name as string }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getGlobalMapsWithCampaigns(userId: string): Promise<{
  maps: WorldMap[];
  mapCampaigns: Map<string, { campaignId: string; playerVisible: boolean }[]>;
  campaignMap: Map<string, Campaign>;
}> {
  const db = adminDb();
  const [mapsSnap, campaignMapsSnap, campaignsSnap] = await Promise.all([
    db.collection(MAPS_COL).where("userId", "==", userId).get(),
    db.collection(CAMPAIGN_MAPS_COL).where("userId", "==", userId).get(),
    db.collection(CAMPAIGNS_COL).where("userId", "==", userId).get(),
  ]);

  const mapCampaigns = new Map<string, { campaignId: string; playerVisible: boolean }[]>();
  campaignMapsSnap.docs.forEach((doc) => {
    const data = doc.data();
    const list = mapCampaigns.get(data.mapId as string) ?? [];
    list.push({
      campaignId: data.campaignId as string,
      playerVisible: Boolean(data.playerVisible),
    });
    mapCampaigns.set(data.mapId as string, list);
  });

  return {
    maps: mapsSnap.docs
      .map(toWorldMap)
      .filter((map) => mapCampaigns.has(map.id))
      .sort((a, b) => a.name.localeCompare(b.name)),
    mapCampaigns,
    campaignMap: new Map(campaignsSnap.docs.map((doc) => [doc.id, toCampaign(doc)])),
  };
}

async function buildPinPreviews(params: {
  campaignId: string;
  pins: MapPin[];
  includePrivate: boolean;
}) {
  const db = adminDb();
  const locationIds = [...new Set(params.pins.filter((pin) => pin.target_type === "location").map((pin) => pin.target_id))];
  const mapIds = [...new Set(params.pins.filter((pin) => pin.target_type === "map").map((pin) => pin.target_id))];

  const [locationDocs, campaignLocationSnap, mapDocs] = await Promise.all([
    locationIds.length > 0 ? db.getAll(...locationIds.map((id) => db.collection(LOCATIONS_COL).doc(id))) : [],
    locationIds.length > 0
      ? db.getAll(...locationIds.map((id) => db.collection(CAMPAIGN_LOCATIONS_COL).doc(`${params.campaignId}_${id}`)))
      : [],
    mapIds.length > 0 ? db.getAll(...mapIds.map((id) => db.collection(MAPS_COL).doc(id))) : [],
  ]);

  const locationsById = new Map<string, Location>();
  locationDocs.forEach((doc) => {
    if (doc.exists) locationsById.set(doc.id, toLocation(doc));
  });

  const campaignLocationsById = new Map<string, ReturnType<typeof toCampaignLocation>>();
  campaignLocationSnap.forEach((doc) => {
    if (!doc.exists) return;
    const location = toCampaignLocation(doc);
    campaignLocationsById.set(location.id, location);
  });

  const mapsById = new Map<string, WorldMap>();
  mapDocs.forEach((doc) => {
    if (doc.exists) mapsById.set(doc.id, toWorldMap(doc));
  });

  return params.pins.map((pin) => {
    if (pin.target_type === "location") {
      const globalLocation = locationsById.get(pin.target_id);
      const campaignLocation = campaignLocationsById.get(pin.target_id);
      if (!globalLocation || !campaignLocation) return pin;
      return {
        ...pin,
        preview: buildMapPinPreview({
          targetType: "location",
          targetId: pin.target_id,
          campaignId: params.campaignId,
          visibility: pin.visibility,
          title: campaignLocation.name || globalLocation.name,
          summary: campaignLocation.public_info,
          imageUrl: globalLocation.image_url,
          terrain: globalLocation.terrain,
          privateNotes: params.includePrivate ? campaignLocation.private_notes : null,
        }),
      };
    }

    const childMap = mapsById.get(pin.target_id);
    if (!childMap) return pin;
    return {
      ...pin,
      preview: buildMapPinPreview({
        targetType: "map",
        targetId: pin.target_id,
        campaignId: params.campaignId,
        visibility: pin.visibility,
        title: childMap.name,
        imageUrl: childMap.image_url,
      }),
    };
  });
}

export async function getMapWithCampaignData(
  mapId: string,
  campaignId: string,
  options?: { playerView?: boolean },
): Promise<{
  map: CampaignMap;
  pins: MapPin[];
  linkedLocation: Location | null;
} | null> {
  const db = adminDb();
  const linkRef = db.collection(CAMPAIGN_MAPS_COL).doc(`${campaignId}_${mapId}`);
  const [globalDoc, linkDoc] = await Promise.all([
    db.collection(MAPS_COL).doc(mapId).get(),
    linkRef.get(),
  ]);
  if (!globalDoc.exists || !linkDoc.exists) return null;

  const globalMap = toWorldMap(globalDoc);
  const campaignMap = toCampaignMap(linkDoc);
  if (options?.playerView && !campaignMap.player_visible) return null;

  const pinSnap = await db.collection(MAP_PINS_COL).where("mapId", "==", mapId).get();
  let pinVisibilityById = new Map<string, "public" | "private">();
  if (pinSnap.size > 0) {
    const visibilityDocs = await db.getAll(
      ...pinSnap.docs.map((doc) => db.collection(CAMPAIGN_MAP_PINS_COL).doc(`${campaignId}_${doc.id}`)),
    );
    pinVisibilityById = new Map(
      visibilityDocs
        .filter((doc) => doc.exists)
        .map((doc) => [doc.data()!.pinId as string, (doc.data()!.visibility as "public" | "private") ?? "private"]),
    );
  }

  const pins = pinSnap.docs
    .map((doc) => toMapPin(doc, { visibility: pinVisibilityById.get(doc.id) ?? "private" }))
    .filter((pin) => (options?.playerView ? pin.visibility === "public" : true));

  const linkedLocationDoc = globalMap.location_id
    ? await db.collection(LOCATIONS_COL).doc(globalMap.location_id).get()
    : null;

  return {
    map: mergeCampaignMap(globalMap, campaignMap),
    pins: await buildPinPreviews({
      campaignId,
      pins,
      includePrivate: !options?.playerView,
    }),
    linkedLocation: linkedLocationDoc?.exists ? toLocation(linkedLocationDoc) : null,
  };
}

export async function getMapsForLocation(
  campaignId: string,
  locationId: string,
  options?: { playerVisibleOnly?: boolean },
): Promise<CampaignMap[]> {
  const maps = await getCampaignMaps(campaignId, options);
  return maps.filter((map) => map.location_id === locationId);
}

export async function getMapTargetsForCampaign(campaignId: string): Promise<{
  locations: { id: string; name: string }[];
  maps: { id: string; name: string }[];
}> {
  const [locations, maps] = await Promise.all([
    adminDb().collection(CAMPAIGN_LOCATIONS_COL).where("campaignId", "==", campaignId).orderBy("name").get(),
    adminDb().collection(CAMPAIGN_MAPS_COL).where("campaignId", "==", campaignId).get(),
  ]);

  return {
    locations: locations.docs.map((doc) => {
      const loc = toCampaignLocation(doc);
      return { id: loc.id, name: loc.name };
    }),
    maps: maps.docs
      .map((doc) => {
        const map = toCampaignMap(doc);
        return { id: map.id, name: map.name };
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function getVaultMap(mapId: string, userId: string): Promise<WorldMap | null> {
  const doc = await getOwnedMapDoc(mapId, userId);
  return doc ? toWorldMap(doc) : null;
}
