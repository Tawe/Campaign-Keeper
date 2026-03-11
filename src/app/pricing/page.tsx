import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/site/MarketingNav";
import { PrimaryButton } from "@/components/ui/primary-button";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Campaign Tracker is free to use. Run your campaign journal in one place.",
  openGraph: {
    title: "Pricing | Campaign Tracker",
    description: "Campaign Tracker is free to use. Run your campaign journal in one place.",
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen ds-bg-main">
      <MarketingNav />
      <main className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader label="Pricing" title="Simple pricing for DMs" />
        <Panel className="mt-8 rounded-2xl px-6 py-8 sm:px-8">
          <h2 className="font-serif text-2xl">Starter</h2>
          <p className="mt-2 text-3xl font-semibold">$0</p>
          <p className="mt-3 text-sm text-zinc-400">Run your campaign journal in one place.</p>
          <PrimaryButton asChild className="mt-6">
            <Link href="/app/dashboard">Launch App</Link>
          </PrimaryButton>
        </Panel>
      </main>
    </div>
  );
}
