import { NpcCard } from "./NpcCard";
import type { NpcWithLastMention } from "@/types";

interface NpcIndexProps {
  npcs: NpcWithLastMention[];
  campaignId: string;
}

export function NpcIndex({ npcs, campaignId }: NpcIndexProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {npcs.map((npc) => (
        <NpcCard key={npc.id} npc={npc} campaignId={campaignId} />
      ))}
    </div>
  );
}
