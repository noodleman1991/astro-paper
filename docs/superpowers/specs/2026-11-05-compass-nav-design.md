# Design — Compass homepage

**Date:** 2026-11-05
**Status:** design approved on the canvas (v6.1); builder check done, owner questions answered
**Branch:** `feat/homepage-2x2`
**Visual reference:** the owner's design canvas (private link; the owner has it). Its boards are "desktop prototype", "phone prototype", "flow", "visual language", "blog page" and "contact, sharing + link cards". Copies of the boards and screenshots are in the reference folder below.
**Reference folder:** `docs/superpowers/specs/2026-11-05-compass-nav/`

- `geo.mjs`, `shapes.mjs`, `shapes.json`, `phone-stream.mjs` — the scripts that produced the approved shapes, and their output. Use `shapes.json` as the data and port `phone-stream.mjs`; never redraw a shape by hand.
- `boards/*.dc.html` — the prototype boards themselves: markup, CSS and the logic class (state, peek, dial, docking, windows, drawer, plain menu). Treat them as the behavioural reference. They run in the design tool's runtime, so read them rather than open them.
- `screens/*.png` — every prototype state, captured from the running prototype: desktop idle, hover peek, each section, window, dial before and after a turn; phone idle, each section, stream before and after scrolling, plain menu, drawer, window.

---

## 1. Intent

The homepage becomes a compass: one round menu in the middle of the screen with three slices — **blog** (upper left), **services** (upper right), **portfolio** (bottom) — and the **spiro spero** logo as the hub, which opens **about**. Clicking a slice makes that slice grow out into its section, like poured paint that keeps the slice's own edges, with paper left around it. Inside, the content sits in tiles that fit into each other: tidy, with slight peculiarities.

The site is a one-person studio's front door. It should feel playful and personal ("soft punk": hand-drawn edges, riso dots, lowercase, organic motion) and still read as professional to someone hiring a developer. Light visual load: few tiles, lots of air, details live in windows, not on the surface.

This replaces the current 2×2 homepage grid (`src/pages/_shared/HomePage.astro` with Hero/Services/Blog/Portfolio blocks).

## 2. Goals, non-goals, anti-goals

**Goals**

- The compass is the homepage navigation on desktop and phone, in English and Hebrew.
- Each section grows out of its own slice. Desktop: the compass stays put. Phone: the compass docks aside, partly off-screen, so the section has room.
- Portfolio shows ten projects without "more"/"next" buttons. Movement is built into the shape: a **dial** on desktop, a **stream** on phone.
- Details open in a window (modal) per service, project, and "how i work"; blog tiles link to posts and the blog page.
- All content is in the HTML (SEO, no-JS readable), Lighthouse 100 in all four metrics, WCAG 2.1 AA.

**Non-goals (this spec)**

- The blog page restyle and the link cards (OG images) shown on the canvas: each is a later, separate plan (§9).
- A CMS. Content comes from the repo; the Sanity plan in `2026-07-02-portfolio-supercharge-design.md` can swap the data source later.
- A separate about page or portfolio page. Only the blog has its own page.

**Anti-goals (fail even if it "works")**

- Blobby lobes, puffs, drips. The owner rejected these ("testicles or vomit"). Spills continue the slice's edges and end in one smooth front.
- Floating boxed labels on the compass.
- Explicit "more", "next" or "pour more" buttons for the portfolio carousel.
- Dense screens. If it looks busy, cut.
- A framework runtime (React/Vue) or a big animation library.

## 3. Constraints

- Pure `.astro` components plus small vanilla TS modules; TailwindCSS 4 utilities; CSS variables for theming (`[data-theme=dark]`). See the repo conventions file at the root.
- Static output on Cloudflare Pages. No server code for this feature.
- i18n already exists: `en` at `/`, `he` at `/he/` (RTL), via `src/i18n`. Both locales render the same `HomePage.astro`.
- `ClientRouter` view transitions are on: client scripts must re-initialise on `astro:page-load` and clean up on navigation.
- The owner has an uncommitted dependency bump in `package.json` (Astro `^7.4.5`). Verify every Astro API against the version actually installed when you build. Don't trust older docs or memory. Don't touch the owner's uncommitted files (`package.json`, `pnpm-lock.yaml`, `src/data/blog/knowledge-trees.md`).
- No `console.*` (ESLint error). No AI mentions anywhere in code, comments, commits, or PRs.
- Vitest exists (`pnpm test`). Validation = lint + format:check + test + build.

