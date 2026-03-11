import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { CampaignForm } from "@/domains/campaigns/components/CampaignForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function NewCampaignPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <PageHeader title="New campaign" backHref="/app/dashboard" backLabel="Dashboard" />
      <CampaignForm />
    </div>
  );
}
