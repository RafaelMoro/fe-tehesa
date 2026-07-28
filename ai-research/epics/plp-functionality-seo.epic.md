# PLP Functionality And SEO Epic Research

## Story Definition

### Epic Title

Improve PLP functionality, product discovery, and SEO readiness.

### Epic Description

Enhance the product listing page so users can discover products more reliably through search, filters, pagination, product detail signals, and SEO-friendly catalog behavior.

Visual design is explicitly out of scope for this research. Visual treatment will be handled by a separate tool. This epic focuses on functional behavior, interaction states, technical constraints, must-have features, and nice-to-have improvements.

### Scope Assessment

This is an epic, not a single story.

It spans multiple deliverables across the catalog route, client PLP state, server actions, Strapi GraphQL reads, product cards, product variants drawer, SEO metadata, and future measurement hooks.

### Epic Acceptance Criteria

1. The PLP has clear, independently deliverable stories for search/filtering, pagination/loading, product detail signals, SEO, and analytics/conversion readiness.
2. Each story has 2-5 testable acceptance criteria and can be implemented without requiring unrelated stories first.
3. The research documents current frontend-visible Strapi contract limits and does not assume backend changes are available.
4. Verification guidance uses existing repo commands only: `pnpm lint`, `pnpm build`, and `pnpm exec tsc --noEmit` when relevant.
5. Open product and backend questions are tracked rather than converted into invented requirements.

## Epic Structure

### Story 1: Improve PLP Search And Filtering Behavior

Description: Make catalog discovery behavior predictable by separating local visible-result filtering from catalog-wide product search, category filters, brand filters, empty states, and filter reset flows. Add proper input cleansing to prevent SQL injection and other injection-style attacks reaching the Strapi backend through the existing server-action flow.

Acceptance criteria:

1. Users can understand which search/filter inputs are active and clear them without losing the current catalog context unexpectedly.
2. Empty search/filter results show Spanish user-facing copy instead of generic fallback text.
3. Category and brand filter behavior is explicit: either mutually exclusive as today or combined only if product requirements confirm it.
4. Filter loading and failure states are represented in the UI instead of silently leaving stale results.
5. The UI clearly separates `Filtrar resultados visibles` from `Buscar en todo el catalogo` so users understand when they are narrowing shown results versus querying Strapi by product name.
6. All user-supplied inputs (name search term, category id, brand id, page number, page size) are validated and sanitized before reaching the Strapi GraphQL layer. Reject or escape values that could carry GraphQL injection payloads, control characters, or excessively long strings; fail fast on invalid input instead of forwarding it.

Must-have notes:

- Preserve current source of category and brand options unless the backend contract is confirmed.
- Keep one clear filter model; do not add complex query-builder behavior without product need.
- Present the catalog search as a recovery path after local filtering: `No encontraste el producto que buscas? Buscalo en todo el catalogo.`
- Keep the visible-results filter close to the product grid controls and label it as narrowing already loaded results.
- Input cleansing rules: trim whitespace, cap length (e.g. 100 chars for name, sane numeric bounds for ids and page numbers), strip control characters, and reject values containing GraphQL-significant characters such as `{`, `}`, unescaped quotes, or newlines when used as a `contains` filter value. Use a small allowlist validator rather than building a regex blacklist.

Nice-to-have notes:

- Sync active filters into URL parameters for shareability and back/forward behavior.
- Add count or summary text for the active result set if the data contract can support it.
- Add a small helper line under each input: `Filtra los productos que ya estas viendo` and `Busca coincidencias por nombre en el catalogo`.

### Story 1a: Create Catalog API Route For Current GraphQL Calls

Description: Create a thin Next.js API route layer that handles the product GraphQL calls currently made through server actions. This story is API-only and does not change PLP UI, search controls, filter UX, or client behavior.

Acceptance criteria:

1. A Next.js Route Handler exists under `src/app/api/catalog/` or an equivalent catalog API path.
2. The API supports the GraphQL-backed product reads currently present in the repo: products by page, products by category, products by brand, and product variants by product document id.
3. The API reuses `src/app/apollo-client.ts` so `STRAPI_HOST` and `STRAPI_API_TOKEN` remain the single Strapi connection contract.
4. Request parameters are validated before GraphQL variables are built, including page, page size, category id, brand id, and product document id.
5. Responses are shaped as JSON with predictable success and error envelopes so future UI work does not parse Apollo/Strapi internals.
6. Existing server actions in `src/shared/lib/global.lib.ts` remain in place and continue to be the production path until a later story intentionally migrates callers.

Must-have notes:

- Keep this API layer thin; do not add query-builder behavior.
- Do not update Home/ProductListing UI in this story.
- Reuse existing GraphQL queries where possible.
- Preserve existing server actions until a later migration story.

### Story 2: Improve Pagination, Loading, And Navigation Feedback

Description: Make page navigation reliable, understandable, and resilient while replacing the current 5-page ceiling with response-length-based next-page detection.

Acceptance criteria:

1. Page URLs continue to support direct navigation with `?page=N` and prevent invalid page navigation without relying on a hardcoded 5-page ceiling.
2. Users receive loading feedback during page transitions and filter fetches.
3. Pagination behavior remains hidden or intentionally adapted when category or brand filters are active.
4. Browser back/forward behavior remains predictable for paginated catalog pages.
5. Empty page or failed fetch states do not render a broken or misleading PLP.

