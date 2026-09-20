# Sync category pages with the reseeded Strapi DB — Research (quick note)

**Date:** 2026-09-20
**Branch:** `feat/correct-categories` (research only)
**Scope:** standalone story, 1 PR, 2 phases (config + copy), no new architecture
**Predecessor:** `ai-research/remaining-category-pages.story.md` (shipped: `/categorias/[slug]` + 16 configs, commit
`e31f142`). This story is the delta against the DB reseeded on 2026-09-18.
**Copy sources:** `faber-customer-projects/Tehesa/fase-1-tehesa/fase-2-tehesa/handoff-seo-categorias-restantes.fase2-tehesa.md`
(v0.2.1, 2026-09-17) and Anexo A of `estrategia-y-diagnostico/estrategia-web-paquete-base-fase1-tehesa.md` (source of
truth for title/meta/H1/intro).

## Story Definition

### Title

Remove `abrasivos`, add `herramientas-marcado` and `sellado-taponado`, and sync the category/index copy with
handoff v0.2.1 + Anexo A.

### Description

The 16-category `[slug]` route is live and entirely config-driven (`CATEGORY_PAGE_HREFS`, `CATEGORY_PAGES`,
`CATEGORY_SEO`). The Strapi DB was reseeded on 2026-09-18 and now publishes **17** categories
(`backend-research`, live GraphQL 2026-09-20):

| Change  | `customId`              | Strapi `name`           | Products | Effect today                                                                                 |
| ------- | ----------------------- | ----------------------- | -------- | -------------------------------------------------------------------------------------------- |
| removed | `abrasivos`             | —                       | —        | `/categorias/abrasivos` still renders (empty set), sits in `sitemap.xml`, absent from header/`/categorias` (both read live taxonomy) |
| added   | `herramientas-marcado`  | Herramientas de marcado | 2        | header/mobile row is a disabled item; `/categorias` card shows a disabled `Ver categoría`; no page, not in sitemap |
| added   | `sellado-taponado`      | Sellado y taponado      | 1        | same as above                                                                                |

The other 15 are unchanged in `customId`/`name`. Product counts moved (e.g. Tornillería 107 → 15, Carburo 18 → 40)
but nothing in the front depends on counts. Only `tornilleria` carries `subcategory` (`nudo`, `opresor`, `perno`,
`pija`, `varilla` — 5 of the 10 enum values), so the subcategory dropdown stays Tornillería-only with no code change.

Copy drift found while auditing against handoff v0.2.1 / Anexo A:

| Where                                                       | Live                                                                  | Source of truth                                                       |
| ----------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `CATEGORY_SEO["llaves-herramientas-apriete"].title`        | `Llaves, Dados y Herramientas de Apriete \| Tehesa Industrial`        | `Llaves, Dados y Herramientas de Apriete en Puebla \| Tehesa`         |
| `CATEGORY_SEO["extraccion-reparacion-fijaciones"].title`   | `Extractores de Tornillos y Reparación de Fijaciones \| Tehesa`       | `Extractores de Tornillos y Reparación en Puebla \| Tehesa`           |
| `CATEGORIES_DESCRIPTION` + `/categorias` hero `<p>`         | `Tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. 16 categorías …` | pending — Anexo A still says `abrasivos` / `16`; see UI/product II |

Every other title/meta/H1/intro for the 15 surviving categories already matches Anexo A byte for byte (checked
2026-09-20). Descriptions and intros for the two changed rows are unchanged.

### Copy for the two new categories (drafts, UI/product I)

Neither Anexo A nor the handoff has rows for these. Drafted here following the Anexo A pattern (meta = products +
Puebla + CTA, < 160 chars; intro = 1–2 sentences to the visitor, no CTA, no "Puebla"; title with `| Tehesa …`
suffix; no `<`, `>` or straight quotes). Products behind them: `Marcador Valve Action.`, `Marcador HP Proline.`
(both Weston) and `Tapon Dry Seal` (brand `libre`).

| Field       | `herramientas-marcado`                                                                                                                                    | `sellado-taponado`                                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| URL         | `/categorias/herramientas-marcado`                                                                                                                        | `/categorias/sellado-taponado`                                                                                                                  |
| Title       | Marcadores y Herramientas de Marcado Industrial \| Tehesa Puebla                                                                                          | Tapones y Sellado Industrial en Puebla \| Tehesa Industrial                                                                                     |
| Meta        | Marcadores de pintura Weston y herramienta de marcado para identificar piezas en taller e industria. Existencia en Puebla. Cotiza hoy.                     | Tapones roscados y soluciones de sellado y taponado para líneas y equipo industrial. Existencia en Puebla. Cotiza con Tehesa Industrial.        |
| H1          | Herramientas de marcado                                                                                                                                   | Sellado y taponado                                                                                                                              |
| `name`      | Herramientas de marcado (= Strapi)                                                                                                                        | Sellado y taponado (= Strapi)                                                                                                                   |
| Intro       | Marcadores de pintura permanente para identificar piezas, lotes y material en metal, plástico o madera. Trazos que aguantan grasa, manejo y trabajo de taller. | Tapones roscados y accesorios para sellar o cerrar conexiones en tubería, tanques y equipo. Cierre hermético sin fugas ni improvisaciones.       |
| Placeholder | Buscar marcadores...                                                                                                                                      | Buscar tapones, sellado...                                                                                                                      |

