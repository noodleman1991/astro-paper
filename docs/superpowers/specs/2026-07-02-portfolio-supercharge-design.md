# Design Spec — Portfolio Supercharge

**Date:** 2026-07-02
**Status:** draft — pending owner review
**Scope:** six subsystems layered onto the existing site. The current 2×2 homepage layout is **kept** (per the 2026-06-28 brief); this spec supercharges it — bilingual, CMS-driven, more alive — while staying calm.

**Decisions confirmed by the owner:**

- i18n: full site bilingual (en/he); blog posts get an *optional* Hebrew translation, untranslated posts fall back to English with a note.
- Blog content moves to Sanity (along with homepage blocks, services, portfolio).
- URLs: English at root, Hebrew under `/he/`, plus first-visit auto-detect via `Accept-Language`.
- Typography: keep the English trio (Google Sans Code / McLaren / Chicle), pair each role with a Hebrew mate.
- Analytics: PostHog EU in **cookieless mode** — no consent banner; a footer privacy line + `/privacy` page instead.

**Decisions assumed while the owner was away** (swap freely at review):

- **[ASSUMED]** Contact form = "conversational reveal" in the hero (details in §6), with a plain `/contact` page as the no-JS fallback and permalink.
- **[ASSUMED]** Sanity Studio embedded at `/studio` in this repo (vs. a separately deployed studio).
- **[ASSUMED]** Hebrew font mates: **Assistant** (body), **Fredoka** (headings). Logo stays Chicle "spiro spero" in both locales.
- **[ASSUMED]** Color refinement = token restructuring + contrast fixes now, exact values iterated visually with the owner (per their preferred workflow).

---

## 1. Big picture

```
Sanity (new org, dataset: production)
   │  GROQ at build time                      Cloudflare Pages
   ├─ homePage (singleton, localized fields)  ┌──────────────────────────┐
   ├─ service[]                               │ static Astro site (en, /he)│
   ├─ project[] (portfolio)                   │ + Pages Functions:        │
   ├─ post[] (document-level i18n)            │   /api/contact  (Resend)  │
   └─ siteSettings (singleton)                │   root middleware (lang)  │
   publish → webhook → CF deploy hook → rebuild └──────────────────────────┘
Visitor: PostHog EU, cookieless (memory persistence) — no banner
```

The site stays **fully static** (Lighthouse 100 preserved). Sanity is a build-time data source; publishing triggers a rebuild via a Cloudflare Pages deploy hook. Only two pieces of server code exist, both tiny Pages Functions: the contact endpoint and the root language redirect.

**Implementation phases** (each gets its own plan; order is dependency-driven):

1. **i18n foundation** — routing, dictionaries, RTL, fonts (content still file-based)
2. **Sanity** — org/project, schemas, swap all content sources, studio, webhook
3. **Services dialog**
4. **Contact form** + Pages Function
5. **PostHog + privacy page**
6. **Color refinement** (visual iteration pass)

Phase 6 is deliberately last so color decisions land on the finished bilingual UI.

---

## 2. i18n + RTL

### Routing

- Astro built-in i18n: `defaultLocale: "en"`, `locales: ["en", "he"]`, `prefixDefaultLocale: false`. English URLs unchanged; Hebrew mirrors under `/he/…`.
- Page files: shared page components in `src/pages/_shared/` (underscore-excluded from routing); `src/pages/*.astro` and `src/pages/he/*.astro` are thin wrappers passing `locale`.
- **Auto-detect:** a Cloudflare Pages Function middleware on `/` **only** (never deeper URLs): if no `lang-pref` cookie and `Accept-Language` prefers `he`, 302 → `/he/`. The header language toggle sets `lang-pref` (functional cookie, consent-exempt under GDPR; disclosed on `/privacy`).
- Head: `hreflang` alternates on every page; per-locale sitemap; `/he/rss.xml` alongside `/rss.xml`.

### UI strings

- `src/i18n/en.ts` + `src/i18n/he.ts`, one typed shape (`satisfies` a shared interface so a missing Hebrew key is a type error). `useTranslations(locale)` helper. UI chrome lives in code, **content** lives in Sanity — that's the boundary.

