# Plan: Categories Page (`/categorias`) + Header Entry Point

**Source research:** `ai-research/categories-page.story.md` (2026-09-14, branch `feat/add-categories-page`).
**Sign-off status:** no explicit sign-off line, but every open question is answered (Strapi I–II, Catalog I, UI I–V, Theme I, Verification I) and D1–D8 are recorded as decided with the user on 2026-09-14. Strapi III is `pending` but explicitly "not needed for this story". Treated as signed off — same basis as `header-navigation.story.md`. **Confirm before `/implement`.**
**Plan date:** 2026-09-14.

## Assumptions

- **Dropdown row = react-aria `MenuItem` with `href`.** `Dropdown.Item href="/categorias"` renders a real `<a href>` inside the menu (keyboard-reachable, closes the menu on select — React Aria's default for link items). Without a `RouterProvider` this is a full-page navigation; the research accepts that and Verification I rules out `useRouter`, so no `RouterProvider`/`ClientRouter` is added. The mobile accordion row is a plain `next/link` (client-side), same as `MobileMenu`'s `Productos`.
- **Active-state indicator = visually hidden `" (actual)"` suffix**, the pattern the header-navigation story settled on after confirming react-aria strips `aria-*` from `MenuItem`/`Button`. On `/categorias` the desktop `Categorías` trigger and the mobile `Categorías` accordion trigger get the underline/tint classes **and** an `sr-only` ` (actual)` span, so tests can assert `name: "Categorías (actual)"` without asserting classes.
- **One boolean drives both header behaviors:** `isCategories = pathname === "/categorias"` → underline/highlight on, `Ver todas las categorías` row off (D8, UI V). The `/categorias/<slug>` story splits this into `startsWith` for the active state when those routes exist.
- **Count query = one aliased request with GraphQL variables** (`$id0…$idN`), not string-interpolated `customId`s — Strapi strings never land in a query document body. Aliases `c0…cN` map back by index.
- **Two sequential Strapi round trips on `/categorias`** (`fetchCategories` → `fetchCategoryProductCounts(customIds)`); the second depends on the first. Accepted for a 16-row taxonomy.
- **`GET_CATEGORIES` stays unpaginated** (Strapi II: "not required for this story"). Listed under Out of scope.
- **Root `src/app/error.tsx` is reused unchanged** for a `fetchCategories()` failure on `/categorias`, even though its copy says "No pudimos cargar los productos" (AC3: "propagates to `src/app/error.tsx` like `/` does").
- **Comps:** `comps/categories-page/` does not exist yet; the implementer references the Claude Design project URL in the research doc (or runs `/check-design` first — design handoff, not part of this plan).
- Env: `.env.local` has `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. Dev-server checks assume `pnpm dev` on `http://localhost:3000` and the live taxonomy of 16 published categories (counts per Strapi I; `Abrasivos` = 0).

## Acceptance Criteria

1. **Header entry point.** On every route and at every breakpoint, the `Categorías` dropdown (≥ `md`) and the mobile menu's `Categorías` accordion end with a `Ver todas las categorías` row that is a real `next/link` anchor to `/categorias`, separated from the disabled items above it (border-top + tinted background per the comp), in light and dark. Selecting it closes the dropdown / drawer. The row is **not rendered while on `/categorias`** (UI V). The existing category items stay `isDisabled`. When the taxonomy is empty (Strapi failure) the dropdown/accordion is not rendered at all — unchanged from today — so the row is not rendered either.
2. **Active state.** On `/categorias` the desktop `Categorías` trigger carries the same active underline (`border-b-2 border-[#4DF527]`) that `Productos` carries on `/`, and `Productos` is not underlined. In the mobile menu the `Categorías` accordion trigger is highlighted (tint + inset green bar per `header.dc.html`'s active-row treatment) and `Productos` loses `aria-current`.
3. **Page structure.** `GET /categorias` is a server-rendered route (`src/app/categorias/page.tsx`) that fetches `fetchCategories()` (plus the per-category count query, Strapi contract I) and renders, inside one `<main>`: a breadcrumb `nav[aria-label="Ruta"]` (`Inicio` links to `/`; `Categorías` is plain text with `aria-current="page"`), the hero (kicker, `<h1>`, paragraph whose category count is the live `categories.length`), the WhatsApp panel (`Cotizar ahora` → `buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_HEADER_MESSAGE)`, `target="_blank" rel="noopener noreferrer"`; the whole panel is hidden when `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset), a `N categorías` counter, and one `<article>` card per category in a `repeat(auto-fill, minmax(270px, 1fr))` grid, sorted A→Z by name on the frontend (Catalog behavior I). Zero categories renders an empty state (`No hay categorías disponibles por ahora.`) instead of an empty grid; a Strapi failure propagates to `src/app/error.tsx` like `/` does.
4. **Card anatomy.** Each card shows the initial-letter badge (`aria-hidden`), the product-count pill (`N productos`, `es-MX` grouping via `Intl.NumberFormat`, sourced from the aliased `products_connection` query in Strapi contract I; the pill is hidden when that query fails), the category name as an `<h2>`, and a `Ver categoría` CTA rendered as a non-focusable `<span aria-disabled="true">` (never `href="#"`) until that category's page exists. Cards render name + count only: no description, no tags, no image placeholder.
5. **SEO + resilience + tests.** `generateMetadata` returns a literal title/description (new `CATEGORIES_TITLE` / `CATEGORIES_DESCRIPTION` in `seo.constants.ts`), canonical `/categorias`, `robots: index, follow`; `sitemap.ts` lists `/categorias` among the base pages (so it survives a Strapi outage); the page renders a `BreadcrumbList` JSON-LD via `toJsonLdHtml`. `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, and `pnpm test` pass; new tests cover AC1–AC2 (row href, row absent on `/categorias`, dropdown/drawer close on select, active underline on `/categorias`) and AC3–AC4 (card count, disabled CTA, empty state, WhatsApp panel hidden when the number is unset) plus the sitemap entry.

## Affected Files

**`src/app/`**
- `categorias/page.tsx` — Create: `generateMetadata`, `fetchCategories()` + counts with degrade-on-failure, A→Z sort, `BreadcrumbList` JSON-LD, one `<main>` around the feature.
- `sitemap.ts` — Modify: `/categorias` base-page entry.

**`src/features/`**
- `CategoriesPage/CategoriesPage.tsx` — Create: breadcrumb, hero + WhatsApp panel, counter, grid / empty state.
- `CategoriesPage/CategoryCard.tsx` — Create: `<article>` card with badge, pill, `<h2>`, disabled CTA.

**`src/shared/`**
- `ui/organisms/Header.tsx` — Modify: `TaxonomyDropdown` footer row + active trigger; `isCategories`.
- `ui/organisms/MobileMenu.tsx` — Modify: `TaxonomyAccordionSection` footer row + active trigger.
- `queries/global.queries.ts` — Modify: `buildCategoryProductCountsQuery(count)`.
- `lib/global.lib.ts` — Modify: `fetchCategoryProductCounts(customIds)`.
- `types/global.types.ts` — Modify: `FetchCategoryProductCountsResponse`, `CategoryWithCount`.
- `constants/seo.constants.ts` — Modify: `CATEGORIES_TITLE`, `CATEGORIES_DESCRIPTION`.

**`__tests__/`**
- `shared/Header.test.tsx` — Modify (AC1–AC2).
- `shared/global.lib.test.ts` — Modify (count adapter).
- `categories/CategoriesPage.test.tsx` — Create (AC3–AC4).
- `seo/categories-metadata.test.ts` — Create (AC5).
- `seo/sitemap.test.ts` — Modify (AC5).

**Docs**
- `ai-skills/REPO_CONTEXT.md`, `CLAUDE.md` — Modify: route inventory, adapter list, header description.

Untouched, deliberately: `src/app/error.tsx`, `src/app/layout.tsx`, `GET_CATEGORIES`, `seo.utils.ts` (the breadcrumb node is static — two literal crumbs — so no builder is added), `DESIGN.md`, `useMediaQuery`.

---

## Phase 1 — Header Row + Active State

Delivers AC1 and AC2. `/categorias` does not exist yet after this phase; the row 404s until Phase 2 — acceptable within the branch, never merged alone.

### Changes Required

**`src/shared/ui/organisms/Header.tsx`** — Modify

- `TaxonomyDropdownProps`: add `allHref?: string` and `isActiveRoute?: boolean`.
- `TaxonomyDropdown`:
  - Trigger `Button`: append `${isActiveRoute ? "border-b-2 border-[#4DF527]" : ""}` to its className (same classes as `Productos`) and render `{isActiveRoute && <span className="sr-only"> (actual)</span>}` after the label, before the chevron.
  - After the `items.map(...)` inside `Dropdown.Menu`, when `allHref !== undefined` render one more `Dropdown.Item` — `id="ver-todas"`, `href={allHref}`, `textValue="Ver todas las categorías"`, **no** `isDisabled` — with children `Ver todas las categorías` + `<RiArrowRightLine aria-hidden="true" className="size-4" />` (import from `@remixicon/react`). Classes: `min-h-11 mt-1 flex items-center justify-between border-t border-default-200 bg-[#F5FFEF] font-medium text-[#125D03] dark:border-[#1E3608] dark:bg-[#12250A] dark:text-[#4DF527] dark:hover:text-[#B4FE99]`. Edge: react-aria strips `aria-*` from `MenuItem` — don't put `aria-current` here; the row needs none.
- `Header`: `const isCategories = pathname === "/categorias"`. Pass to the `Categorías` instance only: `allHref={isCategories ? undefined : "/categorias"}` and `isActiveRoute={isCategories}`. `Marcas` gets neither. Pass `isCategories` to `MobileMenu`.

**`src/shared/ui/organisms/MobileMenu.tsx`** — Modify

- `MobileMenuProps`: add `isCategories: boolean`.
- `TaxonomyAccordionSectionProps`: add `allHref?: string`, `isActiveRoute?: boolean`, `onNavigate: () => void`.
- `TaxonomyAccordionSection`:
  - `Accordion.Trigger`: when `isActiveRoute`, add `bg-[#F5FFEF] text-[#125D03] shadow-[inset_3px_0_0_#4DF527] dark:bg-[#16300A] dark:text-[#B4FE99]` and render `<span className="sr-only"> (actual)</span>` after the label.
  - After the `items.map(...)` `<li>`s, when `allHref !== undefined`: `<li><Link href={allHref} onClick={onNavigate} className="mt-1 flex min-h-11 items-center justify-between border-t border-default-200 bg-[#F5FFEF] px-1 font-medium text-[#125D03] dark:border-[#1E3608] dark:bg-[#12250A] dark:text-[#4DF527]">Ver todas las categorías <RiArrowRightLine aria-hidden="true" className="size-4" /></Link></li>`.
- `MobileMenu`: pass `onNavigate={state.close}` to both sections; to the `categorias` section also `allHref={isCategories ? undefined : "/categorias"}` and `isActiveRoute={isCategories}`. `Productos` already drops `aria-current` off `/` — no change.

**`__tests__/shared/Header.test.tsx`** — Modify (per `docs/UNIT_TESTING_GUIDELINES.md`)

- Update `"opens the Categorías dropdown listing every item as disabled"`: the menu now has `categories.length + 1` menuitems; assert the first `categories.length` are `aria-disabled` without `href`, and the last is the `Ver todas las categorías` menuitem with `href="/categorias"`, not disabled. Also assert the `Marcas` menu has exactly `brands.length` items (no row).
- Add: selecting the row closes the dropdown (`aria-expanded` back to `"false"`). If jsdom logs `Not implemented: navigation`, add a capturing `click` listener that calls `preventDefault()` for that test only.
- Add: with `usePathnameMock` → `"/categorias"`, the dropdown has no `Ver todas las categorías` item; the trigger's accessible name is `"Categorías (actual)"`; `Productos` has no `aria-current`. On `"/"` the trigger name is exactly `"Categorías"`.
- Add: mobile — open `Menú`, expand `Categorías`, the row is `getByRole("link", { name: "Ver todas las categorías" })` with `href="/categorias"`; clicking it removes the dialog. With pathname `"/categorias"` the link is absent and the accordion trigger is named `"Categorías (actual)"`.
- Existing empty-taxonomy test already proves the row vanishes with the trigger; extend its assertion with `queryByRole("link", { name: "Ver todas las categorías" })` absent.

### Success Criteria

- **Automated:** `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm test -- __tests__/shared/Header.test.tsx`.
- **Dev-server validation:** `pnpm dev`, then
  - `GET /` → 200; HTML contains `Categorías` trigger **without** ` (actual)`; `Productos` link with `aria-current="page"`.
  - `GET /cotizar` → 200; no ` (actual)` anywhere (only `/categorias` gets it — which is still a 404 in this phase; that's expected).
  - No server-log errors, no hydration warnings in the browser console.
  - Dropdown/accordion contents are inside closed popovers/drawers and never SSR'd — `curl` cannot see the row; the test file is the proof.
- **Manual:** desktop ≥ 768px — open `Categorías`: last row visually separated (border-top, tint), arrow icon, hover/focus-visible ring, click navigates to `/categorias` (404 until Phase 2) and the menu closes; `Marcas` has no row. Mobile < 768px — hamburger → `Categorías` accordion → row ≥ 44px tall, tap closes the drawer. Both themes.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `Header.tsx` `TaxonomyDropdown` | footer row href / not disabled, absent on `/categorias`, closes on select, trigger `(actual)` | `__tests__/shared/Header.test.tsx` |
| `MobileMenu.tsx` `TaxonomyAccordionSection` | row link, closes drawer, absent on `/categorias`, trigger `(actual)`, `Productos` no `aria-current` | `__tests__/shared/Header.test.tsx` |
| Styling (underline, tint, inset bar, 44px) | visual | manual pass |

---

## Phase 2 — Count Query, Route, Feature

Delivers AC3 and AC4, plus the `generateMetadata` / JSON-LD parts of AC5 (the route is created with them; Phase 3 adds the sitemap entry, metadata tests, and docs).

### Changes Required

**`src/shared/types/global.types.ts`** — Modify, near `FetchCategoriesResponse`

```ts
export type FetchCategoryProductCountsResponse = Record<string, { pageInfo: { total: number } }>
export type CategoryWithCount = TaxonomyItem & { productCount: number | null }
```

**`src/shared/queries/global.queries.ts`** — Modify, after `GET_CATEGORIES`

- `export const buildCategoryProductCountsQuery = (count: number): DocumentNode` — builds a string and returns `gql(string)`:
  - variable definitions `$id0: String!, …, $id{count-1}: String!`
  - one field per index: `c{i}: products_connection(filters: { category: { customId: { eq: $id{i} } } }, pagination: { pageSize: 1 }) { pageInfo { total } }`
  - operation name `CategoryProductCounts`.
- Edge: `count` must be ≥ 1 (an empty selection set is invalid GraphQL) — the adapter guards this, the builder does not.

**`src/shared/lib/global.lib.ts`** — Modify, after `fetchCategories`

```ts
export const fetchCategoryProductCounts = async (customIds: string[]): Promise<number[]>
```
- `customIds.length === 0` → `return []` without a query (same guard as `fetchVariantsByIds`).
- `client.query<FetchCategoryProductCountsResponse>({ query: buildCategoryProductCountsQuery(customIds.length), variables: Object.fromEntries(customIds.map((id, i) => [`id${i}`, id])) })`.
- Return `customIds.map((_, i) => res.data[`c${i}`].pageInfo.total)` — **no** `?? 0`: a missing alias is a contract break that must throw (the page then hides every pill) rather than become a fake `0`. No local try/catch (adapter contract in the file's JSDoc; add the function to that list).

**`src/shared/constants/seo.constants.ts`** — Modify, after `QUOTE_DESCRIPTION`

- `CATEGORIES_TITLE = "Categorías de herramienta industrial | Tehesa"`, `CATEGORIES_DESCRIPTION = "Todas las categorías del catálogo de Tehesa en Puebla: tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. Cotiza por WhatsApp."` (copy is the planner's; adjust wording freely, keep it literal).

**`src/features/CategoriesPage/CategoryCard.tsx`** — Create (server component, no directive)

- `const countFormatter = new Intl.NumberFormat("es-MX")` at module scope (not `formatNumberToCurrency`).
- `export const CategoryCard = ({ category }: { category: CategoryWithCount })` → `<article className="flex flex-col gap-3 rounded-[14px] border border-default-200 p-5 transition hover:border-default-400 hover:shadow-md dark:border-[#1E3608] dark:hover:border-[#2E5210]">`
  - top row: `<span aria-hidden="true">{category.name.charAt(0).toUpperCase()}</span>` badge + `{category.productCount !== null && <span>{countFormatter.format(category.productCount)} productos</span>}` pill. `0` renders `0 productos`.
  - `<h2 className="text-lg font-semibold [text-wrap:pretty]">{category.name}</h2>` (57-char names must wrap, never truncate).
  - `<span aria-disabled="true" className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-muted">Ver categoría <RiArrowRightLine aria-hidden="true" className="size-4" /></span>` — no `href`, no `tabIndex`.

**`src/features/CategoriesPage/CategoriesPage.tsx`** — Create (server component)

- `export const CategoriesPage = ({ categories }: { categories: CategoryWithCount[] })` — receives the already-sorted list; computes `whatsappUrl` per render exactly like `Header` (`WHATSAPP_NUMBER ? buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_HEADER_MESSAGE) : null`).
- Breadcrumb: `<nav aria-label="Ruta"><ol className="flex gap-2 text-sm"><li><Link href="/">Inicio</Link></li><li aria-hidden="true">/</li><li><span aria-current="page">Categorías</span></li></ol></nav>`.
- Hero `<section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">`:
  - left: `<p>` kicker `Catálogo` (`text-[#23890C]` / `dark:text-[#4DF527]`), `<h1 className="text-[28px] font-bold md:text-4xl lg:text-5xl">Catálogo de herramienta industrial</h1>`, `<p>Tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. {categories.length} categorías con existencia en Puebla. Cotiza por WhatsApp.</p>`.
  - right, only when `whatsappUrl !== null`: `<aside className="rounded-[14px] bg-[#0F2001] p-6 text-white">` with `<h2>Cotiza por WhatsApp</h2>`, `<p>Envía tu lista de medidas y cantidades; confirmamos existencia el mismo día.</p>`, `<a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="… bg-[#4DF527] text-[#0D3401] min-h-11 …">Cotizar ahora</a>`.
- Counter `<p className="text-sm text-muted">{categories.length} categorías</p>`.
- `categories.length === 0` → `<p>No hay categorías disponibles por ahora.</p>`; otherwise `<div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(270px,1fr))]">{categories.map(c => <CategoryCard key={c.customId} category={c} />)}</div>`.
- Responsive is class-only (`md:`/`lg:`); no `useMediaQuery`.

**`src/app/categorias/page.tsx`** — Create (async server component, mirrors `cotizar/page.tsx` + `page.tsx`)

```ts
export const generateMetadata = (): Metadata => ({
  title: CATEGORIES_TITLE, description: CATEGORIES_DESCRIPTION,
  alternates: { canonical: "/categorias" }, robots: { index: true, follow: true },
})
```
- Module-level `const breadcrumbJsonLd = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ ListItem 1 "Inicio" → SITE_URL }, { ListItem 2 "Categorías" → `${SITE_URL}/categorias` }] }`.
- `export default async function CategoriesRoute()`:
  1. `const categories = await fetchCategories()` — no try/catch: rejection → `src/app/error.tsx` (AC3).
  2. `let counts: number[] | null = null; try { counts = await fetchCategoryProductCounts(categories.map(c => c.customId)) } catch (error) { console.warn("categorias: failed to fetch product counts, rendering cards without the pill", error) }`.
  3. `const items: CategoryWithCount[] = categories.map((c, i) => ({ ...c, productCount: counts?.[i] ?? null })).sort((a, b) => a.name.localeCompare(b.name, "es"))` (D6; `Extracción`/`Perforación`/`Sujeción` must sort by accent-insensitive base letter).
  4. Render `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdHtml(breadcrumbJsonLd) }} />` + `<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5"><CategoriesPage categories={items} /></main>`.
- No `ChangeThemeStoreProvider` (unused on `/cotizar` too); `force-dynamic` inherited from the layout.

**`__tests__/categories/CategoriesPage.test.tsx`** — Create (jsdom; render via `@__tests__/test-utils`; mock `@/shared/constants/whatsapp.constants` with the getter pattern from `Header.test.tsx`)

- Renders one `<article>` per category (`getAllByRole("article")`), each with an `<h2>` name, and `Ver categoría` as `aria-disabled="true"` text that is **not** a link.
- Pill: `{ productCount: 1234 }` → text `1,234 productos`; `{ productCount: 0 }` → `0 productos`; `{ productCount: null }` → no `productos` text in that card.
- Hero/counter show `3 categorías` for three items; breadcrumb `nav[aria-label="Ruta"]` has `Inicio` link → `/` and `Categorías` with `aria-current="page"`.
- WhatsApp panel: `Cotizar ahora` link `href === buildWhatsappUrl("5215500000000", WHATSAPP_HEADER_MESSAGE)`, `target="_blank"`, `rel="noopener noreferrer"`; with the number `undefined`, no `Cotizar ahora` and no `Cotiza por WhatsApp` heading, render does not throw.
- Empty list → `No hay categorías disponibles por ahora.` and zero articles.

**`__tests__/shared/global.lib.test.ts`** — Modify

- `fetchCategoryProductCounts(["a", "b"])`: `queryMock` called once with `variables: { id0: "a", id1: "b" }`, resolves `[7, 0]` from `{ c0: { pageInfo: { total: 7 } }, c1: { pageInfo: { total: 0 } } }`; `fetchCategoryProductCounts([])` resolves `[]` and never calls `queryMock`.

### Success Criteria

- **Automated:** `pnpm exec tsc --noEmit`; `pnpm lint`; `pnpm test -- __tests__/categories/CategoriesPage.test.tsx __tests__/shared/global.lib.test.ts`; `pnpm build` (new dynamic route + server/client wiring).
- **Dev-server validation:** `pnpm dev`, then
  - `GET /categorias` → 200. `curl -s localhost:3000/categorias | grep -c "<article"` = **16**. Body contains `aria-label="Ruta"`, `aria-current="page">Categorías`, `<h1`, `16 categorías con existencia`, `>16 categorías<`, `Cotizar ahora` with `href="https://wa.me/`, `target="_blank"`, exactly one `<main`, `"@type":"BreadcrumbList"`, `<title>` = `CATEGORIES_TITLE`, `rel="canonical"` ending `/categorias`, `<meta name="robots"` with `index, follow`.
  - `grep -c "productos</span>"` = 16 and `grep -c "0 productos"` ≥ 1 (Abrasivos); `grep -c 'Ver categoría'` = 16; `grep -c 'href="#"'` = 0.
  - Ordering: first `<h2>` is `Abrasivos`, last is `Tornillería`; `Extracción …` precedes `Herrajes …`.
  - Header on `/categorias`: `Categorías` trigger contains ` (actual)`; `Productos` without `aria-current` (AC2 proof, now reachable).
  - `GET /` and `/cotizar` still 200, no ` (actual)`.
  - Degrade: restart with `NEXT_PUBLIC_WHATSAPP_NUMBER=` → `/categorias` has no `Cotizar ahora` / `Cotiza por WhatsApp`, still 200. Restart with `STRAPI_HOST=http://127.0.0.1:9` → `/categorias` 200 rendering `error.tsx` copy (`No pudimos cargar`), header without `Categorías`, one `console.warn`/error in the server log, no crash.
  - No hydration warnings; no `CAT_ERR_*` on the regular routes.
- **Manual:** 390px — hero single column, panel below the intro, cards one per row; 1440px — hero two columns (panel right), 4 cards per row; card hover shadow/border; both themes; long name (`Herramientas de diagnóstico…`) wraps without truncation.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `global.queries.ts` / `global.lib.ts` | variables shape, index mapping, empty guard, no `?? 0` | `__tests__/shared/global.lib.test.ts` + `curl` pill counts |
| `src/app/categorias/page.tsx` | fetch, degrade-on-count-failure, sort, JSON-LD, `<main>` | `pnpm build` + dev-server `curl` (async page — not rendered in Jest) |
| `CategoriesPage.tsx` / `CategoryCard.tsx` | breadcrumb, counts, pill states, disabled CTA, empty state, WhatsApp panel set/unset | `__tests__/categories/CategoriesPage.test.tsx` |
| Responsive/theme | 1-col vs 2-col hero, grid, colours | manual pass |

---

## Phase 3 — Sitemap, Metadata Tests, Docs

Completes AC5.

### Changes Required

**`src/app/sitemap.ts`** — Modify, inside `sitemap()` after the base-page loop
- `basePages.push({ url: `${SITE_URL}/categorias` })` — in `basePages`, so the Strapi-failure branch keeps it.

**`__tests__/seo/sitemap.test.ts`** — Modify
- Both tests: expected length `+ 1`; assert `result.some((e) => e.url.endsWith("/categorias"))` in the success **and** the rejected branch.

**`__tests__/seo/categories-metadata.test.ts`** — Create (node env, mirrors `quote-metadata.test.ts`)
- `generateMetadata()` → `title === CATEGORIES_TITLE`, `description === CATEGORIES_DESCRIPTION`, `alternates` `{ canonical: "/categorias" }`, `robots` `{ index: true, follow: true }`.

**`CLAUDE.md`** — Modify
- Architecture tree + Directory Layout table: add `src/app/categorias/page.tsx` (server route, `index, follow`, `fetchCategories` + `fetchCategoryProductCounts`, degrade to no pill) and `src/features/CategoriesPage/`.
- `src/shared/ui/organisms` row: mention the `Ver todas las categorías` row and the `(actual)` active state on `/categorias`.
- SEO Surface: `/categorias` is a base page in the sitemap.

**`ai-skills/REPO_CONTEXT.md`** — Modify
- Page routes paragraph (line ~49) and the route table (~65): add `categorias/page.tsx`.
- Adapter list (~126, ~216): add `fetchCategoryProductCounts` + `buildCategoryProductCountsQuery` (aliased `products_connection`, variables, index-mapped, throws on missing alias).
- Sitemap paragraph (~224): `/categorias` among base pages.
- Features table: `CategoriesPage/`.
- Bump **Last Updated** to 2026-09-14.

### Success Criteria

- **Automated:** `pnpm test` (full run — AC5 requires it green); `pnpm lint`; `pnpm exec tsc --noEmit`; `pnpm build`.
- **Dev-server validation:** `pnpm dev`, then
  - `curl -s localhost:3000/sitemap.xml | grep -c "/categorias"` = 1 (and the 7 base pages + category/brand entries still present).
  - With `STRAPI_HOST=http://127.0.0.1:9`: `/sitemap.xml` still 200 and still contains `/categorias`.
  - `GET /categorias` metadata checks from Phase 2 unchanged.
- **Manual:** none.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/app/sitemap.ts` | `/categorias` in both branches | `__tests__/seo/sitemap.test.ts` + `curl /sitemap.xml` |
| `src/app/categorias/page.tsx` `generateMetadata` | title/description/canonical/robots | `__tests__/seo/categories-metadata.test.ts` + `curl` `<head>` |
| Docs | route inventory, adapter, header note | read-through |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 – Header entry point | Phase 1 | `GET /` 200 (row lives in a closed popover/drawer — not in SSR HTML) | Cannot validate | Proven by `__tests__/shared/Header.test.tsx` (row href, not disabled, absent on `/categorias`, closes dropdown/drawer, absent with empty taxonomy) + manual open/click at ≥768px and <768px, both themes. |
| AC2 – Active state | Phase 1 (code), Phase 2 (route exists) | `GET /categorias` 200 contains `Categorías` trigger with ` (actual)` and `Productos` without `aria-current="page"`; `GET /` contains `aria-current="page"` on `Productos` and no ` (actual)` | Not validated | Underline/tint/inset bar are styling → manual. Mobile accordion trigger `(actual)`: Header test. |
| AC3 – Page structure | Phase 2 | `GET /categorias` 200; `grep -c "<article"` = 16; contains `aria-label="Ruta"`, `aria-current="page">Categorías`, `<h1`, `16 categorías`, `Cotizar ahora` + `wa.me` + `target="_blank"`, one `<main`; `Abrasivos` first / `Tornillería` last; `NEXT_PUBLIC_WHATSAPP_NUMBER=` hides the panel; `STRAPI_HOST` unreachable → `error.tsx` copy | Not validated | Empty state (0 categories) has no live fixture → `CategoriesPage.test.tsx`. |
| AC4 – Card anatomy | Phase 2 | `GET /categorias`: `grep -c "productos</span>"` = 16, `0 productos` present, `Ver categoría` × 16, `href="#"` × 0 | Not validated | Pill-hidden-on-count-failure has no live fixture → `CategoriesPage.test.tsx` (`productCount: null`) + adapter test. `aria-hidden` badge: test. |
| AC5 – SEO + resilience + tests | Phase 2 (metadata, JSON-LD), Phase 3 (sitemap, tests, docs) | `GET /categorias` `<title>`, canonical `/categorias`, robots `index, follow`, `"@type":"BreadcrumbList"`; `GET /sitemap.xml` contains `/categorias` with Strapi up and down; `pnpm lint`/`tsc`/`build`/`test` green | Not validated | |

## Cross-Cutting Concerns

- **Server/client boundary:** `categorias/page.tsx`, `CategoriesPage.tsx`, `CategoryCard.tsx` are server components (no hooks, no directive); `Header`/`MobileMenu` stay `"use client"` and never import `global.lib.ts`. `NEXT_PUBLIC_WHATSAPP_NUMBER` is readable server-side, so the panel needs no client code.
- **Strapi contract:** aliased `products_connection(filters: { category: { customId: { eq } } }, pagination: { pageSize: 1 }) { pageInfo { total } }` honours Draft & Publish (verified 2026-09-14). Variables, not interpolation, carry `customId`s.
- **Error boundaries:** `fetchCategories()` failure → root `error.tsx`; count failure → `console.warn` + pills hidden; unset WhatsApp number → panel hidden; all three never throw at render.
- **Trust boundary:** category names render as React text children; the JSON-LD contains no Strapi strings but still goes through `toJsonLdHtml`.
- **Responsive/theme:** class-only (`md:`/`lg:`), `dark:` variants from the existing header palette; header breakpoint stays `md`, page hero uses `lg`.
- **Env:** `STRAPI_HOST`/`STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL` (canonical/sitemap/JSON-LD `item` URLs).

## Open Questions / Out of Scope

- **Full-page navigation from the dropdown row** (no `RouterProvider`): accepted per research. If it grates, the follow-up is a `ClientRouter` wrapper around HeroUI (`useRouter().push`), which would then also need a router mock in `Header.test.tsx`.
- **`GET_CATEGORIES` without `pagination`** (Strapi II): left as is; add `pagination: { pageSize: 100 }` when the taxonomy approaches whatever Strapi's default turns out to be.
- **Strapi III** (`pageSize` cap at 100): not needed here — counts come from `pageInfo.total`.
- **`error.tsx` copy** says "productos" on `/categorias`: accepted; a route-scoped `src/app/categorias/error.tsx` is a later polish item.
- **Out of scope (research):** `/categorias/<slug>` pages and slug scheme; enabling card/dropdown category links; client-side category search box; category descriptions/tags/images; brand index page; `Cambiar tema` placement from the stale comp header; PNG export of comps into `comps/categories-page/` (`/check-design`).
