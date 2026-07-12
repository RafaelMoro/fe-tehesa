# Plan: Protect Data And API Boundaries

## Header

- **Story:** Protect data and API boundaries with focused tests
- **Source research:** [`ai-research/unit-testing-data-api-boundaries.story3.md`](../ai-research/unit-testing-data-api-boundaries.story3.md)
- **Research sign-off:** Confirmed by the user on 2026-07-12
- **Plan status:** Awaiting implementation sign-off
- **Assumptions:**
  - Stories 1 and 2 are implemented; Jest, `docs/UNIT_TESTING_GUIDELINES.md`, and `/unit-test` are the test-authoring baseline.
  - The current GraphQL documents and TypeScript response nesting are the repository's Strapi contract for this story; no backend schema fixture is needed.
  - All catalog failures, including upstream failures, retain HTTP 400. Only invalid preference request bodies require the new `PRF_VAL_001` code.
  - Category/brand adapter rejections replace their prior `undefined` result path; successful null GraphQL data remains an empty array.

## Acceptance Criteria

1. Shared catalog validation tests cover defaults, valid boundaries, strict numeric input, fixed page sizes, IDs, search terms, environment checks, and envelopes.
2. Every catalog route has focused coverage for success, route-specific validation or not-found behavior, argument forwarding, and upstream failure mapping.
3. Catalog client tests cover successful extraction, typed `CatalogApiError`, known Spanish copy, and unknown-code fallback without real network access.
4. Apollo adapter tests verify every operation and variable shape, exact production response nesting, null-data fallbacks, and propagated category/brand failures.
5. Theme tests cover light defaults, valid/invalid persisted cookies, secure cookie options, and `/api/preferences` validation with `PRF_VAL_001`.

## Affected Files

### Catalog Validation And Routes

- `src/app/api/catalog/_utils.ts` - modify strict numeric parsing.
- `src/app/page.tsx` - modify page query-string normalization.
- `src/shared/lib/global.lib.ts` - modify category/brand adapter error propagation and return types.
- `src/app/api/catalog/{products,category,brand,search,variants,categories,brands}/route.ts` - modify canonical upstream error constants; remove category/brand empty-data fallback.
- `__tests__/catalog/_utils.test.ts` - create shared validation coverage.
- `__tests__/catalog/{products,category,brand,search,variants,categories,brands}/route.test.ts` - create one focused suite per route.

### Client And Apollo Adapters

- `__tests__/shared/catalog-api.utils.test.ts` - create browser catalog client coverage.
- `__tests__/shared/global.lib.test.ts` - create Apollo adapter coverage.

### Theme And Preferences

- `src/shared/constants/global.constants.ts` - modify with the shared preference validation code/type guard.
- `src/shared/lib/global.lib.ts` - modify theme cookie types and runtime validation.
- `src/app/api/preferences/route.ts` - modify request parsing and validation envelope.
- `src/app/layout.tsx` - modify `NextThemesProvider` default theme.
- `__tests__/theme/global.lib.test.ts` - create cookie helper coverage.
- `__tests__/preferences/route.test.ts` - create preference route coverage.

### Documentation

- `REPO_CONTEXT.md` - modify verified cross-cutting contracts after implementation.
- `AGENTS.md` - modify its theme-default statement because `dark default` becomes stale.

### Explicitly Unchanged

- `package.json`, `pnpm-lock.yaml`, Jest configuration/setup, Next configuration, CI workflows, and `docs/UNIT_TESTING_GUIDELINES.md`.
- GraphQL documents, app UI components, Zustand store/provider code, and existing proof tests.

## Phase 1: Harden And Cover Catalog Validation And Routes

### Changes Required

#### `src/app/api/catalog/_utils.ts`

- **Action:** Modify `parsePage`, `parseWideSearchPage`, and `parsePageSize` near lines 66-117.
- Validate the raw query string against a digits-only condition before numeric conversion; reject empty strings, decimals, signs, whitespace-padded values, numeric prefixes/suffixes, and mixed content.
- Preserve omitted defaults: product/wide page `1`, product page size `50`, and variant page size `100`.
- Preserve product page bounds `1..5`; wide pages accept any digits-only integer at least `1`; fixed page sizes accept only their exact configured numeric string.
- Keep taxonomy/document ID pattern and length logic, search trimming/allowlist/length logic, environment checks, envelopes, and HTTP 400 behavior unchanged.

#### `src/app/page.tsx`

- **Action:** Modify `MainPage` page parsing near `pageParam` / `currentPage`.
- Apply the same digits-only HTTP-string rule before converting the optional page string; missing or invalid values use page `1`.
- Clamp valid numeric strings to the existing `1..5` ceiling. Do not extract a helper or attempt to render this async Server Component in Jest.

#### `src/shared/lib/global.lib.ts`

