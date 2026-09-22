# Plan: Sync category pages with the reseeded Strapi DB

**Source research:** `ai-research/category-config-db-sync.story.md` (2026-09-20, updated 2026-09-22).
**Sign-off status:** no explicit sign-off line; every open question (Strapi I–II, UI/product I–IV, Verification I) is `answered` by the user and D7–D9 are recorded as decided (2026-09-20 / 2026-09-22). Treated as signed off — same basis as `ai-planning/remaining-category-pages.story.md`. **Confirm before `/implement`.**
**Plan date:** 2026-09-22. **Branch:** `feat/correct-categories`. **PR:** one PR to `develop`, label `minor`.

## Assumptions

- Config-only story. `[slug]/{page,error,loading}.tsx`, `sitemap.ts`, `Header.tsx`, `MobileMenu.tsx`, `CategoryCard.tsx`, `not-found.tsx` all derive from `CATEGORY_PAGE_HREFS` / `CATEGORY_PAGES` / `CATEGORY_SEO` and are not touched.
- Copy for the two new categories and the three synced strings is taken **verbatim** from the research doc's "Copy for the two new categories" table and UI/product II. No further wording review here.
- Slugs for both new categories equal their Strapi `customId` (`herramientas-marcado`, `sellado-taponado`); `name` = Strapi name = H1 (D1–D3, D5).
- `abrasivos` is removed outright, no redirect (D7). The app-level `src/app/not-found.tsx` already renders 404s for unknown slugs.
- Live product counts (`2` / `1`) may still be settling after the reseed; dev-server checks assert presence of the count pill pattern, not exact numbers.
- Retiring the abrasivos docs: a one-line **superseded** note at the top of `ai-research/abrasivos-category-page.story.md` and `ai-planning/abrasivos-category-page.story.md` (planner's call: keeps history readable; matches the repo's existing "Superseded" convention in research docs). Not deleted.
- Env for dev-server checks: `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local`; `pnpm dev` on `http://localhost:3000`.

## Acceptance Criteria

1. **Config matches the live taxonomy.** `CATEGORY_PAGE_HREFS`, `CATEGORY_PAGES` and `CATEGORY_SEO` have exactly the 17 live `customId`s: `abrasivos` is gone, `herramientas-marcado` and `sellado-taponado` are added with the (approved) copy. `/categorias/abrasivos` returns 404 via the existing app-level `not-found.tsx`; `/sitemap.xml` lists 17 category URLs and no `/categorias/abrasivos`.
2. **New pages behave like the other 15.** Both URLs render through `[slug]/page.tsx` with title/meta/canonical/robots, 3-item `BreadcrumbList` JSON-LD (leaf = Strapi name), H1, intro, live count (`2 productos` / `1 producto`), full hero/breadcrumb/WhatsApp panel. Header dropdown, mobile accordion and `/categorias` cards become links for both; `pageCategoryId` active state works.
3. **Copy synced.** The two `Puebla` titles match handoff v0.2.1. `CATEGORIES_DESCRIPTION` and the `/categorias` hero paragraph read `Tornillería, brocas, herramienta de corte, llaves y equipo de seguridad`; the hero already interpolates `{categories.length}` so the visible count is live — only the `<meta description>` literal is hardcoded.
4. **Verification.** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass; the table-driven tests are updated (rows removed/added), no test still references `abrasivos`.

## Affected files

**`src/shared/**`**
- `src/shared/constants/category.constants.ts` — Modify
- `src/shared/constants/seo.constants.ts` — Modify

**`src/features/**`**
- `src/features/CategoriesPage/CategoriesPage.tsx` — Modify (one hero sentence, line 30)

**Tests (`__tests__/**`)**
- `__tests__/seo/category-slug-metadata.test.ts` — Modify
- `__tests__/app/category-slug-error.test.tsx` — Modify
- `__tests__/categories/CategoriesPage.test.tsx` — Modify
- `__tests__/seo/categories-metadata.test.ts` — Modify
- `__tests__/seo/sitemap.test.ts` — no change (iterates `CATEGORY_PAGE_HREFS`)

**Docs**
- `ai-skills/REPO_CONTEXT.md` — Modify (`16` → `17` mentions; `Abrasivos` 0-count example)
- `ai-research/abrasivos-category-page.story.md`, `ai-planning/abrasivos-category-page.story.md` — Modify (superseded note)

No changes under `src/app/**`, `src/app/api/**`, `src/components/**`, `src/zustand/**`, `src/shared/ui/**`.

---

## Phase 1 — Taxonomy delta (drop `abrasivos`, add the two new categories)

