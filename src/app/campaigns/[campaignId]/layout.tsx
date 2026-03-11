import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaign } from "@/domains/campaigns/queries";
import { CampaignWorkspaceSidebar } from "@/domains/campaigns/components/CampaignWorkspaceSidebar";

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const campaign = await getCampaign(campaignId, user.uid);
  if (!campaign) notFound();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[220px_1fr]">
      <div className="hidden lg:block border-r border-border px-4 py-8">
        <CampaignWorkspaceSidebar campaignId={campaignId} />
      </div>
      <div>{children}</div>
    </div>
  );
}
