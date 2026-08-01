# Plan: Price And Availability Revalidation On `/cotizar`

**Source research:** `ai-research/cart-quote-whatsapp/price-availability-revalidation.story-3.md`
**Epic:** `ai-research/epics/cart-quote-whatsapp.epic.md` (Story 3)
**Research status:** the doc's own header still reads *"Awaiting human sign-off"*. Every open question inside it is answered and dated 2026-08-01, and the user asked for this plan directly — planning proceeded on that basis. **Confirm sign-off before `/implement`.**
**Date:** 2026-08-01

## What Planning Verified In The Code

Checked directly rather than trusted from the research doc:

- **`SEARCH_TERM_PATTERN` is still the narrow one.** `catalog.constants.ts:39` is unchanged: `/^[\p{L}\p{N}\s\-_.,&()]+$/u`. Commit `1071d55` ("fix: widen SEARCH_TERM_PATTERN…") touched **only** `REPO_CONTEXT.md` and the research doc — no source file. **AC 8 is entirely unbuilt** despite the commit message. Verified with `git show --stat 1071d55`.
- **The pattern has exactly three read sites** (`_utils.ts:206`, `_utils.ts:280`, `utils.pagination.ts:59`) and one asserting test (`__tests__/catalog/_utils.test.ts:362`), as III-b measured.
- **`Home.tsx:238` already wraps the term in `encodeURIComponent`**, so widening the allowlist to admit `#` does not create a fragment-truncation bug on the live search box. The new `Buscar alternativa` href must do the same.
- **`catalog.constants.ts` imports nothing**, and `cart.constants.ts` imports nothing. `cart.store.ts` imports catalog → cart. So `catalog.constants.ts` importing `CART_MAX_LINES` from `cart.constants.ts` introduces **no import cycle**. `REVALIDATE_MAX_IDS` can be pinned to it as the research assumed.
- **`getQuoteTotals` already accumulates in integer cents** (`quote.utils.ts:16`) — `Math.round(unitPrice * 100) * quantity`, divided once at the end. Only the *choice* of price changes.
- **`upgradeLine` matches by `cartLineKey`, not by variant-ness** (`cart.store.ts:284-319`). A variant-gone line upgrades through the identical path Story 2 built; `handleChooseVariant`/`handleUpgradeConfirm` in `QuotePage.tsx:95-124` need no change.
- **`QuotePage.test.tsx`'s `mockFetch` is `describe`-scoped** — `originalFetch` at `:240`, `mockFetch` at `:252`, restoring `afterEach` at `:263`, all inside `describe("QuotePage variant upgrade")`. Verification II confirmed: hoist, do not write.
- **`ProductVariant.pricing` is typed non-nullable today** (`global.types.ts:63-70`). The new wire type must not reuse it — see Phase 1.

## Acceptance Criteria

Copied in order from the research doc.

1. On load, `/cotizar` revalidates in a **single round trip** to one new route handler — batching every line's variant `documentId`s into one `productVariants(filters: { documentId: { in: [...] } })` query, and every line's product `documentId`s into one `products(filters: { documentId: { in: [...] } })` query. No per-line and no per-product fan-out. An empty list issues no request at all.
2. A line whose current unit price differs from its snapshot renders the **previous price struck through beside the current one**, with `El precio cambió al comprobar la lista.`, and the column relabelled `TOTAL ACTUAL`. The subtotal uses the **current** price. Comparison is in integer cents, never on floats.
3. A **variant that no longer exists** and a **product that no longer exists** get distinct Spanish states and actions — variant gone → `La medida <diameter> ya no está disponible.` + `Elegir otra medida`; product gone → `Este producto ya no está disponible.` + `Buscar alternativa`. Both add `Esta línea no se incluye en el subtotal.` and both are excluded from the subtotal. Neither line is auto-removed.
4. A revalidation failure **never blocks the quote**: a page-level `No pudimos comprobar los precios.` / `Mostramos los precios guardados. Te los confirmaremos al responder tu solicitud; puedes continuar.` banner with a `Reintentar` action, snapshot prices shown, every priced line affixed `precio sin confirmar` (distinct from the never-checked `precio guardado` — UI II), and quantity editing, removal, `Elegir medida`, and (in Story 4) sending all still work.
5. Revalidation results live in **ephemeral React state only**. The persisted cart keeps its snapshot untouched: no new persisted field, no `CART_SCHEMA_VERSION` bump, no `migrate` change, no new rehydrate validation.
6. The route handler validates the id lists at the boundary the way every other catalog param is validated — each id against `DOCUMENT_ID_PATTERN` and `DOCUMENT_ID_MAX_LENGTH`, plus a cap on list length — and returns the standard `CAT_*` envelope.
7. A variant that **still exists but carries no `pricing` component** renders a fifth line state: `Esta medida no tiene precio actual.` plus `Te confirmaremos el precio al responder tu solicitud. Si no está disponible, buscaremos una alternativa.` and `Esta línea no se incluye en el subtotal.` It is excluded from the subtotal, **keeps its quantity stepper**, shows no price block, and offers only `Quitar`.
8. **`Buscar alternativa` reaches a search, not the base catalog.** `SEARCH_TERM_PATTERN` admits `"`, `/`, `°`, and `#`, and the link builder additionally strips any residual out-of-allowlist characters by taking the longest safe segment of the name. Acceptance test: a product named `1/2" Punta Bristol Cromado` lands on a filtered search result, not page 1 of everything.

