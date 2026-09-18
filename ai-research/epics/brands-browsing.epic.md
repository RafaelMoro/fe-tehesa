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

Not yet researched; no comp yet. Expected shape, from the categories precedent:

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
