import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Portrait } from "@/components/shared/Portrait";
import { formatDateShort } from "@/lib/utils";
import type { NpcWithLastMention } from "@/types";

const dispositionColors: Record<string, string> = {
  ally: "bg-public/80 text-[var(--public-foreground)]",
  enemy: "bg-destructive/15 text-destructive",
  neutral: "bg-secondary text-secondary-foreground",
  unknown: "bg-muted text-muted-foreground",
};

interface NpcCardProps {
  npc: NpcWithLastMention;
  campaignId: string;
}

export function NpcCard({ npc, campaignId }: NpcCardProps) {
  return (
    <Link
      href={`/campaigns/${campaignId}/npcs/${npc.id}`}
      className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent/45 sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Portrait src={npc.portrait_url} alt={npc.name} className="h-12 w-12 shrink-0" />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium">{npc.name}</span>
            {npc.disposition && (
              <Badge
                variant="outline"
                className={`shrink-0 border-transparent ${dispositionColors[npc.disposition] ?? ""}`}
              >
                {npc.disposition}
              </Badge>
            )}
          </div>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {npc.status ? <span className="truncate">{npc.status}</span> : null}
            {npc.stats_link ? <span>Stats linked</span> : null}
          </div>
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 ml-4">
        {formatDateShort(npc.last_mentioned)}
      </span>
    </Link>
  );
}
