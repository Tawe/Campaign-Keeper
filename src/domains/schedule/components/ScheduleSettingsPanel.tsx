"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { updateScheduleSettings } from "@/domains/schedule/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  campaignId: string;
  scheduleCadence: string | null;
  reminderDaysBefore: number | null;
}

export function ScheduleSettingsPanel({ campaignId, scheduleCadence, reminderDaysBefore }: Props) {
  const [editing, setEditing] = useState(false);
  const [cadence, setCadence] = useState(scheduleCadence ?? "");
  const [days, setDays] = useState(reminderDaysBefore?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateScheduleSettings(campaignId, cadence, days);
      setEditing(false);
      toast.success("Settings saved");
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setCadence(scheduleCadence ?? "");
    setDays(reminderDaysBefore?.toString() ?? "");
    setEditing(false);
  }

  if (!editing) {
    return (
      <div className="paper-panel px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="ds-section-header">Schedule</p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
              <span className="text-foreground">
                {scheduleCadence || <span className="text-muted-foreground italic">No cadence set</span>}
              </span>
              {reminderDaysBefore != null && reminderDaysBefore > 0 && (
                <span className="text-muted-foreground">
                  Auto-reminder {reminderDaysBefore} day{reminderDaysBefore !== 1 ? "s" : ""} before
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="shrink-0">
            <Pencil className="h-4 w-4 mr-1.5" /> Edit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="paper-panel px-5 py-4 sm:px-6 space-y-4">
      <p className="ds-section-header">Schedule settings</p>

      <div className="space-y-1">
        <Label htmlFor="cadence" className="text-sm">Cadence</Label>
        <Input
          id="cadence"
          placeholder="Every other Friday at 7pm EST"
          value={cadence}
          onChange={(e) => setCadence(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Free text — shown at the top of this page.</p>
      </div>

      <div className="space-y-1 max-w-[180px]">
        <Label htmlFor="days" className="text-sm">Auto-reminder (days before)</Label>
        <Input
          id="days"
          type="number"
          min={0}
          max={30}
          placeholder="1"
          value={days}
          onChange={(e) => setDays(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Leave blank to disable.</p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Check className="h-4 w-4 mr-1" /> {saving ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
          <X className="h-4 w-4 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
}
