# Brands Browsing Epic — Research

**Date:** 2026-09-17
**Branch:** `feat/add-brand-page`
**Status:** Awaiting human sign-off. No source files were modified during this research.
**Design source:** Claude Design project "Tehesa UI mocks v1"
(https://claude.ai/design/p/4b99241e-42ab-4ca4-ac4e-c1cd49a75385):

- `pagina-marcas.dc.html` — the `/marcas` page of record. Its inline header is a stale copy (user: "ignore that
  header shown").
- `header.dc.html` — the header of record, now with a `Ver todas las marcas` row (`allBrandsHref` → `/marcas`) under
  the `Marcas` dropdown / tablet dropdown / mobile accordion, light + dark. Brand rows stay inert (`mkList(BRANDS,
  null)`).
- `support.js` / `image-slot.js` — the generic Claude Design runtime, no design content.

## Epic Title

Let a buyer browse Tehesa's inventory by brand: a `/marcas` index, one page per brand, and header entry points.

## Epic Description

Today a brand is reachable only through the catalog filter `/?mode=brand&brand=<name>` (50 products/page, no copy,
no context), and the header's `Marcas` dropdown/accordion lists brands as **disabled** rows (header-navigation story,
D4) because no brand pages exist. This epic mirrors what the categories work just did (`/categorias` →
`/categorias/[slug]` → header links): an editorial index of the brands Tehesa stocks, a page per brand with the
whole matching set and in-memory filters, and the header rows/`Ver todas las marcas` entry.

Brand data is thin on purpose: Strapi's `brand` has only `name`, `customId`, `products` (no logo, description,
origin, or order — verified 2026-09-17, backend repo + live). Everything editorial on these pages is frontend copy,
same as `CATEGORY_PAGES` / `CATEGORY_SEO`.

## Live brand facts (verified 2026-09-17 by the backend-research subagent)

| Strapi `name` | `customId` | Published products | Categories spanned |
| --- | --- | --- | --- |
| Weston | `weston` | 90 | 11 |
| King Tony | `king-tony` | 26 | 3 |
| Bohrcraft | `bohrcraft` | 19 | 3 |
| Bondhus | `bondhus` | 13 | 4 |
| Precision | `precision` | 6 | 1 |
| **Clevaland** (sic) | `cleveland` | 5 | 1 |
| Marca Libre | `libre` | 107 | 1 (Tornillería only) |
| _(no brand)_ | — | 67 | — |

Notes that shape every story:

- `ProductFiltersInput.brand.customId: { eq }` works, so brand pages can reuse the `fetchAllProductsByCategory`
  shape 1:1.
- The comp's six slugs (`weston`, `king-tony`, `bohrcraft`, `bondhus`, `precision`, `cleveland`) are **exactly the
  Strapi `customId`s** — no slug↔id map is needed beyond the one the categories pattern already uses.
- `Marca Libre` is the "sin marca" tornillería the comp explicitly routes to the category page. It is a brand in
  Strapi but not a brand on `/marcas` (Story 1, decision D2).
- The Strapi brand name `Clevaland` is a typo. Display names come from frontend config, so the typo never reaches the
  UI, but the `/?mode=brand&brand=Clevaland` catalog URL and sitemap entry carry it today. Backend fix, not this epic.

## Stories

### Story 1 — `/marcas` index page

Research: `ai-research/brands-browsing/brands-index-page.story-1.md`.

ACs (summary): the header's `Marcas` dropdown/accordion gain a `Ver todas las marcas` row → `/marcas` (hidden on
`/marcas`) plus the active-route treatment on `/marcas*`; a server-rendered `/marcas` with breadcrumb, hero, `N
marcas en almacén` counter, one editorial card per configured brand (name, origin, identity, `En almacén` summary,
tags, `Ver productos` CTA), the tornillería note, the `¿No ves tu marca?` panel (`/categorias` link + brand-specific
WhatsApp prefill), `index, follow` metadata, `BreadcrumbList` JSON-LD, sitemap entry. Card CTAs and header brand rows
stay `aria-disabled`/`isDisabled` until Story 2 ships.

### Story 2 — `/marcas/[slug]` brand pages

