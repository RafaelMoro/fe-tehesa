# Plan: Brand Pages (`/marcas/[slug]`) (Story 2 of `brands-browsing`)

**Source research:** `ai-research/brands-browsing/brand-page.story-2.md` (2026-09-17, branch `feat/add-specific-brand-page`).
**Sign-off status:** no explicit sign-off line, but every open question is answered by the user on 2026-09-17 (Strapi I–III, Catalog I–III, UI I–VI, Theme I, Verification I) and D1–D9 are recorded as decided/assumed. Same basis as `ai-planning/brands-browsing/brands-index-page.story-1.md`. **Confirm before `/implement`** — in particular Catalog III (`/marcas/libre` → 404, not a redirect).
**Plan date:** 2026-09-17.

## Assumptions

- **Slugs = Strapi `customId`s** (verified live in the epic), so `BRAND_PAGE_HREFS[id] = "/marcas/" + id` for the six keys of `BRAND_PAGES`. `libre` deliberately has no entry.
- **Every brand fits one `ALL_PRODUCTS_PAGE_SIZE` (100) page today** (Weston 90). The adapter still loops `pageCount` pages, like `fetchAllProductsByCategory`, so nothing changes if a brand grows.
- **Display name derives from the H1** (UI III): text before the first `:` of `BRAND_SEO[id].heading`, whole heading if no `:`. One helper, no `displayName` field.
- **Header relabel (D9) is done once in `Header.tsx`**, by mapping `brands` into `brandItems` (display name when `BRAND_SEO[customId]` exists, Strapi name otherwise) before passing them to both `TaxonomyDropdown` and `MobileMenu`. `TaxonomyDropdown`/`TaxonomyAccordionSection`/`MobileMenu` need no code change beyond receiving `hrefs`.
- **Active brand row matches by `customId`** everywhere: `?mode=brand&brand=<StrapiName>` resolves the Strapi name → `customId` via the live `brands` list, `/marcas/<slug>` resolves `customId` from `BRAND_PAGE_HREFS`, and the active label is then read from the relabelled `brandItems`. Both URL styles highlight the right row after relabelling.
- **Error body is `CategoryPageError` parameterised** (`name` + `body` + `backHref` + `backLabel`), not a new `BrandPageError.tsx` — same markup, two call sites. The loading skeleton is `CategoryPageSkeleton` re-exported as-is (layout-only).
- **The generic query is renamed `GET_ALL_PRODUCTS`** (research task 1 offers this): its `$filters: ProductFiltersInput` already takes any filter and selects `category { name }`, which is all the category dropdown needs. A private `fetchAllProducts(filters)` in `global.lib.ts` holds the page loop; the two public adapters become thin wrappers.
- **Test placement follows the repo's existing folders** (`__tests__/brand-page/`, `__tests__/seo/`, `__tests__/app/`, `__tests__/shared/`, `__tests__/brands/`).
- Env: `.env.local` has `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. Dev-server checks assume `pnpm dev` on `http://localhost:3000` and the live taxonomy of 7 published brands.

## Acceptance Criteria

