# Design Brief — spiro spero homepage, 2×2 playful block layout

**Date:** 2026-06-28
**For:** a downstream design/build pass (e.g. frontend-design skill)
**Scope:** the homepage (`src/pages/index.astro`) only. Header/Footer, post pages, tags, and search are out of scope except where the homepage links into them.

---

## 1. Goal

Reframe the homepage from the inherited AstroPaper *blog* layout (Hero → Featured → Recent Posts → All Posts) into a **personal portfolio + studio** homepage built from **four playful blocks in a 2×2 grid** on desktop, stacking vertically on mobile.

Keep the project's existing **fonts and color tokens**. Rethink the **design language** from there toward something more playful and distinctive — the current tokens read as a clean technical blog, while the decorative layer (clouds, rainbow, "spiro spero" script) is whimsical. This redesign should let the playful side lead more, without throwing away the existing palette.

Direction chosen by the owner: **playful**.

---

## 2. The layout (locked)

Desktop: a 2×2 grid. Mobile: a single column stacking in reading order.

```
Desktop (≥ md)                         Mobile (stack, in this order)
┌─────────────┬─────────────┐          1. Hero
│  HERO       │  WHAT I DO  │          2. What I do
│  text+image │  3 tiles    │          3. From the blog
├─────────────┼─────────────┤          4. Portfolio
│  BLOG       │  PORTFOLIO  │
│  (framed)   │  grid 2×2   │
└─────────────┴─────────────┘
```

- **Block 1 — Hero (top-left):** gradient image on top (~48% of block height), then heading + short intro + social links below, sitting directly on the block (no separate inner card/background under the text).
- **Block 2 — What I do (top-right):** a **vertical auto-scrolling marquee** of service tiles. No block title, no block frame; the tiles themselves fill the block.
- **Block 3 — From the blog (bottom-left):** the only **framed** block — an animated dashed accent border (marching ants). No block title; posts (date + title + description) are top-aligned.
- **Block 4 — Portfolio (bottom-right):** a **2×2 grid of square** thumbnails that flip on hover. No block title, no titles on the squares, no block frame.

**Visual language (locked):**
- **Sharp corners everywhere** — no border-radius on blocks, tiles, squares, or icon chips.
- **No block titles** ("what i do" / "portfolio" headings removed). Hero has no title label either.
- **No block frames/borders** — except the Blog block, which keeps its dashed marching-ants frame as its identity.
- **All 4 blocks are equal size** — a true balanced 2×2 of equal cells. Implemented as fixed-height grid rows (desktop ~380px, mobile ~340px). On mobile the four stack in reading order, each its own equal cell.

