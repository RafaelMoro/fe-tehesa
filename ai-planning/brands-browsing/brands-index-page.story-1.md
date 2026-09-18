# Plan: Brands Index Page (`/marcas`) + Header Entry Point (Story 1 of `brands-browsing`)

**Source research:** `ai-research/brands-browsing/brands-index-page.story-1.md` (2026-09-17, branch `feat/add-brand-page`).
**Sign-off status:** no explicit sign-off line, but every open question is answered by the user on 2026-09-17 (Strapi I–II, Catalog I, UI I–VII, Theme I, Verification I) and D1–D8 are recorded as decided/assumed. Strapi III (`Clevaland` typo) is `pending` and explicitly out of this repo's scope. Treated as signed off — same basis as `ai-planning/categories-page.story.md`. **Confirm before `/implement`.**
**Plan date:** 2026-09-17.

## Assumptions

- **Header mechanics are already built.** `TaxonomyDropdown` / `TaxonomyAccordionSection` already accept `allHref` + `isActiveRoute` (categories-page story). The only header code change is parameterising the row label and wiring the `Marcas` instances. The `id="ver-todas"` stays: each `Dropdown.Menu` is its own react-aria collection, so the id only has to be unique per menu.
- **Dropdown row = react-aria `MenuItem` with `href`** → full-page navigation (no `RouterProvider`), accepted by the categories story; the mobile row is a `next/link`. Unchanged here.
- **Active state on `/marcas*` uses `startsWith`** from day one (AC2 says "any future `/marcas/*`"), while the row is hidden only on the exact index (`pathname === "/marcas"`) — the same `isCategories` / `isCategoriesIndex` split `Header.tsx` already has.
- **`BRAND_PAGE_HREFS = {}`** in this story; `BrandCard` reads it exactly like `CategoryCard` reads `CATEGORY_PAGE_HREFS`, so Story 2 enables CTAs by adding entries, no component change.
- **Page data = `fetchBrands()` only**, called a second time per request (root layout already calls it for the header) — same accepted duplication as `/categorias`. No count query (D5), no products.
- **Root `src/app/error.tsx` / `loading.tsx` cover `/marcas`**; no route-scoped pair (research: `/categorias` has one only because `[slug]` sits under it). Its copy says "productos" on a brand-fetch failure — accepted, same trade-off the categories plan first made.
- **Test placement follows the repo's existing folders** (`__tests__/brands/`, `__tests__/seo/`, `__tests__/shared/`), not the research's `__tests__/features/` / `__tests__/app/` suggestion — see Decisions.
- **Comps:** `comps/brands-index-page/` does not exist yet; the implementer references the Claude Design project URL in the research doc (or runs `/check-design` first — not part of this plan).
- Env: `.env.local` has `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. Dev-server checks assume `pnpm dev` on `http://localhost:3000` and the live taxonomy of 7 published brands (six configured + `libre`).

## Acceptance Criteria

