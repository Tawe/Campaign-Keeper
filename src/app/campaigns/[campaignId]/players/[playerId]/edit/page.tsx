import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaign } from "@/domains/campaigns/queries";
import { getPlayer } from "@/domains/players/queries";
import { PlayerForm } from "@/domains/players/components/PlayerForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ campaignId: string; playerId: string }>;
}) {
  const { campaignId, playerId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [campaign, player] = await Promise.all([
    getCampaign(campaignId, user.uid),
    getPlayer(playerId),
  ]);
  if (!campaign || !player || player.campaign_id !== campaignId) notFound();

  return (
    <div className="reading-shell">
      <PageHeader
        title="Edit player"
        eyebrow="Roster Revision"
        backHref={`/campaigns/${campaignId}/players`}
        backLabel="Players"
      />
      <PlayerForm
        campaignId={campaignId}
        playerId={playerId}
        initialValues={{
          name: player.name,
          portraitUrl: player.portrait_url,
          characters: player.characters.map((character) => ({
            name: character.name,
            class: character.class,
            race: character.race,
            level: character.level,
            statsLink: character.stats_link,
          })),
        }}
      />
    </div>
  );
}
