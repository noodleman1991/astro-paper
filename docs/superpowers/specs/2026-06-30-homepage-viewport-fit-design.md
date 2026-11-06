# Design: Homepage fits the viewport + smart header + polish

## Context

The homepage composes four animated blocks in a 2×2 grid (Hero, Services,
Blog, Portfolio). Today the grid uses fixed `380px` auto-rows and the header
sits in-flow consuming vertical space, so the four blocks do not all fit on
screen at load — the user must scroll. The owner wants the homepage to read as
a single, complete composition: all four blocks visible on load on tablet/desktop,
with the header and footer kept out of that initial view to maximize space.

Alongside the layout change, three smaller polish items: a smart auto-hiding
header, correct icon/text alignment in the hero socials (notably LinkedIn), and
a smoother post-open view transition.

Decisions captured from brainstorming:
- **Mobile:** all four fit the viewport on tablet+ (≥768px); phones keep a
  readable stacked, scrollable layout (no crushing).
- **Header:** hidden at the top and on page load; slides in only on scroll-up
  after scrolling down; phases back out at the top. Applies site-wide (fixed).
- **Fit target:** the 2×2 grid fills the full dynamic viewport (`100dvh`).
- **Post animation:** tune the existing title morph's timing/easing (no new
  content animation).

This builds on the prior pass (shared easing tokens `--ease-out-soft` /
`--ease-in-out-soft`, reduced-motion guards, listener-cleanup patterns), which
this design reuses.

---

## 1. Smart auto-hiding header (site-wide)

`src/components/Header.astro`