1. **Header entry point.** On every route, the `Marcas` dropdown (≥ `md`) and the mobile menu's `Marcas` accordion end with a `Ver todas las marcas` row — a real `next/link` anchor to `/marcas`, separated from the disabled brand rows above it (border-top + tinted background, light and dark, identical to the `Ver todas las categorías` row). Selecting it closes the dropdown / drawer. The row is **not rendered on `/marcas`**. Brand rows stay `isDisabled`. When the brand taxonomy is empty (Strapi failure) the dropdown/accordion is not rendered at all — unchanged — so the row isn't either.
2. **Active state.** On `/marcas` (and any future `/marcas/*`) the desktop `Marcas` trigger carries the active underline (`border-b-2 border-[#4DF527]` + sr-only ` (actual)`), and the mobile `Marcas` accordion trigger gets the same highlight `Categorías` gets on `/categorias*`. `Productos` and `Categorías` are not active there.
3. **Page structure.** `GET /marcas` is a server-rendered route (`src/app/marcas/page.tsx`) that fetches `fetchBrands()` and renders, inside one `<main>`: a breadcrumb `nav[aria-label="Ruta"]` (`Inicio` → `/`; `Marcas` plain text with `aria-current="page"`), the hero, the counter row, the card grid, the tornillería note and the closing panel. Cards are rendered for the brands in `BRAND_PAGES` **that also exist in the live taxonomy** (matched on `customId`), in `BRAND_PAGES` insertion order (= comp order = product count desc). The hero intro is the static comp copy (`Seis marcas en almacén…`, UI IV); the counter row uses the live rendered count (`{N} marcas en almacén`). Zero renderable brands → `No hay marcas disponibles por ahora.`, no grid.
4. **Brand card.** An `<article>` with `<h2>` = config `name` (comp spelling, uppercase as designed — never the raw Strapi name), origin line, identity paragraph, `En almacén` kicker + stock paragraph, tag pills (`aria-hidden`-free plain text; a `<ul>` if the planner prefers), and a `Ver productos` CTA that is a `next/link` when `BRAND_PAGE_HREFS[customId]` is defined, otherwise a non-focusable `<span aria-disabled="true">` styled per the comp. No logo slot, no product-count pill (comp renders neither).
5. **Closing panel + note.** The note `La tornillería (…) es de línea, sin marca: búscala por categoría.` links to `CATEGORY_PAGE_HREFS.tornilleria`. The panel's `Buscar por categoría` links to `/categorias`; `Cotizar por WhatsApp` is `buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_BRANDS_MESSAGE)` (new constant), `target="_blank" rel="noopener noreferrer"`, and is **hidden** when `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset (never throws).
6. **SEO.** `generateMetadata` returns `BRANDS_TITLE` / `BRANDS_DESCRIPTION` (new `seo.constants.ts` entries), canonical `/marcas`, `robots: { index: true, follow: true }`; a 2-item `BreadcrumbList` JSON-LD via `toJsonLdHtml`; `sitemap.ts` lists `/marcas` as a base page (survives a taxonomy outage).
7. **Tests.** Header row + active state (`__tests__/shared/Header.test.tsx` pattern), page/feature rendering (cards, disabled CTA, empty state, WhatsApp gating), metadata + sitemap entry. Follow `docs/UNIT_TESTING_GUIDELINES.md`.

## Affected Files

**`src/app/`**
- `marcas/page.tsx` — Create: `generateMetadata`, `fetchBrands()`, config ∩ taxonomy, `BreadcrumbList` JSON-LD, one `<main>` around the feature.
- `sitemap.ts` — Modify: `/marcas` base-page entry.

**`src/features/`**
- `BrandsPage/BrandsPage.tsx` — Create: breadcrumb, hero, counter row, grid / empty state, tornillería note, closing panel.
- `BrandsPage/BrandCard.tsx` — Create: `<article>` card with `<h2>`, origin, identity, stock, tags, CTA.

**`src/shared/`**
- `ui/organisms/Header.tsx` — Modify: `allLabel` prop on `TaxonomyDropdown`; `isBrands` / `isBrandsIndex`; `Marcas` wiring.
- `ui/organisms/MobileMenu.tsx` — Modify: `allLabel` prop on `TaxonomyAccordionSection`; `isBrands` / `brandsAllHref` props; `Marcas` wiring.
- `constants/brand.constants.ts` — Create: `BRAND_PAGE_HREFS`, `BrandPageConfig`, `BRAND_PAGES`.
- `constants/whatsapp.constants.ts` — Modify: `WHATSAPP_BRANDS_MESSAGE`.
- `constants/seo.constants.ts` — Modify: `BRANDS_TITLE`, `BRANDS_DESCRIPTION`.

**`__tests__/`**
- `shared/Header.test.tsx` — Modify (AC1–AC2).
- `brands/BrandsPage.test.tsx` — Create (AC3–AC5).
- `seo/brands-metadata.test.ts` — Create (AC6).
- `seo/sitemap.test.ts` — Modify (AC6).

**Docs**
- `ai-skills/REPO_CONTEXT.md`, `CLAUDE.md` — Modify: route inventory, features table, header note, sitemap line, env-var line.

Untouched, deliberately: `global.lib.ts`, `global.queries.ts`, `global.types.ts` (no new query/type — `TaxonomyItem` suffices), `src/app/error.tsx` / `loading.tsx`, `src/app/layout.tsx`, `WhatsappPanel.tsx` (not rendered on `/marcas`, D4), `seo.utils.ts`, `DESIGN.md`, `useMediaQuery`.

---

## Phase 1 — Header Row + Active State

Delivers AC1 and AC2 and the header half of AC7. `/marcas` does not exist yet after this phase; the row 404s until Phase 2 — acceptable within the branch, never merged alone.

### Changes Required

**`src/shared/ui/organisms/Header.tsx`** — Modify

