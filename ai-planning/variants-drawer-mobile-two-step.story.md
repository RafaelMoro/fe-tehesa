# Plan — Variants drawer: two-step mobile flow (design option 1B)

**Source research:** `ai-research/variants-drawer-mobile-two-step.story.md`
**Research status:** sign-offed — "research complete — all design answered, all open questions closed" (2026-09-22)
**Branch:** `fix/home-product-variant-drawer-ui` · PR targets `develop`, label `minor`

### Assumptions carried into this plan

1. **OQ VI is closed by D14.** The error body keeps the *typed* message (`catalogErrorToSpanish(code)`, generic fallback) as line 1 and adds the fixed line 2 `Revisa tu conexión e inténtalo de nuevo.` The research doc still marks VI `pending` but D14 states the resolution and `docs/IMPLEMENTATION_GUIDELINES.md:57` backs it. Planned as decided; no further design round.
2. **OQ X is an empirical check inside Phase 2, not a blocker.** D10's two-column grid is provisional against the real cutter×shank `diameter` strings (`1/8 X 3/8"`). Phase 2's manual step checks it at 320px; if it fails, the fallback is a smaller medida type step at 320px and/or a taller card allowing a two-line medida — **not** a column drop (that would need design input and a new story).
3. The comps are authoritative for **layout/spacing/colour**; the decision record is authoritative for **states/strings/behaviour** (research doc's IMPORTANT callout). D6, D7, D4/D8, D11/D15 and D10 override comp `#1b`; D13 overrides artboards `2d`/`2e`/`2h`/`2i`.
4. `isMobile` is read fresh on every render from `useMediaQuery()` — never cached in state, never in a `useMemo`.

---

## Acceptance Criteria

Copied verbatim from the research doc:

1. **AC1 — Two-step on mobile only.** Below the `md` breakpoint (`max-width: 767px`) the drawer's default (add-to-cart) mode renders step 1 (medida grid) and step 2 (quantity list). At `md` and above the drawer renders exactly the **layout** it renders today, with no extra step and no progress rail. Its footer and CTA wording do change, per D11 — that is copy, not layout.
2. **AC2 — Step 1 selects, step 2 quantifies.** In step 1 a tap on a medida card toggles its selection (selected card = primary border + tinted fill) and no quantity control is visible. Step 2 lists only selected medidas, each with a `QuantityStepper`, plus a `← Cambiar medidas` control that returns to step 1 preserving the current selection and quantities. The grid is **two columns at every phone width** — 320px included — adapting via D10's padding and type steps rather than by dropping to one column.
3. **AC3 — Footer reflects the step, in D11's words.** Step 1's footer shows the selected-medida count and a CTA reading `Continuar a cantidades`, disabled while nothing is selected. Step 2's footer shows the `N medidas · M piezas` summary, the MXN total via `formatNumberToCurrency`, and an `Agregar N medida(s) al carrito` CTA. Every count string — mobile and desktop, singular and plural — matches D11's table exactly. Adding to the cart produces exactly the same `CartVariantLine[]` as the desktop path does today.
4. **AC4 — Decrementing to 0 drops the medida.** In step 2 the stepper's floor is `0`; reaching `0` removes that medida from the selection and from the step-2 list. When the last one is removed the drawer returns to step 1 with the CTA disabled.
5. **AC5 — Upgrade mode untouched; non-happy states follow Brief A.** `/cotizar`'s `onConfirmVariant` (upgrade) mode keeps its current single-select layout at every breakpoint. On the mobile path the loading, error and empty bodies replace the step content and follow artboards `2d`–`2i`: loading is a six-card skeleton in the step-1 grid shape with the rail inert and the footer disabled; error is a neutral two-line body with a `Reintentar` control and no red panel; empty drops the rail entirely and swaps the green CTA for a bordered `Cerrar`. Their existing semantics survive — `role="status"` on loading, `role="alert"` on error — and the drawer height must not jump when data arrives.

---

## Affected files

| Area | Path | Phase |
|---|---|---|
| `src/features/**` | `ProductVariantsDrawer/ProductVariantsDrawer.tsx` | 1 (strings), 2 (step flow), 3 (non-happy states) |
| `src/features/**` | `Home/CatalogHero.tsx` | 1 |
| `src/features/**` | `QuotePage/QuoteLineRow.tsx` | 1 |
| `src/components/**` | `ProductCard.tsx` | 1 |
| `src/shared/**` | `utils/whatsapp-message.utils.ts` | 1 |
| `src/shared/**` | `hooks/useMediaQuery.tsx`, `ui/atoms/QuantityStepper.tsx`, `constants/cart.constants.ts` | consumed only — **not modified** |
| Tests | `__tests__/product-variants/ProductVariantsDrawer.test.tsx` | 1, 2, 3 |
| Tests (copy) | `__tests__/{product-listing/ProductCard,home/Home,category-page/CategoryPage,brand-page/BrandPage,cart/whatsapp-message.utils,quote/revalidation}.test.tsx` | 1 |

Not touched: `src/app/**`, `/api/catalog/variants`, `global.lib.ts`, Apollo queries, the cart store, `CartVariantLine`, `DESIGN.md`.

---

## Phase 1 — D11/D15 copy rename (`variante` → `medida`)

Strings only. Lands as its own commit — it touches seven test suites and must stay reviewable apart from the layout work.

### Changes Required

**`src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`** — Modify, six strings:

| Line (today) | Now | Ships |
|---|---|---|
| 197 | `Seleccionar variantes` | `Seleccionar medidas` (rendered uppercase by `uppercase`) |
| 205 | `Cargando variantes...` | `Cargando medidas...` (D13) |
| 208 | `No encontramos variantes para este producto.` | `No encontramos medidas para este producto.` (D13) |
| 96 | `No pudimos cargar las variantes. Inténtalo de nuevo.` | `No pudimos cargar las medidas. Inténtalo de nuevo.` |
| 286-288 | `N variante(s) · M pieza(s)` | `N medida(s) · M pieza(s)` — D11 desktop-footer row |
| 300-304 | `Agregar al carrito` / `Agregar N al carrito` | `Agregar al carrito` (none) / `Agregar N medida(s) al carrito` — **the CTA gains the noun** |
| 156-158 | `N variante(s) agregada(s)` toast | `N medida(s) agregada(s)` |

Keep `Elegir esta medida` (upgrade CTA) and the helper sentence at 212-215 unchanged; keep the `Diámetro` column header unchanged (OQ II context).

**`src/components/ProductCard.tsx`** — Modify lines 68-69, 74-75: `Explorar las N variantes` → `medidas`, `Ver variantes` → `Ver medidas`, `1 variante` → `1 medida`, `N variantes` → `N medidas`.

**`src/features/Home/CatalogHero.tsx:28`** — Modify: `Cada variante` → `Cada medida` (check surrounding agreement of the sentence's adjectives/articles when the word changes gender — `variante`/`medida` are both feminine, so no agreement change is expected; read the full sentence before editing).

**`src/features/QuotePage/QuoteLineRow.tsx:141`** — Modify: `Sin variante seleccionada` → `Sin medida seleccionada`.

**`src/shared/utils/whatsapp-message.utils.ts`** — Modify lines 47 and 77: `Sin variante seleccionada` → `Sin medida seleccionada`; `N línea(s) sin variante` → `N línea(s) sin medida`. Seller-facing, renamed deliberately (D15).

**Tests** — Modify assertions in all seven suites listed under *Affected files*. Mechanical: the 19 matches of `grep -rn "variante" __tests__/`. After this phase, that grep must return **zero** user-facing-string matches.

No identifier, type, route, GraphQL field or stored cart shape is renamed. `ProductVariant`, `ProductVariantUI`, `CartVariantLine`, `selectedVariantIds`, `/api/catalog/variants`, `product_variants` all stay.

### Success Criteria

- **Automated:** `pnpm test` (full suite — this is the widest blast radius in the story, the targeted run is not enough) · `pnpm exec tsc --noEmit` · `pnpm lint`
- **Dev-server validation:** start `pnpm dev`.
  - `GET /` → 200, HTML contains `medidas` in the product-card CTA (`Explorar las`) and counter, and in the hero sentence; must **not** contain `variante`/`variantes` anywhere in the rendered body.
  - `GET /categorias/tornilleria-fijacion` → 200, same card-string check.
  - `GET /cotizar` → 200, no server-log errors, no hydration warnings.
  - `grep` the fetched HTML for `variante` — expected: no match outside any `data-*`/class/route attribute.
- **Manual:** none beyond the above (drawer strings are covered by Jest here; their rendered check comes in Phase 2's manual pass).

### Verification Coverage

| Area/File | Check areas | Verification reference |
|---|---|---|
| `ProductVariantsDrawer.tsx` | six strings, singular/plural, CTA noun | `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx` |
| `ProductCard.tsx` | four strings, 0/1/N counter branches | `pnpm test` + `curl /` |
| `CatalogHero.tsx`, `QuoteLineRow.tsx`, `whatsapp-message.utils.ts` | one/one/two strings | `pnpm test` + `curl /` and `/cotizar` |

---

## Phase 2 — Two-step mobile flow (happy path)

### Changes Required

**`src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`** — Modify.

**a. State and breakpoint (near the existing `useState` block, lines 41-47)**

- Add `const { isMobile } = useMediaQuery()` — called on every render, **never** stored in state or memoized (the hook is stateless and does not react to resize; caching it would freeze the branch).
- Add `const [step, setStep] = useState<1 | 2>(1)`.
- Derive `const isTwoStep = isMobile && !isUpgradeMode` (D1/D2).
- `resetVariants()` (line 49): add `setStep(1)`. This is the single place that guarantees a reopen, and a product switch, lands on step 1.

**b. Extract the desktop row list unchanged**

Pull the current `variants.length > 0` body (lines 210-281) into a local `renderDesktopList()` or a sibling component in the same file, byte-identical in markup and class names. `isTwoStep === false` renders it. **Any diff to its classes is a regression** (rule 3 of the design handoff).

**c. Step 1 — medida grid (new, mobile only)**

- Wrapper: `grid grid-cols-2 gap-2.5` — two columns at **every** width, never `sm:grid-cols-1`.
- Each card is a real `<button type="button" aria-pressed={isSelected}>` with accessible name `Seleccionar {variant.diameter}` (matches today's checkbox label, so existing name-based queries keep working). Not a `div` with `onClick`.
- Card contents, top to bottom: the selection check glyph (rendered only when selected — D7, solid, `primary-200` on glyph `primary-900`), `{variant.diameter}` (title), `{variant.priceFormatted}` (unit price), `{variant.internalId}` (code). **No `QuantityStepper` anywhere in step 1.**
- Selected/unselected token pairs — use the DESIGN.md scale, no new token (D12):

  | | Light | Dark |
  |---|---|---|
  | Card unselected — fill / border | `#FFFFFF` / gray-200 | gray-900 / gray-800 |
  | Card selected — fill / border | primary-50 / primary-400 | primary-950 / primary-200 |
  | Title | gray-900 | gray-100 · white when selected |
  | Price | gray-600 | gray-300 · primary-100 when selected |
  | Code | gray-400 | gray-400, selected or not (D12) |

- Selection is **not colour-only**: the tinted fill comes with a border-weight/colour change *and* the check glyph.
- Toggle handler reuses the existing multi-select `setSelectedVariantIds` set logic (documentId-keyed). It must **not** touch `quantities` — deselect remembers the quantity for free (D8).
- Card `min-height: 74px`; touch target ≥44px at every width.
- D10 width steps — drawer side padding and type scale, applied on the step-1 container, not the card:

  | | 320px | 360px | 390px |
  |---|---|---|---|
  | Side padding | 16px | 20px | 22px |
  | Medida / price / code | 14 / 12 / 9px | 14 / 13 / 10px | 15 / 13 / 10px |

  Tailwind v4 has no default breakpoint at 360/390 — add them as arbitrary variants (`min-[360px]:`, `min-[390px]:`) rather than inventing config entries.
- Helper sentence: full `Selecciona una o más medidas e indica cuántas piezas necesitas de cada una.` at ≥360px; at <360px show only `Toca todas las medidas que necesites.` (D10 buys back one line). Implement as two spans toggled by the same arbitrary variant, or one string swapped off a `min-[360px]` media check — whichever reads simpler; do not add a resize listener.

**d. Step 2 — quantity list (new, mobile only)**

- `← Cambiar medidas` is a real `<button>` with that text label (not icon-only); `onPress` → `setStep(1)`. Touches neither `selectedVariantIds` nor `quantities`.
- Lists `variants.filter(v => selectedVariantIds.has(v.documentId))` — so the order is the existing price-ascending sort, not tap order (Assumption 3).
- Each row: medida, unit price, and `<QuantityStepper label={`Cantidad de ${variant.diameter}`} value={...} minValue={0} onChange={...} />` — label string exactly as the current code builds it.
- `onChange` handler (AC4 / D8):
  ```
  if (quantity === 0) {
    remove documentId from selectedVariantIds
    write quantities[documentId] = 1        // so a re-select comes back at 1, not 0
    if the selection is now empty -> setStep(1)
    return
  }
  quantities[documentId] = quantity
  ```
  `NaN` never reaches here — `QuantityStepper` already swallows it with a `console.warn`, so a cleared input must **not** remove the medida.
- `CART_MIN_QUANTITY` stays `1` and keeps guarding the cart store; the `0` floor is drawer-local and a removed medida never reaches `handleAdd` because it has left `selectedVariantIds`.

**e. Progress rail (mobile, happy path and loading only)**

- Under the product name in `Drawer.Header`: `1 · Medidas` ──── `2 · Cantidades`. Rail inactive gray-200 (light) / gray-800 (dark), active `primary-200`; step label active `primary-900` (light) / `primary-100` (dark), inactive gray-400.
- Decorative chrome — it must **not** be the only announcement of the step change. Add an `aria-live="polite"` region naming the current step, **or** move focus to the step-2 heading on advance. Pick one, not both.

**f. Step-aware footer (mobile), D11 strings verbatim**

| | Step 1 | Step 2 |
|---|---|---|
| Summary, none | `Ninguna medida seleccionada` | n/a (step 2 requires ≥1) |
| Summary, one | `1 medida elegida` | `1 medida · N pieza(s)` |
| Summary, several | `N medidas elegidas` | `N medidas · M piezas` |
| Total | **not shown** | `formatNumberToCurrency(selectedTotal)` |
| CTA, none | `Continuar a cantidades`, disabled | — |
| CTA, ≥1 | `Continuar a cantidades` → `setStep(2)` | `Agregar N medida(s) al carrito` → `handleAdd()` |

- Disabled CTA is **neutral, not pale green** (D6): gray-100 fill / gray-400 text light, gray-800 / gray-500 dark. This deliberately deviates from comp `#1b`.
- `selectedTotal` and `selectedPieces` (lines 164-177) are reused as-is — no new derivation.
- `handleAdd()` is **not modified**: it is already step-agnostic and produces the same `CartVariantLine[]` (AC3's last sentence).
- Desktop footer keeps its Phase-1 wording, its single-row layout, its total, and shows no rail.

**Edge cases**

- The file has no `"use client"` directive and must not gain one — it works because every importer is a client component. `useMediaQuery` is itself `"use client"`; importing it changes nothing. Do not add a server-side importer.
- Upgrade mode (`isUpgradeMode`) short-circuits `isTwoStep`, so `/cotizar`'s single-select path is byte-identical at every width (D2, AC5).
- Rotating across 767px mid-flow leaves the previous branch rendered until the next state change. Accepted, documented, not a bug.
- A single selected medida still walks both steps — no auto-advance.

### Tests (`__tests__/product-variants/ProductVariantsDrawer.test.tsx`)

All 16 existing tests must keep passing **unchanged** — `window.matchMedia` reports `matches: false` in jsdom, so they are the desktop no-regression suite for free. (`jest.setup.ts` only installs its shim when `window.matchMedia` is absent; confirm which one is live before relying on it, and override per-test rather than mutating the global for the whole file.)

New mobile describe block, with `matchMedia` overridden to return `matches: true` for `(max-width: 767px)`:

- Step 1 renders medida cards, no stepper present; CTA `Continuar a cantidades`, disabled with nothing selected.
- Selecting two medidas and continuing shows exactly those two in step 2, each with a stepper.
- `← Cambiar medidas` returns to step 1 with the selection intact.
- Deselecting in step 1 and re-selecting restores the previous quantity (D8).
- Adding from step 2 produces the same `CartVariantLine[]` the existing desktop test asserts (AC3).

Rules are canonical in `docs/UNIT_TESTING_GUIDELINES.md` — follow it, do not restate it.

### Success Criteria

- **Automated:** `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx` then `pnpm test` · `pnpm exec tsc --noEmit` · `pnpm lint`
- **Dev-server validation:** start `pnpm dev`.
  - `GET /` → 200, renders the product grid; no server-log errors, no hydration warning. The drawer body itself is **not reachable over HTTP** (it mounts only after a client-side open), so it cannot be curl-asserted — that is what the Jest block above and the manual pass below cover.
  - `GET /cotizar` → 200 (upgrade-mode importer still compiles and renders).
  - `GET /categorias/tornilleria-fijacion` and `GET /marcas/<any configured slug>` → 200 (the other two default-mode importers).
- **Manual (this phase's real verification):** `/` at **320, 360 and 390px**, in **both themes**:
  - Step 1 grid is two columns and 8 medidas fit one screen without scrolling.
  - **OQ X check:** open a product whose diameters are cutter×shank pairs (`Cortador vertical A.V. 2F` — `1/8 X 3/8"`, `3/16 X 3/8"`, …) at 320px. The medida must wrap, not overflow, and the grid must keep the eight-on-one-screen property. If it does not, apply the Assumption-2 fallback and record what was changed in the PR.
  - Tap-to-select toggles the card; the check glyph is visible; grayscale the screenshot to confirm selection survives without colour.
  - Continue → step 2 lists only the selected medidas; `← Cambiar medidas` returns with the selection intact.
  - Decrement to 0 removes the medida; removing the last returns to step 1 with the CTA disabled and neutral (not pale green).
  - Clearing a stepper input does **not** remove the medida.
  - At ≥768px the drawer is visually identical to `comps/variants-drawer-mobile-two-step/desktop-light-s6-before-brief-a.png` apart from Phase 1's wording.
  - No horizontal page overflow at 320-390px — `documentElement.scrollWidth === clientWidth`. Page-level sideways overflow breaks every fixed overlay on mobile Chrome, and the symptom looks like a drawer bug (REPO_CONTEXT gotcha, verified 2026-09-22).

### Verification Coverage

| Area/File | Check areas | Verification reference |
|---|---|---|
| `ProductVariantsDrawer.tsx` — step state | reset on close/reopen/product switch | Jest mobile block + manual reopen |
| — step 1 grid | two columns at 320/360/390, `aria-pressed`, no stepper, D10 type steps | Jest + manual at three widths, both themes |
| — step 2 list | only selected medidas, `minValue={0}`, decrement-to-0 removal, `NaN` guard | Jest (AC4, D8) |
| — footer | D11 strings, disabled neutral CTA, total only in step 2 | Jest string assertions + manual |
| — desktop branch | unchanged layout | the 16 pre-existing tests, run unmodified |
| — upgrade mode | unchanged | the 3 pre-existing upgrade tests, run unmodified |

---

## Phase 3 — Loading / error / empty bodies + `Reintentar`

### Changes Required

**`src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`** — Modify.

**a. Lift `loadProductData` out of the effect (D9 — the story's only new behaviour)**

- Move `loadProductData` (lines 60-104) out of the `useEffect` body into a `useCallback` at component scope, deps `[product.documentId, initialQuantity]`.
- The `isActive` cancellation currently closes over an effect-local `let`. Preserve the same guarantee at component scope — a `useRef` generation/attempt counter compared after each `await`, or an `AbortController` per call — so a stale in-flight response cannot overwrite state after a product switch or a close. **Do not drop the guard while lifting it.**
- The effect becomes `if (state.isOpen) { loadProductData() } else { resetVariants() }` with `loadProductData` in its deps.
- `Reintentar` calls the same `loadProductData` — the loading body returns while it runs.

**b. Loading body (mobile, artboard `2d`/`2e`)**

- Six skeleton cards in the **step-1 grid shape** (`grid-cols-2`), skeleton gray-200 on gray-50 (light) / gray-800 on gray-900 (dark).
- The progress rail stays rendered but **inert**.
- Footer keeps its height, CTA disabled.
- `role="status"` must survive the refactor — three existing tests assert it. If the visible `Cargando medidas...` text moves into a visually-hidden node, it must still be the accessible content of the `role="status"` element.
- Drawer height must not jump when data arrives: six skeleton cards approximate a typical 8-medida grid, and the body is already `flex-1` with its own scroll. Nothing is measured.

**c. Error body (mobile, artboards `2f`/`2g`, D14)**

- Neutral, **no red panel**: error glyph `danger` on gray-100 (light) / gray-800 (dark).
- Line 1: the existing dynamic `errorMessage` (`catalogErrorToSpanish(code)`, generic fallback from Phase 1). Line 2, fixed: `Revisa tu conexión e inténtalo de nuevo.`
- A `Reintentar` secondary button: border gray-200 / text gray-900 (light), border gray-700 / text gray-50 (dark).
- The rail stays rendered but inert. `role="alert"` must survive — an existing test asserts it.

**d. Empty body (mobile, artboards `2h`/`2i`)**

- `No encontramos medidas para este producto.` (already renamed in Phase 1).
- The progress rail is **removed entirely** — there are no steps to walk.
- The green CTA is swapped for a bordered `Cerrar` (same secondary tokens as `Reintentar`) calling `handleClose`.

Keep these three as **three separate branches**. Do not collapse loading+error+empty into one "no rail" branch: only empty drops the rail, loading and error keep it inert (research doc's edge-case list).

**e. Desktop non-happy states are unchanged** — the current single-`<p>` loading/error/empty bodies stay exactly as they are at `md`+. `Reintentar` is a mobile-branch control; adding it to desktop is out of scope.

### Tests

Extend the Phase-2 mobile describe block:

- Loading, error and empty bodies render on the mobile branch with `role="status"` / `role="alert"` intact (AC5).
- A failed fetch followed by pressing `Reintentar` re-requests and renders the variants (D9) — assert the fetch was called twice and the variants appear.
- The three pre-existing desktop loading/error/empty tests run unmodified.

### Success Criteria

- **Automated:** `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx` then `pnpm test` · `pnpm exec tsc --noEmit` · `pnpm lint` · `pnpm build` before opening the PR.
- **Dev-server validation:** start `pnpm dev`.
  - `GET /api/catalog/variants?documentId=<a real documentId>` → 200 with a `{ success: true, data: [...] }` envelope and no `CAT_ERR_*` on valid input — this is the happy source the drawer consumes.
  - `GET /api/catalog/variants` (no `documentId`) → the route's validation error envelope `{ success: false, code, message }`; note the `code` so the error body's typed line 1 can be recognised during the manual pass.
  - `GET /` and `GET /cotizar` → 200, no server-log errors, no hydration warnings.
  - The three rendered bodies themselves are client-only and cannot be curl-asserted; they are covered by Jest and the manual pass.
- **Manual:** at 390px, **both themes** — force each state (DevTools offline / a blocked `/api/catalog/variants` request / a product with zero variants):
  - Loading: six skeleton cards in the grid shape, rail inert, footer disabled, and **the drawer does not jump height** when real data replaces the skeleton.
  - Error: neutral two-line body, no red panel; `Reintentar` re-requests and the variants render.
  - Empty: no rail, bordered `Cerrar` closes the drawer.

### Verification Coverage

| Area/File | Check areas | Verification reference |
|---|---|---|
| `ProductVariantsDrawer.tsx` — `loadProductData` | lifted to `useCallback`, stale-response guard preserved, retry re-invokes | Jest retry test + manual offline toggle |
| — loading body | six-card skeleton, inert rail, `role="status"`, no height jump | Jest + manual |
| — error body | typed line 1 + fixed line 2, `role="alert"`, working `Reintentar` | Jest + `curl` the invalid-param route for the code, then manual |
| — empty body | no rail, bordered `Cerrar` | Jest + manual |
| — desktop non-happy states | unchanged | the 3 pre-existing tests, run unmodified |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
|---|---|---|---|---|
| AC1 — Two-step on mobile only | 2 | `GET /` 200 + `GET /cotizar` 200, no hydration warnings | Cannot validate | The drawer mounts only after a client-side open, so no route response contains it. Proven by the Jest mobile block plus the 16 unmodified desktop tests, and by the manual 320/360/390 + ≥768px pass. |
| AC2 — Step 1 selects, step 2 quantifies | 2 | — | Cannot validate | Interaction + responsive layout. Proven by Jest (toggle, `← Cambiar medidas`, no stepper in step 1) and the manual two-column check at 320px, which is also OQ X's resolution. |
| AC3 — Footer reflects the step, in D11's words | 1, 2 | `GET /` 200, HTML contains `medidas` in the `ProductCard` CTA/counter and no `variante` in the body | Not validated | The **desktop-copy half** is curl-provable at `/`. The drawer footer strings and the `CartVariantLine[]` equality are Jest-proven. |
| AC4 — Decrementing to 0 drops the medida | 2 | — | Cannot validate | Stepper interaction. Proven by Jest (removal, last-one-returns-to-step-1, `NaN` does not remove) and the manual pass. |
| AC5 — Upgrade mode untouched; non-happy states follow Brief A | 3 | `GET /api/catalog/variants?documentId=<real>` 200 `{ success: true, data }`, no `CAT_ERR_*`; `GET /api/catalog/variants` returns the validation envelope; `GET /cotizar` 200 | Not validated | The **data source** is curl-provable. The three rendered bodies, the `role` attributes and the `Reintentar` round-trip are Jest-proven; upgrade mode is held by its 3 unmodified tests. |

---

## Cross-cutting concerns

- **Server/client boundary.** `ProductVariantsDrawer.tsx` carries no `"use client"` and must not gain one; it works only because all four importers are client components. Adding the `"use client"` `useMediaQuery` import does not change that.
- **Breakpoint mechanism.** `useMediaQuery` is synchronous, stateless, returns all-`false` on the server, and does not react to resize. Acceptable here (the body renders only after a client-side open, and every step/selection change re-reads `matchMedia`) **provided the value is never cached**. REPO_CONTEXT warns against this hook in layout-level components — this is a drawer body, not a layout.
- **Design tokens.** Every colour in this story is already in `DESIGN.md`'s front matter (D12 dropped the one exception). No token is added, `DESIGN.md` is not edited, and `pnpm design:lint` is not needed.
- **Currency.** Prices come pre-formatted from `formatNumberToCurrency` (`$1,234.50 MXN`) — do not re-format in the component.
- **Component system.** HeroUI v3 `Drawer`/`Button`/`NumberField`-via-`QuantityStepper` only. Do not hand-roll a card or a stepper; the step-1 card is a plain `<button>`, which is the native element, not a parallel component system.
- **Implementation guidelines.** `docs/IMPLEMENTATION_GUIDELINES.md` — curly braces on every one-line `if`, multi-line object literals returned from functions, specific user-facing error copy.
- **Mobile overlay gotcha.** Any horizontal page overflow at 320-390px breaks every fixed overlay on the page and presents as a drawer bug. Check `documentElement.scrollWidth === clientWidth` first.
- **Release.** PR targets `develop` with exactly one of `major`/`minor`/`patch` — `minor` fits. Do not hand-edit `package.json` or `CHANGELOG.md`.

---

## Open Questions

- **OQ X (from research) — does D10's two-column grid survive the real cutter×shank `diameter` strings at 320px?** Still open; settled empirically in Phase 2's manual pass, not by another design round. Fallback if it fails: a smaller medida type step at 320px and/or a taller card allowing a two-line medida. A one-column drop is **not** in scope — Brief B rejected it and reversing that needs design input.
- **OQ IX (from research) — the thirteen artboards `2a`–`2i` / `3a`–`3d` are not yet filed in `comps/`.** Only the desktop "before" shot is. They are canvas HTML in the design project, so implementation reads them there. Filing them via `/check-design` is a documentation task, not a blocker.
- **Announcement mechanism for the step change** — `aria-live="polite"` region vs. moving focus to the step-2 heading. The accessibility notes allow either; Phase 2 picks one at implementation time. Flag the choice in the PR.

## Out of scope

Desktop **layout** (wording only, per D11) · upgrade mode (`/cotizar`, D2) · the search input from comp `#1a` (D5) · the order-sheet numeric inputs from comp `#1c` · any change to `/api/catalog/variants`, the cart store, or the `CartVariantLine` shape · any renamed identifier, type, route or GraphQL field · a per-row trash button in step 2 (rejected in D4) · auto-advance on a single selection (rejected) · adding `Reintentar` to the desktop error body · stock levels, delivery estimates, payment, or per-medida images (the catalog has none).
