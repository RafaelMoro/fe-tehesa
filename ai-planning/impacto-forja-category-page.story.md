# Plan: Herramientas de impacto y forja category page (`/categorias/impacto-forja`)

**Source research:** `ai-research/impacto-forja-category-page.story.md` (2026-09-15, branch `feat/add-page-herramientas-impacto`).
**Sign-off status:** no explicit sign-off line, but every open question is `answered` (Strapi I, UI I–III, Verification I) and D1–D4 are recorded as decided with the user on 2026-09-15. Treated as signed off — same basis as `ai-planning/abrasivos-category-page.story.md`. **Confirm before `/implement`.**
**Plan date:** 2026-09-16.

## Assumptions

- The Abrasivos AC 3 contract holds as written: `src/features/CategoryPage/*`, `Header`, `MobileMenu`, `CategoryCard`, `sitemap.ts`, queries and server actions all iterate `CATEGORY_PAGE_HREFS` / `CATEGORY_PAGES` and need no diff (verified: `grep -rl abrasivos src` hits only the two constants files, `abrasivos/page.tsx`, and one prose sentence in `CategoriesPage.tsx`).
- Copy is taken verbatim from the research table (D1–D3). `IMPACTO_FORJA_DESCRIPTION` is the title plus a trailing period; the SEO oddity is the user's call and is not revisited here.
- `name` is the live Strapi `name` (`Herramientas de impacto o forja`, note **o**, not **y**) so breadcrumb, JSON-LD leaf, error heading and the header dropdown row all read the same string. `heading` is the user's H1 (`Herramientas de impacto y forja`).
- Env: `.env.local` has `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. Dev-server checks assume `pnpm dev` on `http://localhost:3000` and today's live data (2 King Tony products, both `subcategory: null`).

## Acceptance Criteria

1. **Route + data.** `GET /categorias/impacto-forja` is server-rendered, fetches every published product with `category.customId == "herramientas-impacto-forja"` via `fetchAllProductsByCategory("herramientas-impacto-forja")`, renders them in one unpaginated grid. `generateMetadata` returns the exact title/description above, `alternates.canonical: "/categorias/impacto-forja"`, `robots: { index: true, follow: true }`. A 3-item `BreadcrumbList` JSON-LD (`Inicio` / `Categorías` / `Herramientas de impacto o forja`) is emitted.
2. **Page structure.** Same DOM shape as Abrasivos: `nav[aria-label="Ruta"]` with leaf `Herramientas de impacto o forja` (`aria-current="page"`), kicker `Categoría`, `<h1>Herramientas de impacto y forja</h1>`, intro paragraph, `WhatsappPanel`, live `N productos` counter, filter row with `SearchInput` + `Filtrar marcas`. The `Filtrar subcategorías` dropdown appears only if the loaded set carries `subcategory` values (Strapi I says it does not — so it stays hidden). Own `error.tsx` (`No pudimos cargar los productos de Herramientas de impacto o forja`) and `loading.tsx` under `src/app/categorias/impacto-forja/`.
3. **Entry points light up with no code changes.** `CATEGORY_PAGE_HREFS` gains `"herramientas-impacto-forja": "/categorias/impacto-forja"`; the header `Categorías` dropdown row, mobile accordion row, `/categorias` card CTA, sitemap entry and the header active state (`pageCategoryId`) all follow from the map.
4. **Shared component untouched.** `src/features/CategoryPage/*` has no diff. Existing Tornillería/Abrasivos pages and tests are unchanged except where a test enumerates the href map.
5. **Verification.** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass. New tests: `__tests__/seo/impacto-forja-metadata.test.ts`, `__tests__/app/impacto-forja-error.test.tsx`; `sitemap.test.ts` asserts `/categorias/impacto-forja`; `CategoriesPage.test.tsx` fixture gains the new category and its link-count expectations (`linkCtas` 2 → 3) are updated.

## Affected files

**`src/app/**`**
- `src/app/categorias/impacto-forja/page.tsx` — Create
- `src/app/categorias/impacto-forja/error.tsx` — Create
- `src/app/categorias/impacto-forja/loading.tsx` — Create

**`src/shared/**`**
- `src/shared/constants/category.constants.ts` — Modify
- `src/shared/constants/seo.constants.ts` — Modify

**Tests (`__tests__/**`)**
- `__tests__/seo/impacto-forja-metadata.test.ts` — Create
- `__tests__/app/impacto-forja-error.test.tsx` — Create
- `__tests__/seo/sitemap.test.ts` — Modify
- `__tests__/categories/CategoriesPage.test.tsx` — Modify

