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

## Current Dataset Size

**Known Information:**

- **Total pages: 5 maximum** (Home.tsx:79)
- **Estimated total products: ~250 items** (5 pages × 50 items/page)
- **Page size: 50 products** (fixed in API)
- **Chosen approach: Server-side pagination** with progressive loading

**Impact on Implementation:**

With 5 pages maximum, the dataset is small but well-suited for server-side pagination:

- ✅ **Server-side pagination chosen** - Progressive loading, better SEO
- ✅ Each page load is fast (50 products only)
- ✅ Scales well if dataset grows beyond 250 items
- ✅ URL-based navigation improves shareability
- ✅ Fresh data on each page load
- ⚠️ Page transitions require network request (loading states needed)

**Implementation Strategy:**

- Fetch 50 products at a time based on URL page parameter
- Use `products.length` to determine if more pages exist
- Known total pages: 5 (can show numbered pagination)
- Progressive loading: users only fetch what they view
- Filters will be client-side on current page (or reset to page 1)

## Implementation Approaches

### Option A: Server-Side Pagination ✅ **CHOSEN**

**Pros:**

- Better SEO - each page is a unique URL
- Smaller initial bundle (50 products vs 250)
- Better for large datasets (scales if catalog grows)
- Aligns with Next.js 13+ App Router patterns
- **Can show numbered pagination** - we know total is 5 pages
- Fresh data on each page load
- Progressive loading - users only download what they view

**Cons:**

- Page transitions require server fetch (~200-500ms)
- Loading states needed for transitions
- Filter state lost on pagination unless stored in URL
- More complex filter + pagination interaction
- Cannot filter across all 250 products without fetching all

**Changes Required:**

1. Update fetchProducts to accept page parameter
2. Update page.tsx to accept searchParams for page number
3. Calculate hasNextPage from `products.length === 50 && page < 5`
4. Pass pagination props to Home component
5. Implement router.push() for page changes in Home
6. Add loading states with useTransition

**Why Chosen:**

- Better scalability if product catalog grows
- SEO benefits for product discovery
- Lower memory footprint
- Known total pages allows numbered pagination UI

---

### Option B: Client-Side Pagination (Not Chosen)

**Pros:**

- Faster user experience (no page refresh)
- Easier to maintain filter state
- Current Home component is already client-side
- **Can show accurate numbered pagination for loaded data**
- Works well with current 50-item response
- Instant filtering and pagination

**Cons:**

- Would need to fetch all 250 products upfront (5 API calls)
- Higher initial load time
- More memory usage (250 products in browser)
- Not ideal if dataset grows significantly
- Stale data until page refresh

**Why Not Chosen:**

- User requirements specify progressive loading
- Focus on server-side approach
- Better long-term scalability

---

### Option C: Hybrid Approach (Future Consideration)

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
   export const fetchProducts = async (): Promise<Product[]>

   // To:
   export const fetchProducts = async (page: number = 1): Promise<Product[]> => {
     const client = createApolloClient();
     const res = await client.query<FetchProductsResponse>({
       query: GET_PRODUCTS,
       variables: {
         pagination: {
           page,
           pageSize: 50
         }
       }
     });
     return res?.data?.products ?? [];
   };
   ```

2. **global.types.ts** - Add pagination props for Home component

   ```typescript
   // Add new type for pagination props
   export interface PaginationProps {
     currentPage: number;
     hasNextPage: boolean;
     hasPrevPage: boolean;
     totalPages: number; // We know it's 5 max
   }
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

4. **page.tsx** - Accept searchParams and fetch based on page

   ```typescript
   export default async function MainPage({
     searchParams,
   }: {
     searchParams: { page?: string }
   }) {
     const page = parseInt(searchParams.page || '1', 10);
     const [products, themeFetched] = await Promise.all([
       fetchProducts(page),
       getThemePreference()
     ]);

     // Determine pagination state from products.length
     const hasNextPage = products.length === 50;
     const hasPrevPage = page > 1;
     const totalPages = 5; // We know max is 5

     return (
       <ChangeThemeStoreProvider>
         <div>
           <Header themeFetched={themeFetched} />
           <main className="p-10 flex flex-col gap-10">
             <h1 className="text-4xl font-bold text-center mb-5">Catalogo de productos</h1>
             <Home
               products={products}
               currentPage={page}
               hasNextPage={hasNextPage}
               hasPrevPage={hasPrevPage}
               totalPages={totalPages}
             />
           </main>
         </div>
       </ChangeThemeStoreProvider>
     );
   }
   ```

