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

Make the current local visible-results filter flow understandable and resilient without adding catalog-wide search. Users should be able to filter already-loaded products by text, category, and brand, stack those local filters together, understand empty states, and clear local filters without losing the current catalog-wide search context unexpectedly.

The existing category and brand dropdowns currently perform catalog-wide searches through the Story 1a API. Story 1b leaves those dropdowns in place and does not redesign or relocate them, but updates their button copy so users understand they are catalog-wide searches. Story 1c will move the catalog-wide category, brand, and product-name search UI into a drawer.

### Acceptance Criteria

1. Users can see when the local visible-results filter is active.
2. Users can filter the current working set locally by product text, category, and brand.
3. Local text, category, and brand filters can be stacked together and apply only to the current working set.
4. `Limpiar filtros` clears local text/category/brand filters without resetting catalog-wide category/brand results unexpectedly.
5. Empty local filter results render Spanish user-facing copy instead of `No products available`, including guidance to try catalog-wide search if the desired product is not visible.
6. Existing catalog-wide category and brand dropdowns remain in place, keep their current catalog-wide search behavior, and use Spanish button copy that indicates catalog-wide category/brand search until Story 1c moves them into the wide-search drawer.

### Task Breakdown

1. Represent active local visible-results filter state clearly in `src/features/Home/Home.tsx` and related ProductListing controls.
2. Add local category and brand filters that work like the existing dropdown interactions but filter only the loaded/current working set.
3. Stack local text, category, and brand filters together.
4. Make `Limpiar filtros` clear local text/category/brand filters only.
5. Keep local visible-result filtering separate from the existing server-backed category/brand catalog-wide search dropdowns.
6. Add Spanish empty copy for local visible-results filtering, including advice to try catalog-wide search.
7. Preserve existing catalog-wide category/brand dropdown placement and behavior for now, while updating their button labels to catalog-wide Spanish copy.
8. Keep catalog-wide product-name/category/brand search drawer work out of this story.

### Scope Assessment

- Classification: single local-filter UI behavior story.
- In scope: local visible-results filter state, stacked local text/category/brand filtering over the current working set, local empty copy, wider-search advice in the local empty state, a placeholder/non-functional wider-search button affordance if useful, `Limpiar filtros` clearing local filters only, preserving current catalog-wide category/brand dropdown behavior, and updating catalog-wide category/brand dropdown button labels to clarify catalog-wide search.
- Out of scope: making the wider-search button open a drawer, catalog-wide product search, category/brand wide-search redesign, moving dropdowns into a drawer, name-search API route, search-result pagination, URL-synced filters, dynamic replacement of hardcoded dropdown options, product card redesign, variants drawer behavior, backend schema changes, new dependencies, test framework setup.

### Dependency On Story 1a

Story 1b assumes Story 1a is already implemented:

- Existing category and brand dropdowns use `/api/catalog/category` and `/api/catalog/brand` for catalog-wide searches.
- API responses use `{ success: true, data }` or `{ success: false, code, message }`.
- Errors expose stable `CAT_*` codes and do not expose Apollo/Strapi internals.
- `Home.tsx` no longer imports `fetchProductsByCategory` or `fetchProductsByBrand` directly after Story 1a.

Do not reintroduce direct server-action imports in Story 1b. Do not move category/brand dropdowns yet; Story 1c owns that drawer redesign. Story 1b only updates the inline dropdown button copy.

## Technical Research

### Affected Areas

Routes/pages:

- `src/app/page.tsx` seeds initial products and current page into `Home`.
- Story 1b should leave `src/app/page.tsx` unchanged unless planning finds a narrow reason.

Feature UI:

- `src/features/Home/Home.tsx` is the main state owner for products, local filter state, selected catalog-wide category/brand, loading flags, and clear behavior.
- `src/features/ProductListing/ProductListing.tsx` owns the grid empty fallback and currently renders `No products available`.
- `src/features/ProductListing/SearchInput.tsx` owns the current local input label and change handling.
- `src/features/ProductListing/DropdownCategories.tsx` and `DropdownBrands.tsx` show selected labels and trigger catalog-wide search callbacks; Story 1b updates their default button copy.
- Story 1b also needs local category/brand controls. Reuse existing dropdown UI patterns if practical, but keep local filter controls visibly distinct from the catalog-wide search dropdowns.

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
- `clearFilters()` currently resets to the `products` prop for the current server-rendered page.
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
- Local text filter active: narrows the current working set by product name.
- Local category filter active: narrows the current working set by product category.
- Local brand filter active: narrows the current working set by product brand.
- Local filters stack: text + category + brand are applied together to the current working set.
- Clear local filters: reset local text/category/brand filters and visible products back to the current working set.
- `Limpiar filtros` is the local-filter reset action in Story 1b. It should not reset catalog-wide category/brand working sets.
- Catalog-wide product-name/category/brand search drawer is not present in this story.

### UI Copy Needs

Existing Spanish copy is accent-light (`Catalogo`, `Categorias`). Preserve app style unless product explicitly requests a broader copy pass.

Story 1b copy decisions:

- Empty default list: `No hay productos disponibles.`
- Empty local filter: `No hay coincidencias en los productos que estás viendo.`
- Wider-search advice: `¿No encontraste lo que buscabas? Amplía la búsqueda al catálogo completo.`
- Wider-search button label: `Buscar en todo el catálogo`
- Category dropdown default: `Buscar categoría en todo el catálogo`
- Brand dropdown default: `Buscar marca en todo el catálogo`
- Clear action remains `Limpiar filtros`.

