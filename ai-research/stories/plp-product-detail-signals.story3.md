# Research: Improve Product Detail Signals On Cards And Drawer

## Story Definition

### Story Title

Improve product detail signals on cards and drawer.

### Source

Story 3 of `ai-research/epics/plp-functionality-seo.epic.md`. Completion audit for this story is recorded at `ai-research/epics/plp-functionality-seo.epic.md:590-602` and assessed the story at roughly 60% complete.

### Story Description

Help users decide which product to inspect by improving functional product metadata on the product card, correcting price presentation, and closing the remaining gaps in variant detail behavior.

Two of the five epic acceptance criteria are already shipped. This story covers the unshipped remainder: real product signals on the card (today one signal is rendered from data the catalog never fetches), MXN currency formatting, and the card states that occur when backend fields are missing.

Image-aware card variants remain blocked on backend work and are explicitly deferred; see `Image Readiness Checklist` below.

### Acceptance Criteria

1. Every product signal the card renders is backed by data the PLP queries actually return, or the branch that renders it is removed. No card element depends on a field absent from `GET_PRODUCTS`, `GET_PRODUCTS_BY_CATEGORY`, `GET_PRODUCTS_BY_BRAND`, and `GET_PRODUCTS_BY_NAME`.
2. All prices across the product card and the variants drawer format as MXN while preserving the `$1,234.50` display style, with tests updated to assert the new output.
3. The card renders a defined, non-broken state for each incomplete-data case observed in the current contract: missing category, missing brand, missing price range, identical min and max price, and zero variant count.
4. The variant SKU (`internalId`) is surfaced where the data is already fetched, rather than by widening the PLP list queries.
5. Existing drawer loading, empty, and error states and the ascending numeric price sort remain intact and covered by tests.

### Task Breakdown

1. Resolve the dead `Modelo {internalId}` branch on `ProductCard` — either remove it or back it with fetched data (see open question Strapi I).
2. Switch `formatNumberToCurrency` to MXN with `currencyDisplay: "narrowSymbol"` and update the four affected test assertions.
3. Define and implement card copy for the incomplete-data cases in AC3.
4. Surface `internalId` in the variants drawer rows, where `GET_PRODUCT_VARIANTS` already returns it.
5. Re-run the existing drawer and card test suites; extend only where AC3 adds new branches.

### Scope Assessment

Single story, 2-3 implementation phases. It touches two components, one shared util, and their tests. No new routes, no new dependencies, no query changes unless open question Strapi I resolves toward widening the list queries.

### Dependencies

- **No dependency on unshipped stories.** Story 1a (catalog API) and Story 2 (pagination) are complete and provide everything this story reads.
- **Blocked sub-scope:** AC2 of the epic (image and no-image card versions) depends on Strapi exposing a product image field and on confirming the public media host. Not included in this story's acceptance criteria.
- **Downstream, not blocking:** the `Agregar al carrito` buttons on both the card and the drawer footer stay inert until the separate cart story lands. This story must not wire them up.

## Design Agent Handoff

### User Goal And Affected Surface

A buyer scans a grid of up to 50 tool and hardware products and decides which one to open for variant pricing. The affected surfaces are the PLP product grid on `/` (`src/features/ProductListing/ProductListing.tsx`, `src/components/ProductCard.tsx`) and the right-side variants drawer (`src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`).

### Required States

Product card:

- **Default** — category/brand line, product name, price range, primary action showing variant count.
- **Missing taxonomy** — `category` and/or `brand` can be `null`. The card currently joins whichever exist with ` / ` and hides the line entirely when both are absent.
- **Missing price range** — `minPrice`/`maxPrice` are optional. The entire price block is currently hidden with no replacement copy, leaving a visually empty content band.
- **Single price point** — when min equals max the card reads `Desde $X` / `Hasta $X`, which is redundant.
- **Zero variants** — `variantCount: 0` currently produces the action label `Explorar las 0 variantes`.
- **Loading** — `src/components/ProductCardSkeleton.tsx`, rendered nine at a time by `src/app/loading.tsx`. Its block structure must stay aligned with whatever the real card becomes, or page transitions will shift layout.

Variants drawer: loading, empty, error, and loaded states already exist and are covered by tests. Design work here is limited to placing the SKU within an existing row without crowding the diameter/quantity/price grid.

### Mobile And Desktop Expectations

The grid is one column by default and three columns at `lg` (`ProductListing.tsx:60`). The drawer is right-placed and full width on all breakpoints (`ProductVariantsDrawer.tsx:120`). `src/shared/hooks/useMediaQuery.tsx` provides breakpoint booleans but does not update on resize, so it is not a reliable basis for new responsive behavior.

