# Plan: Völkel Brand (`/marcas` card + `/marcas/volkel`) (Story 3 of `brands-browsing`)

**Source research:** `ai-research/brands-browsing/volkel-brand.story-3.md` (2026-09-24, branch `feat/add-volkel`).
**Sign-off status:** the doc has no explicit sign-off line. The user answered every open question on 2026-09-24
(Strapi I–III, UI I–V), and `origin`/`tags` were validated, so it is treated as signed off. That is the same basis
as Stories 1–2. **Confirm before `/implement`.**
**Plan date:** 2026-09-24.

## Assumptions

- `volkel` and its 60 products are published in the live Strapi instance behind `.env.local` (Strapi II, answered
  yes). If the local instance lacks it:
  - The `/marcas` card and the header row are missing.
  - `/marcas/volkel` still renders with 0 products.

  That is an environment gap, not a code defect.
- The live Strapi `name` may still be `Volkel` (the admin rename is backend-owned, Strapi III). The frontend is
  unaffected either way because every visible label comes from `BRAND_SEO.volkel.heading`.
- The umlaut stays in the source (`Völkel`, `VÖLKEL`). Slug and `customId` are ASCII `volkel`.
- `BRAND_PAGES` insertion order equals the render order. `volkel` goes second (D5, seed count 60 sits between
  Weston 96 and King Tony 25). `BRAND_PAGE_HREFS`/`BRAND_SEO` order is irrelevant, but `volkel` goes second there
  too for readability.
- No component, route, query or fixture changes. `page.tsx`, `[slug]/*`, `BrandPage/*`, `BrandCard`,
  `Header`/`MobileMenu`, `sitemap.ts` and their tests are config-driven (research "No change needed").

## Acceptance Criteria

1. **Brand page.** `GET /marcas/volkel` server-renders every published product with `brand.customId = volkel` via
   `fetchAllProductsByBrand`. Breadcrumb `Inicio / Marcas / Völkel`, kicker `Marca`,
   `<h1>Völkel: especialistas alemanes en roscado</h1>`, then the `identity` and `stock` paragraphs. The category
   dropdown is shown (3 categories).
2. **SEO.** `generateMetadata` for `volkel` returns the verbatim `title`/`description`, canonical `/marcas/volkel`,
   and `index, follow`. The 3-item `BreadcrumbList` JSON-LD ends with `Völkel`. `sitemap.ts` lists
   `/marcas/volkel`.
3. **Index card.** `/marcas` renders a `VÖLKEL` card second (after Weston, before King Tony), and its
   `Ver productos` links to `/marcas/volkel`. The hero reads
   `Siete marcas en almacén. Entra a la tuya y filtra por medida.` and `BRANDS_DESCRIPTION` names Völkel.
4. **Header.** The `Marcas` dropdown and mobile accordion show a `Völkel` row (not `Volkel`) that links to
   `/marcas/volkel` and is active on that route.
5. **Tests.** `pnpm test` passes after the copy-pinning tests are updated. `pnpm lint`, `pnpm exec tsc --noEmit`
   and `pnpm build` are clean.

## Affected files

- `src/shared/constants/brand.constants.ts`: `BRAND_PAGE_HREFS.volkel`, `BRAND_PAGES.volkel`, and the order
  comment.
- `src/shared/constants/seo.constants.ts`: `BRAND_SEO.volkel`, `BRANDS_DESCRIPTION`.
- `src/features/BrandsPage/BrandsPage.tsx`: hero `Seis` → `Siete`.
- `__tests__/seo/brand-slug-metadata.test.ts`: new `it.each` row.
- `__tests__/seo/brands-metadata.test.ts`: description literal.
- `ai-skills/REPO_CONTEXT.md`: brand count/list mentions.

`CLAUDE.md` and `AGENTS.md` do not enumerate brands (grep-verified), so they need no change.

---

## Phase 1: Brand config + index copy

### Changes Required

**`src/shared/constants/brand.constants.ts`** (Modify)
- `BRAND_PAGE_HREFS`: add `volkel: "/marcas/volkel"` after `weston`.
- The comment above `BRAND_PAGES`: change `90/26/19/13/6/5` to the seed order `96/60/25/18/15/6/5`, and change
  `"Seis"` to `"Siete"`.
