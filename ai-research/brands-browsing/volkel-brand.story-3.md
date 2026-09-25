# Völkel Brand (`/marcas` card + `/marcas/volkel`) — Research (Story 3 of `brands-browsing`)

**Date:** 2026-09-24
**Branch:** `feat/add-volkel`
**Epic:** `ai-research/epics/brands-browsing.epic.md` (Stories 1–2 shipped)
**Scope:** single story, config-only, 1–2 phases. Quick template.
**Design source:** none needed — reuses the shipped `BrandCard` and `BrandPage` UI unchanged. No design brief.

## Story Definition

### Title

Add Völkel as the seventh stocked brand: a card on `/marcas` and its own page at `/marcas/volkel`.

### Description

Stories 1–2 made brands config-driven: a brand appears on `/marcas`, in the header `Marcas` menus, in the sitemap,
and gets a `/marcas/<slug>` page purely from entries in `BRAND_PAGE_HREFS`, `BRAND_PAGES`
(`src/shared/constants/brand.constants.ts`) and `BRAND_SEO` (`src/shared/constants/seo.constants.ts`), provided
the brand's `customId` exists in the live Strapi taxonomy. Völkel exists in the backend seed as `customId: volkel`,
so this story is **data entry plus two hand-maintained copy strings**, no new components, routes or queries.

### Acceptance criteria

1. **Brand page.** `GET /marcas/volkel` server-renders every published product with `brand.customId = volkel` via
   the existing `fetchAllProductsByBrand`. Breadcrumb `Inicio / Marcas / Völkel`, kicker `Marca`,
   `<h1>Völkel: especialistas alemanes en roscado</h1>`, then the `identity` and `stock` paragraphs (copy table
   below). The category dropdown is shown, because the seed set spans 3 categories.
2. **SEO.** `generateMetadata` for `volkel` returns the verbatim `title`/`description` below, canonical
   `/marcas/volkel`, `index, follow`; 3-item `BreadcrumbList` JSON-LD ends with `Völkel`. `sitemap.ts` lists
   `/marcas/volkel` as a base page (automatic from `BRAND_PAGE_HREFS`).
3. **Index card.** `/marcas` renders a `VÖLKEL` card **second**, after Weston and before King Tony (D5: product
   count desc, seed count 60). The card's `Ver productos` links to `/marcas/volkel`. The hero reads
   `Siete marcas en almacén. Entra a la tuya y filtra por medida.` and `BRANDS_DESCRIPTION` names Völkel.
4. **Header.** The `Marcas` dropdown and mobile accordion show a `Völkel` row, not the raw Strapi name `Volkel`
   (automatic via `getBrandDisplayName`, D9). The row links to `/marcas/volkel` and gets the active treatment on
   that route.
5. **Tests.** `pnpm test` passes after updating the tests that pin copy (see Verification). `pnpm lint`,
   `pnpm exec tsc --noEmit` and `pnpm build` are clean.

### Task breakdown (for the planner)

1. **Constants:** add the `volkel` entry to `BRAND_PAGE_HREFS`, `BRAND_PAGES` (inserted second) and `BRAND_SEO`, and
   update `BRANDS_DESCRIPTION`. Edit `BrandsPage.tsx`'s `Seis` → `Siete` hero copy, plus the comment in
   `brand.constants.ts` that lists the count order.
2. **Tests + docs:** add a `volkel` row to `brand-slug-metadata.test.ts`'s `it.each` and update the literal in
   `brands-metadata.test.ts`. Update `ai-skills/REPO_CONTEXT.md` wherever it says "six" brands, "6 today" or
   quotes the brand counts, and the root `CLAUDE.md` if it enumerates brands.

## Copy

### SEO + H1 (user-supplied 2026-09-24, verbatim)

| Field | Value | Length |
| --- | --- | --- |
| `customId` / slug | `volkel` → `/marcas/volkel` | |
| `heading` (H1) | Völkel: especialistas alemanes en roscado | |
| `title` | Völkel en Puebla — Machuelos y Herramienta de Roscado \| Tehesa | 62 |
| `description` | Distribuidor de Völkel en Puebla: machuelos, tarrajas y herramienta de roscado de fabricante alemán especializado. Cotiza con Tehesa Industrial. | 144 |

