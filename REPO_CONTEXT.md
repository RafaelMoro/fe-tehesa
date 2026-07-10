# Repository Context - fe-tehesa

**Last Updated:** 2026-06-28

A living reference for AI agents and developers working in this repository. It documents the app wiring, module boundaries, data flow, and conventions that are not obvious from a single file read.

> Treat this file as a map, not a contract. The ground truth is the code.

## Overview

`fe-tehesa` is a Next.js 15 App Router MVP for the Tehesa product catalog. It renders a paginated catalog, supports client-side search over the current result set, fetches filtered product lists by category or brand from Strapi, and opens a drawer with product variant pricing.

**Tech stack:**

- Next.js 15 App Router + React 19 + TypeScript strict mode.
- pnpm lockfile with `.npmrc` hoisting for `@heroui/*` packages.
- Tailwind v4 through `@tailwindcss/postcss` plus `tailwind.config.js` for HeroUI theme scanning and `darkMode: "class"`.
- HeroUI (`@heroui/react`) for UI primitives.
- Apollo Client v4 + GraphQL for Strapi reads.
- next-themes for class-based light/dark theme mode.
- Zustand vanilla store + provider pattern for theme state.
- Remix Icon React, Framer Motion, and `clsx` for icons, motion support, and class composition.
- No test framework or test script is configured.

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
- `src/app/providers.tsx` is a client wrapper around `HeroUIProvider`.
- `src/app/page.tsx` is the only page route currently present. It awaits `searchParams` per Next 15, clamps `page` to `1..5`, fetches products and the theme cookie in parallel, and wraps the catalog in `ChangeThemeStoreProvider`.
- `src/app/page.tsx` has a hardcoded pagination ceiling of 5 pages. This is a known product/API constraint, not a bug.
- Server data access lives in `src/shared/lib/global.lib.ts` with the `"use server"` directive. It creates a new Apollo Client for each call through `src/app/apollo-client.ts`.
- Client components currently import server actions from `global.lib.ts` for category, brand, and variant fetches. Preserve or change this deliberately; do not add a second data access pattern casually.
- Theme persistence is cookie-backed through `POST /api/preferences` -> `saveThemeCookie()`. The cookie key is `tehesa-theme` in `src/shared/constants/global.constants.ts`.
- The Zustand theme store follows the provider-wraps-store pattern under `src/zustand/provider` and `src/zustand/store`. Keep stores request-safe by creating them inside provider refs, not module-level singletons.

## Directory Layout

### `src/app/`

| Path                    | Purpose                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `layout.tsx`            | Root layout; Google Geist fonts, global styles, HeroUI and theme setup. |
| `page.tsx`              | Catalog route `/`; server fetches products + theme and renders `Home`.  |
| `providers.tsx`         | Client provider for HeroUI.                                             |
| `apollo-client.ts`      | Apollo Client factory for Strapi GraphQL.                               |
| `api/preferences/route.ts` | Saves theme preference cookie via `POST /api/preferences`.           |
| `hero.ts`               | HeroUI-related setup file.                                              |
| `globals.css`           | Tailwind/global CSS.                                                    |

### `src/features/`

| Domain                   | Purpose                                                                                  |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `Home/`                  | Main client catalog controller: search, category/brand filters, pagination, drawer state. |
| `ProductListing/`        | Product grid plus `SearchInput`, `DropdownCategories`, and `DropdownBrands`.             |
| `ProductVariantsDrawer/` | HeroUI drawer that fetches, sorts, and displays product variants/prices.                 |

### `src/shared/`

| Subdir       | Purpose                                                                                 |
| ------------ | --------------------------------------------------------------------------------------- |
| `constants`  | Cross-cutting constants such as the theme cookie key.                                   |
| `hooks`      | Reusable client hooks; currently `useMediaQuery`.                                       |
| `lib`        | Server actions for Strapi reads and theme cookie persistence.                           |
| `queries`    | GraphQL operations for products, filtered products, and variants.                       |
| `types`      | Product, variant, app theme, error, pagination, category, and brand types/constants.    |
| `ui/atoms`   | Reusable atomic UI such as `ToggleDarkMode`.                                            |
| `ui/organisms` | Reusable composed UI such as `Header`.                                               |
| `utils`      | Pure helpers such as currency formatting.                                               |

### `src/zustand/`

