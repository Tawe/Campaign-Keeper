import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/firebase/session";
import { getThread } from "@/domains/threads/queries";
import { ThreadItem } from "@/domains/threads/components/ThreadItem";
import { PageHeader } from "@/components/shared/PageHeader";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { Badge } from "@/components/ui/badge";
import { formatDateShort } from "@/lib/utils";

export default async function ThreadDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; threadId: string }>;
}) {
  const { campaignId, threadId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const data = await getThread(threadId);
  if (!data) notFound();

  const { thread, originSession } = data;
  if (thread.campaign_id !== campaignId) notFound();

  return (
    <div className="reading-shell space-y-6">
      <PageHeader
        title="Thread"
        backHref={`/campaigns/${campaignId}`}
        backLabel="Dashboard"
      />
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={thread.status === "open" ? "default" : "secondary"}>
            {thread.status}
          </Badge>
          <VisibilityBadge visibility={thread.visibility} />
        </div>

        <p className="text-lg">{thread.text}</p>

        {originSession && (
          <p className="text-sm text-muted-foreground">
            First mentioned in{" "}
            <Link
              href={`/campaigns/${campaignId}/sessions/${originSession.id}`}
              className="underline hover:no-underline"
            >
              {originSession.title
                ? `${originSession.title} (${formatDateShort(originSession.date)})`
                : formatDateShort(originSession.date)}
            </Link>
          </p>
        )}

        <div className="pt-2">
          <ThreadItem thread={thread} campaignId={campaignId} />
        </div>
      </div>
    </div>
  );
}
