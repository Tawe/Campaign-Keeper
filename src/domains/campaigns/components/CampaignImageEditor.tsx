"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateCampaignImage } from "@/domains/campaigns/actions";
import { PortraitUploader } from "@/components/shared/PortraitUploader";

interface Props {
  campaignId: string;
  imageUrl: string | null;
}

export function CampaignImageEditor({ campaignId, imageUrl }: Props) {
  const [draft, setDraft] = useState<string | null>(imageUrl);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setDraft(imageUrl);
  }, [imageUrl]);

  function handleChange(value: string | null) {
    setDraft(value);
    startTransition(async () => {
      try {
        await updateCampaignImage(campaignId, value ?? "");
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message ?? "Failed to update image");
      }
    });
  }

  return (
    <PortraitUploader
      label="Hero image"
      value={draft}
      onChange={handleChange}
      showPreview={false}
      description={isPending ? "Saving…" : "Upload a banner image for this campaign."}
    />
  );
}
