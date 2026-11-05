import { describe, expect, it } from "vitest";
import {
  STREAM_IDS,
  STREAM_MAX,
  clampOffset,
  offsetForTile,
  streamGeometry,
  streamY,
} from "./stream";

describe("streamGeometry", () => {
  const at0 = streamGeometry(0),
    atMax = streamGeometry(STREAM_MAX);
  it("lays out all eleven tiles", () =>
    expect(Object.keys(at0)).toEqual([...STREAM_IDS]));
  it("starts just under the docked compass", () =>
    expect(at0.p1.d.startsWith("M132 139.7")).toBe(true));
  it("paths are well formed", () => {
    for (const t of Object.values(at0))
      expect(t.d).toMatch(/^(M[\d.\sLQZ-]+Z)?$/);
  });
  it("the flow mapping is monotonic", () => {
    for (let f = -400; f < 1400; f += 7)
      expect(streamY(f + 7, 200)).toBeGreaterThan(streamY(f, 200));
  });
  it("rising tiles shrink and fade their labels", () => {
    const up = streamGeometry(300).p1.label;
    expect(up.scale).toBeLessThan(at0.p1.label.scale);
    expect(up.opacity).toBeLessThan(1);
  });
  it("tiles far above collapse to nothing", () => expect(atMax.p1.d).toBe(""));
  it("the last tile stays above the envelope floor", () => {
    const ys = (atMax.end.d.match(/-?[\d.]+/g) ?? [])
      .map(Number)
      .filter((_, i) => i % 2 === 1);
    expect(Math.max(...ys)).toBeLessThanOrEqual(826);
  });
  it("label scale and opacity stay in bounds", () => {
    for (let o = 0; o <= STREAM_MAX; o += 12)
      for (const t of Object.values(streamGeometry(o))) {
        expect(t.label.scale).toBeGreaterThanOrEqual(0.3);
        expect(t.label.scale).toBeLessThanOrEqual(1);
        expect(t.label.opacity).toBeGreaterThanOrEqual(0);
        expect(t.label.opacity).toBeLessThanOrEqual(1);
      }
  });
  it("offsetForTile brings a tile to mid-screen", () =>
    expect(offsetForTile("p5")).toBeCloseTo(623.2 - 406, 0));
});

describe("clampOffset", () => {
  it("clamps to the stream range", () => {
    expect(clampOffset(-20)).toBe(0);
    expect(clampOffset(900)).toBe(STREAM_MAX);
    expect(clampOffset(120)).toBe(120);
  });
});
