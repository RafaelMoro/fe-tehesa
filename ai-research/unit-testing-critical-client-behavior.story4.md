# Story 4 Research: Protect Critical Client Behavior

## Research Mode

- Mode: full research.
- Scope: single client-behavior story across catalog, variants, theme, and viewport logic.
- Parent epic: `ai-research/unit-testing.epic.md`.
- Prerequisites: Stories 1, 2, and 3 are implemented successfully.
- Canonical policy: `docs/UNIT_TESTING_GUIDELINES.md`.
- Research date: 2026-07-12.

## Story Definition

### Title

Protect critical client behavior with integration-focused tests.

### Description

Add user-focused Jest and Testing Library coverage for local catalog filtering,
catalog-wide modes, search state, pagination, product details, variants, theme changes,
Zustand state, zero-value product data, and viewport detection. Render real internal
components and mock only browser/router/network/theme boundaries.

The story also adds the smallest user-visible states required for meaningful tests:
inline catalog feedback, accessible variant loading/empty/error feedback, visible zero
values, and an accessible theme-toggle name. Responsive coverage targets the existing
`useMediaQuery` contract because ProductCard's viewport differences are currently
styling-only and styling assertions are prohibited.

### Acceptance Criteria

1. Catalog tests cover stacked local filters, local clearing, catalog-wide mode
   replacement, visible failures/empty results, normal and wide pagination, and opening
   product details through the real Home component tree.
2. Catalog search tests cover trimming, whitespace validation, loading, success, empty
   results, mapped errors, input reset, mode changes, pagination, and products-prop reset.
3. Variant drawer tests cover closed/open fetch behavior, loading, empty results,
   visible failure, ascending numeric price order, formatting, cleanup, and refetch.
4. Theme tests cover store initialization/update and best-effort persistence-driven
   transitions through an accessible toggle.
5. ProductCard zero values remain visible, and `useMediaQuery` tests document all
   viewport query outputs without class or layout assertions.

## Task Breakdown

### Phase 1: Catalog Feedback and Home Integration

- Add one shared page-level catalog feedback state in `Home`.
- Surface category/brand failures and empty name results in an accessible inline region.
- Test local filters, wide modes, pagination, and product detail opening.

### Phase 2: Catalog Search State

- Test `useCatalogSearch` directly for request/state transitions that do not require
  repeating the entire Home component tree.
- Keep Home integration coverage for drawer controls and applied results.

### Phase 3: Variants and Product Data

- Add loading, empty, and error states to `ProductVariantsDrawer`.
- Test sorting/formatting and close/reopen cleanup.
- Fix and test ProductCard zero values.

### Phase 4: Theme and Viewport

- Test the vanilla Zustand store.
- Add an accessible name to `ToggleDarkMode` and test both theme directions.
- Test `useMediaQuery` query results with a local `matchMedia` override.

## Technical Research

### Current Test Baseline

Stories 1-3 provide Jest, the canonical guide, route/adapter tests, preference
validation, and catalog client tests. Existing UI coverage only exercises the
controlled `SearchInput`; no tests cover Home, drawers, ProductCard, theme UI, Zustand,
router navigation, or viewport branches.

All new tests belong under root `__tests__/` and use `@__tests__/test-utils` for
component rendering and `userEvent`. No dependencies, global setup, Jest config, or CI
changes are needed.

### Home State Ownership

Affected source: `src/features/Home/Home.tsx`.

Home owns:

- Current working products in `allProducts.current`.
- Rendered products in `filteredProducts`.
- Stacked local name/category/brand filters.
- Catalog-wide category/brand selection and loading.
- Wide-result page and next-page heuristic.
- Selected product and variants-drawer state.
- Router pagination and smooth scrolling.

`useCatalogSearch` owns name-search input, drawer, mode, message, invalid state, and
loading. Tests should respect that boundary rather than asserting internal React state.

### Local Filter Contract

- Name matching is trimmed, case-insensitive substring matching.
- Category/brand IDs resolve through supplied taxonomies and compare product names.
- Name, category, and brand filters stack; selecting one preserves the others.
- `Limpiar filtros` clears only local filters and restores the current working set.
- A local no-match state offers both `Buscar en todo el catálogo` and
  `Limpiar filtros` recovery actions.
