# Tornillería category page (`/categorias/tornilleria`) — Research

**Date:** 2026-09-14
**Branch:** `feat/add-tornilleria`
**Scope:** standalone story (single deliverable, ~3 phases)
**Design source:** Claude Design project "Tehesa UI mocks v1"
(https://claude.ai/design/p/4b99241e-42ab-4ca4-ac4e-c1cd49a75385?file=pagina-tornilleria.dc.html):

- `pagina-tornilleria.dc.html` — the page of record. Its inline header is a stale copy (same caveat as the
  `/categorias` story, D5 there) — **ignore it**; the shared `Header` from the root layout is what renders. Its card
  has an `anterior`/`actual` toggle; `actual` is the card already shipped in `src/components/ProductCard.tsx`.
- `image-slot.js`, `support.js` — Claude Design runtime helpers, no design content.

Follows `ai-research/categories-page.story.md`, whose D1 deferred enabling the `Ver categoría` CTA "per
`/categorias/<slug>` story". This is the first such story.

## Story Definition

### Title

Add a dedicated `/categorias/tornilleria` page that lists every Tornillería product and lets the buyer narrow it by
subcategory (frontend filtering only), brand, and name; enable the Tornillería entry points in the header and on
`/categorias`.

### Description

Tornillería is the deepest category (107 of 333 published products) and the only one whose products carry a
`subcategory` enum (`tornillos`, `tuerca`, `pija`, …). Today it is reachable only as `/?mode=category&category=Tornillería`,
paged 50 at a time with no way to narrow by subcategory. This story adds:

- **Route `src/app/categorias/tornilleria/page.tsx`** — a server shell (literal `generateMetadata`, `BreadcrumbList`
  JSON-LD, one `<main>`) that fetches **all** Tornillería products (Strapi contract III) and renders a new
  `src/features/CategoryPage/` client feature.
- **Page** — breadcrumb `Inicio / Categorías / Tornillería`, hero (kicker `Categoría`, hardcoded H1 `Tornillería y
  fijación industrial` + intro paragraph, D2), the same dark "Cotiza por WhatsApp" panel as `/categorias`, a live
  `N productos` counter that follows the active filters, a filter row (local name `SearchInput`, `Filtrar
  subcategorías` dropdown, `Filtrar marcas` dropdown, `Limpiar filtros`), and the existing `ProductListing` grid +
  `ProductVariantsDrawer` (default multi-select mode, adds to the cart). **No pagination** — the whole set is in
  memory (D1).
- **Product card** — `Product` gains `subcategory: string | null`; when present, the card kicker reads
  `Tornillería / Tornillos` (label map, D3) instead of `Tornillería`. Every other route keeps rendering the plain
  category name because their products have `subcategory: null`.
- **Entry points** — the header `Categorías` dropdown item and mobile-accordion row for Tornillería, and the
  `/categorias` card CTA `Ver categoría` for Tornillería, become real links to `/categorias/tornilleria`. All other
  categories stay disabled (D4).

**Out of scope (explicitly):** a generic `/categorias/[slug]` route; a `subcategory` GraphQL filter or a subcategory
option in `CatalogSearchDrawer` ("wide search") — the user will enhance that drawer later; per-subcategory URLs or
`?sub=` query state; product images; changing `/?mode=category` behaviour; a brand index.

### Acceptance criteria

1. **Route + data.** `GET /categorias/tornilleria` is server-rendered (`force-dynamic` inherited from the layout),
   fetches every published product with `category.customId == "tornilleria"` via a new `fetchAllProductsByCategory`
   server action that pages by `pageInfo` (never one oversized `pageSize`, Strapi contract III), selects the existing
   card fields **plus `subcategory`**, and renders them all in one grid with no pagination controls. A Strapi failure
   propagates to `src/app/error.tsx` like `/` and `/categorias` do. Zero products renders `ProductListing`'s existing
   `No hay productos disponibles.` state.
2. **Page structure.** Inside one `<main>`: `nav[aria-label="Ruta"]` (`Inicio` → `/`, `Categorías` → `/categorias`,
   `Tornillería` plain text with `aria-current="page"`), the hero (kicker `Categoría`, `<h1>Tornillería y fijación
   industrial</h1>`, intro paragraph verbatim from the comp), the WhatsApp panel (`Cotizar ahora` →
   `buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_HEADER_MESSAGE)`, hidden when `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset),
   and a `N productos` counter (`Intl.NumberFormat("es-MX")`, `1 producto` singular) that reflects the **filtered**
   count. Hero is 2-column (`minmax(0,1fr) 340px`) at `lg`, stacked below.
3. **Frontend filters.** A `SearchInput` (placeholder `Buscar tornillos, tuercas, pernos...`), a `Filtrar subcategorías`
   dropdown listing only the subcategory values **present in the loaded set** (labelled via the map in D3, ordered
   A→Z by label), and a `Filtrar marcas` dropdown listing only brands present in the set. Filters stack (AND) and run
   in memory over the full product array — no navigation, no fetch, no URL change. `Limpiar filtros` appears when any
   filter is active and resets all three. Zero matches renders `ProductListing`'s existing "No hay coincidencias"
   state whose `Buscar en todo el catálogo` action **is not rendered** on this page (no `CatalogSearchDrawer` here);
   `Limpiar filtros` remains.
4. **Card + drawer.** `ProductCard` renders the kicker as `{category.name} / {label(subcategory)}` when
   `product.subcategory` is non-null and the plain category name otherwise; `__tests__/product-listing` cards for
   `/` are unchanged. Clicking `Explorar las N variantes` opens `ProductVariantsDrawer` in its default mode;
   `Agregar 1 pieza` / `Agregar y elegir después` behave exactly as on `/`.
5. **Entry points + SEO + tests.** Header dropdown item and `MobileMenu` accordion row for `Tornillería` are real
   links to `/categorias/tornilleria` (dropdown/drawer closes on select); the `/categorias` `Ver categoría` CTA for
   Tornillería is a real `next/link`; every other category keeps the disabled treatment. On `/categorias/tornilleria`
   the `Categorías` trigger carries the active underline and the Tornillería row the active tint + `(actual)`.
   `generateMetadata` returns literal `TORNILLERIA_TITLE`/`TORNILLERIA_DESCRIPTION`, canonical
   `/categorias/tornilleria`, `index, follow`; `sitemap.ts` adds `/categorias/tornilleria` as a static base-page entry.
   `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass; new tests cover AC1 (paging loop, empty
   set), AC3 (stacked filters, dropdown options derived from data, clear), AC4 (kicker with/without subcategory),
   AC5 (links enabled only for Tornillería, metadata, sitemap).

### Task breakdown (for the planner)

1. **Data** — `GET_ALL_PRODUCTS_BY_CATEGORY` (`products_connection` with `pageInfo { pageCount }` + nodes selecting
   `subcategory`), `fetchAllProductsByCategory(customId)` in `global.lib.ts`, `Product.subcategory`, the
   `SUBCATEGORY_LABELS` map + `TORNILLERIA_CATEGORY_ID = "tornilleria"` constant, `ProductCard` kicker.
2. **Route + feature** — `src/app/categorias/tornilleria/page.tsx` (server shell, metadata, JSON-LD) +
   `src/features/CategoryPage/CategoryPage.tsx` (`"use client"`: filter state, counter, `ProductListing`, drawer) —
   reuse `SearchInput`, `DropdownBrands`; a `DropdownSubcategories` can be the existing `DropdownCategories` fed
   `{ name: label, customId: value }` items, so no new dropdown component is needed.
3. **Entry points + SEO + docs** — `Header.tsx`/`MobileMenu.tsx` per-item `href` for Tornillería, `CategoryCard.tsx`
   CTA link, `seo.constants.ts`, `sitemap.ts`, `CLAUDE.md`/`REPO_CONTEXT.md` route inventory, tests.

## Design Agent Handoff

**No design-brief file is produced.** `pagina-tornilleria.dc.html` covers every surface; export PNGs into
`comps/tornilleria-page/` via `/check-design` (desktop 1440 + mobile 390, light + dark, one with the variants drawer
open). The design agent is not re-run for this story.

### User goal, and what this is not

A buyer who knows they need fasteners wants to land on one page, see everything Tehesa carries in Tornillería, and
narrow it to "tuercas" or "pijas" without paging. This is a **category listing with local filters**; it is not a search
surface across the catalog (no wide-search drawer), not a subcategory page (no `?sub=` URLs), and not a generic
category template.

### Surface index

| Surface | File | States | Story |
| --- | --- | --- | --- |
| Breadcrumb (3 crumbs) | `src/features/CategoryPage/CategoryPage.tsx` | single | this |
| Hero + WhatsApp panel | `CategoryPage.tsx` | number set / unset; 1-col < `lg`, 2-col ≥ `lg` | this (copy of `/categorias`) |
| `N productos` counter | `CategoryPage.tsx` | full set, filtered, 1 (singular), 0 | this |
| Filter row | `CategoryPage.tsx` | idle, one/many active (+`Limpiar filtros`), zero matches | this |
| Subcategory dropdown | reuse `DropdownCategories` | closed, open, selected | this |
| Product card kicker | `src/components/ProductCard.tsx` | with subcategory / without | this |
| Header dropdown + mobile row (Tornillería) | `Header.tsx`, `MobileMenu.tsx` | enabled link, active on this route | this |
| `/categorias` card CTA (Tornillería) | `CategoryCard.tsx` | enabled link; other cards still disabled | this |
| Variants drawer | `ProductVariantsDrawer.tsx` | unchanged | — |

### Rules that override design instinct

- Every filter is **local and in-memory**; nothing on this page navigates, fetches, or touches the URL. Do not wire
  the subcategory dropdown to `/?mode=…` or to `CatalogSearchDrawer`.
- Never render `href="#"`; a CTA with no target is the existing `<span aria-disabled="true">` pattern (the 15 other
  categories keep it).
- Subcategory labels come from the frontend map; never render the raw enum slug in visible text (fallback: raw
  string only if a value is missing from the map, so a future enum addition degrades to lowercase text rather than
  hiding the product).
- Prices and CTAs are the shared `ProductCard`; do not fork a card for this page.

### Implementation-facing constraints

**Responsive.** Class-only (`md:`/`lg:`); `useMediaQuery` is server-`false` and must not gate layout. Hero 2-col at
`lg` (same as `CategoriesPage`); filter row wraps (`flex-wrap`), each control full-width below `sm` like `Home.tsx`'s
`mb-5 flex flex-col gap-3 lg:flex-row` block. Grid is `ProductListing`'s existing one.

**Accessibility.** `<nav aria-label="Ruta">` with `aria-current="page"` on the last crumb. Dropdown menus need
`aria-label`s (`DropdownCategories` passes `"Dropdown menu categories"` — pass a subcategory-specific label if the
component grows an `ariaLabel` prop; otherwise acceptable). `Limpiar filtros` is a real `Button`. The counter is
plain text; live-region not required (filters are user-initiated and the grid re-renders in place). Header
`Dropdown.Item` strips `aria-current` (known gotcha) — active row = tint + sr-only `(actual)` exactly as the current
`activeName` branch does; `MobileMenu` rows are plain elements and keep real `aria-current`.

**Visual patterns.** Same tokens as `/categorias`: kicker `#23890C` / dark `#4DF527`, panel `#0F2001`, CTA
`#4DF527` fill + `#0D3401` text (`DESIGN.md:6-18`, primary scale). Filter buttons are HeroUI `variant="secondary"`
(already what `DropdownCategories`/`DropdownBrands` render). No `DESIGN.md` edit expected; run `pnpm design:lint`
only if one happens.

**Content.** Spanish, verbatim from the comp: kicker `Categoría`; H1 `Tornillería y fijación industrial`; intro
`Tornillos, tuercas, rondanas, pernos y varillas roscadas para industria. Acero e inoxidable, con existencia en
Puebla.`; panel `Cotiza por WhatsApp` / `Envía tu lista de medidas y cantidades; confirmamos existencia el mismo
día.` / `Cotizar ahora`; search placeholder `Buscar tornillos, tuercas, pernos...`; dropdown labels `Filtrar
subcategorías`, `Filtrar marcas`; counter `{N} productos` / `1 producto`. Breadcrumb crumb `Tornillería` is the live
Strapi name (not the H1). Currency through `formatNumberToCurrency` (already inside `ProductCard`); counts through
`Intl.NumberFormat("es-MX")`.

**Out of scope.** Generic slug route; subcategory in the wide-search drawer or the GraphQL filter; `?sub=` URL
state; enabling links for other categories; images; per-subcategory SEO pages; `/?mode=category` changes.

### Decision record

- **D1 — Fetch all, no pagination.** Decided (user, 2026-09-14): the page loads all ~107 products server-side and
  filters in memory. Rejected: 50/page + Anterior/Siguiente (a subcategory filter would show 0 on pages lacking it).
  `ponytail:` ceiling — if Tornillería grows past a few hundred products, move to a `subcategory` GraphQL filter.
- **D2 — Hero copy hardcoded.** Decided (user): H1 + intro are frontend literals (Strapi has no description field);
  breadcrumb/count stay live.
- **D3 — Hand-written label map.** Decided (user): `nudo→Nudos, opresor→Opresores, perno→Pernos, pija→Pijas,
  remache→Remaches, rondana→Rondanas, taquete→Taquetes, tornillos→Tornillos, tuerca→Tuercas, varilla→Varilla roscada`;
  unknown value → raw string. Rejected: capitalising the slug (singular/plural mismatch, no "Varilla roscada").
- **D4 — Enable entry points for Tornillería only.** Decided (user): header dropdown item, mobile accordion row, and
  `/categorias` card CTA link to `/categorias/tornilleria`; the other 15 stay disabled (categories-page D1 still
  applies to them). Implementation: a `CATEGORY_PAGE_HREFS: Record<customId, string>` (one entry) consulted by
  `Header`/`MobileMenu`/`CategoryCard`, so the next category page is a one-line addition.
- **D5 — Comp scope.** Decided (user): ship the local name search, the brand dropdown, and the subcategory-on-card
  kicker. Comp's `anterior` card design and image slot are not used (existing card + no media field).
- **D6 — Route is hardcoded `/categorias/tornilleria`.** Decided (user): no `[slug]` segment; the page imports
  `TORNILLERIA_CATEGORY_ID` and calls the generic-by-`customId` server action, so a later generic route reuses the
  data layer untouched.
- **D7 — `index, follow`, in the sitemap.** Assumed (same reasoning as `/categorias` D7): real content page, static
  sitemap entry so a taxonomy outage never drops it.
- **D8 — Dropdown options derived from data.** Assumed: subcategory and brand dropdowns list only values present in
  the fetched set (avoids dead options such as brands with no Tornillería products); the label map is the source of
  display text and order, not the options list.

## Technical Research

### Affected areas

| Area | Files | Change |
| --- | --- | --- |
| Query + action | `src/shared/queries/global.queries.ts`, `src/shared/lib/global.lib.ts` | `products_connection`-based fetch-all by `category.customId`, selects `subcategory`, pages via `pageInfo.pageCount` |
| Types + constants | `src/shared/types/global.types.ts`, `src/shared/constants/catalog.constants.ts` (or new `category.constants.ts`) | `Product.subcategory: string \| null`; `SUBCATEGORY_LABELS`; `TORNILLERIA_CATEGORY_ID`; `CATEGORY_PAGE_HREFS` |
| Route | `src/app/categorias/tornilleria/page.tsx` (new) | server shell, metadata, JSON-LD, `<main>` |
| Feature | `src/features/CategoryPage/CategoryPage.tsx` (new, `"use client"`) | hero, counter, filters, listing, drawer |
| Card | `src/components/ProductCard.tsx` | kicker with subcategory label |
| Entry points | `src/shared/ui/organisms/Header.tsx`, `MobileMenu.tsx`, `src/features/CategoriesPage/CategoryCard.tsx` | per-category `href` lookup |
| SEO | `src/shared/constants/seo.constants.ts`, `src/app/sitemap.ts` | title/description; base-page entry |
| Tests | `__tests__/categories/*`, `__tests__/shared/Header.test.tsx`, `__tests__/product-listing/*`, `__tests__/seo/{sitemap,…}.test.ts`, new `__tests__/category-page/*` | AC1–AC5 |
| Docs | `CLAUDE.md`, `ai-skills/REPO_CONTEXT.md` | route inventory, `subcategory` contract |

### Existing patterns to follow

- **Route shell:** `src/app/categorias/page.tsx` — literal `generateMetadata`, `BreadcrumbList` via `toJsonLdHtml`,
  one `<main>`, fetch failure propagates to `error.tsx`. Add a third crumb.
- **Fetch-all with paging:** none exists yet — `fetchCategoryProductCounts` is the only `products_connection`
  consumer (`pageInfo.total`). The new action should loop `page = 1..pageCount` with `pageSize: 100` (Strapi
  contract III) and concatenate `nodes`. `pagination` is mandatory (default 10, silent).
- **Local filter state:** `Home.tsx`'s `applyLocalFilters` (`allProducts.current` + `filteredProducts`, single
  `next` object as source of truth) and its `isLocalFilterActive` / `Limpiar filtros` branch. `CategoryPage` copies
  the shape with `subcategory` replacing `category`; it does **not** reuse `useCatalogSearch` (that hook owns the
  wide-search drawer, which this page lacks).
- **Dropdowns:** `DropdownCategories` (`valueKey`, `defaultLabel`, `isDisabled`) already fits subcategories when fed
  `TaxonomyItem`-shaped `{ name: label, customId: enumValue }`; `DropdownBrands` for brands.
- **Grid + empty states:** `ProductListing` (`isLocalFilterActive`, `onClearLocalFilter`; omit `onOpenCatalogSearch`
  so the "Buscar en todo el catálogo" button is not rendered).
- **Drawer:** `ProductVariantsDrawer` has no `"use client"` — the importer (`CategoryPage.tsx`) must be a client
  component. Default props = multi-select add-to-cart mode.
- **Env-gated WhatsApp panel:** lift the `<aside>` from `CategoriesPage.tsx` into a tiny shared piece or duplicate
  the ~15 lines — the planner's call; both pages must hide it when the number is unset.
- **Disabled-vs-link CTA:** `CategoryCard.tsx` `<span aria-disabled>` ↔ `next/link`; `Header.tsx` `Dropdown.Item`
  supports `href` (already used for `Ver todas las categorías`); `MobileMenu.tsx` rows are `<span aria-disabled>` ↔
  `Link onClick={state.close}` (same as its `Productos` link).
- **Active-route treatment:** `isCategories = pathname === "/categorias"` in both header files — extend to
  `pathname.startsWith("/categorias")` for the trigger underline; the Tornillería row's active tint reuses the
  existing `activeName` branch (feed it the category name when `pathname === "/categorias/tornilleria"`).

### Verification rules

`pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` (targeted: new `__tests__/category-page/*`,
`__tests__/shared/Header.test.tsx`, `__tests__/categories/CategoriesPage.test.tsx`, `__tests__/seo/sitemap.test.ts`,
`__tests__/product-listing/*`). Dev-server curl checks per phase: `curl -s localhost:3000/categorias/tornilleria |
grep -c "<article"` should be 107 (live count today); `grep -o "Tornillería / [A-Za-z ]*" | sort | uniq -c` should
show the 10 labels; `curl -s localhost:3000/sitemap.xml | grep tornilleria`. No `pnpm install`.

### Dependencies / integration points

No new dependencies. Env: `STRAPI_HOST`/`STRAPI_API_TOKEN` (data), `NEXT_PUBLIC_WHATSAPP_NUMBER` (panel),
`NEXT_PUBLIC_SITE_URL` (canonical/sitemap). Cart store is already mounted by `Providers` on every route, so the
drawer/card add-to-cart flows work without wiring.

### Edge cases and constraints

- **107 cards in one render** — ~107 `ProductCard`s each subscribing to the cart store; fine today. `ponytail:`
  ceiling noted in D1.
- **Draft & Publish:** connection queries return published only; the counter matches `/categorias`'s pill (107).
- **`subcategory` is nullable** in the schema even though all 107 Tornillería products have one today. The dropdown
  must tolerate `null` (product simply never matches a subcategory filter but still shows unfiltered); the kicker
  falls back to the plain category name.
- **Enum drift:** a new enum value in Strapi will appear in the dropdown with its raw slug until the label map is
  updated — acceptable degradation, do not hide it.
- **Brand `null`** exists on some products (`Product.brand: Brand | null`); the brand dropdown must skip nulls and a
  brand filter must exclude them (same as `Home.tsx`).
- **`pageSize` ceiling conflict:** REPO_CONTEXT records `products(pagination:{pageSize:1000})` returning only 100
  rows, while the subagent's `products_connection(pagination:{pageSize:200})` returned all 107 today. Do not depend
  on either — page by `pageCount` with `pageSize: 100` (Strapi contract III).
- **Sticky header:** no in-page anchors, nothing to offset.
- **Header active state on `/categorias/tornilleria`:** `Header.tsx` derives `activeCategory` from
  `searchParams` (`mode=category`); the new route has no search params, so the Tornillería row's active tint needs a
  `pathname`-based source too.

## Open Questions

### Strapi contract

- I: Question: What is `product.subcategory` — type, values, nullability?
  Status: answered
  Answer: `enumeration` with exactly 10 values — `nudo`, `opresor`, `perno`, `pija`, `remache`, `rondana`, `taquete`,
  `tornillos`, `tuerca`, `varilla` — not required, no default, nullable. GraphQL returns the raw lowercase string
  (`"subcategory": "tornillos"`), and `ProductFiltersInput.subcategory` is a `StringFilterInput` (`eq`/`ne` verified
  live).
  Context: `store-tehesa-api/src/api/product/content-types/product/schema.json`;
  `types/generated/contentTypes.d.ts:679-692`. Verified by the `backend-research` subagent, 2026-09-14.
- II: Question: How are Tornillería products distributed across subcategories, and do other categories use the field?
  Status: answered
  Answer: 107 published products (`category.customId = "tornilleria"`, `name = "Tornillería"`), all with a non-null
  value: tornillos 37, tuerca 26, pija 17, varilla 9, rondana 8, opresor 4, remache 2, perno 2, taquete 1, nudo 1.
  All 226 products in the other 15 categories have `subcategory: null` — the field is Tornillería-exclusive today.
  Context: `products_connection(filters:{category:{customId:{eq:"tornilleria"}}}, pagination:{pageSize:200})`, live
  2026-09-14.
- III: Question: How should the page fetch all ~107 products safely?
  Status: answered
  Answer: `products_connection(filters: { category: { customId: { eq: $id } } }, pagination: { page: $p, pageSize:
  100 }) { pageInfo { pageCount } nodes { …card fields, subcategory } }`, looping `page` until `pageCount`. Use
  `customId` (stable slug) rather than the `name contains` filter `fetchProductsByCategory` uses.
  Context: page-based `pageSize` was observed capped at 100 on 2026-09-14 (REPO_CONTEXT, categories-page Strapi III),
  though `pageSize: 200` returned 107 rows in the subagent's session — the cap is unconfirmed, hence paging.
- IV: Question: Should the frontend also add a `subcategory` GraphQL filter for the wide-search drawer?
  Status: pending
  Context: deferred by the user ("enhance the wide search drawer later"). `StringFilterInput` `eq` works, so it is a
  straightforward follow-up story.

### Catalog behavior

- I: Question: Frontend-only filtering over the full set, or paged 50 with local narrowing?
  Status: answered
  Answer: full set, in memory, no pagination (D1).
- II: Question: Should subcategory/brand dropdowns list the full enum / full brand taxonomy or only values present?
  Status: answered
  Answer: only values present in the loaded set (D8, assumed — flag if you prefer the full enum).
- III: Question: Dropdown ordering?
  Status: answered
  Answer: A→Z by display label (`localeCompare("es")`), assumed; the comp shows no order.

### UI/product decisions

- I: Question: Route shape?
  Status: answered
  Answer: hardcoded `/categorias/tornilleria` (D6).
- II: Question: Hero copy source?
  Status: answered
  Answer: hardcoded comp copy (D2).
- III: Question: Subcategory display labels?
  Status: answered
  Answer: hand-written map (D3).
- IV: Question: Which comp elements ship?
  Status: answered
  Answer: search input, brand dropdown, subcategory on card (D5).
- V: Question: Enable the header/`/categorias` links for Tornillería?
  Status: answered
  Answer: yes, Tornillería only (D4).
- VI: Question: Should the `N productos` counter show the filtered count or the total?
  Status: answered
  Answer: filtered count (assumed — the comp's `productCountLabel` is `list.length` after its query filter).

### Theme/persistence

- I: Question: none — existing `dark:` variants; no theme or cookie changes.
  Status: answered
  Answer: n/a.

### Verification

- I: Question: Do the new page tests need a router mock?
  Status: answered
  Answer: `CategoryPage` uses no `useRouter`/`usePathname` itself; `ProductVariantsDrawer`/`ProductCard` already
  render under `__tests__/test-utils.tsx`'s `Providers`. Only `Header.test.tsx` (existing `usePathname` mock) needs a
  `/categorias/tornilleria` pathname case. Mock the server action at the route-test boundary as
  `__tests__/categories/CategoriesPage.test.tsx` does for `fetchCategories`.
