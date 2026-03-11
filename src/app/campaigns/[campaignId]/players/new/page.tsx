import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { PlayerForm } from "@/domains/players/components/PlayerForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function NewPlayerPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="reading-shell">
      <PageHeader
        title="Add player"
        eyebrow="Roster Entry"
        backHref={`/campaigns/${campaignId}/players`}
        backLabel="Players"
      />
      <PlayerForm campaignId={campaignId} />
    </div>
  );
}
