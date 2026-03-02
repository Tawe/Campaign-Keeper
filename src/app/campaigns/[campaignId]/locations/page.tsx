import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toLocation } from "@/lib/firebase/converters";
import { LOCATIONS_COL, LOCATION_VISITS_COL, SESSIONS_COL } from "@/lib/firebase/db";
import { LocationCard } from "@/components/locations/LocationCard";
import { PageHeader } from "@/components/shared/PageHeader";
import type { LocationWithLastVisit } from "@/types";

export default async function LocationsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const db = adminDb();

  const [locationsSnap, sessionsSnap] = await Promise.all([
    db.collection(LOCATIONS_COL).where("campaignId", "==", campaignId).orderBy("name").get(),
    db.collection(SESSIONS_COL).where("campaignId", "==", campaignId).orderBy("date", "desc").get(),
  ]);

  const sessions = sessionsSnap.docs.map((doc) => ({
    id: doc.id,
    date: doc.data().date as string,
  }));

  // Build last_visited per location from location_visits
  const locationMap = new Map<string, LocationWithLastVisit>();
  locationsSnap.docs.forEach((doc) => {
    locationMap.set(doc.id, {
      ...toLocation(doc),
      last_visited: "",
      last_session_id: "",
    });
  });

  if (locationsSnap.size > 0) {
    const locationIds = locationsSnap.docs.map((d) => d.id);
    for (let i = 0; i < locationIds.length; i += 30) {
      const chunk = locationIds.slice(i, i + 30);
      const visitsSnap = await db
        .collection(LOCATION_VISITS_COL)
        .where("locationId", "in", chunk)
        .get();

      visitsSnap.docs.forEach((doc) => {
        const d = doc.data();
        const existing = locationMap.get(d.locationId);
        if (!existing) return;
        const sessionDate = sessions.find((s) => s.id === d.sessionId)?.date ?? "";
        if (!existing.last_visited || sessionDate > existing.last_visited) {
          locationMap.set(d.locationId, {
            ...existing,
            last_visited: sessionDate,
            last_session_id: d.sessionId,
          });
        }
      });
    }
  }

  const locations = Array.from(locationMap.values()).sort(
    (a, b) => b.last_visited.localeCompare(a.last_visited)
  );

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <PageHeader
        title="Locations"
        backHref={`/campaigns/${campaignId}`}
        backLabel="Dashboard"
      />
      {locations.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No locations recorded yet. Add locations by listing them in session notes.
        </p>
      ) : (
        <div className="border rounded-lg divide-y overflow-hidden">
          {locations.map((loc) => (
            <LocationCard key={loc.id} location={loc} campaignId={campaignId} />
          ))}
        </div>
      )}
    </div>
  );
}
