# Plan: Abrasivos category page (`/categorias/abrasivos`) + shared category page UI + Tornillería rename

**Source research:** `ai-research/abrasivos-category-page.story.md` (2026-09-15, branch `feat/add-abrasivos-page`).
**Sign-off status:** no explicit sign-off line, but every open question is `answered` (Strapi I–II, Catalog I, UI I–III, Verification I) and D1–D4 are recorded as decided with the user on 2026-09-15. Treated as signed off — same basis as `ai-planning/tornilleria-category-page.story.md`. **Confirm before `/implement`.**
**Plan date:** 2026-09-15.

## Assumptions

- **Config shape.** One object literal `CATEGORY_PAGES: Record<string, CategoryPageConfig>` in `src/shared/constants/category.constants.ts`, keyed by `customId`, with `{ name, heading, intro, searchPlaceholder }`. The error heading is derived (`No pudimos cargar los productos de ${name}`), not stored. `CATEGORY_PAGE_HREFS` stays a separate map (AC3 lists it as a separate touch point; `Header`/`MobileMenu`/`CategoryCard`/`sitemap` iterate it as-is). SEO title/description stay in `seo.constants.ts` as literal pairs (research: "next to the Tornillería pair").
- **`CategoryPage` receives the config object** (`config: CategoryPageConfig`), not an id. The route does the lookup (`CATEGORY_PAGES[TORNILLERIA_CATEGORY_ID]`), so the component never indexes a `Record` and tests pass the same constant. `TORNILLERIA_CATEGORY_NAME` is deleted — its only consumers (breadcrumb + JSON-LD leaf) read `config.name` / `CATEGORY_PAGES[id].name`.
- **Error and loading bodies are extracted once, not duplicated.** With two consumers the shared version is fewer lines (research left this to the planner): `src/features/CategoryPage/CategoryPageError.tsx` (`"use client"`, props `{ categoryName, reset }`) and `src/features/CategoryPage/CategoryPageSkeleton.tsx` (server-safe, no hooks). Each route's `error.tsx`/`loading.tsx` becomes a 3–5 line shell. Existing error/loading tests keep importing the route files, so the boundary wiring is what's tested.
- **`CategoriesPage.test.tsx` fixture already contains `customId: "abrasivos"`**, so once `CATEGORY_PAGE_HREFS.abrasivos` exists that test's `getByRole("link", { name: "Ver categoría" })` finds two links and fails. Phase 3 updates it to assert both links (Tornillería + Abrasivos) and `categories.length - 2` disabled CTAs. `Header.test.tsx`'s fixture has no `abrasivos` entry, so its "other rows disabled" assertions are unaffected.
- **Abrasivos copy (user, D1):** `ABRASIVOS_TITLE = "Discos de Corte y Abrasivos Industriales en Puebla | Tehesa"`, `ABRASIVOS_DESCRIPTION = "Discos de corte y puntas montadas para desbaste industrial. Abasto en Puebla. Cotiza con Tehesa Industrial."`, heading `Abrasivos industriales`, intro = `ABRASIVOS_DESCRIPTION`, breadcrumb/JSON-LD leaf `Abrasivos`. Search placeholder is not specified by the story — use `Buscar discos, puntas montadas...` (mirrors the Tornillería pattern of naming the category's product types); flag in the phase summary for the user to override.
- Env: `.env.local` has `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. Dev-server checks assume `pnpm dev` on `http://localhost:3000` and today's live data (107 Tornillería products, 0 Abrasivos products).

## Acceptance Criteria

1. **Abrasivos route + data.** `GET /categorias/abrasivos` is server-rendered, fetches every published product with `category.customId == "abrasivos"` via the existing `fetchAllProductsByCategory("abrasivos")` (no new query, no new adapter), and renders them all in one grid with no pagination. `generateMetadata` returns the exact title/description above, `alternates.canonical: "/categorias/abrasivos"`, `robots: { index: true, follow: true }`. A 3-item `BreadcrumbList` JSON-LD (`Inicio` / `Categorías` / `Abrasivos`) is emitted. Zero products (today's live state) renders `ProductListing`'s existing `No hay productos disponibles.` state — the page must not error or hide its hero/breadcrumb on an empty set.
2. **Abrasivos page structure.** `nav[aria-label="Ruta"]` with leaf `Abrasivos` (`aria-current="page"`), kicker `Categoría`, `<h1>Abrasivos industriales</h1>`, intro paragraph (D1), `WhatsappPanel`, live `N productos` counter, filter row with `SearchInput` + `Filtrar marcas` (+ `Limpiar filtros` when active), **no** `Filtrar subcategorías` dropdown because no Abrasivos product carries a `subcategory` (D2). Own `error.tsx`/`loading.tsx` under `src/app/categorias/abrasivos/`.
3. **Shared UI, not a copy.** `src/features/CategoryPage/CategoryPage.tsx` contains **no** category-specific string literals; both routes render the same component with their config. The Tornillería page renders byte-for-byte the same DOM as before (existing `__tests__/category-page/CategoryPage.test.tsx` assertions still hold, adjusted only for how the component receives its copy). Adding a third category must require only: one config entry, one `CATEGORY_PAGE_HREFS` entry, one SEO title/description pair, and one `src/app/categorias/<slug>/` folder.
4. **Entry points.** `CATEGORY_PAGE_HREFS` gains `abrasivos: "/categorias/abrasivos"`; consequently the header `Categorías` dropdown row, the mobile-accordion row, the `/categorias` card CTA `Ver categoría` and the sitemap all light up for Abrasivos with **no code changes** in `Header`, `MobileMenu`, `CategoryCard` or `sitemap.ts`. On `/categorias/abrasivos` the header marks `Categorías` + `Abrasivos` active via the existing `pageCategoryId` lookup.
5. **Tornillería rename.** `GET /categorias/tornilleria-fijacion` serves the Tornillería page; `CATEGORY_PAGE_HREFS.tornilleria`, the canonical, the JSON-LD leaf `item`, the sitemap entry, header/mobile/card hrefs and every test reference use the new path. `GET /categorias/tornilleria` returns the app's 404 (D3).
6. **Verification.** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass. New tests cover `/categorias/abrasivos` `generateMetadata`, its error boundary copy, the sitemap containing both `/categorias/abrasivos` and `/categorias/tornilleria-fijacion`, and `CategoryPage` hiding the subcategory dropdown when no product has a subcategory. Existing Tornillería tests are updated for the new path, not deleted.

## Affected files

**`src/app/**`**
- `src/app/categorias/tornilleria/page.tsx`, `error.tsx`, `loading.tsx` — Modify (Phase 1), then Move to `src/app/categorias/tornilleria-fijacion/` (Phase 2)
- `src/app/categorias/abrasivos/page.tsx`, `error.tsx`, `loading.tsx` — Create (Phase 3)
- `src/app/sitemap.ts` — no change

**`src/features/**`**
- `src/features/CategoryPage/CategoryPage.tsx` — Modify (Phase 1)
- `src/features/CategoryPage/CategoryPageError.tsx` — Create (Phase 1)
- `src/features/CategoryPage/CategoryPageSkeleton.tsx` — Create (Phase 1)
- `src/features/CategoriesPage/CategoryCard.tsx` — no change

**`src/shared/**`**
- `src/shared/constants/category.constants.ts` — Modify (Phases 1, 2, 3)
- `src/shared/constants/seo.constants.ts` — Modify (Phase 3)
- `src/shared/ui/organisms/Header.tsx`, `MobileMenu.tsx` — no change
- `src/shared/lib/global.lib.ts`, `src/shared/queries/global.queries.ts` — no change

**Tests (`__tests__/**`)**
- `__tests__/category-page/CategoryPage.test.tsx` — Modify (Phase 1)
- `__tests__/seo/tornilleria-metadata.test.ts`, `__tests__/app/tornilleria-error.test.tsx`, `__tests__/shared/Header.test.tsx`, `__tests__/categories/CategoriesPage.test.tsx`, `__tests__/seo/sitemap.test.ts` — Modify (Phase 2)
- `__tests__/seo/abrasivos-metadata.test.ts`, `__tests__/app/abrasivos-error.test.tsx` — Create (Phase 3)
- `__tests__/categories/CategoriesPage.test.tsx`, `__tests__/seo/sitemap.test.ts` — Modify again (Phase 3)

**Docs**
- `ai-skills/REPO_CONTEXT.md` — Modify (Phases 2, 3): route table rows ~67/73/98/110/231/323/324/349 reference `/categorias/tornilleria` and "Tornillería only today".

---

## Phase 1 — Generalize `CategoryPage` (config-driven copy, conditional subcategory dropdown, shared error/skeleton)

Depends on nothing. Phases 2 and 3 both depend on it.

### Changes Required

**`src/shared/constants/category.constants.ts` — Modify**

- Delete `TORNILLERIA_CATEGORY_NAME`. Keep `TORNILLERIA_CATEGORY_ID`, `CATEGORY_PAGE_HREFS`, `SUBCATEGORY_LABELS` unchanged.
- Add:
  ```ts
  export type CategoryPageConfig = {
    name: string            // breadcrumb leaf + JSON-LD leaf name + error heading
    heading: string         // <h1>
    intro: string           // hero paragraph
    searchPlaceholder: string
  }
  export const CATEGORY_PAGES: Record<string, CategoryPageConfig> = {
    [TORNILLERIA_CATEGORY_ID]: {
      name: "Tornillería",
      heading: "Tornillería y fijación industrial",
      intro: "Tornillos, tuercas, rondanas, pernos y varillas roscadas para industria. Acero e inoxidable, con existencia en Puebla.",
      searchPlaceholder: "Buscar tornillos, tuercas, pernos...",
    },
  }
  ```
  The four strings are lifted verbatim from `CategoryPage.tsx` (lines 96, 106–107, 109–112, 122) so the Tornillería DOM is unchanged.

**`src/features/CategoryPage/CategoryPage.tsx` — Modify**

- Props: `{ products: Product[]; config: CategoryPageConfig }`. Import `CategoryPageConfig` and `SUBCATEGORY_LABELS` only; drop the `TORNILLERIA_CATEGORY_NAME` import.
- Replace the four literals: breadcrumb leaf → `config.name`, `<h1>` → `config.heading`, intro `<p>` → `config.intro`, `SearchInput placeholder` → `config.searchPlaceholder`.
- Wrap the dropdown: `{subcategoryOptions.length > 0 && <DropdownCategories … />}` (D2). Nothing else changes — `subcategoryOptions` is already derived from the loaded set, `subcategory` state stays (it can only be set through the dropdown, so it stays `null` when hidden).
- Kicker `Categoría`, `Filtrar subcategorías`, `Filtrar marcas`, `Limpiar filtros`, counter copy stay inline — they are shared, not category-specific.

**`src/features/CategoryPage/CategoryPageError.tsx` — Create**

- `"use client"`. `export const CategoryPageError = ({ categoryName, reset }: { categoryName: string; reset: () => void })`.
- Body = the current `src/app/categorias/tornilleria/error.tsx` JSX verbatim, with the `<h2>` reading `` `No pudimos cargar los productos de ${categoryName}` ``. Keep `role="alert"`, `Intentar de nuevo` → `reset`, `Ver todas las categorías` → `window.location.assign("/categorias")`.

**`src/features/CategoryPage/CategoryPageSkeleton.tsx` — Create**

- No directive (server-safe, hook-free). `export const CategoryPageSkeleton = () => (…)` = the current `loading.tsx` JSX verbatim (including the `<main>` wrapper and `role="status"` text).

**`src/app/categorias/tornilleria/page.tsx` — Modify**

- Imports: replace `TORNILLERIA_CATEGORY_NAME` with `CATEGORY_PAGES`.
- JSON-LD leaf `name: CATEGORY_PAGES[TORNILLERIA_CATEGORY_ID].name`.
- Render `<CategoryPage products={products} config={CATEGORY_PAGES[TORNILLERIA_CATEGORY_ID]} />`.
- `generateMetadata`, canonical, `fetchAllProductsByCategory(TORNILLERIA_CATEGORY_ID)` unchanged in this phase.

**`src/app/categorias/tornilleria/error.tsx` — Modify**

- Reduce to a `"use client"` default export: `export default function Error({ reset }) { return <CategoryPageError categoryName={CATEGORY_PAGES[TORNILLERIA_CATEGORY_ID].name} reset={reset} /> }`.

**`src/app/categorias/tornilleria/loading.tsx` — Modify**

- Reduce to `export { CategoryPageSkeleton as default } from "@/features/CategoryPage/CategoryPageSkeleton"`.

**`__tests__/category-page/CategoryPage.test.tsx` — Modify**

- Every `render(<CategoryPage products={…} />)` gains `config={CATEGORY_PAGES[TORNILLERIA_CATEGORY_ID]}` (import both from `@/shared/constants/category.constants`). No assertion text changes.
- Add `it("hides the subcategory dropdown when no product carries a subcategory")`: render with a fixture where every product has `subcategory: null` (reuse the existing fixtures via `products.map((p) => ({ ...p, subcategory: null }))`); assert `queryByRole("button", { name: "Filtrar subcategorías" })` is null and `getByRole("button", { name: "Filtrar marcas" })` is present.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit` — the deleted `TORNILLERIA_CATEGORY_NAME` export must produce no dangling imports.
- `pnpm test -- __tests__/category-page __tests__/app/tornilleria-error.test.tsx __tests__/seo/tornilleria-metadata.test.ts` — all green, including the new "hides the subcategory dropdown" case.
- `pnpm design:lint` (research verification rule after touching `CategoryPage.tsx`).

**Dev-server validation** (`pnpm dev`)
- `GET /categorias/tornilleria` → 200. Body contains `<h1 class="…">Tornillería y fijación industrial</h1>`, `aria-current="page">Tornillería<`, `Buscar tornillos, tuercas, pernos...`, `Filtrar subcategorías`, `Filtrar marcas`, `"name":"Tornillería"` inside the `application/ld+json` script, `107 productos`. No server-log errors, no hydration warnings.
- `GET /categorias` → 200 (unchanged; proves nothing under `categorias/` broke from the constants edit).

**Manual**
- None. The loading skeleton and error boundary are exercised by the tests; both are unchanged JSX.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/features/CategoryPage/CategoryPage.tsx` | config-driven breadcrumb/H1/intro/placeholder; dropdown absent when no subcategory | `pnpm test -- __tests__/category-page` + `curl /categorias/tornilleria` |
| `src/features/CategoryPage/CategoryPageError.tsx` | heading interpolates `categoryName`; `reset` wired | `pnpm test -- __tests__/app/tornilleria-error.test.tsx` |
| `src/features/CategoryPage/CategoryPageSkeleton.tsx` | route `loading.tsx` still resolves | `pnpm exec tsc --noEmit` + `pnpm build` (Phase 3) |
| `src/shared/constants/category.constants.ts` | `CATEGORY_PAGES` shape | `pnpm exec tsc --noEmit` |

---

## Phase 2 — Rename `/categorias/tornilleria` → `/categorias/tornilleria-fijacion`

Depends on Phase 1. Independent of Phase 3.

### Changes Required

**`src/app/categorias/tornilleria/` → `src/app/categorias/tornilleria-fijacion/` — Move** (`git mv` the folder; three files).

**`src/app/categorias/tornilleria-fijacion/page.tsx` — Modify**

- `alternates: { canonical: "/categorias/tornilleria-fijacion" }`. Nothing else — the JSON-LD leaf `item` reads `CATEGORY_PAGE_HREFS[TORNILLERIA_CATEGORY_ID]`.

**`src/shared/constants/category.constants.ts` — Modify**

- `CATEGORY_PAGE_HREFS[TORNILLERIA_CATEGORY_ID]: "/categorias/tornilleria-fijacion"`.

**Tests — Modify** (path literal swaps only; no test is deleted)

- `__tests__/seo/tornilleria-metadata.test.ts` — import from `@/app/categorias/tornilleria-fijacion/page`; describe/it names and `canonical` → `/categorias/tornilleria-fijacion`.
- `__tests__/app/tornilleria-error.test.tsx` — import from `@/app/categorias/tornilleria-fijacion/error`; describe name.
- `__tests__/shared/Header.test.tsx` — lines 82, 154, 277, 291 (+ the two `it` titles at 153/290): `/categorias/tornilleria` → `/categorias/tornilleria-fijacion`.
- `__tests__/categories/CategoriesPage.test.tsx` line 40 — same swap.
- `__tests__/seo/sitemap.test.ts` lines 50, 82 — `endsWith("/categorias/tornilleria-fijacion")`.

**`ai-skills/REPO_CONTEXT.md` — Modify**

- Replace every `/categorias/tornilleria` and `categorias/tornilleria/` reference (route table row ~67, sitemap row ~73, `CategoryPage/` row ~98, `Header` row ~110, sitemap note ~231, gotcha ~324, key-files row ~349) with the `tornilleria-fijacion` path. Also fold in Phase 1: `CategoryPage` is config-driven via `CATEGORY_PAGES`, error/skeleton bodies live in `src/features/CategoryPage/`.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`.
- `pnpm test` (full — five test files reference the path).

**Dev-server validation** (`pnpm dev`)
- `GET /categorias/tornilleria-fijacion` → 200; body contains `<h1 …>Tornillería y fijación industrial</h1>`, `rel="canonical" href="http://localhost:3000/categorias/tornilleria-fijacion"`, and `"item":"http://localhost:3000/categorias/tornilleria-fijacion"` in the JSON-LD.
- `GET /categorias/tornilleria` → 404 (D3).
- `GET /sitemap.xml` → 200; contains `/categorias/tornilleria-fijacion`; `grep -c 'categorias/tornilleria<'` is 0 (old URL gone).
- `GET /categorias` → 200; body contains `href="/categorias/tornilleria-fijacion"` (card CTA) and no `href="/categorias/tornilleria"`.
- `GET /` → 200; header markup contains `href="/categorias/tornilleria-fijacion"` (desktop dropdown rows render server-side inside the menu only when open — if the href is not in the SSR body, rely on the Header tests instead and say so).

**Manual**
- On `/categorias/tornilleria-fijacion`, open the header `Categorías` dropdown: trigger reads `Categorías (actual)`, Tornillería row is highlighted. (Header tests cover this with the mocked pathname; the manual check is a sanity pass only.)

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/app/categorias/tornilleria-fijacion/page.tsx` | canonical, JSON-LD leaf item follow the new path | `pnpm test -- __tests__/seo/tornilleria-metadata.test.ts` + `curl` above |
| `src/shared/constants/category.constants.ts` | `CATEGORY_PAGE_HREFS` value drives header/mobile/card/sitemap | `pnpm test -- __tests__/shared/Header.test.tsx __tests__/categories __tests__/seo/sitemap.test.ts` |
| Old route | 404 | `curl -o /dev/null -w '%{http_code}' /categorias/tornilleria` |

---

## Phase 3 — Add `/categorias/abrasivos`

Depends on Phase 1. Independent of Phase 2 (but the sitemap/CategoriesPage test edits assume Phase 2's path literals are already in place — do Phase 2 first).

### Changes Required

**`src/shared/constants/seo.constants.ts` — Modify**

- Append `ABRASIVOS_TITLE` / `ABRASIVOS_DESCRIPTION` (exact strings in Assumptions) after the Tornillería pair.

**`src/shared/constants/category.constants.ts` — Modify**

- `export const ABRASIVOS_CATEGORY_ID = "abrasivos"`.
- `CATEGORY_PAGE_HREFS[ABRASIVOS_CATEGORY_ID]: "/categorias/abrasivos"`.
- `CATEGORY_PAGES[ABRASIVOS_CATEGORY_ID]: { name: "Abrasivos", heading: "Abrasivos industriales", intro: ABRASIVOS_DESCRIPTION, searchPlaceholder: "Buscar discos, puntas montadas..." }` — import `ABRASIVOS_DESCRIPTION` from `seo.constants.ts` (D1: intro = meta description; one source, no duplicated string). `seo.constants.ts` does not import from `category.constants.ts`, so no cycle.

**`src/app/categorias/abrasivos/page.tsx` — Create**

- Copy of `tornilleria-fijacion/page.tsx` with: `ABRASIVOS_TITLE`/`ABRASIVOS_DESCRIPTION`, `canonical: "/categorias/abrasivos"`, `ABRASIVOS_CATEGORY_ID` in the JSON-LD leaf (`name: CATEGORY_PAGES[ABRASIVOS_CATEGORY_ID].name`, `item: SITE_URL + CATEGORY_PAGE_HREFS[ABRASIVOS_CATEGORY_ID]`), `fetchAllProductsByCategory(ABRASIVOS_CATEGORY_ID)`, `<CategoryPage products={products} config={CATEGORY_PAGES[ABRASIVOS_CATEGORY_ID]} />`. Default export `AbrasivosRoute`.

**`src/app/categorias/abrasivos/error.tsx` — Create**

- Same 3-line shell as Tornillería's, `categoryName={CATEGORY_PAGES[ABRASIVOS_CATEGORY_ID].name}`.

**`src/app/categorias/abrasivos/loading.tsx` — Create**

- `export { CategoryPageSkeleton as default } from "@/features/CategoryPage/CategoryPageSkeleton"`.

**Tests**

- `__tests__/seo/abrasivos-metadata.test.ts` — Create; clone of `tornilleria-metadata.test.ts` asserting `ABRASIVOS_TITLE`, `ABRASIVOS_DESCRIPTION`, `canonical: "/categorias/abrasivos"`, `robots { index: true, follow: true }`. `@jest-environment node`.
- `__tests__/app/abrasivos-error.test.tsx` — Create; clone of `tornilleria-error.test.tsx` asserting heading `No pudimos cargar los productos de Abrasivos` and `reset` called once.
- `__tests__/seo/sitemap.test.ts` — Modify; both `it` blocks additionally assert an entry ending in `/categorias/abrasivos`. The length arithmetic already uses `Object.keys(CATEGORY_PAGE_HREFS).length`, so it self-adjusts.
- `__tests__/categories/CategoriesPage.test.tsx` — Modify (see Assumptions): `getAllByRole("link", { name: "Ver categoría" })` has length 2 with hrefs `/categorias/tornilleria-fijacion` and `/categorias/abrasivos`; disabled CTAs = `categories.length - 2`. Rename the `it` title accordingly.

**`ai-skills/REPO_CONTEXT.md` — Modify**

- Route table: add `categorias/abrasivos/page.tsx` row; sitemap row "currently `/categorias/tornilleria-fijacion` and `/categorias/abrasivos`"; `Header` row "Tornillería only today" → "Tornillería and Abrasivos today"; `CategoryPage/` row: config-driven, subcategory dropdown rendered only when the set yields options; gotcha ~324: list both folders. Key-files table: add the Abrasivos row.

### Success Criteria

**Automated**
- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` (proves the moved folder and the new folder both ship their own boundaries).
- `pnpm test` (full).

**Dev-server validation** (`pnpm dev`)
- `GET /categorias/abrasivos` → 200. Body contains: `<title>Discos de Corte y Abrasivos Industriales en Puebla | Tehesa</title>`; `<meta name="description" content="Discos de corte y puntas montadas para desbaste industrial. Abasto en Puebla. Cotiza con Tehesa Industrial."`; `rel="canonical" href="http://localhost:3000/categorias/abrasivos"`; `<meta name="robots" content="index, follow"`; `aria-label="Ruta"` with `aria-current="page">Abrasivos<`; `>Categoría<` kicker; `<h1 …>Abrasivos industriales</h1>`; the intro paragraph text; `Cotizar ahora` (WhatsApp panel, number set); `0 productos`; `Filtrar marcas`; `No hay productos disponibles.`; JSON-LD with `"name":"Abrasivos"` and `"item":"http://localhost:3000/categorias/abrasivos"`. Body must **not** contain `Filtrar subcategorías`. No server-log errors, no hydration warnings.
- `GET /sitemap.xml` → 200; contains both `/categorias/abrasivos` and `/categorias/tornilleria-fijacion`.
- `GET /categorias` → 200; contains `href="/categorias/abrasivos"` (the Abrasivos card CTA is now a real link, `0 productos` pill unchanged).
- `GET /categorias/tornilleria-fijacion` → 200, still `107 productos` and `Filtrar subcategorías` present (regression: dropdown gating didn't over-hide).

**Manual**
- On `/categorias/abrasivos`: header `Categorías` trigger reads `Categorías (actual)` and the Abrasivos row is highlighted (desktop) / carries `aria-current="page"` (mobile accordion). Header tests cover the mechanism with Tornillería; this is the only Abrasivos-specific manual check since the dropdown does not SSR its rows.
- Filter row layout at `<lg`: search on top, `Filtrar marcas` alone below (no empty slot where the subcategory dropdown was).

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/app/categorias/abrasivos/page.tsx` | metadata literals, canonical, robots, JSON-LD, empty-set render | `pnpm test -- __tests__/seo/abrasivos-metadata.test.ts` + `curl /categorias/abrasivos` |
| `src/app/categorias/abrasivos/error.tsx` | heading copy, `reset` | `pnpm test -- __tests__/app/abrasivos-error.test.tsx` |
| `src/app/categorias/abrasivos/loading.tsx` | resolves as a route boundary | `pnpm build` |
| `src/shared/constants/category.constants.ts` | `abrasivos` in both maps lights up header/mobile/card/sitemap | `pnpm test -- __tests__/categories __tests__/seo/sitemap.test.ts` + `curl /categorias`, `/sitemap.xml` |
| `src/features/CategoryPage/CategoryPage.tsx` | no subcategory dropdown on an all-`null` set | Phase 1 test + `curl /categorias/abrasivos` (no `Filtrar subcategorías`) |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 – Abrasivos route + data | Phase 3 | `GET /categorias/abrasivos` 200; `<title>`, description meta, canonical, robots `index, follow`, JSON-LD `"name":"Abrasivos"`, `No hay productos disponibles.` alongside `<h1>` and `aria-label="Ruta"` | Validated | All literals confirmed by curl; `pnpm build` output lists `/categorias/abrasivos` as its own route, no new query added |
| AC2 – Abrasivos page structure | Phase 3 (dropdown gating from Phase 1) | Same response: `aria-current="page">Abrasivos<`, `>Categoría<`, `<h1 …>Abrasivos industriales</h1>`, intro text, `Cotizar ahora`, `0 productos`, `Filtrar marcas`, **no** `Filtrar subcategorías`; `pnpm build` output lists `/categorias/abrasivos` with its own boundaries | Validated | All confirmed by curl; `Limpiar filtros` only appears after typing — covered by `__tests__/category-page` |
| AC3 – Shared UI, not a copy | Phase 1 | `GET /categorias/tornilleria` (Phase 1) / `/categorias/tornilleria-fijacion` (after Phase 2) 200 with the same H1/intro/placeholder/breadcrumb strings as before; `grep -c "Tornillería" src/features/CategoryPage/CategoryPage.tsx` is 0 | Validated | Confirmed on both `/categorias/tornilleria` (Phase 1) and `/categorias/tornilleria-fijacion` (Phase 2) |
| AC4 – Entry points | Phase 3 | `GET /categorias` contains `href="/categorias/abrasivos"`; `GET /sitemap.xml` contains `/categorias/abrasivos`; `git diff --stat` shows no change in `Header.tsx`, `MobileMenu.tsx`, `CategoryCard.tsx`, `sitemap.ts` | Validated | Both curl checks confirmed; `git diff --stat` confirms no changes to those four files. Header dropdown active state for Abrasivos not SSR'd — manual check needed (mechanism covered by `Header.test.tsx`) |
| AC5 – Tornillería rename | Phase 2 | `GET /categorias/tornilleria-fijacion` 200 with canonical + JSON-LD item on the new path; `GET /categorias/tornilleria` 404; `GET /sitemap.xml` has the new path and not the old; `GET /categorias` CTA href is the new path | Validated | All four checks passed: 200/404, canonical + JSON-LD on new path, sitemap has new path only, `/categorias` CTA uses new path |
| AC6 – Verification | Phases 1–3 | `pnpm lint && pnpm exec tsc --noEmit && pnpm build && pnpm test` exit 0; new test files exist for abrasivos metadata/error, sitemap asserts both paths, `CategoryPage.test.tsx` has the "hides the subcategory dropdown" case | Validated | All four commands exit 0; `pnpm test` — 45 suites, 421 passed / 1 skipped (pre-existing) |

## Cross-cutting concerns

- **Env:** `STRAPI_HOST`/`STRAPI_API_TOKEN` (fetch), `NEXT_PUBLIC_WHATSAPP_NUMBER` (panel — the `Cotizar ahora` checks assume it is set), `NEXT_PUBLIC_SITE_URL` (canonical/JSON-LD absolute URLs; dev checks assume the `http://localhost:3000` fallback).
- **Server/client boundary:** `CategoryPage` and `CategoryPageError` are `"use client"`; `CategoryPageSkeleton` and the route `page.tsx` are server. `CATEGORY_PAGES` is a plain object literal, so passing a config entry across the boundary is a serializable prop.
- **Constants import direction:** `category.constants.ts` → `seo.constants.ts` (for `ABRASIVOS_DESCRIPTION`); never the reverse.
- **Empty set is the live state for Abrasivos** — every Abrasivos dev-server check is written against `0 productos`; if products land in Strapi before implementation, the counter and empty-state assertions change but nothing else does.
- **Responsive:** unchanged from Tornillería; the only layout delta is one fewer element in the `sm:flex-row` filter group.

## Open Questions / Out-of-scope items

**Open (non-blocking — defaults chosen, override at sign-off)**
- Abrasivos search placeholder: not specified by the story; plan uses `Buscar discos, puntas montadas...`.

**Out of scope (deliberately excluded)**
- Dynamic `/categorias/[slug]` route (D4).
- Redirect from `/categorias/tornilleria` (D3).
- Adding Abrasivos products/images in Strapi; changing `/?mode=category`; `CatalogSearchDrawer`; any other category page.
- Folding `CATEGORY_PAGE_HREFS` or the SEO pair into `CATEGORY_PAGES` — AC3 enumerates them as separate touch points, and merging would change `sitemap.ts`/`Header`/`CategoryCard` for no story gain.
- Any change to `fetchAllProductsByCategory`, `GET_ALL_PRODUCTS_BY_CATEGORY`, `ProductListing`, `DropdownCategories`, `WhatsappPanel`.
