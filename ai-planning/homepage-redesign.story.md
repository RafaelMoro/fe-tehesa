# Plan: Homepage Redesign (`/`)

**Source research:** `ai-research/homepage-redesign.story.md` (2026-09-17, branch `feat/add-homepage`).
**Sign-off status:** no explicit sign-off line; every open question (Strapi I, Catalog I–II, UI I–VI, Theme I, Verification I) is answered and dated 2026-09-17, and D1–D8 are decided. Treated as signed off — same basis as `product-card-redesign.story.md`. **Confirm before `/implement`.**
**Plan date:** 2026-09-17.

## Assumptions

- **Count label reuses the existing `statusText` prop.** `Home` passes `statusText="333 productos en catálogo"` on base mode and leaves it `undefined` on `?mode=` pages so today's `${productCount} producto(s)` branch runs. No new `CatalogHero` prop; `loading.tsx` / `error.tsx` keep compiling untouched (AC1 "without new props being required").
- **`SearchInput`'s default placeholder changes** instead of passing the new string from two call sites. Its only default-consuming callers are `Home.tsx` and `CatalogDisabledFilters.tsx` (`CategoryPage`/`BrandPage` pass their own), so one line keeps `/`, `loading.tsx`, and `error.tsx` in sync.
- **Closing panel is its own file** (`src/features/Home/HomeQuotePanel.tsx`, hook-free, no directive): `Home.tsx` is already ~500 lines and the panel is a self-contained copy of `BrandsPage.tsx`'s closing `<section>`. The research allows either.
- **`Home` stops passing `onOpenCatalogSearch` / `onClearLocalFilter` to `ProductListing`** (both optional). Since `Home` short-circuits before `ProductListing` when a local filter has zero matches (D6), the panel is unreachable from `/` — dropping the props makes that structural. `/categorias/[slug]` and `/marcas/[slug]` are untouched.
- **End-of-list copy placement:** left column of the base pagination footer, under `Mostrando X-Y de 333`; centered above the `Anterior`/`Siguiente` row in filtered mode. Not shown while a route transition is pending.
- Env: `.env.local` has `STRAPI_HOST` / `STRAPI_API_TOKEN` / `NEXT_PUBLIC_WHATSAPP_NUMBER`; dev-server checks assume `pnpm dev` on `http://localhost:3000`.

## Acceptance Criteria

1. **Hero.** `/` renders the comp kicker, H1, and intro verbatim; the right column shows `{KNOWN_PRODUCT_TOTAL} productos en catálogo` on base mode and today's `{N} producto(s)` on `?mode=` pages; the dark panel carries the comp title/body/footer copy and its `Buscar en todo el catálogo` button opens the `Búsqueda ampliada` drawer (same handler as today). `loading.tsx` / `error.tsx` keep rendering `CatalogHero` — loading shows `Contando productos…`, error shows the disabled button — without new props being required.
2. **Brand strip.** Below the hero, a strip labelled `Marcas en almacén` lists every live brand that has a `BRAND_PAGE_HREFS` entry, in `BRAND_PAGES` key order, labelled `getBrandDisplayName(customId) ?? name`, each a `next/link` to its `/marcas/<slug>`, with `·` separators marked `aria-hidden`; plus `Explorar el catálogo por marca →` to `/marcas`. When no brand qualifies (Strapi failure → empty taxonomy) the strip is not rendered at all.
3. **Filter row + hint.** The row is `SearchInput` (comp placeholder) + the two dropdowns; the `¿Qué significa este filtro?` popover keeps today's behavior (icon button, only while a local filter is active) but its text becomes the comp copy. The example hint line renders only while no local search/category/brand is active. Existing `Limpiar filtros` (local) and `Limpiar búsqueda` (wide) behavior is unchanged.
4. **No results.** With a local search term and zero matches, `/` renders the `Nada con "…"` paragraph (term echoed verbatim, trimmed); with only a category/brand local filter and zero matches, the `Ninguno de los productos…` paragraph, each followed by a `Buscar en todo el catálogo` button (opens the drawer) and a `Limpiar filtros` button (resets local filters). Neither renders `ProductListing`'s panel. `/categorias/[slug]` and `/marcas/[slug]` still render the panel (untouched).
5. **Pagination.** Base mode keeps numbered `1..7` real links / non-link current page, `Mostrando X-Y de 333`, and prev/next as real links or `aria-disabled` spans — never `href="#"` — now labelled `Página anterior` / `Página siguiente` in the comp's outlined style. The `Llegaste al final…` copy appears on the last base page and on a filtered mode with no `Siguiente`. Filtered `Anterior` / `Siguiente` URLs are unchanged.
6. **Closing panel.** After pagination, the panel renders its H2/body, `Ver mi lista de cotización` as a `next/link` to `/cotizar`, and `Cotizar por WhatsApp` as `target="_blank" rel="noopener noreferrer"` only when `WHATSAPP_NUMBER` is set; never throws when unset.
7. **Tests.** `__tests__/home/Home.test.tsx` updated for the new labels (`Buscar en todo el catálogo` now exists both in the hero and inside the drawer — scope queries with `within(dialog)` / outside it), the brand strip (links, hidden when empty), hint visibility, the two no-result paragraphs, pagination labels and end copy, and panel gating. Follow `docs/UNIT_TESTING_GUIDELINES.md`.

