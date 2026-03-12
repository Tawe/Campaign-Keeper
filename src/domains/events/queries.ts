import { adminDb } from "@/lib/firebase/admin";
import { toCampaignEvent, toCampaign, toEvent } from "@/lib/firebase/converters";
import { CAMPAIGN_EVENTS_COL, CAMPAIGNS_COL, EVENTS_COL } from "@/lib/firebase/db";
import type { Campaign, CampaignEvent } from "@/types";

export async function getCampaignEvents(campaignId: string): Promise<CampaignEvent[]> {
  const db = adminDb();
  const campaignEventsSnap = await db
    .collection(CAMPAIGN_EVENTS_COL)
    .where("campaignId", "==", campaignId)
    .orderBy("createdAt", "desc")
    .get();

  if (campaignEventsSnap.empty) return [];
  return enrichCampaignEvents(db, campaignEventsSnap.docs.map(toCampaignEvent));
}

export async function getEventWithCampaignData(
  eventId: string,
  campaignId: string,
): Promise<CampaignEvent | null> {
  const db = adminDb();
  const [globalDoc, campaignDoc] = await Promise.all([
    db.collection(EVENTS_COL).doc(eventId).get(),
    db.collection(CAMPAIGN_EVENTS_COL).doc(`${campaignId}_${eventId}`).get(),
  ]);

  if (!globalDoc.exists || !campaignDoc.exists) return null;

  const globalEvent = toEvent(globalDoc);
  const campaignEvent = toCampaignEvent(campaignDoc);

  return {
    ...campaignEvent,
    title: globalEvent.title,
    event_type: globalEvent.event_type,
    start_date: globalEvent.start_date,
    end_date: globalEvent.end_date,
    description: globalEvent.description,
    private_notes: globalEvent.private_notes,
    image_url: globalEvent.image_url,
  };
}

export async function getEventsForNpc(campaignId: string, npcId: string): Promise<CampaignEvent[]> {
  const db = adminDb();
  const snap = await db
    .collection(CAMPAIGN_EVENTS_COL)
    .where("campaignId", "==", campaignId)
    .where("npcIds", "array-contains", npcId)
    .get();
  return enrichCampaignEvents(db, snap.docs.map(toCampaignEvent));
}

export async function getEventsForLocation(campaignId: string, locationId: string): Promise<CampaignEvent[]> {
  const db = adminDb();
  const snap = await db
    .collection(CAMPAIGN_EVENTS_COL)
    .where("campaignId", "==", campaignId)
    .where("locationId", "==", locationId)
    .get();
  return enrichCampaignEvents(db, snap.docs.map(toCampaignEvent));
}

export async function getEventsForFaction(campaignId: string, factionId: string): Promise<CampaignEvent[]> {
  const db = adminDb();
  const snap = await db
    .collection(CAMPAIGN_EVENTS_COL)
    .where("campaignId", "==", campaignId)
    .where("factionIds", "array-contains", factionId)
    .get();
  return enrichCampaignEvents(db, snap.docs.map(toCampaignEvent));
}

export async function getEventsForSession(campaignId: string, sessionId: string): Promise<CampaignEvent[]> {
  const db = adminDb();
  const snap = await db
    .collection(CAMPAIGN_EVENTS_COL)
    .where("campaignId", "==", campaignId)
    .where("sessionIds", "array-contains", sessionId)
    .get();
  return enrichCampaignEvents(db, snap.docs.map(toCampaignEvent));
}

export async function getAvailableEvents(
  userId: string,
  campaignId: string,
): Promise<{ id: string; title: string }[]> {
  const db = adminDb();
  const [allSnap, campaignSnap] = await Promise.all([
    db.collection(EVENTS_COL).where("userId", "==", userId).orderBy("titleLower").get(),
    db.collection(CAMPAIGN_EVENTS_COL).where("campaignId", "==", campaignId).get(),
  ]);
  const alreadyLinked = new Set(campaignSnap.docs.map((d) => d.data().eventId as string));
  return allSnap.docs
    .filter((d) => !alreadyLinked.has(d.id))
    .map((d) => ({ id: d.id, title: d.data().title as string }));
}

export async function getGlobalEventsWithCampaigns(userId: string): Promise<{
  events: CampaignEvent[];
  eventCampaigns: Map<string, string[]>;
  campaignMap: Map<string, Campaign>;
}> {
  const db = adminDb();

  const [eventsSnap, campaignEventsSnap, campaignsSnap] = await Promise.all([
    db.collection(EVENTS_COL).where("userId", "==", userId).orderBy("titleLower").get(),
    db.collection(CAMPAIGN_EVENTS_COL).where("userId", "==", userId).get(),
    db.collection(CAMPAIGNS_COL).where("userId", "==", userId).get(),
  ]);

  const campaignMap = new Map<string, Campaign>(
    campaignsSnap.docs.map((doc) => [doc.id, toCampaign(doc)])
  );

  const eventCampaigns = new Map<string, string[]>();
  campaignEventsSnap.docs.forEach((doc) => {
    const d = doc.data();
    const list = eventCampaigns.get(d.eventId as string) ?? [];
    list.push(d.campaignId as string);
    eventCampaigns.set(d.eventId as string, list);
  });

  const events = eventsSnap.docs.map(toEvent);

  return { events, eventCampaigns, campaignMap };
}

/**
 * Fetch global event docs to enrich a list of campaign event stubs.
 * Uses db.getAll() to send a single batch RPC instead of N individual reads.
 */
async function enrichCampaignEvents(
  db: FirebaseFirestore.Firestore,
  campaignEvents: CampaignEvent[],
): Promise<CampaignEvent[]> {
  if (campaignEvents.length === 0) return [];

  const refs = campaignEvents.map((e) => db.collection(EVENTS_COL).doc(e.id));
  const globalDocs = await db.getAll(...refs);

  return campaignEvents
    .map((ce, i) => {
      const globalDoc = globalDocs[i];
      if (!globalDoc.exists) return null;
      const ge = toEvent(globalDoc);
      return {
        ...ce,
        title: ge.title,
        event_type: ge.event_type,
        start_date: ge.start_date,
        end_date: ge.end_date,
        description: ge.description,
        private_notes: ge.private_notes,
        image_url: ge.image_url,
      };
    })
    .filter((e): e is CampaignEvent => e !== null);
}
