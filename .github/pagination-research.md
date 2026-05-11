# Pagination Implementation Research for Home Component

## Current State Analysis

### Data Flow

1. **Server Component** (page.tsx:8) - Fetches products on initial load
   ```typescript
   fetchProducts(); // Returns Product[]
   ```
2. **Client Component** (Home.tsx) - Receives products as props, manages filtering
3. **Pagination UI** (Home.tsx:79) - Static, non-functional
   ```tsx
   <Pagination initialPage={1} total={5} size="md" />
   ```

### Current fetchProducts Implementation (global.lib.ts:13-17)

```typescript
variables: {
  pagination: {
    page: 1,        // Hardcoded
    pageSize: 50    // Hardcoded
  }
}
```

### GraphQL Query (global.queries.ts)

- Currently returns only product array
- No pagination metadata (totalCount, pageInfo, hasNextPage, etc.)
- Uses PaginationArg type (Strapi convention)

## API Constraints

**Critical Limitation:** The GraphQL API does NOT return pagination metadata.

- ✅ API accepts: `page` and `pageSize` parameters
- ✅ Fixed page size: 50 items (global.lib.ts:14-17)
- ❌ No total count available
- ❌ No page count available
- ❌ No hasNextPage flag

**Determining Last Page:**
The only way to know if there are more pages is to check the response length:

- Response with 50 items = more pages may exist
- Response with < 50 items = last page reached

**Implications:**

- Cannot jump to arbitrary page numbers without fetching all previous pages
- Cannot show "Page X of Y" without fetching all pages
- Best suited for "Next/Previous" navigation or client-side pagination
- Total product count unknown until all pages fetched

## Implementation Approaches

### Option A: Server-Side Pagination

**Pros:**

- Better SEO - each page is a unique URL
- Smaller initial bundle
- Better for large datasets
- Aligns with Next.js 13+ patterns

**Cons:**

- Full page refresh on page change
- Loses filter state unless passed in URL
- More complex URL state management
- **API limitation: Cannot show numbered pages or total count**
- Must use "Next/Previous" navigation only

**Changes Required:**

1. Convert page.tsx to accept searchParams for page number
2. Pass page number to fetchProducts
3. Detect last page by checking response length < 50
4. Update Home to use URL-based "Next/Previous" navigation
5. Cannot show "Page X of Y" format

### Option B: Client-Side Pagination (Recommended)

**Pros:**

- Faster user experience (no page refresh)
- Easier to maintain filter state
- Current Home component is already client-side
- **Can show accurate numbered pagination for loaded data**
- Works well with current 50-item response

**Cons:**

- Limited to data fetched from server (initially 50 items)
- Not ideal for datasets > 200 items
- Requires full page refresh to load more data
- Not ideal for very large datasets
- SEO implications if not properly handled

**Changes Required:**

1. Add page state to Home component
2. Implement pagination handler
3. Calculate pages from filteredProducts.length
4. Display smaller chunks (e.g., 10 items per page) from the 50 fetched items
5. Reset to page 1 when filters change

### Option C: Hybrid Approach

- Initial server render with page 1 (50 items)
- Client-side pagination for those 50 items
- "Load More" button to fetch additional pages if needed
- More complex but handles growth well

**Note:** Given API constraint (no total count), this is most flexible for future scaling

## Key Technical Decisions Needed

### 1. GraphQL API Response Structure

**Current:** Returns only products array

**Note:** GraphQL API does NOT return meta information. Pagination will be determined by:

- Page size is fixed at 50 items (global.lib.ts:14-17)
- If response returns < 50 items, it's the last page
- No total count available from API

This means:

- Must fetch pages sequentially to determine total pages
- Cannot jump to arbitrary page numbers without fetching previous pages
- "Next page" button can only be enabled if current page returned 50 items
- Total page count unknown until last page is reached

### 2. Filter + Pagination Interaction

- When user searches/filters, should reset to page 1
- Need to decide how to apply filters:
  - Client-side: filter from all fetched data
  - Server-side: pass filters to API

### 3. State Management

