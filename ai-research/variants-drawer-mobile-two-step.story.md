# Variants drawer — two-step mobile flow (design option 1B)

**Status:** research complete — all design answered, all open questions closed. Ready for `/plan` once comps are filed.
**Date:** 2026-09-22
**Branch context:** `fix/home-product-variant-drawer-ui`
**Design source:** `Variantes mobile.dc.html`, panel `#1b` ("Dos pasos: medidas, luego cantidades") in the claude.ai design project *Tehesa UI mocks v1* (`4b99241e-42ab-4ca4-ac4e-c1cd49a75385`)

---

## Story Definition

### Title

Split the mobile variants drawer into two steps: pick medidas, then set cantidades.

### Description

On a phone the `ProductVariantsDrawer` today stacks a checkbox, a `QuantityStepper` and a price into one card per variant, one card per row. For a product with 8 medidas that is ~8 tall cards: the buyer scrolls to find a medida, and every row carries a stepper they do not need yet. Choosing *which* medidas and choosing *how many of each* compete for the same vertical space.

Design option 1B separates them. **Step 1** is a two-column grid of medida cards — tap to select, no quantity anywhere — so 8 medidas fit one screen without scrolling. **Step 2** lists only the medidas that were selected, each with a stepper. A progress rail (`1 · Medidas` ──── `2 · Cantidades`) sits under the product name, and the footer CTA relabels itself from `Continuar a cantidades` to `Agregar al carrito`.

Desktop is out of scope: below `md` the drawer switches to the two-step flow, at `md` and up it keeps the existing one-row-per-variant layout unchanged.

### Acceptance criteria

1. **AC1 — Two-step on mobile only.** Below the `md` breakpoint (`max-width: 767px`) the drawer's default (add-to-cart) mode renders step 1 (medida grid) and step 2 (quantity list). At `md` and above the drawer renders exactly the **layout** it renders today, with no extra step and no progress rail. Its footer and CTA wording do change, per D11 — that is copy, not layout.
2. **AC2 — Step 1 selects, step 2 quantifies.** In step 1 a tap on a medida card toggles its selection (selected card = primary border + tinted fill) and no quantity control is visible. Step 2 lists only selected medidas, each with a `QuantityStepper`, plus a `← Cambiar medidas` control that returns to step 1 preserving the current selection and quantities. The grid is **two columns at every phone width** — 320px included — adapting via D10's padding and type steps rather than by dropping to one column.
3. **AC3 — Footer reflects the step, in D11's words.** Step 1's footer shows the selected-medida count and a CTA reading `Continuar a cantidades`, disabled while nothing is selected. Step 2's footer shows the `N medidas · M piezas` summary, the MXN total via `formatNumberToCurrency`, and an `Agregar N medida(s) al carrito` CTA. Every count string — mobile and desktop, singular and plural — matches D11's table exactly. Adding to the cart produces exactly the same `CartVariantLine[]` as the desktop path does today.
4. **AC4 — Decrementing to 0 drops the medida.** In step 2 the stepper's floor is `0`; reaching `0` removes that medida from the selection and from the step-2 list. When the last one is removed the drawer returns to step 1 with the CTA disabled.
5. **AC5 — Upgrade mode untouched; non-happy states follow Brief A.** `/cotizar`'s `onConfirmVariant` (upgrade) mode keeps its current single-select layout at every breakpoint. On the mobile path the loading, error and empty bodies replace the step content and follow artboards `2d`–`2i`: loading is a six-card skeleton in the step-1 grid shape with the rail inert and the footer disabled; error is a neutral two-line body with a `Reintentar` control and no red panel; empty drops the rail entirely and swaps the green CTA for a bordered `Cerrar`. Their existing semantics survive — `role="status"` on loading, `role="alert"` on error — and the drawer height must not jump when data arrives.

### Task breakdown

| # | Task | Notes |
|---|---|---|
| 1 | Add a `step` state and breakpoint branch to `ProductVariantsDrawer.tsx` | Gate on `isUpgradeMode === false && isMobile`; reset `step` to 1 in `resetVariants` |
| 2 | Build the step-1 medida grid | `grid-cols-2`, tap-to-toggle buttons, no stepper |
| 3 | Build the step-2 quantity list | Reuses `QuantityStepper` with `minValue={0}` |
| 4 | Progress rail + step-aware footer (summary, total, CTA label, disabled state) | |
| 5 | Loading skeleton, error body and empty body per artboards `2d`–`2i` | The rail is inert while loading and absent when empty; the footer keeps its height in all three |
| 6 | Apply D6 (neutral disabled CTA) and D7 (solid check glyph) to **both** themes | Deviates from light comp `#1b` deliberately |
| 7 | Lift `loadProductData` out of the effect and wire `Reintentar` (D9) | The story's only new behaviour |
| 8 | Width-stepped padding and type scale for the grid (D10) | 320 / 360 / 390 — column count never changes |
| 9 | Copy rename per D11/D15 across all seven user-facing call sites | Strings only, no identifier renamed. Land as its own commit — it touches all seven test suites |
| 10 | Tests for the mobile path | Existing 16 tests keep covering desktop for free — see *Testing* below |

