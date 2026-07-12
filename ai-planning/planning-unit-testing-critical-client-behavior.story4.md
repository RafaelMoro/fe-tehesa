# Plan: Protect Critical Client Behavior

## Header

- **Story:** Protect critical client behavior with integration-focused tests
- **Source research:** [`ai-research/unit-testing-critical-client-behavior.story4.md`](../ai-research/unit-testing-critical-client-behavior.story4.md)
- **Research sign-off:** Confirmed by the user on 2026-07-12
- **Plan status:** Awaiting implementation sign-off
- **Assumptions:**
  - Stories 1-3, `docs/UNIT_TESTING_GUIDELINES.md`, and `/unit-test` are the current test baseline.
  - Catalog fetch mocks use Story 3's `{ success, data }` / `{ success: false, code, message }` envelopes and never call Strapi.
  - The existing 50-item wide-pagination heuristic and USD formatting are product contracts, not test-only behavior.
  - HeroUI overlay behavior remains real; any missing browser API is shimmed inside the affected suite only after a reproducible failure.

## Acceptance Criteria

1. Catalog tests cover stacked local filters, local clearing, catalog-wide mode replacement, visible failures/empty results, normal and wide pagination, and opening product details through the real Home component tree.
2. Catalog search tests cover trimming, whitespace validation, loading, success, empty results, mapped errors, input reset, mode changes, pagination, and products-prop reset.
3. Variant drawer tests cover closed/open fetch behavior, loading, empty results, visible failure, ascending numeric price order, formatting, cleanup, and refetch.
4. Theme tests cover store initialization/update and best-effort persistence-driven transitions through an accessible toggle.
5. ProductCard zero values remain visible, and `useMediaQuery` tests document all viewport query outputs without class or layout assertions.

## Affected Files

### Catalog Client Behavior

- `src/features/Home/Home.tsx` - modify shared page-level catalog feedback and its lifecycle.
- `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx` - modify field-error rendering to expose the actual validation message.
- `__tests__/home/Home.test.tsx` - create real Home-tree integration coverage.
- `__tests__/home/useCatalogSearch.test.tsx` - create focused hook state-transition coverage.

### Variants And Product Data

- `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` - modify explicit request state and stale-effect cleanup.
- `src/components/ProductCard.tsx` - modify zero-value presence checks.
- `__tests__/product-variants/ProductVariantsDrawer.test.tsx` - create drawer behavior coverage.
- `__tests__/product-listing/ProductCard.test.tsx` - create zero-value rendering coverage.

### Theme And Viewport

- `src/shared/ui/atoms/ToggleDarkMode.tsx` - modify dynamic accessible name.
- `src/shared/utils/global.utils.ts` - modify `saveThemeApi` parameter type only if required to align it with `AppTheme`.
- `__tests__/theme/change-theme.store.test.ts` - create vanilla Zustand store coverage.
- `__tests__/theme/ToggleDarkMode.test.tsx` - create toggle/persistence coverage.
- `__tests__/shared/useMediaQuery.test.tsx` - create viewport snapshot coverage.

### Documentation

- `REPO_CONTEXT.md` - modify only after passing tests establish broadly useful catalog feedback and variants request-state facts.

### Explicitly Unchanged

- Catalog route/API client contracts, GraphQL/Apollo adapters, theme cookie/route behavior, Jest configuration/setup, dependencies, and CI.
- `useCatalogSearch.ts` unless implementation proves Home cannot clear/display its existing message contract without a minimal public-state adjustment.
- ProductCard responsive CSS/layout, Header logo behavior, Zustand provider isolation, and existing test files.

## Phase 1: Add Catalog Feedback And Cover Home/Search Flows

### Changes Required

#### `src/features/Home/Home.tsx`

