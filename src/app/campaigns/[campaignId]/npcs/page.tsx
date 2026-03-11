import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignNpcsWithMentions, getAvailableNpcs } from "@/domains/npcs/queries";
import { NpcIndex } from "@/domains/npcs/components/NpcIndex";
import { AddNpcForm } from "@/domains/npcs/components/AddNpcForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function NpcsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [npcs, availableNpcs] = await Promise.all([
    getCampaignNpcsWithMentions(campaignId),
    getAvailableNpcs(user.uid, campaignId),
  ]);

  return (
    <div className="page-shell max-w-5xl space-y-10">
      <PageHeader
        title="NPCs"
        eyebrow="Cast Index"
        backHref={`/campaigns/${campaignId}`}
        backLabel="Dashboard"
      />
      <AddNpcForm campaignId={campaignId} availableNpcs={availableNpcs} />
      {npcs.length === 0 ? (
        <EmptyState
          title="No NPCs recorded yet"
          description="Add NPCs manually or mention them in session notes. Add portraits and stat links from each NPC page."
        />
      ) : (
        <NpcIndex npcs={npcs} campaignId={campaignId} />
      )}
    </div>
  );
}
