# Plan: Perforación y accesorios de taladro category page (`/categorias/perforacion-accesorios-taladro`)

**Source research:** `ai-research/perforacion-accesorios-taladro-category-page.story.md` (2026-09-16, branch `feat/add-brocas-perf-page`).
**Sign-off status:** no explicit sign-off line; Strapi I, UI II–III and Verification I are `answered`, D1–D2 decided with the user on 2026-09-16, and D3 (UI I) was confirmed by the user during planning on 2026-09-16 (`name` = Strapi, `heading` = user H1). Treated as signed off — same basis as `ai-planning/corte-conformado-category-page.story.md`. **Confirm before `/implement`.**
**Plan date:** 2026-09-16.

## Assumptions

- The Abrasivos AC 3 contract still holds: `CategoryPage`, `Header`, `MobileMenu`, `CategoryCard`, `sitemap.ts`, queries and server actions key off `CATEGORY_PAGE_HREFS` / `CATEGORY_PAGES` and need no diff.
- Copy is verbatim from the research table. `name` = `Perforación y accesorios para taladro` (Strapi), `heading` = `Perforación y accesorios de taladro` (user H1, D3). `intro` = `PERFORACION_DESCRIPTION` (D1). `searchPlaceholder` = `Buscar brocas, juegos, portabrocas...` (D2).
- Slug equals the `customId` (`perforacion-accesorios-taladro`) per the user's 2026-09-16 correction (was `perforacion-brocas`); the map key is still the `customId` and the href is `/categorias/perforacion-accesorios-taladro`. Do not shorten it.
- Env: `.env.local` has `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. Dev-server checks assume `pnpm dev` on `http://localhost:3000` and today's live data (51 products, all `subcategory: null`, brands Weston 33 / Bohrcraft 10 / Bondhus 3 / `null` 5).

## Acceptance Criteria

1. **Route + data.** `GET /categorias/perforacion-accesorios-taladro` is server-rendered, fetches every published product with `category.customId == "perforacion-accesorios-taladro"` via `fetchAllProductsByCategory("perforacion-accesorios-taladro")`, renders them in one unpaginated grid. `generateMetadata` returns the exact title/description above, `alternates.canonical: "/categorias/perforacion-accesorios-taladro"`, `robots: { index: true, follow: true }`. A 3-item `BreadcrumbList` JSON-LD (`Inicio` / `Categorías` / `Perforación y accesorios para taladro`) is emitted.
2. **Page structure.** Same DOM shape as Corte/Conformado: `nav[aria-label="Ruta"]` with leaf `Perforación y accesorios para taladro` (`aria-current="page"`), kicker `Categoría`, `<h1>Perforación y accesorios de taladro</h1>`, intro paragraph, `WhatsappPanel`, live `N productos` counter, filter row with `SearchInput` + `Filtrar marcas` (3 options: Bohrcraft, Bondhus, Weston). `Filtrar subcategorías` stays hidden (no product carries `subcategory`, Strapi I). Own `error.tsx` (`No pudimos cargar los productos de Perforación y accesorios para taladro`) and `loading.tsx` under `src/app/categorias/perforacion-accesorios-taladro/`.
3. **Entry points light up with no code changes.** `CATEGORY_PAGE_HREFS` gains `"perforacion-accesorios-taladro": "/categorias/perforacion-accesorios-taladro"`; header `Categorías` dropdown row, mobile accordion row, `/categorias` card CTA, sitemap entry and header active state (`pageCategoryId`) all follow from the map.
4. **Shared component untouched.** `src/features/CategoryPage/*` has no diff. Existing category pages/tests are unchanged except where a test enumerates the href map.
5. **Verification.** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass. New tests: `__tests__/seo/perforacion-accesorios-taladro-metadata.test.ts`, `__tests__/app/perforacion-accesorios-taladro-error.test.tsx`; `sitemap.test.ts` asserts `/categorias/perforacion-accesorios-taladro` in both `it`s; `CategoriesPage.test.tsx` fixture gains the new category and `linkCtas` 4 → 5 / `disabledCtas` `length - 5`.

## Affected files

**`src/app/**`**
- `src/app/categorias/perforacion-accesorios-taladro/page.tsx` — Create
- `src/app/categorias/perforacion-accesorios-taladro/error.tsx` — Create
- `src/app/categorias/perforacion-accesorios-taladro/loading.tsx` — Create

**`src/shared/**`**
- `src/shared/constants/category.constants.ts` — Modify
- `src/shared/constants/seo.constants.ts` — Modify

**Tests (`__tests__/**`)**
- `__tests__/seo/perforacion-accesorios-taladro-metadata.test.ts` — Create
- `__tests__/app/perforacion-accesorios-taladro-error.test.tsx` — Create
- `__tests__/seo/sitemap.test.ts` — Modify
- `__tests__/categories/CategoriesPage.test.tsx` — Modify

