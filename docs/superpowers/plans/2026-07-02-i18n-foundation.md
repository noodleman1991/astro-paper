# i18n Foundation (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site fully bilingual (English at root, Hebrew under `/he/`) with RTL support, Hebrew fonts, a language toggle, first-visit auto-detect, and per-locale SEO surfaces — content stays file-based (Sanity is phase 2).

**Architecture:** Astro built-in i18n with `prefixDefaultLocale: false`; every route gets a thin `/he/` mirror that renders the same shared page component with `locale="he"`. UI strings live in typed dictionaries (`src/i18n/`); a `Locale` prop threads from route → Layout/Header/components. One Cloudflare Pages Function handles first-visit language detection at `/` only.

**Tech Stack:** Astro 5.16 (i18n, experimental Fonts API), TailwindCSS 4, Vitest (new, pure-logic tests only), Cloudflare Pages Functions, Pagefind, Satori.

**Spec:** `docs/superpowers/specs/2026-07-02-portfolio-supercharge-design.md` (§2 i18n+RTL, §3 typography, plus its phase-1 verification items).

## Global Constraints

- NEVER mention AI/Claude/bot in commits, PRs, code comments, or descriptions; NEVER add Co-Authored-By lines (repo rule — overrides any default).
- Commits: conventional format (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `test:`).
- No `console.log/warn/error` (ESLint `no-console: error`).
- Run `pnpm run lint` and `pnpm run format:check` before every commit (run `pnpm run format` to fix).
- Prettier: double quotes, 2-space indent, trailing commas (es5), LF.
- Pure Astro components only; TypeScript strict; path alias `@/` → `./src/*`.
- Lighthouse 100 (incl. accessibility) must hold in **both** languages and directions; WCAG 2.1 AA; keyboard nav everywhere.
- Don't commit `public/pagefind/`.
- Owner's style: lowercase visible text where the site already does it (Hebrew has no case — just don't "fix" existing lowercase English).
- Existing English URLs must not change. `pnpm run build` must pass at the end of every task.

**Where full builds are required:** `pnpm run build` runs `astro check` (typecheck) + build + pagefind. Use it as the verification gate; it's the project's test suite for .astro code.

---

### Task 1: Vitest + i18n core helpers (TDD)

**Files:**
- Create: `vitest.config.ts`, `src/i18n/config.ts`, `src/i18n/config.test.ts`
- Modify: `package.json` (devDep + script)

**Interfaces:**
- Produces: `LOCALES: readonly ["en","he"]`, `type Locale = "en" | "he"`, `DEFAULT_LOCALE: Locale`, `isLocale(v: string): v is Locale`, `localeDir(l: Locale): "ltr" | "rtl"`, `localePath(l: Locale, path: string): string`, `pathLocale(pathname: string): Locale`, `alternatePath(pathname: string, target: Locale): string`

- [ ] **Step 1: Install Vitest and add the test script**

```bash
pnpm add -D vitest
```

In `package.json` scripts, add: `"test": "vitest run"`.

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 2: Write the failing tests**

