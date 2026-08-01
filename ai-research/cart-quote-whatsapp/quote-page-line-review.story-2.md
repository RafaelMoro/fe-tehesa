# Research: Quote Page (`/cotizar`) — Line Review And Subtotal

**Date:** 2026-07-31
**Epic:** `ai-research/epics/cart-quote-whatsapp.epic.md` (Story 2)
**Status:** Awaiting human sign-off. No source files were modified during this research.

## Story Definition

### Story Title

Quote page (`/cotizar`) — line review, quantity editing, line removal, and subtotal.

### Story Description

The first new route in the app. It lists everything the buyer put in the cart during Story 1, lets them change quantities, remove lines, empty the list, and upgrade a variant-less line into a priced one, and shows a subtotal that is honest about what it excludes.

No contact form, no WhatsApp link, no revalidation against Strapi. Prices shown are the snapshot each line carried when it was added — Story 3 refreshes them, and the Brief 3 comps' states 3-6 (price changed, unavailable, checking, check failed) belong to that story, not this one.

### Acceptance Criteria

1. `/cotizar` renders each line with product name, variant (or `Sin variante seleccionada`), quantity, unit price, and line total. `internalId` is **not** displayed (epic UI IV).
2. Quantity can be changed with the shared `QuantityStepper` (bounded `1..100`) and a line removed with `Quitar`; both update the store and `localStorage` immediately.
2b. A variant-less line carries a filled primary `Elegir medida` that opens `ProductVariantsDrawer` for that product **in single-select upgrade mode** (user decision, 2026-07-31) and replaces the line in place with the chosen variant. The line's **position and quantity survive** the upgrade. Remove-and-re-add is explicitly not acceptable.
3. The subtotal sums only priced lines, is accumulated in **integer cents** and divided once at the end, is formatted with `formatNumberToCurrency`, and is labelled `Subtotal estimado (líneas con precio)` with `Precios de referencia. El vendedor confirma disponibilidad y precio final.` directly beneath. `N productos · N piezas` appears at the top of the page and beside the subtotal.
4. An empty cart shows `Tu lista está vacía` plus a `Volver al catálogo` route back. Never a bare `$0.00`. The empty state must not flash before rehydration completes (see "The Hydration Gate").
5. `generateMetadata` marks the route `noindex, follow` with a `/cotizar` canonical; the route is absent from `sitemap.ts` and is **not** added to `robots.ts` disallow — a `noindex` page must stay crawlable to be read (same reasoning as `?mode=name`, `REPO_CONTEXT.md:207`).
6. **A `Vaciar lista` control empties the whole list** (user decision, 2026-07-31). Destructive and unrecoverable, so it needs a confirmation step; it has no comp (design gap D4 below).
7. The header cart control becomes a **link to `/cotizar`** with the accessible name `Ver mi lista, N artículos`. Story 1 shipped it deliberately as a non-link count (Story 1 AC 7b); this is the story that promotes it, and the 44×44 reservation and `0`-is-neutral styling must survive the promotion.

### Task Breakdown

1. Add the three missing store actions: `setLineQuantity`, `removeLine`, `upgradeLine`. `clearLines` already exists and serves AC 6.
2. Decide `Header` placement and move it (see "Header Placement" — the user chose the root layout).
3. New route `src/app/cotizar/page.tsx`: server shell + `generateMetadata`, rendering a `"use client"` feature component.
4. New `src/features/QuotePage/` (name a planning call): line list, line row, subtotal block, empty state, `Vaciar lista`.
5. Teach `ProductVariantsDrawer` an upgrade mode (single-select, prefilled quantity, caller-owned confirm).
6. Promote `CartCount` to a link.
7. Tests: the three new store actions including the upgrade-collision case, subtotal cents arithmetic, empty state behind the hydration gate, metadata, drawer upgrade mode.

### Scope Assessment

Single story, 3 implementation phases (store actions → route and line list → drawer upgrade mode + header link). One new route, one new feature folder, three new store actions, edits to five existing files. **No new dependency.**

### Dependencies

