# Research: Cart State, Persistence, And Add-To-Cart Wiring

**Date:** 2026-07-30
**Epic:** `ai-research/epics/cart-quote-whatsapp.epic.md` (Story 1)
**Status:** Awaiting human sign-off. No source files were modified during this research.

## Story Definition

### Story Title

Cart state, persistence, and add-to-cart wiring.

### Story Description

Give the app a cart: a Zustand store that persists to `localStorage`, mounted where every route can reach it, plus the wiring that makes the two existing `Agregar al carrito` buttons actually do something and a header badge that proves it worked.

This story ships **no new route**. `/cotizar` is Story 2. The badge links to it, so either the badge link lands inert until Story 2, or the two stories ship together — a planning call, noted below.

### Acceptance Criteria

1. A Zustand cart store follows the existing provider-wraps-store pattern (`src/zustand/store/` + `src/zustand/provider/`), is mounted in `src/app/providers.tsx`, and persists to `localStorage` through `zustand/persist` with an explicit `version` and `migrate`.
2. Rehydrated state is validated line by line before it reaches any consumer. A truncated blob, a valid-JSON-wrong-shape blob, a negative or non-integer quantity, and a non-finite price each result in that line being dropped and the rest of the cart surviving. Nothing throws.
3. The variants drawer CTA adds one line per selected variant, carrying the variant's `documentId`, `internalId`, `diameter`, unit price, and quantity — all from state already in hand, with no additional Strapi request.
4. The product card CTA (`Agregar y elegir después`, tertiary) adds a single product-level line with no variant, marked so it can be rendered and messaged as `Sin variante seleccionada` and excluded from any price total.
5. Single-variant products (`variantCount === 1`) render a different card with **one primary CTA, `Agregar 1 pieza`**, which fetches the product's only variant through the existing `/api/catalog/variants` route and adds a complete, priced line at quantity 1. Pending holds the label unchanged and shows a spinner; failure returns the button to default and surfaces `No se pudo agregar. Intenta de nuevo.` in a `role="alert"` beneath it, recoverable in place. The branch is on `variantCount === 1` exactly — `variantCount` of null or `0` (three known records, `docs/improvement.md`) is *not* this case and keeps the standard card.
5b. A single-variant card shows one `PRECIO` value rather than the `DESDE` / `HASTA` pair, since `minPrice === maxPrice` for these products. Small change to the card's price block, introduced by the Brief 1 comps.
6. Adding a variant already in the cart increments that line's quantity rather than appending a duplicate, keyed by the variant's `documentId`.
7. A header cart badge shows the number of lines, always visible including at `0`, positioned bottom-right of the cart control, rendering only after mount so it never mismatches the server render, and reachable and announced by a screen reader.
8. The persisted state has two independently clearable slices, cart lines and buyer contact details, both validated on rehydrate. The contact form itself lands in Story 4; only the store shape belongs here.

### Task Breakdown

1. Add `documentId` to the variant selection in `GET_PRODUCT_VARIANTS`; add it to `ProductVariant` and `ProductVariantUI`.
2. Define `CartLine` (a two-case union) and the store's state/actions in `src/shared/types/global.types.ts`.
3. Add cart constants: storage key, schema version, quantity bounds, line cap.
4. Build the vanilla store with `persist`, `version`, `migrate`, and a rehydrate-time validator.
5. Build the provider following `change-theme.provider.tsx`, and mount it in `src/app/providers.tsx`.
6. Re-key the drawer's `selectedVariantIndexes` / `quantities` from array index to variant `documentId`; resolve the empty-string quantity case; wire the footer CTA.
7. Wire `ProductCard`'s secondary CTA to add a variant-less line.
8. Decide `Header` placement, add the badge with a mounted guard and an accessible name.
9. Tests: store actions, dedup/increment, rehydration of hostile payloads, drawer add, card add, badge count.

### Scope Assessment

Single story, 3 implementation phases (store + persistence, drawer/card wiring, header badge). Roughly two new files under `src/zustand/`, one new feature folder, edits to four existing files, one query field, and one type file. **No new dependency** — `zustand/persist` ships inside the installed `zustand@^5.0.8`.

### Dependencies