- Page number state
- Filtered products state
- Total pages/count state
- Loading state during page transitions

## Files Requiring Changes

### Must Modify

1. **global.lib.ts** - Update fetchProducts signature

   ```typescript
   // From:
   fetchProducts(): Promise<Product[]>
   // To:
   fetchProducts(page?: number): Promise<Product[]>

   // page defaults to 1, pageSize is fixed at 50
   // Returns fewer than 50 items if it's the last page
   ```

2. **global.types.ts** - No changes needed

   ```typescript
   // FetchProductsResponse already correct - only returns products array
   export interface FetchProductsResponse {
     products: Product[];
   }

   // No PaginationMeta needed since API doesn't return it
   ```

3. **global.queries.ts** - No changes needed

   ```graphql
   # Query already correct - does not fetch meta information
   query GetProductsQuery($pagination: PaginationArg) {
     products(pagination: $pagination) {
       # ... existing fields (brand, category, name, etc.)
     }
   }
   ```

4. **Home.tsx** - Add pagination logic
   - useState for current page
   - useState to track if more pages exist (hasNextPage)
   - onChange handler for Pagination component
   - Logic to reset page on filter changes
   - Disable "next" if last page returned < 50 items
   - Cannot show total pages (unknown until all fetched)

5. **page.tsx** - Consider fetching strategy
   - Option A: Fetch only page 1, let Home handle subsequent pages client-side
   - Option B: Fetch multiple pages server-side, pass indicator of more pages
   - Need to decide on server vs client pagination approach

### Optional

- Add loading states during pagination
- Add error handling for failed page fetches
- Consider URL sync with useSearchParams
- Add pagination controls customization (page size selector)

## Edge Cases & Considerations

1. **Empty Results**: What happens when filter returns 0 results?
2. **Page Out of Bounds**: Not applicable for client-side pagination (calculated from filtered results)
3. **Filter During Pagination**: User is on page 3, applies filter - should reset to page 1
4. **Concurrent Filters**: Search + Category filter + Pagination interaction
5. **Performance**: 50 items loaded, displaying 10 per page is optimal for UX
6. **Mobile Experience**: Pagination controls on small screens
7. **Data Freshness**: Server fetches page 1 only on initial load, changes require refresh
8. **Large Dataset**: If products grow beyond 50, need "Load More" or fetch additional pages

## Recommended Approach

**Client-Side Pagination (Best for current requirements)**

1. Fetch initial dataset from API (page 1, 50 items - current implementation)
2. Paginate client-side in Home component with smaller page size (e.g., 10 items per page)
3. Apply filters client-side on the fetched dataset
4. Use HeroUI Pagination component with calculated total pages

**Rationale:**

- Current Home component is already client-side
- Simpler implementation - no API changes needed
- Better UX with instant pagination/filtering (no loading states)
- API limitation (no total count) makes numbered pagination difficult server-side
- 50 items is manageable for client-side operations
- Can show accurate page numbers from loaded data
- If dataset grows beyond 50, can implement "Load More" or fetch additional pages

**Future Consideration:**
If the product catalog grows significantly (>200 items), migrate to server-side with "Next/Previous" navigation since API doesn't provide total count.

## Implementation Sequence

### For Client-Side Pagination (Recommended):

1. Decide on items per page for UI (e.g., 10)
2. Add pagination state to Home component (currentPage)
3. Calculate pagination from filteredProducts array
4. Connect Pagination component onChange handler
5. Implement page change logic (slice filteredProducts array)
6. Add logic to reset page on filter/search changes
7. Test edge cases
8. Consider adding loading states

### For Server-Side Pagination (Future consideration):

1. Update fetchProducts to accept page parameter
2. Update page.tsx to accept searchParams for page number
3. Implement logic to detect last page (response.length < 50)
4. Pass hasNextPage indicator to Home component
5. Use "Next/Previous" buttons instead of numbered pagination
6. Handle loading states between page fetches

## API Contract Verification Needed

- [x] Confirm GraphQL API does NOT return meta.pagination structure
- [x] PageSize is fixed at 50 (global.lib.ts)
- [ ] Test API response with different page numbers
- [ ] Confirm last page returns < 50 items
- [ ] Verify PaginationArg accepts page parameter

