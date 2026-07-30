# Analytics Event Contract

## Status

**Documentation-only contract. No code shipped by this doc.** No `track()` implementation, no analytics dependency, no `window.gtag`/`dataLayer`, no provider script exists in this repo yet. This document specifies the event names, payloads, and adapter shape precisely enough for a follow-up instrumentation story to implement without further product input.

**Merging this document is not approval.** It requires **product/marketing sign-off** before the instrumentation story starts — see "Decisions log" below for what is settled and what is still open.

Source research: `ai-research/stories/plp-analytics-conversion-readiness.story5.md`
Epic: `ai-research/epics/plp-functionality-seo.epic.md` (Story 5)

## Naming convention

- Event and parameter names are `snake_case`, domain-prefixed (`catalog_*`, `product_*`), and **≤40 characters** — GA4's hard limit for both event and parameter names.
- Payloads are flat objects of primitives only: no nested objects, no arrays of objects. Any vendor can accept them without a transform.
- GA4 payload limits this contract must satisfy: **40-char** event/parameter names, **100-char** text parameter values, **25 parameters** per event.

## Event catalogue

### Primary (business-critical — the search drawer)

| Event | Trigger | Payload | Required / conditional |
|---|---|---|---|
| `catalog_search_submitted` | `src/features/Home/Home.tsx:232` `handleCatalogNameSearchSubmit`, after validation passes, before navigation | `search_term` (string, trimmed, PII-redacted, ≤100 chars), `search_type` (`"name"`), `origin` (`"search_drawer"`) | All required |
| `catalog_search_results_viewed` | `src/features/Home/Home.tsx:130` results `useEffect` on `[initialCatalogFeedback, products]` | `search_type` (`"name" \| "category" \| "brand"`), `search_term` (string — term/category/brand name, PII-redacted, ≤100 chars), `page` (int), `page_result_count` (int, 0-50), `is_empty` (bool), `product_ids` (string, comma-joined `documentId`s, capped) | All required |
| `catalog_filter_selected` | `src/features/Home/Home.tsx:218` `handleCategorySelect` / `:225` `handleBrandSelect` | `search_type` (`"category" \| "brand"`), `search_term` (selected name), `origin` (`"search_drawer"`) | All required |

Submit and results-viewed are split because the submit handler navigates to a server-rendered URL — neither the result count nor product IDs exist yet at submit time. The split also makes zero-result searches measurable (`is_empty: true`) and keeps abandoned/errored searches visible as submits with no matching view.

### Secondary (specified now so names aren't invented ad hoc later; not part of the first instrumentation story)

| Event | Trigger | Payload | Required / conditional |
|---|---|---|---|
| `catalog_local_filter_applied` | `src/features/Home/Home.tsx:191` `handleSearch` / `:200` `handleLocalCategorySelect` / `:209` `handleLocalBrandSelect` | `filter_type` (`"name" \| "category" \| "brand"`), `filter_value` (string, PII-redacted), `visible_result_count` (int), `page` (int) | All required |
| `catalog_filters_cleared` | `src/features/Home/Home.tsx:243` `clearLocalFilters` / `:250` `clearWideAndLocalFilters` | `scope` (`"local" \| "catalog"`) | Required |
| `catalog_page_changed` | Pagination anchors, `src/features/Home/Home.tsx:350-470` | `mode`, `page_from` (int), `page_to` (int), `control` (`"number" \| "previous" \| "next"`) | All required |
| `product_detail_opened` | `src/features/Home/Home.tsx:259` `handleProductClick` | `product_id` (`customId` when present), `product_doc_id` (`documentId`), `product_name`, `category`, `brand`, `variant_count`, `min_price`, `max_price`, `list_mode`, `list_page`, `list_position` (int), `search_term` (optional) | `product_id` conditional (only when `customId` present); `min_price`/`max_price` conditional (omitted when null); `search_term` conditional; rest required |
| `product_variants_selected` | Drawer selection change, `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` | `product_id`, `selected_variant_count`, `selected_pieces`, `selected_total`, `currency` (`"MXN"`) | All required |

### Conversion (blocked)

