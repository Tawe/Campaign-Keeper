import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toLocation, toSession } from "@/lib/firebase/converters";
import { LOCATIONS_COL, LOCATION_VISITS_COL, SESSIONS_COL } from "@/lib/firebase/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { InlineEditor } from "@/components/shared/InlineEditor";
import { updateLocationInfo } from "@/app/actions/locations";
import { formatDateShort } from "@/lib/utils";

export default async function LocationDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; locationId: string }>;
}) {
  const { campaignId, locationId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const db = adminDb();

  const [locationDoc, visitsSnap] = await Promise.all([
    db.collection(LOCATIONS_COL).doc(locationId).get(),
    db.collection(LOCATION_VISITS_COL).where("locationId", "==", locationId).get(),
  ]);

  if (!locationDoc.exists) notFound();
  const location = toLocation(locationDoc);
  if (location.campaign_id !== campaignId) notFound();

  // Hydrate session info for each visit
  const sessionIds = [...new Set(visitsSnap.docs.map((d) => d.data().sessionId as string))];
  const sessionMap = new Map<string, { id: string; date: string; title: string | null }>();

  await Promise.all(
    sessionIds.map(async (sid) => {
      const doc = await db.collection(SESSIONS_COL).doc(sid).get();
      if (doc.exists) {
        const s = toSession(doc);
        sessionMap.set(sid, { id: s.id, date: s.date, title: s.title });
      }
    })
  );

  const sessionList = Array.from(sessionMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
      <PageHeader
        title={location.name}
        backHref={`/campaigns/${campaignId}/locations`}
        backLabel="Locations"
      />

      <div className="space-y-4">
        <InlineEditor
          label="What players know"
          value={location.public_info}
          placeholder="Add public information about this location…"
          action={updateLocationInfo.bind(null, locationId, campaignId, "publicInfo")}
        />
        <InlineEditor
          label="DM notes"
          value={location.private_notes}
          placeholder="Add private DM notes…"
          dmOnly
          action={updateLocationInfo.bind(null, locationId, campaignId, "privateNotes")}
        />

        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Sessions
          </h2>
          {sessionList.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {sessionList.map((session) => (
                <Link
                  key={session.id}
                  href={`/campaigns/${campaignId}/sessions/${session.id}`}
                  className="block border rounded-lg p-3 hover:bg-muted transition-colors text-sm font-medium"
                >
                  {session.title ?? "Untitled session"}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({formatDateShort(session.date)})
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
