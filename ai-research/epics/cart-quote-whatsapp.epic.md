# Cart And WhatsApp Quote Epic Research

**Date:** 2026-07-30
**Status:** Awaiting human sign-off. No source files were modified during this research.

## Story Definition

### Epic Title

Add a persisted cart and a WhatsApp quote (`Cotizar`) flow.

### Epic Description

Let a buyer collect products and variants from the catalog into a cart that survives a reload, review the selection with quantities and a subtotal, supply their name and email, and hand the whole thing to a Tehesa seller as a formatted WhatsApp message.

The business model here is a **quote request, not a sale**. Nothing is charged, no order is created, no inventory is reserved. The deliverable is a well-structured message in the seller's WhatsApp that they can act on without a follow-up round of questions.

This epic is the one `docs/improvement.md` ("Cart feature follow-up", lines 78-86) and `ai-research/epics/plp-functionality-seo.epic.md` (open questions UI II, Analytics I) have been deferring to. It unblocks:

- `Agregar al carrito` in `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx:230-239` (currently just closes the drawer).
- `Agregar al carrito` in `src/components/ProductCard.tsx:62-68` (handler commented out).
- The `add_to_cart` conversion event in `docs/ANALYTICS_EVENT_CONTRACT.md:44`, marked **Blocked on the cart story**.
- The `Cotiza por WhatsApp` promise already shipped in the production meta description (`src/shared/constants/seo.constants.ts:5`), which currently leads nowhere.

### Scope Assessment

This is an epic, not a single story. It spans new client state with persistence, two inert CTAs in two components, a new route, a contact form, an external deep-link integration, a revalidation pass against Strapi, and an extension to a signed-off analytics contract.

Five independently deliverable stories, defined below. Story 1 is researched in depth at `ai-research/cart-quote-whatsapp/cart-state-persistence.story-1.md`.

### Epic Acceptance Criteria

1. A buyer can add variant-level and product-level lines to a cart from the PLP, and the cart survives a page reload and a browser restart.
2. A `/cotizar` route shows every cart line with its variant, quantity, unit price, and a subtotal, and lets the buyer change quantities or remove lines.
3. Prices and variant availability are revalidated against Strapi when `/cotizar` loads, and any change is shown to the buyer before they send the quote.
4. Submitting the form opens WhatsApp with a prefilled, seller-readable message containing every line's internal id, product, variant, quantity, and price, plus the buyer's name and email.
5. Every decision that ships user-facing copy, money, or PII into an external channel is validated and escaped at its boundary; no unvalidated persisted blob and no unescaped product name reaches the WhatsApp message.

## Epic Decisions (Requested)

The three decisions the user asked this research to make. Each is settled with reasoning; each is also recorded as an answered open question below.

### Decision 1: Standalone `/cotizar` page, no mini-cart drawer, no separate `/carrito` page

**Recommendation: one route that is both the cart review and the quote form.** Add a header cart badge with a count and an inline confirmation on add. Do not build a `/carrito` page, and do not build a mini-cart drawer.

Reasoning:

- **A separate cart page would be the checkout page minus the form.** Both surfaces need the identical line list, quantity controls, remove controls, and subtotal. Splitting them means building that table twice, testing it twice, and adding a navigation step between "I want to quote" and "I quoted". There is no step in between — no shipping selection, no payment method, no address.
- **A mini-cart drawer stacks a drawer on a drawer.** The add-to-cart action lives inside `ProductVariantsDrawer`, which is right-placed and `w-full` (`ProductVariantsDrawer.tsx:121`). Opening a cart drawer from inside it means two HeroUI overlays, two focus traps, and a nested-dismiss question ("does Esc close the cart or the variants?"). That is real complexity bought for feedback that a badge and a confirmation line already provide.
- **A route gives back/forward, a deep link, and a server-rendered shell for free.** A drawer gives none of those, and this app already leans on real URLs everywhere else (`Home.tsx` pagination is `next/link` anchors, catalog state is URL-backed).
- **Nothing here is SEO-sensitive.** `/cotizar` is `noindex` either way, so the usual "a drawer has no URL" SEO argument does not apply. The argument that does apply is browser back — a buyer who taps back from a drawer leaves the catalog entirely, which is the worst outcome in the funnel.

What that costs: the buyer cannot glance at the cart contents without leaving the PLP. The mitigation is the header badge count plus a per-add confirmation naming what was added. If post-launch analytics show drop-off between `add_to_cart` and `view_cart`, a mini-cart drawer is an additive change on top of the same store — no refactor.

Route name: `/cotizar`, matching the Spanish copy already in the meta description and CTA. `/checkout` would be the only English path in the app.

### Decision 2: Persist in `localStorage` via `zustand/persist`, not a cookie

**Recommendation: `localStorage`, written through the `persist` middleware that ships inside the already-installed `zustand` package.** No new dependency, no new route, no request overhead.

| Option | Verdict |
|---|---|
| **`localStorage` + `zustand/persist`** | **Chosen.** ~5 MB budget, zero bytes on the wire, three lines of store config, `zustand` is already a dependency (`package.json:29`). |
| Cookie via a route handler | Rejected — see below. |
| `sessionStorage` | Rejected. Dies on tab close. A buyer building a 20-SKU quote across a lunch break loses it. |
| IndexedDB | Rejected. Async API and a schema for what is at most a few KB of JSON. |
| Server-side session | Rejected. No auth, no session store, no database in this repo. |

