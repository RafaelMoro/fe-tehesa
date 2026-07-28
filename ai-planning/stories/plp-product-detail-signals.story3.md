# Plan: Improve Product Detail Signals On Cards And Drawer

## Header

- **Story:** Improve product detail signals on cards and drawer (Story 3 of `ai-research/epics/plp-functionality-seo.epic.md`).
- **Research doc:** `ai-research/stories/plp-product-detail-signals.story3.md`
- **Sign-off:** research signed off 2026-07-27; all open questions answered.
- **Planning decisions taken 2026-07-27 (the two items research left open):**
  - Single-price gate is `hasOneProductVariant === true` **only**. Products where `minPrice === maxPrice` with multiple variants keep the `Desde` / `Hasta` grid.
  - Single-price label is `Precio`.
- **Assumptions carried from research:** no new dependencies, no backend changes, images stay out of scope, `Agregar al carrito` stays inert, `description` / `subcategory` stay unselected while unpopulated.

## Acceptance Criteria

1. All prices on the product card and in the variants drawer render as `$1,234.50 MXN`, with tests asserting the full string including the `MXN` suffix.
2. Products with `hasOneProductVariant: true` show a single price with Spanish single-price copy instead of the two-column `Desde` / `Hasta` range.
3. The card renders no element sourced from data the PLP list queries do not return. The `Modelo {internalId}` branch is removed.
4. A repeatable check exists that lists catalog products with zero variants or a missing price range, so those products are caught before release rather than handled with fallback UI.
5. Each variant mapped in the drawer retains its `internalId` so the cart feature can reuse it without a second request. The value is held in state and never rendered.
6. Existing drawer loading, empty, and error states and the ascending numeric price sort remain intact and covered by tests.

## Affected Files

| Area | File | Action |
|------|------|--------|
| `src/shared/**` | `src/shared/utils/global.utils.ts` | Modify — currency formatter |
| `src/shared/**` | `src/shared/queries/global.queries.ts` | Modify — add `hasOneProductVariant` to 4 list queries |
| `src/shared/**` | `src/shared/types/global.types.ts` | Modify — `Product.hasOneProductVariant`, `ProductVariantUI.internalId` |
| `src/components/**` | `src/components/ProductCard.tsx` | Modify — single-price branch, delete `Modelo` branch |
| `src/features/**` | `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` | Modify — carry `internalId` through mapping |
| tests | `__tests__/shared/global.utils.test.ts` | Modify |
| tests | `__tests__/product-listing/ProductCard.test.tsx` | Modify — new cases, drop `Modelo` assertion |
| tests | `__tests__/product-variants/ProductVariantsDrawer.test.tsx` | Modify — MXN assertions, `internalId` not rendered |
| tooling | `scripts/check-catalog-integrity.mjs` | Create |
| tooling | `package.json` | Modify — one script entry |
| docs | `REPO_CONTEXT.md` | Modify — record the check command |

Not touched: `src/app/page.tsx`, `src/shared/lib/global.lib.ts`, any API route. The `Product` and `ProductVariantUI` additions are optional fields, so no caller signature changes.

---

## Phase 1 — Currency format (AC1)

### Changes Required

**`src/shared/utils/global.utils.ts`** — Modify, lines 21-28.

Replace the USD currency formatter with a decimal formatter plus an explicit template:

```ts
const formatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const formatNumberToCurrency = (amount: number): string =>
  `$${formatter.format(amount)} MXN`
```

Rationale: `$1,234.50 MXN` is a fixed business format, not a locale-derived one. Using `style: "currency", currency: "MXN"` would depend on ICU narrow-symbol data resolving `MXN` to `$`, which fails silently if that data changes.

**`__tests__/shared/global.utils.test.ts`** — Modify, lines 4-5. Update the test name (drop "USD") and expect `"$1,234.50 MXN"`.

**`__tests__/product-listing/ProductCard.test.tsx`** — Modify, lines 39-40. `$0.00` becomes `$0.00 MXN` in both assertions.

**`__tests__/product-variants/ProductVariantsDrawer.test.tsx`** — Modify. Test name at line 132 ("USD formatting" → "MXN formatting"); price assertions at lines 151, 153, 185 gain the ` MXN` suffix.

Edge case: the drawer footer total also runs through this formatter (`ProductVariantsDrawer.tsx:226`) — no code change needed there, but the assertion at line 185 covers it.

### Success Criteria

- Automated: `pnpm test -- __tests__/shared/global.utils.test.ts __tests__/product-listing/ProductCard.test.tsx __tests__/product-variants/ProductVariantsDrawer.test.tsx`
- Manual: none.

### Verification Coverage

| Area | Check | Reference |
|------|-------|-----------|
| `global.utils.ts` | Full string including the `MXN` suffix | `__tests__/shared/global.utils.test.ts` |
| Card + drawer price display | All four existing assertions carry ` MXN` | the two component test files |

The ` MXN` suffix makes every one of these assertions fail if the formatter is not changed, so no `formatToParts` / `resolvedOptions` guard is needed.

