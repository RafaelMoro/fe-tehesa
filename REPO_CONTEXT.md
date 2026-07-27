# Repository Context - fe-tehesa

**Last Updated:** 2026-07-12

A living reference for AI agents and developers working in this repository. It documents the app wiring, module boundaries, data flow, and conventions that are not obvious from a single file read.

> Treat this file as a map, not a contract. The ground truth is the code.

## Overview

`fe-tehesa` is a Next.js 15 App Router MVP for the Tehesa product catalog. It renders a paginated catalog, supports client-side search over the current result set, fetches filtered product lists by category or brand from Strapi, and opens a drawer with product variant pricing.

**Tech stack:**

- Next.js 15 App Router + React 19 + TypeScript strict mode.
- pnpm lockfile with `.npmrc` hoisting for `@heroui/*` packages.
- Tailwind v4 through `@tailwindcss/postcss` plus `tailwind.config.js` for `darkMode: "class"`.
- HeroUI (`@heroui/react`) for UI primitives.
- Apollo Client v4 + GraphQL for Strapi reads.
- next-themes for class-based light/dark theme mode.
- Zustand vanilla store + provider pattern for theme state.
- Remix Icon React, Framer Motion, and `clsx` for icons, motion support, and class composition.
- Jest 30 + Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`) via `next/jest`. Tests live in root `__tests__/` (not co-located). See "Testing" below.

## High-Level Architecture

```text
Browser
  │  page query string (?page=...) + theme preference cookie
  ▼
Next.js App Router
  ├── src/app/               root layout, providers, home page, API route handlers
  ├── src/features/          catalog UI: Home, ProductListing, filters, variants drawer
  ├── src/components/        shared ProductCard component
  ├── src/shared/            constants, hooks, lib/server actions, GraphQL queries, types, utils, UI
  └── src/zustand/           SSR-safe theme store provider + vanilla store
         │
         ▼
Strapi GraphQL API via ApolloClient
  ├── process.env.STRAPI_HOST
  └── process.env.STRAPI_API_TOKEN as Bearer token
