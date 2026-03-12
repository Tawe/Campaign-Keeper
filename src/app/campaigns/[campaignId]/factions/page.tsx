import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignFactions, getAvailableFactions } from "@/domains/factions/queries";
import { FactionCard } from "@/domains/factions/components/FactionCard";
import { AddFactionForm } from "@/domains/factions/components/AddFactionForm";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function FactionsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [factions, availableFactions] = await Promise.all([
    getCampaignFactions(campaignId),
    getAvailableFactions(user.uid, campaignId),
  ]);

  return (
    <div className="page-shell max-w-5xl space-y-10">
      <PageHeader
        title="Factions"
        eyebrow="Campaign"
        backHref={`/campaigns/${campaignId}`}
        backLabel="Dashboard"
      />

      <AddFactionForm campaignId={campaignId} availableFactions={availableFactions} />

      {factions.length === 0 ? (
        <EmptyState
          title="No factions yet"
          description="Add factions to track organisations, guilds, and groups in your campaign."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {factions.map((faction) => (
            <FactionCard key={faction.id} faction={faction} campaignId={campaignId} />
          ))}
        </div>
      )}
    </div>
  );
}
