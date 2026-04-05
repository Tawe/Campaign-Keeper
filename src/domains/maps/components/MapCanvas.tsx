"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { MapPin as WorldMapPin } from "@/types";

interface MapCanvasProps {
  imageUrl: string | null;
  mapName: string;
  pins: WorldMapPin[];
  onMapClick?: (coords: { x: number; y: number }) => void;
  draftPoint?: { x: number; y: number } | null;
  emptyLabel?: string;
}

export function MapCanvas({
  imageUrl,
  mapName,
  pins,
  onMapClick,
  draftPoint,
  emptyLabel = "Upload a map image to start placing pins.",
}: MapCanvasProps) {
  const router = useRouter();
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);

  const hoveredPin = useMemo(
    () => pins.find((pin) => pin.id === hoveredPinId) ?? null,
    [hoveredPinId, pins],
  );

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/80 bg-[radial-gradient(circle_at_top,_rgba(156,163,175,0.12),transparent_60%),linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.02))]",
          imageUrl ? "min-h-[320px]" : "min-h-[240px]",
        )}
        onClick={(event) => {
          if (!onMapClick || !imageUrl) return;
          if (event.target !== event.currentTarget) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          onMapClick({ x, y });
        }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={mapName}
            fill
            unoptimized
            className={cn("pointer-events-none object-contain", onMapClick ? "cursor-crosshair" : "")}
          />
        ) : (
          <div className="flex min-h-[240px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        )}

        {pins.map((pin) => (
          <button
            key={pin.id}
            type="button"
            className="absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: `${pin.x * 100}%`, top: `${pin.y * 100}%` }}
            onMouseEnter={() => setHoveredPinId(pin.id)}
            onMouseLeave={() => setHoveredPinId((current) => (current === pin.id ? null : current))}
            onFocus={() => setHoveredPinId(pin.id)}
            onBlur={() => setHoveredPinId((current) => (current === pin.id ? null : current))}
            onClick={(event) => {
              event.stopPropagation();
              if (pin.preview?.href) {
                router.push(pin.preview.href);
              }
            }}
            aria-label={pin.label}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-rose-600 text-white shadow-lg transition-transform hover:scale-105",
                pin.visibility === "private" ? "ring-2 ring-amber-300/70" : "",
              )}
            >
              <MapPin className="h-4 w-4" />
            </span>
          </button>
        ))}

        {draftPoint ? (
          <div
            className="absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{ left: `${draftPoint.x * 100}%`, top: `${draftPoint.y * 100}%` }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-sky-600 text-white shadow-lg">
              <MapPin className="h-4 w-4" />
            </span>
          </div>
        ) : null}

        {hoveredPin?.preview ? (
          <div className="absolute left-4 top-4 z-20 max-w-sm rounded-2xl border border-border/80 bg-background/95 p-4 shadow-xl backdrop-blur">
            <p className="text-sm font-semibold text-foreground">{hoveredPin.preview.title}</p>
            {hoveredPin.preview.terrain.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">{hoveredPin.preview.terrain.join(" • ")}</p>
            ) : null}
            {hoveredPin.preview.summary ? (
              <p className="mt-2 text-sm text-foreground/80">{hoveredPin.preview.summary}</p>
            ) : null}
            {hoveredPin.preview.private_notes ? (
              <p className="mt-2 text-xs text-amber-700">DM only: {hoveredPin.preview.private_notes}</p>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              Click pin to open {hoveredPin.target_type === "location" ? "location" : "map"}.
            </p>
          </div>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {onMapClick ? "Click the map background to place a new pin." : "Hover a pin to preview it, then click to open."}
      </p>
    </div>
  );
}
