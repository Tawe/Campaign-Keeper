"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InlineInputEditorProps {
  label: string;
  value: string | null;
  action: (value: string) => Promise<void>;
  placeholder?: string;
  isUrl?: boolean;
}

export function InlineInputEditor({
  label,
  value,
  action,
  placeholder,
  isUrl = false,
}: InlineInputEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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

  function handleCancel() {
    setDraft(value ?? "");
    setEditing(false);
  }

  return (
    <div className="paper-inset space-y-2 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        {!editing ? (
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : null}
      </div>

      {editing ? (
        <div className="space-y-2">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} autoFocus />
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
        isUrl ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline underline-offset-2"
          >
            Open link
          </a>
        ) : (
          <p className="text-sm text-foreground">{value}</p>
        )
      ) : (
        <p className="text-sm italic text-muted-foreground">{placeholder ?? "Nothing recorded yet."}</p>
      )}
    </div>
  );
}