- `TaxonomyDropdownProps`: add `allLabel?: string` next to `allHref`. Inside the `allHref !== undefined` block replace the two hardcoded `Ver todas las categorías` strings (`textValue` and children) with `{allLabel}`. Keep `id="ver-todas"` and every class as is.
- `Header`, near `isCategoriesIndex` / `isCategories`:
  ```ts
  const isBrandsIndex = pathname === "/marcas"
  const isBrands = pathname.startsWith("/marcas")
  ```
- `Categorías` instance: add `allLabel="Ver todas las categorías"`. `Marcas` instance: add `allHref={isBrandsIndex ? undefined : "/marcas"}`, `allLabel="Ver todas las marcas"`, `isActiveRoute={isBrands}`. **No** `hrefs` prop on `Marcas` (rows stay disabled).
- `MobileMenu` call: add `isBrands={isBrands}` and `brandsAllHref={isBrandsIndex ? undefined : "/marcas"}`.

**`src/shared/ui/organisms/MobileMenu.tsx`** — Modify

- `MobileMenuProps`: add `isBrands: boolean`, `brandsAllHref?: string`.
- `TaxonomyAccordionSectionProps`: add `allLabel?: string`; the `allHref` `<li>` renders `{allLabel}` instead of the hardcoded string. Classes unchanged (row is already `min-h-11`).
- `categorias` section: `allLabel="Ver todas las categorías"`. `marcas` section: `allHref={brandsAllHref}`, `allLabel="Ver todas las marcas"`, `isActiveRoute={isBrands}`.

**`__tests__/shared/Header.test.tsx`** — Modify (per `docs/UNIT_TESTING_GUIDELINES.md`; the `allHref` row is already covered for categories — Verification I — so extend in place)

- `"opens the Categorías dropdown …"`: the `Marcas` menu now has `brands.length + 1` menuitems; the first `brands.length` stay `aria-disabled` without `href`, the last is `getByRole("menuitem", { name: "Ver todas las marcas" })` with `href="/marcas"` and not disabled.
- Add: selecting the `Ver todas las marcas` row closes the `Marcas` dropdown (`aria-expanded` back to `"false"`) — copy of the categories row test.
- Add: `usePathnameMock` → `"/marcas"`: `getByRole("button", { name: "Marcas (actual)" })`; no `Ver todas las marcas` menuitem after opening; `Categorías` button name is exactly `"Categorías"` and `Productos` has no `aria-current`. Also `"/marcas/weston"` → trigger `"Marcas (actual)"` **and** the row present (mirrors the `/categorias/tornilleria-fijacion` case).
- Add (mobile): open `Menú`, expand `Marcas`, the row is `within(dialog).getByRole("link", { name: "Ver todas las marcas" })` with `href="/marcas"`; clicking it removes the dialog. With pathname `"/marcas"` the link is absent and the accordion trigger is `"Marcas (actual)"`.
- Extend `"hides the Categorías/Marcas triggers when taxonomy is empty"`: `queryByRole("link", { name: "Ver todas las marcas" })` absent.

### Success Criteria

