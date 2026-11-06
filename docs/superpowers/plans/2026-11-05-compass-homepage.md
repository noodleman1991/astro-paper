# Compass Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 2×2 homepage with the compass: slices that grow into their sections, a portfolio dial on desktop and a stream on phone, windows for details, in English and a mirrored Hebrew layout.

**Architecture:**
- The approved shapes are static data (`shapes.json`), rendered as inline SVG by pure `.astro` components on two fixed-size stages (desktop 1280 × 800, phone 390 × 844). Each stage is scaled uniformly to the viewport.
- All behaviour lives in one vanilla TS controller. The controller is a pure reducer (`state.ts`) plus a thin DOM layer that toggles classes, CSS variables and `<dialog>`s.
- The only runtime geometry is the phone stream (`stream.ts`).

**Tech Stack:** Astro 7.4.5 (installed), TypeScript strict, TailwindCSS 4, Vitest 4, native `<dialog>`, SVG.

**Spec:** `docs/superpowers/specs/2026-11-05-compass-nav-design.md`. Reference folder: `docs/superpowers/specs/2026-11-05-compass-nav/` (`shapes.json`, `phone-stream.mjs`, `boards/*.dc.html`, `screens/*.png`).

## Global Constraints

- **Astro:** the installed version is 7.4.5. Verify every Astro API you use (`astro:assets` `Font`, `ClientRouter` lifecycle events, `redirects`) against `node_modules/astro`, not memory or older docs.
- **No framework runtime and no new dependencies.** Pure `.astro` components plus vanilla TS in `src/scripts/compass/`.
- **No `console.*`** (ESLint error). Never mention AI, assistants or bots in code, comments, commits or PR text. No `Co-Authored-By` lines.
- **Before every commit:** `pnpm run lint`, `pnpm run format:check` and `pnpm test` must pass.
- **Commits:** conventional (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`). Stage only the files the task lists, and never `git add -A`. Never commit `package.json`, `pnpm-lock.yaml` or `src/data/blog/knowledge-trees.md` unless the owner says so.
- **Port, don't redraw.** Shapes come only from `shapes.json`. Markup, class names and CSS come from `boards/Main.dc.html` (desktop) and `boards/Phone.dc.html` (phone).
  - Board holes (`{{…}}`) become static values or controller-set classes.
  - Board colour names map to site tokens: `--bg` → `--background`, `--fg` → `--foreground`.
  - Board font stacks map to the `astro:assets` variables (`var(--font-mclaren)`, `var(--font-chicle)`, `var(--font-google-sans-code)`), with Hebrew mates `var(--font-fredoka)` and `var(--font-assistant)`.
- **Copy:** lowercase for decorative text. English copy is exactly as in the boards. Hebrew copy is written by the implementer and reviewed by the owner at the checkpoint (Task 8).
- **Motion values** (spec §4.7):
  - grow `1.15s cubic-bezier(.2,.9,.28,1)`; close about `.7s`;
  - dial step `.85s`; label stagger `70ms` from `.8s`; ants and sparkles at about `1s`.
  - `prefers-reduced-motion: reduce` removes the grow, the dial turn and the stream momentum.
- **Layout breakpoint:** the phone stage applies below 768 px wide; desktop at 768 px and above.
- **Accessibility:**
  - WCAG 2.1 AA; visible focus everywhere.
  - Real `<button>`/`<a>` for every control; SVG art is `aria-hidden="true"`.
  - Dialogs return focus to their opener.

## Review Focus

1. **Rapid clicks across slices mid-animation.** Open services, then blog, then portfolio within a second: the page must end with only portfolio open, nothing half-grown. *Test: Task 4 `reduce` "rapid toggles end on the last section"; manual check in Task 7.*
2. **Deep links and Back/Forward.** Loading `/#portfolio/07` opens the dial with project 7 visible and its window open. Back closes the window, Back again closes the section, Forward reopens both. *Test: Task 4 `reduce` "route to an off-dial project turns the dial to it" and `parseHash` cases; manual check in Task 10.*
3. **Trackpad momentum on the dial.** One two-finger flick fires dozens of wheel events; it must turn exactly one step. *Test: Task 4 `wheelStep` "ignores events inside the 420 ms window".*
4. **Crossing the 768 px breakpoint with a section open** (rotating a tablet, resizing a window). The same section must stay open in the other stage, with nothing stuck invisible. *Manual check in Task 12, step "resize across 768 px".*
5. **View-transition navigation away and back.** Go home → a post → Back, three times: one click still toggles exactly once (no duplicated listeners), and the hash state restores. *Manual check in Task 7, step "ClientRouter round trip".*

---

### Task 0: Pre-flight (owner)

- [ ] **Step 1: Confirm the base.** The working tree carries the owner's uncommitted Astro 7.4.5 upgrade (`package.json`, `pnpm-lock.yaml`), and every task builds on it. Ask the owner to commit it, or confirm it may stay uncommitted while this work proceeds. Do not commit it yourself.
- [ ] **Step 2: Commit the design docs** (`docs/superpowers/specs/2026-11-05-compass-nav-design.md`, `docs/superpowers/specs/2026-11-05-compass-nav/**`, this plan, and the `docs/**` ignore in `eslint.config.js`) once the owner approves.

```bash
git add docs/superpowers/specs/2026-11-05-compass-nav-design.md docs/superpowers/specs/2026-11-05-compass-nav docs/superpowers/plans/2026-11-05-compass-homepage.md eslint.config.js
git commit -m "docs: compass homepage design, reference shapes and plan"
```

---

### Task 1: Tokens, tint ladder and contrast guard

**Files:**
- Modify: `src/styles/global.css` (the light/dark token blocks near lines 18–32)
- Create: `src/utils/compass/tints.ts`, `src/utils/compass/contrast.ts`
- Test: `src/utils/compass/tints.test.ts`

**Interfaces:**
- Produces:
  - `type Theme = "light" | "dark"`, `type Tint = "k1" | "k2" | "k3" | "k4" | "khot"`, `type SpotId = "portfolio" | "services" | "blog" | "about"`.
  - `SPOTS: Record<SpotId, string>`, `THEME: Record<Theme, { bg: string; fg: string; soft: string }>`, `TINTS: Record<Theme, Record<Tint, number>>`.
  - `mixHex(spot: string, bg: string, percent: number): [number, number, number]` is an sRGB-space mix, matching CSS `color-mix(in srgb, spot P%, bg)`.
  - `contrastRatio(a: string | [number, number, number], b: string | [number, number, number]): number` follows WCAG 2.1.
  - CSS custom properties: `--soft`, `--k1 … --khot` (per theme), `--spot-portfolio`, `--spot-services`, `--spot-blog`, `--spot-about`.

- [ ] **Step 1: Write the failing test**

```ts
// src/utils/compass/tints.test.ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrastRatio, mixHex } from "./contrast";
import { SPOTS, THEME, TINTS, type Theme, type Tint } from "./tints";

const themes: Theme[] = ["light", "dark"];
const tints: Tint[] = ["k1", "k2", "k3", "k4", "khot"];

describe("contrastRatio", () => {
  it("matches WCAG for black on white", () => expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1));
  it("mixes like color-mix in srgb", () =>
    expect(contrastRatio(mixHex(SPOTS.services, THEME.light.bg, 52), THEME.light.fg)).toBeCloseTo(11.01, 1));
});

describe("tile tints meet AA", () => {
  for (const theme of themes)
    for (const [spot, hex] of Object.entries(SPOTS))
      for (const tint of tints) {
        const bg = mixHex(hex, THEME[theme].bg, TINTS[theme][tint]);
        it(`${theme} ${spot} ${tint}: fg ≥ 4.5`, () => expect(contrastRatio(bg, THEME[theme].fg)).toBeGreaterThanOrEqual(4.5));
        if (tint !== "khot")
          it(`${theme} ${spot} ${tint}: soft ≥ 4.5`, () => expect(contrastRatio(bg, THEME[theme].soft)).toBeGreaterThanOrEqual(4.5));
      }
});

describe("global.css carries the same ladder", () => {
  const css = readFileSync(new URL("../../styles/global.css", import.meta.url), "utf8");
  const block = (sel: string) => css.slice(css.indexOf(sel), css.indexOf("}", css.indexOf(sel)));
  it.each(themes)("%s", theme => {
    const b = block(theme === "light" ? 'html[data-theme="light"]' : 'html[data-theme="dark"]');
    for (const tint of tints) expect(b).toContain(`--${tint}: ${TINTS[theme][tint]}%;`);
  });
});
```

- [ ] **Step 2: Run it.** Run: `pnpm test src/utils/compass/tints.test.ts`. Expected: FAIL, because the modules don't exist yet.
- [ ] **Step 3: Implement.**
  - **Values:** `TINTS.light = { k1: 20, k2: 30, k3: 40, k4: 52, khot: 72 }`, `TINTS.dark = { k1: 12, k2: 16, k3: 20, k4: 25, khot: 36 }`. `THEME.light = { bg: "#fdfdfd", fg: "#282728", soft: "#4a494a" }`, `THEME.dark = { bg: "#212737", fg: "#eaedf3", soft: "#c3c8d4" }`. `SPOTS = { portfolio: "#e8837c", services: "#a0c4f4", blog: "#a0e8b4", about: "#f4a0b5" }`.
  - **CSS:** add `--soft` and `--k1…--khot` inside the existing `:root, html[data-theme="light"]` and `html[data-theme="dark"]` blocks, and the four `--spot-*` in `:root`.
- [ ] **Step 4: Run it.** Run: `pnpm test src/utils/compass/tints.test.ts`. Expected: PASS (light 72% soft is excluded by design: hot tiles switch secondary text to fg).
- [ ] **Step 5: Commit.**

```bash
git add src/styles/global.css src/utils/compass/tints.ts src/utils/compass/contrast.ts src/utils/compass/tints.test.ts
git commit -m "feat: compass tint ladder with a contrast guard for both themes"
```

---

### Task 2: Shape data and placement helpers

**Files:**
- Create: `src/data/compass/shapes.json` (copy of `docs/superpowers/specs/2026-11-05-compass-nav/shapes.json`), `src/data/compass/shapes.ts`, `src/utils/compass/place.ts`
- Test: `src/data/compass/shapes.test.ts`, `src/utils/compass/place.test.ts`

**Interfaces:**
- Produces:
  - `Box = { cx: number; cy: number; w: number; h: number }`, `ShapeTile = { d: string; box: Box }`.
  - `SpillShape = { pour: string; origin: [number, number]; tiles: Record<string, ShapeTile>; sparks: string }`.
  - `DialShape = { pour: string; clip: string; A: number[]; cells: { id: string; d: string; box: Box; mid: number }[]; sparks: string }`.
  - `SHAPES: { sv, bl, ab, psv, pbl, pab: SpillShape; pf: DialShape; ppf: { pour: string } }`.
  - `STAGE = { desktop: { w: 1280, h: 800 }, phone: { w: 390, h: 844 } } as const`.
  - `placeBox(box: Box, o: { rtl: boolean; stageWidth: number; minW?: number; pad?: number; maxW?: number }): { left: number; top: number; width: number; height: number }`. Width is `min(max(box.w + pad, minW), maxW)` (defaults `pad = 18`, `minW = 120`, `maxW = Infinity`), centred on `cx` (mirrored to `stageWidth − cx` when `rtl`), with values rounded.
  - `titleArc(cx: number, cy: number, r: number, from: number, to: number, sweep: 0 | 1): string` works in math degrees (y up), with coordinates to one decimal.
  - `compassArcs(variant: "desktop" | "phone", rtl: boolean): Record<"blog" | "services" | "portfolio", string>`.
    - Desktop: centre 180, top r 97 (blog 166→78, services 102→14), bottom r 116 (230→310, sweep 0).
    - Phone: centre 150, top r 83, bottom r 100.
    - RTL swaps the top two.
  - `mirrorMatrix(stageWidth: number): string` returns `"matrix(-1 0 0 1 W 0)"`.

- [ ] **Step 1: Write the failing tests**

```ts
// src/data/compass/shapes.test.ts
import { describe, expect, it } from "vitest";
import { SHAPES, STAGE } from "./shapes";

const paths = (o: unknown): string[] =>
  typeof o === "string" && o.startsWith("M") ? [o] : o && typeof o === "object" ? Object.values(o).flatMap(paths) : [];

describe("shapes.json", () => {
  it("every path is absolute M/C/Q/Z with finite numbers", () => {
    for (const d of paths(SHAPES)) {
      expect(d).toMatch(/^M[MCQZ\d.\s-]*$/);
      expect(d).not.toContain("NaN");
    }
  });
  it("the dial has eleven cells over a full turn", () => {
    expect(SHAPES.pf.A).toEqual([0, 34, 65, 100, 130, 164, 197, 228, 263, 295, 325, 360]);
    expect(SHAPES.pf.cells.map(c => c.id)).toEqual(["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10", "end"]);
  });
  it("every tile has a label box inside its stage", () => {
    for (const [k, s] of Object.entries(SHAPES)) {
      if (!("tiles" in s)) continue;
      const st = k.startsWith("p") ? STAGE.phone : STAGE.desktop;
      for (const t of Object.values(s.tiles)) {
        expect(t.box.cx).toBeGreaterThan(0); expect(t.box.cx).toBeLessThan(st.w);
        expect(t.box.cy).toBeGreaterThan(0); expect(t.box.cy).toBeLessThan(st.h);
      }
    }
  });
});
```

```ts
// src/utils/compass/place.test.ts
import { describe, expect, it } from "vitest";
import { compassArcs, placeBox } from "./place";

const web = { cx: 1077, cy: 335, w: 138, h: 138 };
describe("placeBox", () => {
  it("centres a padded box", () =>
    expect(placeBox(web, { rtl: false, stageWidth: 1280, minW: 112 })).toEqual({ left: 999, top: 266, width: 156, height: 138 }));
  it("mirrors about the stage centre", () =>
    expect(placeBox(web, { rtl: true, stageWidth: 1280, minW: 112 })).toEqual({ left: 125, top: 266, width: 156, height: 138 }));
});
describe("compassArcs", () => {
  it("desktop matches the approved board", () =>
    expect(compassArcs("desktop", false)).toEqual({
      blog: "M85.9 156.5 A97 97 0 0 1 200.2 85.1",
      services: "M159.8 85.1 A97 97 0 0 1 274.1 156.5",
      portfolio: "M105.4 268.9 A116 116 0 0 0 254.6 268.9",
    }));
  it("phone matches the approved board", () =>
    expect(compassArcs("phone", false)).toEqual({
      blog: "M69.5 129.9 A83 83 0 0 1 167.3 68.8",
      services: "M132.7 68.8 A83 83 0 0 1 230.5 129.9",
      portfolio: "M85.7 226.6 A100 100 0 0 0 214.3 226.6",
    }));
  it("rtl swaps the top titles and keeps portfolio", () => {
    const l = compassArcs("desktop", false), r = compassArcs("desktop", true);
    expect(r).toEqual({ blog: l.services, services: l.blog, portfolio: l.portfolio });
  });
});
```

- [ ] **Step 2: Run them.** Run: `pnpm test src/data/compass src/utils/compass/place.test.ts`. Expected: FAIL, because the modules don't exist yet.
- [ ] **Step 3: Implement** `shapes.ts` (typed re-export of the JSON) and `place.ts` with the signatures above.
- [ ] **Step 4: Run them.** Same command. Expected: PASS.
- [ ] **Step 5: Commit.**

```bash
git add src/data/compass src/utils/compass/place.ts src/utils/compass/place.test.ts
git commit -m "feat: compass shape data and placement helpers"
```

---

### Task 3: Phone stream geometry

**Files:**
- Create: `src/scripts/compass/stream.ts`
- Test: `src/scripts/compass/stream.test.ts`

**Interfaces:**
- Produces:
  - `STREAM_IDS = ["p1", …, "p10", "end"] as const`, `type StreamId`, `STREAM_MAX = 636`.
  - `clampOffset(v: number): number` clamps to [0, 636].
  - `streamY(flow: number, offset: number): number` uses the neck compression from `phone-stream.mjs`: `Yt = 76`, `E0 = 90`.
  - `streamGeometry(offset: number): Record<StreamId, StreamTile>`, where `StreamTile = { d: string; center: number; label: { x: number; y: number; width: number; scale: number; opacity: number } }`.
  - `offsetForTile(id: StreamId): number` is `clampOffset(center − 406)`.

Port `PhoneStream.pfGeo` from `docs/superpowers/specs/2026-11-05-compass-nav/phone-stream.mjs` verbatim in behaviour: the same rows, radii, gap `G = 6`, samples `M = 6`, inner edges `L = 138 − 118·ease`, `R = 252 + 118·ease`. Return numbers instead of the CSS string; `fc` becomes `center`.

- [ ] **Step 1: Write the failing test**

```ts
const at0 = streamGeometry(0), atMax = streamGeometry(STREAM_MAX);
it("lays out all eleven tiles", () => expect(Object.keys(at0)).toEqual([...STREAM_IDS]));
it("starts just under the docked compass", () => expect(at0.p1.d.startsWith("M132 139.7")).toBe(true));
it("paths are well formed", () => { for (const t of Object.values(at0)) expect(t.d).toMatch(/^(M[\d.\sLQZ-]+Z)?$/); });
it("the flow mapping is monotonic", () => { for (let f = -400; f < 1400; f += 7) expect(streamY(f + 7, 200)).toBeGreaterThan(streamY(f, 200)); });
it("rising tiles shrink and fade their labels", () => {
  const up = streamGeometry(300).p1.label;
  expect(up.scale).toBeLessThan(at0.p1.label.scale);
  expect(up.opacity).toBeLessThan(1);
});
it("tiles far above collapse to nothing", () => expect(atMax.p1.d).toBe(""));
it("the last tile stays above the envelope floor", () => {
  const ys = (atMax.end.d.match(/-?[\d.]+/g) ?? []).map(Number).filter((_, i) => i % 2 === 1);
  expect(Math.max(...ys)).toBeLessThanOrEqual(826);
});
it("label scale and opacity stay in bounds", () => {
  for (let o = 0; o <= STREAM_MAX; o += 12)
    for (const t of Object.values(streamGeometry(o))) {
      expect(t.label.scale).toBeGreaterThanOrEqual(0.3); expect(t.label.scale).toBeLessThanOrEqual(1);
      expect(t.label.opacity).toBeGreaterThanOrEqual(0); expect(t.label.opacity).toBeLessThanOrEqual(1);
    }
});
it("offsetForTile brings a tile to mid-screen", () => expect(offsetForTile("p5")).toBeCloseTo(623.2 - 406, 0));
```

- [ ] **Step 2: Run it.** Run: `pnpm test src/scripts/compass/stream.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the port.
- [ ] **Step 4: Run it.** Run: `pnpm test src/scripts/compass`. Expected: PASS.
- [ ] **Step 5: Commit.**

```bash
git add src/scripts/compass/stream.ts src/scripts/compass/stream.test.ts
git commit -m "feat: phone portfolio stream geometry"
```

---

### Task 4: Pure state — route, dial, stage fit and reducer

**Files:**
- Create: `src/scripts/compass/route.ts`, `dial.ts`, `stage.ts`, `state.ts`
- Test: `src/scripts/compass/route.test.ts`, `dial.test.ts`, `stage.test.ts`, `state.test.ts`

**Interfaces:**
- Consumes: `clampOffset`, `offsetForTile` (Task 3).
- Produces:
  - **`route.ts`**
    - `type SectionId = "services" | "blog" | "portfolio" | "about"`, `type Route = { open: SectionId | null; item: string | null }`, `CLOSED: Route`.
    - `parseHash(hash: string): Route` reads `#section` or `#section/item`. Unknown or empty input gives `CLOSED`. Items are URI-decoded.
    - `formatHash(r: Route): string` returns `""` when closed.
  - **`dial.ts`**
    - `DIAL_A` (the 12 angles), `NC = 11`.
    - `dialAngle(step: number): number` is `−(270 − (Aat(step) + Aat(step + 4)) / 2)`, where `Aat(k) = DIAL_A[wrap(k)] + 360·floor(k / 11)`.
    - `cellRole(cell: number, step: number): "visible" | "next" | "prev" | "hidden"`, with `rel = wrap(cell − step)`: 0–3 visible, 4 next, 10 prev.
    - `visibleProjects(step: number): number[]` returns 1-based project numbers and excludes the end cell.
    - `stepForCell(cell: number): number` is `cell`.
    - `wheelStep(delta: number, now: number, last: number): -1 | 0 | 1`: 0 when `now − last < 420` or `|delta| < 8`.
    - `dragStep(dx: number, rtl: boolean): -1 | 0 | 1` is 0 when `|dx| ≤ 40`. LTR: `dx < 0` → 1. RTL: `dx > 0` → 1.
    - `keyStep(key: string, rtl: boolean): -1 | 0 | 1`. LTR: `ArrowRight`/`ArrowDown` → 1 and `ArrowLeft`/`ArrowUp` → −1. RTL: `ArrowLeft`/`ArrowDown` → 1 and `ArrowRight`/`ArrowUp` → −1.
  - **`stage.ts`**
    - `LAYOUT_BREAKPOINT = 768`, `layoutFor(width: number): "desktop" | "phone"`.
    - `fitScale(viewW: number, viewH: number, stageW: number, stageH: number, max = 1.25): number` is `min(viewW / stageW, viewH / stageH, max)`.
  - **`state.ts`**
    - `type Nav = "compass" | "bar"`.
    - `type State = { open: SectionId | null; item: string | null; peek: SectionId | null; step: number; offset: number; nav: Nav }`, `INITIAL`.
    - `type Action = { type: "toggle"; section: SectionId } | { type: "close" } | { type: "peek"; section: SectionId | null } | { type: "item"; id: string | null } | { type: "turn"; by: number } | { type: "scroll"; by: number } | { type: "offset"; to: number } | { type: "nav"; nav: Nav } | { type: "route"; route: Route }`.
    - `reduce(s: State, a: Action): State`, `toRoute(s: State): Route`.

Reducer rules:
- **`toggle`:** the same section closes it. Another section opens it with `item = null`, `peek = null`, `step = 0`, `offset = 0`.
- **`peek`:** only applies while nothing is open.
- **`item`:** sets the item and never moves the dial.
- **`turn`:** adds to the step, unbounded.
- **`scroll` / `offset`:** clamp with `clampOffset`.
- **`nav`:** closes everything.
- **`route`:**
  - It applies `open` and `item`, resetting `step` and `offset` when `open` changes.
  - For a portfolio item `nn` whose cell `nn − 1` isn't visible, it sets `step = stepForCell(nn − 1)`.
  - For any portfolio item it sets `offset = offsetForTile("p" + Number(nn))`.

- [ ] **Step 1: Write the failing tests** (the assertions that pin the spec; add more cases for the rules above in the same style)

```ts
// dial.test.ts
expect(dialAngle(0)).toBeCloseTo(-205);
expect(dialAngle(1)).toBeCloseTo(-171);
expect(dialAngle(11)).toBeCloseTo(dialAngle(0) + 360);
expect(Array.from({ length: 11 }, (_, k) => cellRole(k, 0))).toEqual(
  ["visible", "visible", "visible", "visible", "next", "hidden", "hidden", "hidden", "hidden", "hidden", "prev"]);
expect(visibleProjects(8)).toEqual([9, 10, 1]); // cells 8, 9, 10(end), 0
it("ignores events inside the 420 ms window", () => {
  expect(wheelStep(30, 1000, 0)).toBe(1);
  expect(wheelStep(30, 1200, 1000)).toBe(0);
  expect(wheelStep(4, 2000, 0)).toBe(0);
  expect(wheelStep(-30, 2000, 0)).toBe(-1);
});
expect(dragStep(-60, false)).toBe(1); expect(dragStep(-60, true)).toBe(-1); expect(dragStep(30, false)).toBe(0);
expect(keyStep("ArrowRight", false)).toBe(1); expect(keyStep("ArrowLeft", true)).toBe(1); expect(keyStep("Enter", false)).toBe(0);

// route.test.ts
expect(parseHash("#services/knowledge-hubs")).toEqual({ open: "services", item: "knowledge-hubs" });
expect(parseHash("#portfolio/07")).toEqual({ open: "portfolio", item: "07" });
expect(parseHash("#nope")).toEqual(CLOSED); expect(parseHash("")).toEqual(CLOSED); expect(parseHash("#")).toEqual(CLOSED);
expect(formatHash({ open: "about", item: "how" })).toBe("#about/how"); expect(formatHash(CLOSED)).toBe("");

// stage.test.ts
expect(fitScale(1440, 900, 1280, 800)).toBeCloseTo(1.125);
expect(fitScale(1280, 600, 1280, 800)).toBeCloseTo(0.75);
expect(fitScale(2560, 1600, 1280, 800)).toBe(1.25);
expect(layoutFor(767)).toBe("phone"); expect(layoutFor(768)).toBe("desktop");

// state.test.ts
it("rapid toggles end on the last section", () => {
  const s = [{ type: "toggle", section: "services" }, { type: "toggle", section: "blog" }, { type: "toggle", section: "portfolio" }]
    .reduce((st, a) => reduce(st, a as Action), INITIAL);
  expect(s).toMatchObject({ open: "portfolio", item: null, step: 0, offset: 0 });
});
it("toggling the open section closes it", () =>
  expect(reduce(reduce(INITIAL, { type: "toggle", section: "blog" }), { type: "toggle", section: "blog" }).open).toBeNull());
it("peek is ignored while a section is open", () =>
  expect(reduce(reduce(INITIAL, { type: "toggle", section: "blog" }), { type: "peek", section: "services" }).peek).toBeNull());
it("route to an off-dial project turns the dial to it", () =>
  expect(reduce(INITIAL, { type: "route", route: { open: "portfolio", item: "07" } })).toMatchObject({ open: "portfolio", item: "07", step: 6 }));
it("route to a visible project keeps the dial still", () => {
  const s = reduce(INITIAL, { type: "toggle", section: "portfolio" });
  expect(reduce(s, { type: "route", route: { open: "portfolio", item: "02" } }).step).toBe(0);
});
it("scroll clamps to the stream", () => {
  expect(reduce(INITIAL, { type: "scroll", by: -50 }).offset).toBe(0);
  expect(reduce(INITIAL, { type: "scroll", by: 9999 }).offset).toBe(636);
});
```

- [ ] **Step 2: Run them.** Run: `pnpm test src/scripts/compass`. Expected: FAIL, because the modules don't exist yet.
- [ ] **Step 3: Implement** the four modules with the signatures and rules above. They contain no DOM access.
- [ ] **Step 4: Run them.** Run: `pnpm test src/scripts/compass`. Expected: PASS.
- [ ] **Step 5: Commit.**

```bash
git add src/scripts/compass/route.ts src/scripts/compass/dial.ts src/scripts/compass/stage.ts src/scripts/compass/state.ts src/scripts/compass/*.test.ts
git commit -m "feat: compass state, routing and dial maths"
```

---

### Task 5: Content and copy

**Files:**
- Modify: `src/config/services.ts`, `src/i18n/translations/en.ts`, `src/i18n/translations/he.ts`
- Create: `src/config/projects.ts`
- Test: `src/config/content.test.ts`

**Interfaces:**
- Produces:
  - `Service` gains `id: "web" | "app" | "hubs" | "db" | "data" | "ai"`, `slug: string`, `lead: string`, `paras: string[]` and `links: string[]`. Slugs are English in both locales: `web-development`, `app-development`, `knowledge-hubs`, `databases`, `data-tools`, `ai-integration`.
  - `Project = { n: number; title: string; tag: string; lead: string; paras: string[]; links: string[] }`, `PROJECTS: Record<Locale, Project[]>`.
  - Translation keys under `compass`:
    - `titles.{blog,services,portfolio}`, `logoAria`, `close`, `closeAbout`, `hint.{desktop,phone}`.
    - `side.{services,blog,portfolio}` (three lines each).
    - `blog.{read,allPosts,allPostsSub}`, `about.{hi,intro,motto,mottoSub,photo,how,howSub,sayHi,mail,linkedin}`.
    - `how.{title,lead,paras,links}`, `win.{services,portfolio,about,closeWin,next,ctaService,ctaProject,ctaAbout}`.
    - `dial.{status,end,endSub,sayHi}`, `top.{share,copyLink,copied,emailCopied}`, `drawer.{title,write,share,copy,dark,light,plain,compass}`, `plain.{pick,sections}`.

English values are exactly the board copy:
- the SERVICES, PROJECTS and ABOUT objects in the logic class of `boards/Main.dc.html`;
- the side notes and hints in its markup.

Projects are the board's ten placeholders, with tags `web, hubs, apps, data, AI, web, databases, hubs, apps, data`. `dial.status` is `"projects {from}–{to} of 10"`. Hebrew values are full translations, marked for owner review in the Task 8 checkpoint.

- [ ] **Step 1: Write the failing test**

```ts
// src/config/content.test.ts
import { describe, expect, it } from "vitest";
import { SERVICES } from "./services";
import { PROJECTS } from "./projects";
import en from "@/i18n/translations/en";
import he from "@/i18n/translations/he";

const leaves = (o: unknown): unknown[] => (o && typeof o === "object" ? Object.values(o).flatMap(leaves) : [o]);
describe("compass content", () => {
  it("both locales list the same services in the same order", () => {
    expect(SERVICES.he.map(x => [x.id, x.slug])).toEqual(SERVICES.en.map(x => [x.id, x.slug]));
    expect(SERVICES.en.map(x => x.slug)).toEqual(["web-development", "app-development", "knowledge-hubs", "databases", "data-tools", "ai-integration"]);
  });
  it("every service has a lead and a paragraph", () => {
    for (const x of [...SERVICES.en, ...SERVICES.he]) { expect(x.lead).not.toBe(""); expect(x.paras.length).toBeGreaterThan(0); }
  });
  it("ten projects per locale, numbered 1–10", () => {
    for (const l of ["en", "he"] as const) expect(PROJECTS[l].map(p => p.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
  it("no compass string is empty in either locale", () => {
    for (const v of [...leaves(en.compass), ...leaves(he.compass)]) expect(v).not.toBe("");
  });
});
```
- [ ] **Step 2: Run it.** Run: `pnpm test src/config/content.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the data and the copy.
- [ ] **Step 4: Run it.** Run: `pnpm test`. Expected: PASS. Then run `pnpm run sync` and `pnpm exec astro check`. Expected: 0 errors; existing consumers of `SERVICES` still type-check.
- [ ] **Step 5: Commit.**

```bash
git add src/config/services.ts src/config/projects.ts src/config/content.test.ts src/i18n/translations/en.ts src/i18n/translations/he.ts
git commit -m "feat: compass content for services, projects and about"
```

---

### Task 6: Desktop stage — compass and services, static

**Files:**
- Create:
  - `src/components/compass/CompassHome.astro`
  - `src/components/compass/Compass.astro`
  - `src/components/compass/SpillArt.astro`
  - `src/components/compass/ServicesSection.astro`
  - `src/styles/compass.css`
- Modify: `src/pages/_shared/HomePage.astro` (render `<CompassHome>` in place of the grid; drop its grid `<style>`)
- Delete: `src/components/home/HeroBlock.astro`, `ServicesBlock.astro`, `BlogBlock.astro`, `PortfolioBlock.astro`, after `grep -rn "components/home" src` shows HomePage was their only importer.

**Interfaces:**
- Consumes: `SHAPES`, `STAGE`, `placeBox`, `compassArcs`, `mirrorMatrix` (Task 2); `SERVICES` (Task 5); `useTranslations`, `localeDir` (`src/i18n`).
- Produces:
  - `CompassHome` props: `{ locale: Locale; posts: CollectionEntry<"blog">[] }`.
  - `Compass` props: `{ locale: Locale; variant: "desktop" | "phone" }`.
  - `SpillArt` props: `{ shape: SpillShape; tiles: { key: string; tint: "k2" | "k3" | "k4"; hero?: boolean; still?: boolean; win?: string; href?: string }[]; stage: { w: number; h: number }; rtl: boolean }`.
  - `ServicesSection` props: `{ locale: Locale; variant: "desktop" | "phone" }`.

DOM contract, used by every later task:
- **Root:** `<div class="compass-home" data-compass data-dir="ltr|rtl">`. An inline script sets `data-js` on it first.
- **Stages:** `<div class="stage" data-stage="desktop|phone">`, each 1280 × 800 or 390 × 844, scaled by `--k`.
- **Slice controls:** `[data-toggle="services|blog|portfolio|about"]` on the wedge `<path>`, the transparent arc-title `<button>` and the logo `<button>`. Buttons carry `aria-expanded` and `aria-controls`.
- **Regions:** `<section data-region="services|blog|portfolio|about" class="cp-region r-sv|r-bl|r-pf|r-ab" aria-label>`.
- **Window openers:** `[data-win="services/<slug>" | "portfolio/<nn>" | "about/how"]` on the tile `<path>` and its label `<button>`.

Port from `boards/Main.dc.html`:
- the `<defs>` (`#cp-rough`, `#cp-wobble`, `#cp-dots`);
- the compass SVG and buttons;
- the services region (pour, tiles with tints `web: k4 hero, hubs: k3, ai: k3, db/app/data: k2`, ants, sparks, labels, side note);
- every `.cp-*` CSS rule, into `compass.css`, plus one rule the board lacks: on hot (hovered or active) tiles, secondary text (`.s`, dates) uses `var(--foreground)`, which keeps it AA (Task 1).

The arcs come from `compassArcs`. Labels are positioned with `placeBox(tile.box, { rtl, stageWidth: 1280, minW: 112 })` and titles sized `w < 96 → 18px, w < 150 → 20px, else 23px`. Leave the RTL art transform for Task 15, but call `placeBox` with `rtl` now.

- [ ] **Step 1: Build.** Run: `pnpm run build`. Expected: success; `dist/index.html` contains `data-region="services"` and six `data-win="services/` openers.
- [ ] **Step 2: Look.** Run `pnpm run dev`, open http://localhost:4321/ at 1280 × 800, and add `is-pinned` to `[data-region=services]` in devtools. Expected: it matches `screens/desktop-03-services.png` (shapes, tints, labels, side note), and the idle page matches `screens/desktop-01-idle.png`.
- [ ] **Step 3: Commit.**

```bash
git add src/components/compass src/styles/compass.css src/pages/_shared/HomePage.astro src/components/home
git commit -m "feat: compass homepage desktop stage with the services spill"
```

---

### Task 7: Controller and windows (first working section)

**Files:**
- Create: `src/scripts/compass/controller.ts`, `src/components/compass/DetailWindows.astro`
- Modify: `src/components/compass/CompassHome.astro` (mount the windows; `<script>` importing the controller), `src/styles/compass.css` (window styles from `.cp-win` / `.cp-scrim` in the board)

**Interfaces:**
- Consumes: `reduce`, `INITIAL`, `toRoute`, `parseHash`, `formatHash`, `fitScale`, `layoutFor` (Task 4).
- Produces:
  - `initCompass(root: HTMLElement): () => void` returns a cleanup that removes every listener.
  - `DetailWindows` props: `{ locale: Locale }`. It renders one `<dialog class="cp-win" data-item="services/<slug>" aria-labelledby>` per service, project and `about/how`. Each contains the kicker, title, lead, paras, link chips, CTA, and "next →" (projects only; links to the next project's hash).

Behaviour:
- **Delegated clicks:** `[data-toggle]` dispatches `toggle`; `[data-win]` dispatches `item`. Hover and focus on the desktop wedges and titles dispatch `peek`.
- **Rendering state:**
  - Each region gets `is-pinned` when open and `is-peek` when peeked; titles get `is-pinned`; buttons get `aria-expanded`.
  - The matching dialog gets `showModal()`, and the others `close()`.
- **History:**
  - Every user-initiated change pushes `formatHash(toRoute(state))`, using `history.replaceState` when the hash is unchanged.
  - `popstate` and initial load dispatch `route` from `parseHash(location.hash)`.
  - A dialog's `close` event dispatches `{ type: "item", id: null }`.
  - Esc with no dialog open dispatches `close`.
- **Lifecycle and scaling:**
  - Init on `astro:page-load`; clean up on `astro:before-swap`.
  - A `ResizeObserver` on the root sets `--k = fitScale(innerWidth, innerHeight − topBarHeight, stageW, stageH)` on each stage, and the stage wrapper's height in px.
- **Variety per visit:** a random `seed` (1–999) on `#cp-rough feTurbulence`, sparkle `rotate(±12°)`, ants `stroke-dashoffset` (0–64), and a shuffled label stagger order.

- [ ] **Step 1: Build.** Run: `pnpm run build`. Expected: success, with 17 `<dialog` elements in `dist/index.html`.
- [ ] **Step 2: Manual check, desktop**, at http://localhost:4321/:
  - Hovering services peeks.
  - A click grows it in 1.15 s; clicking again, or on its title ×, closes it.
  - Clicking "web development" opens its window, with focus inside. Esc closes it and focus returns.
  - The URL goes `#services` → `#services/web-development`. Back closes the window, Back closes the section, Forward reopens it.
  - Loading `/#services/knowledge-hubs` cold opens both.
  - Clicking services, blog and portfolio inside one second ends with nothing stuck (blog and portfolio are inert until Tasks 9–10, so check the services class is removed).
- [ ] **Step 3: ClientRouter round trip.** Go home → a post → Back, three times. One click still toggles exactly once, and an open `#services` restores.
- [ ] **Step 4: Commit.**

```bash
git add src/scripts/compass/controller.ts src/components/compass/DetailWindows.astro src/components/compass/CompassHome.astro src/styles/compass.css
git commit -m "feat: compass controller, deep links and detail windows"
```

---

### Task 8: Checkpoint — owner looks in a browser

- [ ] **Step 1:** Run `pnpm run dev` and ask the owner to try desktop services at http://localhost:4321/: the peek, the grow, the window, Back/Forward, and dark mode (the new darker dark-mode tints). Ask them to review the Hebrew copy added in Task 5.
- [ ] **Step 2:** Apply their feedback as `fix:` commits before Task 9. If the feedback changes the spec, update the spec in the same commit.

---

### Task 9: Blog spill and about halo

**Files:**
- Create: `src/components/compass/BlogSection.astro`, `src/components/compass/AboutSection.astro`
- Modify: `src/components/compass/CompassHome.astro`, `src/styles/compass.css`

**Interfaces:**
- Consumes: `SpillArt`, `placeBox` (Tasks 2, 6); posts (the `CompassHome` prop, sorted with `getSortedPosts`, first two).
- Produces:
  - `BlogSection` props: `{ locale: Locale; variant: "desktop" | "phone"; posts: CollectionEntry<"blog">[] }`.
  - `AboutSection` props: `{ locale: Locale; variant: "desktop" | "phone" }`.

Port the blog and about regions from `boards/Main.dc.html`:
- **Blog tiles:** `k1` hero (k4 tint) holds the latest post (date badge, title, "read →", linking to the post); `w1` (k3) holds the post before it; `all` (k2) links to `localePath(locale, "/posts")`.
- **About:** `intro`, `photo` (k4 hero; the dashed placeholder stays until the owner supplies a photo) and `say` are still tiles; `how` opens `about/how`.
- **Close badge:** the about × badge (`.cp-x`) dispatches `close`.

- [ ] **Step 1: Build.** Run: `pnpm run build`. Expected: success; `dist/index.html` links the two newest posts.
- [ ] **Step 2: Manual check.** Each section matches `screens/desktop-05-blog.png` and `desktop-06-about.png`. Blog tiles navigate to the posts. "how i work" opens its window at `#about/how`. The about × closes it.
- [ ] **Step 3: Commit.**

```bash
git add src/components/compass/BlogSection.astro src/components/compass/AboutSection.astro src/components/compass/CompassHome.astro src/styles/compass.css
git commit -m "feat: blog spill and about halo on the compass"
```

---

### Task 10: Portfolio dial (desktop)

**Files:**
- Create: `src/components/compass/PortfolioDial.astro`
- Modify: `src/scripts/compass/controller.ts`, `src/components/compass/CompassHome.astro`, `src/styles/compass.css`

**Interfaces:**
- Consumes: `dialAngle`, `cellRole`, `visibleProjects`, `wheelStep`, `dragStep`, `keyStep` (Task 4); `SHAPES.pf`; `PROJECTS` (Task 5).
- Produces:
  - `PortfolioDial` props: `{ locale: Locale }`.
  - DOM:
    - `[data-dial]` on the region; `[data-cell="0".."10"]` on each tile path and each label.
    - A polite live region `[data-dial-status]`.
    - CSS variables `--ring` (SVG ring angle) and `--turn` (HTML label layer angle; `−ring` in RTL).

Port the portfolio region from `boards/Main.dc.html`:
- clip path `#pf-win` and the `pf-ring` group;
- `pf-lbls`/`pf-turn` labels (one line, 17 px, `nowrap`, width `max(box.w + 36, 140)`);
- end cell "that's the lot / say hi";
- side note.

The CSS rotates via `var(--ring)` and `var(--turn)`. The closed state adds `48deg`.

Controller additions:
- **Cell roles:** after each render, every cell gets `is-out` (hidden) or `is-peek` (next/prev slivers). Hidden labels get `inert`.
- **Inputs:**
  - A click on a peek sliver dispatches `turn` (+1 for next, −1 for prev).
  - Wheel goes through `wheelStep`, with the last time kept on the controller.
  - Pointer drag goes through `dragStep`. After a drag, suppress the click for 300 ms. Set `user-select: none` on the region.
  - Keys go through `keyStep` while focus is inside the region.
- **Status:** the live region text is `dial.status` filled from `visibleProjects`.

- [ ] **Step 1: Build.** Run: `pnpm run build`. Expected: success.
- [ ] **Step 2: Manual check.**
  - It matches `screens/desktop-07-portfolio-dial.png`.
  - The right sliver turns one step forward (`desktop-08-dial-turned.png`), and the left one turns back.
  - One trackpad flick turns exactly one step.
  - A drag of more than 40 px turns, and never opens a project.
  - Arrows turn it; a screen reader announces "projects 2–5 of 10".
  - `/#portfolio/07` cold-loads with project 7 visible and its window open; "next →" walks to 08.
- [ ] **Step 3: Commit.**

```bash
git add src/components/compass/PortfolioDial.astro src/scripts/compass/controller.ts src/components/compass/CompassHome.astro src/styles/compass.css
git commit -m "feat: portfolio dial that turns by scroll, drag, keys and edge slivers"
```

---

### Task 11: Top bar, share and the phone contact drawer

**Files:**
- Create: `src/components/compass/TopBar.astro`, `src/components/compass/ContactDrawer.astro`
- Modify: `src/pages/_shared/HomePage.astro` (`<TopBar>` replaces `<Header>` on the homepage only), `src/scripts/compass/controller.ts`, `src/styles/compass.css`

**Interfaces:**
- Consumes: `LanguageToggle.astro`; `SOCIALS` (`src/constants.ts`); `#theme-btn`, which `src/scripts/theme.ts` already wires (keep exactly one per page).
- Produces:
  - `TopBar` props: `{ locale: Locale }`, root `[data-topbar]`. The controller reads its height.
  - `ContactDrawer` props: `{ locale: Locale }`, root `[data-drawer]`, openers `[data-drawer-open]`.

Port the desktop top bar and the share popover (`.cp-pop`) from `boards/Main.dc.html`, and the phone top chrome and drawer (`.ph-drawer`) from `boards/Phone.dc.html` (`screens/phone-08-drawer.png`).
- The top bar holds the name, email (a `mailto:` link; a click also copies, then shows "copied ✓" for 1.6 s), LinkedIn, share, language and theme.
- Share uses `navigator.share` when present, else the copy-link popover.
- On phones the drawer holds the email, LinkedIn, "write me a message" (`mailto:`), share, copy link, language, theme and "plain menu".

- [ ] **Step 1: Build.** Run: `pnpm run build`. Expected: success; `dist/index.html` has exactly one `id="theme-btn"`.
- [ ] **Step 2: Manual check.**
  - Email copy shows "copied ✓".
  - Share works on desktop Safari and Chrome.
  - The theme toggles and persists.
  - The language switches to `/he/`.
  - The drawer opens and closes with focus trapped, and Esc closes it.
- [ ] **Step 3: Commit.**

```bash
git add src/components/compass/TopBar.astro src/components/compass/ContactDrawer.astro src/pages/_shared/HomePage.astro src/scripts/compass/controller.ts src/styles/compass.css
git commit -m "feat: compass top bar, share popover and phone contact drawer"
```

---

### Task 12: Phone stage — docking and spills

**Files:**
- Modify:
  - `src/components/compass/CompassHome.astro` (add `data-stage="phone"`)
  - `Compass.astro`, `ServicesSection.astro`, `BlogSection.astro`, `AboutSection.astro` (`variant="phone"` branches using `SHAPES.psv/pbl/pab`)
  - `src/styles/compass.css`, `src/scripts/compass/controller.ts`

**Interfaces:**
- Consumes: `layoutFor`, `fitScale` (Task 4).
- Produces: the phone stage. Controller state is shared by both stages, so the active stage just mirrors it.

Port from `boards/Phone.dc.html`:
- the docking transforms: scale 0.72, with docked centres services (58, 786), blog (332, 786), portfolio (195, 38) and about (195, 800);
- the phone spill regions and label sizes (`w < 80 → 16px, w < 130 → 18px, else 21px`), with labels placed by `placeBox(box, { rtl, stageWidth: 390, minW: 96, pad: 12, maxW: 360 })`;
- the phone windows as bottom sheets (a media query on the same dialogs).

Below 768 px show only the phone stage, and at 768 px and above only the desktop stage. The hidden stage is `display: none`.

- [ ] **Step 1: Build.** Run: `pnpm run build`. Expected: success.
- [ ] **Step 2: Manual check** at 390 × 844 in devtools.
  - Idle matches `screens/phone-01-idle.png`; services, blog and about match `phone-02/03/04`.
  - The compass docks opposite each spill.
  - A project window is a bottom sheet (`phone-09-window.png`).
  - **Resize across 768 px:** with services open, drag the viewport from 1000 px to 500 px and back. The same section stays open on each stage, with nothing invisible and no console errors.
- [ ] **Step 3: Commit.**

```bash
git add src/components/compass src/styles/compass.css src/scripts/compass/controller.ts
git commit -m "feat: compass phone stage with docking and spills"
```

---

### Task 13: Phone portfolio stream

**Files:**
- Create: `src/components/compass/PortfolioStream.astro`
- Modify: `src/scripts/compass/controller.ts`, `src/components/compass/CompassHome.astro`, `src/styles/compass.css`

**Interfaces:**
- Consumes: `streamGeometry`, `clampOffset`, `offsetForTile`, `STREAM_IDS` (Task 3); `SHAPES.ppf`; `PROJECTS`.
- Produces:
  - `PortfolioStream` props: `{ locale: Locale }`.
  - DOM: `[data-stream]` region, `path[data-tile="<id>"]`, `[data-tile-label="<id>"]`. The server renders `streamGeometry(0)`.

Markup ports the board's phone portfolio section: envelope pour, `#ppf-win` clip, ants, and labels clipped with `clip-path: path(envelope)`. Title sizes `w < 135 → 16px, < 155 → 17.5px, else 19px` use the board's `pfW` widths.

Controller additions:
- **Rendering:** on any `offset` change, write each tile's `d` and each label's `left`, `top`, `width`, `transform: translate(-50%, -50%) scale(s)`, `opacity`, and `pointer-events` (`auto` only above 0.6 opacity). Writes are batched in one `requestAnimationFrame`.
- **Scrolling:**
  - Wheel dispatches `scroll` by `deltaY` (×32 for line mode).
  - Pointer drag: capture once moved more than 6 px, then dispatch `scroll`. Elements inside the stream get `touch-action: none`.
  - Momentum: velocity × 0.94 per frame until under 0.4. A drag suppresses the click for 250 ms.
  - Keys: ArrowDown/PageDown glide +200, ArrowUp/PageUp −200, over 420 ms ease-out cubic.
  - Focusing a label glides to `offsetForTile`.
- **Reduced motion:** no momentum, and glides jump.

- [ ] **Step 1: Build.** Run: `pnpm run build`. Expected: success.
- [ ] **Step 2: Manual check** at 390 × 844, and on a real phone if possible.
  - It matches `screens/phone-05-portfolio-stream.png`; after scrolling, `phone-06-stream-scrolled.png`.
  - The envelope never moves.
  - Rising tiles narrow and flatten into the neck.
  - A tap opens the project; a drag never does.
  - A swipe coasts.
  - It keeps 60 fps in the devtools performance panel with 4× CPU throttling. If it doesn't, drop the `#cp-rough` filter from the tile group while it moves, and record that in the commit message.
- [ ] **Step 3: Commit.**

```bash
git add src/components/compass/PortfolioStream.astro src/scripts/compass/controller.ts src/components/compass/CompassHome.astro src/styles/compass.css
git commit -m "feat: phone portfolio stream inside a still envelope"
```

---

### Task 14: Phone plain menu

**Files:**
- Create: `src/components/compass/PlainMenu.astro`
- Modify: `src/scripts/compass/controller.ts`, `src/components/compass/CompassHome.astro`, `src/styles/compass.css`

**Interfaces:**
- Consumes: the `{ type: "nav" }` action (Task 4).
- Produces:
  - `PlainMenu` props: `{ locale: Locale }`, which renders the bottom tab bar `nav.ph-tabs`, the plain home intro and the paper plugs.
  - `[data-nav-toggle]` on the ring × (`.ph-hide`), the ring icon in the bar, and the drawer's "plain menu" button.

Port `.ph-tabs`, `.ph-plug` and the plain intro from `boards/Phone.dc.html` (`screens/phone-07-plain-menu.png`):
- The bar is 72 px at the bottom: portfolio, services, blog and about with colour dots, plus the ring icon.
- Each plug is a paper disc (r 96) with a dotted ring (r 104) and the section name, at the docked centre.

The nav choice persists in `localStorage["compass-nav"]` (read in try/catch; default `"compass"`).

- [ ] **Step 1: Build.** Run: `pnpm run build`. Expected: success.
- [ ] **Step 2: Manual check.**
  - × on the ring swaps in the bar.
  - Tabs open sections from their plugs.
  - The ring icon restores the compass.
  - A reload keeps the choice, and a private window falls back to the compass.
- [ ] **Step 3: Commit.**

```bash
git add src/components/compass/PlainMenu.astro src/scripts/compass/controller.ts src/components/compass/CompassHome.astro src/styles/compass.css
git commit -m "feat: phone plain menu with paper plugs"
```

---

### Task 15: Hebrew mirrored layout

**Files:**
- Modify: every `src/components/compass/*.astro` that draws art; `src/scripts/compass/controller.ts`; `src/styles/compass.css`
- Test: `src/scripts/compass/dial.test.ts` (add the RTL label-layer case)

**Interfaces:**
- Consumes: `mirrorMatrix`, `placeBox`, `compassArcs` (Task 2); `dragStep`, `keyStep`, `dialAngle` (Task 4).
- Produces: on `data-dir="rtl"`, all art groups and the compass wedge group get `transform={mirrorMatrix(stageW)}`.
  - The compass mirrors inside its 360 or 300 box, and arc titles use `compassArcs(variant, true)`; they aren't transformed.
  - Labels use `placeBox(..., { rtl: true })`.
  - Compass title buttons mirror their `left`, and their `--r` flips sign.
  - Phone docks swap services and blog.
  - The dial's `--turn` is `−--ring`.
  - The stream's labels use `x′ = 390 − x`; its paths sit inside the mirrored group.

- [ ] **Step 1: Write the failing test.** Add `it("rtl label layer turns the other way", () => expect(labelLayerAngle(dialAngle(1), true)).toBeCloseTo(171))` and export `labelLayerAngle(ring: number, rtl: boolean): number` from `src/scripts/compass/dial.ts`. Also run Task 4's `dragStep`/`keyStep` RTL cases.
- [ ] **Step 2: Run it.** Run: `pnpm test src/scripts/compass/dial.test.ts`. Expected: FAIL on `labelLayerAngle`.
- [ ] **Step 3: Implement** the mirroring as listed above.
- [ ] **Step 4: Run it.** Run: `pnpm test`. Expected: PASS. Then `pnpm run build`.
- [ ] **Step 5: Manual check** of http://localhost:4321/he/ on desktop and phone.
  - The layout is the mirror image of the English one: blog upper-right, services upper-left.
  - Text reads normally, and the Hebrew arc titles are legible in Chrome and Safari. If Safari breaks `textPath` with RTL text, fall back to a `<text>` per title with `transform="rotate()"`, and record that in the commit message.
  - Project 01 sits at the right end of the dial, and ← turns forward.
  - Services docks bottom-right and blog bottom-left.
- [ ] **Step 6: Commit.**

```bash
git add src/components/compass src/scripts/compass src/utils/compass src/styles/compass.css
git commit -m "feat: mirrored compass layout for hebrew"
```

---

### Task 16: Fallbacks, about redirect and final verification

**Files:**
- Modify:
  - `src/components/compass/CompassHome.astro`, `src/styles/compass.css` (no-JS and reduced motion)
  - `src/components/Header.astro` (About → `localePath(locale, "/#about")`)
  - `astro.config.ts` (`redirects`: `"/about" → "/#about"`, `"/he/about" → "/he/#about"`)
- Delete: `src/pages/about.md`, `src/pages/he/about.md`, `src/layouts/AboutLayout.astro`, after `grep -rn AboutLayout src` shows no other users.

- [ ] **Step 1: No-JS.**
  - Without `data-js`, hide both stages and show a plain fallback: the four sections as headed lists of anchors (`#services`, `#blog`, `#portfolio`, `#about`).
  - Dialogs render inline as articles (`dialog { display: block; position: static }` under `:not([data-js])`).
  - Check with JavaScript disabled in devtools: everything is readable and every link works.
- [ ] **Step 2: Reduced motion.** With `prefers-reduced-motion: reduce` emulated, sections appear without growing, the dial steps without turning, and the stream doesn't coast.
- [ ] **Step 3: Redirects.** Run: `pnpm run build`. Expected: `dist/about/index.html` and `dist/he/about/index.html` redirect to the hash URLs. Verify Astro 7's `redirects` handles a hash destination in static output; if it doesn't, keep the two pages as minimal `<meta http-equiv="refresh">` pages instead.
- [ ] **Step 4: Full check.** Run: `pnpm run lint && pnpm run format:check && pnpm test && pnpm run build`. Expected: all pass.
- [ ] **Step 5: Lighthouse.** Run `pnpm run preview` and Chrome DevTools Lighthouse, mobile and desktop, on `/` and `/he/`. Expected: 100 in Performance, Accessibility, Best Practices and SEO. Fix regressions before committing.
- [ ] **Step 6: Commit.**

```bash
git add src/components/compass/CompassHome.astro src/styles/compass.css src/components/Header.astro astro.config.ts src/pages/about.md src/pages/he/about.md src/layouts/AboutLayout.astro
git commit -m "feat: compass no-js and reduced-motion fallbacks, about lives on the compass"
```
