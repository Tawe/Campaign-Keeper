import { adminDb } from "@/lib/firebase/admin";
import { toCampaign, toCampaignLocation, toLocation, toSession, toCampaignNpc } from "@/lib/firebase/converters";
import {
  CAMPAIGNS_COL,
  CAMPAIGN_LOCATIONS_COL,
  CAMPAIGN_NPCS_COL,
  LOCATION_VISITS_COL,
  LOCATIONS_COL,
  SESSIONS_COL,
} from "@/lib/firebase/db";
import type { Campaign, Location, LocationWithLastVisit, Npc } from "@/types";

export async function getCampaignLocations(campaignId: string): Promise<LocationWithLastVisit[]> {
  const db = adminDb();

  const [locationsSnap, sessionsSnap] = await Promise.all([
    db.collection(CAMPAIGN_LOCATIONS_COL).where("campaignId", "==", campaignId).orderBy("name").get(),
    db.collection(SESSIONS_COL).where("campaignId", "==", campaignId).orderBy("date", "desc").get(),
  ]);

  const sessions = sessionsSnap.docs.map((doc) => ({
    id: doc.id,
    date: doc.data().date as string,
  }));

  const locationMap = new Map<string, LocationWithLastVisit>();
  locationsSnap.docs.forEach((doc) => {
    const loc = toCampaignLocation(doc);
    locationMap.set(loc.id, { ...loc, last_visited: "", last_session_id: "" });
  });

  if (locationsSnap.size > 0) {
    const locationIds = locationsSnap.docs.map((d) => d.id);
    for (let i = 0; i < locationIds.length; i += 30) {
      const chunk = locationIds.slice(i, i + 30);
      const visitsSnap = await db
        .collection(LOCATION_VISITS_COL)
        .where("campaignId", "==", campaignId)
        .where("locationId", "in", chunk)
        .get();

      visitsSnap.docs.forEach((doc) => {
        const d = doc.data();
        const existing = locationMap.get(d.locationId);
        if (!existing) return;
        const sessionDate = sessions.find((s) => s.id === d.sessionId)?.date ?? "";
        if (!existing.last_visited || sessionDate > existing.last_visited) {
          locationMap.set(d.locationId, { ...existing, last_visited: sessionDate, last_session_id: d.sessionId });
        }
      });
    }
  }

  return Array.from(locationMap.values()).sort(
    (a, b) => b.last_visited.localeCompare(a.last_visited)
  );
}

export async function getLocationWithCampaignData(locationId: string, campaignId: string) {
  const db = adminDb();

  const linkRef = db.collection(CAMPAIGN_LOCATIONS_COL).doc(`${campaignId}_${locationId}`);
  const [locationDoc, linkDoc, visitsSnap] = await Promise.all([
    db.collection(LOCATIONS_COL).doc(locationId).get(),
    linkRef.get(),
    db.collection(LOCATION_VISITS_COL).where("campaignId", "==", campaignId).where("locationId", "==", locationId).get(),
  ]);

  // Fall back to compound query for legacy session-seeded docs
  let campaignLocationDoc = linkDoc.exists ? linkDoc : null;
  if (!campaignLocationDoc) {
    const snap = await db
      .collection(CAMPAIGN_LOCATIONS_COL)
      .where("campaignId", "==", campaignId)
      .where("locationId", "==", locationId)
      .limit(1)
      .get();
    campaignLocationDoc = snap.empty ? null : snap.docs[0];
  }

  if (!locationDoc.exists || !campaignLocationDoc) return null;

  // Merge: global doc provides image_url and parent_location_id; campaign doc provides public/private notes
  const globalLocation = toLocation(locationDoc);
  const campaignLocation = toCampaignLocation(campaignLocationDoc);
  const location: Location = {
    ...globalLocation,
    campaign_id: campaignId,
    name: campaignLocation.name || globalLocation.name,
    public_info: campaignLocation.public_info,
    private_notes: campaignLocation.private_notes,
  };

  const sessionIds = [...new Set(visitsSnap.docs.map((d) => d.data().sessionId as string))];
  const sessionMap = new Map<string, { id: string; date: string; title: string | null; characterNames: string[] }>();

  await Promise.all(
    sessionIds.map(async (sid) => {
      const doc = await db.collection(SESSIONS_COL).doc(sid).get();
      if (doc.exists) {
        const s = toSession(doc);
        sessionMap.set(sid, {
          id: s.id,
          date: s.date,
          title: s.title,
          characterNames: s.characters.map((c) => c.name.trim()).filter(Boolean),
        });
      }
    })
  );

  return { location, sessionMap };
}

