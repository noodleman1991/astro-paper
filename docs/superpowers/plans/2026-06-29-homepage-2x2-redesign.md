# Homepage 2×2 Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the AstroPaper blog-style homepage with a playful equal-cell 2×2 block layout (Hero · Services marquee · Blog marching-ants frame · Portfolio flip grid) reusing the site's existing fonts and color tokens.

**Architecture:** Build four focused, pure-Astro block components under `src/components/home/`, each owning its own scoped styles and (where needed) scoped client script. `src/pages/index.astro` becomes a thin composition layer that fetches blog posts and lays out the four blocks in a CSS grid. Service tile data lives in a small typed config module so content is editable without touching markup. No new dependencies.

**Tech Stack:** Astro 5 (pure `.astro` components, `astro:content` glob loader), TailwindCSS 4 (utilities + CSS-variable theming, `@custom-variant dark`), TypeScript strict, vanilla JS for the two scripted motions (marquee measurement, hero crossfade). Source of truth spec: `docs/superpowers/specs/2026-06-28-homepage-2x2-design-brief.md`.

## Global Constraints

- **Pure Astro components only** — no React/Vue/framework components.
- **TailwindCSS 4** utilities; custom utilities via `@utility`; theme via CSS variables; dark mode via `[data-theme=dark]` (`@custom-variant dark`).
- **Reuse existing color tokens + decorative palette verbatim** — `--background #fdfdfd/#212737`, `--foreground #282728/#eaedf3`, `--accent #006cac/#ff6b01`, `--muted #e6e6e6/#343f60`, `--border #ece9e9/#ab4b08`; decorative coral `#e8837c`, pink `#f4a0b5`, peach `#ffd1c1`, plum `#5d3a4a`. Derive only via `color-mix`. No new brand colors.
- **Fonts:** `font-app` (Google Sans Code) body/dates; `font-logo` (Chicle) wordmark + hero h1; `font-heading` (McLaren) tile/post titles.
- **Sharp corners everywhere** (no `border-radius`). **No block titles.** **No block frames except Blog** (marching-ants dashed frame).
- **All 4 blocks equal size** — fixed grid rows (desktop 380px, mobile 340px); stack in order Hero → Services → Blog → Portfolio below `md` (720px breakpoint in mockup; use Tailwind `md` = 768px).
- **Mobile-first, WCAG 2.1 AA, semantic HTML, keyboard nav, visible focus, Lighthouse 100 accessibility preserved.**
- **Every animation must honor `prefers-reduced-motion: reduce`** (motion off, `will-change` cleared).
- **No `console.*`** (ESLint `no-console: error`).
- **No AI/Claude/bot mentions** anywhere — commits, comments, copy, PRs. No `Co-Authored-By`.
- **Conventional commits** (`feat:`/`fix:`/`refactor:`). Prettier: double quotes, 2-space, es5 trailing commas, LF.
- **Validation (no test framework):** `pnpm run lint`, `pnpm run format:check`, `pnpm run build` must all pass. There is no Vitest harness; "tests" in this plan are build/lint/visual gates, not unit tests.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/config/services.ts` (create) | Typed array of the 6 service tiles (icon name + title + blurb). Single edit point for "what I do" content. |
| `src/components/home/HeroBlock.astro` (create) | Block 1: 4-image crossfade panel + hero text/socials. Owns crossfade script. |
| `src/components/home/ServicesBlock.astro` (create) | Block 2: vertical marquee of service tiles. Owns measured-distance marquee script. |
| `src/components/home/BlogBlock.astro` (create) | Block 3: marching-ants framed recent-posts list. Takes posts as a prop. |
| `src/components/home/PortfolioBlock.astro` (create) | Block 4: 2×2 flip-on-hover square grid. Placeholder projects for now. |
| `src/pages/index.astro` (rewrite) | Fetch posts, compose the 4 blocks in the equal-cell grid, set `backUrl`. |
| `src/styles/global.css` (modify) | Add a `@utility home-grid` (or width utility) for the wider homepage container. |

Each block component is self-contained (markup + scoped `<style>` + scoped `<script>` where needed) so it can be built and reviewed independently.

---

## Conventions used in this plan

- **Icons:** the project uses `astro-icon` with mixed sets (see `src/pages/index.astro` import `import { Icon } from "astro-icon/components"`, and existing names like `tabler:arrow-right`, `streamline-logos:linkedin-logo`). Service tiles use `tabler:*` glyph names (verify each exists; `tabler` is broad). If an exact name is unavailable at build, swap to the nearest `tabler` glyph — do not invent set names.
- **Scoped styles:** Astro `<style>` blocks are component-scoped by default; use them for the motion/layout CSS. Tailwind utilities for simple spacing/typography.
- **Reduced motion:** every component with motion includes a `@media (prefers-reduced-motion: reduce)` block.
- **Verification per task:** since there's no unit-test runner, each task's "test" is: `pnpm run lint && pnpm run format:check`, then `pnpm run build`, then a dev-server visual check at `http://localhost:4321/`.