---

## Phase 2 — Card price signals (AC2, AC3)

### Changes Required

**`src/shared/queries/global.queries.ts`** — Modify. Add `hasOneProductVariant` to the selection set of `GET_PRODUCTS`, `GET_PRODUCTS_BY_CATEGORY`, `GET_PRODUCTS_BY_BRAND`, and `GET_PRODUCTS_BY_NAME`. Do **not** touch `GET_PRODUCT_VARIANTS`, `GET_CATEGORIES`, or `GET_BRANDS`. Do not add `description` or `subcategory`.

**`src/shared/types/global.types.ts`** — Modify, `Product` (lines 24-33). Add `hasOneProductVariant?: boolean`. Optional so existing test fixtures and any product read without the field still typecheck.

**`src/components/ProductCard.tsx`** — Modify.

- Delete line 16 (`const internalId = ...`) and line 40 (the `Modelo` `Card.Description`). Nothing else reads `internalId` in this file.
- In `Card.Content` (lines 42-55), branch the price block:

```
if (minPriceString && maxPriceString):
  if (product.hasOneProductVariant === true):
    single column: label "Precio" + minPriceString
  else:
    existing two-column Desde / Hasta grid
```

Keep the existing label/value classes (`text-xs text-muted uppercase` for the label, `text-xl font-bold` for the value) and the `flex flex-col gap-1` wrapper. The single-price branch drops the `grid grid-cols-2 divide-x divide-default-200` wrapper and the `pr-4` / `pl-4` padding.

Edge cases:
- Gate is strictly `hasOneProductVariant === true`. `undefined` (field absent) falls through to the range grid — that is the existing behavior for every product read before this change.
- The whole price block still hides when either price is null. That is a data defect surfaced by Phase 4, not a UI state.
- `product_variants` stays on the `Product` type — the drawer's `FetchSingleProductResponse` path still uses it. Only the card's read of it is deleted.

**`src/components/ProductCardSkeleton.tsx`** — no change. It mirrors the two-column grid; the single-price branch is a deliberate, accepted mismatch for a subset of cards (research finding). Revisit only if single-variant products become common.

**`__tests__/product-listing/ProductCard.test.tsx`** — Modify.

- Remove the `Modelo TIRE-001` assertion (line 38) and the now-pointless `product_variants` fixture field (lines 28-30) from the zero-variant case. Keep the rest of that case: it still guards `Explorar las 0 variantes` and the `$0.00 MXN` range.
- Add: single-price case — `hasOneProductVariant: true` with distinct `minPrice` / `maxPrice`; assert `Precio` renders with the `minPrice` value formatted, and assert `Desde` / `Hasta` are absent.
- Add: missing price range case — `minPrice` and `maxPrice` both `undefined`; assert no price labels render and the primary action still renders.

### Success Criteria

- Automated: `pnpm exec tsc --noEmit`, `pnpm test -- __tests__/product-listing/ProductCard.test.tsx`, `pnpm lint`, `pnpm design:lint`.
- Manual: load `/` in the browser, confirm cards still show the `Desde` / `Hasta` grid with ` MXN` and that no card shows a `Modelo` line. Live data has `hasOneProductVariant: false` on every sampled product, so the single-price branch is expected to be test-only until the backend has a single-variant product.

### Verification Coverage

| Area | Check | Reference |
|------|-------|-----------|
| `global.queries.ts` | Four list queries select `hasOneProductVariant`; variants query unchanged | `pnpm build` + manual `/` load |
| `ProductCard.tsx` | Single-price branch, range branch, hidden-price branch, no `Modelo` element | `__tests__/product-listing/ProductCard.test.tsx` |
| Card visual tokens | Single-price block uses existing DESIGN.md tokens | `pnpm design:lint` |

---

## Phase 3 — Drawer retains `internalId` (AC5, AC6)

### Changes Required

**`src/shared/types/global.types.ts`** — Modify, `ProductVariantUI` (lines 70-74). Add `internalId?: string`. Optional, mirroring `ProductVariant.internalId?: string` — the mapping cannot produce a value the source may not have.

**`src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`** — Modify, mapping at lines 60-66. Add `internalId: variant.internalId` to the mapped object. Nothing else changes: the sort, the `key`, the selection/quantity index keying, and the render all stay as they are.

Edge case: selection state stays index-keyed (`selectedVariantIndexes`, `quantities`). Converting it to `internalId`-keyed is the cart story's call, not this one.

**`__tests__/product-variants/ProductVariantsDrawer.test.tsx`** — Modify. In the sorted-variants test, add `internalId` to the mocked variant payload and assert it never appears in the DOM (`expect(screen.queryByText("VAR-001")).not.toBeInTheDocument()`).

Honest limitation: retention itself is enforced by the type system, not by a DOM assertion. `pnpm exec tsc --noEmit` is the real guard that the mapping produces the field; the test only guards that it is not rendered.

Existing drawer loading / empty / error tests and the ascending price sort test stay unchanged and must keep passing — that is AC6.

### Success Criteria

