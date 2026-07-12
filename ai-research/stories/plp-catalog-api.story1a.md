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
3. The API also exposes the dynamic category and brand list reads backed by the new `GET_CATEGORIES` and `GET_BRANDS` GraphQL operations so validation is not tied to hardcoded allowlists.
4. The API reuses `src/app/apollo-client.ts` so `STRAPI_HOST` and `STRAPI_API_TOKEN` remain the single Strapi connection contract.
5. Request parameters are validated before GraphQL variables are built, including page, page size, category id, brand id, and product document id.
6. Responses are shaped as JSON with predictable success and error envelopes so future UI work does not parse Apollo/Strapi internals.
7. Invalid request parameters return a `400` response with the error envelope; success responses use the success envelope.
8. The API route delegates to server action functions in `src/shared/lib/global.lib.ts`; server actions remain the single point of Apollo/Strapi access. New server actions are added where the current set does not cover the operation (for example, `fetchCategories` and `fetchBrands`).
9. Client components (`src/features/Home/Home.tsx` dropdown handlers, `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`) call the new API routes via `fetch`, not the server actions directly.
10. The API route validates `STRAPI_HOST` and `STRAPI_API_TOKEN` are present before calling the Apollo client. If either is missing, the route returns `400` with the `CAT_ENV_001` error code; no raw configuration error is exposed to the client.
11. Error responses use a custom error code system (`CAT_*`) with internal message constants. The code is returned to the client; the client maps the code to a Spanish user-facing message. No raw Apollo/Strapi error strings are returned.

### Scope Assessment

- Classification: single API story.
- In scope: Next Route Handler creation, the new dynamic category and brand list reads, request validation, JSON response shape, the `400` failure response behavior, the `CAT_*` custom error code system with internal message constants, env-var validation on the route, adding new server actions where needed, and migrating client component data access (`Home.tsx` dropdown handlers, `ProductVariantsDrawer.tsx`) from direct server-action calls to the new API routes via `fetch`.
- Out of scope: PLP UI changes, visible-results search labels, empty states, loading states, filter reset UX, URL-synced filters, replacing or de-duplicating the hardcoded `CATEGORIES_PRODUCTS` and `BRANDS_PRODUCTS` arrays in `src/shared/types/global.types.ts`, backend schema changes, new dependencies, removing the existing server actions, and refactoring the server-rendered initial products fetch in `src/app/page.tsx` (server components may keep calling server actions directly).

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
- Story 1a adds server actions for the new operations:
  - `fetchCategories()` calling `GET_CATEGORIES`.
  - `fetchBrands()` calling `GET_BRANDS`.
- The API route layer calls these server actions; it does not call Apollo directly.

### Current Client Code Calling Server Actions

- `src/features/Home/Home.tsx` calls `fetchProductsByCategory` and `fetchProductsByBrand` from `src/shared/lib/global.lib.ts` on dropdown change.
- `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` calls `fetchProductVariants` from `src/shared/lib/global.lib.ts` when the drawer opens.
- `src/app/page.tsx` is a server component that calls `fetchProducts` directly to seed the initial server-rendered product list. It can keep calling the server action; it does not need to go through the API.

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
- Story 1a adds `GET_CATEGORIES` and `GET_BRANDS` for dynamic category and brand lists:
  - `GET_CATEGORIES` selects `categories { name customId }`.
  - `GET_BRANDS` selects `brands { customId name }`.

### Current Types And Static Data

- `src/shared/types/global.types.ts` defines `Product`, `ProductVariant`, `FetchProductsResponse`, and `FetchSingleProductResponse`.
- `CATEGORIES_PRODUCTS` and `BRANDS_PRODUCTS` are hardcoded arrays still used by current UI dropdowns; they are not the source of truth for API validation after this story.
- Current product page size is 50.
- Current variant page size is 100.
- Current route page ceiling is 5 in `src/app/page.tsx`, documented as a known constraint.

### Route Shape (Decided)

- Multiple resource-specific routes under `src/app/api/catalog/`.
- Product reads: `/api/catalog/products`, `/api/catalog/category`, `/api/catalog/brand`.
- Dynamic taxonomy lists: `/api/catalog/categories` and `/api/catalog/brands`.
- Product variants are exposed as a separate route group: `/api/catalog/variants`.
- Avoid a broad query-builder API.
- Future catalog-wide search should be a new route group, not bolted onto the product list routes.

### Validation Notes

- Validate `page` as an integer within the known current bounds, likely `1..5` for products.
- Validate product `pageSize` as fixed or bounded, with current default `50`.
- Validate variants `pageSize` as fixed or bounded, with current default `100`.
- For category and brand reads, validate `categoryId` and `brandId` against the dynamic list returned by the new `GET_CATEGORIES` and `GET_BRANDS` operations, not the hardcoded arrays.
- Fetch the taxonomy lists per request or cache them with a short TTL; do not assume the lists never change.
- Validate `documentId` as a non-empty string capped at 30 characters, containing only `[A-Za-z0-9_-]`, before passing it to `GET_PRODUCT_VARIANTS`. 30 characters is a comfortable upper bound for Strapi v5 document ids, which are typically much shorter, while still rejecting pathological values.
- Prefer allowlists and simple bounds over blacklist-heavy sanitization.
- Reject requests with a `400` response using the error envelope when any validation rule fails.