```

Key invariants:

- `src/app/layout.tsx` is the root server layout. It sets `lang="es"`, loads Google Geist fonts, wraps children in `Providers`, then wraps them in `NextThemesProvider` with `attribute="class"` and `defaultTheme="dark"`.
- `src/app/providers.tsx` currently returns children unchanged; HeroUI v3 does not require a provider in this app.
- `src/app/page.tsx` is the only page route currently present. It awaits `searchParams` per Next 15, canonicalizes invalid catalog URLs with `redirect()`, fetches the selected product result set, categories, brands, and theme in parallel, and wraps the catalog in `ChangeThemeStoreProvider`.
- Base catalog pagination derives 7 pages from `KNOWN_PRODUCT_TOTAL = 333` and `PRODUCT_PAGE_SIZE = 50` in `src/shared/constants/catalog.constants.ts`; replace the total source when Strapi exposes live pagination metadata.
- Server data access lives in `src/shared/lib/global.lib.ts` with the `"use server"` directive. It creates a new Apollo Client for each call through `src/app/apollo-client.ts`.
- Client components no longer import server actions from `global.lib.ts` for catalog reads. URL-backed catalog navigation is server-rendered through `src/app/page.tsx`; route handlers still wrap server actions for other client API consumers such as product variants.
- Theme persistence is cookie-backed through `POST /api/preferences` -> `saveThemeCookie()`. The cookie key is `tehesa-theme` in `src/shared/constants/global.constants.ts`.
- The Zustand theme store follows the provider-wraps-store pattern under `src/zustand/provider` and `src/zustand/store`. Keep stores request-safe by creating them inside provider refs, not module-level singletons.

## Directory Layout

### `src/app/`

| Path                              | Purpose                                                                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `layout.tsx`                      | Root layout; Google Geist fonts, global styles, HeroUI and theme setup.                                                                                                |
| `page.tsx`                        | Catalog route `/`; parses canonical catalog URL state, server-fetches the selected products + taxonomy + theme, and renders `Home`.                                    |
| `loading.tsx`                     | Minimal route fallback with accessible Spanish loading status.                                                                                                          |
| `error.tsx`                       | Client error boundary with Spanish catalog recovery copy and retry.                                                                                                     |
| `providers.tsx`                   | Client provider for HeroUI.                                                                                                                                            |
| `apollo-client.ts`                | Apollo Client factory for Strapi GraphQL.                                                                                                                              |
| `api/preferences/route.ts`        | Saves theme preference cookie via `POST /api/preferences`.                                                                                                             |
| `api/catalog/_utils.ts`           | Shared catalog route helpers: `validateCatalogEnv`, envelope `success`/`failure`, and `readValidatedParams` for `page`/`pageSize`/category name/brand name/`documentId`. |
| `api/catalog/products/route.ts`   | `GET /api/catalog/products?page=&pageSize=` -> paged products.                                                                                                         |
| `api/catalog/category/route.ts`   | `GET /api/catalog/category?category=&pageSize=` -> products filtered by a live Strapi category name.                                                                   |
| `api/catalog/brand/route.ts`      | `GET /api/catalog/brand?brand=&pageSize=` -> products filtered by a live Strapi brand name.                                                                            |
| `api/catalog/categories/route.ts` | `GET /api/catalog/categories` -> dynamic category taxonomy from Strapi.                                                                                                |
| `api/catalog/brands/route.ts`     | `GET /api/catalog/brands` -> dynamic brand taxonomy from Strapi.                                                                                                       |
| `api/catalog/variants/route.ts`   | `GET /api/catalog/variants?documentId=&pageSize=` -> product variants.                                                                                                 |
| `api/catalog/search/route.ts`     | `GET /api/catalog/search?q=&pageSize=50` -> products whose `name` contains the validated term.                                                                         |
| `hero.ts`                         | HeroUI-related setup file.                                                                                                                                             |
| `globals.css`                     | Tailwind/global CSS.                                                                                                                                                   |

### `src/features/`

| Domain                   | Purpose                                                                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Home/`                  | Main client catalog controller: search, category/brand filters, pagination, drawer state. Owns the `useCatalogSearch` hook for catalog-wide name search state. |
| `ProductListing/`        | Product grid plus `SearchInput`, `DropdownCategories`, and `DropdownBrands`.                                                                                   |
| `ProductVariantsDrawer/` | HeroUI drawer that fetches, sorts, and displays product variants/prices.                                                                                       |
| `CatalogSearchDrawer/`   | HeroUI drawer (right placement) with name-search form plus the catalog-wide category/brand dropdowns.                                                          |
| `Pagination/`            | Feature-local URL parsing/building helpers and catalog pagination types used by `src/app/page.tsx`.                                                             |

### `src/shared/`

| Subdir         | Purpose                                                                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `constants`    | Cross-cutting constants such as the theme cookie key and `CAT_*`/`MSG_CAT_*` catalog error codes.              |
| `hooks`        | Reusable client hooks; currently `useMediaQuery`.                                                              |
| `lib`          | Server actions for Strapi reads and theme cookie persistence.                                                  |
| `queries`      | GraphQL operations for products, filtered products, variants, categories, and brands.                          |
| `types`        | Product, variant, app theme, error, pagination, category, brand, and dynamic `TaxonomyItem` types.             |
| `ui/atoms`     | Reusable atomic UI such as `ToggleDarkMode`.                                                                   |
| `ui/organisms` | Reusable composed UI such as `Header`.                                                                         |
| `utils`        | Pure helpers such as currency formatting and the catalog API client (`fetchCatalog`, `catalogErrorToSpanish`). |

### `src/zustand/`

| Path                                 | Purpose                                                          |
| ------------------------------------ | ---------------------------------------------------------------- |
| `store/change-theme.store.ts`        | Vanilla Zustand theme store and React context.                   |
| `provider/change-theme.provider.tsx` | Client provider that creates a per-provider store with `useRef`. |

## Data Flow

Product reads are GraphQL queries against Strapi:

- `fetchProducts(page)` calls `GET_PRODUCTS` with `pagination: { page, pageSize: 50 }`.
- `fetchProductsByCategory(categoryName)` calls `GET_PRODUCTS_BY_CATEGORY` with a category `name contains` filter and `pageSize: 50`.
- `fetchProductsByBrand(brandName)` calls `GET_PRODUCTS_BY_BRAND` with a brand `name contains` filter and `pageSize: 50`.
- `fetchProductVariants({ documentId })` calls `GET_PRODUCT_VARIANTS` with `pageSize: 100` and returns `product.product_variants`.
- `fetchCategories()` calls `GET_CATEGORIES` returning `TaxonomyItem[]` (`{ name, customId }`).
- `fetchBrands()` calls `GET_BRANDS` returning `TaxonomyItem[]` (`{ name, customId }`).

