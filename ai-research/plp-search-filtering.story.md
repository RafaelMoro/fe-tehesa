# Research: Improve PLP Search And Filtering Behavior

## Story Definition

### Story Title

Improve PLP Search And Filtering Behavior

### Source

- Parent epic: `ai-research/plp-functionality-seo.epic.md`
- Referenced range: lines 31-61
- Scope decision: research Story 1 as one independently deliverable story.
- Research depth: full template.

### Story Description

Make product listing discovery more predictable by separating local visible-result filtering from catalog-wide product search, category filters, brand filters, empty states, and filter reset flows.

The story also requires input validation before values reach Strapi GraphQL and a thin Next.js Route Handler spike for catalog search under `src/app/api/`, while preserving the current server-action production path.

### Acceptance Criteria

1. Users can see which search/filter inputs are active and clear them without unexpectedly losing the current catalog context.
2. Empty search/filter results render Spanish user-facing copy instead of the current generic fallback text.
3. Category and brand filter behavior remains one clear model; current mutually exclusive behavior is acceptable unless product requirements later confirm combined filtering.
4. Filter loading and failure states are represented in the UI instead of silently leaving stale results.
5. The UI clearly separates local visible-results filtering from catalog-wide product search.
6. User-controlled inputs that can reach the GraphQL layer are validated before use: name search term, category id, brand id, page number, and page size.
7. A thin `GET` Route Handler spike exists at `src/app/api/catalog/search/route.ts` or an equivalent path, accepts query parameters, reuses the Apollo client factory, validates inputs, queries Strapi, and returns shaped JSON without replacing the current server-action flow.

### Task Breakdown

1. Clarify and represent filter state in `src/features/Home/Home.tsx` and related ProductListing controls.
2. Keep local visible-result filtering separate from catalog-wide Strapi search in UI labels/copy.
3. Add Spanish empty, loading, and failure copy to the listing/filter flow.
4. Add validation/sanitization at the server boundary before Strapi GraphQL variables are built.
5. Add a catalog search GraphQL operation and server-side access path if confirmed by the current Strapi contract assumption.
6. Add the Route Handler spike as a proof of pattern only; do not migrate all production data fetching to API routes in this story.

### Scope Assessment

- Classification: single medium-to-large story.
- Areas touched: multiple areas, but still one user-facing PLP behavior story.
- In scope: Home/ProductListing UI, shared GraphQL/server actions, validation helpers if needed, and one new API route spike.
- Out of scope: dynamic category/brand options, replacing server actions, URL-synced filters, pagination metadata work, test framework setup, new dependencies, and backend repository changes.

### Confirmed Research Choices

- Full research template requested.
- Keep as one story, not split into child stories.
- Cover all relevant UI, data, and API route areas.
- Assume Strapi GraphQL can support product name filtering for catalog-wide search.
- Assume the Route Handler spike uses `GET` with URL query parameters.

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
- The Route Handler spike should reuse this factory so host/token behavior stays in one place.
- No external backend repository should be accessed for schema confirmation.

### Current API Routes

- Existing API route inventory contains only `src/app/api/preferences/route.ts`.
- `/api/preferences` supports `POST` and saves the theme cookie.
- There is no current catalog/search API route.
- The new Route Handler spike should live under `src/app/api/catalog/search/route.ts` or equivalent.
- The route should be a thin proof of validation, Apollo call, and response shaping.
- It should not replace the current server-action flow during this story.

### Current Types And Static Data

- `src/shared/types/global.types.ts` defines `Product`, `ProductVariant`, fetch response types, and hardcoded category/brand option arrays.
- `CATEGORIES_PRODUCTS` and `BRANDS_PRODUCTS` are hardcoded and marked with a TODO asking whether they can remain hardcoded.
- Story notes explicitly say to preserve the current category/brand option source unless the backend contract is confirmed.
- `Product` includes `name`, `category`, `brand`, `documentId`, optional `minPrice`, optional `maxPrice`, optional `variantCount`, and optional `product_variants`.
- Existing fetch response type for product lists is `FetchProductsResponse` with `products: Product[]` and no metadata.
- No GraphQL pagination metadata is typed or consumed.

### Existing Patterns To Follow

