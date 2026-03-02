"use client";

import { useState, useTransition } from "react";
import { Ban, Check, Link2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  disableSessionShareToken,
  ensureSessionShareToken,
  rotateSessionShareToken,
} from "@/app/actions/sessions";
import { Button } from "@/components/ui/button";

interface CopyShareLinkButtonProps {
  sessionId: string;
}

export function CopyShareLinkButton({ sessionId }: CopyShareLinkButtonProps) {
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function copyTokenUrl(tokenPromise: Promise<string>) {
    setCopying(true);
    try {
      const token = await tokenPromise;
      const url = `${window.location.origin}/share/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Share link copied");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to create share link");
    } finally {
      setCopying(false);
    }
  }

  async function handleCopy() {
    await copyTokenUrl(ensureSessionShareToken(sessionId));
  }

  function handleRotate() {
    startTransition(async () => {
      await copyTokenUrl(rotateSessionShareToken(sessionId));
    });
  }

  function handleDisable() {
    const confirmed = window.confirm(
      "Disable the current public recap link? Anyone with the old link will lose access."
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await disableSessionShareToken(sessionId);
        setCopied(false);
        toast.success("Public share link disabled");
      } catch {
        toast.error("Failed to disable share link");
      }
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="panel" size="sm" onClick={handleCopy} disabled={copying || isPending}>
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
        {copying ? "Creating…" : copied ? "Copied!" : "Copy share link"}
      </Button>
      <Button variant="outline" size="sm" onClick={handleRotate} disabled={copying || isPending}>
        <RefreshCw className="h-4 w-4" />
        Rotate link
      </Button>
      <Button variant="ghost" size="sm" onClick={handleDisable} disabled={copying || isPending}>
        <Ban className="h-4 w-4" />
        Disable link
      </Button>
    </div>
  );
}