- **Action:** Modify near the catalog-wide selection state and catalog-wide controls.
- Add one page-level feedback state with a minimal shape such as `{ message: string; kind: "status" | "error" } | null`; render it once beside the catalog-wide controls.
- Render empty name-search feedback with accessible status semantics and category/brand failures with `role="alert"`. Use `catalogErrorToSpanish` for known failure codes and its existing generic Spanish fallback for unknown failures.
- Clear stale page feedback when a catalog-wide request starts, results succeed, the catalog search term is edited, catalog mode/search is cleared, or the `products` prop changes.
- On category/brand failure, preserve current products and active mode; only record feedback. On successful category/brand/name results, replace the working/rendered set, clear local filters, maintain catalog-mode mutual exclusivity, and calculate `hasNextCatalogPage` from `results.length === 50`.
- On an empty successful name search, close the search drawer through the hook's existing flow and surface `No encontramos productos en el catálogo.` through the shared page state.
- Wrap or coordinate the hook callbacks only enough to clear Home-owned feedback. Do not move local filters, product-details drawer state, normal pagination, or catalog-wide mode ownership into a new abstraction.
- Pass the current invalid catalog-search message to `CatalogSearchDrawer` as its field-error copy; retain `catalogMessage` for existing loading and drawer status display.

#### `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx`

- **Action:** Modify `CatalogSearchDrawerProps` and the invalid `FieldError` branch near lines 18-84.
- Accept/render the hook's current validation message when `isInvalidSearch` is true, so whitespace and server validation feedback are specific and observable.
- Preserve the loading spinner, description, form submission, category/brand controls, and drawer state. Do not create a second alert or feedback widget inside the drawer.

#### `__tests__/home/Home.test.tsx`

- **Action:** Create.
- Render the real `Home` subtree through `@__tests__/test-utils` with typed products/taxonomies. Keep SearchInput, dropdowns, ProductListing, ProductCard, CatalogSearchDrawer, and ProductVariantsDrawer real.
- Mock only `next/navigation` with a stable `push` mock, global `fetch` with typed catalog envelopes/deferred responses, and local `window.scrollTo` for normal pagination. Use global `screen` for portalled dropdown/drawer content.
- Cover focused stateful scenarios, combining steps where setup overlaps:
  - Stack local trimmed name, category, and brand filters; assert the intersection; clear local filters and restore the current working set.
  - Reach local no-match content and use its real `Buscar en todo el catálogo` recovery action to open the catalog drawer.
  - Apply category then brand wide results; verify endpoint parameters, replacement data, local-filter reset, drawer closure, and one active catalog-wide mode.
  - Reject category and brand requests; assert translated page-level alerts and unchanged products/mode.
  - Use normal pagination to assert `push("/?page=2")` and smooth `scrollTo`.
  - Return exactly 50 wide results to enable `Siguiente`; request page 2 with the existing active category/brand/name parameter and assert the page label/data update. Confirm `Anterior` is disabled on page 1.
  - Click real `Ver detalles`; assert the real variants drawer opens and calls the selected product's variants endpoint.
- Do not assert private state, Tailwind classes, card responsive styling, or individual internal setter calls.

#### `__tests__/home/useCatalogSearch.test.tsx`

- **Action:** Create.
- Use Testing Library hook rendering with the real hook and its real HeroUI overlay state. Mock global `fetch` through the existing `fetchCatalog` behavior; do not mock `useCatalogSearch`.
- Cover whitespace trim/no request/specific invalid message; editing clears invalid/message state; deferred fetch loading message; successful trimmed/encoded term with page forwarding, name mode, drawer close, and products return; empty-success message; `CAT_VAL_006` invalid state; known-code mapping; generic unknown failure copy; `beginCatalogMode`; `clearAllCatalogState`; and reset on changed `products` props.
- Assert public return values and rendered overlay state only. Do not duplicate Home's filter, product replacement, or pagination integration tests.

### Success Criteria

**Automated**

- Run `pnpm test -- __tests__/home/useCatalogSearch.test.tsx` and `pnpm test -- __tests__/home/Home.test.tsx` while implementing.
- Run `pnpm test`, `pnpm lint`, and `pnpm exec tsc --noEmit` after both suites pass.

**Manual**

- In the browser, apply local filters, clear them, then run category, brand, and name catalog-wide searches; verify errors and empty name results are visible inline rather than only in a drawer or console.
- Confirm normal pagination remains numbered while any active wide mode exposes previous/next controls and retains its active parameter.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `Home.tsx`, `Home.test.tsx` | Local/wide state transitions, feedback visibility, pagination, product details, real internal controls | Targeted Home test + manual browser flow |
| `useCatalogSearch.ts`, `useCatalogSearch.test.tsx` | Input/request/message/mode/reset lifecycle without duplicating Home tree | Targeted hook test |
| `CatalogSearchDrawer.tsx` | Specific invalid field message through accessible FieldError | Home/hook tests + manual drawer check |

