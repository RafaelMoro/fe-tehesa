# Plan: Category Filtering for Product Catalog

## TL;DR

Integrate the existing `DropdownCategories` component into the Home page to enable category-based filtering. When a category is selected, fetch filtered products using `fetchProductsByCategory` server action. The "Limpiar filtros" button will reset to show all products from the current page.

## Steps

1. **Update Home component to import required dependencies**
   - Import `DropdownCategories` component from `@/features/ProductListing/DropdownCategories`
   - Import `fetchProductsByCategory` server action from `@/shared/lib/global.lib`
   - Import `CategoriesList` type from `@/shared/types/global.types`

2. **Add category state management in Home component** (_parallel with step 1_)
   - Add state: `selectedCategory` to track current category selection (string | null)
   - Add state: `isLoadingCategory` to show loading state during category fetch (boolean)

3. **Implement category selection handler** (_depends on step 2_)
   - Create `handleCategorySelect` async function that:
     - Accepts `categoryCustomId` from DropdownCategories
     - Sets `isLoadingCategory` to true
     - Calls `fetchProductsByCategory(categoryCustomId)`
     - Updates both `allProducts.current` and `filteredProducts` with results
     - Sets `selectedCategory` state to track active category
     - Sets `isLoadingCategory` to false
     - Handles errors gracefully (console.error + show fallback)

4. **Update clearFilters function** (_depends on step 2_)
   - Reset `selectedCategory` to null
   - Reset `filteredProducts` to `products` prop (original server-fetched data)
   - Reset `allProducts.current` to `products` prop
   - Keep existing search reset logic

5. **Render DropdownCategories in Home UI** (_depends on step 1, 3_)
   - Add `<DropdownCategories updateSelectedCategory={handleCategorySelect} />` next to "Limpiar filtros" button
   - Position in existing flex container with SearchInput and clear button
   - Add loading indicator if `isLoadingCategory` is true (optional enhancement)

6. **Update useEffect to handle category state on page change** (_depends on step 2_)
   - When `products` prop changes (page navigation), reset category filter
   - Reset `selectedCategory` to null
   - This ensures category filter doesn't persist across pagination (matches search behavior)

## Relevant Files

- `src/features/Home/Home.tsx` — Add category state, import DropdownCategories, implement `handleCategorySelect`, update `clearFilters`, render DropdownCategories in UI (lines 1-10 for imports, lines 20-30 for state, lines 66-77 for UI rendering)
- `src/features/ProductListing/DropdownCategories.tsx` — Already implemented, will be integrated as-is with `updateSelectedCategory` callback
- `src/shared/lib/global.lib.ts` — `fetchProductsByCategory` function (lines 24-44) will be called from client component
- `src/shared/queries/global.queries.ts` — `GET_PRODUCTS_BY_CATEGORY` query (lines 34-50) is already defined and used by `fetchProductsByCategory`
- `src/shared/types/global.types.ts` — `CATEGORIES_PRODUCTS` array (lines 11-44) provides the 8 available categories, `CategoriesList` type for type safety

## Verification

1. **Category filtering works**: Select a category from dropdown, verify products update to show only items in that category
2. **Reset functionality**: Click "Limpiar filtros" button, verify all products from current page are shown again
3. **Pagination interaction**: With category selected, navigate to page 2, verify behavior (expected: category filter persists OR resets - see Decisions)
4. **Search + Category interaction**: Select category, then use search input, verify search filters within the category-filtered results
5. **Empty state**: Select a category with no products, verify empty state message displays correctly
6. **Loading state**: Select category, verify UI shows loading feedback (if implemented)

## Decisions

**Pagination + Category interaction:**

- **Selected Approach**: When user changes page, reset category filter and show all products from new page. This keeps behavior consistent with search (which also doesn't persist across pages) and simplifies the implementation.

**Search + Category interaction:**

- When category is active, search will filter within category-filtered products (current behavior preserved since search operates on `allProducts.current`)

**Error handling:**

- `fetchProductsByCategory` already has try-catch, returns empty array on error
- Home component should handle empty results gracefully (ProductListing already shows "No products available")

## Further Considerations

1. **Loading UX**: Should we show a loading spinner or skeleton during category fetch? Current implementation has no loading indicators for search.
   - **Recommendation**: Add simple loading state (Button disabled + loading spinner) for better UX, since server fetch can take time.

2. **Category persistence**: Should selected category persist in URL (e.g., `?page=1&category=tornilleria`) for shareable links?
   - **Recommendation**: Not in initial implementation. Can be added later if needed.

3. **Multiple filters**: Should users be able to combine category + search, or should category selection clear search?
   - **Recommendation**: Allow combination (current implementation supports this naturally).
