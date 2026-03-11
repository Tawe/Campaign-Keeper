"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateEventAssociations } from "@/domains/events/actions";
import type { CampaignEvent, Npc, Location, Faction, Player, Session } from "@/types";

interface Props {
  eventId: string;
  campaignId: string;
  event: CampaignEvent;
  npcs: Npc[];
  locations: Location[];
  factions: Faction[];
  players: Player[];
  sessions: Session[];
}

const labelBase = "block text-xs font-medium text-muted-foreground mb-1.5";
const selectBase =
  "rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full";
const chipBase =
  "inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full";

export function EventAssociationsEditor({
  eventId,
  campaignId,
  event,
  npcs,
  locations,
  factions,
  players,
  sessions,
}: Props) {
  const router = useRouter();
  const [npcIds, setNpcIds] = useState<string[]>(event.npc_ids);
  const [locationId, setLocationId] = useState<string | null>(event.location_id);
  const [factionIds, setFactionIds] = useState<string[]>(event.faction_ids);
  const [playerIds, setPlayerIds] = useState<string[]>(event.player_ids);
  const [sessionIds, setSessionIds] = useState<string[]>(event.session_ids);
  const [, startTransition] = useTransition();

  function persist(update: Parameters<typeof updateEventAssociations>[2]) {
    startTransition(async () => {
      try {
        await updateEventAssociations(eventId, campaignId, update);
        router.refresh();
      } catch {
        toast.error("Failed to save associations");
      }
    });
  }

  // ── NPC ──────────────────────────────────────────────────────────────────
  function addNpc(id: string) {
    if (!id || npcIds.includes(id)) return;
    const next = [...npcIds, id];
    setNpcIds(next);
    persist({ npcIds: next });
  }
  function removeNpc(id: string) {
    const next = npcIds.filter((n) => n !== id);
    setNpcIds(next);
    persist({ npcIds: next });
  }

  // ── Location ─────────────────────────────────────────────────────────────
  function setLocation(id: string) {
    const next = id || null;
    setLocationId(next);
    persist({ locationId: next });
  }

  // ── Faction ──────────────────────────────────────────────────────────────
  function addFaction(id: string) {
    if (!id || factionIds.includes(id)) return;
    const next = [...factionIds, id];
    setFactionIds(next);
    persist({ factionIds: next });
  }
  function removeFaction(id: string) {
    const next = factionIds.filter((f) => f !== id);
    setFactionIds(next);
    persist({ factionIds: next });
  }

  // ── Player ───────────────────────────────────────────────────────────────
  function addPlayer(id: string) {
    if (!id || playerIds.includes(id)) return;
    const next = [...playerIds, id];
    setPlayerIds(next);
    persist({ playerIds: next });
  }
  function removePlayer(id: string) {
    const next = playerIds.filter((p) => p !== id);
    setPlayerIds(next);
    persist({ playerIds: next });
  }

  // ── Session ──────────────────────────────────────────────────────────────
  function addSession(id: string) {
    if (!id || sessionIds.includes(id)) return;
    const next = [...sessionIds, id];
    setSessionIds(next);
    persist({ sessionIds: next });
  }
  function removeSession(id: string) {
    const next = sessionIds.filter((s) => s !== id);
    setSessionIds(next);
    persist({ sessionIds: next });
  }

  const npcMap = new Map(npcs.map((n) => [n.id, n]));
  const locationMap = new Map(locations.map((l) => [l.id, l]));
  const factionMap = new Map(factions.map((f) => [f.id, f]));
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));

  const availableNpcs = npcs.filter((n) => !npcIds.includes(n.id));
  const availableFactions = factions.filter((f) => !factionIds.includes(f.id));
  const availablePlayers = players.filter((p) => !playerIds.includes(p.id));
  const availableSessions = sessions.filter((s) => !sessionIds.includes(s.id));

  return (
    <div className="rounded-md border border-border p-4 space-y-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Associations</p>

      {/* NPCs */}
      <div>
        <label className={labelBase}>NPCs involved</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {npcIds.map((id) => {
            const npc = npcMap.get(id);
            return npc ? (
              <span key={id} className={chipBase}>
                {npc.name}
                <button type="button" onClick={() => removeNpc(id)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null;
          })}
        </div>
        {availableNpcs.length > 0 && (
          <select className={selectBase} value="" onChange={(e) => addNpc(e.target.value)}>
            <option value="">Add NPC…</option>
            {availableNpcs.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
          </select>
        )}
      </div>

      {/* Location */}
      <div>
        <label className={labelBase}>Location</label>
        <select className={selectBase} value={locationId ?? ""} onChange={(e) => setLocation(e.target.value)}>
          <option value="">— None —</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        {locationId && locationMap.get(locationId) && (
          <p className="text-xs text-muted-foreground mt-1">{locationMap.get(locationId)!.name}</p>
        )}
      </div>

      {/* Factions */}
      <div>
        <label className={labelBase}>Factions involved</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {factionIds.map((id) => {
            const faction = factionMap.get(id);
            return faction ? (
              <span key={id} className={chipBase}>
                {faction.name}
                <button type="button" onClick={() => removeFaction(id)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null;
          })}
        </div>
        {availableFactions.length > 0 && (
          <select className={selectBase} value="" onChange={(e) => addFaction(e.target.value)}>
            <option value="">Add faction…</option>
            {availableFactions.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )}
      </div>

      {/* Players */}
      <div>
        <label className={labelBase}>Players involved</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {playerIds.map((id) => {
            const player = playerMap.get(id);
            return player ? (
              <span key={id} className={chipBase}>
                {player.name}
                <button type="button" onClick={() => removePlayer(id)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null;
          })}
        </div>
        {availablePlayers.length > 0 && (
          <select className={selectBase} value="" onChange={(e) => addPlayer(e.target.value)}>
            <option value="">Add player…</option>
            {availablePlayers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* Sessions */}
      <div>
        <label className={labelBase}>Sessions linked</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {sessionIds.map((id) => {
            const session = sessionMap.get(id);
            return session ? (
              <span key={id} className={chipBase}>
                {session.title ?? session.date}
                <button type="button" onClick={() => removeSession(id)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : null;
          })}
        </div>
        {availableSessions.length > 0 && (
          <select className={selectBase} value="" onChange={(e) => addSession(e.target.value)}>
            <option value="">Link session…</option>
            {availableSessions.map((s) => (
              <option key={s.id} value={s.id}>{s.title ?? s.date}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
