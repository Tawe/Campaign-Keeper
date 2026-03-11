"use client";

const surfaceTokens = [
  { var: "--ds-bg-main", label: "ds-bg-main" },
  { var: "--ds-bg-elevated", label: "ds-bg-elevated" },
  { var: "--ds-bg-soft", label: "ds-bg-soft" },
];

const textTokens = [
  { var: "--ds-text-primary", label: "ds-text-primary" },
  { var: "--ds-text-secondary", label: "ds-text-secondary" },
  { var: "--ds-accent", label: "ds-accent" },
];

const utilityClasses = [
  { cls: "ds-panel", label: ".ds-panel" },
  { cls: "paper-panel", label: ".paper-panel" },
  { cls: "paper-inset", label: ".paper-inset" },
  { cls: "field-surface", label: ".field-surface" },
];

function Swatch({ cssVar, label }: { cssVar: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-14 w-full rounded-lg border border-white/10"
        style={{ background: `var(${cssVar})` }}
      />
      <p className="text-xs text-muted-foreground font-mono">{label}</p>
    </div>
  );
}

function UtilitySwatch({ cls, label }: { cls: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-14 w-full rounded-lg border border-white/10 ${cls}`} />
      <p className="text-xs text-muted-foreground font-mono">{label}</p>
    </div>
  );
}

export function TokensSection() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Surface tokens
        </p>
        <div className="grid grid-cols-3 gap-3">
          {surfaceTokens.map((t) => (
            <Swatch key={t.var} cssVar={t.var} label={t.label} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Text tokens
        </p>
        <div className="grid grid-cols-3 gap-3">
          {textTokens.map((t) => (
            <Swatch key={t.var} cssVar={t.var} label={t.label} />
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Named surface classes
        </p>
        <div className="grid grid-cols-4 gap-3">
          {utilityClasses.map((u) => (
            <UtilitySwatch key={u.cls} cls={u.cls} label={u.label} />
          ))}
        </div>
      </div>
    </div>
  );
}