## Affected Files

**`src/features/`**
- `Home/CatalogHero.tsx` — Modify: copy, icon, footer line, panel color, loading label, default `actionLabel`.
- `Home/Home.tsx` — Modify: hero `statusText`, `BrandStrip` mount, filter-row border/hint, popover copy, no-result short-circuit, base + filtered pagination controls/end copy, `HomeQuotePanel` mount, `ProductListing` props.
- `Home/BrandStrip.tsx` — Create.
- `Home/HomeQuotePanel.tsx` — Create.
- `ProductListing/SearchInput.tsx` — Modify: default `placeholder` (line 15).

**`__tests__/`**
- `home/Home.test.tsx` — Modify: rename/scope the hero button queries; add cases per AC 7.

**Not touched:** `src/app/page.tsx`, `src/app/loading.tsx`, `src/app/error.tsx`, `Home/CatalogDisabledFilters.tsx`, `Home/CatalogPageLayout.tsx`, `Home/useCatalogSearch.ts`, `ProductListing/ProductListing.tsx`, `CatalogSearchDrawer/*`, `src/components/ProductCard.tsx`, `src/shared/**` (constants reused as-is), `src/zustand/**`, `DESIGN.md`, `package.json`.

---

## Phase 1 — Hero + closing panel

### Changes Required

**`src/features/Home/CatalogHero.tsx` — Modify** (whole JSX; props interface unchanged)

- Imports: drop `RiShareLine`; keep `RiSearchLine`, `Button`.
- Default `actionLabel = "Buscar en todo el catálogo"`.
- Left column: kicker `Catálogo con precio · Puebla` (`text-[#23890C] dark:text-[#4DF527]`, replacing the `emerald-*` classes); H1 unchanged, sizes `text-[28px] md:text-4xl lg:text-5xl` (comp 28/36/48); intro `Busca por categoría, por marca o por nombre de producto. Cada variante trae su precio y su clave de parte; pon cantidades y manda la lista a cotizar.`
- Section grid: `lg:grid lg:grid-cols-[minmax(0,1fr)_340px]` (comp ≥1024), keep `flex flex-col gap-6` below.
- Right column status `<p>`: `statusText ?? (productCount == null ? "Contando productos…" : \`${productCount} ${productCount === 1 ? "producto" : "productos"}\`)` — only the loading string changes.
- `<aside>`: `bg-[#0F2001]` (drop `bg-emerald-950` + its `dark:` twin); title row `<RiSearchLine aria-hidden size={18} />` + `<h2>¿No aparece con los filtros?</h2>`; body: the comp's panel paragraph, copied verbatim from `pagina-home.dc.html` (the research only quotes its opening, `Busca en el catálogo completo por nombre…` — see Open Questions); the existing `fullWidth` primary `Button` (label from `actionLabel`, `RiSearchLine` icon, `isDisabled={isDisabled || !onAction}`); new footer `<p className="mt-3 text-xs text-white/70">Elige categoría o marca, una a la vez. La búsqueda por nombre reemplaza el filtro activo.</p>`.

