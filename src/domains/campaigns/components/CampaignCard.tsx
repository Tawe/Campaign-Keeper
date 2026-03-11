import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/ds-card";
import { formatDateShort } from "@/lib/utils";
import type { Campaign } from "@/types";

interface CampaignCardProps {
  campaign: Campaign;
  lastSessionDate?: string | null;
}

export function CampaignCard({ campaign, lastSessionDate }: CampaignCardProps) {
  const participantLabel =
    campaign.participants.length > 0
      ? `${campaign.participants.length} player${campaign.participants.length === 1 ? "" : "s"}`
      : "No roster yet";

  return (
    <Link href={`/campaigns/${campaign.id}`}>
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
          <div className="space-y-1 text-sm ds-text-secondary">
            <p>{participantLabel}</p>
            <p>{lastSessionDate ? `Last session ${formatDateShort(lastSessionDate)}` : "No sessions yet"}</p>
          </div>
          {campaign.participants.length > 0 && (
            <p className="text-sm leading-6 ds-body">{campaign.participants.join(", ")}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}
