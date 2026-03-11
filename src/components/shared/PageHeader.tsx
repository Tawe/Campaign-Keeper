import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  eyebrow?: string;
  action?: React.ReactNode;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  eyebrow,
  action,
}: PageHeaderProps) {
  return (
    <div className="mb-8 space-y-3">
      {backHref && (
        <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
          <Link href={backHref}>
            <ChevronLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      )}
      <div className="paper-panel flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="space-y-1">
          {eyebrow ? <p className="ds-section-header">{eyebrow}</p> : null}
          <h1 className="ink-title text-3xl sm:text-[2.4rem]">{title}</h1>
          {subtitle && (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}
