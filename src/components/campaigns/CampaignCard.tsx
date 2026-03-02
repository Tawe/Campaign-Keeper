import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetaStrip } from "@/components/shared/editorial";
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
      <Card className="cursor-pointer border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.45),transparent)] transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_1px_0_rgba(0,0,0,0.03),0_20px_36px_rgba(57,89,76,0.12)]">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="section-eyebrow">Campaign</p>
              <CardTitle className="text-2xl leading-tight">{campaign.name}</CardTitle>
            </div>
            {campaign.system && (
              <Badge variant="secondary" className="shrink-0">
                {campaign.system}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <MetaStrip
            items={[
              participantLabel,
              lastSessionDate ? `Last session ${formatDateShort(lastSessionDate)}` : "No sessions yet",
            ]}
          />
          {campaign.participants.length > 0 && (
            <p className="text-sm leading-6 text-muted-foreground">{campaign.participants.join(", ")}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