Must-have notes:

- Replace the hardcoded 5-page ceiling because Strapi CMS inspection shows 333 products, which requires 7 pages at 50 products per page.
- Keep page size 50 for product list queries unless the API contract changes.
- Infer next page from response length: 50 products means another page may exist; fewer than 50 means last page.

Nice-to-have notes:

- Prefetch adjacent pages only if performance data shows page transitions are slow.
- Add result range copy like "Mostrando pagina 2" without claiming total counts the API does not provide.

### Story 3: Improve Product Detail Signals On Cards And Drawer

Description: Help users decide which product to inspect by improving functional product metadata, image-aware card variants, and variant detail behavior.

Acceptance criteria:

1. Product cards consistently show available backend-provided signals: name, category, brand, variant count, min price, max price, and product image when available.
2. The PLP supports two card versions or states: one for products with images and one for products without images.
3. The variants drawer communicates loading, empty, and error states for variant fetches.
4. Variant prices remain sorted numerically and formatted consistently.
5. Drawer actions use clear Spanish labels aligned with the intended PLP flow.

Must-have notes:

- Treat images as unfinished because product image rendering is commented out and currently references localhost Strapi URLs.
- Do not invent product availability, stock, SKU, or shipping data; those fields are not present in current queries.
- The no-image card must not look broken or reserve misleading image space unless visual design explicitly requires it.
- The image card depends on confirming Strapi image fields and Next image host configuration.

Nice-to-have notes:

- Add product image rendering when Strapi image URLs and Next image host configuration are confirmed.
- Add variant attributes beyond diameter only if the current GraphQL contract exposes them.

### Story 4: Improve PLP SEO Readiness

Description: Make the catalog route more search-engine friendly using current App Router capabilities and crawlable server-rendered product content.

Acceptance criteria:

1. The catalog page has accurate Spanish metadata instead of MVP placeholder metadata.
2. Paginated PLP URLs have a deliberate SEO strategy for title/description and indexability.
3. Product listing content remains server-rendered enough for crawlers to see product names and basic metadata.
4. Filter/search URL strategy is decided before making filtered states indexable.
5. Structured data is added only if required fields can be populated from current product data without fabricating values.

Must-have notes:

- Existing root metadata is placeholder: title `Tehesa MVP`, description `Esto es un MVP de Tehesa`.
- Current route is only `/`; there are no category, brand, or product detail routes.

Nice-to-have notes:

- Add category/brand landing routes later if product wants crawlable taxonomy pages.
- Add JSON-LD only after confirming schema type and required fields such as URL, image, offer, price currency, and availability.

### Story 5: Analytics And Conversion Readiness

Description: Prepare PLP interactions for measurement without adding analytics tooling prematurely.

Acceptance criteria:

1. Product defines which PLP interactions matter: local filter changes, catalog searches, searched terms, returned products, filter select, clear filters, pagination, product detail open, and drawer action clicks.
2. Event names and payload fields are documented before any analytics dependency is introduced.
3. Implementation can be added later through a small adapter or native browser event pattern without coupling UI components to a vendor.
4. No new analytics package is added until a provider is selected.

Must-have notes:

- There is no analytics dependency or existing event tracking in `package.json`.
- Avoid speculative tracking abstractions until the provider and event contract exist.
- Catalog search analytics should register the searched term, search type (`name`, `category`, `brand`), result count when reliable, and returned product identifiers when available.

Nice-to-have notes:

- Add lightweight console/dev instrumentation during implementation only if useful for manual verification.
- Add conversion-oriented CTA behavior after product defines the next step beyond viewing variants.
- Track which returned products users open after catalog search to connect search terms with product-detail intent.

## Technical Research

### Affected Areas

Routes/pages:

- `src/app/page.tsx` renders `/`, awaits `searchParams`, clamps `page` to `1..5`, fetches products and theme preference in parallel, and passes products, `currentPage`, and `totalPages` to `Home`.
- `src/app/layout.tsx` defines root metadata and currently contains a TODO to change metadata.

API route handlers:

- `src/app/api/preferences/route.ts` is the only API route and is theme-only. It should not be used for PLP data.

Feature UI:

- `src/features/Home/Home.tsx` is the client catalog controller for search, category/brand filters, pagination navigation, and drawer state.
- `src/features/ProductListing/ProductListing.tsx` renders the product grid and an empty fallback.
- `src/features/ProductListing/SearchInput.tsx` keeps local search input state and calls `onSearch` on every change.
- `src/features/ProductListing/DropdownCategories.tsx` renders hardcoded category options from shared types.
- `src/features/ProductListing/DropdownBrands.tsx` renders hardcoded brand options from shared types.
- `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` fetches variants on drawer open, formats/sorts prices, and displays a table.

Shared product card:

- `src/components/ProductCard.tsx` renders category, brand, name, variant count, and min/max price. Product image code is commented out.
- `src/components/ProductCard.tsx` should become image-aware once the Strapi image contract is confirmed: render an image card when image data exists and a no-image card when it does not.

Shared code:

- `src/shared/lib/global.lib.ts` contains server actions for product list, category filter, brand filter, variants, and theme cookie persistence.
- `src/shared/queries/global.queries.ts` contains GraphQL operations for product list, filtered product list, and product variants.
- `src/shared/types/global.types.ts` contains product/domain types and hardcoded category/brand lists.
- `src/shared/utils/global.utils.ts` contains currency formatting and theme preference API helper.
- `src/shared/hooks/useMediaQuery.tsx` provides breakpoint booleans without live resize updates.

Zustand theme state:

- `src/zustand/provider/change-theme.provider.tsx` and `src/zustand/store/change-theme.store.ts` are theme-only and not directly in PLP functional scope.

Tests:

- No test framework or `pnpm test` script is configured.
- Research and future verification should use lint, build, and TypeScript checks only unless a later story explicitly adds tests.

### Existing Patterns To Follow

- Keep App Router server/client split: server route fetches initial catalog data, client feature controls interactive state.
- Preserve server actions in `src/shared/lib/global.lib.ts` and per-call Apollo client creation from `src/app/apollo-client.ts`.
- Keep GraphQL operations in `src/shared/queries/global.queries.ts`.
- Keep domain UI in `src/features/<Feature>/`; keep cross-cutting helpers and types in `src/shared/`.
- Keep HeroUI components and Tailwind v4 class styling.
- Preserve Spanish UI copy unless a localization story changes it.
- Preserve next-themes and Zustand theme provider patterns; PLP functionality should not introduce unrelated global state.

### Current Data Contract Observed

Product list query returns:

- `brand.name`
- `category.name`
- `name`
- `maxPrice`
- `minPrice`
- `variantCount`
- `documentId`

Recently provided product example also includes:

- `description`
- `subcategory`
- `hasOneProductVariant`

Example product data can have `category: null`, `subcategory: null`, and `description: ""`, so product cards and SEO work must tolerate missing taxonomy and empty descriptive content.

Filtered product queries return the same effective product card fields.

Proposed catalog-wide name search query:

```graphql
query SearchProductsByName($filters: ProductFiltersInput) {
  products(filters: $filters) {
    maxPrice
    minPrice
    name
    documentId
    brand {
      name
    }
    category {
      name
    }
  }
}
```

Provided variables:

```json
{
  "filters": {
    "name": {
      "contains": "Juego de llave"
    }
  }
}
```

Recommended implementation note:

- Add `variantCount` to the proposed query if the returned products will render through the existing `ProductCard`, because the card already displays variant count when present.

Variant query returns:

- `product.product_variants.diameter`
- `product.product_variants.pricing.price`

Pagination behavior:

- Product list uses `pagination: { page, pageSize: 50 }`.
- Category filter uses page 1 and page size 50.
- Brand filter uses page 1 and page size 50.
- Variant list uses page 1 and page size 100.
- No pagination metadata is queried or documented in the repo.
- Strapi CMS inspection reports 333 products to list, so 50 products per page implies 7 catalog pages if all products must be reachable.
- Without pagination metadata, next-page availability should be inferred from result count: exactly 50 results means a next page may exist; fewer than 50 means the current page is the last page.

### Current Behavior Summary

- Initial PLP load fetches one page of 50 products from Strapi.
- Page number is read from `?page=` and clamped between 1 and 5.
- Search filters the current working set in memory by `product.name` only.
- Search does not query Strapi and does not reset page to 1.
- Proposed visible-results filter should keep this behavior and be named as a filter, not as catalog search.
- Proposed catalog search should call Strapi with `name contains`, replace the working set with matching products, and mark server search as active.
- Catalog search should likely clear category and brand filters unless combined filtering is explicitly approved.
- Category and brand filters query Strapi and replace the current working set.
- Category and brand filters are mutually exclusive in current state logic.
- Filtered category/brand result sets hide pagination.
- Clear filters resets to the products originally passed to `Home` for the current page.
- Product detail drawer fetches variants when opened and clears variants when closed.

### Target Search And Filter Model

Local visible-results filtering:

- Filters only products already fetched into the current working set.
- Should support combining name, category, and brand locally.
- Should not require pagination for local-only filtering because it cannot reach products outside the loaded working set.
- Best label: `Filtrar resultados visibles`.
- Helper text: `Filtra por nombre, categoria o marca los productos que ya estas viendo`.

Catalog API search:

- Fetches products from Strapi by name coincidence, category, or brand.
- Should be presented in a separate drawer opened by a button, not as the same input as local filtering.
- Button/drawer copy option 1: `No encontraste el producto que buscas? Buscalo en todo el catalogo.`
- Button/drawer copy option 2: `No encontraste lo que buscabas? Explora mas productos.`
- Button/drawer copy option 3: `Amplia tu busqueda: busca por producto, categoria o marca.`
- Should support pagination when the API search is by category or brand and response length is 50.
- Name coincidence search should also use response-length pagination if the query accepts `pagination`; otherwise it should avoid claiming complete results.
- Best labels: `Buscar producto en catalogo`, `Buscar por categoria en catalogo`, and `Buscar por marca en catalogo`.
- Avoid wording like `Filtra tu resultado` for the drawer trigger because this action searches the catalog through the API, while filtering is reserved for already visible results.

