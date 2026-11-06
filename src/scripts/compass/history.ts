import { formatHash, type Route } from "./route";

/**
 * The homepage's history is a trail of hash entries it made itself, starting
 * from the bare page (""). Going back to an entry already on the trail keeps
 * history from piling up; a bare entry after hash entries is avoided because
 * the router re-fetches the page when it crosses one.
 */
export type Step = { go: number } | { push: true } | { replace: true };

/** How to reach `hash` from the trail's last entry. */
export function stepTo(trail: string[], hash: string): Step {
  const i = trail.lastIndexOf(hash);
  if (i >= 0 && i < trail.length - 1) return { go: i - (trail.length - 1) };
  return hash ? { push: true } : { replace: true };
}

/** The trail once the browser lands on `hash` (Back, Forward, a typed hash). */
export function trailAfterPop(trail: string[], hash: string): string[] {
  const i = trail.lastIndexOf(hash);
  return i >= 0 ? trail.slice(0, i + 1) : [...trail, hash];
}

/** The entries a deep link stands for: home, the section, then its window. */
export function routeSteps(route: Route): string[] {
  if (!route.open) return [""];
  const section = formatHash({ open: route.open, item: null });
  return route.item ? ["", section, formatHash(route)] : ["", section];
}
