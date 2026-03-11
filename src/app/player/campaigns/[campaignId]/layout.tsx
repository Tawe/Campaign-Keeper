import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignPublic } from "@/domains/campaigns/queries";

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

  return <>{children}</>;
}
