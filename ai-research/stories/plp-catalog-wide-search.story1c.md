# Research: Add Catalog-Wide Product Search

## Story Definition

### Story Title

Add Catalog-Wide Search Drawer

### Source

- Parent epic: `ai-research/plp-functionality-seo.epic.md`
- Split from: `ai-research/plp-search-filtering.story-1.md`
- Follows implemented Story 1a:
  - `ai-research/plp-catalog-api.story1a.md`
  - `ai-planning/planning-plp-catalog-api.story1a.md`
- Complements Story 1b:
  - `ai-research/plp-filter-state-feedback.story1b.md`
- Scope decision: Story 1c, catalog-wide search drawer for product name, category, and brand.

### Story Description

Add a catalog-wide search drawer so users can search beyond the products currently loaded on the visible page. The drawer contains the catalog-wide product-name search plus the existing catalog-wide category and brand search controls.

This story assumes Story 1a is already implemented: client code uses `/api/catalog/*`, API responses use success/error envelopes, Strapi/Apollo calls are behind server actions, and errors use `CAT_*` codes. Story 1c extends that API pattern with a dedicated search route and relocates the existing category/brand wide-search UI into the same drawer.

### Acceptance Criteria

1. Users can distinguish `Filtrar resultados visibles` from a catalog-wide search drawer through labels, helper text, and the Story 1b wider-search prompt.
2. Local visible-results filtering remains client-side and continues to narrow only the current working set.
3. Catalog-wide product-name search queries Strapi through a new API route and replaces the current working set with matching products.
4. Existing category and brand wide-search dropdowns move into the catalog-wide search drawer and continue to use Story 1a `/api/catalog/category` and `/api/catalog/brand` routes.
5. Catalog-wide search uses Story 1a response envelopes and `CAT_*` error codes; raw Apollo/Strapi errors are not shown to users.
6. Search input is validated before reaching the GraphQL layer: trim whitespace, reject unsafe characters/control characters, and cap length at 100 characters.
7. Catalog-wide search empty, loading, invalid-input, and failure states render Spanish user-facing copy.
8. Clearing search/filter state returns users to the current page's original server-rendered products unless a later URL-sync story changes that behavior.

### Task Breakdown

1. Add a product-name GraphQL query and server action following Story 1a patterns.
2. Add a dedicated `/api/catalog/search` route that calls the server action and returns Story 1a envelopes.
3. Add validation for the search term and map invalid input to `CAT_VAL_006`.
4. Add a catalog-wide search drawer that contains product-name search, category search, and brand search controls.
5. Remove the wide-search category/brand dropdowns from the main inline PLP controls once they are available in the drawer.
6. Add a `Buscar en todo el catálogo` drawer trigger button, with primary placement in the Story 1b local empty-state advice block.
7. Wire the Story 1b wider-search button/prompt so it opens the catalog-wide search drawer.
8. Add Spanish loading, empty, invalid, and error copy for catalog-wide search.
9. Preserve Story 1b local filter behavior and avoid URL-sync/pagination metadata work.

### Scope Assessment

- Classification: single catalog-wide search drawer story.
- In scope: name-search GraphQL operation, server action, `/api/catalog/search` route, search-term validation, catalog-wide search drawer, moving existing category/brand wide-search dropdowns into the drawer, UI distinction between local and catalog search, search result state, Spanish search copy, Story 1a error envelope handling.
- Out of scope: category/brand API creation, existing product/category/brand route refactors, URL-synced filters, search result pagination beyond current fixed first-page behavior, backend schema changes, replacing hardcoded dropdown option source, product card redesign, variants drawer behavior, new dependencies, test framework setup.

### Baseline From Story 1a

Story 1a is treated as implemented for Story 1c planning:

- API routes live under `src/app/api/catalog/`.
- API routes call server actions; server actions remain the only Apollo/Strapi boundary.
- Client components use `fetch` against API routes.
- API success envelope: `{ success: true, data }`.
- API error envelope: `{ success: false, code, message }`.
- `CAT_*` error codes and internal `MSG_CAT_*` messages live under `src/shared/constants/`.
- `CAT_VAL_006` is reserved for invalid search terms in Story 1a planning.
- Missing Strapi config maps to `CAT_ENV_001`; upstream failures map to `CAT_ERR_001`.

### Relationship To Story 1b

Story 1b is implemented and owns local visible-results filter state and feedback:

- Active local visible-results filter state.
- Local filter clear behavior.
- Spanish empty state for local filtering.
- Stacked local text/category/brand filters over the current working set.
- Wider-search advice/button affordance in the local empty state.
- Existing category/brand dropdowns remain in place as wide-search controls until Story 1c moves them.

Story 1c should not redo local filtering work. It should move all catalog-wide search controls into one drawer.
Story 1c should make the wider-search prompt/button from Story 1b open the drawer.

## Technical Research

### Affected Areas

Routes/pages:

- `src/app/page.tsx` seeds initial products and current page into `Home`.
- Story 1c should leave the initial server-rendered fetch unchanged unless planning identifies a narrow need.
- New API route should follow Story 1a route conventions under `src/app/api/catalog/search/route.ts`.

Feature UI:

- `src/features/Home/Home.tsx` owns working set, visible products, category/brand selection, clear behavior, and should own catalog-search drawer state.
- `src/features/ProductListing/SearchInput.tsx` currently represents local filtering but is labeled generically as `Buscar producto`.
- `DropdownCategories` and `DropdownBrands` currently render inline in `Home`; Story 1c moves these wide-search controls into the catalog-wide search drawer.
- Story 1b keeps those dropdowns inline and updates their default labels to `Buscar categoría en todo el catálogo` and `Buscar marca en todo el catálogo`; Story 1c should remove those inline controls once the drawer versions exist.
- ProductListing controls need clear labels/helpers so users know whether they are filtering visible products or opening/searching the whole catalog.
- If Story 1b added a wider-search button in the local empty state, Story 1c wires that button to open the catalog-wide search drawer.
- Recommended placement: primary drawer trigger inside the local empty-state block, directly below `¿No encontraste lo que buscabas? Amplía la búsqueda al catálogo completo.` This makes the wide search a recovery path after local filtering fails.
- Optional persistent placement: one secondary `Buscar en todo el catálogo` button in the PLP controls area, visually separated from the local filter input and not grouped as part of that input. Do not place the drawer trigger inside the local `SearchInput` control.
- `src/features/ProductListing/ProductListing.tsx` owns the grid empty fallback.

Shared code:

- `src/shared/queries/global.queries.ts` needs a product-name search query.
- `src/shared/lib/global.lib.ts` needs a search server action that calls Apollo.
- `src/shared/types/global.types.ts` may need a response type if existing `FetchProductsResponse` is not enough.
- `src/shared/constants/` should reuse `CAT_VAL_006`, `CAT_ERR_001`, and any Story 1a error constants.
- Reuse Story 1a API envelope parsing / code mapping helper if it exists.

Tests:

- No test framework is configured.
- Use `pnpm lint`, `pnpm build`, and `pnpm exec tsc --noEmit` when shared types are changed.
- Do not invent `pnpm test`.

### Current Behavior Before Story 1c

- Local search filters only `allProducts.current` in memory by product name.
- Local search fires on every input change.
- Local search does not query Strapi and does not reset page to 1.
- Category/brand dropdowns replace the working set via API after Story 1a and are catalog-wide search controls that Story 1c moves into the drawer.
- Empty grid copy is handled by the implemented Story 1b baseline.
- There is no product-name search API route.

### Target Search Model

- Local visible-results filter: narrows `filteredProducts` from `allProducts.current` only.
- Catalog-wide search: submits a validated search term to `/api/catalog/search` and replaces `allProducts.current` plus `filteredProducts` with the server result set.
- Catalog-wide drawer controls are mutually exclusive for Story 1c: product-name search, category search, and brand search each replace the working set.
- Product-name search clears category and brand selections when it becomes active.
- Category search clears product-name search and brand selection when it becomes active.
- Brand search clears product-name search and category selection when it becomes active.
- Clearing all filters/search returns to the current page's original server-rendered products.
- Pagination remains hidden while catalog-wide search is active, matching current filtered-list behavior and avoiding unsupported pagination metadata claims.

### API/Data Path

Follow Story 1a architecture:

- Client calls `/api/catalog/search?q=${encodeURIComponent(term)}`.
- API route validates env and `q`.
- API route calls a server action, for example `fetchProductsByName(searchTerm)`.
- Server action calls Apollo with a new GraphQL operation, for example `GET_PRODUCTS_BY_NAME`.
- API route returns `{ success: true, data: Product[] }` or `{ success: false, code, message }`.