- **Blocked by:** Story 1 — shipped.
- **Blocks:** Stories 3 and 4. Both build on this route.
- **Coupling to Story 3:** this story renders four of the seven comped line states; Story 3 adds the other three plus the revalidation banner. Build the line row so a state prop can be added, do **not** build the three unused states now.

## Delivered Comps

Brief 3 is complete and covers this story's entire visual surface. Build against the comps.

| File | Covers |
|---|---|
| `comps/brief-3/desktop-{light,dark}-normal-state-brief-3.png` | `/cotizar` normal state at 1440px |
| `comps/brief-3/mobile-brief-3.png` | Normal state at 390px, light and dark |
| `comps/brief-3/desktop-seven-state-{1,2}-brief-3.png`, `desktop-seven-state-dark-1-brief-3.png` | All seven line states at 1440px |
| `comps/brief-3/mobile-seven-state-{1,2,3}-brief-3.png` | The seven line states at 390px |

What they settle for **this** story (the full list is in the epic, "What The Brief 3 Comps Settle"):

- Heading `Solicitar cotización`, subtitle `Revisa productos, medidas y cantidades.`
- The no-size line is **the only tinted row**, carrying `Sin variante seleccionada`, `Sin precio por ahora` / `El precio depende de la medida.`, a **filled primary `Elegir medida`**, and a text `Quitar`. Making it the only tinted row is what stops it being overlooked; giving `Elegir medida` primary weight is what makes the card's `Agregar y elegir después` promise land.
- Subtotal label and the single line of reference-price copy. **No banner, no callout, no info alert** — explicitly rejected in the brief.
- Empty state: `Tu lista está vacía` + `Volver al catálogo`.
- Each state block is annotated with its subtotal contract (`incluida`, `excluida`, …). Keep that annotation set as the test matrix.

Two things the comps use that this story must reconcile, both already resolved at epic level:

- Brief 3 re-drew the header as a `☰ Mi solicitud (3)` pill. **Discarded** — Brief 2's icon-only 44×44 control ships. Do not copy the pill out of the Brief 3 comps.
- Brief 3's quantity control is the `− n +` stepper, which Story 1 already built as `src/shared/ui/atoms/QuantityStepper.tsx`. Reuse it; do not draw a second one.

## Design Agent Handoff

### User Goal

A buyer who has collected 3-20 items across the catalog needs to check the list is right — sizes, quantities, roughly what it is worth — before handing it to a seller. **This is not a checkout.** No payment, no order, no shipping, no tax, no stock. The page's job is review and correction, and the single hardest thing it must not do is present the subtotal as a price the buyer will pay.

### Surface Index

| Surface | File | States | Story | Brief |
|---|---|---|---|---|
| `/cotizar` line list | `src/features/QuotePage/` (new) | Priced, no-size (+ `Elegir medida`) | **2** | 3 — comps in `comps/brief-3/` |
| `/cotizar` line list | same | Price changed, unavailable ×2, checking, check failed | 3 | 3 — comps exist, not built here |
| `/cotizar` subtotal | same | Labelled as excluding unpriced lines | **2** | 3 |
| `/cotizar` empty state | same | `Tu lista está vacía` | **2** | 3 |
| `Vaciar lista` + confirm | same | Idle, confirming | **2** | **none — design gap D4** |
| Upgrade drawer | `src/features/ProductVariantsDrawer/` | Single-select, quantity prefilled, confirm replaces line | **2** | **none — design gap D3, behaviour only** |
| Header cart control | `src/shared/ui/atoms/CartCount.tsx` | `0`, count, 99+ — now a link | **2** | 2 — comps in `comps/brief-2/` |

### Rules That Override Any Design Instinct

1. **Never present the subtotal as a total the buyer will pay.** It excludes variant-less lines by construction, and the label has to say so.
2. **No "this is a quote" banner.** The heading, the subtotal label, and the CTA wording carry the framing. A banner was proposed to the design agent and explicitly rejected.
3. **Do not invent stock, delivery, tax, discounts, coupons, or an order summary.** None of that data exists in Strapi.
4. **`internalId` never appears in this UI.** Epic UI IV. It rides on the line for the WhatsApp message only.

