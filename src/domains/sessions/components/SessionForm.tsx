"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createSession, updateSession } from "@/domains/sessions/actions";
import type { DmReflectionInput } from "@/domains/sessions/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModeCallout } from "@/components/shared/editorial";
import { InGameDatePicker } from "./InGameDatePicker";
import { today } from "@/lib/utils";
import type { Calendar, InGameDate, Npc, NpcDisposition, Visibility } from "@/types";

interface NpcRow {
  name: string;
  disposition: NpcDisposition | "";
  visibility: Visibility;
  mentionNote: string;
  statusAtEnd: string;
}

interface ThreadRow {
  text: string;
  visibility: Visibility;
}

interface StatusRow {
  name: string;
  statusAtEnd: string;
}

export interface SessionFormInitialValues {
  date: string;
  inGameDate: InGameDate | null;
  title: string;
  startingLocation: string;
  timePassed: string;
  characters: StatusRow[];
  npcs: NpcRow[];
  loot: string[];
  locationsVisited: string[];
  highlights: string[];
  privateNotes: string;
  tags: string[];
  threads: ThreadRow[];
  dmReflection: DmReflectionInput;
}

export interface ExistingPlayer {
  id: string;
  name: string;
  characters: { name: string }[];
}

interface SessionFormProps {
  campaignId: string;
  existingNpcs: Npc[];
  existingPlayers?: ExistingPlayer[];
  existingLocationNames?: string[];
  sessionId?: string;
  initialValues?: SessionFormInitialValues;
  calendar?: Calendar | null;
}