Why not a cookie, specifically:

- **A cart cookie rides on every request.** It would be attached to every catalog page navigation and every `/api/catalog/*` call, none of which need it. A 10-line cart is roughly 800 bytes of JSON, ~1.2 KB once encoded, on every request for the whole session.
- **The 4 KB per-cookie limit is a real ceiling here.** An industrial buyer quoting 25 SKUs is the target user, not an edge case. `localStorage` has no such anxiety.
- **It would have to drop `httpOnly`.** The existing theme cookie is `httpOnly: true` (`global.lib.ts:208`) precisely because only the server reads it. The cart is read and written by the client on every add — so a cart cookie is both JS-readable *and* transmitted, which is strictly worse than `localStorage`, which is only JS-readable.
- The single thing a cookie buys is a server-rendered badge count with no hydration flash. That is addressed below at a fraction of the cost.

The hydration flash, and why it is already solved in this codebase: a `localStorage`-backed count renders as empty on the server and correct after hydration. The fix is to render the badge only once mounted — the exact pattern `src/shared/ui/organisms/Header.tsx:15-21` already uses for the theme-dependent logo. Reuse it rather than inventing a second approach.

Two things that are **not** optional with this choice:

1. **Versioned schema.** `persist` takes `version` and `migrate`. A cart written by an older build must not crash a newer one. Bump `version` whenever the line shape changes and drop-on-mismatch is an acceptable `migrate` for v1.
2. **Validate on rehydrate.** `localStorage` is user-writable — it is a trust boundary, not internal state. Every rehydrated line must pass a runtime shape check (`documentId` matches `DOCUMENT_ID_PATTERN`, `quantity` is a positive integer, `unitPrice` is a finite non-negative number, strings are within length caps) before it reaches a subtotal or a WhatsApp message. Invalid lines are dropped silently, not repaired.

Named upgrade path, deliberately not taken now: a tiny non-`httpOnly` `tehesa-cart-count` cookie holding only an integer would give a server-rendered badge for ~20 bytes per request. It is rejected for v1 because it creates a second source of truth that can drift from `localStorage`. Revisit only if the mounted-guard flash is an actual complaint.

### Decision 3: WhatsApp payload — `wa.me` deep link, SKU-first compact format

**Mechanism:** a client-built `https://wa.me/<E.164 digits>?text=<encodeURIComponent(message)>` link. No backend, no new route, no Strapi write — matching the "WhatsApp only" answer.

**Render it as a real `<a>` anchor, not `window.open()`.** An anchor is not popup-blocked, survives iOS Safari (where `window.open` after an `await` is blocked), and supports long-press / middle-click. When the form is incomplete, render a non-focusable `<span aria-disabled="true">` instead — the same disabled-control pattern `Home.tsx:364-372` already uses for pagination. This also means the URL must be derivable synchronously from current state.

**Length budget — the real constraint.** There is no officially documented cap on the `wa.me` `text` parameter; WhatsApp's Cloud API documents a 4096-character message *body*, and browser/OS URL handling truncates well before that. The safe engineering bound is **~2000 characters after percent-encoding**. Encoding inflates Spanish text badly: every newline becomes `%0A` (3×), every accented character (`á`, `ó`, `ñ`, `Ø`) becomes 6 characters, `$` becomes `%24`. That puts the practical plain-text budget at roughly **700-900 characters**, which a naive "product name, variant, quantity, price" layout exhausts at about **8-12 cart lines**.

The mitigation is the format itself, not a cap:

- **Lead each line with `internalId`, not the product name.** It is the seller's own SKU — the value they paste into their system — and it is 6-10 characters against a 40-character product name. Story 3 retained `internalId` on every mapped variant (`ProductVariantUI.internalId`) for exactly this. This is the single highest-value field in the message.
  - **But it is neither required nor unique in Strapi** (confirmed 2026-07-30, see Strapi Contract I). It is a display value for the seller, *not* a key. A line whose `internalId` is missing must fall back to `Sin clave interna` plus the product name and variant, and the message must never imply the SKU identifies the line uniquely.
- **One line per cart line, fixed field order**, so the seller reads a column, not a paragraph.
- **Escape WhatsApp markdown in interpolated values.** WhatsApp renders `*bold*`, `_italic_`, `~strike~`, and ` ```mono``` `. A product name containing `*` or `_` silently corrupts the layout of the whole message. Strip or neutralise those characters, plus newlines and control characters, in every value that comes from Strapi or from the buyer's form. This is the same class of boundary as `toJsonLdHtml` escaping `<` before a `<script>` block, and it is not optional.
- **Include a short client-generated quote reference** (e.g. `TH-260730-A4F2`). It costs 15 characters and gives both sides a handle for the conversation three days later.

Recommended message shape (Spanish, final wording to be confirmed at planning):

```
*Cotización Tehesa* · TH-260730-A4F2

Nombre: Rafael Moro
Email: rafael@example.com

1) BRO-1234 · Broca Larga Acero A.V.
   1/4" · 3 pz · $120.00 c/u = $360.00
2) KT-9981 · Llave Hexagonal Bondhus
   Sin variante seleccionada · 2 pz

*Subtotal:* $360.00 MXN
2 productos · 5 piezas · 1 línea sin variante
```

Two consequences that ripple into the UI, both flowing from the product-card CTA decision:

- **Lines with no variant carry no price and must be excluded from the subtotal.** The subtotal is "subtotal of the priced lines", and the UI has to say so rather than showing a number that quietly under-reports.
- **The message must state the variant-less lines explicitly** (`Sin variante seleccionada`), so the seller knows to ask rather than assuming an omission.

**Money arithmetic:** accumulate the subtotal in integer cents (`Math.round(price * 100)`) and divide once at the end. Float accumulation across 25 lines drifts visibly, and this number is shown to a buyer and sent to a seller. Format with the existing `formatNumberToCurrency` (`$1,234.50 MXN`) — do not format cart totals separately.

**Blocking configuration:** the destination number does not exist anywhere in this repo (confirmed by grep, and by `docs/improvement.md:67`). It needs a new `NEXT_PUBLIC_WHATSAPP_NUMBER` — `NEXT_PUBLIC_` because the link is built client-side — holding E.164 digits with no `+` and no separators. When unset, the CTA must render disabled with an explanatory message; it must never produce `wa.me/undefined`. Same missing business data blocks the deferred `LocalBusiness` JSON-LD in `docs/improvement.md:62-70`; one answer unblocks both.

## Epic Structure

### Story 1: Cart State, Persistence, And Add-To-Cart Wiring

Description: Create the cart store with `localStorage` persistence and wire both currently inert `Agregar al carrito` CTAs. No new route.

Acceptance criteria:

1. A Zustand cart store follows the existing provider-wraps-store pattern (`src/zustand/`), is mounted in `src/app/providers.tsx` so every route sees it, and persists to `localStorage` with a `version` and a `migrate`.
2. Rehydrated state is validated line by line before use; malformed or truncated lines are dropped rather than repaired, and a corrupted blob never throws.
3. The drawer CTA adds one line per selected variant carrying the variant's `documentId`, `internalId`, `diameter`, `price`, and quantity, taken from state already in hand — no additional Strapi request. `GET_PRODUCT_VARIANTS` gains `documentId` on the variant selection.
4. The card CTA adds a single product-level line with no variant, which is displayed and messaged as `Sin variante seleccionada` and contributes no price.
5. Adding the same variant twice increments the existing line's quantity instead of creating a duplicate; the drawer's index-keyed selection state is re-keyed by the variant's `documentId`.
6. A header cart badge shows the total line count, renders only after mount, and links to `/cotizar`.

Must-have notes:

- **The line identity key is the variant's `documentId`, not `internalId`.** `internalId` is neither required nor unique in Strapi (Strapi Contract I), so it cannot be a key. `documentId` is `ID!` on `productVariant` and is the stable identity for both deduplication and revalidation. It is not selected by any current query — adding it to `GET_PRODUCT_VARIANTS` is a one-field change in this story that Story 3 depends on.
- `docs/improvement.md:82` explicitly deferred "re-key the drawer selection by `internalId`" to this story. It happens here, but keyed by `documentId` for the reason above — that deferred note predates the uniqueness finding.
- The drawer's quantity field can hold `""` (`ProductVariantsDrawer.tsx:204`), and the existing total silently coerces it to `1` via `|| 1`. The add handler must resolve that case deliberately, not inherit the coercion.
- `Header` currently lives inside `CatalogPageLayout`, which only `/` uses. Decide in planning whether `Header` moves to the root layout so `/cotizar` inherits the badge, or whether the layout is shared another way.

### Story 2: Quote Page (`/cotizar`) — Line Review And Subtotal

Description: A new route listing every cart line with quantity editing, line removal, and a subtotal. No form, no WhatsApp, no revalidation yet.

Acceptance criteria:

1. `/cotizar` renders each line with product name, variant (or `Sin variante seleccionada`), quantity, unit price, and line total.
2. Quantity can be changed and a line removed; both update the store and the persisted state immediately.
3. The subtotal sums only priced lines, is computed in integer cents, is formatted with `formatNumberToCurrency`, and is labelled so a buyer understands variant-less lines are excluded.
4. An empty cart shows a Spanish empty state with a route back to the catalog, never a bare `$0.00`.
5. `generateMetadata` marks the route `noindex, follow`; the route is absent from `sitemap.ts` and is **not** added to `robots.ts` disallow (a `noindex` page must stay crawlable to be read — same reasoning as `?mode=name` in `REPO_CONTEXT.md:67`).

### Story 3: Price And Availability Revalidation On `/cotizar`

Description: Refetch current prices and variants for everything in the cart when the quote page loads, and show the buyer what changed.

Acceptance criteria:

1. On load, `/cotizar` revalidates every variant line in a **single batched request** filtered by the variants' `documentId`s, and every product-level line in a second batched request by product `documentId`.
2. A changed unit price is shown as previous → current, and the subtotal uses the current price.
3. A variant that no longer exists, and a product that no longer exists, each get a distinct Spanish state and are excluded from the subtotal.
4. A revalidation failure never blocks the quote: the snapshot prices are shown with a warning, and the flow continues.

Must-have notes:

- **A top-level filterable variant query exists** (confirmed 2026-07-30, Strapi Contract II): `productVariants(filters: ProductVariantFiltersInput, pagination: PaginationArg)`, where `ProductVariantFiltersInput` accepts `documentId` and `internalId` as `StringFilterInput` — so `{ documentId: { in: [...] } }` batches the whole cart into one query. This removes the per-product fan-out this story originally assumed. A new `GET_VARIANTS_BY_IDS` query plus a new `GET /api/catalog/variants-by-ids` route handler is the shape.
- No current query returns a single product's scalar fields by `documentId`. `GET_PRODUCT_VARIANTS` selects only `product_variants` (`global.queries.ts:22-34`). For the variant-less lines, `products(filters: { documentId: { in: [...] } })` batches the same way and returns `name minPrice maxPrice hasOneProductVariant` directly.
- Match by variant `documentId`, never by `internalId` — the latter is non-unique (Strapi Contract I) and would silently collide.
- Validate the id list at the route boundary the way every other catalog param is validated: each id against `DOCUMENT_ID_PATTERN` and `DOCUMENT_ID_MAX_LENGTH`, plus a cap on list length. The ids come from `localStorage`, which is user-writable.

### Story 4: Contact Form And The WhatsApp `Cotizar` CTA

Description: Name, last name, and email inputs, plus the message builder and the deep link.

Acceptance criteria:

1. Name, last name, and email are captured with native HTML validation plus a length cap and an email pattern check; no form library is added.
2. Every value interpolated into the message — product names from Strapi and form values from the buyer — is stripped of newlines, control characters, and WhatsApp markdown characters before interpolation.
3. The message contains, per line, the `internalId`, product name, variant, quantity, unit price, and line total; plus the buyer's details, the subtotal, and a short quote reference.
4. The CTA is a real anchor when the form is valid and a non-focusable `aria-disabled` span when it is not, and it is disabled with an explanatory message when `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset.
5. The encoded URL length is measured; when it would exceed the safe bound the message degrades predictably (documented behaviour) rather than being silently truncated by the browser.
6. The message builder is a pure function under `src/shared/utils/`, unit-tested against escaping, empty-variant lines, subtotal exclusion, and the length budget.

### Story 5: Analytics Contract Extension For The Cart Funnel

Description: Documentation-only update to `docs/ANALYTICS_EVENT_CONTRACT.md`. No instrumentation code.

Acceptance criteria:

1. `add_to_cart` moves out of "Conversion (blocked)" with both `origin` values (`variants_drawer`, `product_card`) resolved to real trigger sites.
2. `remove_from_cart`, `view_cart`, `begin_checkout`, and `generate_lead` are specified with flat payloads, keeping GA4's reserved names.
3. The contract states explicitly that the buyer's name and email are **never** sent to any provider — the adapter's mandatory PII redaction (`ANALYTICS_EVENT_CONTRACT.md:75`) is a backstop, not the control.
4. `docs/improvement.md` "Cart feature follow-up" is updated to reflect what shipped.

## Technical Research

### Affected Areas

| Path | Role |
|---|---|
| `src/zustand/store/`, `src/zustand/provider/` | New cart store + provider, mirroring the theme pattern |
| `src/app/providers.tsx` | Currently pass-through — the correct seam for the cart provider (`__tests__/test-utils.tsx` already wraps renders in it) |
| `src/app/layout.tsx` / `src/features/Home/CatalogPageLayout.tsx` | Header placement so `/cotizar` inherits the badge |
| `src/shared/ui/organisms/Header.tsx` | Cart badge; already `"use client"` and already carries the mounted-guard pattern |
| `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` | Wire the footer CTA; re-key selection by `internalId`; resolve the `""` quantity case |
| `src/components/ProductCard.tsx` | Uncomment and wire the secondary CTA as a variant-less add |
| `src/app/cotizar/page.tsx` (new) | Quote route + `generateMetadata` |
| `src/features/Cart/` (new) | Line list, quantity control, subtotal, contact form |
| `src/shared/utils/` (new) | Pure WhatsApp message builder + escaping |
| `src/shared/types/global.types.ts` | `CartLine` union, cart store types |
| `src/shared/constants/` | Cart error codes, storage key, length caps, WhatsApp config |
| `src/shared/queries/global.queries.ts` | Add `documentId` to the variant selection (Story 1); add batched `GET_VARIANTS_BY_IDS` / `GET_PRODUCTS_BY_IDS` (Story 3) |
| `src/app/api/catalog/` | New batched revalidation route + `_utils.ts` id-list validation (Story 3) |
| `__tests__/cart/` (new) | Store, persistence/rehydration, message builder, page behaviour |

### Existing Patterns To Follow

- **Provider-wraps-store, never a module singleton.** `src/zustand/provider/change-theme.provider.tsx:19-22` creates the store in a `useRef`. Copy it. A module-level store leaks state across requests in the App Router.
- **Mounted guard for client-only state.** `Header.tsx:15-21`.
- **Anchor-or-disabled-span, never `href="#"`.** `Home.tsx:356-372`.
- **Envelope + `CAT_*` codes + `catalogErrorToSpanish`** for anything that talks to `/api/catalog/*` (`catalog-api.utils.ts`).
- **Escape at the boundary before serialising into a foreign format.** `toJsonLdHtml` in `seo.utils.ts` is the precedent; the WhatsApp builder is the same shape of problem.
- **Curly braces on one-line `if` returns; multi-line object literals; validation messages that name the input and the rule.** `docs/IMPLEMENTATION_GUIDELINES.md`.
- Tests live in root `__tests__/`, never co-located. Canonical rules in `docs/UNIT_TESTING_GUIDELINES.md`.

### Verification Rules To Follow Later

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
- `pnpm test` for the full suite; `pnpm test -- __tests__/cart/<file>` for targeted runs.
- `pnpm design:lint` if `DESIGN.md` tokens change.
- Do not run `pnpm install`. No new dependency is needed for any story in this epic — `zustand/persist` ships inside the installed `zustand`, and the WhatsApp link is a URL.
- Manual QA (dev server, live Strapi) is the user's; agents do not start `pnpm dev`.

### Edge Cases And Constraints

- **`localStorage` is a trust boundary.** Validate every rehydrated line; never `JSON.parse` into typed state and use it.
- **Quote-time float drift.** Accumulate in cents.
- **Encoded URL length.** ~700-900 plain-text characters is the safe budget; measure the encoded string, do not guess from the plain one.
- **WhatsApp markdown in Strapi data.** Product names are editor-authored and unescaped today.
- **Product-level lines have no price.** `minPrice`/`maxPrice` exist on the list query but are denormalized, unmaintained columns (`docs/improvement.md:20-29`) and three catalog products currently carry `0` or `null`. Do not present them as the line price.
- **`internalId` is not a key.** It is optional and non-unique in the Strapi schema (Strapi Contract I). Treat it as seller-facing display text only. The variant's `documentId` is the key.
- **`internalId` is fetched in exactly one place.** Only `GET_PRODUCT_VARIANTS` returns it; no list query does.
- **Strapi has variant fields nobody is selecting.** `stock` (integer), `quantity` (integer, required, min 1), `packageQuantity`, `measurementUnit`, `material`, `screwHeadType`, `fastenersComponents`, and `pricing.pricePromotion` all exist on `product_variant` and no frontend query touches them. `measurementUnit` and `packageQuantity` in particular would let a quote line say "3 cajas de 100 pz" instead of "3 pz" — see UI question V. This also corrects `REPO_CONTEXT.md:148`, which lists `availability`/`stock` as genuinely absent; that is true of `Product`, not of `product_variant`.
- **There is no currency field anywhere in Strapi.** `MXN` is a hardcoded frontend assumption in `formatNumberToCurrency`. The WhatsApp message inherits it.
- **SSR safety.** `localStorage` does not exist on the server. The store module can be pulled into the server graph; guard accordingly.
- **No auth.** The cart is per-device and per-browser. Two devices are two carts, and clearing site data loses everything. That is acceptable for a quote request; state it in the empty/lost-cart copy expectations rather than engineering around it.
- **`KNOWN_PRODUCT_TOTAL = 333` and the 7-page ceiling are stale** and unrelated to this epic; do not let cart copy derive counts from them.

## Design Agent Handoff

### User Goal And Affected Surfaces

A buyer — most likely a purchasing contact at a workshop or industrial supplier, often on a phone, often mid-conversation with their own customer — assembles a list of tools and hardware with the sizes and quantities they need, and hands it to a Tehesa seller on WhatsApp without retyping it.

Surfaces: the PLP grid card (`src/components/ProductCard.tsx`), the variants drawer (`src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`), the app header (`src/shared/ui/organisms/Header.tsx`), and a new `/cotizar` route.

### Required States

**Header cart badge**

- Empty (no lines) — decide whether the control is hidden or shown at zero. Recommendation: show it, so the affordance is discoverable before the first add.
- With count — a numeric badge. It renders only after mount, so it must not cause layout shift when it appears.

**Add-to-cart confirmation**

- Success — names what was added ("3 variantes agregadas", "Producto agregado sin variante"). Must be reachable by a screen reader, so a live region, not a purely visual flash.
- Already-in-cart — the quantity increments rather than a duplicate line appearing; the confirmation should say so.

**Variants drawer footer** — the existing selection count, piece count, and total stay. The CTA becomes functional; the drawer's own subtotal already exists and should not diverge from the cart's.

**Product card** — two CTAs currently sit side by side with near-identical weight. Once both work they do different things: one opens variant selection, one adds a variant-less line the seller has to follow up on. The design needs to make that difference legible; today the labels do not.

**`/cotizar` — line list**

- Priced line: product name, variant, quantity control, unit price, line total.
- Variant-less line: product name, explicit `Sin variante seleccionada`, quantity control, no price, and a visible reason it has no price.
- Price changed (Story 3): previous value struck or de-emphasised beside the current value, with a short explanation.
- Variant unavailable / product unavailable (Story 3): line excluded from the subtotal, with a clear removal or replacement action.
- Revalidation in progress, and revalidation failed (snapshot prices shown with a warning, flow not blocked).
- Empty cart — Spanish copy plus a route back to the catalog. Never a bare `$0.00`.

**`/cotizar` — subtotal**

- Must communicate that variant-less and unavailable lines are excluded. A number with no qualifier will be read as the quote total.
- Piece and product counts alongside it, mirroring the drawer's existing `N variantes · N piezas` phrasing.

**`/cotizar` — contact form and CTA**

- Default, per-field invalid, and form-incomplete states.
- CTA disabled (form incomplete) — non-focusable, visibly inert, with the reason stated, not a mystery grey button.
- CTA disabled (WhatsApp not configured) — a distinct state with different copy; this is our failure, not the buyer's.
- CTA ready — the primary action of the page.
- Post-tap: WhatsApp opens in a new context and the buyer returns to a page that still holds their cart. Decide whether the cart clears, and where the user lands. Recommendation: do not clear automatically — a failed hand-off would destroy the list — but offer an explicit "empezar una nueva cotización".

### Mobile And Desktop Expectations

Mobile-first. The catalog grid is one column by default and three at `lg` (`ProductListing.tsx:60`); the variants drawer is right-placed and full width at every breakpoint. `/cotizar` on a phone is a single column with the subtotal and CTA reachable without hunting — a sticky summary is worth considering, but the form sits above the CTA, so verify the keyboard does not bury it.

`src/shared/hooks/useMediaQuery.tsx` does not update on resize and is not a sound basis for new responsive behaviour; use CSS breakpoints.

### Accessibility Requirements

- The add confirmation and the revalidation result must be announced (`role="status"`), and errors `role="alert"` — matching the drawer's existing use.
- Quantity controls need labels naming the line, as the drawer already does (`Cantidad de ${variant.diameter}`).
- Remove controls need accessible names naming the line, not a bare "Eliminar".
- Disabled CTAs are non-focusable `aria-disabled` spans, never `href="#"` anchors.
- The badge count needs a text equivalent; a number in a circle is not self-describing.
- Form fields need visible labels, programmatic association, and inline errors tied by `aria-describedby`.

### Visual Patterns To Preserve

`DESIGN.md` (validate with `pnpm design:lint`): HeroUI v3 components, Tailwind v4 utilities, the emerald accent on selected rows and taxonomy lines, `border-default-200` dividers, Geist Sans (explicitly **not** Geist Mono for prices or SKUs, `DESIGN.md:123`), class-based dark mode. No CSS-in-JS, no second component system.

### Content And Technical Constraints

- Spanish throughout, matching existing copy.
- Prices are `$1,234.50 MXN` via `formatNumberToCurrency`. Never format cart money separately.
- `internalId` has been invisible to users by deliberate decision (`plp-product-detail-signals.story3.md`, UI question V). It now has to appear in the WhatsApp message because the seller needs it. Whether it appears in the `/cotizar` UI is an open design question (below) — the message is not. It is optional in Strapi, so every surface that shows it needs a missing-value treatment (`Sin clave interna`).
- Do not invent stock, availability, delivery, shipping, tax, or discount concepts. None exist in Strapi.
- Do not present a total as a price the buyer will pay. It is a subtotal on a quote request.
- No product images exist. Do not reserve image space in a cart line.

### Explicitly Out Of Scope

Payment, checkout, orders, accounts, addresses, shipping, tax, coupons, saved carts across devices, order history, a mini-cart drawer, a separate `/carrito` page, and product images.

### Unanswered Design Questions

1. Does `internalId` appear in the `/cotizar` line, or only in the WhatsApp message? Showing it helps a buyer who already speaks in SKUs; it also exposes an internal reference that has been deliberately hidden until now.
2. Header badge at zero: visible or hidden?
3. Add confirmation: inline in the drawer, a toast, or a badge animation? HeroUI v3's available surfaces should decide this — the app has no toast pattern today.
4. Does the cart clear after the WhatsApp hand-off? (Recommendation above: no, with an explicit reset action.)
5. How prominent should the "this is a quote, not an order" framing be, and where does it live?
6. If `measurementUnit` and `packageQuantity` turn out to be populated (Strapi Contract V), where do they sit in a cart line? "3 pz" and "3 cajas de 100 pz" are different quotes, and today the drawer only ever says "piezas".

## Open Questions

### UI And Product Decisions

I: Question: Standalone cart page, an action inside the drawer, or both?
Status: answered
Answer: One `/cotizar` route that is both cart review and quote form. No separate `/carrito` page and no mini-cart drawer.
Context: Full reasoning in "Decision 1" above.
Explanation: A separate cart page duplicates the quote page's line table; a mini-cart drawer stacks an overlay on the variants drawer. A header badge plus an add confirmation covers the feedback need. A mini-cart is additive later if the funnel shows drop-off.

II: Question: What should the product-card `Agregar al carrito` CTA do, given the card has no variant selection?
Status: answered
Answer: Add a product-level line with no variant. The seller receives it explicitly marked as having no variant selected.
Context: Answered by the user on 2026-07-30.
Explanation: This makes `CartLine` a two-case union, excludes those lines from the subtotal, and requires distinct copy in both the `/cotizar` line and the WhatsApp message. It also means the two card CTAs now do materially different things behind near-identical labels — a design problem flagged in the handoff.

III: Question: Does the cart clear after the WhatsApp hand-off?
Status: pending
Explanation: Recommendation is no — the hand-off can fail (WhatsApp not installed, wrong account, tab closed) and clearing would destroy the buyer's list with no recovery. Offer an explicit "empezar una nueva cotización" instead. Needs a product yes/no.

IV: Question: Should `internalId` be visible in the `/cotizar` UI, or only in the WhatsApp message?
Status: pending
Context: Story 3 decided it is not user-facing anywhere (`plp-product-detail-signals.story3.md`, UI V). The WhatsApp message changes that for the seller-facing channel only.

### Persistence

I: Question: `localStorage`, a Next.js cookie, or something else?
Status: answered
Answer: `localStorage` through `zustand/persist`, with a versioned schema and validation on rehydrate.
Context: Full comparison in "Decision 2" above.
Explanation: No new dependency, no per-request payload, no 4 KB ceiling, and a cart cookie could not stay `httpOnly` so it would be strictly worse than `localStorage`. The hydration flash is handled by the mounted-guard pattern already in `Header.tsx`.

II: Question: Are the buyer's name, last name, and email persisted alongside the cart?
Status: pending
Explanation: Recommendation is yes, in the same store — a repeat buyer should not retype them, and the data stays on their own device. It does mean PII sits in `localStorage`, so it needs an explicit call rather than a default.

III: Question: Does the cart expire?
Status: pending
Explanation: Recommendation is no explicit expiry, since Story 3's revalidation makes staleness visible rather than silent. If product wants one, a stored timestamp plus a check on rehydrate is a few lines — but it silently destroys a cart the buyer built, which is why it is not the default.

### WhatsApp Integration

I: Question: What is the destination WhatsApp number?
Status: pending — **blocks Story 4**
Context: No phone number, WhatsApp number, address, or business identity exists anywhere in this repo (grep over `src/` and `DESIGN.md`; confirmed in `docs/improvement.md:67`).
Explanation: Needs `NEXT_PUBLIC_WHATSAPP_NUMBER` in E.164 digits, no `+`, no separators. Also decide whether it is a single number or routed per category/brand. The same missing business data blocks the deferred `LocalBusiness` JSON-LD, so one answer unblocks both.

II: Question: Is the exact Spanish message wording approved?
Status: pending
Context: A draft shape is proposed in "Decision 3". It has not been reviewed by whoever will actually read these messages.
Explanation: The seller reading these every day is the right reviewer. Worth one round with them before Story 4 is planned — the format is cheap to change now and annoying to change after it is in a test suite.

III: Question: How should the flow behave when the message exceeds the safe encoded-URL budget?
Status: pending
Context: ~700-900 plain-text characters, roughly 8-12 lines, before the encoded URL becomes unsafe.
Explanation: Options are (a) send the first N lines plus a count of the rest, (b) cap cart size at the point of adding, (c) send only SKU + quantity above the threshold and drop the prose. Recommendation is (c) — it degrades to the fields the seller actually needs and keeps every line represented. Needs a product decision; silent browser truncation is the one unacceptable outcome.

### Strapi Contract

I: Question: Is `internalId` guaranteed present and unique on every `product_variant`?
Status: answered
Answer: **No to both.** `internalId` is a plain `string` with no `required` and no `unique` constraint.
Context: `store-tehesa-api/src/api/product-variant/content-types/product-variant/schema.json`, verified by the backend-research subagent on 2026-07-30 against the repo and live introspection.
Explanation: This is the single most consequential finding in this research. `internalId` cannot be the cart's line identity key or the revalidation match key — a missing value would collapse distinct lines together, and a duplicated value would match the wrong variant on revalidation. Use the variant's `documentId` (`ID!`, always present, see III) as the key and keep `internalId` purely as seller-facing display text with a `Sin clave interna` fallback. This supersedes the assumption in `docs/improvement.md:83-84` that `internalId` alone identifies a cart line.

II: Question: Can variants be fetched without going through `product(documentId:)`?
Status: answered
Answer: **Yes.** Three top-level queries exist: `productVariant(documentId: ID!)`, `productVariants(filters: ProductVariantFiltersInput, pagination, sort, status)`, and `productVariants_connection(...)`. `ProductVariantFiltersInput` accepts `internalId` and `documentId` as `StringFilterInput`, so `in`, `eq`, and `contains` are all available.
Context: Live GraphQL introspection, 2026-07-30.
Explanation: `productVariants(filters: { documentId: { in: [...] } })` revalidates an entire cart in **one** request. Story 3's original per-product fan-out is unnecessary and its ACs have been rewritten accordingly. `products(filters: { documentId: { in: [...] } })` batches the variant-less lines the same way.

III: Question: Does `product_variant` expose its own `documentId` and a relation to its parent product?
Status: answered
Answer: **Yes to both.** `documentId` is a `NON_NULL ID` on `productVariant`; the parent relation field is `product` (manyToOne → `api::product.product`).
Context: Live GraphQL introspection, 2026-07-30.
Explanation: This is the stable key the cart needs. It is not selected by `GET_PRODUCT_VARIANTS` today — Story 1 adds it.

IV: Question: Does any order, quote, lead, or customer content type exist in Strapi?
Status: answered
Answer: **No.** The full content-type list is `about`, `brand`, `category`, `global`, `product`, `product-variant`.
Context: Backend repo schema sweep, 2026-07-30.
Explanation: Confirms the WhatsApp-only decision was the cheap one. Recording a lead server-side would mean designing a new content type, granting write permissions to a public-facing token, and building spam protection — a separate epic, not a variation on this one.

V: Question: Should the quote line carry the variant's unit and package size?
Status: pending
Context: `product_variant` has `measurementUnit`, `packageQuantity`, `material`, `stock`, and `quantity` (required, min 1), plus `pricing.pricePromotion` — none selected by any frontend query.
Explanation: "3 pz" and "3 cajas de 100 pz" are very different quotes, and the seller will have to ask if the unit is ambiguous. Recommendation: add `measurementUnit` and `packageQuantity` to the variant selection in Story 1 and render them in both the cart line and the message, *if* they are actually populated in live data. Their population rate is unverified — `description` and `subcategory` were confirmed available and turned out empty everywhere (`plp-product-detail-signals.story3.md`, Strapi II), so check before designing around them.

VI: Question: Is `pricing.pricePromotion` a real promotional price that should override `price` in a quote?
Status: pending
Context: `shared.pricing` has `price` (decimal, required, min 0) and `pricePromotion` (**string**, optional). Nothing in the frontend selects it.
Explanation: It is typed as a string, not a decimal, which suggests free-text rather than a computable price. Quoting the wrong number to a buyer is the expensive failure mode here, so this stays out of scope until someone confirms what it means and whether it is populated.

VII: Question: Is the Strapi API token write-capable?
Status: pending — not blocking
Context: Mutations (`createProductVariant`, etc.) exist in the schema, but the token's actual role permissions live in the database, not the repo.
Explanation: Irrelevant to this epic as scoped (no writes). Recorded so a future "record the lead" story does not have to rediscover it — and as a note that a write-capable token reaching a public client would be a security problem worth checking independently.

### Verification

I: Question: How is the WhatsApp hand-off tested?
Status: pending
Explanation: Recommendation is to unit-test the pure message builder exhaustively (escaping, variant-less lines, subtotal exclusion, encoded length, quote reference) and to assert only the anchor's `href` in component tests. Actually opening WhatsApp is manual QA on a real device — a jsdom test cannot cover it and should not pretend to.

II: Question: How is persistence tested given jsdom's `localStorage`?
Status: pending
Explanation: jsdom provides `localStorage`, so store round-trips, version migration, and rejection of a corrupted blob are all testable. The cases that matter are the adversarial ones: truncated JSON, a valid-JSON-wrong-shape blob, a negative quantity, and a `NaN` price.

## Assumptions Made

- Epic-plus-first-story shape, confirmed by the user on 2026-07-30.
- WhatsApp is the only artifact; no server-side lead record, no email copy. Confirmed 2026-07-30.
- Prices are revalidated on `/cotizar` and changes are surfaced to the buyer. Confirmed 2026-07-30.
- The product-card CTA adds a variant-less line. Confirmed 2026-07-30.
- No new npm dependency is added by any story in this epic.
- The route is `/cotizar`; the copy is Spanish; money stays `$1,234.50 MXN`.
- The cart is per-device with no cross-device sync, since the app has no auth.
- Story ordering assumes 1 → 2 → 3 → 4; Story 5 is documentation-only and can land at any point after Story 1.

## Non-Obvious Findings

- **The drawer's add-to-cart UI already exists and is fully built.** Multi-select checkboxes, per-variant quantity inputs, a live selected-piece count, and a live total are all in `ProductVariantsDrawer.tsx:105-239`. The CTA at line 230 calls `handleClose`. The gap is a store, not UI.
- **The drawer already computes a subtotal that the cart must agree with.** `selectedTotal` at `ProductVariantsDrawer.tsx:105-111` sums with float arithmetic and coerces an empty quantity to `1`. If the cart accumulates in cents and the drawer does not, the two numbers can disagree on the same screen.
- **`internalId` is fetched in exactly one place in the entire app.** Only `GET_PRODUCT_VARIANTS` selects it; none of the four list queries do. Story 3 kept it on `ProductVariantUI` for this epic — which also means a variant-less card line has no `internalId` at all and never can without a fetch.
- **Escaping WhatsApp markdown is a real trust boundary, not defensiveness.** Product names come from Strapi editors. A name containing `*` or `_` corrupts the formatting of the entire message, not just its own line. This is structurally the same problem `toJsonLdHtml` solves for JSON-LD, and the repo already treats that one as a boundary.
- **The `wa.me` text limit is undocumented, and percent-encoding is what actually bites.** Spanish accented characters cost 6 bytes each encoded and `\n` costs 3. A message that looks comfortable at 900 plain characters can exceed 2000 encoded. Measure the encoded string.
- **A cart cookie could not be `httpOnly`.** The existing theme cookie is, because only the server reads it. The cart is written by the client on every add, so a cookie would be JS-readable *and* on the wire — worse than `localStorage` on both axes. This inverts the usual "cookies are more secure" intuition.
- **`src/app/providers.tsx` is a deliberately empty seam.** It returns children unchanged, is mounted in the root layout, and `__tests__/test-utils.tsx` already wraps every rendered component in it. It is the correct mount point for the cart provider, and doing so makes every existing test see the cart for free.
- **The production meta description already promises this feature.** `Cotiza por WhatsApp` shipped in `seo.constants.ts:5` and currently leads nowhere. This epic is what makes that copy honest.
- **`Header` is not in the root layout.** It sits inside `CatalogPageLayout`, used only by `/`. A cart badge on `/cotizar` requires moving it or duplicating it — a small structural decision that has to be made before Story 1's badge is built, not after.

## Research Outcome

The epic is broken into five independently deliverable stories. The three decisions the user asked for are settled with reasoning: a single `/cotizar` route, `localStorage` via `zustand/persist`, and a SKU-first `wa.me` deep link with escaping and a measured length budget.

Story 1 is fully unblocked and researched in depth at `ai-research/cart-quote-whatsapp/cart-state-persistence.story-1.md`. Stories 2, 3, and 5 are unblocked — the Strapi contract questions were answered on 2026-07-30 and made Story 3 *smaller* than assumed (one batched query rather than a per-product fan-out). **Story 4 is hard-blocked on the WhatsApp number**, which does not exist anywhere in this repo.

The one finding that changes the design rather than the estimate: `internalId` is optional and non-unique in Strapi, so it is display text, not a key. Every story treats the variant's `documentId` as the identity.

No new dependency is required by any story. No backend change is required by any story.

Awaiting human sign-off.
