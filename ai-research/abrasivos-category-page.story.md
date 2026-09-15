# Abrasivos category page (`/categorias/abrasivos`) + shared category page UI — Research

**Date:** 2026-09-15
**Branch:** `feat/add-abrasivos-page`
**Scope:** standalone story (single deliverable, ~3 phases)
**Reference story:** `ai-research/tornilleria-category-page.story.md` (the page this one clones). Its design comps
(`pagina-tornilleria.dc.html`) are the visual source of record for this page too — no new design work.

## Story Definition

### Title

Add `/categorias/abrasivos`, generalize the Tornillería category page into a reusable per-category UI so every
future `/categorias/<slug>` route is a thin config, and rename `/categorias/tornilleria` to
`/categorias/tornilleria-fijacion`.

### Description

`/categorias/tornilleria` shipped as a one-off: `src/features/CategoryPage/CategoryPage.tsx` hardcodes the
breadcrumb label, H1, intro paragraph and search placeholder for Tornillería, and `src/app/categorias/tornilleria/`
carries its own `page.tsx`/`error.tsx`/`loading.tsx` with Tornillería-specific copy. The next category (Abrasivos)
differs **only** in:

- route slug, `<title>`, meta description, canonical
- H1 + hero intro paragraph
- the `customId` passed to `fetchAllProductsByCategory`
- breadcrumb leaf label / JSON-LD leaf name
- search placeholder
- error-boundary heading (`No pudimos cargar los productos de Tornillería`)

Everything else — breadcrumb structure, hero layout, `WhatsappPanel`, live counter, filter row, `ProductListing`,
`ProductVariantsDrawer`, loading skeleton — is identical. This story:

1. **Extracts the per-category values into a config object** (one entry per category, keyed by `customId`) and
   makes `CategoryPage` + the route shell + error boundary read from it. The Tornillería-only **subcategory
   dropdown** stays in the shared component but renders only when the loaded set actually yields subcategory
   options (D2) — no per-category flag.
2. **Adds `/categorias/abrasivos`** as a second consumer of that shared UI, with the copy the user supplied:
   - URL `/categorias/abrasivos`
   - Title `Discos de Corte y Abrasivos Industriales en Puebla | Tehesa`
   - Meta description `Discos de corte y puntas montadas para desbaste industrial. Abasto en Puebla. Cotiza con Tehesa Industrial.`
   - H1 `Abrasivos industriales`
   - Hero intro paragraph = the meta description text (D1)
3. **Renames `/categorias/tornilleria` → `/categorias/tornilleria-fijacion`** (folder move + `CATEGORY_PAGE_HREFS`
   value + canonical + tests). No redirect from the old URL (D3).

**Out of scope (explicitly):** a dynamic `/categorias/[slug]` route (each category keeps a static folder so
`generateMetadata`/JSON-LD stay literal and per-route `error.tsx`/`loading.tsx` keep working); adding Abrasivos
products in Strapi (0 published today, Strapi contract I); product images; changing `/?mode=category` behaviour;
touching `CatalogSearchDrawer`; any other category page.

### Acceptance criteria

1. **Abrasivos route + data.** `GET /categorias/abrasivos` is server-rendered, fetches every published product with
   `category.customId == "abrasivos"` via the existing `fetchAllProductsByCategory("abrasivos")` (no new query, no
   new adapter), and renders them all in one grid with no pagination. `generateMetadata` returns the exact
   title/description above, `alternates.canonical: "/categorias/abrasivos"`, `robots: { index: true, follow: true }`.
   A 3-item `BreadcrumbList` JSON-LD (`Inicio` / `Categorías` / `Abrasivos`) is emitted. Zero products (today's
   live state) renders `ProductListing`'s existing `No hay productos disponibles.` state — the page must not error
   or hide its hero/breadcrumb on an empty set.
