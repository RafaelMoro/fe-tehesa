# Planning: Improve PLP Local Filter State And Feedback

Source research: `ai-research/plp-filter-state-feedback.story1b.md`

Sign-off status: signed off in research doc; all open questions marked answered.

Sign-off date: 2026-07-11

Assumptions:

- Story 1a catalog API routes and envelope helpers are already available.
- Category and brand dropdowns remain inline and catalog-wide until Story 1c.
- Clearing local text/category/brand filters returns to the current working set, not necessarily the original page products.
- New Story 1b copy uses correct Spanish accents; no broad copy cleanup.
- No new dependencies, test framework, API routes, URL-synced filters, drawer work, or backend changes.

## Acceptance Criteria

1. Users can see when the local visible-results filter is active.
2. Users can filter the current working set locally by product text, category, and brand.
3. Local text, category, and brand filters can be stacked together and apply only to the current working set.
4. `Limpiar filtros` clears local text/category/brand filters without resetting catalog-wide category/brand results unexpectedly.
5. Empty local filter results render Spanish user-facing copy instead of `No products available`, including guidance to try catalog-wide search if the desired product is not visible.
6. Existing catalog-wide category and brand dropdowns remain in place, keep their current catalog-wide search behavior, and use Spanish button copy that indicates catalog-wide category/brand search until Story 1c moves them into the wide-search drawer.

## Affected Files

### `src/app/**`

- No planned source changes.
- `src/app/page.tsx` remains unchanged; it still seeds page products and preserves the hardcoded 5-page ceiling.

### `src/app/api/**`

- No planned source changes.
- Existing `/api/catalog/category` and `/api/catalog/brand` behavior remains the catalog-wide source for the inline dropdowns.

### `src/features/**`

- `src/features/Home/Home.tsx`
- `src/features/ProductListing/ProductListing.tsx`
- `src/features/ProductListing/SearchInput.tsx`
- `src/features/ProductListing/DropdownCategories.tsx`
- `src/features/ProductListing/DropdownBrands.tsx`

### `src/components/**`

- No planned source changes.

### `src/shared/**`

- No planned source changes.
- Existing `fetchCatalog` and `catalogErrorToSpanish` stay as-is; Story 1b adds no API contract.

### `src/zustand/**`

- No planned source changes.
- Do not add filter state to Zustand.

### Docs/config

- No planned config or docs changes beyond this planning doc.
- No `REPO_CONTEXT.md` update needed; current repo context already records the relevant catalog data flow and local filtering behavior.

## Phase 1: Parent-Owned Local Filter State

### Changes Required

`src/features/Home/Home.tsx`

- Action: Modify.
- Location: near existing `filteredProducts`, `handleSearch`, category/brand handlers, `clearFilters`, and `SearchInput` render.
- Add parent state for local filters, e.g. `localSearchTerm`, `localCategory`, and `localBrand`.
- Derive active local filter state from any non-empty local text/category/brand value; do not create a separate boolean that can drift.
- Add a small `applyLocalFilters(nextFilters)` function inside `Home` that filters `allProducts.current` by text, category, and brand together.
- Update `handleSearch(searchTerm: string)` so it stores the term and calls the shared local filter application.
- Keep filtering purely client-side against `allProducts.current`: text by product name, category by `product.category.name`, and brand by `product.brand.name`.
- When category or brand catalog-wide fetch succeeds, reset all local filters and show the fetched working set.
- Keep category/brand mutual exclusivity exactly as today.
- Make `clearFilters()` local-only for Story 1b: reset `localSearchTerm`, `localCategory`, `localBrand`, and `filteredProducts` to `allProducts.current`; do not clear `selectedCategory` or `selectedBrand`.
- Pass `value={localSearchTerm}` to `SearchInput` so parent resets update the input field.

Edge cases:

