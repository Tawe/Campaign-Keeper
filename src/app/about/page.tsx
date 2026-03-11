import type { Metadata } from "next";
import { MarketingNav } from "@/components/site/MarketingNav";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata: Metadata = {
  title: "About",
  description: "Campaign Tracker is a practical memory system for long tabletop RPG campaigns, built by a Dungeon Master for Dungeon Masters.",
  openGraph: {
    title: "About | Campaign Tracker",
    description: "Campaign Tracker is a practical memory system for long tabletop RPG campaigns, built by a Dungeon Master for Dungeon Masters.",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen ds-bg-main">
      <MarketingNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader label="About" title="A practical memory system for long campaigns" />
        <p className="mt-5 max-w-3xl leading-7 text-zinc-400">
          Campaign Tracker helps Dungeon Masters preserve continuity across weeks of play.
          It combines session notes, recaps, NPCs, players, locations, and open threads
          into one system so prep time stays focused.
        </p>
      </main>
    </div>
  );
}
