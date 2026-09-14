# Plan: Cart State, Persistence, And Add-To-Cart Wiring

**Source research:** `ai-research/cart-quote-whatsapp/cart-state-persistence.story-1.md`
**Epic:** `ai-research/epics/cart-quote-whatsapp.epic.md` (Story 1)
**Research sign-off:** 2026-07-31, all blocking questions answered.
**Plan date:** 2026-07-31
**Status:** Awaiting human sign-off. No source files modified.

## What Planning Verified In The Code

Five things were read rather than assumed. Three of them shrink the story.

| Finding | Consequence |
|---|---|
| **HeroUI v3 ships `NumberField`** with `Root`/`Group`/`Input`/`IncrementButton`/`DecrementButton` (`node_modules/@heroui/react/dist/components/number-field/`) | The `− n +` stepper is a ~30-line wrapper, not a hand-built control. |
| **HeroUI v3 ships `Toast`** with `Toast.Provider` and an imperative module-level `toast()` (`components/toast/`), `DEFAULT_TOAST_TIMEOUT = 4000` | Research Open Question UI I's remaining half is closed: no toast component to write. 4s is already the default. `maxVisibleToasts={1}` gives the no-stacking rule. |
| **`ProductCard.tsx:43-47` already renders a single `Precio`** when `hasOneProductVariant === true`, and `__tests__/product-listing/ProductCard.test.tsx:43-63` already covers it | **AC 5b is already shipped.** Only the signal changes (see D2). |
| **`__tests__/product-variants/ProductVariantsDrawer.test.tsx`** — exactly **one** of nine tests touches the number input (`updates the selected count and total`, lines 158-188, via `getByRole("spinbutton")` + `user.clear`/`user.type`). Every other test drives checkboxes and `aria-label`s | Research Verification Question II answered: **re-wire, not rewrite.** One test body changes. |
| **`ToggleDarkMode` uses `next-themes` directly**, never `useChangeThemeStore` — nothing in `src/` consumes the theme store | Moving `Header` would not break theme behaviour. Deferred anyway, see D1. |

## Acceptance Criteria

Copied from the research doc, in order.

1. A Zustand cart store follows the provider-wraps-store pattern, mounted in `src/app/providers.tsx`, persisted to `localStorage` via `zustand/persist` with explicit `version` and `migrate`.
2. Rehydrated state validated line by line. Truncated blob, wrong-shape blob, negative/non-integer quantity, non-finite price each drop that line; the rest survives; nothing throws.
3. Drawer CTA adds one line per selected variant carrying `documentId`, `internalId`, `diameter`, unit price, quantity — from state in hand, no extra Strapi request.
4. Card tertiary CTA (`Agregar y elegir después`) adds a product-level line with no variant, renderable as `Sin variante seleccionada`, excluded from any price total.
5. `variantCount === 1` products render a different card with one primary CTA `Agregar 1 pieza`, fetching the only variant via `/api/catalog/variants` and adding a priced line at quantity 1. Pending holds the label and shows a spinner; failure returns to default and surfaces `No se pudo agregar. Intenta de nuevo.` in `role="alert"`, recoverable in place. `variantCount` of `null`/`0` is **not** this case.
5b. Single-variant card shows one `PRECIO` instead of `DESDE`/`HASTA`.
6. Adding a variant already in the cart increments its quantity, keyed by the variant's `documentId`.
7. Header cart control shows the line count, always visible including `0`, count bottom-right, reserving **44×44px from the first render**. `0` neutral, `1`+ primary accent. `99+` grows inside the same button without changing header width at 390px. Icon-only at every breakpoint. Accessible name carries the count.
7b. **Not a link and not a button in this story** — a labelled status, not a focusable control that does nothing. Story 2 promotes it.
8. Persisted state has two independently clearable slices — cart lines and buyer contact — both validated on rehydrate. The form is Story 4; only the shape belongs here.
9. **At most 100 lines.** Enforced on add (message naming the limit) and on rehydrate.
10. Drawer adopts the `− n +` stepper, replacing the bare `<input type="number">` at `ProductVariantsDrawer.tsx:192-211`. Quantity bounded `1..100`.

## Affected Files

**`src/app/**`**
- `src/app/providers.tsx` — Modify (mount cart provider + `Toast.Provider`; becomes `"use client"`)

**`src/features/**`**
- `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` — Modify (re-key, stepper, wire CTA)

**`src/components/**`**
- `src/components/ProductCard.tsx` — Modify (two-CTA footer, single-variant branch)