### Accessibility Requirements

Preserve the existing semantics: `role="status"` on the drawer loading message, `role="alert"` on the drawer error, per-variant checkbox and quantity `aria-label`s, and the icon-only close button's accessible name. Any new card copy that replaces a missing value must be readable text, not a bare dash or an empty node.

### Visual Patterns To Preserve

Follow `DESIGN.md` (validate with `pnpm design:lint`). Keep HeroUI `Card` composition (`Card.Header`/`Content`/`Footer`), Tailwind v4 utilities, the emerald accent used for the taxonomy line and selected variant rows, and `border-default-200` dividers. No CSS-in-JS, no new styling libraries.

### Content And Technical Constraints

- Spanish copy throughout.
- Do not invent stock, availability, shipping, or delivery data. None of it exists in the contract.
- Do not reserve image space or render an image placeholder — there are no product images and a permanent empty frame reads as broken.
- Prices are MXN and must keep the `$1,234.50` separator style.

### Explicitly Out Of Scope

Image-bearing card layout, cart interaction design, product detail routes, and any change to the drawer's variant selection or quantity mechanics.

### Unanswered Design Questions

Copy for zero-variant products, for identical min/max price, and for a missing price range. See open questions UI I through III.

## Technical Research

### Affected Areas

| Path | Role in this story |
|------|--------------------|
| `src/components/ProductCard.tsx` | Renders every product signal. Holds the dead `internalId` branch at line 16 and the price block at lines 42-55 |
| `src/components/ProductCardSkeleton.tsx` | Loading mirror of the card; must track structural changes |
| `src/shared/utils/global.utils.ts` | `formatNumberToCurrency`, lines 21-28 — the single formatter for card and drawer |
| `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` | Maps and sorts variants at lines 60-67; drops `internalId` |
| `src/shared/types/global.types.ts` | `Product`, `ProductVariant`, `ProductVariantUI` |
| `src/shared/queries/global.queries.ts` | The four list queries and `GET_PRODUCT_VARIANTS` |
| `__tests__/product-listing/ProductCard.test.tsx` | Two cases; both assert USD output |
| `__tests__/product-variants/ProductVariantsDrawer.test.tsx` | Asserts USD output at lines 151-185 |
| `__tests__/shared/global.utils.test.ts` | Asserts `$1,234.50` and names USD at lines 4-5 |

### Current Behavior Audit Against Epic Acceptance Criteria

**Epic AC1 — cards show available backend signals: partial.**

The card renders category, brand, name, variant count, and min/max price from fetched data. It also renders `Modelo {internalId}` — but see the first non-obvious finding; that data never arrives.

Three fields named in the epic's observed contract (`description`, `subcategory`, `hasOneProductVariant`) appear in none of the four list queries and in no TypeScript type. They cannot be rendered without a query change and confirmation they exist on the Strapi schema.

**Epic AC2 — image and no-image card versions: not started, blocked.** No `next/image` usage exists anywhere in the catalog; the only `Image` import in the repo is the logo in `src/shared/ui/organisms/Header.tsx`.

**Epic AC3 — drawer loading, empty, error: done.** `ProductVariantsDrawer.tsx:143-147` covers all three with Spanish copy and correct ARIA roles.

**Epic AC4 — prices sorted and formatted: partial.** The ascending numeric sort at line 66 is correct. The currency is still USD.

**Epic AC5 — Spanish drawer labels: done.**

### Currency Change Analysis

The change itself is one object literal in `src/shared/utils/global.utils.ts`:

- Current: `Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 })` → `$1,234.50`.
- Naive MXN swap: `en-US` + `MXN` renders `MX$1,234.50`, which changes every price on the page.
- Epic answer (UI question III) specifies keeping the `$1,234.50` style, which requires adding `currencyDisplay: "narrowSymbol"`.

Blast radius is four assertions across three test files:

- `__tests__/shared/global.utils.test.ts:4-5` — test name says USD and asserts `$1,234.50`. With `narrowSymbol` the assertion value is unchanged; only the test name needs correcting. This makes the test a weak guard, so the story should add one assertion that actually distinguishes MXN from USD.
- `__tests__/product-variants/ProductVariantsDrawer.test.tsx:132,151,153,185` — one test name and three price assertions.
- `__tests__/product-listing/ProductCard.test.tsx:39-40` — two `$0.00` assertions, unchanged in value.