Single story, 10 tasks, 2–3 implementation phases. Not an epic. Natural phase split: (1) the D11/D15 copy rename on its own, (2) the two-step mobile flow, (3) the non-happy states and `Reintentar`.

---

## Design Agent Handoff

### User goal, and what this is not

A buyer on a phone needs to tell Tehesa *which medidas of one product, and how many pieces of each*, and get them into the quote list. The drawer is a **quote-line builder**, not a checkout: the total it shows is a reference amount for the quote request, never a price the buyer is committing to pay. Nothing in this story adds stock levels, delivery estimates, payment, or a per-medida product image — the catalog has none of those and inventing them in a comp will produce ACs that cannot be implemented.

### Surface index

| Surface | File | States | Story | Covered by |
|---|---|---|---|---|
| Step 1 — medida grid (mobile) | `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` | none selected · ≥1 selected | this story | comp `#1b` (light) + `2a`/`2b` (dark) |
| Step 2 — quantity list (mobile) | same | 1 medida · several · last one decremented to 0 | this story | comp `#1b` (light) + `2c` (dark) |
| Progress rail + footer | same | step 1 (no total, `Continuar a cantidades`) · step 2 (total, `Agregar al carrito`) | this story | comp `#1b` (light) + `2a`–`2c` (dark) |
| Loading / error / empty body | same | `role="status"` · `role="alert"` · no-variants copy | this story | comp `2d`–`2i` (Brief A, both themes) |
| Step 1 at 320 / 360px | same | 8 medidas, 2 selected | this story | comp `3a`–`3d` (Brief B, both themes) |
| Footer + CTA copy, all breakpoints | same + `src/components/ProductCard.tsx` | none / one / several | this story | D11 string table (Brief B) |
| Desktop variant rows | same | unchanged | — | out of scope, must not regress |
| Upgrade mode (`/cotizar`) | same | unchanged | — | out of scope, must not regress |

The comp `#1b` is already a complete design for the light-theme happy path, so **no design agent was needed to invent this layout** — implementation reads the comp. Brief A covered the two gaps the comp left (dark theme, and the loading/error/empty bodies) and has been **answered**: artboards `2a`–`2i` plus a full token table now live in the same design file. Brief B has also been **answered**: artboards `3a`–`3d` settle the grid at 320/360px, and a full string table settles `variante` vs `medida` across both breakpoints. Design work on this story is complete — every surface in the table above has a comp or a string table behind it.

### Rules that override any contrary design instinct

1. **The total is a quote reference, not a payable price.** Do not add tax lines, shipping, "Pagar", or anything that reads as a transaction.
2. **Never invent per-medida data.** The variant record has exactly `documentId`, `internalId`, `diameter` and `pricing.price`. No stock badge, no lead time, no image.
3. **Desktop layout must not change.** Any comp or diff that moves, resizes or restyles anything at `md`+ is out of scope and gets rejected. Its footer *wording* is the one exception, settled in D11.
4. **Spanish only, and D11's strings win.** The vocabulary is settled: `medida` in the interface, `variante` only in code. Do not coin synonyms, and do not reintroduce `variante` into user-facing text.

### Implementation-facing constraints

**Breakpoint mechanism.** `src/shared/hooks/useMediaQuery.tsx` is synchronous and *stateless*: it reads `window.matchMedia` during render, returns all-`false` on the server, and **does not update on resize** (documented in its own header comment, and in `ai-skills/REPO_CONTEXT.md:110`, which warns against using it in layout-level components). It is acceptable here because the drawer body only ever renders after a client-side open, and any selection or step change re-renders and re-reads `matchMedia` — but the component must not cache the value. `isMobile` is `(max-width: 767px)`, which lines up with the existing `md:w-[440px]!` on `Drawer.Dialog`, so the flow switches at the same point the drawer stops being full-bleed. The CSS-only alternative (render both trees, toggle with `md:`) was rejected: a two-step flow is state, not presentation, and duplicating the list in the DOM would double the accessible names.

