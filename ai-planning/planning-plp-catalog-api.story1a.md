# Planning: Create Catalog API Route For Current GraphQL Calls

Source research doc: `ai-research/plp-catalog-api.story1a.md`

Sign-off status: treated as signed off from the `/plan` request and completed research outcome. Research open questions are answered, but the research file has no explicit sign-off date line.

Sign-off date: 2026-07-10

Assumptions:

- Page size stays fixed: 50 for product list routes, 100 for variants.
- `src/app/page.tsx` keeps its direct server-action initial fetch.
- Hardcoded dropdown option arrays stay in place for UI labels.
- Missing `STRAPI_HOST` or `STRAPI_API_TOKEN` is a route-level `400` with `CAT_ENV_001`.

## Acceptance Criteria

1. A Next.js Route Handler exists under `src/app/api/catalog/` or an equivalent catalog API path.
2. The API supports the GraphQL-backed product reads currently present in the repo: products by page, products by category, products by brand, and product variants by product document id.
3. The API also exposes the dynamic category and brand list reads backed by the new `GET_CATEGORIES` and `GET_BRANDS` GraphQL operations so validation is not tied to hardcoded allowlists.
4. The API reuses `src/app/apollo-client.ts` so `STRAPI_HOST` and `STRAPI_API_TOKEN` remain the single Strapi connection contract.
5. Request parameters are validated before GraphQL variables are built, including page, page size, category id, brand id, and product document id.
6. Responses are shaped as JSON with predictable success and error envelopes so future UI work does not parse Apollo/Strapi internals.
7. Invalid request parameters return a `400` response with the error envelope; success responses use the success envelope.
8. The API route delegates to server action functions in `src/shared/lib/global.lib.ts`; server actions remain the single point of Apollo/Strapi access. New server actions are added where the current set does not cover the operation.
9. Client components (`src/features/Home/Home.tsx` dropdown handlers, `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`) call the new API routes via `fetch`, not the server actions directly.
10. The API route validates `STRAPI_HOST` and `STRAPI_API_TOKEN` are present before calling the Apollo client. If either is missing, the route returns `400` with the `CAT_ENV_001` error code; no raw configuration error is exposed to the client.
11. Error responses use a custom error code system (`CAT_*`) with internal message constants. The code is returned to the client; the client maps the code to a Spanish user-facing message. No raw Apollo/Strapi error strings are returned.

## Affected Files

`src/app/**`

- Create `src/app/api/catalog/_utils.ts`
- Create `src/app/api/catalog/products/route.ts`
- Create `src/app/api/catalog/category/route.ts`
- Create `src/app/api/catalog/brand/route.ts`
- Create `src/app/api/catalog/categories/route.ts`
- Create `src/app/api/catalog/brands/route.ts`
- Create `src/app/api/catalog/variants/route.ts`
- Leave `src/app/page.tsx` unchanged.

`src/features/**`

- Modify `src/features/Home/Home.tsx`
- Modify `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`

`src/shared/**`

- Create `src/shared/constants/catalog.constants.ts`
- Modify `src/shared/queries/global.queries.ts`
- Modify `src/shared/lib/global.lib.ts`
- Modify `src/shared/types/global.types.ts`
- Optional: create `src/shared/utils/catalog-api.utils.ts` only if both client files would otherwise duplicate envelope parsing and Spanish code mapping.

Docs/config

- No config, dependency, test framework, version, or changelog changes.
- Add the manual curl checklist to PR notes during implementation.

## Phase 1: GraphQL, Types, And Server Actions

### Changes Required

`src/shared/queries/global.queries.ts` - Modify near existing query exports.

- Add `GET_CATEGORIES` selecting `categories { name customId }`.
- Add `GET_BRANDS` selecting `brands { customId name }`.
- Keep existing product and variant operations unchanged.

`src/shared/types/global.types.ts` - Modify near category/brand types.

- Add a dynamic taxonomy item type with `name: string` and `customId: string`.
- Add query response interfaces for `categories` and `brands`.
- Keep `CATEGORIES_PRODUCTS` and `BRANDS_PRODUCTS` untouched.

`src/shared/lib/global.lib.ts` - Modify imports and add functions near existing catalog server actions.

- Import `GET_CATEGORIES` and `GET_BRANDS`.
- Add `fetchCategories(): Promise<TaxonomyItem[]>` using `createApolloClient()`.
- Add `fetchBrands(): Promise<TaxonomyItem[]>` using `createApolloClient()`.
- Return `[]` when taxonomy data is absent so route validation is deterministic.
- Do not change fixed product or variant page sizes.

### Success Criteria

Automated:

- `pnpm exec tsc --noEmit`