Because `narrowSymbol` makes MXN and USD produce identical strings for these inputs, no existing test would fail if the currency were changed incorrectly. Verification must therefore assert on `formatToParts` or on a locale-visible difference rather than the formatted string alone.

### Image Readiness Checklist (Blocked, Documented For Later)

Confirmed with the user on 2026-07-27: Strapi still has no product image field. Before the image sub-scope can be planned, the following must be true:

1. Strapi exposes an image field on `Product` and its GraphQL path is known.
2. The four list queries can select it without a prohibitive cost at page size 50.
3. The public media host is known and is not `localhost`.
4. `next.config.ts` gains `images.remotePatterns` for that host — the config currently has only `transpilePackages` and no `images` key at all.
5. `ProductCardSkeleton` gains a media block matching the image card, to avoid layout shift on load.

### Existing Patterns To Follow

- Server component `src/app/page.tsx` fetches through `"use server"` actions in `src/shared/lib/global.lib.ts`; the drawer is the only client-side consumer of the catalog HTTP API, via `fetchCatalog` in `src/shared/utils/catalog-api.utils.ts`.
- Adapters in `global.lib.ts` deliberately have no local try/catch — errors propagate and become `CAT_ERR_001` at the route edge. Do not add local catches.
- Known failure codes map to Spanish through `catalogErrorToSpanish`.
- Keep domain UI under `src/features/<Feature>/`; `src/components/` holds only the shared card and its skeleton.
- Tests live in root `__tests__/`, never co-located. Canonical rules are in `docs/UNIT_TESTING_GUIDELINES.md`; do not restate them in the plan.

### Verification Rules To Follow Later

- `pnpm lint` for ESLint.
- `pnpm exec tsc --noEmit` for standalone type checking.
- `pnpm build` for the production build and integrated type check.
- `pnpm test -- __tests__/shared/global.utils.test.ts`, `pnpm test -- __tests__/product-listing/ProductCard.test.tsx`, and `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx` for targeted runs; `pnpm test` for the full suite with coverage.
- `pnpm design:lint` if card visual tokens change.
- Do not run `pnpm install`. No new dependencies are needed for any part of this story.

## Open Questions

### Strapi Contract

I: Question: Should the PLP list queries select `product_variants { internalId }` so the card's `Modelo` line renders, or should that card branch be deleted?
Status: pending
Context: `ProductCard.tsx:16` reads `product.product_variants?.[0]?.internalId`, but none of the four list queries select `product_variants`. The branch is unreachable in production.
Explanation: Widening the list queries fetches a nested relation for 50 products per page and needs a Strapi-side limit such as `product_variants(pagination: { limit: 1 })` to stay cheap. Deleting the branch costs nothing and loses a signal that is already available in the drawer. Recommendation is to delete the card branch and surface the SKU in the drawer instead, but this is a product call.

II: Question: Are `description`, `subcategory`, and `hasOneProductVariant` selectable on the product list queries?
Status: pending
Context: The epic's observed product example lists all three, but no query selects them and no TypeScript type declares them.
Explanation: The epic also notes these can be `null` or empty string, so any card design using them needs a defined absent state. Confirm existence on the schema before planning card copy around them.

III: Question: Are product image URLs available through the current frontend contract?
Status: answered
Answer: No. Strapi still has no product image field as of 2026-07-27. The image and no-image card versions remain blocked and are excluded from this story's acceptance criteria.
Context: Carried forward from epic open question Strapi III and re-confirmed with the user during this research.

### UI And Product Decisions

I: Question: What should the primary action read when `variantCount` is 0?
Status: pending
Context: `ProductCard.tsx:24-27` produces `Explorar las 0 variantes`, and `__tests__/product-listing/ProductCard.test.tsx:35-37` asserts exactly that string.
Explanation: A zero-variant product currently invites the user into a drawer that will immediately show `No encontramos variantes para este producto.` Options are to disable the action, change the label, or confirm zero-variant products cannot reach the PLP at all.

II: Question: What should the price block show when `minPrice` equals `maxPrice`?
Status: pending
Context: The card renders a two-column `Desde` / `Hasta` grid unconditionally when both values are present.
Explanation: Products with a single variant would show the same figure twice. A single-price presentation may be clearer, and the epic's observed `hasOneProductVariant` field may identify these products if open question Strapi II resolves positively.

III: Question: What should the card show when `minPrice` or `maxPrice` is absent?
Status: pending
Context: `ProductCard.tsx:43` hides the entire price block when either value is missing, leaving an empty bordered band between header and footer.
Explanation: Epic AC1 asks for consistent signals. Options are Spanish fallback copy such as `Precio disponible al consultar variantes`, or collapsing the content band entirely so the card does not look truncated.