**Accessibility.**
- Step-1 cards are real `<button type="button">` elements with `aria-pressed` reflecting selection, not divs with `onClick`. Accessible name must include the medida, e.g. `Seleccionar 3/8 - 16"`.
- The progress rail is decorative chrome; announce the step change instead via an `aria-live="polite"` region, or move focus to the step-2 heading when the step advances. Do not rely on the coloured rail alone.
- `← Cambiar medidas` is a `<button>` with a text label, not an icon-only control.
- Selected state must not be colour-only: the tinted fill needs the border-weight change (and/or a check glyph) the comp already draws.
- `QuantityStepper` already ships Spanish `Aumentar {label}` / `Disminuir {label}` labels — pass the medida as `label` exactly as the current code does.
- The existing `role="status"` loading and `role="alert"` error bodies must survive the refactor; three tests assert them.

**Visual patterns to preserve.** The comp's palette maps 1:1 onto `DESIGN.md` and introduces **no new token** — every value below already exists in the front-matter scale. HeroUI `Drawer`/`Button`/`NumberField` remain the component system (DESIGN.md:145) — do not hand-roll a card or a stepper. Run `pnpm design:lint` only if `DESIGN.md` itself is edited; this story should not need to edit it.

Brief A's returned light/dark pairs (canonical copy is the token table at the foot of `Variantes mobile.dc.html`):

| Use | Light | Dark |
|---|---|---|
| Drawer surface | `#FFFFFF` white | `#030712` gray-950 |
| Card, unselected — fill / border | `#FFFFFF` / `#E5E7EB` gray-200 | `#111827` gray-900 / `#1F2937` gray-800 |
| Card, selected — fill / border | `#E3FFD6` primary-50 / `#24AD02` primary-400 | `#0F2001` primary-950 / `#4DF527` primary-200 |
| Selection check | `#4DF527` on glyph `#0D3401` | same |
| Medida (card title) | `#111827` gray-900 | `#F3F4F6` gray-100 · `#FFFFFF` when selected |
| Unit price | `#4B5563` gray-600 | `#D1D5DB` gray-300 · `#B4FE99` when selected |
| Internal code | `#9CA3AF` gray-400 | `#9CA3AF` gray-400, selected or not (D12) |
| Rail — inactive / active | `#E5E7EB` / `#4DF527` | `#1F2937` / `#4DF527` |
| Step label — active / inactive | `#0D3401` / `#9CA3AF` | `#B4FE99` / `#9CA3AF` |
| Footer separator | `#E5E7EB` | `#1F2937` |
| Footer summary / total | `#4B5563` / `#111827` | `#9CA3AF` / `#FFFFFF` |
| Primary CTA / hover | `#4DF527`, text `#0D3401` / `#3BD11A` | unchanged from light |
| CTA disabled | `#F3F4F6`, text `#9CA3AF` | `#1F2937`, text `#6B7280` |
| Secondary button (`Reintentar`, `Cerrar`) | border `#E5E7EB`, text `#111827` | border `#374151`, text `#F9FAFB` |
| Stepper track / border | `#FFFFFF` / `#E5E7EB` | `#111827` / `#374151` |
| Loading skeleton | `#E5E7EB` on `#F9FAFB` | `#1F2937` on `#111827` |
| Error glyph | `#C81E1E` on `#F3F4F6` | `#C81E1E` on `#1F2937` |
| Header close button | `#F3F4F6`, glyph `#374151` | `#1F2937`, glyph `#D1D5DB` |

Brief A originally specified `#7FBF63` for the selected card's code text in dark — the one value outside `DESIGN.md`'s front matter. It is **dropped** (D12): the code holds `gray-400` in both themes, selected or not. Every value in the table above is now a `DESIGN.md` token, so this story adds none and needs no `pnpm design:lint` run.

**Content constraints.** Prices come from `formatNumberToCurrency` (`$1,234.50 MXN`, `ai-skills/REPO_CONTEXT.md:184`) — do not re-format in the component. Pluralisation follows the existing footer: `N variante(s) · M pieza(s)`; the comp says `medidas`, which is the better word for a buyer and matches the drawer's own body copy ("Selecciona una o más medidas"), so **`medidas` is the string to ship** — see D3 in the decision record.

**Out of scope.** Desktop layout, upgrade mode, the search-by-medida input from comp `#1a`, the order-sheet numeric inputs from comp `#1c`, any change to `/api/catalog/variants`, any change to the cart store or `CartVariantLine` shape.

### Decision record