export async function getAvailableLocations(
  userId: string,
  campaignId: string,
): Promise<{ id: string; name: string }[]> {
  const db = adminDb();
  const [allSnap, campaignSnap] = await Promise.all([
    db.collection(LOCATIONS_COL).where("userId", "==", userId).orderBy("name").get(),
    db.collection(CAMPAIGN_LOCATIONS_COL).where("campaignId", "==", campaignId).get(),
  ]);
  const alreadyLinked = new Set(campaignSnap.docs.map((d) => d.data().locationId as string));
  return allSnap.docs
    .filter((d) => !alreadyLinked.has(d.id))
    .map((d) => ({ id: d.id, name: d.data().name as string }));
}

export async function getGlobalLocationsWithCampaigns(userId: string): Promise<{
  locations: Location[];
  locationCampaigns: Map<string, { campaignId: string }[]>;
  campaignMap: Map<string, Campaign>;
}> {
  const db = adminDb();

  const [locationsSnap, campaignLocationsSnap, campaignsSnap] = await Promise.all([
    db.collection(LOCATIONS_COL).where("userId", "==", userId).orderBy("name").get(),
    db.collection(CAMPAIGN_LOCATIONS_COL).where("userId", "==", userId).get(),
    db.collection(CAMPAIGNS_COL).where("userId", "==", userId).get(),
  ]);

  const campaignMap = new Map<string, Campaign>(
    campaignsSnap.docs.map((doc) => [doc.id, toCampaign(doc)])
  );

  const locationCampaigns = new Map<string, { campaignId: string }[]>();
  campaignLocationsSnap.docs.forEach((doc) => {
    const d = doc.data();
    const list = locationCampaigns.get(d.locationId) ?? [];
    list.push({ campaignId: d.campaignId });
    locationCampaigns.set(d.locationId, list);
  });

  const locations = locationsSnap.docs.map(toLocation).filter((loc) => locationCampaigns.has(loc.id));

  return { locations, locationCampaigns, campaignMap };
}

/** NPCs whose lastScene matches the location's name in a given campaign. */
export async function getNpcsAtLocation(campaignId: string, locationName: string): Promise<Npc[]> {
  if (!locationName.trim()) return [];
  const db = adminDb();
  const snap = await db
    .collection(CAMPAIGN_NPCS_COL)
    .where("campaignId", "==", campaignId)
    .where("lastScene", "==", locationName)
    .get();
  return snap.docs.map(toCampaignNpc);
}

/** Builds the ancestor breadcrumb path from root → current location (max 10 levels). */
export async function getLocationPath(locationId: string): Promise<{ id: string; name: string }[]> {
  const db = adminDb();
  const path: { id: string; name: string }[] = [];
  let currentId: string | null = locationId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId) && path.length < 10) {
    visited.add(currentId);
    const doc = await db.collection(LOCATIONS_COL).doc(currentId).get();
    if (!doc.exists) break;
    path.unshift({ id: currentId, name: doc.data()!.name as string });
    currentId = (doc.data()!.parentLocationId as string | null) ?? null;
  }

  return path;
}

/** Direct child locations of a given location within a campaign. */
export async function getSublocations(locationId: string, campaignId: string): Promise<Location[]> {
  const db = adminDb();
  const snap = await db
    .collection(CAMPAIGN_LOCATIONS_COL)
    .where("campaignId", "==", campaignId)
    .where("parentLocationId", "==", locationId)
    .orderBy("name")
    .get();
  return snap.docs.map(toCampaignLocation);
}