- **Blocks:** Stories 2, 3, and 4 of the epic. Nothing can be reviewed or quoted until something can be added.
- **Blocked by:** nothing. Every Strapi contract question this story depends on was answered on 2026-07-30.
- **Coupling to Story 2:** the badge's destination. Options in Open Questions (UI III).

## Delivered Comps (2026-07-31)

Brief 1 is complete. The card footers are designed; build against these rather than re-deriving from the prose below.

| File | Covers |
|---|---|
| `comps/desktop-light-brief-1-cart-state.png` | Three card footers at 1440px, light, plus the single-variant default / pending / failure row |
| `comps/desktop-dark-brief-1-cart-state.png` | Same, dark |
| `comps/mobile-1-brief-1-cart-state.png` | Multi-variant footer and the three action states at 390px, light and dark |
| `comps/mobile-2-brief-1-cart-state.png` | All three card cases stacked at 390px, light and dark |

What the comps settle:

- **Multi-variant footer** — `Explorar las N variantes` as a full-width filled primary; `Agregar y elegir después` as a bare centred text action beneath it, no capsule, no border.
- **Single-variant footer** — one full-width `Agregar 1 pieza`, no second action.
- **Broken-data footer** — visually identical to multi-variant, as specified.
- **The three action states** — default; pending (spinner plus the label held **exactly** the same, not swapped for "Agregando…"); failure (button returns to default, with `No se pudo agregar. Intenta de nuevo.` in red beneath it). Failure is recoverable in place — no toast, no state loss.
- **Colour semantics are theme-independent**: green for the recommended action, neutral text for the deliberate exit, red only for failure.

Two things the comps introduce that were not in the brief, both worth keeping:

- **A single-variant card shows one `PRECIO` label** instead of the `DESDE` / `HASTA` pair. Correct — `minPrice === maxPrice` for these products, so the range presentation is noise. This is a small change to the card's price block, which Brief 1 had put out of scope; fold it into this story rather than deferring it.
- **The mobile layout stacks the tertiary action below the primary with real vertical separation**, rather than side by side. That is what makes the hierarchy survive a 390px width.

Three things to verify during implementation, none of which a comp can show:

1. **Tap target on the bare tertiary action.** It has no capsule, so its hit area is not visually bounded. It needs a minimum ~44px touch height regardless of the text's own line height.
2. **Focus ring on the tertiary action.** A bare text button loses its focus indicator more easily than a filled one. It must be a real `<button>` with a visible focus style, not a styled `<span>`.
3. **The pending and failure states must be announced**, not only shown. The failure message needs `role="alert"`; the pending state must not leave a focused button that silently does nothing.

## Design Agent Handoff

### User Goal And Affected Surface

A buyer scanning the catalog wants confidence that the thing they just tapped went somewhere. Right now both `Agregar al carrito` buttons are inert — the drawer one silently closes, the card one does nothing at all — so the current experience actively teaches the buyer that the feature is broken.

Surfaces: `src/components/ProductCard.tsx` (footer, two CTAs), `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` (footer CTA), `src/shared/ui/organisms/Header.tsx` (new badge).

### Required States

**Header cart badge**

- **Zero / not yet mounted.** The badge is client-state-backed, so it cannot render its count during SSR. **Decided 2026-07-31: the badge is always visible, showing `0`, positioned bottom-right of the cart control.** Because it never appears or disappears, layout shift is a non-issue — reserve the space once and let the mounted guard swap `0` for the real count in place.
- **With count.** A number. Needs a text equivalent — "3" in a circle is not self-describing to a screen reader.
- `0` must read as *empty*, not as a notification. A filled accent pill at zero looks like an alert.

**Add confirmation (drawer)**

- **Success.** Names what happened: "3 variantes agregadas al carrito". Must be in a live region (`role="status"`), not a purely visual flash.
- **Increment of an existing line.** The quantity went up rather than a new line appearing. If the copy does not say so, a buyer who adds the same size twice will assume the second add was dropped.
- **Decided 2026-07-31: the drawer still closes on add** (`handleClose` at `ProductVariantsDrawer.tsx:230`). So the confirmation must live outside it — anything rendered inside is destroyed at the moment it would be read — and focus must be returned deliberately to the card's trigger button, never left on `<body>`.

