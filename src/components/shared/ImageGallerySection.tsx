import Image from "next/image";
import { SectionFrame } from "@/components/shared/editorial";
import type { GalleryImage } from "@/types";

interface ImageGallerySectionProps {
  title: string;
  eyebrow: string;
  description?: string;
  images: GalleryImage[];
  emptyMessage: string;
}

export function ImageGallerySection({
  title,
  eyebrow,
  description,
  images,
  emptyMessage,
}: ImageGallerySectionProps) {
  return (
    <SectionFrame title={title} eyebrow={eyebrow} description={description}>
      {images.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <a
              key={`${image.url}-${index}`}
              href={image.url}
              target="_blank"
              rel="noreferrer"
              className="group overflow-hidden rounded-2xl border border-border/80 bg-background/70"
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={image.url}
                  alt={image.caption || `${title} ${index + 1}`}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                />
              </div>
              {image.caption ? (
                <div className="border-t border-border/70 px-3 py-2 text-sm text-muted-foreground">
                  {image.caption}
                </div>
              ) : null}
            </a>
          ))}
        </div>
      )}
    </SectionFrame>
  );
}
