# Research: Improve Product Detail Signals On Cards And Drawer

## Story Definition

### Story Title

Improve product detail signals on cards and drawer.

### Source

Story 3 of `ai-research/epics/plp-functionality-seo.epic.md`. Completion audit for this story is recorded at `ai-research/epics/plp-functionality-seo.epic.md:590-602` and assessed the story at roughly 60% complete.

All open questions raised during this research were answered by the user on 2026-07-27, including a GraphQL playground capture confirming the extended product field contract.

### Story Description

Help users decide which product to inspect by correcting price presentation, gating the price display on real single-variant data, removing card UI that no data feeds, and giving the team a way to spot incomplete products before they reach production.

Two of the five epic acceptance criteria are already shipped. This story covers the unshipped remainder.

Image-aware card variants remain blocked on backend work and are excluded; see `Image Readiness Checklist`.

### Acceptance Criteria

1. All prices on the product card and in the variants drawer render as `$1,234.50 MXN`, with tests asserting the full string including the `MXN` suffix.
2. Products with `hasOneProductVariant: true` show a single price with Spanish single-price copy instead of the two-column `Desde` / `Hasta` range.
3. The card renders no element sourced from data the PLP list queries do not return. The `Modelo {internalId}` branch is removed.
4. A repeatable check exists that lists catalog products with zero variants or a missing price range, so those products are caught before release rather than handled with fallback UI.
5. Each variant mapped in the drawer retains its `internalId` so the cart feature can reuse it without a second request. The value is held in state and never rendered.
6. Existing drawer loading, empty, and error states and the ascending numeric price sort remain intact and covered by tests.

### Task Breakdown

1. Change `formatNumberToCurrency` to produce `$1,234.50 MXN`; update the four existing price assertions.
2. Add `hasOneProductVariant` to the four PLP list queries and to the `Product` type.
3. Implement the single-price card branch gated on `hasOneProductVariant === true`.
4. Delete the `Modelo {internalId}` branch from `ProductCard` and its assertion in the card test.
5. Carry `internalId` through the drawer's variant mapping and add it to `ProductVariantUI`.
6. Add the catalog integrity check script and document how to run it before release.
7. Extend card tests to cover the single-price branch and the incomplete-data branches, and assert the drawer retains `internalId` without rendering it.

### Scope Assessment

Single story, 2-3 implementation phases. Two components, one shared util, one query file, one type file, one new script, three test files. No new dependencies.

### Dependencies

- **No dependency on unshipped stories.** Story 1a (catalog API) and Story 2 (pagination) are complete and provide everything this story reads.
- **Blocked sub-scope:** the epic's image and no-image card versions depend on Strapi exposing a product image field. Excluded from this story's acceptance criteria.
- **Downstream, not blocking:** the `Agregar al carrito` buttons on the card and drawer footer stay inert until the separate cart story. This story does prepare for it by retaining `internalId` on each mapped variant, so the cart never has to refetch variants to know what it is quoting.

## Design Agent Handoff

### User Goal And Affected Surface

A buyer scans a grid of up to 50 tool and hardware products and decides which one to open for variant pricing. Affected surfaces are the PLP grid on `/` (`src/features/ProductListing/ProductListing.tsx`, `src/components/ProductCard.tsx`) and the right-side variants drawer (`src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`).

### Required States

Product card:

- **Default, price range** — taxonomy line, product name, two-column `Desde` / `Hasta` block, primary action showing variant count.
- **Default, single price** — new. Products where `hasOneProductVariant` is true show one price with single-price copy. See UI question II for the recommended wording.
- **Missing taxonomy** — `category` and `brand` are frequently `null` in live data, sometimes both. The existing behavior joins whichever exist with ` / ` and hides the line when neither does. This is correct and stays.
- **Missing price range** — treated as a data defect, not a UI state. The price block stays hidden and the integrity check surfaces the product for correction.
- **Zero variants** — treated as a data defect. The primary action keeps the standard label; no special-case copy.
- **Loading** — `src/components/ProductCardSkeleton.tsx`, rendered nine at a time by `src/app/loading.tsx`. It mirrors the card's two-column price grid, so the single-price branch must not break that alignment.

Variants drawer: loading, empty, error, and loaded states already exist and are test-covered. No design work required beyond the currency string change.

### Mobile And Desktop Expectations