URL state recommendation:

- Recommended for catalog API searches because repeated searches and shared links should reopen the same result set without requiring the user to return to PLP and reapply controls.
- Optional for local visible-results filters; keep them in client state unless product explicitly wants shareable local filtering.
- Minimum useful URL state is catalog search type and value, for example name/category/brand query params. Avoid encoding purely visual state.

### Verification Rules To Follow

- Use `pnpm lint` for ESLint validation when implementation changes TS/TSX.
- Use `pnpm build` for production build and integrated type checking when implementation affects app behavior.
- Use `pnpm exec tsc --noEmit` for standalone TypeScript validation when useful.
- Do not run nonexistent tests.
- Do not run `pnpm install` during research.

### Dependencies And Integration Points

- New dependencies require both `package.json` and `pnpm-lock.yaml` changes and should be avoided unless necessary.
- Strapi environment variables are `STRAPI_HOST` and `STRAPI_API_TOKEN`.
- Current Apollo client sends `Authorization: Bearer ${STRAPI_API_TOKEN}` to `STRAPI_HOST`.
- Prompt sync uses `pnpm sync:prompts`; this research did not edit command prompts, so no sync is needed.
- PRs target `develop` and need exactly one release label among `major`, `minor`, or `patch`.

### Backend Improvement Notes

Reliable product counts:

- Current frontend cannot know a reliable total product count from GraphQL responses.
- Current workaround is response-length inference: 50 results means another page may exist; fewer than 50 means last page.
- This is enough for next/previous navigation but not enough for accurate `333 productos`, `pagina 2 de 7`, filtered result totals, analytics result counts, or SEO summaries.
- Recommended BE improvement is a count-capable product query or metadata field that returns total count for the same filters used by the product list.
- Count behavior should work for unfiltered catalog, name search, category search, brand search, and combined filters if BE supports them.
- A reliable count should come from the backend/source of truth, not from the frontend fetching all pages and counting locally.

Suggested BE contract shape:

- Product list response includes `items` and `pageInfo`/`meta` with `total`, `page`, `pageSize`, `pageCount`, `hasNextPage`, and `hasPreviousPage`.
- If changing the product list response is too large, expose a lightweight count query that accepts the same `ProductFiltersInput`.
- Keep count semantics clear around published/draft state so frontend counts match visible products.

### Edge Cases And Constraints

- Current code has a hardcoded 5-page ceiling, but target behavior should remove it because the catalog has 333 products.
- The known 333-product catalog exceeds the current 5-page ceiling; 5 pages expose at most 250 products, leaving 83 products unreachable through current numbered pagination.
- Product page size is 50.
- Variant page size is 100.
- No GraphQL pagination metadata is available; infer next page from page size and response length.
- Category and brand options are currently hardcoded in `src/shared/types/global.types.ts`, but the target behavior is to fetch them from Strapi once queries are provided.
- Search filters only the current working set, not the full catalog.
- Two search-like controls need distinct labels, helper text, and state names to avoid ambiguity: local filter for loaded/visible products, server search for catalog-wide name matches.
- Catalog-wide API search results should use response-length pagination when the query supports `pagination`; without reliable count metadata, avoid claiming exact totals.
- Filtered lists hide pagination.
- Category/brand server actions catch errors and return `undefined`; UI currently leaves previous results in place if no data is returned.
- `fetchProducts()` and `fetchProductVariants()` can surface Apollo errors.
- `ProductListing` empty copy is English: `No products available`.
- Price formatter currently uses `en-US` and `USD`; target behavior should use MXN while preserving `en-US`-style separators if product wants `$1,235.90` formatting.
- Product card image support is not ready; existing commented code references localhost Strapi image URLs.
- Story 3 now expects image-aware card behavior, but implementation is blocked until the image field and public media host are confirmed.
- Current product data is enough for basic PLP cards, but weak for SEO and product decision-making when category, subcategory, description, image, slug, SKU, availability, and stock are missing or incomplete.
- Root metadata is placeholder and not catalog-specific.
- There are no category, brand, or product detail routes for crawlable taxonomy or product pages.

## Open Questions

### Strapi Contract

I: Question: Can Strapi expose pagination metadata such as total count, page count, or has-next-page for products?
Status: answered
Answer: No. Strapi cannot expose pagination metadata for this frontend contract. Infer next-page availability from response length: exactly 50 products means another page may exist; fewer than 50 means the current page is the last page. Strapi CMS inspection shows 333 products to list.
Context: Current queries return only product arrays, and existing repo notes say no pagination metadata is documented.
Explanation: At 50 products per page, 333 products require 7 pages. The current hardcoded 5-page ceiling is not enough for full catalog coverage.

II: Question: Should category and brand lists remain hardcoded, or should the frontend fetch available taxonomy values from Strapi?
Status: answered
Answer: Fetch category and brand lists from Strapi. Queries will be provided separately.
Context: `global.types.ts` contains hardcoded lists and a TODO questioning this.

III: Question: Are product image URLs available through the current frontend contract, and what host should Next image loading allow?
Status: answered
Answer: Product images have not been included in Strapi products yet. Add a readiness flag or explicit implementation blocker for BE image support.
Context: Product image rendering is commented out and references localhost Strapi URLs.
Explanation: Story 3 can define image/no-image card states now, but image rendering remains blocked until BE adds image data and the frontend confirms the media host.

