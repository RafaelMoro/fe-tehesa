# Remaining category pages via `/categorias/[slug]` — Research

**Date:** 2026-09-16
**Branch:** `develop` (research only)
**Scope:** standalone story, one PR (user decision, 2026-09-16), 2 phases
**Reference stories:** `ai-research/abrasivos-category-page.story.md` (shared `CategoryPage` architecture,
D1–D4), `ai-research/perforacion-brocas-category-page.story.md` (latest copy of the per-route recipe),
`ai-research/category-seo-copy-corrections.story.md` (sibling copy-fix story; land it first or fold it in).
No new design work.

## Story Definition

### Title

Ship the 11 missing category pages and collapse the five static `src/app/categorias/<slug>/` folders into one
`src/app/categorias/[slug]/` route driven by `CATEGORY_PAGES`.

### Description

Five categories have pages today, each a copy of the same three files (`page.tsx`, `error.tsx`, `loading.tsx`)
plus two constants and two tests. Abrasivos D4 kept static folders but said "revisit only if the number of
categories makes folders painful" — 11 more categories is 33 more files of copy-paste, so the user chose
(2026-09-16) to migrate to a dynamic route now and add the 11 as config entries only.

The 16 published Strapi categories, live-verified 2026-09-16 (`backend-research`): the 11 missing slugs in the
user's table equal their Strapi `customId` **exactly**. Only the two legacy slugs differ from `customId`.

| # | `customId`                              | Strapi `name`                                             | URL (table)                                        | H1 (table)                                  | Products | Page today |
| - | --------------------------------------- | --------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------- | -------- | ---------- |
| 1 | `tornilleria`                           | Tornillería                                               | `/categorias/tornilleria-fijacion`                 | Tornillería y fijación industrial           | 107      | yes        |
| 2 | `herramientas-corte-conformado`         | Herramientas de corte y conformado                        | `/categorias/herramientas-corte-conformado`        | Herramientas de corte y conformado          | 75       | yes        |
| 3 | `perforacion-accesorios-taladro`        | Perforación y accesorios para taladro                     | `/categorias/perforacion-accesorios-taladro`       | Perforación y accesorios de taladro         | 51       | yes        |
| 4 | `abrasivos`                             | Abrasivos                                                 | `/categorias/abrasivos`                            | Abrasivos industriales                      | 0        | yes        |
| 5 | `herramientas-impacto-forja`            | Herramientas de impacto o forja                           | `/categorias/impacto-forja`                        | Herramientas de impacto y forja             | 2        | yes        |
| 6 | `llaves-herramientas-apriete`           | Llaves y herramientas de apriete                          | `/categorias/llaves-herramientas-apriete`          | Llaves y herramientas de apriete            | 33       | **no**     |
| 7 | `roscado-herramientas-roscas`           | Roscado y herramientas para roscas                        | `/categorias/roscado-herramientas-roscas`          | Roscado y herramientas para roscas          | 21       | **no**     |
| 8 | `carburo`                               | Carburo                                                   | `/categorias/carburo`                              | Carburo y diamantados                       | 18       | **no**     |
| 9 | `sujecion`                              | Sujeción                                                  | `/categorias/sujecion`                             | Sujeción industrial                         | 6        | **no**     |
| 10 | `calibrador`                           | Calibrador                                                | `/categorias/calibrador`                           | Calibradores                                | 5        | **no**     |
| 11 | `extraccion-reparacion-fijaciones`     | Extracción y Reparación de fijaciones                     | `/categorias/extraccion-reparacion-fijaciones`     | Extracción y reparación de fijaciones       | 2        | **no**     |
| 12 | `adhesivos-selladores`                 | Adhesivos y selladores                                    | `/categorias/adhesivos-selladores`                 | Adhesivos y selladores                      | 2        | **no**     |
| 13 | `equipo-seguridad`                     | Equipo de seguridad                                       | `/categorias/equipo-seguridad`                     | Equipo de seguridad industrial              | 1        | **no**     |
| 14 | `herramientas-diagnostico-electricidad` | Herramientas de diagnóstico de electricidad y electrónica | `/categorias/herramientas-diagnostico-electricidad` | Diagnóstico de electricidad y electrónica  | 1        | **no**     |
| 15 | `herrajes-accesorios-cable`            | Herrajes y accesorios para cable                          | `/categorias/herrajes-accesorios-cable`            | Herrajes y accesorios para cable            | 1        | **no**     |
| 16 | `lubricantes-multifuncionales`         | Lubricantes multifuncionales                              | `/categorias/lubricantes-multifuncionales`         | Lubricantes multifuncionales                | 1        | **no**     |

