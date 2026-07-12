# Research: Improve PLP Search And Filtering Behavior

## Story Definition

### Story Title

Improve PLP Search And Filtering Behavior

### Source

- Parent epic: `ai-research/plp-functionality-seo.epic.md`
- Referenced range: lines 31-61
- Scope decision: superseded. Story 1 has been split into Story 1a, Story 1b, and Story 1c.
- Research depth: full template.

### Story Description

Make product listing discovery more predictable by separating local visible-result filtering from catalog-wide product search, category filters, brand filters, empty states, and filter reset flows.

This original Story 1 research is now an umbrella reference, not the implementation unit. Story 1a has been implemented and provides the catalog API contract. Story 1b has been implemented and provides local visible-results filter state/feedback. Story 1c owns the catalog-wide search drawer.

### Split Status

- Story 1a: `ai-research/plp-catalog-api.story1a.md` and `ai-planning/planning-plp-catalog-api.story1a.md` - implemented baseline for catalog API routes, API envelopes, `CAT_*` errors, and client API usage.
- Story 1b: `ai-research/plp-filter-state-feedback.story1b.md` - implemented baseline for stacked local visible-results filters, empty-state guidance, and local clear behavior.
- Story 1c: `ai-research/plp-catalog-wide-search.story1c.md` - catalog-wide search drawer for product name, category, and brand, plus UI distinction from local visible-results filtering.

### Acceptance Criteria

1. Story 1b: Users can see which local/category/brand filters are active and clear them without unexpectedly losing the current catalog context.
2. Story 1b: Empty category/brand/local filter results render Spanish user-facing copy instead of the current generic fallback text.
3. Story 1b: Category and brand filter behavior remains mutually exclusive.
4. Story 1b: Filter loading and failure states are represented in the UI instead of silently leaving stale results.
5. Story 1c: The UI clearly separates local visible-results filtering from catalog-wide product search.
6. Story 1c: Product-name search input is validated before reaching the Story 1a API/server-action GraphQL layer.

### Task Breakdown

1. Story 1b: Clarify and represent current filter state in `src/features/Home/Home.tsx` and related ProductListing controls.
2. Story 1b: Add Spanish empty, loading, and failure copy to the current category/brand/local filter flow.
3. Story 1c: Keep local visible-result filtering separate from catalog-wide Strapi search in UI labels/copy.
4. Story 1c: Add a catalog search GraphQL operation, server action, and `/api/catalog/search` route following Story 1a patterns.

### Scope Assessment

- Classification: umbrella story split into independently deliverable child stories.
- Areas touched: Home/ProductListing UI, Story 1a catalog API contract, and search-specific GraphQL/API work.
- In scope for this umbrella: preserving the relationship and boundaries between Story 1a, Story 1b, and Story 1c.
- Out of scope for this umbrella: direct implementation planning. Plan Story 1b and Story 1c separately.

### Confirmed Research Choices

- Full research template requested.
- Story has since been split for implementation.
- Story 1a is implemented and is the baseline for client API calls and error envelopes.
- Story 1b covers UI filter state/feedback.
- Story 1c covers the catalog-wide search drawer for product name, category, and brand.
- Assume Strapi GraphQL can support product name filtering for catalog-wide search.
- Story 1c adds search-specific API/data work using the Story 1a route/action/error-code pattern.

## Technical Research

### Current PLP Route

- `src/app/page.tsx` is the only catalog page route.
- It awaits `searchParams` per Next.js 15 behavior.
- It parses only `page` from the URL.
- It clamps `page` to `1..5` with `Math.max(1, Math.min(5, parseInt(pageParam, 10) || 1))`.
- It fetches products and theme preference in parallel.
- It calls `fetchProducts(currentPage)` from `src/shared/lib/global.lib.ts`.
- It passes `products`, `currentPage`, and hardcoded `totalPages = 5` into `Home`.
- The hardcoded 5-page ceiling is documented as a known constraint and should not be treated as a bug.

### Current Catalog Controller

