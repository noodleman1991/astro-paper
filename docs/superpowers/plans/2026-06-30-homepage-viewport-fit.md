# Homepage Viewport-Fit + Smart Header + Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage's four blocks fill the dynamic viewport on tablet+ with a smart auto-hiding header, keep the footer below the fold, fix hero social-icon alignment, and smooth the post-open title morph.

**Architecture:** The header becomes `position: fixed` and self-hides at the page top (and on scroll-down), revealing on scroll-up — so it consumes no layout height and the homepage 2×2 grid can be `100dvh`. The fixed header overlays content when revealed (standard smart-header pattern; its `bg-background` is opaque), so interior pages need no content offset. CSS-only changes for grid, socials, and the view-transition morph; one small RAF-throttled scroll script for the header, reusing the hardened `data-astro-rerun` + `astro:before-swap` cleanup pattern already in the codebase.

**Tech Stack:** Astro 5, TailwindCSS 4, pure `.astro` components, CSS view transitions (ClientRouter). No test framework — validation is `pnpm run lint` + `pnpm run format:check` + `pnpm run build` + targeted browser checks via the dev server.

## Global Constraints

- No AI attribution anywhere (commits, comments, PRs). Conventional commit prefixes.
- No `console.*` (ESLint `no-console: error`).
- Prettier: double quotes, 2-space indent, trailing commas es5, LF.
- Mobile-first, WCAG 2.1 AA, keep Lighthouse 100; visible focus indicators.
- Respect `prefers-reduced-motion` in every motion change.
- Reuse shared easing tokens `--ease-out-soft` / `--ease-in-out-soft` (defined in `src/styles/global.css :root`).
- Path alias `@/` → `./src/*`. Don't commit `public/pagefind/`.
- Verify each task with build/lint and the specified browser check before committing. Stage tiers as separate commits.

---

## Task 1: Homepage grid fills the dynamic viewport

**Files:**
- Modify: `src/pages/index.astro` (`<main>` class line 18; `.home-grid` style lines 30-41)

**Interfaces:**
- Consumes: nothing new.
- Produces: a homepage `<main>` whose grid is `100dvh` at ≥768px and stacked/scrollable below. Later tasks (header) depend on this grid starting at viewport top.

- [ ] **Step 1: Remove the homepage main's vertical margin so the grid can reach viewport top/bottom**

In `src/pages/index.astro`, change the `<main>` opening tag class from `"home-layout my-8"` to `"home-layout"`:

```astro
  <main id="main-content" data-layout="index" class="home-layout">
```

- [ ] **Step 2: Rewrite `.home-grid` so tablet+ fills `100dvh` with two equal rows; phone stays readable & scrollable**

Replace the entire `<style>` grid block (lines 30-41) with:

```css
  .home-grid {
    display: grid;
    grid-template-columns: 1fr;
    /* Phone: readable, stacked, scrollable — never crush to fit. */
    grid-auto-rows: minmax(15rem, auto);
    gap: 1.25rem;
  }
  @media (min-width: 768px) {
    .home-grid {
      /* Tablet+: 2×2 fills the dynamic viewport so all four blocks show on load.
         Header is hidden at the top (Task 2), so the grid owns the full height. */
      height: 100dvh;
      grid-template-columns: 1fr 1fr;
      grid-template-rows: 1fr 1fr;
      grid-auto-rows: unset;
      padding-block: 1.25rem;
      box-sizing: border-box;
    }
  }
```

- [ ] **Step 3: Build and lint**

Run: `pnpm run build && pnpm run lint`
Expected: build completes, no ESLint errors.

- [ ] **Step 4: Browser check — fit at tablet+ and phone**

Start dev: `pnpm run dev`. In the browser at 1280×800 and 1366×768: all four blocks visible on load, no vertical scrollbar over the grid. At ~390px width: blocks stacked, each readable (≥15rem tall), page scrolls.
Confirm via JS in the page: `document.querySelector('.home-grid').getBoundingClientRect().height` ≈ `window.innerHeight` at ≥768px (within the gap/padding budget) and the document doesn't scroll on load (`document.documentElement.scrollHeight <= window.innerHeight + 4`).

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: fill the dynamic viewport with the homepage 2x2 grid"
```

---

## Task 2: Smart auto-hiding fixed header

**Files:**
- Modify: `src/components/Header.astro` (`<header>` element lines 28-30; `<script>` block lines 139-164)

**Interfaces:**
- Consumes: `--ease-out-soft` from `global.css`.
- Produces: a `position: fixed` header with a `data-hidden` attribute toggled by scroll; hidden at top and on scroll-down, shown on scroll-up. No layout height consumed (enables Task 1's `100dvh`).

- [ ] **Step 1: Make the header fixed and add the hidden-state transform**

In `src/components/Header.astro`, replace the `<header>` opening tag (lines 28-30) with a fixed, full-width header carrying a scoped class for the transform. Change:

```astro
<header
  class="app-layout flex flex-col items-center justify-between sm:flex-row"
>
```

to:

```astro
<header
  id="site-header"
  data-hidden
  class="site-header app-layout flex flex-col items-center justify-between sm:flex-row"