- **Automated:** `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm test -- __tests__/shared/Header.test.tsx`.
- **Dev-server validation:** `pnpm dev`, then
  - `GET /` → 200; HTML contains the `Marcas` trigger **without** ` (actual)`; `Productos` link has `aria-current="page"`; `Ver todas las categorías` still absent from SSR HTML (popover content is not SSR'd — no regression signal expected).
  - `GET /categorias` → 200; `Categorías` trigger with ` (actual)`, `Marcas` trigger without.
  - No server-log errors, no hydration warnings in the browser console.
  - Dropdown/accordion contents live in closed popovers/drawers and never SSR — `curl` cannot see the row; the test file is the proof.
- **Manual:** desktop ≥ 768px — open `Marcas`: last row `Ver todas las marcas` visually identical to the categories row (border-top, tint, arrow), click navigates to `/marcas` (404 until Phase 2) and the menu closes. Mobile < 768px — hamburger → `Marcas` accordion → row ≥ 44px tall, tap closes the drawer. Both themes.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `Header.tsx` `TaxonomyDropdown` | `Marcas` row href / not disabled, absent on `/marcas`, present on `/marcas/x`, closes on select, trigger `(actual)`; categories row label unchanged | `__tests__/shared/Header.test.tsx` |
| `MobileMenu.tsx` `TaxonomyAccordionSection` | `Marcas` row link, closes drawer, absent on `/marcas`, trigger `(actual)` | `__tests__/shared/Header.test.tsx` |
| Styling (underline, tint, 44px) | visual | manual pass |

---

## Phase 2 — Constants, Route, Feature

Delivers AC3, AC4, AC5, the `generateMetadata` / JSON-LD parts of AC6, and the page half of AC7. Phase 3 adds the sitemap entry, the metadata test and docs.

### Changes Required

**`src/shared/constants/brand.constants.ts`** — Create (shape copied from `category.constants.ts`)

```ts
export const BRAND_PAGE_HREFS: Record<string, string> = {}   // Story 2 fills this
export type BrandPageConfig = { name: string; origin: string; identity: string; stock: string; tags: string[] }
export const BRAND_PAGES: Record<string, BrandPageConfig> = { weston: {…}, "king-tony": {…}, bohrcraft: {…}, bondhus: {…}, precision: {…}, cleveland: {…} }
```
- Six entries, **in this order**, copy verbatim from the research doc's per-brand table (`name` uppercase as designed, `tags` split on the commas). Insertion order is the render order (D5) — add a one-line comment saying so and that the hero's `Seis` must be edited together with this map.

**`src/shared/constants/whatsapp.constants.ts`** — Modify, after `WHATSAPP_HEADER_MESSAGE`
- `export const WHATSAPP_BRANDS_MESSAGE = "Hola, busco una marca que no veo en el catálogo de Tehesa: "` (comp prefill, trailing space kept — `buildWhatsappUrl` encodes it).

**`src/shared/constants/seo.constants.ts`** — Modify, after `CATEGORIES_DESCRIPTION`
- `BRANDS_TITLE = "Marcas de Herramienta Industrial en Puebla | Tehesa"`, `BRANDS_DESCRIPTION = "Weston, King Tony, Bohrcraft, Bondhus, Precision Brand y Cleveland con existencia en Puebla. Explora el catálogo por marca y cotiza por WhatsApp."` (UI VI, verbatim).

**`src/features/BrandsPage/BrandCard.tsx`** — Create (server component, no directive)

- Prop type, exported for the page/tests: `export type BrandCardItem = BrandPageConfig & { customId: string }`.
- `export const BrandCard = ({ brand }: { brand: BrandCardItem })`; `const href = BRAND_PAGE_HREFS[brand.customId]`.
- `<article className="flex flex-col gap-3 rounded-[14px] border border-default-200 p-5 transition hover:-translate-y-0.5 hover:border-default-400 hover:shadow-md dark:border-[#1E3608] dark:hover:border-[#2E5210]">`
  - `<h2 className="text-lg font-bold">{brand.name}</h2>`; `<p className="text-sm text-muted">{brand.origin}</p>`; `<p>{brand.identity}</p>`.
  - `<p className="text-xs font-semibold text-[#23890C] dark:text-[#4DF527]">En almacén</p>` + `<p className="text-sm text-muted">{brand.stock}</p>`.
  - Tags: `<ul className="flex flex-wrap gap-1.5">{brand.tags.map(t => <li key={t} className="rounded-full border border-default-200 px-2 py-0.5 text-[11px] dark:border-[#1E3608]">{t}</li>)}</ul>` — plain text, no `aria-hidden`.
  - CTA, `mt-auto`, full width, `min-h-11`, `bg-[#4DF527] text-[#0D3401] hover:bg-[#3BD11A]` when `href !== undefined` → `<Link href={href}>`; otherwise `<span aria-disabled="true" className="… bg-default-100 text-muted …">` (no `href`, no `tabIndex`). Both: `Ver productos` + `<RiArrowRightLine aria-hidden="true" className="size-4" />`.
- No logo slot, no count pill, no `Intl.NumberFormat` (nothing numeric on the card).

**`src/features/BrandsPage/BrandsPage.tsx`** — Create (server component)

- `export const BrandsPage = ({ brands }: { brands: BrandCardItem[] })` — receives the already-intersected, ordered list. `whatsappUrl = WHATSAPP_NUMBER ? buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_BRANDS_MESSAGE) : null`.
- Breadcrumb: copy of `CategoriesPage`'s with `Marcas` as the `aria-current="page"` leaf.
- Hero (single column — no side panel, D4): kicker `Catálogo` (`text-[#23890C] dark:text-[#4DF527]`), `<h1 className="text-[28px] font-bold md:text-4xl lg:text-5xl">Explora el catálogo por marca</h1>`, `<p className="mt-3 text-muted">Seis marcas en almacén. Entra a la tuya y filtra por medida.</p>` (static, UI IV).
- Counter row: `<div className="flex items-center justify-between text-sm text-muted"><p>{count}</p><p>Ordenadas por fondo de catálogo</p></div>` where `count = brands.length === 1 ? "1 marca en almacén" : \`${new Intl.NumberFormat("es-MX").format(brands.length)} marcas en almacén\`` (pluralised like `CategoryPage`'s filtered count).
- `brands.length === 0` → `<p>No hay marcas disponibles por ahora.</p>`; else `<div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))] md:gap-5 md:[grid-template-columns:repeat(auto-fill,minmax(360px,1fr))]">{brands.map(b => <BrandCard key={b.customId} brand={b} />)}</div>`.
- Note: `<p className="text-sm text-muted">La tornillería (tornillos, tuercas, pijas, rondanas, varilla) es de línea, sin marca: <Link href={CATEGORY_PAGE_HREFS.tornilleria}>búscala por categoría</Link>.</p>` — the link wraps the trailing phrase; punctuation outside.
- Closing panel `<section className="flex flex-wrap items-center justify-between gap-6 rounded-[14px] bg-[#0F2001] p-6 text-white">`: `<div><h2>¿No ves tu marca?</h2><p>El catálogo también se busca por categoría o directo por medida. Y si lo que usas no está aquí, mándanos la clave por WhatsApp.</p></div>` + a `flex flex-wrap gap-3` button row: `<Link href="/categorias" className="min-h-11 … bg-[#4DF527] text-[#0D3401] hover:bg-[#3BD11A]">Buscar por categoría</Link>` and, only when `whatsappUrl !== null`, `<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="min-h-11 … border border-white/25 hover:bg-white/10">Cotizar por WhatsApp</a>`.
- Responsive is class-only (`md:`/`lg:`); no hooks.

**`src/app/marcas/page.tsx`** — Create (async server component, mirrors `categorias/page.tsx`)

```ts
export const generateMetadata = (): Metadata => ({
  title: BRANDS_TITLE, description: BRANDS_DESCRIPTION,
  alternates: { canonical: "/marcas" }, robots: { index: true, follow: true },
})
```
- Module-level `breadcrumbJsonLd`: 2 `ListItem`s — `Inicio` → `SITE_URL`, `Marcas` → `${SITE_URL}/marcas`.
- `export default async function BrandsRoute()`:
  1. `const live = await fetchBrands()` — no try/catch: rejection → root `error.tsx` (AC3 / research).
  2. `const liveIds = new Set(live.map((b) => b.customId))`; `const brands: BrandCardItem[] = Object.entries(BRAND_PAGES).filter(([id]) => liveIds.has(id)).map(([customId, config]) => ({ customId, ...config }))` — config order preserved, unconfigured (`libre`) and unpublished brands dropped (D2).
  3. Render `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdHtml(breadcrumbJsonLd) }} />` + `<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5"><BrandsPage brands={brands} /></main>`.
- `force-dynamic` inherited from the layout; no `ChangeThemeStoreProvider`.

**`__tests__/brands/BrandsPage.test.tsx`** — Create (jsdom; render via `@__tests__/test-utils`; mock `@/shared/constants/whatsapp.constants` with the getter pattern from `__tests__/categories/CategoriesPage.test.tsx`, exporting `WHATSAPP_BRANDS_MESSAGE` too)

- Fixture: three `BrandCardItem`s (e.g. `weston`, `king-tony`, `bohrcraft` pulled from `BRAND_PAGES`).
- Renders one `<article>` per brand in fixture order (`getAllByRole("article")`, first `<h2>` = `WESTON`), each with origin, identity, `En almacén`, stock text and one `<li>` per tag.
- CTA: every `Ver productos` is `aria-disabled="true"` and **not** a link (`queryAllByRole("link", { name: /Ver productos/ })` empty) while `BRAND_PAGE_HREFS` is empty; `container.querySelector('a[href="#"]')` is null.
- Counter: `3 marcas en almacén` + `Ordenadas por fondo de catálogo`; one-item fixture → `1 marca en almacén`. Hero `<h1>` `Explora el catálogo por marca`; breadcrumb `nav[aria-label="Ruta"]` has `Inicio` link → `/` and `Marcas` with `aria-current="page"`.
- Note link `búscala por categoría` → `CATEGORY_PAGE_HREFS.tornilleria`; panel `Buscar por categoría` → `/categorias`; `Cotizar por WhatsApp` `href === buildWhatsappUrl("5215500000000", WHATSAPP_BRANDS_MESSAGE)`, `target="_blank"`, `rel="noopener noreferrer"`. With the number `undefined`: no `Cotizar por WhatsApp`, `Buscar por categoría` still present, render does not throw.
- Empty list → `No hay marcas disponibles por ahora.`, `0 marcas en almacén`, zero articles, note + panel still rendered.

### Success Criteria

- **Automated:** `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm test -- __tests__/brands/BrandsPage.test.tsx`; `pnpm build` (new dynamic route).
- **Dev-server validation:** `pnpm dev`, then
  - `GET /marcas` → 200. `curl -s localhost:3000/marcas | grep -c "<article"` = **6**. Body contains `aria-label="Ruta"`, `aria-current="page">Marcas`, `Explora el catálogo por marca`, `Seis marcas en almacén`, `6 marcas en almacén`, `Ordenadas por fondo de catálogo`, exactly one `<main`, `"@type":"BreadcrumbList"`, `<title>` = `BRANDS_TITLE`, `rel="canonical"` ending `/marcas`, `<meta name="robots"` with `index, follow`.
  - Card content: `<h2>` order `WESTON`, `KING TONY`, `BOHRCRAFT`, `BONDHUS`, `PRECISION BRAND`, `CLEVELAND`; `grep -c "En almacén"` = 6; `grep -c "Ver productos"` = 6; `grep -c 'href="#"'` = 0; no `Marca Libre`, no `Clevaland`, no `productos</span>` pill.
  - Note + panel: `href="/categorias/tornilleria-fijacion"`, `¿No ves tu marca?`, `href="/categorias"` with `Buscar por categoría`, `Cotizar por WhatsApp` with `href="https://wa.me/`, `target="_blank"`, `rel="noopener noreferrer"`; `grep -c "wa.me"` counts the header links + exactly one panel link (no `WhatsappPanel` / `Cotizar ahora`).
  - Header on `/marcas`: `Marcas` trigger contains ` (actual)`; `Categorías` trigger and `Productos` do not (AC2 proof, now reachable).
  - `GET /` and `/categorias` still 200; `Marcas` trigger without ` (actual)`.
  - Degrade: restart with `NEXT_PUBLIC_WHATSAPP_NUMBER=` → `/marcas` 200, no `Cotizar por WhatsApp`, `Buscar por categoría` still present. Restart with `STRAPI_HOST=http://127.0.0.1:9` → `/marcas` renders the root `error.tsx` copy, header without `Marcas`, no crash (expect the known Turbopack dev-mode quirk noted in `ai-planning/categories-page.story.md` AC3 — parity with `/` is the pass condition).
  - No hydration warnings; no `CAT_ERR_*` on the regular routes.
- **Manual:** 390px — hero single column, one card per row, panel buttons wrap under the copy; 1440px — 3 cards per row (`minmax(360px)`); card hover lift/shadow/border; disabled CTA not focusable via Tab; both themes against the comps.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `brand.constants.ts` | six entries, order, `BRAND_PAGE_HREFS` empty | `curl` `<h2>` order + `BrandsPage.test.tsx` fixture |
| `src/app/marcas/page.tsx` | fetch, config ∩ taxonomy (`libre` dropped), JSON-LD, metadata, `<main>` | `pnpm build` + dev-server `curl` (async page — not rendered in Jest) |
| `BrandsPage.tsx` / `BrandCard.tsx` | breadcrumb, hero, pluralised counter, cards, disabled CTA, tags, note link, panel links, WhatsApp set/unset, empty state | `__tests__/brands/BrandsPage.test.tsx` |
| Responsive/theme | grid breakpoints, panel wrap, colours | manual pass |

---

## Phase 3 — Sitemap, Metadata Test, Docs

Completes AC6 and AC7.

### Changes Required

**`src/app/sitemap.ts`** — Modify, right after the `/categorias` push
- `basePages.push({ url: \`${SITE_URL}/marcas\` })` — in `basePages`, so the Strapi-failure branch keeps it.

**`__tests__/seo/sitemap.test.ts`** — Modify
- Both `basePageCount` expressions: `+ 1` more; assert `result.some((e) => e.url.endsWith("/marcas"))` in the success **and** the rejected branch.

**`__tests__/seo/brands-metadata.test.ts`** — Create (node env, copy of `categories-metadata.test.ts`)
- `generateMetadata()` from `@/app/marcas/page` → `title === BRANDS_TITLE` literal, `description === BRANDS_DESCRIPTION` literal, `alternates` `{ canonical: "/marcas" }`, `robots` `{ index: true, follow: true }`.

**`CLAUDE.md`** — Modify
- "What This Is" one-liner: `… category pages under \`/categorias\`, and a brands index at \`/marcas\``.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` bullet: add `/marcas`'s closing-panel `Cotizar por WhatsApp` button.

**`ai-skills/REPO_CONTEXT.md`** — Modify
- Route table (near line 66): add `marcas/page.tsx` row (server route, `generateMetadata` `index, follow`, `fetchBrands()` only, config ∩ taxonomy in `BRAND_PAGES` order, root `error.tsx`, `BreadcrumbList` JSON-LD, renders `BrandsPage`).
- Features table (near line 98): add `BrandsPage/` row (`BrandsPage.tsx`, `BrandCard.tsx`, `BRAND_PAGE_HREFS` gate, no `WhatsappPanel`).
- `ui/organisms` row (line 111): the `Marcas` dropdown/accordion now end with `Ver todas las marcas` → `/marcas` (hidden on `/marcas`, `isBrandsIndex` / `brandsAllHref`), trigger active on `/marcas*` (`isBrands`); row label is the `allLabel` prop.
- Sitemap lines (74, 233, 359): `/marcas` among base pages.
- Key files table (near 350–365): `src/app/marcas/page.tsx`, `src/features/BrandsPage/{BrandsPage,BrandCard}.tsx`, `src/shared/constants/brand.constants.ts`; `seo.constants.ts` row gains `BRANDS_TITLE`/`BRANDS_DESCRIPTION`; `whatsapp.constants.ts` gains `WHATSAPP_BRANDS_MESSAGE`.
- Bump **Last Updated** to 2026-09-17.

### Success Criteria

- **Automated:** `pnpm test` (full run — AC7 requires it green); `pnpm lint`; `pnpm exec tsc --noEmit`; `pnpm build`.
- **Dev-server validation:** `pnpm dev`, then
  - `curl -s localhost:3000/sitemap.xml | grep -c "/marcas<"` = 1 (the `?mode=brand` entries are untouched and still present).
  - With `STRAPI_HOST=http://127.0.0.1:9`: `/sitemap.xml` still 200 and still contains `/marcas`.
  - `GET /marcas` metadata checks from Phase 2 unchanged.
- **Manual:** none.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/app/sitemap.ts` | `/marcas` in both branches | `__tests__/seo/sitemap.test.ts` + `curl /sitemap.xml` |
| `src/app/marcas/page.tsx` `generateMetadata` | title/description/canonical/robots | `__tests__/seo/brands-metadata.test.ts` + `curl` `<head>` |
| Docs | route inventory, feature, header note, sitemap | read-through |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 – Header entry point | Phase 1 | `GET /` 200 (row lives in a closed popover/drawer — not in SSR HTML) | Cannot validate | Proven by `__tests__/shared/Header.test.tsx` (row href, not disabled, absent on `/marcas`, closes dropdown/drawer, absent with empty taxonomy) + manual open/click at ≥768px and <768px, both themes. |
| AC2 – Active state | Phase 1 (code), Phase 2 (route exists) | `GET /marcas` 200 contains `Marcas` trigger with ` (actual)`, `Categorías` trigger without, `Productos` without `aria-current`; `GET /categorias` has ` (actual)` only on `Categorías` | Validated | `/marcas` renders with `Marcas (actual)` text present in the SSR payload; `/` and `/categorias` still 200. Underline/tint styling deferred to manual pass. |
| AC3 – Page structure | Phase 2 | `GET /marcas` 200; `grep -c "<article"` = 6; contains `aria-label="Ruta"`, `aria-current="page">Marcas`, `Explora el catálogo por marca`, `Seis marcas en almacén`, `6 marcas en almacén`, `Ordenadas por fondo de catálogo`, one `<main`; no `Marca Libre`; `STRAPI_HOST` unreachable → root `error.tsx` | Validated | `curl` confirmed 6 `<article>`, breadcrumb, hero, counter, one `<main`, `BreadcrumbList` JSON-LD. `Marca Libre`/`Clevaland` appear only inside the serialized RSC flight payload (fetchBrands() result), never in visible card text/`<h2>` — same streaming artifact `/categorias` has. `STRAPI_HOST` unreachable → 200 with root `error.tsx` copy, no crash (documented Turbopack dev-mode quirk, parity with `/`). Empty-state (0 brands) covered by `BrandsPage.test.tsx`. |
| AC4 – Brand card | Phase 2 | `GET /marcas`: `<h2>` order `WESTON … CLEVELAND`, no `Clevaland`; `En almacén` × 6; `Ver productos` × 6; `href="#"` × 0; no `productos</span>` pill | Validated | `<h2>` order confirmed via `grep -o`: WESTON, KING TONY, BOHRCRAFT, BONDHUS, PRECISION BRAND, CLEVELAND. `href="#"` count 0; no count pill. Tags as `<li>`, CTA not focusable, disabled branch → `BrandsPage.test.tsx`; enabled-CTA link branch deferred to Story 2 (`BRAND_PAGE_HREFS` still empty). |
| AC5 – Closing panel + note | Phase 2 | `GET /marcas` contains `href="/categorias/tornilleria-fijacion"`, `¿No ves tu marca?`, `Buscar por categoría` → `href="/categorias"`, `Cotizar por WhatsApp` with `wa.me` + `target="_blank"` + `rel="noopener noreferrer"`; `NEXT_PUBLIC_WHATSAPP_NUMBER=` → button absent, 200 | Validated | All markers present; with `NEXT_PUBLIC_WHATSAPP_NUMBER=` unset the CTA is absent and `/marcas` still 200 with `Buscar por categoría` present. Exact prefill text vs `WHATSAPP_BRANDS_MESSAGE` → `BrandsPage.test.tsx`. |
| AC6 – SEO | Phase 2 (metadata, JSON-LD), Phase 3 (sitemap) | `GET /marcas` `<title>` = `BRANDS_TITLE`, canonical `/marcas`, robots `index, follow`, `"@type":"BreadcrumbList"`; `GET /sitemap.xml` contains `/marcas` with Strapi up and down | Validated | `curl /sitemap.xml` shows exactly one `/marcas` entry, unaffected `?mode=brand` entries (7); with `STRAPI_HOST` unreachable `/sitemap.xml` still 200 and still contains `/marcas`. `GET /marcas` metadata unchanged from Phase 2. `seo/brands-metadata.test.ts` covers `generateMetadata()` literally. |
| AC7 – Tests | Phases 1–3 | `pnpm test` green (not a dev-server check) | Validated | `pnpm test`: 46 suites, 466 passed / 1 pre-existing skip, 0 failed — includes `Header.test.tsx`, `brands/BrandsPage.test.tsx`, `seo/brands-metadata.test.ts`, `seo/sitemap.test.ts`. |

## Cross-Cutting Concerns

- **Server/client boundary:** `marcas/page.tsx`, `BrandsPage.tsx`, `BrandCard.tsx` are server components (no hooks, no directive); `Header`/`MobileMenu` stay `"use client"` and never import `global.lib.ts`. `NEXT_PUBLIC_WHATSAPP_NUMBER` is readable server-side.
- **Strapi contract:** only `GET_BRANDS` (`{ name, customId }`), already in use. No products, no counts, no new query — this page cannot regress catalog Strapi load.
- **Error boundaries:** `fetchBrands()` failure → root `error.tsx` ("productos" copy, accepted); unset WhatsApp number → button hidden; empty taxonomy → empty-state line. Nothing throws at render.
- **Trust boundary:** card text is frontend config, never Strapi strings; the JSON-LD is static but still goes through `toJsonLdHtml`.
- **Responsive/theme:** class-only (`md:`/`lg:`), `dark:` variants from the existing `/categorias` palette; header breakpoint stays `md`.
- **Env:** `STRAPI_HOST`/`STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL` (canonical/sitemap/JSON-LD `item` URLs).

## Open Questions / Out of Scope

- **Strapi III — `Clevaland` typo:** backend judgment; invisible on `/marcas` (config name wins, D8), still exposed by `/?mode=brand&brand=Clevaland` and its sitemap entry. Untouched.
- **Root `error.tsx` copy says "productos"** on a `fetchBrands()` failure. The categories story later added a route-scoped `error.tsx`/`loading.tsx` on user request; do the same for `/marcas` only if asked — not in this plan.
- **`?mode=brand` sitemap entries** for all seven brands (incl. `libre`, `Clevaland`) stay; Story 2 decides their fate.
- **Out of scope (research):** `/marcas/[slug]`, `fetchAllProductsByBrand`, enabling card CTAs / header brand rows (Story 2); brand logos; per-brand count pills or live ordering (D5); whole-card link (D6); redirecting `/?mode=brand` URLs; the comp's stale inline header; PNG export of comps into `comps/brands-index-page/` (`/check-design`).