IV: Question: Are SKU, availability, stock, currency, product URL slug, or richer variant attributes available from Strapi?
Status: answered
Answer: Not all fields are available. SKU exists on product variants as `productVariant.internalId`. Availability can be inferred from product published/draft state. Product URL slug has not been added. Stock is not handled yet but is desired later.
Context: Current queries only expose the fields listed above; variant query currently returns only `diameter` and `pricing.price`.
Explanation: Recommended future variant attributes are `internalId` for SKU/display reference, `displayName` or `label` if diameter is not enough, dimensions/diameter unit if applicable, package quantity or unit of sale, material/finish when relevant to tools, availability/published state, and stock quantity or stock status once inventory is modeled.

### Catalog Behavior

I: Question: Should search apply only to the current working set, the current page, filtered results, or the full catalog through Strapi?
Status: answered
Answer: Use two separate controls. Local visible-results filtering applies to fetched products. Catalog search queries Strapi for product name coincidence.
Context: Current search filters only whatever products are in `allProducts.current`.
Explanation: This separates quick narrowing from broader discovery and avoids making one input behave differently depending on state.

II: Question: Should category and brand filters remain mutually exclusive, or should users be able to combine them?
Status: answered
Answer: Separate local filtering from catalog API search. Local filtering should combine name, category, and brand over fetched results. Catalog API search should separately fetch products by brand, by category, or by name coincidence.
Context: Current state clears brand when category is selected and clears category when brand is selected.
Explanation: Combined local filtering is useful for narrowing visible results. API searches are separate entry points for broader catalog discovery.

III: Question: Should filtered category/brand results support pagination if more than 50 products exist?
Status: answered
Answer: Yes for API searches by category or brand. No for local filtering, because local filtering only filters already fetched products.
Context: Current filtered fetches request only page 1 with page size 50 and hide pagination.
Explanation: API searches can fetch additional pages using response-length inference. Local filtering cannot know or fetch products outside the current working set.

IV: Question: Should filter/search state be reflected in the URL for shareability and back/forward navigation?
Status: answered
Answer: Recommended for catalog API searches, especially repeated searches, so users can reopen/share a searched result set without returning to PLP and reapplying controls. Optional for local visible-results filters.
Context: Current URL only tracks `page`.
Explanation: URL state is most valuable for server-backed searches by name/category/brand. Local filters can stay client-only unless shareability becomes a clear requirement.

### UI And Product Decisions

I: Question: What Spanish copy should appear for empty results, loading states, and errors?
Status: answered
Answer: Empty results should use clear Spanish copy. Loading states should use skeletons. Errors should show an image plus a message that something went wrong.
Context: Current empty result copy is English and filter errors are only logged.
Explanation: Recommended empty copy options: `No encontramos productos para esta busqueda.`, `No hay productos que coincidan con estos filtros.`, or `Sin resultados por ahora. Prueba con otra busqueda o limpia los filtros.` Recommended loading copy, if skeletons need labels: `Cargando productos...` or `Buscando productos...`. Recommended error copy: `Algo salio mal. No pudimos cargar los productos. Intentalo de nuevo.`

II: Question: What should drawer footer actions mean in the PLP flow?
Status: answered
Answer: Drawer actions should be `Cancelar` and `Agregar al carrito`. A new cart feature is required to support this action.
Context: Current buttons are `Cancelar` and `Finalizar`, but there is no checkout, quote, or cart flow in the repo.
Explanation: `Agregar al carrito` requires a cart store, cart UI, and persistence (likely Zustand + cookie/localStorage) that does not exist yet. The cart feature is a new story, not part of PLP or SEO scope, and must be added before this drawer action can be functional.

III: Question: Should prices display in USD with `en-US` formatting, or another locale/currency format?
Status: answered
Answer: Use MXN as the currency. Keeping `en-US` locale formatting is acceptable if the desired display is the thousands/decimal style like `$1,235.90`.
Context: `formatNumberToCurrency()` uses `Intl.NumberFormat('en-US', { currency: 'USD' })`.
Explanation: The business currency should be MXN, not USD. Recommended formatter direction is `Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN', currencyDisplay: 'narrowSymbol' })` if the UI must keep `$1,235.90` instead of `MX$1,235.90`. If product later wants Mexico-localized formatting, switch locale to `es-MX`, but that may alter separators/display conventions.

IV: Question: Which product card fields are must-have above the fold for decision-making?
Status: answered
Answer: Current product data should show brand, name, min/max price, variant count, and available category/subcategory when present. Product information should be enhanced for stronger product decisions and SEO.
Context: Current data supports name, category, brand, variant count, and min/max price.
Explanation: With the provided product shape, `category`, `subcategory`, and `description` may be empty or null, and images are not available yet. Recommended enhancements are product image, non-empty short description, category/subcategory, product slug, variant SKU/internal ID, clearer variant display label, availability/published state, and stock status when inventory is modeled. Avoid fabricating unavailable fields in the frontend.

### SEO

