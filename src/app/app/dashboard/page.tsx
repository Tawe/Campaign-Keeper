import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Users, MapPin, Shield, Scroll } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import { getUserCampaigns, getLatestSessionDates, getNextScheduledDates, getPlayerCounts } from "@/domains/campaigns/queries";
import { getPlayerMemberships } from "@/domains/players/queries";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card } from "@/components/ui/ds-card";
import { CampaignCard } from "@/domains/campaigns/components/CampaignCard";
import { PlayerCampaignCard } from "@/domains/campaigns/components/PlayerCampaignCard";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Campaign, Player } from "@/types";

const vaultLinks = [
  {
    href: "/app/npcs",
    label: "NPCs",
    description: "All characters across your campaigns",
    Icon: Users,
  },
  {
    href: "/app/locations",
    label: "Locations",
    description: "Every place your parties have visited",
    Icon: MapPin,
  },
  {
    href: "/app/factions",
    label: "Factions",
    description: "Organisations, guilds, and groups",
    Icon: Shield,
  },
  {
    href: "/app/events",
    label: "Events",
    description: "Historical events across all campaigns",
    Icon: Scroll,
  },
];

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [campaigns, memberships] = await Promise.all([
    getUserCampaigns(user.uid),
    getPlayerMemberships(user.uid),
  ]);

  const campaignIds = campaigns.map((c) => c.id);
  const [latestSessions, nextSessions, playerCounts] = campaignIds.length > 0
    ? await Promise.all([
        getLatestSessionDates(user.uid, campaignIds),
        getNextScheduledDates(campaignIds),
        getPlayerCounts(campaignIds),
      ])
    : [{} as Record<string, string>, {} as Record<string, string>, {} as Record<string, number>];

  // Campaigns where this user is a player (exclude campaigns they also DM)
  const dmCampaignIds = new Set(campaigns.map((c) => c.id));
  const playerCampaigns: { campaign: Campaign; players: Player[] }[] = [];

  if (memberships) {
    const playersByCampaign = new Map<string, Player[]>();
    for (const player of memberships.players) {
      const list = playersByCampaign.get(player.campaign_id) ?? [];
      list.push(player);
      playersByCampaign.set(player.campaign_id, list);
    }

    for (const [campaignId, campaign] of memberships.campaignMap) {
      if (!dmCampaignIds.has(campaignId)) {
        playerCampaigns.push({
          campaign,
          players: playersByCampaign.get(campaignId) ?? [],
        });
      }
    }
  }

  async function handleSignOut() {
    "use server";
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.delete("session");
    redirect("/login");
  }

  return (
    <div className="page-shell max-w-5xl space-y-10">
      <PageHeader
        title="Campaign Tracker"
        subtitle="A living campaign record for session notes, open threads, and the truths your table needs next week."
        action={
          <>
            <PrimaryButton asChild>
              <Link href="/campaigns/new">
                <Plus className="mr-1 h-4 w-4" /> New Campaign
              </Link>
            </PrimaryButton>
            <form action={handleSignOut}>
              <SecondaryButton size="sm" type="submit">
                Sign out
              </SecondaryButton>
            </form>
          </>
        }
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl tracking-[-0.02em] text-foreground">Your campaigns</h2>
          <span className="text-sm text-muted-foreground">DM</span>
        </div>
        {campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            description="Create your first campaign to start logging sessions."
            actionLabel="New campaign"
            actionHref="/campaigns/new"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                lastSessionDate={latestSessions[campaign.id] ?? null}
                nextSessionDate={nextSessions[campaign.id] ?? null}
                playerCount={playerCounts[campaign.id] ?? 0}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-2xl tracking-[-0.02em] text-foreground">Vault</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {vaultLinks.map(({ href, label, description, Icon }) => (
            <Link key={href} href={href}>
              <Card className="cursor-pointer p-5 h-full">
                <div className="flex items-start gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">{label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {playerCampaigns.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl tracking-[-0.02em] text-foreground">Playing in</h2>
            <span className="text-sm text-muted-foreground">Player</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {playerCampaigns.map(({ campaign, players }) => (
              <PlayerCampaignCard
                key={campaign.id}
                campaign={campaign}
                players={players}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
