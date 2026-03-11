"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateNpcInfo } from "@/domains/npcs/actions";
import { PortraitUploader } from "@/components/shared/PortraitUploader";

interface NpcProfileEditorProps {
  npcId: string;
  campaignId: string;
  portraitUrl: string | null;
}

export function NpcProfileEditor({
  npcId,
  campaignId,
  portraitUrl,
}: NpcProfileEditorProps) {
  const [draft, setDraft] = useState<string | null>(portraitUrl);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setDraft(portraitUrl);
  }, [portraitUrl]);

  function handleChange(value: string | null) {
    setDraft(value);
    startTransition(async () => {
      try {
        await updateNpcInfo(npcId, campaignId, "portraitUrl", value ?? "");
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message ?? "Failed to update portrait");
      }
    });
  }

  return (
    <PortraitUploader
      label="NPC portrait"
      value={draft}
      onChange={handleChange}
      showPreview={false}
      description={isPending ? "Saving portrait…" : "Upload a portrait or token image for this NPC."}
    />
  );
}