1. **Route + data.** `GET /marcas/<slug>` for each of the six slugs (`weston`, `king-tony`, `bohrcraft`, `bondhus`, `precision`, `cleveland`) server-renders the brand's complete published product set (all pages of `products_connection`, `pageSize` 100, no pagination UI), fetched with `filters: { brand: { customId: { eq } } }`. Any other slug — `libre`, `Clevaland`, unknown — returns the app 404 via `notFound()`. A Strapi rejection reaches the route's own `error.tsx`, which names the brand and offers `Intentar de nuevo` / `Ver todas las marcas` (→ `/marcas`).
2. **Page structure.** Inside one `<main>`: breadcrumb `nav[aria-label="Ruta"]` (`Inicio` → `/`, `Marcas` → `/marcas`, brand name with `aria-current="page"`); hero with kicker `Marca`, `<h1>` = `BRAND_SEO[id].heading`, `identity` paragraph, `stock` paragraph; `WhatsappPanel` beside the hero (≥ `lg`), hidden CTA when `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset; count line `1 producto` / `N productos` (`Intl.NumberFormat("es-MX")`) for the **filtered** set; product grid; `ProductVariantsDrawer` opens from a card click in default mode. No catalog search drawer entry point (`onOpenCatalogSearch` not passed), same as `CategoryPage`.
3. **In-memory filters.** `SearchInput` (placeholder `Buscar en {Name}...`) filters by product name (case-insensitive substring); a `DropdownCategories` instance keyed on `category.name` (`valueKey="name"`, options = unique category names present in the loaded set, A→Z `localeCompare("es")`, label `Filtrar categorías`) is rendered only when the set has ≥ 2 distinct categories; both AND together; `Limpiar filtros` appears when any filter is active and resets both; no navigation, fetch, or URL change. `ProductListing`'s local-filter empty state (`isLocalFilterActive` + `onClearLocalFilter`) is reused unchanged.
4. **Story 1 gates flip on.** With `BRAND_PAGE_HREFS` populated: every `/marcas` card renders `Ver productos` as a `next/link` to `/marcas/<slug>` (no `BrandCard` code change); the header `Marcas` dropdown/accordion rows become real links to the same hrefs (`Marca Libre` — not in the map — stays `isDisabled`); on `/marcas/<slug>` the row for that brand carries the active treatment (`" (actual)"` suffix in the dropdown, `aria-current` in the mobile accordion) and the `Marcas` trigger keeps its Story 1 active underline. Mapped rows are labelled with the H1-derived display name (`Cleveland`, `Precision Brand`), unmapped rows keep the Strapi name (D9). The card stays an `<article>` with the CTA as its only link (D6 upheld).
5. **SEO.** `generateMetadata` returns the per-brand `title` / `description` from `BRAND_SEO`, canonical `/marcas/<slug>`, `robots: { index: true, follow: true }`; unknown slug → `notFound()` from `generateMetadata` too. A 3-item `BreadcrumbList` JSON-LD (`Inicio`, `Marcas`, brand) via `toJsonLdHtml`. `sitemap.ts` lists the six `/marcas/<slug>` URLs as base pages (survive a taxonomy outage), leaving the seven `?mode=brand` entries as they are.
6. **Tests.** `BrandPage` feature (render, search, category dropdown presence/absence, AND filtering, clear, drawer), route `generateMetadata` (six slugs + unknown → `notFound`), `fetchAllProductsByBrand` (filters shape, multi-page concatenation), `Header` brand rows as links + active row, `BrandsPage` CTA now a link, sitemap count. Follow `docs/UNIT_TESTING_GUIDELINES.md`.

## Affected Files

**`src/app/`**
- `marcas/[slug]/page.tsx` — Create: `generateMetadata`, slug → id, `fetchAllProductsByBrand`, `BreadcrumbList` JSON-LD, one `<main>` around `BrandPage`.
- `marcas/[slug]/error.tsx` — Create: `"use client"`, `useParams()`, wraps `CategoryPageError` with brand copy.
- `marcas/[slug]/loading.tsx` — Create: re-export `CategoryPageSkeleton`.
- `sitemap.ts` — Modify: six `/marcas/<slug>` base-page entries.

**`src/features/`**
- `BrandPage/BrandPage.tsx` — Create: `"use client"`, `CategoryPage` shell with search + category filter.
- `CategoryPage/CategoryPageError.tsx` — Modify: generalise props (`name`, `body`, `backHref`, `backLabel`).

**`src/shared/`**
- `constants/brand.constants.ts` — Modify: fill `BRAND_PAGE_HREFS`, add `getBrandIdBySlug`, `getBrandDisplayName`.
- `constants/seo.constants.ts` — Modify: `BrandSeo` type + `BRAND_SEO` map (six entries).
- `queries/global.queries.ts` — Modify: rename `GET_ALL_PRODUCTS_BY_CATEGORY` → `GET_ALL_PRODUCTS` (operation name `GetAllProducts`).
- `lib/global.lib.ts` — Modify: private `fetchAllProducts(filters)`, `fetchAllProductsByBrand`, JSDoc contract list.
- `ui/organisms/Header.tsx` — Modify: `brandItems` relabel, `activeBrandId`, `hrefs={BRAND_PAGE_HREFS}`.
- `ui/organisms/MobileMenu.tsx` — Modify: `hrefs={BRAND_PAGE_HREFS}` on the `Marcas` section.

**`src/app/categorias/[slug]/error.tsx`** — Modify: pass the renamed/new `CategoryPageError` props.

**`__tests__/`**
- `brand-page/BrandPage.test.tsx` — Create (AC2, AC3).
- `seo/brand-slug-metadata.test.ts` — Create (AC5).
- `app/brand-slug-error.test.tsx` — Create (AC1).
- `shared/global.lib.test.ts` — Modify: `fetchAllProductsByBrand` cases, `GET_ALL_PRODUCTS` import (AC1).
- `shared/Header.test.tsx` — Modify: brand fixture + link/active/relabel assertions (AC4).
- `brands/BrandsPage.test.tsx` — Modify: CTA is a link (AC4).
- `seo/sitemap.test.ts` — Modify: `basePageCount` + `BRAND_PAGE_HREFS` (AC5).

**Docs**
- `ai-skills/REPO_CONTEXT.md`, `CLAUDE.md`, `ai-research/epics/brands-browsing.epic.md` — Modify (Phase 3).

---

## Phase 1 — Data + constants

Pure data/config layer; nothing new is reachable at runtime yet except the `/marcas` card CTAs, which flip on the moment `BRAND_PAGE_HREFS` is filled (their target 404s until Phase 2 — expected, both phases ship in one PR).

### Changes Required

**`src/shared/constants/seo.constants.ts`** — Modify, after `CATEGORY_SEO`:

```ts
export type BrandSeo = CategorySeo & { heading: string }
export const BRAND_SEO: Record<string, BrandSeo> = { weston: {...}, "king-tony": {...}, bohrcraft: {...}, bondhus: {...}, precision: {...}, cleveland: {...} }
```

Copy the six `title` / `description` / `heading` rows verbatim from the research doc's "Per-brand SEO copy" table.

**`src/shared/constants/brand.constants.ts`** — Modify:

- `BRAND_PAGE_HREFS`: replace `{}` with the six entries `weston: "/marcas/weston"`, … `cleveland: "/marcas/cleveland"`. Drop the `// Story 2 fills this` comment.
- `getBrandIdBySlug(slug: string): string | undefined` — twin of `getCategoryIdBySlug` over `BRAND_PAGE_HREFS` / `/marcas/${slug}`.
- `getBrandDisplayName(customId: string): string | undefined` — `BRAND_SEO[customId]?.heading.split(":")[0].trim()`. Import `BRAND_SEO` from `./seo.constants` (no cycle: `seo.constants.ts` has no imports).

