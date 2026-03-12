import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
import { Card } from "@/components/ui/ds-card";
import { Panel } from "@/components/ui/panel";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { SectionHeader } from "@/components/ui/section-header";
import { MarketingNav } from "@/components/site/MarketingNav";

export const metadata: Metadata = {
  title: "Campaign Tracker — D&D & TTRPG Campaign Management for Dungeon Masters",
  description:
    "The campaign journal built for Dungeon Masters. Track sessions, NPCs, locations, factions, and world events. Share recaps with your players. Run better campaigns.",
  keywords: [
    "D&D campaign tracker",
    "Dungeon Master tools",
    "TTRPG campaign manager",
    "RPG session tracker",
    "D&D NPC tracker",
    "tabletop RPG notes",
    "campaign journal",
    "DM session notes",
    "D&D 5e campaign management",
    "player recap generator",
    "session recap tool",
    "RPG world building tool",
    "Dungeon Master app",
    "TTRPG session log",
  ],
  openGraph: {
    title: "Campaign Tracker — D&D & TTRPG Campaign Management",
    description:
      "The campaign journal built for Dungeon Masters. Track sessions, NPCs, locations, factions, and world events. Share recaps with players.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Campaign Tracker — RPG Campaign Management for Dungeon Masters",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Campaign Tracker — TTRPG Campaign Management",
    description:
      "Track sessions, NPCs, locations, factions, and world events. Share player recaps. Built by a DM, for DMs.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "Campaign Tracker",
      applicationCategory: "GameApplication",
      operatingSystem: "Web",
      description:
        "A campaign management app for tabletop RPG Dungeon Masters. Track sessions, NPCs, locations, factions, events, and share player recaps.",
      url: "https://campaign-keeper.netlify.app",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      featureList: [
        "Session tracking with highlights and DM notes",
        "NPC database with portraits and faction membership",
        "Location atlas with images and parent-child hierarchy",
        "Faction management with leaders and allegiances",
        "World events timeline linked to NPCs, locations, and sessions",
        "Player portal with read-only session recaps",
        "Session scheduling and RSVP",
        "Custom in-game calendar system",
        "Plot threads and unresolved hooks tracker",
        "DM private notes hidden from players",
        "Campaign vault — shared library across all campaigns",
        "Portrait and banner image uploads",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is Campaign Tracker?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Campaign Tracker is a web-based campaign management tool for tabletop RPG Dungeon Masters. It helps you log sessions, track NPCs and locations, manage factions, build a world events timeline, and share player-facing recaps — all in one place.",
          },
        },
        {
          "@type": "Question",
          name: "Can players use Campaign Tracker?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Players join via an invite link and get their own read-only portal. They can read session recaps, see public NPC and location information, track upcoming sessions, and leave session feedback — without seeing any of the DM's private notes.",
          },
        },
        {
          "@type": "Question",
          name: "Does Campaign Tracker work for D&D 5e?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Campaign Tracker is system-agnostic and works with any tabletop RPG — D&D 5e, Pathfinder, Call of Cthulhu, Blades in the Dark, and more. It tracks what matters for any campaign: sessions, characters, places, and story threads.",
          },
        },
        {
          "@type": "Question",
          name: "How does the NPC tracker work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Each NPC has a profile page with portrait, race, class, alignment, status, disposition, faction membership, last known location, public information visible to players, and private DM notes. NPC portraits appear in session recaps and on the campaign dashboard.",
          },
        },
        {
          "@type": "Question",
          name: "Can I track world events and lore?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. The World Events feature lets you log major historical events with in-game dates and link them to NPCs, locations, factions, and sessions. Events appear in an in-game calendar view so you can visualize your world's timeline.",
          },
        },
        {
          "@type": "Question",
          name: "How do session recaps work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "After each session you write highlights, notes, and story threads. Campaign Tracker generates a player-facing recap page with a shareable link. Players can read the recap in their portal, and a feedback form lets them submit reactions after the session.",
          },
        },
        {
          "@type": "Question",
          name: "What is the Campaign Vault?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The Vault is a global library of NPCs, locations, factions, and events that spans all your campaigns. If an NPC or faction appears in multiple campaigns, you maintain one master record and link it to each campaign where it's relevant.",
          },
        },
      ],
    },
  ],
};