---

## Task 1: Service tile data module

**Files:**
- Create: `src/config/services.ts`
- Test (gate): `pnpm run lint`, `pnpm run build`

**Interfaces:**
- Produces: `export interface Service { icon: string; title: string; blurb: string }` and `export const SERVICES: Service[]` (length 6). Consumed by `ServicesBlock.astro` (Task 3).

- [ ] **Step 1: Create the data module**

```typescript
// src/config/services.ts
export interface Service {
  /** astro-icon name, e.g. "tabler:code" */
  icon: string;
  title: string;
  blurb: string;
}

// 6 tiles: enough unique items that the vertical marquee never shows a
// duplicate in view (the block fits ~4 tiles; 3 would force a repeat).
export const SERVICES: Service[] = [
  {
    icon: "tabler:code",
    title: "web development",
    blurb: "Fast, accessible websites built to last.",
  },
  {
    icon: "tabler:device-mobile",
    title: "app development",
    blurb: "Tools and apps that do the job simply.",
  },
  {
    icon: "tabler:hierarchy-2",
    title: "knowledge hubs",
    blurb: "Structure a team's accumulated knowledge.",
  },
  {
    icon: "tabler:database",
    title: "databases",
    blurb: "Model and store data so it stays usable.",
  },
  {
    icon: "tabler:chart-dots",
    title: "data tools",
    blurb: "Pipelines and dashboards that surface what matters.",
  },
  {
    icon: "tabler:sparkles",
    title: "AI integration",
    blurb: "AI where it actually helps — not for its own sake.",
  },
];
```

- [ ] **Step 2: Verify icon names resolve**

Run: `pnpm run build`
Expected: build succeeds. If any `tabler:*` name errors as "icon not found", replace with the nearest existing `tabler` glyph (e.g. `tabler:code` → `tabler:brackets`) and rebuild. Do not change the set prefix.

- [ ] **Step 3: Lint + format**

Run: `pnpm run lint && pnpm run format:check`
Expected: PASS (no errors).

- [ ] **Step 4: Commit**

```bash
git add src/config/services.ts
git commit -m "feat: add service tile data for homepage"
```

---

## Task 2: Hero block (image crossfade + text)

**Files:**
- Create: `src/components/home/HeroBlock.astro`
- Test (gate): build + dev visual check

**Interfaces:**
- Consumes: `SITE` from `@/config`, `SOCIALS` from `@/constants`, `Icon` from `astro-icon/components`.
- Produces: `<HeroBlock />` (no props). Consumed by `index.astro` (Task 6).

**Design decisions baked in:** image panel = top ~48% of the block; text sits on the bare block below (no inner card bg); 4 absolutely-stacked gradient layers crossfade every 12s over 4s; reduced-motion shows only the first layer.

- [ ] **Step 1: Create the component**