## 4. What the owner decided

### 4.1 The compass

- **Desktop:** a 360 px compass centred in the stage. Wedges (math degrees, y up): services −28°…88°, blog 92°…208°, portfolio 212°…328°. Outer radius 150, paper disc 153, dotted orbit 166, hub radius 62.
- **Phone** (390 × 844 reference): a 300 px compass, radius 130, hub 56.
- **Titles sit on one shared circle, like a seal.** Blog and services run over the top, centred at 122° and 58° (gentle ±32° tilt). Portfolio runs under the bottom, upright. No boxes. The open section's title gains a small "×" that closes it. Desktop baselines: r 97 on top, r 116 at the bottom; phone: r 83 and r 100.
- **Hover (desktop):** a slice "peeks": a third-size, faint version of its spill grows out. Nothing else moves.
- **Click a slice:** its section grows out (§4.2). Click the same slice again, or its title's ×, to close. The logo opens about.
- **Phone docking:** when a section opens, the compass moves to the side opposite the spill and docks at scale 0.72, partly off-screen. Docked centres in the 390 × 844 frame: services → (58, 786), blog → (332, 786), portfolio → (195, 38), about → (195, 800).
- **Phone plain menu:** a small × on the ring swaps the compass for a conventional tab bar, with the logo leading. In this mode the home screen shows the big logo, a two-line intro and "pick a section below ↓".
  - The bar is a 72 px strip at the bottom: portfolio, services, blog, about, each with a small colour dot, plus a ring icon that brings the compass back.
  - Sections still pour as on the phone. Where the docked slice would be, they pour from a "paper plug": a paper disc (r 96) with a dotted ring (r 104) and the section's name. See `screens/phone-07-plain-menu.png` and the `.ph-plug` / `.ph-tabs` markup in `boards/Phone.dc.html`.
  - Desktop has no plain mode.

### 4.1a Hebrew: a mirrored layout (owner, 2026-11-05)

On `/he/` the whole composition mirrors left to right. Everything listed below uses the English shapes reflected horizontally: x′ = 1280 − x on desktop, x′ = 390 − x on phone.

- Blog sits upper-right and services upper-left; portfolio and the hub stay centred.
- The spills, necks, sparkles, side notes and tiles all mirror.
- Phone docks mirror: services → (332, 786), blog → (58, 786). Portfolio and about stay centred.
- The stream's row splits mirror.
- The dial's reading order runs right to left. Project 01 starts at the right end of the window, "forward" turns the other way, and arrow keys and drag follow RTL (← is next).
- Text is never mirrored. Labels sit at the mirrored positions but read normally, and the arc titles get their own mirrored arc paths so the Hebrew reads correctly along them.
- The top bar follows the page direction, as the site already does for RTL.

### 4.2 Spills (services, blog, about)

- A spill is its slice grown bigger. Its edges continue straight out, it ends in one smooth front, and paper shows around it. Desktop origins ("necks"): services (770, 357), blog (510, 357), portfolio (640, 582), about (640, 432) in the 1280 × 800 frame.
- **Services:** six tiles inside the spill (web development, knowledge hubs, AI integration, data tools, app development, databases). Web development is the hero (strongest tint plus riso dots). Each tile shows its title, with a "→" on hover/focus, and opens that service's window. Side note: "services / six ways i can help / open one for the details".
- **Blog:** three pie-cut tiles: the latest post (hero: date, title, "read →"), the post before it (title, date), and "all posts · tags · search", which goes to the blog page. Side note: "blog / notes as i go / the whole list lives on its own page".
- **About:** the logo breathes out a halo all the way round the compass, in four sectors. They are intro ("hi, i'm amit", one line, "spiro spero — i breathe, i hope"), a photo, "how i work" (opens a window), and "say hi" (mail + LinkedIn). A round × badge at the top of the hub closes it.
- Tiles fit into each other with even channels between them. Corner radii vary per corner, and seams wave slightly. Each is exactly as generated in `shapes.mjs`.

### 4.3 Portfolio

