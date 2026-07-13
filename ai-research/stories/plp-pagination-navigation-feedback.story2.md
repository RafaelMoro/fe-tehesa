# Research: Improve Pagination, Loading, And Navigation Feedback

## Research Mode

- Mode: full research.
- Scope: Story 2 from `ai-research/epics/plp-functionality-seo.epic.md`.
- Baseline: implemented Story 1b local filtering and Story 1c catalog-wide search.
- Research date: 2026-07-12.

## Story Definition

### Story Title

Improve Pagination, Loading, And Navigation Feedback.

### Story Description

Replace the incorrect five-page ceiling with seven numbered base pages derived from the
known temporary total of 333 products, and make base plus catalog-wide pagination
URL-backed, reloadable, and predictable through browser back/forward. Preserve page
size 50 and provide accessible loading, empty-page, failure, and end-of-results
feedback. The total-count source is intentionally replaceable when Strapi pagination
metadata is enhanced.

Story 1c already implemented client-side Previous/Next pagination for catalog-wide
name/category/brand modes. This story does not rebuild those controls; it moves their
authoritative state into the URL/server data path and finishes the missing base catalog
behavior.

### Acceptance Criteria

1. Base `?page=N` accepts pages `1..7`, where 7 is computed from the documented known
   total (333) and page size (50); malformed, nonpositive, and out-of-range pages
   canonicalize to page 1.
2. Base mode displays numbered pages 1-7 so users understand catalog size. Filtered
   modes retain Previous/current-page/Next until Strapi exposes per-filter totals.
3. Name/category/brand mode, selected name/query, and page are URL-backed; direct links,
   reload, and browser back/forward fetch exactly the requested catalog result once.
4. Base route transitions and catalog-wide navigation expose accessible loading
   feedback and disable duplicate navigation while pending.
5. Failed or speculative-empty navigation does not replace the last populated result
   set with a misleading empty PLP; users receive Spanish feedback and recover to a
   canonical populated URL.

## Implemented Baseline

### Story 1b Already Provides

- Stacked local name/category/brand filters over the current working set.
- Local active-state feedback and Spanish no-match copy.
- `Limpiar filtros` restores the current working set without clearing wide mode.
- Wider-search recovery action.

These local filters remain client-only and are not added to the URL.

### Story 1c Already Provides

- Catalog-wide name/category/brand modes and mutually exclusive state.
- `/api/catalog/search`, `/category`, and `/brand` page parameters.
- Previous/Next controls for active wide modes where totals are not yet available.
- `results.length === 50` next-page inference.
- Loading flags, disabled controls, Spanish errors, and empty-result feedback.
- Clear-wide behavior returning to original server-rendered page products.

Story 2 reuses these routes and feedback patterns but replaces client-only wide state
with server-derived URL state.

### Current Testing Baseline

- Jest and Testing Library are configured under root `__tests__/`.
- Route validators and all catalog routes have boundary tests.
- `Home.test.tsx` covers base `router.push`, category page 2, and the current five-page
  fixture.
- Search hook tests cover loading, success, empty results, errors, and reset.
- Canonical rules live in `docs/UNIT_TESTING_GUIDELINES.md`.

## Gap Analysis

### Implemented Or Reusable

- Strict digits-only page parsing exists.
- Product and filtered GraphQL calls use page size 50.
- Filter routes already accept unbounded positive pages.
- Client filter pagination already uses response length.
- Filter failures retain existing products and show accessible feedback.
- Base navigation already uses `router.push`, so URL history is the correct foundation.

### Remaining Work

1. `src/app/page.tsx` clamps pages to `1..5` instead of deriving seven pages from the
   known temporary total.
2. `PRODUCT_PAGE_MAX = 5` rejects `/api/catalog/products?page=6`.
3. `Home` accepts `totalPages` but receives the wrong hardcoded value (5).
4. No `src/app/loading.tsx` exists for base route transitions.
5. Wide mode/value/page exist only in client state and disappear on reload/history.
6. Direct empty pages render generic catalog emptiness and misleading pagination.
7. Exact multiples of 50 can enable one speculative empty Next request.
8. Base server fetch failures have no catalog-specific recovery state.

## Technical Research

### URL Contract

Use one canonical query model:

- Base catalog: `/?page=2`.
- Name mode: `/?mode=name&q=llave&page=2`.
- Category mode: `/?mode=category&category=Tubes&page=2`.
- Brand mode: `/?mode=brand&brand=Acme&page=2`.
- End notice after speculative Next: same populated URL plus `notice=end`.

Rules:

- Missing mode means base catalog.
- Changing mode/value resets page to 1.
- Local visible-result filters never enter the URL.
- Clear-wide navigation removes mode/value/notice while preserving the current base
  page when that is the intended return target.