`getBrandDisplayName("volkel")` → `Völkel` (text before `:` in the heading). This is what the breadcrumb, JSON-LD
leaf, search placeholder (`Buscar en Völkel...`), error page and header row display.

### `BRAND_PAGES.volkel` (hero intro split per user decision; origin/tags PROPOSED)

| Field | Value | Status |
| --- | --- | --- |
| `name` | `VÖLKEL` | Proposed (matches the all-caps convention of the other cards) |
| `origin` | `Remscheid, Alemania · +100 años` | **Proposed.** Needs sign-off |
| `identity` | Fabricante alemán dedicado por entero al roscado desde hace más de un siglo. | User copy (sentence 1 of intro) |
| `stock` | Machuelos y tarrajas para cortar rosca a la medida, una de las líneas más completas del catálogo. | User copy (sentence 2, the `En almacén:` prefix is dropped because `BrandCard` already renders an `En almacén` label) |
| `tags` | `["Machuelos", "Tarrajas", "Roscado"]` | **Proposed.** Needs sign-off |

Note: on `/marcas/volkel` the hero shows `identity` then `stock` with no `En almacén` label. That means the second
paragraph starts "Machuelos y tarrajas…" rather than the user's "En almacén: machuelos…". The same thing happens on
all six existing brand pages, so it's accepted, not a regression (see Open Question UI/III).

### Claim guard

"Fabricante alemán" **may** be stated for Völkel. The user's copy source (§1.2) says its central warehouse and
final inspection in Remscheid support the manufacturing-origin claim. This is **unlike Bohrcraft**, whose German
origin must not be upgraded to a manufacturing claim. Do not copy the Völkel wording onto Bohrcraft. The user
describes this intro and SEO pair as the template the other brands' copy was modelled on.

### `/marcas` index copy

- Hero: `Seis marcas en almacén…` → `Siete marcas en almacén. Entra a la tuya y filtra por medida.`
- `BRANDS_DESCRIPTION` (153 chars): `Weston, Völkel, King Tony, Bohrcraft, Bondhus, Precision Brand y Cleveland con
  existencia en Puebla. Explora el catálogo por marca y cotiza por WhatsApp.` (brands listed in card order)

## Technical Research

### Affected files

| File | Change |
| --- | --- |
| `src/shared/constants/brand.constants.ts` | `BRAND_PAGE_HREFS.volkel`; `BRAND_PAGES.volkel` inserted second (insertion order = render order); comment `90/26/19/13/6/5` refreshed |
| `src/shared/constants/seo.constants.ts` | `BRAND_SEO.volkel`; `BRANDS_DESCRIPTION` |
| `src/features/BrandsPage/BrandsPage.tsx` | `Seis` → `Siete` (hand-maintained, per the existing comment) |
| `__tests__/seo/brand-slug-metadata.test.ts` | New `it.each` row for `volkel` |
| `__tests__/seo/brands-metadata.test.ts` | Description literal |
| `ai-skills/REPO_CONTEXT.md` | Brand count/list mentions (six → seven, add `volkel` to the verified brands line) |

No change needed, because each of these is config-driven:
- `src/app/marcas/page.tsx` intersects live taxonomy with `BRAND_PAGES`.
- `src/app/marcas/[slug]/{page,error,loading}.tsx`.
- `src/features/BrandPage/*`, `BrandCard.tsx`.
- `Header.tsx` / `MobileMenu.tsx` use `hrefs={BRAND_PAGE_HREFS}` and `getBrandDisplayName`.
- `sitemap.ts` + `sitemap.test.ts` count `Object.keys(BRAND_PAGE_HREFS)`.
- `BrandsPage.test.tsx` and `Header.test.tsx` use their own fixtures.

### Data (backend-research, 2026-09-24, seed files only)

- Strapi seed `store-tehesa-api/data/data.json:112-114`: brand `{ name: "Volkel", customId: "volkel" }`, stored as
  ASCII with no umlaut.
- 60 Völkel products: 45 in `herramientas-corte-conformado`, 14 in `roscado-herramientas-roscas`, 1 in
  `extraccion-reparacion-fijaciones`. Samples are machuelos (BSP, izquierdos, extensión), which matches the copy.
