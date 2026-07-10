# Research: Create Catalog API Route For Current GraphQL Calls

## Story Definition

### Story Title

Create Catalog API Route For Current GraphQL Calls

### Source

- Parent story: `ai-research/plp-search-filtering.story.md`
- Split from: original AC7 at line 30.
- Scope decision: Story 1a, API-only.

### Story Description

Create a thin Next.js API route layer that handles the product GraphQL calls currently made through server actions. This story is only about API creation and response shaping for the existing catalog data paths. It does not change the PLP UI, search controls, filter UX, or client behavior.

The route should prove that the app can broker Strapi GraphQL calls through `src/app/api/` while preserving the current Apollo client/env setup and without removing the existing server-action flow.

### Acceptance Criteria

1. A Next.js Route Handler exists under `src/app/api/catalog/` or an equivalent catalog API path.
2. The API supports the GraphQL-backed product reads currently present in the repo: products by page, products by category, products by brand, and product variants by product document id.
3. The API reuses `src/app/apollo-client.ts` so `STRAPI_HOST` and `STRAPI_API_TOKEN` remain the single Strapi connection contract.
4. Request parameters are validated before GraphQL variables are built, including page, page size, category id, brand id, and product document id.
5. Responses are shaped as JSON with predictable success and error envelopes so future UI work does not parse Apollo/Strapi internals.
6. Existing server actions in `src/shared/lib/global.lib.ts` remain in place and continue to be the production path until a later story intentionally migrates callers.

### Scope Assessment

- Classification: single API story.
- In scope: Next Route Handler creation, current catalog GraphQL calls, request validation, JSON response shape.
- Out of scope: PLP UI changes, visible-results search labels, empty states, loading states, filter reset UX, URL-synced filters, backend schema changes, new dependencies, and replacing server actions.

## Technical Research

### Current API Routes

- Existing API route inventory contains only `src/app/api/preferences/route.ts`.
- `/api/preferences` supports `POST` and saves theme preference cookies.
- There is no current catalog API route.
- A catalog API route should follow App Router Route Handler conventions under `src/app/api/**/route.ts`.

### Current GraphQL Calls To Broker

- `fetchProducts(page)` in `src/shared/lib/global.lib.ts` calls `GET_PRODUCTS` with `pagination: { page, pageSize: 50 }`.
- `fetchProductsByCategory(customId)` calls `GET_PRODUCTS_BY_CATEGORY` with `category.customId.contains = customId` and `pageSize: 50`.
- `fetchProductsByBrand(brandId)` calls `GET_PRODUCTS_BY_BRAND` with `brand.customId.contains = brandId` and `pageSize: 50`.
- `fetchProductVariants({ documentId })` calls `GET_PRODUCT_VARIANTS` with `pageSize: 100`.
- Category and brand calls currently catch errors, log them, and may return `undefined`.
- Product list and variant calls currently allow Apollo errors to surface.

### Current Apollo Integration

- `src/app/apollo-client.ts` reads `STRAPI_HOST` and `STRAPI_API_TOKEN` from `process.env`.
- It builds an Apollo `HttpLink` with `Authorization: Bearer ${STRAPI_API_TOKEN}`.
- It uses `InMemoryCache`.
- Story 1a should reuse this factory instead of duplicating host/token setup.

### Current GraphQL Operations

- `src/shared/queries/global.queries.ts` defines `GET_PRODUCTS`, `GET_PRODUCTS_BY_CATEGORY`, `GET_PRODUCTS_BY_BRAND`, and `GET_PRODUCT_VARIANTS`.
- Product list query fields include `brand.name`, `category.name`, `name`, `maxPrice`, `minPrice`, `variantCount`, and `documentId`.
- Variant query fields include `diameter` and `pricing.price`.
- Existing queries do not return pagination metadata.
- Existing queries use variables instead of GraphQL string interpolation.

### Current Types And Static Data

- `src/shared/types/global.types.ts` defines `Product`, `ProductVariant`, `FetchProductsResponse`, and `FetchSingleProductResponse`.
- `CATEGORIES_PRODUCTS` and `BRANDS_PRODUCTS` are hardcoded allowlists available for validating category and brand ids.
- Current product page size is 50.
- Current variant page size is 100.
- Current route page ceiling is 5 in `src/app/page.tsx`, documented as a known constraint.

### Route Shape (Decided)

- Multiple resource-specific routes under `src/app/api/catalog/`.
- Product reads: `/api/catalog/products`, `/api/catalog/category`, `/api/catalog/brand`.
- Product variants are exposed as a separate route group: `/api/catalog/variants`.
- Avoid a broad query-builder API.
- Future catalog-wide search should be a new route group, not bolted onto the product list routes.

### Validation Notes

