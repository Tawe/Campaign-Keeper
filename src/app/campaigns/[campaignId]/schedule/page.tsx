import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaign } from "@/domains/campaigns/queries";
import { getScheduledSessionsWithAttendance } from "@/domains/schedule/queries";
import { ScheduledSessionCard } from "@/domains/schedule/components/ScheduledSessionCard";
import { ScheduleSettingsPanel } from "@/domains/schedule/components/ScheduleSettingsPanel";
import { PrimaryButton } from "@/components/ui/primary-button";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const campaign = await getCampaign(campaignId, user.uid);
  if (!campaign) notFound();

  const sessions = await getScheduledSessionsWithAttendance(campaignId);

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = sessions.filter((s) => s.status === "upcoming" && s.date >= today);
  const past = sessions.filter((s) => s.status !== "upcoming" || s.date < today);

  return (
    <div className="px-6 py-8 space-y-6">
      <ScheduleSettingsPanel
        campaignId={campaignId}
        scheduleCadence={campaign.schedule_cadence}
        reminderDaysBefore={campaign.reminder_days_before}
      />

      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-foreground">Upcoming</h2>
        <PrimaryButton asChild>
          <Link href={`/campaigns/${campaignId}/schedule/new`}>
            <Plus className="h-4 w-4 mr-1.5" /> New Session
          </Link>
        </PrimaryButton>
      </div>

      {upcoming.length === 0 ? (
        <div className="paper-panel px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">No upcoming sessions scheduled.</p>
          <PrimaryButton asChild className="mt-4">
            <Link href={`/campaigns/${campaignId}/schedule/new`}>Schedule a session</Link>
          </PrimaryButton>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((s) => (
            <ScheduledSessionCard key={s.id} session={s} campaignId={campaignId} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="font-serif text-xl text-muted-foreground pt-4">Past &amp; Cancelled</h2>
          <div className="space-y-3">
            {past.map((s) => (
              <ScheduledSessionCard key={s.id} session={s} campaignId={campaignId} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