## Affected Files

**`src/shared/constants/`**
- `catalog.constants.ts` — Modify: `CAT_VAL_007` + messages, `REVALIDATE_MAX_IDS`, widened `SEARCH_TERM_PATTERN` + new `SEARCH_TERM_UNSAFE_PATTERN`

**`src/shared/queries/`**
- `global.queries.ts` — Modify: `GET_VARIANTS_BY_IDS`, `GET_PRODUCTS_BY_IDS`

**`src/shared/lib/`**
- `global.lib.ts` — Modify: `fetchVariantsByIds`, `fetchProductsByIds`

**`src/shared/types/`**
- `global.types.ts` — Modify: `RevalidatedVariant`, `RevalidatedProduct`, `RevalidateData`, two Apollo response types

**`src/shared/utils/`**
- `catalog-api.utils.ts` — Modify: `CAT_VAL_007` Spanish copy

**`src/app/api/catalog/`**
- `_utils.ts` — Modify: `parseDocumentIdList`, `CatalogErrorCode` union, `readValidatedParams`
- `revalidate/route.ts` — Create

**`src/features/QuotePage/`**
- `quote.utils.ts` — Modify: `LineCheck` type, `getQuoteTotals(lines, checks?)`, `buildProductSearchHref`
- `useQuoteRevalidation.ts` — Create
- `QuotePage.tsx` — Modify: hook wiring, check banner, checks threaded to rows and totals
- `QuoteLineRow.tsx` — Modify: five new renderings

**`__tests__/`**
- `catalog/revalidate/route.test.ts` — Create
- `catalog/_utils.test.ts` — Modify: re-point `:362`, add widened-allowlist cases
- `quote/quote.utils.test.ts` — Modify: checks-aware totals, `buildProductSearchHref`
- `quote/revalidation.test.tsx` — Create
- `quote/QuotePage.test.tsx` — Modify: hoist `mockFetch` to file scope

**Untouched, deliberately:** `src/zustand/store/cart.store.ts`, `src/shared/constants/cart.constants.ts`, `sitemap.ts`, `robots.ts`, `seo.utils.ts`, `src/features/ProductVariantsDrawer/`.

---

## Phase 1 — Queries, Adapters, Route

Delivers AC 1 and AC 6. Nothing user-visible ships in this phase; the route is verifiable on its own.

### Changes Required

**`src/shared/constants/catalog.constants.ts`** — Modify

Add after `CAT_VAL_006` (line 7) and its messages:

```
CAT_VAL_007
MSG_CAT_VAL_007_PATTERN  = "Invalid id list: id contains unsafe characters"
MSG_CAT_VAL_007_LENGTH   = "Invalid id list: id over max length"
MSG_CAT_VAL_007_EMPTY    = "Invalid id list: empty segment"
MSG_CAT_VAL_007_COUNT    = (max: number, got: number) => `Invalid id list: ${got} ids, max ${max}`
```

Four sub-messages under one code, mirroring how `CAT_VAL_006` already splits `_EMPTY` / `_LENGTH` / `_PATTERN`. Per `docs/IMPLEMENTATION_GUIDELINES.md` each names the input and the rule.

```
import { CART_MAX_LINES } from "@/shared/constants/cart.constants"
export const REVALIDATE_MAX_IDS = CART_MAX_LINES
```

Verified above: no import cycle. Pinning rather than inventing a second ceiling means a valid cart can never exceed it (AC 6, research "The Route").

**`src/shared/types/global.types.ts`** — Modify, near `ProductVariant` (line 63)

```
export type RevalidatedVariant = {
  documentId: string
  diameter: string
  pricing: { price: number } | null
}
export type RevalidatedProduct = { documentId: string; name: string }
export type RevalidateData = {
  variants: RevalidatedVariant[]
  products: RevalidatedProduct[]
}
export interface FetchVariantsByIdsResponse { productVariants: RevalidatedVariant[] }
export interface FetchProductsByIdsResponse { products: RevalidatedProduct[] }
```

**Do not reuse the existing `ProductVariant`.** Its `pricing` is typed `{ price: number }` non-nullable (`:67-69`), which is wrong against the schema (Strapi Contract X) and would let `variant.pricing.price` typecheck. `RevalidatedVariant` is the one place this story reads `pricing` across up to 100 records, so it gets the honest type. Widening `ProductVariant` itself would break `ProductVariantsDrawer.tsx:77` and `ProductCard.tsx:79` — a pre-existing exposure this story does not own.

`RevalidatedProduct.name` is selected because the epic's shape asks for it and it costs nothing; **it is never used** — Catalog Behavior III put renaming out of scope.

**`src/shared/queries/global.queries.ts`** — Modify

```graphql
export const GET_VARIANTS_BY_IDS = gql`
  query GetVariantsByIds($filters: ProductVariantFiltersInput, $pagination: PaginationArg) {
    productVariants(filters: $filters, pagination: $pagination) {
      documentId
      diameter
      pricing { price }
    }
  }
