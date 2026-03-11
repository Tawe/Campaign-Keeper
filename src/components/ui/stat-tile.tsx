import { Panel } from "@/components/ui/panel";

interface StatTileProps {
  label: string;
  value: number;
  className?: string;
}

export function StatTile({ label, value, className }: StatTileProps) {
  return (
    <Panel className={className ? className : "p-3 text-center"}>
      <p className="ds-section-header text-[0.7rem]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </Panel>
  );
}