### RTL

- `<html lang="he" dir="rtl">` on Hebrew pages (extend `Layout.astro`'s existing `dir` handling).
- Audit pass converting direction-sensitive CSS to logical properties: Tailwind's `ms-/me-/ps-/pe-/start-/end-`, and `margin-inline-*`/`inset-inline-*` in component `<style>` blocks. Most existing block CSS is vertical (marquee translateY, margin-bottom) and unaffected.
- Explicitly flip: back-button arrow, breadcrumb separators, header slide-in direction, any chevrons. The marching-ants border, flips, and crossfades are direction-neutral.
- Hebrew text rules: `letter-spacing: 0` (Hebrew must never be tracked), check line-height (Hebrew often wants slightly more), numbers/dates render LTR inside RTL text automatically via bidi — use `Intl.DateTimeFormat` with the locale for dates ("2 ביולי 2026").
- Slugs: existing convention already handles it — `lodash.kebabcase` for Hebrew titles.

### Risks

- **OG images (Satori):** Satori's RTL support is partial. Plan: load a Hebrew font into Satori and test; if Hebrew titles render wrong, fall back to a static OG image for Hebrew pages (acceptable, low-traffic surface). Verify during phase 1.
- **Pagefind search:** supports multilingual indexing via `data-pagefind-*` and `lang` attributes — verify Hebrew tokenization during phase 1.

---

## 3. Typography (en + he)

| Role | English (kept) | Hebrew mate | Why |
|---|---|---|---|
| Body `--font-app` | Google Sans Code | **Assistant** | clean, slightly technical, matches Sans Code's neutrality |
| Headings `--font-heading` | McLaren | **Fredoka** | rounded and playful like McLaren, has a real Hebrew set |
| Logo `--font-logo` | Chicle | — (stays Latin) | "spiro spero" is a Latin motto; it stays the wordmark in both locales |

- Loaded through the existing Astro Fonts API (`<Font>` in `Layout.astro`) — self-hosted woff2, no Google CDN (privacy). Add `hebrew` subsets; preload the Hebrew body font only on `/he/` pages.
- Font stacks: `--font-app: "Google Sans Code", "Assistant", monospace-ish fallbacks`. Google Sans Code has no Hebrew glyphs, so mixed-language text falls through to Assistant automatically; on Hebrew pages the same stack works because Latin words (code, names, "spiro spero") *should* render in Sans Code.
- Fredoka is variable-weight — pick 500 for headings to echo McLaren's weight.
- **[ASSUMED]** — if Assistant/Fredoka don't feel right, the runner-up pairing is Heebo (body) + Suez One (headings, more editorial). Decide with rendered samples during phase 1.

---

## 4. Sanity CMS

### Setup

- Owner creates a new Sanity organization; project `spiro-spero`, dataset `production`. Free plan suffices (2 users, 2 datasets).
- **[ASSUMED]** Studio embedded at `/studio` via `@sanity/astro` (`studioBasePath`) — one repo, one deploy, Studio is a client-rendered SPA route so the static build is unaffected. Fallback if the integration fights Astro 5 static + Cloudflare: `sanity deploy` to `spiro-spero.sanity.studio` from a `/studio` workspace folder in the same repo. **Verify current `@sanity/astro` compatibility before building** (post-cutoff knowledge rule).
- Build-time fetch with `@sanity/client` + GROQ; `useCdn: false` at build. Sanity webhook (on publish) → Cloudflare Pages deploy hook → rebuild. Content changes go live in ~2 min with zero runtime cost.
- Images: Sanity CDN via `@sanity/image-url` (hotspot/crop support); `alt` is a **required** field on every image type.

### Localization model (two patterns, used deliberately)

- **Field-level** for singletons and small docs (`homePage`, `service`, `project`, `siteSettings`): fields like `title: {en, he}` via `sanity-plugin-internationalized-array` or a plain object — one document, both languages side by side in Studio. Hebrew inputs get `dir="rtl"` in Studio.
- **Document-level** for `post` via `@sanity/document-internationalization`: each translation is its own document with a `language` field, linked by translation metadata. This is what makes "optional Hebrew translation" natural — a Hebrew post either exists or it doesn't; the `/he/posts/...` route falls back to the English document plus an "this post hasn't been translated yet" note (in Hebrew).

### Schemas

- `homePage` (singleton): hero heading, hero intro (portable text, localized), hero image pool (exactly 4, with alt), social links ref → siteSettings.
- `service`: `icon` (name from the site's icon set), `title`ᴸ, `blurb`ᴸ, `details`ᴸ (portable text — the dialog body), `links[] {label*ᴸ, url, kind: source|tool|writing}`, `order`. Powers both the marquee tile and the dialog (§5).
- `project`: `title`ᴸ, `image` (square, alt required), `backLabel`ᴸ, `url`, `order`. Powers the portfolio flip squares; a richer project page is out of scope (noted as future).
- `post`: `title`, `slug`, `description`, `body` (portable text), `pubDatetime`, `modDatetime`, `featured`, `draft`, `tags[]`, `ogImage`, `language` + translation metadata. Mirrors the current Zod frontmatter so `getSortedPosts`/filters port over.
- `siteSettings` (singleton): socials, contact email, footer privacy lineᴸ, hero social row config.

(ᴸ = localized field.)

### Migration + guardrails

- The 2 existing markdown posts are migrated to Sanity by script (markdown → portable text) during phase 2; `src/data/blog/` and the glob loader are then removed, `content.config.ts` replaced by GROQ queries + a Zod parse of the response (keep runtime validation — don't trust the CMS blindly).
- Portable Text rendered with `astro-portabletext`; code blocks keep Shiki highlighting.
- Build fails loudly if required singletons are missing — no silent empty homepage.

---

## 5. Services dialog

Clicking a service tile (marquee pauses on hover already; tiles become `<button>`s) opens a **native `<dialog>`**:

- Content from the `service` doc: title, `details` portable text (what it is, how I work, what I'm curious about right now), then a **sources & links** list — each link labeled by kind (source / tool / writing) with an external-link glyph. This is the "professional, lively, curious" surface: the details copy is encouraged to link outward generously.
- One dialog element on the page, content swapped per service (light DOM, no framework).
- Motion: gentle scale-from-tile + fade via the existing `--ease-out-soft`, backdrop blur; honors `prefers-reduced-motion`. Sharp corners, consistent with the locked visual language.
- Native focus handling, `Esc`/backdrop click closes, `aria-labelledby` the service title. Marquee pauses (`playing` class off) while open.
- **Deep-linkable:** `#service-<slug>` opens the dialog on load and is set on open, cleared on close — services become shareable/linkable, which suits the curious vibe.
- Fully bilingual; in RTL the dialog layout mirrors automatically (logical properties only).

---

## 6. Contact — conversational reveal **[ASSUMED]**

- The hero's mail icon (and a "say hi" text link for discoverability) morphs the hero block's text area into a **mini conversational form**: one friendly prompt at a time — *who are you?* → *what's on your mind?* → *where do I reply?* — with the previous answers stacking above like a quiet chat. Progress is visible; every step can go back. Calm, small motion using the shared easing vocabulary; reduced-motion gets instant swaps.
- **Progressive enhancement:** it's a real `<form method="post" action="/api/contact">` under the hood. Without JS (and at `/contact` and `/he/contact`, which also serve as the permalink fallback), it renders as a plain three-field form. Same endpoint.
- **Endpoint:** Cloudflare Pages Function `POST /api/contact` → send via **Resend** (or plain MailChannels if you'd rather avoid another vendor — decide at review) to the site email. Validation server-side; success/failure states rendered inline in both languages.
- **Anti-spam, privacy-first:** honeypot field + minimum-time trap + same-origin check. No CAPTCHA vendor, no cookies. If spam becomes real, escalate to Cloudflare Turnstile (cookieless, already on-platform) — not before.
- PostHog captures a single anonymous `contact_submitted` event (no form contents).

---

## 7. PostHog + privacy (no cookie banner)

- `posthog-js`, **EU cloud** (`eu.i.posthog.com`), configured: `persistence: "memory"`, `autocapture: false` (explicit events only), `capture_pageview: true`, `disable_session_recording: true`, respect DNT. Nothing is written to the visitor's device → **no consent banner required**; the "cookie notice" becomes a one-line footer note: *"no cookies here — anonymous, session-only stats. how?"* linking to `/privacy`.
- Loaded lazily after `astro:page-load` idle; must not affect Lighthouse. `import.meta.env.PUBLIC_POSTHOG_KEY` gated so dev builds don't send events.
- Events (small, intentional set): pageview, `service_dialog_opened` (which service), `contact_submitted`, `lang_switched`, `survey_*`.
- **Surveys:** PostHog Surveys via popover — used sparingly and in-character, e.g. a one-question "was this useful? what should I write about next?" on blog posts after meaningful scroll. Works per-session in cookieless mode (a survey may reappear across visits — acceptable trade-off, keep surveys rare and dismissible).
- `/privacy` + `/he/privacy` (content in Sanity `siteSettings` or a small doc): what's collected (anonymous events), what isn't (no cookies, no fingerprinting, no cross-visit tracking), the one functional `lang-pref` cookie, contact-form data handling (email only, no storage). Honest, short, in the site's voice — privacy as a feature, stated proudly.
- Verify current `posthog-js` cookieless options against docs at build time (post-cutoff rule).

---

## 8. Color refinement **[ASSUMED — values iterated visually]**

Structural changes now; exact values chosen with the owner in the browser (their preferred workflow):

- **Promote hardcoded colors to tokens.** The coral/peach service-tile gradient (`#e8837c → #ffd1c1`) and `--plum` become real theme tokens: `--accent-2` (warm companion accent) + `--accent-2-soft`. Every block that currently hardcodes a hex migrates to tokens — a prerequisite for coherent refinement and for theming from one place.
- **Add two neutrals:** `--surface` (the current `color-mix(muted 45%, background)` recipe, used everywhere, deserves a name) and `--foreground-muted` (today's various `opacity: .85` text becomes a real color, which is better for contrast control).
- **Contrast fixes (WCAG AA, measured not guessed):** dark-mode `--accent` `#ff6b01` on `#212737` sits near the AA boundary for small text — nudge lightness until it clears 4.5:1. Dark `--border` `#ab4b08` reads loud against the calm brief — candidate for a quieter neutral with the orange reserved for the marching-ants frame only.
- **Direction:** keep both accent identities (light = sea blue, dark = ember orange — it's distinctive); refine *around* them with tints via `color-mix`. No palette replacement.
- Verification: contrast checked programmatically for all token pairs in both themes; visual pass with the owner before locking.

---

## 9. Cross-cutting requirements

- **Accessibility:** everything keyboard-reachable (dialog, form steps, language toggle); focus visible (existing dashed outline convention); `aria-live` for form step changes; Lighthouse 100 accessibility maintained in both languages and directions.
- **Performance:** site stays static; PostHog lazy; fonts subset + preloaded per locale; Sanity images sized/formatted via CDN params. Lighthouse 100 in all metrics remains the bar.
- **Validation:** lint + format + typecheck + build (both locales) per phase; contrast checks in phase 6; manual RTL visual pass on every block.
- **Env/secrets:** `SANITY_PROJECT_ID`, `SANITY_DATASET`, `RESEND_API_KEY` (or none if MailChannels), `PUBLIC_POSTHOG_KEY` — Cloudflare Pages env vars; `.dev.vars` locally; never committed.
- **Error handling:** build fails on missing Sanity singletons/malformed content (Zod parse); contact function returns typed error states rendered inline; PostHog failures are silent to the visitor (analytics must never break the site).

## 10. Out of scope (noted, not built)

- Rich per-project portfolio pages (portfolio squares keep linking out).
- Sanity visual editing / live preview (needs SSR; revisit if editing friction hurts).
- Comments, newsletter, session replay, A/B testing.