**Docs**
- `ai-skills/REPO_CONTEXT.md` — Modify (route tables)

No changes under `src/features/**`, `src/components/**`, `src/zustand/**`, `src/app/api/**`.

---

## Phase 1 — Constants + route folder

Everything runtime-reachable. Copy of commit `47f81b0` with names swapped.

### Changes Required

**`src/shared/constants/seo.constants.ts`** — Modify, append after `CORTE_CONFORMADO_DESCRIPTION` (line ~29):

```ts
export const PERFORACION_TITLE =
  "Brocas Industriales y Perforación en Puebla | Tehesa"
export const PERFORACION_DESCRIPTION =
  "Brocas Bohrcraft, juegos y accesorios de perforación para industria. Distribuidor directo en Puebla. Cotiza por WhatsApp."
```

**`src/shared/constants/category.constants.ts`** — Modify:
- Extend the existing import with `PERFORACION_DESCRIPTION` (keep alphabetical order).
- After `CORTE_CONFORMADO_CATEGORY_ID`: `export const PERFORACION_CATEGORY_ID = "perforacion-accesorios-taladro"`.
- `CATEGORY_PAGE_HREFS`: add `[PERFORACION_CATEGORY_ID]: "/categorias/perforacion-accesorios-taladro"`.
- `CATEGORY_PAGES`: add
  ```ts
  [PERFORACION_CATEGORY_ID]: {
    name: "Perforación y accesorios para taladro",
    heading: "Perforación y accesorios de taladro",
    intro: PERFORACION_DESCRIPTION,
    searchPlaceholder: "Buscar brocas, juegos, portabrocas...",
  },
  ```
  Edge case: `name` ≠ `heading` on purpose (D3) — `name` feeds breadcrumb/JSON-LD/error copy and must match the live Strapi name shown in the header dropdown; `heading` is the `<h1>` only.

**`src/app/categorias/perforacion-accesorios-taladro/page.tsx`** — Create. Byte-for-byte copy of `src/app/categorias/herramientas-corte-conformado/page.tsx` with:
- `CORTE_CONFORMADO_CATEGORY_ID` → `PERFORACION_CATEGORY_ID`, `CORTE_CONFORMADO_TITLE/DESCRIPTION` → `PERFORACION_TITLE/DESCRIPTION`.
- `alternates.canonical: "/categorias/perforacion-accesorios-taladro"`.
- Component name `PerforacionRoute`.
- `breadcrumbJsonLd` position 3 reads `CATEGORY_PAGES[PERFORACION_CATEGORY_ID].name` / `CATEGORY_PAGE_HREFS[PERFORACION_CATEGORY_ID]` — no literal strings beyond the canonical.

**`src/app/categorias/perforacion-accesorios-taladro/error.tsx`** — Create. Copy of `herramientas-corte-conformado/error.tsx` with the id swapped: `"use client"`, renders `<CategoryPageError categoryName={CATEGORY_PAGES[PERFORACION_CATEGORY_ID].name} reset={reset} />`.

