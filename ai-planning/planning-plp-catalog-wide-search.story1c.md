# Planning: Add Catalog-Wide Search Drawer

- Source research: `ai-research/plp-catalog-wide-search.story1c.md`
- Sign-off status: plan-ready after resolving the pending copy question on 2026-07-11
- Copy assumption: new Story 1c Spanish copy should use normalized accents. Existing unrelated copy stays unchanged.
- Scope assumption: Strapi supports product-name filtering through `ProductFiltersInput.name.contains`.
- Scope assumption: search returns page 1 only with fixed `pageSize: 50`; no search pagination or totals.

## Acceptance Criteria

1. Users can distinguish `Filtrar resultados visibles` from a catalog-wide search drawer through labels, helper text, and the Story 1b wider-search prompt.
2. Local visible-results filtering remains client-side and continues to narrow only the current working set.
3. Catalog-wide product-name search queries Strapi through a new API route and replaces the current working set with matching products.
4. Existing category and brand wide-search dropdowns move into the catalog-wide search drawer and continue to use Story 1a `/api/catalog/category` and `/api/catalog/brand` routes.
5. Catalog-wide search uses Story 1a response envelopes and `CAT_*` error codes; raw Apollo/Strapi errors are not shown to users.
6. Search input is validated before reaching the GraphQL layer: trim whitespace, reject unsafe characters/control characters, and cap length at 100 characters.
7. Catalog-wide search empty, loading, invalid-input, and failure states render Spanish user-facing copy.
8. Clearing search/filter state returns users to the current page's original server-rendered products unless a later URL-sync story changes that behavior.

## Affected Files

### `src/app/**`

- `src/app/api/catalog/_utils.ts` - extend catalog error typing and request validation helpers for search terms.
- `src/app/api/catalog/search/route.ts` - create new search route.

### `src/features/**`

- `src/features/Home/Home.tsx` - own catalog search drawer state, catalog search state, and working-set replacement/clear behavior.
- `src/features/ProductListing/SearchInput.tsx` - relabel local filter input and add helper text.
- `src/features/ProductListing/ProductListing.tsx` - wire local empty-state wider-search button to open the drawer.
- `src/features/ProductListing/DropdownCategories.tsx` - reuse in drawer and keep default labels compatible.
- `src/features/ProductListing/DropdownBrands.tsx` - reuse in drawer and keep default labels compatible.
- `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx` - create minimal drawer component if keeping drawer markup outside `Home` is cleaner.

### `src/shared/**`

- `src/shared/constants/catalog.constants.ts` - add `CAT_VAL_006`, `MSG_CAT_VAL_006`, and search term length/pattern constants.
- `src/shared/queries/global.queries.ts` - add product-name GraphQL query.
- `src/shared/lib/global.lib.ts` - add server action for product-name search.
- `src/shared/utils/catalog-api.utils.ts` - add Spanish copy for `CAT_VAL_006`.
- `src/shared/types/global.types.ts` - likely no change; reuse `FetchProductsResponse` and `Product[]` unless implementation proves a new shape is required.

### Docs/Config

- No config changes planned.
- No dependency changes planned.
- No test framework or test directories planned.

## Phase 1: Search API Contract

### Changes Required