- Pagination uses `router.push` so each committed page/filter selection creates a
  history entry. Text editing inside the drawer does not update the URL.
- Unknown mode or missing/invalid mode value canonicalizes to base page 1.
- Category and brand URL values are decoded names, not `customId` values.

Server URL state performs one matching fetch. It does not fetch default products and
then refetch filtered products in the browser.

### Server Page Orchestration

Affected source: `src/app/page.tsx`.

Expand `searchParams` to include page, mode, q, category, brand, and notice. Derive
`totalPages = Math.ceil(KNOWN_PRODUCT_TOTAL / PRODUCT_PAGE_SIZE)` for base mode and
validate base page against that computed range. Select exactly one adapter:

- Base: `fetchProducts(page)`.
- Name: `fetchProductsByName(q, page)` after the same validation contract as the API.
- Category: validate the decoded category name, then
  `fetchProductsByCategory(categoryName, page)` using `category.name.contains`.
- Brand: validate the decoded brand name, then
  `fetchProductsByBrand(brandName, page)` using `brand.name.contains`.

Fetch categories, brands, and theme in parallel where dependencies allow. Do not call
the internal HTTP API from the server component; preserve the existing direct server
adapter pattern.

Pass Home a server-derived initial catalog state:

- Products.
- Current mode/value/page.
- Base `totalPages` (currently seven) and current page.
- Filtered `hasPrevious = page > 1` and `hasNext = products.length === 50` until
  filtered totals are available.
- Optional initial end/error/status feedback.

Keep numbered base pagination because a confirmed temporary total exists. Isolate the
total in one named constant so future Strapi metadata replaces the source, not the UI
contract.

### Shared Page Validation

Affected source:

- `src/shared/constants/catalog.constants.ts`.
- `src/app/api/catalog/_utils.ts`.
- `src/app/page.tsx` or a small shared pure parser if both callers use it directly.

Replace `PRODUCT_PAGE_MAX = 5` with a maximum computed from the known total and fixed
page size. Preserve digits-only parsing and page size 50. When Strapi metadata lands,
the products route should consume that metadata instead of a compile-time total.

Do not introduce a general query parser framework. Reuse one tiny positive-page parser
only if it removes real duplication between route and server page; otherwise keep the
two validation sites explicit and tested at their public seams.

Update tests that currently assert page 6 is invalid. Pages 6 and 7 forward to the
adapter; page 8, malformed, and nonpositive values return `CAT_VAL_001`.

### Base Pagination UI

Affected source: `src/features/Home/Home.tsx`.

Keep numbered pagination for base mode and render pages 1-7 from the computed total.
This gives users a clear sense of catalog size. Wide modes keep Previous/current/Next
until Strapi returns totals for each filtered query. Every control navigates canonical
URLs that preserve mode and selected value; the server response updates Home props,
making the URL the source of truth rather than maintaining a parallel client page.

The existing `catalogPage`, selected wide values, and imperative page-fetch branches
can be removed or reduced where server props replace them. Keep local filters and
drawer input state client-side.

### Wide Search Selection

Story 1c currently fetches category/brand/name results imperatively and sends taxonomy
`customId` values. Story 2 should navigate to canonical mode URLs after validated
selection/submission, use category/brand names end-to-end, and let the server fetch the
matching result once.

This changes state ownership, not the visible search model:

- Name/category/brand remain mutually exclusive.
- Drawer closes on committed navigation.
- Local filters reset when new server products arrive.
- `Limpiar búsqueda` navigates back to the canonical base URL.
- API routes remain available for other client consumers but Home no longer needs to
  double-fetch wide page navigation.

Use `startTransition` around committed router navigation if it exposes reliable pending
state with the current App Router path. Do not mirror server results in a new cache or
state library.

### Category And Brand Name Contract

Category and brand search changes from `customId` to taxonomy names end-to-end:

- Public params become `category` and `brand` rather than `categoryId`/`brandId`.
- Dropdown callbacks pass the displayed taxonomy name.
- Route validation accepts decoded, trimmed names with the same safe search-character
  policy used for user-facing catalog terms.
- Taxonomy existence checks use name `contains`, not exact custom-id matching.
- GraphQL variables use `category.name.contains` and `brand.name.contains`.
- Multiple taxonomy names may match one partial term; this is approved behavior.
- URL generation always uses `encodeURIComponent(name)`.

Update `fetchProductsByCategory` and `fetchProductsByBrand` parameter names/types,
GraphQL query filters, category/brand routes, Home selection state, and all affected
tests. Keep `TaxonomyItem.customId` in the taxonomy response for compatibility, but do
not use it for catalog-wide product filtering.

### Loading Feedback

Add `src/app/loading.tsx` with a minimal accessible `role="status"` and Spanish loading
copy. It is the route-segment fallback for direct base and URL-backed wide transitions.

Home should also:

- Disable Previous/Next and wide-search commit controls while navigation is pending.
- Preserve the current populated list until the next server payload commits.
- Avoid duplicate router pushes.
- Keep existing drawer loading only for client-side validation/work that remains; do
  not show two competing loading messages for the same server navigation.

No skeleton is required. The selected contract is accessible route status plus disabled
controls.

### Empty And Invalid Page Policy

#### Malformed Or Nonpositive Direct Page

Redirect canonically to `/?page=1`. Do not silently render page 1 under a malformed URL.

#### Arbitrary Valid But Empty Direct Page

Examples: `?page=999` or a filtered mode URL with no results at its requested page.
Redirect to the corresponding mode's page 1. This avoids long `N-1` redirect chains.

Page 1 with no products is a valid empty result:

- Base: `No hay productos disponibles.`.
- Wide mode: existing catalog empty feedback.

#### Speculative Next From A Populated Page

Response length 50 means another page may exist, not that it does. Exact multiples of
50 can produce an empty next page. Because navigation came from a known populated page,
redirect back to that page with `notice=end`, disable Next for that rendered state, and
show `No hay más resultados.`.

The notice query makes feedback reproducible after the redirect. A subsequent mode or
page change removes it.

### Browser History

Committed mode and page changes use `push`, so Back restores the prior canonical URL
and the server fetches that exact state once. Reload and copied links behave identically.

Do not attempt to preserve product arrays in History API state. That would not survive
reload, creates dual state with Next routing, and complicates cache invalidation.

### Failure Handling

Client wide fetch failures from Story 1c become less central once server URL state owns
fetches. Add a route-level catalog error boundary only if the page currently lacks a
controlled failure surface:

- `src/app/error.tsx` or a narrower segment boundary.
- Spanish error copy.
- Retry action using Next's error reset behavior.
- No raw Apollo/Strapi details.

Keep API route error envelopes unchanged. Do not convert server adapter failures into
successful empty arrays.

### Result Range Copy

Base numbered pagination already communicates the known seven-page range. Do not add
item ranges or claim filtered totals because the temporary count applies only to the
full catalog. When Strapi exposes totals, use the same numbered UI for filtered modes.

## Test Research

### Validator And Route Tests

Update:

- `__tests__/catalog/_utils.test.ts`: pages 6/7 accepted; page 8 and malformed/nonpositive
  values rejected.
- `__tests__/catalog/products/route.test.ts`: pages 6/7 forward; page size remains 50.
- Category/brand route and adapter tests: names replace IDs and GraphQL variables use
  `name.contains`.

Do not duplicate wide-page tests already proving unbounded positive behavior.

### Home Tests

Update `__tests__/home/Home.test.tsx` for the new prop/state model:

- Base mode renders numbered pages 1-7 from the known total.
- Page 1 and page 7 expose correct active/disabled navigation semantics.
- Selecting page 6/7 generates the expected base URL.
- Name/category/brand URLs preserve mode/value and page.
- Category/brand URLs contain encoded names, not custom IDs.
- Pending transition exposes status/disabled controls if testable without mocking
  internal components.
- Clearing wide mode navigates to canonical base URL.
- `notice=end` renders `No hay más resultados` and disables Next.

Use a test-local `next/navigation` mock with `push: jest.fn()` as already established.
Do not test browser internals; assert generated navigation URLs and server-derived prop
rendering.

### Search State Tests

Update `__tests__/home/useCatalogSearch.test.tsx` only where URL navigation changes the
hook's responsibilities. Preserve input trimming, validation, and message tests. Remove
tests for imperative data ownership only if production no longer owns that behavior.

### Loading And Error Components

- Test `src/app/loading.tsx` by its accessible status if it contains behavior worth
  protecting.
- Test an error boundary through its Spanish message and retry action without mocking
  internal UI.

Do not render async `src/app/page.tsx` directly with Testing Library. Extract only pure
URL parsing/normalization logic that needs direct unit coverage. Full direct-navigation,
reload, and browser-history behavior remains an E2E gap after this story.

## Affected Files

### Expected Source Changes

- `src/app/page.tsx`.
- `src/app/loading.tsx` (new).
- `src/app/error.tsx` or narrower catalog error boundary (new if needed).
- `src/features/Home/Home.tsx`.
- `src/features/Home/useCatalogSearch.ts`.
- `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx` only if commit/loading
  props change.
- `src/shared/constants/catalog.constants.ts`.
- `src/app/api/catalog/_utils.ts`.
- `src/app/api/catalog/category/route.ts`.
- `src/app/api/catalog/brand/route.ts`.
- `src/shared/lib/global.lib.ts`.
- `src/shared/queries/global.queries.ts`.
- `src/shared/types/global.types.ts` for explicit URL/initial-mode props if useful.

### Expected Test Changes

