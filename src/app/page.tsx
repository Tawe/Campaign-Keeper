import Link from "next/link";
import Image from "next/image";
import { BookOpenText, MapPinned, ScrollText, Shield, Users } from "lucide-react";
import { Card } from "@/components/ui/ds-card";
import { Panel } from "@/components/ui/panel";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { SectionHeader } from "@/components/ui/section-header";
import { MarketingNav } from "@/components/site/MarketingNav";

export default function LandingPage() {
  return (
    <div className="dark ds-bg-main min-h-screen ds-text-primary">
      <main>
        <section className="relative h-[70vh] min-h-[36rem] overflow-hidden">
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
                Track sessions, NPCs, locations, and plot threads in one place built for Dungeon Masters.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <PrimaryButton asChild size="lg">
                  <Link href="/app/dashboard">Launch the App</Link>
                </PrimaryButton>
                <SecondaryButton asChild size="lg">
                  <Link href="/features">See Features</Link>
                </SecondaryButton>
              </div>
              <p className="text-sm ds-text-secondary">Built by a Dungeon Master for Dungeon Masters.</p>
            </div>
          </div>
        </section>

        <section className="ds-bg-main px-4 py-20 sm:px-6 lg:px-8">
          <h2 className="mx-auto max-w-5xl text-center font-serif text-3xl tracking-[-0.02em] ds-text-primary sm:text-4xl">
            Everything in one place between sessions.
          </h2>
          <div className="mx-auto mt-10 w-full max-w-5xl overflow-hidden rounded-xl ds-bg-panel shadow-2xl">
            <Image
              src="/window.svg"
              alt="Campaign Tracker product preview placeholder"
              width={1600}
              height={900}
              className="h-auto w-full bg-[color:color-mix(in_srgb,var(--ds-bg-elevated)_80%,transparent)] p-24"
            />
          </div>
        </section>

        <section className="mx-auto w-full max-w-4xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <h2 className="font-serif text-4xl tracking-[-0.02em] ds-text-primary">
            Your campaign notes are scattered.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 ds-text-secondary">
            Most Dungeon Masters track campaigns across notebooks, Google Docs, and chat logs.
          </p>
          <p className="mx-auto mt-2 max-w-2xl text-base leading-7 ds-text-secondary">
            Campaign Tracker keeps sessions, NPCs, locations, and plot threads organized between games.
          </p>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <SectionHeader
            label="Features"
            title="Everything your table needs"
          />
          <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: ScrollText,
                title: "Session Tracking",
                description: "Log sessions with recap links and table feedback.",
              },
              {
                icon: Users,
                title: "NPC Database",
                description: "Track important NPCs with portraits and notes.",
              },
              {
                icon: BookOpenText,
                title: "Player Recaps",
                description: "Generate recap pages players can read after the session.",
              },
              {
                icon: Shield,
                title: "DM Private Notes",
                description: "Keep secrets separate from player-facing summaries.",
              },
              {
                icon: MapPinned,
                title: "Portrait Uploads",
                description: "Upload NPC and player portraits for fast table recall.",
              },
            ].map(({ icon: Icon, title, description }) => (
              <Card
                key={title}
                className="p-6 transition-colors hover:bg-zinc-900/50"
              >
                <div className="space-y-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-[color:color-mix(in_srgb,var(--ds-bg-main)_72%,transparent)] ds-accent">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-medium ds-text-primary">{title}</h3>
                  <p className="text-sm ds-text-secondary">{description}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-32 sm:px-6 lg:px-8">
          <Panel className="rounded-2xl px-6 py-12 text-center shadow-xl sm:px-10">
            <h2 className="font-serif text-4xl tracking-[-0.02em] ds-text-primary">Your campaign deserves better notes.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 ds-text-secondary">
              Start tracking sessions, NPCs, and story threads in one place.
            </p>
            <div className="mt-7">
              <PrimaryButton asChild size="lg">
                <Link href="/app/dashboard">Launch Campaign Tracker</Link>
              </PrimaryButton>
            </div>
          </Panel>
        </section>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 text-center sm:px-6 lg:px-8">
        <p className="text-sm ds-text-secondary">
          Campaign Tracker is an indie tool built for tabletop RPG Dungeon Masters.
        </p>
        <p className="mt-2 text-xs text-[color:color-mix(in_srgb,var(--ds-text-secondary)_72%,transparent)]">© Campaign Tracker</p>
      </footer>
    </div>
  );
}