- Clearing local filters while a catalog-wide category or brand result is active must keep `selectedCategory` or `selectedBrand` intact.
- Changing server page products through pagination should reset `allProducts.current`, `filteredProducts`, selected catalog-wide category/brand, and all local filters.
- Pagination remains hidden while category or brand is active and remains based on the existing `totalPages` prop.

Rationale: `SearchInput` currently owns the input text, so `Home` cannot clear only local filtering without remount tricks or resetting wider catalog state.

`src/features/ProductListing/SearchInput.tsx`

- Action: Modify.
- Location: component props and input value handling.
- Replace internal `useState` ownership with a controlled `value: string` prop plus existing `onSearch(searchTerm: string)` callback.
- Keep `onChange` calling `onSearch(e.target.value)`.
- Keep current HeroUI `TextField`, `Label`, `Input`, and `FieldError` structure.
- Optional copy refinement only if desired by implementer: label/placeholder can stay `Buscar producto`; do not broaden copy beyond Story 1b.

Edge cases:

- Preserve the component as a client component because it handles input events.

### Success Criteria

Automated:

- `pnpm lint`
- `pnpm build`

Manual:

- Desktop: type a product-name term and confirm the list narrows without a network request for product search.
- Desktop: select a catalog-wide category, apply local text/category/brand filters, click `Limpiar filtros`, and confirm catalog-wide category results return without clearing category selection.
- Desktop: select a catalog-wide brand, apply local text/category/brand filters, click `Limpiar filtros`, and confirm catalog-wide brand results return without clearing brand selection.
- Mobile: repeat the local filter clear flow and confirm controls remain usable.

### Verification Coverage

| Area/File                                     | Coverage/check areas                                                                                                                          | Verification reference                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `src/features/Home/Home.tsx`                  | parent-owned local filters, stacked filter derivation, local clear preserving working set, catalog-wide category/brand reset of local filters | manual browser checks + `pnpm lint` + `pnpm build` |
| `src/features/ProductListing/SearchInput.tsx` | controlled input value, change callback, parent reset reflected in field                                                                      | manual browser checks + `pnpm lint`                |

## Phase 2: Local Category And Brand Filters

### Changes Required

`src/features/Home/Home.tsx`

- Action: Modify.
- Location: JSX around existing filter controls and handlers near `handleSearch`, `handleCategorySelect`, and `handleBrandSelect`.
- Add handlers such as `handleLocalCategorySelect(categoryNameOrId: string)` and `handleLocalBrandSelect(brandNameOrId: string)` that update local filter state and call the shared stacked-filter function.
- Render local category and brand dropdown controls near the text search, visually grouped as local filters and separate from catalog-wide search controls.
- Use copy from research for local filter controls: `Filtrar por categoría visible` and `Filtrar por marca visible`.
- Keep the existing catalog-wide dropdowns in place and still wired to `/api/catalog/category` and `/api/catalog/brand` through the current handlers.
- `Limpiar filtros` should sit with the local controls because it clears local filters only.

Edge cases:

- Local category and brand filters must be stackable with each other and with the text filter.
- Local filter values should compare against the product data already in `allProducts.current`; do not fetch Strapi taxonomy for local filtering.
- If hardcoded dropdown `customId` values do not match `product.category.name` / `product.brand.name`, map selected dropdown items back to their display `name` before filtering.

`src/features/ProductListing/DropdownCategories.tsx`

- Action: Modify.
- Location: props interface and default button text.
- Add an optional `defaultLabel?: string` prop so the same dropdown can be reused for both local and catalog-wide category controls.
- Keep existing default behavior for catalog-wide use when `defaultLabel` is not passed.
- Do not change option source or API behavior.

`src/features/ProductListing/DropdownBrands.tsx`

- Action: Modify.
- Location: props interface and default button text.
- Add an optional `defaultLabel?: string` prop so the same dropdown can be reused for both local and catalog-wide brand controls.
- Keep existing default behavior for catalog-wide use when `defaultLabel` is not passed.
- Do not change option source or API behavior.

### Success Criteria

Automated:

- `pnpm lint`
- `pnpm build`

Manual:

- Desktop: filter the current page by text, then local category, then local brand; confirm results only shrink from the current working set.
- Desktop: select a catalog-wide category, then stack local text/category/brand filters over those fetched results.
- Desktop: click `Limpiar filtros` and confirm only local text/category/brand filters clear; catalog-wide category/brand selection remains.
- Mobile: confirm local and catalog-wide dropdown groups are visually distinct and usable.

### Verification Coverage

| Area/File                                            | Coverage/check areas                                                                             | Verification reference                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| `src/features/Home/Home.tsx`                         | stacked local text/category/brand filtering, local-only clear, catalog-wide context preservation | manual browser checks + `pnpm lint` + `pnpm build` |
| `src/features/ProductListing/DropdownCategories.tsx` | reusable default label, selected category display unchanged, no API behavior change              | manual browser checks + `pnpm lint`                |
| `src/features/ProductListing/DropdownBrands.tsx`     | reusable default label, selected brand display unchanged, no API behavior change                 | manual browser checks + `pnpm lint`                |

## Phase 3: Visible Filter Feedback And Empty States

### Changes Required

`src/features/Home/Home.tsx`

- Action: Modify.
- Location: JSX around `SearchInput`, filter controls, and `ProductListing` render.
- Render a small active local-filter indicator only when any local text/category/brand filter is active.
- Indicator copy should make scope clear, e.g. `Filtrando productos visibles` plus concise chips/labels for active text, category, and brand filters.
- Add a small popover next to the indicator copy explaining the scope of the local filter. Recommended copy: `Este filtro solo busca en los productos que estás viendo.`
- Render the local-only clear action near that indicator or local controls, using the existing `Limpiar filtros` copy.
- Do not add a separate broad reset button in Story 1b.
- Pass empty-state props into `ProductListing`, including whether the local filter is active and a callback or affordance for clearing the local filter if needed.

Edge cases:

- If the local text term is whitespace only and no local category/brand is selected, do not show the active indicator or local empty state.
- The wider-search button affordance may be present but must not open a drawer in Story 1b.

`src/features/ProductListing/ProductListing.tsx`

- Action: Modify.
- Location: props interface and `products.length === 0` branch.
- Add a prop such as `isLocalFilterActive: boolean`.
- Optional minimal props if needed for the empty-state action: `onClearLocalFilter?: () => void`.
- Replace English fallback with Spanish default empty copy when no local filter is active: `No hay productos disponibles.`
- When local filter is active, render:
  - `No hay coincidencias en los productos que estás viendo.`
  - `¿No encontraste lo que buscabas? Amplía la búsqueda al catálogo completo.`
  - A non-wired affordance button labeled `Buscar en todo el catálogo`, or omit the button if implementer judges non-functional controls too misleading; the advice copy is required either way.
  - A local clear button only if it helps meet AC4 from the empty state.
- Preserve the existing product grid and `ProductCard` behavior when products exist.

Edge cases:

- Default empty state can occur from an empty initial page, empty category result, or empty brand result; only the local-filter empty state gets wider-search guidance.
- Do not add telemetry, drawer state, search API calls, or route changes for the wider-search affordance.

Rationale: The empty branch currently cannot distinguish default empty catalogs from local-filter misses.

### Success Criteria

Automated:

- `pnpm lint`
- `pnpm build`

Manual:

- Desktop: enter a term that yields zero matches in the current working set and confirm the Spanish local empty copy appears.
- Desktop: confirm the local empty state mentions trying the full catalog.
- Desktop: clear the local filter from the active indicator or empty state and confirm current category/brand working set remains active.
- Mobile: confirm the active indicator, local clear action, and empty copy fit without hiding the dropdowns.

### Verification Coverage

