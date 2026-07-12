# Story 3 Research: Protect Data and API Boundaries

## Research Mode

- Mode: full research.
- Scope: single story with catalog, Apollo, client-fetch, and theme boundaries.
- Parent epic: `ai-research/unit-testing.epic.md`.
- Prerequisites: Stories 1 and 2 are implemented successfully.
- Canonical policy: `docs/UNIT_TESTING_GUIDELINES.md`.
- Research date: 2026-07-12.

## Story Definition

### Title

Protect data and API boundaries with focused tests.

### Description

Add risk-based Jest coverage for catalog parameter validation, every catalog route,
the browser catalog API client, Apollo/Strapi adapters, and theme preference
persistence. Tests must use the real validation and utility code while mocking only
network, Apollo, and Next cookie boundaries.

This story also applies the boundary contract corrections approved in the parent epic:
strict numeric query parsing, consistent `CAT_ERR_001` mapping for category/brand
upstream failures, light as the authoritative theme default, and runtime validation
that accepts only `light` or `dark` preferences.

### Acceptance Criteria

1. Shared catalog validation tests cover defaults, valid boundaries, strict numeric
   input, fixed page sizes, IDs, search terms, environment checks, and envelopes.
2. Every catalog route has focused coverage for success, route-specific validation or
   not-found behavior, argument forwarding, and upstream failure mapping.
3. Catalog client tests cover successful extraction, typed `CatalogApiError`, known
   Spanish copy, and unknown-code fallback without real network access.
4. Apollo adapter tests verify every operation and variable shape, exact production
   response nesting, null-data fallbacks, and propagated category/brand failures.
5. Theme tests cover light defaults, valid/invalid persisted cookies, secure cookie
   options, and `/api/preferences` validation with `PRF_VAL_001`.

## Task Breakdown

### Phase 1: Shared Catalog Validation

- Make numeric parsers reject prefixes, decimals, signs, whitespace, and mixed content.
- Preserve product page bounds (`1..5`) and unbounded positive wide-search pages.
- Test shared success/failure envelopes, environment validation, and taxonomy lookup.

### Phase 2: Every Catalog Route

- Add one route test file under each `__tests__/catalog/<route>/` folder.
- Mock named server adapters from `src/shared/lib/global.lib.ts`.
- Keep `src/app/api/catalog/_utils.ts` real.
- Verify every route's success and failure contract without repeating the complete
  shared parser matrix in each route suite.

### Phase 3: Client and Apollo Adapters

- Test `fetchCatalog` and Spanish error mapping with a mocked global `fetch`.
- Test all seven Apollo-backed helpers with a mocked Apollo client factory.
- Remove category/brand error swallowing so rejected Apollo calls reach route handlers.

### Phase 4: Theme and Preferences

- Align next-themes, cookie reads, and Zustand-compatible values on light by default.
- Validate saved and requested themes against the existing `AppTheme` union at runtime.
- Add route and cookie helper tests using only Next cookie/server boundaries as mocks.

## Technical Research

### Existing Test Foundation

- Jest 30 uses `next/jest.js` and jsdom through `jest.config.ts`.
- Tests live only under root `__tests__/`.
- Existing tests cover currency formatting and `SearchInput`; no Story 3 boundary has
  coverage yet.
- `pnpm test -- <relative path>` is the targeted command; `pnpm test` runs the full
  suite with coverage and no threshold.
- Non-component tests do not need the render wrapper in `__tests__/test-utils.tsx`.
- Do not add new test dependencies, global setup, or a fixture framework.

### Catalog Validation Boundary

Affected source: `src/app/api/catalog/_utils.ts`.

Current parsers use `Number.parseInt`, which incorrectly accepts values such as
`1abc`, `1.5`, `50abc`, and `100xyz`. The approved contract is string at the HTTP
boundary and digits only before conversion.

Required behavior:

- Product `page`: omitted defaults to 1; digits-only values `1..5` pass.
- Wide-search `page`: omitted defaults to 1; any digits-only integer `>=1` passes.
- Product `pageSize`: omitted defaults to 50; only the exact string value 50 passes.
- Variant `pageSize`: omitted defaults to 100; only the exact string value 100 passes.
- Empty, decimal, signed, whitespace-padded, and alphanumeric numeric values fail.
- Category, brand, and document IDs remain limited to the existing safe pattern and
  30-character maximum.