**Add confirmation (card)**

- The card has no drawer to host a message. This is the surface with no existing feedback pattern at all, and it needs one.

**Recommended shape for both: one shared toast** with `role="status"`, plus the badge count as the persistent signal. It is the only pattern that serves a closing drawer and a host-less card with a single component. Copy names what happened — `3 variantes agregadas`, `Producto agregado, elige la medida después`, `1 pieza agregada`, `Cantidad actualizada`. Check the HeroUI MCP for a v3 toast before writing one; a minimal own component is the fallback, not the first choice.

**Product card, two CTAs**

Today the footer holds `Agregar al carrito` (secondary) and `Explorar las N variantes` (primary), side by side and near-equal in weight. Once both work they do genuinely different things: one opens variant selection, one commits a line the seller will have to follow up on because no size was chosen. The current labels do not communicate that difference, and a buyer choosing the left button by accident produces a worse quote. This is the main visual problem in the story.

**Variants drawer footer**

The existing selection count, piece count, and running total (`ProductVariantsDrawer.tsx:220-229`) stay as-is. Only the CTA's behaviour changes.

### Mobile And Desktop Expectations

Mobile-first. The grid is one column by default, three at `lg` (`ProductListing.tsx:60`); the drawer is right-placed and `w-full` at every breakpoint. The header is a simple flex row with a logo and the theme toggle (`Header.tsx:24-33`) — a badge is the third item and has room at every width.

`src/shared/hooks/useMediaQuery.tsx` does not update on resize; use CSS breakpoints for anything responsive.

### Accessibility Requirements

- Add confirmations announced via `role="status"`; failures via `role="alert"`. Both patterns already exist in the drawer (`ProductVariantsDrawer.tsx:144-145`).
- The badge needs an accessible name conveying the count, not just a visual number.
- Per-variant quantity inputs keep their existing `aria-label`s naming the diameter.
- If the drawer closes on add, focus must land somewhere sensible — not on `<body>`.

### Visual Patterns To Preserve

`DESIGN.md` (validate with `pnpm design:lint`): HeroUI v3 components and built-in `Button` variants, Tailwind v4 utilities, the emerald accent on selected variant rows, `border-default-200` dividers, Geist Sans (explicitly not Geist Mono for prices or SKUs), class-based dark mode. No CSS-in-JS, no second component system.

### Content And Technical Constraints

- Spanish throughout.
- Prices via `formatNumberToCurrency` (`$1,234.50 MXN`). Never a second formatter.
- Do not display `internalId` in this story. It is optional in Strapi and has been deliberately non-user-facing; whether it surfaces at all is an epic-level open question.
- Do not invent stock, availability, delivery, or tax. `stock` exists on `product_variant` in Strapi but no query selects it and its population is unverified.
- No product images exist. Do not reserve image space in any cart affordance.

### Explicitly Out Of Scope

The `/cotizar` route, the line list, the subtotal, quantity editing outside the drawer, line removal, revalidation, the contact form, the WhatsApp message, and any analytics code.

### Unanswered Design Questions

1. ~~How is the "added" confirmation presented?~~ **Answered 2026-07-31: one shared toast** with `role="status"`, serving both trigger sites. The only open part is whether HeroUI v3 supplies one or we write a minimal component — check the HeroUI MCP before building.
2. ~~Does the badge show at zero?~~ **Answered 2026-07-31: yes, showing `0`, bottom-right of the cart control.**
3. ~~Do the two card CTAs need relabelling or re-weighting?~~ **Answered 2026-07-31.** `Explorar las N variantes` stays primary; the other is demoted to tertiary and labelled **`Agregar y elegir después`**. **Single-variant products get a different card entirely: one button, `Agregar 1 pieza`** — this story must branch the card on `variantCount === 1`, and must not confuse that with the three records whose `variantCount` is null or `0`. That CTA fetches the variant on click (no list query carries variant fields — verified), so it needs pending and failure states. Full reasoning and the rejected copy in epic design question 7.
4. ~~Does the drawer still close on add?~~ **Answered 2026-07-31: yes.** Confirmation lives outside the drawer; focus returns to the card's trigger button.

