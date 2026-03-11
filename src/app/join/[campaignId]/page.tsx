import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignPublic } from "@/domains/campaigns/queries";
import { joinCampaign } from "@/domains/campaigns/actions";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { PrimaryButton } from "@/components/ui/primary-button";
import { JoinActions } from "./JoinActions";

export default async function JoinCampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { campaignId } = await params;
  const { token } = await searchParams;

  if (!token) notFound();

  const campaign = await getCampaignPublic(campaignId);
  if (!campaign) notFound();
  if (campaign.invite_token !== token) notFound();

  const user = await getSessionUser();

  async function handleJoin() {
    "use server";
    await joinCampaign(campaignId, token!);
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Panel className="w-full max-w-sm space-y-6 px-8 py-10">
        <SectionHeader
          label="Campaign Invite"
          title={campaign.name}
        />
        <p className="text-sm text-zinc-400">
          {campaign.system
            ? `You've been invited to join a ${campaign.system} campaign.`
            : "You've been invited to join a campaign."}
        </p>

        {user ? (
          <form action={handleJoin}>
            <PrimaryButton type="submit" className="w-full">
              Join campaign
            </PrimaryButton>
          </form>
        ) : (
          <JoinActions campaignId={campaignId} token={token} />
        )}
      </Panel>
    </div>
  );
}
