# Implementation Plan: Improve Pagination, Loading, And Navigation Feedback

## Header

- Story: Improve Pagination, Loading, And Navigation Feedback.
- Source research: `ai-research/stories/plp-pagination-navigation-feedback.story2.md`.
- Sign-off status/date: plan-ready per research outcome, 2026-07-12.
- Assumptions:
  - Story 1b local filtering and Story 1c catalog-wide search are implemented baselines.
  - Known full-catalog total is temporarily `333`; page size remains `50`.
  - Filtered totals are unavailable, so filtered modes keep Previous/current/Next with `products.length === 50` next-page inference.
  - `notice=end` is accepted as reproducible URL state for speculative end-of-results feedback.
  - Route error boundary is included only if the current page has no Spanish recovery surface for server fetch failures.

## Acceptance Criteria

1. Base `?page=N` accepts pages `1..7`, where 7 is computed from the documented known total (333) and page size (50); malformed, nonpositive, and out-of-range pages canonicalize to page 1.
2. Base mode displays numbered pages 1-7 so users understand catalog size. Filtered modes retain Previous/current-page/Next until Strapi exposes per-filter totals.
3. Name/category/brand mode, selected name/query, and page are URL-backed; direct links, reload, and browser back/forward fetch exactly the requested catalog result once.
4. Base route transitions and catalog-wide navigation expose accessible loading feedback and disable duplicate navigation while pending.
5. Failed or speculative-empty navigation does not replace the last populated result set with a misleading empty PLP; users receive Spanish feedback and recover to a canonical populated URL.

## Affected Files

### `src/app/**`

- `src/app/page.tsx`
- `src/app/loading.tsx` (new)
- `src/app/error.tsx` (new only if needed)

### `src/app/api/**`

- `src/app/api/catalog/_utils.ts`
- `src/app/api/catalog/products/route.ts`
- `src/app/api/catalog/category/route.ts`
- `src/app/api/catalog/brand/route.ts`
- `src/app/api/catalog/search/route.ts` only if shared validation signatures change

### `src/features/**`

- `src/features/Home/Home.tsx`
- `src/features/Home/useCatalogSearch.ts`
- `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx`
- `src/features/ProductListing/DropdownCategories.tsx`
- `src/features/ProductListing/DropdownBrands.tsx`

### `src/shared/**`

- `src/shared/constants/catalog.constants.ts`
- `src/shared/lib/global.lib.ts`
- `src/shared/queries/global.queries.ts`
- `src/shared/types/global.types.ts` only if explicit URL/initial-state props help keep types readable

### Tests And Docs

- `__tests__/catalog/_utils.test.ts`
- `__tests__/catalog/products/route.test.ts`
- `__tests__/catalog/category/route.test.ts`
- `__tests__/catalog/brand/route.test.ts`
- `__tests__/shared/global.lib.test.ts`
- `__tests__/home/Home.test.tsx`
- `__tests__/home/useCatalogSearch.test.tsx`
- Focused loading/error/parser tests only if new behavior is not already covered through public seams
- `REPO_CONTEXT.md`
- `AGENTS.md`

## Phase 1: Catalog Constants And API Contract

### Changes Required