5. **Home.tsx** - Receive pagination props and implement navigation

   ```typescript
   import { useRouter } from 'next/navigation';

   interface HomeProps {
     products: Product[];
     currentPage: number;
     hasNextPage: boolean;
     hasPrevPage: boolean;
     totalPages: number;
   }

   export const Home = ({
     products,
     currentPage,
     hasNextPage,
     hasPrevPage,
     totalPages
   }: HomeProps) => {
     const router = useRouter();

     const handlePageChange = (page: number) => {
       router.push(`/?page=${page}`);
     };

     // ... rest of component

     return (
       // ...
       <Pagination
         page={currentPage}
         total={totalPages}
         onChange={handlePageChange}
         size="md"
       />
     )
   }
   ```

### Optional

- Add loading states during pagination
- Add error handling for failed page fetches
- Consider URL sync with useSearchParams
- Add pagination controls customization (page size selector)

## Edge Cases & Considerations

1. **Empty Results**: Handle when API returns 0 products (show appropriate message)
2. **Page Out of Bounds**: User navigates to page 6+ (should redirect to last valid page or show error)
3. **Invalid Page Parameter**: Handle non-numeric or negative page values in URL
4. **Filter During Pagination**: User is on page 3, applies filter - should reset to page 1
5. **Concurrent Filters**: Search + Category filter + Pagination interaction - pass in URL
6. **Performance**: Each page change triggers server fetch (add loading states)
7. **Mobile Experience**: Pagination controls on small screens
8. **Data Freshness**: Each page fetch gets latest data from server
9. **Dataset Growth**: Monitor if products exceed 5 pages - implementation already handles it
10. **Back/Forward Navigation**: Browser history should work correctly with URL-based pagination
11. **Direct URL Access**: User can directly access `/?page=3` (must validate page exists)
12. **Loading States**: Show skeleton/spinner during page transitions
13. **Filter State Loss**: Filters may be lost on pagination unless stored in URL

## Recommended Approach

**Server-Side Pagination (Progressive Loading)**

Given the known dataset size of **5 pages maximum (~250 products)**:

**Strategy:**

1. Fetch 50 products at a time from the server based on page parameter
2. Use `products.length` to determine pagination state
3. Server component (page.tsx) fetches products for requested page
4. Pass products and page info to Home.tsx as props
5. Use URL-based pagination (searchParams)
6. Fetch additional pages as user navigates

**Key Implementation Points:**

- ✅ **Initial load**: Fetch page 1 (50 products)
- ✅ **Determine more pages**: If `products.length === 50`, more pages likely exist
- ✅ **Last page detection**: If `products.length < 50`, it's the last page
- ✅ **Total pages calculation**: Pass `hasNextPage` or calculate from products.length
- ✅ **Navigation**: Use searchParams for page number in URL

**Rationale:**

- **Better SEO**: Each page has unique URL for indexing
- **Reduced initial bundle**: Only fetch 50 products at a time
- **Scalable**: Works well if dataset grows beyond 250 items
- **Server-side filtering**: Can add API filters later without refactoring
- **Progressive loading**: Users only download what they need
- **Aligns with Next.js 13+ patterns**: Server Components with searchParams

**Trade-offs:**

- ⚠️ Page transitions require server fetch (loading states needed)
- ⚠️ Filters will require URL params or separate approach
- ⚠️ Cannot show exact "Page X of Y" without fetching all pages
- ⚠️ Users lose filter state on pagination unless passed in URL

**Determining Pagination from products.length:**

```typescript
// In page.tsx after fetching
const products = await fetchProducts(page);
const hasNextPage = products.length === 50; // Full page = more data exists
const hasPrevPage = page > 1;

// Pass to Home component
<Home
  products={products}
  currentPage={page}
  hasNextPage={hasNextPage}
  hasPrevPage={hasPrevPage}
  totalPagesKnown={5} // Since we know max is 5
/>
```

## Implementation Sequence

### Server-Side Pagination (Chosen Approach):

**Phase 1: Setup Server-Side Pagination**

1. Update `fetchProducts` in global.lib.ts to accept `page` parameter
2. Update page.tsx to accept and parse `searchParams.page`
3. Fetch products for the requested page
4. Calculate `hasNextPage` from `products.length`
5. Update HomeProps interface to include pagination props
6. Pass products, currentPage, hasNextPage to Home component

**Phase 2: Update Home Component** 7. Receive pagination props in Home component 8. Update Pagination component with calculated total pages 9. Implement page change handler using Next.js navigation 10. Add loading states during page transitions 11. Handle edge cases (page out of bounds, no products)

