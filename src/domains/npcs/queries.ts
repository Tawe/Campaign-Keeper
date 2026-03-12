import { adminDb } from "@/lib/firebase/admin";
import { toCampaign, toCampaignNpc, toNpc, toSession } from "@/lib/firebase/converters";
import {
  CAMPAIGN_NPCS_COL,
  CAMPAIGNS_COL,
  NPC_MENTIONS_COL,
  NPCS_COL,
  SESSIONS_COL,
} from "@/lib/firebase/db";
import type { Campaign, Npc, NpcWithLastMention } from "@/types";

export async function getCampaignNpcs(campaignId: string): Promise<Npc[]> {
  const db = adminDb();
  const snap = await db
    .collection(CAMPAIGN_NPCS_COL)
    .where("campaignId", "==", campaignId)
    .orderBy("name")
    .get();
  return snap.docs.map(toCampaignNpc);
}

export async function getCampaignNpcsWithMentions(campaignId: string): Promise<NpcWithLastMention[]> {
  const db = adminDb();

  const [npcsSnap, sessionsSnap] = await Promise.all([
    db.collection(CAMPAIGN_NPCS_COL).where("campaignId", "==", campaignId).orderBy("name").get(),
    db.collection(SESSIONS_COL).where("campaignId", "==", campaignId).orderBy("date", "desc").get(),
  ]);

  const sessions = sessionsSnap.docs.map((doc) => ({
    id: doc.id,
    date: doc.data().date as string,
  }));

  // Batch-fetch global NPC docs to get portrait_url, race, npc_class, faction_names
  const globalByNpcId = new Map<string, Partial<Npc>>();
  if (npcsSnap.size > 0) {
    const npcIds = npcsSnap.docs.map((d) => d.data().npcId as string);
    const globalRefs = npcIds.map((id) => db.collection(NPCS_COL).doc(id));
    const globalDocs = await db.getAll(...globalRefs);
    globalDocs.forEach((gDoc) => {
      if (!gDoc.exists) return;
      const g = toNpc(gDoc);
      globalByNpcId.set(gDoc.id, {
        portrait_url: g.portrait_url,
        race: g.race,
        npc_class: g.npc_class,
        faction_names: g.faction_names,
      });
    });
  }

  const npcMap = new Map<string, NpcWithLastMention>();
  npcsSnap.docs.forEach((doc) => {
    const npc = toCampaignNpc(doc);
    const global = globalByNpcId.get(npc.id);
    npcMap.set(npc.id, { ...npc, ...global, last_mentioned: "", last_session_id: "" });
  });

  if (sessions.length > 0) {
    const sessionIds = sessions.map((s) => s.id);
    for (let i = 0; i < sessionIds.length; i += 30) {
      const chunk = sessionIds.slice(i, i + 30);
      const mentionsSnap = await db
        .collection(NPC_MENTIONS_COL)
        .where("sessionId", "in", chunk)
        .get();

      mentionsSnap.docs.forEach((doc) => {
        const d = doc.data();
        const existing = npcMap.get(d.npcId);
        if (!existing) return;
        const sessionDate = sessions.find((s) => s.id === d.sessionId)?.date ?? "";
        if (!existing.last_mentioned || sessionDate > existing.last_mentioned) {
          npcMap.set(d.npcId, { ...existing, last_mentioned: sessionDate, last_session_id: d.sessionId });
        }
      });
    }
  }

  return Array.from(npcMap.values()).sort(
    (a, b) => b.last_mentioned.localeCompare(a.last_mentioned)
  );
}

export async function getNpcWithCampaignData(npcId: string, campaignId: string) {
  const db = adminDb();

  const linkRef = db.collection(CAMPAIGN_NPCS_COL).doc(`${campaignId}_${npcId}`);
  const [npcDoc, linkDoc] = await Promise.all([
    db.collection(NPCS_COL).doc(npcId).get(),
    linkRef.get(),
  ]);

  // Fall back to compound query for legacy session-seeded docs
  let campaignNpcDoc = linkDoc.exists ? linkDoc : null;
  if (!campaignNpcDoc) {
    const snap = await db
      .collection(CAMPAIGN_NPCS_COL)
      .where("campaignId", "==", campaignId)
      .where("npcId", "==", npcId)
      .limit(1)
      .get();
    campaignNpcDoc = snap.empty ? null : snap.docs[0];
  }

  if (!npcDoc.exists || !campaignNpcDoc) return null;

  const libraryNpc = toNpc(npcDoc);
  const campaignNpc = toCampaignNpc(campaignNpcDoc);

  return {
    ...libraryNpc,
    campaign_id: campaignId,
    name: campaignNpc.name || libraryNpc.name,
    disposition: campaignNpc.disposition,
    status: campaignNpc.status,
    last_scene: campaignNpc.last_scene,
    public_info: campaignNpc.public_info,
    private_notes: campaignNpc.private_notes,
    faction_names: campaignNpc.faction_names,
  };
}

export async function getNpcMentionHistory(npcId: string, campaignId: string) {
  const db = adminDb();

  const mentionsSnap = await db
    .collection(NPC_MENTIONS_COL)
    .where("campaignId", "==", campaignId)
    .where("npcId", "==", npcId)
    .orderBy("createdAt")
    .get();

  const sessionIds = [...new Set(mentionsSnap.docs.map((d) => d.data().sessionId))];
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

  return { mentionsSnap, sessionMap };
}

export async function getAvailableNpcs(
  userId: string,
  campaignId: string,
): Promise<{ id: string; name: string }[]> {
  const db = adminDb();
  const [allSnap, campaignSnap] = await Promise.all([
    db.collection(NPCS_COL).where("userId", "==", userId).orderBy("name").get(),
    db.collection(CAMPAIGN_NPCS_COL).where("campaignId", "==", campaignId).get(),
  ]);
  const alreadyLinked = new Set(campaignSnap.docs.map((d) => d.data().npcId as string));
  return allSnap.docs
    .filter((d) => !alreadyLinked.has(d.id))
    .map((d) => ({ id: d.id, name: d.data().name as string }));
}

export async function getGlobalNpcsWithCampaigns(userId: string): Promise<{
  npcs: Npc[];
  npcCampaigns: Map<string, { campaignId: string; status: string | null; disposition: string | null }[]>;
  campaignMap: Map<string, Campaign>;
}> {
  const db = adminDb();

  const [npcsSnap, campaignNpcsSnap, campaignsSnap] = await Promise.all([
    db.collection(NPCS_COL).where("userId", "==", userId).orderBy("name").get(),
    db.collection(CAMPAIGN_NPCS_COL).where("userId", "==", userId).get(),
    db.collection(CAMPAIGNS_COL).where("userId", "==", userId).get(),
  ]);

  const campaignMap = new Map<string, Campaign>(
    campaignsSnap.docs.map((doc) => [doc.id, toCampaign(doc)])
  );

  const npcCampaigns = new Map<string, { campaignId: string; status: string | null; disposition: string | null }[]>();
  campaignNpcsSnap.docs.forEach((doc) => {
    const d = doc.data();
    const list = npcCampaigns.get(d.npcId) ?? [];
    list.push({
      campaignId: d.campaignId,
      status: (d.status as string | null) ?? null,
      disposition: (d.disposition as string | null) ?? null,
    });
    npcCampaigns.set(d.npcId, list);
  });

  const npcs = npcsSnap.docs.map(toNpc).filter((npc) => npcCampaigns.has(npc.id));

  return { npcs, npcCampaigns, campaignMap };
}
