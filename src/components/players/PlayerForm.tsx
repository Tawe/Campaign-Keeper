"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createPlayer, updatePlayer } from "@/app/actions/players";
import type { CharacterInput } from "@/app/actions/players";
import { PortraitUploader } from "@/components/shared/PortraitUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface CharacterRow extends CharacterInput {
  _key: number;
}

export interface PlayerFormInitialValues {
  name: string;
  portraitUrl: string | null;
  characters: CharacterInput[];
}

interface PlayerFormProps {
  campaignId: string;
  playerId?: string;
  initialValues?: PlayerFormInitialValues;
}

let keyCounter = 0;
function newRow(): CharacterRow {
  return { _key: ++keyCounter, name: "", class: null, race: null, level: null, statsLink: null };
}

export function PlayerForm({ campaignId, playerId, initialValues }: PlayerFormProps) {
  const iv = initialValues;
  const [playerName, setPlayerName] = useState(iv?.name ?? "");
  const [portraitUrl, setPortraitUrl] = useState<string | null>(iv?.portraitUrl ?? null);
  const [characters, setCharacters] = useState<CharacterRow[]>(
    iv?.characters.length
      ? iv.characters.map((c) => ({ ...c, _key: ++keyCounter }))
      : [newRow()]
  );
  const [loading, setLoading] = useState(false);

  function setChar(key: number, field: keyof CharacterInput, value: string | number | null) {
    setCharacters((prev) =>
      prev.map((c) => (c._key === key ? { ...c, [field]: value } : c))
    );
  }

  function addChar() {
    setCharacters((prev) => [...prev, newRow()]);
  }

  function removeChar(key: number) {
    setCharacters((prev) => prev.filter((c) => c._key !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!playerName.trim()) return;
    setLoading(true);

    const input = {
      campaignId,
      name: playerName,
      portraitUrl,
      characters: characters
        .filter((c) => c.name.trim())
        .map((c) => ({
          name: c.name,
          class: c.class,
          race: c.race,
          level: c.level,
          statsLink: c.statsLink,
        })),
    };

    try {
      if (playerId) {
        await updatePlayer(playerId, input);
      } else {
        await createPlayer(input);
      }
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save player");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <PortraitUploader
        label="Player portrait"
        value={portraitUrl}
        onChange={setPortraitUrl}
        description="Upload an image for the player or primary party portrait."
      />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="playerName" className="text-base font-semibold">
          Player name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="playerName"
          placeholder="Alice, Bob…"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          required
        />
      </div>

      <Separator />

      <section className="space-y-4">
        <Label className="text-base font-semibold">Characters</Label>
        <div className="space-y-4">
          {characters.map((c) => (
            <div key={c._key} className="border rounded-lg p-3 space-y-3">
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
                  onClick={() => removeChar(c._key)}
                  disabled={characters.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
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
                <div className="space-y-1 md:col-span-4">
                  <Label className="text-xs">Stats / sheet link</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={c.statsLink ?? ""}
                    onChange={(e) => setChar(c._key, "statsLink", e.target.value || null)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addChar}>
          <Plus className="h-4 w-4 mr-1" /> Add character
        </Button>
      </section>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Saving…" : playerId ? "Update player" : "Add player"}
      </Button>
    </form>
  );
}