2. **Abrasivos page structure.** `nav[aria-label="Ruta"]` with leaf `Abrasivos` (`aria-current="page"`), kicker
   `Categoría`, `<h1>Abrasivos industriales</h1>`, intro paragraph (D1), `WhatsappPanel`, live `N productos`
   counter, filter row with `SearchInput` + `Filtrar marcas` (+ `Limpiar filtros` when active), **no**
   `Filtrar subcategorías` dropdown because no Abrasivos product carries a `subcategory` (D2). Own
   `error.tsx`/`loading.tsx` under `src/app/categorias/abrasivos/` (nested routes are otherwise caught by the
   category-index boundaries, `REPO_CONTEXT.md` gotcha).
3. **Shared UI, not a copy.** `src/features/CategoryPage/CategoryPage.tsx` contains **no** category-specific string
   literals; both routes render the same component with their config. The Tornillería page renders byte-for-byte
   the same DOM as before (existing `__tests__/category-page/CategoryPage.test.tsx` assertions still hold, adjusted
   only for how the component receives its copy). Adding a third category must require only: one config entry, one
   `CATEGORY_PAGE_HREFS` entry, one SEO title/description pair, and one `src/app/categorias/<slug>/` folder.
4. **Entry points.** `CATEGORY_PAGE_HREFS` gains `abrasivos: "/categorias/abrasivos"`; consequently the header
   `Categorías` dropdown row, the mobile-accordion row, the `/categorias` card CTA `Ver categoría` and the sitemap
   all light up for Abrasivos with **no code changes** in `Header`, `MobileMenu`, `CategoryCard` or `sitemap.ts`
   (they already iterate the map). On `/categorias/abrasivos` the header marks `Categorías` + `Abrasivos` active
   via the existing `pageCategoryId` lookup.
5. **Tornillería rename.** `GET /categorias/tornilleria-fijacion` serves the Tornillería page; `CATEGORY_PAGE_HREFS.tornilleria`,
   the canonical, the JSON-LD leaf `item`, the sitemap entry, header/mobile/card hrefs and every test reference
   use the new path. `GET /categorias/tornilleria` returns the app's 404 (D3).
6. **Verification.** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass. New tests cover
   `/categorias/abrasivos` `generateMetadata`, its error boundary copy, the sitemap containing both
   `/categorias/abrasivos` and `/categorias/tornilleria-fijacion`, and `CategoryPage` hiding the subcategory
   dropdown when no product has a subcategory. Existing Tornillería tests are updated for the new path, not deleted.

### Task breakdown (for the planner)

1. **Generalize** — introduce the per-category config (constants), thread it through `CategoryPage`, the
   Tornillería route shell and error boundary; make the subcategory dropdown conditional. Tornillería tests green.
2. **Rename** — move `src/app/categorias/tornilleria/` → `src/app/categorias/tornilleria-fijacion/`, update
   `CATEGORY_PAGE_HREFS`, canonical, tests (`Header`, `CategoriesPage`, `sitemap`, `tornilleria-metadata`,
   `tornilleria-error`), and the `REPO_CONTEXT.md` route table.
3. **Add Abrasivos** — config entry, SEO constants, `CATEGORY_PAGE_HREFS` entry, `src/app/categorias/abrasivos/`
   (`page.tsx`, `error.tsx`, `loading.tsx`), tests, `REPO_CONTEXT.md` route table.

Phases 2 and 3 are independent of each other; both depend on 1.

## Design Agent Handoff

No design brief file for this story. The Abrasivos page is the Tornillería comp with different copy; the rename is
invisible. No new visual state, component, or responsive behaviour is introduced.

### User goal, and what this is not

A buyer landing on `/categorias/abrasivos` (from Google, the header, or `/categorias`) sees every abrasive product
Tehesa sells, narrows by brand or name, and adds items to the quote list. It is **not** a checkout, does not show
stock, and does not paginate.

### Surface index

