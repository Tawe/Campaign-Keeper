import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaign, getCampaignCounts, getCampaignNpcIndex } from "@/domains/campaigns/queries";
import { getCampaignSessions } from "@/domains/sessions/queries";
import { getCampaignThreads } from "@/domains/threads/queries";
import { getCampaignPlayers } from "@/domains/players/queries";
import { ThreadItem } from "@/domains/threads/components/ThreadItem";
import { DeleteCampaignButton } from "@/domains/campaigns/components/DeleteCampaignButton";
import { InviteLinkButton } from "@/domains/campaigns/components/InviteLinkButton";
import { CampaignWorkspaceSidebar } from "@/domains/campaigns/components/CampaignWorkspaceSidebar";
import { Portrait } from "@/components/shared/Portrait";
import { Panel } from "@/components/ui/panel";
import { StatTile } from "@/components/ui/stat-tile";
import { SectionHeader } from "@/components/ui/section-header";
import { TimelineItem } from "@/components/ui/timeline-item";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { formatDateShort } from "@/lib/utils";

export default async function CampaignDashboardPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const campaign = await getCampaign(campaignId, user.uid);
  if (!campaign) notFound();

  const [sessions, threads, counts, players] = await Promise.all([
    getCampaignSessions(campaignId),
    getCampaignThreads(campaignId),
    getCampaignCounts(campaignId),
    getCampaignPlayers(campaignId),
  ]);

  const openThreads = threads.filter((t) => t.status === "open");
  const { playerCount, locationCount } = counts;

  const sessionIds = sessions.map((s) => s.id);
  const npcs = await getCampaignNpcIndex(campaignId, sessionIds, sessions);

  return (
    <div className="min-h-screen px-6 py-8">
      <div className="mx-auto grid w-full max-w-[1500px] gap-6 lg:grid-cols-[240px_1fr_320px]">
        <div className="pr-4">
          <CampaignWorkspaceSidebar campaignId={campaignId} />
        </div>

        <main className="space-y-10">
          <Panel className="rounded-xl p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <Link
                  href="/app/dashboard"
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  ← Campaigns
                </Link>
                <div className="space-y-1">
                  <h1 className="font-serif text-4xl tracking-[-0.02em] text-foreground">
                    {campaign.name}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {campaign.system ? `${campaign.system} Campaign` : "Campaign"}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <InviteLinkButton campaignId={campaignId} inviteToken={campaign.invite_token} />
                <DeleteCampaignButton campaignId={campaignId} campaignName={campaign.name} />
                <SecondaryButton asChild size="icon">
                  <Link href={`/campaigns/${campaignId}/search`} aria-label="Search">
                    <Search className="h-4 w-4" />
                  </Link>
                </SecondaryButton>
                <PrimaryButton asChild>
                  <Link href={`/campaigns/${campaignId}/sessions/new`}>
                    <Plus className="mr-1 h-4 w-4" /> Log Session
                  </Link>
                </PrimaryButton>
              </div>
            </div>
          </Panel>

          <section className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Sessions", value: sessions.length },
              { label: "Open Threads", value: openThreads.length },
              { label: "NPCs", value: npcs.length },
              { label: "Players", value: playerCount },
              { label: "Locations", value: locationCount },
            ].map((stat) => (
              <StatTile key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </section>

          <Panel className="rounded-xl p-6">
            <div className="mb-5">
              <SectionHeader label="Timeline" title="Sessions" />
            </div>
            {sessions.length === 0 ? (
              <div className="rounded-md bg-muted/40 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No sessions yet. Log your first session to get started.
                </p>
                <PrimaryButton asChild className="mt-4">
                  <Link href={`/campaigns/${campaignId}/sessions/new`}>Log session</Link>
                </PrimaryButton>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session, i) => (
                  <TimelineItem
                    key={session.id}
                    href={`/campaigns/${campaignId}/sessions/${session.id}`}
                    index={sessions.length - i}
                    title={session.title || "Untitled session"}
                    date={formatDateShort(session.date)}
                    tags={session.tags}
                  />
                ))}
              </div>
            )}
          </Panel>
        </main>

        <aside className="space-y-10">
          <Panel className="rounded-xl p-4">
            <div className="mb-4">
              <SectionHeader label="Context" title="Open Threads" />
            </div>
            {openThreads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open threads.</p>
            ) : (
              <div className="space-y-1">
                {openThreads.map((thread) => (
                  <div key={thread.id} className="rounded-md hover:bg-muted/50 transition-colors">
                    <ThreadItem thread={thread} campaignId={campaignId} />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="rounded-xl p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-serif text-lg text-foreground">Players</h3>
              <Link
                href={`/campaigns/${campaignId}/players`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Manage
              </Link>
            </div>
            {players.length === 0 ? (
              <p className="text-sm text-muted-foreground">No players yet. Share the invite link to get started.</p>
            ) : (
              <div className="space-y-3">
                {players.map((player) => (
                  <Link
                    key={player.id}
                    href={`/campaigns/${campaignId}/players/${player.id}`}
                    className="block rounded-md border border-border/50 bg-muted/30 px-3 py-2 transition hover:border-primary/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{player.name}</span>
                      {player.player_user_id && (
                        <span className="shrink-0 text-xs text-muted-foreground">joined</span>
                      )}
                    </div>
                    {player.characters.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {player.characters.map((c) => (
                          <p key={c.name} className="text-xs text-muted-foreground truncate">
                            {c.name}
                            {(c.class || c.level) && (
                              <span className="ml-1 opacity-70">
                                — {[c.class, c.level ? `Lvl ${c.level}` : null].filter(Boolean).join(" ")}
                              </span>
                            )}
                          </p>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="rounded-xl p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-serif text-lg text-foreground">NPCs</h3>
              <Link
                href={`/campaigns/${campaignId}/npcs`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
              </Link>
            </div>
            {npcs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No NPCs recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {npcs.slice(0, 6).map((npc) => (
                  <Link
                    key={npc.id}
                    href={`/campaigns/${campaignId}/npcs/${npc.id}`}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/50 bg-muted/30 px-3 py-2 transition hover:border-primary/40"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Portrait src={npc.portrait_url} alt={npc.name} className="h-8 w-8" />
                      <p className="truncate text-sm text-foreground">{npc.name}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDateShort(npc.last_mentioned)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          <Panel className="rounded-xl p-4">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-serif text-lg text-foreground">Locations</h3>
              <Link
                href={`/campaigns/${campaignId}/locations`}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Open
              </Link>
            </div>
            {locationCount === 0 ? (
              <p className="text-sm text-muted-foreground">No locations recorded yet.</p>
            ) : (
              <p className="text-sm text-foreground/80">
                {locationCount} location{locationCount === 1 ? "" : "s"} tracked for this campaign.
              </p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
