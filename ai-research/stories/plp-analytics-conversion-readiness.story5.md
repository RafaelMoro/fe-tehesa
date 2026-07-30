# Story 5 - Analytics And Conversion Readiness (Research)

Epic: `ai-research/epics/plp-functionality-seo.epic.md` (Story 5, lines 147-170; status block lines 631-638)
Status: research only. No source code changes proposed here.
Mode: full template, single-feature (catalog PLP), **documentation-only deliverable**.

## Story Definition

**Title:** Analytics and conversion readiness — write the PLP event contract before any provider lands.

**Description:** The catalog has no analytics code, no adapter, and no written event contract. This story produces the contract: which PLP interactions are measured, the exact event names, the payload fields, where each event fires in the existing component tree, and the constraints a future vendor adapter must respect. It deliberately ships **no code and no dependency** — the adapter (AC3) is specified on paper so a follow-up story can implement it against a chosen provider.

Scope confirmed with the user during research:

- Deliverable is the **contract document only**. No `track()` implementation, no GA4 script, no `package.json` change.
- The second provider is **not decided**; the contract must stay vendor-neutral and the doc carries a short recommendation section.
- The catalog search event is **split in two** (submit + results viewed) because result counts do not exist at submit time.
- Consent gating is **in scope as a design note only** — the contract describes the gate; no banner, no cookie, no code.

### Acceptance Criteria

1. A committed event-contract document (proposed path `docs/ANALYTICS_EVENT_CONTRACT.md`) lists every measured PLP interaction with its event name, trigger point (file + handler), payload fields, field types, and whether each field is always present or conditional.
2. The contract documents the **reliability caveats** of each payload field — in particular that result counts are page-level (max 50) and not catalog totals, and that local-filter counts describe only the currently visible working set.
3. The contract specifies a vendor-agnostic adapter shape (single `track(event)` entry point, event union type, provider registry, consent gate, client-only boundary) precise enough to implement without further product input, and names the GA4 payload limits it must satisfy.
4. `package.json` still contains no analytics dependency, and no `window.gtag`/`dataLayer`/provider script is added by this story.
5. The `Agregar al carrito` conversion event is specified in the contract but explicitly marked blocked on the separate cart story, with the payload it will carry once the cart exists.

### Task Breakdown

1. Inventory the interaction surfaces in the current PLP (done below — Affected Areas).
2. Name the events and fix the naming convention (snake_case, GA4-compatible, ≤40 chars).
3. Define payloads per event, marking each field required/optional and reliable/caveated.
4. Map every event to its exact trigger site in the existing code.
5. Specify the adapter contract, consent gate, and provider-registration shape.
6. Write the recommendations section (GA4 first, second provider criteria, page_view handling for App Router).
7. Add the contract to the docs index (`CLAUDE.md` "See Also", `REPO_CONTEXT.md` if the constraint is broadly useful).

## Design Agent Handoff

Not applicable. This story changes no UI, no user flow, no visual state, and no responsive or accessibility behavior. It produces one markdown document.

## Technical Research

### Affected Areas

No `src/**` file changes. The areas below are the **subjects** of the contract — the trigger sites a later implementation story will touch.