Create `src/i18n/config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  alternatePath,
  isLocale,
  localeDir,
  localePath,
  pathLocale,
} from "./config";

describe("isLocale", () => {
  it("accepts supported locales and rejects others", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("he")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
  });
});

describe("localeDir", () => {
  it("maps locales to directions", () => {
    expect(localeDir("en")).toBe("ltr");
    expect(localeDir("he")).toBe("rtl");
  });
});

describe("localePath", () => {
  it("leaves default-locale paths bare", () => {
    expect(localePath("en", "/posts")).toBe("/posts");
    expect(localePath("en", "/")).toBe("/");
  });
  it("prefixes non-default locales", () => {
    expect(localePath("he", "/posts")).toBe("/he/posts");
    expect(localePath("he", "/")).toBe("/he/");
  });
  it("normalizes a missing leading slash", () => {
    expect(localePath("he", "posts")).toBe("/he/posts");
  });
});

describe("pathLocale", () => {
  it("detects the locale segment", () => {
    expect(pathLocale("/he/posts")).toBe("he");
    expect(pathLocale("/he/")).toBe("he");
    expect(pathLocale("/he")).toBe("he");
    expect(pathLocale("/posts")).toBe("en");
    expect(pathLocale("/")).toBe("en");
    expect(pathLocale("/hello")).toBe("en");
  });
});

describe("alternatePath", () => {
  it("maps en pages to he and back", () => {
    expect(alternatePath("/posts", "he")).toBe("/he/posts");
    expect(alternatePath("/he/posts", "en")).toBe("/posts");
    expect(alternatePath("/", "he")).toBe("/he/");
    expect(alternatePath("/he/", "en")).toBe("/");
  });
  it("is a no-op when already in the target locale", () => {
    expect(alternatePath("/he/posts", "he")).toBe("/he/posts");
    expect(alternatePath("/posts", "en")).toBe("/posts");
  });
  it("does not mangle segments that merely start with the prefix", () => {
    expect(alternatePath("/hello", "he")).toBe("/he/hello");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — cannot resolve `./config`.

- [ ] **Step 4: Implement `src/i18n/config.ts`**

```ts
export const LOCALES = ["en", "he"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localeDir(locale: Locale): "ltr" | "rtl" {
  return locale === "he" ? "rtl" : "ltr";
}

/** Prefix a site-absolute path with the locale segment when needed. */
export function localePath(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return normalized;
  return normalized === "/" ? `/${locale}/` : `/${locale}${normalized}`;
}

/** Locale encoded in a pathname ("/he/..." → "he"; anything else → "en"). */
export function pathLocale(pathname: string): Locale {
  const segment = pathname.split("/")[1];
  return segment === "he" ? "he" : "en";
}

/** The same page's path in the target locale. */
export function alternatePath(pathname: string, target: Locale): string {
  const bare = pathname.replace(/^\/he(\/|$)/, "/");
  return localePath(target, bare);
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test` — expected: all PASS.

- [ ] **Step 6: Lint, format, commit**

```bash
pnpm run lint && pnpm run format && git add -A && git commit -m "feat: add i18n locale helpers with tests"
```

---

### Task 2: Accept-Language parser + string formatter (TDD)

**Files:**
- Create: `src/i18n/preferredLocale.ts`, `src/i18n/preferredLocale.test.ts`, `src/i18n/format.ts`, `src/i18n/format.test.ts`

**Interfaces:**
- Consumes: `DEFAULT_LOCALE`, `isLocale`, `Locale` from `src/i18n/config.ts`
- Produces: `preferredLocale(header: string | null): Locale`; `fmt(template: string, params: Record<string, string | number>): string`

- [ ] **Step 1: Write the failing tests**

Create `src/i18n/preferredLocale.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { preferredLocale } from "./preferredLocale";

describe("preferredLocale", () => {
  it("returns en for missing or empty headers", () => {
    expect(preferredLocale(null)).toBe("en");
    expect(preferredLocale("")).toBe("en");
  });
  it("picks hebrew when it ranks highest", () => {
    expect(preferredLocale("he")).toBe("he");
    expect(preferredLocale("he-IL,he;q=0.9,en;q=0.8")).toBe("he");
  });
  it("picks english when it ranks highest", () => {
    expect(preferredLocale("en-US,en;q=0.9,he;q=0.8")).toBe("en");
  });
  it("falls back to en for unsupported languages", () => {
    expect(preferredLocale("fr-FR,de;q=0.9")).toBe("en");
  });
  it("respects q ordering regardless of position", () => {
    expect(preferredLocale("en;q=0.5,he;q=0.9")).toBe("he");
  });
  it("ignores q=0 entries and garbage q values", () => {
    expect(preferredLocale("he;q=0,en;q=0.5")).toBe("en");
    expect(preferredLocale("he;q=abc,en;q=0.5")).toBe("en");
  });
});
```

Create `src/i18n/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { fmt } from "./format";

describe("fmt", () => {
  it("replaces named placeholders", () => {
    expect(fmt('tag "{tag}"', { tag: "astro" })).toBe('tag "astro"');
    expect(fmt("page {n}", { n: 2 })).toBe("page 2");
  });
  it("replaces missing params with an empty string", () => {
    expect(fmt("hi {name}", {})).toBe("hi ");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test` — expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

Create `src/i18n/preferredLocale.ts`:

```ts
import { DEFAULT_LOCALE, isLocale, type Locale } from "./config";

/**
 * Pick the best supported locale from an Accept-Language header.
 * Matches on the primary subtag only ("he-IL" → "he").
 */
export function preferredLocale(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(",")
    .map(part => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find(p => p.trim().startsWith("q="));
      const parsed = qParam ? Number(qParam.trim().slice(2)) : 1;
      return {
        primary: tag.trim().toLowerCase().split("-")[0],
        q: Number.isNaN(parsed) ? 0 : parsed,
      };
    })
    .filter(({ q }) => q > 0)
    .sort((a, b) => b.q - a.q);
  const best = ranked.find(({ primary }) => isLocale(primary));
  return best ? (best.primary as Locale) : DEFAULT_LOCALE;
}
```

Create `src/i18n/format.ts`:

```ts
/** Tiny "{name}" template substitution for dictionary strings. */
export function fmt(
  template: string,
  params: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(params[key] ?? "")
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test` — expected: all PASS.

- [ ] **Step 5: Lint, format, commit**

```bash
pnpm run lint && pnpm run format && git add -A && git commit -m "feat: add accept-language parser and template formatter"
```

---

### Task 3: Translation dictionaries

**Files:**
- Create: `src/i18n/translations/en.ts`, `src/i18n/translations/he.ts`, `src/i18n/index.ts`

**Interfaces:**
- Produces: `useTranslations(locale: Locale): Dict` — dictionaries accessed by property (`t.nav.posts`), fully typed; a Hebrew key missing = compile error.

- [ ] **Step 1: Create `src/i18n/translations/en.ts`**

```ts
// English is the source of truth: its shape is the Dict type.
// Values are plain strings (no `as const`) so `typeof en` types leaves as string.
const en = {
  site: {
    desc: "personal portfolio and blog",
  },
  a11y: {
    skipToContent: "Skip to content",
    openMenu: "Open Menu",
    closeMenu: "Close Menu",
    themeToggle: "Toggles light & dark",
    rssFeed: "RSS feed",
  },
  nav: {
    posts: "Posts",
    tags: "Tags",
    about: "About",
    archives: "Archives",
    search: "Search",
  },
  footer: {
    copyright: "Copyright",
    allRights: "All rights reserved.",
  },
  pages: {
    posts: { title: "Posts", desc: "All the articles I've posted." },
    tags: { title: "Tags", desc: "All the tags used in posts." },
    tagDetail: {
      titlePrefix: "Tag:",
      desc: 'All the articles with the tag "{tag}".',
    },
    archives: { title: "Archives", desc: "All the articles I've archived." },
    search: {
      title: "Search",
      placeholder: "search any article ...",
      inputAria: "Search articles",
    },
    notFound: { message: "Page Not Found", goHome: "Go back home" },
  },
  post: {
    updated: "Updated:",
    prev: "Prev",
    next: "Next",
    prevPost: "Previous Post",
    nextPost: "Next Post",
    goBack: "Go back",
    backToTop: "Back to top",
    shareOn: "Share this post on:",
    copy: "Copy",
    copied: "Copied",
    paginationAria: "Pagination Navigation",
    gotoPrev: "Goto Previous Page",
    gotoNext: "Goto Next Page",
    untranslated: "this post hasn't been translated yet — shown in English.",
  },
  breadcrumb: {
    home: "Home",
    page: "page",
  },
  home: {
    heroAria: "Introduction",
    servicesAria: "What I do",
    blogAria: "From the blog",
    portfolioAria: "Portfolio",
    heroHeading: "hi, I'm Amit",
    heroIntro:
      "I build websites and apps, set up hubs and knowledge management with and without AI.",
  },
};

export default en;
export type Dict = typeof en;
```

- [ ] **Step 2: Create `src/i18n/translations/he.ts`**

```ts
import type { Dict } from "./en";

const he: Dict = {
  site: {
    desc: "פורטפוליו ובלוג אישי",
  },
  a11y: {
    skipToContent: "דילוג לתוכן",
    openMenu: "פתיחת תפריט",
    closeMenu: "סגירת תפריט",
    themeToggle: "החלפה בין מצב בהיר לכהה",
    rssFeed: "פיד RSS",
  },
  nav: {
    posts: "פוסטים",
    tags: "תגיות",
    about: "אודות",
    archives: "ארכיון",
    search: "חיפוש",
  },
  footer: {
    copyright: "זכויות יוצרים",
    allRights: "כל הזכויות שמורות.",
  },
  pages: {
    posts: { title: "פוסטים", desc: "כל המאמרים שפרסמתי." },
    tags: { title: "תגיות", desc: "כל התגיות שבשימוש בפוסטים." },
    tagDetail: {
      titlePrefix: "תגית:",
      desc: 'כל המאמרים עם התגית "{tag}".',
    },
    archives: { title: "ארכיון", desc: "כל המאמרים שבארכיון." },
    search: {
      title: "חיפוש",
      placeholder: "חיפוש מאמרים ...",
      inputAria: "חיפוש מאמרים",
    },
    notFound: { message: "העמוד לא נמצא", goHome: "חזרה הביתה" },
  },
  post: {
    updated: "עודכן:",
    prev: "הקודם",
    next: "הבא",
    prevPost: "הפוסט הקודם",
    nextPost: "הפוסט הבא",
    goBack: "חזרה",
    backToTop: "חזרה למעלה",
    shareOn: "שיתוף הפוסט:",
    copy: "העתקה",
    copied: "הועתק",
    paginationAria: "ניווט בין עמודים",
    gotoPrev: "לעמוד הקודם",
    gotoNext: "לעמוד הבא",
    untranslated: "הפוסט הזה עדיין לא תורגם לעברית — מוצג באנגלית.",
  },
  breadcrumb: {
    home: "בית",
    page: "עמוד",
  },
  home: {
    heroAria: "היכרות",
    servicesAria: "מה אני עושה",
    blogAria: "מהבלוג",
    portfolioAria: "תיק עבודות",
    heroHeading: "היי, אני עמית",
    heroIntro: "אני בונה אתרים ואפליקציות, ומקים האבים וניהול ידע — עם ובלי AI.",
  },
};

export default he;
```

- [ ] **Step 3: Create `src/i18n/index.ts`**

```ts
import type { Locale } from "./config";
import en, { type Dict } from "./translations/en";
import he from "./translations/he";

const dictionaries: Record<Locale, Dict> = { en, he };

export function useTranslations(locale: Locale): Dict {
  return dictionaries[locale];
}

export { fmt } from "./format";
export * from "./config";
```

- [ ] **Step 4: Verify types catch drift**

Temporarily delete `nav.search` from `he.ts`, run `pnpm exec astro check` — expected: type error on `he`. Restore it, re-run — expected: clean.

- [ ] **Step 5: Lint, format, commit**

```bash
pnpm run lint && pnpm run format && git add -A && git commit -m "feat: add en/he translation dictionaries"
```

---

### Task 4: Astro i18n routing + sitemap locales

**Files:**
- Modify: `astro.config.ts`

**Interfaces:**
- Produces: `/he/**` becomes a valid locale-prefixed route space; sitemap emits `xhtml:link` hreflang alternates.

- [ ] **Step 1: Add the i18n block and sitemap i18n option**

In `astro.config.ts`, inside `defineConfig({ ... })`, add after `site: SITE.website,`:

```ts
  i18n: {
    defaultLocale: "en",
    locales: ["en", "he"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
```

And change the sitemap integration call to:

```ts
    sitemap({
      filter: page => SITE.showArchives || !page.endsWith("/archives"),
      i18n: {
        defaultLocale: "en",
        locales: { en: "en", he: "he" },
      },
    }),
```

Note (knowledge revalidation): both options verified present in the installed versions — `i18n.routing.prefixDefaultLocale` in `node_modules/astro/dist/types/public/config.d.ts`, and `@astrojs/sitemap` 3.6 supports the `i18n` option (check `node_modules/@astrojs/sitemap/dist/index.d.ts` if the build complains, and adjust to its exact shape).

- [ ] **Step 2: Verify build is unchanged for English**

Run: `pnpm run build`
Expected: PASS; `dist/` contains the same English pages as before (no `/he/` pages yet — none exist).

- [ ] **Step 3: Commit**

```bash
pnpm run lint && pnpm run format:check && git add -A && git commit -m "feat: enable astro i18n routing for en and he"
```

---

### Task 5: Hebrew fonts (Assistant + Fredoka)

**Files:**
- Modify: `astro.config.ts` (fonts array), `src/styles/global.css` (font stacks + Hebrew rules), `src/layouts/Layout.astro` (Font tags)

**Interfaces:**
- Produces: CSS variables `--font-assistant`, `--font-fredoka`; `--font-app`/`--font-heading` become dual-script stacks. Latin text keeps Google Sans Code/McLaren; Hebrew glyphs fall through to Assistant/Fredoka automatically.

- [ ] **Step 1: Add the Hebrew families and empty the Latin fonts' generic fallbacks**

In `astro.config.ts` `experimental.fonts`, the generic fallback (`monospace`, `sans-serif`) must move to the END of each stack — otherwise the generic (which has Hebrew glyphs) would swallow Hebrew before Assistant/Fredoka get a chance. Change Google Sans Code's entry to `fallbacks: []` and McLaren's to `fallbacks: []` (Chicle stays as is), then append:

```ts
      {
        name: "Assistant",
        cssVariable: "--font-assistant",
        provider: fontProviders.google(),
        fallbacks: ["sans-serif"],
        weights: [300, 400, 500, 600, 700],
        styles: ["normal"],
        subsets: ["hebrew", "latin"],
      },
      {
        name: "Fredoka",
        cssVariable: "--font-fredoka",
        provider: fontProviders.google(),
        fallbacks: ["sans-serif"],
        weights: [400, 500],
        styles: ["normal"],
        subsets: ["hebrew", "latin"],
      },
```

- [ ] **Step 2: Update the theme font stacks in `src/styles/global.css`**

```css
/* old */
  --font-app: var(--font-google-sans-code);
  --font-heading: var(--font-mclaren);
/* new */
  --font-app: var(--font-google-sans-code), var(--font-assistant);
  --font-heading: var(--font-mclaren), var(--font-fredoka);
```

(`--font-logo` stays Chicle-only — the "spiro spero" wordmark is Latin in both locales.)

Append to `global.css` after the `@layer base` block:

```css
/* Hebrew is never letter-spaced: neutralize inherited tracking on he pages. */
html[lang="he"] body {
  letter-spacing: normal;
}
```

- [ ] **Step 3: Render the new families in `src/layouts/Layout.astro`**

After the three existing `<Font ... />` tags add (unconditional for now; the locale-aware preload lands in Task 6):

```astro
    <Font cssVariable="--font-assistant" />
    <Font cssVariable="--font-fredoka" />
```

- [ ] **Step 4: Verify**

Run: `pnpm run build` — expected PASS. Then `pnpm run dev`, open `http://localhost:4321/`, paste `שלום` into the hero heading via devtools — Hebrew glyphs must render in Fredoka (rounded), not the system fallback. English rendering unchanged.

- [ ] **Step 5: Commit**

```bash
pnpm run lint && pnpm run format:check && git add -A && git commit -m "feat: add assistant and fredoka hebrew font mates"
```

---

### Task 6: Locale-aware Layout (lang, dir, hreflang, per-locale RSS link)

**Files:**
- Modify: `src/layouts/Layout.astro`, `src/config.ts`

**Interfaces:**
- Consumes: `Locale`, `localeDir`, `alternatePath`, `LOCALES`, `localePath` from `@/i18n`
- Produces: `Layout` accepts `locale?: Locale` (default `"en"`) — every page/layout that renders `<Layout>` can pass it. `<html lang dir>` derived from locale. All downstream tasks rely on this prop existing.

- [ ] **Step 1: Modify `src/layouts/Layout.astro`**

Frontmatter — add to imports:

```ts
import {
  alternatePath,
  localeDir,
  localePath,
  LOCALES,
  type Locale,
} from "@/i18n";
```

Add to `Props`: `locale?: Locale;` and to the destructure defaults: `locale = "en",`.

Replace the `<html ...>` opening tag:

```astro
<!-- old -->
<html
  dir={SITE.dir}
  lang=`${SITE.lang ?? "en"}`
  class={`${scrollSmooth && "scroll-smooth"}`}
>
<!-- new -->
<html
  dir={localeDir(locale)}
  lang={locale}
  class={`${scrollSmooth && "scroll-smooth"}`}
>
```

Make the Assistant/Fredoka Font tags (from Task 5) preload Hebrew on Hebrew pages — replace them with:

```astro
    <Font
      cssVariable="--font-assistant"
      preload={
        locale === "he"
          ? [{ subset: "hebrew", weight: 400, style: "normal" }]
          : undefined
      }
    />
    <Font
      cssVariable="--font-fredoka"
      preload={
        locale === "he"
          ? [{ subset: "hebrew", weight: 500, style: "normal" }]
          : undefined
      }
    />
```

After the `<link rel="canonical" ...>` line, add hreflang alternates:

```astro
    {
      LOCALES.map(l => (
        <link
          rel="alternate"
          hreflang={l}
          href={new URL(alternatePath(Astro.url.pathname, l), Astro.site)}
        />
      ))
    }
    <link
      rel="alternate"
      hreflang="x-default"
      href={new URL(alternatePath(Astro.url.pathname, "en"), Astro.site)}
    />
```

Replace the RSS auto-discovery link's `href`:

```astro
      href={new URL(localePath(locale, "/rss.xml").slice(1), Astro.site)}
```

- [ ] **Step 2: Remove the now-dead `dir`/`lang` from `SITE`**

In `src/config.ts` delete the two lines:

```ts
  dir: "ltr", // "rtl" | "auto"
  lang: "en", // html lang code. Set this empty and default will be "en"
```

Verify nothing else reads them: `grep -rn "SITE.dir\|SITE.lang" src/` — expected: no matches (fix any stragglers by passing `locale` instead).

- [ ] **Step 3: Verify**

Run: `pnpm run build` — PASS. View source of `dist/index.html`: `<html dir="ltr" lang="en">`, two hreflang links (`en` → `/`, `he` → `/he/`) plus `x-default`.

- [ ] **Step 4: Commit**

```bash
pnpm run lint && pnpm run format:check && git add -A && git commit -m "feat: locale-aware layout with hreflang alternates"
```

---

### Task 7: Header + Footer localization and the language toggle

**Files:**
- Create: `src/components/LanguageToggle.astro`
- Modify: `src/components/Header.astro`, `src/components/Footer.astro`

**Interfaces:**
- Consumes: `useTranslations`, `localePath`, `pathLocale`, `alternatePath`, `type Locale`
- Produces: `Header` and `Footer` accept `locale?: Locale` (default `"en"`). `LanguageToggle` is self-locating (reads `Astro.url`). The `lang-pref` cookie (name used again by Task 12) is set to the destination locale when the toggle is clicked.

- [ ] **Step 1: Create `src/components/LanguageToggle.astro`**

```astro
---
import { alternatePath, pathLocale } from "@/i18n";

const current = pathLocale(Astro.url.pathname);
const target = current === "en" ? "he" : "en";
const href = alternatePath(Astro.url.pathname, target);
const label = target === "he" ? "עברית" : "English";
---

<a
  href={href}
  data-lang-toggle
  data-target={target}
  hreflang={target}
  lang={target}
  class="font-heading font-medium hover:text-accent"
>
  {label}
</a>

<script>
  // Remember the visitor's explicit choice so the root auto-detect
  // (functions/index.ts) respects it on the next visit. Functional cookie —
  // consent-exempt; disclosed on /privacy (phase 5).
  document.addEventListener("click", e => {
    const toggle = (e.target as HTMLElement).closest?.("[data-lang-toggle]");
    if (!(toggle instanceof HTMLElement)) return;
    const target = toggle.dataset.target;
    if (target === "en" || target === "he") {
      document.cookie = `lang-pref=${target};path=/;max-age=31536000;SameSite=Lax`;
    }
  });
</script>
```

- [ ] **Step 2: Localize `src/components/Header.astro`**

Frontmatter — replace entirely:

```ts
import { Icon } from "astro-icon/components";
import LinkButton from "./LinkButton.astro";
import LanguageToggle from "./LanguageToggle.astro";
import { SITE } from "@/config";
import { localePath, useTranslations, type Locale } from "@/i18n";

type Props = { locale?: Locale };
const { locale = "en" } = Astro.props;
const t = useTranslations(locale);

const { pathname } = Astro.url;

// Compare locale-agnostically so nav highlighting works under /he/ too.
const bare = pathname.replace(/^\/he(?=\/|$)/, "") || "/";
const currentPath =
  bare.endsWith("/") && bare !== "/" ? bare.slice(0, -1) : bare;

const isActive = (path: string) => {
  const currentPathArray = currentPath.split("/").filter(p => p.trim());
  const pathArray = path.split("/").filter(p => p.trim());
  return currentPath === path || currentPathArray[0] === pathArray[0];
};
```

Template — exact replacements:

| old | new |
|---|---|
| `>Skip to content<` (skip link text) | `>{t.a11y.skipToContent}<` |
| `href="/"` (logo link) | `href={localePath(locale, "/")}` |
| `aria-label="Open Menu"` (menu button) | `aria-label={t.a11y.openMenu}` |
| `href="/posts"` | `href={localePath(locale, "/posts")}` |
| `>Posts<`... (nav label) | `>{t.nav.posts}<` |
| `href="/tags"` | `href={localePath(locale, "/tags")}` |
| `>Tags<` | `>{t.nav.tags}<` |
| `href="/about"` | `href={localePath(locale, "/about")}` |
| `>About<` | `>{t.nav.about}<` |
| `href="/archives"` | `href={localePath(locale, "/archives")}` |
| `title="Archives"` / `aria-label="archives"` / `>Archives<` | `title={t.nav.archives}` / `aria-label={t.nav.archives}` / `>{t.nav.archives}<` |
| `href="/search"` | `href={localePath(locale, "/search")}` |
| `title="Search"` / `aria-label="search"` / `>Search<` (sr-only) | `title={t.nav.search}` / `aria-label={t.nav.search}` / `>{t.nav.search}<` |
| `title="Toggles light & dark"` | `title={t.a11y.themeToggle}` |

In the `<script>`'s `toggleNav()`, the open/close aria-labels are set from JS — swap the literals for data attributes: add `data-label-open={t.a11y.openMenu} data-label-close={t.a11y.closeMenu}` to the `#menu-btn` button, and in the script replace

```ts
menuBtn.setAttribute("aria-label", openMenu ? "Open Menu" : "Close Menu");
```

with

```ts
const { labelOpen, labelClose } = (menuBtn as HTMLElement).dataset;
menuBtn.setAttribute(
  "aria-label",
  (openMenu ? labelOpen : labelClose) ?? ""
);
```

Add the toggle as the last item of `#menu-items` (after the theme button `<li>`):

```astro
        <li class="col-span-2 flex items-center justify-center sm:col-span-1">
          <LanguageToggle />
        </li>
```

- [ ] **Step 3: Localize `src/components/Footer.astro`**

Frontmatter: add

```ts
import { useTranslations, type Locale } from "@/i18n";
```

extend Props with `locale?: Locale;`, destructure `locale = "en"`, add `const t = useTranslations(locale);`.

Template:

```astro
<!-- old -->
      <span>Copyright &#169; {currentYear}</span>
      <span class="hidden sm:inline">&nbsp;|&nbsp;</span>
      <span>All rights reserved.</span>
<!-- new -->
      <span>{t.footer.copyright} &#169; {currentYear}</span>
      <span class="hidden sm:inline">&nbsp;|&nbsp;</span>
      <span>{t.footer.allRights}</span>
```

- [ ] **Step 4: Verify**

`pnpm run build` — PASS (English site renders identically; toggle shows "עברית" and links to `/he/...` — the target 404s until Task 8, expected). Click the toggle in `pnpm run dev` and confirm `document.cookie` contains `lang-pref=he`.

- [ ] **Step 5: Commit**

```bash
pnpm run lint && pnpm run format && git add -A && git commit -m "feat: localized header and footer with language toggle"
```

---

### Task 8: Homepage — shared component + `/he/` mirror + localized blocks

**Files:**
- Create: `src/pages/_shared/HomePage.astro`, `src/pages/he/index.astro`
- Modify: `src/pages/index.astro`, `src/components/home/HeroBlock.astro`, `src/components/home/ServicesBlock.astro`, `src/components/home/BlogBlock.astro`, `src/components/home/PortfolioBlock.astro`, `src/config/services.ts`

**Interfaces:**
- Consumes: `Layout`/`Header`/`Footer` `locale` props (Tasks 6–7)
- Produces: `HomePage` accepts `{ locale: Locale }`. All four home blocks accept `locale?: Locale` (default `"en"`). `SERVICES` becomes `Record<Locale, Service[]>` — Task 8 is the only consumer today, but phase 3 (services dialog) will consume it too.

- [ ] **Step 1: Create `src/pages/_shared/HomePage.astro`** (the `_` prefix keeps it out of routing)

Move the entire current content of `src/pages/index.astro` here, with these changes to the moved code:

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
import { localePath, type Locale } from "@/i18n";

type Props = { locale: Locale };
const { locale } = Astro.props;

const posts = await getCollection("blog");
const recentPosts = getSortedPosts(posts).slice(0, 3);
---

<Layout locale={locale}>
  <Header locale={locale} />
  <main id="main-content" data-layout="index" class="home-layout">
    <div class="home-grid">
      <HeroBlock locale={locale} />
      <ServicesBlock locale={locale} />
      <BlogBlock posts={recentPosts} locale={locale} />
      <PortfolioBlock locale={locale} />
    </div>
  </main>
  <Footer locale={locale} />
</Layout>
```

Keep the existing `<style>` block verbatim. In the trailing `<script>`, replace `sessionStorage.setItem("backUrl", "/");` with a locale-aware value read from the DOM: change `<main ... class="home-layout">` to include `data-home-url={localePath(locale, "/")}`, and the script line to:

```ts
      const homeUrl =
        (document.querySelector("#main-content") as HTMLElement)?.dataset
          ?.homeUrl ?? "/";
      sessionStorage.setItem("backUrl", homeUrl);
```

- [ ] **Step 2: Replace `src/pages/index.astro` and create `src/pages/he/index.astro`**

`src/pages/index.astro`:

```astro
---
import HomePage from "@/pages/_shared/HomePage.astro";
---

<HomePage locale="en" />
```

`src/pages/he/index.astro`:

```astro
---
import HomePage from "@/pages/_shared/HomePage.astro";
---

<HomePage locale="he" />
```

- [ ] **Step 3: Localize `src/config/services.ts`**

Replace the file's export with a locale-keyed record (same `Service` interface):

```ts
import type { Locale } from "@/i18n/config";

export interface Service {
  /** astro-icon name, e.g. "tabler:code" */
  icon: string;
  title: string;
  blurb: string;
}

// 6 tiles per locale: enough unique items that the vertical marquee never
// shows a duplicate in view (the block fits ~4 tiles; 3 would force a repeat).
export const SERVICES: Record<Locale, Service[]> = {
  en: [
    // ... the six existing entries, unchanged ...
  ],
  he: [
    {
      icon: "tabler:code",
      title: "פיתוח אתרים",
      blurb: "אתרים מהירים ונגישים שנבנו להחזיק מעמד.",
    },
    {
      icon: "tabler:device-mobile",
      title: "פיתוח אפליקציות",
      blurb: "כלים ואפליקציות שעושים את העבודה בפשטות.",
    },
    {
      icon: "tabler:hierarchy-2",
      title: "האבים של ידע",
      blurb: "בניית מבנה לידע המצטבר של צוות.",
    },
    {
      icon: "tabler:database",
      title: "מסדי נתונים",
      blurb: "מידול ואחסון נתונים כך שיישארו שמישים.",
    },
    {
      icon: "tabler:chart-dots",
      title: "כלי דאטה",
      blurb: "צינורות נתונים ודשבורדים שמראים את מה שחשוב.",
    },
    {
      icon: "tabler:sparkles",
      title: "שילוב AI",
      blurb: "AI איפה שהוא באמת עוזר — לא בשביל עצמו.",
    },
  ],
};
```

- [ ] **Step 4: Wire `locale` through the four blocks**

Each block gets the same prop plumbing. Add to frontmatter (adjusting per file):

```ts
import { useTranslations, type Locale } from "@/i18n";

type Props = { locale?: Locale }; // BlogBlock: extend its existing Props type
const { locale = "en" } = Astro.props;
const t = useTranslations(locale);
```

Then per file:

- **HeroBlock.astro:** `aria-label="Introduction"` → `aria-label={t.home.heroAria}`; `<h1>hi, I'm Amit</h1>` → `<h1>{t.home.heroHeading}</h1>`; the intro `<p>...</p>` text → `{t.home.heroIntro}`; RSS link `href="/rss.xml"` → `href={locale === "he" ? "/he/rss.xml" : "/rss.xml"}`, `title="RSS Feed"`/`aria-label="RSS feed"` → `title={t.a11y.rssFeed}` / `aria-label={t.a11y.rssFeed}`. (SOCIALS `linkTitle`s stay English in phase 1 — they move to Sanity `siteSettings` in phase 2; note this in the commit body.)
- **ServicesBlock.astro:** `import { SERVICES } from "@/config/services";` stays; add `const services = SERVICES[locale];` and change both `SERVICES.map(...)` to `services.map(...)`; `aria-label="What I do"` → `aria-label={t.home.servicesAria}`.
- **BlogBlock.astro:** Props becomes `{ posts: CollectionEntry<"blog">[]; locale?: Locale }`; `aria-label="From the blog"` → `aria-label={t.home.blogAria}`; post link `href={getPath(post.id, post.filePath)}` → `href={localePath(locale, getPath(post.id, post.filePath))}` (import `localePath`); pass `locale` to `<Datetime {...post.data} locale={locale} />` (Datetime's `locale` prop lands in Task 9 — do BlogBlock's Datetime change in Task 9's commit if building strictly in order; noted there).
- **PortfolioBlock.astro:** `aria-label="Portfolio"` → `aria-label={t.home.portfolioAria}`; the placeholder `projects` labels stay English (placeholders — real projects come from Sanity in phase 2).

- [ ] **Step 5: Verify**

`pnpm run build` — PASS. `pnpm run dev`: `/` unchanged; `/he/` renders the full 2×2 grid RTL (`dir="rtl"`), Hebrew hero heading in Fredoka, Hebrew service tiles, marquee still animating, no horizontal overflow at 375px width.

- [ ] **Step 6: Commit**

```bash
pnpm run lint && pnpm run format && git add -A && git commit -m "feat: bilingual homepage with locale-aware blocks"
```

---

### Task 9: Posts — list + detail mirrors, fallback note, localized post chrome

**Files:**
- Create: `src/utils/getPostPaths.ts`, `src/pages/_shared/PostsPage.astro`, `src/pages/he/posts/[...page].astro`, `src/pages/he/posts/[...slug]/index.astro`
- Modify: `src/pages/posts/[...page].astro`, `src/pages/posts/[...slug]/index.astro`, `src/layouts/PostDetails.astro`, `src/components/Datetime.astro`, `src/components/Pagination.astro`, `src/components/BackButton.astro`, `src/components/BackToTopButton.astro`, `src/components/ShareLinks.astro`, `src/components/Card.astro`, `src/components/Tag.astro`

**Interfaces:**
- Consumes: dictionaries, `localePath`, Layout/Header/Footer locale props
- Produces: `getPostStaticPaths()` (shared by both slug routes); `PostsPage` props `{ page: Page<CollectionEntry<"blog">>; locale: Locale }`; `PostDetails`, `Datetime`, `Card`, `Tag`, `Pagination`, `BackButton`, `BackToTopButton`, `ShareLinks` all accept `locale?: Locale` (default `"en"`).

- [ ] **Step 1: Create `src/utils/getPostPaths.ts`**

```ts
import { getCollection } from "astro:content";
import { getPath } from "./getPath";

/** Static paths for post detail routes — shared by the en and he routes. */
export async function getPostStaticPaths() {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return posts.map(post => ({
    params: { slug: getPath(post.id, post.filePath, false) },
    props: { post },
  }));
}
```

- [ ] **Step 2: Create `src/pages/_shared/PostsPage.astro`**

Move the body of `src/pages/posts/[...page].astro` (everything except `getStaticPaths`) here:

```astro
---
import type { Page } from "astro";
import type { CollectionEntry } from "astro:content";
import Main from "@/layouts/Main.astro";
import Layout from "@/layouts/Layout.astro";
import Header from "@/components/Header.astro";
import Footer from "@/components/Footer.astro";
import Card from "@/components/Card.astro";
import Pagination from "@/components/Pagination.astro";
import { SITE } from "@/config";
import { useTranslations, type Locale } from "@/i18n";

type Props = { page: Page<CollectionEntry<"blog">>; locale: Locale };
const { page, locale } = Astro.props;
const t = useTranslations(locale);
---

<Layout locale={locale} title={`${t.pages.posts.title} | ${SITE.title}`}>
  <Header locale={locale} />
  <Main pageTitle={t.pages.posts.title} pageDesc={t.pages.posts.desc} locale={locale}>
    <ul>
      {page.data.map(data => <Card {...data} locale={locale} />)}
    </ul>
  </Main>

  <Pagination {page} locale={locale} />

  <Footer locale={locale} noMarginTop={page.lastPage > 1} />
</Layout>
```

(`Main` gets a pass-through `locale?: Locale` prop for its `Breadcrumb` — Task 10 wires Breadcrumb; add the prop to `Main.astro` now: extend `Props` with `locale?: Locale`, destructure `locale = "en"`, and render `<Breadcrumb locale={locale} />`. If building strictly task-by-task, add the `locale` prop to Breadcrumb in this task as an unused pass-through: `type Props = { locale?: Locale }` — its strings localize in Task 10.)

- [ ] **Step 3: Rewrite the list routes**

`src/pages/posts/[...page].astro`:

```astro
---
import type { GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import PostsPage from "@/pages/_shared/PostsPage.astro";
import getSortedPosts from "@/utils/getSortedPosts";
import { SITE } from "@/config";

export const getStaticPaths = (async ({ paginate }) => {
  const posts = await getCollection("blog", ({ data }) => !data.draft);
  return paginate(getSortedPosts(posts), { pageSize: SITE.postPerPage });
}) satisfies GetStaticPaths;

const { page } = Astro.props;
---

<PostsPage {page} locale="en" />
```

`src/pages/he/posts/[...page].astro`: identical except `locale="he"`. (Astro's `paginate` derives URLs from the route's own path, so `/he/posts/2` pagination links come out right automatically — verify in Step 8.)

- [ ] **Step 4: Rewrite the detail routes**

`src/pages/posts/[...slug]/index.astro`:

```astro
---
import { getCollection } from "astro:content";
import PostDetails from "@/layouts/PostDetails.astro";
import getSortedPosts from "@/utils/getSortedPosts";
import { getPostStaticPaths } from "@/utils/getPostPaths";

export const getStaticPaths = getPostStaticPaths;

const { post } = Astro.props;

const posts = await getCollection("blog");
const sortedPosts = getSortedPosts(posts);
---

<PostDetails post={post} posts={sortedPosts} locale="en" />
```

`src/pages/he/posts/[...slug]/index.astro`: identical except `locale="he"`.

Note: `src/pages/posts/[...slug]/index.png.ts` (OG endpoint) is untouched — Hebrew mirrors reuse the English post's OG image.

- [ ] **Step 5: Localize `src/layouts/PostDetails.astro`**

Frontmatter: add imports `import { localePath, useTranslations, type Locale } from "@/i18n";`; extend Props with `locale?: Locale;`, destructure `locale = "en"`, add `const t = useTranslations(locale);`.

Canonical for untranslated Hebrew mirrors — replace the `layoutProps` object's `canonicalURL` line:

```ts
  // Hebrew mirrors render the English content (phase 1: no translations yet),
  // so they canonicalize to the English URL to avoid duplicate-content SEO.
  canonicalURL:
    canonicalURL ??
    (locale !== "en"
      ? new URL(getPath(post.id, post.filePath), Astro.site).href
      : undefined),
```

and add `locale,` to `layoutProps` (Layout accepts it since Task 6). Pass `locale` to `<Header locale={locale} />`, `<Footer locale={locale} />`, `<BackButton locale={locale} />`, `<BackToTopButton locale={locale} />`, `<ShareLinks locale={locale} />`, `<Datetime ... locale={locale} />`, and every `<Tag ... locale={locale} />`.

Template string swaps: `<span>Previous Post</span>` → `<span>{t.post.prevPost}</span>`; `<span>Next Post</span>` → `<span>{t.post.nextPost}</span>`. Prev/next link hrefs: `href={getPath(prevPost.id, prevPost.filePath)}` → `href={localePath(locale, getPath(prevPost.id, prevPost.filePath))}` (same for `nextPost`). The chevrons already carry `rtl:rotate-180`.

Untranslated note — insert directly before `<article ...>`:

```astro
    {
      locale !== "en" && (
        <p
          class="mt-4 border-s-4 border-accent bg-muted/40 px-4 py-2 text-sm"
          dir="rtl"
        >
          {t.post.untranslated}
        </p>
      )
    }
```

Copy button labels (the `is:inline` script can't see frontmatter): add `data-copy-label={t.post.copy} data-copied-label={t.post.copied}` to the `<main>` element, and in the inline script replace `const copyButtonLabel = "Copy";` with

```js
    const main = document.getElementById("main-content");
    const copyButtonLabel = main?.dataset.copyLabel ?? "Copy";
    const copiedLabel = main?.dataset.copiedLabel ?? "Copied";
```

and `button.innerText = "Copied";` with `button.innerText = copiedLabel;`.

- [ ] **Step 6: Localize the small post-chrome components**

Each gets the standard plumbing (`locale?: Locale` prop, `const t = useTranslations(locale)`), then:

- **Datetime.astro:** add `locale = "en"` to the destructure; replace the dayjs formatting block —

```ts
/* old */
const datetime = dayjs(isModified ? modDatetime : pubDatetime).tz(
  postTimezone || SITE.timezone
);
const date = datetime.format("D MMM, YYYY"); // e.g., '22 Mar, 2025'
/* new */
const datetime = dayjs(isModified ? modDatetime : pubDatetime).tz(
  postTimezone || SITE.timezone
);
const date = new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
}).format(datetime.toDate()); // '22 Mar, 2025' / '22 במרץ 2025'
```

and `Updated:` → `{t.post.updated}`.
- **Pagination.astro:** `aria-label="Pagination Navigation"` → `aria-label={t.post.paginationAria}`; `aria-label="Goto Previous Page"` → `{t.post.gotoPrev}`; `aria-label="Goto Next Page"` → `{t.post.gotoNext}`; `Prev` → `{t.post.prev}`; `Next` → `{t.post.next}`. (Arrow icons already have `rtl:rotate-180`.)
- **BackButton.astro:** `<span>Go back</span>` → `<span>{t.post.goBack}</span>`; if its arrow icon lacks `rtl:rotate-180`, add it.
- **BackToTopButton.astro:** replace its visible/aria "Back to top" strings with `{t.post.backToTop}` / `aria-label={t.post.backToTop}`.
- **ShareLinks.astro:** `Share this post on:` → `{t.post.shareOn}`. (Per-network `linkTitle` tooltips from `src/constants.ts` stay English — they move to Sanity in phase 2.)
- **Card.astro:** wrap its post link href with `localePath(locale, ...)` and pass `locale` to its `<Datetime>`; pass-through prop like the others.
- **Tag.astro:** tag link href → `localePath(locale, ...)` around the existing `/tags/...` path.

- [ ] **Step 7: BlogBlock Datetime (deferred from Task 8)**

In `src/components/home/BlogBlock.astro`, pass `locale={locale}` to its `<Datetime>`.

- [ ] **Step 8: Verify**

`pnpm run build` — PASS. In `pnpm run dev`:
- `/posts` unchanged; `/he/posts` lists cards RTL with Hebrew dates and links into `/he/posts/<slug>`.
- `/he/posts/<slug>` shows the Hebrew untranslated note, English body, RTL chrome, prev/next labels in Hebrew pointing at `/he/...`.
- `view-source` of a he post: `<link rel="canonical" href="https://spiro-spero.zone/posts/<slug>">`.

- [ ] **Step 9: Commit**

```bash
pnpm run lint && pnpm run format && git add -A && git commit -m "feat: bilingual post routes with english fallback note"
```

---

### Task 10: Tags, archives, search, about, 404, breadcrumb

**Files:**
- Create: `src/pages/_shared/TagsPage.astro`, `src/pages/_shared/TagPostsPage.astro`, `src/pages/_shared/ArchivesPage.astro`, `src/pages/_shared/SearchPage.astro`, `src/pages/he/tags/index.astro`, `src/pages/he/tags/[tag]/[...page].astro`, `src/pages/he/archives/index.astro`, `src/pages/he/search.astro`, `src/pages/he/about.md`
- Modify: `src/pages/tags/index.astro`, `src/pages/tags/[tag]/[...page].astro`, `src/pages/archives/index.astro`, `src/pages/search.astro`, `src/pages/404.astro`, `src/components/Breadcrumb.astro`, `src/layouts/Main.astro`, `src/layouts/AboutLayout.astro`

**Interfaces:**
- Consumes: everything above
- Produces: complete `/he/` route tree. `Breadcrumb` accepts `locale?: Locale`. `AboutLayout` reads `frontmatter.locale`.

Pattern is identical to Tasks 8–9: move the page body into `_shared/<Name>Page.astro` with a `locale` prop, keep `getStaticPaths` in the route files, make the en route a thin wrapper, add the he twin. Per page specifics:

- [ ] **Step 1: Tags index** — `_shared/TagsPage.astro` takes `{ locale: Locale }`, fetches its own collection (as the current page does). Replace `title={`Tags | ${SITE.title}`}` → `title={`${t.pages.tags.title} | ${SITE.title}`}`, `pageTitle="Tags"` → `{t.pages.tags.title}`, `pageDesc="All the tags used in posts."` → `{t.pages.tags.desc}`; pass `locale` to Layout/Header/Main/Footer and each `<Tag {tag} {tagName} locale={locale} />`. Wrappers: `src/pages/tags/index.astro` → `<TagsPage locale="en" />`; he twin with `"he"`.

- [ ] **Step 2: Tag detail** — `_shared/TagPostsPage.astro` props `{ page: Page<CollectionEntry<"blog">>; tag: string; tagName: string; locale: Locale }`. Body moved from `src/pages/tags/[tag]/[...page].astro`; replace its `pageTitle` pair with `pageTitle={[`${t.pages.tagDetail.titlePrefix}`, `${tagName}`]}` (keep the existing `titleTransition` value) and its desc with `pageDesc={fmt(t.pages.tagDetail.desc, { tag: tagName })}` (import `fmt` from `@/i18n`); `Card`/`Pagination` get `locale`. Both route files keep their existing `getStaticPaths` verbatim and render `<TagPostsPage ... locale="en" | "he" />`.

- [ ] **Step 3: Archives** — `_shared/ArchivesPage.astro` `{ locale: Locale }`. Delete the hardcoded `months` array; month names via:

```ts
const monthName = (month: number) =>
  new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", {
    month: "long",
  }).format(new Date(2026, month - 1, 1));
```

and `{months[Number(month) - 1]}` → `{monthName(Number(month))}`. Title/desc from `t.pages.archives`. The `Astro.redirect("/404")` guard stays in both route files. Wrappers as usual.

- [ ] **Step 4: Search** — `_shared/SearchPage.astro` `{ locale: Locale }`: move the whole of `search.astro` (template, script, and `is:global` style). Replace `Search | ...` title, `<h1>Search</h1>`, `placeholder="search any article ..."`, `aria-label="Search articles"` with the `t.pages.search` keys. The Pagefind script/styles move unchanged — PagefindUI reads the page's `html lang` and queries the matching language index on its own. Wrappers as usual.

- [ ] **Step 5: About** — In `src/layouts/AboutLayout.astro`: derive `const locale = (frontmatter.locale ?? "en") as Locale;` (extend its frontmatter Props type with `locale?: string`), pass `locale` to its Layout/Header/Footer/Breadcrumb renders, and use `t.nav.about` for any hardcoded "About" title fallback. Create `src/pages/he/about.md`:

```markdown
---
layout: ../../layouts/AboutLayout.astro
title: "אודות"
locale: he
---

בקרוב.
```

- [ ] **Step 6: 404** — single page serves both languages (Cloudflare Pages serves one `/404.html`), so it renders both dictionaries side by side. In `src/pages/404.astro` frontmatter add:

```ts
import { useTranslations } from "@/i18n";

const tEn = useTranslations("en");
const tHe = useTranslations("he");
```

Under `<p class="mt-4 text-2xl sm:text-3xl">Page Not Found</p>`, replace the English literal with `{tEn.pages.notFound.message}` and add:

```astro
      <p class="mt-1 text-xl sm:text-2xl" lang="he" dir="rtl">
        {tHe.pages.notFound.message}
      </p>
```

and change the home LinkButton content to:

```astro
        {tEn.pages.notFound.goHome} · <span lang="he">{tHe.pages.notFound.goHome}</span>
```

- [ ] **Step 7: Breadcrumb** — in `src/components/Breadcrumb.astro`: add the standard `locale` plumbing. Strip the locale segment before building crumbs:

```ts
const currentUrlPath = Astro.url.pathname
  .replace(/^\/he(?=\/|$)/, "")
  .replace(/\/+$/, "");
```

`Home` → `{t.breadcrumb.home}`; home link `href="/"` → `href={localePath(locale, "/")}`; segment links `` href={`/${breadcrumb}/`} `` → `` href={localePath(locale, `/${breadcrumb}/`)} ``; `Posts (page N)` → `` `${t.nav.posts} (${t.breadcrumb.page} ${breadcrumbList[1] || 1})` ``; the tag pagination splice's `"(page "` → `` `(${t.breadcrumb.page} ` ``. In `Main.astro`, `<Breadcrumb />` → `<Breadcrumb locale={locale} />` (prop added in Task 9).

- [ ] **Step 8: Verify**

`pnpm run build` — PASS. Dev pass: `/he/tags`, `/he/tags/<tag>`, `/he/archives` (Hebrew month names), `/he/search`, `/he/about` all render RTL with Hebrew chrome; breadcrumbs read `בית » פוסטים...` and link within `/he/`; `/404` shows both languages.

- [ ] **Step 9: Commit**

```bash
pnpm run lint && pnpm run format && git add -A && git commit -m "feat: bilingual tags, archives, search, about and 404"
```

---

### Task 11: Hebrew RSS feed

**Files:**
- Create: `src/pages/he/rss.xml.ts`

**Interfaces:**
- Consumes: `useTranslations`, `getPath`, `getSortedPosts`
- Produces: `/he/rss.xml` — same posts, `/he/`-prefixed links, Hebrew channel description. (Layout's auto-discovery link already points here on he pages since Task 6.)

- [ ] **Step 1: Create `src/pages/he/rss.xml.ts`**

```ts
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { getPath } from "@/utils/getPath";
import getSortedPosts from "@/utils/getSortedPosts";
import { SITE } from "@/config";
import { useTranslations } from "@/i18n";

export async function GET() {
  const posts = await getCollection("blog");
  const sortedPosts = getSortedPosts(posts);
  const t = useTranslations("he");
  return rss({
    title: SITE.title,
    description: t.site.desc,
    site: `${SITE.website}he/`,
    customData: "<language>he</language>",
    items: sortedPosts.map(({ data, id, filePath }) => ({
      link: `/he${getPath(id, filePath)}`,
      title: data.title,
      description: data.description,
      pubDate: new Date(data.modDatetime ?? data.pubDatetime),
    })),
  });
}
```

Also add `customData: "<language>en</language>",` to the existing `src/pages/rss.xml.ts` for symmetry.

- [ ] **Step 2: Verify**

`pnpm run build`; `cat dist/he/rss.xml` — items link to `https://spiro-spero.zone/he/posts/...`, channel has `<language>he</language>`.

- [ ] **Step 3: Commit**

```bash
pnpm run lint && pnpm run format:check && git add -A && git commit -m "feat: hebrew rss feed"
```

---

### Task 12: Root auto-detect (Cloudflare Pages Function)

**Files:**
- Create: `functions/index.ts`

**Interfaces:**
- Consumes: `preferredLocale` (Task 2), the `lang-pref` cookie contract (Task 7)
- Produces: `GET /` 302→`/he/` for Hebrew-preferring first-time visitors; everyone else passes through to the static asset. **Only** the root path — deeper URLs never redirect.

- [ ] **Step 1: Create `functions/index.ts`**

Cloudflare Pages picks up `functions/` at the repo root automatically; a file named `index.ts` binds exactly to `/`. Standard web platform types only (no `@cloudflare/workers-types` dependency):

```ts
import { preferredLocale } from "../src/i18n/preferredLocale";

interface RootContext {
  request: Request;
  env: { ASSETS: { fetch: (request: Request) => Promise<Response> } };
}

// First-visit language detection, root path only. An explicit choice
// (lang-pref cookie, set by the header toggle) always wins; otherwise
// Accept-Language decides. Deeper URLs are never redirected.
export const onRequestGet = async ({
  request,
  env,
}: RootContext): Promise<Response> => {
  const cookie = request.headers.get("cookie") ?? "";
  const pref = /(?:^|;\s*)lang-pref=(en|he)/.exec(cookie)?.[1];
  const locale = pref ?? preferredLocale(request.headers.get("accept-language"));

  if (locale === "he") {
    return new Response(null, {
      status: 302,
      headers: {
        location: new URL("/he/", request.url).toString(),
        vary: "Accept-Language, Cookie",
        "cache-control": "no-store",
      },
    });
  }
  const response = await env.ASSETS.fetch(request);
  const headers = new Headers(response.headers);
  headers.append("vary", "Accept-Language, Cookie");
  return new Response(response.body, { status: response.status, headers });
};
```

- [ ] **Step 2: Verify locally with wrangler**

```bash
pnpm run build
npx wrangler pages dev dist
```

In a second shell:

```bash
curl -sI http://localhost:8788/ | head -1                                   # HTTP/1.1 200 OK
curl -sI -H "Accept-Language: he-IL,he;q=0.9" http://localhost:8788/ | grep -i "^location"   # location: http://localhost:8788/he/
curl -sI -H "Accept-Language: he" -H "Cookie: lang-pref=en" http://localhost:8788/ | head -1 # 200 (cookie wins)
curl -sI -H "Accept-Language: he" http://localhost:8788/posts | head -1     # 200 (deep URLs untouched)
```

Stop wrangler.

- [ ] **Step 3: Confirm the toolchain accepts the new directory**

Run `pnpm run build` (astro check type-checks `functions/` via the root tsconfig `**/*` include) and `pnpm run lint`. If ESLint's config doesn't cover `functions/`, extend the flat config's files glob to include it rather than ignoring the directory.

- [ ] **Step 4: Commit**

```bash
pnpm run lint && pnpm run format && git add -A && git commit -m "feat: first-visit language detection at the root path"
```

---

### Task 13: Satori Hebrew OG verification

**Files:**
- Modify: `src/utils/loadGoogleFont.ts`
- Scratch (not committed): `<scratchpad>/og-hebrew-check.mjs`

**Interfaces:**
- Produces: `loadGoogleFonts(text)` additionally returns Assistant (400 + 700) whenever `text` contains Hebrew codepoints — Satori falls back per-glyph across supplied fonts. A recorded verdict on Satori RTL rendering for phase 2.

- [ ] **Step 1: Extend `src/utils/loadGoogleFont.ts`**

Replace the `fontsConfig` block inside `loadGoogleFonts`:

```ts
  const hasHebrew = /[֐-׿]/.test(text);
  const fontsConfig = [
    {
      name: "Chicle",
      font: "Chicle",
      weight: 400,
      style: "normal",
    },
    ...(hasHebrew
      ? [
          { name: "Assistant", font: "Assistant", weight: 400, style: "normal" },
          { name: "Assistant", font: "Assistant", weight: 700, style: "normal" },
        ]
      : []),
  ];
```

- [ ] **Step 2: Render a Hebrew sample through the real pipeline**

Write `<scratchpad>/og-hebrew-check.mjs` (run from the repo root so imports resolve):

```js
import { writeFileSync } from "node:fs";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import loadGoogleFonts from "./src/utils/loadGoogleFont.ts";

const text = "שלום — פוסט לדוגמה בעברית spiro spero";
const svg = await satori(
  {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fdfdfd",
        color: "#282728",
        fontSize: 56,
        direction: "rtl",
      },
      children: text,
    },
  },
  {
    width: 1200,
    height: 630,
    fonts: await loadGoogleFonts(text),
  }
);
writeFileSync(
  new URL("./og-hebrew.png", import.meta.url),
  new Resvg(svg).render().asPng()
);
```

Run: `node --experimental-strip-types <scratchpad>/og-hebrew-check.mjs` (if the TS import trips, temporarily copy the function into the script — it's a scratch file).

- [ ] **Step 3: Judge the output**

Open `og-hebrew.png`. PASS = Hebrew glyphs present (no tofu), words in correct RTL order, Latin "spiro spero" intact. FAIL = record the failure mode. **Either way, write the verdict** into `docs/superpowers/specs/2026-07-02-portfolio-supercharge-design.md` §2 Risks (one line: "Verified <date>: Satori Hebrew OG …"). If FAIL: phase 2's Hebrew posts will set `ogImage` to the static `/og.png` instead of dynamic generation — note that in the same line; no further code now (no Hebrew-titled posts exist yet).

- [ ] **Step 4: Commit**

```bash
pnpm run lint && pnpm run format && git add src/utils/loadGoogleFont.ts docs/superpowers/specs/2026-07-02-portfolio-supercharge-design.md && git commit -m "feat: load hebrew font for og images when title needs it"
```

---

### Task 14: Pagefind verification, RTL sweep, full validation

**Files:**
- Modify: whatever the sweep finds (expected: little — the codebase already uses `ms-/me-/start-/end-` and `rtl:rotate-180`)

- [ ] **Step 1: Pagefind language indexes**

```bash
pnpm run build
cat dist/pagefind/pagefind-entry.json
```

Expected: a `languages` object containing both `en` and `he` (he pages carry `<html lang="he">`, and post bodies have `data-pagefind-body`). Then `pnpm run preview`, open `/he/search`, search a word from a post — results appear (English content indexed under the he language; real Hebrew content arrives with phase 2). If `he` is missing from the entry file, check that he post pages emit `lang="he"` on `<html>` and rebuild.

- [ ] **Step 2: Physical-property sweep**

```bash
grep -rnE "\b(ml|mr|pl|pr)-[0-9]|text-left|text-right|\bleft-[0-9]|\bright-[0-9]|margin-left|margin-right|padding-left|padding-right" src --include="*.astro" --include="*.css" | grep -v CloudDecoration
```

For each hit (CloudDecoration is exempt — fixed decorative art), replace with the logical equivalent: `ml-`→`ms-`, `mr-`→`me-`, `pl-`→`ps-`, `pr-`→`pe-`, `text-left`→`text-start`, `text-right`→`text-end`, `left-`→`start-`, `right-`→`end-`, CSS `margin-left`→`margin-inline-start`, etc. Also check `src/styles/typography.css` for physical properties in prose styles (blockquote borders, list padding).

- [ ] **Step 3: Manual RTL browser pass** (dev server, both themes, 375px and desktop)

- `/he/`: hero text flows right-to-left and right-aligned; marquee scrolls; blog block marching-ants intact; portfolio flips work; no horizontal scrollbar.
- Header on `/he/posts`: nav order mirrored, active-nav wavy underline correct, mobile menu opens, language toggle round-trips `/he/posts` ↔ `/posts`.
- A `/he/posts/<slug>`: untranslated note, prev/next arrows point outward (chevrons flipped), progress bar fills, copy button says "העתקה" → "הועתק".
- Keyboard: tab through header, toggle, post page — focus outlines visible everywhere.

Fix what fails; anything intentionally deferred gets a line in the plan/spec, not silence.

- [ ] **Step 4: Full validation gate**

```bash
pnpm test && pnpm run lint && pnpm run format:check && pnpm run build
```

All four must pass.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "fix: rtl sweep and phase 1 validation fixes"
```

---

## Deferred (explicitly, to later phases)

- `SOCIALS`/`SHARE_LINKS` `linkTitle` tooltips + portfolio placeholder labels: English-only until Sanity `siteSettings` (phase 2).
- Hebrew post translations, per-locale post filtering in lists/RSS: phase 2 (document-level i18n in Sanity).
- `/privacy` page and the `lang-pref` cookie disclosure: phase 5.
- Any color/visual tuning of the new UI (untranslated note, toggle): phase 6 visual pass.