- Search remains trimmed, required, maximum 100 characters, and constrained by the
  existing Unicode/punctuation allowlist.
- Missing Strapi host or token remains `CAT_ENV_001`.
- All shared failures continue returning HTTP 400.

Test file: `__tests__/catalog/_utils.test.ts`.

Use table-driven cases for numeric inputs and IDs. Test `success`, `failure`,
`validateCatalogEnv`, `readValidatedParams`, and `findTaxonomyItem` directly. Restore
environment variables after each case.

### Server Page Numeric Boundary

Affected source: `src/app/page.tsx`.

`searchParams.page` is a string, but current `parseInt` accepts numeric prefixes and
decimals. Align it with the digits-only contract. Missing or nonnumeric input defaults
to page 1; valid numeric input remains clamped to the known `1..5` ceiling.

Do not render this async Server Component in Jest. The route validator tests establish
the strict parsing contract; do not extract a helper solely to increase coverage.

### Route Test Structure

Use one minimal file per route initially:

- `__tests__/catalog/products/route.test.ts`.
- `__tests__/catalog/category/route.test.ts`.
- `__tests__/catalog/brand/route.test.ts`.
- `__tests__/catalog/search/route.test.ts`.
- `__tests__/catalog/variants/route.test.ts`.
- `__tests__/catalog/categories/route.test.ts`.
- `__tests__/catalog/brands/route.test.ts`.

The parent epic proposed fixtures and request builders in each folder, but the
implemented testing guide forbids speculative helpers. Start with a single route test
file. Extract a typed request/environment helper only after two suites prove the same
need.

For all non-environment cases, set `STRAPI_HOST` and `STRAPI_API_TOKEN`; every route
checks environment first. Invoke exported `GET` functions with real `Request` objects.
Mock the exact named adapter exports, not Apollo underneath the route.

### Route Coverage Matrix

#### Products

- Success returns 200, exact product envelope, and forwards the validated page.
- Invalid fixed page size returns `CAT_VAL_002` without calling `fetchProducts`.
- Rejected adapter returns HTTP 400 with `CAT_ERR_001`.

#### Category

- Success verifies taxonomy lookup and `fetchProductsByCategory(categoryId, page)`.
- Missing/invalid ID returns `CAT_VAL_003`.
- Unknown taxonomy item returns `CAT_NF_001` and skips the product call.
- Taxonomy or product adapter rejection returns `CAT_ERR_001`.
- An absent product result must not be converted into successful empty data.

#### Brand

- Mirror category using `CAT_VAL_004`, `CAT_NF_002`, and brand adapters.
- An absent or rejected product result returns `CAT_ERR_001`.

#### Search

- Success proves query trimming and wide-page forwarding.
- Invalid query returns `CAT_VAL_006` without calling the adapter.
- Rejected adapter returns `CAT_ERR_001`.

#### Variants

- Success forwards `{ documentId }` and returns the exact variant envelope.
- Invalid document ID returns `CAT_VAL_005`.
- Invalid fixed page size returns `CAT_VAL_002`.
- Rejected adapter returns `CAT_ERR_001`.

#### Categories and Brands

- Each route covers successful taxonomy data and rejected adapter mapping.
- Cover `CAT_ENV_001` in one taxonomy route rather than duplicating it seven times;
  direct environment combinations belong in `_utils.test.ts`.

All routes currently return HTTP 400 for validation, not-found, environment, and
upstream failures. Preserve that status contract in this story.

### Category and Brand Upstream Contract

Affected source:

- `src/shared/lib/global.lib.ts`.
- `src/app/api/catalog/category/route.ts`.
- `src/app/api/catalog/brand/route.ts`.

`fetchProductsByCategory` and `fetchProductsByBrand` uniquely catch Apollo errors and
return `undefined`. Their routes then use `?? []`, turning upstream failure into a
successful empty result. Approved behavior is `CAT_ERR_001`.

The smallest coherent correction is to let both helpers reject like the other Apollo
adapters and give them explicit `Promise<Product[]>` return types. Successful null data
still maps to `[]`; rejected network/Apollo work does not. Existing route catches then
own the HTTP envelope. If routes retain nullable handling, they must explicitly treat
`undefined` as upstream failure rather than `[]`.

Use the canonical `CAT_ERR_001` and `MSG_CAT_ERR_001` constants in route responses
instead of duplicated string literals where touched.

### Catalog Client Boundary

Affected source: `src/shared/utils/catalog-api.utils.ts`.