## Technical Research

### Affected Areas

| Path | Role in this story |
|---|---|
| `src/shared/queries/global.queries.ts:22-34` | `GET_PRODUCT_VARIANTS` gains `documentId` on the variant selection |
| `src/shared/types/global.types.ts:63-76` | `documentId` on `ProductVariant`/`ProductVariantUI`; new `CartLine` union and store types |
| `src/shared/constants/` | New cart constants file: storage key, schema version, quantity bounds, line cap, error codes |
| `src/zustand/store/cart.store.ts` (new) | Vanilla store + `persist` + `migrate` + rehydrate validation |
| `src/zustand/provider/cart.provider.tsx` (new) | Provider + `useCartStore`, mirroring `change-theme.provider.tsx` |
| `src/app/providers.tsx` | Currently pass-through; the mount point |
| `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx:30-116, 230-239` | Re-key selection state, resolve the `""` quantity, wire the CTA |
| `src/components/ProductCard.tsx:62-68` | Uncomment and wire the secondary CTA |
| `src/shared/ui/organisms/Header.tsx` | Badge + mounted guard (the pattern is already at lines 15-21) |
| `src/app/layout.tsx` / `src/features/Home/CatalogPageLayout.tsx` | Header placement decision |
| `__tests__/cart/` (new) | Store, persistence, drawer add, card add, badge |

### Why `src/app/providers.tsx` Is The Right Mount Point

It is a client component that returns children unchanged, it is already wrapped around everything in the root layout, and `__tests__/test-utils.tsx` already wraps every rendered component in it. Mounting the cart provider there means:

- Every route gets the cart, including `/cotizar` in Story 2, with no layout duplication.
- Every existing test picks up the provider for free — no test file has to be touched to add a provider wrapper.

Note the contrast with `ChangeThemeStoreProvider`, which is mounted inside `src/app/page.tsx:57` rather than in `providers.tsx`. That works because the theme store is only consumed on `/`. The cart is not — do not copy that placement.

### Persistence Implementation Shape

`zustand/persist` is a submodule of the installed `zustand@^5.0.8`. No install, no lockfile change.

The three things that are not optional:

1. **`version` + `migrate`.** A cart written by an older build must not reach a newer build's code paths. Drop-on-version-mismatch is a fine `migrate` for v1 — losing an old cart on a deploy is acceptable; crashing on one is not.
2. **Validation on rehydrate, per line.** `localStorage` is user-writable, and its contents flow into a money total and an outbound message. Validate:
   - product `documentId` and variant `documentId` against the existing `DOCUMENT_ID_PATTERN` and `DOCUMENT_ID_MAX_LENGTH` (`catalog.constants.ts:36-37`) — reuse, do not re-derive.
   - `quantity` is an integer, `>= 1`, and `<=` a stated maximum.
   - `unitPrice` is a finite number `>= 0`. `NaN` and `Infinity` both survive `JSON.parse` round-trips as `null`, and `null * 3` is `0` — a silent zero in a quote.
   - strings are capped in length.
   - the total line count is capped.
   Invalid lines are **dropped, not repaired**. Repairing invents data; dropping is visible.
3. **SSR safety.** `localStorage` does not exist on the server, and this module can be pulled into the server graph. `persist` handles this if configured correctly, but the badge still needs the mounted guard — the store being safe does not make the first client render match the server's.

Rejected alternative, recorded so it is not relitigated: a cookie. Full comparison in the epic's Decision 2. Short version — it rides on every request, it has a hard 4 KB ceiling a real quote can hit, and it could not stay `httpOnly` because the client writes it on every add.

### The Line Identity Key

**The variant's `documentId`, not `internalId`.**

Backend research confirmed on 2026-07-30 that `internalId` on `product_variant` is a plain string with **no `required` and no `unique` constraint** (`store-tehesa-api/src/api/product-variant/content-types/product-variant/schema.json`). Keying on it would mean:

- Two variants with a blank `internalId` collapse into one cart line.
- Two variants sharing an `internalId` match the wrong record on Story 3's revalidation.

`productVariant.documentId` is `ID!` in the schema — always present, always unique. It is not selected by `GET_PRODUCT_VARIANTS` today; adding it is a one-line query change plus one type field.