### Response Envelope Notes

- Current server actions return raw arrays or `undefined` on some failures.
- The API should return predictable JSON for future clients.
- A minimal success envelope: `{ success: true, data: ... }`.
- A minimal error envelope: `{ success: false, code: 'CAT_...', message: '...' }` where `code` is a `CAT_*` constant and `message` is a generic, non-internal string.
- The `code` is the only field the client is expected to map. The `message` is a generic English fallback; the client renders Spanish copy from its own code-to-copy map.
- Never leak Apollo stack traces, raw Strapi errors, env var values, or internal log output in client-facing JSON.

### Custom Error Code System

- A small set of `CAT_*` error code constants and matching `MSG_CAT_*` internal message constants live under `src/shared/constants/`, alongside the existing `global.constants.ts`.
- The code is the public contract; the message is internal and must not be shown to end users as-is.
- Suggested initial catalog error codes:
  - `CAT_ENV_001` / `MSG_CAT_ENV_001` - `Missing Strapi configuration` - `STRAPI_HOST` or `STRAPI_API_TOKEN` is not set when the route runs.
  - `CAT_VAL_001` / `MSG_CAT_VAL_001` - `Invalid page parameter` - `page` is not an integer within the allowed bounds.
  - `CAT_VAL_002` / `MSG_CAT_VAL_002` - `Invalid pageSize parameter` - `pageSize` is not within the allowed bounds.
  - `CAT_VAL_003` / `MSG_CAT_VAL_003` - `Invalid categoryId` - `categoryId` fails the allowlist/format check.
  - `CAT_VAL_004` / `MSG_CAT_VAL_004` - `Invalid brandId` - `brandId` fails the allowlist/format check.
  - `CAT_VAL_005` / `MSG_CAT_VAL_005` - `Invalid documentId` - `documentId` is empty, too long, or contains characters outside `[A-Za-z0-9_-]`.
  - `CAT_VAL_006` / `MSG_CAT_VAL_006` - `Invalid search term` - `q` is too long or contains disallowed characters.
  - `CAT_NF_001` / `MSG_CAT_NF_001` - `Category not found` - `categoryId` is well-formed but not present in Strapi.
  - `CAT_NF_002` / `MSG_CAT_NF_002` - `Brand not found` - `brandId` is well-formed but not present in Strapi.
  - `CAT_NF_003` / `MSG_CAT_NF_003` - `Product not found` - `documentId` did not resolve to a Strapi product.
  - `CAT_ERR_001` / `MSG_CAT_ERR_001` - `Upstream catalog error` - catch-all for Apollo/Strapi failures after logging the real cause server-side.
- Naming pattern follows the user's example: `{PREFIX}_{CATEGORY}_{NUMBER}` for codes and `MSG_{PREFIX}_{CATEGORY}_{NUMBER}` for internal messages.
- The client owns the code-to-Spanish-copy map. Do not duplicate Spanish copy in the API response.

### Existing Patterns To Follow

- Keep server-only Strapi access using the existing Apollo client factory.
- Keep GraphQL operations in `src/shared/queries/global.queries.ts`.
- Keep cross-cutting types or validation helpers under `src/shared/` only if reused.
- Place `CAT_*` error code constants and `MSG_CAT_*` internal message constants under `src/shared/constants/`, following the existing `global.constants.ts` pattern.
- Preserve current server actions in `src/shared/lib/global.lib.ts` as the internal Apollo/Strapi boundary; add new server actions for new operations.
- The API route layer is a thin HTTP wrapper that calls server actions and shapes responses; do not call Apollo from the route.
- Validate `STRAPI_HOST` and `STRAPI_API_TOKEN` at the start of each route handler; return the `CAT_ENV_001` error if either is missing.
- Wrap upstream failures in `CAT_ERR_001` after logging the real cause server-side; never forward Apollo/Strapi error text to the client.
- Client components use `fetch` against the API routes; do not import server actions from client components after the migration.
- Do not add a new data-fetching dependency.
- UI changes in this story are limited to replacing direct server-action imports with `fetch` calls and adding a client-side code-to-Spanish-copy map; visible filter/search behavior changes are out of scope and belong to Story 1.

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
Status: answered
Answer: No. Fetch dynamic category and brand lists from Strapi.
Context: User provided `GET_CATEGORIES` and `GET_BRANDS` GraphQL operations.
Explanation: The API adds `/api/catalog/categories` and `/api/catalog/brands` routes backed by those operations. Validation for `categoryId` and `brandId` must use the live lists, not the hardcoded arrays in `src/shared/types/global.types.ts`.

