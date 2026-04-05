"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { createMapPin, deleteMapPin, updateMapPin } from "@/domains/maps/actions";
import { MapCanvas } from "@/domains/maps/components/MapCanvas";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CampaignMap, MapPin, MapPinTargetType, Visibility } from "@/types";

interface MapPinManagerProps {
  map: CampaignMap;
  pins: MapPin[];
  locationTargets: { id: string; name: string }[];
  mapTargets: { id: string; name: string }[];
}

export function MapPinManager({ map, pins, locationTargets, mapTargets }: MapPinManagerProps) {
  const router = useRouter();
  const [draftPoint, setDraftPoint] = useState<{ x: number; y: number } | null>(null);
  const [label, setLabel] = useState("");
  const [targetType, setTargetType] = useState<MapPinTargetType>("location");
  const [targetId, setTargetId] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const availableTargets = useMemo(
    () => (targetType === "location" ? locationTargets : mapTargets.filter((target) => target.id !== map.id)),
    [locationTargets, map.id, mapTargets, targetType],
  );

  function resetForm() {
    setDraftPoint(null);
    setLabel("");
    setTargetType("location");
    setTargetId("");
    setVisibility("private");
    setEditingPinId(null);
  }

  function loadPin(pin: MapPin) {
    setEditingPinId(pin.id);
    setDraftPoint({ x: pin.x, y: pin.y });
    setLabel(pin.label);
    setTargetType(pin.target_type);
    setTargetId(pin.target_id);
    setVisibility(pin.visibility);
  }

  function submit() {
    if (!draftPoint) {
      toast.error("Click the map to place the pin first.");
      return;
    }
    if (!targetId) {
      toast.error("Choose a target.");
      return;
    }

    startTransition(async () => {
      try {
        if (editingPinId) {
          await updateMapPin({
            pinId: editingPinId,
            mapId: map.id,
            campaignId: map.campaign_id,
            label,
            targetType,
            targetId,
            visibility,
          });
        } else {
          await createMapPin({
            mapId: map.id,
            campaignId: map.campaign_id,
            label,
            x: draftPoint.x,
            y: draftPoint.y,
            targetType,
            targetId,
            visibility,
          });
        }
        router.refresh();
        resetForm();
      } catch (error) {
        toast.error((error as Error).message ?? "Could not save pin.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <MapCanvas
        imageUrl={map.image_url}
        mapName={map.name}
        pins={pins}
        onMapClick={setDraftPoint}
        draftPoint={draftPoint}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Pins</p>
              <p className="text-xs text-muted-foreground">Location pins preview on hover and open on click.</p>
            </div>
            {editingPinId ? (
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Cancel edit
              </Button>
            ) : null}
          </div>

          {pins.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 px-4 py-6 text-sm text-muted-foreground">
              No pins yet.
            </div>
          ) : (
            <div className="space-y-2">
              {pins.map((pin) => (
                <div key={pin.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/80 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{pin.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {pin.target_type === "location" ? "Location" : "Map"} target
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <VisibilityBadge visibility={pin.visibility} />
                    <Button type="button" variant="outline" size="sm" onClick={() => loadPin(pin)}>
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        startTransition(async () => {
                          try {
                            await deleteMapPin(map.campaign_id, map.id, pin.id);
                            router.refresh();
                            if (editingPinId === pin.id) resetForm();
                          } catch (error) {
                            toast.error((error as Error).message ?? "Could not delete pin.");
                          }
                        });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-border/80 bg-background/70 p-4">
          <div>
            <p className="text-sm font-medium text-foreground">{editingPinId ? "Edit pin" : "Add pin"}</p>
            <p className="text-xs text-muted-foreground">
              {draftPoint
                ? `Placed at ${(draftPoint.x * 100).toFixed(1)}%, ${(draftPoint.y * 100).toFixed(1)}%`
                : "Click the map to place the pin."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin-label">Label</Label>
            <Input id="pin-label" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="North Gate" />
          </div>

          <div className="space-y-2">
            <Label>Target type</Label>
            <Select
              value={targetType}
              onValueChange={(value) => {
                setTargetType(value as MapPinTargetType);
                setTargetId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose target type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="location">Location</SelectItem>
                <SelectItem value="map">Map</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={availableTargets.length > 0 ? "Choose target" : "No targets available"} />
              </SelectTrigger>
              <SelectContent>
                {availableTargets.map((target) => (
                  <SelectItem key={target.id} value={target.id}>{target.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Player visibility</Label>
            <Select value={visibility} onValueChange={(value) => setVisibility(value as Visibility)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">DM only</SelectItem>
                <SelectItem value="public">Visible to players</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="button" className="w-full" disabled={isPending || !draftPoint || !label.trim() || !targetId} onClick={submit}>
            {isPending ? "Saving…" : editingPinId ? "Save pin" : "Create pin"}
          </Button>
        </div>
      </div>
    </div>
  );
}
