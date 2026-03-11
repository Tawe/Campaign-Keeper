import { adminDb } from "@/lib/firebase/admin";
import { toCampaignEvent, toEvent } from "@/lib/firebase/converters";
import { CAMPAIGN_EVENTS_COL, EVENTS_COL } from "@/lib/firebase/db";
import type { CampaignEvent } from "@/types";

export async function getCampaignEvents(campaignId: string): Promise<CampaignEvent[]> {
  const db = adminDb();
  const [eventsSnap, campaignEventsSnap] = await Promise.all([
    db.collection(EVENTS_COL).get(), // We'll filter below
    db.collection(CAMPAIGN_EVENTS_COL).where("campaignId", "==", campaignId).orderBy("createdAt", "desc").get(),
  ]);

  const globalMap = new Map(eventsSnap.docs.map((doc) => [doc.id, doc]));

  return campaignEventsSnap.docs
    .map((doc) => {
      const campaignEvent = toCampaignEvent(doc);
      const globalDoc = globalMap.get(campaignEvent.id);
      if (!globalDoc) return null;
      const globalEvent = toEvent(globalDoc);
      return {
        ...campaignEvent,
        title: globalEvent.title,
        event_type: globalEvent.event_type,
        start_date: globalEvent.start_date,
        end_date: globalEvent.end_date,
        description: globalEvent.description,
        private_notes: globalEvent.private_notes,
      };
    })
    .filter((e): e is CampaignEvent => e !== null);
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

/** Fetch global event docs to enrich a list of campaign event stubs. */
async function enrichCampaignEvents(
  db: FirebaseFirestore.Firestore,
  campaignEvents: CampaignEvent[],
): Promise<CampaignEvent[]> {
  if (campaignEvents.length === 0) return [];
  const globalDocs = await Promise.all(
    campaignEvents.map((e) => db.collection(EVENTS_COL).doc(e.id).get())
  );
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
      };
    })
    .filter((e): e is CampaignEvent => e !== null);
}
