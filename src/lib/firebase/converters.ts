/**
 * Converts Firestore document snapshots to app-level types.
 * Handles Timestamp → ISO string conversion.
 */
import type { DocumentSnapshot } from "firebase-admin/firestore";
import type { Campaign, Session, Thread, Npc, NpcMention, Player, Location } from "@/types";

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
  return {
    id: doc.id,
    user_id: d.userId,
    name: d.name,
    system: d.system ?? null,
    participants: d.participants ?? [],
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
    campaign_id: d.campaignId,
    name: d.name,
    disposition: d.disposition ?? null,
    portrait_url: portraitUrl,
    stats_link: d.statsLink ?? null,
    status: d.status ?? null,
    last_scene: d.lastScene ?? null,
    public_info: d.publicInfo ?? null,
    private_notes: d.privateNotes ?? d.notes ?? null, // backward compat
    created_at: ts(d.createdAt),
    updated_at: ts(d.updatedAt),
  };
}

export function toLocation(doc: DocumentSnapshot): Location {
  const d = doc.data()!;
  return {
    id: doc.id,
    campaign_id: d.campaignId,
    name: d.name,
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
    characters: (d.characters ?? []).map((c: Record<string, unknown>) => ({
      name: c.name as string,
      class: (c.class as string | null) ?? null,
      race: (c.race as string | null) ?? null,
      level: (c.level as number | null) ?? null,
      stats_link: (c.statsLink as string | null) ?? null,
    })),
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
