"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateMapLocation } from "@/domains/maps/actions";

interface MapLocationSelectorProps {
  mapId: string;
  campaignId: string;
  currentLocationId: string | null;
  locations: { id: string; name: string }[];
}

export function MapLocationSelector({
  mapId,
  campaignId,
  currentLocationId,
  locations,
}: MapLocationSelectorProps) {
  const [value, setValue] = useState(currentLocationId ?? "");
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">Linked location</p>
      <select
        value={value}
        onChange={(event) => {
          const next = event.target.value || null;
          setValue(next ?? "");
          startTransition(async () => {
            try {
              await updateMapLocation(mapId, campaignId, next);
              router.refresh();
            } catch (error) {
              toast.error((error as Error).message ?? "Failed to update linked location");
            }
          });
        }}
        className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">No linked location</option>
        {locations.map((location) => (
          <option key={location.id} value={location.id}>
            {location.name}
          </option>
        ))}
      </select>
    </div>
  );
}