Manual:

- Verify through Phase 2 API routes that categories and brands return arrays containing `customId`.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/shared/queries/global.queries.ts` | New taxonomy query fields match Strapi contract from research | `pnpm exec tsc --noEmit` + API taxonomy smoke check |
| `src/shared/lib/global.lib.ts` | New actions reuse Apollo client factory and return arrays | `pnpm exec tsc --noEmit` + API taxonomy smoke check |
| `src/shared/types/global.types.ts` | Dynamic taxonomy types do not replace hardcoded UI arrays | `pnpm exec tsc --noEmit` |

## Phase 2: Catalog API Routes

### Changes Required

`src/shared/constants/catalog.constants.ts` - Create.

- Export `CAT_ENV_001`, `CAT_VAL_001` through `CAT_VAL_005`, `CAT_NF_001` through `CAT_NF_003`, and `CAT_ERR_001`.
- Export matching `MSG_CAT_*` generic English fallback messages.
- Skip `CAT_VAL_006` search-term handling because this story adds no search API.

`src/app/api/catalog/_utils.ts` - Create.

- Provide `success(data)` returning `{ success: true, data }` via `NextResponse.json`.
- Provide `failure(code, message)` returning `{ success: false, code, message }` with status `400`.
- Provide `validateCatalogEnv()` checking `process.env.STRAPI_HOST` and `process.env.STRAPI_API_TOKEN` before server actions run.
- Provide small validators for `page` (`1..5`), fixed `pageSize`, `categoryId`, `brandId`, and `documentId` (`1..30`, `/^[A-Za-z0-9_-]+$/`).
- Keep this route-private; do not build a generic query-router abstraction.

`src/app/api/catalog/products/route.ts` - Create `GET`.

- Validate env, `page`, and optional `pageSize`.
- Call `fetchProducts(page)` and return the success envelope.
- Catch upstream failures, log server-side, return `CAT_ERR_001`.

`src/app/api/catalog/category/route.ts` - Create `GET`.

- Validate env, `categoryId`, and optional `pageSize`.
- Call `fetchCategories()`, validate `categoryId` against live `customId` values, then call `fetchProductsByCategory(categoryId)`.
- Use `CAT_VAL_003` for malformed ids and `CAT_NF_001` for well-formed ids missing from Strapi.
- Return product array in the success envelope; coerce `undefined` server-action result to `[]`.

`src/app/api/catalog/brand/route.ts` - Create `GET`.

- Same structure as category route using `brandId`, `fetchBrands()`, `fetchProductsByBrand(brandId)`, `CAT_VAL_004`, and `CAT_NF_002`.

`src/app/api/catalog/categories/route.ts` - Create `GET`.

- Validate env, call `fetchCategories()`, return the success envelope.

`src/app/api/catalog/brands/route.ts` - Create `GET`.

- Validate env, call `fetchBrands()`, return the success envelope.

`src/app/api/catalog/variants/route.ts` - Create `GET`.

- Validate env, `documentId`, and optional `pageSize`.
- Call `fetchProductVariants({ documentId })` and return variants in the success envelope.
- Only return `CAT_NF_003` if implementation can distinguish product-not-found from a valid product with zero variants; otherwise return success with `[]`.

Edge cases:

- Invalid params always return `400` with the error envelope.
- Apollo/Strapi error strings never reach client JSON.
- All routes call server actions, not Apollo directly.

### Success Criteria

Automated:

- `pnpm exec tsc --noEmit`
- `pnpm build`

Manual:

- With env vars set, check success responses for `/api/catalog/products?page=1`, `/api/catalog/categories`, `/api/catalog/brands`, `/api/catalog/category?categoryId=<valid>`, `/api/catalog/brand?brandId=<valid>`, and `/api/catalog/variants?documentId=<valid>`.
- Check `400` envelopes for invalid `page=0`, `page=6`, `pageSize=25`, unknown category/brand ids, and invalid `documentId=../../bad`.
- Run once without one Strapi env var and confirm `CAT_ENV_001`.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/app/api/catalog/_utils.ts` | Env validation, response envelopes, fixed page size, id validation | `pnpm exec tsc --noEmit` + invalid-param API checks |
| `src/app/api/catalog/products/route.ts` | Bounded paged product reads | manual API check + `pnpm build` |
| `src/app/api/catalog/category/route.ts` | Dynamic category validation before product fetch | manual valid/invalid category checks + `pnpm build` |
| `src/app/api/catalog/brand/route.ts` | Dynamic brand validation before product fetch | manual valid/invalid brand checks + `pnpm build` |
| `src/app/api/catalog/categories/route.ts` | Category list success envelope | manual API check + `pnpm build` |
| `src/app/api/catalog/brands/route.ts` | Brand list success envelope | manual API check + `pnpm build` |
| `src/app/api/catalog/variants/route.ts` | Document id validation and variant envelope | manual valid/invalid variant checks + `pnpm build` |

