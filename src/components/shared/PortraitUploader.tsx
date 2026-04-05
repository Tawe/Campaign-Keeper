"use client";

import NextImage from "next/image";
import { useId, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileToDataUrl } from "@/components/shared/image-upload";

interface PortraitUploaderProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  description?: string;
  showPreview?: boolean;
}

export function PortraitUploader({
  label,
  value,
  onChange,
  description,
  showPreview = true,
}: PortraitUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      onChange(dataUrl);
    } catch {
      setError("Could not process image.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      </div>

      <div className="paper-inset flex items-center gap-4 rounded-2xl p-4">
        {showPreview ? (
          value ? (
            <NextImage
              src={value}
              alt={label}
              width={96}
              height={96}
              className="h-24 w-24 rounded-2xl object-cover border border-border/80"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border border-dashed border-border/80 bg-background/60 text-muted-foreground">
              <ImagePlus className="h-6 w-6" />
            </div>
          )
        ) : null}

        <div className="flex flex-wrap gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={loading}>
            <ImagePlus className="h-4 w-4" />
            {loading ? "Processing…" : value ? "Replace image" : "Upload image"}
          </Button>
          {value ? (
            <Button type="button" variant="ghost" onClick={() => onChange(null)}>
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