- Validate `page` as an integer within the known current bounds, likely `1..5` for products.
- Validate product `pageSize` as fixed or bounded, with current default `50`.
- Validate variants `pageSize` as fixed or bounded, with current default `100`.
- Validate `categoryId` against `CATEGORIES_PRODUCTS` when handling category reads.
- Validate `brandId` against `BRANDS_PRODUCTS` when handling brand reads.
- Validate `documentId` as a non-empty bounded string before passing it to `GET_PRODUCT_VARIANTS`.
- Prefer allowlists and simple bounds over blacklist-heavy sanitization.

### Response Envelope Notes

- Current server actions return raw arrays or `undefined` on some failures.
- The API should return predictable JSON for future clients.
- A minimal success envelope could be `{ success: true, data: ... }`.
- A minimal error envelope could be `{ success: false, message: string }`.
- Do not leak Apollo stack traces or raw Strapi internals in client-facing JSON.

### Existing Patterns To Follow

- Keep server-only Strapi access using the existing Apollo client factory.
- Keep GraphQL operations in `src/shared/queries/global.queries.ts`.
- Keep cross-cutting types or validation helpers under `src/shared/` only if reused.
- Preserve current server actions in `src/shared/lib/global.lib.ts`.
- Do not add a new data-fetching dependency.
- Do not touch UI components for this story.

### Verification Rules To Follow Later

- No test framework is configured.
- Do not run or invent `pnpm test`.
- Use `pnpm lint` after implementation changes.
- Use `pnpm exec tsc --noEmit` for standalone TypeScript verification if useful.
- Use `pnpm build` because this story adds App Router API route code.
- Local/manual API verification requires `STRAPI_HOST` and `STRAPI_API_TOKEN`.

## Open Questions

### API Contract

I: Question: Should the catalog API be one route with a `type` query param, or multiple resource-specific routes?
Status: answered
Answer: Multiple resource-specific routes.
Context: User selected Option B: multiple routes.
Explanation: Product reads live under `/api/catalog/products`, `/api/catalog/category`, and `/api/catalog/brand`. Variants live separately at `/api/catalog/variants`.

II: Question: Should the API expose product variants in the same catalog route group?
Status: answered
Answer: No, keep them separate.
Context: User confirmed variants should be a separate route.
Explanation: Variants will live at `/api/catalog/variants` rather than being a query param on the product list routes.

III: Question: Should page size be caller-controlled with bounds, or fixed to the existing constants?
Status: answered
Answer: Defer. Capture the follow-up in `docs/improvement.md` and address in a later story.
Context: User asked to record the follow-up rather than decide now.
Explanation: This story should not change caller-controlled page size behavior; track it as a future improvement.

### Validation

I: Question: Should category and brand ids be validated strictly against hardcoded allowlists?
Status: pending
Context: The allowlists exist today and are the current source of UI filter options.

II: Question: What exact character/length constraints should apply to product `documentId`?
Status: pending
Context: The repo only types it as `string`.

III: Question: Should invalid params return `400` with an error envelope, or `200` with empty data?
Status: answered
Answer: Use fail-fast validation with an error response.
Context: The parent Story 1 requirements call for failing fast on invalid input.

### Integration

I: Question: Should the new API route call existing server action functions or call Apollo directly with shared queries?
Status: pending
Context: Server actions are currently production path; calling Apollo directly may keep the route independent and thin.

II: Question: Should any client code start using the new API in this story?
Status: answered
Answer: No.
Context: User explicitly scoped this story to API creation, not UI.

### Verification

I: Question: Are `STRAPI_HOST` and `STRAPI_API_TOKEN` available locally for manual route verification?
Status: pending
Context: Without env vars, Apollo calls can fail or return empty data.

II: Question: Should implementation include a short manual curl checklist in the PR notes?
Status: pending
Context: There is no test framework; manual API checks may be useful.

## Assumptions Made

- Story 1a is API-only.
- The API covers current GraphQL reads, not new UI search behavior.
- Existing server actions stay in place.
- Existing UI does not call the new API yet.
- No new dependency is needed.
- Page size stays at current fixed values (50 products, 100 variants) for this story; a later story will revisit caller-controlled page size.

## Research Outcome

- There is no catalog API route today.
- The repo already has all GraphQL operations needed for the current product, category, brand, and variant reads.
- The smallest useful API story is a thin Route Handler layer over those existing queries with validation and a stable JSON envelope.
- Final route shape: multiple resource-specific routes under `/api/catalog/` with product reads in `/products`, `/category`, `/brand` and variants in a separate `/variants` group.
- Keep it boring: no query builder, no UI migration, no new data-fetching library.
- Page size control is a deferred follow-up tracked in `docs/improvement.md`.
