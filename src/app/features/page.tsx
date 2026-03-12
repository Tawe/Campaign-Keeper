import type { Metadata } from "next";
import {
  BookOpenText,
  CalendarDays,
  CalendarRange,
  Castle,
  Globe,
  MapPinned,
  ScrollText,
  Shield,
  Sword,
  Users,
  Waypoints,
  Zap,
} from "lucide-react";
import { MarketingNav } from "@/components/site/MarketingNav";
import { SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/ds-card";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Every tool a Dungeon Master needs to run a long campaign: session logs, NPC database with portraits, location atlas, faction management, world events timeline, player recaps, scheduling, in-game calendar, and more.",
  openGraph: {
    title: "Features | Campaign Tracker",
    description:
      "Every tool a Dungeon Master needs: session tracking, NPC profiles, location atlas, factions, world events, player recaps, scheduling, and in-game calendar.",
  },
  twitter: {
    card: "summary",
    title: "Features | Campaign Tracker",
    description:
      "Session tracking, NPC database, location atlas, factions, world events, player recaps, scheduling, in-game calendar, and more.",
  },
};

const features = [
  {
    icon: ScrollText,
    title: "Session Tracking",
    tagline: "A complete record of every game",
    bullets: [
      "Log session title, date, and in-game date",
      "Write public highlights for the player recap",
      "Add private DM notes hidden from players",
      "Track open plot threads and mark them resolved",
      "Session NPCs and locations auto-link from mention tracking",
      "Shareable recap link for every session",
    ],
  },
  {
    icon: Users,
    title: "NPC Database",
    tagline: "Every character at your fingertips",
    bullets: [
      "Upload a portrait, shown on cards, recaps, and the dashboard",
      "Race, class, alignment, status, and disposition fields",
      "Faction membership with live roster on faction pages",
      "Last known location tracked automatically via session visits",
      "Public info visible to players; private notes visible only to the DM",
      "Global vault record that links across multiple campaigns",
    ],
  },
  {
    icon: MapPinned,
    title: "Location Atlas",
    tagline: "Map your world, room by room",
    bullets: [
      "Upload a banner image for every location",
      "Terrain tags (forest, dungeon, city, sea…)",
      "Nested hierarchy: regions contain cities contain districts",
      "See which NPCs are currently at this location",
      "Visit history showing which sessions took place here",
      "Public info and private DM notes per campaign",
    ],
  },
  {
    icon: Castle,
    title: "Faction Management",
    tagline: "Track power, politics, and allegiances",
    bullets: [
      "Type, alignment, influence level, and status fields",
      "Leader names, allegiances, and enemies",
      "Home base, founding date, and member count",
      "Upload faction artwork as a banner image",
      "Live members roster: any NPC with this faction assigned appears here",
      "Linked events show what this faction was involved in",
    ],
  },
  {
    icon: Globe,
    title: "World Events Timeline",
    tagline: "A living history for your world",
    bullets: [
      "Log major events with in-game start and end dates",
      "Link events to NPCs, locations, factions, and sessions",
      "Event type and description fields",
      "Events appear in the in-game calendar view",
      "Each entity's detail page shows its linked events",
      "Upload artwork or illustration for each event",
    ],
  },
  {
    icon: BookOpenText,
    title: "Player Portal & Recaps",
    tagline: "Give your players a companion app",
    bullets: [
      "Players join via invite link, no DM account needed",
      "Read-only session recaps with highlights and story threads",
      "Upcoming session callout with date and countdown",
      "Most recent session card on campaign dashboard",
      "Post-session feedback form via shareable link",
      "Players never see DM private notes",
    ],
  },
  {
    icon: CalendarDays,
    title: "Scheduling & RSVP",
    tagline: "Keep the table on the same page",
    bullets: [
      "Set a next session date and time from the campaign dashboard",
      "Countdown display for DM and players",
      "RSVP links for players to confirm attendance",
      "Session schedule overview for the full campaign",
      "Next session callout visible in the player portal",
    ],
  },
  {
    icon: CalendarRange,
    title: "In-Game Calendar",
    tagline: "Your world runs on its own clock",
    bullets: [
      "Build a fully custom calendar: name months, set week length",
      "Add a year label and era name",
      "Sessions grouped by in-world month and year",
      "World events appear alongside sessions in calendar view",
      "Import a calendar definition from another campaign",
      "In-game date shown on session recaps and campaign header",
    ],
  },
  {
    icon: Waypoints,
    title: "Plot Threads & Hooks",
    tagline: "Never lose a dangling story beat",
    bullets: [
      "Add open threads to any session",
      "Mark threads as resolved as the story progresses",
      "Threads appear on the player-facing session recap",
      "See unresolved threads from previous sessions at a glance",
    ],
  },
  {
    icon: Shield,
    title: "DM Private Notes",
    tagline: "Keep your secrets safe",
    bullets: [
      "Every entity has a private notes field: sessions, NPCs, locations, factions, events",
      "Private notes are never included in player recaps",
      "Public info and DM notes rendered side-by-side in the DM view",
      "Clearly labelled so you never accidentally share secrets",
    ],
  },
  {
    icon: Zap,
    title: "Campaign Vault",
    tagline: "A shared library across all your campaigns",
    bullets: [
      "Global NPC, location, faction, and events library",
      "Link an NPC or faction to any campaign without duplicating data",
      "Per-campaign fields (status, disposition, notes) stay campaign-scoped",
      "Vault overview shows which campaigns each entity appears in",
      "Delete globally or just unlink from one campaign",
    ],
  },
  {
    icon: Sword,
    title: "Portrait & Image Uploads",
    tagline: "Faces and places for every entry",
    bullets: [
      "Upload NPC portraits, shown on cards, dashboards, and recaps",
      "Location and faction banner images",
      "Event artwork and illustrations",
      "Images stored securely and served from CDN",
      "Replace or remove images at any time",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen ds-bg-main">
      <MarketingNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader
          label="Features"
          title="Built for campaign continuity"
        />
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 ds-text-secondary text-center">
          Everything a Dungeon Master needs to run a long campaign without losing the story.
          System-agnostic. Works with D&amp;D 5e, Pathfinder, and any tabletop RPG.
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {features.map(({ icon: Icon, title, tagline, bullets }) => (
            <Card key={title} className="p-6">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[color:color-mix(in_srgb,var(--ds-bg-main)_72%,transparent)] ds-accent">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-medium ds-text-primary">{title}</h2>
                  <p className="text-xs ds-text-secondary mt-0.5 mb-3">{tagline}</p>
                  <ul className="space-y-1.5">
                    {bullets.map((b) => (
                      <li key={b} className="text-sm ds-text-secondary leading-5 flex gap-2">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