| Area/File                                        | Coverage/check areas                                                                    | Verification reference                             |
| ------------------------------------------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `src/features/Home/Home.tsx`                     | active filter feedback visibility, local clear action, props passed to listing          | manual browser checks + `pnpm lint` + `pnpm build` |
| `src/features/ProductListing/ProductListing.tsx` | Spanish default empty copy, local empty copy, wider-search guidance, no grid regression | manual browser checks + `pnpm lint`                |

## Phase 4: Catalog-Wide Dropdown Copy

### Changes Required

`src/features/ProductListing/DropdownCategories.tsx`

- Action: Modify.
- Location: default button text expression near `selectedCategoryObj?.name ?? 'Categorias'`.
- Change only the default unselected button copy to `Buscar categoría en todo el catálogo`.
- Keep selected-category display as the category name.
- Keep hardcoded `CATEGORIES_PRODUCTS`, `onAction`, and catalog-wide callback behavior unchanged.

`src/features/ProductListing/DropdownBrands.tsx`

- Action: Modify.
- Location: default button text expression near `selectedBrandObj?.name ?? 'Marcas'`.
- Change only the default unselected button copy to `Buscar marca en todo el catálogo`.
- Keep selected-brand display as the brand name.
- Keep hardcoded `BRANDS_PRODUCTS`, `onAction`, and catalog-wide callback behavior unchanged.

Edge cases:

- Longer labels may wrap on mobile; keep the controls in the existing flex row unless a tiny responsive class adjustment is required for usability.
- Do not replace hardcoded options with live taxonomy fetches in this story.

### Success Criteria

Automated:

- `pnpm lint`
- `pnpm build`

Manual:

- Desktop: confirm the category and brand dropdown default labels explicitly mention searching the full catalog.
- Desktop: select a category/brand and confirm the selected option name still replaces the default label.
- Mobile: confirm longer dropdown labels remain usable.

### Verification Coverage

| Area/File                                            | Coverage/check areas                                                           | Verification reference              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------- |
| `src/features/ProductListing/DropdownCategories.tsx` | default Spanish catalog-wide label, selected label unchanged, action unchanged | manual browser checks + `pnpm lint` |
| `src/features/ProductListing/DropdownBrands.tsx`     | default Spanish catalog-wide label, selected label unchanged, action unchanged | manual browser checks + `pnpm lint` |

## Cross-Cutting Concerns

- Server/client boundary: keep all changes in existing client components; do not import `src/shared/lib/global.lib.ts` into client code.
- Data contract: no GraphQL or API route changes; category/brand fetches continue through `fetchCatalog<Product[]>` and Story 1a envelopes.
- Local filter scope: search must continue filtering only `allProducts.current`, which may be page products, category-wide results, or brand-wide results.
- Pagination: preserve the hardcoded 5-page ceiling and hide pagination while category or brand is active.
- Responsive UI: verify controls on mobile because the longer catalog-wide labels can affect wrapping.
- Spanish copy: use the exact signed-off copy from research for empty states and dropdown defaults.
- Local filter controls: keep local category/brand controls visually distinct from catalog-wide category/brand search controls.

## Open Questions / Out-of-Scope Items

Open questions:

- None. Research questions are answered.

Out of scope:

- Catalog-wide product-name search.
- Moving category/brand controls into a drawer.
- Wiring `Buscar en todo el catálogo` to a drawer or API call.
- URL-synced filters.
- Replacing hardcoded category/brand option lists.
- Adding a broad reset that clears catalog-wide category/brand selections.
- Product-card or variants-drawer redesign.
- Backend schema, GraphQL query, API route, or envelope changes.
- New dependencies or test framework setup.

## Decisions Beyond The Research Doc

- Plan makes `SearchInput` controlled by `Home` so clearing local filtering can update the visible field without resetting catalog-wide state.
- Plan changes `Limpiar filtros` to local-only per updated research; no broad reset is planned.
- Plan allows the wider-search button affordance to be omitted if non-functional UI would mislead users; the signed-off guidance copy remains required.
- Plan reuses existing category/brand dropdown components with an optional label prop instead of adding new local dropdown files.