IV: Question: Should prices display as MXN with `$` or with `MX$`?
Status: answered
Answer: MXN with the `$1,234.50` display style, which requires `currencyDisplay: "narrowSymbol"` on an `en-US` formatter. Confirmed as in scope for this story on 2026-07-27.
Context: Carried forward from epic open question UI III. `formatNumberToCurrency` still uses USD.

V: Question: Where should the variant SKU appear in the drawer?
Status: pending
Context: `GET_PRODUCT_VARIANTS` already returns `internalId`, but `ProductVariantsDrawer.tsx:60-66` drops it during mapping and `ProductVariantUI` has no field for it.
Explanation: The variant row is already a four-column grid (checkbox, diameter, quantity, price). Adding a fifth column risks crowding on mobile; a secondary line under the diameter is likely better, but this is a design call.

### Verification

I: Question: How should tests prove the currency is MXN when `narrowSymbol` makes MXN and USD render identically?
Status: pending
Context: All four existing price assertions would still pass after an incorrect currency change.
Explanation: Candidate approaches are asserting on `Intl.NumberFormat.prototype.formatToParts` output, asserting `resolvedOptions().currency`, or asserting a formatted value under a locale where the two currencies diverge. Pick one during planning so the guard is real rather than decorative.

II: Question: Do the incomplete-data card states from AC3 each need their own test?
Status: pending
Context: `__tests__/product-listing/ProductCard.test.tsx` currently has two cases: missing relation, and zero count with zero price.
Explanation: The missing-category case is already covered. Missing price range, identical min/max, and any new fallback copy are new branches and would normally each warrant a case under `docs/UNIT_TESTING_GUIDELINES.md`.

## Assumptions Made

- Research depth is the full template, confirmed by the user on 2026-07-27.
- The USD to MXN currency change belongs to this story, confirmed by the user on 2026-07-27.
- Image-aware card versions are excluded from this story's acceptance criteria and stay tracked as blocked epic scope.
- The `Agregar al carrito` controls on the card and the drawer footer remain inert; wiring them is the separate cart story.
- No backend changes are assumed. Anything requiring a Strapi schema change is recorded as a pending open question rather than planned work.
- Automated tests continue to mock Strapi at the Apollo or server-action boundary; manual QA uses the live `.env.local` config.

## Non-Obvious Findings

- **The card's `Modelo` line is dead code in production.** `ProductCard.tsx:16` reads `product.product_variants?.[0]?.internalId`, but `GET_PRODUCTS`, `GET_PRODUCTS_BY_CATEGORY`, `GET_PRODUCTS_BY_BRAND`, and `GET_PRODUCTS_BY_NAME` all omit `product_variants`. The test at `__tests__/product-listing/ProductCard.test.tsx:24-40` supplies the field by hand in its fixture, so the suite is green while the branch never renders on a real page. The test proves the component works, not that the feature exists.
- **The SKU is already paid for and thrown away.** `GET_PRODUCT_VARIANTS` selects `internalId` and `fetchProductVariants` returns it, but the drawer's mapping at lines 60-66 discards it and `ProductVariantUI` has no field for it. Surfacing the SKU in the drawer costs one type field and one JSX node; surfacing it on the card costs a nested relation on every list query. The cheap path and the correct path are the same path.
- **The currency change cannot fail loudly.** With `currencyDisplay: "narrowSymbol"`, MXN and USD produce byte-identical output for every value the existing tests assert. A wrong or absent change passes the whole suite, so the guard has to be built deliberately.
- **`ProductCardSkeleton` is a structural mirror, not a generic placeholder.** It reproduces the card's header, two-column price grid, and two-button footer. Any card structure change that skips the skeleton produces visible layout shift on every page transition, since `src/app/loading.tsx` renders nine of them.
- **Zero-variant products lead users into an empty drawer.** `variantCount: 0` yields the action label `Explorar las 0 variantes`, and opening it reaches the drawer's empty state. The behavior is internally consistent and still a poor flow.

## Research Outcome

Story 3 is scoped, unblocked for its stated acceptance criteria, and small — two components, one shared util, three test files, no new dependencies and no query changes unless open question Strapi I resolves toward widening the list queries.

Seven open questions are pending. Strapi I and UI I through III should be answered before `/plan`, since they determine card copy and whether a query change enters scope. Strapi II, UI V, and both verification questions can be resolved during planning.

Awaiting human sign-off. No source files were modified during this research.