Edge cases: `error.tsx` passes `statusText="No pudimos cargar los productos."` and `loading.tsx` passes nothing — both keep working; `__tests__/app/error.test.tsx` asserts that status text and stays green.

**`src/features/Home/HomeQuotePanel.tsx` — Create** (no directive, no hooks)

```tsx
export const HomeQuotePanel = () => {
  const whatsappUrl = WHATSAPP_NUMBER ? buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_HEADER_MESSAGE) : null
  return <section className="flex flex-wrap items-center justify-between gap-6 rounded-[14px] bg-[#0F2001] p-6 text-white"> … </section>
}
```

- Copy `BrandsPage.tsx:65-91` markup: `<h2 className="text-xl font-bold">Ya tienes la lista?</h2>`, `<p className="mt-2 text-white/80">Tu lista llega con la clave de cada parte ya puesta. Un vendedor de Tehesa te regresa la cotización formal.</p>`; actions wrapper `flex flex-wrap gap-3`.
- Primary: `<Link href="/cotizar" className="flex min-h-11 items-center gap-2 rounded-lg bg-[#4DF527] px-4 font-semibold text-[#0D3401] hover:bg-[#3BD11A]">Ver mi lista de cotización <RiArrowRightLine aria-hidden size={16} /></Link>`.
- Secondary (only when `whatsappUrl !== null`): `<a href target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center rounded-lg border border-white/25 px-4 font-semibold hover:bg-white/10">Cotizar por WhatsApp</a>`.
- Rationale: identical gate to `WhatsappPanel`/`BrandsPage` (D7); `WHATSAPP_NUMBER` is module-scope env, read per render like `BrandsPage`.

**`src/features/Home/Home.tsx` — Modify**

- Near line 277: `<CatalogHero productCount={products.length} statusText={catalogMode === "base" ? \`${countFormatter.format(KNOWN_PRODUCT_TOTAL)} productos en catálogo\` : undefined} onAction={catalogSearchDrawerState.open} isDisabled={isBusy} />` with a module-scope `const countFormatter = new Intl.NumberFormat("es-MX")` (same as `CategoryCard`/`BrandsPage`).
- After the pagination block (line 485) and before `{productDetails && …}`: `<HomeQuotePanel />`.

**`__tests__/home/Home.test.tsx` — Modify**

- Lines 127, 154, 181, 186: the hero button is now `Buscar en todo el catálogo`. Query it outside the dialog: `screen.getAllByRole("button", { name: "Buscar en todo el catálogo" })[0]` before the drawer opens (only one exists then); the re-enable `waitFor` at 179-183 must target the hero button, not the drawer's — after the dialog closes only the hero one remains, so `getByRole` is unambiguous there again. Keep `within(dialog)` for the submit at 137.
- New: `describe("Home - hero")` — base render shows `333 productos en catálogo`; `catalogMode: "brand"` render shows `3 productos`; hero button opens the `Búsqueda ampliada` dialog.
- New: `describe("Home - closing panel")` — `Ver mi lista de cotización` is a link with `href="/cotizar"`; `Cotizar por WhatsApp` link has `target="_blank"` + `rel="noopener noreferrer"` and `href` equal to `buildWhatsappUrl(number, WHATSAPP_HEADER_MESSAGE)` when the number is set; absent when unset. Gate the number with the `BrandsPage.test.tsx` getter-mock pattern, but spread `...jest.requireActual("@/shared/constants/whatsapp.constants")` first — `Home`'s import graph reaches `whatsapp-message.utils`, which needs the other constants.

