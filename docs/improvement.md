# BE

Reliable product counts:

> **Resolved on the backend already — verified 2026-07-27 by live GraphQL introspection during Story 4 research.** `products_connection(pagination: $pagination)` returns `pageInfo { total page pageSize pageCount }` alongside `nodes { ... }` and accepts the same `ProductFiltersInput` as `products`. The contract asked for below already exists; the gap is purely frontend adoption. Tracked as a frontend scope decision in `ai-research/stories/plp-seo-readiness.story4.md` (Catalog Behavior I) — deliberately **not** part of Story 4. The notes below are kept for history.

- Current frontend cannot know a reliable total product count from GraphQL responses.
- Current workaround is response-length inference: 50 results means another page may exist; fewer than 50 means last page.
- This is enough for next/previous navigation but not enough for accurate `333 productos`, `pagina 2 de 7`, filtered result totals, analytics result counts, or SEO summaries.
- Recommended BE improvement is a count-capable product query or metadata field that returns total count for the same filters used by the product list.
- Count behavior should work for unfiltered catalog, name search, category search, brand search, and combined filters if BE supports them.
- A reliable count should come from the backend/source of truth, not from the frontend fetching all pages and counting locally.

Suggested BE contract shape:

- Product list response includes `items` and `pageInfo`/`meta` with `total`, `page`, `pageSize`, `pageCount`, `hasNextPage`, and `hasPreviousPage`.
- If changing the product list response is too large, expose a lightweight count query that accepts the same `ProductFiltersInput`.
- Keep count semantics clear around published/draft state so frontend counts match visible products.

## Product aggregate fields are unmaintained

Raised during Story 3 planning (`ai-planning/stories/plp-product-detail-signals.story3.md`, Phase 4). This is the backend half of that story's AC4.

- `minPrice`, `maxPrice`, `variantCount`, and `hasOneProductVariant` are **stored scalar columns** on the Product content type (`store-tehesa-api/src/api/product/content-types/product/schema.json`), not computed resolvers.
- There are no lifecycle hooks anywhere in the backend repo (`find src -name "lifecycles*"` returns nothing) and both product services are default `createCoreService` scaffolds. Nothing recomputes these four fields when a `product_variant` is added, edited, or removed.
- They are therefore import-time snapshots that can silently drift from the `product_variants` relation. Add a variant in the admin today and `variantCount` is immediately stale.
- Measured against the live catalog on 2026-07-27: 333 products, **zero drift** between `variantCount` and `hasOneProductVariant`, and 35 genuine single-variant products. The data is currently accurate — it is just structurally unguarded.
- Recommended fix: a lifecycle hook on `product-variant` (`afterCreate` / `afterUpdate` / `afterDelete`) that recomputes the parent product's four aggregate fields from the relation. That makes the defect class unrepresentable rather than merely detectable.
- Story 3 deliberately did **not** add a frontend sweep script for this. A frontend check can only observe drift after it ships; the write side is where it can be prevented, and that is this repository's concern.

## Catalog data defects to correct

Found during Story 3 planning by querying live Strapi. Three products out of 333. Confirmed with the user on 2026-07-27 that the zero prices are **not** legitimate — these are missing prices, not free items.

| Product | `documentId` | Defect |
|---------|--------------|--------|
| Broca Larga Acero A.V. | `w7jb86625axak2ux4hg1crfs` | `variantCount`, `minPrice`, `maxPrice` all null |
| Llave Hexagonal MM Punta de Bola Bondhus | `rcwaiqdmd7bag2ihg5nvrxfm` | `variantCount: 0`, `minPrice`/`maxPrice` of `0` |
| Broquero jacobs | `nk159rp5neguu1lne6c7ihgc` | `variantCount: 1`, `minPrice`/`maxPrice` of `0` |

- Correct the three records, then prevent recurrence. `$0.00` is never a valid catalog price, so the backend should reject or flag it rather than relying on anyone to notice.
- Suggested guards, alongside the lifecycle hook above: a positive-value validation on `minPrice`/`maxPrice`, and blocking publish for a product with zero variants.
- Frontend context: Story 3 deliberately ships no fallback UI for these. Today they render as a card with no price block, a `Explorar las 0 variantes` action, or a `$0.00 MXN` price — all of which read as broken to a buyer. The agreed handling is to fix the data, so these products stay visibly wrong until the records are corrected.

## SEO component is defined but attached to nothing

Found during Story 4 (SEO) research on 2026-07-27.