- **Desktop dial.** The grown bottom slice is a window onto a ring of 11 cells around the compass: ten projects plus "that's the lot / say hi". Four cells show in the window. The neighbour on each side peeks in as a sliver at the window's edges; that sliver is the hint.
  - Turn the dial by scroll (one step per gesture), drag (horizontal, > 40 px), arrow keys, or clicking a sliver. One step takes 0.85 s, and the ring wraps around.
  - Labels stay upright while the ring turns. Clicking a project opens its window ("portfolio · 03 / 10", with "next →").
  - Side note: "selected work / ten projects on a dial / scroll, drag or tap an edge".
- **Phone stream.** The compass docks at the top centre and the portfolio slice pours a still envelope down the screen. The envelope narrows into the slice at the top and reaches full width by y ≈ 300.
  - The section does not scroll. Scroll, drag or swipe inside the envelope and the tiles stream through it. Rising tiles narrow and flatten into the neck under the docked compass; tiles further down open to full width. Their labels shrink and fade with them.
  - Rows hold two tiles each (split position varies), plus the final full-width "that's the lot" tile. Momentum after a swipe. A tap opens the project; a drag never does.
  - Reference implementation: `phone-stream.mjs` (`pfGeo(offset)`).

### 4.4 Windows

- Desktop: a centred modal over a dimmed page. Phone: a bottom sheet. Both carry the section's colour strip and riso dots in the header, plus a kicker (e.g. "services", "portfolio · 01 / 10"), title, one-line lead, a couple of paragraphs, link chips, and a closing call to action ("start something like this →", "something like this? say hi →").
- Project windows have "next →".

### 4.5 Top bar and contact

- Desktop: an always-present top bar with the name, email (click copies with "copied ✓"; still a `mailto:`), LinkedIn, share, `en · עב`, and a dark-mode toggle. The middle stays empty.
- Phone: a "say hi" button opens a drawer with the contact details and share.

### 4.6 Visual language ("soft punk")

- **Tokens (light / dark):** bg `#fdfdfd` / `#212737`; fg `#282728` / `#eaedf3`; soft `#4a494a` / `#c3c8d4`; accent `#006cac` / `#ff6b01`. These match `src/styles/global.css`.
- **Section spots:** portfolio `#e8837c`, services `#a0c4f4`, blog `#a0e8b4`, about `#f4a0b5`. Tile tints are `color-mix(in srgb, spot X%, bg)` with spill 20%, k2 30%, k3 40%, hero 52%, and hover/active 72% (light mode). Dark mode uses its own ladder (§5).
- **Fonts:** Chicle (logo), McLaren (titles and labels), Google Sans Code (body). Hebrew pairs are needed for McLaren and the body font (§8).
- **Lines:** 2 px ink strokes, slightly rough (SVG turbulence filter). A dashed "marching ants" outline traces each open spill, and two small four-point sparkles appear at its front. Riso dot texture on hero tiles. Lowercase everywhere decorative.

### 4.7 Motion

- **Grow:** 1.15 s, `cubic-bezier(.2,.9,.28,1)`, scaling from the slice's neck. Then the tiles fade in, labels stagger in (70 ms apart, from 0.8 s), and the ants and sparkles arrive at about 1 s.
- **Close:** about 0.7 s, accelerating back into the slice.
- **Dial:** 0.85 s per step, with the same easing family.
- **Variety:** a little randomisation per visit (the owner likes things to look slightly different each time), as long as the shapes stay tidy. What varies is settled in §5.
- **Reduced motion:** sections appear without growing, the dial steps without a turn animation, the stream has no momentum.

## 5. Calls I made (builder may revisit; flag if you change them)