```astro
---
// src/components/home/HeroBlock.astro
import { Icon } from "astro-icon/components";
import { SOCIALS } from "@/constants";

// Placeholder gradient "images". Replace `frames` with real <img> layers when
// the owner supplies the 4-image pool; the crossfade logic is identical.
const frames = ["if1", "if2", "if3", "if4"];
---

<section class="b-hero" aria-label="Introduction">
  <div class="hero-img" data-hero-img>
    {
      frames.map((cls, i) => (
        <div class:list={["frame", cls, { show: i === 0 }]} aria-hidden="true" />
      ))
    }
  </div>
  <div class="hero-text">
    <h1>hi, I'm Amit</h1>
    <p>
      I build websites and apps, set up hubs and knowledge management with and
      without AI.
    </p>
    <ul class="socials">
      {
        SOCIALS.map(social => (
          <li>
            <a href={social.href} title={social.linkTitle} aria-label={social.name}>
              <Icon name={social.icon} width={18} height={18} />
              <span>{social.name}</span>
            </a>
          </li>
        ))
      }
      <li>
        <a href="/rss.xml" title="RSS Feed" aria-label="RSS feed">RSS</a>
      </li>
    </ul>
  </div>
</section>

<style>
  .b-hero {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .hero-img {
    width: 100%;
    height: 48%;
    position: relative;
    overflow: hidden;
    flex: 0 0 auto;
  }
  .frame {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 4s ease-in-out;
  }
  .frame.show {
    opacity: 1;
  }
  .if1 {
    background: linear-gradient(135deg, #e8837c, #f4a0b5 55%, #ffd1c1);
  }
  .if2 {
    background: linear-gradient(135deg, #a0c4f4, #b0a0e8 60%, #f4a0b5);
  }
  .if3 {
    background: linear-gradient(135deg, #a0e8b4, #f4e8a0 55%, #ffd1c1);
  }
  .if4 {
    background: linear-gradient(135deg, #ffd1c1, #e8837c 60%, #d4a0e8);
  }
  .hero-text {
    flex: 1 1 auto;
    padding: 1.1rem 0.25rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.7rem;
  }
  .hero-text h1 {
    margin: 0;
    font-family: var(--font-logo);
    font-size: 2.3rem;
    line-height: 1;
    color: var(--accent);
  }
  .hero-text p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  .socials {
    display: flex;
    gap: 0.85rem;
    margin: 0.1rem 0 0;
    padding: 0;
    list-style: none;
    font-size: 0.8rem;
  }
  .socials a {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    color: var(--accent);
    text-decoration: none;
    border-bottom: 1px dashed var(--accent);
  }

  @media (prefers-reduced-motion: reduce) {
    .frame {
      transition: none;
    }
  }
</style>

<script>
  function startHeroCrossfade() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const root = document.querySelector<HTMLElement>("[data-hero-img]");
    if (!root) return;
    const frames = Array.from(root.querySelectorAll<HTMLElement>(".frame"));
    if (frames.length < 2) return;
    let i = 0;
    const id = window.setInterval(() => {
      frames[i].classList.remove("show");
      i = (i + 1) % frames.length;
      frames[i].classList.add("show");
    }, 12000);
    // Clean up on view-transition navigation away
    document.addEventListener("astro:before-swap", () => window.clearInterval(id), {
      once: true,
    });
  }

  document.addEventListener("astro:page-load", startHeroCrossfade);
</script>
```

- [ ] **Step 2: Lint + format**

Run: `pnpm run lint && pnpm run format:check`
Expected: PASS. (Note: the script uses `window.setInterval`/`window.clearInterval` and no `console.*`.)

- [ ] **Step 3: Build**

Run: `pnpm run build`
Expected: build succeeds, no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/HeroBlock.astro
git commit -m "feat: add hero block with image crossfade"
```

---

## Task 3: Services block (vertical marquee)

**Files:**
- Create: `src/components/home/ServicesBlock.astro`
- Test (gate): build + dev visual check (watch a full loop)

**Interfaces:**
- Consumes: `SERVICES`, `Service` from `@/config/services`; `Icon` from `astro-icon/components`.
- Produces: `<ServicesBlock />` (no props). Consumed by `index.astro` (Task 6).

**Design decisions baked in (and the dead ends they avoid):**
- Two identical sets of tiles in the track; SET B is `aria-hidden`.
- **No flex `gap`** — gap is `margin-bottom` on each tile (flex gap creates an orphan gap between sets → seam jump).
- Loop distance = **measured px height of one set**, set as `--set-h`, measured **after `document.fonts.ready`** (font swap changes height). `%` translate glitches on rounding.
- Speed ~14px/s → duration derived from set height. Pause on hover. Edge fade mask.

- [ ] **Step 1: Create the component**

```astro
---
// src/components/home/ServicesBlock.astro
import { Icon } from "astro-icon/components";
import { SERVICES } from "@/config/services";
---