- New `products` props reset local/wide filters and restore the server-provided set.

Test these through the real SearchInput, dropdowns, ProductListing, and ProductCard.
Do not mock internal controls. HeroUI dropdown items may portal; query with global
`screen` by role/name after opening each trigger.

### Catalog-Wide Mode Contract

- Category success replaces the working/rendered set, clears local filters and brand,
  closes the search drawer, and activates category mode.
- Brand success does the symmetric operation.
- Name success replaces products and clears category/brand/local filters.
- Only one catalog-wide mode is active.
- Wide pagination replaces normal numbered pagination.
- `Siguiente` is enabled only when exactly 50 products are returned.
- `Anterior` is disabled on page 1.
- Wide page requests reuse the active name/category/brand parameter with the new page.
- `Limpiar búsqueda` restores the original page products and normal pagination.

The 50-item next-page heuristic remains an established constraint because Strapi
pagination metadata is unavailable.

### Visible Catalog Feedback

Current category/brand failures are console-only. Empty name search stores a message
but closes the drawer, leaving it invisible. Add one shared page-level feedback value
in Home and render it near the catalog-wide controls.

Required behavior:

- Use accessible status semantics for empty results and `role="alert"` for failures.
- Category/brand codes use real `catalogErrorToSpanish` copy.
- Unknown failures use one generic Spanish catalog message.
- Empty name success displays `No encontramos productos en el catálogo.`.
- Clear stale feedback when starting a new request, succeeding with results, editing or
  clearing search, changing catalog mode, or receiving new `products` props.
- A failed category/brand request leaves the current products and active mode unchanged.

Use one state/render path for category, brand, and name feedback; do not add separate
components or duplicate error states.

### Home Test Matrix

Test file: `__tests__/home/Home.test.tsx`.

Use the real Home subtree. Mock only `next/navigation` with a stable `push` Jest mock,
global `fetch`, and local `window.scrollTo` for pagination.

Minimal stateful scenarios:

1. Stack local name/category/brand filters, verify the intersected products, then clear
   and restore the original set.
2. Reach local no-match state and open the real catalog search drawer through its
   recovery button.
3. Apply category then brand wide results; verify endpoint arguments, product
   replacement, local reset, and mutual exclusivity.
4. Reject category and brand requests; verify translated accessible inline alerts and
   unchanged products.
5. Normal pagination calls `push("/?page=2")` and smooth `scrollTo`.
6. A 50-item wide result enables next; page 2 reuses the active mode parameter and
   updates the visible page number.
7. Click `Ver detalles`; verify the real variants drawer opens and requests the selected
   product document ID.

Combine transitions where they share setup; do not create one test per setter.

### Catalog Search Hook

Affected source: `src/features/Home/useCatalogSearch.ts`.

Test file: `__tests__/home/useCatalogSearch.test.tsx`.

Use Testing Library's real hook rendering and real HeroUI overlay state. Mock global
`fetch` through the existing `fetchCatalog` boundary behavior; do not mock the hook.

Cover:

- Whitespace input trims to empty, performs no request, and sets invalid state with
  `Ingresa un texto para buscar en el catálogo.`.
- Editing clears invalid/message state.
- A deferred request sets loading and `Buscando productos en el catálogo...`.
- Success trims/encodes the term, forwards page, sets name mode, closes the drawer,
  and returns products.
- Empty success retains the empty-result message for Home to surface inline.
- `CAT_VAL_006` maps to invalid field state and the specific validation message.
- Other known codes map through `catalogErrorToSpanish`; untyped failures use the
  generic search copy.
- `beginCatalogMode` clears name state and closes the drawer.
- `clearAllCatalogState` and changed `products` props reset state.

The CatalogSearchDrawer currently always renders generic FieldError copy. Align it
with the hook's actual validation message or expose the message prop in the field so
whitespace and server validation feedback remain specific and testable.

### Product Variants Drawer

Affected source: `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`.

Test file: `__tests__/product-variants/ProductVariantsDrawer.test.tsx`.

Add explicit request state:

- Closed: no request.
- Open/pending: accessible loading status.
- Successful empty data: visible Spanish empty message.
- Failure: visible Spanish alert using `catalogErrorToSpanish` or generic fallback.
- Successful data: table with rows sorted by numeric price ascending and formatted by
  the existing USD `formatNumberToCurrency` utility.

Both close buttons currently perform identical cleanup. Test one close path to avoid
redundancy: close, reopen, verify old rows are absent while the second request is
pending, and verify a new request occurs. Do not inspect private state.

Prevent stale in-flight work from replacing state after close or product change using
the smallest effect cleanup guard. Do not add cancellation infrastructure unless the
native fetch boundary later accepts an AbortSignal.

### ProductCard Zero Values

Affected source: `src/components/ProductCard.tsx`.

Test file: `__tests__/product-listing/ProductCard.test.tsx`.

Current truthiness checks hide `variantCount === 0`, `minPrice === 0`, and
`maxPrice === 0`. Replace them with explicit null/undefined checks. Assert zero count
and `$0.00` range remain visible. Preserve USD formatting; changing currency is not
part of this story.

Do not duplicate normal card rendering or detail-click behavior already exercised by
Home. Do not test ProductCard responsive classes.

### Viewport Hook

Affected source: `src/shared/hooks/useMediaQuery.tsx`.

Test file: `__tests__/shared/useMediaQuery.test.tsx`.

The hook synchronously reads four media queries and intentionally does not subscribe to
resize events. Test returned booleans for:

- Missing/unavailable `matchMedia` fallback: all false.
- Mobile query match.
- Mobile/tablet query match.
- Desktop query match.
- Desktop X2 query match.

Override `window.matchMedia` locally with a typed implementation keyed by query string
and restore it after each test. Do not alter the hook to react to viewport changes and
do not assert ProductCard CSS classes. ProductCard-specific responsive output remains
deferred until mobile and desktop render semantically different content.

### Theme Store

Affected source: `src/zustand/store/change-theme.store.ts`.

Test file: `__tests__/theme/change-theme.store.test.ts`.

Test the public vanilla store API only:

- Default state is light.
- Custom initial state is honored.
- `updateTheme("dark")` replaces the theme.

Provider isolation is not required because no client currently consumes the Zustand
theme store. Do not add a provider integration test merely for coverage. The inaccurate
provider error text is outside this story unless a provider test is later required.

### Theme Toggle

Affected source:

- `src/shared/ui/atoms/ToggleDarkMode.tsx`.
- `src/shared/utils/global.utils.ts` only if typing needs alignment with `AppTheme`.

Test file: `__tests__/theme/ToggleDarkMode.test.tsx`.

Add a dynamic accessible name such as `Activar modo oscuro` when light and
`Activar modo claro` otherwise. Mock `next-themes` for deterministic `theme` and
`setTheme`; mock global fetch for the preference request. Keep the component real.

Best-effort persistence is authoritative:

- Light posts dark, awaits the persistence attempt, then calls `setTheme("dark")`.
- Dark posts light, then calls `setTheme("light")`.
- A non-OK response still changes the visible theme.
- A rejected request is caught by `saveThemeApi`; the toggle still changes theme.

Test both directions table-driven and one persistence-failure path. Do not retest the
preference route's body validation from Story 3.

`Header` logo precedence is outside Story 4 acceptance criteria and receives no test or
source change here.

### Mock and Accessibility Policy

Mock only:

- Global `fetch` for catalog and preference requests.
- `next/navigation` for Home router calls.
- `next-themes` for deterministic ToggleDarkMode tests.
- Local browser APIs (`scrollTo`, possibly ResizeObserver/pointer capture) only when a
  real HeroUI path requires them.

Keep real Home, useCatalogSearch, ProductListing, dropdowns, drawers, ProductCard,
formatters, catalog utilities, HeroUI, and Remix icons. Do not mock internal components
or `next/image`. Use roles, labels, names, text, alerts, and statuses; do not assert
classes or direct DOM selectors.

## Affected Files

### Add Tests

