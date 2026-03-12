import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSessionUser } from "@/lib/firebase/session";
import { PageHeader } from "@/components/shared/PageHeader";
import { DeleteAccountDialog } from "@/components/shared/DeleteAccountDialog";

export const metadata: Metadata = { title: "Account Settings" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="page-shell max-w-2xl space-y-10">
      <PageHeader title="Account Settings" backHref="/app/dashboard" backLabel="Dashboard" />

      {/* Account info */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Account
        </h2>
        <div className="rounded-lg border border-border p-4 text-sm">
          <p className="text-muted-foreground">Signed in as</p>
          <p className="mt-0.5 font-medium">{user.email ?? "Unknown"}</p>
        </div>
      </section>

      {/* Danger zone */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-destructive uppercase tracking-wider">
          Danger zone
        </h2>
        <div className="rounded-lg border border-destructive/30 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Permanently removes your account and all campaign data. This cannot be undone.
              </p>
            </div>
            <DeleteAccountDialog />
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Privacy
        </h2>
        <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground space-y-1">
          <p>
            Campaign Tracker stores your email address and campaign data in Firebase (Google) and
            uploaded images in AWS S3. No data is sold or used for advertising.
          </p>
          <p>
            Read the full{" "}
            <a href="/privacy" className="underline hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