**`src/shared/**`**
- `src/shared/constants/cart.constants.ts` — Create
- `src/shared/types/global.types.ts` — Modify (`documentId` on variant types, cart types)
- `src/shared/queries/global.queries.ts` — Modify (`documentId` in `GET_PRODUCT_VARIANTS`)
- `src/shared/ui/atoms/QuantityStepper.tsx` — Create
- `src/shared/ui/atoms/CartCount.tsx` — Create
- `src/shared/ui/organisms/Header.tsx` — Modify (render `CartCount`)

**`src/zustand/**`**
- `src/zustand/store/cart.store.ts` — Create
- `src/zustand/provider/cart.provider.tsx` — Create

**`__tests__/**`**
- `__tests__/cart/cart.store.test.ts` — Create
- `__tests__/cart/cart.rehydrate.test.ts` — Create
- `__tests__/cart/CartCount.test.tsx` — Create
- `__tests__/shared/QuantityStepper.test.tsx` — Create
- `__tests__/product-variants/ProductVariantsDrawer.test.tsx` — Modify (one test body + new add tests)
- `__tests__/product-listing/ProductCard.test.tsx` — Modify (new footer/single-variant tests)

Not touched: `src/app/layout.tsx`, `src/features/Home/CatalogPageLayout.tsx`, `src/app/page.tsx` (see D1).

---

## Phase 1 — Store, Persistence, Provider, Toast Mount

Covers AC 1, 2, 6, 8, 9 (rehydrate half).

### Changes Required

**Create `src/shared/constants/cart.constants.ts`**

```
CART_STORAGE_KEY = "tehesa-cart"
CART_SCHEMA_VERSION = 1
CART_MAX_LINES = 100
CART_MIN_QUANTITY = 1
CART_MAX_QUANTITY = 100
CART_TEXT_MAX_LENGTH = 200          // product name, diameter, internalId
CONTACT_TEXT_MAX_LENGTH = 100
CONTACT_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
NO_VARIANT_KEY = "no-variant"
```

Codes and caps only. The 100-line refusal copy is composed at the call site per `docs/IMPLEMENTATION_GUIDELINES.md` — `Tu lista llegó al máximo de ${CART_MAX_LINES} productos.`

**Modify `src/shared/types/global.types.ts`** (near lines 63-76)

- `ProductVariant` gains `documentId: string`; `ProductVariantUI` gains `documentId: string`.
- Add the cart union, discriminated on `variantDocumentId`:

```ts
export type CartVariantLine = {
  productDocumentId: string
  productName: string
  quantity: number
  variantDocumentId: string
  internalId?: string
  diameter: string
  unitPrice: number
}
export type CartProductLine = {
  productDocumentId: string
  productName: string
  quantity: number
  variantDocumentId: null
  unitPrice: null
}
export type CartLine = CartVariantLine | CartProductLine
export type CartContact = {
  firstName: string
  lastName: string
  email: string
}
```

Contact field names come from the epic (`nombre`, `apellidos`, `correo` — epic AC 161, 426). No form in this story.

**Create `src/zustand/store/cart.store.ts`**

State and actions:

```ts
export type CartState = { lines: CartLine[]; contact: CartContact | null }
export type CartAddResult = { added: number; incremented: number; rejected: boolean }
export type CartActions = {
  addVariantLines: (inputs: CartVariantLine[]) => CartAddResult
  addProductLine: (input: CartProductLine) => CartAddResult
  clearLines: () => void
  setContact: (contact: CartContact) => void
  clearContact: () => void
}
```

`CartAddResult` is not decoration — AC 6 needs the caller to know it incremented rather than appended (to pick `Cantidad actualizada` over `N variantes agregadas`), and AC 9 needs the refusal signalled so the call site can compose the limit message.

Identity: a module-level pure `cartLineKey(line)` returning `` `${productDocumentId}:${variantDocumentId ?? NO_VARIANT_KEY}` ``. **Derived, never persisted** — a stored key can drift from the fields it was derived from.

Add semantics (shared by both add actions):
- Build the candidate list, dedupe against existing lines by `cartLineKey`.
- Existing key → `quantity = min(existing + incoming, CART_MAX_QUANTITY)`, count as `incremented`.
- New key → append, count as `added`.
- **Cap check is on the batch, before any mutation:** if `existingLineCount + newKeyCount > CART_MAX_LINES`, return `{ added: 0, incremented: 0, rejected: true }` and change nothing. An all-or-nothing batch is the only version where the caller's message is truthful.

Persist config:

```ts
persist(creator, {
  name: CART_STORAGE_KEY,
  version: CART_SCHEMA_VERSION,
  storage: createJSONStorage(() =>
    typeof window === "undefined" ? undefined : safeLocalStorage,
  ),
  migrate: () => defaultCartState,   // drop on any version mismatch
  merge: (persisted, current) => ({ ...current, ...sanitizeCartState(persisted) }),
})
```

