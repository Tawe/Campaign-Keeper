import { SectionFrame } from "@/components/shared/editorial";
import { Star } from "lucide-react";
import type { PollResponse } from "@/types";

interface PollResultsProps {
  responses: PollResponse[];
}

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${cls} ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
        />
      ))}
    </span>
  );
}

export function PollResults({ responses }: PollResultsProps) {
  if (responses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No feedback yet. Share the session link with your players to collect responses.
      </p>
    );
  }

  const avg = responses.reduce((sum, r) => sum + r.enjoyment, 0) / responses.length;
  const avgDisplay = avg.toFixed(1);

  return (
    <div className="space-y-4">
      <div className="paper-inset flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground">
        <span>{responses.length} {responses.length === 1 ? "response" : "responses"}</span>
        <span>·</span>
        <span className="flex items-center gap-1.5">
          <Stars rating={Math.round(avg)} size="sm" />
          <span>{avgDisplay} avg</span>
        </span>
      </div>
      <div className="space-y-3">
        {responses.map((r) => (
          <SectionFrame
            key={r.id}
            title={r.player_name ?? "Anonymous"}
            eyebrow="Response"
            description={new Date(r.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
            action={<Stars rating={r.enjoyment} size="sm" />}
            tone="inset"
            contentClassName="space-y-3"
          >
            {(r.liked || r.improve || r.looking_forward) && (
              <div className="space-y-2 text-sm">
                {r.liked && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Liked</p>
                    <p>{r.liked}</p>
                  </div>
                )}
                {r.improve && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Could improve</p>
                    <p>{r.improve}</p>
                  </div>
                )}
                {r.looking_forward && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Looking forward to</p>
                    <p>{r.looking_forward}</p>
                  </div>
                )}
              </div>
            )}
          </SectionFrame>
        ))}
      </div>
    </div>
  );
}
