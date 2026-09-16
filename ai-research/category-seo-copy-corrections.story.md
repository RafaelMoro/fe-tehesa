# Category SEO copy corrections (`/categorias/impacto-forja` + `/categorias`) — Research (quick note)

**Date:** 2026-09-16
**Branch:** `develop` (research only)
**Scope:** standalone story, 1 phase, copy-only
**Source of truth:** the user's SEO table (2026-09-16), synced with the backend and commercial strategy.

## Audit result

The five live `src/app/categorias/<slug>/` routes were compared against the table on URL, `<title>`, meta
description and H1. Live values come from `src/shared/constants/seo.constants.ts`,
`src/shared/constants/category.constants.ts` and each route's `generateMetadata`.

| Route                                     | URL | Title | Description | H1  |
| ----------------------------------------- | --- | ----- | ----------- | --- |
| `/categorias/tornilleria-fijacion`        | ✓   | ✓     | ✓           | ✓   |
| `/categorias/herramientas-corte-conformado` | ✓ | ✓     | ✓           | ✓   |
| `/categorias/perforacion-accesorios-taladro` | ✓ | ✓    | ✓           | ✓   |
| `/categorias/abrasivos`                   | ✓   | ✓     | ✓           | ✓   |
| `/categorias/impacto-forja`               | ✓   | ✓     | **✗**       | ✓   |
| `/categorias` (index)                     | ✓   | **✗** | **✗**       | ✓   |

**No URL path needs correcting.** Two copy drifts:

1. `IMPACTO_FORJA_DESCRIPTION` (`seo.constants.ts`) is a copy of the title —
   `"Martillos y Herramientas de Impacto y Forja | Tehesa Puebla."` — instead of the table's description. Because
   `CATEGORY_PAGES["herramientas-impacto-forja"].intro` reuses that constant (decision D1 of the category-page
   stories), the hero intro paragraph on the page is wrong too, not only the `<meta name="description">`.
2. `CATEGORIES_TITLE` / `CATEGORIES_DESCRIPTION` (`/categorias` index) predate the table:
   - title: `Categorías de herramienta industrial | Tehesa` → table: `Catálogo de Herramienta Industrial en Puebla | Tehesa`
   - description: `Todas las categorías del catálogo de Tehesa en Puebla: tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. Cotiza por WhatsApp.`
     → table: `Tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. 16 categorías con existencia en Puebla. Cotiza por WhatsApp.`
   - H1 already matches (`Catálogo de herramienta industrial`, `src/features/CategoriesPage/CategoriesPage.tsx:27`).

Noted but **out of scope** (user decision, 2026-09-16 — fix scope is `impacto-forja` + `/categorias` index):

- `/`: `SITE_TITLE`, `SITE_DESCRIPTION`, `TITLE_BASE` spell `Tornilleria` without accent; table has `Tornillería`.
  H1 is `Piezas precisas para trabajo exigente.` (`src/features/Home/CatalogHero.tsx:25`) vs table
  `Distribuidor de herramienta industrial en Puebla`. `__tests__/seo/seo.utils.test.ts:77` asserts the unaccented
  literal, so an accent fix touches that test too.
- `/cotizar`: `QUOTE_TITLE` `Solicitar cotización | Tehesa` vs table `Solicita tu Cotización | Tehesa Industrial Puebla`;
  description and H1 (`Solicitar cotización`, `src/features/QuotePage/QuotePage.tsx:29`) also differ.
- `/marcas`, `/marcas/bohrcraft`, `/contacto`: routes do not exist yet.

## Story Definition

### Title

Sync `/categorias/impacto-forja` meta description and `/categorias` index title/description with the SEO table.

### Acceptance criteria

1. `generateMetadata()` of `src/app/categorias/impacto-forja/page.tsx` returns description
   `Martillos y herramienta de hojalatería para industria y taller. Abasto en Puebla. Cotiza con Tehesa Industrial.`
   and the page's hero intro renders the same text (it is the same constant).
2. `generateMetadata()` of `src/app/categorias/page.tsx` returns title
   `Catálogo de Herramienta Industrial en Puebla | Tehesa` and description
   `Tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. 16 categorías con existencia en Puebla. Cotiza por WhatsApp.`
3. No other route's metadata, H1 or URL changes; `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test`
   pass.

## Technical Research

### Affected areas

- `src/shared/constants/seo.constants.ts` — three string literals: `IMPACTO_FORJA_DESCRIPTION`,
  `CATEGORIES_TITLE`, `CATEGORIES_DESCRIPTION`. Nothing else: every consumer imports the constant.
- Tests already assert by constant reference, not by literal, so they pass unchanged:
  `__tests__/seo/impacto-forja-metadata.test.ts:15` (`toBe(IMPACTO_FORJA_DESCRIPTION)`) and
  `__tests__/seo/categories-metadata.test.ts:11-12`. A regression test for this bug would be a literal assertion;
  see Verification I.
- `ai-skills/REPO_CONTEXT.md` — no route-table row quotes the description text; no doc change needed.

### Existing patterns to follow

- Literal `generateMetadata` per route reading `*_TITLE` / `*_DESCRIPTION` from `seo.constants.ts`; hero intro
  reuses the description constant via `CATEGORY_PAGES[id].intro` (D1). Keep both wired to the one constant.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test`.
- Dev server + curl: `curl -s localhost:3000/categorias/impacto-forja | grep -o 'name="description" content="[^"]*"'`
  and the same for `/categorias` + `grep -o '<title>[^<]*'`.

### Dependencies / integration points

- None new. PR to `develop`, label `patch` (copy fix, no new route).

### Edge cases and constraints

- The `/categorias` description hardcodes `16 categorías`; the page itself renders a live `N categorías` counter
  from Strapi (16 today, verified live 2026-09-16). If a category is added/removed in Strapi the meta text goes
  stale silently. Accepted as-is — copy is the user's call.
- `impacto-forja` is the one route whose slug (`impacto-forja`) differs from its `customId`
  (`herramientas-impacto-forja`), alongside `tornilleria` → `tornilleria-fijacion`. Table confirms both slugs; no change.

## Open Questions

### Verification

- I: Question: Should the metadata tests for these two routes assert the literal strings (a regression guard
  against title/description being pasted into the wrong constant) instead of `toBe(<constant>)`?
  - Status: pending
  - Context: today's tests would have passed with the wrong copy. A literal assertion costs one line each and
    is what caught nothing here. Recommendation: yes, for the two constants this story touches only.

### UI/product decisions

- I: Question: Fix the `/` and `/cotizar` title/description/H1 drift listed above in a follow-up?
  - Status: pending
  - Context: excluded from this story by the user (2026-09-16). The home H1 change is a visible copy change on
    the hero, not just metadata.
