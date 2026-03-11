import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignFactions } from "@/domains/factions/queries";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";

export default async function PlayerFactionsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const factions = await getCampaignFactions(campaignId);

  if (factions.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No factions in this campaign yet.</p>;
  }

  return (
    <Panel className="divide-y divide-border overflow-hidden">
      {factions.map((faction) => (
        <div key={faction.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{faction.name}</span>
              {faction.faction_type && (
                <Badge variant="secondary" className="font-normal normal-case text-xs">
                  {faction.faction_type}
                </Badge>
              )}
              {faction.alignment && (
                <Badge variant="outline" className="font-normal normal-case text-xs">
                  {faction.alignment}
                </Badge>
              )}
            </div>
            {faction.leader_names.length > 0 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Leaders: {faction.leader_names.join(", ")}
              </p>
            )}
            {faction.public_info && (
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{faction.public_info}</p>
            )}
          </div>
          {faction.influence && (
            <span className="shrink-0 text-xs text-muted-foreground">{faction.influence}</span>
          )}
        </div>
      ))}
    </Panel>
  );
}