- Keep App Router server/client split.
- Keep server-side Strapi reads in `src/shared/lib/global.lib.ts` unless intentionally proving a route-handler spike.
- Reuse `src/app/apollo-client.ts` for Strapi Apollo calls.
- Keep feature UI under `src/features/<Feature>/`.
- Keep cross-cutting validation/types/helpers under `src/shared/` if reused by server actions and API route.
- Keep `src/components` limited to shared `ProductCard` unless there is a concrete reason to change that boundary.
- Use HeroUI v3 primitives and current compound component style.
- Use Tailwind v4 classes and existing Spanish copy style.
- Preserve next-themes/Zustand theme flow; this story should not touch theme persistence.

### Verification Rules To Follow Later

- No tests are configured.
- Do not run or invent `pnpm test`.
- Use `pnpm lint` after implementation changes.
- Use `pnpm exec tsc --noEmit` when type-only validation is useful.
- Use `pnpm build` when route/server component behavior or App Router integration changes need production verification.
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
- Route Handler response shape is not defined by existing code.
- Route Handler failures should be shaped so the client can show Spanish copy without parsing Strapi/Apollo internals, but the exact envelope remains an open decision.
- Current UI copy omits accents in some places (`Catalogo`, `Categorias`); preserve consistency unless the implementation story explicitly normalizes Spanish copy.
- Product image support is commented out and out of scope.

### Minimal Implementation Boundaries For Planning

- Prefer one small shared validation helper only if both server actions and the Route Handler need the same rules.
- Do not add a query-builder abstraction.
- Do not add a global catalog state store.
- Do not add TanStack Query or another client data-fetching dependency.
- Do not replace existing server actions with the Route Handler spike.
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
Explanation: Allowlist validation is stricter and simpler for current UI, but route-handler query params may be called directly.

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

### Route Handler Spike

I: Question: Should the spike endpoint be exactly `src/app/api/catalog/search/route.ts`?
Status: answered
Answer: Use `GET` query parameters and `src/app/api/catalog/search/route.ts` or an equivalent path.
Context: User selected GET query params for research.

II: Question: What query parameters should the spike accept initially?
Status: pending
Context: Likely candidates are `q`, `category`, `brand`, `page`, and `pageSize`, but the story only explicitly names validated inputs.
Explanation: Keeping the spike thin argues for only the minimum needed to prove catalog-wide name search.

III: Question: What JSON response envelope should the route return on success and failure?
Status: pending
Context: Nice-to-have notes mention a generic error envelope.
Explanation: The client should not parse raw Strapi/Apollo errors, but no envelope exists today.

IV: Question: Should the Route Handler call a shared server function in `global.lib.ts`, or perform the Apollo query directly while reusing `createApolloClient()`?
Status: pending
Context: Story says preserve server actions as production path and reuse Apollo client factory.
Explanation: A direct Apollo call may better prove the route-handler pattern without changing existing server actions; a shared helper may avoid duplicate query logic if validation is shared.

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

I: Question: Should `pnpm build` be required for this story implementation because it adds a Route Handler and GraphQL query shape?
Status: pending
Context: Build is the closest configured production verification; there is no test framework.

II: Question: Are Strapi env vars available locally for manual verification of catalog-wide search?
Status: pending
Context: `STRAPI_HOST` and `STRAPI_API_TOKEN` are required; `.env.local` is gitignored.

III: Question: Should manual browser verification cover both mobile and desktop layouts?
Status: pending
Context: ProductCard and listing layout have mobile-aware behavior.

## Assumptions Made

- Story 1 remains one independently deliverable story.
- Full research depth is desired.
- Catalog-wide search by product name is supported by Strapi GraphQL, though exact query shape still needs implementation-time confirmation.
- The Route Handler spike uses `GET` query parameters.
- Category and brand filters remain mutually exclusive unless product explicitly changes that model.
- URL-synced filters remain nice-to-have and out of scope for the must-have implementation.
- No new dependencies are needed.
- No source files should be modified during research.

## Research Outcome

- The current code already has the core split between server page fetches and client-side local filtering, but the UI does not explain the split.
- The current category/brand model is mutually exclusive and simple; preserving it is the shortest safe path.
- The main missing pieces are explicit UI state, Spanish copy, input validation at server boundaries, a name-search GraphQL operation, and the thin Route Handler spike.
- The largest unresolved risk is the exact Strapi GraphQL name-search and pagination contract.