Catalog data flow from the browser:

```text
Home.tsx (client) / ProductVariantsDrawer.tsx (client)
  │  URL navigation for catalog products; fetch /api/catalog/variants for variants
  ▼
src/app/api/catalog/**/route.ts (Route Handler)
  │  validate env + params, wrap result in { success, data } | { success: false, code, message }
  ▼
src/shared/lib/global.lib.ts ("use server")
  │  createApolloClient() per call
  ▼
Strapi GraphQL (STRAPI_HOST + STRAPI_API_TOKEN)
```

`src/app/page.tsx` calls catalog server actions directly because it is a server component; it does not call internal HTTP API routes.

Catalog behavior:

- The server page fetches one page of 50 products for the selected URL mode and passes it to `Home` with mode, value, page, previous/next, and optional feedback state.
- `Home` stores the current working set in `allProducts.current` and visible rows in `filteredProducts`.
- Local visible-results search filters only the current working set in memory by product name. It does not query Strapi and does not reset the page to 1.
- Catalog-wide name/category/brand modes are URL-backed: `/?mode=name&q=...&page=N`, `/?mode=category&category=...&page=N`, and `/?mode=brand&brand=...&page=N`. Browser reload/back/forward restore the server-selected result set.
- Category and brand catalog-wide URLs and GraphQL filters use taxonomy names, not `customId`. Local visible filters still use `customId` for dropdown compatibility.
- Base pagination renders numbered pages 1-7. Filtered modes render Previous/current-page/Next and infer Next from `products.length === 50` until Strapi exposes filtered totals.
- Empty page 1 can render an empty state. Empty page `>1` redirects to the same mode/value page 1; speculative `notice=end` redirects back to the previous populated page and shows `No hay más resultados.`.
- `src/app/loading.tsx` provides route loading feedback. `src/app/error.tsx` provides Spanish retry UI for server-rendered catalog failures.
- `ProductVariantsDrawer` fetches variants when opened, formats prices with `formatNumberToCurrency`, and sorts by numeric price ascending.

## API Route Inventory

