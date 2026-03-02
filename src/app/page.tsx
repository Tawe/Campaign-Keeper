import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toCampaign, toSession } from "@/lib/firebase/converters";
import { CAMPAIGNS_COL, SESSIONS_COL } from "@/lib/firebase/db";
import { Button } from "@/components/ui/button";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { MetaStrip } from "@/components/shared/editorial";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function HomePage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const db = adminDb();

  const campaignsSnap = await db
    .collection(CAMPAIGNS_COL)
    .where("userId", "==", user.uid)
    .orderBy("updatedAt", "desc")
    .get();

  const campaigns = campaignsSnap.docs.map(toCampaign);

  // Latest session date per campaign
  const latestSessions: Record<string, string> = {};
  if (campaigns.length > 0) {
    const campaignIds = campaigns.map((c) => c.id);
    // Firestore 'in' supports up to 30 items
    for (let i = 0; i < campaignIds.length; i += 30) {
      const chunk = campaignIds.slice(i, i + 30);
      const sessionsSnap = await db
        .collection(SESSIONS_COL)
        .where("campaignId", "in", chunk)
        .orderBy("date", "desc")
        .get();
      sessionsSnap.docs.forEach((doc) => {
        const s = toSession(doc);
        if (!latestSessions[s.campaign_id]) {
          latestSessions[s.campaign_id] = s.date;
        }
      });
    }
  }

  async function handleSignOut() {
    "use server";
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.delete("session");
    redirect("/auth/login");
  }

  return (
    <div className="page-shell max-w-4xl">
      <PageHeader
        title="Campaign Keeper"
        eyebrow="Campaign Journal"
        subtitle="A living campaign record for session notes, open threads, and the truths your table needs next week."
        action={
          <>
            <Button asChild>
              <Link href="/campaigns/new">
                <Plus className="h-4 w-4 mr-1" /> New campaign
              </Link>
            </Button>
            <form action={handleSignOut}>
              <Button variant="panel" size="sm" type="submit">
                Sign out
              </Button>
            </form>
          </>
        }
      />
      <div className="mb-8">
        <MetaStrip
          items={[
            `${campaigns.length} campaign${campaigns.length === 1 ? "" : "s"}`,
            campaigns.length > 0 ? "Ordered by most recently updated" : "Start with one campaign and build from there",
          ]}
        />
      </div>

      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns yet"
          description="Create your first campaign to start logging sessions."
          actionLabel="New campaign"
          actionHref="/campaigns/new"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              lastSessionDate={latestSessions[campaign.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