This supersedes `docs/improvement.md:83-84`, which assumed `internalId` alone identified a cart line. `internalId` stays on the line — the seller needs it in the WhatsApp message — but as display text with a missing-value fallback, never as a key.

Composite key for a line: `${productDocumentId}:${variantDocumentId ?? "no-variant"}`. That makes the variant-less card line naturally distinct from any variant line on the same product, and makes a second variant-less add on the same product an increment.

### Drawer Changes

Three things, all in `ProductVariantsDrawer.tsx`:

1. **Re-key selection state.** `selectedVariantIndexes: Set<number>` and `quantities: Record<number, number | "">` are keyed by array index (lines 31-34). Index is only stable for as long as the fetched array is — and the array is re-fetched and re-sorted on every open (line 67). `docs/improvement.md:82` deferred this re-key to the cart story; this is that story. Key by variant `documentId`.
2. **Resolve the empty-quantity case.** The input can hold `""` (line 204), and `selectedTotal` coerces it with `|| 1` (line 108). That coercion is fine for a preview number; it is not fine for a committed cart line. The add handler must decide explicitly — reject the add with a message naming the field, or normalise to 1 — rather than inheriting a `||`.
3. **Wire the CTA.** It currently calls `handleClose` (line 233). Everything a line needs is already in state: `internalId`, `diameter`, `price`, quantity, plus the new `documentId`, and `product.name` / `product.documentId` from props. **No fetch.**

A fourth, subtler point: `selectedTotal` sums with float arithmetic. If the cart accumulates in integer cents (which the epic requires, since the subtotal is shown to a buyer and sent to a seller) and the drawer does not, the two numbers can disagree on the same screen. Either normalise both in this story or accept the divergence knowingly.

### Card Change

`ProductCard.tsx:62-68` — the secondary button's `onPress` is commented out. Wiring it adds a product-level line with no variant.

What the card actually has available: `product.name`, `product.documentId`, `product.category`, `product.brand`, `product.minPrice`, `product.maxPrice`, `product.variantCount`, `product.hasOneProductVariant`. What it does **not** have: any variant, and therefore any `internalId`, `diameter`, or unit price.

Do not use `minPrice` as the line price. Those are denormalized, unmaintained Strapi columns with no lifecycle sync, and three catalog products currently carry `null` or `0` (`docs/improvement.md:20-43`). A variant-less line has no price by definition — that is the point of the decision.

Quantity for a card add: default 1. The card has no quantity control and should not grow one in this story.

### Header Placement

`Header` is rendered by `CatalogPageLayout` (`src/features/Home/CatalogPageLayout.tsx:14`), which only `src/app/page.tsx:64` uses. A badge there is invisible on `/cotizar`.

Two options:

- **Move `Header` into `src/app/layout.tsx`.** It is a server component, so it can `await getThemePreference()` for the `themeFetched` prop the same way `page.tsx` does. One header, every route, no duplication. Recommended.
- **Give `/cotizar` its own layout that also renders `Header`.** Two call sites to keep in sync.

Either way this is a small structural decision that has to be made **before** the badge is built, not after.

### Existing Patterns To Follow

- **Provider-wraps-store with a `useRef`,** never a module-level store — `change-theme.provider.tsx:19-22`. A module singleton leaks state across requests in the App Router.
- **Mounted guard for client-only state** — `Header.tsx:15-21`.
- **Reuse `DOCUMENT_ID_PATTERN` / `DOCUMENT_ID_MAX_LENGTH`** from `catalog.constants.ts` rather than writing a second id validator.
- **`docs/IMPLEMENTATION_GUIDELINES.md`:** curly braces on one-line `if` returns; object literals broken across lines; validation messages that name the failing input and the rule it violated, composed at the call site.
- Tests in root `__tests__/`, never co-located. Canonical rules in `docs/UNIT_TESTING_GUIDELINES.md`.

### Verification Rules To Follow Later

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
- `pnpm test` for the suite; `pnpm test -- __tests__/cart/<file>` targeted.
- `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx` and `__tests__/product-listing/ProductCard.test.tsx` — both components change, and the drawer's selection re-key is the kind of change that breaks tests quietly.
- `pnpm design:lint` if `DESIGN.md` tokens change.
- Do not run `pnpm install`. No new dependency.
- Manual QA (dev server, live Strapi) is the user's.

