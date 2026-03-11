import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { LoginForm } from "@/components/auth/LoginForm";
import { MarketingNav } from "@/components/site/MarketingNav";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to Campaign Tracker with a magic link — no password needed.",
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/app/dashboard");

  return (
    <div className="min-h-screen ds-bg-main">
      <MarketingNav />
      <main className="mx-auto grid w-full max-w-5xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="space-y-5">
          <SectionHeader label="Sign In" title="Keep your campaign continuity intact." />
          <p className="max-w-xl text-base leading-7 text-zinc-400">
            Use magic-link login to open your campaign dashboard.
          </p>
        </div>
        <Panel className="w-full max-w-md justify-self-center px-6 py-8 sm:px-8">
          <LoginForm />
        </Panel>
      </main>
    </div>
  );
}