- `store-tehesa-api/src/components/shared/seo.json` defines `metaTitle` (required), `metaDescription` (required), and `shareImage` (media, images only).
- It is not attached to Product, Category, or Brand. No content-type has an `seo` field, so the frontend has nothing to consume and hardcodes all SEO copy in `src/shared/constants/`.
- Attaching it to Category and Brand would let editors author real titles/descriptions for the `?mode=category` / `?mode=brand` landing URLs instead of the frontend templating them from a taxonomy name.
- `shareImage` would also unblock Open Graph / social share images, which Story 4 drops for lack of any image asset.
- Related: products still have no image field at all (epic Strapi answer III), which is the older and larger blocker — it also blocks Story 3 AC2 and any `Product` rich-result eligibility.

# FE

- Investigate graphql on the server using api from next js
- Change the title and meta description of SEO of the page as the current we have is for the landing.
- Analytics: Story 5 defines the vendor-neutral event contract in `docs/ANALYTICS_EVENT_CONTRACT.md` (planned, not yet implemented). GA4 is the recommended first provider; choose any second provider during contract sign-off, then implement instrumentation in a separate story without adding a provider dependency prematurely.
- Show a notification error when the theme is changed but the cookie persistance failed

## Business data for local SEO structured data (pending)

Deferred from Story 4 (`ai-research/stories/plp-seo-readiness.story4.md`, open question SEO IV) on the user's call: keep it pending here rather than blocking the SEO story.

- `Organization` / `LocalBusiness` JSON-LD is the highest-value structured-data item for a Puebla-based distributor, and it is blocked only on business data — no code is missing.
- Nothing in the repo carries any of it: no legal name, street address, city, postal code, phone, opening hours, logo URL, or social profile URLs (grep over `src/` and `DESIGN.md` finds no `whatsapp`, no `puebla`, no domain).
- **The WhatsApp number is now known** (`222 441 7330`, Puebla; supplied 2026-07-31 for the cart epic) and lands in the codebase as `NEXT_PUBLIC_WHATSAPP_NUMBER` with the cart feature. `LocalBusiness.telephone` can reuse it — everything else on the list is still missing.
- Story 4 therefore ships `WebSite` + `SearchAction`, `ItemList`, and `BreadcrumbList` only. Adding `LocalBusiness` later is additive — one more JSON-LD node, no refactor.
- The production domain (`NEXT_PUBLIC_SITE_URL`) is the other pending value; `LocalBusiness.url` and `logo` need it too.
- Related: the approved meta description promises `Cotiza por WhatsApp`. The copy ships as approved, and the WhatsApp quote CTA lands with the cart feature, not on the PLP.

## Catalog API follow-up

- Story 1a (`ai-research/plp-catalog-api.story.md`) ships the initial catalog API routes with fixed page sizes (50 for products, 100 for variants) to keep the spike thin and match current server-action behavior.
- Caller-controlled page size with sane bounds is a deliberate follow-up, not part of Story 1a.
- This should be addressed by a later story once the API is in use and we know the realistic upper bounds callers need.

## Cart feature follow-up

**Resolved 2026-07-31 by the cart epic's Story 1** (`ai-planning/cart-quote-whatsapp/cart-state-persistence.story-1.md`). Kept for history; the items below no longer describe the current code.

- `ProductVariantsDrawer` now keys selection state (`selectedVariantIds`, `quantities`) by the variant's `documentId`, not array index or `internalId`. Backend research during planning found `internalId` neither required nor unique on `product_variant`, which ruled it out as an identity key — `documentId` (`ID!`, always present, always unique) is now selected by `GET_PRODUCT_VARIANTS` and used throughout.
- `internalId` still rides on every cart line as seller-facing display text (never rendered, never a key), exactly as this entry anticipated.
- Both `Agregar al carrito` CTAs are wired: the drawer footer adds one line per selected variant to the new Zustand cart store (`src/zustand/store/cart.store.ts`, persisted to `localStorage`); the card's tertiary `Agregar y elegir después` adds a variant-less product-level line. A third case this entry didn't anticipate — `variantCount === 1` products — got its own single-CTA `Agregar 1 pieza` card branch.
- Cart totals reuse `formatNumberToCurrency`, as recommended here.

### Quote recovery after the WhatsApp hand-off (deferred)

Deferred on the user's call, 2026-07-31, from `ai-research/epics/cart-quote-whatsapp.epic.md` (open question UI III). The cart **clears** after the WhatsApp hand-off. Recovery beyond an immediate undo is follow-up work, not v1 scope.

- The hand-off is unobservable: clicking a `wa.me` anchor means the link *opened*, never that the message was *sent*. WhatsApp may not be installed, the buyer may back out of the composer, the wrong account may be signed in. In all of those the cart is already gone.
- v1 ships the non-silent minimum — an explicit acknowledgement or an immediately visible undo. What is deferred is durable recovery: a "restaurar última cotización" that survives a reload, i.e. keeping the last sent quote in a separate persisted slot rather than discarding it.
- **Multi-part quotes make this sharper.** A quote too long for one message is split into parts built from the cart, so the clear may only fire after the last part is opened. A buyer who abandons after part 1 has sent the seller a message promising parts that no longer exist.
- The buyer's contact details (name, last name, email) are persisted separately and deliberately survive the clear. Do not fold the two slices together when implementing recovery.
- Worth revisiting once there is any funnel data on how often buyers return to `/cotizar` after a hand-off.