## Phase 2: Make Variants And Zero Values Observable

### Changes Required

#### `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`

- **Action:** Modify local request state and the `useEffect` near lines 29-61.
- Add explicit `isLoading` and error-message state alongside formatted variants. When open, clear prior rows/errors, expose an accessible loading status, fetch variants, map/format/sort by numeric price ascending, then render either the table or a Spanish empty-result message.
- On fetch rejection, map a known `CatalogApiError` code through `catalogErrorToSpanish`, otherwise use one generic Spanish error, and render it with `role="alert"`.
- Reset variants, loading, and error state on close; retain one close handler for both footer buttons.
- Add the smallest effect-local active/cleanup guard so a closed drawer or changed product cannot display results from an earlier request. Do not add abort controllers, cancellation libraries, or a shared request abstraction.

#### `src/components/ProductCard.tsx`

- **Action:** Modify `minPriceString`, `maxPriceString`, and `variantCount` conditional rendering near lines 23-35 and 76-95.
- Replace truthiness checks with explicit null/undefined presence checks so `0` formats as `$0.00`, a zero variant count is shown, and only absent values are hidden.
- Preserve existing USD formatter, detail-button behavior, and all responsive CSS calculations.

#### `__tests__/product-variants/ProductVariantsDrawer.test.tsx`

- **Action:** Create.
- Render the real drawer through `@__tests__/test-utils` with a real HeroUI overlay state; mock only global fetch with typed catalog envelopes/deferred promises.
- Cover closed state without a request; open pending status; successful empty-result message; known/generic accessible failure; successful sorted ascending rows with USD formatting; and one close/reopen sequence proving old rows disappear while the next request is pending and the endpoint refetches.
- Resolve a deferred first request after closing or changing product and assert its stale data is not rendered.
- Use roles/accessibility names and table content; do not inspect component state or test both identical close buttons.

#### `__tests__/product-listing/ProductCard.test.tsx`

- **Action:** Create.
- Render one product with `variantCount`, `minPrice`, and `maxPrice` equal to zero; assert `0 variantes disponibles` and the `$0.00` range are visible.
- Do not repeat normal card rendering, detail-click behavior, media-query branches, or CSS assertions already covered/deferred elsewhere.

### Success Criteria

**Automated**

- Run `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx` and `pnpm test -- __tests__/product-listing/ProductCard.test.tsx` while implementing.
- Run `pnpm test`, `pnpm lint`, and `pnpm exec tsc --noEmit` after both suites pass.

**Manual**

- Open details for a product with variants, an empty variants result, and a failed variants request; confirm loading, table/empty/error output, then close/reopen without stale rows.
- Confirm a zero-price/zero-variant product presents its values instead of appearing incomplete.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `ProductVariantsDrawer.tsx`, drawer test | Open-only fetch, loading/empty/error states, sort/format, cleanup and refetch | Targeted variants test + manual drawer check |
| `ProductCard.tsx`, card test | Zero count and zero USD range presence | Targeted ProductCard test |
| `catalog-api.utils.ts` boundary | Drawer uses existing catalog error mapping with no real network | Fetch-mock assertions |

## Phase 3: Cover Theme Store, Toggle, And Viewport Snapshots

### Changes Required

#### `src/shared/ui/atoms/ToggleDarkMode.tsx`

- **Action:** Modify the icon-only `Button` near `toggleDarkMode`.
- Add a dynamic accessible name: `Activar modo oscuro` for current light theme and `Activar modo claro` otherwise.
- Preserve mounted guard and best-effort sequence: await `saveThemeApi(nextTheme)`, then call `setTheme(nextTheme)` even when persistence resolves non-OK or catches a rejected fetch.

#### `src/shared/utils/global.utils.ts`

- **Action:** Modify only if TypeScript requires `saveThemeApi` to accept `AppTheme` rather than a broad string.
- Preserve the existing POST shape, successful response return, caught network rejection, and existing console log. Do not add response-status error handling.

#### `__tests__/theme/change-theme.store.test.ts`

- **Action:** Create.
- Create a fresh vanilla `createThemeStore` instance per case and exercise its public `getState()` / `updateTheme()` API.
- Cover light default, honored custom initial state, and `updateTheme("dark")`. Do not add a provider integration test.

