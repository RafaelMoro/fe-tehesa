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

Five independently deliverable stories plus one timeboxed spike, defined below. Story 1 is researched in depth at `ai-research/cart-quote-whatsapp/cart-state-persistence.story-1.md`. Spike 4S prices the WhatsApp delivery mechanisms and gates Story 4; it runs in parallel with Stories 1-3.

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

This is the free, zero-backend option, chosen as the v1 default. It has **not** been compared on cost against the WhatsApp Cloud API or a BSP — **Spike 4S** does that before Story 4 is planned, and everything below (length budget, batching, unobservable delivery) is a consequence of this mechanism, not of WhatsApp in general.

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

**Overflow: split the quote into batched sends (user decision, 2026-07-31).** When the encoded URL would exceed the safe bound, the message is split across several sends rather than truncated or capped.

The builder is therefore `buildQuoteMessages(lines, contact): string[]` — a pure function returning **one** message in the common case and N only on overflow. The split is driven by the *measured* `encodeURIComponent(message).length` against the threshold, never by a guessed line count: a cart of ten short SKUs and a cart of ten accented product names encode to very different lengths. Split only on cart-line boundaries, never mid-line.

What this costs, and what has to be true for it to work:

- **One `wa.me` link opens one chat with one prefilled message. There is no way to queue several.** Batching means the buyer sends part 1, returns to the browser, and presses the next CTA. The `localStorage` cart survives that round trip; the buyer's attention may not.
- **Part 1 must be self-sufficient**, because it is the only part guaranteed to arrive. It carries the quote reference, the buyer's name and email, the line count, and the subtotal — all computable before the lines are laid out. A seller who receives part 1 and nothing else still has who to call and what it is worth.
- **Every part carries `Parte N de M` and the same quote reference.** That is what lets the seller reassemble them, and — more importantly — notice that part 3 never arrived. Continuous line numbering across parts (`7)`, `8)`, …) rather than restarting per part.
- **The page cannot know whether a part was actually sent.** Clicking the anchor is "opened", not "delivered"; the browser never learns the outcome. The UI must reflect *opened*, keep every part re-sendable, and never present a green "quote sent" state it cannot substantiate.
- **Single-message stays the default path.** Most quotes will fit in one. Batching is the overflow branch — build it as a branch, not as the primary flow, and do not introduce a stepper UI for the 1-message case.

Escaping, cents arithmetic, and the `internalId` fallback apply identically to every part; the split happens after those, on the already-escaped lines.

**Money arithmetic:** accumulate the subtotal in integer cents (`Math.round(price * 100)`) and divide once at the end. Float accumulation across 25 lines drifts visibly, and this number is shown to a buyer and sent to a seller. Format with the existing `formatNumberToCurrency` (`$1,234.50 MXN`) — do not format cart totals separately.

**Configuration (resolved 2026-07-31):** `NEXT_PUBLIC_WHATSAPP_NUMBER=522224417330` — the number is `222 441 7330` (Puebla), and `NEXT_PUBLIC_` because the link is built client-side. Verify the `521…` mobile variant once before fixing it (see WhatsApp I). When the variable is unset the CTA must still render disabled with an explanatory message; it must never produce `wa.me/undefined`.

**Length cap:** `WHATSAPP_URL_MAX_ENCODED_LENGTH = 1800`, applied to the whole URL including the ~32-character base, not just the `text` parameter. Provisional pending device measurement (WhatsApp IV) but safe to ship — the failure modes are asymmetric, and an over-cautious cap costs one extra message while an over-generous one silently truncates a quote.

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
7. The persisted state has two independently clearable slices: the cart lines and the buyer's contact details (name, last name, email). Both are validated on rehydrate; the contact slice survives the post-hand-off cart clear. The form that writes it lands in Story 4 — only the store shape and its validation belong here.

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

### Spike 4S: WhatsApp Delivery Mechanisms — Options, Cost, And Tier

**Timebox: one day. Output is a written recommendation appended to this epic, not code.** Runs before Story 4 is planned, in parallel with Stories 1-3, which do not depend on it.

Everything in Decision 3 — the click-to-chat deep link, the length budget, the batching, the "we cannot observe delivery" constraint — follows from choosing the *free, zero-backend* delivery mechanism. That was the right default to research against, but it was never compared against the paid options on cost. This spike closes that gap before we build a message pipeline we might replace.

**The question that decides everything else: does a programmatic API even fit the direction of this flow?** Click-to-chat is buyer→seller: the buyer's own WhatsApp sends the message, which is why it costs nothing and needs no opt-in. A programmatic API is business→customer: our system sends. Those are not substitutes, and a naive swap changes who is talking to whom. Answer this first — if the API cannot deliver a buyer's quote to a seller without an opt-in the buyer has not given, the remaining cost questions are moot.

Mechanisms to price and compare:

| Mechanism | What to establish |
|---|---|
| `wa.me` click-to-chat (current choice) | Baseline. Free, no Meta account, no approval, no backend. Costs: URL length, manual send, no delivery signal, no server-side record. |
| WhatsApp Business **app** (seller side) | Not a delivery mechanism for us, but it is probably what the seller already uses. Establish whether it is in play, because the next row may force them off their current number. |
| WhatsApp **Cloud API** (Meta-hosted) | The real alternative. Establish: per-message vs per-conversation pricing under the current model; **Mexico** rates specifically (pricing is per-country); which categories (utility / marketing / authentication / service) our messages fall into; what is free and up to what volume; template pre-approval requirements and turnaround. |
| Business Solution Providers (Twilio, 360dialog, Infobip, Gupshup, Wati, …) | Markup over Meta's rate plus a monthly platform fee, against what they add — hosted inbox, CRM, multi-agent, analytics. For a seller with no CRM this may be the actual product being bought. |
| On-Premises API | Expected to be dead — verify sunset status and dismiss in one line if so. |