- `src/features/Home/Home.tsx` is the main client controller.
- It keeps `allProducts` in a `useRef<Product[]>` as the current working set.
- It keeps visible products in `filteredProducts` state.
- It tracks `selectedCategory`, `selectedBrand`, `isLoadingCategory`, and `isLoadingBrand`.
- It imports client-callable server actions `fetchProductsByCategory` and `fetchProductsByBrand` from `src/shared/lib/global.lib.ts`.
- `handleSearch()` filters only `allProducts.current` in memory by product name.
- Local search does not query Strapi and does not reset to page 1.
- `handleCategorySelect()` fetches category products from Strapi, replaces `allProducts.current`, replaces `filteredProducts`, sets the category, and clears the brand.
- `handleBrandSelect()` fetches brand products from Strapi, replaces `allProducts.current`, replaces `filteredProducts`, sets the brand, and clears the category.
- `clearFilters()` resets to the original `products` prop for the current server-rendered page.
- Pagination is hidden when either category or brand is selected.
- Pagination uses `router.push('/?page=N')` and scrolls to top.

### Current ProductListing UI

- `src/features/ProductListing/SearchInput.tsx` is a controlled client input.
- Its label and placeholder both say `Buscar producto`.
- It calls `onSearch(e.target.value)` on every input change.
- It has a static `FieldError` child, but no visible validation state is currently wired in the file.
- It does not distinguish local visible-result filtering from catalog-wide search.
- `src/features/ProductListing/ProductListing.tsx` renders the product grid.
- If `products.length === 0`, it currently renders `No products available`.
- That empty copy is English and generic; Story 1 explicitly requires Spanish user-facing copy.
- `DropdownCategories` and `DropdownBrands` render hardcoded options from `src/shared/types/global.types.ts`.
- Dropdown buttons show the selected category/brand display name, or default to `Categorias` and `Marcas`.
- Dropdown options call parent callbacks via HeroUI `Dropdown.Menu` `onAction`.
- There is no visible loading indicator tied to `isLoadingCategory` or `isLoadingBrand` beyond disabling `Limpiar filtros`.
- There is no visible filter failure message; errors are logged to console.

### Current GraphQL And Server Actions

- `src/shared/lib/global.lib.ts` is marked with `"use server"`.
- It creates a new Apollo Client per call through `src/app/apollo-client.ts`.
- `fetchProducts(page)` calls `GET_PRODUCTS` with `pagination: { page, pageSize: 50 }`.
- `fetchProductsByCategory(customId)` calls `GET_PRODUCTS_BY_CATEGORY` with `category.customId.contains = customId` and `pageSize: 50`.
- `fetchProductsByBrand(brandId)` calls `GET_PRODUCTS_BY_BRAND` with `brand.customId.contains = brandId` and `pageSize: 50`.
- `fetchProductVariants({ documentId })` calls `GET_PRODUCT_VARIANTS` with `pageSize: 100`.
- Category and brand fetches catch Apollo errors, log them, and return `undefined`.
- Product list and variant fetches do not catch Apollo errors.
- There is no server-side validation of `page`, `customId`, `brandId`, or `documentId` inside `global.lib.ts`.
- The current GraphQL queries use variables, which avoids raw GraphQL string interpolation, but invalid/unbounded values can still be forwarded to Strapi filters.
- There is no existing product-name search query.
- Existing query shapes indicate Strapi accepts `ProductFiltersInput` and `contains` for nested category/brand custom ids.
- User answered that research may assume name filtering is available.

### Current Apollo Integration

- `src/app/apollo-client.ts` reads `STRAPI_HOST` and `STRAPI_API_TOKEN` from `process.env`.
- It builds an Apollo `HttpLink` with `Authorization: Bearer ${STRAPI_API_TOKEN}`.
- It uses `InMemoryCache`.
- No external backend repository should be accessed for schema confirmation.

### Current Types And Static Data

- `src/shared/types/global.types.ts` defines `Product`, `ProductVariant`, fetch response types, and hardcoded category/brand option arrays.
- `CATEGORIES_PRODUCTS` and `BRANDS_PRODUCTS` are hardcoded and marked with a TODO asking whether they can remain hardcoded.
- Story notes explicitly say to preserve the current category/brand option source unless the backend contract is confirmed.
- `Product` includes `name`, `category`, `brand`, `documentId`, optional `minPrice`, optional `maxPrice`, optional `variantCount`, and optional `product_variants`.
- Existing fetch response type for product lists is `FetchProductsResponse` with `products: Product[]` and no metadata.
- No GraphQL pagination metadata is typed or consumed.

### Existing Patterns To Follow