## Phase 3: Client Migration To Fetch

### Changes Required

`src/features/Home/Home.tsx` - Modify imports and dropdown handlers.

- Remove direct server-action imports for `fetchProductsByCategory` and `fetchProductsByBrand`.
- Fetch `/api/catalog/category?categoryId=${encodeURIComponent(categoryCustomId)}` in `handleCategorySelect`.
- Fetch `/api/catalog/brand?brandId=${encodeURIComponent(brandCustomId)}` in `handleBrandSelect`.
- Parse the success/error envelope before using `data`.
- Map returned `CAT_*` codes to Spanish user-facing copy; do not render or log raw Apollo/Strapi strings as user copy.
- Preserve current filter behavior: selected category clears brand, selected brand clears category, pagination remains hidden while a filter is active.

`src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` - Modify imports and drawer effect.

- Remove direct `fetchProductVariants` import.
- Fetch `/api/catalog/variants?documentId=${encodeURIComponent(product.documentId)}` when the drawer opens.
- Parse the success/error envelope.
- Preserve existing price formatting and ascending sort.
- Map `CAT_*` codes to Spanish user-facing copy and avoid raw upstream messages.

Optional `src/shared/utils/catalog-api.utils.ts` - Create only if useful.

- Keep it to envelope parsing and Spanish code mapping used by both client components.
- Do not add caching, retries, Zustand state, or a data-fetching dependency.

### Success Criteria

Automated:

- `pnpm lint`
- `pnpm build`

Manual:

- Desktop and mobile: select a category and confirm products update, brand selection clears, and pagination hides.
- Desktop and mobile: select a brand and confirm products update, category selection clears, and pagination hides.
- Open a product drawer and confirm variants load and remain sorted by numeric price ascending.
- Force or simulate an API `CAT_*` failure and confirm Spanish copy is used instead of raw API/Apollo text.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/features/Home/Home.tsx` | Dropdown fetch migration, envelope handling, filter state preservation | manual desktop/mobile checks + `pnpm lint` + `pnpm build` |
| `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` | Variant fetch migration, envelope handling, sort/format preservation | manual drawer check + `pnpm lint` + `pnpm build` |
| `src/shared/utils/catalog-api.utils.ts` if created | Client-only code mapping and envelope parsing | `pnpm lint` + `pnpm build` |

## Cross-Cutting Concerns

- Server/client boundary: client components must not import `src/shared/lib/global.lib.ts` after migration; route handlers call server actions.
- Strapi env vars: route handlers validate env before calling server actions because `apollo-client.ts` still owns actual Strapi connection setup.
- GraphQL response shape: product queries still return raw arrays without pagination metadata; keep the page ceiling at 5.
- Validation: category and brand ids validate against live Strapi taxonomy lists, not `CATEGORIES_PRODUCTS` or `BRANDS_PRODUCTS`.
- Error copy: API returns code plus generic English fallback; client maps code to Spanish message.

## Open Questions / Out Of Scope

Open questions:

- None blocking. Product-not-found for variants is only actionable if Strapi response shape distinguishes it from an empty variants list.

Out of scope:

- PLP UI redesign, empty states, loading redesign, URL-synced filters, search API, search labels, pagination metadata, caching taxonomy lists, removing server actions, replacing hardcoded dropdown options, backend schema changes, new dependencies, test framework setup, version bump, and changelog edits.

## PR Curl Checklist

Include these in PR notes after implementation:

- `GET /api/catalog/products?page=1`
- `GET /api/catalog/products?page=0` returns `400` and `CAT_VAL_001`
- `GET /api/catalog/products?page=1&pageSize=25` returns `400` and `CAT_VAL_002`
- `GET /api/catalog/categories`
- `GET /api/catalog/brands`
- `GET /api/catalog/category?categoryId=<valid>`
- `GET /api/catalog/category?categoryId=missing-id` returns `400` and `CAT_NF_001`
- `GET /api/catalog/brand?brandId=<valid>`
- `GET /api/catalog/brand?brandId=missing-id` returns `400` and `CAT_NF_002`
- `GET /api/catalog/variants?documentId=<valid>`
- `GET /api/catalog/variants?documentId=../../bad` returns `400` and `CAT_VAL_005`
- Missing `STRAPI_HOST` or `STRAPI_API_TOKEN` returns `400` and `CAT_ENV_001`.