| Event | Trigger | Payload | Status |
|---|---|---|---|
| `add_to_cart` | `Agregar al carrito`, `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx:228-238` | `product_id`, `selected_variant_count`, `selected_pieces`, `value` (numeric total), `currency` (`"MXN"`), `origin` (`"variants_drawer" \| "product_card"`) | **Blocked on the cart story.** The drawer CTA currently only closes the drawer; `ProductCard`'s second CTA has its handler commented out. Wire both origins once the cart exists. |

`add_to_cart` deliberately keeps GA4's reserved event name so the ecommerce report works with no mapping. No placeholder conversion event is invented in its place.

### Deferred (named only, no cost analysis)

`catalog_search_mode_changed` — `searchMode` is local `useState` inside `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx:99-112`, never lifted to `Home`. Deferred pending marketing/business sign-off on whether "user switched search mode" is worth the state-lifting cost.

## Why submit and results-viewed are split

The submit handler (`handleCatalogNameSearchSubmit`) navigates to a server-rendered URL; at submit time neither the result count nor the returned product IDs exist client-side. Splitting into two events:

- Makes zero-result searches measurable (`is_empty: true` on the view event).
- Keeps abandoned or errored searches visible as a submit with no matching view.
- Lets the view event double as the source for `catalog_filter_selected`'s downstream `search_type: "category" | "brand"` views, without re-deriving state.

## Reliability caveats

- **`page_result_count` is page-level, never a catalog total.** `PRODUCT_PAGE_SIZE = 50`; filtered modes infer "more may exist" from `products.length === 50` because Strapi pagination metadata (`products_connection`) is not adopted yet. A value of 50 means "at least 50," never "exactly 50." Never sum this field into a total.
- **`visible_result_count` (secondary event) describes the current page only.** Local filters run in memory over `allProducts.current` — the 50 products already on screen — not a catalog-wide search.
- **`KNOWN_PRODUCT_TOTAL = 333` and the derived 7-page ceiling are hardcoded and stale.** No event may emit a total derived from them.
- **`product_ids` is capped at 10 IDs**, comma-joined, in the neutral payload (see "Decisions log"). The GA4 adapter is responsible for expanding the capped list into GA4's `items` array; the neutral contract never depends on a vendor-specific shape.
- **`min_price` / `max_price` / `variant_count` are denormalized Strapi columns with no lifecycle sync** (known defects on a small number of products, see `docs/improvement.md`). Analytics inherits that defect — treat these fields as indicative, not authoritative.
- **`search_type` on `catalog_search_submitted` is always `"name"` today.** Category/brand selection goes through `catalog_filter_selected` instead, because `searchMode` in `CatalogSearchDrawer` is never lifted to `Home`.
- **The 500 ms drawer-close delay (`DRAWER_CLOSE_DELAY_MS`) and 250 ms dropdown-close delay (`DROPDOWN_CLOSE_DELAY_MS`)** sit between the user action and the navigation (`src/features/Home/Home.tsx:34-35`). Events must fire at the handler, never after the delay — a fast route change can otherwise drop them.

## Adapter contract