Non-price questions that have killed this kind of migration before, and must be answered:

- **Does the API require a phone number dedicated to it, one that can no longer be used in the WhatsApp Business app?** If Tehesa's seller answers customers on that number today, this is an operational cost far larger than the per-message rate.
- **Business verification**: what Meta requires, how long it takes, and who at Tehesa owns it.
- **The 24-hour customer service window** and what it permits without a pre-approved template.
- **Opt-in**: whose consent is needed, captured where, and stored how — this touches the contact form in Story 4 and Mexican data-protection expectations.
- **What we would gain**: a real delivery receipt, a server-side quote record, no length budget (the Cloud API documents a 4096-character body, and no URL is involved, which removes batching entirely), and structured payloads instead of formatted prose.
- **What we would take on**: a backend, secrets that cannot be `NEXT_PUBLIC_`, a webhook endpoint, and a recurring bill — none of which exist in this repo today.

Deliverable: a table of mechanism × monthly cost at a realistic quote volume (ask the business for an estimate; 50 and 500 quotes/month are reasonable brackets to price), plus a recommendation of *stay on click-to-chat* or *migrate, in this story*.

**Verify every figure at the source.** WhatsApp pricing has changed model more than once — conversation-based to per-message, with categories moving in and out of free — and any number quoted from memory or from a BSP's marketing page is unreliable. Cite Meta's own pricing documentation, dated, with the Mexico rate.

Expected outcome, stated so the spike can disprove it: click-to-chat stays for v1. It is free, ships without a backend, and matches a flow the buyer initiates. The spike exists to put a number on what we are declining and to catch the case where the free path is a false economy — for example, if losing every quote that a buyer abandons mid-batch turns out to cost more in lost sales than the API does.

### Story 4: Contact Form And The WhatsApp `Cotizar` CTA

Description: Name, last name, and email inputs, plus the message builder and the deep link.

**Gated on Spike 4S.** These acceptance criteria assume click-to-chat. If the spike recommends the Cloud API, AC 5 and AC 6 (length budget, batched sends) disappear entirely and this story grows a backend — re-plan rather than patch.

Acceptance criteria:

1. Name, last name, and email are captured with **`react-hook-form`** (user decision, 2026-07-31), with a required check, a length cap, and an email pattern on each field.
1b. **The form is only rendered when there are no valid saved details, or when the buyer presses the control to use different information.** With valid saved details the page shows a read-only summary and goes straight to `Cotizar`, feeding the saved values into the message. Revealing the form prefills it with the saved values and moves focus into it.
1c. Saved details are validated on rehydrate **and** again at message-build time, because in the collapsed path they reach the message without passing through the form — and therefore without `react-hook-form` ever running. The rules live in one shared pure validator consumed by both paths, not inline in the form. Details that fail fall back to the expanded form, prefilled with whatever survived — never a summary of a half-valid record, never a silent send.
1d. A visible, reversible "olvidar mis datos" affordance lets the buyer wipe their stored contact details without clearing browser storage. The contact slice clears independently of the cart — the cart clears after hand-off (UI III), the contact details survive.
2. Every value interpolated into the message — product names from Strapi and form values from the buyer — is stripped of newlines, control characters, and WhatsApp markdown characters before interpolation.
3. The message contains, per line, the `internalId`, product name, variant, quantity, unit price, and line total; plus the buyer's details, the subtotal, and a short quote reference.
4. The CTA is a real anchor when the form is valid and a non-focusable `aria-disabled` span when it is not, and it is disabled with an explanatory message when `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset.
5. The encoded URL length is measured against the safe bound; on overflow the quote is split across several messages on cart-line boundaries rather than being truncated by the browser. Part 1 carries the quote reference, contact details, line count, and subtotal; every part carries `Parte N de M` and the same reference; line numbering is continuous across parts.
6. When there is more than one part, the UI presents them in order, marks each as *opened* (never as *sent* — delivery is unobservable), and keeps every part re-sendable. A one-part quote renders a single CTA with no stepper.
7. The message builder is a pure function `buildQuoteMessages(lines, contact): string[]` under `src/shared/utils/`, unit-tested against escaping, empty-variant lines, subtotal exclusion, a one-part cart, and a cart that forces a split (asserting the split lands on a line boundary and that part 1 alone contains the contact details and subtotal). The split threshold is `WHATSAPP_URL_MAX_ENCODED_LENGTH` (1800) measured on the full URL.
8. The cart clears after the hand-off, but only once the **last** part of a multi-part quote has been opened, and never silently — an explicit acknowledgement or an immediately available undo, since the browser cannot observe whether anything was actually sent.

Must-have notes:

- **This is the only new dependency in the epic.** `react-hook-form` is not currently installed (`package.json` dependencies verified 2026-07-31). It is a deliberate exception to the CLAUDE.md rule against form libraries — that rule allows them "unless explicitly planned", and this is the plan. Add it in this story only, never during research. No resolver package: `zod`/`yup` would be a *second* dependency, and RHF's built-in `required` / `maxLength` / `pattern` rules cover three text fields.
- **RHF is not the trust boundary, and this is the trap in this story.** AC 1c means saved contact details reach the WhatsApp message *without passing through the form at all* in the collapsed path. So the rules must live in one shared pure validator (plus constants for the caps and the email pattern), consumed both by RHF's field rules and by the rehydrate and message-build checks. If RHF's rules are written inline in the component, the two paths drift and the unvalidated one is the one that ships PII into an outbound message.
- **`defaultValues` versus rehydration.** RHF captures `defaultValues` at first render, while `zustand/persist` rehydrates from `localStorage` after mount. The naive wiring yields a permanently empty prefilled form. Either gate the form's render on the mounted flag (the `Header.tsx:15-21` pattern this epic already uses everywhere) or call `reset(savedContact)` once rehydration completes. Decide this in planning — it is the single most likely source of a "prefill doesn't work" bug.
- **HeroUI v3 integration is unverified.** RHF's `register` wants an uncontrolled input with a forwarded ref; HeroUI v3 inputs may be controlled, which would require `Controller` instead. Check against the HeroUI MCP (configured in `opencode.json`) before planning, not during implementation — it changes the shape of every field.
- Jest should resolve `react-hook-form` by name without a `moduleNameMapper` entry, unlike `@heroui/react`. Verify rather than assume; if the form ends up wrapped in `Controller`, the existing HeroUI mapping already covers that half.

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
- **One new dependency, in Story 4 only: `react-hook-form`** (user decision, 2026-07-31). Stories 1, 2, 3, and 5 add nothing — `zustand/persist` ships inside the installed `zustand`, and the WhatsApp link is a URL. Do not run `pnpm install` during research or during any story other than Story 4.
- Manual QA (dev server, live Strapi) is the user's; agents do not start `pnpm dev`.

### Edge Cases And Constraints

- **`localStorage` is a trust boundary.** Validate every rehydrated line; never `JSON.parse` into typed state and use it.
- **Quote-time float drift.** Accumulate in cents.
- **Encoded URL length.** ~700-900 plain-text characters is the safe budget; measure the encoded string, do not guess from the plain one. Over budget, the quote splits into batched sends (Decision 3 → Overflow) — so the threshold constant decides how often a buyer is asked to send twice, and deserves real-device measurement.
- **WhatsApp markdown in Strapi data.** Product names are editor-authored and unescaped today.
- **Product-level lines have no price.** `minPrice`/`maxPrice` exist on the list query but are denormalized, unmaintained columns (`docs/improvement.md:20-29`) and three catalog products currently carry `0` or `null`. Do not present them as the line price.
- **`internalId` is not a key.** It is optional and non-unique in the Strapi schema (Strapi Contract I). Treat it as seller-facing display text only. The variant's `documentId` is the key.
- **`internalId` is fetched in exactly one place.** Only `GET_PRODUCT_VARIANTS` returns it; no list query does.
- **Strapi has variant fields nobody is selecting.** `stock` (integer), `quantity` (integer, required, min 1), `packageQuantity`, `measurementUnit`, `material`, `screwHeadType`, `fastenersComponents`, and `pricing.pricePromotion` all exist on `product_variant` and no frontend query touches them. `measurementUnit` and `packageQuantity` in particular would let a quote line say "3 cajas de 100 pz" instead of "3 pz" — deliberately **not** used (Strapi Contract V, answered 2026-07-31), because their population in live data is unverified and a wrong unit is worse than no unit. This also corrects `REPO_CONTEXT.md:148`, which lists `availability`/`stock` as genuinely absent; that is true of `Product`, not of `product_variant`.
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

- Empty (no lines) — **visible, showing `0`** (decided 2026-07-31). The control is always present, so the affordance is discoverable before the first add.
- With count — the same badge, different number, positioned bottom-right of the cart control. Because it never appears or disappears there is no layout shift; the mounted guard swaps `0` for the real count in place.
- `0` must read as empty rather than as a notification — a filled accent pill at zero looks like an alert. The count needs a text equivalent either way.

**Add-to-cart confirmation** — a **shared toast** (recommended), because the drawer closes on add and the card has no host surface. `role="status"`.

- Success — names what was added ("3 variantes agregadas", "Producto agregado sin medida"). Must be reachable by a screen reader, so a live region, not a purely visual flash.
- Already-in-cart — the quantity increments rather than a duplicate line appearing; the confirmation should say so ("Cantidad actualizada").

**Variants drawer footer** — the existing selection count, piece count, and total stay. The CTA becomes functional and **the drawer still closes on add**, so focus must be returned deliberately (the card's trigger button) rather than left on `<body>`. The drawer's own subtotal already exists and should not diverge from the cart's.

**Product card** — two CTAs currently sit side by side with near-identical weight. Once both work they do different things: one opens variant selection and yields a priced line, the other commits an unpriced line the seller must follow up on. Recommendation is to keep `Explorar las N variantes` as the visual primary and demote the other to tertiary with a label naming what it does (`Agregar sin elegir medida` in shape, final copy the designer's). See design question 7 for the full reasoning.

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

- **No saved details** — the form is shown expanded, as the only way forward. Default, per-field invalid, and form-incomplete states all live here.
- **Saved details present** — *no form*. A read-only summary of name, last name, and email, plus a *usar otros datos* control, with `Cotizar` immediately available. This is the common state for a returning buyer and should read as two taps, not as a collapsed form.
- **Saved details, editing** — the form revealed and prefilled. Focus moves into it on reveal.
- CTA disabled (form incomplete) — non-focusable, visibly inert, with the reason stated, not a mystery grey button.
- CTA disabled (WhatsApp not configured) — a distinct state with different copy; this is our failure, not the buyer's.
- CTA ready — the primary action of the page.
- Post-tap: WhatsApp opens in a new context and the buyer returns to a page that still holds their cart. Decide whether the cart clears, and where the user lands. Recommendation: do not clear automatically — a failed hand-off would destroy the list — but offer an explicit "empezar una nueva cotización".

**`/cotizar` — batched send (large quotes only)**

This is the hardest state in the epic to design and the easiest to design dishonestly. A quote too long for one message is split into parts; the buyer must send part 1, leave WhatsApp, come back, and send part 2.

- Single part (the common case) — one CTA, no stepper, no mention that batching exists.
- Multi-part, before the first send — the buyer must understand *before* tapping that this takes several sends and why, or they will assume the first tap finished the job. State the part count up front.
- Multi-part, in progress — which part is next is the page's primary action. Earlier parts stay visible and re-sendable, because the buyer may have backed out of WhatsApp without pressing send.
- Part state is **opened, not sent.** The browser cannot observe delivery. Copy and iconography must not imply confirmation — no green check, no "enviado". Something closer to "abierto — vuelve a abrir si no se envió".
- All parts opened — still not a success state. Offer "empezar una nueva cotización" and nothing that claims the seller received it.
- Returning to the page mid-sequence (the normal path on mobile) must not lose progress or reset to part 1.

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

1. ~~Does `internalId` appear in the `/cotizar` line?~~ **Answered 2026-07-31: no.** Message only. Nothing to design.

2. ~~Header badge at zero: visible or hidden?~~ **Answered 2026-07-31: visible, showing `0`.** The count sits at the bottom-right of the cart control. So the affordance is discoverable before the first add, and the badge never appears or disappears — it only changes number. That removes the layout-shift concern entirely: reserve the space once and the mounted-guard swaps `0` for the real count with nothing moving. Design note: `0` must read as *empty*, not as a notification — a filled accent pill at zero looks like an alert. Also needs a text equivalent, since "0" in a circle is not self-describing.

3. Add confirmation: inline in the drawer, a toast, or a badge animation? **Clarification (asked 2026-07-31): confirmation of the add-to-cart action itself** — the feedback shown after the buyer presses `Agregar al carrito`, from either surface. Two trigger sites: the drawer (one or more variants, with quantities) and the product card (a single variant-less line). It also has to cover the increment case, where an existing line's quantity goes up rather than a new line appearing.

   **Decided 2026-07-31: one shared toast, plus the badge count as the persistent signal.** Reasons, in order of weight: the drawer **closes on add** (Q7, answered yes), so anything rendered inside it is destroyed at the moment it would be read; the product card has no host surface for an inline message at all; and a toast is one component serving both sites rather than two separate feedback mechanisms. Give it `role="status"` — the drawer already uses that pattern at `ProductVariantsDrawer.tsx:144-145`.

   Copy must name what happened, not just that something did: `3 variantes agregadas`, `Producto agregado sin medida`, `Cantidad actualizada`. Check the HeroUI MCP for a v3 toast before building one — the app has no toast pattern today, and a minimal own component is the fallback, not the first choice.

4. ~~Does the cart clear after the WhatsApp hand-off?~~ **Answered 2026-07-31: yes.** What still needs designing is *how*: the clear cannot be silent (delivery is unobservable), and in a multi-part quote it may only happen after the last part. An acknowledgement step or a visible undo — pick one and design it.

5. How does the saved-details summary read? The form is hidden once details are saved (Persistence II), so this summary is what a returning buyer sees instead — it has to make clear *which* details will be sent, offer *usar otros datos*, and offer *olvidar mis datos*, without turning into three competing controls above the primary CTA. This is the only PII-bearing surface in the app.

6. ~~How prominent should the "this is a quote, not an order" framing be, and where does it live?~~ **Answered 2026-07-31: the approach below is approved.**

   **Minimal, and anchored to the money rather than to the page.** The framing is already carried by the vocabulary — the route is `/cotizar`, the primary CTA says `Cotizar`, the message header says `Solicitud de cotización`. Adding a banner on top of that is belt-and-braces for a buyer who was never confused.

   Where it genuinely matters is **beside the subtotal**, because `$1,234.50 MXN` is the one element on the page that reads as a price to pay regardless of surrounding copy. Two things there, both already required for other reasons: the label says `Subtotal estimado (líneas con precio)`, and one line of supporting text — *"Precios de referencia. El vendedor confirma disponibilidad y precio final."* That single line does the whole job.

   Second place, free: the `/cotizar` heading is `Solicitar cotización`, not `Carrito` or `Checkout`.

   Explicitly **not** recommended: a callout banner at the top of `/cotizar`, any framing on the PLP grid or cards (noise across 50 cards, and the buyer has committed to nothing yet), and a confirmation dialog before `Cotizar`.

7. Do the two product-card CTAs need relabelling or re-weighting now that they diverge? **Asked 2026-07-31: why would they?** Because convention now points at the wrong button.

   Today the card footer holds `Agregar al carrito` (secondary) and `Explorar las N variantes` (primary), side by side at near-equal weight. Once both are wired they do materially different things:

   - `Explorar las N variantes` → the buyer picks a size and a quantity and gets a **priced** line the seller can quote directly.
   - `Agregar al carrito` → commits a line with **no variant and no price**, which the message marks `Sin variante seleccionada` and which is excluded from the subtotal. It guarantees a follow-up round of questions — the exact thing this epic exists to eliminate.

   The problem is not that `Agregar al carrito` is a poor label in isolation. It is that it is the *conventional* label for the main path in every store the buyer has ever used, and here it is the degraded path. A buyer who taps it expecting normal add-to-cart behaviour produces a worse quote and gets no signal that they did.

   **Recommendation: re-weight, and relabel only the degraded action.** Keep `Explorar las N variantes` as the visual primary; demote the other to tertiary. The constraint for the label: it must not read as the default action, and it should ideally convey *both* that something is added *and* that the size is missing.

   Spanish copy candidates, grouped by what they lead with:

   | Copy | Says it adds | Says no size | Length | Note |
   |---|---|---|---|---|
   | **`Agregar sin medida`** | yes | yes | 18 | **Recommended.** Shortest option that does both jobs. |
   | `Agregar sin elegir medida` | yes | yes | 25 | The original. Same meaning, seven characters more for nothing. |
   | `Agregar y elegir después` | yes | implied | 24 | Warmer, promises a next step the flow does not actually provide — the buyer never gets asked again. Slightly misleading. |
   | `Elegir medida después` | implied | yes | 21 | Same objection, and it does not say a line was created. |
   | `No sé la medida` | no | yes | 15 | Least likely to be tapped by accident — it describes the buyer's *state*, so nobody presses it casually. But it never says anything was added, which fights the toast. |
   | `Pedir asesoría` | no | no | 14 | Good tone for an industrial buyer, and clearly not add-to-cart. Conveys neither fact; the buyer may not realise a quote line now exists. |
   | `Consultar medidas` | no | no | 17 | **Reject.** Reads as "show me the sizes", which is what the *other* button does. |
   | `Cotizar sin medida` | yes | yes | 18 | **Reject.** `Cotizar` is the final send action on `/cotizar`; reusing the verb here suggests this button sends the quote. |

   **Pick: `Agregar sin medida`.** It matches the toast copy already recommended (`Producto agregado sin medida`) and the message copy (`Sin variante seleccionada`) closely enough that the three read as one flow, which is worth more than any individual phrasing. If accidental taps turn out to be the real problem, `No sé la medida` as a tertiary text link is the stronger deterrent — swap then, on evidence.

   Two edge cases the label has to survive:

   - **Single-variant products.** 35 of 333 have `hasOneProductVariant`, where the card reads `Explorar la variante`. Offering `Agregar sin medida` beside it is close to nonsense — there is only one medida. Worth considering hiding the degraded CTA entirely when `variantCount === 1`, which also removes the worst accidental-tap case.
   - **Products with no usable variant data.** Three records currently have `variantCount` null or `0` (`docs/improvement.md:35-39`). There the degraded CTA is the *only* working path, so it cannot be hidden unconditionally on a falsy `variantCount` — distinguish "one variant" from "no variant data".

8. ~~Does the variants drawer still close on add (`ProductVariantsDrawer.tsx:230`)?~~ **Answered 2026-07-31: yes, it still closes.** Two consequences: the confirmation must live outside the drawer (see Q3), and **focus must be moved deliberately on close** — back to the card's trigger button is the obvious target. A drawer that closes leaving focus on `<body>` strands keyboard and screen-reader users mid-flow.

9. ~~Where do `measurementUnit` and `packageQuantity` sit in a cart line?~~ **Answered 2026-07-31: they are not used.** Quantities are pieces throughout, matching the drawer's existing `N piezas`. Nothing to design.

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
Status: **answered by the user, 2026-07-31 — yes, the cart clears.** Recovery is deferred and noted in `docs/improvement.md` "Cart feature follow-up".
Context: This overrides the recommendation not to clear. The recovery concern stands but is accepted as follow-up rather than v1 scope.
Explanation: Two constraints this decision inherits, neither of them optional:

- **In a multi-part quote, clearing may only happen after the *last* part is opened.** Parts 2..N are built from the cart; clearing on the first hand-off makes the rest unbuildable and strands the seller with a partial quote they were told to expect more of. See "Decision 3 → Overflow".
- **The hand-off is unobservable.** Clicking the anchor means *opened*, not *delivered* — WhatsApp may not be installed, the buyer may back out without sending. So the clear must not be silent: it needs an explicit acknowledgement step or an immediately visible undo, because otherwise a buyer who backs out returns to an empty cart with no idea why. The follow-up note in `docs/improvement.md` covers a durable "restaurar última cotización"; v1 needs at minimum the non-silent version.

IV: Question: Should `internalId` be visible in the `/cotizar` UI, or only in the WhatsApp message?
Status: **answered by the user, 2026-07-31 — no.** It stays out of the `/cotizar` UI and appears only in the WhatsApp message.
Context: Story 3 decided it is not user-facing anywhere (`plp-product-detail-signals.story3.md`, UI V). This keeps that decision intact for the buyer-facing surface and changes it only for the seller-facing channel.
Explanation: The `Sin clave interna` fallback is therefore needed only in the message builder, not in any component. One fewer missing-value state to design.

### Persistence

I: Question: `localStorage`, a Next.js cookie, or something else?
Status: answered
Answer: `localStorage` through `zustand/persist`, with a versioned schema and validation on rehydrate.
Context: Full comparison in "Decision 2" above.
Explanation: No new dependency, no per-request payload, no 4 KB ceiling, and a cart cookie could not stay `httpOnly` so it would be strictly worse than `localStorage`. The hydration flash is handled by the mounted-guard pattern already in `Header.tsx`.

II: Question: Are the buyer's name, last name, and email persisted alongside the cart?
Status: **answered by the user, 2026-07-31 — yes, persisted.** On completing the quote the buyer is asked whether to keep the same details or change them; if changed, the new values become the persisted ones.
Context: PII in `localStorage`, on the buyer's own device, never transmitted anywhere except into the WhatsApp message the buyer themselves sends.
Explanation: Behaviour this implies:

**The form is hidden when saved details exist (user decision, 2026-07-31).** A returning buyer does not see a form at all — they see their saved details and go straight to `Cotizar`, and the saved values feed the quote directly. The form appears only if they press the control to use different information.

Three states, and the first one is the one that is easy to get wrong:

1. **No saved details** (first visit, or after "olvidar mis datos"). The form is shown, expanded, as the only way forward. There is nothing to collapse.
2. **Saved details present.** No form. A read-only summary of name, last name, and email, plus a control along the lines of *usar otros datos*. `Cotizar` is the primary action and is immediately available — this is the whole point of the decision, and it is what turns a repeat quote into two taps.
3. **Saved details, buyer chose to change them.** The form is revealed, prefilled with the saved values so a one-field correction does not mean retyping three. Submitting overwrites the saved values.

Consequences:

- **The saved details still have to be validated before use, not just on entry.** They come back out of `localStorage`, which is user-writable, and in state 2 they flow into the outbound message *without passing through a form*. That removes the form — and `react-hook-form` with it — from the path entirely, so the same shape checks must run on rehydrate and again at message-build time, from a shared pure validator rather than from the form's field rules. This is the direct cost of hiding the form and it is not optional.
- **If the saved details fail validation, fall back to state 1** — show the form, prefilled with whatever survived. Never render a summary of a half-valid record and never silently send it.
- Revealing the form must move focus into it and be announced; a `Cotizar` button that changes what it does depending on a collapsed region is a screen-reader trap otherwise.
- **The contact block must clear independently of the cart.** UI III clears the cart after hand-off; the contact details deliberately survive that. Two persisted slices, one lifecycle each.
- The same validate-on-rehydrate rule as the cart applies — these strings flow into an outbound message, so they are a trust boundary on the way back in as much as on the way out. Length caps and an email shape check on rehydrate, drop rather than repair.
- **Never sent to analytics.** Story 5 AC 3 already states this; the redaction in `ANALYTICS_EVENT_CONTRACT.md:75` is a backstop, not the control.
- Design consequence: "remembered" state needs to be visible and reversible. A buyer must be able to find and wipe their own details without clearing browser storage — a plain "olvidar mis datos" is enough.

III: Question: Does the cart expire?
Status: **answered by the user, 2026-07-31 — no explicit expiry.** Staleness is handled by revalidation: when prices have changed we take the new prices and tell the buyer.
Context: The answer given describes the revalidation behaviour, which is already Story 3's design (Decision on stale prices, 2026-07-30). Recording it here as: no timestamp, no expiry check on rehydrate.
Explanation: This is the safer combination anyway — an expiry silently destroys a cart the buyer built, whereas revalidation makes staleness visible at exactly the moment it matters. Note that with no expiry, a cart can be arbitrarily old, so Story 3's "variant no longer exists" state is not an edge case to hand-wave; it is the normal outcome for a cart left for months.

### WhatsApp Integration

I: Question: What is the destination WhatsApp number?
Status: **answered by the user, 2026-07-31 — `222 441 7330`** (Puebla, area code 222). **Story 4 is no longer hard-blocked.**
Context: This was the last piece of business data missing for this epic. It also partly unblocks the deferred `LocalBusiness` JSON-LD in `docs/improvement.md:62-70`, which still needs the legal name, address, and hours.
Explanation:

- **Value to configure:** `NEXT_PUBLIC_WHATSAPP_NUMBER=522224417330` — country code `52` plus the ten national digits, no `+`, no spaces.
- **Verify the `521` variant before fixing this.** Mexican mobile numbers historically required an extra `1` after the country code on WhatsApp (`521…`), and the two forms are not interchangeable everywhere. Open `https://wa.me/522224417330` once; if it does not resolve to the right chat, use `5212224417330`. This is a 30-second check and it is the difference between a working CTA and a dead one.
- **The number must be registered on WhatsApp** (personal, Business app, or Business Platform). A landline that has never been registered produces a valid-looking link that goes nowhere.
- **It becomes fully public.** `NEXT_PUBLIC_` values are compiled into the client bundle, and the link exposes it in the DOM. That is inherent to click-to-chat, not a leak — but it should be a number the business is content to publish. Note that Spike 4S may require a *different, dedicated* number if the Cloud API is chosen, since an API number cannot also run in the WhatsApp Business app.
- **Single number, not routed per category or brand.** Nothing in the current data model carries a seller-per-category mapping, and inventing one is out of scope.

