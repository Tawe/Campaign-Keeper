interface SectionHeaderProps {
  label: string;
  title: string;
  description?: string;
}

export function SectionHeader({ label, title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-1">
      <p className="ds-section-header text-xs tracking-[0.14em]">{label}</p>
      <h2 className="font-serif text-2xl tracking-[-0.02em] text-foreground">{title}</h2>
      {description ? <p className="ds-body">{description}</p> : null}
    </div>
  );
}