**`src/shared/queries/global.queries.ts`** — Modify: rename `GET_ALL_PRODUCTS_BY_CATEGORY` → `GET_ALL_PRODUCTS`, operation `GetAllProducts`. Selection set unchanged.

**`src/shared/lib/global.lib.ts`** — Modify:

- Import rename.
- Extract the existing page-1 + `pageCount` loop out of `fetchAllProductsByCategory` into a module-private `const fetchAllProducts = async (filters: Record<string, unknown>): Promise<Product[]>` (same body, `GET_ALL_PRODUCTS`, `ALL_PRODUCTS_PAGE_SIZE`).
- `fetchAllProductsByCategory(customId, subcategory?)` keeps its signature and builds the same `filters` object, then `return fetchAllProducts(filters)`.
- `export const fetchAllProductsByBrand = async (customId: string): Promise<Product[]> => fetchAllProducts({ brand: { customId: { eq: customId } } })`.
- JSDoc contract list at the top: add `fetchAllProductsByBrand`. Keep the `// ponytail:` no-try/catch note on the private helper.

**`__tests__/shared/global.lib.test.ts`** — Modify:

- Import `GET_ALL_PRODUCTS` instead of `GET_ALL_PRODUCTS_BY_CATEGORY` (existing assertions at ~line 367 keep passing).
- New `describe("fetchAllProductsByBrand")` cloning the category block: (a) `pageCount: 2` → concatenates both pages, `queryMock` called twice, second call `pagination: { page: 2, pageSize: 100 }`; (b) `filters` equals `{ brand: { customId: { eq: "weston" } } }` and no `category` key; (c) missing `products_connection` → `[]`; (d) rejected query propagates.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm test -- __tests__/shared/global.lib.test.ts`
- `pnpm test -- __tests__/brands/BrandsPage.test.tsx` — **expected to fail** on "renders every Ver productos CTA disabled" until Phase 3 flips it; note it and move on (or flip it here if the implementer prefers — it is a Phase 3 item only for grouping).

**Dev-server validation**
- `curl -s localhost:3000/marcas | grep -o 'href="/marcas/[a-z-]*"' | sort -u` → exactly the six `/marcas/<slug>` hrefs (card CTAs now links; AC4 first half).
- `curl -s -o /dev/null -w '%{http_code}' localhost:3000/marcas/weston` → `404` at this point (route lands in Phase 2) — confirms no accidental catch-all.
- No server-log errors on `/marcas`.

**Manual** — none.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/shared/lib/global.lib.ts` | brand filter shape, multi-page concat, empty response, rejection propagates; category adapter unchanged | `pnpm test -- __tests__/shared/global.lib.test.ts` |
| `src/shared/constants/brand.constants.ts` | six hrefs, slug inversion, display-name derivation | `tsc` here; exercised by Phase 2 metadata/error tests and Phase 3 Header tests |
| `src/shared/constants/seo.constants.ts` | six `BRAND_SEO` rows verbatim | Phase 2 `brand-slug-metadata.test.ts` |

---

## Phase 2 — Route + feature