- **One entry point.** `track(event: AnalyticsEvent): void`, exported from `src/shared/analytics/`. Feature components import only `track`, never a vendor symbol — the same trust-boundary pattern `src/shared/utils/seo.utils.ts` uses for SEO.
- **Discriminated union.** `type AnalyticsEvent = { name: "catalog_search_submitted"; ... } | ...` in `src/shared/types/` or a local `analytics.types.ts`. TypeScript strict mode turns a wrong payload into a build error — the cheapest available contract enforcement, no runtime validation library needed.
- **Provider registry, not a provider import.** An array of `{ name, send(event) }` objects. Adding the second provider is one push with no component change. No provider is registered by this story, so `track` is a no-op until one is.
- **PII redaction pass (mandatory).** Before dispatch to any registered provider, `track()` scans every string parameter for an email pattern or a long digit run and substitutes a fixed marker. Rationale: GA4's Terms of Service forbid PII in event parameters regardless of consent, and enforcement is retroactive data deletion — losing months of search-funnel history is the exposure this contract exists to avoid. This is the single choke point, so it covers `catalog_search_submitted`, the `catalog_search_results_viewed` echo, the deferred `catalog_local_filter_applied.filter_value`, and any free-text field added later without anyone re-reading this doc.
- **Disclosure model, not a consent gate (single boolean choke point).** The user is informed analytics runs (a privacy notice / aviso de privacidad link); there is no grant/deny choice, so `track()` is always pass-through — no buffered queue, no flush, no banner, no cookie, no route. Rationale: Mexico's LFPDPPP operates on a privacy-notice basis with tacit consent for non-sensitive data, so notice-plus-opportunity-to-object is the normal shape for a MX-only storefront (GDPR/ePrivacy opt-in would only apply to EU-targeted traffic; this contract assumes MX-only and should be revisited if that changes). A future kill switch or EU-facing opt-out is a one-line change on that boolean — the theme cookie flow (`POST /api/preferences`, `saveThemeCookie()`, `src/shared/lib/global.lib.ts`) is the precedent to reuse: same route-handler envelope, same validate-before-write rule.
- **Client-only.** Every trigger site is already `"use client"`. `track` must be safe to call during SSR — guard on `typeof window` — because the module can be imported into the server graph even though its calls only fire post-hydration.
- **No dependency.** GA4 needs only a `next/script` gtag snippet; the second provider is expected to be equally script-based. No package is added by this story.

## App Router `page_view` gap

Client-side navigations (`router.push`, `next/link`) do **not** fire GA4's automatic `page_view`. This is a provider-adapter concern, not a PLP-event concern — the GA4 adapter (or equivalent) must fire a manual `page_view` on `pathname` + `searchParams` change, or catalog pages 2-7 are invisible to GA4 entirely. Any future provider adapter must account for this before going live.

## Edge cases

- Strip the transient `?notice=end` redirect param from any captured URL before it lands in a payload — otherwise the same page appears under two identities.
- Fire `catalog_search_results_viewed` only from the results-render effect, never from the navigation handler — this guarantees the page-1 redirect for an empty page `>1` (`src/app/page.tsx:48-53`) is never mis-reported as an empty page the user never saw.
- Order matters for `search_term`: use the already trimmed/allowlisted value → redact PII patterns → **then** truncate to 100 chars. Truncating first can cut an email mid-address so the redaction pattern no longer matches, leaking a fragment.
- Omit `min_price`/`max_price` from `product_detail_opened` when null rather than sending `0` — this mirrors how the SEO `ItemList` omits `offers` for null-priced products.

## Recommendations

- **Ship only the primary three events** (`catalog_search_submitted`, `catalog_search_results_viewed`, `catalog_filter_selected`) in the first instrumentation story. The secondary set is specified so names are not invented ad hoc later, not so everything ships at once.
- **GA4 first.** Second-provider criteria, for whenever that decision is made:
  - A session-replay tool (Clarity/Hotjar) accepts this contract's flat payloads as-is.
  - A product-analytics tool (PostHog/Amplitude) accepts richer payloads and needs no compromise.
  - Meta Pixel would need an event-name mapping (`Search`, `ViewContent`, `AddToCart`) inside its own adapter.
- **Keep `add_to_cart` GA4-reserved-named** and blocked on the cart story rather than inventing a placeholder conversion event.

## Decisions log

**Settled — no longer open:**

- **Disclosure, not consent gate.** The user is informed analytics runs; `track()` is always pass-through. See "Adapter contract" above.
- **`search_term` sent verbatim**, behind the adapter's PII guard (redact email/phone-shaped values before dispatch).
- **`product_ids` capped as a flat string at 10 IDs.** The GA4 adapter expands the capped list into `items`; the neutral payload never depends on the vendor feature.

**Still open — for product/marketing sign-off:**

- **Second analytics provider.** Deferred by the user at plan time. The contract stays vendor-neutral regardless — recommendation: pick based on the tradeoffs above once a candidate is named.
- **`catalog_search_mode_changed`.** Named and deferred. Recommendation: skip unless product specifically wants "user switched search tab" visibility, since it requires lifting `searchMode` state out of `CatalogSearchDrawer`.

Each open item states its recommendation above so sign-off is a yes/no decision, not a re-open of the analysis.
