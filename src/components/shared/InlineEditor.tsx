"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface InlineEditorProps {
  label: string;
  value: string | null;
  action: (value: string) => Promise<void>;
  dmOnly?: boolean;
  placeholder?: string;
}

export function InlineEditor({ label, value, action, dmOnly, placeholder }: InlineEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleEdit() {
    setDraft(value ?? "");
    setEditing(true);
  }

  function handleCancel() {
    setDraft(value ?? "");
    setEditing(false);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await action(draft);
        router.refresh();
        setEditing(false);
      } catch (err) {
        toast.error((err as Error).message ?? "Failed to save");
      }
    });
  }

  return (
    <div
      className={`rounded-md border p-4 space-y-2 ${
        dmOnly
          ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30"
          : "border-border"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
          {dmOnly && (
            <span className="ml-2 normal-case text-amber-700 dark:text-amber-400">— DM only</span>
          )}
        </p>
        {!editing && (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleEdit}>
            Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={4}
            autoFocus
            className="resize-none"
          />
          <div className="flex gap-2">
            <Button size="sm" disabled={isPending} onClick={handleSave}>
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : value ? (
        <p className="text-sm whitespace-pre-wrap">{value}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          {placeholder ?? "Nothing recorded yet."}
        </p>
      )}
    </div>
  );
}
