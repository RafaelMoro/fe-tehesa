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
7. A header cart control shows the number of lines, always visible including at `0`, count positioned bottom-right, in a control that **reserves 44×44px from the first render** so only the counter's content changes after mount. `0` is styled neutrally and `1`+ uses the primary accent, so `0` reads as empty rather than as an unread notification. `99+` grows inside the same button without changing header width at 390px. **Icon-only at every breakpoint** (Brief 2's design; Brief 3's labelled `Mi solicitud` pill is discarded). Accessible name carries the count: `Ver mi lista, 3 artículos`.
7b. **In this story the control is not a link** — it is a count, not navigation, because `/cotizar` does not exist until Story 2. Story 2 turns it into a link. It is never a popover or a mini-cart. Note the Brief 2 and Brief 3 comps both draw it as a link, so this is a deliberate one-story divergence from the comps, not an oversight.
8. The persisted state has two independently clearable slices, cart lines and buyer contact details, both validated on rehydrate. The contact form itself lands in Story 4; only the store shape belongs here.
9. **The cart holds at most 100 lines.** Enforced on add (with a message naming the limit) and on rehydrate (a longer persisted array is rejected rather than rendered). This is a trust-boundary guard, not a message-length rule — batching removed the length constraint.
10. **The drawer adopts the `− n +` quantity stepper** designed in Brief 3, replacing the bare `<input type="number">` at `ProductVariantsDrawer.tsx:204`. The stepper cannot produce an empty value, which resolves the `""` quantity case this story has to handle regardless. Quantity is bounded `1..100` per line.

### Task Breakdown

1. Add `documentId` to the variant selection in `GET_PRODUCT_VARIANTS`; add it to `ProductVariant` and `ProductVariantUI`.
2. Define `CartLine` (a two-case union) and the store's state/actions in `src/shared/types/global.types.ts`.
3. Add cart constants: storage key, schema version, quantity bounds, line cap.
4. Build the vanilla store with `persist`, `version`, `migrate`, and a rehydrate-time validator.
5. Build the provider following `change-theme.provider.tsx`, and mount it in `src/app/providers.tsx`.
6. Re-key the drawer's `selectedVariantIndexes` / `quantities` from array index to variant `documentId`; replace the bare number input with the `− n +` stepper (which removes the empty-string case); wire the footer CTA.
7. Build the quantity stepper as a shared component — Story 2 needs the identical control on `/cotizar`, so it belongs in `src/shared/ui/` rather than inside the drawer.
8. Wire `ProductCard`'s tertiary CTA to add a variant-less line; branch the card on `variantCount === 1` for the `Agregar 1 pieza` variant.
9. Decide `Header` placement, add the icon-only control with a mounted guard, a count, and an accessible name. Not a link in this story.
10. Tests: store actions, dedup/increment, the 100-line cap on add and on rehydrate, rehydration of hostile payloads, drawer add, card add, single-variant add with its pending and failure paths, count display.

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
| `comps/brief-1/desktop-light-brief-1-cart-state.png` | Three card footers at 1440px, light, plus the single-variant default / pending / failure row |
| `comps/brief-1/desktop-dark-brief-1-cart-state.png` | Same, dark |
| `comps/brief-1/mobile-1-brief-1-cart-state.png` | Multi-variant footer and the three action states at 390px, light and dark |
| `comps/brief-1/mobile-2-brief-1-cart-state.png` | All three card cases stacked at 390px, light and dark |

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

### Brief 2 — header control and toast

| File | Covers |
|---|---|
| `comps/brief-2/desktop-header-brief-2.png` | Header cart control at 1440px, counts 0 / 1 / 9 / 99+, light and dark |
| `comps/brief-2/mobile-header-brief-2.png` | Same control at 390px, all four counts, light and dark |
| `comps/brief-2/share-toast-brief-2.png` | The four toast messages, light and dark |

What the comps settle:

- **The control reserves 44×44px from the first render.** Only the counter's *content* changes; the button never appears, disappears, or resizes. That is the layout-shift concern closed at the design level, and it pairs exactly with the mounted-guard pattern in `Header.tsx:15-21` — reserve the box on the server, fill the number after mount.
- **`0` is styled neutrally** (neutral surface, border, and text) while `1`, `9`, and `99+` use primary green with `primary-900` text. This is the distinction that keeps `0` reading as *empty* rather than as an unread notification, and it is the single thing most likely to be lost if the badge is rebuilt from a generic component.
- **`99+` grows inside the same 44px button**; header width is unchanged at 390px, and the gap between the cart and theme controls stays constant.
- **The whole control is a link to `/cotizar`.** No popover, no mini-cart — explicitly annotated as such.
- **Toast is HeroUI v3's**, which answers the open sub-question about whether one had to be written. Anatomy: confirmation icon, explicit text, optional close. Meaning does not depend on the green — the icon and the wording carry it, so the colour-alone concern is closed.

**Confirmed 2026-07-31: `comps/brief-2/share-toast-brief-2.png` is the toast design.** It fixes anatomy and copy. It does not depict placement, timing, or concurrency, so these three are now the specification rather than recommendations:

1. **Placement.** Bottom on phone, bottom-right on desktop. It must **not** cover the header, because the badge count updating is the second half of the confirmation — the two signals should be visible together.
2. **Duration.** ~4 seconds. Long enough to read `Producto agregado, elige la medida después`, short enough not to linger. Auto-dismissing, with the close button as an override rather than the only way out.
3. **Concurrency — do not stack.** One toast at a time; a new add replaces the message and resets the timer. The badge already carries the cumulative count, so a stack would restate what the header shows while covering more of the screen. The four messages appear together in the comp as an inventory of every origin, not as a stack — they come from mutually exclusive trigger sites and cannot co-occur.

Two implementation notes the comps imply but cannot state:

- **The toast must be portalled outside the drawer's tree** — mounted at the layout or provider level — because the drawer unmounts on add. It also needs a z-index above the drawer overlay, since the drawer may still be animating out when the toast appears.
- **The badge needs an accessible name carrying the count**, e.g. `Ver cotización, 3 artículos`. The comp shows a number in a capsule; a screen reader needs the sentence.

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
- **A cart line cap is needed for validation, not as a product rule.** The original reason — the WhatsApp encoded-URL budget — was removed when the epic decided to batch rather than truncate (Decision 3 → Overflow). What remains is a trust-boundary guard: a rehydrated array of 10,000 lines must be rejected before it is rendered or summed. See Open Question UI IV.

## Open Questions

### UI And Product Decisions

I: Question: What happens visually when something is added, given the app has no toast pattern?
Status: **answered 2026-07-31 — one shared HeroUI v3 toast**, `role="status"`, serving both trigger sites. Designed in Brief 2 (`comps/brief-2/share-toast-brief-2.png`).
Explanation: Placement, duration, and stacking were not delivered by the brief; the recommendations in "Brief 2" above stand (bottom / bottom-right, ~4s, no stacking) and are planning-level calls rather than blockers.

II: Question: Does the drawer still close after adding?
Status: **answered 2026-07-31 — yes.** The confirmation lives outside the drawer and focus returns to the card's trigger button.

III: Question: Where does the badge link, given `/cotizar` does not exist until Story 2?
Status: **answered 2026-07-31 — ship it as a non-link count in Story 1; Story 2 makes it a link.** Keeps both stories independently deliverable.
Explanation: Consequences to carry into planning:

- Story 1 ships a control that is **not interactive**. It should therefore not be a `<button>` or an `<a>` at all — a focusable control that does nothing is worse than a non-focusable one. Render it as a labelled status element, and let Story 2 promote it to a link.
- Its accessible name changes with it: `Mi lista, 3 artículos` in Story 1 (a statement), `Ver mi lista, 3 artículos` in Story 2 (an action).
- **Deliberate divergence from the comps for one story.** Brief 2 and Brief 3 both draw the control as a link. Note it in the PR so a reviewer comparing against the comps does not file it as a defect.