Title and meta description per row come verbatim from the user's table (not repeated here; the planner copies
them into `seo.constants.ts`). Only Tornillería carries `subcategory` values; every other category's products are
`subcategory: null`, so the subcategory dropdown stays hidden on all 15 other pages with no code.

Per-category copy conventions carried over unchanged from the five existing stories:

- **D1** hero intro = meta description.
- **D3** `name` = Strapi name (breadcrumb, JSON-LD leaf, error heading — matches the header dropdown row, which
  renders the live Strapi name); `heading` = table H1. Rows 8–11, 13, 14 differ between the two; rows 6, 7, 12,
  15, 16 are identical.
- **D2** search placeholder is per category and was chosen by the user each time. Confirmed (UI/product I,
  2026-09-16): 6 `Buscar dados, llaves, puntas...`; 7 `Buscar machuelos, terrajas, juegos...`;
  8 `Buscar limas, puntas de diamante, cortadores...`; 9 `Buscar clamps verticales, horizontales...`;
  10 `Buscar calibradores, cuenta hilos...`; 11 `Buscar extractores, manerales...`;
  12 `Buscar adhesivos, selladores...`; 13 `Buscar lentes, equipo de seguridad...`;
  14 `Buscar probadores, herramienta de diagnóstico...`; 15 `Buscar herrajes, accesorios para cable...`;
  16 `Buscar lubricantes...`.

**Out of scope:** any change to `src/features/CategoryPage/*` rendering, `Header`/`MobileMenu`/`CategoryCard`
behaviour (they read `CATEGORY_PAGE_HREFS` and light up by themselves), `/`, `/cotizar`, `/marcas`, `/contacto`
copy or routes, sitemap semantics, queries/server actions, product images, renaming Strapi categories, the
`/categorias` index description's hardcoded `16 categorías` (copy-corrections story).

### Acceptance criteria

1. **All 16 URLs resolve.** Every URL in the table above is server-rendered by `src/app/categorias/[slug]/page.tsx`,
   fetches its full set via `fetchAllProductsByCategory(customId)` and renders `CategoryPage` with the matching
   `CATEGORY_PAGES` config. The five existing URLs keep byte-identical `generateMetadata` output (title,
   description, `alternates.canonical`, `robots: { index: true, follow: true }`) and 3-item `BreadcrumbList`
   JSON-LD. Any other `/categorias/<x>` returns 404 via `notFound()`, rendered by a new app-level
   `src/app/not-found.tsx` (Catalog I).
2. **11 new pages carry the table copy.** For rows 6–16 the `<title>`, meta description, canonical, H1, hero
   intro (= description) and breadcrumb leaf (= Strapi name) match the table / conventions above. Product counts
   render live; empty or single-product sets still show the full hero/breadcrumb/WhatsApp panel (Abrasivos rule).
3. **Entry points light up from config.** `CATEGORY_PAGE_HREFS` has 16 entries. Header `Categorías` dropdown and
   mobile accordion rows become links for all 16; `/categorias` cards all get a real `Ver categoría` link;
   `/sitemap.xml` lists all 16 static category URLs; header active state (`pageCategoryId`) works on every one.
4. **Static folders are gone.** `src/app/categorias/{tornilleria-fijacion,abrasivos,impacto-forja,herramientas-corte-conformado,perforacion-accesorios-taladro}/`
   are deleted; one `[slug]/{page,error,loading}.tsx` replaces them. `error.tsx` still shows
   `No pudimos cargar los productos de <Strapi name>` for the failing category.
