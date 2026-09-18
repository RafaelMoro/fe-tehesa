# SEO copy corrections (`/categorias/impacto-forja`, `/categorias`, `/`, `/cotizar`) — Research (quick note)

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
| `/` (home)                                | ✓   | **✗** | **✗**       | **✗** |
| `/cotizar`                                | ✓   | **✗** | **✗**       | **✗** |

**No URL path needs correcting.** Four copy drifts:

1. `IMPACTO_FORJA_DESCRIPTION` (`seo.constants.ts`) is a copy of the title —
   `"Martillos y Herramientas de Impacto y Forja | Tehesa Puebla."` — instead of the table's description. Because
   `CATEGORY_PAGES["herramientas-impacto-forja"].intro` reuses that constant (decision D1 of the category-page
   stories), the hero intro paragraph on the page is wrong too, not only the `<meta name="description">`.
2. `CATEGORIES_TITLE` / `CATEGORIES_DESCRIPTION` (`/categorias` index) predate the table:
   - title: `Categorías de herramienta industrial | Tehesa` → table: `Catálogo de Herramienta Industrial en Puebla | Tehesa`
   - description: `Todas las categorías del catálogo de Tehesa en Puebla: tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. Cotiza por WhatsApp.`
     → table: `Tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. 16 categorías con existencia en Puebla. Cotiza por WhatsApp.`
   - H1 already matches (`Catálogo de herramienta industrial`, `src/features/CategoriesPage/CategoriesPage.tsx:27`).

3. `/` (home): `SITE_TITLE`, `SITE_DESCRIPTION` and `TITLE_BASE` spell `Tornilleria` without the accent; the
   table has `Tornillería`. `TITLE_BASE` also feeds paginated titles (`... | Pagina 3 | Tehesa`) and
   `SITE_TITLE`/`SITE_DESCRIPTION` feed the root layout's OpenGraph/Twitter metadata, so the accent fix
   propagates everywhere by construction. H1 is `Piezas precisas para trabajo exigente.`
   (`src/features/Home/CatalogHero.tsx:25`) → table: `Distribuidor de herramienta industrial en Puebla`.
4. `/cotizar`: `QUOTE_TITLE` `Solicitar cotización | Tehesa` → table `Solicita tu Cotización | Tehesa Industrial Puebla`;
   `QUOTE_DESCRIPTION` `Revisa los productos, medidas y cantidades de tu lista antes de solicitar tu cotización a Tehesa.`
   → table `Cotiza herramienta industrial, tornillería y corte. Respuesta rápida por WhatsApp o correo. Tehesa Industrial, Puebla.`;
   H1 `Solicitar cotización` (`src/features/QuotePage/QuotePage.tsx:29`) → table `Solicita tu cotización`.

Scope widened to all four by the user (2026-09-16). Still out of scope: `/marcas`, `/marcas/bohrcraft`,
`/contacto` (routes do not exist yet); the header/mobile-menu WhatsApp link label `Solicitar cotización`
(`Header.tsx:133`, `MobileMenu.tsx:188`) is a CTA, not the page H1, and is not in the table — untouched.

## Story Definition

### Title

Sync `/categorias/impacto-forja`, `/categorias`, `/` and `/cotizar` title / meta description / H1 with the SEO table.

### Acceptance criteria

1. `generateMetadata()` of `src/app/categorias/impacto-forja/page.tsx` returns description
   `Martillos y herramienta de hojalatería para industria y taller. Abasto en Puebla. Cotiza con Tehesa Industrial.`
   and the page's hero intro renders the same text (it is the same constant).
2. `generateMetadata()` of `src/app/categorias/page.tsx` returns title
   `Catálogo de Herramienta Industrial en Puebla | Tehesa` and description
   `Tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. 16 categorías con existencia en Puebla. Cotiza por WhatsApp.`
3. `/` renders `<title>Herramienta Industrial y Tornillería en Puebla | Tehesa</title>` (accented), the accented
   description, paginated titles `Herramienta Industrial y Tornillería en Puebla | Pagina N | Tehesa`, and
   `<h1>Distribuidor de herramienta industrial en Puebla</h1>`.
4. `/cotizar` returns title `Solicita tu Cotización | Tehesa Industrial Puebla`, description
   `Cotiza herramienta industrial, tornillería y corte. Respuesta rápida por WhatsApp o correo. Tehesa Industrial, Puebla.`
   and renders `<h1>Solicita tu cotización</h1>`.