I: Question: What production title and description should replace the MVP metadata?
Status: answered
Answer: Title `Herramienta Industrial y Tornilleria en Puebla | Tehesa`. Meta description `Distribuidores directos de Bohrcraft, King Tony y Cleveland en Puebla. Tornilleria, brocas y herramienta de corte. Cotiza por WhatsApp.`
Context: `src/app/layout.tsx` currently has placeholder metadata.
Explanation: Copy is Spanish, references real product categories and brands, and points to a WhatsApp quote path. This is the production-ready root metadata for the catalog.

II: Question: Should paginated catalog pages be indexable individually, canonicalized to page 1, or handled another way?
Status: answered
Answer: Make valid paginated catalog pages indexable with self-canonical URLs. `/` canonical to `/`, `/?page=2` canonical to `/?page=2`, `/?page=3` canonical to `/?page=3`, and so on. Use a unique title like `Herramienta Industrial y Tornilleria en Puebla | Pagina 2 | Tehesa`. Do not claim `Pagina 2 de 7` unless the backend provides reliable totals.
Context: Current pagination uses `/?page=N` URLs but no explicit SEO policy.
Explanation: Page 2+ contains different products, not duplicates. Canonicalizing every page to page 1 tells crawlers those pages are duplicates and can hide products reachable only on later pages. `noindex` on page 2+ is unnecessary for a small catalog of about 333 products / 7 pages. Query-param pagination is crawlable as long as server-rendered pagination links are present. A separate `/page/N` route is cleaner but not required for pagination; the bigger SEO win is crawlable category/brand/product routes. Avoid claiming total page counts when Strapi does not return them.

III: Question: Should category and brand filters become crawlable routes in the future?
Status: answered
Answer: Yes. Vision is that the catalog search drawer can run searches by category or brand, and those searches should change the URL to query params. This URL strategy can become crawlable routes when product wants taxonomy SEO.
Context: Current filters are client interactions on `/`, not route segments.
Explanation: Crawlable routes require the search input to navigate the router and update URL params (e.g. `/?q=...&type=category` or future `/categoria/[slug]`). The same URL update can be promoted to a real route segment when SEO work is prioritized. URL state for filter/search was already recommended for catalog API searches, so this aligns with prior answers.

IV: Question: Should structured data be part of this epic if current product data lacks image, URL, and availability confirmation?
Status: answered
Answer: Yes, structured data is in scope as part of the SEO investigation to make the catalog excellent for SEO.
Context: Structured data should not fabricate missing product facts.
Explanation: Implementation will depend on what backend fields are eventually available. At minimum, use `Product` or `ItemList` schema populated only with verified fields. Once image URL, product URL/slug, and availability are confirmed by Strapi, full `Product` schema with `offers.priceCurrency: "MXN"` can be added.

### Analytics And Conversion

I: Question: Which PLP interactions are business-critical to measure?
Status: answered
Answer: At minimum, track what the user searches in the search drawer feature. Capture the search term, search type (`name`, `category`, `brand`), result count when reliable, and returned product identifiers when available.
Context: Candidate events are search, category select, brand select, clear filters, pagination, product detail open, and drawer action clicks.
Explanation: The search drawer is the new catalog discovery surface, so its search input is the primary business-critical event for this epic. Other PLP events (category/brand select, clear filters, pagination, product detail open, drawer action clicks) can be added later in a follow-up story once the search-drawer instrumentation proves the event contract.

II: Question: Is there an approved analytics provider or should the epic only define an event contract?
Status: answered
Answer: Google Analytics 4 is the primary provider. A second analytics provider is also planned and should be designed for in the event contract.
Context: No analytics dependency exists in `package.json`.
Explanation: The implementation should keep an adapter/shim so both GA4 and the second provider can receive the same events. Avoid coupling UI components to a single vendor; the contract stays in shared code and both providers plug in behind it.

III: Question: What is the intended conversion action after users view variants?
Status: answered
Answer: `Agregar al carrito` from the variants drawer. The cart feature is a separate story.
Context: The repo has no cart, quote, checkout, contact, or order route.
Explanation: Track the `Agregar al carrito` drawer action click as the conversion event for this epic. Full cart, checkout, and order flows are out of scope and belong to the separate cart story.

### Verification

I: Question: Should implementation verification require real Strapi env vars in local/CI for PLP flows?
Status: answered
Answer: Manual validation can rely on the existing Strapi config. Automated tests should use mocks for Strapi responses so they do not require real env vars in CI.
Context: Without `STRAPI_HOST` and `STRAPI_API_TOKEN`, Apollo queries can fail or return empty data.
Explanation: Tests must mock Apollo/Strapi at the server-action or Apollo-client boundary so they run without secrets. Manual QA continues to use the real Strapi config in `.env.local`. No backend fixture contract is required for tests; mocks per test or per scenario are enough.

II: Question: Should manual QA define a canonical product/category/brand fixture list for checking filters and variants?
Status: answered
Answer: No formal fixture list is required. Use real Strapi data for manual QA and rely on mocks for automated tests.
Context: No test framework or backend fixture contract is present.
Explanation: Manual QA uses the live Strapi instance behind the existing config. Automated tests mock Strapi. A canonical fixture list can be added later only if a specific QA need appears.

## Assumptions Made