`
export const GET_PRODUCTS_BY_IDS = gql`
  query GetProductsByIds($filters: ProductFiltersInput, $pagination: PaginationArg) {
    products(filters: $filters, pagination: $pagination) {
      documentId
      name
    }
  }
`
```

Edge cases:
- **`pagination` is not optional.** Omitting it returns **10** records (Strapi Contract IX), so an 11-line cart reports lines 11 onward as `ya no está disponible` and silently drops them from the subtotal. This is the one mistake in the story that fails confidently rather than loudly. It is the first thing to check in review.
- The filter variable is typed as the **input object** (`ProductVariantFiltersInput` / `ProductFiltersInput`), not as `[String!]`. `documentId` is an `IDFilterInput` (Strapi Contract VIII); a `[String!]` variable fails GraphQL's variable-type check with an error that reads like a filter problem.
- No `minPrice`/`maxPrice` (unmaintained denormalized columns), no `internalId` (never reaches this UI; the line already carries it), no `pricePromotion` (epic Strapi Contract VI), no `product { … }` on the variant (nullable relation, Strapi Contract XIII — selecting it "for safety" would crash on exactly the orphan data it was added to detect).

**`src/shared/lib/global.lib.ts`** — Modify, after `fetchProductVariants` (line 175)

```
export const fetchVariantsByIds = async (ids: string[]): Promise<RevalidatedVariant[]>
export const fetchProductsByIds  = async (ids: string[]): Promise<RevalidatedProduct[]>
```

Both:
- early-return `[]` when `ids.length === 0` — no client, no query;
- `variables: { filters: { documentId: { in: ids } }, pagination: { page: 1, pageSize: REVALIDATE_MAX_IDS } }`;
- `return res?.data?.<field> ?? []`;
- **no local try/catch** — the adapter contract at `global.lib.ts:30-64`. Add the same `// ponytail: see the JSDoc above` marker the neighbours carry.

Do not write these by analogy to `fetchProductVariants`: that one is safe only because it happens to pass `pageSize: 100` (`:167-172`).

**`src/app/api/catalog/_utils.ts`** — Modify

Add `typeof CAT_VAL_007` to the `CatalogErrorCode` union (`:30-41`).

New `parseDocumentIdList`, near `parseDocumentId` (`:222-247`):

```
const parseDocumentIdList = (
  raw: string | null,
): { ok: true; value: string[] } | { ok: false; error: CatalogError }
```

Rules, in order:
1. `raw === null` or `raw.trim() === ""` → `{ ok: true, value: [] }`. **Not an error** — a cart with no variant-less lines legitimately sends no `productIds`.
2. Split on `,`. Any empty segment → `CAT_VAL_007` / `MSG_CAT_VAL_007_EMPTY`. (`"a,,b"` and a trailing comma are rejected, not silently dropped.)
3. Segment count `> REVALIDATE_MAX_IDS` → `MSG_CAT_VAL_007_COUNT`. **Check the count before validating each id** — a tampered 10,000-id list should be rejected on arithmetic, not after 10,000 regex tests.
4. Each id: `!DOCUMENT_ID_PATTERN.test(id)` → `MSG_CAT_VAL_007_PATTERN`; `id.length > DOCUMENT_ID_MAX_LENGTH` → `MSG_CAT_VAL_007_LENGTH`. Same two rules `parseDocumentId` applies.
5. Return the ids **in order, not deduped**. The client dedupes before building the URL; the route's job is validation, not normalization, and `success` is easier to assert against verbatim forwarding.

Wire into `readValidatedParams` (`:295-332`):

```
const variantIds = parseDocumentIdList(params.get("variantIds"))
const productIds = parseDocumentIdList(params.get("productIds"))
```

and add both to the returned object. Note `readValidatedParams` parses *every* param on *every* call, so the two new parses run on all catalog routes; both return `{ ok: true, value: [] }` for absent params, so no existing route changes behavior.

**`src/shared/utils/catalog-api.utils.ts`** — Modify

Add to `SPANISH_COPY` after `CAT_VAL_006` (`:9`):

```
CAT_VAL_007: "No pudimos comprobar tu lista. Vuelve a cargar la página.",
```

Without it the buyer falls through to the generic string.

**`src/app/api/catalog/revalidate/route.ts`** — Create

Follows `variants/route.ts:13-36` exactly:

```
export async function GET(request: Request) {
  envError → failure
  const { variantIds, productIds } = readValidatedParams(request)
  !variantIds.ok → failure ; !productIds.ok → failure
  try {
    const [variants, products] = await Promise.all([
      fetchVariantsByIds(variantIds.value),
      fetchProductsByIds(productIds.value),
    ])
    return success({ variants, products })
  } catch (error) {
    console.error("GET /api/catalog/revalidate failed", error)
    return failure(CAT_ERR_001, MSG_CAT_ERR_001)
  }
}
```

Edge cases:
- Both lists empty → `{ variants: [], products: [] }` with `success: true`. Both adapters early-return, so this issues zero Strapi queries. No error path needed.
- `Promise.all` rejects on the first failure, which is correct: one banner, one failure state (the "one route" decision).
- **URL length is not a problem** — 200 ids × ~24 chars ≈ 5 KB, same-origin, well inside Node's 16 KB header budget. Recorded so nobody re-derives a POST from it.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test -- __tests__/catalog/revalidate`
- `pnpm test -- __tests__/catalog/_utils.test.ts`