**Docs**
- `ai-skills/REPO_CONTEXT.md` — Modify (route tables)

No changes under `src/features/**`, `src/components/**`, `src/zustand/**`, `src/app/api/**`.

---

## Phase 1 — Constants + route folder

Everything runtime-reachable. Copy of commit `cdbf584` with names swapped.

### Changes Required

**`src/shared/constants/seo.constants.ts`** — Modify, append after `ABRASIVOS_DESCRIPTION`:

```ts
export const IMPACTO_FORJA_TITLE = "Martillos y Herramientas de Impacto y Forja | Tehesa Puebla"
export const IMPACTO_FORJA_DESCRIPTION = "Martillos y Herramientas de Impacto y Forja | Tehesa Puebla."
```

**`src/shared/constants/category.constants.ts`** — Modify:
- Extend the existing import: `import { ABRASIVOS_DESCRIPTION, IMPACTO_FORJA_DESCRIPTION } from "@/shared/constants/seo.constants"`.
- After `ABRASIVOS_CATEGORY_ID`: `export const IMPACTO_FORJA_CATEGORY_ID = "herramientas-impacto-forja"`.
- `CATEGORY_PAGE_HREFS`: add `[IMPACTO_FORJA_CATEGORY_ID]: "/categorias/impacto-forja"`.
- `CATEGORY_PAGES`: add
  ```ts
  [IMPACTO_FORJA_CATEGORY_ID]: {
    name: "Herramientas de impacto o forja",
    heading: "Herramientas de impacto y forja",
    intro: IMPACTO_FORJA_DESCRIPTION,
    searchPlaceholder: "Buscar martillos, mazos, cinceles...",
  },
  ```
- Edge case: the map key is the Strapi `customId` (`herramientas-impacto-forja`), the href is the short slug (D4). `Header`/`MobileMenu` derive `pageCategoryId` by matching `usePathname()` against the href values, so the slug/customId mismatch is already handled (same as `tornilleria` → `/categorias/tornilleria-fijacion`).

**`src/app/categorias/impacto-forja/page.tsx`** — Create. Byte-for-byte copy of `src/app/categorias/abrasivos/page.tsx` with:
- `ABRASIVOS_CATEGORY_ID` → `IMPACTO_FORJA_CATEGORY_ID`, `ABRASIVOS_TITLE/DESCRIPTION` → `IMPACTO_FORJA_TITLE/DESCRIPTION`.
- `alternates.canonical: "/categorias/impacto-forja"`.
- Component name `ImpactoForjaRoute`.
- `breadcrumbJsonLd` position 3 reads `CATEGORY_PAGES[IMPACTO_FORJA_CATEGORY_ID].name` and `CATEGORY_PAGE_HREFS[IMPACTO_FORJA_CATEGORY_ID]` — no literal strings in the route beyond the canonical.

**`src/app/categorias/impacto-forja/error.tsx`** — Create. Copy of `abrasivos/error.tsx`: `"use client"`, renders `<CategoryPageError categoryName={CATEGORY_PAGES[IMPACTO_FORJA_CATEGORY_ID].name} reset={reset} />`.