### Changes Required

**`src/features/CategoryPage/CategoryPageError.tsx`** — Modify: props become
`{ name: string; body: string; backHref: string; backLabel: string; reset: () => void }`. `<h2>` stays `No pudimos cargar los productos de {name}`; the muted `<p>` renders `{body}`; the secondary button `onPress={() => window.location.assign(backHref)}` with `{backLabel}` text. Everything else unchanged.

**`src/app/categorias/[slug]/error.tsx`** — Modify: pass `name={…}`, `body="Ocurrió un problema al consultar los productos de esta categoría. Intenta nuevamente en unos segundos."`, `backHref="/categorias"`, `backLabel="Ver todas las categorías"` (byte-identical output to today).

**`src/features/BrandPage/BrandPage.tsx`** — Create, `"use client"`. Clone `CategoryPage.tsx`, then:

- Props: `{ products: Product[]; displayName: string; heading: string; config: BrandPageConfig }` (`config` = `BRAND_PAGES[id]` for `identity`/`stock`).
- State: `searchTerm`, `category: string | null`, `productDetails`, `drawerState` — no `subcategory`/`brand`.
- `categoryOptions: TaxonomyItem[]` = unique `product.category?.name` (drop null) → `{ customId: name, name }` → `localeCompare(..., "es")`. Delete `buildOptions`/`SUBCATEGORY_LABELS`.
- `filtered` = name substring AND (`category === null || product.category?.name === category`). `isFilterActive`, `counter`, `clearFilters`, `handleProductClick` as in `CategoryPage`.
- Markup diffs vs `CategoryPage`: breadcrumb `Inicio` / `Marcas` (`/marcas`) / `{displayName}` with `aria-current="page"`; kicker `Marca`; `<h1>{heading}</h1>`; two intro `<p className="mt-3 text-muted">` for `config.identity` then `config.stock`; `SearchInput placeholder={`Buscar en ${displayName}...`}`; filter row renders `<DropdownCategories valueKey="name" selectedCategory={category} updateSelectedCategory={setCategory} categories={categoryOptions} defaultLabel="Filtrar categorías" />` **only when `categoryOptions.length >= 2`**; no `DropdownBrands`; `Limpiar filtros` when `isFilterActive`; `ProductListing` + `ProductVariantsDrawer` identical.
- Edge: `category: null` products are listed and match when no category filter is set; they never appear as an option.

**`src/app/marcas/[slug]/page.tsx`** — Create. Line-for-line clone of `src/app/categorias/[slug]/page.tsx`:

- `getBrandIdBySlug` → `notFound()` in both `generateMetadata` and the route.
- `generateMetadata`: `BRAND_SEO[id]` `title`/`description`, `alternates.canonical: /marcas/${slug}`, `robots: { index: true, follow: true }`.
- Route: `const products = await fetchAllProductsByBrand(id)`; `const displayName = getBrandDisplayName(id)!` (id is a `BRAND_SEO` key by construction — or fall back to `BRAND_PAGES[id].name`, implementer's call; no branch worth testing).
- JSON-LD: `Inicio` → `SITE_URL`, `Marcas` → `${SITE_URL}/marcas`, `displayName` → `${SITE_URL}${BRAND_PAGE_HREFS[id]}`.
- Same single `<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5">` wrapping `<BrandPage products displayName heading={BRAND_SEO[id].heading} config={BRAND_PAGES[id]} />`.

**`src/app/marcas/[slug]/error.tsx`** — Create, `"use client"`: `useParams<{ slug }>()`, `id = getBrandIdBySlug(slug)`, render `CategoryPageError` with `name={id ? getBrandDisplayName(id)! : "esta marca"}`, `body="Ocurrió un problema al consultar los productos de esta marca. Intenta nuevamente en unos segundos."`, `backHref="/marcas"`, `backLabel="Ver todas las marcas"`, `reset`.

**`src/app/marcas/[slug]/loading.tsx`** — Create: `export { CategoryPageSkeleton as default } from "@/features/CategoryPage/CategoryPageSkeleton"`.

**`__tests__/brand-page/BrandPage.test.tsx`** — Create, clone of `category-page/CategoryPage.test.tsx` (same `whatsapp.constants` getter mock). Fixture: 3 products across 2 categories (`Brocas`, `Machuelos`) + 1 with `category: null`, all `brand: { name: "Weston" }`. Cases:
- breadcrumb (`Inicio` → `/`, `Marcas` → `/marcas`, `Weston` with `aria-current="page"`), kicker `Marca`, `<h1>` = heading, `identity` and `stock` paragraphs.
- counter `4 productos` → `1 producto` after a search.
- dropdown label `Filtrar categorías`, options exactly `Brocas`, `Machuelos` A→Z (null skipped).
- search + category AND; `Limpiar filtros` resets both and disappears.
- dropdown **absent** when every product shares one category (and when all are `null`).
- no-match state shown without the wide-search action.
- WhatsApp panel present / hidden when the number is unset.
- variants drawer opens from a card CTA.

**`__tests__/seo/brand-slug-metadata.test.ts`** — Create, clone of `seo/category-slug-metadata.test.ts` (`@jest-environment node`, `notFound` throws): `it.each` six slugs → exact `title`/`description`, canonical `/marcas/<slug>`, `robots { index: true, follow: true }`; `libre`, `Clevaland`, `nope` → throws `NEXT_NOT_FOUND`.

**`__tests__/app/brand-slug-error.test.tsx`** — Create, clone of `app/category-slug-error.test.tsx`: six slugs → `<h2>` `No pudimos cargar los productos de {displayName}` (`Weston`, `King Tony`, `Bohrcraft`, `Bondhus`, `Precision Brand`, `Cleveland`); unknown slug → `esta marca`; `Intentar de nuevo` calls `reset`; `Ver todas las marcas` present; `role="alert"`.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test -- __tests__/brand-page __tests__/seo/brand-slug-metadata.test.ts __tests__/app/brand-slug-error.test.tsx __tests__/app/category-slug-error.test.tsx __tests__/category-page`
- `pnpm build`

**Dev-server validation**
- `GET /marcas/weston` → 200; contains `<h1 class="…">Weston: la marca mexicana para la industria</h1>`, `>Marca<` kicker, `aria-label="Ruta"`, `aria-current="page">Weston`, `Filtrar categorías`, `Buscar en Weston...`, `90 productos`, the `BRAND_PAGES.weston.identity` and `.stock` text, `<title>Weston en Puebla — Herramienta Industrial Mexicana | Tehesa</title>`, `rel="canonical" href="…/marcas/weston"`, `"@type":"BreadcrumbList"` with three `ListItem`s and `"name":"Marcas"`, WhatsApp `wa.me` link. Must **not** contain `Filtrar marcas`, `Filtrar subcategorías`, `Buscar en todo el catálogo`.
- `GET /marcas/cleveland` → 200; `Cleveland: 150 años de herramienta de corte`, `5 productos`, **no** `Filtrar categorías`; `<h1>` never contains `Clevaland`.
- `GET /marcas/precision` → 200; `6 productos`, no `Filtrar categorías`, `Buscar en Precision Brand...`.
- `GET /marcas/king-tony`, `/marcas/bohrcraft`, `/marcas/bondhus` → 200, `26` / `19` / `13 productos`, `Filtrar categorías` present.
- `GET /marcas/libre`, `/marcas/Clevaland`, `/marcas/nope` → 404 with the app not-found body.
- `GET /marcas` → 200 still (root boundary untouched); `GET /categorias/tornilleria-fijacion` → 200 unchanged.
- With `NEXT_PUBLIC_WHATSAPP_NUMBER` unset: `/marcas/weston` 200, no `wa.me` link.
- With `STRAPI_HOST` pointed at a dead host: `/marcas/weston` renders the error boundary — the streamed HTML contains `No pudimos cargar los productos de Weston` and `Ver todas las marcas`; `/marcas` still 200 (root boundary, cards hidden as before).
- No server-log errors or hydration warnings on any valid slug.

**Manual**
- Click a card on `/marcas/weston` → `ProductVariantsDrawer` opens in default mode.
- Select a category, type a search, `Limpiar filtros` → both reset, URL unchanged.
- Light/dark at 390 and 1440: hero grid stacks/side-by-side, `WhatsappPanel` beside hero at `lg`.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/features/BrandPage/BrandPage.tsx` | breadcrumb/hero/copy, counter, dropdown threshold (≥ 2), AND filters, clear, empty state, WhatsApp gating, drawer | `pnpm test -- __tests__/brand-page` + dev-server `curl` of `/marcas/weston`, `/marcas/cleveland` + manual clicks |
| `src/app/marcas/[slug]/page.tsx` | metadata per slug, `notFound` on unknown, JSON-LD, single `<main>` | `pnpm test -- __tests__/seo/brand-slug-metadata.test.ts` + `curl` per slug + 404s |
| `src/app/marcas/[slug]/error.tsx` + `CategoryPageError` | brand copy, `esta marca` fallback, back link `/marcas`; category copy unchanged | `pnpm test -- __tests__/app/brand-slug-error.test.tsx __tests__/app/category-slug-error.test.tsx` + dead-Strapi `curl` |
| `src/app/marcas/[slug]/loading.tsx` | re-export compiles | `pnpm build` |

---

## Phase 3 — Header wiring, sitemap, test flips, docs

### Changes Required

**`src/shared/ui/organisms/Header.tsx`** — Modify, in `Header`:

- Import `BRAND_PAGE_HREFS`, `getBrandDisplayName` from `@/shared/constants/brand.constants`.
- `const brandItems: TaxonomyItem[] = brands.map((brand) => ({ ...brand, name: getBrandDisplayName(brand.customId) ?? brand.name }))`.
- Replace `activeBrand` with:
  ```ts
  const pageBrandId = Object.keys(BRAND_PAGE_HREFS).find((id) => BRAND_PAGE_HREFS[id] === pathname)
  const activeBrandId =
    searchParams.get("mode") === "brand"
      ? brands.find((brand) => brand.name === searchParams.get("brand"))?.customId
      : pageBrandId
  const activeBrand = brandItems.find((brand) => brand.customId === activeBrandId)?.name ?? null
  ```
  (mirrors `pageCategoryId`/`activeCategory`; `?mode=brand&brand=Clevaland` still highlights the row now labelled `Cleveland`).
- `Marcas` `TaxonomyDropdown`: `items={brandItems}`, `hrefs={BRAND_PAGE_HREFS}`.
- `MobileMenu`: `brands={brandItems}`.

**`src/shared/ui/organisms/MobileMenu.tsx`** — Modify: import `BRAND_PAGE_HREFS`; `Marcas` `TaxonomyAccordionSection` gets `hrefs={BRAND_PAGE_HREFS}`. No other change (rows with an href already render a `next/link` with `aria-current`; `libre` stays the `aria-disabled` span).

**`src/app/sitemap.ts`** — Modify: after the `/marcas` push, `for (const href of Object.values(BRAND_PAGE_HREFS)) basePages.push({ url: `${SITE_URL}${href}` })`. Brand-mode entries untouched (D5).

**`__tests__/shared/Header.test.tsx`** — Modify:

- Fixture `brands` → `[{ name: "Clevaland", customId: "cleveland" }, { name: "Marca Libre", customId: "libre" }]` — one mapped (proves link + relabel), one unmapped (proves `Marca Libre` stays disabled).
- Test at ~L64 ("opens the Categorías dropdown…"): the `Marcas` half flips — `Cleveland` row is a `menuitem` with `href="/marcas/cleveland"`, not `aria-disabled`; `Marca Libre` row `aria-disabled="true"` and no `href`; no menuitem named `Clevaland`.
- Test at ~L146 ("marks Marcas active on /marcas/weston…"): switch to `/marcas/cleveland`; assert the `Cleveland` row has accessible name `Cleveland (actual)` and the tinted class; `Marca Libre` not active.
- Test at ~L304 (side menu, `mode=brand&brand=Urrea`): use `brand=Clevaland`; the dialog row `Cleveland` is a **link** with `aria-current="page"` and `href="/marcas/cleveland"`; `Marca Libre` is a span with `aria-disabled`.
- Add: on `/marcas/cleveland` the side-menu `Cleveland` link has `aria-current="page"` and clicking it closes the drawer (clone the Tornillería case at ~L324/L348).

**`__tests__/brands/BrandsPage.test.tsx`** — Modify ~L49: rename to "renders every Ver productos CTA as a link to /marcas/<slug>"; `getAllByRole("link", { name: /Ver productos/ })` has length 3 with hrefs `/marcas/weston`, `/marcas/king-tony`, `/marcas/bohrcraft`; no `aria-disabled` CTA; the `<article>` contains exactly one link.

**`__tests__/seo/sitemap.test.ts`** — Modify: import `BRAND_PAGE_HREFS`; both `basePageCount` expressions add `Object.keys(BRAND_PAGE_HREFS).length`; assert each `BRAND_PAGE_HREFS` value appears as `${SITE_URL}${href}` in both the success and the fallback case; assert the `?mode=brand` entries still equal `brands.length`.

**Docs**
- `ai-skills/REPO_CONTEXT.md`: `marcas/[slug]/page.tsx` row in the route table (mirror the `categorias/[slug]` row); `BrandPage/` row in the feature table; `Header` paragraph — brand rows now links via `BRAND_PAGE_HREFS`, relabelled by `getBrandDisplayName`, active by `customId`; `sitemap.ts` rows (+6 base pages); `brand.constants.ts`/`seo.constants.ts` (`BRAND_SEO`, helpers) entries; `global.lib` adapter list (`fetchAllProducts` private helper, `GET_ALL_PRODUCTS` rename); key-files table; `/marcas` row loses "covered by the root pair" only if wording implies `[slug]` doesn't exist. Remove the "empty until Story 2" / "brand rows stay disabled until Story 2" phrases.
- `CLAUDE.md` "What This Is": add `/marcas/<slug>` brand pages to the one-liner.
- `ai-research/epics/brands-browsing.epic.md` — Epic Completion Status: Story 2 row → Complete with evidence; overall 2/2; Next Steps updated.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test -- __tests__/shared/Header.test.tsx __tests__/brands/BrandsPage.test.tsx __tests__/seo/sitemap.test.ts`
- `pnpm test` (full suite, pre-PR gate)
- `pnpm build`

**Dev-server validation**
- `GET /sitemap.xml` → 200; contains exactly six `<loc>` values matching `/marcas/[a-z-]+</loc>` and still seven `?mode=brand` entries (`grep -c 'mode=brand'`), `/marcas</loc>` once.
- `GET /marcas/cleveland` → 200; the server-rendered header HTML contains `href="/marcas/cleveland"` and `Cleveland (actual)` in the desktop dropdown markup if it is SSR'd (HeroUI `Dropdown.Popover` renders closed — if the rows are not in the HTML, mark this `Cannot validate` and rely on the Header tests); the mobile-menu accordion likewise. Must **not** contain `>Clevaland<` anywhere in the header.
- `GET /?mode=brand&brand=Clevaland&page=1` → 200 unchanged (catalog brand mode untouched; the page's own title/breadcrumb may still say `Clevaland` — out of scope).
- `GET /categorias/tornilleria-fijacion` → 200 with `Tornillería (actual)` behaviour intact (regression on the shared `activeCategory` code path).
- No server-log errors.

**Manual**
- Desktop `Marcas` dropdown on `/`: six rows are links labelled `Weston`, `King Tony`, `Bohrcraft`, `Bondhus`, `Precision Brand`, `Cleveland`; `Marca Libre` disabled; `Ver todas las marcas` last.
- On `/marcas/cleveland`: `Cleveland` row highlighted, `Marcas` trigger underlined; mobile accordion row has `aria-current`.
- On `/?mode=brand&brand=Clevaland`: the `Cleveland` row is highlighted (relabel + name→id mapping).

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/shared/ui/organisms/Header.tsx` | brand rows as links, `libre` disabled, relabel, active by slug and by `?mode=brand` name, category path unchanged | `pnpm test -- __tests__/shared/Header.test.tsx` + manual dropdown check |
| `src/shared/ui/organisms/MobileMenu.tsx` | accordion brand rows as links + `aria-current`, drawer closes on navigate | same Header test file (mobile cases) |
| `src/app/sitemap.ts` | +6 base pages in success and fallback; `?mode=brand` count unchanged | `pnpm test -- __tests__/seo/sitemap.test.ts` + `curl /sitemap.xml` |
| `src/features/BrandsPage/BrandCard.tsx` (no change) | CTA is a link now | `pnpm test -- __tests__/brands/BrandsPage.test.tsx` + `curl /marcas` (Phase 1) |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 — Route + data (six slugs 200, unknown/`libre` 404, own `error.tsx`) | 1, 2 | `GET /marcas/<slug>` ×6 → 200 with `N productos` matching live counts (90/26/19/13/6/5); `/marcas/libre`, `/marcas/Clevaland`, `/marcas/nope` → 404; dead `STRAPI_HOST` → `No pudimos cargar los productos de Weston` + `Ver todas las marcas` | Validated | All six slugs 200 with correct counts (90/26/19/13/6/5). `/marcas/libre`, `/marcas/Clevaland`, `/marcas/nope` render the app 404 body but the HTTP status stays `200` — the same pre-existing Next.js 15.5.x `notFound()`-in-`[slug]` limitation already documented in `ai-skills/REPO_CONTEXT.md` for `/categorias/[slug]` (confirmed identical on `/categorias/nope` too, not a regression). The dead-`STRAPI_HOST` error boundary is a client error boundary (`error.tsx`) — its content only mounts after client-side hydration catches the thrown render error, so `curl` (no JS) cannot see it; identical behavior confirmed on `/categorias/tornilleria-fijacion` with the same broken host. Covered instead by `__tests__/app/brand-slug-error.test.tsx` (6 slugs + fallback + retry) and `fetchAllProductsByBrand`'s rejection-propagation test in `global.lib.test.ts`. |
| AC2 — Page structure | 2 | `GET /marcas/weston` contains `aria-label="Ruta"`, `aria-current="page">Weston`, `>Marca<`, `<h1>` heading, identity + stock text, `90 productos`, `wa.me`; WhatsApp unset → no `wa.me` | Validated | All present on `/marcas/weston`; `wa.me` link absent when `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset. Drawer open confirmed by `BrandPage.test.tsx`. |
| AC3 — In-memory filters | 2 | `GET /marcas/weston` contains `Buscar en Weston...` and `Filtrar categorías`; `/marcas/cleveland` and `/marcas/precision` do **not** contain `Filtrar categorías`; no page contains `Filtrar marcas` / `Filtrar subcategorías` | Validated | Confirmed for weston/king-tony/bohrcraft/bondhus (dropdown present) vs. cleveland/precision (absent). The only `Filtrar marcas`/`Filtrar categorías` matches on brand pages are inside the hidden root `loading.tsx` streaming fallback (`disabled="true"`), not live content — confirmed identical on `/categorias/tornilleria-fijacion`. AND/clear interactions covered by `BrandPage.test.tsx`. |
| AC4 — Story 1 gates flip on | 1, 3 | `GET /marcas` shows six `href="/marcas/<slug>"` CTAs; `GET /marcas/cleveland` header HTML has `href="/marcas/cleveland"`, no `>Clevaland<` | Cannot validate | `/marcas` card CTAs confirmed as real links via `curl` in Phase 1. The header/mobile-menu dropdown rows do **not** appear in `curl`'s SSR output at all (HeroUI's `Dropdown.Popover` and `Drawer` are client-only overlays not rendered into the initial HTML until opened) — confirmed `/marcas/cleveland`'s `<header>` slice contains neither `cleveland` nor `Clevaland` in any form, matching the plan's own fallback. Proven instead by `Header.test.tsx` (28/28 passing, including the relabel/active-row/disabled-`Marca Libre` cases) and the manual dropdown/accordion checklist below. |
| AC5 — SEO | 2, 3 | `GET /marcas/<slug>` ×6: `<title>` + `<meta name="description">` per `BRAND_SEO`, `rel="canonical"` `/marcas/<slug>`, `BreadcrumbList` with 3 items; `GET /sitemap.xml` has six `/marcas/<slug>` `<loc>`s and seven `mode=brand` entries | Validated | Metadata/canonical/`BreadcrumbList` confirmed live for weston; all six slugs covered by `brand-slug-metadata.test.ts`. `GET /sitemap.xml` confirmed exactly six `/marcas/<slug>` `<loc>`s, seven `mode=brand` entries, one `/marcas` entry. |
| AC6 — Tests | 1, 2, 3 | — | Cannot validate | Not a dev-server check by nature. Proven by `pnpm test`: 49 suites, 497 passed / 1 pre-existing skip, 0 failed. |

## Cross-cutting concerns

- **Strapi env / boundary.** `fetchAllProductsByBrand` keeps the no-try/catch contract; a rejection reaches `src/app/marcas/[slug]/error.tsx`. The root layout's `fetchBrands()` still degrades to `[]` on its own.
- **Server/client boundary.** `page.tsx`, `loading.tsx` are server; `BrandPage.tsx`, `error.tsx` are `"use client"`. `getBrandDisplayName`/`BRAND_SEO` are plain constants importable from both.
- **Config vs live divergence.** A `BRAND_PAGE_HREFS` brand unpublished in Strapi renders `0 productos` (empty catalog state), not 404 — accepted, same as categories.
- **`/marcas` folder now nests `[slug]`.** `/marcas` keeps the root `error.tsx`/`loading.tsx`; `[slug]` ships its own — nearest-boundary resolution, same as `categorias/`.
- **Responsive/theme.** Class-only (`md:`/`lg:`), classes copied from `CategoryPage`; no cookie or `DESIGN.md` change, `pnpm design:lint` not needed.
- **PR label:** `minor` (new routes).

## Open Questions / Out-of-scope

**Open (confirm at sign-off)**
- Catalog III: `/marcas/libre` → `notFound()` (planned) vs. redirect to `/categorias/tornilleria-fijacion`. Plan assumes 404 (D8).

**Out of scope (deliberately excluded)**
- Subcategory dropdown on brand pages (D4); brand logos / "sobre la marca" sections; pagination on brand pages.
- Redirecting, de-listing or canonicalising `/?mode=brand&brand=<name>` URLs and their sitemap entries (D5); the `Clevaland` string in catalog brand-mode title/breadcrumb and the search-drawer `DropdownBrands` (live taxonomy; backend fixes Strapi).
- Whole-card link on `/marcas` (D6); `BrandCard` code changes.
- `React.cache()` de-duplication of the layout's `fetchBrands()`.
- Widening `TaxonomyDropdown`/`TaxonomyAccordionSection` with an `activeId` prop — the relabel-then-match-by-name approach in `Header` needs none.
