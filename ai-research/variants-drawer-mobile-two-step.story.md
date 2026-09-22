# Variants drawer — two-step mobile flow (design option 1B)

**Status:** research complete, awaiting sign-off
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

1. **AC1 — Two-step on mobile only.** Below the `md` breakpoint (`max-width: 767px`) the drawer's default (add-to-cart) mode renders step 1 (medida grid) and step 2 (quantity list). At `md` and above the drawer renders exactly the layout it renders today, with no extra step, no progress rail, and no CTA relabel.
2. **AC2 — Step 1 selects, step 2 quantifies.** In step 1 a tap on a medida card toggles its selection (selected card = primary border + tinted fill) and no quantity control is visible. Step 2 lists only selected medidas, each with a `QuantityStepper`, plus a `← Cambiar medidas` control that returns to step 1 preserving the current selection and quantities.
3. **AC3 — Footer reflects the step.** Step 1's footer shows the selected-medida count and a CTA reading `Continuar a cantidades`, disabled while nothing is selected. Step 2's footer shows the `N medidas · M piezas` summary, the MXN total via `formatNumberToCurrency`, and the existing `Agregar al carrito` CTA. Adding to the cart produces exactly the same `CartVariantLine[]` as the desktop path does today.
4. **AC4 — Decrementing to 0 drops the medida.** In step 2 the stepper's floor is `0`; reaching `0` removes that medida from the selection and from the step-2 list. When the last one is removed the drawer returns to step 1 with the CTA disabled.
5. **AC5 — Upgrade mode and non-happy states are untouched.** `/cotizar`'s `onConfirmVariant` (upgrade) mode keeps its current single-select layout at every breakpoint. The loading (`role="status"`), error (`role="alert"`) and empty-result bodies render as they do today, before any step chrome, at every breakpoint.

### Task breakdown

| # | Task | Notes |
|---|---|---|
| 1 | Add a `step` state and breakpoint branch to `ProductVariantsDrawer.tsx` | Gate on `isUpgradeMode === false && isMobile`; reset `step` to 1 in `resetVariants` |
| 2 | Build the step-1 medida grid | `grid-cols-2`, tap-to-toggle buttons, no stepper |
| 3 | Build the step-2 quantity list | Reuses `QuantityStepper` with `minValue={0}` |
| 4 | Progress rail + step-aware footer (summary, total, CTA label, disabled state) | |
| 5 | Tests for the mobile path | Existing 16 tests keep covering desktop for free — see *Testing* below |

Single story. 1–2 implementation phases. Not an epic.

---

## Design Agent Handoff

### User goal, and what this is not

A buyer on a phone needs to tell Tehesa *which medidas of one product, and how many pieces of each*, and get them into the quote list. The drawer is a **quote-line builder**, not a checkout: the total it shows is a reference amount for the quote request, never a price the buyer is committing to pay. Nothing in this story adds stock levels, delivery estimates, payment, or a per-medida product image — the catalog has none of those and inventing them in a comp will produce ACs that cannot be implemented.

### Surface index

| Surface | File | States | Story | Covered by |
|---|---|---|---|---|
| Step 1 — medida grid (mobile) | `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` | none selected · ≥1 selected | this story | comp `#1b` (light) + Brief A (dark) |
| Step 2 — quantity list (mobile) | same | 1 medida · several · last one decremented to 0 | this story | comp `#1b` (light) + Brief A (dark) |
| Progress rail + footer | same | step 1 (no total, `Continuar a cantidades`) · step 2 (total, `Agregar al carrito`) | this story | comp `#1b` (light) + Brief A (dark) |
| Loading / error / empty body | same | `role="status"` · `role="alert"` · no-variants copy | this story | **undesigned** — Brief A |
| Desktop variant rows | same | unchanged | — | out of scope, must not regress |
| Upgrade mode (`/cotizar`) | same | unchanged | — | out of scope, must not regress |

The comp `#1b` is already a complete design for the light-theme happy path, so **no design agent is needed to invent this layout** — implementation reads the comp. Brief A exists only for the two genuine gaps the comp does not cover (dark theme, and the loading/error/empty bodies).

### Rules that override any contrary design instinct

1. **The total is a quote reference, not a payable price.** Do not add tax lines, shipping, "Pagar", or anything that reads as a transaction.
2. **Never invent per-medida data.** The variant record has exactly `documentId`, `internalId`, `diameter` and `pricing.price`. No stock badge, no lead time, no image.
3. **Desktop must not change.** Any comp or diff that alters the `md`+ layout is out of scope and gets rejected.
4. **Spanish only, and the existing strings win.** Reuse the app's wording (`Agregar al carrito`, `Cerrar`, `Cargando variantes...`) rather than coining synonyms.

### Implementation-facing constraints

