import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionFrame({
  title,
  eyebrow,
  description,
  action,
  tone = "default",
  className,
  contentClassName,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: ReactNode;
  tone?: "default" | "public" | "private" | "inset";
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  const toneClass =
    tone === "public"
      ? "mode-public"
      : tone === "private"
        ? "mode-private"
        : tone === "inset"
          ? "paper-inset"
          : "paper-panel";

  return (
    <section className={cn("overflow-hidden", toneClass, className)}>
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="space-y-1">
          {eyebrow ? <p className="ds-section-header">{eyebrow}</p> : null}
          <h2 className="font-serif text-xl tracking-[-0.02em] text-foreground">{title}</h2>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={cn("px-5 py-5 sm:px-6", contentClassName)}>{children}</div>
    </section>
  );
}

export function MetaStrip({
  items,
  className,
}: {
  items: Array<ReactNode | null | false | undefined>;
  className?: string;
}) {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return null;

  return (
    <div className={cn("paper-inset flex flex-wrap gap-2 px-3 py-2 text-sm text-muted-foreground", className)}>
      {filtered.map((item, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-3 py-1"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function ModeCallout({
  mode,
  title,
  description,
  className,
  children,
}: {
  mode: "public" | "private";
  title: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        mode === "public" ? "mode-public" : "mode-private",
        className
      )}
    >
      <div className="space-y-1">
        <p className="ds-section-header">{mode === "public" ? "Player-facing" : "DM only"}</p>
        <p className="font-medium text-foreground">{title}</p>
        {description ? <p className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
        {children}
      </div>
    </div>
  );
}

export function StackedList({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg bg-muted/40 divide-y divide-border/60",
        className
      )}
    >
      {children}
    </div>
  );
}