The grid is one column by default and three columns at `lg` (`ProductListing.tsx:60`). The drawer is right-placed and full width at all breakpoints (`ProductVariantsDrawer.tsx:120`). `src/shared/hooks/useMediaQuery.tsx` does not update on resize and is not a reliable basis for new responsive behavior.

### Accessibility Requirements

Preserve existing semantics: `role="status"` on the drawer loading message, `role="alert"` on the drawer error, per-variant checkbox and quantity `aria-label`s, and the icon-only close button's accessible name. New single-price copy must be readable text with a visible label, not a bare value.

### Visual Patterns To Preserve

Follow `DESIGN.md` (validate with `pnpm design:lint`). Keep HeroUI `Card` composition, Tailwind v4 utilities, the emerald accent on the taxonomy line and selected variant rows, and `border-default-200` dividers. No CSS-in-JS, no new styling libraries.

### Content And Technical Constraints

- Spanish copy throughout.
- Prices render as `$1,234.50 MXN`.
- Do not invent stock, availability, shipping, or delivery data.
- Do not reserve image space or render an image placeholder.
- Do not display `internalId` anywhere in the UI. It is an internal quoting reference, carried in state only.

### Explicitly Out Of Scope

Image-bearing card layout, cart interaction design, product detail routes, `description` and `subcategory` presentation (see Strapi question II), and any change to variant selection or quantity mechanics.

### Unanswered Design Questions

None blocking. The single-price copy has a recommendation in UI question II awaiting confirmation during planning.

## Technical Research

### Affected Areas

| Path | Role in this story |
|------|--------------------|
| `src/shared/utils/global.utils.ts` | `formatNumberToCurrency`, lines 21-28 — the single formatter for card and drawer |
| `src/components/ProductCard.tsx` | Price block at lines 42-55; dead `internalId` branch at lines 16 and 40 |
| `src/components/ProductCardSkeleton.tsx` | Loading mirror of the card's price grid |
| `src/shared/queries/global.queries.ts` | Four list queries need `hasOneProductVariant`. `GET_PRODUCT_VARIANTS` already returns `internalId` and needs no change |
| `src/shared/types/global.types.ts` | `Product` needs `hasOneProductVariant`; `ProductVariantUI` needs `internalId` |
| `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` | Variant mapping at lines 60-66 must carry `internalId` through; inherits the currency change |
| `scripts/` | New catalog integrity check (see below) |
| `__tests__/product-listing/ProductCard.test.tsx` | Asserts `$0.00` and `Modelo TIRE-001` |
| `__tests__/product-variants/ProductVariantsDrawer.test.tsx` | Asserts USD-style output at lines 151-185 |
| `__tests__/shared/global.utils.test.ts` | Asserts `$1,234.50` at lines 4-5 |

### Confirmed Product Contract

The playground capture supplied on 2026-07-27 confirms `GetProducts` accepts `$status: PublicationStatus` alongside `$pagination` and returns, in addition to the fields the repo already selects, `description`, `subcategory`, and `hasOneProductVariant`.

Observed values across the sampled products:

| Field | Observed | Implication |
|-------|----------|-------------|
| `hasOneProductVariant` | `false` on all sampled products | Usable as the single-price gate; no sampled product exercises the `true` branch, so tests must supply it |
| `description` | `""` on all sampled products | Available but unpopulated. Adding it to the card yields nothing today |
| `subcategory` | `null` on all sampled products | Same as above |
| `category` | `null` on some products | Confirms the existing missing-taxonomy handling is load-bearing, not defensive |
| `brand` | `null` on some products | Same. One sampled product has a brand and no category, another the reverse |
| `variantCount` | 25 and 32 on sampled products | Consistent with `hasOneProductVariant: false` |

Recommendation: add only `hasOneProductVariant` to the list queries now, since it gates AC2. `description` and `subcategory` are confirmed available but empty across the sample, so selecting them would widen the payload for 50 products per page with nothing to render. Revisit when the backend populates them.

The `$status: PublicationStatus` argument is noted as a finding for the epic's availability question but is out of scope here; the repo's queries do not currently pass it.

### Currency Change Analysis

Target output is `$1,234.50 MXN`.

Recommended implementation is a decimal formatter with an explicit template, because the required string is a fixed business format rather than a locale-derived one:

- `Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })` for the number, wrapped as `` `$${formatted} MXN` ``.
- The alternative is `style: "currency", currency: "MXN", currencyDisplay: "narrowSymbol"` plus a `" MXN"` suffix. It produces the same string but depends on ICU narrow-symbol data resolving `MXN` to `$` under `en-US`, which is a silent-failure mode if it ever changes.