| Surface                    | File                                            | States                                                                 | Covered by                      |
| -------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------- |
| Category page (shared)     | `src/features/CategoryPage/CategoryPage.tsx`    | full set, filtered, no-match, empty set (Abrasivos today), drawer open | Tornillería comps (prior story) |
| Abrasivos route shell      | `src/app/categorias/abrasivos/page.tsx`         | —                                                                      | n/a (server-only)               |
| Abrasivos loading          | `src/app/categorias/abrasivos/loading.tsx`      | skeleton                                                               | identical to Tornillería        |
| Abrasivos error            | `src/app/categorias/abrasivos/error.tsx`        | Strapi failure                                                         | identical to Tornillería, copy swap |

### Rules that override design instinct

- The empty set is a real, expected state today (0 Abrasivos products live). Render the full hero, breadcrumb,
  WhatsApp panel and the existing empty copy — do not invent a "coming soon" treatment.
- The subcategory dropdown is simply absent when there is nothing to filter — no disabled dropdown, no
  placeholder chip.

### Implementation-facing constraints

- **Mobile/desktop**: unchanged from Tornillería (`lg:grid-cols-[minmax(0,1fr)_340px]` hero, filter row stacks
  below `lg`). With the subcategory dropdown gone the `sm:flex-row` filter group holds only brand + clear.
- **Accessibility**: keep `nav[aria-label="Ruta"]` + `aria-current="page"` on the leaf; `<h1>` is the only h1;
  `Limpiar filtros` remains a real button.
- **Visual patterns to preserve**: run `pnpm design:lint` after touching the feature; kicker color tokens
  (`text-[#23890C] dark:text-[#4DF527]`) stay as-is unless a shared token already exists.
- **Content**: all copy lives in the config object / SEO constants, never inline in the shared component.

### Decision record

- **D1 — Hero intro paragraph.** Decided (user, 2026-09-15): reuse the meta description text as the on-page intro.
- **D2 — Subcategory dropdown on categories without subcategories.** Decided (user, 2026-09-15): hide when the
  loaded set yields no options; derive from data, no per-category flag.
- **D3 — Old Tornillería URL.** Decided (user, 2026-09-15): no redirect; `/categorias/tornilleria` 404s.
- **D4 — Static folder per category vs `[slug]` route.** Decided (research): keep static folders. Literal
  `generateMetadata` per route is what the SEO tests assert, and per-route `error.tsx`/`loading.tsx` are needed
  anyway. Revisit only if the number of categories makes folders painful.

## Technical Research

### Affected areas

- **Routes/pages**
  - `src/app/categorias/tornilleria/` → moved to `src/app/categorias/tornilleria-fijacion/` (`page.tsx`,
    `error.tsx`, `loading.tsx`).
  - `src/app/categorias/abrasivos/` — new (`page.tsx`, `error.tsx`, `loading.tsx`).
  - `src/app/sitemap.ts` — no change (iterates `CATEGORY_PAGE_HREFS`).
- **Feature UI**
  - `src/features/CategoryPage/CategoryPage.tsx` — remove `TORNILLERIA_CATEGORY_NAME` import and the four
    hardcoded strings (breadcrumb leaf, H1, intro, placeholder); render the subcategory dropdown conditionally.
  - `src/features/CategoriesPage/CategoryCard.tsx`, `src/shared/ui/organisms/Header.tsx`,
    `src/shared/ui/organisms/MobileMenu.tsx` — no change (all read `CATEGORY_PAGE_HREFS`).
- **Shared code**
  - `src/shared/constants/category.constants.ts` — `CATEGORY_PAGE_HREFS` gains `abrasivos`, Tornillería value
    changes to `/categorias/tornilleria-fijacion`; home for the new per-category config (name, H1, intro,
    placeholder, error heading) — or a sibling constants file if it grows.
  - `src/shared/constants/seo.constants.ts` — `ABRASIVOS_TITLE`, `ABRASIVOS_DESCRIPTION` next to the Tornillería pair.
  - `src/shared/lib/global.lib.ts`, `src/shared/queries/*` — **no change**; `fetchAllProductsByCategory(customId)`
    and `GET_ALL_PRODUCTS_BY_CATEGORY` are already parameterized by `customId`.
