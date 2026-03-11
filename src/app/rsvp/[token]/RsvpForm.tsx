"use client";

import { useState } from "react";
import { toast } from "sonner";
import { respondToRsvp } from "@/domains/schedule/rsvp-actions";
import type { AttendanceStatus } from "@/types";
import { Textarea } from "@/components/ui/textarea";

type ResponseStatus = "attending" | "maybe" | "not_attending";

const OPTIONS: { status: ResponseStatus; label: string; activeClass: string; inactiveClass: string }[] = [
  {
    status: "attending",
    label: "✓ Attending",
    activeClass: "bg-emerald-600 text-white border-emerald-600",
    inactiveClass: "border-border text-foreground hover:border-emerald-600/60",
  },
  {
    status: "maybe",
    label: "? Maybe",
    activeClass: "bg-amber-600 text-white border-amber-600",
    inactiveClass: "border-border text-foreground hover:border-amber-600/60",
  },
  {
    status: "not_attending",
    label: "✗ Can't Make It",
    activeClass: "bg-rose-700 text-white border-rose-700",
    inactiveClass: "border-border text-foreground hover:border-rose-700/60",
  },
];

interface Props {
  token: string;
  initialStatus: ResponseStatus | undefined;
  initialMessage: string;
}

export function RsvpForm({ token, initialStatus, initialMessage }: Props) {
  const [selected, setSelected] = useState<ResponseStatus | undefined>(initialStatus);
  const [message, setMessage] = useState(initialMessage);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setSaved(false);
    try {
      await respondToRsvp(token, selected as AttendanceStatus, message);
      setSaved(true);
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to save response");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.status}
            type="button"
            onClick={() => { setSelected(opt.status); setSaved(false); }}
            className={`w-full rounded-lg border-2 px-4 py-3 text-left font-medium transition-colors ${
              selected === opt.status ? opt.activeClass : opt.inactiveClass
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="rsvp-message">
          Message (optional)
        </label>
        <Textarea
          id="rsvp-message"
          placeholder="Running late, leaving early, bringing snacks…"
          value={message}
          onChange={(e) => { setMessage(e.target.value); setSaved(false); }}
          rows={3}
        />
      </div>

      {saved ? (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-700">
          Response saved! You can update it at any time by revisiting this link.
        </div>
      ) : (
        <button
          type="submit"
          disabled={!selected || saving}
          className="w-full rounded-lg bg-foreground text-background px-4 py-3 font-medium transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save response"}
        </button>
      )}
    </form>
  );
}