- Automated: `pnpm exec tsc --noEmit`, `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx`.
- Manual: open a product drawer, confirm rows show diameter / quantity / price only and no SKU-looking string appears.

### Verification Coverage

| Area | Check | Reference |
|------|-------|-----------|
| `ProductVariantUI` | Field exists and the mapping supplies it | `pnpm exec tsc --noEmit` |
| Drawer rows | `internalId` never rendered | `__tests__/product-variants/ProductVariantsDrawer.test.tsx` |
| Drawer states + sort | Loading, empty, error, ascending price order unchanged | existing cases in the same file |

---

## Phase 4 — Catalog integrity check (AC4)

### Changes Required

**`scripts/check-catalog-integrity.mjs`** — Create. Roughly 40 lines, plain Node ESM alongside `scripts/sync-opencode-commands.mjs`.

Structure:

- Read `STRAPI_HOST` and `STRAPI_API_TOKEN` from `process.env`; exit `1` with a clear message if either is missing.
- Inline the GraphQL document as a template string — do **not** import from `src/`. `global.queries.ts` pulls in `@apollo/client`, and `global.lib.ts` is a `"use server"` module; neither belongs in a standalone script. Selection set: `name`, `documentId`, `variantCount`, `minPrice`, `maxPrice`.
- Loop pages `1..7` (`PRODUCT_PAGE_SIZE = 50`, `KNOWN_PRODUCT_TOTAL = 333`; hardcode both here rather than importing the constants module).
- Global `fetch`, single POST per page, `Authorization: Bearer ${token}`, `Content-Type: application/json`.
- Flag any product where `!variantCount` or `minPrice == null` or `maxPrice == null`. Print `name`, `documentId`, and which check failed.
- Exit `1` when any defect is found, `0` when clean, so it can be promoted to CI later without a rewrite. Also exit non-zero on a non-200 response or a GraphQL `errors` array.

**`package.json`** — Modify, `scripts`. Add:

```json
"check:catalog": "node --env-file=.env.local scripts/check-catalog-integrity.mjs"
```

`--env-file` is native to Node 20.6+ (CI runs Node 22), so no `dotenv` dependency is needed.

**`REPO_CONTEXT.md`** — Modify, the Commands table. One row: `pnpm check:catalog` — flag catalog products with zero variants or a missing price range; run manually before release.

Edge cases:
- Not part of `pnpm test` and not wired into CI. CI has no Strapi secrets; this runs locally against `.env.local`.
- Jest only discovers `__tests__/**`, so the script needs no test exclusion.
- This is a developer tool, not application code — it is intentionally not covered by unit tests.

### Success Criteria

- Automated: `pnpm lint` (the script is in the ESLint scope).
- Manual: run `pnpm check:catalog` with a populated `.env.local`. It must print a per-defect list or a clean message, and `echo $?` must reflect the outcome. Verify the failure path by temporarily unsetting `STRAPI_HOST`.

### Verification Coverage

| Area | Check | Reference |
|------|-------|-----------|
| `scripts/check-catalog-integrity.mjs` | Covers all 7 pages, flags zero-variant and missing-price products, non-zero exit on defects and on env/GraphQL failure | manual run against live Strapi |
| `package.json` | `pnpm check:catalog` resolves and loads `.env.local` | manual run |

---

## Final Verification (after all phases)

- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm test`
- `pnpm build`
- `pnpm design:lint`
- Do not run `pnpm install`. No dependency changes.

## Cross-Cutting Concerns

- **GraphQL contract:** `hasOneProductVariant` is confirmed selectable on all four list queries (playground capture, 2026-07-27). It returns `false` on every sampled product, so the single-price branch is exercised by tests only.
- **Server/client boundary:** unchanged. `src/app/page.tsx` still fetches through `global.lib.ts`; the added field flows through the existing `Product` type with no signature changes.
- **Env vars:** the integrity script is the only new consumer of `STRAPI_HOST` / `STRAPI_API_TOKEN`, and it reads them from `.env.local` via `--env-file`.
- **Responsive:** no layout mode changes. The grid stays 1-column / 3-column at `lg`; the drawer stays right-placed and full width.
- **Accessibility:** the single-price value keeps a visible `Precio` label. Drawer `role="status"` / `role="alert"` and all `aria-label`s are untouched.

## Out Of Scope

- Image-bearing card layout and `next.config.ts` `images.remotePatterns` — blocked on Strapi exposing an image field (`Image Readiness Checklist` in the research doc).
- `description` and `subcategory` on the list queries — confirmed available, empty across the whole sample.
- Wiring `Agregar al carrito` on the card or drawer footer.
- Converting the drawer's index-keyed selection state to `internalId`-keyed — the cart story's decision.
- `ProductCardSkeleton` two-column mirror — deliberate accepted mismatch.
- Passing `$status: PublicationStatus` to the product queries — recorded for the epic's availability work.
- Any fallback UI for zero-variant or missing-price products. Both are data defects, caught by Phase 4.

## Open Questions

None. The two items research left for planning were decided at the top of this doc.