**Breakpoint mechanism.** `src/shared/hooks/useMediaQuery.tsx` is synchronous and *stateless*: it reads `window.matchMedia` during render, returns all-`false` on the server, and **does not update on resize** (documented in its own header comment, and in `ai-skills/REPO_CONTEXT.md:110`, which warns against using it in layout-level components). It is acceptable here because the drawer body only ever renders after a client-side open, and any selection or step change re-renders and re-reads `matchMedia` — but the component must not cache the value. `isMobile` is `(max-width: 767px)`, which lines up with the existing `md:w-[440px]!` on `Drawer.Dialog`, so the flow switches at the same point the drawer stops being full-bleed. The CSS-only alternative (render both trees, toggle with `md:`) was rejected: a two-step flow is state, not presentation, and duplicating the list in the DOM would double the accessible names.

**Accessibility.**
- Step-1 cards are real `<button type="button">` elements with `aria-pressed` reflecting selection, not divs with `onClick`. Accessible name must include the medida, e.g. `Seleccionar 3/8 - 16"`.
- The progress rail is decorative chrome; announce the step change instead via an `aria-live="polite"` region, or move focus to the step-2 heading when the step advances. Do not rely on the coloured rail alone.
- `← Cambiar medidas` is a `<button>` with a text label, not an icon-only control.
- Selected state must not be colour-only: the tinted fill needs the border-weight change (and/or a check glyph) the comp already draws.
- `QuantityStepper` already ships Spanish `Aumentar {label}` / `Disminuir {label}` labels — pass the medida as `label` exactly as the current code does.
- The existing `role="status"` loading and `role="alert"` error bodies must survive the refactor; three tests assert them.

**Visual patterns to preserve.** The comp's palette maps 1:1 onto `DESIGN.md`: selected border `#24AD02` = `primary-400` (DESIGN.md:12), selected fill `#E3FFD6` = `primary-50` (DESIGN.md:6), rail fill `#4DF527` = `primary-200` (DESIGN.md:9), CTA text `#0D3401` = `on-primary` (DESIGN.md:18), the unselected border/greys are the Tailwind grey ramp (DESIGN.md:25-34). No new token is required. HeroUI `Drawer`/`Button`/`NumberField` remain the component system (DESIGN.md:145) — do not hand-roll a card or a stepper. Run `pnpm design:lint` only if `DESIGN.md` itself is edited; this story should not need to edit it.

**Content constraints.** Prices come from `formatNumberToCurrency` (`$1,234.50 MXN`, `ai-skills/REPO_CONTEXT.md:184`) — do not re-format in the component. Pluralisation follows the existing footer: `N variante(s) · M pieza(s)`; the comp says `medidas`, which is the better word for a buyer and matches the drawer's own body copy ("Selecciona una o más medidas"), so **`medidas` is the string to ship** — see D3 in the decision record.

**Out of scope.** Desktop layout, upgrade mode, the search-by-medida input from comp `#1a`, the order-sheet numeric inputs from comp `#1c`, any change to `/api/catalog/variants`, any change to the cart store or `CartVariantLine` shape.

### Decision record

- **D1 — Mobile only, JS breakpoint.** The two-step flow applies below `md`; desktop keeps today's layout. Decided; a CSS-only both-trees variant was considered and rejected (see *Breakpoint mechanism*).
- **D2 — Upgrade mode excluded.** `isUpgradeMode` is single-select with one quantity; "pick many, then quantify" is meaningless there, and excluding it leaves the three upgrade-mode tests untouched. Decided.
- **D3 — Copy says `medidas`, not `variantes`.** The comp, and the drawer's existing helper sentence, both call them medidas. The footer string changes on the mobile path. Open: should the desktop footer change too, for consistency? Left as-is for now, since AC1 forbids desktop changes.
- **D4 — Decrement to 0 removes the line.** The comp clamps the stepper at 1 and offers no way to drop a medida from step 2 short of going back to the grid. Passing `minValue={0}` to the existing `QuantityStepper` closes that gap with no new UI. Decided; a per-row trash button was considered and rejected as unnecessary chrome.
- **D5 — No search input on mobile.** Comp `#1a` has one, `#1b` does not. The two-column grid fits 8 medidas on one screen, and today's catalog tops out well below the `pageSize: 100` variant ceiling. Revisit if a product with 30+ medidas ships.

---

## Technical Research

### Affected areas

| Area | Path | Change |
|---|---|---|
| Feature UI | `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` | The whole story lives here |
| Shared hook | `src/shared/hooks/useMediaQuery.tsx` | Consumed, not modified |
| Shared atom | `src/shared/ui/atoms/QuantityStepper.tsx` | Consumed with `minValue={0}`; the prop already exists, no change needed |
| Constants | `src/shared/constants/cart.constants.ts` | Read-only (`CART_MIN_QUANTITY = 1`, `CART_MAX_QUANTITY = 100`, `CART_MAX_LINES = 100`) |
| Tests | `__tests__/product-variants/ProductVariantsDrawer.test.tsx` | New mobile-path describe block |