- **D1 — Mobile only, JS breakpoint.** The two-step flow applies below `md`; desktop keeps today's layout. Decided; a CSS-only both-trees variant was considered and rejected (see *Breakpoint mechanism*).
- **D2 — Upgrade mode excluded.** `isUpgradeMode` is single-select with one quantity; "pick many, then quantify" is meaningless there, and excluding it leaves the three upgrade-mode tests untouched. Decided.
- **D3 — Copy says `medidas`, not `variantes`.** The comp, and the drawer's existing helper sentence, both call them medidas. ~~Open: should the desktop footer change too, for consistency? Left as-is for now, since AC1 forbids desktop changes.~~ **Superseded:** the desktop footer *should* align, and the exact singular/plural strings for both breakpoints are delegated to Brief B (Q2). AC1 is narrowed accordingly — it freezes the desktop **layout**, not its wording.
- **D4 — Decrement to 0 removes the line.** The comp clamps the stepper at 1 and offers no way to drop a medida from step 2 short of going back to the grid. Passing `minValue={0}` to the existing `QuantityStepper` closes that gap with no new UI. Decided; a per-row trash button was considered and rejected as unnecessary chrome.
- **D5 — No search input on mobile.** Comp `#1a` has one, `#1b` does not. The two-column grid fits 8 medidas on one screen, and today's catalog tops out well below the `pageSize: 100` variant ceiling. Revisit if a product with 30+ medidas ships.
- **D6 — Disabled CTA goes neutral in both themes.** Brief A replaced comp `#1b`'s pale-green disabled fill (`#C6F7B4`) with `gray-100`/`gray-400` light and `gray-800`/`gray-500` dark, and recommended applying it to light too so the themes do not diverge. Accepted: pale green reads as an enabled button at a glance, which is the failure it was flagged for. **This makes the light comp `#1b` stale on exactly one pixel** — implementation follows D6, not the comp, on the disabled state.
- **D7 — Selected card carries a solid check glyph.** Brief A added it so selection survives grayscale, rather than resting on the green fill alone. Accepted — it is the same requirement the accessibility notes already state ("must not be colour-only"), and it applies in both themes.
- **D8 — Quantities are remembered across a step-1 deselect, but reset on a decrement-to-0.** Deselecting from the grid is **free to remember**: `quantities` is pre-seeded for every variant at load (`ProductVariantsDrawer.tsx:81-88`) and deselection never touches it, so a re-selected medida already comes back at its previous value with zero new state and zero extra work. Reset is required only in the AC4 path, where the quantity is literally `0` — leaving it there would make a re-selected medida delete itself on sight. Decided: remember on deselect, write back `1` on removal.
- **D9 — The error body gets a working `Reintentar`.** Accepted from Brief A (open question IV). `loadProductData` lifts out of the `state.isOpen` effect so the button can re-invoke it; the loading state returns while it runs. This is the story's only piece of genuinely new behaviour.
- **D10 — Two columns at every phone width, with width-stepped padding and type.** Brief B (`3a`–`3d`) rejected a one-column fallback outright. The grid adapts by shrinking its chrome, not its column count:

  | | 320px | 360px | 390px (comp `#1b`) |
  |---|---|---|---|
  | Drawer side padding | 16px | 20px | 22px |
  | Card width (gap 10px) | 139px | 155px | 168px |
  | Medida / price / code type | 14 / 12 / 9px | 14 / 13 / 10px | 15 / 13 / 10px |
  | Helper sentence | `Toca todas las medidas que necesites.` | full sentence | full sentence |

  The 320px column drops the helper sentence's second clause (`Las cantidades van en el siguiente paso.`) to buy back a line. Touch targets stay ≥44px at every width. Card min-height 74px is unchanged.