The product intent is inferred from names only; the copywriter should confirm what a "Tapón Dry Seal" is before
the meta/intro ship, and add both rows to Anexo A so it stays the source of truth.

### Acceptance criteria

1. **Config matches the live taxonomy.** `CATEGORY_PAGE_HREFS`, `CATEGORY_PAGES` and `CATEGORY_SEO` have exactly the
   17 live `customId`s: `abrasivos` is gone, `herramientas-marcado` and `sellado-taponado` are added with the
   (approved) copy above. `/categorias/abrasivos` returns 404 via the existing app-level `not-found.tsx`;
   `/sitemap.xml` lists 17 category URLs and no `/categorias/abrasivos`.
2. **New pages behave like the other 15.** Both URLs render through `[slug]/page.tsx` with title/meta/canonical/robots,
   3-item `BreadcrumbList` JSON-LD (leaf = Strapi name), H1, intro, live count (`2 productos` / `1 producto`), full
   hero/breadcrumb/WhatsApp panel. Header dropdown, mobile accordion and `/categorias` cards become links for both;
   `pageCategoryId` active state works.
3. **Copy synced.** The two `Puebla` titles match handoff v0.2.1. `CATEGORIES_DESCRIPTION` and the `/categorias` hero
   paragraph no longer name `abrasivos` (final wording per UI/product II); the hero already interpolates
   `{categories.length}` so the visible count is live — only the `<meta description>` literal is hardcoded.
4. **Verification.** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass; the table-driven tests are
   updated (rows removed/added), no test still references `abrasivos`.

### Task breakdown