5. **Verification.** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass. The five per-route
   metadata/error tests are replaced by table-driven tests over all 16 slugs (see Affected areas); `sitemap.test.ts`
   and `CategoriesPage.test.tsx` counts are updated to 16 / `length - 16` (or asserted from the map's size).

### Task breakdown

- **Phase 1 — migrate to `[slug]`** with the existing 5 categories only; all existing tests green (rewritten as
  table-driven), plus the app-level `not-found.tsx` (D6). This is a valid stopping point / separate commit.
- **Phase 2 — add 11 config entries** (`CATEGORY_PAGES`, `CATEGORY_PAGE_HREFS`, 22 SEO constants) + test-table
  rows + doc rows.

## Design Agent Handoff

None. Copy swap on the Tornillería comps for each new page; no new visual state.

### Decision record

- **D4 (revised, user 2026-09-16)** — replace static folders with `/categorias/[slug]`. Supersedes Abrasivos D4.
- **D1/D2/D3** — unchanged (see Description). D2 placeholders and D3 name/heading split confirmed by the user
  (2026-09-16).
- **D6 — general 404 page (user 2026-09-16).** Add `src/app/not-found.tsx` (app-level, not under `[slug]`) with
  branded copy and a link back to `/categorias`; unknown slugs and any other unmatched URL render it.
- **D5 — slug ↔ `customId` mapping.** Assumed: the route resolves `slug → customId` by inverting
  `CATEGORY_PAGE_HREFS` (`/categorias/<slug>` → id), so the two legacy slugs keep working with no second map.
  Planner may instead re-key `CATEGORY_PAGES` by slug and add a `customId` field; either is one lookup.

## Technical Research

### Affected areas

- `src/app/categorias/[slug]/page.tsx` — `generateMetadata({ params })` (Next 15: `params` is a Promise) resolving
  the slug to its config, returning the literal title/description/canonical/robots; `notFound()` when unknown.
  Default export builds `breadcrumbJsonLd` from `SITE_URL` + href + Strapi `name` and renders `CategoryPage`
  inside the same `<main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5">`.
- `src/app/categorias/[slug]/error.tsx` — `"use client"`; reads the slug with `useParams()` to pass
  `categoryName` to `CategoryPageError` (error boundaries receive no `params`). Falls back to a generic
  `esta categoría` when the slug is unknown.
- `src/app/categorias/[slug]/loading.tsx` — one-line re-export of `CategoryPageSkeleton`, as today.
- Delete the five static folders (15 files).
- `src/app/not-found.tsx` — new app-level 404 (D6): heading, one-line copy, link to `/categorias`; server
  component, no data fetching. Add `__tests__/app/not-found.test.tsx` (renders heading + link).
- `src/shared/constants/category.constants.ts` — 11 new `*_CATEGORY_ID` constants (or drop the per-category
  constants and key everything by string literal — planner's call; the existing five are imported only by the
  soon-deleted routes and tests), 11 `CATEGORY_PAGE_HREFS` entries, 11 `CATEGORY_PAGES` entries.
- `src/shared/constants/seo.constants.ts` — 22 new `*_TITLE` / `*_DESCRIPTION` literals from the table. Consider
  a single `CATEGORY_SEO: Record<customId, { title, description }>` instead of 32 named exports; either way
  `seo.constants.ts` must keep importing nothing from `category.constants.ts` (no cycle).
- `src/app/sitemap.ts` — no code change (`Object.values(CATEGORY_PAGE_HREFS)`), output grows to 16 entries.
- `src/shared/ui/organisms/Header.tsx:105` — `pageCategoryId` lookup already inverts the href map; no change.
- Tests (`docs/UNIT_TESTING_GUIDELINES.md` applies):
  - Replace `__tests__/seo/{tornilleria,abrasivos,impacto-forja,corte-conformado,perforacion-accesorios-taladro}-metadata.test.ts`
    with one `__tests__/seo/category-slug-metadata.test.ts` using `it.each` over all 16 `[slug, title, description]`
    rows (literal strings from the table, so a wrong paste fails — see copy-corrections Verification I) plus one
    `notFound` case (mock `next/navigation`).
  - Replace the five `__tests__/app/*-error.test.tsx` with one `__tests__/app/category-slug-error.test.tsx`
    mocking `useParams`.
  - `__tests__/seo/sitemap.test.ts:50-65,98-113` — assert all 16 hrefs (iterate `CATEGORY_PAGE_HREFS`).
  - `__tests__/categories/CategoriesPage.test.tsx:21-70` — fixture gains the 11 categories; `linkCtas` 5 → 16
    and `disabledCtas` → `length - 16` (keep one fake `customId` in the fixture so the disabled branch stays
    covered).
  - `__tests__/shared/Header.test.tsx` does not enumerate categories; unchanged.
- Docs: `ai-skills/REPO_CONTEXT.md` route tables (lines ~67–71, 77, 235, 328, 353–357) list five static routes;
  collapse to one `[slug]` row and update the sitemap/gotcha sentences in the implementation PR.

### Existing patterns to follow

- Everything the five routes do today, just parameterised: literal metadata from constants, module-level
  JSON-LD shape, `toJsonLdHtml` escaping, `fetchAllProductsByCategory(customId)` with the "throw at the boundary"
  contract so `error.tsx` catches Strapi failures.
- Root layout is `force-dynamic`, so no `generateStaticParams` is needed and none of the SEO output changes.
- `CategoryPageConfig` already separates `name` / `heading` / `intro` / `searchPlaceholder`; add no fields unless
  D5 lands the `customId`-in-config variant.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test`.
- Dev server + curl (implement convention): for every slug in the table
  `curl -s -o /dev/null -w '%{http_code}' localhost:3000/categorias/<slug>` → 200,
  `curl -s localhost:3000/categorias/<slug> | grep -o '<title>[^<]*\|name="description" content="[^"]*"\|<h1[^>]*>[^<]*'`
  matches the table; `curl -s -o /dev/null -w '%{http_code}' localhost:3000/categorias/nope` → 404;
  `curl -s localhost:3000/sitemap.xml | grep -c '/categorias/'` ≥ 17 (index + 16, before the `?mode=` entries).

### Dependencies / integration points

- No new dependencies. Env: `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL`.
- PR to `develop`, label `minor` (new routes), matching PRs #45/#47/#48/#49/#50.
- Sequence with `category-seo-copy-corrections.story.md`: either merge that `patch` first or fold its three string
  edits into this PR's `seo.constants.ts` rewrite. Do not do both.

### Edge cases and constraints

- Largest set is Tornillería (107 → 2 sequential pages of 100); every new category is ≤ 33 products, one request.
- Rows 13–16 have exactly 1 product; the counter renders singular `1 producto` (already handled).
- `Extracción y Reparación de fijaciones` has a capital R in Strapi; D3 keeps it in breadcrumb/JSON-LD, the H1
  uses the table's lowercase. Cosmetic; flagged in UI/product II.
- Unknown-slug 404 renders the new app-level `src/app/not-found.tsx` (D6); it must not depend on category
  config so it stays valid for non-category URLs.
- `useParams()` in `error.tsx` returns the raw URL segment; unknown slugs never reach `error.tsx` (they `notFound()`
  in `page.tsx` first), so the fallback copy is defensive only.

## Open Questions

### Strapi contract

- I: Question: What are the 16 categories' `customId`/`name`, product counts, and which carry `subcategory`?
  - Status: answered
  - Answer: table above; 317 published products across categories; only `tornilleria` has `subcategory` values.
  - Context: `backend-research` subagent, 2026-09-16, live GraphQL against `STRAPI_HOST` with aliased
    `products_connection(filters: { publishedAt: { notNull: true }, category: { customId: { eq } } }, pagination: { pageSize: 1 }) { pageInfo { total } }`
    per category.

### Catalog behavior

- I: Question: Does the app have a custom `src/app/not-found.tsx`, or should `[slug]` ship a `not-found.tsx`
  with category-index copy?
  - Status: answered
  - Answer: ship a general app-level `src/app/not-found.tsx` (user, 2026-09-16), not a route-level one under
    `[slug]`. It covers unknown category slugs and every other unmatched URL.
  - Context: verified 2026-09-16 — no `not-found.tsx` exists anywhere under `src/app`, so `notFound()` renders
    Next's default 404 today.

### UI/product decisions

- I: Question: Confirm or replace the 11 proposed search placeholders (D2 list in Description).
  - Status: answered
  - Answer: confirmed as proposed (user, 2026-09-16).
- II: Question: Keep D3 for the six rows where Strapi `name` ≠ H1 (`Carburo` / `Carburo y diamantados`,
  `Sujeción` / `Sujeción industrial`, `Calibrador` / `Calibradores`, `Equipo de seguridad` / `... industrial`,
  `Herramientas de diagnóstico de electricidad y electrónica` / `Diagnóstico de ...`,
  `Extracción y Reparación ...` / `... reparación ...`)? Breadcrumb/JSON-LD/error copy would show the Strapi name.
  - Status: answered
  - Answer: keep D3 (user, 2026-09-16) — `name` = Strapi name, `heading` = table H1. No Strapi renames.
  - Context: same trade-off as Perforación (`para` vs `de`), decided D3 there. Alternative is renaming in Strapi
    (backend-owned).
- III: Question: Route shape and delivery.
  - Status: answered
  - Answer: dynamic `/categorias/[slug]`, migrate the 5 existing folders, all 11 new categories in one story/PR
    (user, 2026-09-16).

### Verification

- I: Question: PR label?
  - Status: answered
  - Answer: `minor`, matching previous category-page PRs.
