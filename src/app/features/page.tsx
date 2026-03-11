import type { Metadata } from "next";
import { MarketingNav } from "@/components/site/MarketingNav";
import { SectionHeader } from "@/components/ui/section-header";
import { Card } from "@/components/ui/ds-card";

export const metadata: Metadata = {
  title: "Features",
  description: "Everything a Dungeon Master needs to run a long campaign — session tracking, NPC database, player recaps, plot threads, and more.",
  openGraph: {
    title: "Features | Campaign Tracker",
    description: "Everything a Dungeon Master needs to run a long campaign — session tracking, NPC database, player recaps, plot threads, and more.",
  },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen ds-bg-main">
      <MarketingNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader label="Features" title="Built for campaign continuity" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            "Session tracking",
            "NPC database",
            "Player recap pages",
            "Private DM notes",
            "Portrait uploads",
            "Threads and unresolved hooks",
          ].map((item) => (
            <Card key={item} className="px-5 py-5 text-sm text-zinc-400">
              {item}
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
