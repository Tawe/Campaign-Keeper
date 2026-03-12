import type { Metadata } from "next";
import Link from "next/link";
import { Github } from "lucide-react";
import { MarketingNav } from "@/components/site/MarketingNav";
import { SectionHeader } from "@/components/ui/section-header";
import { PrimaryButton } from "@/components/ui/primary-button";

export const metadata: Metadata = {
  title: "About",
  description:
    "Campaign Tracker is an open source campaign management tool built by a Dungeon Master who got tired of losing the story between sessions.",
  openGraph: {
    title: "About | Campaign Tracker",
    description:
      "Campaign Tracker is an open source campaign management tool built by a Dungeon Master who got tired of losing the story between sessions.",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen ds-bg-main">
      <MarketingNav />
      <main className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader label="About" title="Why this exists" />

        <div className="mt-8 space-y-5 text-base leading-7 ds-text-secondary">
          <p>
            Long campaigns are hard to remember. After a few months of weekly sessions, even the
            most attentive DM starts forgetting which NPC gave the party the quest, what the
            rogue swore vengeance against, or what that ominous name carved into the dungeon wall
            actually meant.
          </p>
          <p>
            Campaign Tracker was built to solve that problem. It started as a personal tool for
            running a single campaign and grew into something that handles the full surface area of
            DM prep: sessions, NPCs, locations, factions, world events, a custom calendar, and a
            player portal so your players are never lost between sessions either.
          </p>
          <p>
            Everything is designed around one goal: when you sit down to prep the next session,
            you should be able to find anything in under a minute.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          <h2 className="text-sm font-medium ds-text-primary uppercase tracking-wider">
            Open source
          </h2>
          <p className="text-base leading-7 ds-text-secondary">
            Campaign Tracker is fully open source. If you want to self-host it, contribute a
            feature, or just poke around the code, the repository is on GitHub.
          </p>
          <a
            href="https://github.com/Tawe/Campaign-Keeper"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm ds-text-secondary hover:ds-text-primary transition-colors"
          >
            <Github className="h-4 w-4" />
            github.com/Tawe/Campaign-Keeper
          </a>
        </div>

        <div className="mt-12">
          <PrimaryButton asChild>
            <Link href="/app/dashboard">Launch the App</Link>
          </PrimaryButton>
        </div>
      </main>
    </div>
  );
}