| Path                                    | Purpose                                                              |
| --------------------------------------- | -------------------------------------------------------------------- |
| `store/change-theme.store.ts`           | Vanilla Zustand theme store and React context.                       |
| `provider/change-theme.provider.tsx`    | Client provider that creates a per-provider store with `useRef`.     |

## Data Flow

Product reads are GraphQL queries against Strapi:

- `fetchProducts(page)` calls `GET_PRODUCTS` with `pagination: { page, pageSize: 50 }`.
- `fetchProductsByCategory(customId)` calls `GET_PRODUCTS_BY_CATEGORY` with a category `customId contains` filter and `pageSize: 50`.
- `fetchProductsByBrand(brandId)` calls `GET_PRODUCTS_BY_BRAND` with a brand `customId contains` filter and `pageSize: 50`.
- `fetchProductVariants({ documentId })` calls `GET_PRODUCT_VARIANTS` with `pageSize: 100` and returns `product.product_variants`.

Catalog behavior:

- The server page fetches one page of 50 products and passes it to `Home`.
- `Home` stores the current working set in `allProducts.current` and visible rows in `filteredProducts`.
- Search filters only the current working set in memory by product name. It does not query Strapi and does not reset the page to 1.
- Category and brand filters fetch from Strapi and replace the working set. Only one of category or brand is active at a time.
- Pagination uses `router.push('/?page=N')`, scrolls to top, and hides while a category or brand filter is active.
- `ProductVariantsDrawer` fetches variants when opened, formats prices with `formatNumberToCurrency`, and sorts by numeric price ascending.

## API Route Inventory

| Route              | Methods | Purpose                                                                 |
| ------------------ | ------- | ----------------------------------------------------------------------- |
| `/api/preferences` | `POST`  | Requires JSON `{ "theme": "light" | "dark" }`; saves `tehesa-theme` cookie and returns `{ success, themeChangedTo }`. |

There are no auth, checkout, order, or backend proxy route handlers in this repo at the time of writing.

## Theme And Cookies

- Cookie key: `THEME_COOKIE_KEY = 'tehesa-theme'`.
- `getThemePreference()` reads the cookie server-side and returns `'light'` when absent.
- `saveThemeCookie(theme)` sets an httpOnly, secure, sameSite strict cookie.
- `NextThemesProvider` defaults to dark, while `getThemePreference()` defaults to light when no cookie exists. Be explicit when changing theme initialization behavior because these defaults currently differ.
- Client theme UI should use the existing `ChangeThemeStoreProvider`, `useChangeThemeStore`, `ToggleDarkMode`, and `/api/preferences` flow rather than writing cookies directly.

## Environment Variables

Required for Strapi-backed catalog data:

- `STRAPI_HOST` - Strapi GraphQL endpoint.
- `STRAPI_API_TOKEN` - bearer token sent by Apollo Client.

Values are expected in `.env.local` for local development. Without them, Apollo queries from server components/actions can fail or return empty data.

## Commands

| Command                  | Purpose                                                                     |
| ------------------------ | --------------------------------------------------------------------------- |
| `pnpm dev`               | Start Next dev server with Turbopack.                                       |
| `pnpm build`             | Production build with Turbopack; also runs type checking.                   |
| `pnpm start`             | Start a built Next app.                                                     |
| `pnpm lint`              | Run ESLint flat config extending `next/core-web-vitals` and `next/typescript`. |
| `pnpm exec tsc --noEmit` | Standalone TypeScript check; there is no package script for this.           |
| `pnpm sync:prompts`      | Copy `.opencode/command/*.md` commands to `.github/prompts/*` equivalents.  |

There is no `pnpm test` script and no test framework configured. Do not invent test commands.

## Prompt Sync

`scripts/sync-opencode-commands.mjs` keeps GitHub prompt files aligned with opencode commands:

- `.opencode/command/research.md` -> `.github/prompts/research.prompt.md`
- `.opencode/command/plan.md` -> `.github/prompts/plan.prompt.md`
- `.opencode/command/implement.md` -> `.github/prompts/implement.md`

When editing an opencode command that has a GitHub prompt counterpart, edit the opencode command first and run `pnpm sync:prompts`. The sync script skips command files that do not exist in the checkout.

## CI And Release Workflow

