import { describe, it, expect } from "bun:test";
import { generatePlayerRecap, generateDmRecap } from "./recap";
import { recapToMarkdown } from "./markdown";
import type { Session, Thread, NpcMentionWithNpc, Npc } from "@/types";

const session: Session = {
  id: "s1",
  campaign_id: "c1",
  date: "2026-02-27",
  title: "The Black Road Ambush",
  public_highlights: ["The party defeated an ambush.", "Elara found a sigil."],
  private_notes: "The assassin was hired by Lord Calder.",
  share_token: "tok1",
  created_at: "2026-02-27T00:00:00Z",
  updated_at: "2026-02-27T00:00:00Z",
};

const threads: Thread[] = [
  {
    id: "t1",
    campaign_id: "c1",
    session_id: "s1",
    text: "Who hired the assassin?",
    visibility: "public",
    status: "open",
    resolved_at: null,
    created_at: "2026-02-27T00:00:00Z",
    updated_at: "2026-02-27T00:00:00Z",
  },
  {
    id: "t2",
    campaign_id: "c1",
    session_id: "s1",
    text: "Lord Calder is the client — confirm this",
    visibility: "private",
    status: "open",
    resolved_at: null,
    created_at: "2026-02-27T00:00:00Z",
    updated_at: "2026-02-27T00:00:00Z",
  },
];

const npc: Npc = {
  id: "n1",
  campaign_id: "c1",
  name: "Mira Ashveil",
  disposition: "ally",
  portrait_url: null,
  stats_link: null,
  status: null,
  last_scene: null,
  public_info: null,
  private_notes: null,
  created_at: "2026-02-27T00:00:00Z",
  updated_at: "2026-02-27T00:00:00Z",
};

const mentions: NpcMentionWithNpc[] = [
  {
    id: "m1",
    npc_id: "n1",
    session_id: "s1",
    visibility: "public",
    note: "Offered shelter.",
    created_at: "2026-02-27T00:00:00Z",
    npc,
  },
  {
    id: "m2",
    npc_id: "n1",
    session_id: "s1",
    visibility: "private",
    note: "DM: She knows about Lord Calder.",
    created_at: "2026-02-27T00:00:00Z",
    npc,
  },
];

describe("generatePlayerRecap", () => {
  it("includes public highlights", () => {
    const recap = generatePlayerRecap(session, threads, mentions);
    expect(recap.highlights).toEqual(session.public_highlights);
  });

  it("excludes private threads", () => {
    const recap = generatePlayerRecap(session, threads, mentions);
    const texts = recap.threads.map((t) => t.text);
    expect(texts).toContain("Who hired the assassin?");
    expect(texts).not.toContain("Lord Calder is the client — confirm this");
  });

  it("excludes private NPC mentions", () => {
    const recap = generatePlayerRecap(session, threads, mentions);
    expect(recap.npcMentions).toHaveLength(1);
    expect(recap.npcMentions[0].note).toBe("Offered shelter.");
  });

  it("never includes privateNotes", () => {
    const recap = generatePlayerRecap(session, threads, mentions);
    expect(recap.privateNotes).toBeUndefined();
  });
});

describe("generateDmRecap", () => {
  it("includes all threads", () => {
    const recap = generateDmRecap(session, threads, mentions);
    expect(recap.threads).toHaveLength(2);
  });

  it("includes private notes", () => {
    const recap = generateDmRecap(session, threads, mentions);
    expect(recap.privateNotes).toBe("The assassin was hired by Lord Calder.");
  });

  it("includes all NPC mentions", () => {
    const recap = generateDmRecap(session, threads, mentions);
    expect(recap.npcMentions).toHaveLength(2);
  });
});

describe("recapToMarkdown", () => {
  it("formats player recap without private data", () => {
    const recap = generatePlayerRecap(session, threads, mentions);
    const md = recapToMarkdown(recap);
    expect(md).toContain("The Black Road Ambush");
    expect(md).not.toContain("Lord Calder");
    expect(md).not.toContain("DM:");
  });

  it("formats DM recap with private notes", () => {
    const recap = generateDmRecap(session, threads, mentions);
    const md = recapToMarkdown(recap);
    expect(md).toContain("Lord Calder is the client");
    expect(md).toContain("The assassin was hired by Lord Calder");
  });
});
