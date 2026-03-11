"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createScheduledSession } from "@/domains/schedule/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  campaignId: string;
}

export function CreateScheduledSessionForm({ campaignId }: Props) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setLoading(true);
    try {
      await createScheduledSession({ campaignId, date, time, title, notes });
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to create session");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="time">Time</Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="Session 12 — The Ruins of Valdris"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Message to players</Label>
        <Textarea
          id="notes"
          placeholder="Any notes for the players — where to show up, what to bring, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
        <p className="text-xs text-muted-foreground">This will be included in the invite email.</p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Scheduling…" : "Schedule session"}
      </Button>
    </form>
  );
}
