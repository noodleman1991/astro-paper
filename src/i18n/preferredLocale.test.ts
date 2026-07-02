import { describe, expect, it } from "vitest";
import { preferredLocale } from "./preferredLocale";

describe("preferredLocale", () => {
  it("returns en for missing or empty headers", () => {
    expect(preferredLocale(null)).toBe("en");
    expect(preferredLocale("")).toBe("en");
  });
  it("picks hebrew when it ranks highest", () => {
    expect(preferredLocale("he")).toBe("he");
    expect(preferredLocale("he-IL,he;q=0.9,en;q=0.8")).toBe("he");
  });
  it("picks english when it ranks highest", () => {
    expect(preferredLocale("en-US,en;q=0.9,he;q=0.8")).toBe("en");
  });
  it("falls back to en for unsupported languages", () => {
    expect(preferredLocale("fr-FR,de;q=0.9")).toBe("en");
  });
  it("respects q ordering regardless of position", () => {
    expect(preferredLocale("en;q=0.5,he;q=0.9")).toBe("he");
  });
  it("ignores q=0 entries and garbage q values", () => {
    expect(preferredLocale("he;q=0,en;q=0.5")).toBe("en");
    expect(preferredLocale("he;q=abc,en;q=0.5")).toBe("en");
  });
});