- **D15 — The rename covers every user-facing string, the WhatsApp message included.** Seven call sites: `ProductVariantsDrawer.tsx` (kicker, loading, empty, error, footer, CTA, toast), `ProductCard.tsx:68-69,74-75`, `CatalogHero.tsx:28`, `QuoteLineRow.tsx:141`, and `whatsapp-message.utils.ts:47,77`. The "the seller may prefer `variante`" argument was raised and overruled — one word for one concept. `variante` stays only in code: `ProductVariant`/`ProductVariantUI`/`CartVariantLine`, `selectedVariantIds`, the `/api/catalog/variants` route, and the `product_variants` GraphQL field. No identifier is renamed and no route changes.
- **D12 — No token is added; the internal code stays `gray-400` when selected.** `#7FBF63` was the one value in Brief A's table outside `DESIGN.md`. Dropped rather than adopted: `primary-100` would collide with the selected price colour, and `gray-400` is already what the light theme keeps on selection. Selected dark card now reads title `#FFFFFF`, price `#B4FE99`, code `#9CA3AF`.
- **D13 — The loading and empty strings follow D11.** `Cargando medidas...` and `No encontramos medidas para este producto.` Artboards `2d`/`2e`/`2h`/`2i` still read `variantes` only because Brief A predates the vocabulary decision — Brief A's own error copy already says `medidas`, so this makes it consistent with itself rather than overriding it. One word in each string.
- **D14 — The error body keeps the typed message.** Brief A's two-line shape is kept, with line 1 bound to the existing dynamic message (`catalogErrorToSpanish(code)`, falling back to the generic string) and line 2 fixed as `Revisa tu conexión e inténtalo de nuevo.` `docs/IMPLEMENTATION_GUIDELINES.md:57` argues for specific messages over generic ones; the design's fixed headline can only be the untyped fallback.
- **D11 — `medida` in the interface, `variante` only in code.** Brief B's exact strings, to ship verbatim:

  | Case | Desktop footer | Mobile step 1 | Mobile step 2 |
  |---|---|---|---|
  | none | `Ninguna medida seleccionada` | `Ninguna medida seleccionada` | n/a (step 2 requires ≥1) |
  | one | `1 medida · 1 pieza` | `1 medida elegida` | `1 medida · 1 pieza` |
  | one, several pieces | `1 medida · 7 piezas` | `1 medida elegida` | `1 medida · 7 piezas` |
  | several | `3 medidas · 7 piezas` | `3 medidas elegidas` | `3 medidas · 7 piezas` |
  | CTA, none | `Agregar al carrito` (disabled) | `Continuar a cantidades` (disabled) | — |
  | CTA, one | `Agregar 1 medida al carrito` | `Continuar a cantidades` | `Agregar 1 medida al carrito` |
  | CTA, several | `Agregar 3 medidas al carrito` | `Continuar a cantidades` | `Agregar 3 medidas al carrito` |

  Note the CTA gains the noun — today it reads `Agregar 3 al carrito`. Also changed: the drawer kicker `SELECCIONAR VARIANTES` → `SELECCIONAR MEDIDAS`. Unchanged: the helper sentence, and the desktop `DIÁMETRO` column header.

---

## Technical Research

### Affected areas

| Area | Path | Change |
|---|---|---|
| Feature UI | `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` | The whole story lives here |
| Shared hook | `src/shared/hooks/useMediaQuery.tsx` | Consumed, not modified |
| Shared atom | `src/shared/ui/atoms/QuantityStepper.tsx` | Consumed with `minValue={0}`; the prop already exists, no change needed |
| Constants | `src/shared/constants/cart.constants.ts` | Read-only (`CART_MIN_QUANTITY = 1`, `CART_MAX_QUANTITY = 100`, `CART_MAX_LINES = 100`) |
| Shared product card | `src/components/ProductCard.tsx` | Four copy strings (D11/D15), no layout change |
| Hero copy | `src/features/Home/CatalogHero.tsx` | One word (D15) |
| Quote line row | `src/features/QuotePage/QuoteLineRow.tsx` | `Sin variante seleccionada` → `Sin medida seleccionada` (D15) |
| WhatsApp message | `src/shared/utils/whatsapp-message.utils.ts` | Two strings, seller-facing (D15) |
| Tests | `__tests__/product-variants/ProductVariantsDrawer.test.tsx` | New mobile-path describe block |
| Tests (copy) | All seven suites matching `grep -rn "variante" __tests__/` | Assertions matching the renamed strings |

Not touched: routes under `src/app/**`, the `/api/catalog/variants` handler, `src/shared/lib/global.lib.ts`, the cart store, Apollo queries. Note that D15's rename is **strings only** — it reaches four extra files but changes no identifier, no route, no type and no stored cart shape.

### Current component, as it stands

`ProductVariantsDrawer.tsx` (312 lines) holds:

- `variants: ProductVariantUI[]` — fetched on open from `GET /api/catalog/variants?documentId=...`, mapped to `{ documentId, internalId, diameter, price, priceFormatted }`, sorted by `price` ascending.
- `selectedVariantIds: Set<string>` — keyed by `documentId`, never by index or `internalId` (`ai-skills/REPO_CONTEXT.md:186`).
- `quantities: Record<string, number>` — **pre-seeded to `initialQuantity ?? 1` for every variant** on load, not just selected ones (`ProductVariantsDrawer.tsx:81-88`). This is convenient for 1B: a step-1 tap already has a quantity of 1 waiting in step 2 without extra bookkeeping.
- `isLoading` / `errorMessage` — mutually exclusive bodies rendered before the list.
- `resetVariants()` runs on close and on the `state.isOpen` effect's else branch. **A new `step` state must be reset there**, otherwise reopening lands the user on step 2.
- `handleAdd()` branches on `isUpgradeMode`, builds `CartVariantLine[]` from the selected set, calls `addVariantLines`, and toasts either the `CART_MAX_LINES` rejection or an `N variante(s) agregada(s)` success. This function is step-agnostic and should not need to change.
- `selectedTotal` / `selectedPieces` are already derived from `selectedVariantIds` + `quantities` — both footers reuse them as-is.

