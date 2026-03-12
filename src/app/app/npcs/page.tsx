import Link from "next/link";
import Image from "next/image";
import { User, MapPin } from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getGlobalNpcsWithCampaigns } from "@/domains/npcs/queries";
import { deleteNpcPermanently } from "@/domains/npcs/actions";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { VaultDeleteButton } from "@/components/shared/VaultDeleteButton";
import { Badge } from "@/components/ui/badge";

const dispositionColors: Record<string, string> = {
  ally: "bg-public/80 text-[var(--public-foreground)] border-transparent",
  enemy: "bg-destructive/15 text-destructive border-transparent",
  neutral: "bg-secondary text-secondary-foreground border-transparent",
  unknown: "bg-muted text-muted-foreground border-transparent",
};

export default async function GlobalNpcsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { npcs, npcCampaigns, campaignMap } = await getGlobalNpcsWithCampaigns(user.uid);

  return (
    <div className="page-shell max-w-5xl space-y-8">
      <PageHeader
        title="NPCs"
        eyebrow="Vault"
        backHref="/app/dashboard"
        backLabel="Dashboard"
      />

      {npcs.length === 0 ? (
        <EmptyState
          title="No NPCs yet"
          description="NPCs appear here once they have been mentioned in at least one session."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {npcs.map((npc) => {
            const campaigns = npcCampaigns.get(npc.id) ?? [];
            const classDisplay =
              npc.npc_class.length > 0
                ? npc.npc_class.map((c) => `${c.name} ${c.level}`).join(" / ")
                : null;
            const identityParts = [npc.race, classDisplay].filter(Boolean) as string[];

            return (
              <div
                key={npc.id}
                className="relative overflow-hidden rounded-xl border border-border/80 group transition hover:shadow-md"
              >
                <Link href={`/app/npcs/${npc.id}`} className="block">
                  <div className="aspect-[3/4]">
                    {npc.portrait_url ? (
                      <Image
                        src={npc.portrait_url}
                        alt={npc.name}
                        fill
                        unoptimized
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <User className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 space-y-1 p-3">
                      <p className="truncate font-semibold leading-tight text-white">{npc.name}</p>
                      {identityParts.length > 0 && (
                        <p className="text-xs text-white/70">{identityParts.join(" · ")}</p>
                      )}
                      {npc.status && (
                        <p className="truncate text-xs text-white/60">{npc.status}</p>
                      )}
                      {npc.last_scene && (
                        <p className="flex items-center gap-1 truncate text-xs text-white/60">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {npc.last_scene}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Campaign badges + delete — overlaid top-right */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  <VaultDeleteButton
                    entityName={npc.name}
                    description="This will permanently delete this NPC from all campaigns and the vault. This cannot be undone."
                    action={deleteNpcPermanently.bind(null, npc.id)}
                  />
                  {campaigns.map(({ campaignId, disposition }) => {
                    const campaign = campaignMap.get(campaignId);
                    if (!campaign) return null;
                    return (
                      <div key={campaignId} className="flex items-center gap-1">
                        <Link href={`/campaigns/${campaignId}/npcs/${npc.id}?from=vault`}>
                          <Badge
                            variant="outline"
                            className="border-white/20 bg-black/30 text-xs text-white/80 backdrop-blur-sm hover:bg-black/50 cursor-pointer"
                          >
                            {campaign.name}
                          </Badge>
                        </Link>
                        {disposition && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${dispositionColors[disposition] ?? ""}`}
                          >
                            {disposition}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