- **Tests** (root `__tests__/`, see `docs/UNIT_TESTING_GUIDELINES.md`)
  - Update path literals: `__tests__/shared/Header.test.tsx` (lines 82, 153–154, 277, 290–291),
    `__tests__/categories/CategoriesPage.test.tsx` (40), `__tests__/seo/sitemap.test.ts` (50, 82),
    `__tests__/seo/tornilleria-metadata.test.ts` (import path + canonical), `__tests__/app/tornilleria-error.test.tsx`
    (import path).
  - `__tests__/category-page/CategoryPage.test.tsx` — adjust for the config prop; add "hides subcategory dropdown
    when no product has one".
  - New: `__tests__/seo/abrasivos-metadata.test.ts`, `__tests__/app/abrasivos-error.test.tsx`; extend
    `sitemap.test.ts` for `/categorias/abrasivos`.
- **Docs**: `ai-skills/REPO_CONTEXT.md` route table (lines ~67, 73, 98, 110, 324, 349, 351) references
  `/categorias/tornilleria` and "Tornillería only today"; update in the implementation PR.

### Existing patterns to follow

- **Route shell** — copy `src/app/categorias/tornilleria/page.tsx` verbatim shape: literal `generateMetadata`,
  module-level `breadcrumbJsonLd` built from `SITE_URL` + `CATEGORY_PAGE_HREFS[id]`, `toJsonLdHtml`, one `<main>`
  with the `mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5` classes.
- **Config lookup** — the planner should pick the smallest shape that removes the literals from `CategoryPage`.
  The natural one is a `Record<string, CategoryPageConfig>` keyed by `customId` in `category.constants.ts`
  (mirrors `CATEGORY_PAGE_HREFS` and `SUBCATEGORY_LABELS`), with the route passing `CATEGORY_PAGES[ID]` (or just
  the id) into `<CategoryPage>`. Do not build a registry/factory beyond one object literal.
- **Conditional dropdown** — `subcategoryOptions.length > 0 && <DropdownCategories … />`; options are already
  derived from the loaded set, so Abrasivos gets none for free.
- **Error/loading boundaries** — `loading.tsx` is category-agnostic already (pure skeleton); `error.tsx` differs
  only in the `<h2>` category name. Either duplicate the two files per route (current convention, ~90 lines) or
  extract the error body into a small shared client component that takes the category name — planner's call,
  lean toward whichever is fewer lines once two consumers exist.