### Mobile And Desktop

Phone-first, single column at ~390px with the subtotal reachable without hunting. `src/shared/hooks/useMediaQuery.tsx` **does not update on resize** — use CSS breakpoints for anything responsive, as `ProductListing.tsx:60` does.

### Accessibility

- Every `QuantityStepper` and every `Quitar` needs an accessible name that identifies its line (`Cantidad de Broca Larga, 1/4"`, `Quitar Broca Larga, 1/4"`). Two rows that both say `Quitar` are unusable with a screen reader.
- `Vaciar lista` is destructive: the confirmation must be a real dialog or an inline confirm with focus management, not a `window.confirm`.
- After a line is removed, focus must land somewhere deliberate — not on `<body>`. Removing the last line changes the whole page to the empty state; announce the change.
- Quantity and subtotal changes should be announced via a `role="status"` live region rather than only re-rendered.
- The drawer, opened from `/cotizar`, must return focus to the `Elegir medida` button that opened it.

### Visual Patterns To Preserve

`DESIGN.md` (validate with `pnpm design:lint`): HeroUI v3 components and its six real `Button` variants (`primary`, `secondary`, `tertiary`, `ghost`, `outline`, `danger` — there is no `light`/`flat`/`bordered`), Tailwind v4 utilities, the emerald accent, `border-default-200` dividers, **Geist Sans including for prices** (not Geist Mono), class-based dark mode.

### Content Constraints

- Spanish throughout. `lista` names the collection, `cotización` names the artifact and the act (epic vocabulary rule).
- Money only via `formatNumberToCurrency` (`$1,234.50 MXN`). Never a second formatter.
- Quantities are always `piezas`. There is no box/pack/case vocabulary — that data exists in Strapi but was deliberately not adopted (epic Strapi Contract V).
- No product images exist. Do not reserve image space in a line row.

### Explicitly Out Of Scope

Revalidation and its four line states (Story 3), the contact form (Story 4), the WhatsApp message and CTA (Story 4), analytics (Story 5), quote recovery after hand-off (deferred, `docs/improvement.md`).

### Decision Record

- ~~Should the upgrade drawer be multi-select?~~ **Answered 2026-07-31 — single-select upgrade mode.** One variant replaces the line in place, keeping position and quantity. A second selection is not offered.
- ~~Where does `Header` live so `/cotizar` gets the badge?~~ **Answered 2026-07-31 — move it into the root layout.**
- ~~Does Story 2 ship a clear-all control?~~ **Answered 2026-07-31 — yes, `Vaciar lista`, with a confirmation step.** No comp exists; see D4.
- **D3 (open, behavioural):** what the buyer sees at the moment a line upgrades in place. Recorded as outstanding in the epic. No comp; a planning call, not a blocker.
- **D4 (new, open):** `Vaciar lista` and its confirmation have no comp. Brief 5 below.

## Technical Research

### Affected Areas

| Path | Role in this story |
|---|---|
| `src/zustand/store/cart.store.ts` | Three new actions: `setLineQuantity`, `removeLine`, `upgradeLine` |
| `src/app/cotizar/page.tsx` (new) | Route + `generateMetadata` (`noindex, follow`) |
| `src/features/QuotePage/` (new) | Line list, line row, subtotal, empty state, `Vaciar lista` |
| `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` | Single-select upgrade mode |
| `src/shared/ui/atoms/CartCount.tsx` | Promote to a `next/link`, accessible name becomes `Ver mi lista, N artículos` |
| `src/app/layout.tsx` + `src/features/Home/CatalogPageLayout.tsx` | Move `Header` to the root layout |
| `src/shared/constants/seo.constants.ts` | Quote-page title/description constants |
| `__tests__/cart/` | New action tests; `__tests__/cart/CartCount.test.tsx` changes with the link |

### The Store Is Missing Every Mutation This Story Needs

