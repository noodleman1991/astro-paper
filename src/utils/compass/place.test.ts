import { describe, expect, it } from "vitest";
import { compassArcs, mirrorMatrix, mirrorPath, placeBox } from "./place";

const web = { cx: 1077, cy: 335, w: 138, h: 138 };
describe("placeBox", () => {
  it("centres a padded box", () =>
    expect(placeBox(web, { rtl: false, stageWidth: 1280, minW: 112 })).toEqual({
      left: 999,
      top: 266,
      width: 156,
      height: 138,
    }));
  it("mirrors about the stage centre", () =>
    expect(placeBox(web, { rtl: true, stageWidth: 1280, minW: 112 })).toEqual({
      left: 125,
      top: 266,
      width: 156,
      height: 138,
    }));
});
describe("compassArcs", () => {
  it("desktop matches the approved board", () =>
    expect(compassArcs("desktop", false)).toEqual({
      blog: "M85.9 156.5 A97 97 0 0 1 200.2 85.1",
      services: "M159.8 85.1 A97 97 0 0 1 274.1 156.5",
      portfolio: "M105.4 268.9 A116 116 0 0 0 254.6 268.9",
    }));
  it("phone matches the approved board", () =>
    expect(compassArcs("phone", false)).toEqual({
      blog: "M69.5 129.9 A83 83 0 0 1 167.3 68.8",
      services: "M132.7 68.8 A83 83 0 0 1 230.5 129.9",
      portfolio: "M85.7 226.6 A100 100 0 0 0 214.3 226.6",
    }));
  it("rtl swaps the top titles and keeps portfolio", () => {
    const l = compassArcs("desktop", false),
      r = compassArcs("desktop", true);
    expect(r).toEqual({
      blog: l.services,
      services: l.blog,
      portfolio: l.portfolio,
    });
  });
});
describe("mirrorMatrix", () => {
  it("reflects about the stage centre line", () =>
    expect(mirrorMatrix(1280)).toBe("matrix(-1 0 0 1 1280 0)"));
});

describe("mirrorPath", () => {
  it("reflects every x of an absolute M/L/C path about the centre line", () =>
    expect(mirrorPath("M10 20C30 40 50 60 70 80L5 5Z", 100)).toBe(
      "M90 20C70 40 50 60 30 80L95 5Z"
    ));
  it("keeps decimals and negative coordinates", () =>
    expect(mirrorPath("M-10 2.5L12.5 -3Z", 390)).toBe("M400 2.5L377.5 -3Z"));
  it("refuses commands it cannot reflect pairwise", () =>
    expect(() => mirrorPath("M0 0H10Z", 100)).toThrow());
});