IV: Question: Is there a maximum cart size, and what does hitting it look like?
Status: **answered 2026-07-31 — 100 lines.**
Context: The original rationale (the WhatsApp ~8-12 line budget) was removed when the epic decided to batch instead of truncate. 100 is a trust-boundary guard, not a message-length rule.
Explanation: It has to be enforced in **two** places, and they behave differently:

- **On add** — refuse and say why, naming the limit. `docs/IMPLEMENTATION_GUIDELINES.md` requires the message to name the input and the rule, so something in the shape of `Tu lista llegó al máximo de 100 productos.` Never fail silently: a buyer whose add does nothing assumes the app is broken.
- **On rehydrate** — a persisted array longer than 100 is user-tampered data, not a user action. Truncate to the first 100 valid lines or reject the blob; either is defensible, but it must not throw and must not render 10,000 rows.

100 lines also implies roughly 10-13 WhatsApp parts at the 1800-character cap. That is a lot of sequential sends. Not a blocker — nobody will build a 100-line quote — but worth knowing the cap and the batching interact.

V: Question: Which header control ships — Brief 2's or Brief 3's?
Status: **answered 2026-07-31 — Brief 2's, icon-only, at every breakpoint.** Brief 3's labelled `Mi solicitud` pill is discarded.
Context: `comps/brief-2/desktop-header-brief-2.png` and `comps/brief-2/mobile-header-brief-2.png` are the reference.
Explanation: This keeps the fixed 44×44 reservation that closed the layout-shift problem — the mounted guard swaps `0` for the real count inside a box whose size never changes. It also means one control at both breakpoints rather than a responsive label, which is less to build and less to keep in sync. The trade accepted: the control does not name its destination, so the accessible name carries that job entirely.

VI: Question: Does the drawer adopt the `− n +` quantity stepper from the Brief 3 comps?
Status: **answered 2026-07-31 — yes, both surfaces use the stepper.**
Context: `/cotizar` uses it (Brief 3); `ProductVariantsDrawer.tsx:204` currently uses a bare `<input type="number">`.
Explanation: Consequences:

- **Build it once, in `src/shared/ui/`.** Story 2 needs the identical control; a stepper written inside the drawer would be copied a week later.
- **It resolves the empty-quantity problem by construction.** A stepper cannot hold `""`, so the `|| 1` coercion at `ProductVariantsDrawer.tsx:108` stops being a decision this story has to make — the input simply cannot reach that state. This is the rare case where the larger change is also the simpler one.
- It bounds quantity at the control (`1..100`) rather than relying on validation after the fact.
- **Check `__tests__/product-variants/ProductVariantsDrawer.test.tsx` early.** Tests that type into a number input will break; tests that drive it through `aria-label`s (`Cantidad de ${diameter}`) mostly survive. This is the largest test-breakage risk in the story.

VII: Question: What is the noun for the collection — `lista`, `solicitud`, or `cotización`?
Status: **answered 2026-07-31 — `lista` is the collection.** `solicitud` is dropped as a name for it.
Explanation: The rule, and the answer to "where would `Solicitar cotización` appear":

- **`lista`** names the thing the buyer builds. `Tu lista está vacía`, `Restaurar lista`, `Mi lista, 3 artículos`.
- **`cotización`** names the artifact and the act. `Solicitar cotización` (the `/cotizar` page heading, from the Brief 3 comps), `Cotizar` (the CTA), `Esta cotización necesita 3 partes`, `Empezar una nueva cotización`.
- **`Solicitar cotización` survives**, because it is a verb plus the artifact — it names the *act*, not the collection. Only `Mi solicitud` broke the rule by using *solicitud* as the collection's name, and answer V already removes it.
- **One judgement call to confirm:** the WhatsApp message header is `*Solicitud de cotización* · TH-…` (epic Decision 3, Option A). That is seller-facing and is the standard commercial Spanish for the document, so it is kept. If you want *solicitud* gone from every surface, the substitute is `*Cotización Tehesa* · TH-…`, which was the original draft.

### Persistence

