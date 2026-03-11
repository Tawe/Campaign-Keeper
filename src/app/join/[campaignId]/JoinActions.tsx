"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui/primary-button";

interface Props {
  campaignId: string;
  token: string;
}

export function JoinActions({ campaignId, token }: Props) {
  const router = useRouter();

  useEffect(() => {
    // Store join params so auth callback can complete the join after sign-in.
    // Must use localStorage (not sessionStorage) — magic links open in a new tab
    // which has isolated sessionStorage.
    localStorage.setItem("joinCampaignId", campaignId);
    localStorage.setItem("joinToken", token);
  }, [campaignId, token]);

  function handleSignIn() {
    localStorage.setItem("joinCampaignId", campaignId);
    localStorage.setItem("joinToken", token);
    router.push("/login");
  }

  return (
    <PrimaryButton onClick={handleSignIn} className="w-full">
      Sign in to join campaign
    </PrimaryButton>
  );
}
