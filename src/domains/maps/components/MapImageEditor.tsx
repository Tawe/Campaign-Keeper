"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";
import { fileToProcessedFile } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";

interface MapImageEditorProps {
  mapId: string;
  campaignId: string;
  imageUrl: string | null;
}

export function MapImageEditor({ mapId, campaignId, imageUrl }: MapImageEditorProps) {
  const [draft, setDraft] = useState<string | null>(imageUrl);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setDraft(imageUrl);
  }, [imageUrl]);

  function handleRemove() {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/maps/${mapId}/image?campaignId=${encodeURIComponent(campaignId)}`, {
          method: "DELETE",
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to remove map image");
        }
        setDraft(null);
        router.refresh();
      } catch (error) {
        toast.error((error as Error).message ?? "Failed to remove map image");
      }
    });
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setDraft(previewUrl);

    startTransition(async () => {
      try {
        const processedFile = await fileToProcessedFile(file, {
          maxDimension: 2800,
          mimeType: "image/webp",
          quality: 0.92,
        });
        const formData = new FormData();
        formData.set("file", processedFile);
        formData.set("campaignId", campaignId);
        const response = await fetch(`/api/maps/${mapId}/image`, {
          method: "POST",
          body: formData,
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          throw new Error(payload?.error ?? "Failed to upload map image");
        }
        router.refresh();
      } catch (error) {
        setDraft(imageUrl);
        toast.error((error as Error).message ?? "Failed to upload map image");
      } finally {
        URL.revokeObjectURL(previewUrl);
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">Map image</p>
        <p className="text-xs text-muted-foreground">
          {isPending
            ? "Saving…"
            : "Upload the map image used for pin placement. High-resolution uploads are sent directly to the server for readability."}
        </p>
      </div>

      <div className="paper-inset flex items-center gap-4 rounded-2xl p-4">
        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={isPending}>
            <ImagePlus className="h-4 w-4" />
            {isPending ? "Uploading…" : draft ? "Replace image" : "Upload image"}
          </Button>
          {draft ? (
            <Button type="button" variant="ghost" onClick={handleRemove} disabled={isPending}>
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
