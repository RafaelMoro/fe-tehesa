# Plan: Herramientas de corte y conformado category page (`/categorias/herramientas-corte-conformado`)

**Source research:** `ai-research/corte-conformado-category-page.story.md` (2026-09-16, branch `feat/add-page-herr-cort-conf`).
**Sign-off status:** no explicit sign-off line, but every open question is `answered` (Strapi I, UI I–II, Verification I) and D1–D3 are recorded as decided with the user on 2026-09-16. Treated as signed off — same basis as `ai-planning/impacto-forja-category-page.story.md`. **Confirm before `/implement`.**
**Plan date:** 2026-09-16.

## Assumptions

- The Abrasivos AC 3 contract still holds: `grep -rl impacto src` hits only `category.constants.ts` and `impacto-forja/page.tsx`, so `CategoryPage`, `Header`, `MobileMenu`, `CategoryCard`, `sitemap.ts`, queries and server actions need no diff.
- Copy is verbatim from the research table. `name` = `heading` = `Herramientas de corte y conformado` (Strapi name and user H1 coincide this time). `intro` = `CORTE_CONFORMADO_DESCRIPTION` (D1).
- Slug equals `customId` (`herramientas-corte-conformado`) per D3; the map key is still the `customId` and the href is still `/categorias/herramientas-corte-conformado`. Do not shorten it.
- Env: `.env.local` has `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. Dev-server checks assume `pnpm dev` on `http://localhost:3000` and today's live data (75 products, all `subcategory: null`, brands Bohrcraft/Bondhus/Clevaland/Precision/Weston, ~59 with `brand: null`).

## Acceptance Criteria

1. **Route + data.** `GET /categorias/herramientas-corte-conformado` is server-rendered, fetches every published product with `category.customId == "herramientas-corte-conformado"` via `fetchAllProductsByCategory("herramientas-corte-conformado")`, renders them in one unpaginated grid. `generateMetadata` returns the exact title/description above, `alternates.canonical: "/categorias/herramientas-corte-conformado"`, `robots: { index: true, follow: true }`. A 3-item `BreadcrumbList` JSON-LD (`Inicio` / `Categorías` / `Herramientas de corte y conformado`) is emitted.
2. **Page structure.** Same DOM shape as Impacto/Forja: `nav[aria-label="Ruta"]` with leaf `Herramientas de corte y conformado` (`aria-current="page"`), kicker `Categoría`, `<h1>Herramientas de corte y conformado</h1>`, intro paragraph, `WhatsappPanel`, live `N productos` counter, filter row with `SearchInput` + `Filtrar marcas` (5 options: Bohrcraft, Bondhus, Clevaland, Precision, Weston). `Filtrar subcategorías` stays hidden (no product carries `subcategory`, Strapi I). Own `error.tsx` (`No pudimos cargar los productos de Herramientas de corte y conformado`) and `loading.tsx` under `src/app/categorias/herramientas-corte-conformado/`.
3. **Entry points light up with no code changes.** `CATEGORY_PAGE_HREFS` gains `"herramientas-corte-conformado": "/categorias/herramientas-corte-conformado"`; header `Categorías` dropdown row, mobile accordion row, `/categorias` card CTA, sitemap entry and header active state (`pageCategoryId`) all follow from the map.
4. **Shared component untouched.** `src/features/CategoryPage/*` has no diff. Existing category pages/tests are unchanged except where a test enumerates the href map.
5. **Verification.** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass. New tests: `__tests__/seo/corte-conformado-metadata.test.ts`, `__tests__/app/corte-conformado-error.test.tsx`; `sitemap.test.ts` asserts `/categorias/herramientas-corte-conformado` in both `it`s; `CategoriesPage.test.tsx` fixture gains the new category and `linkCtas` 3 → 4 / `disabledCtas` `length - 4`.

## Affected files

**`src/app/**`**
- `src/app/categorias/herramientas-corte-conformado/page.tsx` — Create
- `src/app/categorias/herramientas-corte-conformado/error.tsx` — Create
- `src/app/categorias/herramientas-corte-conformado/loading.tsx` — Create

**`src/shared/**`**
- `src/shared/constants/category.constants.ts` — Modify
- `src/shared/constants/seo.constants.ts` — Modify

**Tests (`__tests__/**`)**
- `__tests__/seo/corte-conformado-metadata.test.ts` — Create
- `__tests__/app/corte-conformado-error.test.tsx` — Create
- `__tests__/seo/sitemap.test.ts` — Modify
- `__tests__/categories/CategoriesPage.test.tsx` — Modify

