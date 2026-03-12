import type { Metadata } from "next";
import Link from "next/link";
import { MarketingNav } from "@/components/site/MarketingNav";
import { SectionHeader } from "@/components/ui/section-header";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Campaign Tracker collects, uses, and protects your data.",
  robots: { index: true, follow: true },
};

const LAST_UPDATED = "March 2026";
const CONTACT_EMAIL = "privacy@campaign-keeper.netlify.app";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen ds-bg-main">
      <MarketingNav />
      <main className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
        <SectionHeader label="Legal" title="Privacy Policy" />
        <p className="mt-2 text-sm ds-text-secondary">Last updated: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 text-sm leading-7 ds-text-secondary">

          <section className="space-y-3">
            <h2 className="text-base font-medium ds-text-primary">1. Who we are</h2>
            <p>
              Campaign Tracker is an independent, open source campaign management tool for
              tabletop RPG Dungeon Masters. It is not operated by a company and has no advertising
              or data monetisation business.
            </p>
            <p>
              For privacy questions contact{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:ds-text-primary transition-colors">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium ds-text-primary">2. What we collect</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="ds-text-primary">Email address</strong> — used only to send
                your magic link sign-in. Never shared with third parties or used for marketing.
              </li>
              <li>
                <strong className="ds-text-primary">Campaign data</strong> — sessions, NPCs,
                locations, factions, events, plot threads, and anything else you create inside the
                app. This data belongs to you.
              </li>
              <li>
                <strong className="ds-text-primary">Uploaded images</strong> — portraits, location
                banners, and faction artwork you upload. Stored in AWS S3.
              </li>
              <li>
                <strong className="ds-text-primary">Session feedback</strong> — optional anonymous
                poll responses submitted by your players after a session.
              </li>
              <li>
                <strong className="ds-text-primary">Session cookie</strong> — an HttpOnly cookie
                that keeps you signed in for up to 5 days. It contains no personal information and
                is required for the app to function.
              </li>
            </ul>
            <p>We do not use analytics trackers, advertising cookies, or fingerprinting.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium ds-text-primary">3. Why we process it</h2>
            <p>
              All processing is necessary to provide the service you signed up for (legal basis:
              contract). We do not process your data for any other purpose.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium ds-text-primary">4. Who we share it with</h2>
            <p>
              We use the following sub-processors to operate the service. Each has a Data
              Processing Agreement in place.
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="ds-text-primary">Google Firebase / Firestore</strong> — stores
                your account and all campaign data. Data is processed in the United States under
                Google&apos;s standard contractual clauses.
              </li>
              <li>
                <strong className="ds-text-primary">Amazon Web Services (S3)</strong> — stores
                uploaded images. Data is processed in the region configured for the bucket.
              </li>
              <li>
                <strong className="ds-text-primary">Netlify</strong> — hosts the web application.
              </li>
            </ul>
            <p>We do not sell, rent, or trade your data to any other party.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium ds-text-primary">5. How long we keep it</h2>
            <p>
              We keep your data for as long as you have an account. When you delete your account,
              all Firestore records and uploaded images associated with your account are permanently
              deleted. Anonymous session feedback is deleted at the same time as the campaign it
              belongs to.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium ds-text-primary">6. Your rights</h2>
            <p>Under GDPR (if you are in the EEA or UK) you have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong className="ds-text-primary">Access</strong> — request a copy of the data
                we hold about you.
              </li>
              <li>
                <strong className="ds-text-primary">Erasure</strong> — delete your account and all
                associated data at any time from{" "}
                <Link href="/app/settings" className="underline hover:ds-text-primary transition-colors">
                  Account Settings
                </Link>
                .
              </li>
              <li>
                <strong className="ds-text-primary">Rectification</strong> — correct any inaccurate
                data (campaign data can be edited directly in the app).
              </li>
              <li>
                <strong className="ds-text-primary">Portability</strong> — request an export of
                your data. Contact us at the email below.
              </li>
              <li>
                <strong className="ds-text-primary">Object</strong> — object to any processing. As
                we only process data to provide the service, deletion is the appropriate remedy.
              </li>
            </ul>
            <p>
              To exercise any right, email{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="underline hover:ds-text-primary transition-colors">
                {CONTACT_EMAIL}
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium ds-text-primary">7. Cookies</h2>
            <p>
              Campaign Tracker uses a single HttpOnly session cookie (named{" "}
              <span className="font-mono">session</span>) that is strictly necessary for
              authentication. No consent is required for this cookie under GDPR. No third-party
              cookies are set.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-medium ds-text-primary">8. Changes to this policy</h2>
            <p>
              If we make material changes we will update the &ldquo;Last updated&rdquo; date at
              the top of this page. Continued use of the service after changes constitutes
              acceptance.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}
