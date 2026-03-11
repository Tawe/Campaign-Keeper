"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateLocationInfo } from "@/domains/locations/actions";
import { PortraitUploader } from "@/components/shared/PortraitUploader";

interface Props {
  locationId: string;
  campaignId: string;
  imageUrl: string | null;
}

export function LocationImageEditor({ locationId, campaignId, imageUrl }: Props) {
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
        await updateLocationInfo(locationId, campaignId, "imageUrl", value ?? "");
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message ?? "Failed to update image");
      }
    });
  }

  return (
    <PortraitUploader
      label="Header image"
      value={draft}
      onChange={handleChange}
      showPreview={false}
      description={isPending ? "Saving…" : "Upload a map, artwork, or scene image for this location."}
    />
  );
}
