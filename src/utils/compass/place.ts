import type { Box } from "@/data/compass/shapes";

/** Label rectangle for a tile box, mirrored about the stage centre in RTL. */
export function placeBox(
  box: Box,
  o: {
    rtl: boolean;
    stageWidth: number;
    minW?: number;
    pad?: number;
    maxW?: number;
  }
): { left: number; top: number; width: number; height: number } {
  const { pad = 18, minW = 120, maxW = Infinity } = o;
  const width = Math.min(Math.max(box.w + pad, minW), maxW);
  const cx = o.rtl ? o.stageWidth - box.cx : box.cx;
  return {
    left: Math.round(cx - width / 2),
    top: Math.round(box.cy - box.h / 2),
    width: Math.round(width),
    height: Math.round(box.h),
  };
}

const n = (v: number) => +v.toFixed(1);

/** SVG arc from `from`° to `to`° (math degrees, y up) around (cx, cy). */
export function titleArc(
  cx: number,
  cy: number,
  r: number,
  from: number,
  to: number,
  sweep: 0 | 1
): string {
  const pt = (a: number) => {
    const t = (a * Math.PI) / 180;
    return `${n(cx + r * Math.cos(t))} ${n(cy - r * Math.sin(t))}`;
  };
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M${pt(from)} A${r} ${r} 0 ${large} ${sweep} ${pt(to)}`;
}

const ARCS = {
  desktop: { c: 180, top: 97, bottom: 116 },
  phone: { c: 150, top: 83, bottom: 100 },
};

/** The seal-style title paths for the compass, in its own box. */
export function compassArcs(
  variant: "desktop" | "phone",
  rtl: boolean
): Record<"blog" | "services" | "portfolio", string> {
  const { c, top, bottom } = ARCS[variant];
  const left = titleArc(c, c, top, 166, 78, 1);
  const right = titleArc(c, c, top, 102, 14, 1);
  return {
    blog: rtl ? right : left,
    services: rtl ? left : right,
    portfolio: titleArc(c, c, bottom, 230, 310, 0),
  };
}

/** Horizontal reflection about the centre line of a stage `stageWidth` wide. */
export const mirrorMatrix = (stageWidth: number) =>
  `matrix(-1 0 0 1 ${stageWidth} 0)`;

/**
 * The same reflection applied to path data, for places a transform can't
 * reach (CSS `clip-path: path()`). Absolute M/L/C/Q/S/T/Z only.
 */
export function mirrorPath(d: string, stageWidth: number): string {
  return d.replace(
    /([A-Za-z])([^A-Za-z]*)/g,
    (_, cmd: string, args: string) => {
      if (!/[MLCQSTZ]/.test(cmd))
        throw new Error(`mirrorPath: ${cmd} unsupported`);
      const nums = args.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
      const out = nums.map((n, i) =>
        i % 2 ? n : String(+(stageWidth - Number(n)).toFixed(3))
      );
      return cmd + out.join(" ");
    }
  );
}