### Edge Cases And Constraints

- **`localStorage` is a trust boundary.** See the persistence section. This is the one place in this story where being lazy is wrong.
- **`localStorage` can throw.** Safari private mode and a full quota both raise on `setItem`. A failed persist must not take down the add — the in-memory cart should still work for the session.
- **Two tabs.** `persist` does not sync across tabs by default; the last write wins and the other tab shows a stale cart. Acceptable for v1; worth a one-line note in the code rather than a `storage` event listener nobody asked for.
- **`ProductVariant.internalId` is `string | undefined`** in the current type and genuinely optional in Strapi. Every consumer needs the missing case.
- **Variant arrays are re-sorted on every drawer open** (`ProductVariantsDrawer.tsx:67`), which is exactly why index keys are wrong.
- **`quantities[index]` can be `""`.** See the drawer section.
- **A cart line cap is needed.** Not for storage — `localStorage` has room — but because the WhatsApp message has a hard encoded-URL budget (~8-12 lines). Better to cap at add time with a clear message than to silently truncate a message in Story 4. The exact number depends on the Story 4 format decision; pick something defensible now and revisit.

## Open Questions

### UI And Product Decisions

I: Question: What happens visually when something is added, given the app has no toast pattern?
Status: pending
Context: The drawer can host an inline `role="status"` message, but it closes on add today. The card has no host surface at all.
Explanation: Options are (a) a HeroUI overlay-based notification if v3 offers one — check the `heroui-react` MCP before inventing anything, (b) an inline message in the drawer plus a badge animation for the card, (c) badge-only with no message. Recommendation is (a) if HeroUI provides it, because two different feedback mechanisms for the same action is the outcome to avoid.

II: Question: Does the drawer still close after adding?
Status: pending
Explanation: Recommendation is yes — the buyer's next action is almost always another product — provided the confirmation survives the close.

III: Question: Where does the badge link, given `/cotizar` does not exist until Story 2?
Status: pending
Explanation: Three options: ship Stories 1 and 2 together; ship the badge as a non-link count in Story 1 and make it a link in Story 2; or ship the link and accept a 404 behind a feature nobody has been told about yet. Recommendation is the second — it keeps the stories independently deliverable, which is the point of the split.

IV: Question: Is there a maximum cart size, and what does hitting it look like?
Status: pending
Context: Driven by the WhatsApp encoded-URL budget (~8-12 lines), not by storage.
Explanation: Recommendation is a cap at add time with a message that names the limit, rather than letting Story 4 truncate a message silently. Needs a number from product.

### Persistence

I: Question: What is the `localStorage` key?
Status: pending
Explanation: Recommendation is `tehesa-cart`, matching the existing `tehesa-theme` cookie convention (`global.constants.ts:1`). Namespaced so a future second store does not collide.

II: Question: What happens to a cart written by a previous schema version?
Status: pending
Explanation: Recommendation is drop it. Writing migrations for a cart that has never shipped is speculative work; a buyer losing an unsent quote across a deploy is a cost the business can absorb, and a crash is not. Revisit once the shape has stabilised.

### Strapi Contract

I: Question: Is `internalId` a safe identity key?
Status: answered
Answer: **No.** It is neither required nor unique. Use `productVariant.documentId` (`ID!`).
Context: Backend-research subagent, 2026-07-30, against `store-tehesa-api` and live introspection. Full detail in the epic's Strapi Contract I.
Explanation: This is why the story adds `documentId` to `GET_PRODUCT_VARIANTS`. `internalId` remains on the line as seller-facing display text with a missing-value fallback.

II: Question: Does the variant selection need any other field for the cart?
Status: answered — with a follow-up
Answer: `documentId` is the only field this story requires. `measurementUnit`, `packageQuantity`, `material`, and `stock` also exist on `product_variant` and are unselected.
Context: Backend-research subagent, 2026-07-30.
Explanation: `measurementUnit` and `packageQuantity` would materially improve a quote line ("3 cajas de 100 pz" vs "3 pz") but their population in live data is unverified — `description` and `subcategory` were also confirmed available and turned out empty on every sampled product. **Decided 2026-07-31 (epic Strapi Contract V): do not use them.** Quantities are pieces throughout. `documentId` remains the only field this story adds.