### Quantity field on the single-variant product card (deferred)

Deferred 2026-07-31 from `ai-research/epics/cart-quote-whatsapp.epic.md` (design question 7). The 35 products with `hasOneProductVariant` ship with a single CTA, `Agregar 1 pieza`, which adds exactly one piece. Adjusting the quantity means going to `/cotizar` and editing the line there.

- That is fine for a buyer wanting one or two, and poor for the industrial buyer this catalog targets, who is more likely to want 50. Add-then-navigate-then-edit is three steps for what should be one.
- The improvement is a small quantity input on the card itself, beside the CTA, so the button reads `Agregar` and adds whatever the field holds. The drawer already has exactly this control per variant (`ProductVariantsDrawer.tsx:204`), including its `aria-label` pattern and its empty-string edge case — reuse it rather than inventing a second quantity input.
- Worth doing only once there is evidence buyers are editing quantities on `/cotizar` for these products. Until then the extra control is on every one of those cards for a use case nobody has confirmed.
- Design note if it is built: two cards in the same grid would then have visibly different footers, one with an input and one without. That is a grid-consistency question, not just a component question.

### Product list query does not carry single-variant data

Raised 2026-07-31 alongside the cart epic. Verified in `src/shared/queries/global.queries.ts`.

- All four product-list queries — `GET_PRODUCTS`, `GET_PRODUCTS_BY_CATEGORY`, `GET_PRODUCTS_BY_BRAND`, `GET_PRODUCTS_BY_NAME` — select the same product scalars and **none selects `product_variants`**. The only query that reaches variants is `GET_PRODUCT_VARIANTS`, by single `documentId`.
- A cart line needs the variant's `documentId` (the identity key), `internalId` (for the WhatsApp message), and `diameter` (for display). None is on the card. Price is the exception: `minPrice === maxPrice` for a single-variant product, so it is already there.
- Consequence: the `Agregar 1 pieza` CTA fetches the variant on click, which puts a round trip inside a button press and forces the button to carry pending and failure states.
- **The optimisation** is to select `product_variants(pagination: { limit: 1 }) { documentId internalId diameter pricing { price } }` on the list queries, so a single-variant card can add its line with no request at all.
- **Why it is not being done now:** that join runs for all 50 products on every page to serve the ~10.5% (35 of 333) that are single-variant. Whether that trade is worth it depends on the CTA's actual click rate, which does not exist yet. Revisit once it does.
- A backend-side alternative worth pricing at the same time: exposing the single variant's identity as a field on `product` for the `hasOneProductVariant` case, which would avoid the relation join entirely. That is a Strapi change, not a frontend one.

### PDF quote document and email delivery (idea, not scoped)

Raised 2026-07-31 alongside the cart epic. WhatsApp click-to-chat is the v1 channel; this is the natural second one. Two related but separable ideas — the second is much cheaper than the first.

**a) Generate a PDF of the quote.** A real document the buyer can keep, forward internally, or attach to their own purchase order. It also sidesteps the WhatsApp length budget entirely: a PDF has no character cap, so a 40-line quote needs no batching. Delivery options are download-in-browser, email attachment, or a WhatsApp attachment (which click-to-chat cannot do — only a programmatic API can, see Spike 4S).

**b) Send the quote as an email.** Either to a fixed internal address that receives every quote, or to the buyer's own address as a copy, or both. Cheaper than (a) and arguably the higher-value half: it produces a **server-side record of every quote**, which is exactly what the current design has none of. Today a quote that the buyer never presses send on simply never existed.

What this would need, none of which exists in this repo today:

- A backend path — the current architecture is read-only against Strapi with no write, no queue, no outbound integration.
- An email provider and credentials that cannot be `NEXT_PUBLIC_`, so a route handler or server action rather than the client-side link the WhatsApp flow uses.
- A PDF approach for (a): server-side rendering is the sane one, since a client-side generator means a new dependency, a large bundle, and fonts. Note the design constraint that `DESIGN.md` mandates Geist Sans and no Geist Mono for prices — a PDF renderer needs those fonts embedded.
- Spam and abuse handling. An unauthenticated endpoint that sends email to an address supplied in a form is an open relay unless rate-limited, and quotes carry buyer PII.
- A decision on whether the seller wants quotes in email at all, or whether WhatsApp is deliberately their whole workflow.

Sequencing note: this overlaps heavily with Spike 4S. If that spike recommends the WhatsApp Cloud API, a backend appears anyway and both of these get much cheaper — worth deciding them together rather than separately.
