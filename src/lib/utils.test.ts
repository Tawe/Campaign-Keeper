import { describe, it, expect } from "bun:test";
import { cn, formatDate, formatDateShort, today } from "./utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges conflicting Tailwind classes (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-sm", "text-lg")).toBe("text-lg");
  });

  it("handles undefined and null gracefully", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("returns empty string for no valid classes", () => {
    expect(cn(false, undefined, null)).toBe("");
  });
});

describe("formatDate", () => {
  it("formats a date string to long form", () => {
    const result = formatDate("2026-03-11");
    expect(result).toContain("2026");
    expect(result).toContain("March");
    expect(result).toContain("11");
  });

  it("handles January", () => {
    expect(formatDate("2026-01-01")).toContain("January");
  });

  it("handles December", () => {
    expect(formatDate("2025-12-25")).toContain("December");
  });
});

describe("formatDateShort", () => {
  it("formats a date string to short form", () => {
    const result = formatDateShort("2026-03-11");
    expect(result).toContain("2026");
    expect(result).toContain("Mar");
    expect(result).toContain("11");
  });

  it("does not include the full month name", () => {
    const result = formatDateShort("2026-03-11");
    expect(result).not.toContain("March");
  });

  it("handles end of year boundary", () => {
    const result = formatDateShort("2025-12-31");
    expect(result).toContain("Dec");
    expect(result).toContain("31");
    expect(result).toContain("2025");
  });
});

describe("today", () => {
  it("returns a string in YYYY-MM-DD format", () => {
    const result = today();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches the current date", () => {
    const result = today();
    const expected = new Date().toISOString().split("T")[0];
    expect(result).toBe(expected);
  });
});
