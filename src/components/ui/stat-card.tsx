import { Panel } from "@/components/ui/panel";

interface StatCardProps {
  title: string;
  value: number;
}

export function StatCard({ title, value }: StatCardProps) {
  return (
    <Panel className="p-4">
      <p className="ds-section-header text-[0.7rem]">{title}</p>
      <p className="mt-1 text-2xl font-semibold ds-text-primary">{value}</p>
    </Panel>
  );
}

