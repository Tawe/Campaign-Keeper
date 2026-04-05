"use client";

import { useRouter } from "next/navigation";
import {
  addLocationGalleryImage,
  removeLocationGalleryImage,
  updateLocationGalleryCaption,
} from "@/domains/locations/actions";
import { ImageGalleryEditor } from "@/components/shared/ImageGalleryEditor";
import type { GalleryImage } from "@/types";

interface LocationGalleryEditorProps {
  locationId: string;
  campaignId: string;
  images: GalleryImage[];
}

export function LocationGalleryEditor({
  locationId,
  campaignId,
  images,
}: LocationGalleryEditorProps) {
  const router = useRouter();

  async function handleAdd(value: string) {
    await addLocationGalleryImage(locationId, campaignId, value);
    router.refresh();
  }

  async function handleRemove(index: number) {
    await removeLocationGalleryImage(locationId, campaignId, index);
    router.refresh();
  }

  async function handleCaptionChange(index: number, caption: string) {
    await updateLocationGalleryCaption(locationId, campaignId, index, caption);
    router.refresh();
  }

  return (
    <ImageGalleryEditor
      label="Location gallery"
      description="Add maps, landmarks, handouts, and other views of this location."
      images={images}
      emptyLabel="No gallery images yet."
      addLabel="Add gallery image"
      onAdd={handleAdd}
      onRemove={handleRemove}
      onCaptionChange={handleCaptionChange}
    />
  );
}
