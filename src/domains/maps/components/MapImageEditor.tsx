"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateMapImage } from "@/domains/maps/actions";
import { PortraitUploader } from "@/components/shared/PortraitUploader";

interface MapImageEditorProps {
  mapId: string;
  campaignId: string;
  imageUrl: string | null;
}

export function MapImageEditor({ mapId, campaignId, imageUrl }: MapImageEditorProps) {
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
        await updateMapImage(mapId, campaignId, value ?? "");
        router.refresh();
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to update map image");
      }
    });
  }

  return (
    <PortraitUploader
      label="Map image"
      value={draft}
      onChange={handleChange}
      showPreview={false}
      description={isPending ? "Saving…" : "Upload the map image used for pin placement. High-resolution uploads are preserved for readability."}
      uploadOptions={{
        maxDimension: 2800,
        mimeType: "image/webp",
        quality: 0.92,
      }}
    />
  );
}
