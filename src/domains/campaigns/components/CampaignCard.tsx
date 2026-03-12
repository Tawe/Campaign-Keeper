import Link from "next/link";
import Image from "next/image";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";
import type { Campaign } from "@/types";

interface CampaignCardProps {
  campaign: Campaign;
  lastSessionDate?: string | null;
  nextSessionDate?: string | null;
  playerCount?: number;
}

export function CampaignCard({ campaign, lastSessionDate, nextSessionDate, playerCount }: CampaignCardProps) {
  const participantLabel =
    playerCount != null && playerCount > 0
      ? `${playerCount} player${playerCount === 1 ? "" : "s"}`
      : "No players yet";

  const nextLabel = nextSessionDate
    ? new Date(nextSessionDate + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Link href={`/campaigns/${campaign.id}`} className="block group">
      <div className="relative overflow-hidden rounded-lg border border-white/5 transition hover:shadow-[0_10px_24px_color-mix(in_srgb,var(--ds-accent-soft)_42%,transparent)]">
        {campaign.image_url ? (
          <>
            <Image
              src={campaign.image_url}
              alt={campaign.name}
              width={640}
              height={200}
              unoptimized
              className="h-40 w-full object-cover transition group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <div className="flex items-end justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="font-serif text-2xl leading-tight text-white drop-shadow">
                    {campaign.name}
                  </h3>
                  <p className="text-xs text-white/60">{participantLabel}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {campaign.system && (
                    <Badge variant="outline" className="border-white/20 text-white/80 bg-black/30">
                      {campaign.system}
                    </Badge>
                  )}
                  {nextLabel && (
                    <span className="flex items-center gap-1 rounded-md bg-primary/80 px-2 py-0.5 text-xs font-medium text-white">
                      <Calendar className="h-3 w-3" />
                      {nextLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-[color:color-mix(in_srgb,var(--ds-bg-elevated)_74%,transparent)] p-5 hover:bg-[color:color-mix(in_srgb,var(--ds-bg-soft)_74%,transparent)]">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-2xl leading-tight ds-text-primary">{campaign.name}</h3>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {campaign.system && (
                    <Badge variant="outline" className="border-white/10 text-[var(--ds-text-secondary)]">
                      {campaign.system}
                    </Badge>
                  )}
                  {nextLabel && (
                    <span className="flex items-center gap-1 rounded-md bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                      <Calendar className="h-3 w-3" />
                      {nextLabel}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1 text-sm ds-text-secondary">
                <p>{participantLabel}</p>
                <p>{lastSessionDate ? `Last session ${formatDateShort(lastSessionDate)}` : "No sessions yet"}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
