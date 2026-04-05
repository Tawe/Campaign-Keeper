"use client";

import { useRouter } from "next/navigation";
import { MapPin, Minus, Move, Plus, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState<{
    pointerId: number;
    startX: number;
    startY: number;
    panX: number;
    panY: number;
    moved: boolean;
  } | null>(null);

  const hoveredPin = useMemo(
    () => pins.find((pin) => pin.id === hoveredPinId) ?? null,
    [hoveredPinId, pins],
  );

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;
    const update = () => {
      const rect = node.getBoundingClientRect();
      setViewportSize({ width: rect.width, height: rect.height });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [imageUrl]);

  const baseSize = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height || !viewportSize.width || !viewportSize.height) {
      return { width: 0, height: 0 };
    }
    const scale = Math.min(
      viewportSize.width / naturalSize.width,
      viewportSize.height / naturalSize.height,
    );
    return {
      width: naturalSize.width * scale,
      height: naturalSize.height * scale,
    };
  }, [naturalSize, viewportSize]);

  const scaledSize = useMemo(() => ({
    width: baseSize.width * zoom,
    height: baseSize.height * zoom,
  }), [baseSize, zoom]);

  const imageFrame = useMemo(() => ({
    left: (viewportSize.width - scaledSize.width) / 2 + pan.x,
    top: (viewportSize.height - scaledSize.height) / 2 + pan.y,
    width: scaledSize.width,
    height: scaledSize.height,
  }), [pan.x, pan.y, scaledSize.height, scaledSize.width, viewportSize.height, viewportSize.width]);

  function clampPan(nextPan: { x: number; y: number }, nextZoom = zoom) {
    if (!baseSize.width || !baseSize.height) return { x: 0, y: 0 };
    const nextWidth = baseSize.width * nextZoom;
    const nextHeight = baseSize.height * nextZoom;
    const maxX = Math.max(0, (nextWidth - viewportSize.width) / 2);
    const maxY = Math.max(0, (nextHeight - viewportSize.height) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, nextPan.x)),
      y: Math.min(maxY, Math.max(-maxY, nextPan.y)),
    };
  }

  function updateZoom(nextZoom: number) {
    const clampedZoom = Math.min(4, Math.max(1, Number(nextZoom.toFixed(2))));
    setZoom(clampedZoom);
    setPan((current) => clampPan(current, clampedZoom));
  }

  function resetView() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }

  function getMapCoords(clientX: number, clientY: number) {
    const node = viewportRef.current;
    if (!node || !imageFrame.width || !imageFrame.height) return null;
    const rect = node.getBoundingClientRect();
    const x = (clientX - rect.left - imageFrame.left) / imageFrame.width;
    const y = (clientY - rect.top - imageFrame.top) / imageFrame.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;
    return { x, y };
  }

  return (
    <div className="space-y-3">
      {imageUrl ? (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 px-3 py-1.5 text-sm hover:bg-muted"
            onClick={() => updateZoom(zoom - 0.25)}
            disabled={zoom <= 1}
          >
            <Minus className="h-4 w-4" />
            Zoom out
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 px-3 py-1.5 text-sm hover:bg-muted"
            onClick={() => updateZoom(zoom + 0.25)}
            disabled={zoom >= 4}
          >
            <Plus className="h-4 w-4" />
            Zoom in
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-border/80 px-3 py-1.5 text-sm hover:bg-muted"
            onClick={resetView}
            disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <Move className="h-4 w-4" />
            Drag to pan, scroll to zoom
          </span>
        </div>
      ) : null}

      <div
        ref={viewportRef}
        className={cn(
          "relative overflow-hidden rounded-2xl border border-border/80 bg-[radial-gradient(circle_at_top,_rgba(156,163,175,0.12),transparent_60%),linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.02))] touch-none",
          imageUrl ? "h-[min(75vh,720px)] min-h-[420px]" : "min-h-[240px]",
          dragState ? "cursor-grabbing" : imageUrl ? "cursor-grab" : "",
        )}
        onWheel={(event) => {
          if (!imageUrl) return;
          event.preventDefault();
          updateZoom(zoom + (event.deltaY < 0 ? 0.2 : -0.2));
        }}
        onPointerDown={(event) => {
          if (!imageUrl) return;
          const isPin = (event.target as HTMLElement).closest("[data-map-pin='true']");
          if (isPin) return;
          setDragState({
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            panX: pan.x,
            panY: pan.y,
            moved: false,
          });
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragState || dragState.pointerId !== event.pointerId) return;
          const deltaX = event.clientX - dragState.startX;
          const deltaY = event.clientY - dragState.startY;
          const moved = Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4 || dragState.moved;
          setDragState({ ...dragState, moved });
          setPan(clampPan({ x: dragState.panX + deltaX, y: dragState.panY + deltaY }));
        }}
        onPointerUp={(event) => {
          if (!dragState || dragState.pointerId !== event.pointerId) return;
          const wasDrag = dragState.moved;
          setDragState(null);
          event.currentTarget.releasePointerCapture(event.pointerId);
          if (!wasDrag && onMapClick && imageUrl) {
            const coords = getMapCoords(event.clientX, event.clientY);
            if (coords) onMapClick(coords);
          }
        }}
        onPointerCancel={(event) => {
          if (!dragState || dragState.pointerId !== event.pointerId) return;
          setDragState(null);
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={mapName}
            draggable={false}
            onLoad={(event) => {
              const target = event.currentTarget;
              setNaturalSize({
                width: target.naturalWidth,
                height: target.naturalHeight,
              });
            }}
            className="pointer-events-none absolute max-w-none select-none"
            style={{
              left: `${imageFrame.left}px`,
              top: `${imageFrame.top}px`,
              width: `${imageFrame.width}px`,
              height: `${imageFrame.height}px`,
            }}
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
            data-map-pin="true"
            className="absolute z-10 -translate-x-1/2 -translate-y-full"
            style={{
              left: `${imageFrame.left + pin.x * imageFrame.width}px`,
              top: `${imageFrame.top + pin.y * imageFrame.height}px`,
            }}
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
            style={{
              left: `${imageFrame.left + draftPoint.x * imageFrame.width}px`,
              top: `${imageFrame.top + draftPoint.y * imageFrame.height}px`,
            }}
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
        {onMapClick
          ? "Zoom and pan for precision, then click the map to place a new pin."
          : "Zoom and pan to explore. Hover a pin to preview it, then click to open."}
      </p>
    </div>
  );
}