| Route                     | Methods | Purpose                                                                                                                                |
| ------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/preferences`        | `POST`  | Requires JSON `{ "theme": "light"                                                                                                      | "dark" }`; saves the `tehesa-theme` cookie and returns HTTP 201 `{ success: true, themeChangedTo }`. Invalid input (missing, null, non-string, unsupported, extra field, or malformed JSON) returns HTTP 400 with `PRF_VAL_001`. |
| `/api/catalog/products`   | `GET`   | `?page=1..7&pageSize=50` (fixed). Returns paged products.                                                                              |
| `/api/catalog/category`   | `GET`   | `?category=...&pageSize=50` (fixed). Validates category name against the live Strapi taxonomy; returns matching products.              |
| `/api/catalog/brand`      | `GET`   | `?brand=...&pageSize=50` (fixed). Validates brand name against the live Strapi taxonomy; returns matching products.                    |
| `/api/catalog/categories` | `GET`   | Dynamic category taxonomy list from Strapi.                                                                                            |
| `/api/catalog/brands`     | `GET`   | Dynamic brand taxonomy list from Strapi.                                                                                               |
| `/api/catalog/variants`   | `GET`   | `?documentId=...&pageSize=100` (fixed). Returns product variants.                                                                      |
| `/api/catalog/search`     | `GET`   | `?q=...` (trimmed, allowlisted, capped at 100 chars). Returns products whose `name` contains the term. First page only, `pageSize=50`. |

Catalog routes share an envelope: `{ success: true, data }` for success, `{ success: false, code, message }` for failure. `code` is one of the `CAT_*` constants in `src/shared/constants/catalog.constants.ts` (`CAT_ENV_001`, `CAT_VAL_001..006`, `CAT_NF_001..003`, `CAT_ERR_001`). All catalog routes return `400` on any failure and require `STRAPI_HOST` + `STRAPI_API_TOKEN` at runtime; missing config is `CAT_ENV_001`. Route handlers wrap server actions in `src/shared/lib/global.lib.ts` and never call Apollo directly; the client never imports `global.lib.ts`. Clients parse envelopes through `fetchCatalog` + `catalogErrorToSpanish` in `src/shared/utils/catalog-api.utils.ts`. The `/api/catalog/search` route validates the `q` term (trim, allowlist of Unicode letters/numbers + ` -_. , & ()`, max 100 chars) and returns `CAT_VAL_006` on invalid input; the internal `message` differentiates empty/length/pattern for server-side logs while the client receives the same `CAT_VAL_006` code.

There are no auth, checkout, order, or backend proxy route handlers in this repo at the time of writing.

## Theme And Cookies

- Cookie key: `THEME_COOKIE_KEY = 'tehesa-theme'`.
- `getThemePreference()` reads the cookie server-side and returns `Promise<AppTheme>`; missing, empty, or unsupported values fall back to `light` without mutating the cookie.
- `saveThemeCookie(theme)` accepts `AppTheme` and validates at runtime; invalid values reject and do not call `cookies().set`. Valid writes use `httpOnly: true`, `secure: true`, `sameSite: "strict"`.
- `NextThemesProvider` defaults to `light` (matches the cookie helper, the Zustand initial state, and `DEFAULT_THEME`).
- `isAppTheme(value)` in `src/shared/constants/global.constants.ts` is the shared runtime guard reused by both the cookie helper and the preference route; the allowlist cannot drift between them.
- Client theme UI should use the existing `ChangeThemeStoreProvider`, `useChangeThemeStore`, `ToggleDarkMode`, and `/api/preferences` flow rather than writing cookies directly.

## Catalog Query String Parsing

- All catalog and page-string parsers are strict digits-only: empty strings, decimals, signs, whitespace padding, numeric prefixes/suffixes, and mixed content are rejected before numeric conversion.
- Product `page` accepts only `1..7`; wide-search `page` (category, brand, search) accepts any positive integer with no upper bound. Fixed `pageSize` values (`50` for products, `100` for variants) require the exact configured numeric string.
- `src/app/page.tsx` canonicalizes malformed, nonpositive, out-of-range base pages, unknown modes, and missing/invalid mode values to `/?page=1` with `redirect()`.
- Category and brand public params are decoded names, trimmed, capped at 100 characters, and constrained by `SEARCH_TERM_PATTERN`; document IDs remain limited to the existing safe pattern (`/^[A-Za-z0-9_-]+$/`) and 30-character maximum.
- Search terms remain trimmed, required, maximum 100 characters, and constrained by the existing Unicode/punctuation allowlist.

## Category And Brand Upstream Errors

- `fetchProductsByCategory` and `fetchProductsByBrand` have explicit `Promise<Product[]>` return types and no local try/catch. Rejected Apollo work propagates to the route's edge handler and becomes `CAT_ERR_001` (HTTP 400); a successful GraphQL response with a missing/null `products` field still returns `[]`.
- The five other Apollo-backed helpers (`fetchProducts`, `fetchProductsByName`, `fetchProductVariants`, `fetchCategories`, `fetchBrands`) follow the same "throw at the boundary, catch at the edge" contract. The shared contract is documented in a JSDoc block at the top of `src/shared/lib/global.lib.ts`.

## Environment Variables

Required for Strapi-backed catalog data:

- `STRAPI_HOST` - Strapi GraphQL endpoint.
- `STRAPI_API_TOKEN` - bearer token sent by Apollo Client.

Values are expected in `.env.local` for local development. Without them, Apollo queries from server components/actions can fail or return empty data.

## Commands

| Command                  | Purpose                                                                        |
| ------------------------ | ------------------------------------------------------------------------------ |
| `pnpm dev`               | Start Next dev server with Turbopack.                                          |
| `pnpm build`             | Production build with Turbopack; also runs type checking.                      |
| `pnpm start`             | Start a built Next app.                                                        |
| `pnpm lint`              | Run ESLint flat config extending `next/core-web-vitals` and `next/typescript`. |
| `pnpm test`              | One-shot Jest run with coverage output (no threshold enforced).                |
| `pnpm test:watch`        | Jest in watch mode.                                                            |
| `pnpm exec tsc --noEmit` | Standalone TypeScript check; there is no package script for this.              |
| `pnpm sync:prompts`      | Copy OpenCode commands to GitHub prompts and project Claude skills.            |
| `pnpm design:lint`       | Validate `DESIGN.md` tokens and component contrast (exit 1 on errors).         |
| `pnpm design:export`     | Emit `DESIGN.md` tokens as a Tailwind v4 `@theme` CSS block to stdout.         |

## Prompt Sync

`scripts/sync-opencode-commands.mjs` discovers every `.opencode/command/*.md` file and copies it to both generated targets:

- `.github/prompts/<command>.prompt.md`
- `.claude/skills/<command>/SKILL.md`

Edit the OpenCode command first and run `pnpm sync:prompts`; do not hand-edit either generated copy.

## CI And Release Workflow

- PRs target `develop`.
- `check-label.yml` requires at least one of `major`, `minor`, or `patch` on pull requests. CI fails when none are present.
- `develop-pipeline.yml` runs on closed PRs to `develop`; when merged, it checks labels, bumps `package.json` with `npm version --no-git-tag-version`, tags `vX.Y.Z`, pushes tags, and prepends a generated entry to `CHANGELOG.md`.
- `test.yml` runs on `pull_request` and on pushes to `develop`. It checks out the repo, enables pnpm via Corepack, sets up Node 22 with pnpm caching, runs `pnpm install --frozen-lockfile`, then `pnpm lint` and `pnpm test --coverage`, and uploads the `coverage/` directory as an artifact (`if-no-files-found: error`). It does not duplicate label enforcement, release versioning, tagging, or changelog behavior.
- Do not manually bump `package.json` version or edit `CHANGELOG.md` for normal PR work unless explicitly requested.

## Testing

- Framework: Jest 30 + Testing Library (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`) wired through `next/jest.js` in `jest.config.ts`.
- Discovery: tests live in root `__tests__/` (not co-located with source). Pattern is `__tests__/**/*.{test,spec}.{ts,tsx}`.
- Setup: `jest.setup.ts` loads `@testing-library/jest-dom` once and shims `window.matchMedia` (the only browser shim). `__tests__/test-utils.tsx` re-exports Testing Library and wraps `render` in the existing `Providers` component from `@/app/providers`. The `Providers` component is currently pass-through; using it keeps the app-provider seam stable.
- Aliases: Jest mirrors `tsconfig.json` (`^@/(.*)$` → `src/$1`) and adds `^@__tests__/(.*)$` → `__tests__/$1` for the test helper. Both must be listed in `tsconfig.json` `paths` for TypeScript to resolve them.
- Coverage: emitted via `pnpm test`; no threshold is enforced. Report writes to `coverage/` which is explicitly gitignored by `.gitignore` (`/coverage`) and also ignored by `eslint.config.mjs`; do not commit it.
- CI: `pnpm lint` + `pnpm test --coverage` run on every pull request and on pushes to `develop` via `.github/workflows/test.yml`. The coverage artifact is uploaded with `if-no-files-found: error`.
- Authoring and repair: canonical rules live in `docs/UNIT_TESTING_GUIDELINES.md`. The OpenCode `unit-test` skill (`.opencode/skills/unit-test/SKILL.md`) and the `/unit-test` command (`.opencode/command/unit-test.md`, synced to `.github/prompts/unit-test.prompt.md`) cover create and fix flows without requiring an approved plan.

## Styling And UI

- Preserve HeroUI as the component system unless a task explicitly changes UI libraries.
- `tailwind.config.js` currently only sets `darkMode: "class"`; Tailwind v4 auto-detects app content.
- `darkMode: "class"` is required for next-themes/HeroUI dark mode behavior.
- Existing UI copy is Spanish (`Catalogo de productos`, `Limpiar filtros`, `Ver detalles`, etc.). Preserve language consistency unless the task is localization-related.
- `ProductCard` uses `useMediaQuery()` for mobile-aware card header/title layout.

## Conventions And Gotchas

- Path alias: `@/*` maps to `./src/*`.
- Add `"use client"` to files that use hooks, browser APIs, router hooks, Zustand hooks, HeroUI hooks, or client-only libraries.
- Keep domain UI under `src/features/<Feature>/`; keep cross-cutting UI/helpers under `src/shared/`; `src/components` currently only contains `ProductCard`.
- New state stores should follow the SSR-safe provider/store pattern already used under `src/zustand`.
- Do not add TanStack Query, Redux, form libraries, auth flows, or test tooling unless the story explicitly requires them.
- GraphQL schema knowledge is inferred from `src/shared/queries/global.queries.ts` and TypeScript types. Confirm backend/Strapi contract before normalizing fields or changing query shapes.
- Product category and brand lists are hardcoded in `src/shared/types/global.types.ts`; there is a TODO questioning whether this should remain hardcoded. The catalog API uses the live Strapi taxonomy (`GET_CATEGORIES` / `GET_BRANDS`) for validation, not the hardcoded arrays.
- Catalog API route handlers validate `STRAPI_HOST` + `STRAPI_API_TOKEN` before calling the Apollo client; a missing env var is `CAT_ENV_001`, never a leaked configuration error. Validation constants and `CAT_*` codes live in `src/shared/constants/catalog.constants.ts`; shared helpers (envelopes, param parsing) live in `src/app/api/catalog/_utils.ts`.
- Apollo-backed helpers in `global.lib.ts` do not catch locally; route handlers or route error boundaries own failure mapping/recovery.
- `useCatalogSearch` in `src/features/Home/useCatalogSearch.ts` now owns drawer input and validation state only. `Home` builds canonical URLs and treats server props as authoritative catalog state.
- Product image rendering in `ProductCard` is commented out and currently references localhost Strapi URLs. Treat image support as unfinished.
- `@heroui/react` v3 is ESM-only and its `package.json` `exports['.']` exposes only an `import` entry (no `default`/`require`). Jest in CJS mode cannot resolve it through the package name. `jest.config.ts` maps `^@heroui/react$` to its `dist/index.js` to bypass the `exports` field, and `next.config.ts` lists the HeroUI + React-Aria + Radix + Framer-Motion + tailwind-variants + input-otp + `@jridgewell/*` + `@cspotcode/*` ecosystem in `transpilePackages` so SWC transforms their ESM. If you add a new client component that imports a different ESM-only package, add it to `transpilePackages` and confirm it resolves through the SWC transform.

## Key Files

| File                                                                                       | Purpose                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                                                                | Compact agent instructions: commands, architecture, env, CI, styling.                                                                                                                               |
| `DESIGN.md`                                                                                | Visual design system tokens + rationale; lint with `pnpm design:lint`.                                                                                                                              |
| `docs/UNIT_TESTING_GUIDELINES.md`                                                          | Canonical Jest/Testing Library authoring rules; the only full copy of test policy.                                                                                                                  |
| `.opencode/skills/unit-test/SKILL.md`                                                      | Thin discoverable skill that points to the guide and the `/unit-test` command.                                                                                                                      |
| `.opencode/command/*.md`                                                                  | OpenCode command sources. Edit these, then run `pnpm sync:prompts` to regenerate matching GitHub prompts and Claude skills.                                                                         |
| `package.json`                                                                             | Scripts and dependencies.                                                                                                                                                                           |
| `next.config.ts`                                                                           | Minimal Next config.                                                                                                                                                                                |
| `tsconfig.json`                                                                            | Strict TypeScript, bundler module resolution, `@/*` path alias.                                                                                                                                     |
| `eslint.config.mjs`                                                                        | ESLint flat config with Next presets.                                                                                                                                                               |
| `postcss.config.mjs`                                                                       | Tailwind v4 PostCSS plugin.                                                                                                                                                                         |
| `tailwind.config.js`                                                                       | Minimal Tailwind config with class dark mode.                                                                                                                                                       |
| `scripts/sync-opencode-commands.mjs`                                                       | Syncs OpenCode commands into `.github/prompts` and `.claude/skills`.                                                                                                                                |
| `.github/workflows/check-label.yml`                                                        | PR label validation for `major`, `minor`, or `patch`.                                                                                                                                               |
| `.github/workflows/develop-pipeline.yml`                                                   | Develop merge release/changelog automation.                                                                                                                                                         |
| `src/app/layout.tsx`                                                                       | Root layout, HeroUI provider, next-themes provider.                                                                                                                                                 |
| `src/app/page.tsx`                                                                         | Catalog page, pagination param handling, server data fetch.                                                                                                                                         |
| `src/app/loading.tsx`                                                                      | Accessible catalog route loading fallback.                                                                                                                                                          |
| `src/app/error.tsx`                                                                        | Catalog route error boundary with Spanish retry UI.                                                                                                                                                 |
| `src/app/apollo-client.ts`                                                                 | Apollo Client factory using Strapi env vars.                                                                                                                                                        |
| `src/app/api/preferences/route.ts`                                                         | Theme cookie API route.                                                                                                                                                                             |
| `src/app/api/catalog/_utils.ts`                                                            | Shared catalog route helpers: env validation, success/error envelopes, param parsing.                                                                                                               |
| `src/app/api/catalog/{products,category,brand,categories,brands,variants,search}/route.ts` | Catalog API route handlers (thin wrappers over server actions).                                                                                                                                     |
| `src/shared/constants/catalog.constants.ts`                                                | `CAT_*` error codes, `MSG_CAT_*` internal messages, and validation constants (page bounds, page sizes, documentId pattern/length, `SEARCH_TERM_MAX_LENGTH = 100`, `SEARCH_TERM_PATTERN` allowlist). |
| `src/shared/utils/catalog-api.utils.ts`                                                    | Client-side `fetchCatalog<T>()` envelope wrapper, `CatalogApiError` with `code`, and `catalogErrorToSpanish` code-to-Spanish-copy map.                                                              |
| `src/features/Home/Home.tsx`                                                               | Client catalog controller.                                                                                                                                                                          |
| `src/features/Home/useCatalogSearch.ts`                                                    | Hook owning catalog-wide name-search state, drawer state, and mode coordination.                                                                                                                    |
| `src/features/Pagination/{types.pagination,utils.pagination}.ts`                           | Feature-local catalog URL parsing/building helpers and types for server URL orchestration.                                                                                                           |
| `src/features/ProductListing/*.tsx`                                                        | Listing grid, search input, category and brand dropdowns.                                                                                                                                           |
| `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx`                                 | HeroUI right-side drawer with name-search form plus the catalog-wide category/brand dropdowns.                                                                                                      |
| `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`                             | Variant drawer and price display.                                                                                                                                                                   |
| `src/components/ProductCard.tsx`                                                           | Product card UI.                                                                                                                                                                                    |
| `src/shared/lib/global.lib.ts`                                                             | Server actions for Strapi reads and theme cookies.                                                                                                                                                  |
| `src/shared/queries/global.queries.ts`                                                     | GraphQL operations.                                                                                                                                                                                 |
| `src/shared/types/global.types.ts`                                                         | Product/domain types plus hardcoded category and brand options.                                                                                                                                     |
| `src/zustand/provider/change-theme.provider.tsx`                                           | Theme store provider and hook.                                                                                                                                                                      |
| `src/zustand/store/change-theme.store.ts`                                                  | Vanilla Zustand theme store.                                                                                                                                                                        |

## External References

### HeroUI v3 Documentation

- **MCP server (primary):** `heroui-react` is configured in `opencode.json` via `@heroui/react-mcp`. Prefer it for component API, props, and pattern questions — it returns live v3 docs without a web fetch.
- **LLM docs (fallback):** when the MCP is not loaded or for bulk context:

| URL                                          | Scope                      |
| -------------------------------------------- | -------------------------- |
| https://heroui.com/react/llms.txt            | Index/summary — start here |
| https://heroui.com/react/llms-full.txt       | Full React docs            |
| https://heroui.com/react/llms-components.txt | Component docs only        |
| https://heroui.com/react/llms-patterns.txt   | Patterns/composition docs  |

## Open Questions

- The Strapi schema and pagination metadata are inferred only from current GraphQL queries and prior research notes; there is no schema file or OpenAPI equivalent in this repo.
- The production deployment target is not documented in source beyond generic Next README content and GitHub workflows.
- Theme defaults differ between `NextThemesProvider` (`dark`) and `getThemePreference()` (`light` when no cookie exists); confirm desired default before changing related UX.
- Category/brand options are hardcoded; confirm whether they should eventually come from Strapi before replacing them with dynamic fetches.
- `DESIGN.md` documents a green accent scale targeting HeroUI's `--primary-*` tokens, but HeroUI's default blue is still live in `src/app/globals.css`; remapping is a pending deliberate change, not a bug.
