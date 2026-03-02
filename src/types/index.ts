export type Visibility = "public" | "private";
export type ThreadStatus = "open" | "resolved";
export type NpcDisposition = "ally" | "enemy" | "neutral" | "unknown";
export type CombatDifficulty = "low" | "moderate" | "hard";

export interface DmReflection {
  plot_advancement: boolean | null;
  key_events: string[];
  most_engaged: string[];
  least_engaged: string[];
  memorable_moments: string[];
  combat_difficulty: CombatDifficulty | null;
  combat_balance_issues: string;
  pacing: string;
  where_slowed_down: string;
  next_session_prep: string;
  personal_reflection: string;
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  system: string | null;
  participants: string[];
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  campaign_id: string;
  date: string;
  title: string | null;
  public_highlights: string[];
  private_notes: string;
  tags: string[];
  // Session details (DM-facing)
  starting_location: string | null;
  time_passed: string | null;
  characters: { name: string; status_at_end: string }[];
  npc_statuses: { name: string; status_at_end: string }[];
  loot: string[];
  locations_visited: string[];
  dm_reflection: DmReflection | null;
  share_token: string;
  created_at: string;
  updated_at: string;
}

export interface Thread {
  id: string;
  campaign_id: string;
  session_id: string;
  text: string;
  visibility: Visibility;
  status: ThreadStatus;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Npc {
  id: string;
  campaign_id: string;
  name: string;
  disposition: NpcDisposition | null;
  portrait_url: string | null;
  stats_link: string | null;
  status: string | null;      // current status, auto-updated from sessions
  last_scene: string | null;  // last known location, auto-updated from sessions
  public_info: string | null;
  private_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  campaign_id: string;
  name: string;
  public_info: string | null;
  private_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NpcMention {
  id: string;
  npc_id: string;
  session_id: string;
  visibility: Visibility;
  note: string | null;
  created_at: string;
}

// Composed types for UI

export interface NpcWithLastMention extends Npc {
  last_mentioned: string; // session date
  last_session_id: string;
}

export interface LocationWithLastVisit extends Location {
  last_visited: string; // session date
  last_session_id: string;
}

export interface NpcMentionWithNpc extends NpcMention {
  npc: Npc;
}

export interface ThreadWithSession extends Thread {
  session_date: string;
  session_title: string | null;
}

export interface SessionWithCounts extends Session {
  thread_count: number;
  npc_count: number;
}

export interface PlayerCharacter {
  name: string;
  class: string | null;
  race: string | null;
  level: number | null;
  stats_link: string | null;
}

export interface Player {
  id: string;
  campaign_id: string;
  name: string;
  portrait_url: string | null;
  characters: PlayerCharacter[];
  created_at: string;
  updated_at: string;
}

export interface PollResponse {
  id: string;
  session_id: string;
  campaign_id: string;
  player_name: string | null;
  enjoyment: number; // 1–5
  liked: string;
  improve: string;
  looking_forward: string;
  created_at: string;
}

// Recap types (pure — no Supabase dependency)

export interface RecapThread {
  text: string;
  status: ThreadStatus;
  visibility: Visibility;
}

export interface RecapNpcMention {
  npcName: string;
  disposition: NpcDisposition | null;
  note: string | null;
  visibility: Visibility;
}

export interface RecapContent {
  sessionTitle: string | null;
  sessionDate: string;
  highlights: string[];
  threads: RecapThread[];
  npcMentions: RecapNpcMention[];
  privateNotes?: string; // DM recap only
}