| Path | Action | Change |
| --- | --- | --- |
| `src/shared/constants/catalog.constants.ts` | Modify | Near `PRODUCT_PAGE_SIZE`, add `KNOWN_PRODUCT_TOTAL = 333` and derive `PRODUCT_PAGE_MAX = Math.ceil(KNOWN_PRODUCT_TOTAL / PRODUCT_PAGE_SIZE)`. Keep `PRODUCT_PAGE_MIN = 1` and fixed page size `50`. |
| `src/shared/constants/catalog.constants.ts` | Modify | Rename taxonomy validation messages from ID wording to name wording if public params move to `category`/`brand`; keep existing `CAT_VAL_003`/`CAT_VAL_004` codes. |
| `src/app/api/catalog/_utils.ts` | Modify | Replace `parseTaxonomyId` with a tiny taxonomy-name parser that trims, requires a non-empty value, caps length using the existing search-term limit unless a smaller existing constant is kept, and uses `SEARCH_TERM_PATTERN`. Return `categoryName` and `brandName` from `readValidatedParams`. |
| `src/app/api/catalog/_utils.ts` | Modify | Change `findTaxonomyItem(items, value)` to match `item.name` with the approved contains behavior, or delete it and use a direct `some()` in the two routes. Prefer deletion if only two callers remain. |
| `src/app/api/catalog/products/route.ts` | Modify | Keep using `page` and `pageSize`; page 6 and 7 now validate through the computed `PRODUCT_PAGE_MAX`, page 8 fails with `CAT_VAL_001`. |
| `src/app/api/catalog/category/route.ts` | Modify | Read `category` instead of `categoryId`; validate against live categories by name contains; call `fetchProductsByCategory(categoryName, page)`. |
| `src/app/api/catalog/brand/route.ts` | Modify | Read `brand` instead of `brandId`; validate against live brands by name contains; call `fetchProductsByBrand(brandName, page)`. |
| `src/shared/lib/global.lib.ts` | Modify | Change `fetchProductsByCategory(customId, page)` and `fetchProductsByBrand(brandId, page)` parameter names to `categoryName`/`brandName`; variables filter on `category.name.contains` and `brand.name.contains`. |
| `src/shared/queries/global.queries.ts` | No structural change expected | The queries already accept `$filters`; only the adapter variable shape changes unless tests expose a query field mismatch. |

Edge cases:

- Preserve strict digits-only page parsing: no signs, decimals, whitespace padding, or prefixes.
- Category/brand public URLs use decoded names, not `customId`; encode only when building URLs.
- Keep `TaxonomyItem.customId` in taxonomy responses for local visible filters and compatibility.

Rationale: one named total replaces the old hardcoded ceiling without adding a metadata abstraction before Strapi exposes totals.

### Success Criteria

Automated:

- `pnpm test -- __tests__/catalog/_utils.test.ts`
- `pnpm test -- __tests__/catalog/products/route.test.ts`
- `pnpm test -- __tests__/catalog/category/route.test.ts`
- `pnpm test -- __tests__/catalog/brand/route.test.ts`
- `pnpm test -- __tests__/shared/global.lib.test.ts`
- `pnpm exec tsc --noEmit`

Manual:

- Confirm `/api/catalog/products?page=6&pageSize=50` and page 7 forward to the product adapter in local route checks when Strapi env vars are present.
- Confirm page 8, malformed, and nonpositive product pages return `CAT_VAL_001`.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/shared/constants/catalog.constants.ts` | computed seven-page max from 333/50 | `_utils` and products route tests |
| `src/app/api/catalog/_utils.ts` | strict page parser, taxonomy name parser, fixed page size | `pnpm test -- __tests__/catalog/_utils.test.ts` |
| `src/app/api/catalog/{products,category,brand}/route.ts` | page 6/7 acceptance, page 8 rejection, name params | targeted route tests |
| `src/shared/lib/global.lib.ts` | GraphQL variables use `name.contains` for category/brand | `pnpm test -- __tests__/shared/global.lib.test.ts` |

## Phase 2: Server URL Orchestration And Canonical Redirects

### Changes Required

| Path | Action | Change |
| --- | --- | --- |
| `src/app/page.tsx` | Modify | Expand `searchParams` to include `page`, `mode`, `q`, `category`, `brand`, and `notice`. |
| `src/app/page.tsx` | Modify | Add local parsing/normalization near the current page parser: missing mode means base; valid modes are `name`, `category`, `brand`; missing/invalid mode values canonicalize to `/?page=1`. |
| `src/app/page.tsx` | Modify | Base mode: malformed, nonpositive, or page `> PRODUCT_PAGE_MAX` redirects to `/?page=1`; valid pages call `fetchProducts(page)`. |
| `src/app/page.tsx` | Modify | Wide mode: validate page as positive only; validate mode value using the same search-term policy; call exactly one server adapter: `fetchProductsByName(q, page)`, `fetchProductsByCategory(category, page)`, or `fetchProductsByBrand(brand, page)`. Do not fetch default products first. |
| `src/app/page.tsx` | Modify | Fetch categories, brands, and theme in parallel with the selected product fetch where possible. Keep direct server action calls; do not call internal HTTP API. |
| `src/app/page.tsx` | Modify | Empty page policy: page 1 empty is valid; page `>1` empty redirects to the same mode/value page 1 unless `notice=end` recovery applies. For speculative next, redirect back to previous populated page with `notice=end`. |
| `src/app/page.tsx` | Modify | Pass `Home` a server-derived initial catalog state: products, mode, value, current page, base total pages, `hasPrevious`, `hasNext`, and optional feedback for `notice=end`. |
| `src/shared/types/global.types.ts` | Modify only if useful | Add small `CatalogMode`/initial-state prop types if this avoids inline unions in `page.tsx` and `Home.tsx`; do not add a parser framework. |

Edge cases:

- `redirect()` is the canonicalization mechanism; do not silently render page 1 under malformed URLs.
- Remove `notice` on normal mode/value/page changes by generating URLs without it.
- Browser back/forward correctness comes from `router.push` plus server-derived props; do not store product arrays in history state.

Rationale: URL state becomes the source of truth and avoids the current default-fetch-then-client-refetch path.

### Success Criteria

Automated:

- `pnpm exec tsc --noEmit`
- `pnpm build`

Manual:

- Desktop and mobile: open `/?page=6` and `/?page=7`; confirm correct numbered base page state.
- Open malformed/nonpositive/out-of-range base URLs; confirm the browser lands on `/?page=1`.
- Open `/?mode=name&q=llave&page=2`, `/?mode=category&category=<name>&page=2`, and `/?mode=brand&brand=<name>&page=2`; confirm one server result set appears after reload.
- Use browser Back/Forward across base and wide URLs; confirm each URL restores exactly its state.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/app/page.tsx` | mode/value/page normalization, single selected fetch, redirects | `pnpm build` + manual direct URL/reload/history checks |
| `src/shared/types/global.types.ts` | prop/type shape only if touched | `pnpm exec tsc --noEmit` |

