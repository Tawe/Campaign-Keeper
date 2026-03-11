import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { adminDb } from "@/lib/firebase/admin";
import { PLAYERS_COL } from "@/lib/firebase/db";
import { Panel } from "@/components/ui/panel";

export default async function PlayerCampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Get this player's record
  const playerSnap = await adminDb()
    .collection(PLAYERS_COL)
    .where("campaignId", "==", campaignId)
    .where("playerUserId", "==", user.uid)
    .limit(1)
    .get();

  const playerDoc = playerSnap.empty ? null : playerSnap.docs[0].data();
  const playerName = playerDoc?.name as string | null ?? null;
  const characters = (playerDoc?.characters ?? []) as { name: string }[];

  return (
    <Panel className="space-y-3 px-6 py-6">
      {playerName && (
        <p className="text-sm text-muted-foreground">
          Playing as: <span className="text-foreground font-medium">{playerName}</span>
        </p>
      )}
      {characters.length > 0 && (
        <div className="text-sm text-muted-foreground">
          <span>Characters: </span>
          <span className="text-foreground">{characters.map((c) => c.name).join(", ")}</span>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        Welcome to the campaign. Use the tabs above to browse sessions, NPCs, locations, factions, and the calendar.
      </p>
    </Panel>
  );
}
