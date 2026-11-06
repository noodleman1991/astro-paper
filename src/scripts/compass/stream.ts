/*
 * Phone portfolio stream. The envelope stays still; each tile is laid out in
 * flow space and mapped into it, so a tile narrows and flattens as it rises
 * into the neck under the docked compass and opens to full width further down.
 */

export const STREAM_IDS = [
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
] as const;
export type StreamId = (typeof STREAM_IDS)[number];
export const STREAM_MAX = 636;

export type StreamTile = {
  d: string;
  center: number;
  label: {
    x: number;
    y: number;
    width: number;
    scale: number;
    opacity: number;
  };
};

type Pt = [number, number];
type Edge = (t: number) => Pt;
type Row = [number, StreamId, StreamId | null, number];

/** Rows in flow space: top, left tile, right tile, split position. */
const ROWS: Row[] = [
  [50, "p1", "p2", 0.44],
  [282, "p3", "p4", 0.6],
  [510, "p5", "p6", 0.4],
  [740, "p7", "p8", 0.56],
  [968, "p9", "p10", 0.46],
  [1196, "end", null, 0],
];
const FLOOR = 1376;
const RAD = [
  [10, 12, 30, 16],
  [24, 12, 14, 32],
  [12, 30, 18, 14],
  [30, 14, 12, 24],
  [14, 22, 34, 12],
  [36, 40, 40, 30],
];

const YT = 76;
const E0 = 90;
const G = 6;
const M = 6;

export const clampOffset = (v: number) => Math.max(0, Math.min(STREAM_MAX, v));

/** Screen y of flow position `flow`, compressed exponentially into the neck. */
export function streamY(flow: number, offset: number): number {
  const e = flow - offset;
  return e >= E0 ? YT + e : YT + E0 * Math.exp((e - E0) / E0);
}

const flowAt = (y: number, offset: number) => {
  const e = y - YT;
  return (e >= E0 ? e : E0 + E0 * Math.log(Math.max(e, 0.01) / E0)) + offset;
};

const ease = (y: number) => {
  const t = Math.max(0, Math.min(1, (y - 76) / 224));
  return (1 - Math.cos(Math.PI * t)) / 2;
};
const edgeL = (y: number) => 138 - 118 * ease(y);
const edgeR = (y: number) => 252 + 118 * ease(y);
const X = (y: number, v: number) => edgeL(y) + (edgeR(y) - edgeL(y)) * v;
const q = (n: number) => Math.round(n * 10) / 10;

const seam = (k: number) => (v: number) =>
  (k < ROWS.length ? ROWS[k][0] : FLOOR) +
  (k === 0 ? 0 : 12 * Math.sin(Math.PI * (1.1 + 0.2 * (k % 2)) * v + k));

function tile(
  offset: number,
  sT: (v: number) => number,
  sB: (v: number) => number,
  vLf: (f: number) => number,
  vRf: (f: number) => number,
  rad: number[]
): StreamTile {
  const Y = (f: number) => streamY(f, offset);
  const F = (y: number) => flowAt(y, offset);
  const vlT = vLf(sT(0.5));
  const vrT = vRf(sT(0.5));
  const vlB = vLf(sB(0.5));
  const vrB = vRf(sB(0.5));
  const top: Edge = t => {
    const v = vlT + (vrT - vlT) * t;
    const y = Y(sT(v)) + G;
    return [X(y, vlT) + G + (X(y, vrT) - X(y, vlT) - 2 * G) * t, y];
  };
  const btm: Edge = t => {
    const v = vrB + (vlB - vrB) * t;
    const y = Y(sB(v)) - G;
    return [X(y, vrB) - G + (X(y, vlB) - X(y, vrB) + 2 * G) * t, y];
  };
  const yTR = top(1)[1];
  const yBR = btm(0)[1];
  const yBL = btm(1)[1];
  const yTL = top(0)[1];
  const right: Edge = t => {
    const y = yTR + (yBR - yTR) * t;
    return [X(y, vRf(F(y))) - G, y];
  };
  const left: Edge = t => {
    const y = yBL + (yTL - yBL) * t;
    return [X(y, vLf(F(y))) + G, y];
  };
  const h = Math.min(yBL - yTL, yBR - yTR);
  const wT = top(1)[0] - top(0)[0];
  const wB = btm(0)[0] - btm(1)[0];
  const vm = (vlT + vrT) / 2;
  const fT = sT(vm);
  const fB = sB(vm);
  const ym = (Y(fT) + Y(fB)) / 2;
  const vL = vLf(F(ym));
  const vR = vRf(F(ym));
  const wFull = 350 * (vR - vL) - 2 * G;
  const wNow = X(ym, vR) - X(ym, vL) - 2 * G;
  const scale = Math.max(
    0.3,
    Math.min(1, (Y(fB) - Y(fT) - 2 * G) / (fB - fT - 2 * G), wNow / wFull)
  );
  const opacity = Math.max(0, Math.min(1, (scale - 0.55) / 0.3));

  let d = "";
  if (h >= 12 && yTL < 860) {
    const lim = Math.max(0, Math.min(h, wT, wB) / 2 - 1);
    const r = rad.map(x => Math.min(x, lim));
    const lens = [wT, h, wB, h];
    const edges = [top, right, btm, left];
    // each edge is sampled between its corner radii; a corner is a quadratic
    // curve through the edge's end point to the next edge's first sample
    const runs = edges.map((e, i) => {
      const a = r[i] / lens[i];
      const b = 1 - r[(i + 1) % 4] / lens[i];
      return {
        pts: Array.from({ length: M + 1 }, (_, j) => e(a + ((b - a) * j) / M)),
        corner: e(1),
      };
    });
    const p = (pt: Pt) => `${q(pt[0])} ${q(pt[1])}`;
    d = "M" + p(runs[0].pts[0]);
    runs.forEach((run, i) => {
      for (const pt of run.pts.slice(1)) d += "L" + p(pt);
      d += "Q" + p(run.corner) + " " + p(runs[(i + 1) % 4].pts[0]);
    });
    d += "Z";
  }
  const lw = Math.max(96, Math.min(330, wFull - 8));
  return {
    d,
    center: (fT + fB) / 2,
    label: {
      x: q(X(ym, (vL + vR) / 2)),
      y: q(ym),
      width: q(lw),
      scale: +scale.toFixed(3),
      opacity: +opacity.toFixed(2),
    },
  };
}

/** Every stream tile's path and label placement at scroll `offset`. */
export function streamGeometry(offset: number): Record<StreamId, StreamTile> {
  const out = {} as Record<StreamId, StreamTile>;
  ROWS.forEach(([top, a, b, sv], k) => {
    const split = (f: number) =>
      sv + 0.04 * Math.sin((Math.PI * (f - top)) / 220 + k);
    const one = () => 0;
    const all = () => 1;
    if (!b) {
      out[a] = tile(offset, seam(k), seam(k + 1), one, all, RAD[k]);
    } else {
      out[a] = tile(offset, seam(k), seam(k + 1), one, split, RAD[k]);
      out[b] = tile(offset, seam(k), seam(k + 1), split, all, RAD[(k + 2) % 5]);
    }
  });
  return out;
}

const CENTERS = streamGeometry(0);

/** The offset that brings tile `id` to the middle of the envelope. */
export const offsetForTile = (id: StreamId) =>
  clampOffset(CENTERS[id].center - 406);