### Success Criteria

**Automated:** `pnpm exec tsc --noEmit`; `pnpm test -- __tests__/home/Home.test.tsx`; `pnpm test -- __tests__/app/error.test.tsx`.

**Dev-server validation** (`pnpm dev`):
- `GET /` → 200; body contains `Catálogo con precio · Puebla`, `Distribuidor de herramienta industrial en Puebla`, `manda la lista a cotizar`, `333 productos en catálogo`, `¿No aparece con los filtros?`, `Buscar en todo el catálogo`, `reemplaza el filtro activo`, `Ya tienes la lista?`, `href="/cotizar"`, `Ver mi lista de cotización`, `https://wa.me/`, `Cotizar por WhatsApp`, `target="_blank"`.
- `GET /?mode=brand&brand=Weston&page=1` → 200; contains `50 productos`, not `productos en catálogo`.
- `GET /?mode=name&q=zzz&page=1` → 200; contains `0 productos`, `No hay productos disponibles.`.
- Dev-server log: no errors, no hydration warnings on `/`.

**Manual:** click the hero `Buscar en todo el catálogo` → `Búsqueda ampliada` drawer opens; unset `NEXT_PUBLIC_WHATSAPP_NUMBER`, restart, `GET /` still 200 without `Cotizar por WhatsApp`; hero collapses to one column below 1024px; loading state (`Contando productos…`) via a slow Strapi or throttled network.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `Home/CatalogHero.tsx` | copy, count-label branches, disabled button in loading/error | curl `/`, `/?mode=brand…`; `error.test.tsx` |
| `Home/HomeQuotePanel.tsx` | `/cotizar` link, WhatsApp gate + external-link attrs | curl `/`; Jest closing-panel cases |
| `__tests__/home/Home.test.tsx` | renamed hero queries still open the drawer | `pnpm test -- __tests__/home/Home.test.tsx` |

---

## Phase 2 — Brand strip + filter row

### Changes Required

**`src/features/Home/BrandStrip.tsx` — Create** (no directive, no hooks; `Home` imports it)

```ts
interface BrandStripProps { brands: TaxonomyItem[] }
```

- Derive: `Object.keys(BRAND_PAGES)` → keep ids where `BRAND_PAGE_HREFS[id] !== undefined` and `brands.some((b) => b.customId === id)` → map to `{ customId, href: BRAND_PAGE_HREFS[id], label: getBrandDisplayName(id) ?? liveBrand.name }`. Order is `BRAND_PAGES` insertion order (D5).
- `if (items.length === 0) return null` (AC2).
- Markup: `<nav aria-label="Marcas en almacén" className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">` → `<span className="text-xs font-semibold tracking-wide uppercase text-muted">Marcas en almacén</span>`, then per item `<Link href className="font-medium hover:text-[#125D03] dark:hover:text-[#4DF527]">{label}</Link>` with `<span aria-hidden="true">·</span>` between items (not after the last), then `<Link href="/marcas" className="ml-auto inline-flex items-center gap-1">Explorar el catálogo por marca <RiArrowRightLine aria-hidden size={16} /></Link>`.
- Edge cases: `libre` has no `BRAND_PAGE_HREFS` entry → excluded; `cleveland` renders `Cleveland`, never `Clevaland`.
- Rationale: same filter/label shape as `Header.tsx:121-126`; kept in its own file so the pure derivation is unit-testable through `Home` props.

**`src/features/ProductListing/SearchInput.tsx` — Modify** (line 15)

- `placeholder = "Buscar por nombre: broca, machuelo, dado…"`. Covers `Home`, `loading.tsx`, `error.tsx` (all rely on the default).

**`src/features/Home/Home.tsx` — Modify**