### Existing patterns to follow

- **The file carries no `"use client"` directive** and works only because every importer is a client component (`ai-skills/REPO_CONTEXT.md:326`). Adding `useMediaQuery` (which is `"use client"`) does not change that, but do not add a new server-side importer.
- HeroUI v3 compound components (`Drawer.Header` / `Drawer.Body` / `Drawer.Footer`, `Button`, `NumberField` via `QuantityStepper`) — no parallel component system (`DESIGN.md:145,151`).
- Tailwind v4 utility classes with the `dark:` variant; no bespoke CSS.
- `docs/IMPLEMENTATION_GUIDELINES.md`: curly braces on every one-line `if`, multi-line object literals from functions, specific user-facing error copy.

### Integration points

The drawer has four importers — three in default mode, one in upgrade mode:

| Importer | Mode | Affected? |
|---|---|---|
| `src/features/Home/Home.tsx` | default | Yes (mobile) |
| `src/features/CategoryPage/CategoryPage.tsx` | default | Yes (mobile) |
| `src/features/BrandPage/BrandPage.tsx` | default | Yes (mobile) |
| `src/features/QuotePage/QuotePage.tsx` | upgrade (`onConfirmVariant`) | No — D2 |

No prop signature change is required: the step flow is internal state, and the mode is already derivable from `isUpgradeMode`. That is deliberate — three call sites stay untouched.

### Testing

`__tests__/product-variants/ProductVariantsDrawer.test.tsx` holds 16 tests across two describes (13 default-mode, 3 upgrade-mode). **All 16 keep passing unchanged**, because `jest.setup.ts` shims `window.matchMedia` to `{ matches: false, ... }` for every query — so `useMediaQuery()` reports `isMobile: false` and every existing test exercises the desktop branch. That makes them the desktop-no-regression suite for free.

The mobile path therefore needs its own coverage, with `window.matchMedia` overridden per-test to return `matches: true` for `(max-width: 767px)`. Minimum set:

- Step 1 renders medida cards with no stepper; CTA reads `Continuar a cantidades` and is disabled with nothing selected.
- Selecting two medidas and continuing shows exactly those two in step 2, each with a stepper.
- `← Cambiar medidas` returns to step 1 with the selection intact.
- Decrementing a step-2 medida to 0 removes it; removing the last one returns to step 1 (AC4).
- Adding from step 2 produces the same `CartVariantLine[]` the desktop test asserts (AC3).
- Loading / error / empty bodies still render on the mobile branch, with `role="status"` and `role="alert"` intact (AC5).
- Deselecting a medida in step 1 and re-selecting it restores its previous quantity; removing it via decrement-to-0 and re-selecting it restores `1` (D8).
- A failed fetch followed by pressing `Reintentar` re-requests and renders the variants (D9).

**The D11/D15 rename reaches every suite.** `grep -rn "variante" __tests__/` returns 19 matches across seven files — `product-variants/ProductVariantsDrawer`, `product-listing/ProductCard`, `home/Home`, `category-page/CategoryPage`, `brand-page/BrandPage`, `cart/whatsapp-message.utils`, `quote/revalidation` — and under D15 **all seven** need their assertions updated. This is mechanical but it is the widest blast radius in the story, so run the full `pnpm test` after the rename, not the targeted file. Landing the rename as its own commit ahead of the layout work keeps the two diffs reviewable.

Rules for writing them are canonical in `docs/UNIT_TESTING_GUIDELINES.md` — follow it, do not restate it here. Run targeted: `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx`.

### Verification

- `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx` — targeted
- `pnpm test` — full suite with coverage
- `pnpm exec tsc --noEmit` and `pnpm lint`
- `pnpm build` before opening the PR
- Manual: `pnpm dev`, open `/` at a 390px viewport in **both themes** — the dark path is now half the visual scope, so a light-only pass is not a pass. Exercise both steps plus the loading, error and empty bodies. Per the user's standing preference, each implementation phase is dev-server-validated; only the click-through and layout judgement stay manual.
- PR targets `develop` and needs exactly one of `major` / `minor` / `patch` — `minor` fits (new mobile flow, no breaking prop change). Do not hand-edit `package.json` or `CHANGELOG.md`.

### Edge cases and constraints

