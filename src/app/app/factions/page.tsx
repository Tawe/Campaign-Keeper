import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getGlobalFactionsWithCampaigns } from "@/domains/factions/queries";
import { deleteFactionPermanently } from "@/domains/factions/actions";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { VaultDeleteButton } from "@/components/shared/VaultDeleteButton";
import { Badge } from "@/components/ui/badge";

export default async function GlobalFactionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { factions, factionCampaigns, campaignMap } = await getGlobalFactionsWithCampaigns(user.uid);

  return (
    <div className="page-shell max-w-5xl space-y-8">
      <PageHeader
        title="Factions"
        eyebrow="Vault"
        backHref="/app/dashboard"
        backLabel="Dashboard"
      />

      {factions.length === 0 ? (
        <EmptyState
          title="No factions yet"
          description="Factions appear here once they have been added to a campaign."
        />
      ) : (
        <div className="space-y-2">
          {factions.map((faction) => {
            const campaigns = factionCampaigns.get(faction.id) ?? [];
            const firstCampaignId = campaigns[0]?.campaignId;
            return (
              <div
                key={faction.id}
                className="flex items-center gap-4 rounded-lg border border-border/50 bg-muted/30 px-4 py-3"
              >
                {firstCampaignId ? (
                  <Link
                    href={`/campaigns/${firstCampaignId}/factions/${faction.id}?from=vault`}
                    className="min-w-0 flex-1 hover:opacity-80"
                  >
                    <p className="font-medium text-foreground truncate">{faction.name}</p>
                    {faction.faction_type && (
                      <p className="text-xs text-muted-foreground">{faction.faction_type}</p>
                    )}
                  </Link>
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{faction.name}</p>
                    {faction.faction_type && (
                      <p className="text-xs text-muted-foreground">{faction.faction_type}</p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1.5 items-end shrink-0">
                  <VaultDeleteButton
                    entityName={faction.name}
                    description="This will permanently delete this faction from all campaigns and the vault. This cannot be undone."
                    action={deleteFactionPermanently.bind(null, faction.id)}
                  />
                  {campaigns.map(({ campaignId, status, influence }) => {
                    const campaign = campaignMap.get(campaignId);
                    if (!campaign) return null;
                    return (
                      <div key={campaignId} className="flex items-center gap-1.5">
                        <Link href={`/campaigns/${campaignId}/factions/${faction.id}?from=vault`}>
                          <Badge variant="outline" className="text-xs hover:bg-muted cursor-pointer">
                            {campaign.name}
                          </Badge>
                        </Link>
                        {status && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {status}
                          </Badge>
                        )}
                        {influence && (
                          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                            {influence}
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
