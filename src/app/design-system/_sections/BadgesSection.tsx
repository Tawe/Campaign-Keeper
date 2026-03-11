"use client";

import { Badge } from "@/components/ui/badge";

const variants = [
  "default",
  "secondary",
  "destructive",
  "outline",
  "public",
  "private",
  "ghost",
  "link",
] as const;

export function BadgesSection() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        {variants.map((v) => (
          <div key={v} className="flex flex-col items-center gap-1.5">
            <Badge variant={v}>
              {v === "default"
                ? "Default"
                : v === "secondary"
                  ? "Secondary"
                  : v === "destructive"
                    ? "Danger"
                    : v === "outline"
                      ? "Outline"
                      : v === "public"
                        ? "Public"
                        : v === "private"
                          ? "Private"
                          : v === "ghost"
                            ? "Ghost"
                            : "Link"}
            </Badge>
            <p className="text-xs text-muted-foreground font-mono">{v}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Contextual usage examples
        </p>
        <div className="flex flex-wrap gap-3">
          <Badge variant="public">Visible to players</Badge>
          <Badge variant="private">DM only</Badge>
          <Badge variant="secondary">Resolved</Badge>
          <Badge variant="outline">Combat</Badge>
          <Badge variant="outline">Exploration</Badge>
          <Badge variant="default">Open</Badge>
          <Badge variant="destructive">Enemy</Badge>
        </div>
      </div>
    </div>
  );
}
