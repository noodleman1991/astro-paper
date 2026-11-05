import { describe, expect, it } from "vitest";
import { postDate } from "./date";

const d = new Date("2026-03-23T22:30:00Z"); // already the 24th in Jerusalem

describe("postDate", () => {
  it("is lowercase day, short month and year in English", () =>
    expect(postDate(d, "en", "Asia/Jerusalem")).toBe("24 mar 2026"));
  it("can drop the year", () =>
    expect(postDate(d, "en", "Asia/Jerusalem", false)).toBe("24 mar"));
  it("uses the Hebrew month name", () =>
    expect(postDate(d, "he", "Asia/Jerusalem")).toBe("24 במרץ 2026"));
});