Not touched: routes under `src/app/**`, the `/api/catalog/variants` handler, `src/shared/lib/global.lib.ts`, the cart store, Apollo queries.

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
- Loading / error / empty bodies still render on the mobile branch (AC5).

Rules for writing them are canonical in `docs/UNIT_TESTING_GUIDELINES.md` — follow it, do not restate it here. Run targeted: `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx`.

### Verification

- `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx` — targeted
- `pnpm test` — full suite with coverage
- `pnpm exec tsc --noEmit` and `pnpm lint`
- `pnpm build` before opening the PR
- Manual: `pnpm dev`, open `/` at a 390px viewport in both themes, exercise both steps. Per the user's standing preference, each implementation phase is dev-server-validated; only the click-through and layout judgement stay manual.
- PR targets `develop` and needs exactly one of `major` / `minor` / `patch` — `minor` fits (new mobile flow, no breaking prop change). Do not hand-edit `package.json` or `CHANGELOG.md`.

### Edge cases and constraints

- **Reopening the drawer** must land on step 1 — `resetVariants()` is the single place to guarantee it.
- **Switching product** while the drawer is open is already guarded by the `isActive` flag in the fetch effect; the step state must reset with it.
- **Zero variants / fetch error** short-circuit before any step chrome — no progress rail over an error message.
- **A single medida** still goes through both steps. Auto-advancing when exactly one is selected was considered and rejected: it makes the CTA's meaning depend on invisible state.
- **`minValue={0}` vs `CART_MIN_QUANTITY = 1`.** The constant stays 1 and keeps guarding the cart store; the `0` floor is a drawer-local affordance meaning "remove", and a removed medida never reaches `handleAdd` because it leaves `selectedVariantIds`. Re-selecting it in step 1 must restore its quantity to 1, not 0 — the `quantities` entry has to be rewritten on removal or on re-selection.
- **`QuantityStepper` `NaN` guard.** Clearing the input fires `onChange(NaN)`, which the atom already swallows with a `console.warn`. A cleared field therefore does *not* remove the medida — only an explicit decrement to 0 does. Worth an assertion.
- **`useMediaQuery` does not react to resize.** Rotating a phone across 767px mid-flow leaves the previous branch rendered until the next state change. Accepted; noted here so it is not rediscovered as a bug.
- **Long `diameter` strings** (e.g. `1/2  -13"`, which carries a double space in the real data) must not break the two-column grid — the card needs to wrap, not overflow.

---

## Open Questions

### UI/product decisions

- **I: Question:** Should the step-1 grid stay two columns at every phone width, or drop to one column on very narrow devices (≤ 360px)?
  **Status:** pending
  **Context:** The comp is drawn at 390px with a 2-column grid and 74px min-height cards. At 320px each card is ~140px wide and a medida like `5/16 - 18"` plus its price may wrap to three lines.

- **II: Question:** Should the desktop footer copy also change from `variante(s)` to `medida(s)` for consistency?
  **Status:** pending
  **Explanation:** D3 settled the mobile string. AC1 forbids desktop changes, so this is deliberately deferred rather than decided.

- **III: Question:** When the user returns to step 1 via `← Cambiar medidas` and deselects a medida that already had a quantity of 5, should that quantity be remembered if they re-select it in the same session?
  **Status:** pending
  **Context:** Interacts with the AC4 removal reset. Cheapest behaviour is "always back to 1"; remembering it is friendlier but needs a separate map.

### Verification

- **IV: Question:** Is a screenshot in `comps/` expected for this story before implementation, following the `brief-N` convention already in that directory?
  **Status:** pending
  **Context:** `comps/` holds `brief-1`…`brief-4` plus loose `{mobile,desktop}-*-brief-4.png` files from the cart-quote epic. `/check-design` is the command that files them.

### Strapi contract

- None. This story adds no query, no field, and no new variant data. The existing `product { product_variants }` path with `pageSize: 100` is sufficient.

---

## Assumptions

1. The design project's panel `#1b` is authoritative for layout, spacing and colour on the light theme; the dark theme is derived from `DESIGN.md` tokens (Brief A).
2. "Mobile" means the existing `useMediaQuery().isMobile` (`max-width: 767px`), matching the drawer's own `md:` width switch.
3. Selection order in step 2 follows the price-ascending order the variants are already sorted in, not tap order.
4. `medidas` is buyer-facing copy for what the code calls variants; no code identifier is renamed.
