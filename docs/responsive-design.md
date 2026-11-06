# Responsive design reference

A standing reference for how this project handles responsiveness: the universal
breakpoint conventions, how they map onto TailwindCSS 4, and the
container-query-first approach we prefer for self-contained components.

> Reference, not a spec. Specs and plans for specific features live under
> `docs/superpowers/specs/` and `docs/superpowers/plans/`.

## TL;DR

- **Mobile-first.** Base styles target the smallest screen; add complexity upward.
- **3–5 breakpoints, content-driven.** Add a breakpoint where _our content_ breaks,
  not to match a device.
- **Prefer container queries** (`@container`) for components that should reflow based
  on their own width (cards, grids, embeds) rather than the viewport.
- **Design floor is 320px.** Nothing should break below 320px wide.

## Universal breakpoint definitions

Widely-agreed device tiers (BrowserStack, Framer, Microsoft):

| Tier          | Range        | Notes                                            |
| ------------- | ------------ | ------------------------------------------------ |
| Mobile        | 320–767px    | 320px is the design floor; devices cluster 375–430px |
| Tablet        | 768–1023px   | 768 portrait; up to ~1024 landscape              |
| Desktop       | 1024–1439px  | Primary wide layout                              |
| Large desktop | 1440px+      | Full-HD and larger monitors                      |

Consensus rules: mobile-first, **3–5 breakpoints max**, and add a breakpoint only
where the content actually needs it.

## TailwindCSS 4 mapping

This project uses TailwindCSS 4 (`tailwindcss` + `@tailwindcss/vite`). Tailwind's
default **viewport** breakpoints follow the same convention — no custom config needed:

| Variant | Min width |
| ------- | --------- |
| `sm`    | 640px     |
| `md`    | 768px     |
| `lg`    | 1024px    |
| `xl`    | 1280px    |
| `2xl`   | 1536px    |

Use these for **page-level** layout (overall page chrome, top-level sections).

## Container queries (preferred for components)

Container queries style an element based on its **own container's width** instead of
the viewport. This is more robust than viewport breakpoints for any component that can
appear at different widths (in a grid cell, a sidebar, a full-width section), and it is
the approach Anthropic recommends for apps rendered inside Claude — design from 320px
up using container queries, no fixed breakpoints.

Tailwind 4 ships container queries in **core** (no plugin):

1. Mark the container with `@container`.
2. Style children with `@min-*` / `@max-*` variants, which mirror the breakpoint scale
   above but measure the **container**, not the viewport.

```html
<!-- The container -->
<ul class="@container grid gap-4 @min-md:grid-cols-2">
  <!-- A card that reflows based on the LIST's width, not the screen's -->
  <li class="flex flex-col @min-sm:flex-row @min-sm:items-center">...</li>
</ul>
```

Default container-query sizes (`@*` measure the **container**, distinct from the
viewport `sm/md/...` scale above), as of Tailwind 4.1:

| Variant | Width | | Variant | Width |
| ------- | ----- | --- | ------- | ----- |
| `@3xs`  | 256px | | `@lg`   | 512px |
| `@2xs`  | 288px | | `@xl`   | 576px |
| `@xs`   | 320px | | `@2xl`  | 672px |
| `@sm`   | 384px | | `@3xl`  | 768px |
| `@md`   | 448px | | `@4xl`+ | 896px+ |

Use `@min-[475px]` / `@max-[960px]` for arbitrary container widths. The container floor
`@xs` (320px) matches the universal 320px design floor.

### When to use which

- **Viewport (`md:`, `lg:`)** — page chrome, the overall homepage grid's column count,
  anything that genuinely depends on the whole screen.
- **Container (`@container` + `@min-md:`)** — reusable components that must look right at
  any width: cards, the 2×2 grid items, media embeds, anything that might be reused in a
  narrower column later.

## Project floor and testing

- Test down to **320px** — nothing should overflow or clip below that.
- Maintain the Lighthouse 100 accessibility score: visible focus states, semantic HTML,
  WCAG AA contrast at every breakpoint.
- After responsive changes, run `pnpm run lint`, `pnpm run format:check`, and
  `pnpm run build`.

## Sources

- [Anthropic — Build responsive web layouts](https://claude.com/blog/build-responsive-web-layouts)
- [Claude Docs — Design guidelines (apps in Claude)](https://claude.com/docs/connectors/building/mcp-apps/design-guidelines)
- [BrowserStack — Responsive design breakpoints](https://www.browserstack.com/guide/responsive-design-breakpoints)
- [Framer — Responsive breakpoints guide](https://www.framer.com/blog/responsive-breakpoints/)
- [Microsoft Learn — Screen sizes and breakpoints](https://learn.microsoft.com/en-us/windows/apps/design/layout/screen-sizes-and-breakpoints-for-responsive-design)
- [Tailwind CSS — Responsive design](https://tailwindcss.com/docs/responsive-design)