Valid stopping point / own commit.

### Changes Required

**`src/shared/constants/category.constants.ts`** — Modify.

- `CATEGORY_PAGE_HREFS`: delete line 3 (`abrasivos`); append after `"lubricantes-multifuncionales"`:
  ```ts
  "herramientas-marcado": "/categorias/herramientas-marcado",
  "sellado-taponado": "/categorias/sellado-taponado",
  ```
- `CATEGORY_PAGES`: delete the `abrasivos` object (lines 40–46); append two `CategoryPageConfig` objects at the end, verbatim from the research table:
  ```ts
  "herramientas-marcado": {
    name: "Herramientas de marcado",
    heading: "Herramientas de marcado",
    intro: "Marcadores de pintura permanente para identificar piezas, lotes y material en metal, plástico o madera. Trazos que aguantan grasa, manejo y trabajo de taller.",
    searchPlaceholder: "Buscar marcadores...",
  },
  "sellado-taponado": {
    name: "Sellado y taponado",
    heading: "Sellado y taponado",
    intro: "Tapones roscados y accesorios para sellar o cerrar conexiones en tubería, tanques y equipo. Cierre hermético sin fugas ni improvisaciones.",
    searchPlaceholder: "Buscar tapones, sellado...",
  },
  ```
- No type changes. `getCategoryIdBySlug` and `SUBCATEGORY_LABELS` untouched.

**`src/shared/constants/seo.constants.ts`** — Modify.

- `CATEGORY_SEO`: delete the `abrasivos` entry (lines 26–30); append two entries verbatim:
  ```ts
  "herramientas-marcado": {
    title: "Marcadores y Herramientas de Marcado Industrial | Tehesa Puebla",
    description: "Marcadores de pintura Weston y herramienta de marcado para identificar piezas en taller e industria. Existencia en Puebla. Cotiza hoy.",
  },
  "sellado-taponado": {
    title: "Tapones y Sellado Industrial en Puebla | Tehesa Industrial",
    description: "Tapones roscados y soluciones de sellado y taponado para líneas y equipo industrial. Existencia en Puebla. Cotiza con Tehesa Industrial.",
  },
  ```
- Keep `seo.constants.ts` importing nothing from `category.constants.ts` (string-literal keys, no cycle).

Edge case: the three maps must share the same key set — `generateMetadata` does `CATEGORY_SEO[id]` unguarded after `getCategoryIdBySlug`, so a key present in `CATEGORY_PAGE_HREFS` but missing in `CATEGORY_SEO` throws at runtime instead of 404ing. The key-set test below guards this.

**Tests**

- `__tests__/seo/category-slug-metadata.test.ts` — Modify.
  - Drop the `abrasivos` row (lines 19–23).
  - Add two `[slug, title, description]` rows with the **literal** strings above (a wrong paste must fail).
  - Add one `it` (research "Edge cases": key-set coupling) importing `CATEGORY_PAGE_HREFS`, `CATEGORY_PAGES` from `@/shared/constants/category.constants` and `CATEGORY_SEO` from `@/shared/constants/seo.constants`:
    ```ts
    it("keeps the three category maps on the same 17 customIds", () => {
      const ids = ["tornilleria", /* …the 17 live customIds, literal… */ "sellado-taponado"].sort()
      expect(Object.keys(CATEGORY_PAGE_HREFS).sort()).toEqual(ids)
      expect(Object.keys(CATEGORY_PAGES).sort()).toEqual(ids)
      expect(Object.keys(CATEGORY_SEO).sort()).toEqual(ids)
    })
    ```
    Rationale: this is the one automated proof of AC1's "exactly the 17 live `customId`s"; a literal list (not `Object.keys` of one map) is what makes a stray `abrasivos` fail.
- `__tests__/app/category-slug-error.test.tsx` — Modify. Drop `["abrasivos", "Abrasivos"]` (line 16); add `["herramientas-marcado", "Herramientas de marcado"]` and `["sellado-taponado", "Sellado y taponado"]`.
- `__tests__/categories/CategoriesPage.test.tsx` — Modify.
  - Line 23: replace the `Abrasivos` fixture with `{ name: "Herramientas de marcado", customId: "herramientas-marcado", productCount: 2 }`; add `{ name: "Sellado y taponado", customId: "sellado-taponado", productCount: 1 }`. Keep the `sin-pagina` fixture (disabled branch).
  - Line 87: rename the `it` title — `Abrasivos` → `Marcado`.
  - Line 103: `"/categorias/abrasivos"` → `"/categorias/herramientas-marcado"` in the `arrayContaining` list.
  - The `0 productos` assertion at ~line 121: the removed `Abrasivos` fixture was the only `productCount: 0`. Either set the `Sellado y taponado` fixture to `productCount: 0` instead of `1` or move `0` onto another fixture — keep one zero-count fixture so `0 productos` stays covered. (`2 productos` is already asserted via impacto-forja; `1 productos` via lubricantes.)
  - Counts are already derived from `Object.keys(CATEGORY_PAGE_HREFS).length`; no numeric literals to bump.

