# Brand Pages (`/marcas/[slug]`) — Research (Story 2 of `brands-browsing`)

**Date:** 2026-09-17
**Branch:** `feat/add-specific-brand-page`
**Epic:** `ai-research/epics/brands-browsing.epic.md`
**Scope:** single story, ~3 phases
**Design source:** none — no comp exists for this page. Decided with the user (D1): reuse the `/categorias/[slug]`
layout (`CategoryPage`) verbatim, with brand copy in the hero. Story 1's `pagina-marcas.dc.html` still governs the
`/marcas` card CTA that this story enables.

## Story Definition

### Title

Add one server-rendered page per stocked brand at `/marcas/<slug>` — the brand's full inventory with in-memory
search and category filter — and turn on the `/marcas` card CTAs and header brand rows that were left disabled in
Story 1.

### Description

Story 1 shipped the `/marcas` index with every `Ver productos` CTA disabled and the header's `Marcas` rows inert,
both gated on the empty `BRAND_PAGE_HREFS` map. This story fills that map and adds the pages behind it, cloning the
`/categorias/[slug]` route 1:1:

- **Route.** `src/app/marcas/[slug]/page.tsx`: slug → `customId` (inverting `BRAND_PAGE_HREFS`, like
  `getCategoryIdBySlug`), `notFound()` on an unknown slug (including `libre` — no page), fetch the **entire** matching
  set via a new `fetchAllProductsByBrand(customId)` (same shape as `fetchAllProductsByCategory`, filter
  `brand.customId.eq`), `generateMetadata` from a new `BRAND_SEO` map, 3-item `BreadcrumbList` JSON-LD, own
  `error.tsx` / `loading.tsx`.
- **Feature.** `src/features/BrandPage/BrandPage.tsx` (`"use client"`), the `CategoryPage` shell with the brand's
  copy: breadcrumb `Inicio / Marcas / {name}`, kicker `Marca`, H1 from the SEO table, intro = the card's `identity`
  and `stock` paragraphs (D3), shared `WhatsappPanel`, filtered-count line, filter row (`SearchInput` + a **category**
  dropdown rendered only when the loaded set spans more than one category, + `Limpiar filtros`), `ProductListing`,
  `ProductVariantsDrawer`. No subcategory dropdown, no brand dropdown (D4).
- **Wiring.** `BRAND_PAGE_HREFS` gets the six `/marcas/<slug>` entries; `Header`/`MobileMenu` pass
  `hrefs={BRAND_PAGE_HREFS}` on the `Marcas` instances and derive `activeBrand` from the pathname on `/marcas/<slug>`
  (as `activeCategory` does via `pageCategoryId`); `sitemap.ts` adds the six URLs as base pages. Existing
  `/?mode=brand&brand=<name>` URLs are untouched (D5).

### Acceptance criteria

1. **Route + data.** `GET /marcas/<slug>` for each of the six slugs (`weston`, `king-tony`, `bohrcraft`, `bondhus`,
   `precision`, `cleveland`) server-renders the brand's complete published product set (all pages of
   `products_connection`, `pageSize` 100, no pagination UI), fetched with `filters: { brand: { customId: { eq } } }`.
   Any other slug — `libre`, `Clevaland`, unknown — returns the app 404 via `notFound()`. A Strapi rejection reaches
   the route's own `error.tsx`, which names the brand and offers `Intentar de nuevo` / `Ver todas las marcas`
   (→ `/marcas`).
