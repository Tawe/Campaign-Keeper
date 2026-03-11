import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { PLAYERS_COL } from "@/lib/firebase/db";
import { PlayerProfileEditor } from "@/domains/players/components/PlayerProfileEditor";
import type { CharacterInput } from "@/domains/players/actions";

export default async function PlayerCampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const playerSnap = await adminDb()
    .collection(PLAYERS_COL)
    .where("campaignId", "==", campaignId)
    .where("playerUserId", "==", user.uid)
    .limit(1)
    .get();

  if (playerSnap.empty) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Player record not found. Try rejoining via the invite link.
      </p>
    );
  }

  const playerDoc = playerSnap.docs[0];
  const data = playerDoc.data();
  const playerName = (data.name as string) ?? "";
  const characters = ((data.characters ?? []) as {
    charId?: string;
    name: string;
    class: string | null;
    race: string | null;
    level: number | null;
    statsLink: string | null;
    portraitPath?: string | null;
  }[]).map<CharacterInput>((c) => ({
    charId: c.charId ?? "",
    name: c.name,
    class: c.class,
    race: c.race,
    level: c.level,
    statsLink: c.statsLink,
    portraitUrl: c.charId && c.portraitPath
      ? `/api/portraits/character/${playerDoc.id}/${c.charId}`
      : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          Update your display name and add your characters. The DM can see your characters in the campaign.
        </p>
      </div>
      <PlayerProfileEditor
        playerId={playerDoc.id}
        initialName={playerName}
        initialCharacters={characters}
      />
    </div>
  );
}