- PRs target `develop`.
- `check-label.yml` requires at least one of `major`, `minor`, or `patch` on pull requests. CI fails when none are present.
- `develop-pipeline.yml` runs on closed PRs to `develop`; when merged, it checks labels, bumps `package.json` with `npm version --no-git-tag-version`, tags `vX.Y.Z`, pushes tags, and prepends a generated entry to `CHANGELOG.md`.
- Do not manually bump `package.json` version or edit `CHANGELOG.md` for normal PR work unless explicitly requested.

## Styling And UI

- Preserve HeroUI as the component system unless a task explicitly changes UI libraries.
- `tailwind.config.js` includes only HeroUI theme dist in `content`; Tailwind v4 auto-detects app content. Do not broaden or remove this casually.
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
- Product category and brand lists are hardcoded in `src/shared/types/global.types.ts`; there is a TODO questioning whether this should remain hardcoded.
- `fetchProductsByCategory()` and `fetchProductsByBrand()` catch errors and return `undefined`; callers need to handle absent results.
- `fetchProducts()` and `fetchProductVariants()` do not catch Apollo errors; errors can surface to the route/render path.
- Product image rendering in `ProductCard` is commented out and currently references localhost Strapi URLs. Treat image support as unfinished.

## Key Files

| File                                      | Purpose                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| `AGENTS.md`                               | Compact agent instructions: commands, architecture, env, CI, styling.    |
| `package.json`                            | Scripts and dependencies.                                                |
| `next.config.ts`                          | Minimal Next config.                                                     |
| `tsconfig.json`                           | Strict TypeScript, bundler module resolution, `@/*` path alias.          |
| `eslint.config.mjs`                       | ESLint flat config with Next presets.                                    |
| `postcss.config.mjs`                      | Tailwind v4 PostCSS plugin.                                              |
| `tailwind.config.js`                      | HeroUI theme plugin/content and class dark mode.                         |
| `scripts/sync-opencode-commands.mjs`      | Syncs opencode command prompts into `.github/prompts`.                   |
| `.github/workflows/check-label.yml`       | PR label validation for `major`, `minor`, or `patch`.                    |
| `.github/workflows/develop-pipeline.yml`  | Develop merge release/changelog automation.                              |
| `src/app/layout.tsx`                      | Root layout, HeroUI provider, next-themes provider.                      |
| `src/app/page.tsx`                        | Catalog page, pagination param handling, server data fetch.              |
| `src/app/apollo-client.ts`                | Apollo Client factory using Strapi env vars.                             |
| `src/app/api/preferences/route.ts`        | Theme cookie API route.                                                  |
| `src/features/Home/Home.tsx`              | Client catalog controller.                                               |
| `src/features/ProductListing/*.tsx`       | Listing grid, search input, category and brand dropdowns.                |
| `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` | Variant drawer and price display.                      |
| `src/components/ProductCard.tsx`          | Product card UI.                                                         |
| `src/shared/lib/global.lib.ts`            | Server actions for Strapi reads and theme cookies.                       |
| `src/shared/queries/global.queries.ts`    | GraphQL operations.                                                      |
| `src/shared/types/global.types.ts`        | Product/domain types plus hardcoded category and brand options.          |
| `src/zustand/provider/change-theme.provider.tsx` | Theme store provider and hook.                                  |
| `src/zustand/store/change-theme.store.ts` | Vanilla Zustand theme store.                                             |

## External References

### HeroUI v3 Documentation

- **MCP server (primary):** `heroui-react` is configured in `opencode.json` via `@heroui/react-mcp`. Prefer it for component API, props, and pattern questions — it returns live v3 docs without a web fetch.
- **LLM docs (fallback):** when the MCP is not loaded or for bulk context:

| URL | Scope |
| --- | --- |
| https://heroui.com/react/llms.txt | Index/summary — start here |
| https://heroui.com/react/llms-full.txt | Full React docs |
| https://heroui.com/react/llms-components.txt | Component docs only |
| https://heroui.com/react/llms-patterns.txt | Patterns/composition docs |

## Open Questions

- The Strapi schema and pagination metadata are inferred only from current GraphQL queries and prior research notes; there is no schema file or OpenAPI equivalent in this repo.
- The production deployment target is not documented in source beyond generic Next README content and GitHub workflows.
- Theme defaults differ between `NextThemesProvider` (`dark`) and `getThemePreference()` (`light` when no cookie exists); confirm desired default before changing related UX.
- Category/brand options are hardcoded; confirm whether they should eventually come from Strapi before replacing them with dynamic fetches.
