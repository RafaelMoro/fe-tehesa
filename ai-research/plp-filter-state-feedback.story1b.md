# Research: Improve PLP Filter State And Feedback

## Story Definition

### Story Title

Improve PLP Filter State And Feedback

### Source

- Parent epic: `ai-research/plp-functionality-seo.epic.md`
- Split from: `ai-research/plp-search-filtering.story-1.md`
- Follows Story 1a research/planning:
  - `ai-research/plp-catalog-api.story1a.md`
  - `ai-planning/planning-plp-catalog-api.story1a.md`
- Scope decision: Story 1b, UI filter-state and feedback only.

### Story Description

Make the current PLP filter flow understandable and resilient without adding catalog-wide search. Users should see which local/category/brand filters are active, understand empty states, see loading/failure feedback, and clear filters without losing the current catalog context unexpectedly.

This story uses the Story 1a API contract for client-side product reads. It does not create new API routes, does not add catalog-wide product-name search, and does not change pagination metadata behavior.

### Acceptance Criteria

1. Users can see active category, brand, and local visible-result filter state.
2. Users can clear active filters and return to the current page's default product list without unexpected route changes.
3. Empty filter results render Spanish user-facing copy instead of `No products available`.
4. Category and brand filters remain mutually exclusive: selecting one clears the other.
5. Category and brand loading states are visible in the UI while requests are in flight.
6. Category and brand failure states render Spanish user-facing copy mapped from Story 1a `CAT_*` API errors; raw Apollo/Strapi/API fallback text is not shown to users.
7. Local visible-result filtering remains client-side and filters the current working set only.

### Task Breakdown

1. Represent active filter state clearly in `src/features/Home/Home.tsx` and related ProductListing controls.
2. Preserve the current mutually exclusive category/brand model.
3. Keep local visible-result filtering separate from server-backed category/brand fetches.
4. Add Spanish empty/loading/error states for the current filter flow.
5. Use the Story 1a API envelopes and `CAT_*` codes for client-side error handling.
6. Keep catalog-wide product-name search out of this story.

### Scope Assessment

- Classification: single UI behavior story.
- In scope: current PLP filter state, category/brand fetch feedback, local visible-results filter copy, clear-filter behavior, Spanish user-facing states, client-side API error mapping.
- Out of scope: catalog-wide product search, name-search API route, search-result pagination, URL-synced filters, dynamic replacement of hardcoded dropdown options, product card redesign, variants drawer behavior, backend schema changes, new dependencies, test framework setup.

### Dependency On Story 1a

Story 1b assumes Story 1a is implemented first or in the same release branch:

- Client components use `/api/catalog/category`, `/api/catalog/brand`, and existing initial server-rendered products.
- API responses use `{ success: true, data }` or `{ success: false, code, message }`.
- Errors expose stable `CAT_*` codes and do not expose Apollo/Strapi internals.
- `Home.tsx` no longer imports `fetchProductsByCategory` or `fetchProductsByBrand` directly after Story 1a.

If Story 1a is not implemented yet, Story 1b planning should include it as a prerequisite rather than reintroducing direct server-action imports.

## Technical Research

### Affected Areas

Routes/pages:

- `src/app/page.tsx` seeds initial products and current page into `Home`.
- Story 1b should leave `src/app/page.tsx` unchanged unless planning finds a narrow reason.

Feature UI:

- `src/features/Home/Home.tsx` is the main state owner for products, selected category, selected brand, loading flags, and clear behavior.
- `src/features/ProductListing/ProductListing.tsx` owns the grid empty fallback and currently renders `No products available`.
- `src/features/ProductListing/SearchInput.tsx` owns the current local input label and change handling.
- `src/features/ProductListing/DropdownCategories.tsx` and `DropdownBrands.tsx` show selected labels and trigger filter callbacks.

Shared code:

- Story 1a may add API envelope/client helpers. Reuse them if present.
- `src/shared/types/global.types.ts` currently contains hardcoded `CATEGORIES_PRODUCTS` and `BRANDS_PRODUCTS`; Story 1b does not remove or replace them.
- `src/shared/constants/` may contain Story 1a `CAT_*` constants and messages; Story 1b can map those codes to Spanish UI copy.

Tests:

- No test framework is configured.
- Use `pnpm lint` and `pnpm build` after implementation.
- Do not invent `pnpm test`.

### Current Behavior From Story 1

- `Home` stores the current working set in `allProducts.current`.
- `filteredProducts` is the visible product list.
- Local search filters `allProducts.current` in memory by product name.
- Category and brand filters replace `allProducts.current` and `filteredProducts`.
- Category and brand are already mutually exclusive.
- `clearFilters()` resets to the `products` prop for the current server-rendered page.
- Pagination hides while category or brand is active.
- Category/brand loading flags exist, but only disable `Limpiar filtros` today.
- Category/brand errors are logged and do not show user-facing copy.
- Empty product grids currently render English copy: `No products available`.

### Current Behavior After Story 1a

Story 1a planning migrates the client fetches:

- `Home.tsx` calls `/api/catalog/category?categoryId=...` for category fetches.
- `Home.tsx` calls `/api/catalog/brand?brandId=...` for brand fetches.
- API errors use `CAT_*` codes.
- Server-rendered initial products in `src/app/page.tsx` remain unchanged.

Story 1b should build on that instead of changing the data-access architecture again.

### Target Filter Model For Story 1b

- Default state: no category, no brand, no local visible-results filter; product list equals the current page's server-rendered products.
- Category active: category id selected, brand cleared, working set replaced by category products, pagination hidden.
- Brand active: brand id selected, category cleared, working set replaced by brand products, pagination hidden.
- Local visible filter active: local input narrows the current working set only.
- Clear filters: reset category, brand, local input, working set, and visible products back to the current page's server-rendered products.
- Catalog-wide search is not present in this story.

