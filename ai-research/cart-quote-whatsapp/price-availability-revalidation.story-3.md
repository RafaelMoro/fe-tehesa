# Research: Price And Availability Revalidation On `/cotizar`

**Date:** 2026-08-01
**Epic:** `ai-research/epics/cart-quote-whatsapp.epic.md` (Story 3)
**Status:** Awaiting human sign-off. No source files were modified during this research.

## Story Definition

### Story Title

Revalidate cart prices and availability against Strapi when `/cotizar` loads, and show the buyer what changed.

### Story Description

A cart line is a **snapshot**. It carries the price the variant had at the moment the buyer added it, written into `localStorage` and never touched again. Lists do not expire, so a list assembled in March and opened in August quotes March's prices — and the seller receives a WhatsApp message full of numbers nobody at Tehesa stands behind.

This story re-checks every line against Strapi when the page loads, in **two batched requests**, and surfaces the three things that can have changed: the price moved, the variant is gone, the product is gone. The current price is what the subtotal counts and what Story 4 will send.

The hard constraint is stated in the comps' own annotation: **the check is global and non-blocking**. `Comprobando precios…` and `No pudimos comprobar los precios.` are page-level states, not per-line ones, and neither stops the buyer editing quantities or sending their quote. A Strapi outage degrades this page to exactly what Story 2 shipped, with a warning.

### Acceptance Criteria

1. On load, `/cotizar` revalidates in a **single round trip** to one new route handler — batching every line's variant `documentId`s into one `productVariants(filters: { documentId: { in: [...] } })` query, and every line's product `documentId`s into one `products(filters: { documentId: { in: [...] } })` query. No per-line and no per-product fan-out. An empty list issues no request at all.
2. A line whose current unit price differs from its snapshot renders the **previous price struck through beside the current one**, with `El precio cambió al comprobar la lista.`, and the column relabelled `TOTAL ACTUAL`. The subtotal uses the **current** price. Comparison is in integer cents, never on floats.
3. A **variant that no longer exists** and a **product that no longer exists** get distinct Spanish states and actions — variant gone → `La medida <diameter> ya no está disponible.` + `Elegir otra medida`; product gone → `Este producto ya no está disponible.` + `Buscar alternativa`. Both add `Esta línea no se incluye en el subtotal.` and both are excluded from the subtotal. Neither line is auto-removed.
4. A revalidation failure **never blocks the quote**: a page-level `No pudimos comprobar los precios.` / `Mostramos los precios guardados. Te los confirmaremos al responder tu solicitud; puedes continuar.` banner with a `Reintentar` action, snapshot prices shown, every priced line affixed `precio sin confirmar` (distinct from the never-checked `precio guardado` — UI II), and quantity editing, removal, `Elegir medida`, and (in Story 4) sending all still work.
5. Revalidation results live in **ephemeral React state only** (user decision, 2026-08-01; re-confirmed 2026-08-01 after a write-back proposal was raised and deferred — see UI I). The persisted cart keeps its snapshot untouched: no new persisted field, no `CART_SCHEMA_VERSION` bump, no `migrate` change, no new rehydrate validation.
6. The route handler validates the id lists at the boundary the way every other catalog param is validated — each id against `DOCUMENT_ID_PATTERN` and `DOCUMENT_ID_MAX_LENGTH`, plus a cap on list length — and returns the standard `CAT_*` envelope. The ids come from `localStorage`, which is user-writable.
7. A variant that **still exists but carries no `pricing` component** renders a fifth line state: `Esta medida no tiene precio actual.` plus `Te confirmaremos el precio al responder tu solicitud. Si no está disponible, buscaremos una alternativa.` and `Esta línea no se incluye en el subtotal.` It is excluded from the subtotal, **keeps its quantity stepper** (the buyer still states how many they want and the seller quotes it by hand), shows no price block, and offers only `Quitar`. It is not a "gone" line and must not borrow that copy.
8. **`Buscar alternativa` reaches a search, not the base catalog.** `SEARCH_TERM_PATTERN` admits `"`, `/`, `°`, and `#` so that fastener names survive validation, and the link builder additionally strips any residual out-of-allowlist characters by taking the longest safe segment of the name. Acceptance test: a product named `1/2" Punta Bristol Cromado` lands on a filtered search result, not page 1 of everything. This also repairs the shipped catalog search box for the same 10.2% of names (III-b).

### Task Breakdown

1. Two new GraphQL operations in `src/shared/queries/global.queries.ts`: `GET_VARIANTS_BY_IDS`, `GET_PRODUCTS_BY_IDS`.
2. Two new adapters in `src/shared/lib/global.lib.ts`: `fetchVariantsByIds`, `fetchProductsByIds` — explicit `Promise<T[]>` return types, **no local try/catch** (the adapter contract at `global.lib.ts:30-64`).
3. A list-parsing helper in `src/app/api/catalog/_utils.ts` plus one new error code, and the new route `src/app/api/catalog/revalidate/route.ts`.
4. A `useQuoteRevalidation` hook (or inline effect) in `src/features/QuotePage/`: fires once after the hydration gate, holds page status + a results map, exposes `retry`.
5. Extend `getQuoteTotals` with an optional checks argument so the subtotal uses current prices and skips gone lines. Counts stay over the whole list.
6. Extend `QuoteLineRow` with **five** new states — the four Brief 3 comped, plus the no-current-price row (AC 7), which has no comp and reuses the gone-row layout with its own copy and no recovery action.
7. Wire `Elegir otra medida` to the **existing** upgrade drawer and `Buscar alternativa` to `/?mode=name&q=<product name>`.
8. **Widen `SEARCH_TERM_PATTERN`** to admit `"`, `/`, `°`, `#`, add the longest-safe-segment strip used when building the `Buscar alternativa` href, and re-point the now-invalid pattern assertion at `__tests__/catalog/_utils.test.ts:362` (AC 8, III-b).
9. Tests: route validation, adapters, totals with checks, the page's five line states plus the failure path, and the widened allowlist.

### Scope Assessment

Single story, 3 implementation phases (query + adapters + route → page hook and totals → line states and actions). One new route, two new queries, two new adapters, edits to four existing files. **No new dependency. No store change. No backend change.**

One item sits outside that shape and should not be smuggled into a phase quietly: **AC 8 repairs a pre-existing wide-search bug** (III-b) by widening a constant that Story 1a's shipped code and tests depend on. It is small — one regex, one helper, one re-pointed assertion — but it is the only part of this story that can regress a surface the cart never touches. Plan it as its own step with its own verification, not as a footnote to the `Buscar alternativa` wiring.

### Dependencies

- **Blocked by:** Stories 1 and 2 — both shipped (`ai-planning/cart-quote-whatsapp/`).
- **Blocks:** Story 4 — its WhatsApp message must carry the *current* price, not the snapshot, and its subtotal is this story's subtotal.
- **Does not touch:** the contact slice, the message builder, analytics.

## Delivered Comps

Brief 3 already designed all four of this story's states. **Build against the comps.** No new design work is required and no brief needs re-running.

| File | Covers |
|---|---|
| `comps/brief-3/desktop-seven-state-1-brief-3.png` | States 1-5 at 1440px light — including **3 price changed**, **4 no longer available (both causes)**, **5 checking** |
| `comps/brief-3/desktop-seven-state-2-brief-3.png` | State **6 check failed** and state 7 empty, at 1440px light |
| `comps/brief-3/desktop-seven-state-dark-1-brief-3.png` | The same states, dark |
| `comps/brief-3/mobile-seven-state-{1,2,3}-brief-3.png` | The seven states at 390px |

Exact copy the comps fix, transcribed:

| State | Comp copy |
|---|---|
| Priced, checked | Diameter subtitle becomes `9/16" · precio comprobado`. Annotation `incluida`. |
| Price changed | `El precio cambió al comprobar la lista.` with a check icon; old price struck and de-emphasised **above** the new one; column header `TOTAL ACTUAL`. Annotation `cuenta el actual`. |
| Variant gone | `La medida 9/16" ya no está disponible.` + `Esta línea no se incluye en el subtotal.`; actions `Elegir otra medida` (bordered secondary) and `Quitar` (text). Whole row de-emphasised, **no quantity control, no price**. |
| Product gone | `Este producto ya no está disponible.` + `Esta línea no se incluye en el subtotal.`; actions `Buscar alternativa` (bordered secondary) and `Quitar` (text). Annotation for both: `dos causas`. |
| Checking | Page-level row above the list: spinner + `Comprobando precios…` / `Puedes seguir ajustando cantidades.` Lines below render normally with `9/16" · precio guardado`. Annotation `no bloquea`. |
| Check failed | Page-level banner: `No pudimos comprobar los precios.` / `Mostramos los precios guardados; puedes continuar con tu solicitud.` with a `Reintentar` action on the right. Lines carry a `Precio guardado` affix. Annotation `precios guardados`. **Superseded by UI II** — the banner's second line and the line affix both changed; build the UI II copy, not this row. |

**One state has no comp.** AC 7's no-current-price row was decided after Brief 3 was designed (UI IV, 2026-08-01). It needs **no re-brief**: reuse the gone-row layout exactly — de-emphasised, no price block, no tint — with two differences, both deliberate. It **keeps its quantity stepper**, because the line is still quotable by a human and the buyer's quantity is what the seller prices. And it offers **no recovery action**, only `Quitar`, because the copy already says Tehesa will resolve it. Do not give it `Elegir otra medida` or `Buscar alternativa`; both imply the buyer has a problem to fix, and the decision was that they do not.

Two things the comps settle that prose would have got wrong:

- **`Comprobando precios…` and `No pudimos comprobar los precios.` are page-level, not per-line.** The comp's own header note says so: *"Los estados de comprobación son globales y no bloquean cantidades ni una futura solicitud."* That collapses the state model from seven per-line variants to four per-line results plus one page status.
- **Gone lines lose their quantity stepper and their price block entirely.** They are not "a priced line with a warning" — they are a different row.

Per the epic ("What The Brief 3 Comps Settle"), every state block carries its subtotal contract as an annotation (`incluida`, `excluida`, `cuenta el actual`, `no bloquea`, `precios guardados`). **Keep that annotation set as the test matrix** — it is the acceptance criteria written in the design.

## Design Agent Handoff

### User Goal

A buyer opens a list they may have assembled weeks ago and needs to know whether it is still true before handing it to a seller. **This is not a checkout, and it is not an availability promise either.** Strapi has no stock, no delivery, no lead time. The only two things this page can honestly report are *the price we publish today* and *this record no longer exists* — and it must report both without ever suggesting it can reserve, hold, or guarantee anything.

### Surface Index

| Surface | File | States | Story | Brief |
|---|---|---|---|---|
| `/cotizar` line list | `src/features/QuotePage/QuoteLineRow.tsx` | Priced, no-size (+ `Elegir medida`) | 2 — shipped | 3 |
| `/cotizar` line list | same | **Price changed, variant gone, product gone** | **3** | 3 — `comps/brief-3/desktop-seven-state-1-brief-3.png` |
| `/cotizar` line list | same | **No current price** (AC 7) | **3** | none — reuses the gone-row layout, keeps the stepper |
| `/cotizar` check banner | `src/features/QuotePage/QuotePage.tsx` | **Checking, check failed (+ `Reintentar`)** | **3** | 3 — seven-state 1 and 2 |
| `/cotizar` subtotal | same | Excludes gone lines, counts current prices | **3** (extends 2) | 3 |
| Upgrade drawer | `src/features/ProductVariantsDrawer/` | Reused unchanged for `Elegir otra medida` | 2 — shipped | none needed |
| Catalog wide search | `src/app/page.tsx` | Reused unchanged as `Buscar alternativa`'s destination | 1a — shipped | none needed |

### Rules That Override Any Design Instinct

1. **The check never blocks.** No modal, no skeleton over the whole list, no disabled controls while checking, no error state that hides the lines. A buyer who arrives during a Strapi outage must still be able to review and send.
2. **Never claim availability.** `ya no está disponible` is a statement about a *deleted record*, which is the only availability fact this app has. Do not soften it into stock language, do not add "quedan pocas", do not invent a restock date.
3. **The subtotal still excludes things, and now excludes more.** Story 2's `Subtotal estimado (líneas con precio)` label already covers variant-less lines; gone lines join them. The label does not change.
4. **No banner about what this page is.** Story 2's rule survives: the only banners on this page are the two check-status ones, and they are about the check, not about the business model.

### Mobile And Desktop

Phone-first, single column at ~390px (`comps/brief-3/mobile-seven-state-{1,2,3}-brief-3.png`). The check banner sits above the list at both widths. `src/shared/hooks/useMediaQuery.tsx` **does not update on resize** — use CSS breakpoints, as `ProductListing.tsx:60` does.

The gone-line row is the one that gets tight on a phone: two actions plus two lines of explanation. Follow the mobile comps rather than reflowing the desktop row.

### Accessibility

Specified here because a comp cannot express any of it (the epic already flags the first two at `cart-quote-whatsapp.epic.md:424`):

- `Comprobando precios…` is `role="status"`. `No pudimos comprobar los precios.` is `role="alert"`. Both are the existing drawer pattern (`ProductVariantsDrawer.tsx:205-206`).
- The banner must not be a live region that re-announces on every render. Announce the *transition* — checking, then the outcome — once each.
- `Reintentar`, `Elegir otra medida`, and `Buscar alternativa` all need accessible names identifying their line, exactly as Story 2's `Quitar` and `QuantityStepper` do (`QuoteLineRow.tsx:44,51,61`). Three rows saying `Elegir otra medida` are unusable with a screen reader.
- A price change is conveyed today by strikethrough and position. Give the struck value a text equivalent (`Precio anterior`), never colour or line-through alone.
- `Elegir otra medida` opens the existing drawer; focus must return to the button that opened it, as Story 2 already requires.
- When the check completes and a line becomes "gone", its quantity stepper is removed from the DOM. If focus was inside it, focus must land somewhere deliberate — the same problem Story 2 solved for `Quitar` with `requestRegionFocus` (`QuotePage.tsx:50-65`). Reuse it. **The no-price row (AC 7) keeps its stepper, so it does not have this problem** — one more reason not to build it as a variation on the gone row's behaviour, only on its layout.

### Visual Patterns To Preserve

`DESIGN.md` (validate with `pnpm design:lint`): HeroUI v3 components and its six real `Button` variants (`primary`, `secondary`, `tertiary`, `ghost`, `outline`, `danger` — there is no `light`/`flat`/`bordered`), Tailwind v4 utilities, `border-default-200` dividers, **Geist Sans including for prices** (not Geist Mono), class-based dark mode. The emerald accent is already spoken for by the no-size row, which Story 2 made *the only tinted row* — a gone row must not compete with it for attention by acquiring a tint of its own. The comps de-emphasise instead.

### Content Constraints

- Spanish throughout. `lista` names the collection, `cotización` names the artifact and the act (epic vocabulary rule).
- Money only via `formatNumberToCurrency` (`$1,234.50 MXN`). Never a second formatter, including for the struck-through previous price.
- Quantities are always `piezas`.
- `internalId` never appears in this UI (epic UI IV), including in the "this is gone" states where a SKU would be tempting.
- No product images. Do not reserve image space in a gone row.

### Explicitly Out Of Scope

The contact form and the WhatsApp message (Story 4), analytics (Story 5), quote recovery after hand-off (deferred, `docs/improvement.md`), any persisted record of the check (**including the deferred price write-back — UI I-b**), background or interval re-checking, refreshing a **renamed** product's name (see Catalog Behavior III), and `pricePromotion` (epic Strapi Contract VI — ignored).

### Decision Record