Proposed GraphQL shape, subject to implementation-time confirmation from existing Strapi behavior:

```graphql
query GetProductsByName(
  $filters: ProductFiltersInput
  $pagination: PaginationArg
) {
  products(filters: $filters, pagination: $pagination) {
    name
    minPrice
    maxPrice
    documentId
    variantCount
    category {
      name
    }
    brand {
      name
    }
  }
}
```

Variables:

- `filters.name.contains = q`
- `pagination.page = 1`
- `pagination.pageSize = 50`

### Search-Term Validation

- Trim whitespace.
- Reject empty search terms after trimming.
- Cap length at 100 characters.
- Reject control characters.
- Reject GraphQL-significant characters for contains-filter values, including `{`, `}`, quotes, and newlines.
- Prefer an allowlist or small safe-character validator over a broad blacklist.
- Invalid search term returns `400` with `CAT_VAL_006`.

### UI Copy Needs

Existing app copy is Spanish but inconsistently accented. Preserve the app's current copy style unless product asks for a broader copy pass.

Suggested copy for planning:

- Local label: `Filtrar resultados visibles`
- Local helper: `Filtra los productos que ya estas viendo`
- Drawer trigger: `Buscar en todo el catalogo`
- Drawer title: `Buscar en todo el catalogo`
- Catalog helper: `Busca coincidencias por nombre en el catalogo`
- Category helper: `Busca productos por categoria en todo el catalogo`
- Brand helper: `Busca productos por marca en todo el catalogo`
- Recovery prompt after local empty state: `No encontraste el producto que buscas? Buscalo en todo el catalogo.`
- Story 1b selected prompt: `¿No encontraste lo que buscabas? Amplía la búsqueda al catálogo completo.`
- Catalog loading: `Buscando productos en el catalogo...`
- Catalog empty: `No encontramos productos en el catalogo.`
- Invalid search: `Revisa el texto de busqueda e intentalo de nuevo.`
- Catalog failure: `No pudimos buscar productos. Intentalo de nuevo.`

### Error Handling With Story 1a Codes

- `CAT_VAL_006`: invalid search term.
- `CAT_ENV_001`: missing Strapi config.
- `CAT_ERR_001`: upstream catalog error.

Story 1c should map these codes to Spanish UI copy and avoid rendering raw API `message` as user-facing copy.

### Existing Patterns To Follow

- Keep domain UI under `src/features/Home/` and `src/features/ProductListing/`.
- Keep GraphQL operations in `src/shared/queries/global.queries.ts`.
- Keep Apollo access in server actions under `src/shared/lib/global.lib.ts`.
- Keep API route behavior under `src/app/api/catalog/search/route.ts`.
- Reuse Story 1a helpers for envelopes/errors if present.
- Do not add Zustand state for search.
- Do not add a data-fetching dependency.
- Do not add URL-sync in this story.

### Verification Rules To Follow Later

- Run `pnpm lint`.
- Run `pnpm exec tsc --noEmit` if shared query/types/API helpers are changed.
- Run `pnpm build` because this story adds an API route and client/API interaction.
- Manually verify desktop and mobile behavior.
- Do not run `pnpm test`; no test script exists.

## Open Questions

### Strapi Contract

I: Question: Does Strapi support product-name filtering through `ProductFiltersInput`, likely `name.contains`?
Status: answered
Answer: Assume available for this story.
Context: User previously allowed assuming name filtering exists for research.
Explanation: Implementation should still verify the exact filter shape against repo-visible GraphQL behavior and real route smoke checks.

II: Question: Should catalog-wide search return only page 1 with `pageSize: 50`, or support search pagination now?
Status: answered
Answer: Return page 1 with fixed `pageSize: 50` for Story 1c.
Context: Story 1a keeps page size fixed and pagination metadata remains unavailable.
Explanation: Search pagination belongs in a later story with pagination metadata or next-page inference.

III: Question: Should search consume Strapi pagination metadata?
Status: answered
Answer: No.
Context: Current product responses do not expose pagination metadata.
Explanation: Do not invent totals or page counts.

### Catalog Behavior

I: Question: Should catalog-wide product-name search combine with category/brand wide-search filters?
Status: answered
Answer: No for Story 1c.
Context: Parent Story 1 says keep one clear filter model and do not add query-builder behavior without product need.
Explanation: Drawer controls are mutually exclusive: product-name, category, and brand each replace the working set.

