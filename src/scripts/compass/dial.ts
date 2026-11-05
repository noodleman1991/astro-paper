/** Cell boundaries around the ring, in degrees; eleven cells, one full turn. */
export const DIAL_A = [0, 34, 65, 100, 130, 164, 197, 228, 263, 295, 325, 360];
export const NC = 11;
const SHOWN = 4;

type Step = -1 | 0 | 1;

const wrap = (k: number) => ((k % NC) + NC) % NC;
const at = (k: number) => DIAL_A[wrap(k)] + 360 * Math.floor(k / NC);

/** Ring rotation that centres cells `step`…`step + 3` under the window. */
export const dialAngle = (step: number) =>
  -(270 - (at(step) + at(step + SHOWN)) / 2);

export function cellRole(
  cell: number,
  step: number
): "visible" | "next" | "prev" | "hidden" {
  const rel = wrap(cell - step);
  if (rel < SHOWN) return "visible";
  if (rel === SHOWN) return "next";
  if (rel === NC - 1) return "prev";
  return "hidden";
}

/** 1-based project numbers in the window; the end cell is not a project. */
export const visibleProjects = (step: number) =>
  Array.from({ length: SHOWN }, (_, i) => wrap(step + i))
    .filter(c => c < NC - 1)
    .map(c => c + 1);

export const stepForCell = (cell: number) => cell;

const sign = (v: number): Step => (v > 0 ? 1 : v < 0 ? -1 : 0);

/** One step per gesture: trackpad momentum inside 420 ms is ignored. */
export const wheelStep = (delta: number, now: number, last: number): Step =>
  now - last < 420 || Math.abs(delta) < 8 ? 0 : sign(delta);

export const dragStep = (dx: number, rtl: boolean): Step =>
  Math.abs(dx) <= 40 ? 0 : sign(rtl ? dx : -dx);

export function keyStep(key: string, rtl: boolean): Step {
  if (key === "ArrowDown") return 1;
  if (key === "ArrowUp") return -1;
  if (key === "ArrowRight") return rtl ? -1 : 1;
  if (key === "ArrowLeft") return rtl ? 1 : -1;
  return 0;
}

/** "3–6", or "9–10, 1" where the window wraps past the end cell. */
export function rangeLabel(nums: number[]): string {
  const runs: number[][] = [];
  for (const n of nums) {
    const run = runs[runs.length - 1];
    if (run && n === run[run.length - 1] + 1) run.push(n);
    else runs.push([n]);
  }
  return runs
    .map(r => (r.length > 1 ? `${r[0]}–${r[r.length - 1]}` : `${r[0]}`))
    .join(", ");
}
