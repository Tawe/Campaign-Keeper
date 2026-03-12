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
  invite_token: string;
  player_user_ids: string[];
  schedule_cadence: string | null;
  reminder_days_before: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface InGameDate {
  year: number;
  month: number; // 1-based index into Calendar.months
  day: number;
}

export interface Session {
  id: string;
  campaign_id: string;
  date: string;
  in_game_date: InGameDate | null;
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

export interface NpcClass {
  name: string;
  level: number;
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
  race: string | null;
  sex: string | null;
  age: string | null;
  alignment: string | null;
  npc_class: NpcClass[];      // multi-class support; stored as array in global npcs doc
  faction_names: string[];    // campaign-specific faction membership (stored in campaign_npcs)
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  campaign_id: string;
  name: string;
  image_url: string | null;
  parent_location_id: string | null;
  terrain: string[];           // type tags e.g. ["Village", "Glacier"]
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
  char_id: string;
  name: string;
  class: string | null;
  race: string | null;
  level: number | null;
  stats_link: string | null;
  portrait_url: string | null;
}

export interface Player {
  id: string;
  campaign_id: string;
  name: string;
  portrait_url: string | null;
  player_user_id: string | null;
  player_email: string | null;
  characters: PlayerCharacter[];
  created_at: string;
  updated_at: string;
}

export interface Faction {
  id: string;
  campaign_id: string;
  name: string;
  image_url: string | null;
  status: string | null;
  influence: string | null;
  faction_type: string | null;
  alignment: string | null;
  founded: string | null;
  disbanded: string | null;
  member_count: string | null;
  home_base: string | null;
  leader_names: string[];
  allegiances: string[];
  enemies: string[];
  public_info: string | null;
  private_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FactionWithCampaigns extends Faction {
  campaign_ids: string[];
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

export interface CampaignEvent {
  id: string;              // global event ID
  campaign_id: string;
  title: string;
  event_type: string | null;
  start_date: InGameDate | null;
  end_date: InGameDate | null;
  description: string;
  private_notes: string;
  image_url: string | null;
  npc_ids: string[];
  location_id: string | null;
  faction_ids: string[];
  player_ids: string[];
  session_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CalendarMonth {
  name: string;
  days: number;
}

export interface Calendar {
  id: string;          // = campaignId
  campaign_id: string;
  name: string;
  year_label: string;
  start_year: number | null;
  months: CalendarMonth[];
  weekdays: string[];
  created_at: string;
  updated_at: string;
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

export type AttendanceStatus = "pending" | "attending" | "not_attending" | "maybe";

export interface ScheduledSession {
  id: string;
  campaign_id: string;
  date: string;                          // YYYY-MM-DD
  time: string | null;                   // HH:MM display
  title: string | null;
  notes: string | null;
  status: "upcoming" | "cancelled";
  invite_email_sent_at: string | null;   // ISO string
  reminder_email_sent_at: string | null; // ISO string
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  scheduled_session_id: string;
  campaign_id: string;
  player_id: string;
  player_name: string;
  player_email: string;
  rsvp_token: string;
  status: AttendanceStatus;
  message: string | null;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledSessionWithAttendance extends ScheduledSession {
  attendance: Attendance[];
}
