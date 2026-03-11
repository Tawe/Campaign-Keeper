import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SecondaryButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      variant="outline"
      className={cn(
        "border-white/10 bg-[color:color-mix(in_srgb,var(--ds-bg-elevated)_66%,transparent)] text-[var(--ds-text-primary)]",
        "hover:border-[color:color-mix(in_srgb,var(--ds-accent)_40%,transparent)] hover:bg-[color:color-mix(in_srgb,var(--ds-bg-soft)_72%,transparent)]",
        className
      )}
      {...props}
    />
  );
}