**Docs**

- `ai-skills/REPO_CONTEXT.md` — Modify: `16` → `17` at lines 67, 76, 115 (`all 16 today`), 178 (`16 published categories` — add "reseeded 2026-09-18: 17"), 237, 355, 371 (`16 entries`); line 137: replace the `(\`Abrasivos\`)` 0-count example with a neutral phrasing (e.g. "a category with no products") since no live category has 0 products now.
- `ai-research/abrasivos-category-page.story.md` and `ai-planning/abrasivos-category-page.story.md` — Modify: one line under the H1: `**Superseded (2026-09-22):** \`abrasivos\` was removed from Strapi on 2026-09-18; config deleted by \`ai-planning/category-config-db-sync.story.md\` (D7, 404 no redirect).`

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm test -- __tests__/seo/category-slug-metadata.test.ts __tests__/app/category-slug-error.test.tsx __tests__/categories/CategoriesPage.test.tsx __tests__/seo/sitemap.test.ts`
- `grep -rn abrasivos src __tests__` → no output.

**Dev-server validation** (`pnpm dev`, `http://localhost:3000`)
- `curl -s -o /dev/null -w '%{http_code}' localhost:3000/categorias/abrasivos` → `404`; body contains `Página no encontrada`.
- For each of `herramientas-marcado`, `sellado-taponado`:
  - `curl -s -o /dev/null -w '%{http_code}' localhost:3000/categorias/<slug>` → `200`.
  - `curl -s localhost:3000/categorias/<slug> | grep -o '<title>[^<]*\|name="description" content="[^"]*"\|<h1[^>]*>[^<]*\|rel="canonical" href="[^"]*"'` → title, meta, H1 and canonical `/categorias/<slug>` match the research table verbatim.
  - Body contains the intro sentence, `BreadcrumbList` with the Strapi name as the third item, the `searchPlaceholder`, a `productos?` count pill (`grep -oE '[0-9]+ productos?'`; do not assert the number), and `Cotizar` (WhatsApp panel).
  - No `CAT_ERR_*`, no server-log errors, no hydration warnings.
- `curl -s localhost:3000/sitemap.xml | grep -o '/categorias/[a-z-]*' | sort -u | wc -l` → `17`; `grep -c abrasivos` → `0`.
- `curl -s localhost:3000/categorias | grep -o 'href="/categorias/[a-z-]*"' | sort -u | wc -l` → `17` (all cards are real links; header dropdown items are not in SSR HTML, `sort -u` makes this robust either way).

