/**
 * Firestore collection name constants and document type interfaces.
 * Use these with the Admin SDK: adminDb().collection(CAMPAIGNS_COL)
 */

export const CAMPAIGNS_COL = "campaigns";
export const SESSIONS_COL = "sessions";
export const THREADS_COL = "threads";
export const NPCS_COL = "npcs";
export const NPC_MENTIONS_COL = "npc_mentions";
export const POLL_RESPONSES_COL = "poll_responses";
export const PLAYERS_COL = "players";
export const LOCATIONS_COL = "locations";
export const LOCATION_VISITS_COL = "location_visits";

// Firestore document shapes (snake_case fields to match existing app types)

export interface CampaignDoc {
  userId: string;
  name: string;
  system: string | null;
  participants: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface SessionDoc {
  campaignId: string;
  userId: string;
  shareToken: string | null;
  date: string; // YYYY-MM-DD
  title: string | null;
  publicHighlights: string[];
  privateNotes: string;
  tags: string[];
  // Session details (DM-facing)
  startingLocation: string | null;
  timePassed: string | null;
  characters: { name: string; statusAtEnd: string }[];
  npcStatuses: { name: string; statusAtEnd: string }[];
  loot: string[];
  locationsVisited: string[];
  // DM Reflection
  dmReflection: {
    plotAdvancement: boolean | null;
    keyEvents: string[];
    mostEngaged: string[];
    leastEngaged: string[];
    memorableMoments: string[];
    combatDifficulty: "low" | "moderate" | "hard" | null;
    combatBalanceIssues: string;
    pacing: string;
    whereSlowedDown: string;
    nextSessionPrep: string;
    personalReflection: string;
  } | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface ThreadDoc {
  campaignId: string;
  sessionId: string;
  userId: string;
  text: string;
  visibility: "public" | "private";
  status: "open" | "resolved";
  resolvedAt: FirebaseFirestore.Timestamp | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface NpcDoc {
  campaignId: string;
  userId: string;
  name: string;
  nameLower: string; // for case-insensitive dedup queries
  disposition: "ally" | "enemy" | "neutral" | "unknown" | null;
  portraitPath: string | null;
  portraitUrl: string | null;
  statsLink: string | null;
  status: string | null;       // current NPC status, auto-updated from session npcStatuses
  lastScene: string | null;    // last known location, auto-updated from session location
  lastSeenDate: string | null; // YYYY-MM-DD, used to gate auto-updates to most-recent session
  publicInfo: string | null;   // player-visible notes
  privateNotes: string | null; // DM-only notes (was `notes`)
  notes: string | null;        // legacy field — read via converter fallback
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface LocationDoc {
  campaignId: string;
  userId: string;
  name: string;
  nameLower: string;
  publicInfo: string | null;
  privateNotes: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface LocationVisitDoc {
  locationId: string;
  sessionId: string;
  campaignId: string;
  userId: string;
  locationName: string; // denormalized
  createdAt: FirebaseFirestore.Timestamp;
}

export interface PlayerDoc {
  campaignId: string;
  userId: string;
  name: string;
  portraitPath: string | null;
  portraitUrl: string | null;
  characters: {
    name: string;
    nameLower: string;
    class: string | null;
    race: string | null;
    level: number | null;
    statsLink: string | null;
  }[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface PollResponseDoc {
  sessionId: string;
  campaignId: string;
  playerName: string | null;
  enjoyment: number; // 1–5
  liked: string;
  improve: string;
  lookingForward: string;
  createdAt: FirebaseFirestore.Timestamp;
}

export interface NpcMentionDoc {
  npcId: string;
  sessionId: string;
  campaignId: string;
  userId: string;
  visibility: "public" | "private";
  note: string | null;
  // Denormalized NPC data for fast reads
  npcName: string;
  npcDisposition: "ally" | "enemy" | "neutral" | "unknown" | null;
  createdAt: FirebaseFirestore.Timestamp;
}
