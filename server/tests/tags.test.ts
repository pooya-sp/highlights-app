import { describe, it, expect } from "vitest";
import { normalizeTags } from "../src/utils/tags.js";

// =====================================================================
// Unit tests for normalizeTags — pure function, no database.
// =====================================================================

describe("normalizeTags", () => {
  it("returns an empty array for null/undefined input", () => {
    expect(normalizeTags(null)).toEqual([]);
    expect(normalizeTags(undefined)).toEqual([]);
    expect(normalizeTags("")).toEqual([]);
  });

  it("parses a comma-separated string", () => {
    expect(normalizeTags("tech, design, ai")).toEqual(["tech", "design", "ai"]);
  });

  it("parses an array of tags", () => {
    expect(normalizeTags(["Tech", "AI"])).toEqual(["tech", "ai"]);
  });

  it("lowercases and trims whitespace", () => {
    expect(normalizeTags("  ReactJS ,  FRONTEND ")).toEqual([
      "reactjs",
      "frontend",
    ]);
  });

  it("strips leading # prefixes users like to type", () => {
    expect(normalizeTags("#react, ##nextjs")).toEqual(["react", "nextjs"]);
  });

  it("removes duplicate tags (case-insensitive)", () => {
    expect(normalizeTags("React, react, REACT")).toEqual(["react"]);
  });

  it("drops empty entries from stray commas", () => {
    expect(normalizeTags("a,,b,,,c,")).toEqual(["a", "b", "c"]);
  });

  it("drops tags longer than 30 characters", () => {
    const longTag = "x".repeat(31);
    const okTag = "x".repeat(30);
    expect(normalizeTags(`${longTag},${okTag}`)).toEqual([okTag]);
  });

  it("handles mixed array + weird input safely", () => {
    expect(normalizeTags(["#AI", "ml ", "", "AI"])).toEqual(["ai", "ml"]);
  });
});