<section class="b-services" aria-label="What I do">
  <div class="marquee" data-marquee>
    <ul class="marquee-track" data-track>
      {
        SERVICES.map(s => (
          <li class="tile" data-set="a">
            <span class="ico" aria-hidden="true">
              <Icon name={s.icon} width={22} height={22} />
            </span>
            <span class="body">
              <span class="t">{s.title}</span>
              <span class="b">{s.blurb}</span>
            </span>
          </li>
        ))
      }
      {
        SERVICES.map(s => (
          <li class="tile" aria-hidden="true">
            <span class="ico">
              <Icon name={s.icon} width={22} height={22} />
            </span>
            <span class="body">
              <span class="t">{s.title}</span>
              <span class="b">{s.blurb}</span>
            </span>
          </li>
        ))
      }
    </ul>
  </div>
</section>

<style>
  .b-services {
    height: 100%;
  }
  .marquee {
    height: 100%;
    overflow: hidden;
    position: relative;
    -webkit-mask-image: linear-gradient(
      to bottom,
      transparent 0,
      #000 10%,
      #000 90%,
      transparent 100%
    );
    mask-image: linear-gradient(
      to bottom,
      transparent 0,
      #000 10%,
      #000 90%,
      transparent 100%
    );
  }
  .marquee-track {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    will-change: transform;
  }
  .marquee.playing .marquee-track {
    animation: marquee-up var(--dur, 40s) linear infinite;
  }
  .marquee:hover .marquee-track {
    animation-play-state: paused;
  }
  @keyframes marquee-up {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(calc(-1 * var(--set-h)));
    }
  }
  .tile {
    /* gap baked in so a "set" is an exact repeating unit (no flex gap!) */
    margin-bottom: 0.7rem;
    padding: 1.05rem 1.2rem;
    background: color-mix(in srgb, var(--muted) 45%, var(--background));
    display: flex;
    gap: 0.9rem;
    align-items: center;
    flex: 0 0 auto;
  }
  .ico {
    width: 42px;
    height: 42px;
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--plum, #5d3a4a);
    background: linear-gradient(135deg, #e8837c, #ffd1c1);
  }
  .body {
    display: flex;
    flex-direction: column;
  }
  .t {
    font-family: var(--font-heading);
    font-size: 1.05rem;
  }
  .b {
    font-size: 0.82rem;
    line-height: 1.4;
    opacity: 0.85;
  }

  @media (prefers-reduced-motion: reduce) {
    .marquee.playing .marquee-track {
      animation: none;
    }
    .marquee-track {
      will-change: auto;
    }
  }
</style>

<script>
  function startMarquee() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const marquee = document.querySelector<HTMLElement>("[data-marquee]");
    const track = marquee?.querySelector<HTMLElement>("[data-track]");
    if (!marquee || !track) return;

    const SPEED = 14; // px/sec — calm drift

    function setup() {
      const setTiles = track!.querySelectorAll<HTMLElement>('.tile[data-set="a"]');
      if (!setTiles.length) return;
      let setH = 0;
      setTiles.forEach(t => {
        setH += t.offsetHeight + parseFloat(getComputedStyle(t).marginBottom);
      });
      marquee!.style.setProperty("--set-h", `${setH}px`);
      marquee!.style.setProperty("--dur", `${setH / SPEED}s`);
      marquee!.classList.add("playing");
    }

    // Measure after fonts load — the swap changes tile heights.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(setup);
    } else {
      window.addEventListener("load", setup, { once: true });
    }

    let rt: number | undefined;
    const onResize = () => {
      window.clearTimeout(rt);
      rt = window.setTimeout(() => {
        marquee!.classList.remove("playing");
        setup();
      }, 200);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener(
      "astro:before-swap",
      () => window.removeEventListener("resize", onResize),
      { once: true }
    );
  }

  document.addEventListener("astro:page-load", startMarquee);
</script>
```

- [ ] **Step 2: Lint + format**

Run: `pnpm run lint && pnpm run format:check`
Expected: PASS.

- [ ] **Step 3: Build + visual loop check**

Run: `pnpm run build`, then `pnpm run dev` and open `http://localhost:4321/`.
Expected: tiles scroll up slowly; watch one full loop — **no duplicate tile visible at once, no jump at the seam**. Hover pauses it. (If a duplicate shows, the block is fitting >6 tiles — reduce visible count by raising row height or confirm 6 tiles present. If a seam jump shows, confirm `--set-h` is being set: it must be a px value, and `setup()` must run after fonts.ready.)

- [ ] **Step 4: Commit**

```bash
git add src/components/home/ServicesBlock.astro
git commit -m "feat: add services marquee block"
```

---