`cart.store.ts` today exposes `addVariantLines`, `addProductLine`, `clearLines`, `setContact`, `clearContact`. It has **no way to change a quantity, remove a line, or replace one**. Three additions:

1. **`setLineQuantity(key, quantity)`** — clamp to `CART_MIN_QUANTITY..CART_MAX_QUANTITY`. The stepper already bounds it at the control, but the store is the trust boundary, not the widget.
2. **`removeLine(key)`** — filter by `cartLineKey`.
3. **`upgradeLine(key, variant)`** — replaces a variant-less line with a priced one **at the same array index**, carrying the existing `quantity` across.

`cartLineKey(line)` (`cart.store.ts:53`) is the existing identity helper: `` `${productDocumentId}:${variantDocumentId ?? "no-variant"}` ``. Lines carry no separate `id` field, so this is the handle for all three actions and the React key for each row.

**The upgrade has a collision case that must be decided, not discovered.** A buyer can hold both `Producto X · sin variante · 2 pz` and `Producto X · 1/4" · 3 pz`, then upgrade the first to `1/4"`. The upgraded key already exists. Options: merge the quantities into the existing priced line (capped at `CART_MAX_QUANTITY`) and drop the variant-less row, or refuse the upgrade with a message. **Merging is recommended** — it matches what `addLines` already does for a repeat add (`cart.store.ts:219-225`), and refusing an action the buyer explicitly took is worse than silently combining two rows for the same thing. Either way the merged row keeps the *existing priced line's* position, not the upgraded row's.

**Do not implement `upgradeLine` on top of `addLines`.** `addLines` rebuilds the list through a `Map` keyed by `cartLineKey`; because the upgrade *changes* the key, the `Map` would append the new entry at the end and the line's position would be lost — which is precisely what AC 2b forbids. Splice the array at the found index instead.

### The Hydration Gate

This is the sharpest gotcha in the story.

`createCartStore()` runs inside the provider's `useRef` (`cart.provider.tsx:62`), and `persist` with a synchronous `localStorage` backend rehydrates **at store creation**. So the server renders an empty cart, the client's very first render rehydrates a full one, and React sees a mismatch. `CartCount` solves this with the mounted guard (`CartCount.tsx:9-16`), the same pattern as `Header.tsx:15-21`.

`/cotizar` has a worse version of the problem: an unguarded page renders `Tu lista está vacía` on the server, then swaps to a 12-line list. A buyer on a slow phone sees "your list is empty" for their populated list — the single most alarming thing this page can say. **AC 4 is therefore a hydration requirement, not just a copy requirement.** Gate the whole list region on a mounted flag and render the comps' loading/skeleton treatment (or nothing) until then; only decide empty-vs-populated after mount.

`persist` also exposes `onRehydrateStorage` / `store.persist.hasHydrated()`. Either is defensible; the mounted flag is the pattern already in this codebase twice, so prefer it unless planning finds a reason not to.

### Subtotal Arithmetic

Accumulate in integer cents and divide once:

```
lines.filter(isPriced).reduce((cents, l) => cents + Math.round(l.unitPrice * 100) * l.quantity, 0) / 100
```

Float accumulation across 25 lines drifts visibly, and this number is read by a buyer and sent to a seller. Counts shown beside it (`N productos · N piezas`) come from the same pass.

**Known divergence, inherited from Story 1:** `ProductVariantsDrawer`'s `selectedTotal` (`ProductVariantsDrawer.tsx:144-150`) sums with plain floats. The drawer's preview total and `/cotizar`'s cents-based subtotal can therefore disagree by a cent on the same selection. Story 1 recorded this knowingly. If it is fixed, fix it here — one shared cents helper in `src/shared/utils/` used by both — or leave it and note it. Do not add a *third* way to total money.

### Reusing `ProductVariantsDrawer` For `Elegir medida`

The drawer takes `product: Product` and `state: UseOverlayStateReturn`, and internally uses only `product.name` and `product.documentId` (lines 61, 118-119, 180). A cart line carries both, so the caller can construct `{ documentId, name, category: null, brand: null }` — every other `Product` field is optional. That is the cheapest path and needs no drawer refactor to open it.