2. **Page structure.** Inside one `<main>`: breadcrumb `nav[aria-label="Ruta"]` (`Inicio` → `/`, `Marcas` →
   `/marcas`, brand name with `aria-current="page"`); hero with kicker `Marca`, `<h1>` = `BRAND_SEO[id].heading`,
   `identity` paragraph, `stock` paragraph; `WhatsappPanel` beside the hero (≥ `lg`), hidden CTA when
   `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset; count line `1 producto` / `N productos` (`Intl.NumberFormat("es-MX")`) for
   the **filtered** set; product grid; `ProductVariantsDrawer` opens from a card click in default mode. No catalog
   search drawer entry point (`onOpenCatalogSearch` not passed), same as `CategoryPage`.
3. **In-memory filters.** `SearchInput` (placeholder `Buscar en {Name}...`) filters by product name
   (case-insensitive substring); a `DropdownCategories` instance keyed on `category.name` (`valueKey="name"`, options
   = unique category names present in the loaded set, A→Z `localeCompare("es")`, label `Filtrar categorías`) is
   rendered only when the set has ≥ 2 distinct categories; both AND together; `Limpiar filtros` appears when any
   filter is active and resets both; no navigation, fetch, or URL change. `ProductListing`'s local-filter empty state
   (`isLocalFilterActive` + `onClearLocalFilter`) is reused unchanged.
4. **Story 1 gates flip on.** With `BRAND_PAGE_HREFS` populated: every `/marcas` card renders `Ver productos` as a
   `next/link` to `/marcas/<slug>` (no `BrandCard` code change); the header `Marcas` dropdown/accordion rows become
   real links to the same hrefs (`Marca Libre` — not in the map — stays `isDisabled`); on `/marcas/<slug>` the row
   for that brand carries the active treatment (`" (actual)"` suffix in the dropdown, `aria-current` in the mobile
   accordion) and the `Marcas` trigger keeps its Story 1 active underline. The card stays an `<article>` with the CTA
   as its only link (D6 upheld).
5. **SEO.** `generateMetadata` returns the per-brand `title` / `description` from `BRAND_SEO` (table below),
   canonical `/marcas/<slug>`, `robots: { index: true, follow: true }`; unknown slug → `notFound()` from
   `generateMetadata` too. A 3-item `BreadcrumbList` JSON-LD (`Inicio`, `Marcas`, brand) via `toJsonLdHtml`.
   `sitemap.ts` lists the six `/marcas/<slug>` URLs as base pages (survive a taxonomy outage), leaving the seven
   `?mode=brand` entries as they are.
6. **Tests.** `BrandPage` feature (render, search, category dropdown presence/absence, AND filtering, clear, drawer),
   route `generateMetadata` (six slugs + unknown → `notFound`), `fetchAllProductsByBrand` (filters shape, multi-page
   concatenation), `Header` brand rows as links + active row, `BrandsPage` CTA now a link, sitemap count. Follow
   `docs/UNIT_TESTING_GUIDELINES.md`.

### Task breakdown (for the planner)

1. **Data + constants** — `GET_ALL_PRODUCTS_BY_BRAND` (or reuse `GET_ALL_PRODUCTS_BY_CATEGORY`: it already takes a
   generic `$filters: ProductFiltersInput` and selects `category { name }` — a rename to `GET_ALL_PRODUCTS` is the
   lazier path, planner's call), `fetchAllProductsByBrand` in `global.lib.ts` (+ JSDoc contract list),
   `BRAND_PAGE_HREFS` filled, `getBrandIdBySlug`, `BRAND_SEO` in `seo.constants.ts`, `BRAND_PAGES` gains no field
   (H1 lives in `BRAND_SEO.heading`; `identity`/`stock` reused). Tests for the adapter and metadata.
2. **Route + feature** — `src/app/marcas/[slug]/{page,error,loading}.tsx`, `src/features/BrandPage/BrandPage.tsx`
   (+ `BrandPageError.tsx` if the copy differs enough from `CategoryPageError`; otherwise parameterise the existing
   one). Feature tests.
3. **Wiring + docs** — `Header.tsx` / `MobileMenu.tsx` `hrefs` + pathname-derived `activeBrand`; `sitemap.ts`;
   `Header.test.tsx` / `BrandsPage.test.tsx` / `sitemap.test.ts` updates; `ai-skills/REPO_CONTEXT.md`, `CLAUDE.md`,
   epic completion status.

### Per-brand SEO copy (user-supplied, 2026-09-17 — verbatim)

| `customId` | URL | `title` | `description` | `heading` (H1) |
| --- | --- | --- | --- | --- |
| `weston` | `/marcas/weston` | Weston en Puebla — Herramienta Industrial Mexicana \| Tehesa | Distribuidor de Weston en Puebla: cortadores, brocas, machuelos y rimas para la industria. Marca mexicana con +30 años. Cotiza con Tehesa. | Weston: la marca mexicana para la industria |
| `king-tony` | `/marcas/king-tony` | King Tony en Puebla — Dados y Llaves Profesionales \| Tehesa | Distribuidor de King Tony en Puebla. Dados, matracas y llaves de apriete bajo norma DIN y ANSI. Cotiza con Tehesa Industrial. | King Tony: apriete profesional bajo norma DIN y ANSI |
| `bohrcraft` | `/marcas/bohrcraft` | Bohrcraft en Puebla — Brocas y Machuelos Alemanes \| Tehesa | Distribuidor directo de Bohrcraft en Puebla. Brocas y machuelos de precisión alemana para industria. Cotiza con Tehesa. | Bohrcraft: precisión alemana en brocas y machuelos |
| `bondhus` | `/marcas/bondhus` | Bondhus en Puebla — Llaves Hexagonales Made in USA \| Tehesa | Distribuidor de Bondhus en Puebla. Llaves hexagonales y Torx hechas en EUA, inventoras de la punta de bola. Cotiza con Tehesa. | Bondhus: el inventor de la llave de punta de bola |
| `precision` | `/marcas/precision` | Precision Brand en Puebla — Laina de Precisión \| Tehesa | Distribuidor de Precision Brand en Puebla. Laina en rollo para alineación de maquinaria y ajuste de troqueles. Cotiza con Tehesa. | Precision Brand: laina para alinear y ajustar con exactitud |
| `cleveland` | `/marcas/cleveland` | Cleveland en Puebla — Buriles y Machuelos de Cobalto \| Tehesa | Distribuidor de Cleveland en Puebla. Buriles de cobalto K-42 y machuelos para maquinado industrial. Cotiza con Tehesa Industrial. | Cleveland: 150 años de herramienta de corte |

Slugs equal Strapi `customId`s (epic, verified live), so `BRAND_PAGE_HREFS[id] = "/marcas/" + id` for all six.

## Design Agent Handoff

**No design-brief file is produced for this story** (D1): the page is the `/categorias/[slug]` shell with brand
copy, and that shell is already built and reviewed against its own comps (`comps/tornilleria-page/`). The only
Story 1 comp surface touched — the `/marcas` card CTA in its enabled state — is already designed in
`pagina-marcas.dc.html`.

### User goal, and what this is not

A buyer who standardises on a brand ("we only buy Bohrcraft bits") wants everything Tehesa stocks from that brand on
one page, narrowable by name and category, with the same price drawer and WhatsApp hand-off as the rest of the
catalog. It is **not** a brand landing page with logos, history sections or promotions (Strapi has no brand media
or copy; the editorial text is the six `BRAND_PAGES` entries), not a paginated catalog mode, and not a checkout.

### Surface index

| Surface | File | States | Story | Brief |
| --- | --- | --- | --- | --- |
| Breadcrumb | `src/features/BrandPage/BrandPage.tsx` | single | 2 | — (CategoryPage precedent) |
| Hero + `WhatsappPanel` | `BrandPage.tsx` / `src/shared/ui/organisms/WhatsappPanel.tsx` | WhatsApp set / unset | 2 | — |
| Count line + filter row | `BrandPage.tsx` | no filter; search active; category active; both; category dropdown absent (1-category brands) | 2 | — |
| Product grid + local empty state | `src/features/ProductListing/ProductListing.tsx` | products; zero after filter | 2 | — (unchanged) |
| Variants drawer | `src/features/ProductVariantsDrawer/` | default mode | 2 | — (unchanged) |
| Error boundary | `src/app/marcas/[slug]/error.tsx` | fetch failure | 2 | — (`CategoryPageError` precedent) |
| Loading skeleton | `src/app/marcas/[slug]/loading.tsx` | pending fetch | 2 | — (`CategoryPageSkeleton` reused as-is) |
| `/marcas` card CTA (enabled) | `src/features/BrandsPage/BrandCard.tsx` | link | 1 → on | `pagina-marcas.dc.html` |
| Header `Marcas` rows (enabled + active) | `Header.tsx` / `MobileMenu.tsx` | link; active row on `/marcas/<slug>`; `Marca Libre` disabled | 1 → on | `header.dc.html` (rows were `mkList(BRANDS, null)`; enabled look = the category rows) |

### Rules that override design instinct

- Never invent a logo, a "sobre la marca" section, stock levels or promotions. The hero is copy already in
  `BRAND_PAGES` plus the user's H1; nothing else.
- Never show the raw Strapi brand name (`Clevaland`) — breadcrumb, H1, placeholder and JSON-LD use config text.
- One WhatsApp CTA on the page (the shared `WhatsappPanel`); no second closing panel like `/marcas` has.
- The filtered count is the number of cards rendered after filters, never the Strapi total.

### Implementation-facing constraints

**Responsive.** Class-only (`md:`/`lg:`); `useMediaQuery` is `false` on the server. Reuse `CategoryPage`'s classes
untouched: hero grid `lg:grid-cols-[minmax(0,1fr)_340px]`, H1 `text-[28px] md:text-4xl lg:text-5xl`, filter row
`flex-col lg:flex-row`, listing grid from `ProductListing`. Header breakpoint stays `md`.

**Accessibility.** `<nav aria-label="Ruta">` with `aria-current="page"` on the leaf; `<h1>` once; dropdown and
search inputs keep their existing labels; drawer focus management is `ProductVariantsDrawer`'s. Header: react-aria
`MenuItem` strips `aria-current` — the active brand row uses the `" (actual)"` sr-only suffix already implemented
for categories; the mobile accordion rows carry real `aria-current`.

**Visual patterns.** Identical to `/categorias/[slug]`: kicker `text-[#23890C] dark:text-[#4DF527]`; muted intro;
`WhatsappPanel` tint; `DESIGN.md:110-112` CTA colours via the existing components. No `DESIGN.md` change, so
`pnpm design:lint` is not required.

**Content.** Spanish. Kicker `Marca`; H1 per the SEO table; intro paragraphs `BRAND_PAGES[id].identity` then
`BRAND_PAGES[id].stock` (D3); search placeholder `Buscar en {display name}...` where the display name is the
title-case brand as written in the H1 (`Weston`, `King Tony`, `Precision Brand`… — **not** the uppercase card
`name`; planner adds a `displayName`/derives it — see UI III); dropdown label `Filtrar categorías`; clear button
`Limpiar filtros`; count `1 producto` / `N productos`. Error copy: `No pudimos cargar los productos de {display
name}` + `Ver todas las marcas`. Never `formatNumberToCurrency` for counts.

**Out of scope.** Subcategory dropdown (D4); brand logos; redirecting or de-listing `/?mode=brand` URLs (D5);
whole-card link on `/marcas` (D6); a page for `libre`; fixing `Clevaland` in Strapi; `React.cache()` de-duplication
of the layout's `fetchBrands()`; pagination on the brand page (90 products max today).

### Decision record

- **D1 — No comp; reuse the `CategoryPage` layout.** Decided (user, 2026-09-17). Rejected: writing a design brief
  (blocks implementation on comps for a page whose shell already exists).
- **D2 — Six pages, Bohrcraft included.** Decided (user): the initial SEO table omitted Bohrcraft; the user supplied
  its row. Pages = cards = `BRAND_PAGES` keys.
- **D3 — Hero intro = `identity` + `stock`.** Decided (user). No new copy; both strings already live in
  `BRAND_PAGES`.
- **D4 — Filters: search + category dropdown, no subcategory.** Decided (user). Category dropdown only when the set
  spans ≥ 2 categories (Weston, King Tony, Bohrcraft, Bondhus today; Precision/Cleveland get search only).
- **D5 — `/?mode=brand` URLs untouched.** Decided (user). Sitemap gains the six pages alongside the seven catalog
  entries; canonicalisation is a later SEO call.
- **D6 — `/marcas` card: CTA remains the only link.** Decided (user). `BrandCard` needs no change.
- **D7 — Brand pages are `index, follow`, in the sitemap, own `error.tsx`/`loading.tsx`.** Assumed, mirroring
  `/categorias/[slug]`.
- **D8 — Unknown slug (incl. `libre`) → `notFound()`.** Assumed from the epic ("what happens for `libre` (no page;
  `notFound()`)"). `Marca Libre` stays reachable through `/categorias/tornilleria-fijacion` and the header row stays
  disabled because it has no `BRAND_PAGE_HREFS` entry.

## Technical Research

### Affected areas

- **Routes/pages:** new `src/app/marcas/[slug]/page.tsx`, `error.tsx` (`"use client"`, `useParams()`), `loading.tsx`
  (re-export `CategoryPageSkeleton` — the skeleton is layout-only and matches). `src/app/marcas/page.tsx` unchanged.
  Note: adding `[slug]` under `src/app/marcas/` means `/marcas` itself is no longer covered only by the root
  `error.tsx` — Next resolves the nearest boundary per segment, so `/marcas` keeps the root pair and `[slug]` its own.
- **Feature UI:** new `src/features/BrandPage/BrandPage.tsx` (`"use client"`, copy of `CategoryPage.tsx` minus
  subcategory/brand state, plus category state). Error body: either a new `BrandPageError.tsx` or
  `CategoryPageError` generalised with `title`/`body`/`backHref`/`backLabel` props — planner picks the smaller diff.
- **Shared constants:** `brand.constants.ts` — fill `BRAND_PAGE_HREFS`, add `getBrandIdBySlug`;
  `seo.constants.ts` — `BRAND_SEO: Record<string, { title; description; heading }>`.
- **Data:** `global.lib.ts` — `fetchAllProductsByBrand(customId)`; `queries` — either a new
  `GET_ALL_PRODUCTS_BY_BRAND` (identical document) or rename the existing one to `GET_ALL_PRODUCTS` since its
  `$filters` is already generic. `category { name }` is already selected, which is all the category dropdown needs
  (`valueKey="name"`). `ALL_PRODUCTS_PAGE_SIZE` (100) reused — Weston is 90 products = 1 page.
- **Shared UI:** `Header.tsx` / `MobileMenu.tsx` — `hrefs={BRAND_PAGE_HREFS}` on both `Marcas` instances;
  `activeBrand` falls back to the taxonomy name whose `customId` matches `getBrandIdBySlug(pathname)` when no
  `?mode=brand` param is present (mirror of `pageCategoryId`/`activeCategory`).
- **Sitemap:** `src/app/sitemap.ts` — `for (const href of Object.values(BRAND_PAGE_HREFS))` next to the category
  loop.
- **Tests (root `__tests__/`):** new `brand-page/BrandPage.test.tsx` (clone `category-page/CategoryPage.test.tsx`),
  `seo/brand-slug-metadata.test.ts` (clone `seo/category-slug-metadata.test.ts`), `app/brand-slug-error.test.tsx`
  (clone `app/category-slug-error.test.tsx`), `shared/global.lib.test.ts` (adapter case); updates to
  `shared/Header.test.tsx` (brand rows now links; the `disabledBrandItems` assertion at lines 95-108 flips — add a
  fixture brand with a `BRAND_PAGE_HREFS` key, keep one without to cover `Marca Libre`), `brands/BrandsPage.test.tsx`
  (line 49 "renders every CTA disabled" → CTAs are links), `seo/sitemap.test.ts` (`basePageCount` + 6).
- **Docs:** `ai-skills/REPO_CONTEXT.md` (route table, feature table, key files, sitemap/header/brand-constants
  lines), `CLAUDE.md` one-liner, epic completion status.

### Existing patterns to follow

- `src/app/categorias/[slug]/page.tsx` — the whole route file, line for line: `Props = { params: Promise<{ slug }> }`,
  `generateMetadata` + `notFound()`, JSON-LD object, single `<main className="mx-auto flex w-full max-w-6xl …">`.
- `src/features/CategoryPage/CategoryPage.tsx` — filter state, `buildOptions`-style unique/sort, AND filter, count
  wording, `clearFilters`, `useOverlayState` drawer wiring.
- `fetchAllProductsByCategory` — page-1 + `pageCount` loop, `filters` object, "throw at the boundary" (no local
  try/catch; add the new adapter to the JSDoc list).
- `getCategoryIdBySlug` — `Object.keys(HREFS).find(...)` inversion; brand twin over `BRAND_PAGE_HREFS`.
- `Header.tsx` `pageCategoryId`/`activeCategory` — pathname-derived active taxonomy item.
- `DropdownCategories` with `valueKey="name"` — already supported; `CategoryPage` uses names as keys for its brand
  options the same way.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` per phase; `pnpm test -- __tests__/<file>` targeted;
  `pnpm test` before the PR.
- Dev-server `curl` checks (per the user's standing preference): `/marcas/weston` (category dropdown present, 90
  cards), `/marcas/cleveland` (no dropdown, 5 cards), `/marcas/libre` and `/marcas/nope` → 404, `/marcas` cards now
  link, `/sitemap.xml` contains six `/marcas/<slug>`, metadata/JSON-LD per slug, `STRAPI_HOST` down → error
  boundary copy.
- Manual only: header dropdown/accordion rows as links + active row; drawer open; light/dark at 390/1440.
- PR label: `minor` (new routes).

### Dependencies / integration points

- No new dependencies. `STRAPI_HOST` / `STRAPI_API_TOKEN` required (rejection → route `error.tsx`);
  `NEXT_PUBLIC_WHATSAPP_NUMBER` optional (`WhatsappPanel` hides its CTA).
- Root layout's `fetchBrands()` runs per request regardless; the brand route adds one `products_connection` query
  per page of ≤ 100 products (1 page for every brand today).

### Edge cases and constraints

- **Config vs. live divergence.** A brand in `BRAND_PAGE_HREFS` but unpublished in Strapi renders an empty page
  (`0 productos`, no dropdown) rather than 404 — same as a category with no products. Acceptable; `/marcas` already
  hides its card (config ∩ taxonomy).
- **Products with `category: null`.** Excluded from dropdown options; still listed and still match when no category
  filter is set (filter compares `product.category?.name`).
- **Category dropdown threshold.** Rendered when distinct category names ≥ 2, not ≥ 1 — a one-category brand gets
  a useless single-option filter otherwise. This differs from `CategoryPage`'s `subcategoryOptions.length > 0` on
  purpose (there, one subcategory still partitions the set from the unsubcategorised rest).
- **`Marca Libre` in the header.** With `hrefs={BRAND_PAGE_HREFS}` it is the one row that stays `isDisabled`, which
  is the Story 1 look for a row with no page; the tornillería note on `/marcas` explains it.
- **Active brand on `/marcas/<slug>`.** `activeBrand` must match the **taxonomy name** (`Clevaland` for
  `cleveland`) because the row list is the live taxonomy — the config display name would never match. Same trick
  `activeCategory` uses.
- **`Clevaland` display leak.** The header row label is the raw Strapi name (existing behaviour for every brand row);
  this story does not rename rows. The page itself never shows it.
- **`fetchAllProductsByBrand` with a category filter** is not needed — the category filter is in-memory.
- **`/marcas/[slug]` and `/marcas` sharing a folder.** `src/app/marcas/page.tsx` stays; `[slug]/` sits beside it,
  exactly like `categorias/`.

## Open Questions

### Strapi contract

- I: Question: Can `products_connection` be filtered by `brand.customId.eq`, and what are the six brands' sizes?
  - Status: answered (epic, backend-research subagent, 2026-09-17, backend repo + live)
  - Answer: Yes — `ProductFiltersInput.brand: BrandFiltersInput` with `customId: StringFilterInput`. Weston 90,
    King Tony 26, Bohrcraft 19, Bondhus 13, Precision 6, Cleveland 5 → every brand fits one 100-product page.
- II: Question: Does `GET_ALL_PRODUCTS_BY_CATEGORY`'s selection already carry what the category dropdown needs?
  - Status: answered (this repo: `src/shared/queries`, lines 166-192)
  - Answer: Yes — `category { name }` is selected; `DropdownCategories` supports `valueKey="name"`. No schema
    question remains, so no delegation was needed.
- III: Question: Should the Strapi brand name `Clevaland` be corrected?
  - Status: pending (backend judgment, carried over from Story 1; out of this repo's scope)
  - Context: This story makes the typo slightly more visible — the enabled header row labelled `Clevaland` now links
    to `/marcas/cleveland`, whose H1 says `Cleveland`.

### Catalog behavior

- I: Question: Keep `/?mode=brand&brand=<name>` URLs and sitemap entries as they are?
  - Status: answered (user, 2026-09-17)
  - Answer: Yes, untouched (D5). Six new sitemap entries are added beside them.
- II: Question: Which in-memory filters?
  - Status: answered (user, 2026-09-17)
  - Answer: Search + category dropdown; no subcategory dropdown (D4).
- III: Question: `libre` and unknown slugs → `notFound()`?
  - Status: answered (assumed from the epic; D8)
  - Answer: Yes. Confirm on sign-off if a redirect to `/categorias/tornilleria-fijacion` is preferred for `libre`.

### UI/product decisions

- I: Question: Comp or reuse the category page layout?
  - Status: answered (user, 2026-09-17)
  - Answer: Reuse `CategoryPage` layout, no comp (D1).
- II: Question: Bohrcraft missing from the SEO table — ship it?
  - Status: answered (user, 2026-09-17)
  - Answer: Yes; the user supplied its row (D2, table above).
- III: Question: Search placeholder / error copy need a title-case brand name (`Weston`, `Precision Brand`) while
  `BRAND_PAGES.name` is uppercase (`WESTON`) — add a `displayName` field, or derive it from the H1 (`text before
  ":"`)?
  - Status: pending (small; planner may default)
  - Explanation: Proposed default: a `displayName` string in `BRAND_SEO` next to `heading` — explicit beats parsing
    the H1. Six short strings.
- IV: Question: Hero intro copy?
  - Status: answered (user, 2026-09-17)
  - Answer: `identity` then `stock` from `BRAND_PAGES` (D3).
- V: Question: Promote the `/marcas` card to a whole-card link now?
  - Status: answered (user, 2026-09-17)
  - Answer: No; CTA stays the only link (D6).
- VI: Question: Error-boundary copy — `No pudimos cargar los productos de {Brand}` + secondary `Ver todas las
  marcas` → `/marcas`?
  - Status: pending (assumed; mirrors `CategoryPageError`)

### Theme/persistence

- I: Question: Any theme/cookie impact?
  - Status: answered
  - Answer: None; dark-mode classes only, no cookie reads or writes.

### Verification

- I: Question: Do `Header.test.tsx` / `BrandsPage.test.tsx` need restructuring, or just assertion flips?
  - Status: answered (this repo)
  - Answer: Assertion flips plus one fixture change — `Header.test.tsx` uses fixture brands `brand-1`/`brand-2`
    (not in `BRAND_PAGE_HREFS`), so today's "all brand rows disabled" test keeps passing by accident; the planner
    must add a fixture brand whose `customId` is a real key (e.g. `weston`) to prove the link path, and keep one
    unmapped brand for the `Marca Libre` case. `BrandsPage.test.tsx` line 49 inverts to "every CTA is a link".