## Task 4: Blog block (marching-ants frame)

**Files:**
- Create: `src/components/home/BlogBlock.astro`
- Test (gate): build + dev visual check

**Interfaces:**
- Consumes: `posts: CollectionEntry<"blog">[]` prop (already sorted, already sliced to 2–3 by the caller); `getPath` from `@/utils/getPath`; `Datetime` from `@/components/Datetime.astro`.
- Produces: `<BlogBlock posts={...} />`. Consumed by `index.astro` (Task 6).

**Design decisions baked in (and dead ends avoided):** single SVG `<rect>` stroke (one continuous path → closed corners), `vector-effect: non-scaling-stroke` (uniform stroke at any aspect ratio — do NOT stretch a square viewBox without it), `stroke-dasharray: 7.5 6` (25% shorter dashes), animate `stroke-dashoffset → -13.5` over 4.5s (continuous marching ants). No block title; posts top-aligned.

- [ ] **Step 1: Create the component**

```astro
---
// src/components/home/BlogBlock.astro
import type { CollectionEntry } from "astro:content";
import { getPath } from "@/utils/getPath";
import Datetime from "@/components/Datetime.astro";

type Props = { posts: CollectionEntry<"blog">[] };
const { posts } = Astro.props;
---

<section class="b-blog" aria-label="From the blog">
  <svg class="ants" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
    <rect x="1" y="1" width="98" height="98"></rect>
  </svg>
  <ul class="posts">
    {
      posts.map(post => (
        <li class="post">
          <Datetime {...post.data} />
          <a href={getPath(post.id, post.filePath)} class="title">
            {post.data.title}
          </a>
          <p>{post.data.description}</p>
        </li>
      ))
    }
  </ul>
</section>

<style>
  .b-blog {
    height: 100%;
    position: relative;
    background: var(--background);
    padding: 1.4rem 1.6rem;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }
  .ants {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    overflow: visible;
  }
  .ants rect {
    fill: none;
    stroke: var(--accent);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
    stroke-dasharray: 7.5 6;
    animation: ants 4.5s linear infinite;
  }
  @keyframes ants {
    to {
      stroke-dashoffset: -13.5;
    }
  }
  .posts {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .post {
    padding: 0.7rem 0;
    border-bottom: 1px solid var(--border);
  }
  .post:first-child {
    padding-top: 0;
  }
  .post:last-child {
    border-bottom: 0;
  }
  .title {
    display: inline-block;
    font-family: var(--font-heading);
    font-size: 1.04rem;
    margin: 0.15rem 0;
    color: var(--accent);
    text-decoration: none;
  }
  .title:hover {
    text-decoration: underline;
    text-decoration-style: dashed;
    text-underline-offset: 4px;
  }
  .post p {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.45;
    opacity: 0.85;
  }

  @media (prefers-reduced-motion: reduce) {
    .ants rect {
      animation: none;
    }
  }
</style>
```

- [ ] **Step 2: Lint + format**

Run: `pnpm run lint && pnpm run format:check`
Expected: PASS.

- [ ] **Step 3: Build + visual check**

Run: `pnpm run build`, then dev check at `http://localhost:4321/`.
Expected: dashed accent border crawls continuously around the block; **corners are closed, dashes uniform**; posts are top-aligned; titles link to posts.

- [ ] **Step 4: Commit**

```bash
git add src/components/home/BlogBlock.astro
git commit -m "feat: add blog block with marching-ants frame"
```

---

## Task 5: Portfolio block (flip grid)

**Files:**
- Create: `src/components/home/PortfolioBlock.astro`
- Test (gate): build + dev visual check (hover + keyboard focus)

**Interfaces:**
- Produces: `<PortfolioBlock />` (no props for now; placeholder projects inline). Consumed by `index.astro` (Task 6).

**Design decisions baked in:** 2×2 squares filling the block; horizontal-axis flip (`rotateX(180deg)`) on `:hover` AND `:focus-within` (keyboard); titleless front, label on back; squares stay square via equal grid rows + `aspect-ratio` fallback; reduced-motion disables the spin.

- [ ] **Step 1: Create the component**

