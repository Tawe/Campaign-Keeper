"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function FormsSection() {
  return (
    <div className="space-y-8 max-w-md">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Input
        </p>
        <div className="space-y-3">
          <div className="space-y-1">
            <Input placeholder="Session title…" />
            <p className="text-xs text-muted-foreground font-mono">
              Input — default
            </p>
          </div>
          <div className="space-y-1">
            <Input placeholder="Disabled" disabled />
            <p className="text-xs text-muted-foreground font-mono">
              Input — disabled
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ds-input-labeled">NPC Name</Label>
            <Input id="ds-input-labeled" placeholder="Enter NPC name…" />
            <p className="text-xs text-muted-foreground font-mono">
              Label + Input
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Textarea
        </p>
        <div className="space-y-1">
          <Textarea rows={3} placeholder="Write session notes…" />
          <p className="text-xs text-muted-foreground font-mono">
            Textarea — 3 rows
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Select
        </p>
        <div className="space-y-1">
          <Select>
            <SelectTrigger className="field-surface">
              <SelectValue placeholder="Select disposition…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ally">Ally</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="enemy">Enemy</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground font-mono">
            Select with field-surface
          </p>
        </div>
      </div>
    </div>
  );
}