- Imports: add `BrandStrip`.
- Between `<CatalogHero …/>` and the filter `<div>`: `<BrandStrip brands={brands} />`.
- Filter row wrapper (line 283): add `border-t border-default-200 pt-5 dark:border-[#1E3608]`; `SearchInput` gets `className`-free (placeholder now default).
- After the row's closing `</div>` (line 304), before the `isLocalFilterActive` tip block: `{!isLocalFilterActive && <p className="mb-3 text-sm text-muted">Escribe el nombre del producto. Ejemplo: broca cobalto, machuelo NPT, dado de impacto.</p>}`.
- Popover body (line 326-328): `Filtra solo entre los productos que estás viendo. Puedes combinar categoría, marca y texto.` Trigger, `aria-label`, and the `isLocalFilterActive` gate stay (D8).
- Edge case: the navigation `useEffect` (line 135) resets the three local filter states, so the hint reappears on every route change with no extra state.

**`__tests__/home/Home.test.tsx` — Modify**

- New `describe("Home - brand strip")`: render with `brands: [{ name: "Clevaland", customId: "cleveland" }, { name: "Marca Libre", customId: "libre" }, { name: "WESTON", customId: "weston" }]` → `within(getByRole("navigation", { name: "Marcas en almacén" }))` lists links `Weston` then `Cleveland` (`BRAND_PAGES` order, not fixture order) with hrefs `/marcas/weston`, `/marcas/cleveland`; no `Marca Libre` link; `Explorar el catálogo por marca` link → `/marcas`. Render with `brands: []` → `queryByRole("navigation", { name: "Marcas en almacén" })` is null.
- New `describe("Home - filter hint")`: hint paragraph present on render; after `user.type` into `Filtrar resultados visibles` it is gone and `Limpiar filtros` appears; after clicking `Limpiar filtros` the hint returns. Popover: click `¿Qué significa este filtro?` → `findByText(/Puedes combinar categoría, marca y texto/)`.
- Note: the default fixture `brands` (`acme`/`other`) has no `BRAND_PAGES` entry, so existing tests render no strip — no assertions elsewhere change.

### Success Criteria

**Automated:** `pnpm exec tsc --noEmit`; `pnpm test -- __tests__/home/Home.test.tsx`; `pnpm lint`.

**Dev-server validation** (`pnpm dev`):
- `GET /` → 200; contains `aria-label="Marcas en almacén"`, `href="/marcas/weston"`, `href="/marcas/king-tony"`, `href="/marcas/bohrcraft"`, `href="/marcas/bondhus"`, `href="/marcas/precision"`, `href="/marcas/cleveland"`, `>Cleveland<`, `Explorar el catálogo por marca`, `href="/marcas"`; does **not** contain `Clevaland` or `Marca Libre` inside the nav; `Weston` link appears before `Cleveland` in the HTML; contains `placeholder="Buscar por nombre: broca, machuelo, dado…"` and `Escribe el nombre del producto. Ejemplo:`.
- `GET /?mode=category&category=Abrasivos&page=1` → 200; strip still present (it is fed by the taxonomy, not the result set).
- Dev-server log: no errors, no hydration warnings.

**Manual:** type in the filter input → hint disappears, `Limpiar filtros` + info icon appear; open the popover → new copy; clear → hint returns; at 390px the `Explorar…` link wraps under the brand links.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `Home/BrandStrip.tsx` | order, gating (`libre`, empty taxonomy), display names, hrefs, `aria-hidden` separators | curl `/`; Jest brand-strip cases |
| `ProductListing/SearchInput.tsx` | new default placeholder on `/`, loading, error | curl `/` |
| `Home/Home.tsx` (row/hint/popover) | hint visibility toggles with local filters; popover copy | Jest filter-hint cases + manual |

---

## Phase 3 — No-result copy + pagination restyle

### Changes Required

**`src/features/Home/Home.tsx` — Modify**

*No-result short-circuit (D6).* Near line 354, replace the unconditional `<ProductListing …/>` with:

```
const trimmedLocalTerm = localSearchTerm.trim()
const hasNoLocalMatches = isLocalFilterActive && filteredProducts.length === 0
```

```tsx
{hasNoLocalMatches ? (
  <div className="flex flex-col items-start gap-4" role="status">
    <p className="max-w-2xl text-muted">
      {trimmedLocalTerm
        ? `Nada con "${trimmedLocalTerm}". Prueba con otra palabra del nombre (broca, machuelo, dado) o mándanos la clave o la medida por WhatsApp.`
        : "Ninguno de los productos que estás viendo coincide. Quita un filtro o busca en todo el catálogo."}
    </p>
    <div className="flex flex-wrap gap-3">
      <Button variant="primary" onPress={catalogSearchDrawerState.open} isDisabled={isBusy}>Buscar en todo el catálogo<RiArrowRightLine aria-hidden="true" /></Button>
      <Button variant="tertiary" onPress={clearLocalFilters} isDisabled={isBusy}>Limpiar filtros</Button>
    </div>
  </div>
) : (
  <ProductListing products={filteredProducts} handleProductClick={handleProductClick} isLocalFilterActive={isLocalFilterActive} />
)}
```

- Term wins over the filter message (research: `showNoResults` checks the term first).
- Drop `onClearLocalFilter` / `onOpenCatalogSearch` from the `ProductListing` call (see Assumptions). `ProductListing.tsx` itself is untouched.
- `role="status"` matches `pageFeedback`; the existing `getByRole("status")` assertion at test line 288 runs in a filtered-mode render with no local filter, so it stays unique.

*Base pagination restyle (D1).* Replace `ICON_BUTTON_CLASSES` (lines 44-48) with:

```ts
const PAGE_NAV_BUTTON_CLASSES = buttonVariants({ variant: "outline", size: "md" }) + " min-h-10 rounded-[10px] border-default-300"
```

- Prev control (lines 371-387): same `Link`/`span` branch, `className={PAGE_NAV_BUTTON_CLASSES}`, keep `aria-label="Página anterior"` and `aria-disabled="true"` on the span; children `<RiArrowLeftLine aria-hidden="true" size={16} /> Página anterior`. Next control (421-437) mirrors with `Página siguiente` + `RiArrowRightLine`.
- Footer left column (lines 363-369): wrap the `Mostrando` `<p>` in a `<div className="flex flex-col gap-1">` and add `{currentPage === totalPages && !isRoutePending && <p className="text-sm text-muted">Llegaste al final de esta lista. Cambia el filtro o busca en todo el catálogo.</p>}`.
- Numbered `Pagination` block (388-420) unchanged.

*Filtered pagination end copy.* In the filtered branch (441-484): wrap the existing centered row in a `<div className="flex flex-col items-center gap-3">` and prepend `{(!initialHasNextCatalogPage || isEndNotice) && !isBusy && <p className="text-sm text-muted">Llegaste al final de esta lista. Cambia el filtro o busca en todo el catálogo.</p>}`. `Anterior`/`Siguiente` hrefs, classes, and disabled spans unchanged.

Edge cases: never `href="#"` (test line 300 sweeps every link); `aria-label` stays on the prev/next controls so `getByLabelText("Página anterior")` and `getByRole("link", { name: "Página siguiente" })` keep working with the visible text now duplicating the label.

**`__tests__/home/Home.test.tsx` — Modify**

- New `describe("Home - no results")`:
  - type `zzz` into `Filtrar resultados visibles` → `getByRole("status")` has text `Nada con "zzz".` (type `"  zzz  "` and assert the trimmed echo); no `No hay coincidencias en estos productos` heading; `within(status)` has buttons `Buscar en todo el catálogo` and `Limpiar filtros`; clicking the first opens the `Búsqueda ampliada` dialog; clicking the second restores `Chain C` and the hint.
  - select a category with no products in the working set (fixture: add `{ name: "Wheels", customId: "wheels" }` to `categories`, pick `Wheels` from `Filtrar categorías`) → status text starts with `Ninguno de los productos que estás viendo coincide.`
  - The un-skipped stacking test at line 97 stays `it.skip` (guidelines).
