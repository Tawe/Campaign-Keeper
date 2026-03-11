import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function Avatar({ src, alt, className }: AvatarProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={32}
        height={32}
        className={cn("h-8 w-8 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <div
      aria-label={alt}
      className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground", className)}
    >
      {alt.slice(0, 1).toUpperCase()}
    </div>
  );
}