- ~~Do revalidation results persist?~~ **Answered 2026-08-01 — no, ephemeral React state.** The persisted cart is the snapshot and stays the snapshot. Reopened the same day as a write-back proposal (overwrite `unitPrice` on a successful check) and **deferred to the business owner**; build ephemeral now. Full cost analysis is preserved at UI I-b, including the one constraint any future write-back must carry: the price-changed badge is derived from `current !== line.unitPrice`, so writing back erases the badge unless `previousPrice` is captured explicitly at comparison time.
- ~~What does a variant with no `pricing` render as?~~ **Answered 2026-08-01 — its own line state (AC 7).** Not the snapshot, not "gone". Tehesa quotes it by hand, so the row states that and keeps the quantity stepper instead of offering the buyer a recovery action.
- ~~Is unpublish-reads-as-deleted acceptable?~~ **Answered 2026-08-01 — yes, no mitigation.**
- ~~Does a failed line look different from an unchecked one?~~ **Answered 2026-08-01 — yes (UI II), reversing the original recommendation.** Three affixes instead of two, and the "we will confirm the price" commitment goes in the banner rather than on each line. Two copy strings now diverge from Brief 3.
- ~~One route or two?~~ **Answered 2026-08-01 — one `GET /api/catalog/revalidate`** carrying both id lists and returning both result sets in one envelope. It is one operation from the page's point of view, and two routes would mean two failure states to reconcile into one banner.
- ~~Where does `Buscar alternativa` go?~~ **Answered 2026-08-01 — `/?mode=name&q=<product name>`**, the wide-search URL the app already serves. A `next/link` to an existing route; no new code.
- ~~Does `Elegir otra medida` need a new drawer mode?~~ **No.** Story 2's single-select upgrade mode and `upgradeLine` (including its collision-merge branch) already do exactly this. The only difference is the line being upgraded already had a variant.
- ~~Do gone lines count toward `N productos · N piezas`?~~ **Yes.** Those counts describe the list; the subtotal describes the money. A line the buyer can still see and still remove is still in the list.
- **Open:** whether a line that fails to revalidate should be visually distinguishable from one that was never checked. Currently both render `precio guardado` (see UI II).

## Technical Research

### Affected Areas

| Path | Change |
|---|---|
| `src/shared/queries/global.queries.ts` | **New:** `GET_VARIANTS_BY_IDS`, `GET_PRODUCTS_BY_IDS` |
| `src/shared/lib/global.lib.ts` | **New:** `fetchVariantsByIds`, `fetchProductsByIds` |
| `src/app/api/catalog/_utils.ts` | **New:** `parseDocumentIdList` + wire into `readValidatedParams` |
| `src/shared/constants/catalog.constants.ts` | **New:** `CAT_VAL_007` / `MSG_CAT_VAL_007`, `REVALIDATE_MAX_IDS`. **Changed:** `SEARCH_TERM_PATTERN` widened to admit `"` `/` `°` `#` (AC 8) |
| `__tests__/catalog/_utils.test.ts` | **Changed:** the pattern assertion at `:362` uses `/` as its unsafe example and must be re-pointed (see III-b) |
| `src/shared/utils/catalog-api.utils.ts` | Add `CAT_VAL_007` to `SPANISH_COPY` |
| `src/app/api/catalog/revalidate/route.ts` | **New route** |
| `src/features/QuotePage/QuotePage.tsx` | Check banner, hook wiring, results threaded to rows and totals |
| `src/features/QuotePage/QuoteLineRow.tsx` | Three new line renderings |
| `src/features/QuotePage/quote.utils.ts` | `getQuoteTotals` gains an optional checks argument |
| `src/shared/types/global.types.ts` | Revalidation result types |
| `__tests__/catalog/revalidate/`, `__tests__/quote/` | New and extended |

Untouched, deliberately: `src/zustand/store/cart.store.ts`, `src/shared/constants/cart.constants.ts`, `sitemap.ts`, `robots.ts`, `seo.utils.ts`.

### The Shape

```
QuotePage mounts
  └─ hydration gate passes (mounted === true, existing pattern at QuotePage.tsx:39-42)
       └─ lines.length > 0 ?
            ├─ no  → no request, nothing to check
            └─ yes → pageStatus = "checking"
                     GET /api/catalog/revalidate?variantIds=…&productIds=…
                       ├─ ok   → results map; pageStatus = "done"
                       └─ fail → results empty; pageStatus = "failed" (+ Reintentar)
```

**Fires once per mount, plus `Reintentar`.** It must **not** re-run when `lines` changes — otherwise every press of the quantity stepper refires the request. Guard with a ref, not a `lines` dependency. Cancel in-flight work with the `isActive` flag the drawer already uses (`ProductVariantsDrawer.tsx:57-115`).

A line upgraded via `Elegir medida` after the check carries a price fetched from Strapi seconds ago — it needs no re-check, and treating it as `unchecked` is correct.

### The State Model

Small on purpose. One page status, one map keyed by `cartLineKey(line)` (the key Story 1 already defined, `cart.store.ts:58-60`):

```
pageStatus: "idle" | "checking" | "done" | "failed"

check:
  | { kind: "priced"; currentPrice: number }   // "changed" is derived, not stored
  | { kind: "no-price" }                       // variant present, `pricing` component empty (AC 7)
  | { kind: "variant-gone" }
  | { kind: "product-gone" }
  // absent from the map = never checked → render the snapshot with `precio guardado`
```

`no-price` and the two `gone` kinds look alike and are not. `gone` is derived from **absence** — the id was asked for and did not come back. `no-price` is derived from **presence with a null `pricing`** — the record is there. Only variant lines can reach it; a variant-less line has no variant to price.

`changed` is **derived** at render time — `Math.round(current * 100) !== Math.round(line.unitPrice * 100)` — rather than stored. Storing it would create a second source of truth for the same comparison and a way for the badge and the subtotal to disagree.

**Absence is the signal for deletion.** The route returns whatever Strapi has; anything the client asked for and did not get back is gone. That requires the client to hold the requested id list, which it does.

### Matching, Precedence, And One Divergence From The Epic's AC 1

The epic's AC 1 sends **only variant-less lines** in the products batch. That leaves a hole: a variant line whose *product* was deleted resolves to `variant-gone` and offers `Elegir otra medida`, which opens the drawer, which fetches variants for a product that no longer exists and lands on `No encontramos variantes para este producto.` — a dead end.

**Send every distinct `productDocumentId` in the products batch, not just the variant-less ones.** The ids are already in hand, it is the same request, and it turns that dead end into the correct `Buscar alternativa`. Precedence: **product-gone beats variant-gone**. Recorded as a deliberate divergence; it makes the story strictly smaller in behaviour terms, not larger.

Dedupe both lists with a `Set` before building the URL. Variant ids are already unique per line (a variant belongs to one product, so `product:variant` keys cannot collide on the variant), but product ids repeat across lines constantly.

### The Route

```
GET /api/catalog/revalidate?variantIds=a,b,c&productIds=p,q
→ { success: true, data: { variants: [...], products: [...] } }
```

Follows every existing catalog route exactly: `validateCatalogEnv()` first, then param validation, then one `try/catch` mapping anything thrown to `CAT_ERR_001` / HTTP 400 (`variants/route.ts:13-36` is the template). The adapters keep no local try/catch, per the contract documented at `global.lib.ts:30-64`.

Validation, per AC 6 — a new `parseDocumentIdList` in `_utils.ts` mirroring `parseDocumentId` (`_utils.ts:222-247`):

- Missing or empty param → empty list (not an error). A cart with no variant-less lines legitimately sends no `productIds`.
- Split on `,`; reject any empty segment.
- Each id: `DOCUMENT_ID_PATTERN` and `DOCUMENT_ID_MAX_LENGTH` — the same two rules `parseDocumentId` applies.
- Length cap: `REVALIDATE_MAX_IDS`, set to `CART_MAX_LINES` (100). One line per key, so a valid cart can never exceed it; anything that does came from a tampered `localStorage`.
- Both lists empty → `{ variants: [], products: [] }` with `success: true`. A request for nothing correctly returns nothing; no error path needed.

