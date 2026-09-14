# Plan: Tornillería category page (`/categorias/tornilleria`)

**Source research:** `ai-research/tornilleria-category-page.story.md` (2026-09-14, branch `feat/add-tornilleria`).
**Sign-off status:** no explicit sign-off line, but every open question is `answered` (Strapi I–IV, Catalog I–III, UI I–VI, Theme I, Verification I) and D1–D8 are recorded as decided/assumed with the user on 2026-09-14. Treated as signed off — same basis as `ai-planning/categories-page.story.md`. **Confirm before `/implement`.**
**Plan date:** 2026-09-14.

## Assumptions

- **`Product.subcategory` is optional (`subcategory?: string | null`)**, not required `string | null` as the research wrote it. Only `GET_ALL_PRODUCTS_BY_CATEGORY` selects the field; every other query, every `Product` literal, and every existing test fixture would otherwise need a `subcategory: null` line for no behavioural gain. Matches the existing `minPrice?`/`variantCount?` convention.
- **Breadcrumb crumb `Tornillería` is a hardcoded constant** (`TORNILLERIA_CATEGORY_NAME`), not the live Strapi name. The route, H1, and metadata are already hardcoded (D2/D6); the only "live" source would be `products[0].category.name`, which is undefined on an empty set and would still need the literal as a fallback. The header's active-row match stays live (it already holds the taxonomy).
- **The route gets its own `error.tsx` and `loading.tsx`** (decided by the user, 2026-09-14). The research says failures propagate "to `src/app/error.tsx` like `/categorias` does", but a nested `/categorias/tornilleria` route is caught by the nearest boundary — `src/app/categorias/error.tsx` ("No pudimos cargar las categorías") and `src/app/categorias/loading.tsx` (category-card skeletons) — whose copy is wrong for a product page. Phase 2 adds `src/app/categorias/tornilleria/{error,loading}.tsx` with product copy.
- **SEO copy (user, 2026-09-14):** `TORNILLERIA_TITLE = "Tornillería y Fijación Industrial en Puebla | Tehesa"`, `TORNILLERIA_DESCRIPTION = "Tornillos, tuercas, rondanas, pernos y varillas roscadas para industria. Acero e inoxidable, con existencia en Puebla. Cotiza hoy."`. H1 stays `Tornillería y fijación industrial` (lowercase, per the comp).
- **Header dropdown rows with `href` are react-aria link items** (full-page navigation, menu closes on select) — the same mechanism and the same accepted trade-off as the existing `Ver todas las categorías` row (categories-page plan, assumption 1). Mobile rows are `next/link` (client-side) like `Productos`.
- **`Ver todas las categorías` stays visible on `/categorias/tornilleria`**; it is hidden only on `/categorias` itself. The `Categorías` trigger/accordion underline uses `pathname.startsWith("/categorias")`.
- **`DropdownCategories` is reused for subcategories unchanged**, including its `aria-label="Dropdown menu categories"` (research: acceptable). No `ariaLabel` prop is added.
- **The WhatsApp panel is lifted into one shared component** (`src/shared/ui/organisms/WhatsappPanel.tsx`) instead of duplicating 15 lines; research left this to the planner. It is hook-free so it renders inside both the server `CategoriesPage` and the client `CategoryPage`.
- Env: `.env.local` has `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. Dev-server checks assume `pnpm dev` on `http://localhost:3000` and today's live data (107 Tornillería products across 10 subcategories).

## Acceptance Criteria

