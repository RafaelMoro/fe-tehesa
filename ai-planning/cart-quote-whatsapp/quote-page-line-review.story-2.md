# Plan: Quote Page (`/cotizar`) — Line Review And Subtotal

**Source research:** `ai-research/cart-quote-whatsapp/quote-page-line-review.story-2.md`
**Epic:** `ai-research/epics/cart-quote-whatsapp.epic.md` (Story 2)
**Research sign-off:** 2026-07-31, every open question closed except the one deferred planning task.
**Plan date:** 2026-07-31
**Status:** Awaiting human sign-off. No source files modified.

## What Planning Verified In The Code

Four things were read rather than assumed. Two of them shrink the story.

| Finding | Consequence |
|---|---|
| **`__tests__/product-variants/ProductVariantsDrawer.test.tsx` (393 lines, 12 tests)** — every test renders `<ProductVariantsDrawer product={…} state={…} />` and nothing else; no test constructs props beyond those two | **Research Verification I is answered: the optional-prop seam leaves all 12 tests green, untouched.** No test rewrite, no mode enum. The seam is confirmed, not hoped for. |
| **HeroUI v3 ships `AlertDialog`** (`node_modules/@heroui/react/dist/components/alert-dialog/`) with `Root`/`Trigger`/`Backdrop`/`Container`/`Dialog`/`Header`/`Heading`/`Body`/`Footer`/`CloseTrigger` | AC 6's centred dialog is a composition, not a component to write. `Trigger` + React Aria give the focus trap, `Esc`-cancels, and focus-return-to-trigger **for free** — the three things Brief 5's static comp could not express. `Container` takes a `placement` prop for the centred placement. |
| **`CatalogPageLayout` is 17 lines** and its only reason to take `themeFetched` is `Header` | Moving `Header` to the root layout lets `CatalogPageLayout` drop the prop entirely, and `page.tsx` drop `getThemePreference()` from its `Promise.all`. Net deletion. |
| **`addLines` clamps a repeat add with `Math.min(existing + input, CART_MAX_QUANTITY)`** (`cart.store.ts:220-223`) | `upgradeLine`'s merge branch reuses that exact expression, so UI I's decision is one line, consistent by construction. |

## Acceptance Criteria

Copied from the research doc, in order.

1. `/cotizar` renders each line with product name, variant (or `Sin variante seleccionada`), quantity, unit price, and line total. `internalId` is **not** displayed.
2. Quantity changes via the shared `QuantityStepper` (bounded `1..100`); a line is removed with `Quitar`; both update the store and `localStorage` immediately.
2b. A variant-less line carries a filled primary `Elegir medida` that opens `ProductVariantsDrawer` in **single-select upgrade mode** and replaces the line in place. Position and quantity survive. Remove-and-re-add is not acceptable.
3. The subtotal sums only priced lines, accumulates in **integer cents** divided once at the end, formats with `formatNumberToCurrency`, is labelled `Subtotal estimado (líneas con precio)` with `Precios de referencia. El vendedor confirma disponibilidad y precio final.` beneath. `N productos · N piezas` appears at the top of the page and beside the subtotal.
4. An empty cart shows `Tu lista está vacía` plus a `Volver al catálogo` route back. Never a bare `$0.00`. The empty state must not flash before rehydration completes.
5. `generateMetadata` marks the route `noindex, follow` with a `/cotizar` canonical; absent from `sitemap.ts`, **not** added to `robots.ts` disallow.
6. A `Vaciar lista` control empties the whole list, behind the Brief 5 centred-dialog confirmation.
7. The header cart control becomes a **link to `/cotizar`** with the accessible name `Ver mi lista, N artículos`, preserving the 44×44 reservation and `0`-is-neutral styling.

## Affected Files

**`src/app/**`**
- `src/app/cotizar/page.tsx` — Create (server shell + `generateMetadata`)
- `src/app/layout.tsx` — Modify (render `Header` inside `NextThemesProvider`; `await getThemePreference()`)
- `src/app/page.tsx` — Modify (drop `getThemePreference()` and the `themeFetched` prop)

