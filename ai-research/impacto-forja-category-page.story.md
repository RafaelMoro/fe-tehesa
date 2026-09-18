# Herramientas de impacto y forja category page (`/categorias/impacto-forja`) — Research (quick note)

**Date:** 2026-09-15
**Branch:** `feat/add-page-herramientas-impacto`
**Scope:** standalone story, 1 phase
**Reference stories:** `ai-research/abrasivos-category-page.story.md` (the recipe this one repeats — read it for the
shared `CategoryPage` architecture, decisions D1–D4, and the "adding a third category" contract in its AC 3) and
`ai-research/tornilleria-category-page.story.md` (original comps `pagina-tornilleria.dc.html`). No new design work.

## Story Definition

### Title

Add `/categorias/impacto-forja` as the third consumer of the shared `CategoryPage` feature.

### Description

Abrasivos AC 3 promised that a third category needs only: one `CATEGORY_PAGES` config entry, one
`CATEGORY_PAGE_HREFS` entry, one SEO title/description pair, and one `src/app/categorias/<slug>/` folder
(`page.tsx`, `error.tsx`, `loading.tsx`). This story cashes that promise for the Strapi category
**`Herramientas de impacto o forja`** (`customId: "herramientas-impacto-forja"`) with the user-supplied copy:

| Field              | Value                                                              | Source           |
| ------------------ | ------------------------------------------------------------------ | ---------------- |
| URL                | `/categorias/impacto-forja`                                        | user             |
| `<title>`          | `Martillos y Herramientas de Impacto y Forja \| Tehesa Puebla`     | user             |
| Meta description   | `Martillos y Herramientas de Impacto y Forja \| Tehesa Puebla.`    | user (D1 below)  |
| H1                 | `Herramientas de impacto y forja`                                  | user             |
| Hero intro         | = meta description text                                            | user (D2)        |
| Search placeholder | `Buscar martillos, mazos, cinceles...`                             | user (D3)        |
| Breadcrumb / JSON-LD leaf, error heading | `CATEGORY_PAGES[id].name` = `Herramientas de impacto o forja`      | Strapi name      |

**Out of scope:** a dynamic `/categorias/[slug]` route (Abrasivos D4 stands), any change to `CategoryPage`,
`Header`, `MobileMenu`, `CategoryCard`, `sitemap.ts`, queries or server actions, product images, other categories.

### Acceptance criteria

1. **Route + data.** `GET /categorias/impacto-forja` is server-rendered, fetches every published product with
   `category.customId == "herramientas-impacto-forja"` via `fetchAllProductsByCategory("herramientas-impacto-forja")`, renders them in one
   unpaginated grid. `generateMetadata` returns the exact title/description above,
   `alternates.canonical: "/categorias/impacto-forja"`, `robots: { index: true, follow: true }`. A 3-item
   `BreadcrumbList` JSON-LD (`Inicio` / `Categorías` / `Herramientas de impacto o forja`) is emitted.
2. **Page structure.** Same DOM shape as Abrasivos: `nav[aria-label="Ruta"]` with leaf `Herramientas de impacto o forja`
   (`aria-current="page"`), kicker `Categoría`, `<h1>Herramientas de impacto y forja</h1>`, intro paragraph,
   `WhatsappPanel`, live `N productos` counter, filter row with `SearchInput` + `Filtrar marcas`. The
   `Filtrar subcategorías` dropdown appears only if the loaded set carries `subcategory` values (Strapi I says it
   does not — so it stays hidden). Own `error.tsx` (`No pudimos cargar los productos de Herramientas de impacto o forja`) and
   `loading.tsx` under `src/app/categorias/impacto-forja/`.
3. **Entry points light up with no code changes.** `CATEGORY_PAGE_HREFS` gains `"herramientas-impacto-forja": "/categorias/impacto-forja"`;
   the header `Categorías` dropdown row, mobile accordion row, `/categorias` card CTA, sitemap entry and the
   header active state (`pageCategoryId`) all follow from the map.
4. **Shared component untouched.** `src/features/CategoryPage/*` has no diff. Existing Tornillería/Abrasivos
   pages and tests are unchanged except where a test enumerates the href map.
5. **Verification.** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass. New tests:
   `__tests__/seo/impacto-forja-metadata.test.ts`, `__tests__/app/impacto-forja-error.test.tsx`; `sitemap.test.ts`
   asserts `/categorias/impacto-forja`; `CategoriesPage.test.tsx` fixture gains the new category and its
   link-count expectations (`linkCtas` 2 → 3) are updated.

## Design Agent Handoff

None. Copy swap on the Tornillería comps; no new visual state. Rules carried over from Abrasivos: render the full
hero/breadcrumb/WhatsApp panel on an empty or small set; the subcategory dropdown is simply absent when there is
nothing to filter.

### Decision record

- **D1 — Meta description identical to the title.** Decided (user, 2026-09-15): use
  `Martillos y Herramientas de Impacto y Forja | Tehesa Puebla.` as-is (title + trailing period). Flagged as
  unusual for SEO; user confirmed.
- **D2 — Hero intro.** Decided (user, 2026-09-15): reuse the meta description text (same as Abrasivos D1), i.e.
  `intro: IMPACTO_FORJA_DESCRIPTION`.