### Verification

I: Question: How are hostile persisted payloads tested?
Status: pending
Explanation: jsdom provides `localStorage`, so this is directly testable and should be. The cases that matter are the adversarial ones, not the happy path: truncated JSON, valid JSON with the wrong shape, a negative quantity, a non-integer quantity, a `null` unit price, a `documentId` failing `DOCUMENT_ID_PATTERN`, and an oversized line array. Each must drop the offending line, keep the rest, and not throw.

II: Question: Does the drawer's selection re-key break existing tests?
Status: pending
Explanation: `__tests__/product-variants/ProductVariantsDrawer.test.tsx` exercises selection and quantity behaviour. Whether its assertions are index-coupled has to be checked during planning — if they interact through `aria-label`s (`Seleccionar ${diameter}`, `Cantidad de ${diameter}`) they survive the re-key untouched, which would be the good outcome.

## Assumptions Made

- No new npm dependency; `zustand/persist` covers persistence.
- The cart provider mounts in `src/app/providers.tsx`, not in a page.
- Cart lines are identified by `${productDocumentId}:${variantDocumentId ?? "no-variant"}`.
- Variant-less lines carry no price and never borrow `minPrice`.
- A repeat add increments quantity rather than appending a line.
- The cart is per-device with no cross-device sync and no cross-tab sync in v1.
- Money is not formatted anywhere except through `formatNumberToCurrency`.
- Tests mock Strapi at the route/server-action boundary as they do today; manual QA uses live `.env.local` config.

## Non-Obvious Findings

- **The add-to-cart UI is already built.** Multi-select checkboxes, per-variant quantity inputs, a live piece count, and a live total are all in `ProductVariantsDrawer.tsx:105-239`. The CTA at line 233 calls `handleClose`. This story is a store and four wires, not a UI build.
- **`internalId` is optional and non-unique in Strapi**, which invalidates the identity assumption recorded in `docs/improvement.md:83-84`. The variant's `documentId` — present, unique, and currently unselected — is the key. This is the finding that most changes the shape of the work.
- **Index-keyed drawer state is unsafe for a reason that already exists**, not a hypothetical one: the variant array is re-fetched and re-sorted by price on every open (`ProductVariantsDrawer.tsx:60-68`).
- **`quantities[index]` can be the empty string, and the existing total coerces it to 1** via `|| 1` (line 108). Fine for a preview, wrong for a committed line.
- **`src/app/providers.tsx` is a deliberately empty seam** already wrapped around the whole app and already used by `__tests__/test-utils.tsx`. Mounting the cart there means no existing test needs a new wrapper.
- **`ChangeThemeStoreProvider` is mounted in a page, not in `providers.tsx`** (`page.tsx:57`). That is fine for a store only `/` consumes and wrong for the cart. Do not copy the placement.
- **`Header` is not in the root layout.** It lives inside `CatalogPageLayout`, used only by `/`. The badge forces this decision before it forces any styling decision.
- **`Header` already contains the exact mounted-guard pattern** the badge needs, for the theme-dependent logo (lines 15-21). Reuse it rather than introducing a second hydration strategy.
- **The drawer's float-summed `selectedTotal` and a cents-based cart total can disagree on screen.** Two numbers for the same selection, computed two ways, in the same session.

## Research Outcome

Story 1 is fully scoped and unblocked. Every Strapi question it depends on was answered on 2026-07-30, and one answer — `internalId` being neither required nor unique — changed the design: the cart is keyed by the variant's `documentId`, which costs one query field and one type field to obtain.

The work is one new store, one new provider, one query field, one type file, four edited components, and a test folder. No new dependency, no backend change, no new route.

The open questions that remain are product and design calls (confirmation pattern, badge behaviour, cart cap, storage key) — none of them block planning, and each has a recommendation above so sign-off is a yes/no rather than a re-analysis.

Awaiting human sign-off. No source files were modified during this research.