## Phase 3: Home URL-Backed Navigation

### Changes Required

| Path | Action | Change |
| --- | --- | --- |
| `src/features/Home/Home.tsx` | Modify | Replace client-owned wide result state with server-derived props. Keep local visible filters, product details drawer, and taxonomy arrays. |
| `src/features/Home/Home.tsx` | Modify | Extend `HomeProps` with `catalogMode`, `catalogValue`, `catalogPage`, `hasPreviousCatalogPage`, `hasNextCatalogPage`, and optional initial feedback. Use clearer names if implementation chooses a single `initialCatalogState` object. |
| `src/features/Home/Home.tsx` | Modify | Keep `allProducts.current` and `filteredProducts` synchronized from `products`, but do not clear server-derived active mode/value on every product change. Only reset local filters when new server products arrive. |
| `src/features/Home/Home.tsx` | Modify | Base numbered pagination renders `1..totalPages` and pushes `/?page=N`. Disable active/current and all navigation controls while route transition is pending. |
| `src/features/Home/Home.tsx` | Modify | Wide Previous/Next pushes canonical mode URLs preserving selected mode/value and target page. Disable duplicate navigation while pending. Disable Next when `notice=end` is active or `hasNextCatalogPage` is false. |
| `src/features/Home/Home.tsx` | Modify | Search submit trims/validates the drawer term, then pushes `/?mode=name&q=<encoded>&page=1`; category/brand selection pushes `/?mode=category&category=<encoded name>&page=1` and `/?mode=brand&brand=<encoded name>&page=1`. |
| `src/features/Home/Home.tsx` | Modify | `Limpiar búsqueda` pushes the canonical base URL, preserving the intended base page only if already known from props; otherwise use `/?page=1`. |
| `src/features/Home/useCatalogSearch.ts` | Modify | Reduce hook responsibilities to drawer state, name input validation/messages, and pending/client-validation flags that remain. Remove imperative `fetchCatalog` ownership if no production path still uses it. |
| `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx` | Modify | Rename callback prop arguments from IDs to names for catalog-wide dropdowns; pass disabled/pending state to submit and dropdown controls. Remove the drawer spinner if route loading now covers the committed navigation to avoid duplicate loading messages. |
| `src/features/ProductListing/DropdownCategories.tsx` | Modify | Keep local-filter compatibility with `customId`; add a `valueKey`/callback-name prop only if needed by both local filtering and catalog-wide name navigation. Prefer the smallest prop change over duplicating dropdowns. |
| `src/features/ProductListing/DropdownBrands.tsx` | Modify | Same as categories: support existing local `customId` selection and catalog-wide name selection without new state libraries or duplicated components. |