Blast radius is four assertions across three test files, all of which must change value:

- `__tests__/shared/global.utils.test.ts:4-5` — test name and expected value.
- `__tests__/product-variants/ProductVariantsDrawer.test.tsx:132,151,153,185` — one test name and three price assertions.
- `__tests__/product-listing/ProductCard.test.tsx:39-40` — two `$0.00` assertions.

Because the ` MXN` suffix makes the output visibly distinct from the current format, every one of these assertions fails if the change is not made. The verification-guard concern raised earlier in this research is resolved by the chosen format itself — no `formatToParts` or `resolvedOptions` assertion is needed.

### Catalog Integrity Check

UI questions I and III were both answered "we need to catch them before releasing." Neither zero-variant products nor missing price ranges get fallback UI; they get detection.

Recommended approach: a small Node script, run manually before a release.

- Location `scripts/check-catalog-integrity.mjs`, alongside the existing `scripts/sync-opencode-commands.mjs`.
- Reads `STRAPI_HOST` and `STRAPI_API_TOKEN` from the existing environment; no new configuration.
- Fetches all seven catalog pages with the existing `GET_PRODUCTS` shape and prints any product where `variantCount` is 0 or falsy, or `minPrice`/`maxPrice` is null or undefined, with name and `documentId`.
- Uses global `fetch` and a plain POST to the GraphQL endpoint. No new dependencies.
- Exits non-zero when defects are found so it can later be wired into CI without rewriting it.

Why this over the alternatives: a dev-only `console.warn` inside `ProductCard` only fires for products on pages someone actually opens, which is weak coverage across 333 products, and it adds noise to the component test runs. A playground query is zero-code but depends on `variantCount` being filterable server-side, which is unconfirmed, and on someone remembering to run it. The script covers the whole catalog, is roughly 40 lines, and costs nothing at runtime.

Scope note: this is a developer tool, not application code. It must not import from `src/` in a way that pulls in `"use server"` modules.

### Image Readiness Checklist (Blocked, Documented For Later)

Confirmed on 2026-07-27: Strapi still has no product image field. Before the image sub-scope can be planned:

1. Strapi exposes an image field on `Product` and its GraphQL path is known.
2. The four list queries can select it without prohibitive cost at page size 50.
3. The public media host is known and is not `localhost`.
4. `next.config.ts` gains `images.remotePatterns` for that host — the config currently has only `transpilePackages` and no `images` key.
5. `ProductCardSkeleton` gains a matching media block to avoid layout shift.

### Existing Patterns To Follow

- Server component `src/app/page.tsx` fetches through `"use server"` actions in `src/shared/lib/global.lib.ts`; the drawer is the only client-side consumer of the catalog HTTP API, via `fetchCatalog` in `src/shared/utils/catalog-api.utils.ts`.
- Adapters in `global.lib.ts` deliberately have no local try/catch — errors propagate and become `CAT_ERR_001` at the route edge. Do not add local catches.
- Keep domain UI under `src/features/<Feature>/`; `src/components/` holds only the shared card and its skeleton.
- Tests live in root `__tests__/`, never co-located. Canonical rules are in `docs/UNIT_TESTING_GUIDELINES.md`; do not restate them in the plan.

### Verification Rules To Follow Later

- `pnpm lint` for ESLint.
- `pnpm exec tsc --noEmit` for standalone type checking.
- `pnpm build` for the production build and integrated type check.
- `pnpm test -- __tests__/shared/global.utils.test.ts`, `pnpm test -- __tests__/product-listing/ProductCard.test.tsx`, and `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx` for targeted runs; `pnpm test` for the full suite with coverage.
- `pnpm design:lint` if card visual tokens change.
- The integrity script is run manually against live Strapi; it is not part of `pnpm test` and must not require secrets in CI.
- Do not run `pnpm install`. No new dependencies are needed.

## Open Questions

### Strapi Contract

I: Question: Should the PLP list queries select `product_variants { internalId }` so the card's `Modelo` line renders, or should that card branch be deleted?
Status: answered
Answer: Delete the branch. Product variants are fetched only when the user opens the drawer; the list queries stay narrow.
Context: `ProductCard.tsx:16` reads `product.product_variants?.[0]?.internalId`, which no list query returns.
Explanation: This keeps the 50-product page payload flat and removes UI that has never rendered in production.

