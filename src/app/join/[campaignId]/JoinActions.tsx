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
    // Store join params so auth callback can complete the join after sign-in
    sessionStorage.setItem("joinCampaignId", campaignId);
    sessionStorage.setItem("joinToken", token);
  }, [campaignId, token]);

  function handleSignIn() {
    sessionStorage.setItem("joinCampaignId", campaignId);
    sessionStorage.setItem("joinToken", token);
    router.push("/login");
  }

  return (
    <PrimaryButton onClick={handleSignIn} className="w-full">
      Sign in to join campaign
    </PrimaryButton>
  );
}
