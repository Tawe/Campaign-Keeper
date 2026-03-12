/**
 * Converts Firestore document snapshots to app-level types.
 * Handles Timestamp → ISO string conversion.
 */
import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { Attendance, Calendar, CampaignEvent, Campaign, ScheduledSession, Session, Thread, Npc, NpcClass, NpcMention, Player, Location, Faction } from "@/types";

function ts(val: unknown): string {
  if (!val) return new Date().toISOString();
  // Firestore Timestamp has .toDate()
  if (typeof (val as { toDate?: () => Date }).toDate === "function") {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return String(val);
}

export function toCampaign(doc: DocumentSnapshot): Campaign {
  const d = doc.data()!;
  const imageVersion = encodeURIComponent(ts(d.updatedAt));
  const image_url = d.imagePath ? `/api/portraits/campaign/${doc.id}?v=${imageVersion}` : null;
  return {
    id: doc.id,
    user_id: d.userId,
    name: d.name,
    system: d.system ?? null,
    participants: d.participants ?? [],
    invite_token: d.inviteToken ?? "",
    player_user_ids: d.playerUserIds ?? [],
    schedule_cadence: d.scheduleCadence ?? null,
    reminder_days_before: typeof d.reminderDaysBefore === "number" ? d.reminderDaysBefore : null,
    image_url,
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toSession(doc: DocumentSnapshot): Session {
  const d = doc.data()!;
  const r = d.dmReflection ?? null;
  return {
    id: doc.id,
    campaign_id: d.campaignId,
    date: d.date,
    share_token: d.shareToken ?? "",
    title: d.title ?? null,
    public_highlights: d.publicHighlights ?? [],
    private_notes: d.privateNotes ?? "",
    tags: d.tags ?? [],
    starting_location: d.startingLocation ?? null,
    time_passed: d.timePassed ?? null,
    characters: d.characters ?? [],
    npc_statuses: d.npcStatuses ?? [],
    loot: d.loot ?? [],
    in_game_date: d.inGameDate
      ? { year: d.inGameDate.year, month: d.inGameDate.month, day: d.inGameDate.day }
      : null,
    locations_visited: d.locationsVisited ?? [],
    dm_reflection: r
      ? {
          plot_advancement: r.plotAdvancement ?? null,
          key_events: r.keyEvents ?? [],
          most_engaged: r.mostEngaged ?? [],
          least_engaged: r.leastEngaged ?? [],
          memorable_moments: r.memorableMoments ?? [],
          combat_difficulty: r.combatDifficulty ?? null,
          combat_balance_issues: r.combatBalanceIssues ?? "",
          pacing: r.pacing ?? "",
          where_slowed_down: r.whereSlowedDown ?? "",
          next_session_prep: r.nextSessionPrep ?? "",
          personal_reflection: r.personalReflection ?? "",
        }
      : null,
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toThread(doc: DocumentSnapshot): Thread {
  const d = doc.data()!;
  return {
    id: doc.id,
    campaign_id: d.campaignId,
    session_id: d.sessionId,
    text: d.text,
    visibility: d.visibility,
    status: d.status,
    resolved_at: d.resolvedAt ? ts(d.resolvedAt) : null,
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

function parseNpcClasses(npcClass: unknown, level: unknown): NpcClass[] {
  // New format: already an array
  if (Array.isArray(npcClass)) {
    return (npcClass as unknown[])
      .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
      .map((c) => ({ name: String(c.name ?? ""), level: typeof c.level === "number" ? c.level : 0 }))
      .filter((c) => c.name.trim() !== "");
  }
  // Old format: string + separate level field
  if (typeof npcClass === "string" && npcClass.trim()) {
    return [{ name: npcClass.trim(), level: typeof level === "number" ? level : 0 }];
  }
  return [];
}

export function toNpc(doc: DocumentSnapshot): Npc {
  const d = doc.data()!;
  const portraitVersion = encodeURIComponent(ts(d.updatedAt));
  const portraitUrl =
    d.portraitUrl && typeof d.portraitUrl === "string"
      ? d.portraitUrl
      : d.portraitPath
        ? `/api/portraits/npc/${doc.id}?v=${portraitVersion}`
        : null;
  return {
    id: doc.id,
    campaign_id: d.campaignId ?? "",
    name: d.name,
    disposition: d.disposition ?? null,
    portrait_url: portraitUrl,
    stats_link: d.statsLink ?? null,
    status: d.status ?? null,
    last_scene: d.lastScene ?? null,
    public_info: d.publicInfo ?? null,
    private_notes: d.privateNotes ?? d.notes ?? null, // backward compat
    race: d.race ?? null,
    sex: d.sex ?? null,
    age: d.age ?? null,
    alignment: d.alignment ?? null,
    npc_class: parseNpcClasses(d.npcClass, d.level),
    faction_names: [],
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toCampaignNpc(doc: DocumentSnapshot): Npc {
  const d = doc.data()!;
  return {
    id: d.npcId,
    campaign_id: d.campaignId,
    name: d.name,
    disposition: d.disposition ?? null,
    portrait_url: null,
    stats_link: null,
    status: d.status ?? null,
    last_scene: d.lastScene ?? null,
    public_info: d.publicInfo ?? null,
    private_notes: d.privateNotes ?? d.notes ?? null,
    race: d.race ?? null,
    sex: null,
    age: null,
    alignment: null,
    npc_class: [],
    faction_names: Array.isArray(d.factionNames) ? d.factionNames : [],
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toLocation(doc: DocumentSnapshot): Location {
  const d = doc.data()!;
  const imageVersion = encodeURIComponent(ts(d.updatedAt));
  const imageUrl = d.imagePath ? `/api/portraits/location/${doc.id}?v=${imageVersion}` : null;
  return {
    id: doc.id,
    campaign_id: d.campaignId ?? "",
    name: d.name,
    image_url: imageUrl,
    parent_location_id: d.parentLocationId ?? null,
    terrain: Array.isArray(d.terrain) ? d.terrain : [],
    public_info: d.publicInfo ?? null,
    private_notes: d.privateNotes ?? null,
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toCampaignLocation(doc: DocumentSnapshot): Location {
  const d = doc.data()!;
  return {
    id: d.locationId,
    campaign_id: d.campaignId,
    name: d.name,
    image_url: null, // merged from global doc in getLocationWithCampaignData
    parent_location_id: d.parentLocationId ?? null,
    terrain: [], // merged from global doc in getLocationWithCampaignData
    public_info: d.publicInfo ?? null,
    private_notes: d.privateNotes ?? null,
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toPlayer(doc: DocumentSnapshot): Player {
  const d = doc.data()!;
  const portraitVersion = encodeURIComponent(ts(d.updatedAt));
  const portraitUrl =
    d.portraitUrl && typeof d.portraitUrl === "string"
      ? d.portraitUrl
      : d.portraitPath
        ? `/api/portraits/player/${doc.id}?v=${portraitVersion}`
        : null;
  return {
    id: doc.id,
    campaign_id: d.campaignId,
    name: d.name,
    portrait_url: portraitUrl,
    player_user_id: d.playerUserId ?? null,
    player_email: d.playerEmail ?? null,
    characters: (d.characters ?? []).map((c: Record<string, unknown>) => {
      const charId = (c.charId as string | undefined) ?? "";
      const charPortraitUrl = charId && (c.portraitPath as string | null)
        ? `/api/portraits/character/${doc.id}/${charId}?v=${portraitVersion}`
        : null;
      return {
        char_id: charId,
        name: c.name as string,
        class: (c.class as string | null) ?? null,
        race: (c.race as string | null) ?? null,
        level: (c.level as number | null) ?? null,
        stats_link: (c.statsLink as string | null) ?? null,
        portrait_url: charPortraitUrl,
      };
    }),
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toFaction(doc: DocumentSnapshot): Faction {
  const d = doc.data()!;
  return {
    id: doc.id,
    campaign_id: d.campaignId ?? "",
    name: d.name,
    // Intrinsic/historical (global)
    faction_type: d.factionType ?? null,
    alignment: d.alignment ?? null,
    founded: d.founded ?? null,
    // Dynamic fields — null here, overlaid from campaign_factions in merge
    status: null,
    influence: null,
    disbanded: null,
    member_count: null,
    home_base: null,
    leader_names: [],
    allegiances: [],
    enemies: [],
    public_info: d.publicInfo ?? null,
    private_notes: d.privateNotes ?? null,
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toCampaignFaction(doc: DocumentSnapshot): Faction {
  const d = doc.data()!;
  return {
    id: d.factionId,
    campaign_id: d.campaignId,
    name: d.name,
    // Global fields — overlaid from factions doc in getFactionWithCampaignData
    faction_type: null,
    alignment: null,
    founded: null,
    // Dynamic — campaign-specific
    status: d.status ?? null,
    influence: d.influence ?? null,
    disbanded: d.disbanded ?? null,
    member_count: d.memberCount ?? null,
    home_base: d.homeBase ?? null,
    leader_names: Array.isArray(d.leaderNames) ? d.leaderNames : [],
    allegiances: Array.isArray(d.allegiances) ? d.allegiances : [],
    enemies: Array.isArray(d.enemies) ? d.enemies : [],
    public_info: d.publicInfo ?? null,
    private_notes: d.privateNotes ?? null,
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

function parseInGameDate(val: unknown): { year: number; month: number; day: number } | null {
  if (!val || typeof val !== "object") return null;
  const v = val as Record<string, unknown>;
  if (typeof v.year !== "number" || typeof v.month !== "number" || typeof v.day !== "number") return null;
  return { year: v.year, month: v.month, day: v.day };
}

export function toEvent(doc: DocumentSnapshot): CampaignEvent {
  const d = doc.data()!;
  const imageVersion = encodeURIComponent(ts(d.updatedAt));
  const image_url = d.imagePath ? `/api/portraits/event/${doc.id}?v=${imageVersion}` : null;
  return {
    id: doc.id,
    campaign_id: "",  // filled in merge
    title: d.title,
    event_type: d.eventType ?? null,
    start_date: parseInGameDate(d.startDate),
    end_date: parseInGameDate(d.endDate),
    description: d.description ?? "",
    private_notes: d.privateNotes ?? "",
    image_url,
    npc_ids: [],
    location_id: null,
    faction_ids: [],
    player_ids: [],
    session_ids: [],
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toCampaignEvent(doc: DocumentSnapshot): CampaignEvent {
  const d = doc.data()!;
  return {
    id: d.eventId,
    campaign_id: d.campaignId,
    title: d.title,
    event_type: null,   // overlaid from global doc in merge
    start_date: null,
    end_date: null,
    description: "",
    private_notes: "",
    image_url: null,    // overlaid from global doc in merge
    npc_ids: Array.isArray(d.npcIds) ? d.npcIds : [],
    location_id: d.locationId ?? null,
    faction_ids: Array.isArray(d.factionIds) ? d.factionIds : [],
    player_ids: Array.isArray(d.playerIds) ? d.playerIds : [],
    session_ids: Array.isArray(d.sessionIds) ? d.sessionIds : [],
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toCalendar(doc: DocumentSnapshot): Calendar {
  const d = doc.data()!;
  return {
    id: doc.id,
    campaign_id: d.campaignId,
    name: d.name,
    year_label: d.yearLabel ?? "",
    start_year: typeof d.startYear === "number" ? d.startYear : null,
    months: Array.isArray(d.months)
      ? d.months.map((m: { name: string; days: number }) => ({ name: m.name, days: m.days }))
      : [],
    weekdays: Array.isArray(d.weekdays) ? d.weekdays : [],
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toScheduledSession(doc: DocumentSnapshot): ScheduledSession {
  const d = doc.data()!;
  return {
    id: doc.id,
    campaign_id: d.campaignId,
    date: d.date,
    time: d.time ?? null,
    title: d.title ?? null,
    notes: d.notes ?? null,
    status: d.status ?? "upcoming",
    invite_email_sent_at: d.inviteEmailSentAt ? ts(d.inviteEmailSentAt) : null,
    reminder_email_sent_at: d.reminderEmailSentAt ? ts(d.reminderEmailSentAt) : null,
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toAttendance(doc: DocumentSnapshot): Attendance {
  const d = doc.data()!;
  return {
    id: doc.id,
    scheduled_session_id: d.scheduledSessionId,
    campaign_id: d.campaignId,
    player_id: d.playerId,
    player_name: d.playerName,
    player_email: d.playerEmail,
    rsvp_token: d.rsvpToken,
    status: d.status ?? "pending",
    message: d.message ?? null,
    responded_at: d.respondedAt ? ts(d.respondedAt) : null,
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toNpcMention(doc: DocumentSnapshot): NpcMention & {
  npcName: string;
  npcDisposition: string | null;
} {
  const d = doc.data()!;
  return {
    id: doc.id,
    npc_id: d.npcId,
    session_id: d.sessionId,
    visibility: d.visibility,
    note: d.note ?? null,
    created_at: ts(d.createdAt),
    npcName: d.npcName,
    npcDisposition: d.npcDisposition ?? null,
  };
}