- **Geometry as data.** The approved `shapes.json` is copied into `src/data/compass/` and rendered as inline SVG. The generator stays in the reference folder, for regenerating if a shape ever changes. Porting it would add risk for no gain, since the tile geometry is fixed per build. The only runtime geometry is the phone stream, a TypeScript port of `phone-stream.mjs`. The dial is a CSS `transform: rotate()` on the ring, with labels counter-rotated. The Hebrew mirror is an SVG reflection about the stage's centre line, plus mirrored label coordinates. _(Revised while planning, 2026-11-05.)_
- **One client module** (`src/scripts/compass.ts`) owns the state: which section is open, peek, dial step, stream offset, open window. It toggles classes and `aria-*`. Everything visual is CSS.
- **Windows use native `<dialog>` + `showModal()`** for focus trapping and Esc. All window content renders in the HTML up front.
- **Deep links via the hash:** `#services`, `#services/<slug>`, `#blog`, `#portfolio`, `#portfolio/<nn>`, `#about`, `#about/how`. Opening something pushes history, so Back closes it. The link cards board already uses `/#services/knowledge-hubs`.
- **Stage scaling:** the desktop composition is authored on a 1280 × 800 stage and the phone one on 390 × 844. Each scales uniformly to fit the viewport below the top bar. The phone layout applies under 768 px wide; desktop at 768 px and above.
- **Content:** services from the existing `src/config/services.ts` (both locales). Blog from the collection (latest two posts). Projects from a new placeholder data file per locale (ten entries: title, tag, year, lead, paragraphs, links) until a real collection exists. About text from translations.
- **No-JS:** the wedges are anchor links. Without JS, all sections render as plain stacked lists under the compass, readable and navigable.
- **Per-visit variety covers decoration only.** That means:
  - sparkle positions and turn;
  - the seed of the rough-edge turbulence filter;
  - the phase of the marching ants;
  - the order of the label stagger.

  Tile geometry stays exactly as built, one static SVG set. The blog page's "seams re-roll per page" belongs to that later phase.
- **Dark-mode tint ladder.** As specified, the light-mode ladder fails AA in dark mode. Measured, light text on dark mixes passes 4.5:1 only up to a 38% tint for every spot, and the soft text only up to 25%. So in dark mode:
  - The ladder is spill 12%, k2 16%, k3 20%, hero 25%, hover/active 36%.
  - On hover/active tiles, secondary text switches from soft to fg.
  - Light mode is unchanged; it passes everywhere, though soft text on the portfolio's 72% hover is exactly 4.50, so use fg there too.
  - Add a Vitest contrast check over every spot × tint × text colour in both themes so this can't regress.
  - The owner sees the darker look at the first visual pass.
- **Plain-menu choice persists** in `localStorage`, read with try/catch, default compass. It is neither the no-JS nor the reduced-motion presentation.
- **Scope stays on the homepage.**
  - The top bar is built as a component and used on the homepage. Other pages keep the current header until the blog-page phase, which adopts the top bar site-wide, as the canvas shows for every desktop page.
  - The "About" nav item points to `/#about` (or `/he/#about`).
  - The `/about` and `/he/about` stubs redirect there.
- **Build order includes a visual checkpoint.** After the static desktop composition and one working section, stop for the owner to look in a browser before doing the rest. This is the owner's preferred way to work.

## 6. Accessibility

- Wedges and the hub are real `<button>`s with `aria-expanded` and `aria-controls`, names from the arc titles. The SVG art is `aria-hidden`.
- Tiles are real `<button>`s (opening windows) or `<a>`s (posts, the blog page); sections are `<section aria-label>`.
- Dial:
  - Arrow keys turn it.
  - Off-window projects are `inert` / hidden from the accessibility tree.
  - A polite live region says "projects 3–6 of 10".
- Stream: arrow keys and PageUp/PageDown glide it; focusing a tile glides it into view.
- Contrast: label text on every tint must meet AA in both themes. Check the 52% and 72% tints in dark mode particularly.
- Focus is visible on every control; the window returns focus to its opener.

## 7. Left to the builder

- Component breakdown and file names (keep it minimal).
- How the Hebrew arc titles render: SVG `textPath` with `direction: rtl` needs checking in Safari.
- The exact stage-scaling technique, and the top bar's integration with the existing `Header.astro`.
- Test scope. At minimum, Vitest coverage for:
  - the shape data: well-formed paths, no NaN, every tile with a label box inside the stage;
  - the dial index maths, wrap included;
  - the stream mapping: monotonic, scale and opacity bounds, max offset;
  - the mirrored set: every mirrored point equals the reflected English one, and RTL dial steps run the other way.
- Performance: the stream re-renders 11 paths per frame. Keep it in `requestAnimationFrame` and drop the turbulence filter on moving tiles if it costs frames on a mid-range phone.

## 8. Open questions for the owner

1. **Hebrew layout** — answered 2026-11-05: mirror it (see §4.1a).

## 9. Later phases (separate plans)

1. **Blog page restyle** (canvas board "blog page"): tiles band, newer posts join from the left, seams re-roll per page.
2. **Link cards** (canvas board "contact, sharing + link cards"): one 1200 × 630 template per page kind (home, post, service, project), built on the existing Satori pipeline.
3. **Top-bar additions** discussed on the canvas (GitHub link, booking link, WhatsApp on phones) — owner to pick.