- Header becomes `position: fixed; top: 0` and no longer consumes layout height
  (this is what frees the homepage's full viewport).
- A translate-based show/hide: a `data-hidden` state translates the header off
  the top (`translateY(-100%)`), transitioning with `--ease-out-soft`.
- Scroll logic (small `data-astro-rerun` inline script, RAF-throttled, cleaned
  up on `astro:before-swap` — same hardened pattern as BackToTopButton):
  - At top (scrollY ≤ threshold ≈ header height): **hidden**. This covers page
    load — no flash, no header over the blocks.
  - Scrolling down past the threshold: **hidden**.
  - Scrolling up while past the threshold: **shown**.
  - Returning to the top: **hidden** again (phase-out).
- `prefers-reduced-motion`: no slide transition (instant state change); the
  show/hide logic still works, just without the animated translate.
- Because the header is fixed, interior pages (posts, tags, about) need top
  padding equal to the header height **only when the header is shown** — but
  since the header overlays content, the simplest robust approach is a small
  top offset on in-flow page content via the layout wrapper. The homepage grid
  is `100dvh` and starts at the very top (header hidden), so it needs no offset.
  Interior pages add `scroll-padding-top`/content offset so a shown header never
  hides the first line. Exact mechanism finalized in the plan; keep it minimal.

**Open consideration (resolve in plan):** ensure the skip-to-content link and
mobile menu toggle still work with the fixed header. The mobile menu expands the
header in place today; verify the fixed header still accommodates the expanded
menu (it should, since fixed elements can grow downward).

## 2. Homepage grid fills the viewport

`src/pages/index.astro`

- **≥768px:** `.home-grid` → `height: 100dvh`, `grid-template-columns: 1fr 1fr`,
  `grid-template-rows: 1fr 1fr`. The 2×2 fills the dynamic viewport exactly; all
  four blocks visible at load. Replace the fixed `380px` auto-rows.
- **<768px (phone):** stacked single column, blocks keep a readable height via
  `grid-auto-rows: minmax(15rem, auto)` (tune value); page scrolls. No 100dvh
  cramming on phones.
- `main.home-layout` drops its vertical margin (`my-8`) on the homepage so the
  grid can reach the viewport edges; keep horizontal padding. Interior layouts
  unaffected.
- Account for the grid `gap` (1.25rem) in the row math so two rows + gap still
  equal the viewport without overflow (use `gap` + `1fr` rows; the grid handles
  this, but verify no vertical scrollbar appears at common sizes).
- The block internals already use `height: 100%`; verify the Services marquee
  re-measures correctly at the new row height (it measures on `fonts.ready` and
  `resize` — both still fire) and that Hero/Blog/Portfolio content doesn't
  overflow at short laptop heights (~700px) and tablet portrait.

## 3. Footer kept out of initial view

`src/components/Footer.astro` — no code change required.

The footer is `mt-auto` at the bottom of the `min-h-svh` flex column in
`Layout.astro`. Once the homepage grid fills `100dvh`, the footer is naturally
pushed below the fold. Verify: footer is never in the initial view but remains
reachable by scrolling. (If the `100dvh` grid + footer produces an awkward tiny
scroll, consider the grid being the last in-flow element on the homepage so the
footer sits cleanly one screen down.)

## 4. Hero socials icon/text alignment

`src/components/home/HeroBlock.astro` (`.socials a`, lines ~104-119)

Current: `<a display:inline-flex; align-items:center; gap:0.3rem>` wrapping an
`<Icon 18×18>` + `<span>`, with `border-bottom: dashed` across the whole anchor.
The icon's optical center doesn't line up with the text, most visible on the
LinkedIn glyph; the dashed border also runs under the icon.

Fix:
- `line-height: 1` on the anchor so the icon centers on the text cap-height, not
  the full line box.
- Icon: `flex: 0 0 auto`, fixed box, vertically centered with the label.
- Move the dashed underline off the icon — apply it to the text span (or use
  `text-decoration` with `text-underline-offset`) so the icon isn't crossed.
- Verify against all SOCIALS entries (LinkedIn, Mail) and the RSS text-only link,
  which must stay visually consistent.

## 5. Smoother post-open animation

`src/styles/global.css` + the existing `transition:name` on
`src/layouts/PostDetails.astro:93` (title morph).

The morph currently uses the browser-default `::view-transition` timing (fast,
slightly abrupt). Add a global rule customizing the view-transition animation
duration/easing (≈400-500ms with `--ease-in-out-soft`) so the title glides.

- Scope so it doesn't disrupt the CloudDecoration crossfade or other named
  transitions; target the default group or the post-title transition specifically.
- Wrap in `prefers-reduced-motion: no-preference` so reduced-motion users keep an
  instant, non-animated swap.
- Verify cross-browser: view-transition pseudo-elements are Chromium-strong;
  Firefox/Safari support is partial — ensure graceful fallback (no broken state,
  just the default/instant swap where unsupported).

---

## Files touched
- `src/components/Header.astro` — fixed + smart show/hide script
- `src/pages/index.astro` — 100dvh 2×2 grid (tablet+), readable stacked phone
- `src/layouts/*` — top offset for interior pages under the fixed header (minimal)
- `src/components/home/HeroBlock.astro` — socials icon/text alignment
- `src/styles/global.css` — view-transition timing/easing for the title morph
- `src/components/Footer.astro` — no change (verify only)

## Verification
- `pnpm run lint`, `pnpm run format:check`, `pnpm run build` all green.
- Browser (dev server), at widths 1366×768, 1280×800, 1024×768, ~1280×700
  (short laptop), 768 portrait, and a phone width (~390×844):
  - **Fit:** on ≥768px all four blocks visible at load with no vertical scroll;
    on phone, blocks readable and stacked.
  - **Header:** hidden at load/top; appears on scroll-up after scrolling down;
    phases out at top; reduced-motion instant; mobile menu still opens.
  - **Footer:** below the fold at load, reachable on scroll.
  - **Socials:** zoom the LinkedIn row — icon and label share a vertical center,
    dashed underline doesn't cross the icon.
  - **Post morph:** open a post; title glide is smoother than before; no broken
    state; reduced-motion instant.
- Stage as reviewable commits (`feat:`/`fix:`/`style:` per change).