**Manual**
- Header `Categorías` dropdown and mobile accordion: both new rows are links; on `/categorias/herramientas-marcado` the row shows the ` (actual)` / `aria-current` active treatment.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/shared/constants/category.constants.ts` | 17 hrefs, 17 page configs, no `abrasivos` | key-set `it` + `pnpm exec tsc --noEmit` + curl of both new routes |
| `src/shared/constants/seo.constants.ts` (`CATEGORY_SEO`) | 17 entries, literal title/meta for the two new ones | `category-slug-metadata.test.ts` rows + curl `<title>`/meta |
| `src/app/categorias/[slug]/*` (unchanged) | 404 for `abrasivos`, 200 + breadcrumb/H1 for new slugs | curl checks above; `category-slug-error.test.tsx` rows |
| `src/app/sitemap.ts` (unchanged) | 17 category URLs, no `abrasivos` | `sitemap.test.ts` (map-driven) + curl `/sitemap.xml` |
| `/categorias` cards, header, mobile menu (unchanged) | links for both new ids | `CategoriesPage.test.tsx` + curl `/categorias` + manual |

---

## Phase 2 — Copy sync (two `Puebla` titles + `/categorias` description)

Own commit; independently verifiable.

### Changes Required

**`src/shared/constants/seo.constants.ts`** — Modify.
- `CATEGORY_SEO["llaves-herramientas-apriete"].title` → `Llaves, Dados y Herramientas de Apriete en Puebla | Tehesa`
- `CATEGORY_SEO["extraccion-reparacion-fijaciones"].title` → `Extractores de Tornillos y Reparación en Puebla | Tehesa`
- `CATEGORIES_DESCRIPTION` (line 13–14) → `Tornillería, brocas, herramienta de corte, llaves y equipo de seguridad. 17 categorías con existencia en Puebla. Cotiza por WhatsApp.`
- Descriptions of the two retitled rows are unchanged.

**`src/features/CategoriesPage/CategoriesPage.tsx`** — Modify line 30: `abrasivos` → `llaves` in the hero `<p>`. The `{categories.length} categorías …` interpolation that follows stays.

**Tests**
- `__tests__/seo/category-slug-metadata.test.ts` — Modify the two title literals in the `llaves-herramientas-apriete` and `extraccion-reparacion-fijaciones` rows.
- `__tests__/seo/categories-metadata.test.ts:12` — new `CATEGORIES_DESCRIPTION` literal.
- `CategoriesPage.test.tsx` does not assert the hero sentence; no change.

### Success Criteria

**Automated**
- `pnpm test -- __tests__/seo/category-slug-metadata.test.ts __tests__/seo/categories-metadata.test.ts`
- Full gate (AC4): `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test`.

**Dev-server validation**
- `curl -s localhost:3000/categorias/llaves-herramientas-apriete | grep -o '<title>[^<]*'` → `<title>Llaves, Dados y Herramientas de Apriete en Puebla | Tehesa`.
- `curl -s localhost:3000/categorias/extraccion-reparacion-fijaciones | grep -o '<title>[^<]*'` → `<title>Extractores de Tornillos y Reparación en Puebla | Tehesa`.
- `curl -s localhost:3000/categorias | grep -o 'name="description" content="[^"]*"'` → the new `CATEGORIES_DESCRIPTION`; body contains `herramienta de corte, llaves y equipo de seguridad.` and `17 categorías` (live count; if the seed changes the count, the hero number follows — only the meta literal is hardcoded); `grep -c abrasivos` → `0`.
- HTTP 200 on all three; no server-log errors.

**Manual**
- None.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `seo.constants.ts` (two titles) | literal titles per handoff v0.2.1 | `category-slug-metadata.test.ts` rows + curl `<title>` |
| `seo.constants.ts` (`CATEGORIES_DESCRIPTION`) | literal meta | `categories-metadata.test.ts` + curl `/categorias` meta |
| `CategoriesPage.tsx:30` | hero sentence, live count | curl `/categorias` body |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 - Config matches the live taxonomy (17 ids, no `abrasivos`, 404, sitemap) | Phase 1 | `GET /categorias/abrasivos` 404 + `Página no encontrada`; `/sitemap.xml` → 17 unique `/categorias/<slug>`, 0 `abrasivos`; key-set `it` passes | Validated | |
| AC2 - New pages behave like the other 15 | Phase 1 | `GET /categorias/herramientas-marcado` and `/sellado-taponado` 200 with title/meta/canonical/H1/intro/BreadcrumbList/count pill/WhatsApp CTA; `/categorias` → 17 unique card hrefs | Validated | Header dropdown/mobile accordion links + `" (actual)"`/`aria-current` active-state click-through not exercised over HTTP; covered by `CategoryCard`/`CategoriesPage.test.tsx` link assertions instead. |
| AC3 - Copy synced | Phase 2 | `<title>` of the two retitled routes; `/categorias` meta description + hero sentence contain `llaves`, no `abrasivos` | Validated | |
| AC4 - Verification gate | Phase 1 + 2 | n/a — `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` green; `grep -rn abrasivos src __tests__` empty | Validated | |

## Cross-cutting concerns

- **Strapi env:** `STRAPI_HOST` / `STRAPI_API_TOKEN` required for the new routes to render products and for `/categorias` cards to show counts; without them Apollo fails silently and the count checks are meaningless.
- **Map coupling:** `CATEGORY_PAGE_HREFS`, `CATEGORY_PAGES`, `CATEGORY_SEO` must share one key set (unguarded `CATEGORY_SEO[id]` in `generateMetadata`). Covered by the Phase 1 key-set test.
- **Graceful drift:** if the DB adds/removes a category before/after this ships, unmatched header rows and cards render disabled and unmatched slugs 404 — no crash path.

## Open Questions / Out-of-scope

- None unresolved.
- Out of scope: redirect for `/categorias/abrasivos` (D7: 404), any change to `[slug]` route files, Header/MobileMenu, `sitemap.ts`, subcategory dropdown (still Tornillería-only with no code change), asserting exact product counts, updating Anexo A / handoff (outside this repo), other-category copy (already byte-identical to Anexo A per research).