Research: `ai-research/brands-browsing/brand-page.story-2.md` (2026-09-17; no comp — reuses the `CategoryPage`
layout by decision D1; SEO copy supplied by the user for all six brands, Bohrcraft included). Original expected
shape, from the categories precedent:

1. `src/app/marcas/[slug]/page.tsx` mirroring `categorias/[slug]/page.tsx`: slug → `customId`, `notFound()` on
   unknown, `fetchAllProductsByBrand(customId)` (new adapter cloned from `fetchAllProductsByCategory`, filter
   `brand.customId.eq`), `BreadcrumbList` JSON-LD, own `error.tsx`/`loading.tsx`.
2. A `BrandPage` feature: breadcrumb, hero from a `BRAND_PAGES[customId]` config, `WhatsappPanel`, in-memory
   `SearchInput` + **category** dropdown (Weston spans 11 categories; Bohrcraft/Bondhus/King Tony 3–4) + product grid
   + `ProductVariantsDrawer`. Subcategory filter only matters for Weston's Tornillería slice — judgment call.
3. Flip Story 1's card CTAs on via `BRAND_PAGE_HREFS`; add the six URLs to the sitemap; `BRAND_SEO` titles.
4. Open: whether `/?mode=brand&brand=<name>` catalog URLs (still in the sitemap) should redirect/canonicalize to the
   new pages, and what happens for `libre` (no page; `notFound()`).

(Header brand **rows** becoming links is part of Story 2, not a third story: it is the `hrefs` prop on
`TaxonomyDropdown`/`TaxonomyAccordionSection` fed with `BRAND_PAGE_HREFS`, one line each.)

## Delivery order

1 → 2. Story 1 ships standalone: `/marcas` reachable from the header row, by URL and via the sitemap; card CTAs and
header brand rows inert until Story 2.

## Epic Completion Status

**Last updated:** 2026-09-24 (Story 3 implementation, `/implement` on `ai-planning/brands-browsing/volkel-brand.story-3.md`).

### Story 1 — `/marcas` index page: Complete

Implemented across three phases on `feat/add-brand-page`:

