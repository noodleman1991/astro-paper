import { describe, expect, it } from "vitest";
import {
  cellRole,
  dialAngle,
  dragStep,
  keyStep,
  rangeLabel,
  stepForCell,
  visibleProjects,
  wheelStep,
} from "./dial";

describe("dialAngle", () => {
  it("centres the first four cells in the window", () => {
    expect(dialAngle(0)).toBeCloseTo(-205);
    expect(dialAngle(1)).toBeCloseTo(-171);
  });
  it("wraps by a full turn every eleven steps", () => {
    expect(dialAngle(11)).toBeCloseTo(dialAngle(0) + 360);
    expect(dialAngle(-1)).toBeCloseTo(dialAngle(10) - 360);
  });
});

describe("cellRole", () => {
  it("shows four cells and a sliver each side", () =>
    expect(Array.from({ length: 11 }, (_, k) => cellRole(k, 0))).toEqual([
      "visible",
      "visible",
      "visible",
      "visible",
      "next",
      "hidden",
      "hidden",
      "hidden",
      "hidden",
      "hidden",
      "prev",
    ]));
  it("wraps for negative and large steps", () => {
    expect(cellRole(10, -1)).toBe("visible");
    expect(cellRole(0, 23)).toBe("prev");
    expect(cellRole(6, 23)).toBe("hidden");
    expect(cellRole(1, 23)).toBe("visible");
  });
});

describe("visibleProjects", () => {
  it("skips the end cell", () =>
    expect(visibleProjects(8)).toEqual([9, 10, 1]));
  it("starts with the first four", () =>
    expect(visibleProjects(0)).toEqual([1, 2, 3, 4]));
});

describe("stepForCell", () => {
  it("is the cell index", () => expect(stepForCell(6)).toBe(6));
});

describe("wheelStep", () => {
  it("ignores events inside the 420 ms window", () => {
    expect(wheelStep(30, 1000, 0)).toBe(1);
    expect(wheelStep(30, 1200, 1000)).toBe(0);
    expect(wheelStep(4, 2000, 0)).toBe(0);
    expect(wheelStep(-30, 2000, 0)).toBe(-1);
  });
});

describe("dragStep", () => {
  it("needs more than 40 px and follows reading direction", () => {
    expect(dragStep(-60, false)).toBe(1);
    expect(dragStep(-60, true)).toBe(-1);
    expect(dragStep(60, true)).toBe(1);
    expect(dragStep(30, false)).toBe(0);
    expect(dragStep(-40, false)).toBe(0);
  });
});

describe("keyStep", () => {
  it("maps arrows by direction", () => {
    expect(keyStep("ArrowRight", false)).toBe(1);
    expect(keyStep("ArrowDown", false)).toBe(1);
    expect(keyStep("ArrowLeft", false)).toBe(-1);
    expect(keyStep("ArrowLeft", true)).toBe(1);
    expect(keyStep("ArrowRight", true)).toBe(-1);
    expect(keyStep("ArrowUp", true)).toBe(-1);
    expect(keyStep("Enter", false)).toBe(0);
  });
});

describe("rangeLabel", () => {
  it("joins consecutive numbers", () =>
    expect(rangeLabel([3, 4, 5, 6])).toBe("3–6"));
  it("splits where the dial wraps", () => {
    expect(rangeLabel([9, 10, 1])).toBe("9–10, 1");
    expect(rangeLabel([10, 1, 2])).toBe("10, 1–2");
  });
  it("handles a single project", () => expect(rangeLabel([7])).toBe("7"));
});