## Implementation Details

### Client-Side Pagination Implementation

For client-side pagination, the Home component needs:

1. **State Management:**

   ```typescript
   const [currentPage, setCurrentPage] = useState(1);
   const itemsPerPage = 10; // or make this configurable
   ```

2. **Calculate Pagination:**

   ```typescript
   const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
   const startIndex = (currentPage - 1) * itemsPerPage;
   const endIndex = startIndex + itemsPerPage;
   const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
   ```

3. **Page Change Handler:**

   ```typescript
   const handlePageChange = (page: number) => {
     setCurrentPage(page);
     // Optional: scroll to top
     window.scrollTo({ top: 0, behavior: "smooth" });
   };
   ```

4. **Reset Page on Filter:**

   ```typescript
   // In updateSelectedCategory, handleSearch, clearFilters:
   setCurrentPage(1);
   ```

5. **Update Pagination Component:**

   ```tsx
   <Pagination
     initialPage={1}
     page={currentPage}
     total={totalPages}
     onChange={handlePageChange}
     size="md"
   />
   ```

6. **Render Paginated Products:**
   ```tsx
   <ProductListing
     products={paginatedProducts}
     handleProductClick={handleProductClick}
   />
   ```

### Server-Side Pagination Implementation

For server-side pagination (if chosen later):

**Important:** Without total count from API, use "Next/Previous" navigation instead of numbered pages.

1. **Update page.tsx to accept searchParams:**

   ```typescript
   export default async function MainPage({
     searchParams,
   }: {
     searchParams: { page?: string };
   }) {
     const page = parseInt(searchParams.page || "1", 10);
     const products = await fetchProducts(page);
     const hasNextPage = products.length === 50; // Full page = more pages exist
     // Pass hasNextPage to Home
   }
   ```

2. **Update fetchProducts:**

   ```typescript
   export const fetchProducts = async (
     page: number = 1,
   ): Promise<Product[]> => {
     const client = createApolloClient();
     const res = await client.query<FetchProductsResponse>({
       query: GET_PRODUCTS,
       variables: {
         pagination: {
           page,
           pageSize: 50, // Fixed
         },
       },
     });
     return res?.data?.products ?? [];
   };
   ```

3. **Use next/navigation for page changes:**

   ```typescript
   import { useRouter } from "next/navigation";

   const router = useRouter();
   const handleNextPage = () => {
     router.push(`/?page=${currentPage + 1}`);
   };
   const handlePrevPage = () => {
     router.push(`/?page=${currentPage - 1}`);
   };
   ```

4. **Simplified Pagination UI:**
   ```tsx
   <div className="flex gap-2">
     <Button isDisabled={currentPage === 1} onPress={handlePrevPage}>
       Previous
     </Button>
     <span>Page {currentPage}</span>
     <Button isDisabled={!hasNextPage} onPress={handleNextPage}>
       Next
     </Button>
   </div>
   ```

## Testing Checklist

### Client-Side Pagination:

- [ ] Pagination displays correct number of pages based on filtered results
- [ ] Page changes show correct products
- [ ] Filter resets pagination to page 1
- [ ] Search resets pagination to page 1
- [ ] Clear filters resets pagination to page 1
- [ ] Last page shows correct number of items (may be less than itemsPerPage)
- [ ] Empty filter results show 0 pages or appropriate message
- [ ] Pagination controls disabled when only 1 page
- [ ] Mobile view pagination is usable

### Server-Side Pagination (if implemented):

- [ ] "Previous" button disabled on page 1
- [ ] "Next" button disabled when response has < 50 items
- [ ] Page parameter correctly passed to API
- [ ] Loading states show during page transitions
- [ ] URL updates correctly with page parameter
- [ ] Browser back/forward buttons work correctly

## Performance Considerations

- If fetching all products upfront, consider implementing virtualization for large lists
- Monitor bundle size impact of pagination library
- Consider lazy loading images in ProductCard components
- Add loading skeleton states for better perceived performance
