import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaign } from "@/domains/campaigns/queries";
import { CreateScheduledSessionForm } from "@/domains/schedule/components/CreateScheduledSessionForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function NewScheduledSessionPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const campaign = await getCampaign(campaignId, user.uid);
  if (!campaign) notFound();

  return (
    <div className="reading-shell">
      <PageHeader
        title="Schedule a session"
        eyebrow={campaign.name}
        backHref={`/campaigns/${campaignId}/schedule`}
        backLabel="Schedule"
      />
      <CreateScheduledSessionForm campaignId={campaignId} />
    </div>
  );
}