**Phase 3: Handle Filters** 12. Decide on filter strategy: - Option A: Reset to page 1 when filters applied - Option B: Pass filters in URL params for server-side filtering 13. Implement filter + pagination interaction 14. Test all combinations of filters and pagination

**Phase 4: Polish & Testing** 15. Add loading skeletons 16. Test all 5 pages 17. Verify last page detection (products.length < 50) 18. Mobile responsiveness 19. Browser back/forward navigation

### Alternative: Client-Side Pagination (Not chosen):

1. Update fetchProducts to accept page parameter
2. Update page.tsx to accept searchParams for page number
3. Implement logic to detect last page (response.length < 50)
4. Pass hasNextPage indicator to Home component
5. Use "Next/Previous" buttons instead of numbered pagination
6. Handle loading states between page fetches

## API Contract Verification Needed

- [x] Confirm GraphQL API does NOT return meta.pagination structure
- [x] PageSize is fixed at 50 (global.lib.ts)
- [x] **Total pages: 5 maximum (Home.tsx:79)**
- [x] **Estimated total products: ~250 items**
- [ ] Test API response with different page numbers (pages 2-5)
- [ ] Confirm last page (page 5) returns < 50 items or exactly 50
- [ ] Verify PaginationArg accepts page parameter for all 5 pages

## Implementation Details

### Server-Side Pagination Implementation (Chosen Approach)

**For the 5-page dataset with progressive loading:**

This approach provides:

- SEO-friendly URLs for each page
- Reduced initial load (only 50 products)
- Scalability if dataset grows
- Fresh data on each page load
- Known total pages (5) for numbered pagination

**Key Principle:** Use `products.length` to determine pagination state

---

### 1. Update fetchProducts in global.lib.ts

```typescript
// Add page parameter, keep pageSize fixed at 50
export const fetchProducts = async (page: number = 1): Promise<Product[]> => {
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

---

### 2. Update page.tsx to Handle searchParams

```typescript
export default async function MainPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  // Parse and validate page number
  const pageParam = searchParams.page;
  const page = pageParam ? Math.max(1, Math.min(5, parseInt(pageParam, 10))) : 1;

  // Fetch products for the requested page
  const [products, themeFetched] = await Promise.all([
    fetchProducts(page),
    getThemePreference()
  ]);

  // Determine pagination state from products.length
  const hasNextPage = products.length === 50 && page < 5;
  const hasPrevPage = page > 1;
  const totalPages = 5; // We know max is 5

  return (
    <ChangeThemeStoreProvider>
      <div>
        <Header themeFetched={themeFetched} />
        <main className="p-10 flex flex-col gap-10">
          <h1 className="text-4xl font-bold text-center mb-5">
            Catalogo de productos
          </h1>
          <Home
            products={products}
            currentPage={page}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            totalPages={totalPages}
          />
        </main>
      </div>
    </ChangeThemeStoreProvider>
  );
}
```

**Key Points:**

- Validate page is between 1 and 5
- `hasNextPage` is true if we got 50 products AND not on page 5
- Pass all pagination props to Home component

---

### 3. Update global.types.ts

```typescript
// Add pagination props interface
export interface PaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalPages: number;
}

// Optional: Can merge into HomeProps directly
```

---

### 4. Update Home.tsx Component

```typescript
"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button, Pagination, useDisclosure } from "@heroui/react"

import { CategoriesList, Product } from "@/shared/types/global.types"
import { ProductListing } from "../ProductListing/ProductListing"
import { DropdownCategories } from "../ProductListing/DropdownCategories"
import { SearchInput } from "../ProductListing/SearchInput"
import { ProductVariantsDrawer } from "../ProductVariantsDrawer/ProductVariantsDrawer"

interface HomeProps {
  products: Product[];
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  totalPages: number;
}

