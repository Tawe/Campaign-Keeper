import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaign } from "@/domains/campaigns/queries";
import { getSessionWithDetails } from "@/domains/sessions/queries";
import { getCampaignNpcs } from "@/domains/npcs/queries";
import { getCampaignPlayers } from "@/domains/players/queries";
import { getCampaignLocations } from "@/domains/locations/queries";
import { getCampaignCalendar } from "@/domains/calendars/queries";
import { SessionForm } from "@/domains/sessions/components/SessionForm";
import { PageHeader } from "@/components/shared/PageHeader";
import type { SessionFormInitialValues } from "@/domains/sessions/components/SessionForm";
import type { NpcDisposition, Visibility } from "@/types";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ campaignId: string; sessionId: string }>;
}) {
  const { campaignId, sessionId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const campaign = await getCampaign(campaignId, user.uid);
  if (!campaign) notFound();

  const [data, existingNpcs, players, locations, calendar] = await Promise.all([
    getSessionWithDetails(sessionId, campaignId),
    getCampaignNpcs(campaignId),
    getCampaignPlayers(campaignId),
    getCampaignLocations(campaignId),
    getCampaignCalendar(campaignId),
  ]);

  if (!data) notFound();

  const { session, threads, mentions } = data;

  const existingPlayers = players.map((p) => ({
    id: p.id,
    name: p.name,
    characters: p.characters.map((c) => ({ name: c.name })),
  }));
  const existingLocationNames = locations.map((l) => l.name);

  const r = session.dm_reflection;
  const initialValues: SessionFormInitialValues = {
    date: session.date,
    inGameDate: session.in_game_date ?? null,
    title: session.title ?? "",
    startingLocation: session.starting_location ?? "",
    timePassed: session.time_passed ?? "",
    characters: session.characters.length > 0
      ? session.characters.map((c) => ({ name: c.name, statusAtEnd: c.status_at_end }))
      : [{ name: "", statusAtEnd: "" }],
    npcs: (() => {
      const statusMap = new Map<string, string>();
      session.npc_statuses.forEach((s) => statusMap.set(s.name.toLowerCase(), s.status_at_end));

      const mentionRows = mentions.map((m) => ({
        name: m.npc.name,
        disposition: (m.npc.disposition ?? "") as NpcDisposition | "",
        visibility: m.visibility as Visibility,
        mentionNote: m.note ?? "",
        statusAtEnd: statusMap.get(m.npc.name.toLowerCase()) ?? "",
      }));

      const mentionNames = new Set(mentionRows.map((r) => r.name.toLowerCase()));
      const extraRows = session.npc_statuses
        .filter((s) => !mentionNames.has(s.name.toLowerCase()))
        .map((s) => ({
          name: s.name,
          disposition: "" as NpcDisposition | "",
          visibility: "public" as Visibility,
          mentionNote: "",
          statusAtEnd: s.status_at_end,
        }));

      const rows = [...mentionRows, ...extraRows];
      return rows.length > 0
        ? rows
        : [{ name: "", disposition: "" as NpcDisposition | "", visibility: "public" as Visibility, mentionNote: "", statusAtEnd: "" }];
    })(),
    locationsVisited: session.locations_visited ?? [],
    loot: session.loot,
    highlights: session.public_highlights.length > 0 ? session.public_highlights : ["", "", ""],
    privateNotes: session.private_notes,
    tags: session.tags,
    threads: threads.map((t) => ({ text: t.text, visibility: t.visibility as Visibility })),
    dmReflection: {
      plotAdvancement: r?.plot_advancement ?? null,
      keyEvents: r?.key_events.length ? r.key_events : [""],
      mostEngaged: r?.most_engaged.length ? r.most_engaged : [""],
      leastEngaged: r?.least_engaged.length ? r.least_engaged : [""],
      memorableMoments: r?.memorable_moments.length ? r.memorable_moments : [""],
      combatDifficulty: r?.combat_difficulty ?? null,
      combatBalanceIssues: r?.combat_balance_issues ?? "",
      pacing: r?.pacing ?? "",
      whereSlowedDown: r?.where_slowed_down ?? "",
      nextSessionPrep: r?.next_session_prep ?? "",
      personalReflection: r?.personal_reflection ?? "",
    },
  };

  return (
    <div className="reading-shell">
      <PageHeader
        title="Edit session"
        eyebrow="Revision"
        backHref={`/campaigns/${campaignId}/sessions/${sessionId}`}
        backLabel="Session"
      />
      <SessionForm
        campaignId={campaignId}
        existingNpcs={existingNpcs}
        existingPlayers={existingPlayers}
        existingLocationNames={existingLocationNames}
        sessionId={sessionId}
        initialValues={initialValues}
        calendar={calendar}
      />
    </div>
  );
}