- **Phase 1 — taxonomy delta:** drop the three `abrasivos` entries, add the two new categories (3 config objects each),
  update `category-slug-metadata`, `category-slug-error`, `CategoriesPage` test rows/fixtures, REPO_CONTEXT route
  tables (`16` → `17`). Retire `ai-research/abrasivos-category-page.story.md` / `ai-planning/abrasivos-category-page.story.md`
  with a one-line "superseded" note (or delete — planner's call).
- **Phase 2 — copy sync:** two title literals in `CATEGORY_SEO` + their test rows; `CATEGORIES_DESCRIPTION` +
  `CategoriesPage.tsx:30` + `__tests__/seo/categories-metadata.test.ts:12`.

## Design Agent Handoff

None. Copy swap on the existing `CategoryPage` comps; no new visual state.

### Decision record

- **D1–D3, D5** carried over from `remaining-category-pages.story.md`: `intro` is its own field (not the meta),
  `name` = Strapi name, `heading` = H1, slug ↔ `customId` via `getCategoryIdBySlug`. For both new categories slug =
  `customId` and `name` = `heading`.
- **D7 — `abrasivos` is removed outright, no redirect (user, 2026-09-20).** Delete its config, sitemap entry falls out
  automatically, URL 404s. The page had 0 products since it shipped, so nothing indexed is worth preserving.
- **D8 — new-category copy is drafted in this doc (user, 2026-09-20)**, pending copywriter approval (UI/product I).

## Technical Research

### Affected areas

- `src/shared/constants/category.constants.ts` — remove `abrasivos` from `CATEGORY_PAGE_HREFS` and `CATEGORY_PAGES`;
  add the two entries. No type changes.
- `src/shared/constants/seo.constants.ts` — remove `CATEGORY_SEO.abrasivos`; add two entries; two title edits;
  `CATEGORIES_DESCRIPTION` rewrite.
- `src/features/CategoriesPage/CategoriesPage.tsx:30` — hero sentence naming `abrasivos`.
- No change: `[slug]/{page,error,loading}.tsx`, `sitemap.ts`, `Header.tsx`, `MobileMenu.tsx`, `CategoryCard.tsx`,
  `not-found.tsx` — all derive from the maps. `BrandsPage.tsx:63` links `CATEGORY_PAGE_HREFS.tornilleria` (unaffected).
- Tests (`docs/UNIT_TESTING_GUIDELINES.md` applies):
  - `__tests__/seo/category-slug-metadata.test.ts` — drop the `abrasivos` row, edit the two title rows, add two rows
    with the literal strings (a wrong paste must fail).
  - `__tests__/app/category-slug-error.test.tsx` — drop `["abrasivos", "Abrasivos"]`, add the two `[slug, name]` rows.
  - `__tests__/categories/CategoriesPage.test.tsx:23,87,103` — swap the `Abrasivos` fixture for one of the new
    categories; keep the `sin-pagina` fixture so the disabled branch stays covered; rename the `it` title. Counts are
    already derived from `Object.keys(CATEGORY_PAGE_HREFS).length`.
  - `__tests__/seo/categories-metadata.test.ts:12` — new `CATEGORIES_DESCRIPTION` literal.
  - `__tests__/seo/sitemap.test.ts` iterates `CATEGORY_PAGE_HREFS`; unchanged.
- Docs: `ai-skills/REPO_CONTEXT.md:67,76,355` say "16 categories"; update to 17 in the implementation PR.

### Existing patterns to follow

Config-only story: every surface reads `CATEGORY_PAGE_HREFS` / `CATEGORY_PAGES` / `CATEGORY_SEO`. Keep
`seo.constants.ts` importing nothing from `category.constants.ts`.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test`.
- Dev server + curl (implement convention):
  `curl -s -o /dev/null -w '%{http_code}' localhost:3000/categorias/abrasivos` → 404;
  for `herramientas-marcado` and `sellado-taponado` → 200 and
  `curl -s localhost:3000/categorias/<slug> | grep -o '<title>[^<]*\|name="description" content="[^"]*"\|<h1[^>]*>[^<]*'`
  matches the approved copy; `curl -s localhost:3000/sitemap.xml | grep -c '/categorias/'` = 18 (index + 17) and
  `grep -c abrasivos` = 0; `curl -s localhost:3000/categorias | grep -c 'Ver categoría'` links = 17.

### Dependencies / integration points

- No new dependencies. Env: `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_SITE_URL`.
- PR to `develop`, label `minor` (new routes + removed route).
- `ai-research/category-seo-copy-corrections.story.md` (2026-09-16) already landed its edits; the two `Puebla` titles
  are a newer handoff revision (v0.2.1), not a regression.

### Edge cases and constraints

- Live counts moved between two runs minutes apart (`herramientas-marcado` 4 → 2, total 332 → 330): the seed may
  still be settling. Nothing in the front asserts counts; the curl checks above should not assert exact numbers.
- Removing a config key while the DB still lists a category (or vice-versa) degrades gracefully: unmatched header
  rows/cards render disabled, unmatched slugs 404. The only hard coupling is `getCategoryIdBySlug` ↔ `CATEGORY_SEO[id]`
  / `CATEGORY_PAGES[id]` — all three maps must share the same key set (a missing key throws in `generateMetadata`).
  Consider one `it` that asserts the three key sets are equal.
- `Tapon Dry Seal` and the two markers are the whole set; the singular `1 producto` copy already exists.

## Open Questions

### Strapi contract

- I: Question: Current published categories, names, counts, subcategories, and diff vs the 16 hardcoded ids?
  - Status: answered
  - Answer: 17 categories (table in Description). `abrasivos` removed (backend commit `0a2d80e`, reseeded
    2026-09-18 via `a7a5d03`); `herramientas-marcado` and `sellado-taponado` added. Schema still only
    `name`/`customId`/`products`. 0 products without category.
  - Context: `backend-research`, 2026-09-20, live `categories_connection` + `products_connection` queries against
    `STRAPI_HOST`; `data/data.json` in the backend repo matches live.
- II: Question: Which products live in the two new categories?
  - Status: answered
  - Answer: `Marcador Valve Action.`, `Marcador HP Proline.` (Weston) under `herramientas-marcado`; `Tapon Dry Seal`
    (`libre`) under `sellado-taponado`.
  - Context: `backend-research`, 2026-09-20, `products_connection(filters: { category: { customId: { in: [...] } } })`.

### UI/product decisions

- I: Question: Approve or rewrite the drafted title/meta/H1/intro/placeholder for `herramientas-marcado` and
  `sellado-taponado`, and add them to Anexo A?
  - Status: pending
  - Context: drafts in Description; product intent inferred from names only.
- II: Question: New wording for `CATEGORIES_DESCRIPTION` / the `/categorias` hero sentence now that `abrasivos` is
  gone and the count is 17? Suggested: `Tornillería, brocas, herramienta de corte, llaves y equipo de seguridad. 17
  categorías con existencia en Puebla. Cotiza por WhatsApp.` (meta) — the hero already interpolates the live count.
  - Status: pending
  - Context: Anexo A row `/categorias` is stale on both points; it should be updated alongside.
- III: Question: Abrasivos URL — 404 or redirect?
  - Status: answered
  - Answer: remove outright, 404 (user, 2026-09-20). D7.
- IV: Question: Include the two `Puebla` titles and the `/categorias` copy in this story?
  - Status: answered
  - Answer: both (user, 2026-09-20).

### Verification

- I: Question: PR label?
  - Status: answered
  - Answer: `minor`, matching previous category-page PRs.