### Behavior / data
- **Hero copy** comes from existing content (see §6). Fix the stray `pp` typo currently in `index.astro` line 46.
- **Hero image** is a crossfading pool of **4 images**, changing once every **12s** with a gentle ~4s fade (see §4a Motion). Mockup used gradient placeholders; real images TBD by owner.
- **What I do** tiles: **6 service tiles** (expanded from the original 3 so the marquee never shows a duplicate in view — see §4a and §9). Content is editable in the page; no CMS.
- **Blog block** pulls recent posts from the `blog` collection via the existing `getSortedPosts` / `getCollection("blog")` utilities. Show the 2–3 most recent (featured first is acceptable). Whole block/posts link out to `/posts/` or individual posts.
- **Portfolio block** is **new** — there is no portfolio collection yet. For now use 4 placeholder gradient squares (no title on the front; flip reveals a project label/link on the back). A real `portfolio` content collection is a future task (note it, don't build it here unless trivially scoped).

---

## 3. Design tokens — REUSE EXACTLY

These come from `src/styles/global.css`. Do not invent new brand colors; you may derive tints/shades with `color-mix`.

### Theme colors (CSS variables, semantic)
| Token | Light | Dark |
|---|---|---|
| `--background` | `#fdfdfd` | `#212737` |
| `--foreground` | `#282728` | `#eaedf3` |
| `--accent` | `#006cac` (blue) | `#ff6b01` (orange) |
| `--muted` | `#e6e6e6` | `#343f60` |
| `--border` | `#ece9e9` | `#ab4b08` |

Dark mode selector: `[data-theme="dark"]` (Tailwind 4 `@custom-variant dark`).

### Decorative palette (from CloudDecoration / rainbow)
Use these for the playful accents (hero image gradient, tile icons, portfolio squares):
- coral `#e8837c` · pink `#f4a0b5` · peach `#ffd1c1` · plum (text on pastel) `#5d3a4a`
- rainbow bands: `#f4a0a0` `#f4c4a0` `#f4e8a0` `#a0e8b4` `#a0c4f4` `#b0a0e8` `#d4a0e8`

### Fonts (already wired via Astro Fonts API → `@theme inline`)
- **Body / UI / mono:** `--font-app` = Google Sans Code (`font-app`)
- **Logo / display script:** `--font-logo` = Chicle (`font-logo`) — used for "spiro spero" wordmark
- **Headings:** `--font-heading` = McLaren (`font-heading`, rounded/friendly)

Apply: hero `h1` and the wordmark in Chicle; tile titles and post titles in McLaren; body and dates in Sans Code. (Block headings were removed — see §2.)

### Existing idioms to keep
- Active nav: `underline decoration-wavy decoration-2 underline-offset-8` (`.active-nav`)
- Focus: dashed accent outline, offset 1 (`outline-2 outline-dashed outline-accent`)
- Selection: `bg-accent/75 text-background`
- Container: `app-layout` = `mx-auto w-full max-w-app px-4`. **Note:** current `max-w-app` is `max-w-3xl` (single column). A 2×2 grid needs more width — introduce a wider max-width for the homepage grid (e.g. ~`max-w-5xl`/~1100px) while leaving `max-w-app` untouched for article pages.
- Lowercase text styling is an owner preference (see hero "hi, I'm Amit", lowercase nav, lowercase block headings).

---

## 4. Aesthetic direction (playful)

- **Sharp corners** (no border-radius) throughout — this is the locked look, giving a crisp editorial/grid feel that contrasts with the soft pastel fills.
- Each block has its own personality:
  - **Hero:** gradient image panel on top (coral→pink→peach wash in the mockup), text below on the plain block.
  - **What I do:** tiles with a flat muted-tint background and small **square** gradient icon chips (coral→peach). No block frame.
  - **Blog:** the dashed accent **marching-ants frame** is its sole identity — literally "framed", echoing the dashed focus idiom. No fill, no title.
  - **Portfolio:** four vibrant gradient squares (rainbow-palette-derived), titleless, that flip on hover. No block frame.
- Carry the **organic / calm** motion feel already in the codebase (clouds drift with coprime durations; rainbow draws on). All new motion is slow and subtle. Every animation must respect `prefers-reduced-motion` exactly as `CloudDecoration.astro` does (motion off, no `will-change`).
- The existing `CloudDecoration` is a fixed full-page background behind everything (z-index 0, opacity .55 light / .25 dark). The new blocks sit **above** it — block backgrounds will partially veil the clouds; that's fine and on-brand.
- Avoid generic "AI startup" gradients/shadows. Lean into the warm pastel fills + sharp corners + mono-type contrast that's distinctive here.

---

## 4a. Motion spec (5 animations — final, verified configurations)

All five were prototyped and visually verified in the browser. These exact configs worked; the engineering notes explain *why*, so the implementer doesn't repeat the dead ends.

1. **Hero image crossfade** — pool of 4 images, one shown at a time. Swap every **12s**; crossfade duration **4s** `ease-in-out` (gentle). Implementation: stack 4 absolutely-positioned layers, toggle an `.show` (opacity 1) class on a `setInterval`. Skip entirely under reduced-motion (show one static image).

2. **Services vertical marquee** — tiles drift upward continuously, **pause on hover**, looping seamlessly. Speed ~**14px/sec** (calm; ≈38s per set with 6 tiles). Soft fade **mask** at top & bottom (`mask-image: linear-gradient(to bottom, transparent, #000 10%, #000 90%, transparent)`).
   - **Why 6 tiles, not 3:** the block is a fixed ~380px and fits ~4 tiles in view. A continuous loop of only 3 unique items *guarantees* a duplicate is visible at once (the 4th slot must repeat). With **6 unique tiles** the visible window never repeats. (If the owner insists on only 3 named services, the correct choice is **static tiles, no marquee** — a marquee needs ≥6 to be honest.)
   - **Glitch-free loop (the part that took several tries):** put **two identical sets** in the track. Do **NOT** use flex `gap` between tiles — it adds an orphan gap between the two sets that a `-50%` translate can't account for, causing a visible jump. Instead **bake the gap into each tile as `margin-bottom`** so a "set" is an exact repeating unit. Then translate by the **measured pixel height of one set** (sum each tile's `offsetHeight + margin-bottom` in JS, set it as a CSS var, drive a `translateY(0 → -setH)` keyframe). Measuring in px (not `%`) makes the seam deterministic regardless of rounding. **Measure after `document.fonts.ready`** — the font swap changes tile height. Re-measure on resize (debounced). Verified: track height = exactly 2× one set.
   - Accessibility: SET A tiles are real/readable; SET B is `aria-hidden="true"`. Under reduced-motion the marquee does not animate (tiles are simply a scrollable/visible list).