New code `CAT_VAL_007` with a Spanish entry in `catalog-api.utils.ts` — without it the buyer gets the generic fallback string.

**URL length is not a problem.** 100 variant ids + 100 product ids at ~24 characters each is ~5 KB. That is a same-origin `fetch` to our own Next server, well inside Node's 16 KB header budget; the "2 KB URL limit" is an IE-era artifact. Recorded so nobody re-derives a POST from it.

### GraphQL

```graphql
query GetVariantsByIds($filters: ProductVariantFiltersInput, $pagination: PaginationArg) {
  productVariants(filters: $filters, pagination: $pagination) {
    documentId
    diameter
    pricing { price }
  }
}

query GetProductsByIds($filters: ProductFiltersInput, $pagination: PaginationArg) {
  products(filters: $filters, pagination: $pagination) {
    documentId
    name
  }
}
```

`filters: { documentId: { in: ids } }` on both — `documentId` is an **`IDFilterInput`**, so an explicitly typed variable must be `[ID!]`, not `[String!]` (Strapi Contract VIII). Notes:

- **`pagination` is mandatory, not optional.** Verified 2026-08-01: Strapi's GraphQL plugin applies **no hard cap** (`limit: 1000` returns 1000), but **omitting `pagination` returns 10 records**. On an 11-line cart that renders lines 11 onward as `ya no está disponible`. Pass an explicit limit of at least `REVALIDATE_MAX_IDS`. This is Strapi Contract IX and it is the one mistake in this story that fails silently and confidently.
- **Select nothing that is not used.** No `minPrice`/`maxPrice` — unmaintained denormalized columns (`docs/improvement.md:20-29`), three live products carry `0` or `null`. No `internalId` — it never reaches this UI and the line already carries it for Story 4. No `pricePromotion` — epic Strapi Contract VI, ignored by decision. No `product { … }` on the variant — the relation is nullable and the cart line already knows its product (Strapi Contract XIII).
- **`pricing` is nullable; `pricing.price` inside it is `Float!`** (Strapi Contract X). So `variant.pricing?.price` is a number or nothing. A variant with an empty `pricing` component is a third "cannot quote" case, not a crash to guard away — see UI IV.

### Totals

`getQuoteTotals` (`quote.utils.ts:9-25`) gains an optional second argument:

```
getQuoteTotals(lines)          // unchanged behaviour — every existing test still passes
getQuoteTotals(lines, checks)  // gone and no-price lines contribute no money; priced lines use the current price
```

Three kinds contribute nothing to the subtotal — `variant-gone`, `product-gone`, and `no-price` — and they do so for two different reasons that the code should not collapse into one branch: the first two have no record, the third has no price. `productCount` and `pieceCount` stay over the whole list. The cents accumulation is already correct (`Math.round(unitPrice * 100) * quantity`, divided once) — do not rewrite it, just choose which price goes in.

### Existing Patterns To Follow

- **Hydration gate before anything client-only** — `QuotePage.tsx:39-42`, itself the `Header.tsx:15-21` pattern. The check must not fire during SSR or before rehydration, or it will request an empty cart.
- **Client fetch with pending + failure state** — `ProductCard.tsx:58-95` (single-variant add) and `ProductVariantsDrawer.tsx:57-115` (variant load) are both precedents, including the `isActive` cancellation flag and `catalogErrorToSpanish` for the message.
- **Envelope + `CAT_*` codes** — `catalog-api.utils.ts`. `fetchCatalog<T>` throws `CatalogApiError` with a `.code`; the page catches and shows the fixed banner copy rather than the code's generic string, because the comp fixes the wording.
- **Throw at the boundary, catch at the edge** — `global.lib.ts:30-64`. Do not add a try/catch to the new adapters.
- **Deliberate focus moves** — `requestRegionFocus` at `QuotePage.tsx:50-65`.
- **Curly braces on one-line `if` returns; multi-line object literals; validation messages naming the input and the rule** — `docs/IMPLEMENTATION_GUIDELINES.md`.
- Tests live in root `__tests__/`, never co-located. Canonical rules in `docs/UNIT_TESTING_GUIDELINES.md`.

### Verification Rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
- `pnpm test -- __tests__/catalog/revalidate` and `pnpm test -- __tests__/quote` for targeted runs; `pnpm test` for the suite.
- `pnpm design:lint` only if `DESIGN.md` tokens change — they should not.
- **No `pnpm install`.** This story adds no dependency.
- Manual QA against live Strapi is the user's. The two things only it can catch: that a real deleted variant actually disappears from the batched response rather than erroring, and that a 100-line cart comes back complete rather than silently capped.

### Test Coverage

| File | Cases |
|---|---|
| `__tests__/catalog/revalidate/route.test.ts` | Env guard; both lists absent → empty success; a bad id pattern, an over-length id, an empty segment, an over-cap list → `CAT_VAL_007`; ids forwarded verbatim to the adapters; adapter rejection → `CAT_ERR_001` |
| `__tests__/quote/quote.utils.test.ts` | Extended: current price wins over snapshot; gone lines contribute nothing; **no-price lines contribute nothing while still counting in `productCount`/`pieceCount`**; counts unchanged by gone lines; cents arithmetic across a changed price |
| `__tests__/quote/revalidation.test.tsx` | The comps' annotation set as the matrix — `incluida`, `excluida` ×2, `cuenta el actual`, `no bloquea`, `precios guardados`; plus the uncomped fifth state (**no-price row: keeps its stepper, shows no price, offers only `Quitar`**); no request on an empty cart; a quantity edit does not refire the request; `Reintentar` refires it; the banner announces once |

Three cases worth naming because they are the ones a reasonable implementation gets wrong silently: a variant returned **with** `pricing: null` must produce `no-price` and **not** `variant-gone` (presence versus absence); a `no-price` line must keep counting toward `N productos · N piezas`; and the affix must take **three** values across `pageStatus`, so assert `precio guardado` before the request resolves and `precio sin confirmar` after it fails — a test that only checks the failed path will pass against a two-value implementation.

| `__tests__/catalog/_utils.test.ts` | **Changed:** re-point the `:362` pattern assertion off `/` onto a still-rejected character. **Added:** `"`, `/`, `°`, `#` now accepted; a real name (`1/2" Punta Bristol Cromado`) round-trips |
| `__tests__/quote/` (link building) | The longest-safe-segment strip: `1/2" Punta Bristol Cromado` → `Punta Bristol Cromado`, `Broca AAV 135° Split Point` → `Broca AAV 135`, and a name needing no strip passes through untouched |

`__tests__/quote/QuotePage.test.tsx` seeds the cart directly into `localStorage` and renders through `Providers` — reuse that harness rather than building a second one, and hoist its existing `mockFetch` helper (`:252`) to file scope first, per Verification II.

Note the strip is tested on **real names taken from live data**, not invented ones. The two above are verbatim from the 34 that currently fail; a synthetic `foo/bar` would pass a strip that mangles `1/2" Punta Bristol Cromado` into `1`.

### Edge Cases And Constraints