- `__tests__/home/Home.test.tsx`.
- `__tests__/home/useCatalogSearch.test.tsx`.
- `__tests__/product-variants/ProductVariantsDrawer.test.tsx`.
- `__tests__/product-listing/ProductCard.test.tsx`.
- `__tests__/shared/useMediaQuery.test.tsx`.
- `__tests__/theme/change-theme.store.test.ts`.
- `__tests__/theme/ToggleDarkMode.test.tsx`.

### Modify Source

- `src/features/Home/Home.tsx` for shared accessible catalog feedback.
- `src/features/Home/useCatalogSearch.ts` only as needed to expose/clear feedback
  consistently.
- `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx` for specific field errors.
- `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` for request states and
  stale-effect cleanup.
- `src/components/ProductCard.tsx` for explicit zero-value handling.
- `src/shared/ui/atoms/ToggleDarkMode.tsx` for accessible naming.
- `src/shared/utils/global.utils.ts` only if `saveThemeApi` input typing is narrowed to
  `AppTheme`; preserve best-effort semantics.

### Documentation

- Update `REPO_CONTEXT.md` after implementation with the shared catalog feedback and
  visible variants-state behavior if broadly useful.
- Correct any stale statements discovered in touched context sections, but do not
  rewrite historical research.
- No testing-guide changes are required.

## Verification

- Run each new file with `pnpm test -- <relative path>` while iterating.
- Run grouped Home/catalog client tests after integrated changes.
- Run `pnpm test` for the complete suite and coverage.
- Run `pnpm lint`.
- Run `pnpm exec tsc --noEmit` because source signatures/state change.
- Run `pnpm build` because client production behavior changes.
- Use no real Strapi calls; mocked catalog envelopes match Story 3 contracts.
- Do not run `pnpm install`; no dependencies change.

## Edge Cases and Constraints

- Empty wide results are successful outcomes, not errors.
- Failed category/brand requests preserve current products and mode.
- Exactly 50 products remains the only next-page signal.
- HeroUI overlays portal; use global `screen` and semantic queries.
- Duplicate button names may require scoping with `within` on an accessible dialog.
- Add browser shims locally only after a real test demonstrates need.
- Closing a variants drawer must prevent stale results from becoming visible.
- Zero is valid product data and must not be treated as absent.
- Currency remains USD.
- `useMediaQuery` is a synchronous snapshot, not a live resize subscription.
- Theme persistence is best-effort; UI changes after success, non-OK response, or
  caught network failure.
- No TanStack Query provider, internal component mock, or style assertion is allowed.
- Preserve existing skipped tests; none currently exist in this surface.

## Open Questions

None.

## Answered Questions

### Scope

I: Question: Quick or full research?
Status: answered
Answer: Full template.

II: Question: Include ProductCard zero values and responsive coverage?
Status: answered
Answer: Include both. Test zero values in ProductCard and viewport booleans in
`useMediaQuery`; defer ProductCard-specific responsive assertions while its output
differs only through CSS.

III: Question: Where should category/brand failures appear?
Status: answered
Answer: In an accessible inline alert near catalog-wide controls.

### Client Feedback

I: Question: Where should empty catalog-name results appear?
Status: answered
Answer: Close the drawer and show an accessible inline page status.

II: Question: Should variants expose request states?
Status: answered
Answer: Yes. Add accessible loading, empty, and error states.

### Theme

I: Question: What happens when persistence fails or returns non-OK?
Status: answered
Answer: Theme persistence is best-effort; the visible theme still changes after the
persistence attempt.

## Assumptions

- Stories 1-3 and `docs/UNIT_TESTING_GUIDELINES.md` are the current source of truth.
- Home integration plus focused hook tests is less brittle than duplicating every
  search transition through HeroUI drawers.
- Inline catalog feedback uses one shared state/path rather than separate error widgets.
- Existing USD formatting is authoritative for this story.
- Header theme-logo precedence and Zustand provider isolation are deferred because they
  are outside the acceptance criteria and unused in the critical path.
- No package, Jest, setup, CI, route, or server-adapter changes are required.

## Research Outcome

Story 4 is ready for planning. Seven focused test files cover the critical client path
without mocking internal components. Small source changes make failures, empty results,
variant request states, zero values, and theme controls observable through accessible
behavior. All contract questions are resolved; ProductCard responsive styling remains
untested by design, while the underlying viewport hook receives explicit coverage.
