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

## Implementation Approaches

### Option A: Server-Side Pagination (Recommended for SEO)

**Pros:**

- Better SEO - each page is a unique URL
- Smaller initial bundle
- Better for large datasets
- Aligns with Next.js 13+ patterns

**Cons:**

- Full page refresh on page change
- Loses filter state unless passed in URL
- More complex URL state management

**Changes Required:**

1. Convert page.tsx to accept searchParams for page number
2. Pass page number to fetchProducts
3. Fetch total count from API
4. Update Home to use URL-based pagination
5. Modify GraphQL query to return meta information

### Option B: Client-Side Pagination (Current component structure)

**Pros:**

- Faster user experience (no page refresh)
- Easier to maintain filter state
- Current Home component is already client-side

**Cons:**

- Fetches all data upfront OR requires client-side data fetching
- Not ideal for very large datasets
- SEO implications if not properly handled

**Changes Required:**

1. Add page state to Home component
2. Implement pagination handler
3. Fetch total count from API
4. Decide: Fetch all data upfront vs. fetch on page change

### Option C: Hybrid Approach

- Initial server render with page 1
- Client-side fetching for subsequent pages
- Best of both worlds but more complex

## Key Technical Decisions Needed

### 1. GraphQL API Response Structure

**Current:** Returns only products array
**Needed:**

```typescript
{
  products: Product[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    }
  }
}
```

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
   fetchProducts(page?: number, pageSize?: number): Promise<{products: Product[], meta: PaginationMeta}>
   ```

2. **global.types.ts** - Add pagination types

   ```typescript
   export type PaginationMeta = {
     page: number;
     pageSize: number;
     pageCount: number;
     total: number;
   };
   export interface FetchProductsResponse {
     products: Product[];
     meta: { pagination: PaginationMeta };
   }
   ```

3. **global.queries.ts** - Update GraphQL query

   ```graphql
   query GetProductsQuery($pagination: PaginationArg) {
     products(pagination: $pagination) {
       # ... existing fields
       meta {
         pagination {
           page
           pageSize
           pageCount
           total
         }
       }
     }
   }
   ```

4. **Home.tsx** - Add pagination logic
   - useState for current page
   - onChange handler for Pagination component
   - Logic to reset page on filter changes
   - Update total prop to use actual total from API

5. **page.tsx** - Update to pass pagination metadata
   - Fetch and pass pagination info to Home component

### Optional

- Add loading states during pagination
- Add error handling for failed page fetches
- Consider URL sync with useSearchParams
- Add pagination controls customization (page size selector)

## Edge Cases & Considerations

1. **Empty Results**: What happens when filter returns 0 results?
2. **Page Out of Bounds**: User navigates to page 10 but only 5 pages exist
3. **Filter During Pagination**: User is on page 3, applies filter - should reset to page 1
4. **Concurrent Filters**: Search + Category filter + Pagination interaction
5. **Performance**: 50 items per page - is this optimal for UX?
6. **Mobile Experience**: Pagination controls on small screens

## Recommended Approach

**Client-Side Pagination with Progressive Enhancement**

1. Fetch larger initial dataset (e.g., 100-200 products)
2. Paginate client-side in Home component
3. Apply filters client-side
4. If dataset grows, migrate to server-side later

**Rationale:**

- Current Home component is already client-side
- Simpler implementation
- Better UX with instant pagination/filtering
- Products dataset likely manageable size
- Can optimize later if needed

## Implementation Sequence

1. Update GraphQL query to return pagination metadata
2. Update types to support pagination response
3. Update fetchProducts to accept and return pagination info
4. Update page.tsx to fetch and pass metadata to Home
5. Add pagination state to Home component
6. Connect Pagination component onChange handler
7. Implement page change logic (slice filteredProducts array)
8. Add logic to reset page on filter/search changes
9. Test edge cases
10. Consider adding loading states

## API Contract Verification Needed

- [ ] Confirm Strapi API returns `meta.pagination` structure
- [ ] Verify PaginationArg accepts page and pageSize
- [ ] Test API response with different page numbers
- [ ] Confirm total count accuracy

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

1. **Update page.tsx to accept searchParams:**

   ```typescript
   export default async function MainPage({
     searchParams,
   }: {
     searchParams: { page?: string };
   }) {
     const page = parseInt(searchParams.page || "1", 10);
     const { products, meta } = await fetchProducts(page, 10);
     // Pass meta to Home
   }
   ```

2. **Update fetchProducts:**

   ```typescript
   export const fetchProducts = async (
     page: number = 1,
     pageSize: number = 50,
   ): Promise<{ products: Product[]; meta: PaginationMeta }> => {
     // ... implementation
   };
   ```

3. **Use next/navigation for page changes:**

   ```typescript
   import { useRouter } from "next/navigation";

   const router = useRouter();
   const handlePageChange = (page: number) => {
     router.push(`/?page=${page}`);
   };
   ```

## Testing Checklist

- [ ] Pagination displays correct number of pages
- [ ] Page changes show correct products
- [ ] Filter resets pagination to page 1
- [ ] Search resets pagination to page 1
- [ ] Clear filters resets pagination to page 1
- [ ] Last page shows correct number of items (may be less than pageSize)
- [ ] Empty filter results show 0 pages
- [ ] Pagination controls disabled when only 1 page
- [ ] Mobile view pagination is usable

## Performance Considerations

- If fetching all products upfront, consider implementing virtualization for large lists
- Monitor bundle size impact of pagination library
- Consider lazy loading images in ProductCard components
- Add loading skeleton states for better perceived performance