- Research depth is full template.
- Scope covers all PLP-related areas: listing, filters/search, pagination, product cards, variants drawer, SEO, and Strapi query constraints.
- Priority areas are search/filtering, pagination/loading, product detail signals, SEO, and analytics/conversion.
- Visual design remains out of scope; only light interaction, loading, empty, error, and accessibility expectations are included.
- Backend/Strapi changes are not assumed; missing backend capabilities are tracked as open questions.
- Cart feature is out of scope for this epic and should be tracked as a separate story; the drawer action `Agregar al carrito` cannot be implemented until that story lands.
- Analytics uses Google Analytics 4 plus a second provider; the event contract must support both via an adapter, with no UI coupling to a vendor.
- Automated tests for this epic mock Apollo/Strapi; manual QA uses the live Strapi config.

## Non-Obvious Findings

- Filtered category and brand lists currently replace the working product set and hide pagination, so products beyond the first 50 filtered matches may be unreachable.
- Search scope changes depending on the current working set: initial page, category results, or brand results.
- Product variant loading has no visible loading, empty, or error state; an empty drawer body can appear while data is loading or absent.
- Current SEO work can improve root metadata and paginated behavior, but crawlable category/brand/product SEO needs routes or URL strategy not present today.
- Analytics should start as an event contract, not a dependency, because no provider is selected.
- The primary conversion event in this epic is the `Agregar al carrito` drawer action; the full cart/checkout flow lives in a separate story.

## Epic Completion Status (audited 2026-07-27)

Overall: **~56% complete** (14/25 verified acceptance criteria: Story 1 6/6, Story 2 5/5, Story 3 3/5, Story 4 0/5, Story 5 0/4; Story 1a has no separately numbered epic-level ACs). Stories 1, 1a, and 2 are shipped. Story 3 shipped its currency, single-price, and `internalId`-retention work on 2026-07-27 and remains partial only on the image sub-scope, which is blocked on backend. Stories 4 and 5 have not started and are the remaining work.

### Story 1 - Search And Filtering: DONE

Split during planning into 1a (catalog API), 1b (filter state and feedback), and 1c (catalog-wide search). All three have research and planning docs and are implemented.

| AC | Status | Evidence |
|----|--------|----------|
| 1. Active inputs visible and clearable | Done | `src/features/Home/Home.tsx:306-334` renders the active-filter summary; `Limpiar filtros` (local) and `Limpiar búsqueda` (catalog-wide) are separate controls |
| 2. Spanish empty copy | Done | `src/features/ProductListing/ProductListing.tsx:22-57` |
| 3. Explicit category/brand model | Done | Local filters stack (`applyLocalFilters`, `Home.tsx:152-179`); catalog-wide search is single-mode via `?mode=` |
| 4. Loading and failure states | Done | `isBusy` disables controls; `pageFeedback` renders `role="alert"`/`role="status"`; `src/app/loading.tsx` + `src/components/ProductCardSkeleton.tsx`; `src/app/error.tsx` |
| 5. Filter vs catalog search separated | Done | Inline `SearchInput` + dropdowns for visible results; `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx` for catalog-wide with `BUSCAR POR` mode selector |
| 6. Input cleansing before Strapi | Done | `SEARCH_TERM_PATTERN` allowlist, `SEARCH_TERM_MAX_LENGTH`, `DIGITS_ONLY` page parsing, `DOCUMENT_ID_PATTERN` in `src/shared/constants/catalog.constants.ts` and `src/features/Pagination/utils.pagination.ts` |

Nice-to-haves: URL sync shipped. Result summary shipped (with a caveat, see below). Per-input helper text was implemented as a popover (`Home.tsx:316-332`) instead of a static helper line — acceptable variant, not a gap.

### Story 1a - Catalog API Route: DONE

All seven routes exist under `src/app/api/catalog/` (`products`, `category`, `brand`, `categories`, `brands`, `variants`, `search`) with shared `_utils.ts` envelope/validation helpers and full test coverage in `__tests__/catalog/`. Server actions in `src/shared/lib/global.lib.ts` are preserved and still serve `page.tsx`; only the variants drawer consumes the HTTP route.

### Story 2 - Pagination, Loading, Navigation: DONE

| AC | Status | Evidence |
|----|--------|----------|
| 1. `?page=N` without a 5-page ceiling | Done | `PRODUCT_PAGE_MAX = Math.ceil(333 / 50)` = 7; strict digits-only parsing with redirect-to-base on invalid input |
| 2. Loading feedback | Done | `useTransition` + `isRoutePending`, `src/app/loading.tsx` skeleton grid |
| 3. Pagination adapted under filters | Done | Numbered pagination for base mode; Anterior/Página N/Siguiente for `name`/`category`/`brand` (`Home.tsx:362-427`) |
| 4. Back/forward predictable | Done | All navigation is `router.push` with full URL state |
| 5. Empty/failed pages not broken | Done | `page.tsx:37-42` redirects empty page >1; `notice=end` shows `No hay más resultados.` |

Next-page inference uses `products.length === 50` as specified (`page.tsx:57`).

**Caveat to resolve:** `Home.tsx:365` renders `Mostrando X-Y de 333 productos` from the hardcoded `KNOWN_PRODUCT_TOTAL`. The epic explicitly said not to claim totals the API does not provide, and this number silently rots when the catalog changes. Either fetch the real count, or soften the copy to `Mostrando X-Y`.