`migrate` runs before `merge`, so version handling and shape validation stay separate. `migrate` returning empty state is the drop-on-mismatch decision (research Persistence II) — leave a comment saying so, because silently emptying a cart looks like a bug to the next reader.

`safeLocalStorage` — a `StateStorage` whose three methods each wrap `localStorage` in `try/catch`, `getItem` returning `null` on throw and `setItem` swallowing. This is the Safari-private-mode / quota case from the research edge-case list: a failed persist must not take down the add. Mark with `// ponytail: persist failures are swallowed; the in-memory cart still works for the session`.

**Rehydrate validation — the trust boundary.** Two exported pure functions in the same file so tests can hit them without a store:

- `isValidCartLine(value: unknown): value is CartLine`
  - object, not null, not array
  - `productDocumentId`: string, matches `DOCUMENT_ID_PATTERN`, length ≤ `DOCUMENT_ID_MAX_LENGTH` (**imported from `catalog.constants.ts`** — do not re-derive)
  - `productName`: non-empty string, ≤ `CART_TEXT_MAX_LENGTH`
  - `quantity`: `Number.isInteger`, `>= CART_MIN_QUANTITY`, `<= CART_MAX_QUANTITY`
  - `variantDocumentId === null` → require `unitPrice === null`
  - `variantDocumentId` is a string → must match the same pattern/length; `diameter` non-empty string ≤ cap; `unitPrice` `Number.isFinite` and `>= 0`; `internalId` `undefined` or string ≤ cap
  - anything else → `false`
  - `Number.isFinite` is the check that matters: `NaN`/`Infinity` round-trip through `JSON.parse` as `null`, and `null * 3 === 0` is a silent zero in a quote.
- `sanitizeCartState(value: unknown): CartState` — never throws.
  - non-object → `{ lines: [], contact: null }`
  - `lines` not an array → `[]`; else **`lines.slice(0, CART_MAX_LINES).filter(isValidCartLine)`**. Slice first so a tampered 10-million-element array is bounded work, not a scan. Trade-off: invalid lines inside the first 100 shrink the result below 100 rather than pulling replacements from beyond it. That is the correct bias — this is a guard, not a recovery routine.
  - `contact` → `sanitizeContact`: all three fields non-empty trimmed strings ≤ `CONTACT_TEXT_MAX_LENGTH`, `email` matching `CONTACT_EMAIL_PATTERN`; any failure → `null` for the whole slice.
  - **Drop, never repair.** Repairing invents data.

**Create `src/zustand/provider/cart.provider.tsx`**

Mirror `change-theme.provider.tsx:16-43` exactly: `useRef` guard, context, `CartStoreProvider`, `useCartStore(selector)` throwing a named error outside the provider. `"use client"`. No module-level store — that leaks across requests in the App Router.

**Modify `src/app/providers.tsx`**

Add `"use client"`, wrap children in `CartStoreProvider`, and render `Toast.Provider` as a sibling of `{children}` inside it:

```tsx
<CartStoreProvider>
  {children}
  <Toast.Provider placement="bottom end" maxVisibleToasts={1} className="z-[60]" />
</CartStoreProvider>
```

- **`placement="bottom end"`, not `"bottom right"`** — the six accepted values are `bottom`, `bottom start`, `bottom end`, `top`, `top start`, `top end` (`@heroui/styles/dist/components/toast/toast.styles.js`).
- `maxVisibleToasts={1}` is the "do not stack" rule (research Brief 2, note 3) — a new add replaces the message.
- `DEFAULT_TOAST_TIMEOUT` is already 4000ms; do not pass `timeout`.
- Mounting here satisfies both "portalled outside the drawer's tree" (the drawer unmounts on add) and "every existing test picks up the provider for free" — `__tests__/test-utils.tsx:9` already wraps every render in `Providers`.

**Mobile behaviour — one line of the above is the whole fix.** `bottom end` plus HeroUI's own region CSS already delivers the research's "bottom on phone, bottom-right on desktop" spec, so **do not add responsive width classes or a `width` prop**:

- `.toast-region` is `w-[calc(100vw-2rem)] sm:w-auto sm:min-w-(--toast-width)` (`@heroui/styles/dist/components/toast.css:6`). The 460px `DEFAULT_TOAST_WIDTH` is a `min-width` that only applies from `sm` up. At 390px the region is 358px wide.
- `.toast-region--bottom-end` is `right-4 bottom-4`. Combined with the width above, the toast sits inset 16px from both edges at 390px — visually the full-width bottom sheet the research asked for — and collapses to a bottom-right card at `sm`+. One prop, both breakpoints, no media query of ours.
- `bottom-4` keeps it clear of the header, so the badge and the toast stay readable together (research Brief 2, placement note 1).
- **`className="z-[60]` is load-bearing.** `.toast-region` is `z-50` and so are `.drawer__backdrop` and `.drawer__content` (`drawer.css:45,96`). The drawer portals to the end of `<body>` while the toast region renders inside `Providers`, so at equal z-index **the drawer wins the tie and hides the toast for the length of its exit animation** — on mobile the drawer is `w-full`, so the toast would be entirely invisible exactly when it fires. Raising the region above the overlay is the fix; this is the z-index note the research flagged but could not specify.
- HeroUI's `ToastProvider` already runs its own `useMediaQuery("(max-width: 768px)")` internally to reposition the action button. We pass no action button, so it does not apply here — but do not add a second mobile branch on top of it.