I: Question: What is the `localStorage` key?
Status: **answered 2026-07-31 — `tehesa-cart`.** Matches the existing `tehesa-theme` cookie convention (`global.constants.ts:1`), namespaced so a future second store does not collide.
Explanation: The contact slice needs a decision alongside it. Two options, both fine: one key holding both slices with independent clearing in the store, or `tehesa-cart` plus `tehesa-contact` as separate `persist` instances. Recommend **one key** — the slices are cleared independently in state, not in storage, and two keys means two version numbers and two migrations. Constant lives in the new cart constants file, never inlined.

II: Question: What happens to a cart written by a previous schema version?
Status: **answered 2026-07-31 — drop it.**
Explanation: `migrate` returns empty state on any version mismatch. Writing migrations for a shape that has never shipped is speculative; a buyer losing an unsent list across a deploy is a cost the business absorbs, a crash is not. Two things this obliges:

- **Bump `version` whenever the line shape changes**, including additive changes. A field added without a bump means an old blob passes validation while missing the field, which is exactly the silent case `migrate` exists to prevent.
- **Dropping is silent by design.** The buyer sees an empty list, not an error — there is nothing actionable to tell them, and "your saved list was discarded" invites a support question with no remedy. Worth one comment in the code so the next reader does not mistake it for a bug.

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
Status: **answered 2026-07-31 — jsdom's `localStorage`**, unit tests plus manual QA, no e2e framework and no new test dependency (epic Verification I and II). Two mechanics to get right: clear storage in `beforeEach`, since jsdom persists it across tests in a file; and create a fresh store per test, since `persist` rehydrates at store creation.
Explanation: jsdom provides `localStorage`, so this is directly testable and should be. The cases that matter are the adversarial ones, not the happy path: truncated JSON, valid JSON with the wrong shape, a negative quantity, a non-integer quantity, a `null` unit price, a `documentId` failing `DOCUMENT_ID_PATTERN`, and an oversized line array. Each must drop the offending line, keep the rest, and not throw.

II: Question: Does the drawer's selection re-key break existing tests?
Status: **deferred to planning by the user, 2026-07-31 — answer it by reading the file, not by guessing here.**
Explanation: `__tests__/product-variants/ProductVariantsDrawer.test.tsx` exercises selection and quantity behaviour, and this story changes both — the re-key from array index to `documentId`, *and* the swap from a number input to the stepper. The second is the bigger risk: tests that type a value into the input have no equivalent once the input is gone, while tests driving the UI through `aria-label`s (`Seleccionar ${diameter}`, `Cantidad de ${diameter}`) survive both changes untouched. **Read that file in the first planning phase**, before the drawer work is scheduled — it decides whether this is a re-wire or a rewrite of the drawer's test file.

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

Design is delivered for every surface this story touches (Briefs 1 and 2, `comps/brief-1/` and `comps/brief-2/`). All four epic briefs are complete.

**Ready for planning as of 2026-07-31.** Every blocking question is answered:

| # | Decision |
|---|---|
| UI III | The control ships as a **non-link count**; Story 2 promotes it to a link. Stories stay independently deliverable. |
| UI IV | **100-line cap**, enforced on add (with a message naming the limit) and on rehydrate. |
| UI V | **Brief 2's icon-only control** at every breakpoint. Brief 3's `Mi solicitud` pill discarded. |
| UI VI | **Stepper adopted on both surfaces**, built once in `src/shared/ui/`. Removes the empty-quantity problem by construction. |
| UI VII | **`lista`** for the collection, **`cotización`** for the artifact and the act. `solicitud` dropped as a collection name. |

Two things that grew the story, both deliberately: the shared quantity stepper (task 7) and the single-variant card branch with its pending and failure paths (AC 5). The stepper also carries the story's main test-breakage risk — `__tests__/product-variants/ProductVariantsDrawer.test.tsx` exercises the input it replaces.

Remaining calls are defaults a plan can absorb without another round: the storage key (`tehesa-cart`), drop-on-version-mismatch as the `migrate`, and `Header` placement (root layout recommended).

Awaiting human sign-off. No source files were modified during this research.
