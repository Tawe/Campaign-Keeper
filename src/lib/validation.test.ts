import { describe, it, expect } from "bun:test";
import {
  assertMaxLength,
  assertMaxItems,
  MAX_NAME_LENGTH,
  MAX_SHORT_TEXT_LENGTH,
  MAX_LONG_TEXT_LENGTH,
  MAX_ARRAY_ITEMS,
  MAX_TAG_ITEMS,
} from "./validation";

describe("assertMaxLength", () => {
  it("passes when value is within limit", () => {
    expect(() => assertMaxLength("hello", 10, "Field")).not.toThrow();
  });

  it("passes when value is exactly the limit", () => {
    const str = "a".repeat(MAX_NAME_LENGTH);
    expect(() => assertMaxLength(str, MAX_NAME_LENGTH, "Name")).not.toThrow();
  });

  it("throws when value exceeds limit", () => {
    const str = "a".repeat(MAX_NAME_LENGTH + 1);
    expect(() => assertMaxLength(str, MAX_NAME_LENGTH, "Name")).toThrow(
      `Name must be ${MAX_NAME_LENGTH} characters or fewer.`
    );
  });

  it("passes for empty string", () => {
    expect(() => assertMaxLength("", MAX_NAME_LENGTH, "Field")).not.toThrow();
  });

  it("includes the label in the error message", () => {
    expect(() => assertMaxLength("a".repeat(10), 5, "Campaign name")).toThrow("Campaign name");
  });
});

describe("assertMaxItems", () => {
  it("passes when array is within limit", () => {
    expect(() => assertMaxItems([1, 2, 3], 5, "Tags")).not.toThrow();
  });

  it("passes when array length equals limit", () => {
    const arr = new Array(MAX_ARRAY_ITEMS).fill("x");
    expect(() => assertMaxItems(arr, MAX_ARRAY_ITEMS, "Items")).not.toThrow();
  });

  it("throws when array exceeds limit", () => {
    const arr = new Array(MAX_TAG_ITEMS + 1).fill("tag");
    expect(() => assertMaxItems(arr, MAX_TAG_ITEMS, "Tags")).toThrow(
      `Tags must have ${MAX_TAG_ITEMS} items or fewer.`
    );
  });

  it("passes for empty array", () => {
    expect(() => assertMaxItems([], MAX_ARRAY_ITEMS, "Items")).not.toThrow();
  });

  it("includes the label in the error message", () => {
    expect(() => assertMaxItems(new Array(10).fill("x"), 5, "Participants")).toThrow(
      "Participants"
    );
  });
});

describe("constants", () => {
  it("MAX_NAME_LENGTH is a positive number", () => {
    expect(MAX_NAME_LENGTH).toBeGreaterThan(0);
  });

  it("MAX_SHORT_TEXT_LENGTH is greater than MAX_NAME_LENGTH", () => {
    expect(MAX_SHORT_TEXT_LENGTH).toBeGreaterThan(MAX_NAME_LENGTH);
  });

  it("MAX_LONG_TEXT_LENGTH is the largest text limit", () => {
    expect(MAX_LONG_TEXT_LENGTH).toBeGreaterThan(MAX_SHORT_TEXT_LENGTH);
  });
});