### Story 3 - Product Detail Signals: PARTIAL (~75%), implemented 2026-07-27

| AC | Status | Evidence / gap |
|----|--------|----------------|
| 1. Card shows all backend signals | Partial | `ProductCard.tsx` shows category, brand, name, variant count, and min/max price (single `Precio` when `hasOneProductVariant === true`). The dead `internalId`-as-`Modelo` branch was deleted (it never rendered in production — no list query selected `product_variants`). Image still missing — no `next/image` usage anywhere in the catalog |
| 2. Image and no-image card states | **Not started** | Still blocked: Strapi has no product image field yet (open question Strapi III) |
| 3. Drawer loading/empty/error | Done | `ProductVariantsDrawer.tsx:143-147`, unchanged |
| 4. Prices sorted and formatted | Done | Sorted ascending by numeric price. Currency now renders `$1,234.50 MXN` via `formatNumberToCurrency` in `src/shared/utils/global.utils.ts` |
| 5. Spanish drawer labels | Done | `Cerrar`, `Seleccionar variantes`, `Agregar N al carrito` |

Story 3 (`ai-planning/stories/plp-product-detail-signals.story3.md`) implemented Phases 1-3: the MXN currency format, the `hasOneProductVariant`-gated single-price card branch, deletion of the `Modelo` branch, and `internalId` retention (not rendered) on each drawer-mapped variant for the upcoming cart feature. Verified via `pnpm test` (138 tests, 1 pre-existing skip), `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, and `pnpm design:lint`, all clean.

Story 3's AC4 (a repeatable catalog-integrity check) was reassigned to the backend during planning — data integrity for `minPrice`/`maxPrice`/`variantCount`/`hasOneProductVariant` is a Strapi lifecycle-hook concern, not frontend code. See `docs/improvement.md` and `ai-planning/stories/plp-product-detail-signals.story3.md:180-209`. Three known content defects (zero-variant / null-price products) are documented there for correction in Strapi admin.

Remaining gap in this story is entirely the image sub-scope (AC1 partial, AC2 not started), still blocked on Strapi exposing a product image field.

Note: `Agregar al carrito` exists in both the card (`ProductCard.tsx`, handler commented out) and the drawer footer (`ProductVariantsDrawer.tsx:229-238`, currently just closes). Both are intentionally inert until the separate cart story lands.

### Story 4 - SEO Readiness: NOT STARTED (0%)

Nothing in this story has been implemented. This is the largest remaining gap and it is fully unblocked — every open question in the SEO section is already answered.

| AC | Status | Gap |
|----|--------|-----|
| 1. Production Spanish metadata | Not started | `src/app/layout.tsx:18-22` still has `// TODO: Change metadata`, title `Tehesa MVP`, description `Esto es un MVP de Tehesa`. Approved replacement copy is in SEO answer I |
| 2. Paginated URL SEO strategy | Not started | No `generateMetadata` in `page.tsx`; no per-page titles; no `alternates.canonical` anywhere in the repo |
| 3. Server-rendered crawlable content | Likely satisfied, unverified | `Home` is a client component but SSRs through the server `page.tsx`, so product names should appear in initial HTML. Not verified against a real `pnpm build` output |
| 4. Filter/search URL strategy decided | Decided, not implemented for SEO | URL params exist (`?mode=`, `?q=`); indexability policy for those URLs is not expressed anywhere |
| 5. Structured data | Not started | No JSON-LD, no `application/ld+json`, no `robots.ts`, no `sitemap.ts` in `src/app/` |

### Story 5 - Analytics And Conversion Readiness: NOT STARTED (0%)

No analytics code, no adapter, and no written event contract. Note that ACs 1, 2, and 4 are documentation and restraint deliverables, not code:

- AC1 (which interactions matter) and AC2 (event names and payload fields documented) are directionally answered in the Analytics open questions but have never been written up as an event contract document. That write-up is the actual deliverable.
- AC3 (vendor-agnostic adapter) is not implemented.
- AC4 (no analytics package until a provider is selected) is currently satisfied by default — `package.json` has no analytics dependency.
- The `Agregar al carrito` conversion event stays blocked on the separate cart story.

### Pending Work Summary, Highest Value First

1. **Story 4 - SEO.** Fully unblocked, all decisions made, currently zero implementation. Needs research and planning docs before implementation.
2. **Product total claim** (Story 2 caveat). Decide between a real count and softened copy.
3. **Story 5 - Analytics event contract.** Document-only first step; no dependency needed.
4. **Story 3 image-aware cards.** Stays blocked until Strapi exposes an image field and the Next image host is confirmed.
5. **Backend follow-up from Story 3 AC4** (not this repo). A `product-variant` lifecycle hook to keep `minPrice`/`maxPrice`/`variantCount`/`hasOneProductVariant` in sync, plus correcting the three known defective products. Tracked in `docs/improvement.md`.

### Docs Coverage Gap

`ai-research/stories/` and `ai-planning/` contain docs for stories 1, 1a, 1b, 1c, and 2 only. Stories 3, 4, and 5 have no story-level research or planning doc yet; each needs `/research` then `/plan` before implementation.