- **Action:** Modify `fetchProductsByCategory` and `fetchProductsByBrand` near lines 40-93.
- Give both functions explicit `Promise<Product[]>` return types, retain `res?.data?.products ?? []` for successful null data, and remove their local catch-and-log branches so rejected Apollo queries propagate to route handlers.
- Leave the other five adapter contracts unchanged in this phase; their operation coverage belongs to Phase 2.

#### `src/app/api/catalog/{products,category,brand,variants,categories,brands}/route.ts`

- **Action:** Modify each upstream catch branch; `search/route.ts` already uses the canonical constants and needs no source change.
- Import and use `CAT_ERR_001` and `MSG_CAT_ERR_001` instead of route-local upstream strings.
- In category and brand routes, remove `?? []` after the product adapter call. The typed adapters return an array for a successful null GraphQL field and reject on upstream failure, allowing the existing route catch to return `CAT_ERR_001`.
- Keep environment validation first, route-specific parameter validation, live taxonomy lookup, success envelopes, and 400 failure status intact.

#### `__tests__/catalog/_utils.test.ts`

- **Action:** Create.
- Test `success` and `failure` response bodies/status, `validateCatalogEnv`, `readValidatedParams`, and `findTaxonomyItem` directly with real constants and helpers.
- Use table-driven cases for product/wide page, fixed page sizes, IDs, and search terms. Cover omitted values, valid limits, forbidden numeric formats, ID pattern/30-character limit, trimmed valid query, empty/overlength/unsafe query, and taxonomy hit/miss.
- Set both Strapi variables for normal cases and restore their original values after each environment test; cover host-only, token-only, and both-missing `CAT_ENV_001` paths.

#### `__tests__/catalog/{products,category,brand,search,variants,categories,brands}/route.test.ts`

- **Action:** Create one suite per route, using real `Request` objects and the actual `_utils.ts` validation/envelope code.
- Mock only exact named exports from `@/shared/lib/global.lib`; do not mock Apollo, validators, constants, or route internals.
- Set `STRAPI_HOST` and `STRAPI_API_TOKEN` in each non-environment case; restore environment state after the suite.
- Keep setup inline and typed in each suite. Do not introduce route fixtures or request-builder helpers until repeated setup proves a need.
- Cover this route matrix:

| Test file | Required focused behavior |
| --- | --- |
| `products/route.test.ts` | Success envelope and validated page forwarding; invalid `pageSize` yields `CAT_VAL_002` without adapter call; rejected adapter maps to `CAT_ERR_001`. |
| `category/route.test.ts` | Valid taxonomy then `fetchProductsByCategory(categoryId, widePage)`; invalid ID `CAT_VAL_003`; absent taxonomy `CAT_NF_001` without product call; taxonomy or product rejection maps to `CAT_ERR_001`. |
| `brand/route.test.ts` | Mirror category with `CAT_VAL_004`, `CAT_NF_002`, and brand adapter forwarding; rejected taxonomy/product work maps to `CAT_ERR_001`. |
| `search/route.test.ts` | Trimmed term and wide-page forwarding; invalid term yields `CAT_VAL_006` without adapter call; rejection maps to `CAT_ERR_001`. |
| `variants/route.test.ts` | `{ documentId }` forwarding and exact success envelope; invalid document ID `CAT_VAL_005`; invalid fixed size `CAT_VAL_002`; rejection maps to `CAT_ERR_001`. |
| `categories/route.test.ts` | Success taxonomy envelope, adapter rejection `CAT_ERR_001`, and the single route-level missing-environment assertion (`CAT_ENV_001`). |
| `brands/route.test.ts` | Success taxonomy envelope and adapter rejection `CAT_ERR_001`. |

### Success Criteria

**Automated**

- Run each new test file with `pnpm test -- <relative test path>` while implementing.
- Run grouped catalog suites, then `pnpm test` after the validation and all seven routes pass.
- Run `pnpm lint` and `pnpm exec tsc --noEmit` because route and adapter signatures change.

**Manual**