**`src/app/categorias/perforacion-accesorios-taladro/loading.tsx`** — Create. One line: `export { CategoryPageSkeleton as default } from "@/features/CategoryPage/CategoryPageSkeleton"`.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test` — full suite still passes after Phase 1: `CategoriesPage.test.tsx`'s fixture does not yet contain the new `customId`, and `sitemap.test.ts` counts `Object.keys(CATEGORY_PAGE_HREFS).length`, so it self-adjusts.

**Dev-server validation** (`pnpm dev`, `http://localhost:3000`)
- `curl -s -o /dev/null -w '%{http_code}' localhost:3000/categorias/perforacion-accesorios-taladro` → `200`.
- `curl -s localhost:3000/categorias/perforacion-accesorios-taladro` contains:
  - `<title>Brocas Industriales y Perforación en Puebla | Tehesa</title>`
  - `name="description" content="Brocas Bohrcraft, juegos y accesorios de perforación para industria. Distribuidor directo en Puebla. Cotiza por WhatsApp."`
  - `canonical` href ending `/categorias/perforacion-accesorios-taladro`, and `robots` `index, follow`.
  - `<h1` … `Perforación y accesorios de taladro</h1>` (`grep -c '<h1'` → matches the sibling routes' count; Corte/Conformado observed 2 because of a pre-existing second `<h1` in shared chrome — not a regression).
  - `aria-label="Ruta"` and an `aria-current="page"` element whose text is `Perforación y accesorios para taladro` (**para**, not **de**).
  - `Categoría` kicker, the intro text (same string as the description), `51 productos` (today's live count), `Buscar brocas, juegos, portabrocas...`.
  - `application/ld+json` script containing `"BreadcrumbList"` and `"Perforación y accesorios para taladro"`.
  - `Filtrar marcas`; must **not** contain `Filtrar subcategorías`; no pagination markup.
- `curl -s localhost:3000/sitemap.xml | grep -c 'categorias/perforacion-accesorios-taladro'` → `1`.
- `curl -s localhost:3000/categorias` contains `href="/categorias/perforacion-accesorios-taladro"` (card CTA is an `<a>`).
- `curl -s localhost:3000/` contains `href="/categorias/perforacion-accesorios-taladro"` (header dropdown row — client-rendered by HeroUI; if absent from SSR HTML, fall back to the manual check, not a failure).
- Dev-server log: no errors, no hydration warnings, no `CAT_ERR_*`.

**Manual**
- Open `/categorias/perforacion-accesorios-taladro`: header `Categorías` dropdown shows the row as active; mobile accordion trigger reads `Categorías (actual)` and the row has `aria-current="page"`.
- Brand dropdown offers exactly Bohrcraft, Bondhus, Weston; selecting one hides the 5 `brand: null` products (expected, research edge case).

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/shared/constants/category.constants.ts` | new id/href/config entry, description import, `name`≠`heading` split | `pnpm exec tsc --noEmit` + sitemap/`/categorias` curls + breadcrumb vs `<h1>` curl |
| `src/shared/constants/seo.constants.ts` | exact title/description strings | curl `<title>`/`description` on the route |
| `src/app/categorias/perforacion-accesorios-taladro/page.tsx` | metadata, JSON-LD leaf, grid with live products | curl checks above |
| `src/app/categorias/perforacion-accesorios-taladro/error.tsx` | heading uses config `name`, reset wired | Phase 2 test |
| `src/app/categorias/perforacion-accesorios-taladro/loading.tsx` | re-export resolves | `pnpm exec tsc --noEmit` |

---

## Phase 2 — Tests + docs

### Changes Required

**`__tests__/seo/perforacion-accesorios-taladro-metadata.test.ts`** — Create. Copy of `__tests__/seo/corte-conformado-metadata.test.ts` (`@jest-environment node`): import `generateMetadata` from `@/app/categorias/perforacion-accesorios-taladro/page` and `PERFORACION_TITLE/DESCRIPTION`; assert title, description, `alternates` `{ canonical: "/categorias/perforacion-accesorios-taladro" }`, `robots` `{ index: true, follow: true }`.

**`__tests__/app/perforacion-accesorios-taladro-error.test.tsx`** — Create. Copy of `__tests__/app/corte-conformado-error.test.tsx` (jsdom, `render`/`screen`/`userEvent` from `@__tests__/test-utils`): heading `No pudimos cargar los productos de Perforación y accesorios para taladro`, click `Intentar de nuevo` → `reset` called once.

**`__tests__/seo/sitemap.test.ts`** — Modify, both `it` blocks (after lines ~60 and ~103): after the `/categorias/herramientas-corte-conformado` assertion add
`expect(result.some((entry) => entry.url.endsWith("/categorias/perforacion-accesorios-taladro"))).toBe(true)`.

**`__tests__/categories/CategoriesPage.test.tsx`** — Modify (lines ~21–83):
- Fixture: add `{ name: "Perforación y accesorios para taladro", customId: "perforacion-accesorios-taladro", productCount: 51 }`.
- First `it` (line 38): `hrefs` `arrayContaining` gains `"/categorias/perforacion-accesorios-taladro"`; `expect(linkCtas).toHaveLength(5)`; `disabledCtas` → `categories.length - 5`; update the `it` title to include Perforación.
- Second `it` (line 70): add `expect(screen.getByText("51 productos"))`; `queryAllByText(/productos$/)` → `5`.
- Third `it` (line 80): `/5 categorías/` → `/6 categorías/`.

**`ai-skills/REPO_CONTEXT.md`** — Modify. Add the fifth route wherever the four are enumerated (lines ~70, 76, 234, 327, 355): a `categorias/perforacion-accesorios-taladro/page.tsx` row in both route tables, `/categorias/perforacion-accesorios-taladro` in the two sitemap sentences, and the folder in the "ship their own error/loading" bullet. Same one-line style; note "51 live products, no `subcategory`, so the subcategory dropdown stays hidden; slug equals the Strapi `customId`; `name` (Strapi, *para*) ≠ `heading` (user H1, *de*)".

### Success Criteria

**Automated**
- `pnpm test -- __tests__/seo/perforacion-accesorios-taladro-metadata.test.ts __tests__/app/perforacion-accesorios-taladro-error.test.tsx __tests__/seo/sitemap.test.ts __tests__/categories/CategoriesPage.test.tsx`
- `pnpm test` (full suite, AC 5)
- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` (AC 5)
- `git diff --stat -- src/features/CategoryPage` → empty (AC 4).

**Dev-server validation**
- Skipped for the test/docs files themselves (nothing runtime-reachable). Re-run the Phase 1 `GET /categorias/perforacion-accesorios-taladro` → `200` and the `sitemap.xml` grep once after `pnpm build` to confirm nothing regressed.

**Manual**
- None.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `__tests__/seo/perforacion-accesorios-taladro-metadata.test.ts` | title/description/canonical/robots | `pnpm test -- <path>` |
| `__tests__/app/perforacion-accesorios-taladro-error.test.tsx` | error heading copy (Strapi `name`) + reset | `pnpm test -- <path>` |
| `__tests__/seo/sitemap.test.ts` | new href in both success and degraded paths | `pnpm test -- <path>` |
| `__tests__/categories/CategoriesPage.test.tsx` | five link CTAs, disabled count, pills, category count | `pnpm test -- <path>` |
| `ai-skills/REPO_CONTEXT.md` | route tables list the fifth category | eyeball diff |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 - Route + data (metadata, canonical, robots, JSON-LD, unpaginated grid) | Phase 1 | `GET /categorias/perforacion-accesorios-taladro` 200; contains `<title>Brocas Industriales y Perforación en Puebla \| Tehesa</title>`, the description meta, canonical `/categorias/perforacion-accesorios-taladro`, `index, follow`, `BreadcrumbList` JSON-LD with `Perforación y accesorios para taladro`, `51 productos`, no pagination markup | Validated | All strings matched exactly on live dev server; also locked by Phase 2 test |
| AC2 - Page structure (breadcrumb leaf, kicker, h1, intro, WhatsApp panel, counter, filters, no subcategory dropdown, own error/loading) | Phase 1, Phase 2 | Same curl: `aria-label="Ruta"`, `aria-current="page"` leaf `Perforación y accesorios para taladro`, `<h1>Perforación y accesorios de taladro</h1>`, `51 productos`, `Buscar brocas, juegos, portabrocas...`, `Filtrar marcas`, **not** `Filtrar subcategorías` | Validated | Phase 1 curl confirmed all of the above (h1 count 2, matching sibling routes). Brand option list is manual; error boundary copy is Phase 2 test (cannot trigger via curl) |
| AC3 - Entry points light up (header row, mobile row, `/categorias` CTA, sitemap, active state) | Phase 1 | `GET /sitemap.xml` contains `/categorias/perforacion-accesorios-taladro`; `GET /categorias` contains `href="/categorias/perforacion-accesorios-taladro"` | Validated | Sitemap and `/categorias` CTA confirmed via curl. Header dropdown/mobile active state is client-rendered → manual check |
| AC4 - Shared component untouched | Phase 1, Phase 2 | — | Cannot validate | Proven by `git diff --stat -- src/features/CategoryPage` empty + `pnpm test` green, not a dev-server check |
| AC5 - Verification (lint, tsc, build, test, new/updated tests) | Phase 2 | Post-`pnpm build` re-run of `GET /categorias/perforacion-accesorios-taladro` 200 | Validated | `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` (51 suites, 427 passed/1 skipped) all green; post-build curl 200 and sitemap grep 1 |

## Cross-cutting concerns

- **Env:** `STRAPI_HOST`/`STRAPI_API_TOKEN` required for the route to render products; `NEXT_PUBLIC_WHATSAPP_NUMBER` unset hides `WhatsappPanel` (not a failure). `NEXT_PUBLIC_SITE_URL` unset → JSON-LD `item` URLs use `http://localhost:3000`.
- **Server/client boundary:** `page.tsx` is a server component; `error.tsx` is `"use client"`; `loading.tsx` re-exports a server-safe skeleton. Identical to Corte/Conformado.
- **Strapi contract:** `fetchAllProductsByCategory` filters on `category.customId`; the id must be exactly `perforacion-accesorios-taladro` (same string as the URL slug). Live count is 51, one request under the 100-per-page fetch. `brand: null` on 5 products is backend-owned and displayed as-is.

## Open Questions / Out-of-scope

- **None unresolved.** D3 resolved during planning (user, 2026-09-16): `name` = Strapi `... para taladro`, `heading` = `... de taladro`.
- Out of scope (research): dynamic `/categorias/[slug]` route, any diff to `CategoryPage`/`Header`/`MobileMenu`/`CategoryCard`/`sitemap.ts`/queries/actions, product images, other categories, renaming the Strapi category, fixing `brand: null` data.
- Not touched: `__tests__/shared/Header.test.tsx` (does not enumerate category ids beyond Tornillería). The prose sentence in `CategoriesPage.tsx` listing example categories stays as-is.