II: Question: Is the exact Spanish message wording approved?
Status: **answered by the user, 2026-07-31 — Option A, the formal purchase-order style.** This is the format Story 4 builds. Options B and C are kept below as the record of what was rejected and why.
Context: The seller who reads these every day was not the reviewer; if they push back after seeing real messages, the wording is one pure function and its tests. Option C stays the named fallback if message length becomes the problem.
Explanation: All three carry identical information and identical escaping; they differ only in tone and in how many characters they spend to convey it. Character counts are plain text for the same two-line sample cart — the encoded length is what the budget is measured against, but the ratio between the options holds.

**Option A — Formal, purchase-order style (~330 chars) — CHOSEN**

```
*Solicitud de cotización* · TH-260731-A4F2

Cliente: Rafael Moro
Correo: rafael@example.com

1) BRO-1234 · Broca Larga Acero A.V.
   1/4" · 3 pz · $120.00 c/u · $360.00
2) KT-9981 · Llave Hexagonal Bondhus
   Sin variante seleccionada · 2 pz

*Subtotal (líneas con precio):* $360.00 MXN
2 productos · 5 piezas · 1 línea sin variante
```

Reads as a document, not a chat message. Fixed field order means the seller scans a column rather than parsing prose, and the whole block survives a copy-paste into their own system.

