# Herramientas de corte y conformado category page (`/categorias/herramientas-corte-conformado`) — Research (quick note)

**Date:** 2026-09-16
**Branch:** `feat/add-page-herr-cort-conf`
**Scope:** standalone story, 1 phase
**Reference stories:** `ai-research/impacto-forja-category-page.story.md` (the exact recipe this repeats — commits
`b6602e3` + `35376b5`), `ai-research/abrasivos-category-page.story.md` (shared `CategoryPage` architecture,
decisions D1–D4, "adding another category" contract in its AC 3), `ai-research/tornilleria-category-page.story.md`
(original comps). No new design work.

## Story Definition

### Title

Add `/categorias/herramientas-corte-conformado` as the fourth consumer of the shared `CategoryPage` feature.

### Description

Same contract as Impacto/Forja: one `CATEGORY_PAGES` config entry, one `CATEGORY_PAGE_HREFS` entry, one SEO
title/description pair, one `src/app/categorias/<slug>/` folder (`page.tsx`, `error.tsx`, `loading.tsx`), plus
the matching tests and doc rows. Strapi category **`Herramientas de corte y conformado`**
(`customId: "herramientas-corte-conformado"`) with the user-supplied copy:

| Field              | Value                                                                                                                             | Source          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| URL                | `/categorias/herramientas-corte-conformado`                                                                                       | user            |
| `<title>`          | `Herramientas de Corte y Machuelos en Puebla \| Tehesa`                                                                            | user            |
| Meta description   | `Machuelos, buriles, cortadores y herramienta de corte para torno y maquinado. Marcas de calidad en Puebla. Solicita tu cotización.` | user            |
| H1                 | `Herramientas de corte y conformado`                                                                                              | user            |
| Hero intro         | = meta description text                                                                                                           | user (D1)       |
| Search placeholder | `Buscar machuelos, buriles, cortadores...`                                                                                        | user (D2)       |
| Breadcrumb / JSON-LD leaf, error heading | `CATEGORY_PAGES[id].name` = `Herramientas de corte y conformado`                                            | Strapi name     |

Note: here the URL slug **equals** the Strapi `customId` (`herramientas-corte-conformado`), unlike
`tornilleria` → `/categorias/tornilleria-fijacion` or `herramientas-impacto-forja` → `/categorias/impacto-forja`.
No code cares; the map key is still the `customId` and the value is still the href.

**Out of scope:** a dynamic `/categorias/[slug]` route (Abrasivos D4 stands), any change to `CategoryPage`,
`Header`, `MobileMenu`, `CategoryCard`, `sitemap.ts`, queries or server actions, product images, other categories,
fixing `brand: null` on ~59 of the 75 products (backend data, see Strapi I).

### Acceptance criteria

1. **Route + data.** `GET /categorias/herramientas-corte-conformado` is server-rendered, fetches every published
   product with `category.customId == "herramientas-corte-conformado"` via
   `fetchAllProductsByCategory("herramientas-corte-conformado")`, renders them in one unpaginated grid.
   `generateMetadata` returns the exact title/description above,
   `alternates.canonical: "/categorias/herramientas-corte-conformado"`, `robots: { index: true, follow: true }`.
   A 3-item `BreadcrumbList` JSON-LD (`Inicio` / `Categorías` / `Herramientas de corte y conformado`) is emitted.
2. **Page structure.** Same DOM shape as Impacto/Forja: `nav[aria-label="Ruta"]` with leaf
   `Herramientas de corte y conformado` (`aria-current="page"`), kicker `Categoría`,
   `<h1>Herramientas de corte y conformado</h1>`, intro paragraph, `WhatsappPanel`, live `N productos` counter,
   filter row with `SearchInput` + `Filtrar marcas` (5 options: Bohrcraft, Bondhus, Clevaland, Precision, Weston).
   `Filtrar subcategorías` stays hidden (no product carries `subcategory`, Strapi I). Own `error.tsx`
   (`No pudimos cargar los productos de Herramientas de corte y conformado`) and `loading.tsx` under
   `src/app/categorias/herramientas-corte-conformado/`.
3. **Entry points light up with no code changes.** `CATEGORY_PAGE_HREFS` gains
   `"herramientas-corte-conformado": "/categorias/herramientas-corte-conformado"`; header `Categorías` dropdown
   row, mobile accordion row, `/categorias` card CTA, sitemap entry and header active state (`pageCategoryId`)
   all follow from the map.
4. **Shared component untouched.** `src/features/CategoryPage/*` has no diff. Existing category pages/tests are
   unchanged except where a test enumerates the href map.
5. **Verification.** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass. New tests:
   `__tests__/seo/corte-conformado-metadata.test.ts`, `__tests__/app/corte-conformado-error.test.tsx`;
   `sitemap.test.ts` asserts `/categorias/herramientas-corte-conformado` in both `it`s;
   `CategoriesPage.test.tsx` fixture gains the new category and `linkCtas` 3 → 4 / `disabledCtas`
   `length - 4`.