5. No URL changes; the touched metadata tests assert the literal table strings (Verification I);
   `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass.

## Technical Research

### Affected areas

- `src/shared/constants/seo.constants.ts` — eight string literals: `IMPACTO_FORJA_DESCRIPTION`,
  `CATEGORIES_TITLE`, `CATEGORIES_DESCRIPTION`, `SITE_TITLE`, `SITE_DESCRIPTION`, `TITLE_BASE`, `QUOTE_TITLE`,
  `QUOTE_DESCRIPTION`. Every metadata consumer imports the constant, so no route file changes.
- `src/features/Home/CatalogHero.tsx:25` — H1 literal. The kicker (`Suministro industrial`) and sub-copy are not
  in the table; leave them.
- `src/features/QuotePage/QuotePage.tsx:29` — H1 literal. Sub-copy `Revisa productos, medidas y cantidades.` stays.
- Tests:
  - `__tests__/seo/seo.utils.test.ts:77` asserts the unaccented literal `... Tornilleria en Puebla | Pagina 3 | Tehesa`
    → update to the accented form (this is the one test that fails on the fix).
  - `__tests__/seo/impacto-forja-metadata.test.ts:15`, `__tests__/seo/categories-metadata.test.ts:11-12`,
    `__tests__/seo/quote-metadata.test.ts:11-12` assert `toBe(<constant>)` and pass unchanged — which is why
    nothing caught the drift. Switch them to the literal table strings (Verification I).
  - No test asserts the home or quote H1 text (`__tests__/quote/QuotePage.test.tsx` does not query the heading);
    no H1 test change needed.
- `ai-skills/REPO_CONTEXT.md` — no route-table row quotes the description text; no doc change needed.

### Existing patterns to follow

- Literal `generateMetadata` per route reading `*_TITLE` / `*_DESCRIPTION` from `seo.constants.ts`; hero intro
  reuses the description constant via `CATEGORY_PAGES[id].intro` (D1). Keep both wired to the one constant.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test`.
- Dev server + curl, for each of `/categorias/impacto-forja`, `/categorias`, `/`, `/?page=2`, `/cotizar`:
  `curl -s localhost:3000<path> | grep -o '<title>[^<]*\|name="description" content="[^"]*"\|<h1[^>]*>[^<]*'`
  and compare against the table.

### Dependencies / integration points

- None new. PR to `develop`, label `patch` (copy fix, no new route). Sequence with
  `remaining-category-pages.story.md`: land this first, or fold the constant edits into that PR's
  `seo.constants.ts` rewrite — not both.

### Edge cases and constraints

- The `/categorias` description hardcodes `16 categorías`; the page itself renders a live `N categorías` counter
  from Strapi (16 today, verified live 2026-09-16). If a category is added/removed in Strapi the meta text goes
  stale silently. Accepted as-is — copy is the user's call.
- `impacto-forja` is the one route whose slug (`impacto-forja`) differs from its `customId`
  (`herramientas-impacto-forja`), alongside `tornilleria` → `tornilleria-fijacion`. Table confirms both slugs; no change.
- The home H1 change is a visible hero copy change, not just metadata; it lands on every catalog mode (`/`,
  `?mode=category`, `?mode=brand`, `?mode=name`) since `CatalogHero` is shared. No comps exist for the new copy;
  it is a text swap in the same element.
- `Pagina` (no accent) in the paginated title suffix is not in the table; untouched.

## Open Questions

### Verification

- I: Question: Should the metadata tests for the touched routes assert the literal strings (a regression guard
  against title/description being pasted into the wrong constant) instead of `toBe(<constant>)`?
  - Status: answered
  - Answer: Yes (user, 2026-09-16) — `impacto-forja-metadata`, `categories-metadata` and `quote-metadata` tests
    assert the literal table strings for the constants this story touches.
  - Context: today's tests would have passed with the wrong copy; a literal assertion costs one line each.

### UI/product decisions

- I: Question: Fix the `/` and `/cotizar` title/description/H1 drift listed above in a follow-up?
  - Status: answered
  - Answer: No follow-up — include them in this story and match title, description **and** H1 (user, 2026-09-16).
  - Context: drift items 3 and 4 above; ACs 3–4.
