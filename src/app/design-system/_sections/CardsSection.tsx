"use client";

import { Panel } from "@/components/ui/panel";
import { Card } from "@/components/ui/ds-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatTile } from "@/components/ui/stat-tile";

export function CardsSection() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Panel
        </p>
        <div className="max-w-sm space-y-1">
          <Panel>
            <p className="text-sm font-medium">Campaign Notes</p>
            <p className="text-sm text-muted-foreground mt-1">
              A simple elevated container using the ds-panel surface.
            </p>
          </Panel>
          <p className="text-xs text-muted-foreground font-mono">Panel</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          DsCard (Card)
        </p>
        <div className="max-w-sm space-y-1">
          <Card>
            <p className="text-sm font-medium">Goblin King</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ruler of the Underhalls. Last seen in Session 7.
            </p>
          </Card>
          <p className="text-xs text-muted-foreground font-mono">
            Card (from ds-card) — hover for shadow
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          StatCard + StatTile
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg">
          <div className="space-y-1">
            <StatCard title="Sessions" value={14} />
            <p className="text-xs text-muted-foreground font-mono">StatCard</p>
          </div>
          <div className="space-y-1">
            <StatCard title="NPCs" value={31} />
            <p className="text-xs text-muted-foreground font-mono">StatCard</p>
          </div>
          <div className="space-y-1">
            <StatTile label="Players" value={6} />
            <p className="text-xs text-muted-foreground font-mono">StatTile</p>
          </div>
          <div className="space-y-1">
            <StatTile label="Locations" value={9} />
            <p className="text-xs text-muted-foreground font-mono">StatTile</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Surface class demos
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <div className="space-y-1">
            <div className="paper-panel rounded-lg p-4 text-sm">paper-panel</div>
            <p className="text-xs text-muted-foreground font-mono">.paper-panel</p>
          </div>
          <div className="space-y-1">
            <div className="paper-inset rounded-lg p-4 text-sm">paper-inset</div>
            <p className="text-xs text-muted-foreground font-mono">.paper-inset</p>
          </div>
        </div>
      </div>
    </div>
  );
}
