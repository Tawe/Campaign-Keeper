import { cache } from "react";
import { randomUUID } from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import { toCampaign, toSession } from "@/lib/firebase/converters";
import {
  CAMPAIGNS_COL,
  CAMPAIGN_LOCATIONS_COL,
  NPC_MENTIONS_COL,
  PLAYERS_COL,
  SESSIONS_COL,
} from "@/lib/firebase/db";
import type { Campaign, NpcWithLastMention } from "@/types";

export async function getCampaign(campaignId: string, userId: string): Promise<Campaign | null> {
  const db = adminDb();
  const doc = await db.collection(CAMPAIGNS_COL).doc(campaignId).get();
  if (!doc.exists || doc.data()?.userId !== userId) return null;
  const campaign = toCampaign(doc);
  // Lazy migration: generate inviteToken for campaigns created before the field existed
  if (!campaign.invite_token) {
    const token = randomUUID();
    await db.collection(CAMPAIGNS_COL).doc(campaignId).update({ inviteToken: token });
    return { ...campaign, invite_token: token };
  }
  return campaign;
}

export const getCampaignPublic = cache(async (campaignId: string): Promise<Campaign | null> => {
  const db = adminDb();
  const doc = await db.collection(CAMPAIGNS_COL).doc(campaignId).get();
  if (!doc.exists) return null;
  return toCampaign(doc);
});

export const getUserCampaigns = cache(async (userId: string): Promise<Campaign[]> => {
  const db = adminDb();
  const snap = await db
    .collection(CAMPAIGNS_COL)
    .where("userId", "==", userId)
    .orderBy("updatedAt", "desc")
    .get();
  return snap.docs.map(toCampaign);
});

export async function getLatestSessionDates(userId: string, campaignIds: string[]): Promise<Record<string, string>> {
  if (campaignIds.length === 0) return {};
  const db = adminDb();
  const latestSessions: Record<string, string> = {};

  for (let i = 0; i < campaignIds.length; i += 30) {
    const chunk = campaignIds.slice(i, i + 30);
    const sessionsSnap = await db
      .collection(SESSIONS_COL)
      .where("campaignId", "in", chunk)
      .orderBy("date", "desc")
      .get();
    sessionsSnap.docs.forEach((doc) => {
      const s = toSession(doc);
      if (!latestSessions[s.campaign_id]) {
        latestSessions[s.campaign_id] = s.date;
      }
    });
  }

  return latestSessions;
}

export async function getCampaignCounts(campaignId: string): Promise<{ playerCount: number; locationCount: number }> {
  const db = adminDb();
  const [playersSnap, locationsSnap] = await Promise.all([
    db.collection(PLAYERS_COL).where("campaignId", "==", campaignId).count().get(),
    db.collection(CAMPAIGN_LOCATIONS_COL).where("campaignId", "==", campaignId).count().get(),
  ]);
  return {
    playerCount: playersSnap.data().count,
    locationCount: locationsSnap.data().count,
  };
}

export async function getCampaignNpcIndex(
  campaignId: string,
  sessionIds: string[],
  sessions: { id: string; date: string }[],
): Promise<NpcWithLastMention[]> {
  if (sessionIds.length === 0) return [];
  const db = adminDb();
  const npcMap = new Map<string, NpcWithLastMention>();

  for (let i = 0; i < sessionIds.length; i += 30) {
    const chunk = sessionIds.slice(i, i + 30);
    const mentionsSnap = await db
      .collection(NPC_MENTIONS_COL)
      .where("sessionId", "in", chunk)
      .get();

    mentionsSnap.docs.forEach((doc) => {
      const d = doc.data();
      const existing = npcMap.get(d.npcId);
      const sessionDate = sessions.find((s) => s.id === d.sessionId)?.date ?? "";
      if (!existing || sessionDate > existing.last_mentioned) {
        npcMap.set(d.npcId, {
          id: d.npcId,
          campaign_id: campaignId,
          name: d.npcName,
          disposition: d.npcDisposition ?? null,
          portrait_url: null,
          stats_link: null,
          status: null,
          last_scene: null,
          public_info: null,
          private_notes: null,
          race: null,
          sex: null,
          age: null,
          alignment: null,
          npc_class: [],
          faction_names: [],
          created_at: "",
          updated_at: "",
          last_mentioned: sessionDate,
          last_session_id: d.sessionId,
        });
      }
    });
  }

  return Array.from(npcMap.values()).sort(
    (a, b) => b.last_mentioned.localeCompare(a.last_mentioned)
  );
}