II: Question: What exact character/length constraints should apply to product `documentId`?
Status: answered
Answer: Non-empty, max 30 characters, allowed characters `[A-Za-z0-9_-]`.
Context: User asked for a recommendation around 30 characters.
Explanation: Strapi v5 document ids are typically much shorter than 30 characters, so 30 is a safe upper bound that will not reject any real id while still blocking pathological inputs.

III: Question: Should invalid params return `400` with an error envelope, or `200` with empty data?
Status: answered
Answer: Return `400` with the error envelope.
Context: User confirmed `400`.
Explanation: The parent Story 1 requirements call for failing fast on invalid input, and `400` makes the failure mode obvious to callers without leaking Strapi/Apollo internals.

### Integration

I: Question: Should the new API route call existing server action functions or call Apollo directly with shared queries?
Status: answered
Answer: The API route calls existing or newly created server action functions. It does not call Apollo directly.
Context: User selected this approach to keep a single Apollo/Strapi boundary.
Explanation: The route layer is a thin HTTP wrapper over `src/shared/lib/global.lib.ts`. New server actions (for example `fetchCategories` and `fetchBrands`) are added for operations that the current set does not cover.

II: Question: Should any client code start using the new API in this story?
Status: answered
Answer: Yes, all client code should start using the new API contract.
Context: User confirmed the full client migration in this story.
Explanation: Client components (`Home.tsx` dropdown handlers, `ProductVariantsDrawer.tsx`) call the new API routes via `fetch` instead of importing server actions directly. The server-rendered initial products fetch in `src/app/page.tsx` can keep calling the server action.

### Verification

I: Question: Are `STRAPI_HOST` and `STRAPI_API_TOKEN` available locally for manual route verification?
Status: answered
Answer: The route validates both env vars on entry. If either is missing, return `400` with the `CAT_ENV_001` error code; never expose the raw configuration error to the client.
Context: User wants env-var validation on the route with a custom error code, no raw errors leaked.
Explanation: This removes a class of confusing failure modes where the Apollo client fails with a low-level message. The `CAT_ENV_001` code is stable and the client maps it to a Spanish user-facing message.

II: Question: Should implementation include a short manual curl checklist in the PR notes?
Status: answered
Answer: Yes.
Context: User confirmed a curl checklist in the PR notes.
Explanation: Include the success path, the `400` validation paths (e.g., invalid `page`, `documentId`), and the `CAT_ENV_001` path for each new route. This gives reviewers a quick way to smoke-test the route without a test framework.

## Assumptions Made

- Story 1a covers API creation, new server actions where needed, client migration to the API contract, and the `CAT_*` custom error code system.
- The API route layer is a thin HTTP wrapper over server actions; server actions remain the single Apollo/Strapi boundary.
- The route validates `STRAPI_HOST` and `STRAPI_API_TOKEN` on entry; missing config is a `CAT_ENV_001` failure, never a leaked raw error.
- Client components (`Home.tsx`, `ProductVariantsDrawer.tsx`) stop importing server actions and call the new API routes via `fetch`.
- The server-rendered initial products fetch in `src/app/page.tsx` can keep calling the server action directly; it is not a client component.
- The client owns the code-to-Spanish-copy map; the API only returns the `CAT_*` code and a generic English fallback.
- The hardcoded `CATEGORIES_PRODUCTS` and `BRANDS_PRODUCTS` arrays in `src/shared/types/global.types.ts` remain in place for the current UI dropdowns; replacing them is a separate UI concern.
- No new dependency is needed.
- Page size stays at current fixed values (50 products, 100 variants) for this story; a later story will revisit caller-controlled page size.
- A short manual curl checklist is included in the PR notes for each new route.

## Research Outcome

- There is no catalog API route today.
- The repo already has all GraphQL operations needed for the current product, category, brand, and variant reads.
- Story 1a adds the new `GET_CATEGORIES` and `GET_BRANDS` operations plus matching server actions so validation uses live Strapi data instead of the hardcoded allowlists.
- Final architecture: client calls API route via `fetch`; API route calls server action; server action is the only place that calls Apollo.
- Final route shape: multiple resource-specific routes under `/api/catalog/` with product reads in `/products`, `/category`, `/brand`, dynamic taxonomy lists in `/categories` and `/brands`, and variants in a separate `/variants` group.
- `documentId` validation uses a 30-character cap on `[A-Za-z0-9_-]`; invalid params return `400` with the error envelope.
- The route returns a `CAT_*` error code; the client maps it to Spanish copy. No raw Apollo/Strapi error strings are forwarded.
- `STRAPI_HOST` and `STRAPI_API_TOKEN` are validated on the route and surface as `CAT_ENV_001` when missing.
- Client migration is part of this story: `Home.tsx` dropdown handlers and `ProductVariantsDrawer.tsx` call the new API routes; the initial server-rendered products fetch in `src/app/page.tsx` is unchanged.
- Keep it boring: no query builder, no new data-fetching library.
- Page size control is a deferred follow-up tracked in `docs/improvement.md`.