- Seed counts: libre 107, weston 96, **volkel 60**, king-tony 25, bohrcraft 18, bondhus 15, precision 6,
  cleveland 5. These differ slightly from REPO_CONTEXT's 2026-09-17 live numbers (Weston 90, King Tony 26, and so
  on). The relative order is unchanged, so D5 still puts Völkel second.
- **Live GraphQL was unreachable** during research, so it is unverified whether `volkel` is published live.

### Edge cases and constraints

- **Not live = invisible, not broken.** If `volkel` isn't in the live taxonomy:
  - `/marcas` drops the card because of the `liveIds` filter, while the hero would still say "Siete".
  - The header shows no row.
  - `/marcas/volkel` still renders, with 0 products, because the route resolves the slug from config, not taxonomy.
  - Sitemap still lists the URL.

  The seed must be deployed before or with this change (Open Question Strapi/I).
- **Name mismatch.** The Strapi name is `Volkel`, and the frontend label comes from `BRAND_SEO.heading`. The
  `?mode=brand&brand=Volkel` catalog-wide URL and the sitemap `?mode=brand` entry use the Strapi name. That is
  expected and consistent with `Clevaland`.
- **Category dropdown.** 3 distinct categories, so the dropdown renders on `/marcas/volkel`. The 45-in-corte
  categorisation is backend-owned and is not changed here.
- **Size.** 60 products fit in 1 page of `ALL_PRODUCTS_PAGE_SIZE` (100). No pagination concern.

### Verification

`pnpm test -- __tests__/seo __tests__/brands __tests__/brand-page __tests__/shared/Header.test.tsx`, then full
`pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm build`. After that, run the dev server and curl
`/marcas`, `/marcas/volkel` and `/sitemap.xml` (per the dev-server validation practice), with the umlaut rendered in
`<title>` and `<h1>`. Test authoring follows `docs/UNIT_TESTING_GUIDELINES.md`.

## Open Questions

### Strapi contract

I: Question: Does a `volkel` brand record exist, with what name?
Status: answered
Answer: Yes, in the seed: `name: "Volkel"`, `customId: "volkel"`, 60 products across 3 categories.
Context: backend-research subagent, `store-tehesa-api/data/data.json:112-114` and `products-tehesa/data/`.
Live introspection was unreachable (localhost:1337 down).

II: Question: Is `volkel` (and its 60 products) published in the Strapi instance the deployed site reads from?
Status: pending
Explanation: The subagent could only check seed files. If it isn't live, the card and header row stay hidden and
the page is empty. Confirm the reseed/deploy order before merging.

III: Question: Should the Strapi `name` be corrected to `Völkel`?
Status: pending
Explanation: This is not required, because the display name comes from `BRAND_SEO`. It would only change the
`?mode=brand&brand=` URL and the catalog-wide brand dropdown label. It's a backend call, and out of scope here.

### UI/product decisions

I: Question: Card copy fields.
Status: answered
Answer: Split the hero intro into `identity`/`stock`. Claude drafts `origin`/`tags` (see copy table).

II: Question: Are the proposed `origin` (`Remscheid, Alemania · +100 años`) and `tags` (`Machuelos, Tarrajas,
Roscado`) OK? Should `origin` use a founding year (`desde 18xx`) like the other cards instead?
Status: pending
Explanation: Other cards use `desde <year>` or `+N años`. The user copy only says "más de un siglo", so no exact
year is sourced.

III: Question: Should the brand page show the literal "En almacén:" prefix in the hero?
Status: answered
Answer: No. It's dropped from `stock`, consistent with the six existing brands, and the card already labels it.

IV: Question: Should the index hero count and SEO description include Völkel?
Status: answered
Answer: Yes: `Siete`, plus Völkel in `BRANDS_DESCRIPTION` in card order.

V: Question: Card position?
Status: answered
Answer: Second, after Weston (D5 product-count order).

## Assumptions

- The umlaut stays in the code (`Völkel`, `VÖLKEL`). The slug and `customId` are ASCII `volkel`.
- No label change (`minor`, since it adds a page) is decided here. That is up to the PR author.
