import { describe, expect, it } from "vitest";
import { SERVICES } from "./services";
import { PROJECTS } from "./projects";
import en from "@/i18n/translations/en";
import he from "@/i18n/translations/he";

const leaves = (o: unknown): unknown[] =>
  o && typeof o === "object" ? Object.values(o).flatMap(leaves) : [o];
describe("compass content", () => {
  it("both locales list the same services in the same order", () => {
    expect(SERVICES.he.map(x => [x.id, x.slug])).toEqual(
      SERVICES.en.map(x => [x.id, x.slug])
    );
    expect(SERVICES.en.map(x => x.slug)).toEqual([
      "web-development",
      "app-development",
      "knowledge-hubs",
      "databases",
      "data-tools",
      "ai-integration",
    ]);
  });
  it("every service has a lead and a paragraph", () => {
    for (const x of [...SERVICES.en, ...SERVICES.he]) {
      expect(x.lead).not.toBe("");
      expect(x.paras.length).toBeGreaterThan(0);
    }
  });
  it("ten projects per locale, numbered 1–10", () => {
    for (const l of ["en", "he"] as const)
      expect(PROJECTS[l].map(p => p.n)).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ]);
  });
  it("no compass string is empty in either locale", () => {
    for (const v of [...leaves(en.compass), ...leaves(he.compass)])
      expect(v).not.toBe("");
  });
  it("link chips point at a site path or an https page", () => {
    const links = [
      ...SERVICES.en,
      ...SERVICES.he,
      ...PROJECTS.en,
      ...PROJECTS.he,
      en.compass.how,
      he.compass.how,
    ].flatMap(x => x.links);
    for (const l of links) {
      expect(l.label).not.toBe("");
      if (l.href !== undefined)
        expect(l.href).toMatch(/^(\/[a-z0-9/-]*|https:\/\/\S+)$/);
    }
  });
});
