import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignPublic } from "@/domains/campaigns/queries";
import { adminDb } from "@/lib/firebase/admin";
import { PLAYERS_COL } from "@/lib/firebase/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { Panel } from "@/components/ui/panel";

export default async function PlayerCampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const campaign = await getCampaignPublic(campaignId);
  if (!campaign) notFound();
  if (!campaign.player_user_ids.includes(user.uid)) notFound();

  // Get this player's record
  const playerSnap = await adminDb()
    .collection(PLAYERS_COL)
    .where("campaignId", "==", campaignId)
    .where("playerUserId", "==", user.uid)
    .limit(1)
    .get();

  const playerName = playerSnap.empty
    ? null
    : (playerSnap.docs[0].data().name as string);

  return (
    <div className="page-shell max-w-2xl space-y-8">
      <PageHeader
        title={campaign.name}
        eyebrow="Campaign"
        backHref="/app/dashboard"
        backLabel="Dashboard"
      />

      <Panel className="space-y-4 px-6 py-6">
        {campaign.system && (
          <p className="text-sm text-muted-foreground">
            System: <span className="text-foreground">{campaign.system}</span>
          </p>
        )}
        {playerName && (
          <p className="text-sm text-muted-foreground">
            Playing as: <span className="text-foreground font-medium">{playerName}</span>
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          You are a player in this campaign.
        </p>
      </Panel>
    </div>
  );
}
