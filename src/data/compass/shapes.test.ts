import { describe, expect, it } from "vitest";
import { SHAPES, STAGE } from "./shapes";

const paths = (o: unknown): string[] =>
  typeof o === "string" && o.startsWith("M")
    ? [o]
    : o && typeof o === "object"
      ? Object.values(o).flatMap(paths)
      : [];

describe("shapes.json", () => {
  it("every path is absolute M/C/Q/Z with finite numbers", () => {
    for (const d of paths(SHAPES)) {
      expect(d).toMatch(/^M[MCQZ\d.\s-]*$/);
      expect(d).not.toContain("NaN");
    }
  });
  it("the dial has eleven cells over a full turn", () => {
    expect(SHAPES.pf.A).toEqual([
      0, 34, 65, 100, 130, 164, 197, 228, 263, 295, 325, 360,
    ]);
    expect(SHAPES.pf.cells.map(c => c.id)).toEqual([
      "p1",
      "p2",
      "p3",
      "p4",
      "p5",
      "p6",
      "p7",
      "p8",
      "p9",
      "p10",
      "end",
    ]);
  });
  it("every tile has a label box inside its stage", () => {
    for (const [k, s] of Object.entries(SHAPES)) {
      if (!("tiles" in s)) continue;
      const st = k.startsWith("p") ? STAGE.phone : STAGE.desktop;
      for (const t of Object.values(s.tiles)) {
        expect(t.box.cx).toBeGreaterThan(0);
        expect(t.box.cx).toBeLessThan(st.w);
        expect(t.box.cy).toBeGreaterThan(0);
        expect(t.box.cy).toBeLessThan(st.h);
      }
    }
  });
});