## Design Agent Handoff

None. Copy swap on the Tornillería comps; no new visual state. Carried-over rules: render the full
hero/breadcrumb/WhatsApp panel on an empty or small set; the subcategory dropdown is simply absent when there is
nothing to filter.

### Decision record

- **D1 — Hero intro.** Decided (user, 2026-09-16): reuse the meta description, i.e.
  `intro: CORTE_CONFORMADO_DESCRIPTION`.
- **D2 — Search placeholder.** Decided (user, 2026-09-16): `Buscar machuelos, buriles, cortadores...`.
- **D3 — Slug = `customId`.** No decision needed; noted above so nobody "fixes" it to a shorter slug — the
  user-supplied URL is the contract.

## Technical Research

### Affected areas (mirror of commits `b6602e3` / `35376b5`)

- `src/shared/constants/category.constants.ts` — `CORTE_CONFORMADO_CATEGORY_ID = "herramientas-corte-conformado"`,
  new `CATEGORY_PAGE_HREFS` entry, new `CATEGORY_PAGES` entry (`name`, `heading`, `intro`, `searchPlaceholder`);
  import `CORTE_CONFORMADO_DESCRIPTION` next to the existing two.
- `src/shared/constants/seo.constants.ts` — `CORTE_CONFORMADO_TITLE`, `CORTE_CONFORMADO_DESCRIPTION` after the
  Impacto/Forja pair.
- `src/app/categorias/herramientas-corte-conformado/page.tsx` — copy of `impacto-forja/page.tsx` with the
  ID/constant names swapped.
- `src/app/categorias/herramientas-corte-conformado/error.tsx` — copy of `impacto-forja/error.tsx`.
- `src/app/categorias/herramientas-corte-conformado/loading.tsx` — one-line re-export of `CategoryPageSkeleton`.
- Tests: new `__tests__/seo/corte-conformado-metadata.test.ts`, `__tests__/app/corte-conformado-error.test.tsx`
  (templates: the Impacto/Forja twins); edit `__tests__/seo/sitemap.test.ts` (lines ~56, ~94) and
  `__tests__/categories/CategoriesPage.test.tsx` (fixture lines 21–29, counts lines 44–56, `it` title).
  `__tests__/shared/Header.test.tsx` does not enumerate categories; no change.
- Docs: `ai-skills/REPO_CONTEXT.md` route tables (lines ~69, 75, 233, 326, 353) list three category routes; add
  the fourth in the implementation PR.

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
  `curl -s localhost:3000/categorias/herramientas-corte-conformado | grep -c '<h1>'`,
  `curl -s localhost:3000/sitemap.xml | grep herramientas-corte-conformado`, `/categorias` card CTA is an `<a>` for
  the new category.

### Dependencies / integration points

- No new dependencies. Env: `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL`.
- PR to `develop`, label `minor` (new route; matches PRs #45/#47/#48).

### Edge cases and constraints

- Product count today: **75**, all `subcategory: null` (Strapi I). Under one `fetchAllProductsByCategory` page
  (100), so a single request — but the largest category page so far; the unpaginated grid renders 75 cards.
- ~59/75 products have `brand: null`. `CategoryPage` already drops null brands from `brandOptions` and a selected
  brand never matches them, so they only appear with no brand filter active. Expected; no code change.
- "Clevaland" is spelled that way in Strapi (likely a typo for Cleveland). Displayed verbatim; backend-owned.

## Open Questions

### Strapi contract

- I: Question: What is the Strapi `customId`/`name` for "Herramientas de corte y conformado", how many published
  products does it have, and do they carry `subcategory` / which brands?
  - Status: answered
  - Answer: `name: "Herramientas de corte y conformado"`, `customId: "herramientas-corte-conformado"`; **75**
    published products, all `subcategory: null`; brands Precision, Weston, Clevaland, Bondhus, Bohrcraft (~59
    products have `brand: null`). Contents: machuelos, buriles, rimas, lainas.
  - Context: `backend-research` subagent, 2026-09-16: `customId` from backend seed `data/data.json` lines 30–31;
    count via live `products_connection(filters: { category: { customId: { eq: "herramientas-corte-conformado" } },
    publishedAt: { notNull: true } }, pagination: { pageSize: 1 }) { pageInfo { total } }` → 75; brands/subcategory
    via a `pageSize: 100` query selecting `name subcategory brand { name }`.

### UI/product decisions

- I: Question: Hero intro?
  - Status: answered
  - Answer: Reuse meta description (D1).
- II: Question: Search placeholder?
  - Status: answered
  - Answer: `Buscar machuelos, buriles, cortadores...` (D2).

### Catalog behavior / Theme / persistence

- None — no query, adapter, theme or cookie surface is touched.

### Verification

- I: Question: PR label?
  - Status: answered
  - Answer: `minor`, matching the previous category-page PRs.
