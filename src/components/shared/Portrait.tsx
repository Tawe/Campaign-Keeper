import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortraitProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function Portrait({ src, alt, className }: PortraitProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={160}
        height={160}
        unoptimized
        className={cn("rounded-2xl border border-border/80 object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-2xl border border-dashed border-border/80 bg-panel text-muted-foreground",
        className
      )}
    >
      <User className="h-6 w-6" />
    </div>
  );
}
