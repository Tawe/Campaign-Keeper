import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignMaps } from "@/domains/maps/queries";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function PlayerMapsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const maps = await getCampaignMaps(campaignId, { playerVisibleOnly: true });

  return maps.length === 0 ? (
    <EmptyState
      title="No maps available yet"
      description="Your DM has not shared any player-visible maps for this campaign."
    />
  ) : (
    <div className="grid gap-4 sm:grid-cols-2">
      {maps.map((map) => (
        <Link key={map.id} href={`/player/campaigns/${campaignId}/maps/${map.id}`} className="group overflow-hidden rounded-2xl border border-border/80 bg-background/70">
          {map.image_url ? (
            <Image
              src={map.image_url}
              alt={map.name}
              width={640}
              height={320}
              unoptimized
              className="h-44 w-full object-cover transition group-hover:scale-[1.02]"
            />
          ) : null}
          <div className="px-4 py-3">
            <p className="font-medium text-foreground">{map.name}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