What *does* need a change is the confirm. `handleAdd` (line 114) is hardwired to `addVariantLines`. Three things the upgrade mode must alter:

1. **Single select.** Checking one variant unchecks the previous — or the checkboxes become radios. The CTA acts on exactly one variant.
2. **Quantity prefilled from the line**, not defaulted to `1` (line 78). Otherwise "quantity survives the upgrade" is false the moment the buyer looks at the stepper.
3. **The confirm calls `upgradeLine`, not `addVariantLines`.** Cleanest seam: an optional `onConfirmVariant?: (variant: ProductVariantUI) => void` prop plus an optional `initialQuantity`. When the callback is supplied the drawer runs single-select and never touches the store; when it is absent the drawer behaves exactly as today. That keeps `/`'s behaviour byte-identical and puts the store call at the call site that owns the line.

Also note the drawer resets all state on close (`resetVariants`, line 44) and refetches on every open — so no stale-selection leak between an upgrade and a normal add. And the footer's `Agregar N al carrito` label needs an upgrade-mode wording (`Elegir esta medida` or similar); it is currently derived from the selection count.

`ProductVariantsDrawer.tsx` has **no `"use client"` directive** — it works today only because every importer is a client component. `/cotizar`'s list component must be `"use client"` too (it is, by necessity — it reads the store).

### Header Placement

**Decided: move `Header` into `src/app/layout.tsx`.** Consequences to get right:

- It must be rendered **inside** `<NextThemesProvider>` — `Header` and `ToggleDarkMode` both call `useTheme()`.
- `layout.tsx` is a server component and can `await getThemePreference()` for the `themeFetched` prop, exactly as `page.tsx:46` does. That calls `cookies()`, which opts the root layout out of static rendering for every route. `/` is already dynamic (it awaits `searchParams`), and `/cotizar` is `noindex` and client-state-driven, so nothing is lost — but say it out loud in the PR rather than discovering it in a build report.
- `CatalogPageLayout` (`src/features/Home/CatalogPageLayout.tsx`) must **drop its `Header`** or `/` renders two. What remains of it is the `<main className="flex flex-col gap-7 p-4 sm:p-6">` wrapper; `/cotizar` needs its own `<main>` (there must be exactly one per page).
- `Header` takes `themeFetched: AppTheme` as a prop and uses it only for the pre-mount logo. That contract survives the move unchanged.

Unrelated but noticed: **`useChangeThemeStore` has zero consumers** — the whole `change-theme` Zustand store is dead code, kept alive by `ChangeThemeStoreProvider` in `page.tsx:57`. `ToggleDarkMode` uses next-themes directly. Not this story's scope; worth a `docs/improvement.md` line.

### Route And Metadata

`src/app/cotizar/page.tsx`, a thin server shell:

```
export const generateMetadata = (): Metadata => ({
  title: …, description: …,
  alternates: { canonical: "/cotizar" },
  robots: { index: false, follow: true },
})
```

`buildCatalogMetadata` (`seo.utils.ts:53`) is catalog-URL-shaped and takes `MainPageSearchParams` — do **not** bend it to serve this route. A literal metadata object here is smaller and clearer than a second builder. Title/description strings belong in `seo.constants.ts` beside the existing `SITE_*` constants.

`sitemap.ts` derives its URLs from `PRODUCT_PAGE_MAX` and the live taxonomy; `/cotizar` is simply never added — no change to that file. `robots.ts` disallows only `/api/` and must stay that way: a `Disallow` on a `noindex` page prevents the crawler from reading the `noindex` at all.

### Existing Patterns To Follow