1. **Route + data.** `GET /categorias/tornilleria` is server-rendered (`force-dynamic` inherited from the layout), fetches every published product with `category.customId == "tornilleria"` via a new `fetchAllProductsByCategory` server action that pages by `pageInfo` (never one oversized `pageSize`, Strapi contract III), selects the existing card fields **plus `subcategory`**, and renders them all in one grid with no pagination controls. A Strapi failure propagates to `src/app/error.tsx` like `/` and `/categorias` do. Zero products renders `ProductListing`'s existing `No hay productos disponibles.` state.
2. **Page structure.** Inside one `<main>`: `nav[aria-label="Ruta"]` (`Inicio` → `/`, `Categorías` → `/categorias`, `Tornillería` plain text with `aria-current="page"`), the hero (kicker `Categoría`, `<h1>Tornillería y fijación industrial</h1>`, intro paragraph verbatim from the comp), the WhatsApp panel (`Cotizar ahora` → `buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_HEADER_MESSAGE)`, hidden when `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset), and a `N productos` counter (`Intl.NumberFormat("es-MX")`, `1 producto` singular) that reflects the **filtered** count. Hero is 2-column (`minmax(0,1fr) 340px`) at `lg`, stacked below.
3. **Frontend filters.** A `SearchInput` (placeholder `Buscar tornillos, tuercas, pernos...`), a `Filtrar subcategorías` dropdown listing only the subcategory values **present in the loaded set** (labelled via the map in D3, ordered A→Z by label), and a `Filtrar marcas` dropdown listing only brands present in the set. Filters stack (AND) and run in memory over the full product array — no navigation, no fetch, no URL change. `Limpiar filtros` appears when any filter is active and resets all three. Zero matches renders `ProductListing`'s existing "No hay coincidencias" state whose `Buscar en todo el catálogo` action **is not rendered** on this page (no `CatalogSearchDrawer` here); `Limpiar filtros` remains.
4. **Card + drawer.** `ProductCard` renders the kicker as `{category.name} / {label(subcategory)}` when `product.subcategory` is non-null and the plain category name otherwise; `__tests__/product-listing` cards for `/` are unchanged. Clicking `Explorar las N variantes` opens `ProductVariantsDrawer` in its default mode; `Agregar 1 pieza` / `Agregar y elegir después` behave exactly as on `/`.
5. **Entry points + SEO + tests.** Header dropdown item and `MobileMenu` accordion row for `Tornillería` are real links to `/categorias/tornilleria` (dropdown/drawer closes on select); the `/categorias` `Ver categoría` CTA for Tornillería is a real `next/link`; every other category keeps the disabled treatment. On `/categorias/tornilleria` the `Categorías` trigger carries the active underline and the Tornillería row the active tint + `(actual)`. `generateMetadata` returns literal `TORNILLERIA_TITLE`/`TORNILLERIA_DESCRIPTION`, canonical `/categorias/tornilleria`, `index, follow`; `sitemap.ts` adds `/categorias/tornilleria` as a static base-page entry. `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass; new tests cover AC1 (paging loop, empty set), AC3 (stacked filters, dropdown options derived from data, clear), AC4 (kicker with/without subcategory), AC5 (links enabled only for Tornillería, metadata, sitemap).

## Affected files

**`src/app/**`**
- `src/app/categorias/tornilleria/page.tsx` — Create (Phase 2)
- `src/app/categorias/tornilleria/error.tsx`, `src/app/categorias/tornilleria/loading.tsx` — Create (Phase 2)
- `src/app/sitemap.ts` — Modify (Phase 3)

**`src/features/**`**
- `src/features/CategoryPage/CategoryPage.tsx` — Create (Phase 2)
- `src/features/CategoriesPage/CategoriesPage.tsx` — Modify: use `WhatsappPanel` (Phase 2)
- `src/features/CategoriesPage/CategoryCard.tsx` — Modify: CTA link (Phase 3)
- `src/features/ProductListing/SearchInput.tsx` — Modify: `placeholder` prop (Phase 2)
- `src/features/ProductListing/ProductListing.tsx` — Modify: gate the wide-search helper text (Phase 2)

**`src/components/**`**
- `src/components/ProductCard.tsx` — Modify: kicker (Phase 1)

**`src/shared/**`**
- `src/shared/constants/category.constants.ts` — Create (Phase 1)
- `src/shared/constants/catalog.constants.ts` — Modify: `ALL_PRODUCTS_PAGE_SIZE` (Phase 1)
- `src/shared/constants/seo.constants.ts` — Modify (Phase 2)
- `src/shared/queries/global.queries.ts` — Modify (Phase 1)
- `src/shared/lib/global.lib.ts` — Modify (Phase 1)
- `src/shared/types/global.types.ts` — Modify (Phase 1)
- `src/shared/ui/organisms/WhatsappPanel.tsx` — Create (Phase 2)
- `src/shared/ui/organisms/Header.tsx` — Modify (Phase 3)
- `src/shared/ui/organisms/MobileMenu.tsx` — Modify (Phase 3)

**Tests (`__tests__/**`)**
- `__tests__/shared/global.lib.test.ts`, `__tests__/product-listing/ProductCard.test.tsx` — Modify (Phase 1)
- `__tests__/category-page/CategoryPage.test.tsx`, `__tests__/seo/tornilleria-metadata.test.ts`, `__tests__/app/tornilleria-error.test.tsx` — Create (Phase 2)
- `__tests__/shared/Header.test.tsx`, `__tests__/categories/CategoriesPage.test.tsx`, `__tests__/seo/sitemap.test.ts` — Modify (Phase 3)

**Docs**
- `CLAUDE.md`, `ai-skills/REPO_CONTEXT.md` — Modify (Phase 3)

---

## Phase 1 — Data layer + card kicker

Everything below the route: types, constants, query, server action, and the `ProductCard` kicker. No new route yet.

### Changes Required

**`src/shared/types/global.types.ts`** — Modify, `Product` type
- Add `subcategory?: string | null` (optional — see Assumptions).
- Add response type:
  ```ts
  export interface FetchProductsConnectionResponse {
    products_connection: { pageInfo: { pageCount: number }; nodes: Product[] } | null
  }
  ```

**`src/shared/constants/category.constants.ts`** — Create
- `export const TORNILLERIA_CATEGORY_ID = "tornilleria"`
- `export const TORNILLERIA_CATEGORY_NAME = "Tornillería"`
- `export const CATEGORY_PAGE_HREFS: Record<string, string> = { [TORNILLERIA_CATEGORY_ID]: "/categorias/tornilleria" }` — the one lookup consulted by `Header`, `MobileMenu`, `CategoryCard`, and `sitemap.ts` (D4); the next category page is a one-line addition.
- `export const SUBCATEGORY_LABELS: Record<string, string>` — exactly D3: `nudo→Nudos, opresor→Opresores, perno→Pernos, pija→Pijas, remache→Remaches, rondana→Rondanas, taquete→Taquetes, tornillos→Tornillos, tuerca→Tuercas, varilla→Varilla roscada`.
- No helper function: both consumers use `SUBCATEGORY_LABELS[value] ?? value` inline (unknown enum value degrades to the raw slug, never hides the product).

**`src/shared/constants/catalog.constants.ts`** — Modify, near `VARIANT_PAGE_SIZE`
- `export const ALL_PRODUCTS_PAGE_SIZE = 100` (Strapi contract III; the test pins it).

**`src/shared/queries/global.queries.ts`** — Modify, append
- `GET_ALL_PRODUCTS_BY_CATEGORY`: `query GetAllProductsByCategory($filters: ProductFiltersInput, $pagination: PaginationArg) { products_connection(filters: $filters, pagination: $pagination) { pageInfo { pageCount } nodes { name minPrice maxPrice documentId variantCount hasOneProductVariant subcategory category { name } brand { name } } } }`.

**`src/shared/lib/global.lib.ts`** — Modify, after `fetchCategoryProductCounts`
- ```ts
  export const fetchAllProductsByCategory = async (
    customId: string,
    subcategory?: string,
  ): Promise<Product[]>
  ```
- Filters: `{ category: { customId: { eq: customId } }, ...(subcategory ? { subcategory: { eq: subcategory } } : {}) }` — the key is **absent** (not `undefined`) when not given (Strapi contract IV; this page never passes it).
- Loop: query page 1 with `pagination: { page: 1, pageSize: ALL_PRODUCTS_PAGE_SIZE }`, read `pageCount` (default `1` when `products_connection` is null), then sequentially query pages `2..pageCount` with the same filters, concatenating `nodes ?? []`. Sequential `for` loop, not `Promise.all` — 2 requests today.
- No local try/catch (adapter contract in the file's JSDoc); add the function name to that JSDoc list.

**`src/components/ProductCard.tsx`** — Modify, kicker `<span>` inside `product.category &&`
- Render `product.category.name` followed by `` ` / ${SUBCATEGORY_LABELS[product.subcategory] ?? product.subcategory}` `` only when `product.subcategory` is truthy. Import `SUBCATEGORY_LABELS`. Nothing else in the card changes.

**`__tests__/shared/global.lib.test.ts`** — Modify, new `describe("fetchAllProductsByCategory")`
- Pages by `pageCount`: mock page 1 `{ pageCount: 2, nodes: [a] }`, page 2 `{ pageCount: 2, nodes: [b] }`; expect two `query` calls with `pagination.page` 1 then 2, `pageSize === ALL_PRODUCTS_PAGE_SIZE`, `filters.category.customId.eq === "tornilleria"`, **no** `subcategory` key; result `[a, b]`.
- Passes `filters.subcategory.eq` when the second arg is given.
- `pageCount: 0` / empty nodes → `[]` after exactly one call; `products_connection: null` → `[]`.
- Rejects on Apollo failure (same shape as the `fetchProductsByCategory rejects` case).

**`__tests__/product-listing/ProductCard.test.tsx`** — Modify, add
- Kicker `Tornillería / Tornillos` for `{ category: { name: "Tornillería" }, subcategory: "tornillos" }`.
- Unknown value renders raw (`Tornillería / zzz`).
- Existing fixtures without `subcategory` still render the plain category name (assert on one existing case).

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm test -- __tests__/shared/global.lib.test.ts __tests__/product-listing/ProductCard.test.tsx`

**Dev-server validation**
- `GET /?page=1` → 200, page still renders 50 `<article` and **zero** `" / "` kicker separators (`curl -s localhost:3000/?page=1 | grep -c "Tornillería / "` → `0`, because `GET_PRODUCTS` does not select `subcategory`). No server-log errors.
- `fetchAllProductsByCategory` has no HTTP surface until Phase 2; its runtime check lives there.

**Manual** — none.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/shared/lib/global.lib.ts` `fetchAllProductsByCategory` | paging loop, filter shape with/without `subcategory`, empty set, rejection | `pnpm test -- __tests__/shared/global.lib.test.ts` |
| `src/components/ProductCard.tsx` | kicker with/without subcategory, unknown label fallback | `pnpm test -- __tests__/product-listing/ProductCard.test.tsx` + `curl /?page=1` |
| `src/shared/constants/category.constants.ts`, types | compile only | `pnpm exec tsc --noEmit` |

---

## Phase 2 — Route + `CategoryPage` feature

### Changes Required

**`src/shared/constants/seo.constants.ts`** — Modify, append `TORNILLERIA_TITLE`, `TORNILLERIA_DESCRIPTION` (literals in Assumptions).

**`src/shared/ui/organisms/WhatsappPanel.tsx`** — Create (no `"use client"`, no hooks)
- Lift the `<aside>` block from `CategoriesPage.tsx` verbatim (heading `Cotiza por WhatsApp`, copy, `Cotizar ahora` anchor with `target="_blank" rel="noopener noreferrer"`). Computes `whatsappUrl` from `WHATSAPP_NUMBER`/`WHATSAPP_HEADER_MESSAGE` and returns `null` when the number is unset.

**`src/features/CategoriesPage/CategoriesPage.tsx`** — Modify
- Replace the inline `<aside>` + `whatsappUrl` computation with `<WhatsappPanel />`. Markup and copy identical, so `__tests__/categories/CategoriesPage.test.tsx` (which mocks `whatsapp.constants`) keeps passing unchanged.

**`src/features/ProductListing/SearchInput.tsx`** — Modify
- Add `placeholder?: string` prop, default `"Buscar tornillos, tuercas, herramientas..."` (today's literal), pass to `<Input placeholder>`. `Home.tsx` / `CatalogDisabledFilters.tsx` untouched.

**`src/features/ProductListing/ProductListing.tsx`** — Modify, "No hay coincidencias" branch
- Move the `<p>La búsqueda incluirá productos fuera de la selección actual.</p>` inside the `onOpenCatalogSearch &&` block so a page without the wide-search action does not describe it (AC3). `Home.tsx` output unchanged.

**`src/features/CategoryPage/CategoryPage.tsx`** — Create, `"use client"`
- `export const CategoryPage = ({ products }: { products: Product[] })`
- State: `searchTerm: string`, `subcategory: string | null`, `brand: string | null`, `productDetails: Product | null`, `drawerState = useOverlayState()`.
- Derived on render (no `useMemo`, no `allProducts` ref — the prop never changes on this route, unlike `Home`):
  - `subcategoryOptions: TaxonomyItem[]` — unique non-null `product.subcategory` values → `{ customId: value, name: SUBCATEGORY_LABELS[value] ?? value }`, sorted `name.localeCompare(b.name, "es")` (D3/D8, Catalog III).
  - `brandOptions: TaxonomyItem[]` — unique non-null `product.brand.name` → `{ customId: name, name }`, sorted the same way.
  - `filtered = products.filter(...)`: name `includes(term.trim().toLowerCase())` AND `subcategory` equality AND `brand?.name` equality, each clause skipped when its filter is `null`/empty (same shape as `Home.applyLocalFilters`; a `null` subcategory or brand never matches an active filter).
  - `isFilterActive = term.trim().length > 0 || subcategory !== null || brand !== null`.
  - Counter: `filtered.length === 1 ? "1 producto" : `${new Intl.NumberFormat("es-MX").format(filtered.length)} productos``.
- Handlers: `handleSearch`, `handleSubcategorySelect`, `handleBrandSelect`, `clearFilters` (resets all three), `handleProductClick` (set `productDetails`, `drawerState.open()`).
- Render, in order (the route supplies the single `<main>`):
  1. `<nav aria-label="Ruta">` with three crumbs: `Link` `Inicio`→`/`, `Link` `Categorías`→`/categorias`, `<span aria-current="page">{TORNILLERIA_CATEGORY_NAME}</span>` — same `<ol>` markup as `CategoriesPage`.
  2. Hero `<section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">`: kicker `Categoría` (same classes as `CategoriesPage`'s `Catálogo` kicker), `<h1>Tornillería y fijación industrial</h1>`, intro `Tornillos, tuercas, rondanas, pernos y varillas roscadas para industria. Acero e inoxidable, con existencia en Puebla.`, then `<WhatsappPanel />`.
  3. Counter `<p className="text-sm text-muted">`.
  4. Filter row `<div className="mb-5 flex flex-col gap-3 lg:flex-row">`: `SearchInput` (`placeholder="Buscar tornillos, tuercas, pernos..."`), then `<div className="flex flex-col gap-3 sm:flex-row">` with `DropdownCategories` (`categories={subcategoryOptions}`, `defaultLabel="Filtrar subcategorías"`), `DropdownBrands` (`brands={brandOptions}`, `defaultLabel="Filtrar marcas"`), and `{isFilterActive && <Button onPress={clearFilters}>Limpiar filtros</Button>}` — mirrors `Home.tsx:283-303` minus the busy state.
  5. `<ProductListing products={filtered} handleProductClick isLocalFilterActive={isFilterActive} onClearLocalFilter={clearFilters} />` — **no** `onOpenCatalogSearch`.
  6. `{productDetails && <ProductVariantsDrawer product={productDetails} state={drawerState} />}` — default props = multi-select add-to-cart.
- No `useRouter`/`usePathname`/`useSearchParams`, no pagination, no `CatalogSearchDrawer`, no `useCatalogSearch`.

**`src/app/categorias/tornilleria/page.tsx`** — Create (server component, mirrors `src/app/categorias/page.tsx`)
- `export const generateMetadata = (): Metadata => ({ title: TORNILLERIA_TITLE, description: TORNILLERIA_DESCRIPTION, alternates: { canonical: "/categorias/tornilleria" }, robots: { index: true, follow: true } })`.
- `breadcrumbJsonLd`: `BreadcrumbList` with 3 `ListItem`s — `Inicio` (`SITE_URL`), `Categorías` (`${SITE_URL}/categorias`), `TORNILLERIA_CATEGORY_NAME` (`${SITE_URL}${CATEGORY_PAGE_HREFS[TORNILLERIA_CATEGORY_ID]}`).
- `export default async function TornilleriaRoute()`: `const products = await fetchAllProductsByCategory(TORNILLERIA_CATEGORY_ID)` — no try/catch (AC1: failure reaches the route's own `error.tsx` below). Render the JSON-LD `<script>` via `toJsonLdHtml` and `<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5"><CategoryPage products={products} /></main>`.

**`src/app/categorias/tornilleria/error.tsx`** — Create, `"use client"` (copy of `src/app/categorias/error.tsx`, same `<main>`/`<section role="alert">` markup)
- Copy: heading `No pudimos cargar los productos de Tornillería`, body `Ocurrió un problema al consultar los productos de esta categoría. Intenta nuevamente en unos segundos.`, buttons `Intentar de nuevo` (`reset`) and `Ver todas las categorías` (`window.location.assign("/categorias")`). Kicker line `No se pudo completar la carga` unchanged.

**`src/app/categorias/tornilleria/loading.tsx`** — Create (copy the shape of `src/app/categorias/loading.tsx`)
- Same `<main>` + breadcrumb/hero/counter `Skeleton`s as the categories loader, then a filter-row placeholder (three `Skeleton`s `h-10`, stacked below `lg`) and a product grid using `ProductListing`'s grid classes with 9 `ProductCardSkeleton`s (`@/components/ProductCardSkeleton`, already used by `src/app/loading.tsx`). `<p className="sr-only" role="status">Cargando productos...</p>`.

**`__tests__/app/tornilleria-error.test.tsx`** — Create (copy of `categorias-error.test.tsx`): heading `No pudimos cargar los productos de Tornillería`, `Intentar de nuevo` calls `reset` once.

**`__tests__/seo/tornilleria-metadata.test.ts`** — Create (`@jest-environment node`, copy of `categories-metadata.test.ts`): title/description constants, canonical `/categorias/tornilleria`, `{ index: true, follow: true }`.

**`__tests__/category-page/CategoryPage.test.tsx`** — Create (render via `@__tests__/test-utils`; getter-backed `whatsapp.constants` mock as in `CategoriesPage.test.tsx`; fixture of ~4 products across 2 subcategories, 2 brands, one `brand: null`, one `subcategory: null`)
- Breadcrumb: `navigation` named `Ruta`, links `Inicio`→`/` and `Categorías`→`/categorias`, `Tornillería` has `aria-current="page"`; `h1` `Tornillería y fijación industrial`.
- Counter shows `4 productos` initially; `1 producto` after a filter that leaves one.
- Subcategory dropdown (`button` named `Filtrar subcategorías`) lists only the values present, as labels, A→Z (assert `menuitem` names order — follow `Header.test.tsx`'s dropdown pattern, not `Home.test.tsx`'s skipped one); brand dropdown lists only present brands and skips `null`.
- Stacked filters: type in the `Filtrar resultados visibles` input + pick a subcategory + pick a brand → only the matching card remains and the counter follows; `Limpiar filtros` appears, restores all cards and disappears.
- Zero matches: "No hay coincidencias en estos productos" heading, **no** `Buscar en todo el catálogo` button, **no** "La búsqueda incluirá…" text, `Limpiar filtros` still present.
- `products={[]}` → `No hay productos disponibles.`
- WhatsApp panel: `Cotizar ahora` link with the built href; hidden when the number is unset.
- Card CTA `Explorar las N variantes` opens a `dialog` (drawer) — one assertion; the drawer's internals stay covered by `ProductVariantsDrawer.test.tsx`.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm test -- __tests__/category-page __tests__/seo/tornilleria-metadata.test.ts __tests__/app/tornilleria-error.test.tsx __tests__/categories/CategoriesPage.test.tsx __tests__/home/Home.test.tsx`

**Dev-server validation** (`H=localhost:3000`)
- `curl -s -o /dev/null -w "%{http_code}" $H/categorias/tornilleria` → `200`.
- `curl -s $H/categorias/tornilleria | grep -c "<article"` → `107`.
- `curl -s $H/categorias/tornilleria | grep -o "Tornillería / [^<]*" | sort | uniq -c` → 10 lines (Nudos, Opresores, Pernos, Pijas, Remaches, Rondanas, Taquetes, Tornillos, Tuercas, Varilla roscada), counts summing to 107.
- Same body contains: `aria-label="Ruta"`, `aria-current="page"`, `<h1` … `Tornillería y fijación industrial`, `Categoría<`, `107 productos`, `Cotiza por WhatsApp`, `Cotizar ahora`, `Buscar tornillos, tuercas, pernos...`, `Filtrar subcategorías`, `Filtrar marcas`, `application/ld+json` with `"BreadcrumbList"` and `"position":3`, `<link rel="canonical" href="…/categorias/tornilleria"`, `<title>` = `TORNILLERIA_TITLE`, robots meta `index, follow`.
- Same body does **not** contain: `Página anterior`, `Siguiente`, `Limpiar filtros` (idle), `Buscar en todo el catálogo`.
- `curl -s $H/categorias | grep -c "Cotizar ahora"` → `1` (panel extraction did not regress `/categorias`); `GET /?page=1` → 200 with the unchanged placeholder `Buscar tornillos, tuercas, herramientas...`.
- No server-log errors, no hydration warnings in the browser console on `/categorias/tornilleria`.

**Manual**
- Filters: type `tuerca`, pick a subcategory, pick a brand; grid and counter narrow together; `Limpiar filtros` resets; URL never changes and no network request fires (Network tab).
- Zero matches shows the "No hay coincidencias" card with only `Limpiar filtros`.
- `Explorar las N variantes` opens the drawer; `Agregar 1 pieza` / `Agregar y elegir después` add lines (cart count increments).
- Hero is 2-column at ≥1024px, stacked below; filter controls full-width below `sm`.
- Strapi failure: set an invalid `STRAPI_API_TOKEN`, restart `pnpm dev`, `GET /categorias/tornilleria` renders the route's own boundary (`No pudimos cargar los productos de Tornillería`, `Intentar de nuevo`, `Ver todas las categorías`) — not the categories copy. Throttle the network to see the product-grid skeleton + `Cargando productos...` status.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/app/categorias/tornilleria/page.tsx` | 200, full set, JSON-LD, metadata, no pagination | dev-server `curl` above + `tornilleria-metadata.test.ts` |
| `src/app/categorias/tornilleria/{error,loading}.tsx` | product copy, retry, skeleton | `tornilleria-error.test.tsx` + manual bad-token / throttled load |
| `src/features/CategoryPage/CategoryPage.tsx` | structure, counter, derived options, stacked filters, clear, empty states, panel gating, drawer open | `pnpm test -- __tests__/category-page` + manual click-through |
| `WhatsappPanel.tsx` / `CategoriesPage.tsx` | `/categorias` unchanged | `CategoriesPage.test.tsx` + `curl /categorias` |
| `SearchInput.tsx`, `ProductListing.tsx` | `/` unchanged | `Home.test.tsx` + `curl /?page=1` |

---

## Phase 3 — Entry points, sitemap, docs

### Changes Required

**`src/features/CategoriesPage/CategoryCard.tsx`** — Modify, CTA
- `const href = CATEGORY_PAGE_HREFS[category.customId]`. When defined, render `<Link href={href} className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-[#125D03] dark:text-[#4DF527]">Ver categoría <RiArrowRightLine … /></Link>`; otherwise the existing `<span aria-disabled="true">`. Never `href="#"`.

**`src/shared/ui/organisms/Header.tsx`** — Modify
- `TaxonomyDropdownProps` gains `hrefs?: Record<string, string>` (default `{}`). Per item: `const href = hrefs[item.customId]`; `Dropdown.Item` gets `href={href}` and `isDisabled={href === undefined}` (link items close the menu on select, like `ver-todas`). Active tint/`(actual)` branch unchanged.
- `Header`: 
  - `const isCategoriesIndex = pathname === "/categorias"`; `const isCategories = pathname.startsWith("/categorias")`.
  - Page-route active category: `const pageCategoryId = Object.keys(CATEGORY_PAGE_HREFS).find((id) => CATEGORY_PAGE_HREFS[id] === pathname)`; `activeCategory = searchParams mode=category value ?? categories.find((c) => c.customId === pageCategoryId)?.name ?? null`.
  - Categories dropdown: `hrefs={CATEGORY_PAGE_HREFS}`, `allHref={isCategoriesIndex ? undefined : "/categorias"}`, `isActiveRoute={isCategories}`. Brands dropdown: no `hrefs`.
  - `MobileMenu` receives `isCategories` (section, for the accordion highlight) and a new `categoriesAllHref={isCategoriesIndex ? undefined : "/categorias"}` instead of deriving it inside.

**`src/shared/ui/organisms/MobileMenu.tsx`** — Modify
- `TaxonomyAccordionSectionProps` gains `hrefs?: Record<string, string>`. Per row: when `hrefs[item.customId]` is defined render `<Link href onClick={onNavigate} aria-current={active ? "page" : undefined} className={…same block classes + active tint…}>`; otherwise the existing `<span aria-disabled="true">`.
- `MobileMenuProps`: replace the internal `allHref={isCategories ? undefined : "/categorias"}` with the new `categoriesAllHref?: string` prop; pass `hrefs={CATEGORY_PAGE_HREFS}` to the categories section only.

**`src/app/sitemap.ts`** — Modify, after the `/categorias` push
- `for (const href of Object.values(CATEGORY_PAGE_HREFS)) basePages.push({ url: `${SITE_URL}${href}` })` — static base entries, survive a taxonomy fetch failure (D7).

**`__tests__/shared/Header.test.tsx`** — Modify
- Fixture: `Tornillería` `customId` → `"tornilleria"` (so the lookup matches).
- Dropdown: `Tornillería` is a `menuitem` with `href="/categorias/tornilleria"` and not `aria-disabled`; the other category and all brand items stay disabled; selecting it closes the menu (`aria-expanded="false"`, same capture pattern as the `Ver todas las categorías` test).
- `usePathname` → `/categorias/tornilleria`: trigger `Categorías (actual)`, menuitem `Tornillería (actual)`, `Ver todas las categorías` row **present**.
- Side menu: `Tornillería` row is a `link` to `/categorias/tornilleria` that closes the drawer; other rows still `aria-disabled`; on `/categorias/tornilleria` the row has `aria-current="page"` and the accordion trigger reads `Categorías (actual)`.

**`__tests__/categories/CategoriesPage.test.tsx`** — Modify the first test: the Tornillería card's `Ver categoría` is a `link` with `href="/categorias/tornilleria"`; the other two remain `aria-disabled` non-anchors.

**`__tests__/seo/sitemap.test.ts`** — Modify: `basePageCount` adds `Object.keys(CATEGORY_PAGE_HREFS).length`; assert an entry ends with `/categorias/tornilleria` in both the full and the degraded case.

**`CLAUDE.md`** — Modify: add `src/app/categorias/tornilleria/page.tsx` to the Directory Layout table and `CategoryPage` to the features list/architecture block; one line in "SEO Surface" for the new literal metadata + sitemap entry; note `Product.subcategory` (Tornillería-only) under Conventions.
**`ai-skills/REPO_CONTEXT.md`** — Modify: route row for `categorias/tornilleria/page.tsx`, `features/CategoryPage/` row, `fetchAllProductsByCategory` in Data Flow (paging by `pageCount`, `pageSize: 100`, optional `subcategory` filter), `CATEGORY_PAGE_HREFS` in the `ui/organisms` Header row, sitemap note, and a gotcha: routes nested under `src/app/categorias/` are caught by `categorias/error.tsx` + `categorias/loading.tsx` unless they ship their own (the Tornillería route does).

### Success Criteria

**Automated**
- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm test` (full run — AC5)
- `pnpm build` (AC5; sitemap + new route compile under production)

**Dev-server validation** (`H=localhost:3000`)
- `curl -s $H/categorias | grep -c 'href="/categorias/tornilleria"'` → `1` (the card CTA; dropdown/drawer contents are not in SSR HTML) and `grep -c 'aria-disabled="true"'` → 15 CTAs (one per other category).
- `curl -s $H/categorias/tornilleria | grep -o "Categorías<span class=\"sr-only\"> (actual)"` → one match (desktop trigger; the mobile accordion trigger is inside the closed drawer); `curl -s $H/ | grep -c "(actual)"` → `0`.
- `curl -s $H/sitemap.xml | grep -c "/categorias/tornilleria"` → `1`.
- `GET /`, `/categorias`, `/cotizar`, `/categorias/tornilleria` → 200, no server-log errors.

**Manual**
- Desktop: open `Categorías`, `Tornillería` is a link that navigates to `/categorias/tornilleria` and closes the menu; other rows stay disabled; on the new route the trigger is underlined and the row tinted.
- Mobile (<768px): hamburger → `Categorías` accordion → `Tornillería` row navigates and closes the drawer; on the new route the accordion header and row are highlighted.
- `/categorias`: Tornillería card CTA navigates; other cards' CTA inert.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `Header.tsx` / `MobileMenu.tsx` | link vs disabled per `CATEGORY_PAGE_HREFS`, close on select, active state on the new route, brands untouched | `pnpm test -- __tests__/shared/Header.test.tsx` + manual |
| `CategoryCard.tsx` | link only for Tornillería | `CategoriesPage.test.tsx` + `curl /categorias` |
| `sitemap.ts` | static entry present, survives taxonomy failure | `sitemap.test.ts` + `curl /sitemap.xml` |
| Whole story | lint/types/build/tests green | `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 — Route + data (fetch-all by `pageInfo`, `subcategory` selected, no pagination, error propagation, empty state) | 1, 2 | `GET /categorias/tornilleria` 200; `grep -c "<article"` = 107; no `Página anterior`/`Siguiente`; kicker labels present | Not validated | Paging loop + empty set proved by `global.lib.test.ts`; error propagation to the route's own `error.tsx` is a manual bad-token check + `tornilleria-error.test.tsx` |
| AC2 — Page structure (breadcrumb, hero, panel, counter) | 2 | Body contains `aria-label="Ruta"`, `aria-current="page"`, `<h1>…Tornillería y fijación industrial`, `Categoría`, `Cotizar ahora`, `107 productos` | Not validated | Filtered/singular counter + 2-col layout are manual/`CategoryPage.test.tsx` |
| AC3 — Frontend filters | 2 | Body contains `Buscar tornillos, tuercas, pernos...`, `Filtrar subcategorías`, `Filtrar marcas`; idle body lacks `Limpiar filtros` and `Buscar en todo el catálogo` | Not validated | Stacking/clear/zero-match are interactions: `CategoryPage.test.tsx` + manual click-through |
| AC4 — Card + drawer | 1, 2 | `grep -o "Tornillería / [^<]*" \| sort \| uniq -c` shows 10 labels on `/categorias/tornilleria`; `grep -c "Tornillería / "` = 0 on `/?page=1` | Not validated | Drawer/add flows: `ProductCard.test.tsx`, `CategoryPage.test.tsx`, manual |
| AC5 — Entry points + SEO + tests | 2, 3 | `curl /categorias` has exactly one `href="/categorias/tornilleria"`; `/categorias/tornilleria` body has `Categorías…(actual)`; `/sitemap.xml` lists `/categorias/tornilleria`; `<title>`/canonical/robots on the route | Not validated | Dropdown/drawer link rows are not in SSR HTML → `Header.test.tsx` + manual; `pnpm lint/tsc/build/test` green |

## Cross-cutting concerns

- **Env:** `STRAPI_HOST`/`STRAPI_API_TOKEN` (data), `NEXT_PUBLIC_WHATSAPP_NUMBER` (panel hidden when unset — never throws), `NEXT_PUBLIC_SITE_URL` (canonical, JSON-LD, sitemap).
- **Server/client boundary:** the route is a server component; `CategoryPage` is `"use client"` because it owns state and imports `ProductVariantsDrawer` (which has no directive) and `ProductCard`. `WhatsappPanel` is hook-free so it works in both worlds. The client never imports `global.lib.ts`.
- **Nested route boundaries:** `/categorias/tornilleria` ships its own `error.tsx`/`loading.tsx` (otherwise `src/app/categorias/{error,loading}.tsx` would catch it with category copy); it inherits the layout's `force-dynamic`.
- **Strapi contract:** `products_connection` + explicit `pagination` on every page (omitting it returns 10 rows silently); `pageSize: 100` with a `pageCount` loop, never one oversized page; `subcategory` filter is a `StringFilterInput` `eq` and the key is omitted when unused.
- **Trust boundary:** breadcrumb JSON-LD goes through `toJsonLdHtml`; product/brand strings render as React text only.
- **Responsive:** class-only (`sm:`/`lg:`); no `useMediaQuery`.
- **No new dependencies; no `pnpm install`.**

## Open Questions / Out-of-scope

**Resolved at sign-off (user, 2026-09-14):** route-specific `error.tsx` + `loading.tsx` are in Phase 2; SEO title/description literals fixed (see Assumptions); H1 unchanged.

**Out of scope (per research):** generic `/categorias/[slug]`; subcategory UI in `CatalogSearchDrawer` or a route param for it (the GraphQL filter ships in `fetchAllProductsByCategory` only); `?sub=` URL state; enabling links for the other 15 categories; product images; per-subcategory SEO pages; `/?mode=category` changes; brand index.

**Out of scope (nearby, deliberately untouched):** `ProductListing`'s zero-match copy sentence "Podemos ampliar la búsqueda sin perder tus filtros." (still rendered on this page; only the button and its helper line are gated); `DropdownCategories` `aria-label` wording for subcategories; migrating `/` to `products_connection`; `React.cache` for the layout's duplicate taxonomy fetch; `Home.tsx`'s skipped stacked-filter test.