**Docs**
- `ai-skills/REPO_CONTEXT.md` — Modify (route tables)

No changes under `src/features/**`, `src/components/**`, `src/zustand/**`, `src/app/api/**`.

---

## Phase 1 — Constants + route folder

Everything runtime-reachable. Copy of commit `b6602e3` with names swapped.

### Changes Required

**`src/shared/constants/seo.constants.ts`** — Modify, append after `IMPACTO_FORJA_DESCRIPTION`:

```ts
export const CORTE_CONFORMADO_TITLE =
  "Herramientas de Corte y Machuelos en Puebla | Tehesa"
export const CORTE_CONFORMADO_DESCRIPTION =
  "Machuelos, buriles, cortadores y herramienta de corte para torno y maquinado. Marcas de calidad en Puebla. Solicita tu cotización."
```

**`src/shared/constants/category.constants.ts`** — Modify:
- Extend the existing import with `CORTE_CONFORMADO_DESCRIPTION`.
- After `IMPACTO_FORJA_CATEGORY_ID`: `export const CORTE_CONFORMADO_CATEGORY_ID = "herramientas-corte-conformado"`.
- `CATEGORY_PAGE_HREFS`: add `[CORTE_CONFORMADO_CATEGORY_ID]: "/categorias/herramientas-corte-conformado"`.
- `CATEGORY_PAGES`: add
  ```ts
  [CORTE_CONFORMADO_CATEGORY_ID]: {
    name: "Herramientas de corte y conformado",
    heading: "Herramientas de corte y conformado",
    intro: CORTE_CONFORMADO_DESCRIPTION,
    searchPlaceholder: "Buscar machuelos, buriles, cortadores...",
  },
  ```

**`src/app/categorias/herramientas-corte-conformado/page.tsx`** — Create. Byte-for-byte copy of `src/app/categorias/impacto-forja/page.tsx` with:
- `IMPACTO_FORJA_CATEGORY_ID` → `CORTE_CONFORMADO_CATEGORY_ID`, `IMPACTO_FORJA_TITLE/DESCRIPTION` → `CORTE_CONFORMADO_TITLE/DESCRIPTION`.
- `alternates.canonical: "/categorias/herramientas-corte-conformado"`.
- Component name `CorteConformadoRoute`.
- `breadcrumbJsonLd` position 3 reads `CATEGORY_PAGES[CORTE_CONFORMADO_CATEGORY_ID].name` / `CATEGORY_PAGE_HREFS[CORTE_CONFORMADO_CATEGORY_ID]` — no literal strings beyond the canonical.

**`src/app/categorias/herramientas-corte-conformado/error.tsx`** — Create. Copy of `impacto-forja/error.tsx` with the id swapped: `"use client"`, renders `<CategoryPageError categoryName={CATEGORY_PAGES[CORTE_CONFORMADO_CATEGORY_ID].name} reset={reset} />`.