Edge cases:

- Local visible filters remain client-only and never enter the URL.
- Category/brand names may contain spaces or punctuation allowed by `SEARCH_TERM_PATTERN`; URL builders must use `encodeURIComponent`.
- Do not add caching, prefetch, or a store. Server props are authoritative.

Rationale: this removes duplicate client result ownership and lets reload/back/forward work without special history state.

### Success Criteria

Automated:

- `pnpm test -- __tests__/home/Home.test.tsx`
- `pnpm test -- __tests__/home/useCatalogSearch.test.tsx`
- `pnpm exec tsc --noEmit`

Manual:

- Desktop and mobile: select base page 6/7; confirm generated URL and active page.
- Submit wide name search, category, and brand selections; confirm URLs use mode/value/page and names, not IDs.
- Navigate Previous/Next in each wide mode; confirm Back restores prior mode/page.
- Confirm `Limpiar búsqueda` returns to a canonical base URL and local filters still behave over the current visible set.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/features/Home/Home.tsx` | numbered pages 1-7, generated URLs, wide prev/next, clear behavior, notice=end | Home tests + manual browser checks |
| `src/features/Home/useCatalogSearch.ts` | input trimming/validation/messages still owned by hook | hook tests |
| `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx` | commit controls disabled/pending and Spanish feedback | Home tests where practical + manual checks |
| `src/features/ProductListing/Dropdown*.tsx` | local ID selection and catalog-wide name selection remain distinct | Home tests + manual dropdown checks |

## Phase 4: Loading And Failure Recovery UI

### Changes Required

| Path | Action | Change |
| --- | --- | --- |
| `src/app/loading.tsx` | Create | Minimal route-segment fallback with `role="status"` and Spanish copy such as `Cargando productos...`. No skeleton required. |
| `src/app/error.tsx` | Create if needed | Client error boundary with Spanish generic catalog error copy and a retry button that calls Next's `reset()`. Do not expose Apollo/Strapi details. |
| `src/features/Home/Home.tsx` | Modify | Show initial `notice=end` feedback as `role="status"` with `No hay más resultados.`. Keep populated results from the redirected canonical page. |
| `src/features/Home/Home.tsx` | Modify | Ensure pending route navigation disables base pagination, wide Previous/Next, search submit, category/brand commit, and clear-wide controls. Use `startTransition` only if it reliably tracks the App Router push path here. |

Edge cases:

- Server adapter failures must not be converted to successful empty arrays.
- Existing API route error envelopes remain unchanged.
- Direct page 1 empty states keep Spanish empty copy; only page `>1` empty states redirect.

### Success Criteria

Automated:

- `pnpm test -- __tests__/home/Home.test.tsx`
- Add and run a focused loading/error component test only if the component contains behavior beyond static accessible copy: `pnpm test -- <relative test path>`.
- `pnpm build`

Manual:

- Trigger a route transition from base pagination and a wide-mode navigation; confirm accessible loading feedback and disabled duplicate navigation.
- Visit a redirected speculative end URL and confirm populated results plus `No hay más resultados.` with Next disabled.
- Simulate a server fetch failure if practical with local env/config; confirm Spanish retry UI if `error.tsx` was added.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/app/loading.tsx` | accessible status copy | focused test if added + manual transition check |
| `src/app/error.tsx` | Spanish message and retry action | focused test if added + `pnpm build` |
| `src/features/Home/Home.tsx` | notice=end feedback, disabled duplicate navigation | Home tests + manual checks |

## Phase 5: Tests And Documentation

### Changes Required