**Option B — Conversational, human (~370 chars)**

```
¡Hola! Me interesa cotizar estos productos.

Soy Rafael Moro · rafael@example.com
Referencia: TH-260731-A4F2

• 3 pz — Broca Larga Acero A.V. 1/4"
  Clave BRO-1234 · $120.00 c/u
• 2 pz — Llave Hexagonal Bondhus
  Clave KT-9981 · falta elegir medida

Subtotal aproximado: $360.00 MXN
¿Me confirmas disponibilidad y precio final?
```

Sounds like a person wrote it, and the closing question invites a reply, which matters if reply rate is the metric. Costs the most characters, and puts the quantity before the SKU — friendlier to read, slower to transcribe. **Avoid emoji**: each one is four bytes and costs twelve characters percent-encoded.

**Option C — Compact, data-first (~200 chars)**

```
COT TH-260731-A4F2
Rafael Moro | rafael@example.com

BRO-1234 | 1/4" | 3 pz | $360.00
KT-9981 | s/variante | 2 pz | -

Subtotal $360.00 MXN · 1 línea sin precio
```

Roughly 40% fewer characters, so **substantially more lines fit before a split** — this is the lever if batching turns out to annoy the seller. The cost is legibility: pipe-delimited rows are hard to read on a phone, and abbreviations like `s/variante` need to be learned once.

