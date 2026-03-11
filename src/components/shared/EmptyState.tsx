import Link from "next/link";
import { PrimaryButton } from "@/components/ui/primary-button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="paper-panel flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <p className="ds-section-header">Fresh Page</p>
      <p className="font-serif text-2xl tracking-[-0.02em] text-foreground">{title}</p>
      <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      {actionLabel && actionHref && (
        <PrimaryButton asChild className="mt-2">
          <Link href={actionHref}>{actionLabel}</Link>
        </PrimaryButton>
      )}
    </div>
  );
}
