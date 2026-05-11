# Plan: Brand Filtering for Product Catalog

## TL;DR

Create brand filtering functionality similar to the existing category filtering. Add a new `DropdownBrands` component that allows users to filter products by brand using the `fetchProductsByBrand` server action. Hide pagination when either category or brand filters are active.

## Steps

1. **Create new DropdownBrands component** (_parallel with step 2_)
   - Create `src/features/ProductListing/DropdownBrands.tsx`
   - Mirror structure of `DropdownCategories.tsx` component
   - Import `BRANDS_PRODUCTS` from `@/shared/types/global.types`
   - Accept props: `selectedBrand: string | null` and `updateSelectedBrand: (brandCustomId: string) => void`
   - Find selected brand object to display `brand.name` in button trigger
   - Map through `BRANDS_PRODUCTS` to create dropdown items with `customId` as key and `name` as display text
   - Use same HeroUI components: Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger
   - Default button text: "Marcas" when no brand selected

2. **Update Home component imports** (_parallel with step 1_)
   - Import `DropdownBrands` component from `@/features/ProductListing/DropdownBrands`
   - Import `fetchProductsByBrand` server action from `@/shared/lib/global.lib`

3. **Add brand state management in Home component** (_depends on step 2_)
   - Add state: `selectedBrand` to track current brand selection (string | null)
   - Add state: `isLoadingBrand` to show loading state during brand fetch (boolean)

4. **Implement brand selection handler** (_depends on step 3_)
   - Create `handleBrandSelect` async function that:
     - Accepts `brandCustomId` from DropdownBrands
     - Sets `isLoadingBrand` to true
     - Calls `fetchProductsByBrand(brandCustomId)`
     - Updates both `allProducts.current` and `filteredProducts` with results
     - Sets `selectedBrand` state to track active brand
     - Resets `selectedCategory` to null (only one filter type active at a time)
     - Sets `isLoadingBrand` to false
     - Handles errors gracefully (console.error + show fallback)

5. **Update category handler to reset brand** (_depends on step 3_)
   - Modify `handleCategorySelect` to reset `selectedBrand` to null when category is selected
   - Ensures only one filter type is active at a time

6. **Update clearFilters function** (_depends on step 3_)
   - Reset `selectedBrand` to null (in addition to existing category reset)
   - Keep existing logic to reset to `products` prop

7. **Update useEffect to handle brand state on page change** (_depends on step 3_)
   - When `products` prop changes (page navigation), reset `selectedBrand` to null
   - Keep existing logic for resetting category

8. **Render DropdownBrands in Home UI** (_depends on step 1, 4_)
   - Add `<DropdownBrands selectedBrand={selectedBrand} updateSelectedBrand={handleBrandSelect} />` in the filters container
   - Position next to `DropdownCategories` component in the flex container
   - Update "Limpiar filtros" button to disable when `isLoadingBrand` is true (in addition to `isLoadingCategory`)

9. **Hide pagination when filters are active** (_depends on step 3_)
   - Add conditional rendering logic to pagination section
   - Hide when `selectedCategory !== null || selectedBrand !== null`
   - Show pagination only when both filters are null (showing default paginated products)

## Relevant Files

- **NEW FILE**: `src/features/ProductListing/DropdownBrands.tsx` — New component mirroring DropdownCategories structure
- `src/features/Home/Home.tsx` — Add brand state, import DropdownBrands, implement `handleBrandSelect`, update `handleCategorySelect`, update `clearFilters`, render DropdownBrands, add pagination conditional logic (lines 1-11 for imports, lines 27-28 for state, lines 66-81 for category handler update, lines 83-88 for clearFilters, lines 99-102 for UI, lines 105-112 for pagination)
- `src/shared/lib/global.lib.ts` — `fetchProductsByBrand` function (lines 50-74) will be called from client component
- `src/shared/queries/global.queries.ts` — `GET_PRODUCTS_BY_BRAND` query (lines 52-68) is already defined and used by `fetchProductsByBrand`
- `src/shared/types/global.types.ts` — `BRANDS_PRODUCTS` array (lines 46-74) provides the 6 available brands, `BrandsList` type for type safety

## Verification

1. **Brand filtering works**: Select a brand from dropdown, verify products update to show only items from that brand
2. **Reset functionality**: Click "Limpiar filtros" button, verify all products from current page are shown and both dropdowns reset
3. **Pagination hidden**: Select a category or brand, verify pagination component is hidden
4. **Pagination shown**: Clear all filters, verify pagination is visible again
5. **Category then Brand**: Select category, then select brand - verify brand filter replaces category filter (category dropdown resets)
6. **Brand then Category**: Select brand, then select category - verify category filter replaces brand filter (brand dropdown resets)
7. **Search + Brand interaction**: Select brand, then use search input, verify search filters within the brand-filtered results
8. **Empty state**: Select a brand with no products, verify empty state message displays correctly
9. **Loading states**: Select brand, verify UI shows loading feedback (button disabled)

## Decisions

**Category + Brand interaction:**

- **Selected Approach**: Filters work independently but mutually exclusive. When user selects a brand after selecting a category, the brand filter replaces the category filter (and vice versa). Only one filter type (category OR brand) can be active at a time. This simplifies the implementation and UX.

**Pagination behavior:**

- Hide pagination entirely when any filter is active (category OR brand)
- Show pagination only when viewing default unfiltered products
- This matches the behavior where filtered results show all matching products (no pagination)

**Search + Brand interaction:**

- When brand is active, search will filter within brand-filtered products (current behavior preserved since search operates on `allProducts.current`)

**Error handling:**

- `fetchProductsByBrand` already has try-catch, returns empty array on error
- Home component should handle empty results gracefully (ProductListing already shows "No products available")

## Further Considerations

1. **Combined filters**: Current plan allows only one filter at a time. Should users be able to filter by both category AND brand simultaneously?
   - **Recommendation**: Start with single filter (simpler). Can enhance later by modifying server actions to accept both filters.

2. **Clear individual filters**: Should there be a way to clear just the category or just the brand without clearing everything?
   - **Recommendation**: Not in initial implementation. "Limpiar filtros" clears all filters at once.

3. **Filter state in URL**: Should selected filters persist in URL (e.g., `?category=tornilleria&brand=bohrcraft`) for shareable links?
   - **Recommendation**: Not in initial implementation. Can be added later if needed.

4. **Filter priority indicator**: Should the UI indicate which filter is currently active more prominently?
   - **Recommendation**: The selected dropdown button already shows the active filter name, which should be sufficient.
