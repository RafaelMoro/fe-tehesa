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

Description: Make catalog discovery behavior predictable by separating local visible-result filtering from catalog-wide product search, category filters, brand filters, empty states, and filter reset flows.

Acceptance criteria:

1. Users can understand which search/filter inputs are active and clear them without losing the current catalog context unexpectedly.
2. Empty search/filter results show Spanish user-facing copy instead of generic fallback text.
3. Category and brand filter behavior is explicit: either mutually exclusive as today or combined only if product requirements confirm it.
4. Filter loading and failure states are represented in the UI instead of silently leaving stale results.
5. The UI clearly separates `Filtrar resultados visibles` from `Buscar en todo el catalogo` so users understand when they are narrowing shown results versus querying Strapi by product name.

Must-have notes:

- Preserve current source of category and brand options unless the backend contract is confirmed.
- Keep one clear filter model; do not add complex query-builder behavior without product need.
- Present the catalog search as a recovery path after local filtering: `No encontraste el producto que buscas? Buscalo en todo el catalogo.`
- Keep the visible-results filter close to the product grid controls and label it as narrowing already loaded results.

Nice-to-have notes:

- Sync active filters into URL parameters for shareability and back/forward behavior.
- Add count or summary text for the active result set if the data contract can support it.
- Add a small helper line under each input: `Filtra los productos que ya estas viendo` and `Busca coincidencias por nombre en el catalogo`.

### Story 2: Improve Pagination, Loading, And Navigation Feedback

Description: Make page navigation reliable, understandable, and resilient within the known 5-page catalog ceiling.

Acceptance criteria:

1. Page URLs continue to support direct navigation with `?page=N` and clamp invalid values to the known safe range.
2. Users receive loading feedback during page transitions and filter fetches.
3. Pagination behavior remains hidden or intentionally adapted when category or brand filters are active.
4. Browser back/forward behavior remains predictable for paginated catalog pages.
5. Empty page or failed fetch states do not render a broken or misleading PLP.

Must-have notes:

- Keep the hardcoded 5-page ceiling unless product/API requirements change.
- Keep page size 50 for product list queries unless the API contract changes.

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

1. Product defines which PLP interactions matter: search, filter select, clear filters, pagination, product detail open, and drawer action clicks.
2. Event names and payload fields are documented before any analytics dependency is introduced.
3. Implementation can be added later through a small adapter or native browser event pattern without coupling UI components to a vendor.
4. No new analytics package is added until a provider is selected.

Must-have notes:

- There is no analytics dependency or existing event tracking in `package.json`.
- Avoid speculative tracking abstractions until the provider and event contract exist.

Nice-to-have notes:

- Add lightweight console/dev instrumentation during implementation only if useful for manual verification.
- Add conversion-oriented CTA behavior after product defines the next step beyond viewing variants.

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

### Edge Cases And Constraints

- Hardcoded catalog ceiling is 5 pages and is documented as a known constraint.
- Product page size is 50.
- Variant page size is 100.
- No GraphQL pagination metadata is documented in current queries.
- Category and brand options are hardcoded in `src/shared/types/global.types.ts`.
- Search filters only the current working set, not the full catalog.
- Two search-like controls need distinct labels, helper text, and state names to avoid ambiguity: local filter for loaded/visible products, server search for catalog-wide name matches.
- Catalog-wide search results should hide or deliberately redefine pagination because the provided name search query has no pagination metadata.
- Filtered lists hide pagination.
- Category/brand server actions catch errors and return `undefined`; UI currently leaves previous results in place if no data is returned.
- `fetchProducts()` and `fetchProductVariants()` can surface Apollo errors.
- `ProductListing` empty copy is English: `No products available`.
- Price formatter uses `en-US` and `USD`; confirm whether that matches Tehesa business expectations.
- Product card image support is not ready; existing commented code references localhost Strapi image URLs.
- Story 3 now expects image-aware card behavior, but implementation is blocked until the image field and public media host are confirmed.
- Root metadata is placeholder and not catalog-specific.
- There are no category, brand, or product detail routes for crawlable taxonomy or product pages.

## Open Questions

### Strapi Contract

I: Question: Can Strapi expose pagination metadata such as total count, page count, or has-next-page for products?
Status: pending
Context: Current queries return only product arrays, and existing repo notes say no pagination metadata is documented.

