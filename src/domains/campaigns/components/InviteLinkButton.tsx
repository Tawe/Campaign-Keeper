"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";
import { SecondaryButton } from "@/components/ui/secondary-button";

interface Props {
  campaignId: string;
  inviteToken: string;
}

export function InviteLinkButton({ campaignId, inviteToken }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/join/${campaignId}?token=${inviteToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SecondaryButton onClick={handleCopy} size="sm">
      <Link2 className="mr-1.5 h-3.5 w-3.5" />
      {copied ? "Copied!" : "Invite players"}
    </SecondaryButton>
  );
}