- **A truncated response is indistinguishable from a batch of deletions.** The sharpest hazard in the story, and it is not hypothetical: Strapi's GraphQL default page size is **10** (Strapi Contract IX). Omit `pagination` and an 11-line cart reports lines 11 onward as `ya no está disponible` and drops them from the subtotal, with no error anywhere. Both new operations must pass an explicit limit.
- **A variant can exist with no price.** `pricing` is nullable (Strapi Contract X), so `variant.pricing?.price` — never `variant.pricing.price`. This is now a first-class result kind (`no-price`) with its own row, per AC 7 and UI IV — not a guard, and not folded into either "gone" state.
- **An unpublished record reads as a deleted one.** Draft & Publish is on (Strapi Contract XI). Nothing to build; see UI V.
- **`localStorage` is a trust boundary and the ids come from it.** Story 1 validates on rehydrate, so ids reaching the page have already passed `DOCUMENT_ID_PATTERN` — but the route must not rely on that. It is reachable directly.
- **Draft & Publish.** If it is enabled, an *unpublished* variant is absent from a default query and will render as deleted. That is arguably the right buyer-facing outcome, but it is a different fact, and it decides whether an editor unpublishing a variant for ten minutes shows a wrong state to every buyer (Strapi Contract XI).
- **Float equality.** `1360` and `1360.0000001` must not read as a price change. Compare in cents.
- **A price that changed to the same value in a different shape** — Strapi decimals arriving as `648.9` against a snapshot of `648.90` — are equal in cents. Correct by construction.
- **The subtotal can go down to zero** while lines remain, if every line is gone or unpriced. Story 2's rule holds: never a bare `$0.00` presented as a total. The label already says `(líneas con precio)`; verify the zero case reads sensibly rather than assuming it.
- **No currency field exists in Strapi.** `MXN` is a frontend assumption in `formatNumberToCurrency` and this story inherits it.
- **A renamed product is not detected.** The products query returns `name` and we could refresh it, but the story's ACs cover price and availability only, and refreshing the name would silently rewrite a line the buyer recognises. Deliberately out of scope (Catalog Behavior III).
- **The three known-bad catalog records** (`docs/improvement.md:35-39`) have `variantCount` of `0`/`null` and `$0` prices. They are a data defect the backend owns; this story adds no fallback UI for them, consistent with the agreed handling.
- **`KNOWN_PRODUCT_TOTAL = 333` and the 7-page ceiling are stale** and unrelated. `Buscar alternativa` links to wide search, which is not bounded by them.
- **`Buscar alternativa`'s destination silently redirects to the base catalog for 10% of products.** Measured, not hypothetical (III-b). Whichever fix is chosen, the acceptance test is that clicking it on a product named `1/2" Punta Bristol Cromado` reaches a search result rather than page 1 of everything.

## Open Questions

### Strapi Contract