Local filter control copy can reuse the existing local-filter language:

- Local category filter label: `Filtrar por categoría visible`
- Local brand filter label: `Filtrar por marca visible`

Recommended local empty-state copy options:

1. `No encontramos productos en los resultados visibles.`
2. `No hay coincidencias en los productos que estás viendo.`
3. `Prueba con otro término para filtrar estos resultados.`

Recommended wider-search advice copy options:

1. `Si no ves el producto que necesitas, prueba buscar en todo el catálogo.`
2. `¿No encontraste lo que buscabas? Amplía la búsqueda al catálogo completo.`
3. `Este filtro solo revisa los productos visibles. Busca en todo el catálogo para ver más opciones.`

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
Answer: Yes, and update their default button labels to Spanish copy that makes catalog-wide search clear.
Context: User clarified the dropdowns are catalog-wide search controls, not local filters.
Explanation: Story 1b leaves them in place and updates copy such as `Buscar categoría en todo el catálogo` and `Buscar marca en todo el catálogo`. Story 1c moves them into the wide-search drawer.

II: Question: Should local visible-results filtering clear category/brand wide-search selections, or narrow the active working set after category/brand fetches?
Status: answered
Answer: Narrow the active working set.
Context: Current behavior already filters `allProducts.current`, including category/brand wide-search results.
Explanation: This preserves current behavior and avoids inventing a new filter model.

III: Question: Should local category and brand filters be stackable with local text filtering?
Status: answered
Answer: Yes.
Context: User specified local brand/category filters should be added with the same dropdown logic but filter locally on the results we have, and filters can be stacked.
Explanation: Story 1b applies local text, category, and brand filters together over the current working set.

IV: Question: When users clear the local visible-results filter, where should they return?
Status: answered
Answer: Return to the current working set.
Context: The current working set may be default page products or category/brand wide-search results.
Explanation: Story 1b should not unexpectedly clear wide-search state when only the local filter is cleared.

V: Question: What should `Limpiar filtros` clear in Story 1b?
Status: answered
Answer: Local filters only.
Context: User specified `Limpiar filtros` should be for local filtering.
Explanation: It clears local text/category/brand filters and restores visible products to the current working set, without resetting catalog-wide category/brand results.

VI: Question: Should active filter state be reflected in the URL in Story 1b?
Status: answered
Answer: No.
Context: URL sync was nice-to-have in the parent story.
Explanation: Keep URL-synced filters for a later story.

### UI And Product Decisions

I: Question: What exact Spanish copy should be used for local empty states?
Status: answered
Answer: `No hay coincidencias en los productos que estás viendo.`
Context: User selected option 2 from the recommended local empty-state copy options.
Explanation: This copy keeps the scope clear: the local filter applies only to the products currently visible/loaded. Story 1b also advises users to try catalog-wide search when local filtering does not find the desired product.

II: Question: What Spanish copy should advise users to try wider search?
Status: answered
Answer: `¿No encontraste lo que buscabas? Amplía la búsqueda al catálogo completo.`
Context: Story 1b can show the advice and button affordance, but Story 1c makes the button open the drawer.
Explanation: User selected option 2 from the recommended wider-search advice copy options.

III: Question: Should Spanish accents be normalized in new copy?
Status: answered
Answer: Yes, use correct Spanish accents in new Story 1b copy.
Context: Existing app copy is Spanish but inconsistently accented.
Explanation: Use correct accents for new copy such as `catálogo`, `categoría`, `búsqueda`, and `estás`. Do not do a broad cleanup of existing copy unless product asks for it.

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
- Story 1b updates only the default category/brand dropdown button labels, not the option source or drawer placement.
- Story 1b may show a wider-search advice/button affordance in local empty states, but Story 1c wires it to the drawer.
- Story 1b adds local category and brand filters that can stack with the local text filter.
- `Limpiar filtros` clears local filters only.
- Story 1b does not modify the variants drawer.
- Category and brand wide-search dropdowns remain mutually exclusive while they stay inline.
- Clearing local filters returns to the current working set.
- New Story 1b copy uses correct Spanish accents.
- No new dependencies are needed.

## Research Outcome

- Story 1 should be split: Story 1b handles local visible-results filter state/feedback; Story 1c should handle the catalog-wide search drawer.
- Story 1b has been implemented and is now a baseline for Story 1c.
- Implemented work covers `Home`, ProductListing controls, stacked local text/category/brand filtering, and local empty-state display with wider-search advice.

## Implementation Appendix

Status: implemented

Implementation date: 2026-07-11

Implemented scope:

- Local visible-results filtering is distinct from catalog-wide search.
- Local text, category, and brand filters can stack over the current working set.
- `Limpiar filtros` clears local filters only.
- Empty local filter copy uses `No hay coincidencias en los productos que estás viendo.`
- Wider-search advice uses `¿No encontraste lo que buscabas? Amplía la búsqueda al catálogo completo.`
- Story 1b may show a wider-search button/affordance, but Story 1c owns wiring it to the drawer.
- Category and brand wide-search dropdowns remain inline for now and use clearer catalog-wide labels.
- Story 1c will move category and brand wide-search controls into the catalog-wide search drawer.

Verification expectation for implementation record:

- `pnpm lint`
- `pnpm build`
- Manual desktop/mobile check of stacked local filters, clear-local behavior, and empty-state copy.
