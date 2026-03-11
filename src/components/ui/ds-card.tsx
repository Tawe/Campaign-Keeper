import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/5 bg-[color:color-mix(in_srgb,var(--ds-bg-elevated)_74%,transparent)] p-4 transition",
        "hover:bg-[color:color-mix(in_srgb,var(--ds-bg-soft)_74%,transparent)] hover:shadow-[0_10px_24px_color-mix(in_srgb,var(--ds-accent-soft)_42%,transparent)]",
        className
      )}
      {...props}
    />
  );
}
