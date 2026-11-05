export const LAYOUT_BREAKPOINT = 768;

export const layoutFor = (width: number): "desktop" | "phone" =>
  width >= LAYOUT_BREAKPOINT ? "desktop" : "phone";

/** Uniform scale that fits a stage into the view, capped at `max`. */
export const fitScale = (
  viewW: number,
  viewH: number,
  stageW: number,
  stageH: number,
  max = 1.25
) => Math.min(viewW / stageW, viewH / stageH, max);
