import { describe, expect, it } from "vitest";
import { CLOSED, formatHash, parseHash } from "./route";

describe("parseHash", () => {
  it("reads section and item", () => {
    expect(parseHash("#services/knowledge-hubs")).toEqual({
      open: "services",
      item: "knowledge-hubs",
    });
    expect(parseHash("#portfolio/07")).toEqual({
      open: "portfolio",
      item: "07",
    });
    expect(parseHash("#blog")).toEqual({ open: "blog", item: null });
  });
  it("treats unknown, empty and malformed input as closed", () => {
    expect(parseHash("#nope")).toEqual(CLOSED);
    expect(parseHash("")).toEqual(CLOSED);
    expect(parseHash("#")).toEqual(CLOSED);
    expect(parseHash("#about/%E0")).toEqual(CLOSED);
  });
  it("decodes items and drops an empty one", () => {
    expect(parseHash("#services/a%20b")).toEqual({
      open: "services",
      item: "a b",
    });
    expect(parseHash("#services/")).toEqual({ open: "services", item: null });
  });
});

describe("formatHash", () => {
  it("writes section and item", () => {
    expect(formatHash({ open: "about", item: "how" })).toBe("#about/how");
    expect(formatHash({ open: "blog", item: null })).toBe("#blog");
    expect(formatHash(CLOSED)).toBe("");
  });
  it("round-trips through parseHash", () =>
    expect(parseHash(formatHash({ open: "services", item: "a b" }))).toEqual({
      open: "services",
      item: "a b",
    }));
});
