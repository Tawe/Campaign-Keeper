import { adminDb } from "@/lib/firebase/admin";
import { toCampaign, toPlayer } from "@/lib/firebase/converters";
import { CAMPAIGNS_COL, PLAYERS_COL, SESSIONS_COL } from "@/lib/firebase/db";
import type { Campaign, Player } from "@/types";

type CharStats = { sessionCount: number; lastSeen: string | null; lastStatus: string | null };

export async function getCampaignPlayers(campaignId: string): Promise<Player[]> {
  const db = adminDb();
  const snap = await db
    .collection(PLAYERS_COL)
    .where("campaignId", "==", campaignId)
    .orderBy("name")
    .get();
  return snap.docs.map(toPlayer);
}

export async function getCampaignPlayersWithStats(campaignId: string): Promise<{
  players: Player[];
  statsMap: Map<string, CharStats>;
}> {
  const db = adminDb();

  const [playersSnap, sessionsSnap] = await Promise.all([
    db.collection(PLAYERS_COL).where("campaignId", "==", campaignId).orderBy("name").get(),
    db.collection(SESSIONS_COL).where("campaignId", "==", campaignId).orderBy("date", "desc").get(),
  ]);

  const players = playersSnap.docs.map(toPlayer);

  const statsMap = new Map<string, CharStats>();
  for (const doc of sessionsSnap.docs) {
    const d = doc.data();
    const sessionDate = d.date as string;
    const characters = (d.characters ?? []) as { name: string; status_at_end?: string; statusAtEnd?: string }[];
    for (const sc of characters) {
      const key = sc.name.toLowerCase();
      const status = sc.status_at_end ?? sc.statusAtEnd ?? null;
      const existing = statsMap.get(key);
      const isNewer = !existing?.lastSeen || sessionDate > existing.lastSeen;
      statsMap.set(key, {
        sessionCount: (existing?.sessionCount ?? 0) + 1,
        lastSeen: isNewer ? sessionDate : (existing?.lastSeen ?? null),
        lastStatus: isNewer ? status : (existing?.lastStatus ?? null),
      });
    }
  }

  return { players, statsMap };
}

export async function getPlayer(playerId: string): Promise<Player | null> {
  const db = adminDb();
  const doc = await db.collection(PLAYERS_COL).doc(playerId).get();
  if (!doc.exists) return null;
  return toPlayer(doc);
}

export async function getPlayerWithSessions(
  playerId: string,
  campaignId: string,
  userId: string
): Promise<{
  player: Player;
  charSessionMap: Map<string, { id: string; date: string; title: string | null; statusAtEnd: string }[]>;
} | null> {
  const db = adminDb();

  const [playerDoc, sessionsSnap] = await Promise.all([
    db.collection(PLAYERS_COL).doc(playerId).get(),
    db.collection(SESSIONS_COL).where("campaignId", "==", campaignId).orderBy("date", "desc").get(),
  ]);

  if (!playerDoc.exists || playerDoc.data()?.userId !== userId) return null;
  const player = toPlayer(playerDoc);
  if (player.campaign_id !== campaignId) return null;

  const sessions = sessionsSnap.docs.map((doc) => ({
    id: doc.id,
    date: doc.data().date as string,
    title: (doc.data().title ?? null) as string | null,
    characters: (doc.data().characters ?? []) as { name: string; statusAtEnd: string }[],
  }));

  const charSessionMap = new Map<
    string,
    { id: string; date: string; title: string | null; statusAtEnd: string }[]
  >();
  for (const char of player.characters) {
    charSessionMap.set(char.name.toLowerCase(), []);
  }
  for (const session of sessions) {
    for (const sc of session.characters) {
      const key = sc.name.toLowerCase();
      if (charSessionMap.has(key)) {
        charSessionMap.get(key)!.push({
          id: session.id,
          date: session.date,
          title: session.title,
          statusAtEnd: sc.statusAtEnd,
        });
      }
    }
  }

  return { player, charSessionMap };
}

export async function getGlobalPlayers(userId: string): Promise<{
  players: Player[];
  campaignMap: Map<string, Campaign>;
}> {
  const db = adminDb();

  const [playersSnap, campaignsSnap] = await Promise.all([
    db.collection(PLAYERS_COL).where("userId", "==", userId).orderBy("name").get(),
    db.collection(CAMPAIGNS_COL).where("userId", "==", userId).get(),
  ]);

  const campaignMap = new Map<string, Campaign>(
    campaignsSnap.docs.map((doc) => [doc.id, toCampaign(doc)])
  );

  const players = playersSnap.docs.map(toPlayer);

  return { players, campaignMap };
}

export async function getPlayerMemberships(playerUserId: string): Promise<{
  players: Player[];
  campaignMap: Map<string, Campaign>;
} | null> {
  const db = adminDb();

  const playersSnap = await db
    .collection(PLAYERS_COL)
    .where("playerUserId", "==", playerUserId)
    .get();

  if (playersSnap.empty) return null;

  const players = playersSnap.docs.map(toPlayer);
  const campaignIds = [...new Set(players.map((p) => p.campaign_id))];
  const campaignDocs = await Promise.all(
    campaignIds.map((id) => db.collection(CAMPAIGNS_COL).doc(id).get())
  );
  const campaignMap = new Map<string, Campaign>(
    campaignDocs
      .filter((doc) => doc.exists)
      .map((doc) => [doc.id, toCampaign(doc)])
  );

  return { players, campaignMap };
}
