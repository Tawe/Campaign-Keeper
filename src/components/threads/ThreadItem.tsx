"use client";

import { useTransition } from "react";
import { CheckCircle, Circle } from "lucide-react";
import { toast } from "sonner";
import { resolveThread, reopenThread } from "@/app/actions/threads";
import { Button } from "@/components/ui/button";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import type { Thread } from "@/types";

interface ThreadItemProps {
  thread: Thread;
  campaignId: string;
}

export function ThreadItem({ thread, campaignId }: ThreadItemProps) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      try {
        if (thread.status === "open") {
          await resolveThread(thread.id, campaignId);
          toast.success("Thread resolved");
        } else {
          await reopenThread(thread.id, campaignId);
          toast.success("Thread reopened");
        }
      } catch {
        toast.error("Failed to update thread");
      }
    });
  }

  return (
    <div className="flex items-start gap-3 px-4 py-3 sm:px-5">
      <Button
        variant="ghost"
        size="icon"
        className="mt-0.5 h-7 w-7 shrink-0 rounded-full"
        onClick={toggle}
        disabled={pending}
      >
        {thread.status === "resolved" ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
      <span
        className={`flex-1 pt-1 text-sm ${thread.status === "resolved" ? "text-muted-foreground line-through" : ""}`}
      >
        {thread.text}
      </span>
      <VisibilityBadge visibility={thread.visibility} />
    </div>
  );
}
