import Link from "next/link";
import { formatDateShort } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { Session } from "@/types";

interface SessionCardProps {
  session: Session;
  campaignId: string;
  index: number; // reverse-chrono number
}

export function SessionCard({ session, campaignId, index }: SessionCardProps) {
  return (
    <Link
      href={`/campaigns/${campaignId}/sessions/${session.id}`}
      className="flex items-start justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent/45 sm:px-5"
    >
      <div className="flex items-start gap-3 min-w-0">
        <span className="section-eyebrow shrink-0 w-9 pt-1 text-right">
          #{index}
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
  );
}