3. **Blog marching-ants frame** — a dashed accent border whose dashes crawl continuously around the perimeter. Cycle ~**4.5s** linear infinite. Dashes **25% shorter** than a default: `stroke-dasharray: 7.5 6` (7.5px dash, 6px gap). Animate `stroke-dashoffset: 0 → -13.5` (one full dash+gap cycle) for a seamless crawl.
   - **Implementation that worked:** a single **SVG `<rect>`** stroke (one continuous path = no corner seams/gaps). Use `vector-effect: non-scaling-stroke` so the 2px stroke and dash lengths stay uniform regardless of the block's aspect ratio.
   - **Dead ends to avoid:** (a) stretching a square SVG `viewBox` with `preserveAspectRatio="none"` distorts the stroke into a thick uneven band — use `non-scaling-stroke` instead. (b) Faking the border with four `repeating-linear-gradient` edges + `background-position` animation leaves **gaps at the corners** where edges meet — don't; the single-rect path closes corners for free.

4. **Portfolio flip on hover** — each square flips on the **horizontal axis** (`rotateX(180deg)`) over ~0.8s. Front = gradient (titleless); back = solid `--foreground` with the project label/link in McLaren. Use `perspective` on the tile, `transform-style: preserve-3d`, `backface-visibility: hidden`. Trigger on `:hover` AND `:focus-within` (keyboard). Squares stay perfectly square at any width via `aspect-ratio: 1/1` (or equal grid rows). Under reduced-motion, no transition (optionally reveal back face on focus without the 3D spin).

5. **(Decorative, existing)** `CloudDecoration` clouds + rainbow continue behind everything, unchanged.

---

## 5. Constraints (from CLAUDE.md — non-negotiable)

- **Pure Astro components** (`.astro`), no React/Vue.
- **TailwindCSS 4** utilities; custom utilities via `@utility`. CSS-variable theming.
- **Mobile-first**, responsive across sm/md/lg/xl/2xl.
- **WCAG 2.1 AA** contrast minimum; semantic HTML (`main`, `section`, `article`, `nav`, headings in order); keyboard nav; visible focus; meaningful alt text. **Maintain Lighthouse 100 accessibility.** (Watch contrast of text on pastel gradients — pastel squares may need the plum/foreground text, not white.)
- No `console.*` (ESLint blocks it). Run `pnpm run lint` and `pnpm run format:check` before committing. Prettier: double quotes, 2-space, es5 trailing commas, LF.
- **Never** mention AI/Claude/bot or add AI attribution in commits, PRs, comments, or copy.
- Reuse `src/utils/` (e.g. `getSortedPosts`) before writing new helpers.
- Verify Astro 5 / Tailwind 4 APIs against current docs before using — don't trust pre-2026 memory.
- Build = type check + build + pagefind. No test framework; validate via lint + format + type check + build. Suggest Vitest for any non-trivial new logic.

---

## 6. Real content (use this, not lorem ipsum)

**Wordmark / logo:** `spiro spero` (lowercase, Chicle). Site title: `spiro spero studio`. Tagline (`SITE.desc`): "personal portfolio and blog".

