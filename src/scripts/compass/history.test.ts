import { describe, expect, it } from "vitest";
import { routeSteps, stepTo, trailAfterPop } from "./history";
import { CLOSED } from "./route";

describe("stepTo", () => {
  it("steps back to the entry a window opened from", () =>
    expect(stepTo(["", "#services", "#services/web"], "#services")).toEqual({
      go: -1,
    }));
  it("walks back home after switching sections, not a second home entry", () =>
    expect(stepTo(["", "#services", "#blog"], "")).toEqual({ go: -2 }));
  it("pushes a hash the trail hasn't seen", () =>
    expect(stepTo(["", "#services"], "#services/web")).toEqual({
      push: true,
    }));
  it("replaces when closing with no home entry behind", () =>
    expect(stepTo(["#services"], "")).toEqual({ replace: true }));
});

describe("trailAfterPop", () => {
  it("Back trims the trail to the entry landed on", () =>
    expect(trailAfterPop(["", "#s", "#s/w"], "#s")).toEqual(["", "#s"]));
  it("Forward grows it again", () =>
    expect(trailAfterPop(["", "#s"], "#s/w")).toEqual(["", "#s", "#s/w"]));
  it("leaves it alone for the entry it already ends on", () =>
    expect(trailAfterPop(["", "#s"], "#s")).toEqual(["", "#s"]));
});

describe("routeSteps", () => {
  it("a project link stands for home, the section, then the window", () =>
    expect(routeSteps({ open: "portfolio", item: "07" })).toEqual([
      "",
      "#portfolio",
      "#portfolio/07",
    ]));
  it("a section link stands for home, then the section", () =>
    expect(routeSteps({ open: "about", item: null })).toEqual(["", "#about"]));
  it("closed is home alone", () => expect(routeSteps(CLOSED)).toEqual([""]));
});
