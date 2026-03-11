import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignNpcs } from "@/domains/npcs/queries";
import { getCampaignPlayers } from "@/domains/players/queries";
import { getCampaignLocations } from "@/domains/locations/queries";
import { getCampaignCalendar } from "@/domains/calendars/queries";
import { SessionForm } from "@/domains/sessions/components/SessionForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function NewSessionPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [existingNpcs, players, locations, calendar] = await Promise.all([
    getCampaignNpcs(campaignId),
    getCampaignPlayers(campaignId),
    getCampaignLocations(campaignId),
    getCampaignCalendar(campaignId),
  ]);

  const existingPlayers = players.map((p) => ({
    id: p.id,
    name: p.name,
    characters: p.characters.map((c) => ({ name: c.name })),
  }));
  const existingLocationNames = locations.map((l) => l.name);

  return (
    <div className="reading-shell">
      <PageHeader
        title="Log session"
        eyebrow="New Entry"
        backHref={`/campaigns/${campaignId}`}
        backLabel="Dashboard"
      />
      <SessionForm
        campaignId={campaignId}
        existingNpcs={existingNpcs}
        existingPlayers={existingPlayers}
        existingLocationNames={existingLocationNames}
        calendar={calendar}
      />
    </div>
  );
}