**`src/app/categorias/herramientas-corte-conformado/loading.tsx`** — Create. One line: `export { CategoryPageSkeleton as default } from "@/features/CategoryPage/CategoryPageSkeleton"`.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test` — full suite still passes after Phase 1: `CategoriesPage.test.tsx`'s fixture does not yet contain the new `customId`, and `sitemap.test.ts` counts `Object.keys(CATEGORY_PAGE_HREFS).length`, so it self-adjusts.

**Dev-server validation** (`pnpm dev`, `http://localhost:3000`)
- `curl -s -o /dev/null -w '%{http_code}' localhost:3000/categorias/herramientas-corte-conformado` → `200`.
- `curl -s localhost:3000/categorias/herramientas-corte-conformado` contains:
  - `<title>Herramientas de Corte y Machuelos en Puebla | Tehesa</title>`
  - `name="description" content="Machuelos, buriles, cortadores y herramienta de corte para torno y maquinado. Marcas de calidad en Puebla. Solicita tu cotización."`
  - `canonical` href ending `/categorias/herramientas-corte-conformado`, and `robots` `index, follow` (grep `canonical` and `index`).
  - `<h1` … `Herramientas de corte y conformado</h1>` (grep `-c '<h1'` → 1).
  - `aria-label="Ruta"` and an `aria-current="page"` element whose text is `Herramientas de corte y conformado`.
  - `Categoría` kicker, the intro text (same string as the description), `75 productos` (today's live count), `Buscar machuelos, buriles, cortadores...`.
  - `application/ld+json` script containing `"BreadcrumbList"` and `"Herramientas de corte y conformado"`.
  - `Filtrar marcas`; must **not** contain `Filtrar subcategorías`; no pagination markup.
- `curl -s localhost:3000/sitemap.xml | grep -c 'categorias/herramientas-corte-conformado'` → `1`.
- `curl -s localhost:3000/categorias` contains `href="/categorias/herramientas-corte-conformado"` (card CTA is an `<a>`).
- `curl -s localhost:3000/` contains `href="/categorias/herramientas-corte-conformado"` (header dropdown row — client-rendered by HeroUI; if absent from SSR HTML, fall back to the manual check, not a failure).
- Dev-server log: no errors, no hydration warnings, no `CAT_ERR_*`.

**Manual**
- Open `/categorias/herramientas-corte-conformado`: header `Categorías` dropdown shows the row as active; mobile accordion trigger reads `Categorías (actual)` and the row has `aria-current="page"`.
- Brand dropdown offers exactly Bohrcraft, Bondhus, Clevaland, Precision, Weston; selecting one hides the ~59 `brand: null` products (expected, research edge case).

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/shared/constants/category.constants.ts` | new id/href/config entry, description import | `pnpm exec tsc --noEmit` + sitemap/`/categorias` curls |
| `src/shared/constants/seo.constants.ts` | exact title/description strings | curl `<title>`/`description` on the route |
| `src/app/categorias/herramientas-corte-conformado/page.tsx` | metadata, JSON-LD leaf, grid with live products | curl checks above |
| `src/app/categorias/herramientas-corte-conformado/error.tsx` | heading uses config `name`, reset wired | Phase 2 test |
| `src/app/categorias/herramientas-corte-conformado/loading.tsx` | re-export resolves | `pnpm exec tsc --noEmit` |

---

## Phase 2 — Tests + docs

### Changes Required

**`__tests__/seo/corte-conformado-metadata.test.ts`** — Create. Copy of `__tests__/seo/impacto-forja-metadata.test.ts` (`@jest-environment node`): import `generateMetadata` from `@/app/categorias/herramientas-corte-conformado/page` and `CORTE_CONFORMADO_TITLE/DESCRIPTION`; assert title, description, `alternates` `{ canonical: "/categorias/herramientas-corte-conformado" }`, `robots` `{ index: true, follow: true }`.

**`__tests__/app/corte-conformado-error.test.tsx`** — Create. Copy of `__tests__/app/impacto-forja-error.test.tsx` (jsdom, `render`/`screen`/`userEvent` from `@__tests__/test-utils`): heading `No pudimos cargar los productos de Herramientas de corte y conformado`, click `Intentar de nuevo` → `reset` called once.

**`__tests__/seo/sitemap.test.ts`** — Modify, both `it` blocks (lines ~56, ~94): after the `/categorias/impacto-forja` assertion add
`expect(result.some((entry) => entry.url.endsWith("/categorias/herramientas-corte-conformado"))).toBe(true)`.

**`__tests__/categories/CategoriesPage.test.tsx`** — Modify (lines ~21–76):
- Fixture: add `{ name: "Herramientas de corte y conformado", customId: "herramientas-corte-conformado", productCount: 75 }`.
- First `it`: `hrefs` `arrayContaining` gains `"/categorias/herramientas-corte-conformado"`; `expect(linkCtas).toHaveLength(4)`; `disabledCtas` → `categories.length - 4`; update the `it` title so it no longer claims only Tornillería/Abrasivos are links.
- Second `it` (pills): add `expect(screen.getByText("75 productos"))`; `queryAllByText(/productos$/)` → `4`.
- Third `it`: `/4 categorías/` → `/5 categorías/`.

**`ai-skills/REPO_CONTEXT.md`** — Modify. Add the fourth route wherever the three are enumerated (lines ~69, 75, 233, 326, 353): a `categorias/herramientas-corte-conformado/page.tsx` row in both route tables, `/categorias/herramientas-corte-conformado` in the two sitemap sentences, and the folder in the "ship their own error/loading" bullet. Same one-line style; note "75 live products, no `subcategory`, so the subcategory dropdown stays hidden; slug equals the Strapi `customId`".

### Success Criteria

**Automated**
- `pnpm test -- __tests__/seo/corte-conformado-metadata.test.ts __tests__/app/corte-conformado-error.test.tsx __tests__/seo/sitemap.test.ts __tests__/categories/CategoriesPage.test.tsx`
- `pnpm test` (full suite, AC 5)
- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` (AC 5)
- `git diff --stat -- src/features/CategoryPage` → empty (AC 4).

**Dev-server validation**
- Skipped for the test/docs files themselves (nothing runtime-reachable). Re-run the Phase 1 `GET /categorias/herramientas-corte-conformado` → `200` and the `sitemap.xml` grep once after `pnpm build` to confirm nothing regressed.

**Manual**
- None.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `__tests__/seo/corte-conformado-metadata.test.ts` | title/description/canonical/robots | `pnpm test -- <path>` |
| `__tests__/app/corte-conformado-error.test.tsx` | error heading copy + reset | `pnpm test -- <path>` |
| `__tests__/seo/sitemap.test.ts` | new href in both success and degraded paths | `pnpm test -- <path>` |
| `__tests__/categories/CategoriesPage.test.tsx` | four link CTAs, disabled count, pills, category count | `pnpm test -- <path>` |
| `ai-skills/REPO_CONTEXT.md` | route tables list the fourth category | eyeball diff |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 - Route + data (metadata, canonical, robots, JSON-LD, unpaginated grid) | Phase 1 | `GET /categorias/herramientas-corte-conformado` 200; contains `<title>Herramientas de Corte y Machuelos en Puebla \| Tehesa</title>`, the description meta, canonical `/categorias/herramientas-corte-conformado`, `index, follow`, `BreadcrumbList` JSON-LD with `Herramientas de corte y conformado`, `75 productos`, no pagination markup | Validated | Confirmed on dev server 2026-09-16; metadata also locked by Phase 2 test |
| AC2 - Page structure (breadcrumb leaf, kicker, h1, intro, WhatsApp panel, counter, filters, no subcategory dropdown, own error/loading) | Phase 1, Phase 2 | Same curl: `aria-label="Ruta"`, `aria-current="page"` leaf `Herramientas de corte y conformado`, `<h1>Herramientas de corte y conformado</h1>`, `75 productos`, `Buscar machuelos, buriles, cortadores...`, `Filtrar marcas`, **not** `Filtrar subcategorías` | Validated | Confirmed on dev server 2026-09-16 (matches impacto-forja's pre-existing 2-h1 pattern); brand option list and error boundary copy remain manual / `corte-conformado-error.test.tsx` (cannot trigger via curl) |
| AC3 - Entry points light up (header row, mobile row, `/categorias` CTA, sitemap, active state) | Phase 1 | `GET /sitemap.xml` contains `/categorias/herramientas-corte-conformado`; `GET /categorias` contains `href="/categorias/herramientas-corte-conformado"` | Validated | Sitemap and `/categorias` CTA confirmed 2026-09-16; header dropdown/mobile active state is client-rendered → manual check |
| AC4 - Shared component untouched | Phase 1, Phase 2 | `git diff --stat -- src/features/CategoryPage` empty; existing category tests pass unchanged | Cannot validate | `git diff --stat -- src/features/CategoryPage` confirmed empty and `pnpm test` (49 suites, 425 passed / 1 skipped) confirmed 2026-09-16; proven by git diff + test run, not a dev-server check |
| AC5 - Verification (lint, tsc, build, test, new/updated tests) | Phase 2 | Post-`pnpm build` re-run of `GET /categorias/herramientas-corte-conformado` 200 | Validated | `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` all pass 2026-09-16; post-build curl of the route returns 200 and `sitemap.xml` contains the new entry |

## Cross-cutting concerns

- **Env:** `STRAPI_HOST`/`STRAPI_API_TOKEN` required for the route to render products; `NEXT_PUBLIC_WHATSAPP_NUMBER` unset hides `WhatsappPanel` (not a failure). `NEXT_PUBLIC_SITE_URL` unset → JSON-LD `item` URLs use `http://localhost:3000`.
- **Server/client boundary:** `page.tsx` is a server component; `error.tsx` is `"use client"`; `loading.tsx` re-exports a server-safe skeleton. Identical to Impacto/Forja.
- **Strapi contract:** `fetchAllProductsByCategory` filters on `category.customId`; the id must be exactly `herramientas-corte-conformado`. Live count is 75 — the largest category page so far but still one request under the 100-per-page fetch. `brand: null` on ~59 products and the `Clevaland` spelling are backend-owned and displayed as-is.

## Open Questions / Out-of-scope

- **None unresolved.**
- Out of scope (research): dynamic `/categorias/[slug]` route, any diff to `CategoryPage`/`Header`/`MobileMenu`/`CategoryCard`/`sitemap.ts`/queries/actions, product images, other categories, fixing `brand: null` data.
- Not touched: `__tests__/shared/Header.test.tsx` (does not enumerate category ids beyond Tornillería). The prose sentence in `CategoriesPage.tsx` listing example categories stays as-is.