- Pagination: extend line 241's test to also assert `getByRole("link", { name: "Página siguiente" })` has text content `Página siguiente`; new case `currentPage: 7` → `queryByRole("link", { name: "Página siguiente" })` null + `getByText(/Llegaste al final de esta lista/)` present; base page 1 → `queryByText(/Llegaste al final/)` null.
- Filtered: extend the `notice=end` case (275) to assert `getByText(/Llegaste al final/)`; new case `catalogMode: "brand", hasNextCatalogPage: false` → end copy present; the existing canonical-URL case (256, `hasNextCatalogPage: true`) → `queryByText(/Llegaste al final/)` null.

### Success Criteria

**Automated:** `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm test -- __tests__/home`; then full `pnpm test` and `pnpm build`.

**Dev-server validation** (`pnpm dev`):
- `GET /` → 200; contains `aria-label="Página siguiente"` on an `<a href="/?page=2"`, `aria-label="Página anterior"` on a `<span … aria-disabled="true"`, visible text `Página siguiente`, `Mostrando`, `de 333 productos`; does **not** contain `Llegaste al final` or `href="#"`.
- `GET /?page=7` → 200; contains `Llegaste al final de esta lista.`, `Mostrando 301-333 de 333`, `Página siguiente` as an `aria-disabled` span, `href="/?page=6"`.
- `GET /?mode=brand&brand=Clevaland&page=1` → 200 (5 products, no next page; `Clevaland` is the live Strapi name); contains `Llegaste al final de esta lista.`; `Siguiente` is an `aria-disabled` span.
- `GET /?mode=brand&brand=Weston&page=1` → 200 (50 products); contains `href="/?mode=brand&amp;brand=Weston&amp;page=2"` and **no** `Llegaste al final`.
- `GET /?mode=brand&brand=Weston&page=2` → 200 (40 products, no next page); contains `Llegaste al final de esta lista.`.
- `GET /?mode=brand&brand=Weston&page=3&notice=end` → 307 to page 2 with the end notice; follow it → 200 with `No hay más resultados.` and `Llegaste al final de esta lista.`
- Dev-server log: no errors, no hydration warnings.

**Manual:** type a non-matching term on `/` → `Nada con "…"` paragraph + two buttons, no tinted panel; `Buscar en todo el catálogo` opens the drawer; `Limpiar filtros` restores the grid; pick a category with no visible products → `Ninguno de los productos…`; open `/categorias/tornilleria` and filter to zero → the old tinted panel still renders there; prev/next render as 40px outlined buttons.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `Home/Home.tsx` no-result branch | term vs. filter precedence, trimmed echo, both actions, `ProductListing` panel never mounted from `/` | Jest no-results cases + manual |
| `Home/Home.tsx` base pagination | labels, link/span edges, end copy only on page 7, no `href="#"` | curl `/`, `/?page=7`; Jest pagination cases |
| `Home/Home.tsx` filtered pagination | unchanged URLs, end copy on no-next / `notice=end`, hidden while busy | curl `/?mode=brand…`; Jest filtered cases |
| `ProductListing/ProductListing.tsx` | panel still reachable from category/brand pages | manual `/categorias/tornilleria`; existing `__tests__/category-page`, `__tests__/brand-page` suites |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 - Hero copy, count label, panel, drawer button, loading/error compat | Phase 1 | `GET /` 200 contains kicker/H1/intro/`333 productos en catálogo`/panel title+body+footer/`Buscar en todo el catálogo`; `GET /?mode=brand&brand=Weston&page=1` contains `50 productos` | Not validated | Drawer opening and `Contando productos…` are Jest (`Home - hero`) / `error.test.tsx` + manual |
| AC2 - Brand strip | Phase 2 | `GET /` 200 contains `aria-label="Marcas en almacén"`, six `/marcas/<slug>` hrefs in `BRAND_PAGES` order, `Cleveland` not `Clevaland`, `href="/marcas"` | Not validated | Empty-taxonomy case is Jest only (Strapi failure never reaches `Home`) |
| AC3 - Filter row + hint + popover copy | Phase 2 | `GET /` 200 contains the new `placeholder` and `Escribe el nombre del producto. Ejemplo:` | Not validated | Hint hide/show and popover text are client-only → Jest `Home - filter hint` + manual |
| AC4 - No-result paragraphs | Phase 3 | — | Cannot validate | Local filtering is client-only; proven by Jest `Home - no results` + manual click-through. Category/brand panel parity: manual `/categorias/tornilleria` + existing suites |
| AC5 - Pagination labels, style, end copy | Phase 3 | `GET /` (no end copy, next is a link), `GET /?page=7` (end copy, next disabled), `GET /?mode=brand&brand=Clevaland&page=1` (end copy), `GET /?mode=brand&brand=Weston&page=1` (no end copy, page-2 href) | Not validated | Outlined look is manual |
| AC6 - Closing panel | Phase 1 | `GET /` 200 contains `href="/cotizar"`, `Ver mi lista de cotización`, `wa.me`, `target="_blank"`, `rel="noopener noreferrer"` | Not validated | Unset-env case: restart without `NEXT_PUBLIC_WHATSAPP_NUMBER` → `GET /` 200 without `Cotizar por WhatsApp` (also Jest) |
| AC7 - Tests | Phases 1–3 | `pnpm test -- __tests__/home` green, then full `pnpm test` | Not validated | |

