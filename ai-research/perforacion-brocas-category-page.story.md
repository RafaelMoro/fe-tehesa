# Perforación y accesorios de taladro category page (`/categorias/perforacion-accesorios-taladro`) — Research (quick note)

**Date:** 2026-09-16
**Branch:** `feat/add-brocas-perf-page`
**Scope:** standalone story, 1 phase
**Reference stories:** `ai-research/corte-conformado-category-page.story.md` (the exact recipe this repeats — commits
`47f81b0` + `2ad23b6`), `ai-research/abrasivos-category-page.story.md` (shared `CategoryPage` architecture,
decisions D1–D4, "adding another category" contract in its AC 3), `ai-research/tornilleria-category-page.story.md`
(original comps). No new design work.

## Story Definition

### Title

Add `/categorias/perforacion-accesorios-taladro` as the fifth consumer of the shared `CategoryPage` feature.

### Description

Same contract as Corte/Conformado: one `CATEGORY_PAGES` config entry, one `CATEGORY_PAGE_HREFS` entry, one SEO
title/description pair, one `src/app/categorias/<slug>/` folder (`page.tsx`, `error.tsx`, `loading.tsx`), plus
the matching tests and doc rows. Strapi category **`Perforación y accesorios para taladro`**
(`customId: "perforacion-accesorios-taladro"`) with the user-supplied copy:

| Field              | Value                                                                                                                        | Source      |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ----------- |
| URL                | `/categorias/perforacion-accesorios-taladro`                                                                                             | user        |
| `<title>`          | `Brocas Industriales y Perforación en Puebla \| Tehesa`                                                                      | user        |
| Meta description   | `Brocas Bohrcraft, juegos y accesorios de perforación para industria. Distribuidor directo en Puebla. Cotiza por WhatsApp.` | user        |
| H1                 | `Perforación y accesorios de taladro`                                                                                        | user        |
| Hero intro         | = meta description text                                                                                                      | user (D1)   |
| Search placeholder | `Buscar brocas, juegos, portabrocas...`                                                                                      | user (D2)   |
| Breadcrumb / JSON-LD leaf, error heading | `CATEGORY_PAGES[id].name` = `Perforación y accesorios para taladro`                                    | Strapi name |

Slug equals the Strapi `customId` (`perforacion-accesorios-taladro`), like Corte/Conformado (user, 2026-09-16 — replaced
the earlier `perforacion-brocas` slug). One spelling gap, harmless to the code but worth knowing:

- Strapi `name` says **para** taladro, the user's H1 says **de** taladro. `CategoryPageConfig` already separates
  `name` (breadcrumb/JSON-LD/error copy, matches the header dropdown row which renders the live Strapi name) from
  `heading` (the `<h1>`), exactly like `Tornillería` vs `Tornillería y fijación industrial`. Assumed: keep `name`
  = Strapi, `heading` = user H1 (UI/product I).

**Out of scope:** a dynamic `/categorias/[slug]` route (Abrasivos D4 stands), any change to `CategoryPage`,
`Header`, `MobileMenu`, `CategoryCard`, `sitemap.ts`, queries or server actions, product images, other categories,
renaming the Strapi category, fixing `brand: null` on 5 of the 51 products (backend data).

### Acceptance criteria

1. **Route + data.** `GET /categorias/perforacion-accesorios-taladro` is server-rendered, fetches every published product with
   `category.customId == "perforacion-accesorios-taladro"` via
   `fetchAllProductsByCategory("perforacion-accesorios-taladro")`, renders them in one unpaginated grid.
   `generateMetadata` returns the exact title/description above, `alternates.canonical: "/categorias/perforacion-accesorios-taladro"`,
   `robots: { index: true, follow: true }`. A 3-item `BreadcrumbList` JSON-LD (`Inicio` / `Categorías` /
   `Perforación y accesorios para taladro`) is emitted.
