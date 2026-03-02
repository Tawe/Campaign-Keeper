import Link from "next/link";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase/admin";
import { getSessionUser } from "@/lib/firebase/session";
import { toSession, toThread, toNpc } from "@/lib/firebase/converters";
import { SESSIONS_COL, THREADS_COL, NPCS_COL } from "@/lib/firebase/db";
import { SearchInput } from "@/components/search/SearchInput";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { formatDateShort } from "@/lib/utils";

const dispositionColors: Record<string, string> = {
  ally: "text-green-700 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950",
  enemy: "text-red-700 border-red-300 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950",
  neutral: "text-blue-700 border-blue-300 bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950",
  unknown: "text-gray-600 border-gray-300 bg-gray-50 dark:text-gray-400",
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { campaignId } = await params;
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();

  const user = await getSessionUser();
  if (!user) redirect("/auth/login");

  const db = adminDb();

  const [sessionsSnap, threadsSnap, npcsSnap] = await Promise.all([
    db.collection(SESSIONS_COL).where("campaignId", "==", campaignId).orderBy("date", "desc").get(),
    db.collection(THREADS_COL).where("campaignId", "==", campaignId).orderBy("createdAt", "asc").get(),
    db.collection(NPCS_COL).where("campaignId", "==", campaignId).orderBy("name").get(),
  ]);

  const allSessions = sessionsSnap.docs.map(toSession);
  const allThreads = threadsSnap.docs.map(toThread);
  const allNpcs = npcsSnap.docs.map(toNpc);

  const matchedSessions = query
    ? allSessions.filter((s) =>
        (s.title ?? "").toLowerCase().includes(query) ||
        s.public_highlights.some((h) => h.toLowerCase().includes(query)) ||
        s.tags.some((t) => t.toLowerCase().includes(query))
      )
    : [];

  const matchedThreads = query
    ? allThreads.filter((t) => t.text.toLowerCase().includes(query))
    : [];

  const matchedNpcs = query
    ? allNpcs.filter(
        (n) =>
          n.name.toLowerCase().includes(query) ||
          (n.private_notes ?? "").toLowerCase().includes(query)
      )
    : [];

  const totalResults = matchedSessions.length + matchedThreads.length + matchedNpcs.length;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      <PageHeader
        title="Search"
        backHref={`/campaigns/${campaignId}`}
        backLabel="Dashboard"
      />

      <SearchInput campaignId={campaignId} defaultValue={q} autoFocus={!q} />

      {!query && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Search across sessions, threads, and NPCs in this campaign.
        </p>
      )}

      {query && totalResults === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No results for &ldquo;{q}&rdquo;
        </p>
      )}

      {matchedSessions.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Sessions ({matchedSessions.length})
          </h2>
          <div className="border rounded-lg divide-y overflow-hidden">
            {matchedSessions.map((session) => (
              <Link
                key={session.id}
                href={`/campaigns/${campaignId}/sessions/${session.id}`}
                className="flex items-start justify-between py-2 px-3 hover:bg-muted transition-colors"
              >
                <div className="min-w-0">
                  <span className="font-medium block truncate">
                    {session.title || "Untitled session"}
                  </span>
                  {session.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {session.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className={`text-xs px-1.5 py-0 font-normal ${tag.toLowerCase().includes(query) ? "ring-1 ring-primary" : ""}`}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground shrink-0 ml-4 pt-0.5">
                  {formatDateShort(session.date)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {matchedThreads.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Threads ({matchedThreads.length})
          </h2>
          <div className="border rounded-lg divide-y overflow-hidden">
            {matchedThreads.map((thread) => (
              <Link
                key={thread.id}
                href={`/campaigns/${campaignId}/threads/${thread.id}`}
                className="flex items-center justify-between py-2 px-3 hover:bg-muted transition-colors gap-3"
              >
                <span
                  className={`text-sm flex-1 min-w-0 truncate ${thread.status === "resolved" ? "line-through text-muted-foreground" : ""}`}
                >
                  {thread.text}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={thread.status === "resolved" ? "secondary" : "default"} className="text-xs">
                    {thread.status}
                  </Badge>
                  <VisibilityBadge visibility={thread.visibility} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {matchedNpcs.length > 0 && (
        <section className="space-y-1">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            NPCs ({matchedNpcs.length})
          </h2>
          <div className="border rounded-lg divide-y overflow-hidden">
            {matchedNpcs.map((npc) => (
              <Link
                key={npc.id}
                href={`/campaigns/${campaignId}/npcs/${npc.id}`}
                className="flex items-center justify-between py-2 px-3 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{npc.name}</span>
                  {npc.disposition && (
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${dispositionColors[npc.disposition] ?? ""}`}
                    >
                      {npc.disposition}
                    </Badge>
                  )}
                </div>
                {npc.private_notes && (
                  <span className="text-xs text-muted-foreground truncate ml-4 max-w-48">
                    {npc.private_notes}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