```astro
---
// src/components/home/PortfolioBlock.astro
// Placeholder projects until a real `portfolio` content collection exists.
const projects = [
  { cls: "sq1", label: "project one", href: "#" },
  { cls: "sq2", label: "project two", href: "#" },
  { cls: "sq3", label: "project three", href: "#" },
  { cls: "sq4", label: "project four", href: "#" },
];
---

<section class="b-portfolio" aria-label="Portfolio">
  <ul class="squares">
    {
      projects.map(p => (
        <li>
          <a class="flip" href={p.href} aria-label={p.label}>
            <span class="flip-inner">
              <span class:list={["flip-face", p.cls]} aria-hidden="true" />
              <span class="flip-face flip-back">{p.label} →</span>
            </span>
          </a>
        </li>
      ))
    }
  </ul>
</section>

<style>
  .b-portfolio {
    height: 100%;
  }
  .squares {
    list-style: none;
    margin: 0;
    padding: 0;
    height: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 1.1rem;
  }
  .squares > li {
    min-height: 0;
  }
  .flip {
    display: block;
    width: 100%;
    height: 100%;
    perspective: 800px;
  }
  .flip-inner {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    transition: transform 0.8s cubic-bezier(0.4, 0.2, 0.2, 1);
    transform-style: preserve-3d;
  }
  .flip:hover .flip-inner,
  .flip:focus-within .flip-inner,
  .flip:focus .flip-inner {
    transform: rotateX(180deg);
  }
  .flip-face {
    position: absolute;
    inset: 0;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .flip-back {
    transform: rotateX(180deg);
    background: var(--foreground);
    color: var(--background);
    font-family: var(--font-heading);
    font-size: 0.82rem;
    text-align: center;
    padding: 0.4rem;
  }
  .sq1 {
    background: linear-gradient(135deg, #e8837c, #f4a0b5);
  }
  .sq2 {
    background: linear-gradient(135deg, #a0c4f4, #b0a0e8);
  }
  .sq3 {
    background: linear-gradient(135deg, #a0e8b4, #f4e8a0);
  }
  .sq4 {
    background: linear-gradient(135deg, #ffd1c1, #e8837c);
  }

  @media (prefers-reduced-motion: reduce) {
    .flip-inner {
      transition: none;
    }
  }
</style>
```

- [ ] **Step 2: Lint + format**

Run: `pnpm run lint && pnpm run format:check`
Expected: PASS.

- [ ] **Step 3: Build + visual + keyboard check**

Run: `pnpm run build`, then dev check at `http://localhost:4321/`.
Expected: 4 gradient squares fill the block, perfectly square; hovering flips a square top-over-bottom to show its label; **Tab to a square and confirm it flips on focus** (keyboard a11y).

- [ ] **Step 4: Commit**

```bash
git add src/components/home/PortfolioBlock.astro
git commit -m "feat: add portfolio flip-grid block"
```

---

## Task 6: Homepage grid composition + width utility

**Files:**
- Modify: `src/styles/global.css` (add a homepage width utility)
- Rewrite: `src/pages/index.astro`
- Test (gate): full build + dev visual check, light/dark, mobile stack

**Interfaces:**
- Consumes: `HeroBlock`, `ServicesBlock`, `BlogBlock`, `PortfolioBlock`; `getCollection` from `astro:content`; `getSortedPosts` from `@/utils/getSortedPosts`; existing `Header`, `Footer`, `Layout`.
- Produces: the finished homepage.

**Design decisions baked in:** equal-cell grid (`grid-auto-rows: 380px` desktop, 340px mobile via `md` breakpoint), wider container than article pages (article `max-w-app` = `max-w-3xl` stays untouched), blocks in order Hero → Services → Blog → Portfolio.

- [ ] **Step 1: Add the homepage width utility to global.css**

Add after the existing `app-layout` utility (around `src/styles/global.css:60-62`):

```css
@utility home-layout {
  @apply mx-auto w-full px-4;
  max-width: 64rem; /* ~1024px — wider than article max-w-3xl for the 2×2 grid */
}
```

- [ ] **Step 2: Rewrite index.astro**

