"use client";

import { useRouter } from "next/navigation";
import { addNpcGalleryImage, removeNpcGalleryImage, updateNpcGalleryCaption } from "@/domains/npcs/actions";
import { ImageGalleryEditor } from "@/components/shared/ImageGalleryEditor";
import type { GalleryImage } from "@/types";

interface NpcGalleryEditorProps {
  npcId: string;
  campaignId: string;
  images: GalleryImage[];
}

export function NpcGalleryEditor({ npcId, campaignId, images }: NpcGalleryEditorProps) {
  const router = useRouter();

  async function handleAdd(value: string) {
    await addNpcGalleryImage(npcId, campaignId, value);
    router.refresh();
  }

  async function handleRemove(index: number) {
    await removeNpcGalleryImage(npcId, campaignId, index);
    router.refresh();
  }

  async function handleCaptionChange(index: number, caption: string) {
    await updateNpcGalleryCaption(npcId, campaignId, index, caption);
    router.refresh();
  }

  return (
    <ImageGalleryEditor
      label="NPC gallery"
      description="Add reference art, alternate looks, table photos, or other images of this NPC."
      images={images}
      emptyLabel="No gallery images yet."
      addLabel="Add gallery image"
      onAdd={handleAdd}
      onRemove={handleRemove}
      onCaptionChange={handleCaptionChange}
    />
  );
}
