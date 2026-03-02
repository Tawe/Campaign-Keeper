import { NpcCard } from "./NpcCard";
import { StackedList } from "@/components/shared/editorial";
import type { NpcWithLastMention } from "@/types";

interface NpcIndexProps {
  npcs: NpcWithLastMention[];
  campaignId: string;
}

export function NpcIndex({ npcs, campaignId }: NpcIndexProps) {
  return (
    <StackedList>
      {npcs.map((npc) => (
        <NpcCard key={npc.id} npc={npc} campaignId={campaignId} />
      ))}
    </StackedList>
  );
}