| Path | Action | Details |
| --- | --- | --- |
| `src/shared/constants/catalog.constants.ts` | Modify | Near existing `CAT_VAL_*` exports, add `CAT_VAL_006 = 'CAT_VAL_006'`, `MSG_CAT_VAL_006 = 'Invalid search term'`, `SEARCH_TERM_MAX_LENGTH = 100`, and a small safe pattern/character rule constant if useful. Keep `PRODUCT_PAGE_SIZE = 50`. |
| `src/app/api/catalog/_utils.ts` | Modify | Extend `CatalogErrorCode` with `CAT_VAL_006`. Add `parseSearchTerm(raw: string | null)` and include it in `readValidatedParams()` return as `searchTerm`. Trim before returning. Reject missing/empty-after-trim, length over 100, control characters, and unsafe GraphQL-significant characters such as braces, quotes, and newlines. |
| `src/shared/queries/global.queries.ts` | Modify | Add `GET_PRODUCTS_BY_NAME` near category/brand queries. Shape should match product fields already used by `GET_PRODUCTS`, `GET_PRODUCTS_BY_CATEGORY`, and `GET_PRODUCTS_BY_BRAND`: `name`, `minPrice`, `maxPrice`, `documentId`, `variantCount`, `category { name }`, `brand { name }`. Accept `$filters: ProductFiltersInput` and `$pagination: PaginationArg`. |
| `src/shared/lib/global.lib.ts` | Modify | Import `GET_PRODUCTS_BY_NAME`. Add `fetchProductsByName(searchTerm: string): Promise<Product[]>` near existing category/brand actions. Use variables `{ filters: { name: { contains: searchTerm } }, pagination: { page: 1, pageSize: 50 } }`. Let route map thrown Apollo failures to `CAT_ERR_001`; do not expose raw errors. |
| `src/app/api/catalog/search/route.ts` | Create | Follow `products`, `category`, and `brand` route style. `GET(request)` validates env, validates `q` via `readValidatedParams(request).searchTerm`, calls `fetchProductsByName(searchTerm.value)`, returns `success(products)`, catches and logs server-side only, and returns `failure(CAT_ERR_001, MSG_CAT_ERR_001)`. |
| `src/shared/utils/catalog-api.utils.ts` | Modify | Add `CAT_VAL_006: 'Revisa el texto de búsqueda e inténtalo de nuevo.'` to `SPANISH_COPY`. Keep raw envelope `message` non-user-facing. |

### Edge Cases

- `q` must be trimmed before the GraphQL call, not merely before UI display.
- Empty or unsafe search terms should return `400` with `{ success: false, code: 'CAT_VAL_006', message: MSG_CAT_VAL_006 }`.
- Do not make `pageSize` caller-controlled for search.
- Do not consume or invent Strapi pagination metadata.

### Success Criteria

