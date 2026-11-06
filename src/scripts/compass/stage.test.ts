import { describe, expect, it } from "vitest";
import { fitScale, layoutFor } from "./stage";

describe("fitScale", () => {
  it("fits the tighter axis and caps the scale", () => {
    expect(fitScale(1440, 900, 1280, 800)).toBeCloseTo(1.125);
    expect(fitScale(1280, 600, 1280, 800)).toBeCloseTo(0.75);
    expect(fitScale(2560, 1600, 1280, 800)).toBe(1.25);
  });
});

describe("layoutFor", () => {
  it("switches at 768 px", () => {
    expect(layoutFor(767)).toBe("phone");
    expect(layoutFor(768)).toBe("desktop");
  });
});
