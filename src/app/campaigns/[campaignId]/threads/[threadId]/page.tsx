import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toThread, toSession } from "@/lib/firebase/converters";
import { THREADS_COL, SESSIONS_COL } from "@/lib/firebase/db";
import { PageHeader } from "@/components/shared/PageHeader";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { Badge } from "@/components/ui/badge";
import { ThreadItem } from "@/components/threads/ThreadItem";
import { formatDateShort } from "@/lib/utils";

export default async function ThreadDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; threadId: string }>;
}) {
  const { campaignId, threadId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const db = adminDb();
  const threadDoc = await db.collection(THREADS_COL).doc(threadId).get();
  if (!threadDoc.exists) notFound();

  const thread = toThread(threadDoc);
  if (thread.campaign_id !== campaignId) notFound();

  const originSessionDoc = await db.collection(SESSIONS_COL).doc(thread.session_id).get();
  const originSession = originSessionDoc.exists ? toSession(originSessionDoc) : null;

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6">
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
