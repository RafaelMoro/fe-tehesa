# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

**Package manager:** pnpm (not npm or yarn). Lockfile + `.npmrc` hoisting for `@heroui/*`.

**Key scripts:**
- `pnpm dev` — dev server with Turbopack
- `pnpm build` — production build (also runs type checking)
- `pnpm lint` — ESLint (flat config)
- `pnpm test` — Jest with coverage; `pnpm test:watch` for interactive; `pnpm test -- <path>` for targeted runs
- `pnpm exec tsc --noEmit` — standalone TypeScript check (no dedicated script)

**Required env vars for local development:** `STRAPI_HOST` and `STRAPI_API_TOKEN` in `.env.local`. Without them, Apollo queries silently fail.

**Optional env vars:**
- `NEXT_PUBLIC_SITE_URL` — absolute production origin used by `metadataBase`, canonicals, `robots.ts`, and `sitemap.ts`. Falls back to `http://localhost:3000` when unset; never throws.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — the seller's WhatsApp click-to-chat number, used by `/cotizar`'s `WhatsappCta` and the header's utility-bar link / mobile menu footer button. Unset hides the affected links/CTA instead of throwing.

## High-Level Architecture

**fe-tehesa** is a Next.js 15 App Router MVP for a Tehesa product catalog. It fetches paginated products from Strapi via GraphQL, supports client-side search/filtering, opens a drawer for variant pricing, and now has a `/cotizar` quote page backed by a persisted cart.

```
Browser (page?=..., theme cookie)
  ↓
Next.js App Router (src/app)
  ├─ Server: src/app/page.tsx (/, catalog), src/app/cotizar/page.tsx (/cotizar, quote shell), and src/app/categorias/page.tsx (/categorias, category index)
  ├─ Routes: /api/preferences (theme), /api/catalog/* (product queries)
  ├─ Providers: NextThemesProvider (dark mode), HeroUI provider, CartStoreProvider + Toast.Provider (providers.tsx)
  └─ Apollo Client factory (per-request) → Strapi
        │
  Client (src/features + src/components)
  ├─ Home (search, filter dropdowns, pagination)
  ├─ ProductListing (grid, search input, filters)
  ├─ ProductVariantsDrawer (variants + prices; optional upgrade mode for /cotizar's "Elegir medida")
  ├─ CatalogSearchDrawer (name search + category/brand filters)
  ├─ QuotePage (/cotizar line list, subtotal, clear-list confirmation)
  ├─ CategoriesPage (/categorias breadcrumb, hero + WhatsApp panel, category grid)
  └─ ProductCard (shared, mobile-aware)
        │
  Shared (src/shared)
  ├─ lib/global.lib.ts ("use server", server actions for Strapi reads + theme cookie)
  ├─ queries/global.queries.ts (GraphQL operations)
  ├─ constants (catalog error codes, theme cookie key, cart bounds, validation rules)
  ├─ types (Product, Variant, Theme, pagination, cart line types)
  ├─ utils (currency formatting, catalog API envelope wrapper, SEO metadata/JSON-LD builders)
  ├─ hooks (useMediaQuery)
  └─ ui/atoms + ui/organisms (ToggleDarkMode, CartCount, QuantityStepper, Header + MobileMenu, etc.)
        │
  State (src/zustand)
  ├─ change-theme store/provider (SSR-safe, currently zero consumers — ToggleDarkMode uses next-themes directly)
  └─ cart store/provider — SSR-safe, persists to localStorage via zustand/persist with rehydrate validation
```

**Key flow invariant:** Server components in `src/app/page.tsx` call `"use server"` actions in `src/shared/lib/global.lib.ts`, which create a **per-request Apollo Client** against Strapi. Clients never import `global.lib.ts` directly. Route handlers wrap server actions in thin HTTP envelopes. The cart (`/cotizar`) is client-only Zustand state persisted to `localStorage`; it is not synced to Strapi — there is no order/cart/quote content type in the backend. The root layout (`src/app/layout.tsx`) also fetches category/brand taxonomy for `Header`'s desktop dropdowns and mobile menu, degrading to an empty header (no dropdowns) on Strapi failure; every route is forced dynamic (`export const dynamic = "force-dynamic"`) because `Header` reads `useSearchParams()`.

See `ai-skills/REPO_CONTEXT.md` for the full architecture map (this section is a summary, kept only roughly in sync).

## Tech Stack

- Next.js 15 App Router + React 19 + TypeScript (strict)
- Apollo Client v4 + GraphQL (read-only against Strapi)
- **HeroUI v3** (`@heroui/react`) for UI — currently no HeroUI provider needed in this app
- Tailwind v4 via `@tailwindcss/postcss` with `darkMode: "class"`
- next-themes for theme switching (`attribute="class"`, defaults to `"dark"`)
- Zustand (vanilla store + provider pattern for theme state)
- Jest 30 + Testing Library (tests live in root `__tests__/`, not co-located)

