import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignCalendar, getCampaignsWithCalendars } from "@/domains/calendars/queries";
import { getCampaignSessions } from "@/domains/sessions/queries";
import { getCampaignEvents } from "@/domains/events/queries";
import { CalendarSetupForm } from "@/domains/calendars/components/CalendarSetupForm";
import { CalendarView } from "@/domains/calendars/components/CalendarView";
import { PageHeader } from "@/components/shared/PageHeader";

interface Props {
  params: Promise<{ campaignId: string }>;
}

export default async function CalendarPage({ params }: Props) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) notFound();

  const [calendar, sessions, events, otherCampaigns] = await Promise.all([
    getCampaignCalendar(campaignId),
    getCampaignSessions(campaignId),
    getCampaignEvents(campaignId),
    getCampaignsWithCalendars(user.uid, campaignId),
  ]);

  if (!calendar) {
    return (
      <div className="page-shell max-w-3xl space-y-8">
        <PageHeader
          title="Calendar"
          eyebrow="Campaign"
          backHref={`/campaigns/${campaignId}`}
          backLabel="Campaign"
        />
        <CalendarSetupForm
          campaignId={campaignId}
          initial={null}
          otherCampaigns={otherCampaigns}
        />
      </div>
    );
  }

  return (
    <div className="page-shell max-w-3xl space-y-8">
      <CalendarView
        campaignId={campaignId}
        calendar={calendar}
        sessions={sessions}
        events={events}
        otherCampaigns={otherCampaigns}
      />
    </div>
  );
}