| Surface | File | Interaction available today |
|---|---|---|
| Catalog-wide search submit | `src/features/Home/Home.tsx:232-241` (`handleCatalogNameSearchSubmit`) | Validates term, then navigates to `/?mode=name&q=…&page=1` after a 500 ms drawer-close delay |
| Catalog-wide category select | `src/features/Home/Home.tsx:218-223` (`handleCategorySelect`) | Navigates to `/?mode=category&category=…&page=1` |
| Catalog-wide brand select | `src/features/Home/Home.tsx:225-230` (`handleBrandSelect`) | Navigates to `/?mode=brand&brand=…&page=1` |
| Search results rendered | `src/features/Home/Home.tsx:130-137` (existing `useEffect` on `[initialCatalogFeedback, products]`) | The only place where `products.length` for the new URL is known client-side |
| Search-mode tab switch | `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx:99-112` | Local `searchMode` state (`product` / `category` / `brand`), never lifted to `Home` |
| Frequent-search chips | `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx:145-155` | Hardcoded `frequentSearches`; chip press only sets the term, does not submit |
| Local (visible-set) filters | `src/features/Home/Home.tsx:191-216` (`handleSearch`, `handleLocalCategorySelect`, `handleLocalBrandSelect`) | In-memory filter over the current page only |
| Clear filters | `src/features/Home/Home.tsx:243-257` (`clearLocalFilters`, `clearWideAndLocalFilters`) | Two distinct scopes — local reset vs. full catalog reset + navigation |
| Pagination | `src/features/Home/Home.tsx:350-470` | Base mode: numbered `next/link` anchors. Filtered modes: Anterior/Siguiente anchors. Both are real `<a href>` since Story 4 — a click handler is no longer the only hook, so navigation-based measurement is viable |
| Product detail open | `src/features/Home/Home.tsx:259-262` (`handleProductClick`), rendered by `src/components/ProductCard.tsx` via `src/features/ProductListing/ProductListing.tsx` | Full `Product` object in hand: `documentId`, `name`, `category`, `brand`, `variantCount`, `minPrice`, `maxPrice`, `hasOneProductVariant` |
| Variant selection | `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` | Checkbox + quantity per variant; `selectedVariantIndexes`, `selectedPieces`, `selectedTotal` already computed |
| Conversion CTA | `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx:228-238` | `Agregar al carrito` currently only closes the drawer. `ProductCard` has a second inert CTA with its handler commented out |
| Server params | `src/app/page.tsx:34-52`, `src/features/Pagination/utils.pagination.ts` (`getCatalogSelection`, `parseCatalogParams`) | `mode`, `value`, `page` already parsed purely — the same parse feeds SEO metadata and can feed the results-viewed payload without duplication |

### Proposed Event Set

Naming convention: `snake_case`, domain-prefixed, ≤40 characters (GA4 hard limit for both event and parameter names). Payloads are flat objects of primitives — no nested objects, no arrays of objects — so any vendor can accept them without a transform.