Test file: `__tests__/shared/catalog-api.utils.test.ts`.

Mock only global `fetch` and cover:

- Path and `RequestInit` forwarding.
- Successful envelope returning only `data`.
- Failure envelope throwing `CatalogApiError` with exact code/message.
- One known catalog code mapping to Spanish.
- Unknown code mapping to the generic Spanish fallback.

Network and JSON parser errors currently pass through. They are not required by Story
3 acceptance criteria and need no extra test unless implementation changes that path.
Do not add response-status handling solely for speculative malformed envelopes.

### Apollo Adapter Boundary

Affected source: `src/shared/lib/global.lib.ts`.

Test file: `__tests__/shared/global.lib.test.ts`.

Mock the default `createApolloClient` export and provide a typed `query` Jest mock. Keep
the real GraphQL documents. Verify operation and exact variables for:

- `fetchProducts`: page and page size 50.
- `fetchProductsByCategory`: category `customId.contains`, page, and size 50.
- `fetchProductsByBrand`: brand `customId.contains`, page, and size 50.
- `fetchProductsByName`: name `contains`, page, and size 50.
- `fetchProductVariants`: document ID, page 1, and size 100.
- `fetchCategories`: `GET_CATEGORIES` without variables.
- `fetchBrands`: `GET_BRANDS` without variables.

Mock responses must use exact production nesting: `{ data: { products } }`,
`{ data: { product: { product_variants } } }`, `{ data: { categories } }`, and
`{ data: { brands } }`.

Cover null/missing field fallback once for products and once each for variants,
categories, and brands. Verify category/brand rejected queries propagate. The future
Strapi fixture/schema layer remains deferred; this story verifies real operation
documents, variable shapes, and response nesting only.

### Theme Contract

Affected source:

- `src/app/layout.tsx`.
- `src/shared/lib/global.lib.ts`.
- `src/shared/types/global.types.ts` (`AppTheme` already exists).
- `src/shared/constants/global.constants.ts` or a focused preference constants file.

Light is authoritative. Change `NextThemesProvider` from `defaultTheme="dark"` to
`defaultTheme="light"`. The existing Zustand initial state and absent-cookie fallback
already use light.

`getThemePreference` must return `Promise<AppTheme>`:

- Missing/empty cookie returns light.
- `light` and `dark` return unchanged.
- Any unsupported persisted value falls back to light without mutating cookies.

`saveThemeCookie` accepts `AppTheme` and must also enforce runtime validation because
JSON and persisted input are trust boundaries. Valid values set `tehesa-theme` with
`httpOnly: true`, `secure: true`, and `sameSite: "strict"`. Invalid values reject and
must not call `set`.

Test file: `__tests__/theme/global.lib.test.ts`. Mock only the named `cookies` export
from `next/headers` with typed async `get` and `set` functions.

### Preferences Route

Affected source: `src/app/api/preferences/route.ts`.

Test file: `__tests__/preferences/route.test.ts`.

Accepted request bodies are exactly `{ theme: "light" }` and `{ theme: "dark" }`.
Success remains HTTP 201 with `{ success: true, themeChangedTo: theme }` and calls
`saveThemeCookie` once.

Missing, null, non-string, unsupported, and malformed JSON inputs return HTTP 400 with:

- `success: false`.
- `code: "PRF_VAL_001"`.
- A specific validation message.

Invalid input must not call `saveThemeCookie`. A cookie helper rejection remains HTTP
400 but should use an error contract distinct from input validation only if an existing
preference error code is introduced; no separate code is required by this story.

Add a preference validation constant/type guard in the smallest appropriate shared
location. Reuse it in both route and cookie helper rather than duplicating allowlists.

### Mock Policy

- Catalog routes mock named server adapters.
- Catalog client tests mock global `fetch`.
- Apollo adapter tests mock `createApolloClient`.
- Theme tests mock `next/headers` cookies.
- Preferences route tests mock named `saveThemeCookie`.
- Keep validators, GraphQL documents, constants, envelopes, and Spanish mapping real.
- Do not use `any` or `unknown` in new tests; import production types for mock data.
- Do not add internal component mocks, `next/image` mocks, or browser shims.

## Affected Files

### Add Tests

- `__tests__/catalog/_utils.test.ts`.
- Seven `__tests__/catalog/<route>/route.test.ts` files.
- `__tests__/shared/catalog-api.utils.test.ts`.
- `__tests__/shared/global.lib.test.ts`.
- `__tests__/theme/global.lib.test.ts`.
- `__tests__/preferences/route.test.ts`.