>
```

- [ ] **Step 2: Add the fixed-position + slide CSS**

At the end of `src/components/Header.astro` (after the `</script>` at line 164), add a `<style>` block:

```astro
<style>
  .site-header {
    position: fixed;
    inset-block-start: 0;
    inset-inline: 0;
    z-index: 40;
    background: var(--background);
    transition: transform 0.35s var(--ease-out-soft);
  }
  /* Hidden at the top / on scroll-down: slid up out of view. */
  .site-header[data-hidden] {
    transform: translateY(-100%);
  }
  @media (prefers-reduced-motion: reduce) {
    .site-header {
      transition: none;
    }
  }
</style>
```

- [ ] **Step 3: Add the smart show/hide scroll logic to the existing script**

In the `<script>` block, replace the bottom section (the `toggleNav(); document.addEventListener("astro:after-swap", toggleNav);` at lines 160-163) with the nav toggle call plus a new header controller. The full replacement for lines 160-163:

```js
  toggleNav();

  function smartHeader() {
    const header = document.querySelector<HTMLElement>("#site-header");
    if (!header) return;

    // Threshold ~ header height: below this we're "at the top" → hidden.
    const threshold = 80;
    let lastY = window.scrollY;
    let ticking = false;

    function update() {
      const y = window.scrollY;
      if (y <= threshold) {
        header!.setAttribute("data-hidden", ""); // at top → hidden
      } else if (y > lastY) {
        header!.setAttribute("data-hidden", ""); // scrolling down → hidden
      } else {
        header!.removeAttribute("data-hidden"); // scrolling up → shown
      }
      lastY = y;
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }

    document.addEventListener("scroll", onScroll, { passive: true });
    update(); // set correct initial state (hidden at top, no flash)

    document.addEventListener(
      "astro:before-swap",
      () => document.removeEventListener("scroll", onScroll),
      { once: true }
    );
  }

  smartHeader();

  // Runs on view transitions navigation
  document.addEventListener("astro:after-swap", () => {
    toggleNav();
    smartHeader();
  });
```

Note: this `<script>` is a bundled module script (not `data-astro-rerun`), so `smartHeader()` is re-invoked via `astro:after-swap`; the `scroll` listener is removed on `astro:before-swap` so it never stacks.

- [ ] **Step 4: Build, lint, format-check**

Run: `pnpm run build && pnpm run lint && pnpm run format:check`
Expected: build completes; no ESLint errors; if Prettier flags `Header.astro`, run `npx prettier --write src/components/Header.astro` and re-check.

- [ ] **Step 5: Browser check — header behavior**

Dev server, homepage at 1280×800:
- On load (at top): header NOT visible (`#site-header` has `data-hidden`, `getBoundingClientRect().bottom <= 0`).
- Scroll down 300px: still hidden.
- Scroll up: header slides in (`data-hidden` removed, `bottom > 0`).
- Scroll back to top: header hides again.
- Open the mobile menu at ~390px width (menu button): header still functions, menu expands.
Verify via JS: after `window.scrollTo(0,0)` then a programmatic check, `document.querySelector('#site-header').hasAttribute('data-hidden') === true`.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat: auto-hide the header at the top and reveal it on scroll-up"
```

---

## Task 3: Verify footer stays below the fold (no code change expected)

**Files:**
- Verify only: `src/components/Footer.astro`, `src/layouts/Layout.astro` (the `min-h-svh` flex wrapper).

**Interfaces:**
- Consumes: Task 1's `100dvh` grid.
- Produces: confirmation the footer is off-screen at load on the homepage.

- [ ] **Step 1: Browser check — footer position on the homepage**

Dev server, homepage at 1280×800 and 1366×768: the footer is not in the initial viewport, but is reachable by scrolling to the bottom.
Verify via JS: `document.querySelector('footer').getBoundingClientRect().top >= window.innerHeight` on load.

- [ ] **Step 2: If the footer IS in view, add a guard (only if Step 1 fails)**

If and only if the check fails (e.g. the `100dvh` grid plus footer collapse): in `src/pages/index.astro`, ensure the grid is the dominant in-flow element by confirming `main.home-layout` has no extra bottom margin and the grid `height: 100dvh` is applied. Re-run the Step 1 check. (No change is expected; this step documents the contingency.)

- [ ] **Step 3: Commit (only if Step 2 changed anything)**

```bash
git add src/pages/index.astro
git commit -m "fix: keep the homepage footer below the fold"
```

If no change was needed, skip this commit.

---

## Task 4: Fix hero social icon/text alignment

**Files:**
- Modify: `src/components/home/HeroBlock.astro` (`.socials` and `.socials a` styles, lines ~104-119; markup lines ~28-46)

**Interfaces:**
- Consumes: nothing new.
- Produces: hero social links whose icon and label share a true vertical center, with the dashed underline not crossing the icon.

- [ ] **Step 1: Wrap the social label text so the underline can target it, not the icon**

In `src/components/home/HeroBlock.astro`, the SOCIALS markup currently renders `<Icon …/><span>{social.name}</span>`. Change the `<span>` to carry a class:

```astro
              <Icon name={social.icon} width={18} height={18} />
              <span class="label">{social.name}</span>