- **Server actions / Apollo** — unchanged; `fetchAllProductsByCategory` sequential paging, throw-at-boundary.
- **Tests** — follow the existing metadata/error/sitemap test files as templates; use `renderWithProviders`
  from `__tests__/test-utils.tsx` where the Tornillería tests do.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` (build also proves the moved route folder resolves and the
  new folder ships its own boundaries).
- `pnpm test` (full — the rename touches five test files) and `pnpm test -- __tests__/category-page` for the
  shared component.
- `pnpm design:lint` after touching `CategoryPage.tsx`.
- Manual/curl: `curl -s localhost:3000/categorias/abrasivos | grep -c '<h1>'`, same for
  `/categorias/tornilleria-fijacion`; `/categorias/tornilleria` → 404; `/sitemap.xml` lists both new hrefs and
  not the old one.

### Dependencies / integration points

- No new dependencies.
- Env: `STRAPI_HOST`, `STRAPI_API_TOKEN` (fetch), `NEXT_PUBLIC_WHATSAPP_NUMBER` (panel), `NEXT_PUBLIC_SITE_URL`
  (canonical/JSON-LD).
- PR to `develop` with the `minor` label (new route + rename; the rename is technically breaking for the old URL
  but nothing links to it internally).

### Edge cases and constraints

- **Abrasivos is empty today** (0 published, Strapi contract I). The page will render the empty state until
  content lands. `/categorias` already shows `0 productos` on the card; the CTA will now be a live link to an
  empty page. See UI/product question II on whether that's acceptable to ship as-is.
- **Subcategory field selection** — `GET_ALL_PRODUCTS_BY_CATEGORY` selects `subcategory` for every category; for
  Abrasivos it comes back `null` on every node, which the card kicker and dropdown already handle.
- **`fetchAllProductsByCategory` page size** — 100 per page, sequential; irrelevant at 0 products, fine at the
  Tornillería scale (107).
- **Header active state** — `pageCategoryId` is found by matching `pathname` against `CATEGORY_PAGE_HREFS` values,
  so the rename is picked up automatically as long as the map value changes; a stale value silently drops the
  active highlight (covered by the Header tests once their pathname mock is updated).
- **Sitemap** — the old `/categorias/tornilleria` disappears from the sitemap automatically; nothing else needs a
  removal step.
- **404 for the old URL** — with no redirect, any external link or search-engine index of
  `/categorias/tornilleria` (live since PR #45, merged 2026-09-14) breaks. Accepted (D3).
- **JSON-LD leaf `item`** — built from `CATEGORY_PAGE_HREFS[id]`, so it follows the rename without a literal.
- **Test fixtures** — `__tests__/category-page/CategoryPage.test.tsx` fixtures use `category: { name: "Tornillería" }`
  and subcategory values; the new "no subcategory" test needs a fixture set with `subcategory: null` throughout.

## Open Questions

### Strapi contract

- I: Question: What is the Abrasivos `customId`, and how many products does it have today?
  - Status: answered
  - Answer: `customId: "abrasivos"`, `name: "Abrasivos"`, **0** published products.
  - Context: `backend-research` subagent, live queries against `STRAPI_HOST` on 2026-09-15 —
    `categories(filters: { customId: { eq: "abrasivos" } }) { name customId }` and
    `products_connection(filters: { category: { customId: { eq: "abrasivos" } } }, pagination: { pageSize: 1 }) { pageInfo { total } }`.
    Tornillería re-verified at `customId: "tornilleria"`, 107 products.
- II: Question: Do Abrasivos products carry `subcategory` or brands?
  - Status: answered
  - Answer: Nothing to inspect — no products exist. Schema-wise `subcategory` is the same 10-value enum populated
    only for Tornillería (`REPO_CONTEXT.md`), so Abrasivos nodes will be `null`.
  - Context: same subagent run.

### Catalog behavior

- I: Question: Does the shared component need a per-category flag for the subcategory dropdown?
  - Status: answered
  - Answer: No — hide it when the loaded set yields no subcategory options (D2).

### UI/product decisions

- I: Question: What is the hero intro paragraph for Abrasivos?
  - Status: answered
  - Answer: Reuse the meta description text (D1).
- II: Question: Is it acceptable to ship `/categorias/abrasivos` as an indexable (`index, follow`) page while it
  has 0 products, i.e. an empty grid under the hero?
  - Status: pending
  - Context: Google may treat an empty category page as thin content. Alternatives are `noindex` until content
    lands, or holding the `CATEGORY_PAGE_HREFS` entry (which gates every entry point + sitemap) until Strapi has
    products. Research assumes ship-as-is with `index, follow` to mirror Tornillería.
- III: Question: Should the old `/categorias/tornilleria` URL redirect?
  - Status: answered
  - Answer: No redirect (D3).

### Theme/persistence

- None — no theme or cookie surface is touched.

### Verification

- I: Question: Which PR label?
  - Status: pending
  - Context: research assumes `minor` (new page + route rename). Use `patch` only if the team treats the rename
    as a fix.