### Modify Source

- `src/app/api/catalog/_utils.ts` for strict numeric validation.
- `src/app/page.tsx` for strict page-string normalization.
- Category/brand server helpers and routes for propagated upstream errors.
- Catalog routes touched to use canonical upstream constants consistently.
- `src/app/layout.tsx` for light default.
- `src/shared/lib/global.lib.ts` for typed/validated theme cookie behavior.
- `src/app/api/preferences/route.ts` for allowlist and coded validation envelope.
- A shared preference constant/type-guard file if not kept minimally with existing
  global constants.

### Documentation

- Update `REPO_CONTEXT.md` after implementation because strict page parsing,
  category/brand failure behavior, light default, and preference validation are broad
  verified contracts.
- Update `AGENTS.md` only if a compact architecture statement becomes stale.
- Do not alter `docs/UNIT_TESTING_GUIDELINES.md`; Story 2 already covers these rules.

## Verification

Use `/unit-test` behavior and the canonical testing guide:

- Run each new test file with `pnpm test -- <relative path>` while iterating.
- Run grouped catalog tests after route work.
- Run `pnpm test` for the full suite and coverage.
- Run `pnpm lint`.
- Run `pnpm exec tsc --noEmit` because source signatures change.
- Run `pnpm build` because server routes, layout theme configuration, and server/client
  integration change. Strapi environment variables may be required.
- Do not run `pnpm install`; no dependencies change.

## Edge Cases and Constraints

- Product pages remain bounded to five; wide category/brand/search pages remain
  positive with no upper bound.
- Numeric-only means no decimals, signs, prefixes, suffixes, or surrounding whitespace.
- Successful null GraphQL fields return empty arrays; rejected Apollo work returns an
  upstream error.
- All current catalog failure envelopes use HTTP 400, including upstream errors.
- Preference malformed JSON uses the same `PRF_VAL_001` validation contract as an
  unsupported theme.
- Invalid persisted theme values fall back to light without deleting the cookie.
- Secure cookie options remain exact; no expiry/path requirement is introduced.
- Async `src/app/page.tsx` is not directly rendered in Jest.
- No Strapi schema fixture or MSW dependency is added; that is a future story.
- Existing `it.skip()`/`test.skip()` calls must be preserved; none currently exist in
  the Story 3 test surface.
- Coverage output is informative only; no percentage threshold is introduced.

## Open Questions

None.

## Answered Questions

### Scope

I: Question: Quick or full research?
Status: answered
Answer: Full template.

II: Question: Should Story 3 include approved source contract corrections?
Status: answered
Answer: Yes: strict numeric parsing, category/brand `CAT_ERR_001` propagation, light
default alignment, and light/dark preference validation.

III: Question: Should preference route validation be included?
Status: answered
Answer: Yes. Cover both `/api/preferences` and the cookie helpers.

### Preferences

I: Question: What is the invalid preference response?
Status: answered
Answer: HTTP 400 with `{ success: false, code: "PRF_VAL_001", message }`.

II: Question: How is malformed JSON classified?
Status: answered
Answer: The same `PRF_VAL_001` validation envelope.

III: Question: What happens to an unsupported persisted cookie value?
Status: answered
Answer: Return the authoritative light default without mutating the cookie.

### Strapi Contract

I: Question: Is a schema/response fixture required now?
Status: answered
Answer: No. Assert operation documents, variables, and production response nesting;
defer a fixture layer to a future story.

## Assumptions

- Story 2's guide and `/unit-test` workflow are authoritative.
- Every catalog route receives its own folder and focused route test.
- One route test file per folder is enough until repeated setup justifies extraction.
- Existing valid out-of-range page integers remain clamped in `src/app/page.tsx`.
- Wide-search pages intentionally have no maximum.
- Preference helper failures can retain generic HTTP 400 handling; only invalid input
  requires `PRF_VAL_001`.
- No package, Jest configuration, global setup, or CI changes are required.

## Research Outcome

Story 3 is ready for planning. It requires twelve focused test files and small boundary
source corrections, but no new tooling or dependencies. The central design is to test
validation once in `_utils`, test each route's composition separately, and mock only
the network/Apollo/cookie boundary. All contract questions are resolved; the Strapi
fixture layer remains an explicit future story.
