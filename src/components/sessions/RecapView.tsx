import { recapToMarkdown } from "@/lib/markdown";
import { formatDate } from "@/lib/utils";
import { CopyButton } from "@/components/shared/CopyButton";
import { ModeCallout, SectionFrame } from "@/components/shared/editorial";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { RecapContent } from "@/types";

interface RecapViewProps {
  recap: RecapContent;
  mode: "player" | "dm";
}

const dispositionColors: Record<string, string> = {
  ally: "bg-public/80 text-[var(--public-foreground)]",
  enemy: "bg-destructive/15 text-destructive",
  neutral: "bg-secondary text-secondary-foreground",
  unknown: "bg-muted text-muted-foreground",
};

export function RecapView({ recap, mode }: RecapViewProps) {
  const markdown = recapToMarkdown(recap);
  const openThreads = recap.threads.filter((t) => t.status === "open");
  const resolvedThreads = recap.threads.filter((t) => t.status === "resolved");

  return (
    <SectionFrame
      title={recap.sessionTitle ?? "Untitled session"}
      eyebrow={mode === "player" ? "Player Recap" : "DM Recap"}
      description={formatDate(recap.sessionDate)}
      tone={mode === "player" ? "public" : "private"}
      action={<CopyButton text={markdown} label="Copy recap" />}
      contentClassName="space-y-6"
    >
      <div className="max-w-2xl">
        <ModeCallout
          mode={mode === "player" ? "public" : "private"}
          title={mode === "player" ? "Safe to share with players" : "Includes DM-only notes and hidden hooks"}
          description={
            mode === "player"
              ? "This version only includes public highlights, public thread updates, and player-safe NPC mentions."
              : "Use this version when you need the real state of the world, open secrets, and unresolved prep notes."
          }
        />
      </div>

      <div className="space-y-6 text-sm leading-7">
        {recap.highlights.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-serif text-xl tracking-[-0.02em] text-foreground">What happened</h3>
            <ul className="space-y-2">
              {recap.highlights.map((h, i) => (
                <li key={i} className="flex gap-3">
                  <span className="pt-0.5 text-muted-foreground">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {openThreads.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-serif text-xl tracking-[-0.02em] text-foreground">Open threads</h3>
            <ul className="space-y-2.5">
              {openThreads.map((t, i) => (
                <li key={i} className="paper-inset flex items-center gap-3 px-4 py-3">
                  <span className="text-muted-foreground">→</span>
                  <span className="flex-1">{t.text}</span>
                  {mode === "dm" && t.visibility === "private" && (
                    <VisibilityBadge visibility="private" />
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {resolvedThreads.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-serif text-xl tracking-[-0.02em] text-foreground">Resolved</h3>
            <ul className="space-y-1.5">
              {resolvedThreads.map((t, i) => (
                <li key={i} className="text-muted-foreground line-through">
                  {t.text}
                </li>
              ))}
            </ul>
          </section>
        )}

        {recap.npcMentions.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-serif text-xl tracking-[-0.02em] text-foreground">NPCs</h3>
            <ul className="space-y-2.5">
              {recap.npcMentions.map((m, i) => (
                <li key={i} className="paper-inset flex items-start gap-3 px-4 py-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span className="font-medium">{m.npcName}</span>
                    {m.disposition && (
                      <Badge
                        variant="outline"
                        className={`border-transparent ${dispositionColors[m.disposition] ?? ""}`}
                      >
                        {m.disposition}
                      </Badge>
                    )}
                    {mode === "dm" && m.visibility === "private" && (
                      <VisibilityBadge visibility="private" />
                    )}
                    {m.note && (
                      <span className="text-muted-foreground">{m.note}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {mode === "dm" && recap.privateNotes && (
          <>
            <Separator />
            <ModeCallout
              mode="private"
              title="DM notes"
              description="These notes never appear in the player recap."
            >
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground">{recap.privateNotes}</p>
            </ModeCallout>
          </>
        )}
      </div>
    </SectionFrame>
  );
}
