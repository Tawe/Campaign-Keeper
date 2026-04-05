"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { fileToDataUrl } from "@/components/shared/image-upload";
import { Input } from "@/components/ui/input";
import type { GalleryImage } from "@/types";

interface ImageGalleryEditorProps {
  label: string;
  description?: string;
  images: GalleryImage[];
  emptyLabel: string;
  addLabel?: string;
  onAdd: (value: string) => Promise<void>;
  onRemove: (index: number) => Promise<void>;
  onCaptionChange: (index: number, caption: string) => Promise<void>;
}

export function ImageGalleryEditor({
  label,
  description,
  images,
  emptyLabel,
  addLabel = "Add image",
  onAdd,
  onRemove,
  onCaptionChange,
}: ImageGalleryEditorProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [captions, setCaptions] = useState<string[]>(images.map((image) => image.caption ?? ""));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCaptions(images.map((image) => image.caption ?? ""));
  }, [images]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      await onAdd(dataUrl);
    } catch (err) {
      toast.error((err as Error).message ?? "Could not upload image.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleRemove(index: number) {
    setActiveIndex(index);
    startTransition(async () => {
      try {
        await onRemove(index);
      } catch (err) {
        toast.error((err as Error).message ?? "Could not remove image.");
      } finally {
        setActiveIndex(null);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={loading || isPending}>
          <ImagePlus className="h-4 w-4" />
          {loading ? "Processing…" : addLabel}
        </Button>
      </div>

      {images.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-background/40 px-4 py-6 text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <div key={`${image.url}-${index}`} className="overflow-hidden rounded-2xl border border-border/80 bg-background/70">
              <div className="relative aspect-[4/3]">
                <Image src={image.url} alt={image.caption || `${label} ${index + 1}`} fill unoptimized className="object-cover" />
              </div>
              <div className="space-y-2 p-2">
                <Input
                  value={captions[index] ?? ""}
                  placeholder="Add a caption…"
                  onChange={(event) => {
                    setCaptions((current) => current.map((caption, currentIndex) => (
                      currentIndex === index ? event.target.value : caption
                    )));
                  }}
                  onBlur={() => {
                    const nextCaption = captions[index] ?? "";
                    startTransition(async () => {
                      try {
                        await onCaptionChange(index, nextCaption);
                      } catch (err) {
                        toast.error((err as Error).message ?? "Could not save caption.");
                      }
                    });
                  }}
                  disabled={isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  disabled={isPending && activeIndex === index}
                >
                  <Trash2 className="h-4 w-4" />
                  {isPending && activeIndex === index ? "Removing…" : "Remove"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