II: Question: Are `description`, `subcategory`, and `hasOneProductVariant` selectable on the product list queries?
Status: answered
Answer: Yes, all three, confirmed by GraphQL playground capture on 2026-07-27.
Context: The capture shows `GetProducts($status: PublicationStatus, $pagination: PaginationArg)` returning all three fields.
Explanation: `hasOneProductVariant` is added to the list queries in this story because it gates the single-price card branch. `description` returns `""` and `subcategory` returns `null` across every sampled product, so both are deferred until the backend populates them; selecting them now would grow the payload with nothing to show.

III: Question: Are product image URLs available through the current frontend contract?
Status: answered
Answer: No. Strapi still has no product image field as of 2026-07-27. Image and no-image card versions remain blocked and are excluded from this story.
Context: Carried forward from epic open question Strapi III and re-confirmed during this research.

### UI And Product Decisions

I: Question: What should the primary action read when `variantCount` is 0?
Status: answered
Answer: Keep the standard primary action. Zero-variant products are a data defect that must be caught before deploying to production, not a UI state.
Context: `ProductCard.tsx:24-27` produces `Explorar las 0 variantes`.
Explanation: The requested detection mechanism is specified in `Catalog Integrity Check` above — a `scripts/check-catalog-integrity.mjs` sweep across all seven pages, exiting non-zero when it finds a product with zero variants or a missing price range. The existing test at `__tests__/product-listing/ProductCard.test.tsx:35-37` that asserts `Explorar las 0 variantes` stays valid as a rendering guard.

II: Question: What should the price block show when the product has a single variant?
Status: answered
Answer: Show a single price with Spanish copy, gated on `hasOneProductVariant === true`.
Context: The card currently renders the two-column `Desde` / `Hasta` grid whenever both values are present, so a one-variant product shows the same figure twice.
Explanation: Recommended copy is the single label `Precio` above one value, replacing both columns. Alternative if a stronger signal is wanted: `Precio único`. `Precio` is recommended because it is the plain reading and does not compete with the variant-count action label for attention.
Open sub-case for planning: `minPrice === maxPrice` while `hasOneProductVariant` is `false` means several variants share one price. The gate is `hasOneProductVariant`, so those products keep the `Desde` / `Hasta` grid showing an identical figure twice. Confirm during planning whether that is acceptable or whether the single-price branch should key off equal prices as well.

III: Question: What should the card show when `minPrice` or `maxPrice` is absent?
Status: answered
Answer: Same as question I. Treat it as a data defect caught before release, not a UI fallback. The price block stays hidden.
Context: `ProductCard.tsx:43` hides the entire price block when either value is missing.
Explanation: The integrity script flags missing price ranges alongside zero-variant products, so both defects surface through one check.

IV: Question: How should prices display?
Status: answered
Answer: `$1,234.50 MXN` — dollar sign, amount, then a literal `MXN` suffix.
Context: `formatNumberToCurrency` currently produces `$1,234.50` from a USD formatter.
Explanation: Implementation direction and the recommendation for a decimal formatter with an explicit template over a currency formatter are in `Currency Change Analysis`.

V: Question: Where should the variant SKU appear in the drawer?
Status: answered
Answer: Nowhere in the UI. `internalId` is an internal quoting reference and is not user-facing. It must still be retained in the drawer's mapped variant data so the cart feature can reuse it without issuing a second request.
Context: `GET_PRODUCT_VARIANTS` returns `internalId`; `ProductVariantsDrawer.tsx:60-66` currently drops it during mapping and `ProductVariantUI` has no field for it.
Explanation: Two separate decisions. Display: no, at the card or in the drawer. Retention: yes — add `internalId` to `ProductVariantUI` and carry it through the mapping. The drawer is the only place the value is fetched, so discarding it would force the cart to refetch variants for products the user has already opened. This supersedes the earlier recommendation in this document to render the SKU in the drawer rows, and also supersedes the earlier suggestion to defer the type field on YAGNI grounds — the consumer is known and the data is already in hand.
Planning note: the drawer tracks selection by array index (`selectedVariantIndexes`, `quantities`). With `internalId` on each mapped variant, the selected set already carries everything a cart line needs — `internalId`, `diameter`, `price`, and quantity — with no further fetching. Confirm during the cart story whether index-keyed state should become `internalId`-keyed; this story does not change it.

