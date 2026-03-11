"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateLocationParent } from "@/domains/locations/actions";

interface Props {
  locationId: string;
  campaignId: string;
  currentParentId: string | null;
  availableLocations: { id: string; name: string }[];
}

export function LocationParentSelector({
  locationId,
  campaignId,
  currentParentId,
  availableLocations,
}: Props) {
  const [value, setValue] = useState(currentParentId ?? "");
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value || null;
    setValue(next ?? "");
    startTransition(async () => {
      try {
        await updateLocationParent(locationId, campaignId, next);
      } catch {
        toast.error("Failed to update parent location");
      }
    });
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">Parent location</p>
      <select
        value={value}
        onChange={handleChange}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
      >
        <option value="">— None —</option>
        {availableLocations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name}
          </option>
        ))}
      </select>
    </div>
  );
}