- **Phase 1** (`Header.tsx`/`MobileMenu.tsx`): `Marcas` dropdown/accordion gained a `Ver todas las marcas` row
  (`allLabel` prop, mirroring `Categorías`'s `allHref` pattern), hidden on `/marcas`; `Marcas` trigger/accordion
  active on `/marcas*`. Verified: `pnpm test -- __tests__/shared/Header.test.tsx` (27/27), `tsc`, `lint`, dev-server
  `curl` on `/` and `/categorias`.
- **Phase 2** (`brand.constants.ts`, `BrandsPage`/`BrandCard`, `src/app/marcas/page.tsx`): six-brand editorial config,
  config ∩ live-taxonomy intersection, breadcrumb/hero/counter/grid/note/closing panel, disabled `Ver productos` CTA
  (`BRAND_PAGE_HREFS` empty). Verified: `pnpm test -- __tests__/brands/BrandsPage.test.tsx` (7/7), `pnpm build`,
  dev-server `curl` confirming 6 cards in comp order, metadata, JSON-LD, WhatsApp gating, and the `STRAPI_HOST`-down
  degrade (parity with `/`).
- **Phase 3** (`sitemap.ts`, docs): `/marcas` base-page sitemap entry (Strapi up and down), `seo/brands-metadata.test.ts`,
  `seo/sitemap.test.ts` updated, `CLAUDE.md`/`ai-skills/REPO_CONTEXT.md` route/feature/env docs.

All 7 ACs verified `Validated` except AC1 (header entry point) and AC7 (test-run gate), both `Cannot validate` by
dev-server check but proven by the Jest suite — see the plan's AC Validation Summary
(`ai-planning/brands-browsing/brands-index-page.story-1.md`) for the full table.

**Verification evidence:** `pnpm test` — 46 suites, 466 passed / 1 pre-existing skip, 0 failed; `pnpm lint` clean;
`pnpm exec tsc --noEmit` clean; `pnpm build` succeeds with `/marcas` as a new dynamic route.

### Story 2 — `/marcas/[slug]` brand pages: Complete

Implemented across three phases on `feat/add-specific-brand-page`:

- **Phase 1** (`seo.constants.ts`, `brand.constants.ts`, `global.queries.ts`, `global.lib.ts`): `BRAND_SEO` (six
  entries, verbatim SEO copy), `BRAND_PAGE_HREFS` filled, `getBrandIdBySlug`/`getBrandDisplayName`; `GET_ALL_PRODUCTS`
  rename (was `GET_ALL_PRODUCTS_BY_CATEGORY`); a private `fetchAllProducts(filters)` page-loop shared by
  `fetchAllProductsByCategory` and the new `fetchAllProductsByBrand`. Verified:
  `pnpm test -- __tests__/shared/global.lib.test.ts` (32/32), `tsc`, dev-server `curl` on `/marcas` (six card CTAs
  now links) and `/marcas/weston` (404 — route not built yet, as planned).
- **Phase 2** (`CategoryPageError.tsx` generalised, `src/app/marcas/[slug]/{page,error,loading}.tsx`,
  `src/features/BrandPage/BrandPage.tsx`): route clone of `categorias/[slug]` with `notFound()` on unknown/`libre`
  slugs, `fetchAllProductsByBrand`, per-brand `generateMetadata` + 3-item `BreadcrumbList` JSON-LD; `BrandPage`
  feature with name search + a category-only in-memory filter (≥ 2 distinct categories, no subcategory/brand
  dropdown). Verified: `pnpm test -- __tests__/brand-page __tests__/seo/brand-slug-metadata.test.ts
  __tests__/app/brand-slug-error.test.tsx __tests__/app/category-slug-error.test.tsx __tests__/category-page`
  (54/54), `pnpm build`, dev-server `curl` on all six slugs (counts 90/26/19/13/6/5 match live totals, category
  dropdown present/absent per brand, metadata/canonical/JSON-LD correct), WhatsApp-unset check, and the
  pre-existing `notFound()`-in-`[slug]` HTTP-200 limitation confirmed identical to `/categorias/[slug]` (not a
  regression).
- **Phase 3** (`Header.tsx`, `MobileMenu.tsx`, `sitemap.ts`, docs): brand rows relabelled via `getBrandDisplayName`
  before being passed to `TaxonomyDropdown`/`TaxonomyAccordionSection` with `hrefs={BRAND_PAGE_HREFS}`; active-row
  matching by `customId` (`pageBrandId` mirrors `pageCategoryId`) so both `/marcas/<slug>` and `?mode=brand&brand=`
  URLs highlight the relabelled row; sitemap gains the six `/marcas/<slug>` base pages. Verified:
  `pnpm test -- __tests__/shared/Header.test.tsx __tests__/brands/BrandsPage.test.tsx __tests__/seo/sitemap.test.ts`
  (37/37), full `pnpm test` (497 passed / 1 pre-existing skip, 0 failed), `pnpm build`, `pnpm lint`, dev-server
  `curl` on `/sitemap.xml` (six `/marcas/<slug>` locs, seven `mode=brand` entries, one `/marcas`) and a regression
  check on `/categorias/tornilleria-fijacion`.

5 of 6 ACs verified `Validated`; AC4 (header/mobile-menu dropdown rows) is `Cannot validate` by dev-server check —
HeroUI's `Dropdown.Popover`/`Drawer` render nothing into the initial SSR HTML until opened, confirmed by inspecting
the `<header>` slice of `/marcas/cleveland` (neither `cleveland` nor `Clevaland` appears) — proven instead by
`Header.test.tsx`. AC6 (tests) is `Cannot validate` by nature, proven by the full `pnpm test` run. See the plan's AC
Validation Summary (`ai-planning/brands-browsing/brand-page.story-2.md`) for the full table.

**Verification evidence:** `pnpm test` — 49 suites, 497 passed / 1 pre-existing skip, 0 failed; `pnpm lint` clean;
`pnpm exec tsc --noEmit` clean; `pnpm build` succeeds with `/marcas/[slug]` as a new dynamic route.

### Story 3 — Völkel brand (`/marcas` card + `/marcas/volkel`): Complete

Implemented across two phases on `feat/add-volkel` (`ai-research/brands-browsing/volkel-brand.story-3.md`,
`ai-planning/brands-browsing/volkel-brand.story-3.md`). Config-only: adding `volkel` to `BRAND_PAGE_HREFS`/
`BRAND_PAGES`/`BRAND_SEO` and updating the "Seis"→"Siete" hero/description copy made the card, the
`/marcas/volkel` page, the header row, and the sitemap entry appear with no new components/routes/queries — the
Story 2 config-driven contract held exactly as designed.

- **Phase 1** (`brand.constants.ts`, `seo.constants.ts`, `BrandsPage.tsx`): `volkel` entry inserted after `weston`
  in both maps; hero/description copy updated to "Siete". Verified: `tsc`, `lint`, and dev-server `curl` against a
  live local Strapi (initially unreachable — `ECONNREFUSED :1337` — the user started the local backend mid-phase)
  confirming `/marcas/volkel` (title/description/canonical/robots/JSON-LD leaf/h1/breadcrumb/kicker/copy/285
  product cards/category-dropdown trigger), `/marcas` (`Siete marcas en almacén`, `7 marcas en almacén` counter,
  `VÖLKEL` between `WESTON`/`KING TONY`, correct href/description), `/sitemap.xml` (`/marcas/volkel` listed), and
  `/` (header `Marcas` row server-rendered with `Völkel` label + `/marcas/volkel` href — no manual-only fallback
  needed here, unlike Story 2).
- **Phase 2** (`__tests__/seo/brand-slug-metadata.test.ts`, `__tests__/seo/brands-metadata.test.ts`,
  `ai-skills/REPO_CONTEXT.md`): new `volkel` `it.each` row and updated `BRANDS_DESCRIPTION` literal; brand-count
  mentions (six/seven, seven/eight) updated across `REPO_CONTEXT.md`. Verified:
  `pnpm test -- __tests__/seo __tests__/brands __tests__/brand-page __tests__/shared/Header.test.tsx` (96/96),
  full `pnpm test` (529 passed / 1 pre-existing skip, 49 suites, 0 failed), `pnpm lint` clean,
  `pnpm exec tsc --noEmit` clean, `pnpm build` clean, re-run dev-server `curl` against the final tree (same
  results, no errors).

5 of 5 ACs verified `Validated` — no `Cannot validate` rows this story, since the local Strapi came up mid-phase
and every check (including the header row, which turned out to be server-rendered) ran against live data. See the
plan's AC Validation Summary (`ai-planning/brands-browsing/volkel-brand.story-3.md`) for the full table.

**Verification evidence:** `pnpm test` — 49 suites, 529 passed / 1 pre-existing skip, 0 failed; `pnpm lint` clean;
`pnpm exec tsc --noEmit` clean; `pnpm build` succeeds, `/marcas` and `/marcas/[slug]` routes unchanged in shape.

### Story overview

| Story | Status | Verified evidence | Remaining work / blocker |
| --- | --- | --- | --- |
| 1 — `/marcas` index page | Complete | See above | None |
| 2 — `/marcas/[slug]` brand pages | Complete | See above | None |
| 3 — Völkel brand | Complete | See above | None |

### Overall completion

Epic-level acceptance criteria live per-story. Story 1: 7/7 ACs verified complete (6 `Validated`, 2
`Cannot validate`-but-proven-by-tests, 0 failed). Story 2: 6/6 ACs verified complete (4 `Validated`, 2
`Cannot validate`-but-proven-by-tests, 0 failed). Story 3: 5/5 ACs verified complete (5 `Validated`, 0 failed).
**18/18 acceptance criteria complete.** All three stories in this epic are done.

### Next Steps

1. Decide the `Clevaland` Strapi typo, the `Volkel`→`Völkel` Strapi admin rename, and `/?mode=brand` URL fate (all
   explicitly deferred, backend/product judgment, out of scope for every story in this epic).
2. Manual checks still owed before merge: desktop `Marcas` dropdown rows/labels/active-row on `/`, `/marcas/cleveland`,
   `/marcas/volkel`, and `/?mode=brand&brand=Clevaland`; mobile accordion `aria-current`; light/dark layout at
   390/1440 on a brand page; drawer open from a brand-page card click; `/marcas/volkel`'s 3-category dropdown
   filtering.
