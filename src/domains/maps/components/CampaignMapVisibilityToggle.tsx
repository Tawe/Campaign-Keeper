"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateCampaignMapVisibility } from "@/domains/maps/actions";
import { Label } from "@/components/ui/label";

interface CampaignMapVisibilityToggleProps {
  mapId: string;
  campaignId: string;
  playerVisible: boolean;
}

export function CampaignMapVisibilityToggle({
  mapId,
  campaignId,
  playerVisible,
}: CampaignMapVisibilityToggleProps) {
  const [checked, setChecked] = useState(playerVisible);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-border/80 px-4 py-3">
      <div>
        <Label className="text-sm font-medium text-foreground">Player visibility</Label>
        <p className="text-xs text-muted-foreground">Show this map in the player-facing campaign atlas.</p>
      </div>
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={checked}
        disabled={isPending}
        onChange={(event) => {
          const next = event.target.checked;
          setChecked(next);
          startTransition(async () => {
            try {
              await updateCampaignMapVisibility(mapId, campaignId, next);
              router.refresh();
            } catch (error) {
              setChecked(!next);
              toast.error((error as Error).message ?? "Failed to update visibility");
            }
          });
        }}
      />
    </label>
  );
}