```

And the RSS link below it — wrap its text too:

```astro
      <li>
        <a href="/rss.xml" title="RSS Feed" aria-label="RSS feed">
          <span class="label">RSS</span>
        </a>
      </li>
```

- [ ] **Step 2: Replace the `.socials a` rule to center the icon on the text and move the underline to the label**

Replace the `.socials a` block (lines ~112-119) with:

```css
  .socials a {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    line-height: 1;
    color: var(--accent);
    text-decoration: none;
  }
  .socials a :global(svg) {
    flex: 0 0 auto;
    display: block;
  }
  .socials .label {
    border-bottom: 1px dashed var(--accent);
    padding-bottom: 1px;
  }
```

(`line-height: 1` centers the icon against the text cap-height; `display: block` on the SVG removes the inline baseline gap; the dashed underline now lives on `.label`, so it never crosses the icon.)

- [ ] **Step 3: Build, lint, format-check**

Run: `pnpm run build && pnpm run lint && pnpm run format:check`
Expected: build completes, no errors. Run `npx prettier --write src/components/home/HeroBlock.astro` if flagged.

- [ ] **Step 4: Browser check — zoom the LinkedIn row**

Dev server, homepage. Zoom into the hero socials. The LinkedIn (and Mail) icon vertically centers with its label; the dashed underline sits under the text only, not under the icon. RSS (text-only) stays visually consistent.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/HeroBlock.astro
git commit -m "fix: align hero social icons with their labels"
```

---

## Task 5: Smooth the post-open title morph

**Files:**
- Modify: `src/styles/global.css` (add a view-transition timing rule)

**Interfaces:**
- Consumes: `--ease-in-out-soft` from `:root`.
- Produces: a slower, eased title view-transition; instant under reduced motion; graceful no-op where unsupported.

- [ ] **Step 1: Add an eased view-transition duration, reduced-motion-guarded**

Append to `src/styles/global.css` (after the existing reduced-motion backstop block):

```css
/* Smooth the title morph between list/detail pages. View-transition
   pseudo-elements are progressively enhanced — unsupported browsers fall back
   to the default/instant swap. Honors reduced motion. */
@media (prefers-reduced-motion: no-preference) {
  ::view-transition-group(*) {
    animation-duration: 0.45s;
    animation-timing-function: var(--ease-in-out-soft);
  }
}
```

- [ ] **Step 2: Build and lint**

Run: `pnpm run build && pnpm run lint`
Expected: build completes, no errors.

- [ ] **Step 3: Browser check — post open feels smoother**

Dev server (Chromium). From the homepage blog block or `/posts`, click a post. The title glides into the detail-page heading over ~0.45s with the soft curve rather than the abrupt default. No broken/flashing state. Toggle DevTools "Emulate prefers-reduced-motion: reduce" → the swap is instant. Confirm no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/styles/global.css
git commit -m "style: smooth the post title view transition"
```

---

## Task 6: Full regression sweep

**Files:** none (verification only).

- [ ] **Step 1: Final lint + format + build**

Run: `pnpm run lint && pnpm run format:check && pnpm run build`
Expected: lint clean; format clean on all touched files (`src/pages/index.astro`, `src/components/Header.astro`, `src/components/home/HeroBlock.astro`, `src/styles/global.css`); build green. Pre-existing format warnings on files NOT touched by this plan are acceptable.

- [ ] **Step 2: Cross-size browser sweep**

Dev server. At 1366×768, 1280×800, 1024×768, ~1280×700, 768 portrait, ~390×844:
- ≥768px: four blocks fit on load, no grid scroll; header hidden at top; footer below fold.
- Phone: blocks stacked & readable; page scrolls; header hidden at top, reveals on scroll-up.
- Header reveal/hide correct in all cases; reduced-motion instant.
- Hero socials aligned; post morph smooth.
No console errors at any size.

- [ ] **Step 3: Confirm no regressions to prior work**

Navigate home → post → home → post: confirm only one progress bar in `<body>` on post pages (prior leak fix intact), and the off-screen animation pausing still works (marquee/ants idle when out of view / tab hidden).

---

## Self-Review Notes

- **Spec §1 (smart header):** Tasks 2. The spec's "interior-page top offset" consideration resolved to *no offset needed* — the fixed header overlays content only when revealed mid-scroll (standard pattern), and its `bg-background` is opaque. Documented in the Architecture section.
- **Spec §2 (grid fit):** Task 1.
- **Spec §3 (footer):** Task 3 (verify-only with contingency).
- **Spec §4 (socials):** Task 4.
- **Spec §5 (post morph):** Task 5.
- **No placeholders:** every CSS/JS step shows complete code. `threshold = 80` is an explicit value (tune in browser if header height differs).
- **Type/name consistency:** `data-hidden` attribute and `#site-header` id used consistently across Task 2 CSS + JS; `.label` class used consistently across Task 4 markup + CSS.
- **Cross-browser caveat:** Task 5's `::view-transition-group` is Chromium-strongest; Firefox/Safari fall back gracefully (noted in step comment).