| Path | Action | Change |
| --- | --- | --- |
| `__tests__/catalog/_utils.test.ts` | Modify | Pages 6/7 accepted; page 8, malformed, nonpositive rejected. Category/brand validators accept names and reject unsafe/empty values. |
| `__tests__/catalog/products/route.test.ts` | Modify | Page 6/7 forward to adapter with page size 50; page 8 returns `CAT_VAL_001`. |
| `__tests__/catalog/category/route.test.ts` | Modify | Public param is `category`; route validates taxonomy by name and calls adapter with category name/page. |
| `__tests__/catalog/brand/route.test.ts` | Modify | Public param is `brand`; route validates taxonomy by name and calls adapter with brand name/page. |
| `__tests__/shared/global.lib.test.ts` | Modify | Category/brand adapter variables use `category.name.contains` and `brand.name.contains`. |
| `__tests__/home/Home.test.tsx` | Modify | Cover base pages 1-7, page 7 disabled/active semantics, page 6/7 URLs, mode/value/page URLs, encoded category/brand names, clear-wide URL, `notice=end` feedback, and pending controls where testable. |
| `__tests__/home/useCatalogSearch.test.tsx` | Modify | Preserve validation/message tests; remove imperative fetch-result ownership assertions if production no longer owns that behavior. |
| `REPO_CONTEXT.md` | Modify | After implementation, replace five-page invariant with known-total seven-page base pagination, canonical mode URLs, category/brand-name filtering, redirect policy, and route loading/error UI. |
| `AGENTS.md` | Modify | Remove the hardcoded five-page constraint line or replace it with the current known-total/page-size note after implementation. |

Test authoring reference: follow `docs/UNIT_TESTING_GUIDELINES.md`; do not render async `src/app/page.tsx` directly with Testing Library.

### Success Criteria

Automated:

- `pnpm test -- __tests__/catalog/_utils.test.ts`
- `pnpm test -- __tests__/catalog/products/route.test.ts`
- `pnpm test -- __tests__/catalog/category/route.test.ts`
- `pnpm test -- __tests__/catalog/brand/route.test.ts`
- `pnpm test -- __tests__/shared/global.lib.test.ts`
- `pnpm test -- __tests__/home/Home.test.tsx`
- `pnpm test -- __tests__/home/useCatalogSearch.test.tsx`
- `pnpm test`
- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm build`

Manual:

- Desktop and mobile browser pass over: direct base pages 1/6/7/8, malformed URLs, wide mode direct URLs, reload, Back/Forward, loading feedback, failure recovery if practical, and speculative end behavior.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| Catalog route tests | parser boundaries, route envelopes, adapter forwarding | targeted `pnpm test -- ...` commands |
| Shared adapter tests | GraphQL variable shapes and page size | `pnpm test -- __tests__/shared/global.lib.test.ts` |
| Home tests | URL generation, visible pagination semantics, feedback copy | `pnpm test -- __tests__/home/Home.test.tsx` |
| Hook tests | remaining drawer input validation responsibilities | `pnpm test -- __tests__/home/useCatalogSearch.test.tsx` |
| Docs | repo context matches implemented catalog behavior | review diff + no command required beyond lint/build for source |

## Cross-Cutting Concerns

- Strapi env vars: `STRAPI_HOST` and `STRAPI_API_TOKEN` remain required; API route env validation stays at route edges.
- GraphQL contract: current repo only proves filters can be passed as `ProductFiltersInput`; `category.name.contains` and `brand.name.contains` are story-approved assumptions from research.
- Server/client boundary: `src/app/page.tsx` calls server actions directly; `Home` receives server-derived state and only builds canonical URLs.
- Pagination: base mode is numbered from known total; filtered mode keeps response-length Next inference until Strapi exposes filtered totals.
- Empty/failure policy: page 1 empty can render empty copy; page `>1` empty redirects; server failures surface through error boundary or existing route envelopes, never as fake empty success.
- Responsive UI: manual checks must include desktop and mobile because the catalog controls wrap and drawers/overlays are user-facing.

## Open Questions / Out-of-Scope Items

- Open questions: none from the research doc.
- Out of scope: Strapi/backend changes or live pagination metadata support.
- Out of scope: filtered numbered pagination, total result counts, item range copy, prefetching, telemetry, caching, new state libraries, new test frameworks, and broad component refactors.
- Out of scope: rewriting historical Story 1b/1c research docs; this story only supersedes their client-only pagination assumptions.

## Decisions Beyond The Research Doc

- No new shared parser framework is planned; reuse or tiny local parsing only where it removes real duplication.
- `REPO_CONTEXT.md` and `AGENTS.md` are updated after behavior changes, not during planning, so they do not document future behavior as current fact.