**Chosen: A.** The seller is the reader, and this is their working document — the fixed field order and the explicit `Sin variante seleccionada` are what stop a follow-up round of questions, which is the stated goal of the whole epic. B spends its extra characters on warmth a supplier receiving orders does not need. C stays in reserve: if the seller review or Spike 4S says multi-part sends are unacceptable, switching A→C buys back most of the length before anything else has to change.

Implementation notes for A specifically: the `*asterisk*` bold on the header and subtotal lines is WhatsApp markup and must survive escaping, while every interpolated value must have that same markup stripped from it — the escape function applies to values, never to the template. Line numbering is continuous across parts in a multi-part quote. The `Sin variante seleccionada` line carries no price and no `c/u`, and the subtotal label says `(líneas con precio)` so the number is never read as the quote total.

Sub-question still open for the seller: is receiving 2-3 sequential messages for a large quote acceptable, or would they rather get part 1 and reply asking for the rest?

III: Question: How should the flow behave when the message exceeds the safe encoded-URL budget?
Status: **answered by the user, 2026-07-31 — split into batched sends.** No truncation, no cart-size cap, no field dropping; every line is sent in full across as many messages as it takes. Design detailed in "Decision 3 → Overflow".
Context: ~700-900 plain-text characters, roughly 8-12 lines, before the encoded URL becomes unsafe.
Explanation: The cost this accepts is that WhatsApp cannot queue several prefilled messages from one link — the buyer must return to the browser and press the next CTA, and a buyer who abandons after part 1 leaves the seller with a partial quote. That is contained, not eliminated, by making part 1 self-sufficient (reference, contact, line count, subtotal) and labelling every part `Parte N de M` so a missing part is visible. Remaining sub-question for the seller: is receiving 3 sequential messages acceptable in their day-to-day, or would they rather get part 1 alone and reply asking for the rest?