- **Reopening the drawer** must land on step 1 — `resetVariants()` is the single place to guarantee it.
- **Switching product** while the drawer is open is already guarded by the `isActive` flag in the fetch effect; the step state must reset with it.
- **Zero variants** drops the progress rail entirely (artboard `2h`) — there are no steps to walk. The **error** body keeps the rail but inert, and the **loading** body keeps it inert too (`2d`), so only the empty case removes it. Do not collapse these three into one "no rail" branch.
- **Drawer height must not jump** when the skeleton is replaced by real data (`2d`'s stated goal). Six skeleton cards approximate a typical 8-medida grid; the body is already `flex-1` with its own scroll, so this is about the skeleton filling that area rather than about measuring anything.
- **A single medida** still goes through both steps. Auto-advancing when exactly one is selected was considered and rejected: it makes the CTA's meaning depend on invisible state.
- **`minValue={0}` vs `CART_MIN_QUANTITY = 1`.** The constant stays 1 and keeps guarding the cart store; the `0` floor is a drawer-local affordance meaning "remove", and a removed medida never reaches `handleAdd` because it leaves `selectedVariantIds`. Re-selecting it in step 1 must restore its quantity to 1, not 0 — the `quantities` entry has to be rewritten on removal (D8).
- **`QuantityStepper` `NaN` guard.** Clearing the input fires `onChange(NaN)`, which the atom already swallows with a `console.warn`. A cleared field therefore does *not* remove the medida — only an explicit decrement to 0 does. Worth an assertion.
- **`useMediaQuery` does not react to resize.** Rotating a phone across 767px mid-flow leaves the previous branch rendered until the next state change. Accepted; noted here so it is not rediscovered as a bug.
- **Long `diameter` strings** (e.g. `1/2  -13"`, which carries a double space in the real data) must not break the two-column grid — the card needs to wrap, not overflow.

---

## Open Questions

### UI/product decisions

- **I: Question:** Should the step-1 grid stay two columns at every phone width, or drop to one column on very narrow devices (≤ 360px)?
  **Status:** answered (Brief B, Q1 — artboards `3a`–`3d`)
  **Answer:** Two columns at **both** widths. The grid never drops to one column. See D10 for the padding/type adjustments.
  **Context:** Brief B's reasoning: the longest real medida is 11 characters and the highest price `$1,089.19`, so at 16px side padding and a 14/12/9 type scale a 139px card still holds all three lines unbroken at 320px. Dropping to one column would surrender the whole point of the grid — 8 medidas on one screen — and buy nothing, because *"el problema en 320 px es el ancho de la tarjeta, no el del texto."*

- **II: Question:** Should the desktop footer copy also change from `variante(s)` to `medida(s)` for consistency?
  **Status:** answered (Brief B, Q2)
  **Answer:** Yes — `medida` in the whole interface, `variante` only in code. Full string table in D11. The desktop footer keeps its position, size and style; only its words change.
  **Context:** Brief B also ruled on the surrounding labels: the helper sentence *"Selecciona una o más medidas e indica cuántas piezas necesitas de cada una."* is already correct and does not change; the desktop `DIÁMETRO` column header stays (*"nombra el dato, no la entidad"*); the drawer kicker and two `ProductCard` strings do change. That last part reaches outside the drawer — see open question VII.

- **III: Question:** When the user returns to step 1 via `← Cambiar medidas` and deselects a medida that already had a quantity of 5, should that quantity be remembered if they re-select it in the same session?
  **Status:** answered
  **Answer:** Yes, remember it — but reset to `1` when the medida was removed by decrementing to `0`. See D8.
  **Context:** The user's condition was "do it if it's easy and costs nothing in performance or UX". It is easier than *not* doing it: `quantities` is already seeded for every variant on load and deselection never clears it, so remembering is the existing behaviour and requires no new state, no new map, and no extra render. Only the AC4 removal path needs an explicit write-back, and that write is required for correctness regardless.

- **IV: Question:** Should the error body gain a working `Reintentar` button, as Brief A designed?
  **Status:** answered
  **Answer:** Yes. Artboards `2f`/`2g` ship with a working retry. See D9.
  **Context:** New behaviour, not a restyle — there is no retry path in the drawer today. `loadProductData` is already a named function inside the `state.isOpen` effect; retry means lifting it into a `useCallback` (or a bumped attempt counter in the dependency array) so the button can re-invoke it. It needs its own test: failing fetch → press `Reintentar` → second fetch resolves → variants render.

- **V: Question:** Is `#7FBF63` acceptable as the selected-card code-text colour in dark mode, or should it be approximated from an existing token?
  **Status:** answered
  **Answer:** No new token. The internal code stays `gray-400` (`#9CA3AF`) whether the card is selected or not, in both themes. See D12.
  **Context:** `DESIGN.md` is the token set, and `#7FBF63` is not in it. `primary-100` (`#B4FE99`) was the obvious substitute but it is already the *price* colour on a selected dark card, so reusing it would flatten the price/code hierarchy the design draws. `gray-400` is what the code already is when unselected, and what Brief A's own **light** column keeps on selection — so holding it in dark makes the two themes agree rather than diverge. No `DESIGN.md` edit, no `pnpm design:lint` run.

### Content

- **VI: Question:** How does Brief A's fixed error copy reconcile with `catalogErrorToSpanish(code)`?
  **Status:** pending
  **Context:** Artboards `2f`/`2g` show `No pudimos cargar las medidas.` over `Revisa tu conexión e inténtalo de nuevo.` But the component already renders a *typed* message for known catalog failure codes and only falls back to a generic string otherwise. The proposal here — and what the doc assumes unless overruled — is that the design's two-line shape is kept, with line 1 bound to the dynamic message and line 2 fixed as the guidance line. `docs/IMPLEMENTATION_GUIDELINES.md:57` argues for specific messages over generic ones, which supports keeping the typed message visible.

- **VII: Question:** How far past the drawer does D11's `variante` → `medida` rename go?
  **Explanation:** Brief B named three strings outside `ProductVariantsDrawer.tsx`, all in `src/components/ProductCard.tsx` — `Explorar las 8 variantes` → `medidas` (line 68), `Ver variantes` (line 69), and the `1 variante` / `N variantes` counter (lines 74-75). But `variante` is also user-facing in four more places the brief never saw: `src/features/Home/CatalogHero.tsx:28` (hero copy), `src/features/QuotePage/QuoteLineRow.tsx:141` (`Sin variante seleccionada`), and `src/shared/utils/whatsapp-message.utils.ts:47,77` (the message sent to the seller).
  **Status:** answered
  **Answer:** Everywhere user-facing. All seven call sites are renamed, including the WhatsApp message. See D15.
  **Context:** A narrower drawer-plus-`ProductCard` boundary was offered and declined: one word for one concept, with no surface left saying the other. `variante` survives only in code — type names (`ProductVariant`, `ProductVariantUI`, `CartVariantLine`), state (`selectedVariantIds`), the API route `/api/catalog/variants`, and the GraphQL field `product_variants` — none of which the buyer or the seller ever reads.

- **VIII: Question:** Do the loading and empty strings follow D11 too?
  **Status:** answered
  **Answer:** Yes — `Cargando medidas...` and `No encontramos medidas para este producto.` See D13.
  **Explanation:** Brief A and Brief B disagree. Artboards `2d`/`2e` keep `Cargando variantes...` and `2h`/`2i` keep `No encontramos variantes para este producto.`, because Brief A was written before the vocabulary was settled — yet Brief A's own *error* copy already says `No pudimos cargar las medidas.` D11's principle says all three should say `medidas`. The drawer would otherwise use both words in three consecutive states.
  **Context:** Recommendation: apply D11 — `Cargando medidas...` and `No encontramos medidas para este producto.` This is a one-word edit in each, and it is the reading that makes Brief A internally consistent with itself.

### Verification

- **IX: Question:** Is a screenshot in `comps/` expected for this story before implementation, following the `brief-N` convention already in that directory?
  **Status:** answered
  **Answer:** Yes — capture and file the artboards before planning, so the plan can reference local paths instead of the design project.
  **Context:** `comps/` holds top-level `brief-1`…`brief-4` from earlier stories, plus `comps/cart-quote-whatsapp/brief-5/` scoped to that epic. `brief-5` is therefore taken. This is a standalone story, so it gets its own folder: `comps/variants-drawer-mobile-two-step/brief-a/` and `.../brief-b/`, named for the briefs rather than a global counter. `/check-design` is the command that files them.
M
### Strapi contract

- None. This story adds no query, no field, and no new variant data. The existing `product { product_variants }` path with `pageSize: 100` is sufficient.

---

## Assumptions

1. The design project's panel `#1b` is authoritative for layout, spacing and colour on the light theme; the dark theme is derived from `DESIGN.md` tokens (Brief A).
2. "Mobile" means the existing `useMediaQuery().isMobile` (`max-width: 767px`), matching the drawer's own `md:` width switch.
3. Selection order in step 2 follows the price-ascending order the variants are already sorted in, not tap order.
4. `medidas` is buyer-facing copy for what the code calls variants; no code identifier is renamed.