**`src/app/categorias/impacto-forja/loading.tsx`** — Create. One line: `export { CategoryPageSkeleton as default } from "@/features/CategoryPage/CategoryPageSkeleton"`.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test` — expected to **fail** on `CategoriesPage.test.tsx` only if its fixture contained the new `customId` (it does not — fixture is `abrasivos`/`tornilleria`/`sujecion`), so the full suite should still pass after Phase 1. `sitemap.test.ts` counts `Object.keys(CATEGORY_PAGE_HREFS).length`, so it self-adjusts.

**Dev-server validation** (`pnpm dev`, `http://localhost:3000`)
- `curl -s -o /dev/null -w '%{http_code}' localhost:3000/categorias/impacto-forja` → `200`.
- `curl -s localhost:3000/categorias/impacto-forja` contains:
  - `<title>Martillos y Herramientas de Impacto y Forja | Tehesa Puebla</title>`
  - `name="description" content="Martillos y Herramientas de Impacto y Forja | Tehesa Puebla."`
  - `rel="canonical" href="…/categorias/impacto-forja"` and `name="robots" content="index, follow"` (Next may serialize as `index, follow` or split tags — grep for `canonical` and `index`).
  - `<h1` … `Herramientas de impacto y forja</h1>` (grep `-c '<h1'` → 1).
  - `aria-label="Ruta"` and an `aria-current="page"` element whose text is `Herramientas de impacto o forja`.
  - `Categoría` kicker text, the intro paragraph text, `2 productos` (today's live count), `Buscar martillos, mazos, cinceles...`.
  - `application/ld+json` script whose body contains `"BreadcrumbList"` and `"Herramientas de impacto o forja"`.
  - `Filtrar marcas`; must **not** contain `Filtrar subcategorías`.
  - Product names `Martillo para Reparación de Hojalataría` and `Martillo estilo alemán 320mm`.
- `curl -s localhost:3000/sitemap.xml | grep -c 'categorias/impacto-forja'` → `1`.
- `curl -s localhost:3000/categorias` contains `href="/categorias/impacto-forja"` (the card CTA is an `<a>`).
- `curl -s localhost:3000/` contains `href="/categorias/impacto-forja"` (header `Categorías` dropdown row — desktop dropdown content is client-rendered by HeroUI, so if it is not in the SSR HTML, fall back to the manual check below and do not count this as a failure).
- Dev-server log: no errors, no hydration warnings, no `CAT_ERR_*`.

**Manual**
- Open `/categorias/impacto-forja`: header `Categorías` dropdown shows the row as active; mobile accordion trigger reads `Categorías (actual)` and the row has `aria-current="page"`.
- Brand dropdown offers a single `King Tony` option; search filters the two products.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/shared/constants/category.constants.ts` | new id/href/config entry, import of `IMPACTO_FORJA_DESCRIPTION` | `pnpm exec tsc --noEmit` + sitemap/`/categorias` curls |
| `src/shared/constants/seo.constants.ts` | exact title/description strings | curl `<title>`/`description` on the route |
| `src/app/categorias/impacto-forja/page.tsx` | metadata, JSON-LD leaf, grid with live products | curl checks above |
| `src/app/categorias/impacto-forja/error.tsx` | heading uses config `name`, reset wired | Phase 2 test |
| `src/app/categorias/impacto-forja/loading.tsx` | re-export resolves | `pnpm exec tsc --noEmit` |

---

## Phase 2 — Tests + docs

### Changes Required

**`__tests__/seo/impacto-forja-metadata.test.ts`** — Create. Copy of `__tests__/seo/abrasivos-metadata.test.ts` (`@jest-environment node`): import `generateMetadata` from `@/app/categorias/impacto-forja/page` and `IMPACTO_FORJA_TITLE/DESCRIPTION`; assert title, description, `alternates` `{ canonical: "/categorias/impacto-forja" }`, `robots` `{ index: true, follow: true }`.

**`__tests__/app/impacto-forja-error.test.tsx`** — Create. Copy of `__tests__/app/abrasivos-error.test.tsx` (jsdom, `render`/`screen`/`userEvent` from `@__tests__/test-utils`): heading `No pudimos cargar los productos de Herramientas de impacto o forja`, click `Intentar de nuevo` → `reset` called once.

**`__tests__/seo/sitemap.test.ts`** — Modify, both `it` blocks: after the `/categorias/abrasivos` assertion add
`expect(result.some((entry) => entry.url.endsWith("/categorias/impacto-forja"))).toBe(true)`.

**`__tests__/categories/CategoriesPage.test.tsx`** — Modify (lines ~21–56):
- Fixture: add `{ name: "Herramientas de impacto o forja", customId: "herramientas-impacto-forja", productCount: 2 }`.
- First `it`: title mentions the third link; `hrefs` `arrayContaining` gains `"/categorias/impacto-forja"`; `expect(linkCtas).toHaveLength(3)`; `disabledCtas` → `categories.length - 3`.
- Second `it` (`productos` pills): the fixture now has three non-null counts, so `queryAllByText(/productos$/)` → `3`, and add `expect(screen.getByText("2 productos"))`.
- Third `it`: `/3 categorías/` → `/4 categorías/`.
- Edge case: check every `getAllBy*`/`queryAllBy*` count in the rest of that file after adding the fixture row; update only counts that depend on fixture length.

**`ai-skills/REPO_CONTEXT.md`** — Modify. Add the third route wherever the two existing ones are enumerated (lines ~68, 74, 232, 325, 351): a `categorias/impacto-forja/page.tsx` row in both route tables, `/categorias/impacto-forja` in the sitemap sentences, and the folder in the "ship their own error/loading" bullet. Keep to the same one-line style; note "2 live products, no `subcategory`, so the subcategory dropdown stays hidden".

### Success Criteria

**Automated**
- `pnpm test -- __tests__/seo/impacto-forja-metadata.test.ts __tests__/app/impacto-forja-error.test.tsx __tests__/seo/sitemap.test.ts __tests__/categories/CategoriesPage.test.tsx`
- `pnpm test` (full suite, AC 5)
- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` (AC 5)
- `git diff --stat -- src/features/CategoryPage` → empty (AC 4).

**Dev-server validation**
- Skipped for the test/docs files themselves (nothing runtime-reachable). Re-run the Phase 1 `GET /categorias/impacto-forja` → `200` and `sitemap.xml` grep once after `pnpm build` to confirm nothing regressed.

**Manual**
- None.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `__tests__/seo/impacto-forja-metadata.test.ts` | title/description/canonical/robots | `pnpm test -- <path>` |
| `__tests__/app/impacto-forja-error.test.tsx` | error heading copy + reset | `pnpm test -- <path>` |
| `__tests__/seo/sitemap.test.ts` | new href in both success and degraded paths | `pnpm test -- <path>` |
| `__tests__/categories/CategoriesPage.test.tsx` | three link CTAs, disabled count, pills, category count | `pnpm test -- <path>` |
| `ai-skills/REPO_CONTEXT.md` | route tables list the third category | eyeball diff |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 - Route + data (metadata, canonical, robots, JSON-LD, unpaginated grid) | Phase 1 | `GET /categorias/impacto-forja` 200; contains `<title>Martillos y Herramientas de Impacto y Forja \| Tehesa Puebla</title>`, canonical `/categorias/impacto-forja`, `index, follow`, `BreadcrumbList` JSON-LD with `Herramientas de impacto o forja`, both King Tony product names, no pagination markup | Not validated | Metadata also locked by Phase 2 test |
| AC2 - Page structure (breadcrumb leaf, kicker, h1, intro, WhatsApp panel, counter, filters, no subcategory dropdown, own error/loading) | Phase 1, Phase 2 | Same curl: `aria-label="Ruta"`, `aria-current="page"` leaf `Herramientas de impacto o forja`, `<h1>Herramientas de impacto y forja</h1>`, `2 productos`, `Buscar martillos, mazos, cinceles...`, `Filtrar marcas`, **not** `Filtrar subcategorías` | Not validated | Error boundary copy proven by `impacto-forja-error.test.tsx` (cannot trigger via curl) |
| AC3 - Entry points light up (header row, mobile row, `/categorias` CTA, sitemap, active state) | Phase 1 | `GET /sitemap.xml` contains `/categorias/impacto-forja`; `GET /categorias` contains `href="/categorias/impacto-forja"` | Not validated | Header dropdown/mobile active state is client-rendered → manual check |
| AC4 - Shared component untouched | Phase 1, Phase 2 | `git diff --stat -- src/features/CategoryPage` empty; existing Tornillería/Abrasivos tests pass unchanged | Cannot validate | Proven by git diff + `pnpm test`, not a dev-server check |
| AC5 - Verification (lint, tsc, build, test, new/updated tests) | Phase 2 | Post-`pnpm build` re-run of `GET /categorias/impacto-forja` 200 | Not validated | Primary proof is the four pnpm commands passing |

## Cross-cutting concerns

- **Env:** `STRAPI_HOST`/`STRAPI_API_TOKEN` required for the route to render products; `NEXT_PUBLIC_WHATSAPP_NUMBER` unset hides `WhatsappPanel` (not a failure). `NEXT_PUBLIC_SITE_URL` unset → JSON-LD `item` URLs use `http://localhost:3000`.
- **Server/client boundary:** `page.tsx` is a server component; `error.tsx` is `"use client"`; `loading.tsx` re-exports a server-safe skeleton. Identical to Abrasivos.
- **Strapi contract:** `fetchAllProductsByCategory` filters on `category.customId`; the id must be exactly `herramientas-impacto-forja`. Live count is 2, well under the 100-per-page fetch.

## Open Questions / Out-of-scope

- **None unresolved.**
- Out of scope (research): dynamic `/categorias/[slug]` route, any diff to `CategoryPage`/`Header`/`MobileMenu`/`CategoryCard`/`sitemap.ts`/queries/actions, product images, other categories, SEO follow-up on the title-equals-description choice (D1).
- Not touched: `__tests__/shared/Header.test.tsx` (does not enumerate category ids beyond Tornillería). The prose sentence in `CategoriesPage.tsx` listing example categories stays as-is.
