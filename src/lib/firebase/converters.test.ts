import { describe, it, expect } from "bun:test";
import {
  toCampaign,
  toSession,
  toNpc,
  toCampaignNpc,
  toPlayer,
  toFaction,
  toCampaignFaction,
  toLocation,
  toCampaignLocation,
  toCalendar,
} from "./converters";

// Minimal mock of a Firestore DocumentSnapshot
function mockDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    exists: true,
    data: () => data,
  } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

describe("toCampaign", () => {
  it("maps all fields", () => {
    const doc = mockDoc("c1", {
      userId: "u1",
      name: "The Iron Meridian",
      system: "5e",
      participants: ["Alice", "Bob"],
      inviteToken: "tok123",
      playerUserIds: ["uid-a", "uid-b"],
      createdAt: null,
      updatedAt: null,
    });
    const result = toCampaign(doc);
    expect(result.id).toBe("c1");
    expect(result.user_id).toBe("u1");
    expect(result.name).toBe("The Iron Meridian");
    expect(result.system).toBe("5e");
    expect(result.invite_token).toBe("tok123");
    expect(result.player_user_ids).toEqual(["uid-a", "uid-b"]);
  });

  it("defaults optional fields", () => {
    const doc = mockDoc("c2", {
      userId: "u1",
      name: "Minimal",
      createdAt: null,
      updatedAt: null,
    });
    const result = toCampaign(doc);
    expect(result.system).toBeNull();
    expect(result.participants).toEqual([]);
    expect(result.invite_token).toBe("");
    expect(result.player_user_ids).toEqual([]);
  });
});

describe("toSession", () => {
  it("maps all fields including highlights and tags", () => {
    const doc = mockDoc("s1", {
      campaignId: "c1",
      date: "2026-03-11",
      title: "The Ambush",
      publicHighlights: ["Party defeated bandits"],
      privateNotes: "DM notes here",
      tags: ["combat", "travel"],
      characters: [{ name: "Thorin", status_at_end: "alive" }],
      shareToken: "share1",
      createdAt: null,
      updatedAt: null,
    });
    const result = toSession(doc);
    expect(result.id).toBe("s1");
    expect(result.campaign_id).toBe("c1");
    expect(result.title).toBe("The Ambush");
    expect(result.public_highlights).toEqual(["Party defeated bandits"]);
    expect(result.private_notes).toBe("DM notes here");
    expect(result.tags).toEqual(["combat", "travel"]);
  });

  it("maps in_game_date when present", () => {
    const doc = mockDoc("s2", {
      campaignId: "c1",
      date: "2026-03-11",
      inGameDate: { year: 1492, month: 3, day: 15 },
      shareToken: "",
      createdAt: null,
      updatedAt: null,
    });
    const result = toSession(doc);
    expect(result.in_game_date).toEqual({ year: 1492, month: 3, day: 15 });
  });

  it("returns null for in_game_date when absent", () => {
    const doc = mockDoc("s3", {
      campaignId: "c1",
      date: "2026-03-11",
      shareToken: "",
      createdAt: null,
      updatedAt: null,
    });
    expect(toSession(doc).in_game_date).toBeNull();
  });

  it("defaults arrays to empty", () => {
    const doc = mockDoc("s4", {
      campaignId: "c1",
      date: "2026-03-11",
      shareToken: "",
      createdAt: null,
      updatedAt: null,
    });
    const result = toSession(doc);
    expect(result.public_highlights).toEqual([]);
    expect(result.tags).toEqual([]);
    expect(result.loot).toEqual([]);
  });
});