- `BRAND_PAGES`: insert `volkel` directly after `weston`, using the research copy table verbatim:
  ```ts
  volkel: {
    name: "VÖLKEL",
    origin: "Remscheid, Alemania · desde 1915",
    identity: "Fabricante alemán dedicado por entero al roscado desde hace más de un siglo.",
    stock: "Machuelos y tarrajas para cortar rosca a la medida, una de las líneas más completas del catálogo.",
    tags: ["Machuelos", "Tarrajas", "Roscado"],
  },
  ```

**`src/shared/constants/seo.constants.ts`** (Modify)
- `BRAND_SEO`: add a `volkel` entry after `weston` with this verbatim copy:
  - `title`: `Völkel en Puebla — Machuelos y Herramienta de Roscado | Tehesa`
  - `description`: `Distribuidor de Völkel en Puebla: machuelos, tarrajas y herramienta de roscado de fabricante
    alemán especializado. Cotiza con Tehesa Industrial.`
  - `heading`: `Völkel: especialistas alemanes en roscado`

  The `heading` feeds `getBrandDisplayName` (`Völkel`), so AC1's breadcrumb/JSON-LD and AC4's header row come for
  free.
- `BRANDS_DESCRIPTION`: `Weston, Völkel, King Tony, Bohrcraft, Bondhus, Precision Brand y Cleveland con existencia
  en Puebla. Explora el catálogo por marca y cotiza por WhatsApp.`

**`src/features/BrandsPage/BrandsPage.tsx`** (Modify, the hero `<p>` near line 44)
- `Seis marcas en almacén.` → `Siete marcas en almacén.` (rest unchanged).

**Claim guard:** "Fabricante alemán" goes on Völkel only. Do not touch Bohrcraft's copy.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`

**Dev-server validation** (`pnpm dev`, `http://localhost:3000`)
- `GET /marcas/volkel` returns 200 and the HTML contains:
  - `<title>`: `Völkel en Puebla — Machuelos y Herramienta de Roscado | Tehesa`
  - the meta description above
  - `<link rel="canonical"` ending in `/marcas/volkel`
  - `index, follow` (or no `noindex`)
  - `<h1>` text `Völkel: especialistas alemanes en roscado`
  - the breadcrumb `Marcas` link plus `Völkel`
  - the kicker `Marca`
  - both the `identity` and `stock` sentences
  - JSON-LD `BreadcrumbList` whose 3rd item name is `Völkel`
  - product cards (non-zero; the seed has 60)
  - the category dropdown trigger
- `GET /marcas` returns 200 and the HTML contains:
  - `Siete marcas en almacén. Entra a la tuya y filtra por medida.`
  - `VÖLKEL` appearing after `WESTON` and before `KING TONY` in source order
  - `href="/marcas/volkel"`
  - the meta description containing `Weston, Völkel, King Tony`
- `GET /sitemap.xml` returns 200 and contains `/marcas/volkel`.
- Header on any page (for example `GET /`): the markup contains a `Völkel` brand row with `/marcas/volkel` if the
  dropdown/accordion items are server-rendered. Otherwise this is manual (below).
- No server-log errors, no hydration warnings.

**Manual**
- Desktop `Marcas` dropdown and mobile accordion: the `Völkel` row is present, navigates to `/marcas/volkel`, and
  shows the active treatment there.
- `/marcas/volkel` category dropdown lists 3 categories and filters.

---

## Phase 2: Tests + repo context

### Changes Required

**`__tests__/seo/brand-slug-metadata.test.ts`** (Modify, the first `it.each`)
- Add a `["volkel", <title>, <description>]` row after `weston` with the Phase 1 strings verbatim.

**`__tests__/seo/brands-metadata.test.ts`** (Modify, the `description` expectation near line 12)
- Replace the literal with the new `BRANDS_DESCRIPTION`.

No other test changes: `sitemap.test.ts` counts `Object.keys(BRAND_PAGE_HREFS)`, and `BrandsPage.test.tsx`,
`BrandPage.test.tsx` and `Header.test.tsx` use their own fixtures. If any of them fails, fix only the pinned literal
and report it. Follow `docs/UNIT_TESTING_GUIDELINES.md`.

**`ai-skills/REPO_CONTEXT.md`** (Modify, facts only)

