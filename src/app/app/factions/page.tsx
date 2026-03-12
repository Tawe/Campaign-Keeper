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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {factions.map((faction) => {
            const campaigns = factionCampaigns.get(faction.id) ?? [];
            return (
              <div
                key={faction.id}
                className="relative overflow-hidden rounded-lg border border-border/50 group transition hover:shadow-md"
              >
                <Link href={`/app/factions/${faction.id}`} className="block">
                  <div className="bg-muted/30 p-4 hover:bg-muted/50 transition-colors min-h-[100px]">
                    <p className="font-serif text-lg font-medium text-foreground truncate pr-8">
                      {faction.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {faction.faction_type && (
                        <Badge variant="outline" className="text-xs">
                          {faction.faction_type}
                        </Badge>
                      )}
                      {faction.alignment && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          {faction.alignment}
                        </Badge>
                      )}
                    </div>
                    {campaigns.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {campaigns.map(({ campaignId, status, influence }) => {
                          const campaign = campaignMap.get(campaignId);
                          if (!campaign) return null;
                          return (
                            <span key={campaignId} className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {campaign.name}
                              </Badge>
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
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="absolute top-2 right-2">
                  <VaultDeleteButton
                    entityName={faction.name}
                    description="This will permanently delete this faction from all campaigns and the vault. This cannot be undone."
                    action={deleteFactionPermanently.bind(null, faction.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