function DynamicList({
  items,
  placeholder,
  onSet,
  onAdd,
  onRemove,
}: {
  items: string[];
  placeholder: string;
  onSet: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input
            placeholder={placeholder}
            value={item}
            onChange={(e) => onSet(i, e.target.value)}
          />
          {items.length > 1 && (
            <Button type="button" variant="ghost" size="icon" onClick={() => onRemove(i)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1" /> Add
      </Button>
    </div>
  );
}

const EMPTY_REFLECTION: DmReflectionInput = {
  plotAdvancement: null,
  keyEvents: [""],
  mostEngaged: [""],
  leastEngaged: [""],
  memorableMoments: [""],
  combatDifficulty: null,
  combatBalanceIssues: "",
  pacing: "",
  whereSlowedDown: "",
  nextSessionPrep: "",
  personalReflection: "",
};

export function SessionForm({ campaignId, existingNpcs, existingPlayers = [], existingLocationNames = [], sessionId, initialValues, calendar }: SessionFormProps) {
  const iv = initialValues;

  // Build lookup: charNameLower → player name
  const charOwnerMap = new Map<string, string>(
    existingPlayers.flatMap((p) => p.characters.map((c) => [c.name.toLowerCase(), p.name] as [string, string]))
  );
  const existingCharacterNames = existingPlayers.flatMap((p) => p.characters.map((c) => c.name));

  // Default characters for new sessions: pre-populate from player records
  const defaultCharacters: StatusRow[] =
    existingPlayers.length > 0
      ? existingPlayers.flatMap((p) => p.characters.map((c) => ({ name: c.name, statusAtEnd: "" })))
      : [{ name: "", statusAtEnd: "" }];

  // Session Notes state
  const [date, setDate] = useState(iv?.date ?? today());
  const [inGameDate, setInGameDate] = useState<InGameDate | null>(iv?.inGameDate ?? null);
  const [title, setTitle] = useState(iv?.title ?? "");
  const [startingLocation, setStartingLocation] = useState(iv?.startingLocation ?? "");
  const [timePassed, setTimePassed] = useState(iv?.timePassed ?? "");
  const [characters, setCharacters] = useState<StatusRow[]>(iv?.characters ?? defaultCharacters);
  const [npcs, setNpcs] = useState<NpcRow[]>(
    iv?.npcs ?? [{ name: "", disposition: "", visibility: "public", mentionNote: "", statusAtEnd: "" }]
  );
  const [loot, setLoot] = useState<string[]>(iv?.loot ?? []);
  const [lootInput, setLootInput] = useState("");
  const lootInputRef = useRef<HTMLInputElement>(null);
  const [locationsVisited, setLocationsVisited] = useState<string[]>(iv?.locationsVisited ?? []);
  const [locationInput, setLocationInput] = useState("");
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [highlights, setHighlights] = useState<string[]>(iv?.highlights ?? ["", "", ""]);
  const [privateNotes, setPrivateNotes] = useState(iv?.privateNotes ?? "");
  const [tags, setTags] = useState<string[]>(iv?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  const [threads, setThreads] = useState<ThreadRow[]>(iv?.threads ?? [{ text: "", visibility: "public" }]);

  // DM Reflection state
  const [dmReflection, setDmReflection] = useState<DmReflectionInput>(iv?.dmReflection ?? EMPTY_REFLECTION);

  const [loading, setLoading] = useState(false);

  // ── Helpers ───────────────────────────────────────────────────────────

  const TAG_PRESETS = ["combat", "travel", "politics", "roleplay", "mystery", "exploration"];

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase();
    if (tag && !tags.includes(tag)) setTags((p) => [...p, tag]);
    setTagInput("");
  }
  function removeTag(tag: string) { setTags((p) => p.filter((t) => t !== tag)); }
  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(tagInput); }
    else if (e.key === "Backspace" && !tagInput && tags.length > 0) setTags((p) => p.slice(0, -1));
  }

  function addLoot(raw: string) {
    const item = raw.trim();
    if (item) setLoot((p) => [...p, item]);
    setLootInput("");
  }
  function handleLootKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); addLoot(lootInput); }
    else if (e.key === "Backspace" && !lootInput && loot.length > 0) setLoot((p) => p.slice(0, -1));
  }

  function addLocation(raw: string) {
    const item = raw.trim();
    if (item && !locationsVisited.includes(item)) setLocationsVisited((p) => [...p, item]);
    setLocationInput("");
  }
  function handleLocationKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); addLocation(locationInput); }
    else if (e.key === "Backspace" && !locationInput && locationsVisited.length > 0) setLocationsVisited((p) => p.slice(0, -1));
  }

  function setHighlight(i: number, v: string) { setHighlights((p) => p.map((h, idx) => idx === i ? v : h)); }
  function addHighlight() { setHighlights((p) => [...p, ""]); }
  function removeHighlight(i: number) { setHighlights((p) => p.filter((_, idx) => idx !== i)); }

  function setThread(i: number, f: keyof ThreadRow, v: string) { setThreads((p) => p.map((t, idx) => idx === i ? { ...t, [f]: v } : t)); }
  function addThread() { setThreads((p) => [...p, { text: "", visibility: "public" }]); }
  function removeThread(i: number) { setThreads((p) => p.filter((_, idx) => idx !== i)); }

  function setNpc(i: number, f: keyof NpcRow, v: string) { setNpcs((p) => p.map((n, idx) => idx === i ? { ...n, [f]: v } : n)); }
  function addNpc() { setNpcs((p) => [...p, { name: "", disposition: "", visibility: "public", mentionNote: "", statusAtEnd: "" }]); }
  function removeNpc(i: number) { setNpcs((p) => p.filter((_, idx) => idx !== i)); }

  function setCharacter(i: number, f: keyof StatusRow, v: string) { setCharacters((p) => p.map((c, idx) => idx === i ? { ...c, [f]: v } : c)); }
  function addCharacter() { setCharacters((p) => [...p, { name: "", statusAtEnd: "" }]); }
  function removeCharacter(i: number) { setCharacters((p) => p.filter((_, idx) => idx !== i)); }

  function setReflection<K extends keyof DmReflectionInput>(key: K, value: DmReflectionInput[K]) {
    setDmReflection((p) => ({ ...p, [key]: value }));
  }
  function setReflectionList(key: "keyEvents" | "mostEngaged" | "leastEngaged" | "memorableMoments", i: number, v: string) {
    setDmReflection((p) => ({ ...p, [key]: (p[key] as string[]).map((x, idx) => idx === i ? v : x) }));
  }
  function addReflectionListItem(key: "keyEvents" | "mostEngaged" | "leastEngaged" | "memorableMoments") {
    setDmReflection((p) => ({ ...p, [key]: [...(p[key] as string[]), ""] }));
  }
  function removeReflectionListItem(key: "keyEvents" | "mostEngaged" | "leastEngaged" | "memorableMoments", i: number) {
    setDmReflection((p) => ({ ...p, [key]: (p[key] as string[]).filter((_, idx) => idx !== i) }));
  }

  // ── Submit ─────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const input = {
      campaignId,
      date,
      inGameDate,
      title: title.trim() || null,
      publicHighlights: highlights.filter((h) => h.trim()),
      privateNotes,
      tags,
      startingLocation: startingLocation.trim() || null,
      timePassed: timePassed.trim() || null,
      characters: characters.filter((c) => c.name.trim()),
      npcStatuses: npcs
        .filter((n) => n.name.trim())
        .map((n) => ({ name: n.name.trim(), statusAtEnd: n.statusAtEnd })),
      loot,
      locationsVisited,
      dmReflection,
      threads: threads.filter((t) => t.text.trim()),
      npcMentions: npcs
        .filter((n) => n.name.trim())
        .map((n) => ({
          name: n.name.trim(),
          disposition: (n.disposition as NpcDisposition) || null,
          npcNote: null,
          visibility: n.visibility,
          mentionNote: n.mentionNote.trim() || null,
        })),
    };
    try {
      if (sessionId) {
        await updateSession(sessionId, input);
      } else {
        await createSession(input);
      }
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save session");
      setLoading(false);
    }
  }

  const npcNames = existingNpcs.map((n) => n.name);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="notes" className="space-y-6">
        <TabsList className="w-full">
          <TabsTrigger value="notes" className="flex-1">Session notes</TabsTrigger>
          <TabsTrigger value="reflection" className="flex-1">DM reflection</TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: Session Notes ═══ */}
        <TabsContent value="notes" className="space-y-6">
          <div className="paper-panel space-y-6 px-5 py-5 sm:px-6">
            <div className="space-y-4">
              <p className="section-eyebrow">Session Setup</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="The Black Road Ambush" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
              </div>
              {calendar && (
                <InGameDatePicker calendar={calendar} value={inGameDate} onChange={setInGameDate} />
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startingLocation">Starting location</Label>
                  <Input id="startingLocation" placeholder="Irongate City, The Docks" value={startingLocation} onChange={(e) => setStartingLocation(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timePassed">Time passed</Label>
                  <Input id="timePassed" placeholder="3 days, 6 hours…" value={timePassed} onChange={(e) => setTimePassed(e.target.value)} />
                </div>
              </div>
            </div>

            <Separator />

            <section className="space-y-3">
              <div>
                <p className="section-eyebrow">World State</p>
                <Label className="text-base font-semibold">Characters</Label>
              </div>
            <div className="space-y-2">
              {existingCharacterNames.length > 0 && (
                <datalist id="character-names-list">
                  {existingCharacterNames.map((name) => <option key={name} value={name} />)}
                </datalist>
              )}
              {characters.map((c, i) => {
                const owner = charOwnerMap.get(c.name.toLowerCase());
                return (
                  <div key={i} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input
                        placeholder="Name"
                        value={c.name}
                        onChange={(e) => setCharacter(i, "name", e.target.value)}
                        list={existingCharacterNames.length > 0 ? "character-names-list" : undefined}
                      />
                      {owner && (
                        <p className="text-xs text-muted-foreground mt-0.5 pl-1">{owner}</p>
                      )}
                    </div>
                    <Input placeholder="Status at end (alive, dead…)" value={c.statusAtEnd} onChange={(e) => setCharacter(i, "statusAtEnd", e.target.value)} className="flex-1 mt-0" />
                    {characters.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => removeCharacter(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addCharacter}>
              <Plus className="h-4 w-4 mr-1" /> Add character
            </Button>
            </section>

            <Separator />

            <section className="space-y-3">
            <div>
              <p className="section-eyebrow">Cast</p>
              <Label className="text-base font-semibold">NPCs</Label>
            </div>
            <div className="space-y-4">
              {npcs.map((n, i) => (
                <div key={i} className="paper-inset space-y-3 rounded-2xl p-4">
                  <div className="grid gap-2 lg:grid-cols-[1fr_9rem_9rem_auto]">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input placeholder="NPC name" value={n.name} onChange={(e) => setNpc(i, "name", e.target.value)} list={`npc-list-${i}`} />
                      <datalist id={`npc-list-${i}`}>{npcNames.map((name) => <option key={name} value={name} />)}</datalist>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Disposition</Label>
                      <Select value={n.disposition || "none"} onValueChange={(v) => setNpc(i, "disposition", v === "none" ? "" : v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">—</SelectItem>
                          <SelectItem value="ally">Ally</SelectItem>
                          <SelectItem value="enemy">Enemy</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="unknown">Unknown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Visibility</Label>
                      <Select value={n.visibility} onValueChange={(v) => setNpc(i, "visibility", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">DM only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="self-end" onClick={() => removeNpc(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Status at end</Label>
                      <Input placeholder="alive, dead, fled…" value={n.statusAtEnd} onChange={(e) => setNpc(i, "statusAtEnd", e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Note (optional)</Label>
                      <Input placeholder="What happened?" value={n.mentionNote} onChange={(e) => setNpc(i, "mentionNote", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addNpc}>
              <Plus className="h-4 w-4 mr-1" /> Add NPC
            </Button>
            </section>

            <Separator />

            <section className="space-y-3">
              <div>
                <p className="section-eyebrow">Inventory</p>
                <Label className="text-base font-semibold">Loot</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Press Enter to add each item.</p>
              </div>
            <div
              className="field-surface flex flex-wrap gap-1.5 min-h-10 cursor-text rounded-xl p-2"
              onClick={() => lootInputRef.current?.focus()}
            >
              {loot.map((item) => (
                <span key={item} className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                  {item}
                  <button type="button" onClick={() => setLoot((p) => p.filter((l) => l !== item))} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                ref={lootInputRef}
                value={lootInput}
                onChange={(e) => setLootInput(e.target.value)}
                onKeyDown={handleLootKeyDown}
                onBlur={() => { if (lootInput.trim()) addLoot(lootInput); }}
                placeholder={loot.length === 0 ? "+1 sword, healing potion…" : ""}
                className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            </section>

            <Separator />

            <section className="space-y-3">
              <div>
                <p className="section-eyebrow">Travel Log</p>
                <Label className="text-base font-semibold">Locations visited</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Press Enter to add each location.</p>
              </div>
            <div
              className="field-surface flex flex-wrap gap-1.5 min-h-10 cursor-text rounded-xl p-2"
              onClick={() => locationInputRef.current?.focus()}
            >
              {locationsVisited.map((loc) => (
                <span key={loc} className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                  {loc}
                  <button type="button" onClick={() => setLocationsVisited((p) => p.filter((l) => l !== loc))} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                ref={locationInputRef}
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={handleLocationKeyDown}
                onBlur={() => { if (locationInput.trim()) addLocation(locationInput); }}
                placeholder={locationsVisited.length === 0 ? "Irongate City, The Docks…" : ""}
                list="location-names-list"
                className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {existingLocationNames.length > 0 && (
                <datalist id="location-names-list">
                  {existingLocationNames.map((n) => <option key={n} value={n} />)}
                </datalist>
              )}
            </div>
            </section>
          </div>

          <div className="paper-panel space-y-6 px-5 py-5 sm:px-6">
            <ModeCallout
              mode="public"
              title="Player-visible recap content"
              description="Everything in this section is safe to reuse in the player recap."
            />
            <section className="space-y-3">
            <div>
              <Label className="text-base font-semibold">
                Highlights
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">What happened? Keep it to 1–2 sentences per bullet.</p>
            </div>
            <div className="space-y-2">
              {highlights.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder={`Highlight ${i + 1}`} value={h} onChange={(e) => setHighlight(i, e.target.value)} />
                  {highlights.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeHighlight(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addHighlight}>
              <Plus className="h-4 w-4 mr-1" /> Add highlight
            </Button>
            </section>

            <Separator />

            <section className="space-y-3">
            <div>
              <Label className="text-base font-semibold">Open threads</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Keep loose ends visible for the next session.</p>
            </div>
            <div className="space-y-2">
              {threads.map((t, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="Who hired the assassin?" value={t.text} onChange={(e) => setThread(i, "text", e.target.value)} className="flex-1" />
                  <Select value={t.visibility} onValueChange={(v) => setThread(i, "visibility", v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">DM only</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeThread(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addThread}>
              <Plus className="h-4 w-4 mr-1" /> Add thread
            </Button>
          </section>
          </div>

          <div className="paper-panel space-y-6 px-5 py-5 sm:px-6">
            <ModeCallout
              mode="private"
              title="DM-only notes and categorization"
              description="These notes and tags stay inside your private workflow."
            />
            <section className="space-y-2">
              <Label htmlFor="privateNotes" className="text-base font-semibold">
                DM notes
              </Label>
              <Textarea
                id="privateNotes"
                placeholder="What's really going on? Secrets, foreshadowing, player mistakes…"
                value={privateNotes}
                onChange={(e) => setPrivateNotes(e.target.value)}
                rows={5}
              />
            </section>

            <Separator />

            <section className="space-y-3">
              <div>
                <Label className="text-base font-semibold">Tags</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Press Enter or comma to add.</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TAG_PRESETS.filter((p) => !tags.includes(p)).map((preset) => (
                  <button key={preset} type="button" onClick={() => addTag(preset)}
                    className="text-xs px-2 py-0.5 rounded-full border border-dashed text-muted-foreground hover:border-foreground hover:text-foreground transition-colors">
                    + {preset}
                  </button>
                ))}
              </div>
              <div className="field-surface flex flex-wrap gap-1.5 min-h-10 cursor-text rounded-xl p-2" onClick={() => tagInputRef.current?.focus()}>
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                <input ref={tagInputRef} value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown} onBlur={() => { if (tagInput.trim()) addTag(tagInput); }}
                  placeholder={tags.length === 0 ? "combat, travel…" : ""}
                  className="flex-1 min-w-20 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              </div>
            </section>
          </div>

        </TabsContent>

        {/* ═══ TAB 2: DM Reflection ═══ */}
        <TabsContent value="reflection" className="space-y-6">
          <ModeCallout
            mode="private"
            title="Everything in this tab is DM only"
            description="Use it as your post-session debrief: pacing, engagement, balance, and prep."
          />

          <div className="paper-panel space-y-8 px-5 py-5 sm:px-6">

          {/* Campaign Progress */}
          <section className="space-y-4">
            <div>
              <p className="section-eyebrow">Reflection I</p>
              <h3 className="font-serif text-2xl tracking-[-0.02em] text-foreground">Campaign progress</h3>
            </div>
            <div className="space-y-2">
              <Label>Main plot advanced?</Label>
              <div className="flex gap-2">
                {([true, false] as const).map((val) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setReflection("plotAdvancement", dmReflection.plotAdvancement === val ? null : val)}
                    className={`px-4 py-1.5 rounded-md text-sm border transition-colors ${
                      dmReflection.plotAdvancement === val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-input hover:bg-muted"
                    }`}
                  >
                    {val ? "Yes" : "No"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Key events / milestones</Label>
              <DynamicList
                items={dmReflection.keyEvents}
                placeholder="The party uncovered the assassin's guild…"
                onSet={(i, v) => setReflectionList("keyEvents", i, v)}
                onAdd={() => addReflectionListItem("keyEvents")}
                onRemove={(i) => removeReflectionListItem("keyEvents", i)}
              />
            </div>
          </section>

          <Separator />

          {/* Player Engagement */}
          <section className="space-y-4">
            <div>
              <p className="section-eyebrow">Reflection II</p>
              <h3 className="font-serif text-2xl tracking-[-0.02em] text-foreground">Player engagement</h3>
            </div>
            <div className="space-y-2">
              <Label>Most engaged</Label>
              <DynamicList
                items={dmReflection.mostEngaged}
                placeholder="Player name"
                onSet={(i, v) => setReflectionList("mostEngaged", i, v)}
                onAdd={() => addReflectionListItem("mostEngaged")}
                onRemove={(i) => removeReflectionListItem("mostEngaged", i)}
              />
            </div>
            <div className="space-y-2">
              <Label>Least engaged</Label>
              <DynamicList
                items={dmReflection.leastEngaged}
                placeholder="Player name"
                onSet={(i, v) => setReflectionList("leastEngaged", i, v)}
                onAdd={() => addReflectionListItem("leastEngaged")}
                onRemove={(i) => removeReflectionListItem("leastEngaged", i)}
              />
            </div>
            <div className="space-y-2">
              <Label>Memorable player moments</Label>
              <DynamicList
                items={dmReflection.memorableMoments}
                placeholder="Korin's bluff on the guard captain…"
                onSet={(i, v) => setReflectionList("memorableMoments", i, v)}
                onAdd={() => addReflectionListItem("memorableMoments")}
                onRemove={(i) => removeReflectionListItem("memorableMoments", i)}
              />
            </div>
          </section>

          <Separator />

          {/* Combat Encounters */}
          <section className="space-y-4">
            <div>
              <p className="section-eyebrow">Reflection III</p>
              <h3 className="font-serif text-2xl tracking-[-0.02em] text-foreground">Combat encounters</h3>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={dmReflection.combatDifficulty ?? "none"}
                onValueChange={(v) => setReflection("combatDifficulty", (v === "none" ? null : v) as "low" | "moderate" | "hard" | null)}
              >
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— No combat —</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="combatBalance">Balance issues</Label>
              <Textarea
                id="combatBalance"
                placeholder="Too easy? Too lethal? Specific monsters that were off?"
                value={dmReflection.combatBalanceIssues}
                onChange={(e) => setReflection("combatBalanceIssues", e.target.value)}
                rows={3}
              />
            </div>
          </section>

          <Separator />

          {/* Pacing & Flow */}
          <section className="space-y-4">
            <div>
              <p className="section-eyebrow">Reflection IV</p>
              <h3 className="font-serif text-2xl tracking-[-0.02em] text-foreground">Pacing &amp; flow</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pacing">How was the pacing?</Label>
              <Textarea
                id="pacing"
                placeholder="Overall felt tight, but the investigation scene ran long…"
                value={dmReflection.pacing}
                onChange={(e) => setReflection("pacing", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whereSlowedDown">Where did things slow down?</Label>
              <Textarea
                id="whereSlowedDown"
                placeholder="The tavern scene dragged after the first revelation…"
                value={dmReflection.whereSlowedDown}
                onChange={(e) => setReflection("whereSlowedDown", e.target.value)}
                rows={3}
              />
            </div>
          </section>

          <Separator />

          {/* Next Session Prep */}
          <section className="space-y-2">
            <div>
              <p className="section-eyebrow">Reflection V</p>
              <h3 className="font-serif text-2xl tracking-[-0.02em] text-foreground">Next session prep</h3>
            </div>
            <Textarea
              placeholder="Need to stat out the guild master, prep the warehouse map…"
              value={dmReflection.nextSessionPrep}
              onChange={(e) => setReflection("nextSessionPrep", e.target.value)}
              rows={4}
            />
          </section>

          <Separator />

          {/* Personal Reflection */}
          <section className="space-y-2">
            <div>
              <p className="section-eyebrow">Reflection VI</p>
              <h3 className="font-serif text-2xl tracking-[-0.02em] text-foreground">Personal reflection</h3>
            </div>
            <Textarea
              placeholder="How did I feel running this session? What do I want to do differently?"
              value={dmReflection.personalReflection}
              onChange={(e) => setReflection("personalReflection", e.target.value)}
              rows={4}
            />
          </section>
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-6">
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Saving…" : sessionId ? "Update session" : "Save session"}
        </Button>
      </div>
    </form>
  );
}