## Cross-cutting concerns

- **Duplicate accessible names.** `Buscar en todo el catálogo` (hero + drawer submit + no-result action) and `Limpiar filtros` (filter row + no-result action) coexist; tests scope with `within(dialog)` / `within(status)` or `getAllByRole`. Runtime a11y is fine — the drawer is modal.
- **Server/client boundary.** `BrandStrip` and `HomeQuotePanel` are hook-free and rendered by the `"use client"` `Home`; nothing new reads `window`/`localStorage` at render, so no hydration risk. `WHATSAPP_NUMBER` is a `NEXT_PUBLIC_*` module-scope read, identical to `WhatsappPanel`.
- **Responsive.** Class-only (`md:`/`lg:`); no `useMediaQuery` (`CatalogHero` renders in `loading.tsx`).
- **Theme.** Raw hex dark tokens as in `/categorias` and `/marcas` (`#0F2001`, `#4DF527`, `#23890C`, `#1E3608`); `DESIGN.md` untouched, no `pnpm design:lint` needed.
- **Env.** `STRAPI_HOST`/`STRAPI_API_TOKEN` for the dev-server checks; `NEXT_PUBLIC_WHATSAPP_NUMBER` optional.
- **PR label:** `minor`.

## Open Questions / Out-of-scope

- **Hero panel body copy.** The research lists every other string verbatim but only quotes the panel body's opening (`Busca en el catálogo completo por nombre`, D4). The implementer copies the full paragraph from `pagina-home.dc.html` in the Claude Design project; if the comp is unavailable, ask the user for the sentence before Phase 1.
- Otherwise no unresolved questions; research D1–D8 are decided.
- Out of scope (per research): `ProductCard`, `Header`/`MobileMenu`, `CatalogSearchDrawer` internals, `page.tsx` fetching/redirects/SEO/JSON-LD, the comp's `showImages` slot, live `products_connection` total (D3), `?mode=brand` redirects, category/brand page empty states (D6), a home-specific WhatsApp prefill (D7), the comp's always-visible tip button (D8).
- Deliberately not touched even though nearby: `ProductListing.tsx`'s panel (still serves category/brand pages), `CatalogDisabledFilters.tsx` (inherits the placeholder via the `SearchInput` default), the stale `KNOWN_PRODUCT_TOTAL` (both `333` labels drift together by design).