- Keep App Router server/client split.
- Keep server-side Strapi reads in `src/shared/lib/global.lib.ts` for this story.
- Reuse `src/app/apollo-client.ts` for Strapi Apollo calls.
- Keep feature UI under `src/features/<Feature>/`.
- Keep cross-cutting validation/types/helpers under `src/shared/` if reused by server actions.
- Keep `src/components` limited to shared `ProductCard` unless there is a concrete reason to change that boundary.
- Use HeroUI v3 primitives and current compound component style.
- Use Tailwind v4 classes and existing Spanish copy style.
- Preserve next-themes/Zustand theme flow; this story should not touch theme persistence.

### Verification Rules To Follow Later

- No tests are configured.
- Do not run or invent `pnpm test`.
- Use `pnpm lint` after implementation changes.
- Use `pnpm exec tsc --noEmit` when type-only validation is useful.
- Use `pnpm build` when server component behavior or App Router integration changes need production verification.
- Do not run `pnpm install` during research.
- New dependencies are not needed for this story; if a later plan adds one, it must change both `package.json` and `pnpm-lock.yaml`.

### Dependencies And Integration Points

- Strapi env vars are `STRAPI_HOST` and `STRAPI_API_TOKEN`.
- Current GraphQL variables use Strapi `ProductFiltersInput` and `PaginationArg`.
- Current product list page size is 50.
- Current variant page size is 100.
- Current pagination max is hardcoded to 5 pages.
- Current filters hide pagination for category/brand results.
- Current local search filters only the current working set.
- Prompt sync command is `pnpm sync:prompts`, but this story does not edit prompt files.
- Release workflow requires PRs targeting `develop` to carry exactly one of `major`, `minor`, or `patch` labels.

### Edge Cases And Constraints

- Page query values are currently clamped in `src/app/page.tsx`, but server actions do not validate page/pageSize directly.
- Search input currently fires on every keystroke; a catalog-wide search path should avoid accidentally making every local keystroke a Strapi request unless that is explicit product intent.
- Category and brand are currently mutually exclusive; combined filtering would require product confirmation and likely a different filter-state model.
- If category/brand fetches return `undefined`, the UI currently keeps stale results and only logs errors.
- If category/brand fetches return an empty array, ProductListing currently renders English generic empty text.
- `clearFilters()` resets to the current page's original server products, not the first catalog page and not a full catalog search result.
- No pagination metadata is currently available for filtered results, so filtered list pagination should not be invented in this story.
- Existing GraphQL uses variables, but validation is still needed for length, allowed characters, control characters, ids, and pagination bounds.
- Current UI copy omits accents in some places (`Catalogo`, `Categorias`); preserve consistency unless the implementation story explicitly normalizes Spanish copy.
- Product image support is commented out and out of scope.

### Minimal Implementation Boundaries For Planning

- Prefer one small shared validation helper only if multiple server actions need the same rules.
- Do not add a query-builder abstraction.
- Do not add a global catalog state store.
- Do not add TanStack Query or another client data-fetching dependency.
- Do not replace existing server actions.
- Do not add a test framework for this story.

## Open Questions

### Strapi Contract

I: Question: Does Strapi support filtering products by name with `ProductFiltersInput`, likely `name.contains` or an equivalent operator?
Status: answered
Answer: Assume available for this research.
Context: Existing queries only demonstrate `category.customId.contains` and `brand.customId.contains`.
Explanation: Implementation still needs to confirm exact GraphQL filter shape from repo-visible query behavior or a user-provided contract before shipping.

II: Question: Should catalog-wide search return only products from page 1 with `pageSize: 50`, or should it support explicit `page` and `pageSize` query params immediately?
Status: pending
Context: Story names page number and page size as inputs to validate, but current filtered results do not have pagination metadata.
Explanation: Without metadata, UI pagination for search results may mislead users.

III: Question: Is Strapi expected to return pagination metadata for products, and if so, should this story consume it?
Status: pending
Context: Current `FetchProductsResponse` only types `products: Product[]`.
Explanation: The repo documents no GraphQL pagination metadata contract.

IV: Question: Should category and brand ids be validated only against the hardcoded allowlists, or against a broader slug-like format?
Status: pending
Context: Current options are hardcoded in `CATEGORIES_PRODUCTS` and `BRANDS_PRODUCTS`.
Explanation: Allowlist validation is stricter and simpler for current UI, but a broader slug validator may be needed if future API callers are allowed.

### Catalog Behavior

I: Question: Should category and brand filters remain mutually exclusive for this story?
Status: answered
Answer: Yes for research; keep one clear model and use current mutually exclusive behavior unless product later confirms combined filtering.
Context: Existing `Home` clears brand when category is selected and clears category when brand is selected.