IV: Question: Does the browser's URL-length ceiling, not WhatsApp's, set the real threshold?
Status: **answered by the user, 2026-07-31 — ship the 1800 cap.** The device measurement below stays as a follow-up to tune the constant on evidence; it does not gate Story 4.
Context: The bound is a conservative engineering figure, not a documented limit. WhatsApp itself is not the binding constraint — the Cloud API documents a 4096-character body — the URL handler between the browser and the app is.

**Cap: `WHATSAPP_URL_MAX_ENCODED_LENGTH = 1800`**, measured on the **entire URL**, not just the `text` parameter. The base (`https://wa.me/522224417330?text=`) is ~32 characters and must come out of the budget. 1800 encoded is roughly 600-800 plain Spanish characters — about 7-10 lines in Option A, 12-15 in Option C.

Why 1800 and not 2000 or 4000: the failure modes are wildly asymmetric. Too low costs one extra message on an unusually large quote. Too high produces a **silently truncated** message — the seller receives a quote that looks complete and is not, and nobody finds out until the wrong goods are priced. Pick low, raise it later on evidence.

**What answering it properly takes** — 20 minutes, no code:

1. Build three `wa.me` URLs with a known encoded length each (~1500, ~2500, ~4000). Padding the `text` with repeated Spanish text is enough; accented characters make it realistic.
2. Open each on the three targets that matter: a real Android phone in Chrome, a real iPhone in Safari, and a desktop browser handing off to WhatsApp Web or Desktop. Emulators do not exercise the OS-level URL handoff, which is the thing being tested.
3. For each, check whether the text lands **complete** in the composer — not whether the link opens. Truncation here is silent; the chat opens fine with a shortened message.
4. The lowest length that fails anywhere, minus a margin, is the cap.

The one prerequisite is a device with WhatsApp installed and a number to test against — the destination number is now known (WhatsApp I), and testing against one's own number works equally well. This is exactly the manual-QA class of check that cannot be done in jsdom and should not be faked there.

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
Status: **answered by the user, 2026-07-31 — no.** `measurementUnit` and `packageQuantity` are not added to any query, any cart line, or the message. This overrides the recommendation above.
Context: `product_variant` has `measurementUnit`, `packageQuantity`, `material`, `stock`, and `quantity` (required, min 1), plus `pricing.pricePromotion` — none selected by any frontend query, and their population rate in live data was never verified.
Explanation: Quantities are therefore expressed in pieces throughout, matching the drawer's existing `N piezas` phrasing — no new unit vocabulary anywhere. The residual risk is the one this epic exists to reduce: if a variant is genuinely sold by the box, "3 pz" and "3 cajas de 100 pz" are different quotes and the seller has to ask. That is acceptable while the fields are of unverified quality — shipping a *wrong* unit is worse than shipping none. Revisit if the seller reports unit ambiguity in real quotes; it is one query field and one line of copy, additive with no refactor.