- **Provider-wraps-store with `useRef`**, never a module singleton — already in place; this story only adds actions.
- **Mounted guard for client-only state** — `Header.tsx:15-21`, `CartCount.tsx:9-16`.
- **Anchor-or-disabled-span, never `href="#"`** — `Home.tsx:356-372`. `Volver al catálogo` and the header link are real `next/link` anchors.
- **HeroUI v3 `Toast`** is already mounted in `providers.tsx:12` — reuse `toast()` for any feedback here rather than adding a second mechanism.
- **`docs/IMPLEMENTATION_GUIDELINES.md`:** curly braces on one-line `if` returns, multi-line object literals, validation messages naming the input and the rule.
- Tests in root `__tests__/`, never co-located. Canonical rules in `docs/UNIT_TESTING_GUIDELINES.md`.

### Verification Rules To Follow Later

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
- `pnpm test`; targeted: `pnpm test -- __tests__/cart/`, `__tests__/product-variants/ProductVariantsDrawer.test.tsx` (upgrade mode touches it), `__tests__/seo/` (a new route's metadata).
- `pnpm design:lint` if `DESIGN.md` tokens change.
- **Do not run `pnpm install`.** No new dependency in this story — `react-hook-form` belongs to Story 4 only.
- Manual QA (dev server, live Strapi) is the user's; agents do not start `pnpm dev`.

### Edge Cases And Constraints

- **The hydration gate** (above). The empty state must never flash for a populated cart.
- **The upgrade key collision** (above). Decide it in planning; do not let it surface as a duplicate row in QA.
- **Removing the last line** transitions the page to the empty state mid-interaction, with focus on a button that no longer exists.
- **A rehydrated line can be variant-less with `unitPrice: null`.** `isValidCartLine` (`cart.store.ts:88-90`) enforces that pairing, so the subtotal filter can trust it — but TypeScript's `CartLine` union still needs narrowing at every price read.
- **Quantity `1..100` per line, 100 lines per cart** (`cart.constants.ts`). The stepper bounds the first; the store must bound both.
- **`localStorage` can throw** (Safari private mode, quota). Story 1's `safeLocalStorage` swallows it, so a quantity edit can silently fail to persist while the in-memory list updates. Acceptable, unchanged, worth knowing.
- **Two tabs do not sync.** Last write wins. Unchanged from Story 1; more visible on a page dedicated to the cart.
- **`Vaciar lista` is unrecoverable.** The cart is the only copy — no server, no account, no undo buffer. This is why AC 6 requires a confirmation step, and it is a stronger requirement than it looks.
- **No product images** exist. Do not reserve image space.
- **The drawer refetches variants on every open**, so `Elegir medida` costs one `/api/catalog/variants` request per use. That is the same cost the catalog already pays and needs no caching in this story.

## Open Questions

### UI And Product Decisions

I: Question: When the upgraded variant collides with an existing priced line for the same product, does the store merge the quantities or refuse the upgrade?
Status: **answered by the user, 2026-07-31 — merge.**
Context: Reachable today: add a product from the card (variant-less), then add a specific size from the drawer, then press `Elegir medida` on the first and pick that same size.
Explanation: Merge matches `addLines`' existing repeat-add behaviour (`cart.store.ts:219-225`) and never rejects an action the buyer explicitly took. Consequences to implement exactly:

- The merged quantity is `Math.min(existing + upgraded, CART_MAX_QUANTITY)`, the same clamp `addLines` applies.
- The merged row keeps the **existing priced line's** position, not the upgraded row's. The variant-less row disappears.
- The list gets shorter by one, which is the one case where an upgrade changes the line count. The confirmation copy should say so — see II.

II: Question: What does the buyer see at the moment a line upgrades in place (D3)?
Status: **answered by the user, 2026-07-31 — a success toast.**
Explanation: `toast.success` through the HeroUI `Toast.Provider` already mounted at `providers.tsx:12` — the same mechanism Story 1 uses for adds, no second feedback pattern. Two messages, because the merge case (I) is genuinely different:

- Normal upgrade: name the chosen size, e.g. `Medida elegida: 1/4"`.
- Merge case: say the rows combined, e.g. `Medida elegida: 1/4". Se combinó con la línea que ya tenías.` Without this the buyer watches two rows become one and assumes something was lost.

Focus returns to the upgraded row (or to the row that absorbed it) rather than to `<body>`. The toast is the confirmation; a row-level highlight is optional polish, not required.

III: Question: What is the `Vaciar lista` confirmation (D4)?
Status: pending — no comp.
Explanation: HeroUI v3 has a dialog; an inline two-step confirm on the button is smaller. Either is fine, `window.confirm` is not. Brief 5 below asks the design agent for it. Copy suggestion: `¿Vaciar tu lista?` / `Se quitarán los N productos. No se puede deshacer.` / `Vaciar` (danger) + `Cancelar`.

IV: Question: Does the header link show an active state on `/cotizar` itself?
Status: **answered by the user, 2026-07-31 — `aria-current="page"` only, no visual active state.**
Explanation: On `/cotizar` the header cart link points at the page the buyer is already on.

- **`aria-current="page"`** ships. One attribute, no visual change: a screen reader announces "current page" instead of offering navigation that goes nowhere.
- **No visual active state.** Nothing in the Brief 2 comps covers one, so it would be invented, and the header has exactly one destination — a buyer on `/cotizar` already knows from the heading.

Implementation note: this needs `usePathname()` in `CartCount`, the only reason that component imports from `next/navigation`. Set the attribute conditionally — `aria-current={pathname === "/cotizar" ? "page" : undefined}`, never `aria-current="false"` as a string, which is truthy to some assistive tech. It stays a real link on `/cotizar` (do not degrade it to a span); the 44×44 reservation and the `0`-is-neutral badge styling are unaffected.

### Catalog Behavior

I: Question: Does `Elegir medida` need to handle a product whose variants have since disappeared?
Status: **answered by the user, 2026-07-31 — yes, handled, with the drawer's existing copy.**
Context: `ProductVariantsDrawer` already renders `No encontramos variantes para este producto.` (line 188) and a fetch-error path (line 186). Both work unchanged when the drawer is opened from `/cotizar`.
Explanation: No new copy and no new state in this story. What the implementation must guarantee:

- **The line survives.** An empty or failed variants fetch leaves the variant-less line exactly as it was — never removed, never zeroed, never converted to a priced line.
- **The confirm CTA is unreachable** when nothing is selectable, which the existing `isDisabled={selectedVariantIds.size === 0}` (line 270) already gives for free.
- **Closing the empty drawer returns focus** to the `Elegir medida` button that opened it, same as a successful upgrade.

A full "this product no longer exists" treatment is Story 3's state 4 (`Buscar alternativa`). This story only has to not crash and not lose the line.

### Verification

I: Question: Does the drawer's upgrade mode break `__tests__/product-variants/ProductVariantsDrawer.test.tsx`?
Status: **deferred to planning by the user, 2026-07-31 — read the file, do not guess here.**
Explanation: Read `__tests__/product-variants/ProductVariantsDrawer.test.tsx` in the **first** planning phase, before the drawer work is scheduled. The expectation to confirm or disprove: if upgrade mode arrives as *optional* props with today's behaviour as the default, every existing test passes untouched. That is the whole argument for the optional-prop seam over a mode enum every call site has to pass — and if reading the file shows the tests break anyway, the seam should be reconsidered rather than the tests rewritten. (Story 1 deferred the same question about the same file for the stepper swap; that is the precedent for reading it early.)

II: Question: How is the hydration gate tested?
Status: **answered by the user, 2026-07-31 — assert the gate, not the flash.**
Explanation: jsdom cannot reproduce an SSR/hydration mismatch, so there is no test that catches the flash itself. What is asserted instead:

- Seed `localStorage` with a valid cart **before** rendering, then assert the populated list appears and `Tu lista está vacía` is absent.
- Render with empty storage and assert the empty state appears.
- Assert the empty copy is absent from the pre-mount output — this is the gate itself, and it is the one assertion that fails if someone later removes the mounted guard.

Two mechanics carried over from Story 1 (Verification I): clear `localStorage` in `beforeEach`, since jsdom persists it across tests in a file; and build a fresh store per test, since `persist` rehydrates at store creation.

**The flash stays a manual-QA item**, not a covered case. Worth stating in the PR so nobody reads a green suite as proof it cannot happen.

## Assumptions Made

- No new npm dependency.
- Line identity is `cartLineKey(line)`; lines gain no `id` field.
- `upgradeLine` splices at the found index rather than routing through `addLines`.
- The subtotal accumulates in integer cents; the drawer's float preview total is left as-is unless planning decides to unify.
- The route is a server shell exporting `generateMetadata`, with the list itself in a `"use client"` feature component.
- `Header` moves to the root layout and `CatalogPageLayout` keeps only its `<main>`.
- The drawer gains optional props; its default behaviour on `/` is unchanged.
- `/cotizar` is never added to `sitemap.ts` and never to `robots.ts` disallow.

## Non-Obvious Findings

- **The cart store has no mutation actions at all** beyond adding and clearing. Every one of AC 2's behaviours is a new action, and the identity helper they need (`cartLineKey`) already exists and is already exported.
- **`upgradeLine` cannot reuse `addLines`** — the upgrade changes the line's key, and `addLines`' `Map` rebuild would move it to the end, breaking the one thing AC 2b explicitly requires.
- **`persist` rehydrates synchronously at store creation**, so the empty state is a hydration problem before it is a copy problem. The mounted-guard pattern already exists twice in this codebase for exactly this.
- **The drawer only reads `product.name` and `product.documentId`**, so `/cotizar` can open it from a cart line by constructing a minimal `Product` — no refactor needed to *open* it, only to change what its confirm does.
- **`ProductVariantsDrawer.tsx` has no `"use client"` directive** and works only because every current importer is a client component. A new importer must preserve that.
- **`useChangeThemeStore` has no consumers** — the `change-theme` Zustand store and its provider are dead code. Unrelated to this story; worth recording.
- **`robots.ts` must not gain `/cotizar`.** Disallowing a `noindex` page prevents the crawler from ever reading the `noindex`, which is the opposite of the intent.
- **The Brief 3 comps contain a header design that was subsequently discarded.** An implementer working straight from the comps will build the wrong header control.

## Research Outcome

Story 2 is fully scoped. Design is delivered for everything except two items, neither of which blocks planning: the `Vaciar lista` confirmation (D4, new — Brief 5 added to `design-agent-briefs.md`) and the in-place upgrade moment (D3, behavioural).

The work is three store actions, one new route, one new feature folder, an optional-prop mode on an existing drawer, a header move, and a link promotion. No new dependency, no backend change, no Strapi query change.

Seven decisions the user settled on 2026-07-31: single-select upgrade mode, `Header` moves to the root layout, `Vaciar lista` ships in this story, full research depth, **the upgrade collision merges quantities**, **the upgrade confirms with a success toast** (with distinct copy for the merge case), and **`aria-current="page"` on the header link with no visual active state**.

**Every open question is now closed except one design gap and one deliberate planning task.** The gap is the `Vaciar lista` confirmation styling (D4, Brief 5 — dialog or inline two-step), which blocks nothing and can be designed while the store work proceeds. The planning task is Verification I: **read `__tests__/product-variants/ProductVariantsDrawer.test.tsx` in the first planning phase**, before the drawer work is scheduled, to confirm the optional-prop seam leaves the existing tests untouched.

**Ready for planning as of 2026-07-31.**

| # | Decision |
|---|---|
| UI I | Upgrade collision **merges** quantities, clamped at 100, keeping the existing priced line's position. |
| UI II | The upgrade confirms with a **success toast**, with distinct copy for the merge case. |
| UI III | `Vaciar lista` ships with a confirmation step. Styling open (D4). |
| UI IV | **`aria-current="page"`** on the header link, no visual active state. |
| Catalog I | The empty/failed variants fetch reuses the drawer's **existing copy**; the line always survives. |
| Verification I | **Deferred to planning** — read the drawer's test file first. |
| Verification II | **Assert the gate, not the flash.** The flash stays manual QA. |
| (Story scope) | Single-select upgrade mode; `Header` moves to the root layout. |

Awaiting human sign-off. No source files were modified during this research.
