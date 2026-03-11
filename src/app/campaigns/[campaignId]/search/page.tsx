import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/firebase/session";
import { getCampaignSessions } from "@/domains/sessions/queries";
import { getCampaignThreads } from "@/domains/threads/queries";
import { getCampaignNpcs } from "@/domains/npcs/queries";
import { SearchInput } from "@/components/search/SearchInput";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { formatDateShort } from "@/lib/utils";

const dispositionColors: Record<string, string> = {
  ally: "bg-public/80 text-[var(--public-foreground)] border-transparent",
  enemy: "bg-destructive/15 text-destructive border-transparent",
  neutral: "bg-secondary text-secondary-foreground border-transparent",
  unknown: "bg-muted text-muted-foreground border-transparent",
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
  if (!user) redirect("/login");

  const [allSessions, allThreads, allNpcs] = await Promise.all([
    getCampaignSessions(campaignId),
    getCampaignThreads(campaignId),
    getCampaignNpcs(campaignId),
  ]);

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
    <div className="page-shell max-w-5xl space-y-6">
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