- **D3 — Search placeholder.** Decided (user, 2026-09-15): `Buscar martillos, mazos, cinceles...`.
- **D4 — Slug vs `customId`.** The URL slug (`impacto-forja`) differs from the Strapi `customId`
  (`herramientas-impacto-forja`), exactly as `tornilleria` → `/categorias/tornilleria-fijacion`. The map key is always the
  `customId`; the value is the href. Nothing else needs the slug.

## Technical Research

### Affected areas (mirror of commit `cdbf584`, "Add /categorias/abrasivos category page")

- `src/shared/constants/category.constants.ts` — `IMPACTO_FORJA_CATEGORY_ID = "herramientas-impacto-forja"`, new
  `CATEGORY_PAGE_HREFS` entry, new `CATEGORY_PAGES` entry (`name`, `heading`, `intro`, `searchPlaceholder`).
- `src/shared/constants/seo.constants.ts` — `IMPACTO_FORJA_TITLE`, `IMPACTO_FORJA_DESCRIPTION` after the Abrasivos pair.
- `src/app/categorias/impacto-forja/page.tsx` — copy of `abrasivos/page.tsx` with the ID/constant names swapped.
- `src/app/categorias/impacto-forja/error.tsx` — copy of `abrasivos/error.tsx` (wraps `CategoryPageError`).
- `src/app/categorias/impacto-forja/loading.tsx` — one-line re-export of `CategoryPageSkeleton`.
- Tests: new `__tests__/seo/impacto-forja-metadata.test.ts`, `__tests__/app/impacto-forja-error.test.tsx`
  (templates: the Abrasivos twins); edit `__tests__/seo/sitemap.test.ts` (both `it`s) and
  `__tests__/categories/CategoriesPage.test.tsx` (fixture list + `linkCtas`/`disabledCtas` counts, lines 21–56).
  `__tests__/shared/Header.test.tsx` does not enumerate Abrasivos, so it needs no change.
- Docs: `ai-skills/REPO_CONTEXT.md` route tables (lines ~66–68, 74, 111, 232, 325, 349–351) list the two
  existing category routes; add the third in the implementation PR.

### Existing patterns to follow

- Route shell: literal `generateMetadata`, module-level `breadcrumbJsonLd` from `SITE_URL` +
  `CATEGORY_PAGE_HREFS[id]` + `CATEGORY_PAGES[id].name`, `toJsonLdHtml`, one `<main>` with
  `mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5`. Do not build anything shared beyond what exists.
- `category.constants.ts` already imports `ABRASIVOS_DESCRIPTION` from `seo.constants.ts` for the intro; import
  `IMPACTO_FORJA_DESCRIPTION` the same way (no circular import — `seo.constants.ts` imports nothing from
  `category.constants.ts`).
- Tests follow `docs/UNIT_TESTING_GUIDELINES.md`; metadata test is `@jest-environment node`, error test is jsdom
  with `render`/`userEvent` from `@__tests__/test-utils`.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test`.
- Dev server + curl (per the project's implement convention): `curl -s localhost:3000/categorias/impacto-forja | grep -c '<h1>'`,
  `curl -s localhost:3000/sitemap.xml | grep impacto-forja`, `/categorias` card CTA is an `<a>` for the new category.

### Dependencies / integration points

- No new dependencies. Env: `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL`.
- PR to `develop`, label `minor` (new route; matches PRs #45/#47).

### Edge cases and constraints

- Product count today: **2** (both King Tony hammers, `subcategory: null`) (Strapi I). Well under one `fetchAllProductsByCategory` page (100), so the
  sequential paging path is a single request.
- If the header's `Categorías` dropdown label for the row differs from `CATEGORY_PAGES[id].name`, that is expected:
  the dropdown shows the live Strapi `name`; the config `name` should be set to the same string so breadcrumb,
  JSON-LD and error heading match it.
- Meta description equals the title (D1) — no code impact, noted for SEO follow-up only.

## Open Questions

### Strapi contract

- I: Question: What is the Strapi `customId`/`name` for "Herramientas de impacto o forja", how many published
  products does it have, and do they carry `subcategory` / which brands?
  - Status: answered
  - Answer: `name: "Herramientas de impacto o forja"`, `customId: "herramientas-impacto-forja"`; **2** published products (`Martillo para Reparación de Hojalataría`, `Martillo estilo alemán 320mm`), both `subcategory: null`, single brand `King Tony` — so no subcategory dropdown, and the brand dropdown offers one option.
  - Context: `backend-research` subagent, 2026-09-15: `customId` from the backend repo seed `data/data.json` (lines 34–35); counts via live `products_connection(filters: { category: { customId: { eq: "herramientas-impacto-forja" } } }, pagination: { pageSize: 1 }) { pageInfo { total } }` → 2, and a `pageSize: 100` query selecting `name subcategory brand { name }`.

### UI/product decisions

- I: Question: Is the meta description really meant to equal the title?
  - Status: answered
  - Answer: Yes, use as-is (D1).
- II: Question: Hero intro?
  - Status: answered
  - Answer: Reuse meta description (D2).
- III: Question: Search placeholder?
  - Status: answered
  - Answer: `Buscar martillos, mazos, cinceles...` (D3).

### Catalog behavior / Theme / persistence

- None — no query, adapter, theme or cookie surface is touched.

### Verification

- I: Question: PR label?
  - Status: answered
  - Answer: `minor`, matching the two previous category-page PRs.
