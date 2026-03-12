"use client";

import { useRef, useState, useTransition } from "react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { updateCampaignImage } from "@/domains/campaigns/actions";

interface Props {
  campaignId: string;
  imageUrl: string | null;
}

async function fileToDataUrl(file: File): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = objectUrl;
    });
    const maxSize = 1200;
    const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function CampaignImageEditor({ campaignId, imageUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(imageUrl);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = "";
    try {
      const dataUrl = await fileToDataUrl(file);
      setPreview(dataUrl);
      startTransition(async () => {
        try {
          await updateCampaignImage(campaignId, dataUrl);
          router.refresh();
        } catch (err) {
          toast.error((err as Error).message ?? "Failed to save image");
          setPreview(imageUrl);
        }
      });
    } catch {
      toast.error("Could not process image.");
    }
  }

  function handleRemove() {
    setPreview(null);
    startTransition(async () => {
      try {
        await updateCampaignImage(campaignId, "");
        router.refresh();
      } catch (err) {
        toast.error((err as Error).message ?? "Failed to remove image");
        setPreview(imageUrl);
      }
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {preview ? (
        <div className="group relative h-40 w-full sm:h-52">
          <NextImage
            src={preview}
            alt="Campaign hero"
            fill
            unoptimized
            className="object-cover"
          />
          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isPending}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-white/25"
              aria-label="Replace image"
            >
              <ImagePlus className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={isPending}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition hover:bg-destructive/80"
              aria-label="Remove image"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
          {isPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="text-xs text-white/80">Saving…</span>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 border-t border-border/50 py-3 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ImagePlus className="h-4 w-4" />
          Add hero image
        </button>
      )}
    </>
  );
}
