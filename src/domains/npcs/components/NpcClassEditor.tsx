"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { updateNpcClasses } from "@/domains/npcs/actions";
import type { NpcClass } from "@/types";

interface Props {
  npcId: string;
  campaignId: string;
  classes: NpcClass[];
}

export function NpcClassEditor({ npcId, campaignId, classes: initial }: Props) {
  const [classes, setClasses] = useState<NpcClass[]>(initial);
  const [, startTransition] = useTransition();

  function persist(next: NpcClass[]) {
    setClasses(next);
    startTransition(async () => {
      try {
        await updateNpcClasses(npcId, campaignId, next);
      } catch {
        toast.error("Failed to save classes");
      }
    });
  }

  function updateRow(i: number, field: keyof NpcClass, raw: string) {
    setClasses((prev) =>
      prev.map((c, idx) =>
        idx === i
          ? { ...c, [field]: field === "level" ? (parseInt(raw, 10) || 0) : raw }
          : c
      )
    );
  }

  function saveAll(current: NpcClass[]) {
    persist(current.filter((c) => c.name.trim() !== ""));
  }

  function remove(i: number) {
    const next = classes.filter((_, idx) => idx !== i);
    persist(next);
  }

  function addClass() {
    setClasses((prev) => [...prev, { name: "", level: 1 }]);
  }

  const inputBase =
    "rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring";

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">Classes</p>
      <div className="space-y-1.5">
        {classes.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={c.name}
              onChange={(e) => updateRow(i, "name", e.target.value)}
              onBlur={() => saveAll(classes)}
              placeholder="Fighter…"
              className={`${inputBase} flex-1`}
            />
            <input
              type="number"
              value={c.level === 0 ? "" : c.level}
              onChange={(e) => updateRow(i, "level", e.target.value)}
              onBlur={() => saveAll(classes)}
              min={1}
              max={20}
              placeholder="Lv"
              className={`${inputBase} w-16 text-center`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Remove class"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addClass}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add class
        </button>
      </div>
    </div>
  );
}
