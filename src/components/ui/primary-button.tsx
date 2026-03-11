import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PrimaryButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn(
        "bg-[var(--ds-accent)] text-[#1a2134] hover:brightness-105",
        "shadow-[0_8px_20px_color-mix(in_srgb,var(--ds-accent-soft)_58%,transparent)]",
        className
      )}
      {...props}
    />
  );
}