**Manual**
- With `.env.local` set, `GET /api/catalog/revalidate?variantIds=<two real ids>&productIds=<one real id>` returns both arrays populated.
- `?variantIds=` (empty) and no params at all both return `{ success: true, data: { variants: [], products: [] } }`.
- `?variantIds=bad!id` returns `CAT_VAL_007`.
- **The one check only live Strapi can make:** send 11+ real variant ids and confirm **all** come back. A response of exactly 10 means `pagination` was dropped.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `src/app/api/catalog/_utils.ts` | absent/empty → `[]`; empty segment; over-cap count; bad pattern; over-length id; order preserved | `pnpm test -- __tests__/catalog/_utils.test.ts` |
| `src/app/api/catalog/revalidate/route.ts` | env guard; both lists absent → empty success; each `CAT_VAL_007` cause; ids forwarded verbatim to the adapters; adapter rejection → `CAT_ERR_001` | `pnpm test -- __tests__/catalog/revalidate` |
| `src/shared/lib/global.lib.ts` | explicit `pageSize: REVALIDATE_MAX_IDS` on both operations; empty ids issues no query; no local try/catch | `pnpm exec tsc --noEmit` + the 11-id manual check above |

---

## Phase 2 — Search Allowlist Repair And The Link Builder

Delivers AC 8. **Its own phase on purpose** (research, "Scope Assessment"): this is the only part of the story that touches a shipped surface the cart never sees, and therefore the only part that can regress one. Do not fold it into Phase 4's `Buscar alternativa` wiring.

### Changes Required

**`src/shared/constants/catalog.constants.ts`** — Modify, line 39

Replace the single literal with one shared character-class source:

```
const SEARCH_TERM_CHARS = String.raw`\p{L}\p{N}\s\-_.,&()"\/°#`
export const SEARCH_TERM_PATTERN = new RegExp(`^[${SEARCH_TERM_CHARS}]+$`, "u")
export const SEARCH_TERM_UNSAFE_PATTERN = new RegExp(`[^${SEARCH_TERM_CHARS}]+`, "u")
```

- One source of truth. Two hand-maintained regexes that must stay each other's exact complement is the kind of pair that drifts on the next character someone adds.
- **No `g` flag** on the unsafe pattern. `String.prototype.split` works without it, and a `g`-flagged shared regex carries `lastIndex` state across calls.
- `\/` is escaped even though a bare `/` is legal inside a character class — some lint configs flag it and the escape costs nothing.
- Injection is not the exposure being loosened: the term reaches Strapi as an Apollo **variable** feeding a `containsi` filter, never string-interpolated. Note `_` was already allowlisted and is a SQL `LIKE` wildcard under `containsi`, so wildcard reachability is pre-existing and evidently accepted.

All three read sites (`_utils.ts:206`, `_utils.ts:280`, `utils.pagination.ts:59`) pick this up with no edit. That is the point: the same change fixes the shipped search box and `Buscar alternativa` together.

**`src/features/QuotePage/quote.utils.ts`** — Modify

```
export const buildProductSearchHref = (productName: string): string | null
```

- Split `productName` on `SEARCH_TERM_UNSAFE_PATTERN`, trim each segment, drop empties, take the **longest** surviving one.
- Nothing survives → return `null` (the caller renders no link — see Phase 4).
- Truncate to `SEARCH_TERM_MAX_LENGTH` before encoding.
- Return `` `/?mode=name&q=${encodeURIComponent(segment)}&page=1` `` — matching `Home.tsx:238`'s shape, and `encodeURIComponent` is what keeps a `#` in a name from becoming a fragment.

**Longest segment, not "replace disallowed with space."** `1/2" Punta Bristol Cromado` → `Punta Bristol Cromado`; the naive replacement gives `1 2 Punta Bristol Cromado`, which matches nothing under `containsi`. The strip still earns its place after the widening because it absorbs the `*` and `\` data-entry defects the widened pattern deliberately does not admit.

**`__tests__/catalog/_utils.test.ts`** — Modify, `:362-368`

The assertion `?q=tehesa%2F` (forward slash) becomes legal input. **Re-point it at a still-rejected character** — `<` (`%3C`) — do not delete it. It is the only assertion in the suite that the allowlist rejects anything at all; deleting it converts the allowlist into decoration.

Add: `"`, `/`, `°`, `#` each accepted; `1/2" Punta Bristol Cromado` round-trips through `readValidatedParams`.

**`__tests__/quote/quote.utils.test.ts`** — Modify

`buildProductSearchHref` on **real names from live data**, not invented ones:
- `1/2" Punta Bristol Cromado` → `q=Punta%20Bristol%20Cromado`
- `Broca AAV 135° Split Point` → widened pattern admits `°`, so this passes through **untouched**; assert the whole name survives
- `Dado Cuadro 1" Llanta Trasera Capuchon` → `"` now admitted, untouched
- a name whose only content is stripped → `null`