- Automated: `pnpm exec tsc --noEmit`
- Automated: `pnpm lint`
- Manual: with `STRAPI_HOST` and `STRAPI_API_TOKEN`, request `/api/catalog/search?q=<known product text>` and confirm `{ success: true, data: [...] }`.
- Manual: request invalid values such as empty `q`, whitespace-only `q`, over-100-char `q`, and `q={bad}`; confirm `CAT_VAL_006` envelopes and no raw Apollo/Strapi error in the response.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/app/api/catalog/_utils.ts` | search param trim, unsafe character rejection, 100-character cap, `CAT_VAL_006` mapping | `pnpm exec tsc --noEmit` + manual API invalid-input calls |
| `src/app/api/catalog/search/route.ts` | env validation, success/error envelope, no raw upstream error leakage | manual API calls + `pnpm build` in final verification |
| `src/shared/lib/global.lib.ts` | GraphQL variables, fixed first page/page size, return `Product[]` shape | `pnpm exec tsc --noEmit` + targeted manual data check |

## Phase 2: Catalog Search Drawer UI

### Changes Required

| Path | Action | Details |
| --- | --- | --- |
| `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx` | Create | Prefer this small client component if `Home.tsx` gets crowded. Props: `state: UseOverlayStateReturn`, `searchTerm: string`, `onSearchTermChange(term: string): void`, `onSubmit(): void`, `onCategorySelect(id: string): void`, `onBrandSelect(id: string): void`, `selectedCategory: string | null`, `selectedBrand: string | null`, `isLoading: boolean`, `message?: string`, `isInvalidSearch?: boolean`, `onClearCatalogSearch(): void`. Use HeroUI `Drawer` pattern from `ProductVariantsDrawer`. |
| `src/features/Home/Home.tsx` | Modify | Add a second `useOverlayState()` for catalog search drawer. Add catalog search state: `catalogSearchTerm`, `catalogMessage`, `catalogSearchError`, `isLoadingCatalogSearch`, and optionally `activeCatalogMode: 'name' | 'category' | 'brand' | null` if needed to hide pagination and clear mutually exclusive controls cleanly. |
| `src/features/Home/Home.tsx` | Modify | Add `handleCatalogNameSearch` that trims/submits explicitly to `/api/catalog/search?q=...` through `fetchCatalog<Product[]>`, replaces `allProducts.current` and `filteredProducts`, sets active mode to `name`, clears `selectedCategory`, `selectedBrand`, and local filters, and renders Spanish loading/empty/failure/invalid copy. |
| `src/features/Home/Home.tsx` | Modify | Move the catalog-wide category/brand controls out of the inline PLP controls and into the drawer. Keep existing `handleCategorySelect` and `handleBrandSelect` API calls, but also clear `catalogSearchTerm`, set active mode to `category`/`brand`, close or keep the drawer only if the chosen UI makes state obvious, and clear local filters. |
| `src/features/ProductListing/SearchInput.tsx` | Modify | Change label to `Filtrar resultados visibles`, placeholder to similar local-only copy, and add helper text such as `Filtra los productos que ya estás viendo`. Keep `onSearch` firing on every input change for local client-side filtering. |
| `src/features/ProductListing/DropdownCategories.tsx` | Modify | No behavioral refactor unless necessary. Confirm `defaultLabel` supports drawer copy: `Buscar categoría en todo el catálogo`; inline local instances continue to pass `Filtrar por categoría visible`. |
| `src/features/ProductListing/DropdownBrands.tsx` | Modify | No behavioral refactor unless necessary. Confirm `defaultLabel` supports drawer copy: `Buscar marca en todo el catálogo`; inline local instances continue to pass `Filtrar por marca visible`. |

### Edge Cases

- Local search remains client-only and filters `allProducts.current`; it must not call `/api/catalog/search`.
- Drawer product-name search is explicit submit only; no debounce or per-keystroke network requests.
- Product-name, category, and brand catalog-wide controls are mutually exclusive for this story.
- While catalog-wide search/category/brand is active, pagination remains hidden. Replace the existing condition `selectedCategory === null && selectedBrand === null` with an active-catalog-state check that includes product-name search.
- Clearing all search/filter state should restore the current page's original `products` prop, not page 1 and not stale catalog search results.

### Success Criteria

- Automated: `pnpm exec tsc --noEmit`
- Automated: `pnpm lint`
- Manual desktop: local input label/helper clearly says visible-results filtering; typing in it narrows only the current working set without network search semantics.
- Manual desktop: open drawer, submit a valid catalog name search, see loading copy, then matching products replace the grid.
- Manual desktop: drawer category and brand selections still use `/api/catalog/category` and `/api/catalog/brand` behavior and replace the grid.
- Manual mobile: drawer opens, form controls are usable, and local vs catalog search distinction remains readable.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/features/Home/Home.tsx` | working-set replacement, mutual exclusivity, clear behavior, pagination hidden for catalog modes | manual browser check + `pnpm lint` / `pnpm build` |
| `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx` | drawer states, explicit submit, normalized Spanish copy, category/brand controls inside drawer | manual desktop/mobile check + `pnpm lint` |
| `src/features/ProductListing/SearchInput.tsx` | local-only label/helper and unchanged client-side filtering behavior | manual browser check |

## Phase 3: Wider-Search Prompt Wiring And Clear Behavior

### Changes Required

| Path | Action | Details |
| --- | --- | --- |
| `src/features/ProductListing/ProductListing.tsx` | Modify | Add optional prop `onOpenCatalogSearch?: () => void`. In the local empty state, below `¿No encontraste lo que buscabas? Amplía la búsqueda al catálogo completo.`, render a `Button` with normalized copy `Buscar en todo el catálogo` that calls `onOpenCatalogSearch`. Keep the existing `Limpiar filtros` button. |
| `src/features/Home/Home.tsx` | Modify | Pass the drawer open handler to `ProductListing`. Add one optional persistent secondary drawer trigger in the controls area only if needed for discoverability; keep it visually separate from `SearchInput`, not embedded in the local input. |
| `src/features/Home/Home.tsx` | Modify | Update `clearFilters` or add `clearAllFilters` so Story 1c clearing returns `allProducts.current` and `filteredProducts` to the current page's original `products` prop, resets local filters, selected category/brand, catalog search term/messages/errors, active catalog mode, and loading-safe state. Use this for global clear; keep local-only clear behavior where explicitly needed. |

