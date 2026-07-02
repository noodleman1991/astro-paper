import { describe, expect, it } from "vitest";
import { fmt } from "./format";

describe("fmt", () => {
  it("replaces named placeholders", () => {
    expect(fmt('tag "{tag}"', { tag: "astro" })).toBe('tag "astro"');
    expect(fmt("page {n}", { n: 2 })).toBe("page 2");
  });
  it("replaces missing params with an empty string", () => {
    expect(fmt("hi {name}", {})).toBe("hi ");
  });
});
