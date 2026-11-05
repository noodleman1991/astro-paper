import { cellRole, stepForCell } from "./dial";
import type { Route, SectionId } from "./route";
import { clampOffset, offsetForTile, type StreamId } from "./stream";

export type Nav = "compass" | "bar";
export type State = {
  open: SectionId | null;
  item: string | null;
  peek: SectionId | null;
  step: number;
  offset: number;
  nav: Nav;
};
export type Action =
  | { type: "toggle"; section: SectionId }
  | { type: "close" }
  | { type: "peek"; section: SectionId | null }
  | { type: "item"; id: string | null }
  | { type: "turn"; by: number }
  | { type: "scroll"; by: number }
  | { type: "offset"; to: number }
  | { type: "nav"; nav: Nav }
  | { type: "route"; route: Route };

export const INITIAL: State = {
  open: null,
  item: null,
  peek: null,
  step: 0,
  offset: 0,
  nav: "compass",
};

const PROJECT_COUNT = 10;
const fresh = { item: null, peek: null, step: 0, offset: 0 };

function route(s: State, r: Route): State {
  const next: State =
    r.open === s.open
      ? { ...s, item: r.item, peek: null }
      : { ...s, ...fresh, open: r.open, item: r.item };
  if (next.open !== "portfolio" || !next.item) return next;
  const n = Number(next.item);
  if (!Number.isInteger(n) || n < 1 || n > PROJECT_COUNT)
    return { ...next, item: null };
  return {
    ...next,
    item: String(n).padStart(2, "0"),
    step:
      cellRole(n - 1, next.step) === "visible" ? next.step : stepForCell(n - 1),
    offset: offsetForTile(`p${n}` as StreamId),
  };
}

export function reduce(s: State, a: Action): State {
  switch (a.type) {
    case "toggle":
      return s.open === a.section
        ? { ...s, ...fresh, open: null }
        : { ...s, ...fresh, open: a.section };
    case "close":
      return { ...s, ...fresh, open: null };
    case "peek":
      return s.open ? s : { ...s, peek: a.section };
    case "item":
      return { ...s, item: a.id };
    case "turn":
      return { ...s, step: s.step + a.by };
    case "scroll":
      return { ...s, offset: clampOffset(s.offset + a.by) };
    case "offset":
      return { ...s, offset: clampOffset(a.to) };
    case "nav":
      return { ...s, ...fresh, open: null, nav: a.nav };
    case "route":
      return route(s, a.route);
  }
}

export const toRoute = (s: State): Route => ({ open: s.open, item: s.item });
