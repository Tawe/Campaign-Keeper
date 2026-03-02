import { formatDate } from "./utils";
import type { RecapContent } from "@/types";

export function recapToMarkdown(recap: RecapContent): string {
  const lines: string[] = [];

  const heading = recap.sessionTitle
    ? `## ${recap.sessionTitle} — ${formatDate(recap.sessionDate)}`
    : `## Session — ${formatDate(recap.sessionDate)}`;

  lines.push(heading, "");

  if (recap.highlights.length > 0) {
    lines.push("### What Happened", "");
    recap.highlights.forEach((h) => lines.push(`- ${h}`));
    lines.push("");
  }

  const openThreads = recap.threads.filter((t) => t.status === "open");
  if (openThreads.length > 0) {
    lines.push("### Open Threads", "");
    openThreads.forEach((t) => lines.push(`- ${t.text}`));
    lines.push("");
  }

  const resolvedThreads = recap.threads.filter((t) => t.status === "resolved");
  if (resolvedThreads.length > 0) {
    lines.push("### Resolved", "");
    resolvedThreads.forEach((t) => lines.push(`- ~~${t.text}~~`));
    lines.push("");
  }

  if (recap.npcMentions.length > 0) {
    lines.push("### NPCs", "");
    recap.npcMentions.forEach((m) => {
      const disposition = m.disposition ? ` *(${m.disposition})*` : "";
      const note = m.note ? ` — ${m.note}` : "";
      lines.push(`- **${m.npcName}**${disposition}${note}`);
    });
    lines.push("");
  }

  if (recap.privateNotes) {
    lines.push("### DM Notes", "");
    lines.push(recap.privateNotes, "");
  }

  return lines.join("\n").trimEnd();
}