VI: Question: Is `pricing.pricePromotion` a real promotional price that should override `price` in a quote?
Status: **answered by the user, 2026-07-31 — ignore it.** Promotions are not being handled at this time.
Context: `shared.pricing` has `price` (decimal, required, min 0) and `pricePromotion` (**string**, optional). Nothing in the frontend selects it.
Explanation: `price` is the only price this epic reads, quotes, sums, or sends. Two consequences worth stating so nobody re-derives them later: it is typed as a string rather than a decimal, so it is not computable without a parsing decision nobody has made; and quoting the wrong number to a buyer is the expensive failure mode here. If promotions arrive later, the field's type is the first thing to fix on the backend, not the first thing to consume on the frontend.

VII: Question: Is the Strapi API token write-capable?
Status: **answered by the user, 2026-07-31 — moot for this repo. Nothing here writes to Strapi.**
Context: Mutations (`createProductVariant`, etc.) exist in the schema, but the token's actual role permissions live in the database, not the repo.
Explanation: Confirms the epic's read-only posture — no quote, lead, or customer record is written anywhere (see IV: no such content type exists either). The one thing that does *not* go away with this answer: if the token in `STRAPI_API_TOKEN` happens to be write-capable, that is a standing security concern independent of this epic, because it reaches a server-side Apollo client on every request. Worth checking once in the Strapi admin, as its own task, not as part of this work.

### Verification

I: Question: How is the WhatsApp hand-off tested?
Status: **answered by the user, 2026-07-31 — unit tests plus manual validation.** No e2e framework, no new test dependency.
Explanation: The split:

- **Unit** — the pure message builder, exhaustively: escaping (WhatsApp markup, newlines, control characters, in values only and never in the template), variant-less lines, subtotal exclusion, the quote reference, the encoded-length measurement, and the multi-part split landing on a line boundary with a self-sufficient part 1.
- **Component** — assert the anchor's `href` and the disabled `<span aria-disabled="true">` fallback. Nothing more; the `href` *is* the contract.
- **Manual, on a real device** — that the link actually opens WhatsApp, resolves to the right chat (`52…` versus `521…`, WhatsApp I), and that the text arrives **complete** in the composer. jsdom cannot navigate to a `wa.me` URL or observe truncation, and a test that pretends to is worse than no test.

Manual QA is the user's own workflow, and it is the only thing that can catch the two highest-risk failures in this epic: a dead number and a silently truncated message.

II: Question: How is persistence tested given jsdom's `localStorage`?
Status: **answered by the user, 2026-07-31 — yes, jsdom's `localStorage`.** That answers it: Jest already runs `jest-environment-jsdom`, which supplies a working `localStorage`, so no mock, no polyfill, no new dependency.
Explanation: What that leaves to get right in the tests themselves:

- **Clear storage between tests.** jsdom's `localStorage` persists across tests within a file, so a leftover blob silently contaminates the next case. Explicit cleanup in `beforeEach`, not reliance on Jest's isolation.
- **Create a fresh store per test.** `zustand/persist` rehydrates when the store is created, so a module-level store would read storage exactly once for the whole file. The provider-wraps-store pattern this epic already uses makes this natural — it is a reason for that pattern, not just a consequence.
- The cases that matter are the adversarial ones, because `localStorage` is a trust boundary: truncated JSON, valid JSON of the wrong shape, a negative quantity, a `NaN` price, a `documentId` failing `DOCUMENT_ID_PATTERN`, and an oversized blob. Each must drop the bad line and leave the rest usable — never throw, never repair.
- Version migration: a v1 blob read by a v2 store drops cleanly rather than crashing.
- The contact slice needs the same adversarial treatment, and specifically the collapsed-form path (Persistence II) where saved details reach the message without the form running.

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

The epic is broken into five independently deliverable stories plus one timeboxed spike. The three decisions the user asked for are settled with reasoning: a single `/cotizar` route, `localStorage` via `zustand/persist`, and a SKU-first `wa.me` deep link with escaping and a measured length budget that splits into batched sends rather than truncating.

Story 1 is fully unblocked and researched in depth at `ai-research/cart-quote-whatsapp/cart-state-persistence.story-1.md`. Stories 2, 3, and 5 are unblocked — the Strapi contract questions were answered on 2026-07-30 and made Story 3 *smaller* than assumed (one batched query rather than a per-product fan-out).

**Every epic-level open question is now answered (2026-07-31), and no story is hard-blocked.** The only outstanding items are non-blocking follow-ups: the seller's reaction to the Option A wording once they see real messages, the device measurement behind the 1800-character cap, and Spike 4S. Story 1's own open questions remain in its story doc. The WhatsApp number arrived (`522224417330`), which was the last piece of missing business data. Story 4 remains gated on **Spike 4S**, which prices click-to-chat against the Cloud API and the BSPs before we commit to a message pipeline; the spike needs no code and can run today. Two items are pending but non-blocking: the seller's pick among the three message tones, and the device measurement behind the 1800-character cap.

The one finding that changes the design rather than the estimate: `internalId` is optional and non-unique in Strapi, so it is display text, not a key. Every story treats the variant's `documentId` as the identity.

One new dependency, `react-hook-form`, is added by Story 4 only (user decision, 2026-07-31); Stories 1, 2, 3, and 5 add none. No backend change is required by any story.

Awaiting human sign-off.