### Verification

I: Question: How should tests prove the currency is MXN?
Status: answered
Answer: Assert the full formatted string. USD prices are not shown or used anywhere in the product, and the ` MXN` suffix makes the output distinct, so plain string assertions are a sufficient guard.
Context: The concern was that `narrowSymbol` would make MXN and USD render identically.
Explanation: The chosen format removes the ambiguity, so no `formatToParts` or `resolvedOptions().currency` assertion is required.

II: Question: Do the incomplete-data card states need their own tests?
Status: answered
Answer: Yes.
Context: `__tests__/product-listing/ProductCard.test.tsx` currently has two cases: missing relation, and zero count with zero price.
Explanation: New cases needed are the single-price branch with `hasOneProductVariant: true`, and a missing price range with both values undefined. The existing zero-variant case stays. The `Modelo TIRE-001` assertion is removed with the branch it covers.

## Assumptions Made

- Research depth is the full template, confirmed by the user on 2026-07-27.
- The USD to MXN currency change belongs to this story, confirmed by the user on 2026-07-27.
- Image-aware card versions are excluded from this story and stay tracked as blocked epic scope.
- The `Agregar al carrito` controls on the card and drawer footer remain inert; wiring them is the separate cart story.
- Only `hasOneProductVariant` is added to the list queries. `description` and `subcategory` are confirmed available but deferred while unpopulated — planning should override this if product wants them rendered with empty-state handling.
- The integrity check runs manually before release rather than in CI, since CI has no Strapi secrets. It exits non-zero so it can be promoted to CI later without a rewrite.
- Automated tests continue to mock Strapi at the Apollo or server-action boundary; manual QA uses the live `.env.local` config.

## Non-Obvious Findings

- **The card's `Modelo` line has never rendered in production.** `ProductCard.tsx:16` reads `product.product_variants?.[0]?.internalId`, but none of the four list queries select `product_variants`. The test at `__tests__/product-listing/ProductCard.test.tsx:24-40` supplies the field by hand in its fixture, so the suite has been green over a branch that no real page reaches. Deleting the branch also removes a misleading test assertion.
- **The three newly confirmed fields are available but empty.** `description` is `""` and `subcategory` is `null` on every sampled product. The contract question and the data question have different answers — the fields exist, the content does not. Only `hasOneProductVariant` carries usable information today.
- **The drawer is the only place `internalId` is ever fetched.** `GET_PRODUCT_VARIANTS` returns it, and `ProductVariantsDrawer.tsx:60-66` discards it one line later. No list query carries it, so once the drawer drops it the value is gone for that session. Retaining it costs one type field and one line in the mapping; discarding it costs the cart feature a full variant refetch for a product the user has already opened.
- **The chosen currency format is self-verifying.** Had the format been `$1,234.50` via `currencyDisplay: "narrowSymbol"`, MXN and USD would produce byte-identical strings and every existing price assertion would pass whether or not the change was made. The ` MXN` suffix makes each of the four assertions fail on omission, so the guard comes free with the format.
- **`hasOneProductVariant` and `minPrice === maxPrice` are different conditions.** A product with 25 variants that all cost the same satisfies the second and not the first. The chosen gate is `hasOneProductVariant`, which leaves that case showing an identical figure in both `Desde` and `Hasta` columns.
- **`ProductCardSkeleton` is a structural mirror, not a generic placeholder.** It reproduces the card's two-column price grid, and `src/app/loading.tsx` renders nine of them. The single-price branch changes that grid for a subset of cards, so accept the small mismatch deliberately or the skeleton drifts from the thing it stands in for.
- **The product query supports `$status: PublicationStatus`.** The repo's queries do not pass it. This is the hook the epic's availability question (Strapi IV) was looking for, and it is out of scope here — recorded so the SEO and availability work does not have to rediscover it.

## Research Outcome

Story 3 is fully scoped and unblocked. Every open question is answered. The work is two components, one shared util, one query file, one type file, one new script, and three test files, with no new dependencies and no backend changes.

The story also leaves the cart feature a clean starting point: every selected variant carries its `internalId`, price, diameter, and quantity in client state by the time the user reaches `Agregar al carrito`.

One sub-case is left for planning to confirm: whether the single-price branch should also trigger on `minPrice === maxPrice` when `hasOneProductVariant` is false.

Awaiting human sign-off. No source files were modified during this research.
