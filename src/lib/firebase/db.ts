/**
 * Firestore collection name constants and document type interfaces.
 * Use these with the Admin SDK: adminDb().collection(CAMPAIGNS_COL)
 */

export const CAMPAIGNS_COL = "campaigns";
export const SESSIONS_COL = "sessions";
export const THREADS_COL = "threads";
export const NPCS_COL = "npcs";
export const CAMPAIGN_NPCS_COL = "campaign_npcs";
export const NPC_MENTIONS_COL = "npc_mentions";
export const POLL_RESPONSES_COL = "poll_responses";
export const PLAYERS_COL = "players";
export const LOCATIONS_COL = "locations";
export const CAMPAIGN_LOCATIONS_COL = "campaign_locations";
export const LOCATION_VISITS_COL = "location_visits";
export const FACTIONS_COL = "factions";
export const CAMPAIGN_FACTIONS_COL = "campaign_factions";
export const CALENDARS_COL = "calendars";
export const EVENTS_COL = "events";
export const CAMPAIGN_EVENTS_COL = "campaign_events";

// Firestore document shapes (snake_case fields to match existing app types)

export interface CampaignDoc {
  userId: string;
  name: string;
  system: string | null;
  participants: string[];
  inviteToken: string;
  playerUserIds: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface SessionDoc {
  campaignId: string;
  userId: string;
  shareToken: string | null;
  date: string; // YYYY-MM-DD
  inGameDate: { year: number; month: number; day: number } | null;
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
  userId: string;
  name: string;
  nameLower: string; // for case-insensitive dedup queries
  portraitPath: string | null;
  portraitUrl: string | null;
  statsLink: string | null;
  publicInfo: string | null;   // library notes shared across campaigns
  privateNotes: string | null; // library notes shared across campaigns
  notes: string | null;        // legacy field — read via converter fallback
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CampaignNpcDoc {
  campaignId: string;
  npcId: string;
  userId: string;
  name: string;
  nameLower: string;
  disposition: "ally" | "enemy" | "neutral" | "unknown" | null;
  status: string | null;       // current NPC status, auto-updated from session npcStatuses
  lastScene: string | null;    // last known location, auto-updated from session location
  lastSeenDate: string | null; // YYYY-MM-DD, used to gate auto-updates to most-recent session
  publicInfo: string | null;   // player-visible notes
  privateNotes: string | null; // DM-only notes (was `notes`)
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface LocationDoc {
  userId: string;
  name: string;
  nameLower: string;
  imagePath: string | null;
  parentLocationId: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CampaignLocationDoc {
  campaignId: string;
  locationId: string;
  userId: string;
  name: string;
  nameLower: string;
  parentLocationId: string | null; // denormalized from locations doc
  publicInfo: string | null;
  privateNotes: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface LocationVisitDoc {
  campaignLocationId: string | null;
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
  playerUserId: string | null;
  playerEmail: string | null;
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

export interface FactionDoc {
  userId: string;
  name: string;
  nameLower: string;
  // Intrinsic/historical — same across all campaigns
  factionType: string | null;
  alignment: string | null;
  founded: string | null;
  publicInfo: string | null;
  privateNotes: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CampaignFactionDoc {
  campaignId: string;
  factionId: string;
  userId: string;
  name: string;
  nameLower: string;
  // Dynamic — campaign-specific (can differ between campaigns/timelines)
  status: string | null;
  influence: string | null;
  disbanded: string | null;
  memberCount: string | null;
  homeBase: string | null;
  leaderNames: string[];
  allegiances: string[];
  enemies: string[];
  publicInfo: string | null;
  privateNotes: string | null;
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

export interface EventDoc {
  userId: string;
  title: string;
  titleLower: string;
  eventType: string | null;   // free text
  startDate: { year: number; month: number; day: number } | null;
  endDate: { year: number; month: number; day: number } | null;
  description: string;        // public write-up
  privateNotes: string;       // DM only
  imagePath: string | null;   // S3 path for background image
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CampaignEventDoc {
  campaignId: string;
  eventId: string;
  userId: string;
  title: string;     // denormalized
  titleLower: string;
  // Campaign-specific associations
  npcIds: string[];
  locationId: string | null;
  factionIds: string[];
  playerIds: string[];
  sessionIds: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface CalendarDoc {
  campaignId: string;
  userId: string;
  name: string;       // e.g. "Calendar of Harptos"
  yearLabel: string;  // e.g. "DR"
  months: { name: string; days: number }[];
  weekdays: string[];
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export interface NpcMentionDoc {
  campaignNpcId: string | null;
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