### Edge Cases

- **Hydration.** `persist` rehydrates synchronously at store creation, so the first client render already has the cart while the server rendered empty. This is exactly why AC 7 requires the mounted guard on the badge (Phase 5). Nothing else in this story renders cart state.
- **Two tabs.** `persist` does not sync across tabs; last write wins. Accepted for v1 — one comment in the store, no `storage` listener.
- **Toast queue is a module singleton.** Cart tests that trigger toasts need `toast.clear()` in `afterEach` or they leak between tests.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm test -- __tests__/cart/`
- `pnpm test` — **required**, not optional: `Providers` now renders a toast region in every existing component test.

**Manual** — none; nothing is user-visible yet.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `cart.store.ts` add path | append new key; increment existing key by `documentId`; batch add mixing both; cap refusal at 101 leaving state untouched; quantity clamped at `CART_MAX_QUANTITY` | `__tests__/cart/cart.store.test.ts` |
| `cart.store.ts` sanitize path | truncated JSON in `localStorage`; valid JSON wrong shape; negative quantity; non-integer quantity; `null` unit price; `documentId` failing `DOCUMENT_ID_PATTERN`; 101-line array; contact with bad email — each drops the offending item, keeps the rest, throws nothing | `__tests__/cart/cart.rehydrate.test.ts` |
| Slice independence | `clearLines` leaves `contact`; `clearContact` leaves `lines` | `__tests__/cart/cart.store.test.ts` |
| Existing suite | toast region does not disturb any current test | `pnpm test` |

**Test mechanics (research Verification I):** clear `localStorage` in `beforeEach` — jsdom persists it across tests in a file — and create a fresh store per test, because `persist` rehydrates at store creation.

---

## Phase 2 — Variant `documentId` And The Shared Quantity Stepper

Covers task 1 and AC 10's control. Prerequisite for Phase 3.

### Changes Required

**Modify `src/shared/queries/global.queries.ts:22-34`** — add `documentId` to the `product_variants` selection in `GET_PRODUCT_VARIANTS`. `fetchProductVariants` (`global.lib.ts:158-175`) returns `res.data.product.product_variants` untouched and `/api/catalog/variants/route.ts` passes it straight through `success()`, so **no adapter or route change is needed** — the field flows to the client for free.

**Create `src/shared/ui/atoms/QuantityStepper.tsx`** (`"use client"`)

```tsx
interface QuantityStepperProps {
  label: string                // e.g. `Cantidad de ${diameter}` — keeps the existing aria-label contract
  value: number
  onChange: (value: number) => void
  minValue?: number            // default CART_MIN_QUANTITY
  maxValue?: number            // default CART_MAX_QUANTITY
}
```

Composes HeroUI `NumberField`: `NumberField.Root` (`aria-label={label}`, `value`, `onChange`, `minValue`, `maxValue`, `step={1}`, `formatOptions={{ maximumFractionDigits: 0 }}`) wrapping `NumberField.Group` with `DecrementButton` / `Input` / `IncrementButton`.

Two things that are not optional:

1. **Give the increment and decrement buttons explicit Spanish `aria-label`s** — `Aumentar ${label}` / `Disminuir ${label}`. React Aria's defaults are English.
2. **Guard `onChange` against `NaN`.** React Aria's `NumberField` emits `NaN` when the input is cleared. `if (Number.isNaN(next)) { return }` before forwarding. This is what actually delivers AC 10's "the stepper cannot produce an empty value" — the claim is about the *committed* value, and without this guard `NaN` reaches state and the empty-quantity bug moves rather than disappears.

Lives in `src/shared/ui/atoms/` because Story 2 needs the identical control on `/cotizar`. That is the one piece of forward-building this story does, and it is justified by an accepted research finding, not by speculation.

### Edge Cases

- `GET_PRODUCT_VARIANTS` is the only query gaining a field; the four product queries are untouched.
- `ProductVariant.documentId` is `ID!` in Strapi — always present, so the type is non-optional. `internalId` stays `string | undefined`.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit` — will surface every place `ProductVariantUI` is constructed without `documentId`, which is the point of doing this before Phase 3.
- `pnpm lint`
- `pnpm test -- __tests__/shared/QuantityStepper.test.tsx`