*(Numbering continues from the epic's Strapi Contract section, which answered I-VII on 2026-07-30/31.)*

VIII: Question: Does `productVariants(filters: { documentId: { in: [...] } })` exist and behave as this story assumes, and does `products(filters:)` accept `documentId` the same way?
Status: answered
Answer: **Yes, with one correction to the epic's wording.** `productVariants(filters: ProductVariantFiltersInput, pagination: PaginationArg, sort: [String], status: PublicationStatus)` is a top-level query. `documentId` is an **`IDFilterInput`**, not a `StringFilterInput` as the epic's Strapi Contract II records — the `in` operator takes `[ID]`. `products(filters: ProductFiltersInput)` is identical, also `IDFilterInput`.
Context: Backend-research subagent, 2026-08-01, live GraphQL introspection plus `store-tehesa-api` schema files.
Explanation: The correction is cosmetic for us — `in` is available on both and the ids are strings either way — but it matters when writing the operation, because a variable typed `[String]` will not satisfy `[ID]` under GraphQL's strict variable-type checking. Type the variable as the input object and let the server coerce, or type it `[ID!]`.

IX: Question: What is the maximum number of records Strapi's GraphQL plugin will return for one collection query, and does it cap silently?
Status: answered — **and the answer is worse than the question assumed**
Answer: There is **no hard cap** — `pagination: { limit: 1000 }` returns 1000 records with no truncation. But **the default when `pagination` is omitted is 10**. The REST `maxLimit: 100` in `config/api.ts` does **not** apply to GraphQL; `config/plugins.ts` sets no GraphQL limit at all.
Context: Backend-research subagent, 2026-08-01. Live tests at `limit: 10` and `limit: 1000`; `store-tehesa-api/config/api.ts:3-4` and `config/plugins.ts`.
Explanation: **This is the single most dangerous fact in the story, and it inverts the risk.** The feared failure was a cap at 100 on a 100-line cart — an edge case. The real failure is that *forgetting* `pagination` silently returns the first 10 records, so an 11-line cart renders lines 11 onward as `ya no está disponible` and drops them from the subtotal. That is not an edge case; it is every cart above ten lines, and it is a wrong answer delivered confidently. `pagination` is **mandatory** on both new operations, with an explicit limit of at least `REVALIDATE_MAX_IDS`. Note this differs from `fetchProductVariants`, which already passes `pageSize: 100` (`global.lib.ts:167-172`) and is therefore safe — the new adapters must not be written by analogy to a query that got this right by accident of copying.

X: Question: Is `pricing` nullable on `productVariant`, and is `pricing.price` nullable?
Status: answered
Answer: **`pricing` is nullable; `price` inside it is `NON_NULL Float`.** `pricing` is a non-repeatable component (`shared.pricing`), not a relation.
Context: Backend-research subagent, 2026-08-01. `store-tehesa-api/.../product-variant/schema.json:95-98`; introspection shows `productVariant.pricing: ComponentSharedPricing` (nullable) and `ComponentSharedPricing.price: Float!`.
Explanation: So `variant.pricing?.price` is either a real number or nothing — there is no such thing as a variant with a `pricing` component and a null price. The exposure is a variant whose `pricing` component was never filled in. `ProductVariantsDrawer.tsx:77` and `ProductCard.tsx:79` already dereference it unguarded, so this is pre-existing, but this story reads it across up to 100 records in one pass, which turns a rare crash into a likely one. **A variant that exists with no `pricing` is a third "cannot quote this line" case and needs a product decision, not a silent guard** — see UI IV.

XI: Question: Is Draft & Publish enabled on `product` and `product-variant`, and does the default query return published entries only?
Status: answered as fact; **the product consequence is pending a decision** (UI V)
Answer: **Enabled on both**, and a default query (no `status` argument) returns published entries only.
Context: Backend-research subagent, 2026-08-01. Both `schema.json` files line 10 (`"draftAndPublish": true`); live comparison of default versus `status: PUBLISHED` returns identical sets.
Explanation: An **unpublished** variant is therefore absent from the batched response and, under this story's "absence means deleted" rule, renders as `La medida ya no está disponible.` and drops out of the subtotal. Mechanically fine — a buyer should not be quoted an unpublished record — but it means a routine editorial action in the Strapi admin produces a deletion state for every buyer holding that line, and it is indistinguishable from a real deletion in both the UI and the logs. Nothing to build; something to agree to.

XII: Question: When an id in an `in` filter matches no record, does Strapi error or silently omit it?
Status: answered
Answer: **Silently omits it.** The query succeeds and the result array is simply shorter (or empty).
Context: Backend-research subagent, 2026-08-01. Live test: `productVariants(filters: { documentId: { in: ["nonexistent-id-12345"] } })` returns `{"data":{"productVariants":[]}}`, no error.
Explanation: This is what makes "absence means deleted" a sound mechanism — one stale id does not fail the batch for every other line. It is also exactly why IX is dangerous: omission is the *expected* shape of a missing record, so a pagination-truncated response is byte-for-byte indistinguishable from a batch of genuine deletions.

XIII: Question: Is the `product` relation on `productVariant` selectable, and is it nullable?
Status: answered
Answer: **Selectable as `product`, and nullable** (`manyToOne`, not required).
Context: Backend-research subagent, 2026-08-01. `product-variant/schema.json:14-18`; introspection shows `productVariant.product: Product` with no `NON_NULL` wrapper.
Explanation: This story does not need it — matching is by variant `documentId` against the requested list, and the cart line already knows its product. Recorded so it is not selected "for safety": an orphaned variant would return `product: null` and any code that dereferenced it would crash on precisely the malformed data it was added to detect.

### Catalog Behavior

I: Question: Should the revalidation re-run on window focus, on an interval, or on navigating back to `/cotizar`?
Status: answered
Answer: **No. Once per mount, plus `Reintentar`.**
Explanation: Refocus-refetch is a `TanStack Query` habit and this app deliberately has no query library. A background refetch that silently changes the subtotal while the buyer is reading it is worse than a stale number they can refresh themselves. `Reintentar` exists and a page reload exists.

II: Question: Do gone lines still count toward `N productos · N piezas`?
Status: answered
Answer: **Yes.** Those counts describe the list; the subtotal describes the money.
Context: The comp's counts are internally consistent across all seven states (epic, "What The Brief 3 Comps Settle").

III: Question: Should a product renamed in Strapi update the name shown on the line?
Status: answered — **no, out of scope.**
Explanation: The products query returns `name` so it is available for free, but the story's ACs are price and availability. Rewriting a line's name under the buyer, mid-review, is a change they did not ask for and cannot undo. If it matters later it is one line of merge code.

IV: Question: Should the variant-batch request include variants belonging to products that are already known gone?
Status: answered — **yes, send everything in one shot.**
Explanation: Two sequential requests (products first, then variants for survivors) would double the latency to save a few ids. Resolve precedence client-side after both results land: product-gone beats variant-gone.

### UI And Product Decisions

I: Question: Where do revalidation results live?
Status: **answered by the user, 2026-08-01 — ephemeral React state.** Reopened and re-closed the same day; the write-back variant is deferred to the business owner (see I-b).
Explanation: The persisted cart stays the snapshot. No new persisted field, no `CART_SCHEMA_VERSION` bump, no `migrate` change, no new rehydrate validation, and no way for a stored "previous price" to drift from a stored "current price". Consequence to accept: a reload re-checks, and a buyer who reloads during a Strapi outage sees snapshot prices with the warning. That is exactly AC 4's contract.

I-b: Question: Should a successful check **write the current prices back** into the persisted cart, so a returning buyer is not re-checking the same list from scratch every time?
Status: **raised 2026-08-01, deferred — build ephemeral (UI I) for now; the user is taking the write-back to the business owner.**
Explanation: Recorded in full so the analysis is not re-derived when it comes back.

*The premise does not hold on cost.* One mount is one batched `fetch` → two Strapi queries, ≤100 records, three fields each, against a 333-product catalog. Repeating it is not expensive. The case for persisting has to rest on something else, and exactly one thing qualifies: **outage resilience** — a check that failed today can fall back on yesterday's checked price instead of March's snapshot. Avoiding the ~200ms `Comprobando precios…` flash is worth little, since Brief 3 designed that moment to be calm and non-blocking.

*Three shapes were costed:*

| | Shape | Verdict |
|---|---|---|
| **A** | Ephemeral React state | **Chosen.** No store change; results self-heal every load. |
| **B** | A separate `tehesa-cart-check` localStorage blob, prices only, **no TTL** — used for first paint and the outage fallback, never to decide whether to ask Strapi | The honest middle. ~30 lines, no `CART_SCHEMA_VERSION` bump, corrupt blob → discard and recheck. |
| **C** | New persisted fields on the cart line + a `lastCheckedAt` that gates the request | Rejected. See the four hazards below. |

*What sank C, in order of sharpness:*

1. **The badge eats itself.** `changed` is derived as `current !== line.unitPrice`. Overwrite `unitPrice` with the current price and the comparison self-erases — the strikethrough vanishes the instant it is written, or never paints at all. Any write-back design must capture `previousPrice` explicitly at comparison time rather than re-reading the line. This is the single constraint to carry forward if the business owner says yes; it presents as a rendering bug days later, not as a design flaw on the day.
2. **A persisted `gone` verdict is a stored false claim.** Draft & Publish is on (Strapi Contract XI). An editor unpublishes a variant for ten minutes, the check lands inside that window, and under a TTL the line reads `ya no está disponible` and drops out of the subtotal for hours after the variant returns. **Any write-back must be prices-only** — never gone-ness, which stays ephemeral and self-heals.
3. **The schema bump wipes carts.** `migrate: () => defaultCartState` (`cart.store.ts`) drops everything on version mismatch, by design. Bumping `CART_SCHEMA_VERSION` for new fields deletes every buyer's in-flight cart on deploy unless a real `migrate` is written. Note the corollary: **overwriting the existing `unitPrice` needs no bump at all**, only a new store action — so the write-back is cheaper than it first looks, and hazard 1 becomes the real gate rather than this one. Separately, a tampered `checkedAt: 9e99` under a TTL means the check never runs again for that user — a permanent-stale bug reachable from devtools, and `isValidCartLine` would have to cover it.
4. **A TTL cannot pay off, because the request is batched.** Freshness is per line (a line added after the check is unchecked while the rest are checked), but a partial refresh costs the same single round trip as a full one. The TTL only saves a request when *every* line is already fresh — the fast reload where nothing changed anyway.

Also unresolved under any persisting design: `Reintentar` gains a second fallback layer (cache or snapshot?), and two tabs both write the cache with last-writer-wins.

*Rule that survives whatever is decided:* **a cache may never be an authority.** Persist to paint faster and degrade better; never let a stored value decide whether to ask Strapi.

II: Question: Should a line that failed to revalidate look different from one that was never checked?
Status: **answered by the user, 2026-08-01 — yes, distinguish them**, against the original recommendation.
Answer: Three affixes in the diameter-subtitle slot, not two:

| Line state | Subtitle |
|---|---|
| Never checked (transient, pre-resolve) | `9/16" · precio guardado` |
| **Check failed** | **`9/16" · precio sin confirmar`** |
| Checked | `9/16" · precio comprobado` |

The commitment sentence the user asked for lives in the **page-level banner**, not on each line, because the check fails globally — every priced line enters this state at once, and repeating a two-sentence explanation down twenty rows both walls the page and contradicts the comps' own "check states are global" rule. Banner copy becomes:

- `No pudimos comprobar los precios.` (unchanged, comp-fixed)
- `Mostramos los precios guardados. Te los confirmaremos al responder tu solicitud; puedes continuar.` (**diverges from the comp**, which reads `Mostramos los precios guardados; puedes continuar con tu solicitud.`)

Explanation: **Verb discipline is the load-bearing part of this copy.** The comps already spend *comprobar* on the automated check (`Comprobando precios…`, `No pudimos comprobar los precios.`), so *confirmar* is free to carry the human promise from Tehesa. That makes `sin confirmar` read as "a person will confirm this" rather than "the system failed", and it deliberately echoes AC 7's `Te confirmaremos el precio al responder tu solicitud.` — the two non-quotable states then speak with one voice instead of inventing separate vocabularies for the same commitment. Do not swap the verbs; `precio sin comprobar` would name the system's failure to the buyer, which is the banner's job, not the line's.

Implementation cost is near zero: `pageStatus` is already page-level and already reaches the rows, so the affix is a ternary on existing state — no new result kind, no change to the checks map. Rejected alternative, recorded so it is not re-proposed: putting `No pudimos comprobar este precio. Te lo confirmaremos al responder tu solicitud.` on every line. The string is correct; the placement is not.

III: Question: Is `Buscar alternativa` a link or a button?
Status: answered — **a `next/link` anchor** to `/?mode=name&q=<encoded product name>` (user decision, 2026-08-01). **The allowlist check it flagged has now been run and it failed — see III-b.**
Explanation: It is navigation, so it is an anchor — which also gives middle-click and open-in-new-tab, and matches the repo's "anchor-or-disabled-span, never `href="#"`" rule (`Home.tsx:356-372`).

III-b: Question: Do real product names survive `SEARCH_TERM_PATTERN`, so that `Buscar alternativa` actually lands on a search?
Status: **answered 2026-08-01 — no. 10.2% of product names fail, and the failure mode is silent.**
Answer: **34 of 333 product names (10.2%)** contain a character outside `SEARCH_TERM_PATTERN` (`catalog.constants.ts:39`, `/^[\p{L}\p{N}\s\-_.,&()]+$/u`). The offending characters in live data are `"` (inches), `/` (fractions), `°` (drill/thread angles), and — in a couple of records that look like data-entry damage — `*` and `\`. Real examples: `1/2" Punta Bristol Cromado`, `Broca AAV 135° Split Point`, `Dado Cuadro 1" Llanta Trasera Capuchon`.

Separately, **3,194 of 5,671 variant `diameter` values (56.3%)** fail the same pattern, via `"` `/` `°` `#` `+` `;` — e.g. `1/2 " / 60° / 3F`, `#10`, `#1 a #60`. This is **harmless today** because `diameter` is only ever rendered as text and never enters a URL. It is recorded as a tripwire: the moment anyone makes a diameter clickable or searchable, more than half the catalog breaks.
Context: Backend-research subagent, 2026-08-01, live Strapi data across all 333 products and 5,671 variant diameters.
Explanation: **The failure is not an error page, which is worse.** Traced end to end: `Home.tsx:239` builds the URL → `getCatalogSelection` (`utils.pagination.ts:180`) → `parseCatalogParams` → `tryParseModeValue` (`:50-63`) returns `null` on a pattern miss → **`redirectToBase()`**. The buyer is silently redirected to the unfiltered page-1 catalog with no message. On a `Buscar alternativa` row that means the buyer is told their product is gone, clicks the one action offered, and lands on the plain catalog — a dead end wearing a different hat, which is precisely the dead end this story added the full products batch to eliminate.

**This is a pre-existing bug in shipped wide search, not something this story introduces.** Typing `1/2"` into the catalog search box today already redirects to base silently, and in a fastener catalog inch marks and fractions are the most natural query a buyer can type. Story 3 only walks into it. Recorded as a scope decision for planning rather than an assumption:

- **Root fix (recommended):** widen `SEARCH_TERM_PATTERN` to admit `"`, `/`, `°`, and `#`. Injection is not the exposure — the term reaches Strapi as an Apollo **variable** feeding a `containsi` filter, never string-interpolated into a query — so this is input hygiene, not a trust boundary being loosened. Note `_` is *already* allowlisted and is a SQL `LIKE` wildcard under `containsi`, so wildcard reachability is pre-existing and evidently accepted. Cost: one constant, plus the existing `_utils.ts` and `utils.pagination.ts` tests that assert the current pattern. Fixes live search and `Buscar alternativa` together.
- **Defensive strip (do regardless, ~1 line):** before encoding, split the name on runs of disallowed characters and take the **longest** surviving segment. `1/2" Punta Bristol Cromado` → `Punta Bristol Cromado`; `Broca AAV 135° Split Point` → `Broca AAV 135`. Both search well under `containsi`, where a naive "replace disallowed with space" would not (`1 2 Punta Bristol` matches nothing). This also absorbs the `*`/`\` data defects and any future bad data the widened pattern still misses.

Doing only the strip leaves the live search bug in place. Doing only the widening leaves `*` and `\` broken.

**Decided by the user, 2026-08-01: do both, inside Story 3** — widen `SEARCH_TERM_PATTERN` to admit `"`, `/`, `°`, `#`, and add the defensive strip. The root fix ships with the story rather than trailing it. See AC 8.

Blast radius, measured rather than estimated — the pattern is read in exactly three places (`_utils.ts:206`, `_utils.ts:280`, `utils.pagination.ts:59`) and asserted in one test:

- `__tests__/catalog/_utils.test.ts:362-368` — **this test breaks.** It asserts `MSG_CAT_VAL_006_PATTERN` using `?q=tehesa%2F`, i.e. a forward slash, as its example of an unsafe character. Widening the pattern makes that input legal. **Re-point it at a character that is still rejected** (`<`, `>`, `%`, or a backtick); do not delete it — it is the only assertion in the suite that the allowlist rejects anything at all, and deleting it would quietly convert the allowlist into decoration.
- `__tests__/catalog/search/route.test.ts` asserts only the *empty* term case (`:63`), so it is unaffected.
- `__tests__/catalog/pagination-urls.test.ts` and the three `__tests__/seo/*` files touch `mode=name` but assert no pattern case; expect them to pass untouched, and treat any failure there as a real regression rather than an expected update.

IV: Question: What should a variant that still exists but has an empty `pricing` component render as?
Status: **answered by the user, 2026-08-01 — option (c), a distinct line state. See AC 7.**
Answer: A fifth line state, excluded from the subtotal and left in the list. Copy: `Esta medida no tiene precio actual.` / `Te confirmaremos el precio al responder tu solicitud. Si no está disponible, buscaremos una alternativa.` / `Esta línea no se incluye en el subtotal.` Layout reuses the gone row (de-emphasised, no price block, no tint), with two deliberate departures: it **keeps its quantity stepper**, and it offers **only `Quitar`** — no `Elegir otra medida`, no `Buscar alternativa`.
Explanation: The recommendation had been (a), keep the snapshot. The user chose the more honest and slightly costlier state, and the reason resolves what looked like a design gap: this line is not the buyer's problem to fix. Tehesa quotes it by hand and finds the alternative if there is none — so the row states that commitment rather than handing the buyer a recovery action, and it keeps the stepper because the buyer's quantity is exactly what the seller needs in order to quote. The copy is not comp-fixed (Brief 3 predates the decision); planning may tighten the wording, but not the semantics. Consequence for Story 4: the line travels in the WhatsApp message with a quantity and no price — the same shape a variant-less line already has, so no new handling is implied.

V: Question: Is it acceptable that unpublishing a variant in Strapi shows every buyer holding that line `La medida ya no está disponible.`?
Status: **answered by the user, 2026-08-01 — acceptable, no mitigation.**
Answer: Agreed behaviour. Nothing to build, no process note recorded.
Explanation: Strapi Contract XI confirms Draft & Publish is on and default queries return published entries only, so an unpublished record is absent and reads as deleted. Adding `status: DRAFT` would be strictly worse — it would quote buyers prices from unpublished drafts. Recorded so a future reader does not mistake this for an oversight: the collapse of "unpublished" into "deleted" is known and accepted, and it is invisible in the logs as well as the UI. It is also the reason UI I-b's hazard 2 stands — this is precisely the state that must never be persisted.

VI: Question: Does a gone line get auto-removed?
Status: answered — **no.**
Explanation: The comps keep it, with `Quitar` available. Removing a line the buyer chose, without asking, on a page they opened to review, is the same class of mistake as clearing the cart silently. The epic's rule 2 ("never claim something we cannot substantiate") has a sibling here: never edit the buyer's list for them.

### Verification

I: Question: How is a deleted variant tested without deleting one in Strapi?
Status: answered
Explanation: At the unit level the mechanism is "requested id absent from the response", so the route adapter mock simply returns fewer records than were asked for — no Strapi involvement. What that **cannot** prove is that live Strapi omits rather than errors (Strapi Contract XII) or that it does not silently cap (IX). Those two are manual, and they are the only two that can turn this feature into a mass false "no longer available".

II: Question: Does the existing `QuotePage.test.tsx` harness cover a component that now fetches on mount?
Status: **answered 2026-08-01 — no, and the gap is confirmed by inspection.**
Answer: `QuotePage.test.tsx` **does** have a `mockFetch` helper and a `globalThis.fetch` save/restore pair, but they are declared **inside the `describe("QuotePage variant upgrade")` block** — `originalFetch` at `QuotePage.test.tsx:240`, `mockFetch` at `:252`, the restoring `afterEach` at `:263`. Every earlier `describe` in the file renders `QuotePage` with **no** `fetch` mock at all.
Context: Read directly, 2026-08-01.
Explanation: So the fix is not "add a mock", it is "hoist the existing one to file scope" — cheaper than it looked, and the helper to reuse already exists rather than needing to be written. Do it as part of this story. An unmocked `fetch` in jsdom does not fail loudly: it produces an unhandled rejection *after* the assertion has already passed, so the suite goes green while the console fills up.

## Assumptions Made

- Stories 1 and 2 are shipped and stable; this story does not revisit their decisions.
- Spike 4S has not changed the WhatsApp mechanism, so "the price Story 4 sends" is still "the price this page shows". If the spike moves Story 4 to the Cloud API, this story is unaffected — it produces prices, not messages.
- The Strapi contract was re-verified live on 2026-08-01 for this story, so it is not assumed. The *live data* behind it — how many variants carry an empty `pricing`, how often editors unpublish — remains unmeasured, but UI IV and UI V were both decided without needing that count, so nothing now depends on it. It would only change how often the AC 7 row is seen, not whether it is right.
- `CART_MAX_LINES = 100` remains the cart ceiling, so `REVALIDATE_MAX_IDS` can be pinned to it rather than invented separately.
- Manual QA against live Strapi is the user's workflow (no dev server is started by agents).

## Non-Obvious Findings

- **The comps' own annotation collapses the state model.** *"Los estados de comprobación son globales y no bloquean cantidades"* means checking and failure are page-level. Read as seven per-line states, this story is roughly twice the size it actually is.
- **Absence is the deletion signal, so the request list must be retained.** The response cannot report what is missing; only the difference between what was asked and what came back can.
- **Strapi's GraphQL default page size is 10, and there is no hard cap** (verified 2026-08-01). The REST `maxLimit: 100` in `config/api.ts` does not apply to GraphQL, and `config/plugins.ts` sets nothing. So the danger was never a ceiling — it is the floor. Combined with the previous finding, a forgotten `pagination` argument produces a confident, silent, wrong "these 40 items were deleted". `fetchProductVariants` is safe only because it happens to pass `pageSize: 100` (`global.lib.ts:167-172`).
- **`pricing` is nullable but `pricing.price` is not.** A variant either has a price or has no `pricing` component at all — there is no null price. Two existing call sites dereference it unguarded (`ProductVariantsDrawer.tsx:77`, `ProductCard.tsx:79`), which is a pre-existing single-record exposure this story would multiply by 100.
- **A write-back would erase the very badge it exists to support.** `changed` is derived as `current !== line.unitPrice`. Persist the current price into `unitPrice` and the comparison self-erases — the strikethrough vanishes as it is written, or never paints. The fix is to capture `previousPrice` at comparison time, but the failure presents as a rendering bug days later, not as a design flaw on the day. Recorded because the write-back is deferred, not dead (UI I-b).
- **Overwriting `unitPrice` needs no schema bump — which makes it more tempting than it should be.** It is an existing field, so no `CART_SCHEMA_VERSION` change, no `migrate`, no new rehydrate validation. The gate on a write-back is the badge derivation above and the rule that gone-ness must never persist, not the cost of the store change.
- **`QuotePage.test.tsx` already has a `fetch` mock — scoped to one `describe`.** `mockFetch` at `:252` lives inside `describe("QuotePage variant upgrade")`, so every earlier block renders `QuotePage` unmocked. The task is to hoist it, not to write it.
- **Unpublishing a variant in the Strapi admin is, to this feature, a deletion.** Draft & Publish is enabled and default queries return published entries only. There is no way to tell the two apart from the frontend, and no way to tell them apart in a log either.
- **`documentId` is an `IDFilterInput`, not a `StringFilterInput`** as the epic's Strapi Contract II records. Harmless until someone types a GraphQL variable `[String!]` and gets a variable-type error that reads as a filter problem.
- **The epic's AC 1 leaves a dead end** for a variant line whose product was deleted: `Elegir otra medida` opens a drawer for a product that no longer exists. Sending every product id, not just the variant-less ones, closes it for free.
- **Nothing about this story touches the cart store.** Every instinct says "revalidation updates the cart" — and every one of those instincts buys a schema version bump, a migration, and a second persisted price that can disagree with the first.
- **`Elegir otra medida` needs no new code path.** Story 2 built single-select upgrade mode and `upgradeLine`'s collision-merge for the variant-*less* case; the variant-gone case is the same operation on a line that happened to already have a variant.
- **Adding a fetch to `QuotePage` retroactively affects every existing test of it.** jsdom's unmocked `fetch` fails after the assertions pass, so the suite goes green and the console fills with unhandled rejections.
- **Wide search is already broken for 10% of the catalog, and it fails silently.** `SEARCH_TERM_PATTERN` (`catalog.constants.ts:39`) omits `"`, `/`, and `°` — the three characters a fastener catalog cannot avoid. 34 of 333 product names contain one (measured live, 2026-08-01). A pattern miss does not error: `tryParseModeValue` returns `null` and `getCatalogSelection` calls `redirectToBase()`, so a buyer who types `1/2"` is silently dropped on the unfiltered catalog. Pre-existing, shipped, and unrelated to the cart — Story 3's `Buscar alternativa` merely inherits it (III-b).
- **Over half of all `diameter` values fail the same pattern** (3,194 of 5,671, via `"` `/` `°` `#` `+` `;`). Inert today because `diameter` is only ever text, but it makes "let the buyer search by size" a much bigger job than it looks.

## Research Outcome

Story 3 is smaller than the epic's original framing and **all but one state is designed already** — Brief 3's comps cover four of the five, so no brief needs re-running. The fifth (AC 7, no current price) was decided after Brief 3 and reuses the gone-row layout; it needs no comp.

Decisions taken with the user on 2026-08-01: ephemeral results, one combined route, `Buscar alternativa` → wide search, full research depth, a distinct line state for a priceless variant (UI IV), unpublish-reads-as-deleted accepted without mitigation (UI V), and a **price write-back deferred to the business owner** (UI I-b) — build ephemeral now.

Implementation is three phases: query + adapters + route; page hook and totals; line states and actions. No new dependency, no store change, no backend change, and no change to the persisted schema.

**The Strapi contract is fully verified** (backend-research subagent, 2026-08-01, live introspection plus the backend repo). The batched filter works, missing ids are silently omitted rather than erroring, and there is no cap to work around. But the verification turned up the story's sharpest hazard in an unexpected place: **the GraphQL default page size is 10.** Omitting `pagination` does not fail — it returns the first ten records, and every line after them renders `ya no está disponible` and drops out of the subtotal. Silent, confident, and wrong, on every cart above ten lines. Both new operations must carry an explicit limit, and that is the first thing to check in review.

**Every open question is now answered.** UI II, UI IV, and UI V were resolved by the user, and Verification II was resolved by inspection (the `fetch` mock exists but is `describe`-scoped, so it needs hoisting rather than writing).

Two copy divergences from Brief 3 are now in force and are the easiest thing for an implementer to miss, because the comps are otherwise authoritative: the **check-failed banner's second line** and the **per-line affix** (`precio sin confirmar`, a third value where the comps have two). Build UI II's table, not the comp row.

One decision is parked outside the story: **UI I-b, the price write-back**, which the user is taking to the business owner. Story 3 ships ephemeral either way; if the answer comes back yes, it is an additive change to a story that will already be built, and UI I-b records the two constraints it must respect (capture `previousPrice` at comparison time, never persist gone-ness).

**The research also turned up a bug the story did not go looking for.** The allowlist check UI III had deferred was finally run, and it failed: 10.2% of product names cannot survive `SEARCH_TERM_PATTERN`, because it omits `"`, `/`, and `°` — the three characters a fastener catalog cannot avoid. The failure is not an error page but a **silent redirect to the base catalog**, and it is live today in the shipped search box, independent of the cart. Story 3 would merely have inherited it on the one row where a dead end hurts most. **Decided 2026-08-01: fix the root cause inside this story** (AC 8) — widen the pattern, add a defensive strip, and re-point the one existing test that uses `/` as its example of an unsafe character.

That decision is the only place this story reaches outside the cart, so it carries the only real regression risk in it. Everything else is additive.

Awaiting human sign-off.