II: Question: Should category and brand lists remain hardcoded, or should the frontend fetch available taxonomy values from Strapi?
Status: pending
Context: `global.types.ts` contains hardcoded lists and a TODO questioning this.

III: Question: Are product image URLs available through the current frontend contract, and what host should Next image loading allow?
Status: pending
Context: Product image rendering is commented out and references localhost Strapi URLs.

IV: Question: Are SKU, availability, stock, currency, product URL slug, or richer variant attributes available from Strapi?
Status: pending
Context: Current queries only expose the fields listed above.

### Catalog Behavior

I: Question: Should search apply only to the current working set, the current page, filtered results, or the full catalog through Strapi?
Status: pending
Context: Current search filters only whatever products are in `allProducts.current`.

II: Question: Should category and brand filters remain mutually exclusive, or should users be able to combine them?
Status: pending
Context: Current state clears brand when category is selected and clears category when brand is selected.

III: Question: Should filtered category/brand results support pagination if more than 50 products exist?
Status: pending
Context: Current filtered fetches request only page 1 with page size 50 and hide pagination.

IV: Question: Should filter/search state be reflected in the URL for shareability and back/forward navigation?
Status: pending
Context: Current URL only tracks `page`.

### UI And Product Decisions

I: Question: What Spanish copy should appear for empty results, loading states, and errors?
Status: pending
Context: Current empty result copy is English and filter errors are only logged.

II: Question: What should drawer footer actions mean in the PLP flow?
Status: pending
Context: Current buttons are `Cancelar` and `Finalizar`, but there is no checkout or quote flow in the repo.

III: Question: Should prices display in USD with `en-US` formatting, or another locale/currency format?
Status: pending
Context: `formatNumberToCurrency()` uses `Intl.NumberFormat('en-US', { currency: 'USD' })`.

IV: Question: Which product card fields are must-have above the fold for decision-making?
Status: pending
Context: Current data supports name, category, brand, variant count, and min/max price.

### SEO

I: Question: What production title and description should replace the MVP metadata?
Status: pending
Context: `src/app/layout.tsx` currently has placeholder metadata.

II: Question: Should paginated catalog pages be indexable individually, canonicalized to page 1, or handled another way?
Status: pending
Context: Current pagination uses `/?page=N` URLs but no explicit SEO policy.

III: Question: Should category and brand filters become crawlable routes in the future?
Status: pending
Context: Current filters are client interactions on `/`, not route segments.

IV: Question: Should structured data be part of this epic if current product data lacks image, URL, availability, and currency confirmation?
Status: pending
Context: Structured data should not fabricate missing product facts.

### Analytics And Conversion

I: Question: Which PLP interactions are business-critical to measure?
Status: pending
Context: Candidate events are search, category select, brand select, clear filters, pagination, product detail open, and drawer action clicks.

II: Question: Is there an approved analytics provider or should the epic only define an event contract?
Status: pending
Context: No analytics dependency exists in `package.json`.

III: Question: What is the intended conversion action after users view variants?
Status: pending
Context: The repo has no cart, quote, checkout, contact, or order route.

### Verification

I: Question: Should implementation verification require real Strapi env vars in local/CI for PLP flows?
Status: pending
Context: Without `STRAPI_HOST` and `STRAPI_API_TOKEN`, Apollo queries can fail or return empty data.

II: Question: Should manual QA define a canonical product/category/brand fixture list for checking filters and variants?
Status: pending
Context: No test framework or backend fixture contract is present.

## Assumptions Made

- Research depth is full template.
- Scope covers all PLP-related areas: listing, filters/search, pagination, product cards, variants drawer, SEO, and Strapi query constraints.
- Priority areas are search/filtering, pagination/loading, product detail signals, SEO, and analytics/conversion.
- Visual design remains out of scope; only light interaction, loading, empty, error, and accessibility expectations are included.
- Backend/Strapi changes are not assumed; missing backend capabilities are tracked as open questions.

## Non-Obvious Findings

- Filtered category and brand lists currently replace the working product set and hide pagination, so products beyond the first 50 filtered matches may be unreachable.
- Search scope changes depending on the current working set: initial page, category results, or brand results.
- Product variant loading has no visible loading, empty, or error state; an empty drawer body can appear while data is loading or absent.
- Current SEO work can improve root metadata and paginated behavior, but crawlable category/brand/product SEO needs routes or URL strategy not present today.
- Analytics should start as an event contract, not a dependency, because no provider is selected.