## Directory Layout

| Path | Purpose |
|------|---------|
| `src/app/` | Root layout, providers, home page, API route handlers |
| `src/app/page.tsx` | Catalog page — parses URL, fetches server data, renders Home |
| `src/app/api/catalog/*` | HTTP route handlers (thin wrappers over server actions) |
| `src/app/api/preferences/` | POST endpoint for theme cookie persistence |
| `src/app/cotizar/page.tsx` | Quote route `/cotizar` — server shell + `generateMetadata` (`noindex, follow`) around the `"use client"` `QuotePage` feature |
| `src/app/categorias/page.tsx` | Categories index route `/categorias` — server component, `generateMetadata` (`index, follow`), fetches `fetchCategories()` + `fetchCategoryProductCounts()` (degrades to no pill on count failure), renders `BreadcrumbList` JSON-LD + the `CategoriesPage` feature |
| `src/app/providers.tsx` | Client provider: mounts `CartStoreProvider` and HeroUI's `Toast.Provider` |
| `src/app/robots.ts` | `GET /robots.txt` — disallows `/api/`, points to the sitemap |
| `src/app/sitemap.ts` | `GET /sitemap.xml` — base pages (incl. `/categorias`) + live category/brand URLs; degrades to base pages if Strapi is unreachable |
| `src/features/` | Scoped UI domains: Home, ProductListing, ProductVariantsDrawer, CatalogSearchDrawer, Pagination, QuotePage, CategoriesPage |
| `src/components/` | Shared ProductCard (only) |
| `src/shared/lib/global.lib.ts` | Server actions for Strapi reads + theme cookie (the "use server" seam) |
| `src/shared/queries/` | GraphQL operations |
| `src/shared/types/` | Domain types (Product, Variant, Theme, pagination, taxonomy, cart line types) |
| `src/shared/constants/` | Catalog error codes, theme cookie key, cart bounds (`cart.constants.ts`), validation rules, pagination bounds, SEO copy/origin (`seo.constants.ts`) |
| `src/shared/utils/` | Pure helpers (currency format, catalog API client envelope wrapper, SEO metadata/JSON-LD builders in `seo.utils.ts`) |
| `src/shared/ui/atoms` | Atomic UI (ToggleDarkMode, QuantityStepper, CartCount, etc.) |
| `src/shared/ui/organisms` | Composed UI: `Header` (sticky, every route — utility bar + WhatsApp link, desktop nav with disabled category/brand dropdowns ending in a `Ver todas las categorías` link to `/categorias` (hidden there; the trigger gets an active underline + `(actual)` on that route), mobile lupa/cart/hamburger; rendered once from the root layout) and `MobileMenu` (right-side drawer it renders below `md:`, same footer row + active-state treatment on its `Categorías` accordion) |
| `src/zustand/store/` | Vanilla Zustand stores: theme (`change-theme.store.ts`) and cart (`cart.store.ts`, `zustand/persist` to `localStorage`) |
| `src/zustand/provider/` | SSR-safe store providers (wraps-store pattern), one per store |

## Data Flow And Catalog Behavior

**GraphQL reads:** All server actions in `src/shared/lib/global.lib.ts` create a per-request Apollo Client that queries Strapi. They have explicit `Promise<Data[]>` return types and no local try/catch; failures propagate to route handlers and become `CAT_ERR_001` HTTP 400 errors.

**URL-backed catalog state:**
- Base catalog: `/?page=1..7` (fixed 7 pages from `KNOWN_PRODUCT_TOTAL = 333` and `PRODUCT_PAGE_SIZE = 50`)
- Name search: `/?mode=name&q=<term>&page=N`
- Category filter: `/?mode=category&category=<name>&page=N`
- Brand filter: `/?mode=brand&brand=<name>&page=N`

**Pagination:** Base catalog renders numbered pages 1-7. Filtered modes render Previous/current/Next and infer if there are more results from `products.length === 50` (until Strapi exposes pagination metadata).

**Empty page handling:** Page 1 can be empty (empty state shown). Page >1 empty redirects to the same mode/value page 1; speculative `notice=end` redirects to the last populated page.

**Local search:** The `useCatalogSearch` hook filters the current working set in memory by product name. It does NOT query Strapi and does NOT reset to page 1.

## Theme And Cookie Persistence

