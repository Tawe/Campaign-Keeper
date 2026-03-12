import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignLocations, getAvailableLocations } from "@/domains/locations/queries";
import { LocationCard } from "@/domains/locations/components/LocationCard";
import { AddLocationForm } from "@/domains/locations/components/AddLocationForm";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function LocationsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [locations, availableLocations] = await Promise.all([
    getCampaignLocations(campaignId),
    getAvailableLocations(user.uid, campaignId),
  ]);

  return (
    <div className="page-shell max-w-5xl space-y-10">
      <PageHeader
        title="Locations"
        eyebrow="Campaign"
        backHref={`/campaigns/${campaignId}`}
        backLabel="Dashboard"
      />
      <AddLocationForm campaignId={campaignId} availableLocations={availableLocations} />
      {locations.length === 0 ? (
        <EmptyState
          title="No locations recorded yet"
          description="Add locations manually or list them in session notes."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <LocationCard key={loc.id} location={loc} campaignId={campaignId} />
          ))}
        </div>
      )}
    </div>
  );
}