A synthetic `foo/bar` would pass a strip that mangles `1/2" Punta Bristol Cromado` into `1`.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test` — **the full suite, not a targeted run.** This phase changes a constant read by SEO and pagination code.

**Manual**
- Type `1/2"` into the catalog search box → a filtered result, **not** a silent redirect to page 1 of everything.
- Type `<script>` → still rejected with the search-term validation message.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `src/shared/constants/catalog.constants.ts` | `"` `/` `°` `#` accepted; `<` `>` `%` backtick still rejected; the two regexes stay complements | `pnpm test -- __tests__/catalog/_utils.test.ts` |
| `src/features/QuotePage/quote.utils.ts` | longest-safe-segment on three real names + the all-stripped `null` case | `pnpm test -- __tests__/quote/quote.utils.test.ts` |
| `__tests__/catalog/pagination-urls.test.ts`, `__tests__/seo/*` | touch `mode=name` but assert no pattern case — expect them to **pass untouched** | `pnpm test` |

**Treat any failure in `pagination-urls` or `seo` as a real regression, not an expected update.** Those files were measured as pattern-agnostic; if one breaks, the widening did something unintended.

---

## Phase 3 — Revalidation Hook, Check Banner, Totals

Delivers AC 1's client half, AC 4, AC 5, and the subtotal contract. Rows still render Story 2's two states after this phase; the plumbing lands first.

### Changes Required

**`src/features/QuotePage/quote.utils.ts`** — Modify

```
export type LineCheck =
  | { kind: "priced"; currentPrice: number }
  | { kind: "no-price" }
  | { kind: "variant-gone" }
  | { kind: "product-gone" }

export type LineChecks = Record<string, LineCheck>   // keyed by cartLineKey(line)
```

The union lives here, next to its only two consumers (`getQuoteTotals` and `QuoteLineRow`), rather than in `src/shared/types/global.types.ts` as the research doc's table suggested. **Deliberate deviation:** nothing outside `src/features/QuotePage/` refers to it, and the wire types that *do* cross the client/server boundary (Phase 1) are already in `global.types.ts`. Move it up if a second feature ever needs it.

`changed` is **not** a member of this union — it is derived at render time (Phase 4). Storing it would create a second source of truth for one comparison and a way for the badge and the subtotal to disagree.

```
export const getQuoteTotals = (lines: CartLine[], checks?: LineChecks): QuoteTotals
```

- `checks` absent → today's behavior byte for byte; every existing test passes unchanged.
- Per line, look up `checks?.[cartLineKey(line)]`:
  - `variant-gone` / `product-gone` → contributes no money;
  - `no-price` → contributes no money;
  - `priced` → `Math.round(check.currentPrice * 100) * quantity`;
  - absent → today's rule, `line.unitPrice` when non-null.
- Keep the gone case and the no-price case as **separate branches** even though both `continue`. They are different facts — no record versus no price — and Story 4 will need to tell them apart.
- `productCount` and `pieceCount` stay over the **whole** list, gone lines included (Catalog Behavior II). Those counts describe the list; the subtotal describes the money.
- Do not rewrite the cents accumulation — it is already correct. Only the price going in changes.

**`src/features/QuotePage/useQuoteRevalidation.ts`** — Create

```
export type QuotePageStatus = "idle" | "checking" | "done" | "failed"

export const useQuoteRevalidation = (lines: CartLine[], enabled: boolean): {
  pageStatus: QuotePageStatus
  checks: LineChecks
  retry: () => void
}
```