2. **Page structure.** Same DOM shape as Corte/Conformado: `nav[aria-label="Ruta"]` with leaf
   `Perforación y accesorios para taladro` (`aria-current="page"`), kicker `Categoría`,
   `<h1>Perforación y accesorios de taladro</h1>`, intro paragraph, `WhatsappPanel`, live `N productos` counter,
   filter row with `SearchInput` + `Filtrar marcas` (3 options: Bohrcraft, Bondhus, Weston).
   `Filtrar subcategorías` stays hidden (no product carries `subcategory`, Strapi I). Own `error.tsx`
   (`No pudimos cargar los productos de Perforación y accesorios para taladro`) and `loading.tsx` under
   `src/app/categorias/perforacion-accesorios-taladro/`.
3. **Entry points light up with no code changes.** `CATEGORY_PAGE_HREFS` gains
   `"perforacion-accesorios-taladro": "/categorias/perforacion-accesorios-taladro"`; header `Categorías` dropdown row, mobile
   accordion row, `/categorias` card CTA, sitemap entry and header active state (`pageCategoryId`) all follow from
   the map.
4. **Shared component untouched.** `src/features/CategoryPage/*` has no diff. Existing category pages/tests are
   unchanged except where a test enumerates the href map.
5. **Verification.** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass. New tests:
   `__tests__/seo/perforacion-accesorios-taladro-metadata.test.ts`, `__tests__/app/perforacion-accesorios-taladro-error.test.tsx`;
   `sitemap.test.ts` asserts `/categorias/perforacion-accesorios-taladro` in both `it`s; `CategoriesPage.test.tsx` fixture
   gains the new category and `linkCtas` 4 → 5 / `disabledCtas` `length - 5`.

## Design Agent Handoff

None. Copy swap on the Tornillería comps; no new visual state. Carried-over rules: render the full
hero/breadcrumb/WhatsApp panel on an empty or small set; the subcategory dropdown is simply absent when there is
nothing to filter.

### Decision record

- **D1 — Hero intro.** Decided (user, 2026-09-16): reuse the meta description, i.e.
  `intro: PERFORACION_DESCRIPTION`.
- **D2 — Search placeholder.** Decided (user, 2026-09-16): `Buscar brocas, juegos, portabrocas...`.
- **D3 — `name` vs `heading`.** Assumed (see UI/product I): `name` = Strapi `Perforación y accesorios para
  taladro`, `heading` = user H1 `Perforación y accesorios de taladro`. Confirmed by the user during planning
  (2026-09-16).

## Technical Research

### Affected areas (mirror of commits `47f81b0` / `2ad23b6`)

- `src/shared/constants/category.constants.ts` — `PERFORACION_CATEGORY_ID = "perforacion-accesorios-taladro"`,
  new `CATEGORY_PAGE_HREFS` entry, new `CATEGORY_PAGES` entry (`name`, `heading`, `intro`, `searchPlaceholder`);
  import `PERFORACION_DESCRIPTION` next to the existing three.
- `src/shared/constants/seo.constants.ts` — `PERFORACION_TITLE`, `PERFORACION_DESCRIPTION` after the
  Corte/Conformado pair.
- `src/app/categorias/perforacion-accesorios-taladro/page.tsx` — copy of `herramientas-corte-conformado/page.tsx` with the
  ID/constant names and canonical swapped.
- `src/app/categorias/perforacion-accesorios-taladro/error.tsx` — copy of `herramientas-corte-conformado/error.tsx`.
- `src/app/categorias/perforacion-accesorios-taladro/loading.tsx` — one-line re-export of `CategoryPageSkeleton`.
- Tests: new `__tests__/seo/perforacion-accesorios-taladro-metadata.test.ts`, `__tests__/app/perforacion-accesorios-taladro-error.test.tsx`
  (templates: the Corte/Conformado twins); edit `__tests__/seo/sitemap.test.ts` (lines ~60, ~103) and
  `__tests__/categories/CategoriesPage.test.tsx` (fixture lines 21–35, counts lines ~50–60, `it` title).
  `__tests__/shared/Header.test.tsx` does not enumerate categories; no change.