- Inspect failures/responses to confirm every catalog validation, not-found, environment, and upstream error remains HTTP 400.
- Confirm category/brand Apollo failures no longer become successful empty arrays, while a successful Apollo response with missing `products` remains `[]`.
- Confirm `src/app/page.tsx` no longer accepts a numeric prefix or decimal page value, without adding a Server Component render test.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/app/api/catalog/_utils.ts`, `_utils.test.ts` | Strict numeric boundary, defaults/ranges, fixed sizes, IDs, terms, env, envelopes, taxonomy lookup | Targeted `_utils` test + grouped catalog tests |
| Seven catalog route files and route tests | Composition, forwarding, route-specific validation/not-found behavior, canonical upstream mapping | Targeted route tests + `pnpm test` |
| `src/shared/lib/global.lib.ts` category/brand adapters | Explicit array return, null-data fallback, rejection propagation | Category/brand route tests + Phase 2 adapter test |
| `src/app/page.tsx` | Digits-only normalization and retained five-page clamp | Source review + `pnpm exec tsc --noEmit` |

## Phase 2: Cover Browser Client And Apollo Adapter Boundaries

### Changes Required

#### `__tests__/shared/catalog-api.utils.test.ts`

- **Action:** Create.
- Mock only global `fetch` with typed response helpers; restore it after each test.
- Verify path and optional `RequestInit` forwarding, successful envelope extraction to `data`, and failure-envelope rejection as `CatalogApiError` with the original code/message.
- Verify one known catalog code returns its Spanish mapping and an unknown code uses the generic Spanish fallback.
- Do not add response-status, malformed-envelope, JSON-parser, or network-error behavior beyond confirming existing errors are not intercepted; those contracts are outside the story.

#### `__tests__/shared/global.lib.test.ts`

- **Action:** Create.
- Mock only the default `createApolloClient` export from `@/app/apollo-client` with a typed `query` mock; retain the real GraphQL documents imported by `global.lib.ts`.
- Verify exact query document and variables for all seven adapters:
  - `fetchProducts`: page with page size `50`.
  - `fetchProductsByCategory`: `category.customId.contains`, page, size `50`.
  - `fetchProductsByBrand`: `brand.customId.contains`, page, size `50`.
  - `fetchProductsByName`: `name.contains`, page, size `50`.
  - `fetchProductVariants`: document ID, page `1`, size `100`.
  - `fetchCategories` and `fetchBrands`: their query document without variables.
- Use exact production nesting in typed mock results: products, `product.product_variants`, categories, and brands.
- Assert empty-array fallback for missing/null product, variant, category, and brand fields. Assert rejected category and brand queries propagate rather than resolving `undefined`.
- Do not introduce a Strapi schema fixture layer, mock GraphQL documents, or add network requests.

### Success Criteria

**Automated**

- Run `pnpm test -- __tests__/shared/catalog-api.utils.test.ts` and `pnpm test -- __tests__/shared/global.lib.test.ts` during iteration.
- Run `pnpm test`, `pnpm lint`, and `pnpm exec tsc --noEmit` after both adapter suites pass.

**Manual**

- Review mocked call arguments to confirm they use production query documents and exact nested variable shape rather than reimplementing GraphQL behavior in the tests.
- Confirm all mocks remain at fetch/Apollo boundaries and use production response/domain types without `any` or `unknown` in test code.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `__tests__/shared/catalog-api.utils.test.ts` | Fetch forwarding, success extraction, typed error, known/unknown Spanish copy | Targeted test + `pnpm test` |
| `__tests__/shared/global.lib.test.ts` | Seven operations, documents, variables, response nesting, null fallbacks, category/brand propagation | Targeted test + `pnpm test` |
| `src/shared/utils/catalog-api.utils.ts` | No real browser network access in client tests | Fetch mock inspection |

## Phase 3: Align And Cover Theme Persistence

### Changes Required

#### `src/shared/constants/global.constants.ts`

- **Action:** Modify the existing theme-constant module rather than creating a preference module.
- Keep `THEME_COOKIE_KEY`; add `PRF_VAL_001`, its specific validation message, and one shared `AppTheme` type guard/allowlist for runtime values.
- Reuse this guard from both the cookie helper and preference route so their allowed values cannot drift.

#### `src/shared/lib/global.lib.ts`

- **Action:** Modify `getThemePreference` and `saveThemeCookie` near lines 152-169.
- Return `Promise<AppTheme>` from `getThemePreference`; missing, empty, or unsupported persisted cookie values return `"light"` without mutating cookies; valid `light`/`dark` values pass through.
- Accept `AppTheme` at the `saveThemeCookie` API but validate the runtime value at this trust boundary before calling `cookies().set`.
- Preserve exact valid cookie options: key `tehesa-theme`, `httpOnly: true`, `secure: true`, and `sameSite: "strict"`; invalid values reject and do not call `set`.

#### `src/app/api/preferences/route.ts`

- **Action:** Modify `POST`.
- Parse JSON separately enough to classify malformed JSON as input validation, then require a plain object with only the supported string `theme` field through the shared guard.
- For missing, null, non-string, unsupported, or malformed input, return HTTP 400 `{ success: false, code: "PRF_VAL_001", message }` and do not call `saveThemeCookie`.
- For valid input, call `saveThemeCookie` once and preserve HTTP 201 `{ success: true, themeChangedTo: theme }`.
- Preserve HTTP 400 handling for cookie-helper rejection without inventing a second preference error code.
- Remove the route's assertion-based error handling if no longer needed; do not change the existing `AppTheme` union.

#### `src/app/layout.tsx`

- **Action:** Modify `RootLayout` near `NextThemesProvider`.
- Change `defaultTheme` from `"dark"` to `"light"` so the client provider matches the cookie helper and Zustand-compatible default.

#### `__tests__/theme/global.lib.test.ts`

- **Action:** Create.
- Mock only named `cookies` from `next/headers` with typed async `get`/`set` functions.
- Cover absent/empty/invalid persisted cookie fallback to light, valid light/dark passthrough, exact secure cookie options for valid writes, and invalid write rejection without `set`.

#### `__tests__/preferences/route.test.ts`

- **Action:** Create.
- Mock only named `saveThemeCookie` from `@/shared/lib/global.lib`; use real `Request`/`NextRequest`-compatible JSON requests.
- Cover both accepted exact bodies and 201 response; cover missing, null, non-string, unsupported, extra-field, and malformed JSON bodies as `PRF_VAL_001` HTTP 400 with no save call.
- Cover helper rejection as HTTP 400 without claiming it is an input-validation code.

#### `REPO_CONTEXT.md` and `AGENTS.md`

- **Action:** Modify after the implementation/tests verify the behavior.
- Update light as the authoritative layout and cookie default, strict digits-only catalog parsing, category/brand propagated `CAT_ERR_001` failures, and preference validation/cookie boundaries.
- Keep these files concise and do not duplicate test cases or the canonical testing guide.

### Success Criteria

**Automated**

- Run `pnpm test -- __tests__/theme/global.lib.test.ts` and `pnpm test -- __tests__/preferences/route.test.ts` during iteration.
- Run `pnpm test`, `pnpm lint`, and `pnpm exec tsc --noEmit` after all Story 3 suites pass.
- Run `pnpm build` because server routes, server cookie handling, and root layout configuration changed. Supply `STRAPI_HOST` and `STRAPI_API_TOKEN` if the build's server data path requires them.

**Manual**

- Start the app without a theme cookie and confirm the rendered class/theme defaults to light; set each supported preference through `/api/preferences` and verify persistence.
- Send an invalid or malformed `POST /api/preferences` request and confirm HTTP 400 with `PRF_VAL_001`, without a cookie write.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `global.constants.ts`, `global.lib.ts`, `theme/global.lib.test.ts` | Single theme allowlist, light fallback, valid values, invalid write, exact secure cookie options | Targeted theme test + `pnpm exec tsc --noEmit` |
| `preferences/route.ts`, `preferences/route.test.ts` | Valid 201 response, invalid/malformed `PRF_VAL_001`, no invalid save, helper failure 400 | Targeted route test + manual API check |
| `layout.tsx` | Light default matches cookie/store contract | Manual no-cookie check + `pnpm build` |
| `REPO_CONTEXT.md`, `AGENTS.md` | Verified boundary defaults and error contracts remain documented | Documentation review after passing tests |

## Cross-Cutting Concerns

- **Test boundaries:** Keep `_utils`, envelopes, constants, Spanish mappings, GraphQL documents, and production response types real. Mock only named server adapters at route level, global fetch for the client, Apollo factory for adapters, `next/headers` cookies for theme helpers, and `saveThemeCookie` for preferences.
- **Strict parsing:** Input stays a raw HTTP string until it passes digits-only validation. Product pages retain a maximum of five; category, brand, and search routes use positive wide pages without an upper bound.
- **Null versus rejection:** Successful missing GraphQL collections return `[]`. Rejected Apollo work must reach the route catch and become `CAT_ERR_001`; it must never be converted to a successful empty response.
- **Server Component limitation:** Do not render `src/app/page.tsx` in Jest. Its direct normalization change is verified through code review/typecheck while shared parser tests cover the boundary semantics.
- **Theme trust boundary:** TypeScript's `AppTheme` is insufficient for cookie/JSON inputs; the shared runtime guard applies at both entry points. Invalid persisted cookies fall back to light without deletion.
- **No new tooling:** Do not add dependencies, browser shims, fixtures, request builders, MSW, TanStack Query, coverage thresholds, or test helper abstractions.

## Open Questions

None. The research document records all behavioral and Strapi-contract assumptions required for this story.

## Out Of Scope

- Async App Router page rendering tests, component tests, catalog UI behavior, or responsive/overlay coverage.
- Strapi schema fixtures, MSW, backend changes, GraphQL document changes, and real network requests.
- New routes, error-status redesign, malformed catalog response handling, or client response-status handling.
- Cookie expiry/path policy, theme UI refactors, direct cookie mutation from clients, Zustand changes, and test-guidance changes.
- Coverage thresholds, test dependencies/configuration, generated prompt changes, version bumps, changelog work, and CI workflow changes.