#### `__tests__/theme/ToggleDarkMode.test.tsx`

- **Action:** Create.
- Mock `next-themes` only for deterministic `theme` / `setTheme`, and mock global fetch for the existing `saveThemeApi` boundary; render the real toggle through `@__tests__/test-utils`.
- Use table-driven light-to-dark and dark-to-light interactions to assert dynamic accessible name, preference POST body, awaited persistence attempt, and `setTheme` transition.
- Cover one non-OK response and one rejected fetch path; both still call `setTheme`. Do not retest `/api/preferences` route validation.

#### `__tests__/shared/useMediaQuery.test.tsx`

- **Action:** Create.
- Render the real hook using Testing Library and override `window.matchMedia` locally with a typed implementation keyed by query string; restore the global descriptor after each case.
- Cover missing/unavailable `matchMedia` all-false fallback and each existing query's true output: mobile, mobile/tablet, desktop, desktop X2.
- Document this as a synchronous snapshot; do not add resize subscriptions or assert ProductCard classes/layout.

#### `REPO_CONTEXT.md`

- **Action:** Modify after passing behavior tests only if the final shared catalog feedback lifecycle and variants loading/empty/error states are non-obvious cross-cutting contracts.
- Keep the update concise; do not reproduce test matrices or alter historical research.

### Success Criteria

**Automated**

- Run each of `pnpm test -- __tests__/theme/change-theme.store.test.ts`, `pnpm test -- __tests__/theme/ToggleDarkMode.test.tsx`, and `pnpm test -- __tests__/shared/useMediaQuery.test.tsx` while implementing.
- Run final `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` because client production behavior changes.

**Manual**

- Toggle the theme in both directions with a successful, non-OK, and unavailable preference response; verify the visible theme changes after the attempted persistence and the button announces the next action.
- Check mobile/tablet/desktop widths only for viewport-hook behavior if needed; no visual-layout assertion or manual redesign is part of this story.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `change-theme.store.ts`, store test | Default/custom state and public update API | Targeted store test |
| `ToggleDarkMode.tsx`, toggle test | Accessible name, both directions, persistence attempt/failure behavior | Targeted toggle test + manual toggle check |
| `useMediaQuery.tsx`, hook test | Four query snapshots and unavailable fallback | Targeted hook test |
| `REPO_CONTEXT.md` | Verified shared client-state behavior, if updated | Documentation review after final tests |

## Cross-Cutting Concerns

- **Mock boundaries:** Mock only global fetch, `next/navigation`, `next-themes`, and test-local browser APIs. Keep all internal components, hooks, formatters, catalog utilities, HeroUI, and icons real.
- **Accessibility:** Use global `screen`, roles, accessible names, status, alert, labels, and text for HeroUI portals. Use `within` only to disambiguate duplicate accessible controls in an open dialog.
- **Feedback lifecycle:** A single Home-owned page feedback path handles category, brand, and empty name-search outcomes. Failures cannot replace products or catalog mode; new requests and reset actions remove stale feedback.
- **Pagination:** Numbered navigation remains server-page router navigation. Wide-mode navigation never uses the router and enables next only for exactly 50 returned products.
- **Request races:** Variants cleanup prevents stale completion after close/product change; it does not introduce cancellation infrastructure.
- **Scope limits:** `useMediaQuery` intentionally does not subscribe to resize. ProductCard viewport differences remain CSS-only and are not tested as semantic behavior.

## Open Questions

None. The research resolves all client behavior, state ownership, and error-display decisions.

## Out Of Scope

- New dependencies, global browser shims, test utilities, fixture layers, router providers, TanStack Query, or internal component mocks.
- Catalog API/route, Apollo, Strapi, cookie validation, or server-component tests.
- ProductCard responsive style assertions, Header logo precedence, Zustand provider isolation, UI redesign, currency changes, or changes to the 50-item heuristic.
- Real network calls, coverage thresholds, Jest/CI/configuration changes, version/changelog/release changes, and historical research rewrites.

## Plan deviation

### Phase 1 deviation

- Home integration coverage keeps the real drawer/category success path, pagination, local filters, and product details coverage, but does not assert the category failure alert through HeroUI dropdown selection because that interaction is flaky in jsdom. The failure/message lifecycle is covered in `useCatalogSearch.test.tsx` against the real hook and `fetchCatalog` path instead.
