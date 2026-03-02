import { notFound, redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toPlayer } from "@/lib/firebase/converters";
import { PLAYERS_COL } from "@/lib/firebase/db";
import { PlayerForm } from "@/components/players/PlayerForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function EditPlayerPage({
  params,
}: {
  params: Promise<{ campaignId: string; playerId: string }>;
}) {
  const { campaignId, playerId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const doc = await adminDb().collection(PLAYERS_COL).doc(playerId).get();
  if (!doc.exists || doc.data()?.userId !== user.uid) notFound();

  const player = toPlayer(doc);
  if (player.campaign_id !== campaignId) notFound();

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