**Manual** — none in isolation; exercised in Phase 3.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `QuantityStepper.tsx` | `+` increments, `−` decrements, both reachable by accessible name; `onChange` not called with `NaN` when the input is cleared; does not exceed `maxValue` or fall below `minValue` | `__tests__/shared/QuantityStepper.test.tsx` |
| `global.queries.ts` | `documentId` present in the variants selection | `pnpm exec tsc --noEmit` + Phase 3 manual QA against live Strapi |

---

## Phase 3 — Drawer: Re-key, Stepper, Wire The CTA

Covers AC 3, 6, 9 (add half), 10.

### Changes Required

**Modify `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`**

1. **Re-key selection state** (lines 31-34, 105-116, 161-214). `selectedVariantIndexes: Set<number>` → `selectedVariantIds: Set<string>`; `quantities: Record<number, number | "">` → `Record<string, number>`. The `| ""` case disappears with the input. Array index is unsafe because the array is re-fetched and re-sorted by price on every open (line 67) — this is a live hazard, not a hypothetical.
2. **Carry `documentId` through the mapper** (lines 60-71) and seed `quantities` from `variant.documentId` instead of array index. Change the React row key (line 163) from `` `${diameter}-${price}` `` to `variant.documentId`.
3. **Replace the number input** (lines 192-211) with `<QuantityStepper label={`Cantidad de ${variant.diameter}`} value={quantities[variant.documentId] ?? 1} onChange={…} />`. Keeping the `Cantidad de ${diameter}` label is deliberate: it is the contract the surviving tests query by.
4. **`selectedTotal` / `selectedPieces`** (lines 105-116) reduce over `variant.documentId`. The `|| 1` coercions go away — the stepper cannot produce `0`, `""`, or `NaN`.
5. **Wire the CTA** (line 233, currently `onPress={handleClose}`) to a new `handleAdd`:
   - Build `CartVariantLine[]` from the selected variants: `productDocumentId: product.documentId`, `productName: product.name`, `variantDocumentId`, `internalId`, `diameter`, `unitPrice: variant.price`, `quantity`. **All from state already in hand — no fetch.**
   - `const result = addVariantLines(lines)`
   - `result.rejected` → `toast.danger(\`Tu lista llegó al máximo de ${CART_MAX_LINES} productos.\`)` and **return without closing**, so the buyer can deselect and retry in place.
   - Otherwise `toast.success(message)` then `handleClose()`, where message is:
     - `result.added > 0` → `` `${result.added} variante${result.added === 1 ? "" : "s"} agregada${result.added === 1 ? "" : "s"}` ``
     - else → `Cantidad actualizada`
   - Mixed batches take the `added` message; the added lines are the notable event and the badge carries the cumulative count. No new copy is invented beyond the research's approved set.

### Edge Cases

- **Focus after close.** React Aria's overlay `FocusScope` restores focus to the element focused before the drawer opened — the card's `Explorar las N variantes` button. Expected to work without a focus-management layer; **verify it, do not build for it.** A test asserting focus is not on `document.body` after add is the cheap check.
- **Float arithmetic.** `selectedTotal` keeps summing floats and the store keeps floats. See D3 — in this story there is only one total on screen, so there is nothing to disagree with.
- **`internalId` is optional** and must not be rendered (research content constraint); it is stored for the Story 3/4 WhatsApp message only.

### Test Impact — Answered By Reading The File

`__tests__/product-variants/ProductVariantsDrawer.test.tsx` has nine tests. **Eight survive untouched** — they drive checkboxes and text through `aria-label`s and roles. One breaks:

- **`updates the selected count and total` (lines 158-188)** — uses `screen.getByRole("spinbutton", { name: "Cantidad de Pequeña" })` with `user.clear` + `user.type("3")`. Rewrite it to click the `Aumentar Cantidad de Pequeña` button twice, then assert `1 variante · 3 piezas` and `$30.00 MXN`. Driving the stepper through its buttons is stable regardless of what role React Aria puts on the inner input, which is the whole reason to prefer it over patching the `spinbutton` query.

Every existing fixture (lines 139-142, 164, 198, 233, 242) needs `documentId` added to satisfy the new non-optional field.

