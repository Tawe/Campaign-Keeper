import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignSessions } from "@/domains/sessions/queries";
import { Panel } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";

export default async function PlayerSessionsPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const sessions = await getCampaignSessions(campaignId);

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">No sessions recorded yet.</p>
    );
  }

  return (
    <Panel className="divide-y divide-border overflow-hidden">
      {sessions.map((session, i) => (
        <Link
          key={session.id}
          href={`/player/campaigns/${campaignId}/sessions/${session.id}`}
          className="flex items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent/45 sm:px-5"
        >
          <div className="flex items-start gap-3 min-w-0">
            <span className="section-eyebrow shrink-0 w-9 pt-1 text-right">
              #{sessions.length - i}
            </span>
            <div className="min-w-0">
              <span className="block truncate font-medium">
                {session.title || "Untitled session"}
              </span>
              {session.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {session.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="font-normal normal-case tracking-[0.08em]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <span className="shrink-0 pt-0.5 text-sm text-muted-foreground">
            {formatDateShort(session.date)}
          </span>
        </Link>
      ))}
    </Panel>
  );
}
