import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/ds-card";
import type { Campaign, Player } from "@/types";

interface PlayerCampaignCardProps {
  campaign: Campaign;
  players: Player[];
}

export function PlayerCampaignCard({ campaign, players }: PlayerCampaignCardProps) {
  const characters = players.flatMap((p) => p.characters.map((c) => c.name)).filter(Boolean);

  return (
    <Link href={`/player/campaigns/${campaign.id}`}>
      <Card className="cursor-pointer p-5">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-serif text-2xl leading-tight ds-text-primary">{campaign.name}</h3>
            {campaign.system && (
              <Badge variant="outline" className="shrink-0 border-white/10 text-[var(--ds-text-secondary)]">
                {campaign.system}
              </Badge>
            )}
          </div>
          <div className="text-sm ds-text-secondary">
            {characters.length > 0 ? (
              <p>Playing: {characters.join(", ")}</p>
            ) : (
              <p>No characters yet</p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
