"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateEventImage } from "@/domains/events/actions";
import { PortraitUploader } from "@/components/shared/PortraitUploader";

interface Props {
  eventId: string;
  campaignId: string;
  imageUrl: string | null;
}

export function EventImageEditor({ eventId, campaignId, imageUrl }: Props) {
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
        await updateEventImage(eventId, campaignId, value ?? "");
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message ?? "Failed to update image");
      }
    });
  }

  return (
    <PortraitUploader
      label="Background image"
      value={draft}
      onChange={handleChange}
      showPreview={false}
      description={isPending ? "Saving…" : "Upload artwork or a scene image for this event."}
    />
  );
}
