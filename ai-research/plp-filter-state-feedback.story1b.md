# Research: Improve PLP Filter State And Feedback

## Story Definition

### Story Title

Improve PLP Local Filter State And Feedback

### Source

- Parent epic: `ai-research/plp-functionality-seo.epic.md`
- Split from: `ai-research/plp-search-filtering.story-1.md`
- Follows implemented Story 1a research/planning:
  - `ai-research/plp-catalog-api.story1a.md`
  - `ai-planning/planning-plp-catalog-api.story1a.md`
- Scope decision: Story 1b, local visible-results filter-state and feedback only.

### Story Description

Make the current local visible-results filter flow understandable and resilient without adding catalog-wide search. Users should see when they are filtering already-loaded products, understand empty states, and clear the local filter without losing the current catalog context unexpectedly.

The existing category and brand dropdowns currently perform catalog-wide searches through the Story 1a API. Story 1b leaves those dropdowns in place and does not redesign, relocate, or relabel them as local filters. Story 1c will move the catalog-wide category, brand, and product-name search UI into a drawer.

### Acceptance Criteria

1. Users can see when the local visible-results filter is active.
2. Users can clear the local visible-results filter without resetting catalog-wide category/brand results unexpectedly.
3. Empty local filter results render Spanish user-facing copy instead of `No products available`.
4. Local visible-result filtering remains client-side and filters the current working set only.
5. Existing category and brand dropdowns remain in place and keep their current catalog-wide search behavior until Story 1c moves them into the wide-search drawer.

### Task Breakdown

1. Represent active local visible-results filter state clearly in `src/features/Home/Home.tsx` and related ProductListing controls.
2. Keep local visible-result filtering separate from the existing server-backed category/brand catalog-wide search dropdowns.
3. Add Spanish empty copy for local visible-results filtering.
4. Preserve existing category/brand dropdown placement and behavior for now.
5. Keep catalog-wide product-name/category/brand search drawer work out of this story.

### Scope Assessment

- Classification: single local-filter UI behavior story.
- In scope: local visible-results filter state, local empty copy, clear-local-filter behavior, preserving current category/brand dropdown behavior.
- Out of scope: catalog-wide product search, category/brand wide-search redesign, moving dropdowns into a drawer, name-search API route, search-result pagination, URL-synced filters, dynamic replacement of hardcoded dropdown options, product card redesign, variants drawer behavior, backend schema changes, new dependencies, test framework setup.

### Dependency On Story 1a

Story 1b assumes Story 1a is already implemented:

- Existing category and brand dropdowns use `/api/catalog/category` and `/api/catalog/brand` for catalog-wide searches.
- API responses use `{ success: true, data }` or `{ success: false, code, message }`.
- Errors expose stable `CAT_*` codes and do not expose Apollo/Strapi internals.
- `Home.tsx` no longer imports `fetchProductsByCategory` or `fetchProductsByBrand` directly after Story 1a.

Do not reintroduce direct server-action imports in Story 1b. Do not move category/brand dropdowns yet; Story 1c owns that drawer redesign.

## Technical Research

### Affected Areas

Routes/pages:

- `src/app/page.tsx` seeds initial products and current page into `Home`.
- Story 1b should leave `src/app/page.tsx` unchanged unless planning finds a narrow reason.

Feature UI:

- `src/features/Home/Home.tsx` is the main state owner for products, local filter state, selected category, selected brand, loading flags, and clear behavior.
- `src/features/ProductListing/ProductListing.tsx` owns the grid empty fallback and currently renders `No products available`.
- `src/features/ProductListing/SearchInput.tsx` owns the current local input label and change handling.
- `src/features/ProductListing/DropdownCategories.tsx` and `DropdownBrands.tsx` show selected labels and trigger filter callbacks.

Shared code:

- Story 1a may add API envelope/client helpers. Story 1b should not add new API behavior.
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
- Category and brand dropdowns replace `allProducts.current` and `filteredProducts` by calling catalog-wide API routes.
- Category and brand dropdowns are already mutually exclusive, but they are wide-search controls, not local filters.
- `clearFilters()` resets to the `products` prop for the current server-rendered page.
- Pagination hides while category or brand is active.
- Category/brand loading/error behavior remains as-is for Story 1b unless planning includes a tiny non-redesign safety fix.
- Empty product grids currently render English copy: `No products available`.

### Current Behavior With Implemented Story 1a

Story 1a migrated the client fetches:

- `Home.tsx` calls `/api/catalog/category?categoryId=...` for category fetches.
- `Home.tsx` calls `/api/catalog/brand?brandId=...` for brand fetches.
- API errors use `CAT_*` codes.
- Server-rendered initial products in `src/app/page.tsx` remain unchanged.

Story 1b should build on that instead of changing the data-access architecture again.

### Target Local Filter Model For Story 1b

- Default state: no local visible-results filter; product list equals the current working set.
- Current working set may be the current page's products, category-wide results, or brand-wide results.
- Local visible filter active: local input narrows the current working set only.
- Clear local filter: reset the local input and visible products back to the current working set.
- Existing `Limpiar filtros` behavior may continue to reset category/brand/current page as today; Story 1c owns the wide-search drawer reset model.
- Catalog-wide product-name/category/brand search drawer is not present in this story.

### UI Copy Needs

Existing Spanish copy is accent-light (`Catalogo`, `Categorias`). Preserve app style unless product explicitly requests a broader copy pass.

Suggested Story 1b copy can be finalized during planning:

- Empty default list: `No hay productos disponibles.`
- Empty local filter: `No encontramos productos en los resultados visibles.`
- Clear action remains `Limpiar filtros`.

### Error Handling With Story 1a Codes

Story 1b does not introduce new API behavior. If planning touches category/brand error display without moving the controls, it should reuse Story 1a `CAT_*` code mapping and avoid rendering raw API `message` values as user-facing copy.

### Existing Patterns To Follow

- Keep domain UI under `src/features/ProductListing/` and `src/features/Home/`.
- Keep cross-cutting API envelope parsing or error-code mapping under `src/shared/utils/` only if it is reused by more than one client component.
- Do not add Zustand state for filters.
- Do not add a data-fetching library.
- Use HeroUI components already in use, such as `Button`, `Dropdown`, and existing input primitives.
- Use Tailwind classes for layout and feedback states.
- Preserve current category/brand dropdown behavior until Story 1c moves wide search into a drawer.

### Verification Rules To Follow Later

- Run `pnpm lint` after implementation.
- Run `pnpm build` after implementation because client/server boundaries and App Router API usage are involved.
- Run `pnpm exec tsc --noEmit` if planning adds or modifies shared API envelope types.
- Manually verify desktop and mobile behavior.
- Do not run `pnpm test`; no test script exists.

## Open Questions

### Catalog Behavior

I: Question: Should category and brand dropdowns remain in place for Story 1b?
Status: answered
Answer: Yes.
Context: User clarified the dropdowns are catalog-wide search controls, not local filters.
Explanation: Story 1b leaves them in place. Story 1c moves them into the wide-search drawer.

II: Question: Should local visible-results filtering clear category/brand wide-search selections, or narrow the active working set after category/brand fetches?
Status: answered
Answer: Narrow the active working set.
Context: Current behavior already filters `allProducts.current`, including category/brand wide-search results.
Explanation: This preserves current behavior and avoids inventing a new filter model.

III: Question: When users clear the local visible-results filter, where should they return?
Status: answered
Answer: Return to the current working set.
Context: The current working set may be default page products or category/brand wide-search results.
Explanation: Story 1b should not unexpectedly clear wide-search state when only the local filter is cleared.

IV: Question: Should active filter state be reflected in the URL in Story 1b?
Status: answered
Answer: No.
Context: URL sync was nice-to-have in the parent story.
Explanation: Keep URL-synced filters for a later story.

### UI And Product Decisions

I: Question: What exact Spanish copy should be used for local empty states?
Status: pending
Context: Suggested copy is included in this research doc.
Explanation: Planning can either use the suggested copy or ask product for final wording.

II: Question: Should Spanish accents be normalized in new copy?
Status: pending
Context: Existing app copy is Spanish but inconsistently accented.
Explanation: Avoid a broad copy cleanup in Story 1b unless product explicitly wants it.

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

- Story 1a API routes and envelopes are available.
- Story 1b does not add catalog-wide search and does not move category/brand dropdowns.
- Story 1b does not change the hardcoded 5-page pagination ceiling.
- Story 1b does not replace hardcoded category/brand dropdown options.
- Story 1b does not modify the variants drawer.
- Category and brand wide-search dropdowns remain mutually exclusive while they stay inline.
- Clearing only the local filter returns to the current working set.
- No new dependencies are needed.

## Research Outcome

- Story 1 should be split: Story 1b handles local visible-results filter state/feedback; Story 1c should handle the catalog-wide search drawer.
- Story 1b is scoped enough to plan and implement independently after Story 1a.
- Main implementation work is in `Home`, ProductListing controls, and local empty-state display.
- The biggest remaining decision is copy placement/wording.