Structure:
- `const linesRef = useRef(lines); linesRef.current = lines` on every render.
- `const [attempt, setAttempt] = useState(0)`; `retry = () => setAttempt(n => n + 1)`.
- `useEffect(..., [enabled, attempt])` — **`lines` is deliberately not a dependency.** With it, every press of the quantity stepper refires the request. Read the current lines off the ref inside the effect.
- Effect body: bail if `!enabled`; read `linesRef.current`; bail (leaving `pageStatus === "idle"`) if empty — **an empty list issues no request at all** (AC 1).
- Build `variantIds` from non-null `variantDocumentId`s and `productIds` from **every** line's `productDocumentId`, each through a `Set`. Product ids repeat across lines constantly; variant ids are already unique per line.
- **Send every product id, not just the variant-less ones** — the deliberate divergence from the epic's AC 1. Without it, a variant line whose product was deleted resolves to `variant-gone`, offers `Elegir otra medida`, and opens a drawer for a product that no longer exists: a dead end. Costs nothing, it is the same request.
- `setPageStatus("checking")`, then `fetchCatalog<RevalidateData>("/api/catalog/revalidate?…")`.
- `let isActive = true` with `return () => { isActive = false }`, the flag `ProductVariantsDrawer.tsx:57-115` already uses. Guard both the success and failure `set*` calls.
- Resolution, per line, **in this precedence order**:
  1. `productDocumentId` not in the returned product set → `product-gone`. **Product-gone beats variant-gone.**
  2. `variantDocumentId === null` → no entry (a variant-less line has nothing to check; it keeps Story 2's rendering).
  3. `variantDocumentId` not in the returned variant map → `variant-gone`.
  4. variant present and `pricing == null` → `no-price`.
  5. otherwise → `{ kind: "priced", currentPrice: variant.pricing.price }`.
- Failure → `setPageStatus("failed")` and **leave `checks` empty**. Snapshot prices then render by falling through to the absent-check branch everywhere.

Edge cases:
- **Absence is the deletion signal**, so the requested id list must be held client-side to compute it. The response cannot report what is missing. Strapi silently omits unmatched ids rather than erroring (Strapi Contract XII), which is what makes this sound — and exactly why a truncated response would be indistinguishable from a batch of deletions.
- A line upgraded through `Elegir medida` **after** the check carries a price fetched from Strapi seconds ago. It has no entry in `checks` and rendering it as unchecked is correct, not a gap.
- `retry` refires the whole batch, not a subset. Freshness is per line but the request is batched, so a partial refresh costs the same round trip.

**`src/features/QuotePage/QuotePage.tsx`** — Modify

- Call the hook after the existing store selectors: `useQuoteRevalidation(lines, mounted)`. The `mounted` gate (`:39-42`) is what keeps the check from firing during SSR or before rehydration, when the cart still reads empty.
- `getQuoteTotals(lines)` at `:87` becomes `getQuoteTotals(lines, checks)`.
- Pass `check={checks[key]}` and `pageStatus` to each `QuoteLineRow` in the `:167-178` map.
- **Check banner**, rendered above the list (both widths), between `QuoteHeading` and the list region:
  - `pageStatus === "checking"` → a `role="status"` row: spinner + `Comprobando precios…` / `Puedes seguir ajustando cantidades.`
  - `pageStatus === "failed"` → a `role="alert"` banner: `No pudimos comprobar los precios.` / `Mostramos los precios guardados. Te los confirmaremos al responder tu solicitud; puedes continuar.` with a `Reintentar` button (`variant="secondary"`) on the right calling `retry`.
  - `idle` / `done` → nothing.
  - **Render each node only in its own status.** Mounting/unmounting is what makes each state announce exactly once; a single always-mounted live region whose text changes re-announces on every render, which the accessibility notes forbid.
  - **The second banner line diverges from the comp** (UI II). The comp reads `Mostramos los precios guardados; puedes continuar con tu solicitud.` Build the UI II copy above. This is the single easiest thing in the story to get wrong, because the comps are otherwise authoritative.
- **Focus when a stepper disappears.** When checks land, a line that became `variant-gone` or `product-gone` loses its `QuantityStepper` from the DOM. In the same effect that stores the results, call the existing `requestRegionFocus()` (`:62-65`) **only if `listRegionRef.current?.contains(document.activeElement)`** — otherwise a buyer who was scrolling elsewhere gets yanked. The `no-price` row keeps its stepper and is not affected.
- Do **not** touch the existing sr-only totals `role="status"` at `:162-164`; its text already changes with the subtotal and that is Story 2's behavior.

**`__tests__/quote/QuotePage.test.tsx`** — Modify

Hoist `originalFetch` (`:240`), the `jsonResponse` helper (`:249`), `mockFetch` (`:252`), and the restoring `afterEach` (`:263`) out of `describe("QuotePage variant upgrade")` to **file scope**, and add a file-scope `beforeEach` giving every test a default `fetch` returning `{ success: true, data: { variants: [], products: [] } }`.

`QuotePage` now fetches on mount, so every earlier `describe` renders it unmocked. jsdom does not fail loudly on that — the unhandled rejection lands *after* the assertions pass, so the suite goes green while the console fills up. The helper already exists; this is a hoist, not a write.

Note the default mock resolves with empty arrays, which resolves **every** line to `product-gone`. Existing tests asserting priced rows must either seed matching products in the mock or assert before resolution — decide per test while hoisting.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test -- __tests__/quote`
- `pnpm build`

**Manual** (desktop + 390px)
- Load `/cotizar` with a seeded cart → `Comprobando precios…` appears, then clears. Quantity steppers stay usable throughout.
- Press a quantity stepper after the check → **no second network request** (Network tab).
- Stop Strapi (or block the route) and reload → the failure banner, snapshot prices, working steppers, working `Quitar`, and `Reintentar` refires the request.
- `/cotizar` with an empty cart → **zero** requests to `/api/catalog/revalidate`.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `src/features/QuotePage/quote.utils.ts` | current price wins over snapshot; gone lines contribute nothing; **no-price lines contribute nothing while still counting in `productCount`/`pieceCount`**; counts unchanged by gone lines; cents arithmetic across a changed price; one-arg call unchanged | `pnpm test -- __tests__/quote/quote.utils.test.ts` |
| `src/features/QuotePage/useQuoteRevalidation.ts` | no request on an empty cart; a quantity edit does not refire; `Reintentar` refires; product-gone beats variant-gone; **`pricing: null` yields `no-price`, not `variant-gone`** | `pnpm test -- __tests__/quote/revalidation.test.tsx` |
| `src/features/QuotePage/QuotePage.tsx` | banner announces once per transition; failure banner carries the **UI II** copy; controls stay enabled while checking and after failure | same, plus the manual steps |

---

## Phase 4 — The Five Line States

Delivers AC 2, AC 3, AC 7, and AC 8's consumer. Build against `comps/brief-3/desktop-seven-state-1-brief-3.png` and the three mobile comps.

### Changes Required

**`src/features/QuotePage/QuoteLineRow.tsx`** — Modify

New props: `check?: LineCheck`, `pageStatus: QuotePageStatus`.

Branch order at the top of the component, **before** the existing `variantDocumentId === null` branch at `:28`:

1. `check?.kind === "product-gone"` → gone row, `Buscar alternativa`
2. `check?.kind === "variant-gone"` → gone row, `Elegir otra medida`
3. `check?.kind === "no-price"` → no-price row
4. existing variant-less row (`:28-68`, unchanged)
5. existing priced row (`:70-109`, extended)

Product-gone first is the precedence rule made structural: a variant-less line whose product is gone must read `Este producto ya no está disponible.`, not `Sin variante seleccionada`.

**The price affix** (UI II — three values, where the comps have two):

```
check present            → `${diameter} · precio comprobado`
no check, status failed  → `${diameter} · precio sin confirmar`
otherwise                → `${diameter} · precio guardado`
```

Replaces the bare `{line.diameter}` at `:78`. Note the affix keys off **check presence**, not `pageStatus === "done"` — a line added after a successful check has no entry and correctly reads `precio guardado`.

Do not swap the verbs. The comps spend *comprobar* on the automated check, which leaves *confirmar* free to carry Tehesa's human promise; `precio sin comprobar` would name the system's failure on every line, which is the banner's job.

**Priced row extension** (AC 2). Derive, never store:

```
const currentPrice = check?.kind === "priced" ? check.currentPrice : line.unitPrice
const changed = check?.kind === "priced"
  && Math.round(check.currentPrice * 100) !== Math.round(line.unitPrice * 100)
```

- **Integer cents, never float equality.** `1360` and `1360.0000001` must not read as a change, and a Strapi `648.9` against a snapshot `648.90` is correctly equal.
- When `changed`: the previous price renders **struck and de-emphasised above** the current one; the `Total` column header becomes `TOTAL ACTUAL`; `El precio cambió al comprobar la lista.` with a check icon sits with the price block; the total uses `currentPrice`.
- The struck value needs a **text equivalent** — an `sr-only` `Precio anterior` — because a price change is otherwise conveyed by strikethrough and position alone.
- Both prices go through `formatNumberToCurrency`. Never a second formatter, including for the struck one.
- When `!changed`, the row renders exactly as today.

**Gone row** (AC 3) — shared shape for both causes:

- De-emphasised (muted text, `border-default-200`). **No tint.** The emerald accent is spoken for by the no-size row, which Story 2 made the only tinted row; a gone row must not compete with it.
- **No quantity stepper, no price block.** These are a different row, not a priced row with a warning.
- Copy: variant-gone `La medida ${line.diameter} ya no está disponible.`; product-gone `Este producto ya no está disponible.` Both add `Esta línea no se incluye en el subtotal.`
- Actions: the recovery action (`variant="secondary"`) + `Quitar` (`variant="tertiary"`, as today).
  - Variant-gone → a `Button` calling the existing `onChooseVariant`. No new code path: `upgradeLine` matches by `cartLineKey` and already handles the collision-merge; the only difference from Story 2 is that the line being upgraded happened to already have a variant.
  - Product-gone → a **`next/link` anchor** to `buildProductSearchHref(line.productName)`, styled to match the secondary button. It is navigation, so it is an anchor — which also gives middle-click and open-in-new-tab, and matches the repo's anchor-or-disabled-span rule (`Home.tsx:356-372`). If `buildProductSearchHref` returns `null`, render **no action at all** — never `href="#"`.
- Accessible names must identify the line: `aria-label={`Elegir otra medida de ${lineLabel}`}` / `` `Buscar alternativa para ${lineLabel}` ``, exactly as `Quitar` does at `:44`. Three rows all saying `Elegir otra medida` are unusable with a screen reader.
- No product image, and **no reserved image space**. `internalId` never appears, including here where a SKU would be tempting.

**No-price row** (AC 7) — no comp exists; reuse the gone row's **layout** with two deliberate departures:

- Copy: `Esta medida no tiene precio actual.` / `Te confirmaremos el precio al responder tu solicitud. Si no está disponible, buscaremos una alternativa.` / `Esta línea no se incluye en el subtotal.`
- **Keeps its `QuantityStepper.`** The line is still quotable by a human and the buyer's quantity is exactly what the seller prices.
- **Offers only `Quitar`** — no `Elegir otra medida`, no `Buscar alternativa`. Both imply the buyer has a problem to fix; the decision (UI IV) was that they do not, and the copy already says Tehesa will resolve it.
- No price block. It is **not** a gone line and must not borrow that copy.

**Mobile:** follow `comps/brief-3/mobile-seven-state-{1,2,3}-brief-3.png` rather than reflowing the desktop row — the gone row is the tight one, two actions plus two lines of explanation at 390px. Use **CSS breakpoints**, as `ProductListing.tsx:60` does; `src/shared/hooks/useMediaQuery.tsx` does not update on resize.

**`__tests__/quote/revalidation.test.tsx`** — Create (extended from Phase 3)

Use the comps' own annotation set as the matrix — `incluida`, `excluida` ×2, `cuenta el actual`, `no bloquea`, `precios guardados` — plus the uncomped fifth state. Reuse `QuotePage.test.tsx`'s harness (seed the cart into `localStorage`, render through `Providers`); do not build a second one.

Three cases worth naming, because they are the ones a reasonable implementation gets wrong **silently**:
- a variant returned **with** `pricing: null` produces `no-price`, **not** `variant-gone` — presence versus absence;
- a `no-price` line keeps counting toward `N productos · N piezas` while contributing nothing to the subtotal;
- the affix takes **three** values across `pageStatus` — assert `precio guardado` *before* the request resolves and `precio sin confirmar` *after* it fails. A test that only checks the failed path passes against a two-value implementation.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test`
- `pnpm build`

**Manual** (desktop + 390px, light + dark)
- Seed a cart, change a price in Strapi, reload → struck previous price above the current one, `TOTAL ACTUAL`, subtotal reflects the **current** price.
- Unpublish a variant → that row reads `La medida … ya no está disponible.`, has no stepper and no price, drops out of the subtotal, and stays in `N productos · N piezas`.
- `Elegir otra medida` opens the existing drawer and returns focus to the button that opened it.
- **AC 8 acceptance test:** on a product named `1/2" Punta Bristol Cromado`, `Buscar alternativa` lands on a filtered search result, not page 1 of everything.
- A variant with an empty `pricing` component keeps its stepper, shows no price, and offers only `Quitar`.
- Every line gone or unpriced → the subtotal reads `$0.00` under `Subtotal estimado (líneas con precio)`. **Verify it reads sensibly** rather than assuming; Story 2's rule is never a bare `$0.00` presented as a total.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `src/features/QuotePage/QuoteLineRow.tsx` | five states; branch precedence (product-gone first); three affix values; cents comparison; gone rows have no stepper and no price; no-price row keeps its stepper | `pnpm test -- __tests__/quote/revalidation.test.tsx` |
| accessibility | per-line accessible names on all three new actions; `Precio anterior` sr-only text; focus lands deliberately when a stepper unmounts | manual screen-reader/keyboard pass |
| `buildProductSearchHref` consumer | real fastener name reaches a search; `null` renders no action rather than `href="#"` | `pnpm test` + the AC 8 manual check |

---

## Cross-Cutting Concerns

- **Strapi env vars.** `STRAPI_HOST` / `STRAPI_API_TOKEN` gate the new route through `validateCatalogEnv()`, same as every catalog route. Without them the page shows the failure banner, which is the correct degradation.
- **Server/client boundary.** The adapters stay `"use server"` in `global.lib.ts`; the client reaches them only through the route handler. `useQuoteRevalidation` and both QuotePage files are `"use client"`.
- **The hydration gate is load-bearing.** Firing before rehydration requests an empty cart and reports nothing, silently.
- **Trust boundary.** The ids come from `localStorage`, which is user-writable. Story 1 validates on rehydrate, but the route is reachable directly and must not rely on that — hence AC 6.
- **JSON-LD / SEO.** Untouched. `/cotizar` is not in the sitemap and this story adds no metadata.
- **Spanish throughout.** `lista` names the collection, `cotización` names the artifact and the act. Quantities are always `piezas`. Money only via `formatNumberToCurrency` (`$1,234.50 MXN`); no currency field exists in Strapi, so `MXN` remains a frontend assumption this story inherits.
- **No new dependency, no store change, no backend change, no persisted-schema change.** If a phase seems to need one, stop — that is the signal the write-back (UI I-b) is being smuggled in.
- **`pnpm design:lint`** only if `DESIGN.md` tokens change. They should not.
- **No `pnpm install`** at any point.

## Open Questions

- **Research sign-off.** The research doc's header still reads "Awaiting human sign-off" even though every question inside it is answered. Confirm before implementing.
- **UI I-b, the price write-back**, is parked with the business owner. Story 3 ships ephemeral either way. If the answer comes back yes it is additive, and it must respect two constraints recorded in the research: capture `previousPrice` explicitly at comparison time (otherwise overwriting `unitPrice` erases the badge it exists to support), and **never persist gone-ness** (Draft & Publish makes a stored `gone` verdict a stored false claim).
- **`RevalidatedProduct.name` is fetched and unused.** Deliberate — refreshing a renamed product's name is out of scope (Catalog Behavior III). Flagged so review does not read it as dead code to delete, or as a hook to quietly wire up.

## Out Of Scope

- The contact form and the WhatsApp message (Story 4), analytics (Story 5).
- Any persisted record of the check, including the deferred price write-back.
- Background, interval, or refocus re-checking. Once per mount plus `Reintentar` (Catalog Behavior I) — a background refetch that silently changes the subtotal while the buyer reads it is worse than a stale number they can refresh.
- Refreshing a renamed product's name.
- `pricePromotion` (epic Strapi Contract VI).
- Any mitigation for unpublish-reads-as-deleted (UI V — accepted, no mitigation).
- Auto-removing gone lines (UI VI — no; never edit the buyer's list for them).
- Widening `ProductVariant.pricing` to nullable and guarding `ProductVariantsDrawer.tsx:77` / `ProductCard.tsx:79`. Pre-existing single-record exposure; this story avoids multiplying it by using a separate wire type, but does not own the fix.
- Making `diameter` clickable or searchable. 56.3% of diameter values fail even the widened pattern — recorded as a tripwire, not a task.
- `KNOWN_PRODUCT_TOTAL = 333` and the stale 7-page ceiling. Unrelated; wide search is not bounded by them.