**Primary (this epic's business-critical surface — the search drawer):**

| Event | Trigger | Payload |
|---|---|---|
| `catalog_search_submitted` | `handleCatalogNameSearchSubmit`, after validation passes and before navigation | `search_term` (string, trimmed), `search_type` (`"name"`), `origin` (`"search_drawer"`) |
| `catalog_search_results_viewed` | Results-render effect in `Home`, once per `mode`+`value`+`page` change | `search_type` (`"name" \| "category" \| "brand"`), `search_term` (string — the term, category name, or brand name), `page` (int), `page_result_count` (int, 0-50), `is_empty` (bool), `product_ids` (comma-joined `documentId`s, capped — see limits) |
| `catalog_filter_selected` | `handleCategorySelect` / `handleBrandSelect` | `search_type` (`"category" \| "brand"`), `search_term` (selected name), `origin` (`"search_drawer"`) |

Splitting submit from results-viewed is the only way to satisfy the epic's must-have note ("result count when reliable, returned product identifiers when available"): the submit handler navigates to a server-rendered URL, so at submit time neither the count nor the IDs exist. The split also makes zero-result searches measurable (`is_empty: true`) and keeps abandoned/errored searches visible as submits without a matching view.

**Secondary (follow-up instrumentation once the contract proves out — specified now, so names do not get invented ad hoc later):**

| Event | Trigger | Payload |
|---|---|---|
| `catalog_local_filter_applied` | `handleSearch` / `handleLocalCategorySelect` / `handleLocalBrandSelect` | `filter_type` (`"name" \| "category" \| "brand"`), `filter_value` (string), `visible_result_count` (int), `page` (int) |
| `catalog_filters_cleared` | `clearLocalFilters` / `clearWideAndLocalFilters` | `scope` (`"local" \| "catalog"`) |
| `catalog_page_changed` | Pagination anchors | `mode`, `page_from` (int), `page_to` (int), `control` (`"number" \| "previous" \| "next"`) |
| `product_detail_opened` | `handleProductClick` | `product_id` (`customId` when present, see Strapi Contract I), `product_doc_id` (`documentId`), `product_name`, `category`, `brand`, `variant_count`, `min_price`, `max_price`, `list_mode`, `list_page`, `list_position` (int, index in the rendered grid), `search_term` (optional — carries the search that produced the list, closing the loop the epic asks for) |
| `product_variants_selected` | Drawer selection change (debounced or on CTA press) | `product_id`, `selected_variant_count`, `selected_pieces`, `selected_total`, `currency` (`"MXN"`) |

**Conversion (blocked):**

| Event | Trigger | Payload |
|---|---|---|
| `add_to_cart` | `Agregar al carrito` in the drawer footer — **blocked on the cart story** | `product_id`, `selected_variant_count`, `selected_pieces`, `value` (numeric total), `currency` (`"MXN"`), `origin` (`"variants_drawer" \| "product_card"`) |

`add_to_cart` keeps GA4's reserved name deliberately so the ecommerce report works without a mapping. It stays unimplemented until the cart story lands; the `ProductCard` CTA (handler commented out) is the second origin to wire at that time.

### Payload Reliability Caveats (AC2)

These are the facts an analyst will otherwise misread, and they are the main reason this doc exists before any code:

- **`page_result_count` is page-level, not a catalog total.** Product page size is 50 (`PRODUCT_PAGE_SIZE`); filtered modes infer "there might be more" from `products.length === 50` because Strapi's pagination metadata is not adopted yet. A count of 50 means "at least 50", never "exactly 50". Name the field `page_result_count`, never `result_count`, so nobody sums it into a total. Tracked as epic open question *Catalog Behavior I* (`products_connection`).
- **`visible_result_count` describes the current page only.** `useCatalogSearch`/`applyLocalFilters` filter `allProducts.current` in memory — the 50 products already on screen. It is not a catalog search.
- **`KNOWN_PRODUCT_TOTAL = 333` and the 7-page ceiling are hardcoded** and already flagged as a stale claim in the epic's pending work. No event should emit a total derived from them.
- **`product_ids` needs a cap.** GA4 limits a text parameter value to 100 characters. A Strapi `documentId` runs ~24-26 chars, so a comma-joined list fits roughly 3-4 IDs. The contract must either cap the list (first N, and say N in the doc) or send IDs via the GA4 `items` array in the vendor adapter rather than as a flat string. Recommend the cap for the neutral payload and let the GA4 adapter expand it into `items`.
- **`min_price`/`max_price`/`variant_count` are denormalized Strapi columns with no lifecycle sync** (see Story 3 AC4 / `docs/improvement.md`); three products are known defective. Analytics inherits that defect — the contract should say these fields are indicative, not authoritative.
- **Search-mode tab state lives inside `CatalogSearchDrawer`** (`useState<SearchMode>`) and is never lifted. `search_type` on `catalog_search_submitted` is therefore always `"name"` today; category/brand go through `catalog_filter_selected` instead. If product wants a "user switched search mode" event, that state must be lifted — call it out rather than assuming it is free.
- **The 500 ms drawer-close delay + 250 ms dropdown delay** (`DRAWER_CLOSE_DELAY_MS`, `DROPDOWN_CLOSE_DELAY_MS`) sit between the user action and the navigation. Events must fire at the handler, not after the delay, or a fast route change can drop them.

### Adapter Contract (AC3 — specified, not built)

Shape the contract should mandate, matching this repo's existing conventions:

- **One entry point.** `track(event: AnalyticsEvent): void` exported from `src/shared/analytics/`. UI components import only `track` and never a vendor symbol. This mirrors how `src/shared/utils/seo.utils.ts` keeps the SEO trust boundary in shared code away from feature components.
- **Discriminated union for events.** `type AnalyticsEvent = { name: "catalog_search_submitted"; ... } | …` in `src/shared/types/` or a local `analytics.types.ts`. TypeScript strict mode then makes a wrong payload a build error, which is the cheapest possible contract enforcement and removes any need for a runtime validation library.
- **Provider registry, not a provider import.** An array of `{ name, send(event) }` objects. Adding the second provider is one push, no component change. No provider is registered by this story, so `track` is a no-op.
- **Client-only.** Every trigger site is already `"use client"`. `track` must be safe to call during SSR (guard on `typeof window`) because `Home` runs its results effect after hydration but the module is imported into the server graph.
- **Consent gate (design note, per user decision).** `track` buffers events in a module-level array until consent is granted, then flushes and switches to pass-through. Denied consent drops the buffer. The gate lives in the adapter, not in components, so consent never leaks into feature code. The existing theme flow (`/api/preferences` + `THEME_COOKIE_KEY` + httpOnly cookie, `src/shared/lib/global.lib.ts`) is the precedent to reuse for a future consent cookie — same route-handler envelope, same validation-before-write rule. No banner, cookie, or route is designed by this story.
- **No dependency.** GA4 needs only a `next/script` gtag snippet; the second provider is expected to be equally script-based. `@next/third-parties` would be the only candidate package and is not needed for a `track` shim.

### Existing Patterns To Follow

- Shared cross-cutting code goes in `src/shared/`; feature components import from it via the `@/*` alias. `src/components` stays limited to `ProductCard`.
- Pure, testable helpers over hooks-with-side-effects — `parseCatalogParams`/`buildCatalogMetadata` are the model: the parse is pure and unit tested, the impure edge is thin.
- Constants (event names, cap sizes) belong in `src/shared/constants/`, alongside `catalog.constants.ts` and `seo.constants.ts`.
- Public config uses the `NEXT_PUBLIC_*` + `??` fallback pattern already used by `SITE_URL` — never a throw at module load.

### Verification

Documentation-only, so the usual gates mostly do not apply:

- No `pnpm test`, `pnpm build`, `pnpm lint`, or `pnpm exec tsc --noEmit` change is expected — nothing under `src/` is touched. Running `pnpm lint` once at the end is harmless but proves nothing.
- Real verification is a **review pass**: every event in the contract maps to a real handler/effect at a cited `file:line`, every payload field maps to a value actually in scope at that site, and no field claims a total the app cannot compute.
- Confirm AC4 mechanically: `package.json` diff is empty and `grep -r "gtag\|dataLayer" src/` returns nothing.
- Test rules for the eventual implementation story are in `docs/UNIT_TESTING_GUIDELINES.md` (not duplicated here); the pure event-builder functions are the parts worth testing, per that policy.

### Edge Cases And Constraints

- App Router client navigations (`router.push`, `next/link`) do **not** fire a GA4 `page_view` automatically. The contract must state that the provider adapter is responsible for a manual `page_view` on `pathname`+`searchParams` change, or the base catalog's page 2-7 traffic is invisible. This is a provider-adapter concern, not a PLP-event concern — keep them separate in the doc.
- `?notice=end` is a transient redirect param (Story 4 strips it from canonicals). Any URL captured in a payload must strip it too, or the same page appears under two identities.
- Page >1 with an empty result set server-redirects to page 1 (`src/app/page.tsx:48-53`). A naive results-viewed event would report an empty page that the user never saw. Fire only after the redirect settles — i.e. from the render effect, which by definition runs on the page actually shown.
- Search terms are user input and go into payloads verbatim. They are already trimmed and allowlisted before reaching Strapi (`src/shared/constants` validation rules), but the contract should state that the analytics path reuses the trimmed value, not the raw input, and truncates to GA4's 100-char parameter limit.
- Personally identifying data: search terms are free text and can contain anything a user types. The contract should note the retention/PII stance the provider setup must take (GA4 in particular forbids PII in event parameters). Flagged as an open question.
- Products with `null` prices exist (known Strapi defects). `min_price`/`max_price` must be omitted rather than sent as `0`, mirroring how the SEO `ItemList` omits `offers` when price is null.

## Open Questions

### Analytics Contract

I: Question: Which analytics provider is the second one the contract must accommodate?
Status: pending
Context: The epic answered "GA4 primary, a second provider also planned" (epic lines 507-511) but never named it. The user confirmed during this research that it is still undecided.
Explanation: The contract stays vendor-neutral regardless — flat snake_case payloads, no vendor field shapes. The doc will include a recommendation section noting the tradeoff: a session-replay tool (Clarity/Hotjar) accepts only flat tags and would consume this contract as-is; a product-analytics tool (PostHog/Amplitude) accepts richer payloads and would need no compromise; Meta Pixel would need a name mapping (`Search`, `ViewContent`, `AddToCart`) in its adapter. No blocker for writing the contract.

II: Question: What is the PII / retention stance for `search_term`, which is unrestricted user free text?
Status: pending
Explanation: GA4 forbids PII in event parameters, and a user can type anything into the catalog search. Options are to send it as-is (accept the risk), hash it (loses the analytical value that motivated the event), or gate it behind consent only. Needs a product/legal call before the provider-wiring story, not before the contract doc.

III: Question: Should `product_ids` on `catalog_search_results_viewed` be capped as a flat string, or expanded into GA4's `items` array by the GA4 adapter?
Status: pending
Explanation: A 100-char GA4 parameter fits only ~3-4 `documentId`s. Recommendation is a capped flat field in the neutral contract plus adapter-side expansion into `items` for GA4, so the neutral payload never depends on a vendor feature. Confirm the cap size (proposal: 10 IDs, truncated in the adapter for GA4).

IV: Question: Does product want a "search mode tab switched" event (Producto / Categoría / Marca)?
Status: pending
Context: `searchMode` is local `useState` inside `CatalogSearchDrawer` and is never lifted to `Home`.
Explanation: Not free — it requires lifting state or passing a callback into the drawer. The contract can name the event (`catalog_search_mode_changed`) and mark it deferred, so the implementation cost is a conscious choice later.

### Strapi Contract

I: Question: Does the Strapi `Product` type expose a merchant-facing identifier (`sku`, `internalId`, `slug`) beyond `documentId`, suitable as the analytics `product_id`?
Status: answered (backend-research subagent, local backend repo schemas)
Answer: `Product` has **`customId`** (GraphQL `String`, `unique: true`, **not required**). There is no `sku`, `slug`, or product-level `internalId`. `product-variant` has `internalId` (`String`, **neither required nor unique**), so it is not a safe variant key.
Context: `Product.customId` is not selected by any query in `src/shared/queries/global.queries.ts` today (products select only `documentId`, lines 17/45/67/89; `internalId` appears only under `product_variants`, line 26). Category and brand already expose `customId` and it is used for local filtering (`TaxonomyItem.customId`).
Explanation: Recommend `product_id = customId` when present, `documentId` as the always-present fallback, and emit both (`product_id`, `product_doc_id`) so a join to business records is possible without ever losing the event. Because `customId` is not required in Strapi, the contract must treat it as optional and never assume its presence. Adding `customId` to the product list query is a one-field change the implementation story owns. Do **not** use variant `internalId` as an identifier in `add_to_cart` — it is non-unique and nullable.

### Catalog Behavior

I: Question: Should the analytics story wait for `products_connection` (real pagination totals) before defining `page_result_count`?
Status: answered
Answer: No. Define `page_result_count` now with its page-level caveat documented.
Context: `products_connection` adoption is already deferred at the epic level (Catalog Behavior I, option I) and is also what a real `de 333` copy fix needs.
Explanation: Waiting would block a documentation-only deliverable on a backend adoption decision. When `products_connection` lands, the contract adds `total_result_count` alongside the existing field — additive, no rename, no historical-data break.

### Verification

I: Question: Does the contract document need review sign-off from anyone outside this repo (marketing/product) before the implementation story starts?
Status: pending
Explanation: The whole point of AC1/AC2 is that product defines what matters. If the doc lands without a product review, the implementation story will re-litigate it.

## Recommendations For The Contract Doc

1. **Ship the primary three events only in the first implementation story.** `catalog_search_submitted`, `catalog_search_results_viewed`, `catalog_filter_selected` cover the epic's stated business-critical surface. The secondary set is specified so names are not invented ad hoc, not so it all ships at once.
2. **Keep `add_to_cart` GA4-reserved-named** and blocked on the cart story; do not invent a placeholder conversion.
3. **Put the doc at `docs/ANALYTICS_EVENT_CONTRACT.md`** next to the other canonical docs, and add one line to `CLAUDE.md` "See Also". Do not scatter event names into component comments.
4. **State the page_view gap loudly** — it is the single most likely way GA4 gets set up wrong on an App Router site.
5. **No dependency, no adapter code, no provider script in this story** (AC4). The adapter section is a spec, and the follow-up story implements it in a day once the provider is named.