II: Question: Should catalog-wide search trigger on every keystroke or explicit submission?
Status: answered
Answer: Explicit submission.
Context: Current local filter fires on every input change, but server search should avoid network requests per keystroke.
Explanation: Explicit submission better separates local filtering from catalog search and avoids adding debounce/cancellation complexity.

III: Question: When clearing catalog-wide search, where should users return?
Status: answered
Answer: Current page's original server-rendered products.
Context: Story 1b uses the same clear behavior.
Explanation: This avoids URL/pagination work and keeps behavior predictable.

IV: Question: Should search state be reflected in the URL?
Status: answered
Answer: No for Story 1c.
Context: URL sync is out of scope for Story 1b and remains a later enhancement.

### UI And Product Decisions

I: Question: Should Story 1c normalize Spanish accents in new copy?
Status: pending
Context: Existing app copy is accent-light.
Explanation: Minimal path preserves current style; product can request a copy normalization pass separately.

II: Question: Should search results show a count or summary?
Status: answered
Answer: No count for Story 1c.
Context: No reliable total count or pagination metadata is available.
Explanation: A generic result state is safer than claiming totals.

III: Question: Should catalog-wide search live inline or in a drawer?
Status: answered
Answer: Use a drawer.
Context: User specified Story 1c should bring the wide UI, including category and brand dropdowns, into a drawer with product-name search.
Explanation: Main PLP keeps local visible-results filtering inline. Story 1b temporarily leaves category/brand wide-search dropdowns inline with clearer labels, and Story 1c moves those controls into the drawer and removes the inline versions.

IV: Question: Should Story 1c wire the wider-search button from Story 1b?
Status: answered
Answer: Yes.
Context: Story 1b can show the advice/button affordance, but Story 1c owns the drawer behavior.
Explanation: Story 1c makes that button open the catalog-wide search drawer.

V: Question: Where should the catalog-wide drawer trigger button be placed to avoid confusion with local filtering?
Status: answered
Answer: Primary placement is inside the local empty-state advice block. Optional persistent placement is a separate secondary button in the PLP controls area, visually separated from the local filter input.
Context: User asked where to place the button to avoid confusing local filtering with catalog-wide search.
Explanation: The empty-state placement frames wide search as the next step when local filtering fails. If always-visible access is needed, the persistent button must not be grouped inside the local input because that would make one control look like it has two search scopes.

### Validation And Security

I: Question: Should validation strip control characters before validating, or reject inputs containing them?
Status: answered
Answer: Reject.
Context: Fail-fast validation is already the accepted model from Story 1a.
Explanation: Rejecting is clearer and avoids silently changing the user's query.

II: Question: Should page size be caller-controlled for search?
Status: answered
Answer: No.
Context: Story 1a deferred caller-controlled page size to `docs/improvement.md`.

### API Dependency

I: Question: Is Story 1a implemented before Story 1c?
Status: answered
Answer: Yes.
Context: User instructed this story should consider Story 1a implemented already.

### Verification

I: Question: Should manual browser verification cover both mobile and desktop layouts?
Status: answered
Answer: Yes.
Context: Search controls must remain understandable on both layouts.

II: Question: Should implementation run `pnpm build`?
Status: answered
Answer: Yes.
Context: Story 1c adds an API route and client/API integration.

## Assumptions Made

- Story 1a is implemented.
- Story 1b local filter feedback is implemented and should be treated as baseline.
- Story 1b may add a wider-search advice/button affordance; Story 1c wires it to the drawer.
- Primary drawer trigger placement is the local empty-state advice block; optional persistent placement must be visually separated from local filtering controls.
- Catalog-wide search uses a new `/api/catalog/search` route.
- Search returns first page only with fixed `pageSize: 50`.
- Catalog-wide drawer controls are mutually exclusive: product name, category, and brand each replace the working set.
- Story 1c removes the inline category/brand wide-search dropdowns after recreating them in the drawer.
- Search does not sync to the URL.
- Search does not show totals or page counts.
- No new dependencies are needed.

## Research Outcome

- Story 1c is independently plannable after Story 1a.
- Story 1c should not be merged back into Story 1b; catalog-wide search has its own API/data and drawer UI decisions.
- Main implementation work is a search query/server action/API route plus a catalog-wide search drawer containing product-name, category, and brand search controls.