const features = [
  {
    icon: ScrollText,
    title: "Session Tracking",
    description:
      "Log every session with highlights, DM prep notes, private notes, story threads, NPC mentions, and location visits. Build a complete record of your campaign as you play.",
  },
  {
    icon: Users,
    title: "NPC Database",
    description:
      "Full profiles for every character — portrait, race, class, alignment, status, disposition, faction membership, and last known location. Portraits pull through to recaps and the campaign dashboard.",
  },
  {
    icon: MapPinned,
    title: "Location Atlas",
    description:
      "Map your world with nested locations, banner images, terrain tags, and visit history. See which NPCs are currently at each location and browse sub-locations in a single click.",
  },
  {
    icon: Castle,
    title: "Faction Management",
    description:
      "Track guilds, kingdoms, cults, and factions with type, alignment, influence, leaders, allegiances, and enemies. See which NPCs belong to each faction and what events they were involved in.",
  },
  {
    icon: Globe,
    title: "World Events Timeline",
    description:
      "Log major events with in-game dates and link them to NPCs, locations, factions, and sessions. Build a searchable world history that spans centuries of lore.",
  },
  {
    icon: BookOpenText,
    title: "Player Portal & Recaps",
    description:
      "Players join via invite link and get a read-only portal — session recaps, NPC and location info, upcoming session details, and a feedback form after each game.",
  },
  {
    icon: CalendarDays,
    title: "Scheduling & RSVP",
    description:
      "Set the next session date, share a link, and let players RSVP. The campaign dashboard shows a next-session countdown so everyone stays on the same page.",
  },
  {
    icon: CalendarRange,
    title: "In-Game Calendar",
    description:
      "Build a custom calendar for your world — name the months, set week length, add a year label. Sessions and events appear in a timeline view grouped by in-world month and year.",
  },
  {
    icon: Waypoints,
    title: "Plot Threads & Hooks",
    description:
      "Track open threads from each session — unresolved mysteries, dangling hooks, and promises made. Mark them resolved as the story progresses.",
  },
  {
    icon: Shield,
    title: "DM Private Notes",
    description:
      "Every entity has a private notes field visible only to you. Sessions, NPCs, locations, factions, and events — keep your secrets separate from the player-facing summaries.",
  },
  {
    icon: Zap,
    title: "Campaign Vault",
    description:
      "A global library of NPCs, locations, factions, and events that spans all your campaigns. Reuse a recurring villain or a legendary city across multiple campaigns without duplicating data.",
  },
  {
    icon: Sword,
    title: "Portrait & Image Uploads",
    description:
      "Upload portraits for NPCs, banner images for locations, faction artwork, and event illustrations. Images appear on cards, detail pages, and player recaps.",
  },
];

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="dark ds-bg-main min-h-screen ds-text-primary">
        <main>
          {/* Hero */}
          <section
            className="relative h-[70vh] min-h-[36rem] overflow-hidden"
            aria-label="Campaign Tracker hero"
          >
            <Image
              src="/hero-splash.png"
              alt="Fantasy campaign world illustration"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-[color:color-mix(in_srgb,var(--ds-bg-main)_84%,transparent)]" />
            <MarketingNav overlay />

            <div className="relative z-10 mx-auto flex h-full w-full max-w-6xl items-center px-4 pt-16 sm:px-6 lg:px-8">
              <div className="max-w-2xl space-y-4">
                <p className="section-eyebrow">RPG Campaign Management</p>
                <h1 className="font-serif text-5xl tracking-[-0.03em] ds-text-primary sm:text-6xl lg:text-7xl">
                  Campaign Tracker
                </h1>
                <p className="text-xl leading-8 ds-text-primary">
                  Run your campaign without losing the story.
                </p>
                <p className="text-base leading-7 ds-body">
                  One place for sessions, NPCs, locations, factions, world events, and player recaps — built by a Dungeon Master, for Dungeon Masters.
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <PrimaryButton asChild size="lg">
                    <Link href="/app/dashboard">Launch the App</Link>
                  </PrimaryButton>
                  <SecondaryButton asChild size="lg">
                    <Link href="/features">See All Features</Link>
                  </SecondaryButton>
                </div>
                <p className="text-sm ds-text-secondary">System-agnostic. Works with D&amp;D 5e, Pathfinder, and any TTRPG.</p>
              </div>
            </div>
          </section>

          {/* Problem / Solution */}
          <section
            className="mx-auto w-full max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8"
            aria-label="Problem and solution"
          >
            <h2 className="font-serif text-4xl tracking-[-0.02em] ds-text-primary">
              Your campaign notes are scattered.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 ds-text-secondary">
              Most Dungeon Masters juggle notebooks, Google Docs, Discord pins, and chat logs just to remember what happened last session.
            </p>
            <p className="mx-auto mt-2 max-w-2xl text-base leading-7 ds-text-secondary">
              Campaign Tracker brings everything together — session logs, NPC profiles, location maps, faction webs, and a living world timeline — so you can prep faster and play better.
            </p>

            <div className="mt-14 grid gap-6 sm:grid-cols-3">
              {[
                {
                  step: "01",
                  heading: "Log sessions as you play",
                  body: "Capture highlights, NPC encounters, location visits, and open threads right after the game.",
                },
                {
                  step: "02",
                  heading: "Build your world between sessions",
                  body: "Flesh out NPC profiles, map locations, track factions, and record world events with in-game dates.",
                },
                {
                  step: "03",
                  heading: "Share recaps with your players",
                  body: "Players get a read-only portal with session recaps, upcoming schedule, and a feedback form.",
                },
              ].map(({ step, heading, body }) => (
                <div key={step} className="rounded-xl border border-white/10 p-6 text-left">
                  <p className="text-xs font-mono ds-text-secondary mb-3">{step}</p>
                  <h3 className="font-medium ds-text-primary mb-2">{heading}</h3>
                  <p className="text-sm ds-text-secondary leading-6">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Features grid */}
          <section
            className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8"
            aria-label="Features"
          >
            <SectionHeader
              label="Features"
              title="Everything your table needs"
            />
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <Card
                  key={title}
                  className="p-6 transition-colors hover:bg-zinc-900/50"
                >
                  <div className="space-y-3">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[color:color-mix(in_srgb,var(--ds-bg-main)_72%,transparent)] ds-accent">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-base font-medium ds-text-primary">{title}</h3>
                    <p className="text-sm ds-text-secondary leading-6">{description}</p>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-8 text-center">
              <SecondaryButton asChild>
                <Link href="/features">Full feature breakdown →</Link>
              </SecondaryButton>
            </div>
          </section>

          {/* FAQ — AEO / GEO */}
          <section
            className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 lg:px-8"
            aria-label="Frequently asked questions"
          >
            <SectionHeader label="FAQ" title="Common questions" />
            <dl className="mt-8 space-y-6">
              {[
                {
                  q: "What is Campaign Tracker?",
                  a: "Campaign Tracker is a web-based campaign journal for tabletop RPG Dungeon Masters. It helps you log sessions, track NPCs and locations, manage factions, build a world events timeline, and share player-facing recaps — all in one place.",
                },
                {
                  q: "Does it work with D&D 5e and other systems?",
                  a: "Yes. Campaign Tracker is system-agnostic. It works with D&D 5e, Pathfinder, Call of Cthulhu, Blades in the Dark, and any other tabletop RPG. It tracks what matters for any campaign: sessions, characters, places, and story threads.",
                },
                {
                  q: "Can my players access it?",
                  a: "Yes. Players join via an invite link and get a read-only portal with session recaps, upcoming schedule, public NPC and location info, and a post-session feedback form. They never see your private DM notes.",
                },
                {
                  q: "How do session recaps work?",
                  a: "After each session you write highlights, threads, and notes. Campaign Tracker generates a player-facing recap page. Players read it in their portal or via a shareable link, and can leave feedback on each session.",
                },
                {
                  q: "What is the Campaign Vault?",
                  a: "The Vault is a global library of NPCs, locations, factions, and events that spans all your campaigns. Reuse a recurring villain or a legendary city across multiple campaigns without duplicating records.",
                },
                {
                  q: "Do I need to install anything?",
                  a: "No. Campaign Tracker is a web app — open it in any browser, sign in with a magic link email, and start tracking. Nothing to install or self-host.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="rounded-xl border border-white/10 p-6">
                  <dt className="font-medium ds-text-primary mb-2">{q}</dt>
                  <dd className="text-sm ds-text-secondary leading-6">{a}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* CTA */}
          <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
            <Panel className="rounded-2xl px-6 py-12 text-center shadow-xl sm:px-10">
              <h2 className="font-serif text-4xl tracking-[-0.02em] ds-text-primary">
                Your campaign deserves better notes.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 ds-text-secondary">
                Start tracking sessions, NPCs, locations, and story threads in one place. Free to use. No install required.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <PrimaryButton asChild size="lg">
                  <Link href="/app/dashboard">Launch Campaign Tracker</Link>
                </PrimaryButton>
                <SecondaryButton asChild size="lg">
                  <Link href="/features">See All Features</Link>
                </SecondaryButton>
              </div>
            </Panel>
          </section>
        </main>

        <footer className="border-t border-white/10 px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-sm ds-text-secondary text-center sm:text-left">
              Campaign Tracker — indie campaign management for tabletop RPG Dungeon Masters. System-agnostic. Works with D&amp;D, Pathfinder, and more.
            </p>
            <nav className="flex gap-5 text-sm ds-text-secondary" aria-label="Footer navigation">
              <Link href="/features" className="hover:ds-text-primary transition-colors">Features</Link>
              <Link href="/app/dashboard" className="hover:ds-text-primary transition-colors">App</Link>
            </nav>
          </div>
          <p className="mt-4 text-center text-xs text-[color:color-mix(in_srgb,var(--ds-text-secondary)_60%,transparent)]">
            © {new Date().getFullYear()} Campaign Tracker
          </p>
        </footer>
      </div>
    </>
  );
}