- Cookie key: `THEME_COOKIE_KEY = 'tehesa-theme'` in `src/shared/constants/global.constants.ts`
- `getThemePreference()` (server-side) reads the cookie; missing/invalid values fall back to `"light"` without mutating the cookie
- `saveThemeCookie(theme)` validates at runtime (only `"light"` or `"dark"`); invalid values reject and do not write
- `POST /api/preferences` route accepts JSON `{ "theme": "light" | "dark" }`, persists the cookie (httpOnly, secure, strict SameSite), returns 201 on success or 400 with `PRF_VAL_001` on validation failure
- `NextThemesProvider` defaults to `"dark"` (not `"light"`); confirm desired defaults when changing UX
- Client code should use `ChangeThemeStoreProvider`, `useChangeThemeStore`, `ToggleDarkMode`, and `/api/preferences` flow rather than writing cookies directly

## API Route Inventory

All routes return envelopes: `{ success: true, data }` or `{ success: false, code, message }`. Catalog routes share error codes (`CAT_*`) in `src/shared/constants/catalog.constants.ts`.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/preferences` | POST | Theme cookie (`{ "theme": "light" \| "dark" }`) |
| `/api/catalog/products` | GET | `?page=1..7&pageSize=50` (fixed) |
| `/api/catalog/category` | GET | `?category=<name>&pageSize=50` (validates against live taxonomy) |
| `/api/catalog/brand` | GET | `?brand=<name>&pageSize=50` (validates against live taxonomy) |
| `/api/catalog/categories` | GET | Dynamic category taxonomy from Strapi |
| `/api/catalog/brands` | GET | Dynamic brand taxonomy from Strapi |
| `/api/catalog/variants` | GET | `?documentId=<id>&pageSize=100` (fixed) |
| `/api/catalog/search` | GET | `?q=<term>` (trimmed, allowlisted, 100 chars max; returns first page only) |

**Validation:** All numeric params (page, pageSize) are strict digits-only — no decimals, signs, padding, or mixed content. Document IDs follow `/^[A-Za-z0-9_-]+$/` and max 30 characters. Search terms are trimmed, required, max 100 chars, and constrained by a Unicode/punctuation allowlist.

## SEO Surface

- `generateMetadata` in `src/app/page.tsx` derives title/description/canonical/robots per URL from `buildCatalogMetadata` (`src/shared/utils/seo.utils.ts`), which parses `searchParams` via the pure `parseCatalogParams` in `src/features/Pagination/utils.pagination.ts` — it never fetches products (Apollo clients are per-call with no dedupe).
- Canonicals fold `/` and `/?page=1` together and never carry the transient `notice=end` param. `?mode=name&q=` URLs are `noindex, follow`; base/category/brand URLs are `index, follow`.
- JSON-LD (`WebSite`+`SearchAction`, per-page `ItemList`, category/brand `BreadcrumbList`) is built by `buildCatalogJsonLd` and injected in the page body (needs product data, so it can't live in `generateMetadata`); `toJsonLdHtml` escapes `<` before writing into `<script type="application/ld+json">` — this is a trust boundary since product/taxonomy strings come from Strapi.
- `src/app/robots.ts` / `src/app/sitemap.ts` are Next.js metadata routes serving `/robots.txt` and `/sitemap.xml`. The sitemap's page list derives from `PRODUCT_PAGE_MAX` (inherits the `KNOWN_PRODUCT_TOTAL` staleness), adds a static `/categorias` base-page entry, and lists one URL per live category/brand; it never emits `lastModified` (no timestamp field exists) and degrades to base pages only if the Strapi taxonomy fetch fails, so a Strapi outage never fails `pnpm build`.
- Base-mode and filtered-mode pagination controls in `src/features/Home/Home.tsx` render as real `next/link` anchors (crawlable) when a target exists, or a non-focusable `<span aria-disabled="true">` otherwise — never `href="#"`.
- `/categorias` has its own literal `generateMetadata` (`CATEGORIES_TITLE`/`CATEGORIES_DESCRIPTION` in `seo.constants.ts`, canonical `/categorias`, `index, follow`) and renders a `BreadcrumbList` JSON-LD via `toJsonLdHtml`, same trust-boundary pattern as `/`.

## Conventions And Gotchas

- **Path alias:** `@/*` maps to `src/*`. Use it for app-code imports; avoid deep relative imports when the alias applies.
- **"use client" directive:** Add only to files that use React hooks, browser APIs, router hooks, event handlers, Zustand hooks, HeroUI hooks, or client-only UI behavior. Route handlers and server-only libs don't need it.
- **State management:** Use local React state, cookies/server actions, next-themes, and the existing Zustand provider/store pattern. Do not add Redux, TanStack Query, or form libraries unless explicitly planned.
- **Styling:** Tailwind v4 utility classes + HeroUI components. No CSS-in-JS or new styling libraries without explicit approval. `tailwind.config.js` sets `darkMode: "class"` (required for next-themes + HeroUI); do not remove it.
- **New dependencies:** Do not add unless explicitly planned. Do not run `pnpm install` during feature work.
- **GraphQL schema:** Infer from `src/shared/queries/global.queries.ts` and TypeScript types. Confirm Strapi contract before normalizing fields or changing query shapes.
- **Category/brand lists:** Currently hardcoded in `src/shared/types/global.types.ts` (there's a TODO questioning this). Catalog API validation uses the live Strapi taxonomy, not the hardcoded arrays.
- **HeroUI v3 ESM resolution:** `@heroui/react` is ESM-only; Jest cannot resolve it by name. `jest.config.ts` maps it to its `dist/index.js`, and `next.config.ts` lists HeroUI + dependencies in `transpilePackages` for SWC. When adding a new ESM-only client package, add it to both.
- **Catalog images:** Strapi has no media field. `ProductCard` accepts an optional `image?: { src; alt }` prop that nothing currently passes.
- **Console statements:** Do not remove pre-existing `console.log/warn/error` unless explicitly planned.

## Implementation And Testing

- **Canonical rules:** `docs/IMPLEMENTATION_GUIDELINES.md` (control flow, object literals, error messages, copy specificity). Apply throughout; override defaults when conflicting.
- **Unit test rules:** `docs/UNIT_TESTING_GUIDELINES.md`. Tests live in `__tests__/`, discovered via `__tests__/**/*.{test,spec}.{ts,tsx}`. Use the `/unit-test` skill to create and fix tests without needing an approved plan.
- **Don't duplicate:** Reuse existing patterns from `src/shared/lib/`, `src/features/`, constants, and types before writing new code. Look at the codebase first.

## Release And PR Workflow

- **Target branch:** PRs go to `develop`, not `main`
- **Label enforcement:** Every PR must have exactly one of `major`, `minor`, or `patch` labels (CI fails otherwise)
- **Auto-release on merge:** CI auto-bumps `package.json` version, tags `vX.Y.Z`, pushes tags, and regenerates `CHANGELOG.md`
- **Do not manually:** Bump version or edit `CHANGELOG.md` for normal PR work

## Workflow Skills

`ai-skills/<skill>/` is the single source of truth for every skill and command, edited in one place and reused everywhere: `.claude/skills/<skill>`, `.opencode/skill/<skill>`, `.opencode/command/<skill>.md`, and `.github/prompts/<skill>.prompt.md` are all symlinks into it. Editing `ai-skills/<skill>/COMMAND.md` and running `pnpm sync:prompts` regenerates `ai-skills/<skill>/SKILL.md` (this repo keeps `SKILL.md` and `COMMAND.md` byte-identical) — `.github/prompts` needs no regeneration since it's a direct symlink to `COMMAND.md`.

Seven skills are configured:

- `/research` — investigate a story, write findings to `ai-research/`
- `/plan` — convert research doc into implementation steps under `ai-planning/`
- `/implement` — execute an approved plan phase by phase
- `/unit-test` — create or fix Jest tests without an approved plan
- `/check-design` — file completed design screenshots for a research brief into `comps/`
- `/task-effort-estimator` — estimate story or epic effort from a research doc
- `/pr-describer` — write a PR title/description from the current branch's changes

Use `/research` to kick off a feature or bug investigation. It reads `ai-skills/REPO_CONTEXT.md`, `AGENTS.md`, and project structure to give future instances context. After research, `/plan` creates an implementation plan. Then `/implement` executes it phase by phase with verification gates.

## External References

- **HeroUI MCP:** `@heroui/react-mcp` is configured in `opencode.json` (live v3 docs, preferred over web)
- **Fallback HeroUI LLM docs:** https://heroui.com/react/llms.txt (index), https://heroui.com/react/llms-full.txt (full)
- **Strapi:** No schema file or OpenAPI equivalent in this repo; infer from GraphQL queries and prior research notes

## See Also

- `ai-skills/REPO_CONTEXT.md` — detailed architecture, data flow, open questions, key files (moved here from the repo root; this is the current canonical path)
- `AGENTS.md` — compact commands, env, architecture, release workflow
- `docs/IMPLEMENTATION_GUIDELINES.md` — control flow, object literals, error messages (must read before implementing)
- `docs/UNIT_TESTING_GUIDELINES.md` — Jest/Testing Library rules (canonical, not duplicated elsewhere)
- `DESIGN.md` — visual design tokens + Tailwind config (validate with `pnpm design:lint`)
- `docs/ANALYTICS_EVENT_CONTRACT.md` — PLP analytics event contract (spec only; no analytics code ships yet)