**`src/features/**`**
- `src/features/QuotePage/QuotePage.tsx` — Create (`"use client"`; gate, list, subtotal, empty state, `Vaciar lista` dialog)
- `src/features/QuotePage/QuoteLineRow.tsx` — Create (one line, both this story's states)
- `src/features/QuotePage/quote.utils.ts` — Create (cents subtotal + counts, pure)
- `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` — Modify (two optional props)
- `src/features/Home/CatalogPageLayout.tsx` — Modify (drop `Header` and `themeFetched`)

**`src/shared/**`**
- `src/shared/ui/atoms/CartCount.tsx` — Modify (promote to `next/link`, `aria-current`)
- `src/shared/constants/seo.constants.ts` — Modify (two quote-page constants)

**`src/zustand/**`**
- `src/zustand/store/cart.store.ts` — Modify (three actions + one result type)

**`__tests__/**`**
- `__tests__/cart/cart.store.test.ts` — Modify (three new actions)
- `__tests__/cart/CartCount.test.tsx` — Modify (link + `aria-current`)
- `__tests__/product-variants/ProductVariantsDrawer.test.tsx` — Modify (append upgrade-mode tests; existing 12 untouched)
- `__tests__/quote/quote.utils.test.ts` — Create
- `__tests__/quote/QuotePage.test.tsx` — Create
- `__tests__/seo/quote-metadata.test.ts` — Create

---

## Phase 1 — Store Mutations

Nothing renders until the store can mutate. This phase ships and verifies alone.

### Changes Required

**`src/zustand/store/cart.store.ts`** — Modify

Add near `CartAddResult` (line 32):

```ts
export type CartUpgradeResult = "upgraded" | "merged" | "missing"
```

Extend `CartActions` (line 38):

```ts
setLineQuantity: (key: string, quantity: number) => void
removeLine: (key: string) => void
upgradeLine: (key: string, line: CartVariantLine) => CartUpgradeResult
```

Implement inside `createCartStore`'s object, after `clearLines`:

- **`setLineQuantity`** — map over `lines`, and on `cartLineKey(line) === key` set
  `Math.min(Math.max(Math.trunc(quantity), CART_MIN_QUANTITY), CART_MAX_QUANTITY)`.
  The stepper already bounds the widget; the store is the trust boundary. A non-integer or `NaN` input must not reach state — `Math.trunc(NaN)` is `NaN`, so guard with `Number.isFinite(quantity)` and return unchanged otherwise.
- **`removeLine`** — `set({ lines: get().lines.filter((line) => cartLineKey(line) !== key) })`.
- **`upgradeLine`** — index arithmetic, never `addLines` (a `Map` rebuild would move the row to the end and break AC 2b):
  1. `index = lines.findIndex((l) => cartLineKey(l) === key)`; if `-1`, return `"missing"` and set nothing.
  2. `nextKey = cartLineKey(line)`; `collision = lines.findIndex((l, i) => i !== index && cartLineKey(l) === nextKey)`.
  3. **No collision** — copy the array, `next[index] = line`, `set`, return `"upgraded"`.
  4. **Collision (UI I)** — set the collision row's quantity to `Math.min(collided.quantity + line.quantity, CART_MAX_QUANTITY)`, drop the row at `index`, `set`, return `"merged"`. The **collision row keeps its position**; the variant-less row disappears and the list shortens by one.

Edge cases:
- `upgradeLine` never grows the list, so `CART_MAX_LINES` cannot be breached — no cap check needed.
- The caller builds the full `CartVariantLine` (including `quantity`), so the store does no line construction and `internalId` flows through untouched.
- Follow `docs/IMPLEMENTATION_GUIDELINES.md`: curly braces on one-line `if` returns; multi-line object literals.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm test -- __tests__/cart/cart.store.test.ts`

**Manual** — none; no UI yet.

### Verification Coverage

| Area/File | Coverage areas | Verification |
|---|---|---|
| `setLineQuantity` | clamps above 100 and below 1, truncates a fraction, ignores `NaN`, leaves other lines alone, no-op on an unknown key | `__tests__/cart/cart.store.test.ts` |
| `removeLine` | removes the matching line only, no-op on an unknown key, empties on the last line | same |
| `upgradeLine` | **position preserved** (upgrade a middle row, assert the index), quantity carried across, `"missing"` on unknown key, **collision merges** with clamp at 100 and the surviving row keeps the *existing priced line's* index | same |

---

## Phase 2 — Header Move, Route, And Quote Page

### Changes Required

**`src/app/layout.tsx`** — Modify

- `export default async function RootLayout` — `const themeFetched = await getThemePreference()`.
- Render `<Header themeFetched={themeFetched} />` as the first child **inside** `<NextThemesProvider>` (both `Header` and `ToggleDarkMode` call `useTheme()`), before `{children}`.
- Consequence to state in the PR: `cookies()` in the root layout opts **every** route out of static rendering. `/` already awaits `searchParams`; `/cotizar` is `noindex` and client-state-driven. Nothing is lost, but it is a real build-output change.

**`src/features/Home/CatalogPageLayout.tsx`** — Modify

Drop the `Header` import and the `themeFetched` prop. What remains is the `<div>` + `<main className="flex flex-col gap-7 p-4 sm:p-6">` wrapper.

**`src/app/page.tsx`** — Modify

Remove `getThemePreference` from the import and from the `Promise.all` (lines 42-47), and drop `themeFetched={themeFetched}` from `<CatalogPageLayout>`.

**`src/shared/constants/seo.constants.ts`** — Modify

```ts
export const QUOTE_TITLE = "Solicitar cotización | Tehesa"
export const QUOTE_DESCRIPTION =
  "Revisa los productos, medidas y cantidades de tu lista antes de solicitar tu cotización a Tehesa."
```

**`src/app/cotizar/page.tsx`** — Create (server component, no `"use client"`)

```tsx
export const generateMetadata = (): Metadata => ({
  title: QUOTE_TITLE,
  description: QUOTE_DESCRIPTION,
  alternates: { canonical: "/cotizar" },
  robots: { index: false, follow: true },
})

export default function QuoteRoute() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
      <QuotePage />
    </main>
  )
}
```

Exactly one `<main>` per page — `Header` now lives in the layout, outside it. Do **not** route this through `buildCatalogMetadata`; it is catalog-URL-shaped and takes `MainPageSearchParams`. No change to `sitemap.ts` or `robots.ts`.

**`src/features/QuotePage/quote.utils.ts`** — Create (pure, no React)

```ts
export type QuoteTotals = {
  subtotal: number      // pesos, divided once
  productCount: number  // lines
  pieceCount: number    // summed quantities
}
export const getQuoteTotals = (lines: CartLine[]): QuoteTotals
```

One pass. Cents accumulator: `cents += Math.round(line.unitPrice * 100) * line.quantity` for lines with `unitPrice !== null`; `subtotal: cents / 100`. `productCount` and `pieceCount` count **all** lines, priced or not (the comp shows `3 productos · 6 piezas` for a list containing the no-size row). Float accumulation drifts visibly across 25 lines and this number is read by a buyer.

`unitPrice !== null` is also the TypeScript narrowing for the `CartLine` union; `isValidCartLine` guarantees the `variantDocumentId: null ⇒ unitPrice: null` pairing on rehydrate.

**`src/features/QuotePage/QuoteLineRow.tsx`** — Create (`"use client"`)

```tsx
interface QuoteLineRowProps {
  line: CartLine
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
  onChooseVariant: () => void   // wired in Phase 3
}
```

Two visual states, per the comps:

- **Priced** — untinted card, `border-default-200`: product name (bold), `diameter` beneath, `CANTIDAD` label + `QuantityStepper`, `PRECIO UNITARIO` + `formatNumberToCurrency(unitPrice)`, `TOTAL` + `formatNumberToCurrency(unitPrice * quantity)`, and a text `Quitar`.
- **Variant-less** — **the only tinted row** (emerald tint + emerald border, matching the drawer's selected-row treatment at `ProductVariantsDrawer.tsx:208`): name, `Sin variante seleccionada` with an info icon, a **filled primary** `Elegir medida` (`variant="primary"` — DESIGN.md has no `light`/`flat`/`bordered`), a text `Quitar`, the stepper, and `Sin precio por ahora` / `El precio depende de la medida.` in place of the price columns.

Requirements:
- Accessible names identify the line: `label={\`Cantidad de ${lineLabel}\`}` on the stepper, `aria-label={\`Quitar ${lineLabel}\`}` and `aria-label={\`Elegir medida de ${lineLabel}\`}`, where `lineLabel` is `productName` plus `, ${diameter}` when present. Two rows that both say `Quitar` are unusable with a screen reader.
- `internalId` is never rendered (epic UI IV).
- No image slot — no product images exist.
- Money only through `formatNumberToCurrency`. Geist Sans for prices, not Geist Mono.
- Responsive via CSS breakpoints only. `useMediaQuery` does not update on resize.
- Do **not** add a `state` prop for Story 3's four states. Keeping the row a standalone component with a `line` prop is what makes that prop cheap to add later; adding it now builds unused branches.

**`src/features/QuotePage/QuotePage.tsx`** — Create (`"use client"`)

State and store reads:

```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
const lines = useCartStore((s) => s.lines)
const setLineQuantity = useCartStore((s) => s.setLineQuantity)
const removeLine = useCartStore((s) => s.removeLine)
const clearLines = useCartStore((s) => s.clearLines)
```

Render order:

1. `<h1>Solicitar cotización</h1>` + `<p>Revisa productos, medidas y cantidades.</p>`, with `N productos · N piezas` on the same band (right-aligned at `sm:`).
2. **The hydration gate.** `if (!mounted) { return <heading block + a skeleton region /> }` — never the empty copy. `persist` rehydrates synchronously at store creation (`cart.provider.tsx:19-21`), so the server renders zero lines and the client's first render has all of them; an ungated page shows `Tu lista está vacía` for a populated cart, the single most alarming thing this page can say. The mounted flag is the pattern already used twice (`CartCount.tsx:9-16`, `Header.tsx:15-21`).
3. **Empty state** (`mounted && lines.length === 0`) — `Tu lista está vacía` plus a real `next/link` `Volver al catálogo` to `/`. Never a `$0.00` subtotal block; the subtotal section does not render at all.
4. **The list** — `<ul>` of `QuoteLineRow`, `key={cartLineKey(line)}`.
5. **Subtotal block** — `Subtotal estimado (líneas con precio)`, `Precios de referencia. El vendedor confirma disponibilidad y precio final.` directly beneath, `N productos · N piezas` and the formatted amount on the right. **No banner, no callout, no info alert** — explicitly rejected in Brief 3. Never present it as a total the buyer will pay.
6. **`Vaciar lista`** — `variant="danger"`, alongside the subtotal block, wrapped in the `AlertDialog` below.

Focus and announcements:
- One `<p role="status" className="sr-only">` rendering `${productCount} productos · ${pieceCount} piezas. Subtotal ${formatted}` — it re-announces on every quantity edit, removal, and upgrade with no per-action wiring.
- After `removeLine`, move focus deliberately: a `useRef` on the list-region wrapper (`tabIndex={-1}`) and `.focus()` in the removal handler. It works identically whether a row remains or the page became the empty state, and the `role="status"` text announces the change.
  `// ponytail: one region-level focus target; per-row neighbour focus if QA says the jump is disorienting`

`Vaciar lista` confirmation (AC 6, UI III) — HeroUI `AlertDialog`, inline in this file:

```tsx
<AlertDialog>
  <AlertDialog.Trigger><Button variant="danger">Vaciar lista</Button></AlertDialog.Trigger>
  {/* Esc is disabled by default on this component — see the gotcha below */}
  <AlertDialog.Backdrop isKeyboardDismissDisabled={false}>
    <AlertDialog.Container placement="center">
      <AlertDialog.Dialog>
        {({ close }) => (
          <>
            <AlertDialog.Header><AlertDialog.Heading>¿Vaciar la lista?</AlertDialog.Heading></AlertDialog.Header>
            <AlertDialog.Body>Se quitarán los {productCount} productos de tu lista. No se puede deshacer.</AlertDialog.Body>
            <AlertDialog.Footer>
              <Button variant="secondary" autoFocus onPress={close}>Cancelar</Button>
              <Button variant="danger" onPress={() => { clearLines(); close() }}>Vaciar lista</Button>
            </AlertDialog.Footer>
          </>
        )}
      </AlertDialog.Dialog>
    </AlertDialog.Container>
  </AlertDialog.Backdrop>
</AlertDialog>
```

The `Trigger` composition (`AlertDialog.Root` is React Aria's `DialogTrigger`) is what buys the focus trap and focus-return-to-trigger without hand-written focus code. `window.confirm` is not acceptable. Three things verified in `node_modules/@heroui/react/dist/components/alert-dialog/alert-dialog.js` rather than assumed:

- **`Esc` is off by default.** `AlertDialogBackdrop` defaults `isKeyboardDismissDisabled = true` ("alert dialogs typically require explicit action"). The story's accessibility spec requires `Esc` cancels, so **`isKeyboardDismissDisabled={false}` is mandatory**, not optional. `isDismissable` also defaults to `false` — keep that default; a stray backdrop click should not resolve a destructive dialog either way.
- **Do not use `AlertDialog.CloseTrigger` for `Cancelar`.** It renders `CloseButton` — an icon-only React Aria button styled by `closeButtonVariants`, whose default child is an X icon and which hardcodes `aria-label="Close"`. Passing `children="Cancelar"` replaces the icon but the English `aria-label` still wins the accessible name. (Same class of bug as `NumberField`'s English stepper labels, already recorded in `REPO_CONTEXT.md`.) The `Dialog` render prop `({ close }) => …` passes straight through to React Aria's `Dialog`, so a real HeroUI `<Button>` with `onPress={close}` is both correctly styled and correctly named.
- **`AlertDialog.Dialog` sets `role="alertdialog"`** — that is the query handle for the test, and `AlertDialog.Heading` carries `slot="title"` so the dialog is named by its heading automatically.

`autoFocus` on `Cancelar` is the user's decision (2026-07-31): initial focus lands on the non-destructive action. After confirming, the trigger unmounts with the list, so focus falls to the region-focus ref from the removal path, which then holds the empty state's `Volver al catálogo`.

Edge cases:
- `localStorage` can throw (Safari private mode, quota). Story 1's `safeLocalStorage` swallows it, so an edit can update memory and silently fail to persist. Unchanged, acceptable, worth knowing.
- Two tabs do not sync; last write wins. More visible here than anywhere else.
- `Vaciar lista` is unrecoverable — the cart is the only copy, which is why the dialog is not optional polish.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm build` (new route, root-layout change, server/client boundary)
- `pnpm test -- __tests__/quote/` and `pnpm test -- __tests__/seo/`

**Manual**
- `/` renders exactly one header (regression from the move) and the theme toggle still works.
- `/cotizar` with a populated cart at 1440px and 390px, light and dark: matches `comps/brief-3/desktop-{light,dark}-normal-state-brief-3.png` and `mobile-brief-3.png`. The no-size row is the only tinted one.
- Edit a quantity → subtotal and both counters update; reload → the change persisted.
- `Quitar` the last line → the empty state appears; `Volver al catálogo` navigates to `/`.
- **The gate:** hard-reload `/cotizar` on a throttled connection with a populated cart — `Tu lista está vacía` must never appear. jsdom cannot reproduce this; it stays a manual item, and the PR should say so rather than let a green suite read as proof.
- `Vaciar lista`: focus opens on `Cancelar`, `Esc` cancels (regression-prone — it is off by default), `Tab` stays inside the dialog, cancel returns focus to the trigger, confirm empties the list.

### Verification Coverage

| Area/File | Coverage areas | Verification |
|---|---|---|
| `quote.utils.ts` | cents arithmetic vs. a float baseline (e.g. many `0.1`-class prices), variant-less lines excluded from the subtotal but counted in `productCount`/`pieceCount`, empty input → zeros | `__tests__/quote/quote.utils.test.ts` |
| `QuotePage.tsx` | **the gate** — seed `localStorage` before render, assert the list appears and `Tu lista está vacía` is absent; empty storage → empty state; and a `renderToString` of the component asserting the empty copy is absent from pre-mount output (this is the assertion that fails if someone deletes the mounted guard) | `__tests__/quote/QuotePage.test.tsx` |
| `QuotePage.tsx` | quantity edit updates the subtotal, `Quitar` removes one line, per-line accessible names are distinct, subtotal block absent when empty | same |
| `Vaciar lista` dialog | opening yields `role="alertdialog"` named `¿Vaciar la lista?`; `Cancelar` (by that accessible name, not "Close") keeps every line; the danger action empties the list and reveals the empty state; **`Esc` closes without clearing** — that last one is the regression guard for `isKeyboardDismissDisabled={false}`. HeroUI overlays portal outside the container; query through global `screen`. | same |
| `QuoteLineRow.tsx` | `internalId` never rendered; variant-less row shows `Sin variante seleccionada` / `Sin precio por ahora` and `Elegir medida`; priced row shows unit price and line total | same |
| `src/app/cotizar/page.tsx` | `generateMetadata()` returns `robots: { index: false, follow: true }` and canonical `/cotizar` (call the exported function; do not `render` the async route) | `__tests__/seo/quote-metadata.test.ts` |
| `sitemap.ts` / `robots.ts` | `/cotizar` absent from both — existing suites already assert their full output | `pnpm test -- __tests__/seo/` |

Test mechanics carried over from Story 1: clear `localStorage` in `beforeEach` (jsdom persists it across tests in a file), and build a fresh store per test since `persist` rehydrates at store creation. `next/navigation` needs the smallest App Router context wrapper for `Volver al catálogo`; see `docs/UNIT_TESTING_GUIDELINES.md`.

---

## Phase 3 — Drawer Upgrade Mode And `Elegir medida`

### Changes Required

**`src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`** — Modify

Extend the props interface (line 26) with two **optional** members:

```ts
initialQuantity?: number
onConfirmVariant?: (variant: ProductVariantUI, quantity: number) => void
```

`const isUpgradeMode = onConfirmVariant !== undefined`. Four behaviour changes, all behind that flag:

1. **Single select** — in the checkbox `onChange` (line 216), when upgrading, `setSelectedVariantIds(isSelected ? new Set([variant.documentId]) : new Set())`. Checking one unchecks the previous; the CTA acts on exactly one variant.
2. **Quantity prefilled** — the `setQuantities` seed (lines 76-80) uses `initialQuantity ?? 1` instead of the literal `1`. Otherwise "quantity survives the upgrade" is false the moment the buyer looks at the stepper.
3. **Confirm** — `handleAdd` (line 114) branches first: when upgrading, find the single selected variant, call `onConfirmVariant(variant, quantities[variant.documentId] ?? 1)`, `handleClose()`, and **return before touching the store**. No `addVariantLines`, no toast — the caller owns both.
4. **CTA label** — `Elegir esta medida` in upgrade mode; the existing `Agregar N al carrito` derivation is untouched otherwise. `isDisabled={selectedVariantIds.size === 0}` (line 270) stays, which is what makes the confirm unreachable when nothing loaded (Catalog I).

Everything else is unchanged, which is the point: `/`'s behaviour stays byte-identical and all 12 existing tests pass untouched. The passed-through quantity (rather than research's variant-only callback) is a deliberate call — a buyer who edits the stepper inside the drawer expects that number to be the one that lands.

The drawer resets all state on close (`resetVariants`, line 44) and refetches on every open, so no selection leaks between an upgrade and a normal add. The file still has **no `"use client"`** directive and works only because every importer is a client component — `QuotePage` is one, so the invariant holds.

**`src/features/QuotePage/QuotePage.tsx`** — Modify (wire `onChooseVariant`)

- `const state = useOverlayState()` plus `const [upgradeKey, setUpgradeKey] = useState<string | null>(null)`.
- `onChooseVariant` for a row: `setUpgradeKey(cartLineKey(line))` then `state.open()`.
- Derive the target line from `upgradeKey`; build the minimal `Product` the drawer needs — it reads only `product.name` and `product.documentId` (lines 61, 118-119, 180):

  ```ts
  { documentId: line.productDocumentId, name: line.productName, category: null, brand: null }
  ```

- Render one drawer instance for the whole page, only when `upgradeKey !== null`, with `initialQuantity={line.quantity}` and `onConfirmVariant={handleUpgradeConfirm}`.
- `handleUpgradeConfirm(variant, quantity)` builds the `CartVariantLine` (`productDocumentId`, `productName`, `variantDocumentId: variant.documentId`, `internalId: variant.internalId`, `diameter: variant.diameter`, `unitPrice: variant.price`, `quantity`), calls `upgradeLine(upgradeKey, next)`, and switches on the result (UI II):
  - `"upgraded"` → `toast.success(\`Medida elegida: ${variant.diameter}\`)`
  - `"merged"` → `toast.success(\`Medida elegida: ${variant.diameter}. Se combinó con la línea que ya tenías.\`)` — without this the buyer watches two rows become one and assumes something was lost.
  - `"missing"` → no toast; the line is already gone.
  Then `setUpgradeKey(null)`.
- `Toast.Provider` is already mounted (`providers.tsx:12`); do not add a second feedback mechanism.

Edge cases (Catalog I):
- An **empty or failed** variants fetch leaves the line exactly as it was — never removed, never zeroed, never converted. The existing copy (`No encontramos variantes para este producto.`, line 188) and error path (line 186) ship unchanged; no new copy, no new state.
- Focus returns to the `Elegir medida` button that opened the drawer — on success **and** on an empty drawer. Store the triggering element or re-focus by the row's `aria-label` after close; on the merge path that button's row is gone, so fall back to the list-region ref from Phase 2.
- The drawer refetches on every open, so `Elegir medida` costs one `/api/catalog/variants` request per use — the same cost the catalog already pays. No caching in this story.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx` — **all 12 pre-existing tests must pass unmodified**; that is the seam's proof.
- `pnpm test -- __tests__/quote/`

**Manual**
- Add a product with `Agregar y elegir después`, open `/cotizar`, press `Elegir medida`: the drawer opens single-select with the line's quantity prefilled.
- Confirm → the row becomes priced **at the same position**, quantity intact, success toast shows the diameter.
- The merge case: hold the same product both variant-less and at `1/4"`, upgrade the variant-less one to `1/4"` → one row remains at the priced row's original position, quantity summed, merge toast shown.
- Open the drawer for a product with no variants → existing empty copy, confirm unreachable, closing leaves the line untouched.
- `/`'s normal add-to-cart flow is unchanged.

### Verification Coverage

| Area/File | Coverage areas | Verification |
|---|---|---|
| `ProductVariantsDrawer.tsx` | default (no new props) behaviour identical | the 12 existing tests, unmodified |
| `ProductVariantsDrawer.tsx` | upgrade mode: selecting a second variant deselects the first; the stepper starts at `initialQuantity`; the CTA reads `Elegir esta medida`; confirming calls the callback with the variant and current quantity and adds **no** cart line | new tests appended to the same file |
| `QuotePage.tsx` | upgrade replaces the line in place (assert row order), merge collapses two rows and keeps the priced row's position, each result's toast copy | `__tests__/quote/QuotePage.test.tsx` |

---

## Phase 4 — Header Cart Link

### Changes Required

**`src/shared/ui/atoms/CartCount.tsx`** — Modify

- Replace the outer `<div className="relative flex size-11 …">` with `<Link href="/cotizar" className={same}>`. The 44×44 reservation (`size-11`) and the `0`-is-neutral badge styling survive verbatim.
- `const pathname = usePathname()` — the only reason this component imports from `next/navigation`.
- `aria-current={pathname === "/cotizar" ? "page" : undefined}` (UI IV). Never the string `"false"`, which is truthy to some assistive tech.
- Accessible name becomes `Ver mi lista, {count} artículo{s}` in the existing `sr-only` span. No visual active state — nothing in the Brief 2 comps covers one.
- It stays a real link on `/cotizar`; do not degrade it to a span.
- The mounted guard (lines 9-16) is unchanged and still required.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`, `pnpm lint`
- `pnpm test -- __tests__/cart/CartCount.test.tsx`

**Manual**
- Header cart control navigates to `/cotizar` from `/`, keeps its 44×44 footprint at 390px, and `99+` does not change header width.
- A screen reader on `/cotizar` announces the link as the current page.

### Verification Coverage

| Area/File | Coverage areas | Verification |
|---|---|---|
| `CartCount.tsx` | renders `role="link"` with `href="/cotizar"`; accessible name `Ver mi lista, N artículos` for `0`, `1`, `3`, `99+`; `aria-current="page"` only when `usePathname()` returns `/cotizar` and the attribute is **absent** elsewhere | `__tests__/cart/CartCount.test.tsx`, mocking `usePathname` per `docs/UNIT_TESTING_GUIDELINES.md` |

---

## Cross-Cutting Concerns

- **Server/client boundary.** `src/app/cotizar/page.tsx` is a server component; every store consumer under `src/features/QuotePage/` is `"use client"`. `ProductVariantsDrawer.tsx` has no directive and relies on its importers having one.
- **Root layout goes dynamic.** `await getThemePreference()` calls `cookies()`, opting all routes out of static rendering. Deliberate, and named in the PR.
- **Exactly one `<main>` per page.** `Header` moves out of `CatalogPageLayout` into the layout; `/cotizar` supplies its own `<main>`.
- **Money has one formatter.** `formatNumberToCurrency` only. `ProductVariantsDrawer`'s float `selectedTotal` (lines 144-150) is knowingly left alone — see Out Of Scope.
- **Spanish throughout.** `lista` names the collection, `cotización` the artifact and the act. Quantities are always `piezas`.
- **No new dependency.** Do not run `pnpm install`. `AlertDialog` and `Toast` already ship in `@heroui/react` 3.2.2.
- **No Strapi, GraphQL, or API-route change.** The only network call is the drawer's existing `/api/catalog/variants`.
- **Responsive via CSS breakpoints.** `useMediaQuery` does not update on resize (`ProductListing.tsx:60` is the precedent).
- **`pnpm design:lint`** only if `DESIGN.md` tokens change; this plan uses existing ones.

## Open Questions

**None.** All three are closed.

- **Research Verification I** — closed by reading `__tests__/product-variants/ProductVariantsDrawer.test.tsx`: all 12 tests pass only `product` and `state`, so the optional-prop seam leaves them untouched.
- **Initial focus in the confirm dialog** — closed by the user, 2026-07-31: **`autoFocus` on `Cancelar`**, the non-destructive action.
- **`AlertDialog.CloseTrigger`'s shape** — closed by reading `node_modules/@heroui/react/dist/components/alert-dialog/alert-dialog.js` (the HeroUI MCP is configured for OpenCode, not this session; the installed package is the authoritative source either way). It renders an icon-only `CloseButton` with a hardcoded English `aria-label="Close"`, so it is **not** the `Cancelar` control — the `Dialog` render prop plus a real `<Button>` is. That read also surfaced the `Esc`-disabled-by-default gotcha the plan now handles.

## Out Of Scope

Deliberately excluded, each with its reason:

- **The drawer's float `selectedTotal`.** Story 1 recorded the one-cent divergence knowingly. Unifying it means a shared cents helper and a re-verification of the drawer's totals — real work, not this story's ACs. Do **not** add a third way to total money: `getQuoteTotals` is the only new one.
- **Story 3's four line states** (price changed, unavailable ×2, checking, check failed) and the revalidation banner, even though the Brief 3 comps show them.
- **The contact form, the WhatsApp message and CTA** (Story 4), **analytics** (Story 5), quote recovery after hand-off (deferred).
- **The dead `change-theme` store.** `useChangeThemeStore` has zero consumers and `ChangeThemeStoreProvider` is kept alive only by `page.tsx:57`. Noticed, not touched — a `docs/improvement.md` line, not a Story 2 refactor.
- **Brief 3's `☰ Mi solicitud (3)` header pill.** Discarded at epic level; Brief 2's icon-only 44×44 control ships. An implementer working straight from the Brief 3 comps will build the wrong header — do not copy it.
- **Caching the variants fetch** behind `Elegir medida`.
- **A visual active state** on the header link (UI IV).
- Version bump and `CHANGELOG.md` — CI owns those.