export const Home = ({
  products,
  currentPage,
  hasNextPage,
  hasPrevPage,
  totalPages
}: HomeProps) => {
  const router = useRouter();
  const allProducts = useRef<Product[]>(products)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products)
  const [selectedCategory, setSelectedCategory] = useState<CategoriesList | null>(null)
  const [productDetails, setProductDetails] = useState<Product | null>(null)

  const {isOpen, onOpen, onOpenChange} = useDisclosure();

  // Handle pagination - navigate to new page
  const handlePageChange = (page: number) => {
    router.push(`/?page=${page}`);
    // Optional: scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateSelectedCategory = (newCategory: CategoriesList) => {
    setSelectedCategory(newCategory)
    // Filter logic here
    setFilteredProducts(allProducts.current)
    // TODO: Reset to page 1 when filter changes
    // router.push('/?page=1')
  }

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      if (selectedCategory) {
        setFilteredProducts(allProducts.current)
      } else {
        setFilteredProducts(allProducts.current)
      }
      return
    }

    let searchFiltered = allProducts.current.filter((prod) =>
      prod.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    setFilteredProducts(searchFiltered)
    // TODO: Reset to page 1 when search changes
    // router.push('/?page=1')
  }

  const clearFilters = () => {
    setSelectedCategory(null)
    setFilteredProducts(allProducts.current)
    // TODO: Reset to page 1
    // router.push('/?page=1')
  }

  const handleProductClick = (product: Product) => {
    setProductDetails(product)
    onOpen()
  }

  return (
    <>
      <div>
        <SearchInput onSearch={handleSearch} />
        <div className="flex gap-3 items-center mb-5">
          <span>Todos los filtros:</span>
          <Button onPress={clearFilters}>Limpiar filtros</Button>
          <DropdownCategories updateSelectedCategory={updateSelectedCategory} />
        </div>
      </div>

      {/* Display the 50 products for current page */}
      <ProductListing
        products={filteredProducts}
        handleProductClick={handleProductClick}
      />

      {/* Pagination with known total pages */}
      <div className="w-full flex justify-center">
        <Pagination
          page={currentPage}
          total={totalPages}
          onChange={handlePageChange}
          size="md"
        />
      </div>

      { productDetails && (
        <ProductVariantsDrawer
          product={productDetails}
          isOpen={isOpen}
          onOpenChange={onOpenChange}
        />
      )}
    </>
  )
}
```

**Key Changes:**

- Added `useRouter` for navigation
- Receive pagination props from server
- `handlePageChange` navigates to new URL with page parameter
- Pagination component uses `page` and `total` props
- Filters should reset to page 1 (commented TODOs)

---

### 5. Filter Handling Strategy

**Challenge:** Filters are client-side, but pagination is server-side.

**Options:**

**Option A: Reset to Page 1 on Filter (Recommended for MVP)**

```typescript
const handleSearch = (searchTerm: string) => {
  // ... filter logic
  setFilteredProducts(filtered);

  // Reset to page 1 when filter changes
  if (currentPage !== 1) {
    router.push("/?page=1");
  }
};
```

**Option B: Pass Filters in URL (Better for complex filtering)**

```typescript
const handleSearch = (searchTerm: string) => {
  const params = new URLSearchParams();
  params.set("page", "1"); // Reset to page 1
  if (searchTerm) params.set("search", searchTerm);
  if (selectedCategory) params.set("category", selectedCategory);

  router.push(`/?${params.toString()}`);
};

// In page.tsx, pass search params to API
const searchTerm = searchParams.search;
const category = searchParams.category;
// Apply server-side filtering
```

**Option C: Client-Side Pagination for Filtered Results**

- When filters are active, paginate the filtered results client-side
- Only use server-side pagination when no filters are applied
- More complex but better UX

---

### 6. Loading States

**Add loading UI during page transitions:**

```typescript
"use client"
import { useRouter } from "next/navigation"
import { useTransition } from "react"

export const Home = ({ ... }: HomeProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handlePageChange = (page: number) => {
    startTransition(() => {
      router.push(`/?page=${page}`);
    });
  };

  return (
    <>
      {/* Show loading overlay when isPending */}
      {isPending && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="animate-spin ...">Loading...</div>
        </div>
      )}

      {/* Rest of component */}
    </>
  )
}
```

---

### 7. Key Formulas

**Determining hasNextPage:**

```typescript
const hasNextPage = products.length === 50 && page < totalPages;
```

**Why both conditions:**

- `products.length === 50`: Full page means more data might exist
- `page < totalPages`: Prevents going beyond known max (5 pages)

**Validating Page Number:**

```typescript
const page = Math.max(1, Math.min(totalPages, parseInt(pageParam, 10) || 1));
```

**Pagination Component Props:**

```typescript
<Pagination
  page={currentPage}        // Current page from server
  total={totalPages}        // Known max: 5
  onChange={handlePageChange} // Navigate to new page
  size="md"