describe("toNpc (global doc)", () => {
  it("maps basic NPC fields", () => {
    const doc = mockDoc("n1", {
      userId: "u1",
      name: "Mira",
      race: "Elf",
      sex: "Female",
      alignment: "Neutral Good",
      publicInfo: "A wandering healer",
      privateNotes: "Working for the guild",
      createdAt: null,
      updatedAt: null,
    });
    const result = toNpc(doc);
    expect(result.id).toBe("n1");
    expect(result.name).toBe("Mira");
    expect(result.race).toBe("Elf");
    expect(result.public_info).toBe("A wandering healer");
    expect(result.private_notes).toBe("Working for the guild");
  });

  it("handles new npc_class array format", () => {
    const doc = mockDoc("n2", {
      name: "Gandalf",
      npcClass: [{ name: "Wizard", level: 20 }],
      createdAt: null,
      updatedAt: null,
    });
    const result = toNpc(doc);
    expect(result.npc_class).toEqual([{ name: "Wizard", level: 20 }]);
  });

  it("handles legacy npc_class string + level format", () => {
    const doc = mockDoc("n3", {
      name: "Old Guard",
      npcClass: "Fighter",
      level: 5,
      createdAt: null,
      updatedAt: null,
    });
    const result = toNpc(doc);
    expect(result.npc_class).toEqual([{ name: "Fighter", level: 5 }]);
  });

  it("returns empty npc_class when missing", () => {
    const doc = mockDoc("n4", {
      name: "Mystery",
      createdAt: null,
      updatedAt: null,
    });
    expect(toNpc(doc).npc_class).toEqual([]);
  });

  it("generates portrait URL from portraitPath", () => {
    const doc = mockDoc("n5", {
      name: "Drawn",
      portraitPath: "some/path.jpg",
      updatedAt: null,
      createdAt: null,
    });
    const result = toNpc(doc);
    expect(result.portrait_url).toContain("/api/portraits/npc/n5");
  });

  it("uses portraitUrl directly when present", () => {
    const doc = mockDoc("n6", {
      name: "External",
      portraitUrl: "https://example.com/portrait.jpg",
      updatedAt: null,
      createdAt: null,
    });
    expect(toNpc(doc).portrait_url).toBe("https://example.com/portrait.jpg");
  });

  it("maps npc gallery URLs from galleryPaths", () => {
    const doc = mockDoc("n7", {
      name: "Gallery NPC",
      galleryPaths: ["npc/a.jpg", { path: "npc/b.jpg", caption: "Formal portrait" }],
      updatedAt: null,
      createdAt: null,
    });
    expect(toNpc(doc).gallery_images).toEqual([
      { url: expect.stringContaining("/api/portraits/npc/n7?"), caption: null },
      { url: expect.stringContaining("/api/portraits/npc/n7?"), caption: "Formal portrait" },
    ]);
  });

  it("backward-compat: falls back to notes field for private_notes", () => {
    const doc = mockDoc("n8", {
      name: "Old Doc",
      notes: "Legacy private notes",
      createdAt: null,
      updatedAt: null,
    });
    expect(toNpc(doc).private_notes).toBe("Legacy private notes");
  });
});

describe("toCampaignNpc (campaign junction doc)", () => {
  it("maps campaign-specific fields", () => {
    const doc = mockDoc("c1_n1", {
      npcId: "n1",
      campaignId: "c1",
      name: "Mira",
      disposition: "ally",
      status: "Alive",
      lastScene: "Tavern",
      factionNames: ["Healers Guild"],
      createdAt: null,
      updatedAt: null,
    });
    const result = toCampaignNpc(doc);
    expect(result.id).toBe("n1");
    expect(result.campaign_id).toBe("c1");
    expect(result.disposition).toBe("ally");
    expect(result.status).toBe("Alive");
    expect(result.last_scene).toBe("Tavern");
    expect(result.faction_names).toEqual(["Healers Guild"]);
  });

  it("defaults faction_names to empty array", () => {
    const doc = mockDoc("c1_n2", {
      npcId: "n2",
      campaignId: "c1",
      name: "Lone Wolf",
      createdAt: null,
      updatedAt: null,
    });
    expect(toCampaignNpc(doc).faction_names).toEqual([]);
  });
});

describe("toPlayer", () => {
  it("maps player fields", () => {
    const doc = mockDoc("p1", {
      campaignId: "c1",
      name: "Alice",
      playerUserId: "uid-alice",
      playerEmail: "alice@example.com",
      characters: [
        { name: "Thorin", class: "Fighter", race: "Dwarf", level: 5, statsLink: null },
      ],
      createdAt: null,
      updatedAt: null,
    });
    const result = toPlayer(doc);
    expect(result.id).toBe("p1");
    expect(result.name).toBe("Alice");
    expect(result.player_user_id).toBe("uid-alice");
    expect(result.characters).toHaveLength(1);
    expect(result.characters[0].name).toBe("Thorin");
    expect(result.characters[0].class).toBe("Fighter");
    expect(result.characters[0].level).toBe(5);
  });

  it("defaults player_user_id to null", () => {
    const doc = mockDoc("p2", {
      campaignId: "c1",
      name: "Bob",
      characters: [],
      createdAt: null,
      updatedAt: null,
    });
    expect(toPlayer(doc).player_user_id).toBeNull();
  });

  it("defaults characters to empty array", () => {
    const doc = mockDoc("p3", {
      campaignId: "c1",
      name: "Carol",
      createdAt: null,
      updatedAt: null,
    });
    expect(toPlayer(doc).characters).toEqual([]);
  });
});

describe("toFaction (global doc)", () => {
  it("maps intrinsic faction fields", () => {
    const doc = mockDoc("f1", {
      name: "The Guild",
      factionType: "Criminal",
      alignment: "Neutral Evil",
      founded: "1350 DR",
      publicInfo: "Known thieves",
      createdAt: null,
      updatedAt: null,
    });
    const result = toFaction(doc);
    expect(result.name).toBe("The Guild");
    expect(result.faction_type).toBe("Criminal");
    expect(result.alignment).toBe("Neutral Evil");
    expect(result.founded).toBe("1350 DR");
    expect(result.public_info).toBe("Known thieves");
  });

  it("nulls out dynamic fields (those live in campaign doc)", () => {
    const doc = mockDoc("f2", {
      name: "Army",
      status: "Active", // stored in global but should be overridden
      createdAt: null,
      updatedAt: null,
    });
    const result = toFaction(doc);
    // toFaction always nulls dynamic fields — they come from campaign doc
    expect(result.status).toBeNull();
    expect(result.influence).toBeNull();
    expect(result.leader_names).toEqual([]);
  });
});