New tests in the same file: add-with-one-variant-selected puts one line in the store and closes the drawer; adding the same variant twice increments rather than appends; a 100-line store refuses the add, shows the limit message, and leaves the drawer open.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx`
- `pnpm test`

**Manual** (dev server + live Strapi)
1. Open a multi-variant product, select two sizes, step one to 3 with `+`, add. Toast reads `2 variantes agregadas`, drawer closes, focus lands on the card's button, header count rises by 2.
2. Reopen the same product, add the same size again. Toast reads `Cantidad actualizada`, count does not rise.
3. Reload the page — the count survives.
4. At 390px the stepper's `+`/`−` are comfortably tappable and the row does not overflow.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `ProductVariantsDrawer.tsx` selection | selection and quantity keyed by `documentId`, stable across the re-sort on reopen | `__tests__/product-variants/ProductVariantsDrawer.test.tsx` |
| `ProductVariantsDrawer.tsx` add | line fields, dedup/increment, cap refusal keeps the drawer open, no extra `fetch` on add | same file |
| Stepper integration | count and total update through `+`/`−`, never through a typed empty value | same file |

---

## Phase 4 — Product Card: Tertiary CTA And The Single-Variant Branch

Covers AC 4, 5, 5b.

### Changes Required

**Modify `src/components/ProductCard.tsx`**

1. **One single-variant signal.** Add `const isSingleVariant = product.variantCount === 1` and use it for **both** the price block (line 43, currently `product.hasOneProductVariant === true`) and the new footer branch. See D2 — AC 5 is explicit that the branch is `variantCount === 1` exactly, and two denormalized signals for one question will drift. `variantCount` of `null` or `0` (the three known records in `docs/improvement.md`) keeps the standard card.
2. **AC 5b needs no new UI** — the single-`Precio` block at lines 43-47 already exists and is already tested.
3. **Footer, standard case** (lines 61-76) — restack from `flex justify-between` to `flex-col gap-2` per the Brief 1 mobile comps:
   - `Explorar las N variantes` — `variant="primary"`, `fullWidth`, unchanged behaviour.
   - `Agregar y elegir después` — beneath it, bare centred text, no capsule, no border. **`variant="tertiary"`** (user decision, 2026-07-31; the six that ship are `primary | secondary | tertiary | ghost | outline | danger`). It must be a real `<button>` with a visible focus ring and `min-h-11` for the tap target — the comps cannot show either, and a bare text action loses both most easily. If `tertiary` renders a tinted capsule rather than the bare text in `comps/brief-1/mobile-2-brief-1-cart-state.png`, strip the surface with a `className` rather than switching variants.
   - `onPress` → `addProductLine({ productDocumentId, productName: product.name, variantDocumentId: null, unitPrice: null, quantity: 1 })`, then `toast.success("Producto agregado, elige la medida después")`, or the limit message on `rejected`. **Never `minPrice`** — those columns are unmaintained and three products carry `null`/`0`; a variant-less line has no price by definition.
4. **Footer, single-variant case** — one `fullWidth variant="primary"` `Agregar 1 pieza`, no second action. Local state `isAdding` / `addError`:
   - Click → `fetchCatalog<ProductVariant[]>(\`/api/catalog/variants?documentId=${encodeURIComponent(product.documentId)}\`)`, reusing the exact helper the drawer uses at line 54. No new route, no new util.
   - Pending: `isDisabled` plus a spinner, **label held exactly as `Agregar 1 pieza`** — the comps are explicit that it is not swapped for `Agregando…`.
   - Success: `addVariantLines([...])` from `data[0]` at quantity 1, then `toast.success("1 pieza agregada")`.
   - Failure — request throws **or `data` is empty** — button returns to default and `No se pudo agregar. Intenta de nuevo.` renders beneath it in a `role="alert"`, cleared on the next attempt. Recoverable in place: no toast, no state loss.

### Edge Cases

- The empty-`data` case is a real failure path, not a theoretical one: `fetchProductVariants` returns `?? []` when the product has no variants.
- `handleProductClick` is untouched; the card gains cart concerns but keeps its existing prop contract.
- The card already has `"use client"`; adding `useCartStore` needs no directive change.

### Test Impact

`__tests__/product-listing/ProductCard.test.tsx` — the four existing tests pass unchanged. The `shows zero variant count` fixture (`variantCount: 0`) correctly stays on the standard card. The `shows a single price` fixture carries both `variantCount: 1` and `hasOneProductVariant: true`, so D2 does not break it. Existing button-name assertions are unaffected.

New tests: tertiary CTA adds a variant-less line with `unitPrice === null`; single-variant card renders one CTA and no `Agregar y elegir después`; single-variant add fetches once and stores a priced line; failed fetch shows the alert and leaves the button usable; a `variantCount: 0` product keeps the standard two-CTA footer.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test -- __tests__/product-listing/ProductCard.test.tsx`
- `pnpm test`

**Manual**
1. Tap `Agregar y elegir después` on a multi-variant card — toast `Producto agregado, elige la medida después`, count rises by 1.
2. Find a `variantCount === 1` product: one CTA, one `PRECIO` value, add works, toast `1 pieza agregada`.
3. Throttle/kill the network and retry the single-variant add: red message beneath the button, button usable again, no toast.
4. At 390px the two actions are stacked with real vertical separation and the tertiary is comfortably tappable.
5. Tab to the tertiary action — visible focus ring.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `ProductCard.tsx` standard footer | variant-less line has `variantDocumentId: null` and `unitPrice: null`, never `minPrice` | `__tests__/product-listing/ProductCard.test.tsx` |
| `ProductCard.tsx` single-variant | branch on `variantCount === 1` only; `0`/`null` keep the standard card; one CTA; one `PRECIO` | same file |
| Single-variant states | pending holds the label; failure renders `role="alert"` and stays recoverable; empty `data` is a failure | same file |
| Tap target and focus ring | ~44px height, visible focus | manual browser check (not assertable — the guidelines forbid asserting styles) |

---

## Phase 5 — Header Cart Control

Covers AC 7, 7b.

### Changes Required

**Create `src/shared/ui/atoms/CartCount.tsx`** (`"use client"`)

- Mounted guard copied from `Header.tsx:15-21` — the same hydration strategy the file already uses, not a second one.
- `const lineCount = useCartStore((store) => store.lines.length)`; `const count = mounted ? lineCount : 0`.
- Container reserves the box from the first render: `size-11` (44px) `relative flex items-center justify-center`. Only the counter's content changes — the element never appears, disappears, or resizes, which is the layout-shift concern closed at design level.
- Cart icon from `@remixicon/react` (`RiShoppingCart2Line` — confirmed present).
- Count sits bottom-right, `count > 99 ? "99+" : String(count)`, in a badge that grows inside the 44px box without widening the header at 390px.
- `0` neutral (neutral surface, border, muted text); `1`+ primary accent. This is the single detail most likely to be lost if the badge is later rebuilt from a generic component — `0` must read as *empty*, not as an unread notification.

**Not interactive (AC 7b).** Not an `<a>`, not a `<button>`, and **not `role="status"`** — the toast already owns the live region, and a second one double-announces every add. Render the visual count with `aria-hidden="true"` alongside a `sr-only` span carrying the sentence:

```
Mi lista, {count} artículo{count === 1 ? "" : "s"}
```

A statement, not an action. Story 2 promotes the whole thing to a link and the name to `Ver mi lista, N artículos`.

**Modify `src/shared/ui/organisms/Header.tsx:24-33`** — wrap `CartCount` and `ToggleDarkMode` in a `flex items-center gap-2` container on the right. Icon-only at every breakpoint; no responsive label to keep in sync.

### Edge Cases

- **The count is lines, not pieces.** A line at quantity 5 counts once. AC 7 says "the number of lines" and the accessible name says `artículos`; keep them consistent.
- **Deliberate divergence from the comps for one story** — Briefs 2 and 3 both draw the control as a link. Note it in the PR description so a reviewer comparing against `comps/brief-2/` does not file it as a defect.
- Pre-mount renders `0` inside the reserved box, matching the server output exactly; the real count fills in after mount.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test -- __tests__/cart/CartCount.test.tsx`
- `pnpm test`
- `pnpm build`

**Manual**
1. Fresh browser, empty cart: `0` visible, styled neutrally, no accent.
2. Add one item — badge turns accent, reads `1`. Add more; at 100+ it reads `99+`.
3. At 390px the header does not widen and the gap between cart and theme controls is unchanged across all four counts.
4. Reload with items — count survives; no visible flash from `0` to the real number beyond the normal mount tick.
5. Screen reader reads `Mi lista, 3 artículos`, and the control is not reachable by Tab.
6. Adding from the drawer at 390px: the toast is visible **immediately**, not after the drawer finishes animating out — that is the `z-[60]` check. It sits inset from both edges at the bottom, does not cover the header, and the badge and toast are readable together. Repeat at 1440px, where it should be a bottom-right card.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `CartCount.tsx` | renders `0` when empty; reflects line count not piece count; `99+` above 99; accessible name carries the count; not in the tab order and exposes no link/button role | `__tests__/cart/CartCount.test.tsx` |
| `Header.tsx` | cart control and theme toggle both render; existing logo/theme behaviour unchanged | same file + manual |
| 44×44 reservation, colour semantics | fixed box, neutral `0` vs accent `1`+ | manual browser check (styles are not assertable per the guidelines) |

---

## Cross-Cutting Concerns

- **`localStorage` is the trust boundary.** Its contents flow into a money total and an outbound WhatsApp message. Phase 1's validation is the one place in this story where being minimal is wrong.
- **Server/client boundary.** `src/app/providers.tsx` becomes `"use client"`. `{children}` passed from the server `layout.tsx` still renders on the server — this is the standard pattern and does not make the tree client-side.
- **No new dependency.** `zustand/persist` is a submodule of the installed `zustand@^5.0.8`; `NumberField` and `Toast` are inside the installed `@heroui/react@^3.2.2`. **Do not run `pnpm install`.** No `jest.config.ts` or `next.config.ts` change is needed — both already route `@heroui/react` correctly, and the new components share the dependency set that `Drawer` and `Checkbox` already exercise in tests.
- **Spanish throughout.** Prices only via `formatNumberToCurrency`.
- **Guidelines.** Curly braces on one-line `if` returns; object literals broken across lines; validation messages naming the input and the rule, composed at the call site.
- **Strapi contract.** One additive query field (`documentId`, `ID!`). No backend change. `STRAPI_HOST` / `STRAPI_API_TOKEN` needed for manual QA only.
- **PR.** Targets `develop`, needs exactly one of `major`/`minor`/`patch` — `minor`. Do not bump `package.json` or edit `CHANGELOG.md`.

## Decisions Beyond The Research Doc

**D1 — `Header` stays in `CatalogPageLayout`; the move to the root layout is deferred to Story 2. Confirmed by the user, 2026-07-31.**
The research recommends moving it now. Story 1 ships no new route, so `/` is the only surface a header can appear on and the move buys nothing this story can use. Story 2 creates `/cotizar` *and* promotes the badge to a link — it touches `Header` regardless, so the move costs the same three-file edit whenever it happens. Deferring keeps this story's diff off `layout.tsx` and `page.tsx` entirely.
*To reverse:* make `layout.tsx` async, `await getThemePreference()`, render `<Header themeFetched={…} />` above `{children}`, drop the `Header` and the `themeFetched` prop from `CatalogPageLayout`, drop `getThemePreference` from `page.tsx`'s `Promise.all`. Verified safe — nothing in `src/` consumes `useChangeThemeStore`, so being outside `ChangeThemeStoreProvider` breaks nothing.

**D2 — one `isSingleVariant = product.variantCount === 1` drives both the price block and the footer.**
The price block currently branches on `hasOneProductVariant`; AC 5 requires `variantCount === 1` for the footer. Both are denormalized, unmaintained Strapi columns. Two signals answering one question is drift waiting to happen — a product where they disagree would render a single `PRECIO` with a multi-variant footer. Existing tests pass either way (the fixture carries both). Flag in the PR.

**D3 — money stays as floats in this story; no integer-cents normalization.**
The research flags that the drawer's float-summed `selectedTotal` and a cents-based cart total could disagree on screen. In Story 1 the cart has **no visible total** — `/cotizar` and its subtotal are Story 2 — so there is exactly one number on screen and nothing to disagree with. Store `unitPrice` as the number Strapi returns, validated `Number.isFinite && >= 0`. Leave `// ponytail: floats, not cents — Story 2's subtotal is when this has to change; bump CART_SCHEMA_VERSION then and old carts drop`.

**D4 — the stepper and the toast are HeroUI compositions, not new components.**
`NumberField` and `Toast` both ship in the installed `@heroui/react@3.2.2`. The stepper becomes a ~30-line wrapper (kept as a shared file only because Story 2 needs the identical control); the toast becomes a provider line and imperative calls. This is smaller than what the research's task breakdown assumed and closes the remaining half of Open Question UI I.

## Open Questions

All three closed by the user on 2026-07-31. Nothing blocks implementation.

1. ~~`ghost` vs `tertiary` for `Agregar y elegir después`.~~ **Answered — `tertiary`.** Folded into Phase 4.
2. ~~Toast width at 390px.~~ **Answered — make it work on mobile, and it already does.** `placement="bottom end"` plus HeroUI's own `w-[calc(100vw-2rem)] sm:w-auto sm:min-w-(--toast-width)` region CSS gives the bottom-inset phone layout and the bottom-right desktop card from one prop; the 460px default is a `min-width` that never applies below `sm`. The one real mobile defect found while checking this was a **z-index tie with the drawer overlay** (both `z-50`, drawer portalled later, so it wins) — the toast would be hidden for the whole drawer exit animation, which on a `w-full` mobile drawer means hidden entirely. Fixed with `className="z-[60]"` on `Toast.Provider`. Both are in Phase 1 with a manual check in Phase 5.
3. ~~D1 — the `Header` move.~~ **Answered — `Header` stays in `CatalogPageLayout`.** Story 2 moves it if it needs to.

## Out Of Scope

The `/cotizar` route, the line list, the subtotal, quantity editing outside the drawer, line removal, revalidation against Strapi, the contact **form** (only the store slice is here), the WhatsApp message builder, any analytics code, cross-tab sync, integer-cents money, and moving `Header` into the root layout.
