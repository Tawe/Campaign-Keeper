import { describe, expect, it } from "bun:test";
import {
  getMagicLinkErrorMessage,
  normalizeMagicLinkEmail,
  shouldPromptForMagicLinkEmail,
} from "@/lib/auth/emailLink";

describe("normalizeMagicLinkEmail", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeMagicLinkEmail("  dm@example.com  ")).toBe("dm@example.com");
  });

  it("preserves the original casing", () => {
    expect(normalizeMagicLinkEmail("DM@example.com")).toBe("DM@example.com");
  });
});

describe("getMagicLinkErrorMessage", () => {
  it("maps invalid email errors to a clearer message", () => {
    expect(
      getMagicLinkErrorMessage(new Error("Request failed (auth/invalid-email)"))
    ).toContain("did not match");
  });

  it("maps invalid action code errors to a clearer message", () => {
    expect(
      getMagicLinkErrorMessage(new Error("Request failed (auth/invalid-action-code)"))
    ).toContain("already been used");
  });

  it("falls back to the original error message", () => {
    expect(getMagicLinkErrorMessage(new Error("Something unexpected"))).toBe(
      "Something unexpected"
    );
  });
});

describe("shouldPromptForMagicLinkEmail", () => {
  it("returns true for invalid email errors", () => {
    expect(
      shouldPromptForMagicLinkEmail(new Error("Request failed (auth/invalid-email)"))
    ).toBe(true);
  });

  it("returns false for invalid action code errors", () => {
    expect(
      shouldPromptForMagicLinkEmail(
        new Error("Request failed (auth/invalid-action-code)")
      )
    ).toBe(false);
  });
});