describe("toCampaignFaction", () => {
  it("maps campaign-specific dynamic fields", () => {
    const doc = mockDoc("c1_f1", {
      factionId: "f1",
      campaignId: "c1",
      name: "The Guild",
      status: "Active",
      influence: "Regional",
      disbanded: null,
      memberCount: "500",
      homeBase: "Waterdeep",
      leaderNames: ["Boss Calera"],
      allegiances: ["Merchant Council"],
      enemies: ["City Watch"],
      createdAt: null,
      updatedAt: null,
    });
    const result = toCampaignFaction(doc);
    expect(result.id).toBe("f1");
    expect(result.status).toBe("Active");
    expect(result.influence).toBe("Regional");
    expect(result.home_base).toBe("Waterdeep");
    expect(result.leader_names).toEqual(["Boss Calera"]);
    expect(result.allegiances).toEqual(["Merchant Council"]);
    expect(result.enemies).toEqual(["City Watch"]);
  });

  it("defaults array fields to empty", () => {
    const doc = mockDoc("c1_f2", {
      factionId: "f2",
      campaignId: "c1",
      name: "Minimal",
      createdAt: null,
      updatedAt: null,
    });
    const result = toCampaignFaction(doc);
    expect(result.leader_names).toEqual([]);
    expect(result.allegiances).toEqual([]);
    expect(result.enemies).toEqual([]);
  });
});

describe("toLocation (global doc)", () => {
  it("generates image URL from imagePath", () => {
    const doc = mockDoc("l1", {
      name: "Thornwall",
      imagePath: "locations/l1.jpg",
      terrain: ["Forest", "Hills"],
      updatedAt: null,
      createdAt: null,
    });
    const result = toLocation(doc);
    expect(result.image_url).toContain("/api/portraits/location/l1");
    expect(result.terrain).toEqual(["Forest", "Hills"]);
  });

  it("returns null image_url when no imagePath", () => {
    const doc = mockDoc("l2", {
      name: "Empty",
      createdAt: null,
      updatedAt: null,
    });
    expect(toLocation(doc).image_url).toBeNull();
  });

  it("maps location gallery URLs from galleryPaths", () => {
    const doc = mockDoc("l3", {
      name: "Gallery Location",
      galleryPaths: ["locations/a.jpg", { path: "locations/b.jpg", caption: "Town map" }],
      updatedAt: null,
      createdAt: null,
    });
    expect(toLocation(doc).gallery_images).toEqual([
      { url: expect.stringContaining("/api/portraits/location/l3?"), caption: null },
      { url: expect.stringContaining("/api/portraits/location/l3?"), caption: "Town map" },
    ]);
  });
});

describe("toCampaignLocation", () => {
  it("maps campaign-specific notes", () => {
    const doc = mockDoc("c1_l1", {
      locationId: "l1",
      campaignId: "c1",
      name: "Thornwall",
      publicInfo: "A walled village",
      privateNotes: "Hidden passage in the east",
      parentLocationId: "l0",
      createdAt: null,
      updatedAt: null,
    });
    const result = toCampaignLocation(doc);
    expect(result.id).toBe("l1");
    expect(result.public_info).toBe("A walled village");
    expect(result.private_notes).toBe("Hidden passage in the east");
    expect(result.parent_location_id).toBe("l0");
    // image_url is always null — merged from global doc later
    expect(result.image_url).toBeNull();
  });
});

describe("toCalendar", () => {
  it("maps calendar fields", () => {
    const doc = mockDoc("c1", {
      campaignId: "c1",
      name: "Harptos",
      yearLabel: "DR",
      startYear: 1492,
      months: [{ name: "Hammer", days: 30 }, { name: "Alturiak", days: 30 }],
      weekdays: ["Moonday", "Godsday", "Waterday"],
      createdAt: null,
      updatedAt: null,
    });
    const result = toCalendar(doc);
    expect(result.name).toBe("Harptos");
    expect(result.year_label).toBe("DR");
    expect(result.start_year).toBe(1492);
    expect(result.months).toHaveLength(2);
    expect(result.months[0]).toEqual({ name: "Hammer", days: 30 });
    expect(result.weekdays).toEqual(["Moonday", "Godsday", "Waterday"]);
  });

  it("defaults start_year to null when missing", () => {
    const doc = mockDoc("c1b", {
      campaignId: "c1b",
      name: "Harptos",
      yearLabel: "DR",
      months: [],
      weekdays: [],
      createdAt: null,
      updatedAt: null,
    });
    expect(toCalendar(doc).start_year).toBeNull();
  });

  it("defaults empty arrays when fields are missing", () => {
    const doc = mockDoc("c2", {
      campaignId: "c2",
      name: "Custom",
      createdAt: null,
      updatedAt: null,
    });
    const result = toCalendar(doc);
    expect(result.months).toEqual([]);
    expect(result.weekdays).toEqual([]);
    expect(result.year_label).toBe("");
    expect(result.start_year).toBeNull();
  });
});
