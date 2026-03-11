"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateMyProfile } from "@/domains/players/actions";
import type { CharacterInput } from "@/domains/players/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/ui/panel";

interface CharacterRow extends CharacterInput {
  _key: number;
}

interface Props {
  playerId: string;
  initialName: string;
  initialCharacters: CharacterInput[];
}

let keyCounter = 0;
function newRow(): CharacterRow {
  return { _key: ++keyCounter, name: "", class: null, race: null, level: null, statsLink: null };
}

export function PlayerProfileEditor({ playerId, initialName, initialCharacters }: Props) {
  const [name, setName] = useState(initialName);
  const [characters, setCharacters] = useState<CharacterRow[]>(
    initialCharacters.length
      ? initialCharacters.map((c) => ({ ...c, _key: ++keyCounter }))
      : [newRow()]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function setChar(key: number, field: keyof CharacterInput, value: string | number | null) {
    setCharacters((prev) =>
      prev.map((c) => (c._key === key ? { ...c, [field]: value } : c))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateMyProfile(playerId, name, characters);
      setSaved(true);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="playerName">Your name</Label>
        <Input
          id="playerName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Characters</Label>
        <div className="space-y-3">
          {characters.map((c) => (
            <Panel key={c._key} className="space-y-3 p-4">
              <div className="flex gap-2 items-end">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">Character name *</Label>
                  <Input
                    placeholder="Thorin Ironforge"
                    value={c.name}
                    onChange={(e) => setChar(c._key, "name", e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setCharacters((prev) => prev.filter((x) => x._key !== c._key))}
                  disabled={characters.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label className="text-xs">Class</Label>
                  <Input
                    placeholder="Fighter"
                    value={c.class ?? ""}
                    onChange={(e) => setChar(c._key, "class", e.target.value || null)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Race</Label>
                  <Input
                    placeholder="Dwarf"
                    value={c.race ?? ""}
                    onChange={(e) => setChar(c._key, "race", e.target.value || null)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Level</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    placeholder="1"
                    value={c.level ?? ""}
                    onChange={(e) =>
                      setChar(c._key, "level", e.target.value ? parseInt(e.target.value, 10) : null)
                    }
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-4">
                  <Label className="text-xs">Stats / sheet link</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={c.statsLink ?? ""}
                    onChange={(e) => setChar(c._key, "statsLink", e.target.value || null)}
                  />
                </div>
              </div>
            </Panel>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCharacters((prev) => [...prev, newRow()])}
        >
          <Plus className="h-4 w-4 mr-1" /> Add character
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">Saved</span>}
      </div>
    </form>
  );
}
