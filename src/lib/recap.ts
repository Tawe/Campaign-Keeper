import type {
  RecapContent,
  RecapNpcMention,
  RecapThread,
  Session,
  Thread,
  NpcMentionWithNpc,
} from "@/types";

export function generatePlayerRecap(
  session: Pick<Session, "title" | "date" | "public_highlights">,
  threads: Thread[],
  mentions: NpcMentionWithNpc[]
): RecapContent {
  return {
    sessionTitle: session.title,
    sessionDate: session.date,
    highlights: session.public_highlights,
    threads: threads
      .filter((t) => t.visibility === "public")
      .map(
        (t): RecapThread => ({
          text: t.text,
          status: t.status,
          visibility: t.visibility,
        })
      ),
    npcMentions: mentions
      .filter((m) => m.visibility === "public")
      .map(
        (m): RecapNpcMention => ({
          npcName: m.npc.name,
          disposition: m.npc.disposition,
          note: m.note,
          visibility: m.visibility,
        })
      ),
    // privateNotes intentionally omitted
  };
}

export function generateDmRecap(
  session: Pick<Session, "title" | "date" | "public_highlights" | "private_notes">,
  threads: Thread[],
  mentions: NpcMentionWithNpc[]
): RecapContent {
  return {
    sessionTitle: session.title,
    sessionDate: session.date,
    highlights: session.public_highlights,
    threads: threads.map(
      (t): RecapThread => ({
        text: t.text,
        status: t.status,
        visibility: t.visibility,
      })
    ),
    npcMentions: mentions.map(
      (m): RecapNpcMention => ({
        npcName: m.npc.name,
        disposition: m.npc.disposition,
        note: m.note,
        visibility: m.visibility,
      })
    ),
    privateNotes: session.private_notes || undefined,
  };
}