| Line | Change |
| --- | --- |
| 69 | "six stocked brands" → "seven" |
| 76 | "6 today" → "7 today" and "still seven including `libre`" → "eight" |
| 102 | "Seis marcas..." → "Siete marcas..." and "all six configured brands" → "seven" |
| 109 | "the six `/marcas/<slug>` entries" / "six stocked brands" → "seven" |
| 115 | "six of seven live brands linked" → "seven of eight" |
| 179 | Add `volkel` (60 seed products; Strapi name `Volkel`, display `Völkel` via `BRAND_SEO`; spans 3 categories) and change "7 published" → "8". Label the Völkel count as a 2026-09-24 seed count, not live-verified. |
| 237 | "6 today" → "7 today" and "all seven live brands" → "eight" |

### Success Criteria

**Automated**
- `pnpm test -- __tests__/seo __tests__/brands __tests__/brand-page __tests__/shared/Header.test.tsx`
- `pnpm test`
- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm build`

**Dev-server validation:** re-run the Phase 1 `curl` checks of `/marcas/volkel`, `/marcas` and `/sitemap.xml`
against the final tree. Expect the same results and no server-log errors.

**Manual:** none beyond Phase 1.

---

## Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `brand.constants.ts` | slug resolution, card order, card copy | `curl /marcas/volkel` 200; `curl /marcas` card order + href |
| `seo.constants.ts` | title/description/heading, index description | `brand-slug-metadata.test.ts`, `brands-metadata.test.ts`; `curl` `<title>`/meta |
| `BrandsPage.tsx` | `Siete` hero copy | `curl /marcas` contains the hero string |
| `sitemap.ts` (unchanged) | `/marcas/volkel` listed | `sitemap.test.ts` (key count); `curl /sitemap.xml` |
| `Header`/`MobileMenu` (unchanged) | `Völkel` label, link, active state | manual click-through; `Header.test.tsx` still green |

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1: brand page | 1 | `GET /marcas/volkel` 200; `<h1>Völkel: especialistas alemanes en roscado`, breadcrumb `Völkel`, kicker `Marca`, identity + stock text, product cards, category dropdown trigger | Not validated | 3-category dropdown content is confirmed manually |
| AC2: SEO | 1, 2 | `GET /marcas/volkel` `<title>`/description verbatim, canonical `/marcas/volkel`, JSON-LD leaf `Völkel`; `GET /sitemap.xml` contains `/marcas/volkel` | Not validated | Also pinned by `brand-slug-metadata.test.ts` |
| AC3: index card | 1 | `GET /marcas` 200; `VÖLKEL` between `WESTON` and `KING TONY`, `href="/marcas/volkel"`, `Siete marcas en almacén…`, description names Völkel | Not validated | |
| AC4: header | 1 | `GET /` markup contains a `Völkel` row + `/marcas/volkel` if rendered server-side | Cannot validate | HeroUI dropdown/drawer items likely mount client-side only; covered by the Phase 1 manual click-through (label, link, active state) |
| AC5: tests/tooling | 2 | n/a (commands) | Not validated | `pnpm test`, `lint`, `tsc --noEmit`, `build` |

## Cross-cutting concerns

- **Live taxonomy dependency.** The `/marcas` card and the header row appear only if `volkel` is in the live
  `fetchBrands()` result, because `page.tsx` intersects `liveIds` with `BRAND_PAGES`. If it is missing locally,
  report it as an environment gap. Do not add a fallback.
- **UTF-8 copy.** The umlaut must survive into `<title>`, `<h1>`, and JSON-LD. `curl` output should show `ö`/`Ö`
  literally (or as an entity). Either is fine as long as it isn't mojibake.

## Open Questions / Out of scope

- **Out of scope:** the Strapi rename `Volkel` → `Völkel` (backend repo branch `fix/correct-volkel-name` plus a
  Strapi admin edit; the user pushes it).
- **Out of scope:** Völkel's 45-in-`herramientas-corte-conformado` categorisation (backend-owned).
- **Out of scope:** the missing `En almacén` label in the `/marcas/<slug>` hero (UI III, accepted for all brands).
- **Out of scope:** the PR label (`minor` suggested, since this adds a page; PR author decides).
- **Open:** none.
