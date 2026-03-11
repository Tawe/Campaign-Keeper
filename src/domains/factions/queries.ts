import { adminDb } from "@/lib/firebase/admin";
import { toCampaign, toCampaignFaction, toCampaignNpc, toFaction } from "@/lib/firebase/converters";
import { CAMPAIGNS_COL, CAMPAIGN_FACTIONS_COL, CAMPAIGN_NPCS_COL, FACTIONS_COL } from "@/lib/firebase/db";
import type { Campaign, Faction, Npc } from "@/types";

export async function getCampaignFactions(campaignId: string): Promise<Faction[]> {
  const db = adminDb();
  const snap = await db
    .collection(CAMPAIGN_FACTIONS_COL)
    .where("campaignId", "==", campaignId)
    .orderBy("name")
    .get();
  return snap.docs.map(toCampaignFaction);
}

export async function getFactionWithCampaignData(factionId: string, campaignId: string): Promise<Faction | null> {
  const db = adminDb();

  const linkRef = db.collection(CAMPAIGN_FACTIONS_COL).doc(`${campaignId}_${factionId}`);
  const [factionDoc, linkDoc] = await Promise.all([
    db.collection(FACTIONS_COL).doc(factionId).get(),
    linkRef.get(),
  ]);

  // Fall back to compound query for legacy session-seeded docs
  let campaignFactionDoc = linkDoc.exists ? linkDoc : null;
  if (!campaignFactionDoc) {
    const snap = await db
      .collection(CAMPAIGN_FACTIONS_COL)
      .where("campaignId", "==", campaignId)
      .where("factionId", "==", factionId)
      .limit(1)
      .get();
    campaignFactionDoc = snap.empty ? null : snap.docs[0];
  }

  if (!factionDoc.exists || !campaignFactionDoc) return null;

  // Merge: global doc provides intrinsic facts (type, alignment, founded);
  // campaign doc provides dynamic/timeline-specific fields (status, leaders, etc.)
  const globalFaction = toFaction(factionDoc);
  const campaignFaction = toCampaignFaction(campaignFactionDoc);
  return {
    ...campaignFaction,
    campaign_id: campaignId,
    name: campaignFaction.name || globalFaction.name,
    faction_type: globalFaction.faction_type,
    alignment: globalFaction.alignment,
    founded: globalFaction.founded,
  };
}

/** NPCs in a given campaign whose faction_names includes this faction. */
export async function getNpcsInFaction(campaignId: string, factionName: string): Promise<Npc[]> {
  if (!factionName.trim()) return [];
  const db = adminDb();
  const snap = await db
    .collection(CAMPAIGN_NPCS_COL)
    .where("campaignId", "==", campaignId)
    .where("factionNames", "array-contains", factionName)
    .get();
  return snap.docs.map(toCampaignNpc);
}

export async function getAvailableFactions(
  userId: string,
  campaignId: string,
): Promise<{ id: string; name: string }[]> {
  const db = adminDb();
  const [allSnap, campaignSnap] = await Promise.all([
    db.collection(FACTIONS_COL).where("userId", "==", userId).orderBy("name").get(),
    db.collection(CAMPAIGN_FACTIONS_COL).where("campaignId", "==", campaignId).get(),
  ]);
  const alreadyLinked = new Set(campaignSnap.docs.map((d) => d.data().factionId as string));
  return allSnap.docs
    .filter((d) => !alreadyLinked.has(d.id))
    .map((d) => ({ id: d.id, name: d.data().name as string }));
}

export async function getGlobalFactionsWithCampaigns(userId: string): Promise<{
  factions: Faction[];
  factionCampaigns: Map<string, { campaignId: string; status: string | null; influence: string | null }[]>;
  campaignMap: Map<string, Campaign>;
}> {
  const db = adminDb();

  const [factionsSnap, campaignFactionsSnap, campaignsSnap] = await Promise.all([
    db.collection(FACTIONS_COL).where("userId", "==", userId).orderBy("name").get(),
    db.collection(CAMPAIGN_FACTIONS_COL).where("userId", "==", userId).get(),
    db.collection(CAMPAIGNS_COL).where("userId", "==", userId).get(),
  ]);

  const campaignMap = new Map<string, Campaign>(
    campaignsSnap.docs.map((doc) => [doc.id, toCampaign(doc)])
  );

  const factionCampaigns = new Map<string, { campaignId: string; status: string | null; influence: string | null }[]>();
  campaignFactionsSnap.docs.forEach((doc) => {
    const d = doc.data();
    const list = factionCampaigns.get(d.factionId) ?? [];
    list.push({
      campaignId: d.campaignId,
      status: (d.status as string | null) ?? null,
      influence: (d.influence as string | null) ?? null,
    });
    factionCampaigns.set(d.factionId, list);
  });

  const factions = factionsSnap.docs.map(toFaction).filter((f) => factionCampaigns.has(f.id));

  return { factions, factionCampaigns, campaignMap };
}
