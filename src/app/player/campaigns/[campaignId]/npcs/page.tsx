import { redirect } from "next/navigation";
import Image from "next/image";
import { User } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignNpcsWithMentions } from "@/domains/npcs/queries";
import { Badge } from "@/components/ui/badge";

const dispositionColors: Record<string, string> = {
  ally: "bg-public/80 text-[var(--public-foreground)] border-transparent",
  enemy: "bg-destructive/15 text-destructive border-transparent",
  neutral: "bg-secondary text-secondary-foreground border-transparent",
  unknown: "bg-muted text-muted-foreground border-transparent",
};

export default async function PlayerNpcsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const npcs = await getCampaignNpcsWithMentions(campaignId);

  if (npcs.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No NPCs in this campaign yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {npcs.map((npc) => {
        const classDisplay =
          npc.npc_class.length > 0
            ? npc.npc_class.map((c) => `${c.name} ${c.level}`).join(" / ")
            : null;
        const identityParts = [npc.race, classDisplay].filter(Boolean) as string[];

        return (
          <div key={npc.id} className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-border/80">
            {npc.portrait_url ? (
              <Image
                src={npc.portrait_url}
                alt={npc.name}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <User className="h-12 w-12 text-muted-foreground/30" />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

            {npc.disposition && (
              <div className="absolute right-2 top-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${dispositionColors[npc.disposition] ?? ""}`}
                >
                  {npc.disposition}
                </Badge>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 space-y-1 p-3">
              <p className="truncate font-semibold leading-tight text-white">{npc.name}</p>
              {identityParts.length > 0 && (
                <p className="text-xs text-white/70">{identityParts.join(" · ")}</p>
              )}
              {npc.public_info && (
                <p className="line-clamp-2 text-xs text-white/60">{npc.public_info}</p>
              )}
              {npc.faction_names.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {npc.faction_names.slice(0, 2).map((name) => (
                    <span
                      key={name}
                      className="max-w-[90px] truncate rounded bg-white/15 px-1.5 py-0.5 text-[10px] text-white/80"
                    >
                      {name}
                    </span>
                  ))}
                  {npc.faction_names.length > 2 && (
                    <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] text-white/80">
                      +{npc.faction_names.length - 2}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