- Docs: `ai-skills/REPO_CONTEXT.md` route tables (lines ~70, 76, 234, 327, 355) list four category routes; add
  the fifth in the implementation PR.

### Existing patterns to follow

- Route shell: literal `generateMetadata`, module-level `breadcrumbJsonLd` from `SITE_URL` +
  `CATEGORY_PAGE_HREFS[id]` + `CATEGORY_PAGES[id].name`, `toJsonLdHtml`, one `<main>` with
  `mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5`. Build nothing shared beyond what exists.
- `seo.constants.ts` imports nothing from `category.constants.ts`, so the description import is not circular.
- Tests follow `docs/UNIT_TESTING_GUIDELINES.md`; metadata test is `@jest-environment node`, error test is jsdom
  with `render`/`userEvent` from `@__tests__/test-utils`.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test`.
- Dev server + curl (project implement convention):
  `curl -s localhost:3000/categorias/perforacion-accesorios-taladro | grep -c '<h1>'`,
  `curl -s localhost:3000/sitemap.xml | grep perforacion-accesorios-taladro`, `/categorias` card CTA is an `<a>` for the new
  category.

### Dependencies / integration points

- No new dependencies. Env: `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL`.
- PR to `develop`, label `minor` (new route; matches PRs #45/#47/#48/#49).

### Edge cases and constraints

- Product count today: **51**, all `subcategory: null` (Strapi I). Under one `fetchAllProductsByCategory` page
  (100), so a single request.
- 5/51 products have `brand: null`. `CategoryPage` already drops null brands from `brandOptions`; they only
  appear with no brand filter active. Expected; no code change.
- Meta description names Bohrcraft, but Weston is the dominant brand (33/51). Copy is the user's call; no code
  impact.

## Open Questions

### Strapi contract

- I: Question: What is the Strapi `customId`/`name` for "Perforación y accesorios de taladro", how many published
  products does it have, and do they carry `subcategory` / which brands?
  - Status: answered
  - Answer: `name: "Perforación y accesorios para taladro"`, `customId: "perforacion-accesorios-taladro"`; **51**
    published products, all `subcategory: null`; brands Weston (33), Bohrcraft (10), Bondhus (3), `null` (5).
    Contents: brocas (AVV, carburo sólido, concreto SDS), juegos de brocas (25/115 pzas), broqueros, llaves y
    árboles para broquero, boquillas Cono Morse.
  - Context: `backend-research` subagent, 2026-09-16: `customId` from backend seed `data/data.json` lines 18–19;
    count via live `products_connection(filters: { category: { customId: { eq: "perforacion-accesorios-taladro" } },
    publishedAt: { notNull: true } }, pagination: { pageSize: 1 }) { pageInfo { total } }` → 51; brands/subcategory
    via a `pageSize: 100` query selecting `name subcategory brand { name }`.

### UI/product decisions

- I: Question: Strapi `name` is `Perforación y accesorios **para** taladro`; the requested H1 is `... **de**
  taladro`. Keep breadcrumb/JSON-LD/error copy on the Strapi name (D3) and only the `<h1>` on the user copy?
  - Status: answered
  - Answer: Yes — `name` = Strapi `Perforación y accesorios para taladro`, `heading` = `Perforación y accesorios de
    taladro` (user, 2026-09-16).
  - Context: The header dropdown and `/categorias` card render the live Strapi name regardless, so using the
    Strapi name for `CATEGORY_PAGES[id].name` keeps breadcrumb ↔ nav consistent. Alternative is renaming the
    category in Strapi (backend-owned, out of scope here).
- II: Question: Hero intro?
  - Status: answered
  - Answer: Reuse meta description (D1).
- III: Question: Search placeholder?
  - Status: answered
  - Answer: `Buscar brocas, juegos, portabrocas...` (D2).

### Catalog behavior / Theme / persistence

- None — no query, adapter, theme or cookie surface is touched.

### Verification

- I: Question: PR label?
  - Status: answered
  - Answer: `minor`, matching the previous category-page PRs.