- `__tests__/catalog/_utils.test.ts`.
- `__tests__/catalog/products/route.test.ts`.
- `__tests__/catalog/category/route.test.ts`.
- `__tests__/catalog/brand/route.test.ts`.
- `__tests__/shared/global.lib.test.ts`.
- `__tests__/home/Home.test.tsx`.
- `__tests__/home/useCatalogSearch.test.tsx`.
- Focused loading/error/parser tests only where new behavior warrants them.

### Documentation

- Update `REPO_CONTEXT.md` to remove the five-page invariant and document canonical
  mode URLs, response-length pagination, redirect policy, and route loading/error UI.
- Update `AGENTS.md` to remove the known five-page constraint.
- Do not rewrite Story 1b/1c historical research; this story supersedes only their
  client-only pagination assumptions.

## Verification

- Run targeted changed tests with `pnpm test -- <relative path>`.
- Run `pnpm test` for the full suite and coverage.
- Run `pnpm lint`.
- Run `pnpm exec tsc --noEmit`.
- Run `pnpm build` because server routing, redirects, loading/error boundaries, and
  client navigation change.
- Manually verify direct URLs, reload, Back/Forward, page 6/7, malformed URLs, empty
  URLs, wide mode URLs, loading feedback, and speculative end behavior on desktop and
  mobile.
- Do not run `pnpm install`; no dependency changes are required.

## Edge Cases And Constraints

- Page size remains exactly 50.
- A 50-item filtered response means another page may exist; it does not prove one
  exists. Base mode uses the known total instead.
- The current 333-product catalog yields six full pages and a 33-item seventh page, but
  code derives seven from a named temporary total and page-size constant.
- Empty page 1 is valid; empty page N>1 canonicalizes according to navigation origin.
- Local filters are intentionally not shareable or history-backed.
- Unknown/missing wide mode values canonicalize to base page 1.
- Category/brand URL values and GraphQL filters use names with `contains` matching.
- No filtered total count, prefetching, cache layer, or new state library.
- Prefetch remains deferred until performance data justifies it.
- Server component integration cannot be fully proven by Jest; manual/E2E verification
  remains necessary.

## Open Questions

None.

## Answered Questions

### Scope

I: Question: Quick or full research?
Status: answered
Answer: Full template.

II: Question: Should catalog-wide modes be URL-backed?
Status: answered
Answer: Yes. The server reads mode/value/page and performs one matching fetch, so reload
does not fetch the default catalog first.

### Invalid And Empty Pages

I: Question: How should malformed/nonpositive pages behave?
Status: answered
Answer: Redirect canonically to base page 1.

II: Question: How should arbitrary valid-but-empty direct pages behave?
Status: answered
Answer: Redirect to the corresponding mode's page 1; base URLs redirect to `/?page=1`.

III: Question: How should a speculative empty Next request recover?
Status: answered
Answer: Return to the known populated previous page, disable Next, and show
`No hay más resultados`.

### Loading

I: Question: What loading presentation is required?
Status: answered
Answer: Accessible route-segment status plus disabled navigation/filter commit controls;
no skeleton required.

### Numbered Pagination

I: Question: Should users see the known number of base catalog pages?
Status: answered
Answer: Yes. Store the confirmed temporary total of 333 products in one named constant
and compute seven pages with `Math.ceil(total / 50)`. Replace only the total source when
Strapi pagination metadata becomes available.

### Category And Brand Search

I: Question: Should public URLs and backend filters use taxonomy IDs or names?
Status: answered
Answer: Names end-to-end. URLs, route parameters, server adapter arguments, and GraphQL
filters use category/brand names.

II: Question: How should taxonomy names match?
Status: answered
Answer: Use `contains`, allowing one partial name to match multiple taxonomy entries.

## Assumptions

- Story 1b and Story 1c are implemented baselines.
- Current product adapters can fetch pages 6/7 once the computed ceiling replaces 5.
- Category/brand routes, adapters, and GraphQL documents must migrate from `customId`
  to name `contains`; this is part of Story 2, not an existing capability.
- `router.push` is used for committed state so browser history records it.
- The `notice=end` query parameter is acceptable as reproducible UI state.
- A route error boundary is included only if no existing boundary handles base fetch
  failures with Spanish recovery UI.
- The known full-catalog total is 333 during implementation. Filtered totals and live
  Strapi pagination metadata remain unavailable.

## Research Outcome

Story 2 is ready for planning. Most filter loading, error feedback, and response-length
logic already exists from Story 1c. Remaining work is to remove the three five-page
assumptions, derive seven numbered base pages from the known 333-product total, move all
committed catalog modes into a single server URL contract, migrate category/brand
search from custom IDs to name `contains`, add route loading/error recovery, and handle
direct or speculative empty pages without showing a misleading catalog state.