### UI Copy Needs

Existing Spanish copy is accent-light (`Catalogo`, `Categorias`). Preserve app style unless product explicitly requests a broader copy pass.

Suggested Story 1b copy can be finalized during planning:

- Empty default list: `No hay productos disponibles.`
- Empty local filter: `No encontramos productos en los resultados visibles.`
- Empty category: `No encontramos productos para esta categoria.`
- Empty brand: `No encontramos productos para esta marca.`
- Loading category: `Cargando productos de la categoria...`
- Loading brand: `Cargando productos de la marca...`
- Generic filter error: `No pudimos cargar los productos. Intentalo de nuevo.`
- Clear action remains `Limpiar filtros`.

### Error Handling With Story 1a Codes

- `CAT_VAL_003`: invalid category id.
- `CAT_VAL_004`: invalid brand id.
- `CAT_NF_001`: category not found.
- `CAT_NF_002`: brand not found.
- `CAT_ENV_001`: missing Strapi config.
- `CAT_ERR_001`: upstream catalog error.

Story 1b should map those codes to Spanish UI copy. It should not render raw `message` values from the API as user-facing copy.

### Existing Patterns To Follow

- Keep domain UI under `src/features/ProductListing/` and `src/features/Home/`.
- Keep cross-cutting API envelope parsing or error-code mapping under `src/shared/utils/` only if it is reused by more than one client component.
- Do not add Zustand state for filters.
- Do not add a data-fetching library.
- Use HeroUI components already in use, such as `Button`, `Dropdown`, and existing input primitives.
- Use Tailwind classes for layout and feedback states.
- Preserve current mutually exclusive category/brand behavior.

### Verification Rules To Follow Later

- Run `pnpm lint` after implementation.
- Run `pnpm build` after implementation because client/server boundaries and App Router API usage are involved.
- Run `pnpm exec tsc --noEmit` if planning adds or modifies shared API envelope types.
- Manually verify desktop and mobile behavior.
- Do not run `pnpm test`; no test script exists.

## Open Questions

### Catalog Behavior

I: Question: Should category and brand filters remain mutually exclusive for Story 1b?
Status: answered
Answer: Yes.
Context: Original Story 1 allowed current mutually exclusive behavior, and Story 1b keeps the simplest current model.

II: Question: Should local visible-results filtering clear category/brand selections, or narrow the active working set after category/brand fetches?
Status: answered
Answer: Narrow the active working set.
Context: Current behavior already filters `allProducts.current`, including category/brand results.
Explanation: This preserves current behavior and avoids inventing a new filter model.

III: Question: When users clear filters, where should they return?
Status: answered
Answer: Return to the current page's original server-rendered products.
Context: Current `clearFilters()` already uses the `products` prop for the current page.
Explanation: This avoids route changes and keeps Story 1b independent from pagination/search URL work.

IV: Question: Should active filter state be reflected in the URL in Story 1b?
Status: answered
Answer: No.
Context: URL sync was nice-to-have in the parent story.
Explanation: Keep URL-synced filters for a later story.

### UI And Product Decisions

I: Question: What exact Spanish copy should be used for empty/loading/error states?
Status: pending
Context: Suggested copy is included in this research doc.
Explanation: Planning can either use the suggested copy or ask product for final wording.

II: Question: Should loading indicators appear on the dropdown buttons, near the grid, or as a grid-level state?
Status: pending
Context: Existing loading flags live in `Home`.
Explanation: Minimal path is disabling relevant controls and rendering a small grid-level loading message.

III: Question: Should failed category/brand fetches preserve stale results or clear the grid?
Status: pending
Context: Current behavior leaves stale results and logs the error.
Explanation: Minimal safe default is to preserve stale results and show an error banner/message so users do not lose context.

IV: Question: Should Spanish accents be normalized in new copy?
Status: pending
Context: Existing app copy is Spanish but inconsistently accented.
Explanation: Avoid a broad copy cleanup in Story 1b unless product explicitly wants it.

### API Dependency

I: Question: Is Story 1a implemented before Story 1b?
Status: pending
Context: Story 1b expects category/brand client calls to go through `/api/catalog/*`.
Explanation: If Story 1a is not implemented, Story 1b should wait or be planned with Story 1a as Phase 0.

### Verification

I: Question: Should manual browser verification cover both mobile and desktop layouts?
Status: answered
Answer: Yes.
Context: ProductCard and current layout have mobile-aware behavior, and filter controls must remain usable on both sizes.

II: Question: Should implementation run `pnpm build`?
Status: answered
Answer: Yes.
Context: Story 1b touches client components that call App Router API routes.

## Assumptions Made

- Story 1a API routes and envelopes are available before Story 1b implementation.
- Story 1b does not add catalog-wide search.
- Story 1b does not change the hardcoded 5-page pagination ceiling.
- Story 1b does not replace hardcoded category/brand dropdown options.
- Story 1b does not modify the variants drawer.
- Category and brand filters remain mutually exclusive.
- Clear filters returns to the current page's original products.
- No new dependencies are needed.

## Research Outcome

- Story 1 should be split: Story 1b handles current filter state/feedback; Story 1c should handle catalog-wide search.
- Story 1b is scoped enough to plan and implement independently after Story 1a.
- Main implementation work is in `Home`, ProductListing controls, and empty/loading/error display.
- The biggest remaining decisions are copy placement/wording and stale-results behavior on failed fetches.