**Hero intro (owner's words, typo fixed):**
> I'm Amit. I build websites and apps, set up hubs and knowledge management with and without AI.

**Social links** (`src/constants.ts`):
- LinkedIn → https://www.linkedin.com/in/amit-lo/
- Email → hello@spiro-spero.zone
- RSS → /rss.xml

**What I do — 6 tiles** (expanded from 3 so the marquee never repeats in view; derived from the "What I Work With" post — owner may rename):
1. **web development** — fast, accessible websites built to last.
2. **app development** — tools and apps that do the job simply.
3. **knowledge hubs** — structure a team's accumulated knowledge.
4. **databases** — model and store data so it stays usable.
5. **data tools** — pipelines and dashboards that surface what matters.
6. **AI integration** — AI where it actually helps — not for its own sake.

> NOTE (owner pending): the **colors** and these labels may still change. The mockup used the existing tokens + decorative palette as-is; confirm the final block fills / gradient choices with the owner before building (see §10 open questions).

**Blog posts** (from `src/data/blog/`, both currently `featured: true`):
- **Knowledge Trees** — 2026-03-24 — "Why research teams, NGOs and project groups should structure their accumulated knowledge — and how AI fits in."
- **What I Work With** — 2026-03-23 — "Websites, apps, databases, data tools and AI — the stack changes but the approach doesn't."

**Portfolio:** placeholder (4 squares) — no real projects supplied yet.

---

## 7. Out of scope / future

- A real `portfolio` content collection + schema (future spec).
- Filling in the About page (currently "Coming soon.").
- Redesigning post/tag/search/archive pages.
- Changing the existing CloudDecoration internals.

---

## 8. Success criteria

- Homepage renders the 4 blocks as an equal-cell 2×2 grid ≥ md, single stacked column < md, in the order Hero → Services → Blog → Portfolio.
- Sharp corners throughout; no block titles; no block frames except the Blog marching-ants frame.
- All 5 motions behave per §4a — and specifically: the **services marquee never shows a duplicate tile in view and has no seam glitch**; the **blog frame has clean closed corners and uniform dashes**.
- Uses only the existing fonts and the documented color/decorative tokens (pending owner color confirmation, §10).
- Light + dark modes both legible and on-brand; all text meets AA contrast.
- Lighthouse 100 (accessibility) preserved; `prefers-reduced-motion` honored for all 5 motions.
- `pnpm run lint`, `pnpm run format:check`, and `pnpm run build` all pass.
- Reads as a confident, playful personal studio — not the stock AstroPaper blog.

---

## 9. Design decisions & engineering log (why it's built this way)

Captured from the live mockup iteration so the implementer doesn't relearn them.

| Decision | What we chose | Why / what failed first |
|---|---|---|
| Corners | Sharp (no radius) | Owner preference; crisp grid contrast vs. soft fills. |
| Block titles | None | Owner removed them; tiles/posts carry their own context. |
| Block frames | None except Blog | Blog's dashed frame *is* its identity; others read cleaner frameless. |
| Block sizing | All 4 equal (fixed row height) | Owner wanted a balanced 2×2 of equal cells, stacking on mobile. |
| Hero split | Image top (~48%) + text below, text on bare block | Owner: "broken to two, text no bg." |
| Services count | 6 tiles (not 3) | A 3-item continuous marquee in a ~4-tile viewport *always* shows a duplicate. 6 unique tiles is the honest fix. Alternative if staying at 3: static, no scroll. |
| Marquee loop | 2 sets, gap baked into tile `margin-bottom`, translate by **measured px** of one set, measured after `fonts.ready` | flex `gap` → orphan gap between sets → seam jump. `%` translate → rounding glitch. Measured-px is deterministic. Verified track = 2× set height. |
| Marquee speed | ~14px/s (~38s/set), pause on hover, edge fade mask | Owner asked to slow it down twice; 14px/s reads calm. |
| Blog frame | Single SVG `<rect>` stroke, `vector-effect: non-scaling-stroke`, `dasharray 7.5 6`, animate `dashoffset → -13.5`, ~4.5s | Stretched viewBox → distorted thick band. 4× `repeating-linear-gradient` edges → corner gaps. Single path closes corners and keeps dashes uniform. |
| Frame motion | Marching ants (continuous crawl), ~4.5s | Owner wanted dashes to "run like ants," not a one-time draw-on. |
| Portfolio flip | Horizontal axis (`rotateX`), ~0.8s, hover + focus-within | Owner specified horizontal axis; focus-within for keyboard a11y. |
| Portfolio squares | `aspect-ratio: 1/1`, titleless front, label on flip-back | Owner: square at every screen size, no titles. |

---

## 10. Open questions for the owner (resolve before/while building)

- **Colors: RESOLVED** — keep the existing theme tokens + cloud/rainbow decorative palette exactly as the mockup used them. No new colors; derive tints/shades only via `color-mix`.
- **Service labels:** keep the 6 expanded labels, rename them, or drop back to 3 (→ switch services to static, no marquee).
- **Hero images:** supply the 4 real images for the crossfade pool (mockup used gradients).
- **Portfolio:** real projects + whether to build the `portfolio` collection now or ship placeholders.