/>
```

## Testing Checklist

### Server-Side Pagination (Chosen Approach):

**Core Pagination Functionality:**

- [ ] Page 1 loads correctly by default (no page param in URL)
- [ ] All 5 pages accessible (/?page=1 through /?page=5)
- [ ] Each page shows 50 products (or less on last page)
- [ ] Pagination component shows correct current page highlight
- [ ] Page parameter correctly passed to API on each navigation
- [ ] URL updates correctly with page parameter (/?page=X)
- [ ] Browser back/forward buttons work correctly
- [ ] Direct URL access works (e.g., directly visiting /?page=3)

**Edge Cases:**

- [ ] Invalid page numbers handled (page=0, page=6, page=abc)
- [ ] Negative page numbers redirect to page 1
- [ ] Pages beyond 5 redirect to page 5 or show error
- [ ] Page 1 has "Previous" button disabled or hidden
- [ ] Last page (page 5) detection: hasNextPage = false when products.length < 50
- [ ] Empty results (0 products) handled gracefully

**Loading States:**

- [ ] Loading indicator shows during page transitions
- [ ] useTransition properly indicates pending navigation
- [ ] No flash of wrong content during page change
- [ ] Skeleton or spinner displayed while fetching

**Filter + Pagination Interaction:**

- [ ] Filters work on current page's 50 products
- [ ] Applying filter resets to page 1 (if implemented)
- [ ] Search resets pagination to page 1 (if implemented)
- [ ] Clear filters returns to page 1 with all products
- [ ] Filter state preserved when navigating pages (if in URL)
- [ ] Empty filter results show appropriate message

**Mobile & Accessibility:**

- [ ] Pagination controls usable on mobile screens
- [ ] Touch targets adequate size for mobile
- [ ] Pagination component responsive
- [ ] Loading states clear on slow connections

**Performance:**

- [ ] Each page load < 1 second on average connection
- [ ] No unnecessary re-renders on page change
- [ ] Images lazy loaded
- [ ] Server-side rendering working correctly

**products.length Detection:**

- [ ] Verify page 1-4 return exactly 50 products each
- [ ] Verify last page returns < 50 products (or exactly 50 if 250 total)
- [ ] hasNextPage calculated correctly: `products.length === 50 && page < 5`
- [ ] hasPrevPage calculated correctly: `page > 1`

## Performance Considerations

### For Server-Side Pagination (5 pages, 50 products each):

**Approach:**

- Fetch only requested page (50 products) per request
- Progressive loading as user navigates
- Total data transferred over 5 page visits: ~250 products

**Performance Metrics:**

| Metric                       | Value                |
| ---------------------------- | -------------------- |
| Initial page load (page 1)   | 200-800ms            |
| Subsequent page loads        | 200-500ms            |
| Products per request         | 50 items             |
| Estimated payload per page   | ~50-100KB            |
| Memory usage                 | Low (~50KB active)   |
| Network requests per session | 1-5 (based on usage) |

**Optimizations:**

**Essential:**

- ✅ Add loading states (useTransition) for page transitions
- ✅ Implement error boundaries for failed fetches
- ✅ Validate page parameter server-side (prevent invalid requests)
- ✅ Lazy load product images
- ✅ Add loading skeletons for better perceived performance

**Recommended:**

- Consider caching pages in sessionStorage/localStorage
- Prefetch next page on hover/focus of pagination button
- Add stale-while-revalidate caching strategy
- Optimize images (Next.js Image component)
- Monitor Core Web Vitals (LCP, FID, CLS)

**Not Needed:**

- ❌ Virtual scrolling - only 50 items per page
- ❌ Complex state management - server props sufficient
- ❌ Client-side caching library - sessionStorage adequate
- ❌ Debouncing pagination - server handles load

**Scaling Considerations:**

If dataset grows beyond 10 pages (500 products):

- Current approach still works well
- Consider adding search/filter to API (server-side filtering)
- May need to implement page size selection (25/50/100 items)
- products.length detection remains reliable for hasNextPage

**Trade-offs vs Client-Side:**

| Aspect             | Server-Side      | Client-Side (250 upfront) |
| ------------------ | ---------------- | ------------------------- |
| Initial load       | Fast (50 items)  | Slower (250 items)        |
| Page transitions   | Slower (network) | Instant                   |
| Memory usage       | Low (50 items)   | Higher (250 items)        |
| SEO                | Excellent        | Good                      |
| Data freshness     | Always fresh     | Stale until refresh       |
| Scalability        | Excellent        | Limited                   |
| Filter performance | Depends          | Instant                   |

**Monitoring:**

- Track API response times for each page
- Monitor page transition perceived performance
- Watch for failed page fetches (retry logic needed)
- Ensure pages 1-5 all load successfully
- Verify products.length detection accuracy