```astro
---
import { getCollection } from "astro:content";
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import HeroBlock from "@/components/home/HeroBlock.astro";
import ServicesBlock from "@/components/home/ServicesBlock.astro";
import BlogBlock from "@/components/home/BlogBlock.astro";
import PortfolioBlock from "@/components/home/PortfolioBlock.astro";
import getSortedPosts from "@/utils/getSortedPosts";

const posts = await getCollection("blog");
const recentPosts = getSortedPosts(posts).slice(0, 3);
---

<Layout>
  <Header />
  <main id="main-content" data-layout="index" class="home-layout my-8">
    <div class="home-grid">
      <HeroBlock />
      <ServicesBlock />
      <BlogBlock posts={recentPosts} />
      <PortfolioBlock />
    </div>
  </main>
  <Footer />
</Layout>

<style>
  .home-grid {
    display: grid;
    grid-template-columns: 1fr;
    grid-auto-rows: 340px;
    gap: 1.25rem;
  }
  @media (min-width: 768px) {
    .home-grid {
      grid-template-columns: 1fr 1fr;
      grid-auto-rows: 380px;
    }
  }
</style>

<script>
  document.addEventListener("astro:page-load", () => {
    const indexLayout = (document.querySelector("#main-content") as HTMLElement)
      ?.dataset?.layout;
    if (indexLayout) {
      sessionStorage.setItem("backUrl", "/");
    }
  });
</script>
```

- [ ] **Step 3: Lint + format**

Run: `pnpm run lint && pnpm run format:check`
Expected: PASS.

- [ ] **Step 4: Full build**

Run: `pnpm run build`
Expected: build + pagefind succeed, no errors.

- [ ] **Step 5: Visual gate (the important one)**

Run: `pnpm run dev`, open `http://localhost:4321/`.
Expected, verify all:
- Desktop ≥768px: equal 2×2 grid, order Hero(TL) · Services(TR) · Blog(BL) · Portfolio(BR).
- Resize <768px: blocks stack Hero → Services → Blog → Portfolio, each equal cell.
- Toggle dark mode (theme button in Header): all four blocks legible, accent flips blue→orange.
- All 5 motions run; the cloud/rainbow background still shows behind the blocks.
- Tab through the page: visible focus on socials, blog links, portfolio squares.

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css src/pages/index.astro
git commit -m "feat: compose homepage as 2x2 block grid"
```

---

## Task 7: Accessibility & reduced-motion verification pass

**Files:**
- Possibly modify: any block component if a check fails.
- Test (gate): reduced-motion + Lighthouse a11y.

- [ ] **Step 1: Reduced-motion check**

In the browser devtools, enable "Emulate prefers-reduced-motion: reduce" (Rendering panel) and reload `http://localhost:4321/`.
Expected: hero shows one static image (no fade), services marquee is static, blog frame dashes are static, portfolio squares don't spin. No motion anywhere.

- [ ] **Step 2: Lighthouse accessibility audit**

Run Lighthouse (or `pnpm run build && pnpm run preview` then Lighthouse) on the homepage.
Expected: **Accessibility score 100.** Common things to fix if it drops: pastel-on-pastel contrast (use `--foreground`/plum text, not white, on light pastels), missing `aria-label` on icon-only links, heading order (only one `h1` — the hero).

- [ ] **Step 3: Fix any findings, then re-run**

If anything failed, fix it in the relevant component and re-run Steps 1–2.

- [ ] **Step 4: Final validation + commit (only if changes were made)**

```bash
pnpm run lint && pnpm run format:check && pnpm run build
git add -A
git commit -m "fix: address homepage accessibility and reduced-motion findings"
```

---

## Self-Review notes (coverage against the spec)

- §2 layout/order/equal-cells/stack → Tasks 6 (grid) + 2–5 (blocks). ✓
- §2 sharp corners / no titles / no frames except blog → enforced in each component's styles (no `border-radius`; only BlogBlock has a frame). ✓
- §3 tokens/fonts/idioms → Global Constraints + per-component styles use the CSS vars; wider container via `home-layout`/`home-grid`, article `max-w-app` untouched (Task 6). ✓
- §4a all 5 motions with exact configs → Hero (T2), Services (T3), Blog (T4), Portfolio (T5); CloudDecoration unchanged. ✓
- §5 constraints (pure Astro, Tailwind 4, no console, a11y, no AI mentions) → Global Constraints + Task 7. ✓
- §6 real content (hero copy with typo fixed, socials, 6 services, recent posts) → T2, T1, T6. ✓
- §7 out of scope (portfolio collection, About, other pages) → not touched; portfolio uses placeholders (T5). ✓
- §9/§10 decisions + colors-resolved → reflected in baked-in design notes and Global Constraints. ✓

Open item carried from spec §10: real hero images and real portfolio projects are owner-supplied later; placeholders ship now (noted in T2/T5).