II: Question: Should local visible-results filtering clear category/brand selections, or narrow the active working set after category/brand fetches?
Status: pending
Context: Current local search filters whichever set is in `allProducts.current`, including a category or brand result set.
Explanation: The story wants users to understand active inputs and current catalog context.

III: Question: When users clear filters after a catalog-wide search, should they return to the current page, the search result set, or page 1 of the default catalog?
Status: pending
Context: Current `clearFilters()` returns to the original `products` prop for the current page.

IV: Question: Should catalog-wide search be triggered by an explicit button/submission rather than every keystroke?
Status: pending
Context: Current local `SearchInput` filters on every change.
Explanation: Explicit submission is safer for network calls and clearer for separating local filtering from catalog-wide search.

V: Question: Should active filter state be reflected in the URL in this story?
Status: pending
Context: URL sync is listed as nice-to-have in the epic, not must-have.
Explanation: Research treats URL sync as out of scope unless promoted.

### UI And Product Decisions

I: Question: What exact Spanish empty-state copy should be used for local filter empty results versus catalog-wide search empty results?
Status: pending
Context: Story provides recovery-path copy: `No encontraste el producto que buscas? Buscalo en todo el catalogo.`
Explanation: Existing empty state is `No products available`.

II: Question: Should loading indicators appear on the dropdown buttons, near the grid, or as a grid-level state?
Status: pending
Context: `isLoadingCategory` and `isLoadingBrand` exist, but only disable the clear button today.

III: Question: Should failed filters preserve stale results with an error message, or clear results and show an error state?
Status: pending
Context: Current behavior logs errors and leaves whatever was previously rendered.
Explanation: The story says failure states must be represented, but not whether stale results are acceptable.

IV: Question: Should the UI copy keep existing accent-less style (`Catalogo`, `Categorias`) or correct Spanish accents in new copy?
Status: pending
Context: Current app copy is Spanish but inconsistently accented.

### Validation And Security

I: Question: What maximum length should apply to catalog-wide product name search?
Status: answered
Answer: Research may use the epic example of 100 characters as the expected cap unless implementation receives different product/security guidance.
Context: Epic notes say `e.g. 100 chars for name`.

II: Question: Should invalid inputs return empty results or fail fast with an error status/message?
Status: answered
Answer: Fail fast on invalid input instead of forwarding it.
Context: Epic acceptance criterion requires rejecting or escaping unsafe values and failing fast.

III: Question: Should validation strip control characters before validating, or reject any input containing them?
Status: pending
Context: Epic says trim whitespace, cap length, strip control characters, and reject GraphQL-significant characters for contains filters.
Explanation: Stripping can silently change user input; rejecting is clearer but stricter.

IV: Question: Should page size be fixed to 50 or allow a bounded caller-provided value?
Status: pending
Context: Current product queries use `pageSize: 50`; story mentions page size validation.

### Verification

I: Question: Should `pnpm build` be required for this story implementation because it may add a GraphQL query shape and server-action validation?
Status: pending
Context: Build is the closest configured production verification; there is no test framework.

II: Question: Are Strapi env vars available locally for manual verification of catalog-wide search?
Status: pending
Context: `STRAPI_HOST` and `STRAPI_API_TOKEN` are required; `.env.local` is gitignored.

III: Question: Should manual browser verification cover both mobile and desktop layouts?
Status: pending
Context: ProductCard and listing layout have mobile-aware behavior.

## Assumptions Made

- Story 1 is no longer one independently deliverable story; it is an umbrella split into 1a, 1b, and 1c.
- Story 1a is implemented and provides the API/error-envelope baseline.
- Story 1b is implemented and owns local visible-results filter state and feedback.
- Story 1c owns the catalog-wide search drawer.
- Catalog-wide search by product name is assumed to be supported by Strapi GraphQL, though exact query shape still needs implementation-time confirmation in Story 1c.
- Category and brand filters remain mutually exclusive unless product explicitly changes that model.
- URL-synced filters remain nice-to-have and out of scope for Story 1b and Story 1c.
- No new dependencies are needed.

## Research Outcome

- Story 1 is now an umbrella record, not the implementation unit.
- Story 1a handled the catalog API foundation.
- Story 1b should handle explicit UI filter state and Spanish feedback copy.
- Story 1c should handle the catalog-wide search drawer through the Story 1a API/server-action pattern.