### Edge Cases

- If the user clears local filters from the empty state, existing local-only behavior can remain.
- If the user clears catalog-wide state, restore `products` from props so the current page server-rendered products return.
- When `products` prop changes due to pagination, reset local and catalog-wide state as the existing `useEffect` already does for local/category/brand state.

### Success Criteria

- Automated: `pnpm lint`
- Manual desktop: create a local empty state, click `Buscar en todo el catálogo`, and confirm the drawer opens.
- Manual desktop: after catalog search/category/brand selection, clear all filters and confirm the grid returns to the current page's original server-rendered products.
- Manual mobile: same empty-state drawer opening and clear behavior works without layout breakage.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/features/ProductListing/ProductListing.tsx` | wider-search button calls drawer open handler, existing clear local button remains | manual browser check + `pnpm lint` |
| `src/features/Home/Home.tsx` | clear-all reset target is current `products` prop, not stale search/category results | manual browser check |

## Phase 4: Final Integration Verification

### Changes Required

No additional source changes. This phase verifies the completed story end-to-end.

### Success Criteria

- Automated: `pnpm exec tsc --noEmit`
- Automated: `pnpm lint`
- Automated: `pnpm build`
- Manual desktop and mobile:
  - Local visible-results filtering narrows only currently loaded products.
  - Catalog name search calls `/api/catalog/search` only on explicit submit.
  - Catalog category and brand controls are no longer inline wide-search controls; they are available in the drawer.
  - Loading, empty, invalid-input, and failure states use Spanish copy and do not expose raw API messages.
  - Pagination is hidden while any catalog-wide mode is active and returns after clearing.
  - Clearing returns to the current page's original server-rendered products.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/app/api/catalog/search/route.ts` | API envelope, validation, upstream error mapping | `pnpm build` + manual API/browser check |
| `src/features/Home/Home.tsx` | full local/catalog interaction model | manual desktop/mobile check + `pnpm build` |
| `src/shared/utils/catalog-api.utils.ts` | `CAT_VAL_006` Spanish mapping and generic fallback behavior | manual invalid-input browser/API check |

## Cross-Cutting Concerns

- Strapi env vars: `/api/catalog/search` must validate `STRAPI_HOST` and `STRAPI_API_TOKEN` through existing `validateCatalogEnv()` before server action calls.
- Server/client boundary: client components call API routes with `fetchCatalog`; only route handlers and server components call `src/shared/lib/global.lib.ts`.
- GraphQL response shape: use the same `Product` fields as existing product/category/brand queries; no pagination metadata expected.
- Hardcoded pagination ceiling: keep `src/app/page.tsx` unchanged and retain `totalPages = 5` for the base catalog page.
- Local vs catalog search: labels and helper text must make scope explicit.
- Copy: normalize accents only for new Story 1c copy; do not run a broad Spanish copy cleanup.

## Open Questions / Out-of-Scope Items

### Open Questions

- None blocking. Strapi `name.contains` is an accepted assumption and should be smoke-checked during implementation.

### Out Of Scope

- URL-synced search/filter state.
- Search pagination, totals, or result counts.
- Backend schema changes or external Strapi repository work.
- New dependencies, data-fetching libraries, Zustand search store, or test framework setup.
- Refactoring category/brand API routes beyond what is required to place their controls in the drawer.
- Broad copy normalization outside new Story 1c user-facing text.
- Product card redesign or variants drawer changes.

## Decisions Beyond Research

- Use a small `CatalogSearchDrawer` component only if it keeps `Home.tsx` manageable; otherwise inline drawer markup in `Home` is acceptable. This is a structure choice, not a behavior change.
- Add `CAT_VAL_006` to existing catalog helpers rather than creating a separate validation module. The existing route helper is already the shared boundary for catalog request validation.
