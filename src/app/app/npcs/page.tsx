import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getGlobalNpcsWithCampaigns } from "@/domains/npcs/queries";
import { deleteNpcPermanently } from "@/domains/npcs/actions";
import { Portrait } from "@/components/shared/Portrait";
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
        <div className="space-y-2">
          {npcs.map((npc) => {
            const campaigns = npcCampaigns.get(npc.id) ?? [];
            return (
              <div
                key={npc.id}
                className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
              >
                <Link
                  href={`/app/npcs/${npc.id}`}
                  className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80"
                >
                  <Portrait src={npc.portrait_url} alt={npc.name} className="h-10 w-10 shrink-0" />
                  <p className="font-medium text-foreground truncate">{npc.name}</p>
                </Link>

                <div className="flex flex-col gap-1.5 items-end shrink-0">
                  <VaultDeleteButton
                    entityName={npc.name}
                    description="This will permanently delete this NPC from all campaigns and the vault. This cannot be undone."
                    action={deleteNpcPermanently.bind(null, npc.id)}
                  />
                  {campaigns.map(({ campaignId, status, disposition }) => {
                    const campaign = campaignMap.get(campaignId);
                    if (!campaign) return null;
                    return (
                      <div key={campaignId} className="flex items-center gap-1.5">
                        <Link href={`/campaigns/${campaignId}/npcs/${npc.id}?from=vault`}>
                          <Badge variant="outline" className="text-xs hover:bg-muted cursor-pointer">
                            {campaign.name}
                          </Badge>
                        </Link>
                        {status && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {status}
                          </Badge>
                        )}
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
