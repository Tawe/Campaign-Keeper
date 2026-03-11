import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignPublic } from "@/domains/campaigns/queries";
import { PlayerCampaignNav } from "./PlayerCampaignNav";

export default async function PlayerCampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const campaign = await getCampaignPublic(campaignId);
  if (!campaign) notFound();
  if (!campaign.player_user_ids.includes(user.uid)) notFound();

  return (
    <div className="page-shell max-w-3xl space-y-6">
      <div>
        <p className="section-eyebrow mb-1">Campaign</p>
        <h1 className="text-2xl font-bold">{campaign.name}</h1>
        {campaign.system && (
          <p className="mt-0.5 text-sm text-muted-foreground">{campaign.system}</p>
        )}
      </div>
      <PlayerCampaignNav campaignId={campaignId} />
      {children}
    </div>
  );
}
