import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toNpc } from "@/lib/firebase/converters";
import { NPCS_COL, PLAYERS_COL, LOCATIONS_COL } from "@/lib/firebase/db";
import { SessionForm } from "@/components/sessions/SessionForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function NewSessionPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const db = adminDb();
  const [npcsSnap, playersSnap, locationsSnap] = await Promise.all([
    db.collection(NPCS_COL).where("campaignId", "==", campaignId).orderBy("name").get(),
    db.collection(PLAYERS_COL).where("campaignId", "==", campaignId).get(),
    db.collection(LOCATIONS_COL).where("campaignId", "==", campaignId).orderBy("name").get(),
  ]);

  const existingNpcs = npcsSnap.docs.map(toNpc);
  const existingPlayers = playersSnap.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name as string,
    characters: ((doc.data().characters ?? []) as { name: string }[]).map((c) => ({ name: c.name })),
  }));
  const existingLocationNames = locationsSnap.docs.map((doc) => doc.data().name as string);

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
      />
    </div>
  );
}
