# CLAUDE.md

## Project
AstroPaper v5 — Minimal, accessible Astro blog template. TypeScript strict, TailwindCSS 4, Cloudflare Pages.
Pure Astro components (no React/Vue). Lighthouse 100 in all metrics.

## Commands
- `pnpm run dev` — Dev server (port 4321)
- `pnpm run build` — Type check + build + pagefind index
- `pnpm run lint` — ESLint (no-console: error)
- `pnpm run format:check` / `pnpm run format` — Prettier
- `pnpm run preview` — Preview production build
- `pnpm run sync` — Sync Astro types
- No test framework — validation is lint + format + type check + build

## Architecture
```
src/
  config.ts           — Site settings (SITE object)
  content.config.ts   — Blog collection schema (Zod)
  constants.ts        — Social/share links
  data/blog/          — Markdown posts (frontmatter + content)
  pages/              — File-based routing
  components/         — Pure .astro components
  layouts/            — Layout.astro (base), PostDetails, Main, About
  styles/global.css   — TailwindCSS 4 theme (CSS variables)
  scripts/theme.ts    — Dark/light mode toggle
  utils/              — Sorting, filtering, slugify, OG image generation
```

## Blog Post Frontmatter
Required: `title` (string), `pubDatetime` (ISO date), `description` (string)
Optional: `author`, `modDatetime`, `featured`, `draft`, `tags` (default: ["others"]),
`ogImage`, `canonicalURL`, `hideEditPost`, `timezone` (IANA)

## Key Patterns
- Posts in `src/data/blog/` — uses Astro glob loader, NOT `src/content/`
- Prefix directories with `_` to exclude from URL path
- Slugs: `slugify` for Latin, `lodash.kebabcase` for non-Latin
- Theming: CSS vars (--background, --foreground, --accent, --muted, --border)
- Dark mode: `[data-theme=dark]` selector via `@custom-variant`
- Path alias: `@/` → `./src/*`
- OG images: Dynamic via Satori + Resvg
- Search: Pagefind static search, indexed at build time
- View transitions: Astro ClientRouter

## Conventions
- Commits: conventional format — `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- Prettier: double quotes, 2-space indent, trailing commas (es5), LF endings
- Components: pure Astro (.astro), no framework components
- Styling: TailwindCSS utilities; custom utilities via `@utility` directive

## UI/UX Standards
- Mobile-first: design for smallest screens, enhance upward
- Responsive across all breakpoints (sm, md, lg, xl, 2xl)
- Semantic HTML (nav, main, article, section, aside, header, footer)
- ARIA attributes where semantic HTML is insufficient
- Keyboard navigation for all interactive elements
- Screen reader support: meaningful alt text, aria-labels, skip links
- WCAG 2.1 AA contrast ratios minimum
- Visible focus indicators on all interactive elements
- Maintain Lighthouse 100 accessibility score

## Code Quality
- Efficient, minimal code — no over-engineering or premature abstractions
- Prefer native platform features over adding libraries
- Reuse existing utilities in `src/utils/` before creating new ones
- For non-trivial features, suggest adding Vitest tests

## Knowledge Revalidation
- Verify API signatures, config options, and docs against current versions before using
- Don't trust training data for Astro 5, TailwindCSS 4, or any post-2025 library
- When in doubt, check official docs or `node_modules` source
- Flag uncertainty rather than guessing

## Critical Rules
- NEVER mention AI, Claude, bot, or any AI tool in commits, PRs, code comments, or descriptions
- NEVER add Co-Authored-By or AI attribution lines
- NEVER use console.log/warn/error (ESLint rejects it)
- Always run `pnpm run lint` and `pnpm run format:check` before committing
- Don't commit `public/pagefind/` (generated at build time)
- The `@ts-ignore` in astro.config.ts is intentional (Astro 5 + Vite 6 + TailwindCSS 4 issue)
