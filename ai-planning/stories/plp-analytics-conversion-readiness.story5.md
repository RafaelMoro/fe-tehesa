# Story 5 - Analytics And Conversion Readiness (Plan)

Source research: `ai-research/stories/plp-analytics-conversion-readiness.story5.md`
Epic: `ai-research/epics/plp-functionality-seo.epic.md` (Story 5)
Sign-off: research scope confirmed with the user during research (deliverable = contract document only). The **contract doc itself** still needs product/marketing sign-off before any instrumentation story starts — that is an output of this story, not a precondition.

**Deliverable: one markdown document plus two index lines. No `src/**` change, no dependency, no provider script.**

## Decisions (user, at plan time)

1. **Second provider undecided** (Analytics Contract I) — decided later. The contract stays vendor-neutral; a recommendation section names the tradeoffs. Not a blocker.
2. **Notification model + pattern guard, not a consent gate** (Analytics Contract II) — **closed, no longer an open question.** The user is *informed* that analytics runs; there is no grant/deny choice, so `track()` is always pass-through. `search_term` is sent verbatim, with email- and phone-shaped values redacted at the `track()` choke point. See "Disclosure model and PII guard" below.
3. **`product_ids` = capped flat string, cap 10** (Analytics Contract III) — decided. Cap lives in one constant in `src/shared/constants/`; the GA4 adapter expands the 10 into `items`.
4. **`catalog_search_mode_changed`: deferred to sign-off** (Analytics Contract IV) — named in the contract, marked deferred, no cost analysis beyond one line. `searchMode` stays private to `CatalogSearchDrawer`; revisit after marketing/business sign-off.
5. **`page_result_count` defined now**, `total_result_count` added additively when `products_connection` lands (Catalog Behavior I, answered).
6. **`product_id = customId`, `product_doc_id = documentId`** (Strapi Contract I, answered). `customId` is not currently selected by the product queries — adding it is the future implementation story's one-field change, noted in the doc, **not done here**.

All research file:line citations were re-verified against `src/features/Home/Home.tsx` at plan time and still match.

### Disclosure model and PII guard (replaces the consent gate)

Per decision 2, the contract specifies a **disclosure**, not a gate: the user is told analytics is in use (aviso de privacidad / notice link), and `track()` sends unconditionally. Four points the doc must state plainly so this reads as a recorded choice, not an oversight:

- **Why notice is sufficient.** Mexico's LFPDPPP works on a privacy-notice basis with tacit consent for non-sensitive data, so notice-plus-opportunity-to-object is the normal shape for a MX-only storefront. GDPR/ePrivacy opt-in would only apply to EU-targeted traffic. The contract records MX-only as the assumed jurisdiction — revisit if that changes.
- **Why the PII rule still bites.** GA4's ToS forbids PII in event parameters **regardless of consent**, and enforcement is data deletion, not a fine: Google scans for email- and phone-shaped values and can retroactively delete the affected data. The exposure is losing search-funnel history months after collection starts — exactly the data this contract exists to gather.
- **The guard.** `search_term` is sent verbatim (trimmed and allowlisted by the existing pre-Strapi validation, truncated to GA4's 100-char parameter limit). Before dispatch, `track()` redacts any string parameter matching an email pattern or a long digit run, substituting a fixed marker. It sits at the single choke point, so it covers `catalog_search_submitted`, the `catalog_search_results_viewed` echo, the deferred `catalog_local_filter_applied.filter_value`, and any free-text field added later without anyone re-reading this doc.
- **Scope of the risk.** Of the three primary events, exactly one value is user-typed — the wide-search term — appearing in two payloads. `catalog_filter_selected` and the category/brand variants of `catalog_search_results_viewed` carry Strapi taxonomy names from a closed set and have no PII surface. The doc should say this, so nobody over-engineers the guard later.
- **What a future opt-out would need.** The adapter keeps a single boolean choke point in `track()` (default `true`), so a kill switch or an EU-facing opt-out is a one-line change later. No buffer, no flush, no banner, no cookie, no route is designed by this story.

## Acceptance Criteria

1. A committed event-contract document (`docs/ANALYTICS_EVENT_CONTRACT.md`) lists every measured PLP interaction with its event name, trigger point (file + handler), payload fields, field types, and whether each field is always present or conditional.
2. The contract documents the reliability caveats of each payload field — in particular that result counts are page-level (max 50) and not catalog totals, and that local-filter counts describe only the currently visible working set.
3. The contract specifies a vendor-agnostic adapter shape (single `track(event)` entry point, event union type, provider registry, consent gate, client-only boundary) precise enough to implement without further product input, and names the GA4 payload limits it must satisfy.
4. `package.json` still contains no analytics dependency, and no `window.gtag`/`dataLayer`/provider script is added by this story.
5. The `Agregar al carrito` conversion event is specified in the contract but explicitly marked blocked on the separate cart story, with the payload it will carry once the cart exists.

## Affected Files

| Area | File | Action |
|---|---|---|
| docs | `docs/ANALYTICS_EVENT_CONTRACT.md` | Create |
| docs index | `CLAUDE.md` ("See Also", line ~187) | Modify — one line |
| docs index | `REPO_CONTEXT.md` (docs/See-Also list) | Modify — one line |

`src/**`, `package.json`, `next.config.ts`, and all test files: **untouched**.

---

## Phase 1 — Write `docs/ANALYTICS_EVENT_CONTRACT.md`

### Changes Required

**Create `docs/ANALYTICS_EVENT_CONTRACT.md`** with these sections in order. Content comes from the research doc; do not re-derive it.

1. **Status header** — documentation-only contract, no code shipped, requires product/marketing sign-off before the instrumentation story starts (merging ≠ approval). Link back to the research doc.
2. **Naming convention** — `snake_case`, domain-prefixed, ≤40 chars (GA4 hard limit for event *and* parameter names). Payloads are flat objects of primitives: no nested objects, no arrays of objects.
3. **Event catalogue**, three tables — Primary, Secondary, Conversion (blocked) — each row: event name, trigger (`file:line` + handler/effect name), payload fields with type and **required / conditional** marked per field.
   - Primary: `catalog_search_submitted` (`Home.tsx:232` `handleCatalogNameSearchSubmit`), `catalog_search_results_viewed` (`Home.tsx:130` results effect), `catalog_filter_selected` (`Home.tsx:218`/`:225`).
   - Secondary: `catalog_local_filter_applied` (`Home.tsx:191`/`:200`/`:209`), `catalog_filters_cleared` (`Home.tsx:243`/`:250`), `catalog_page_changed` (pagination anchors, `Home.tsx:350-470`), `product_detail_opened` (`Home.tsx:259` `handleProductClick`), `product_variants_selected` (`ProductVariantsDrawer.tsx`).
   - Conversion: `add_to_cart` — **blocked on the cart story**, GA4 reserved name kept deliberately, two future origins (`variants_drawer`, `product_card` — the latter's handler is currently commented out). Satisfies AC5.
   - Deferred and named only: `catalog_search_mode_changed` — one line noting `searchMode` is local state in `CatalogSearchDrawer.tsx:99-112` and the event is deferred pending sign-off. No cost analysis.
4. **Why submit and results-viewed are split** — the submit handler navigates to a server-rendered URL, so neither count nor IDs exist at submit time; the split also makes zero-result searches (`is_empty`) and abandoned searches measurable.
5. **Reliability caveats (AC2)** — one subsection per caveat, verbatim intent from research: page-level `page_result_count` (50 means "at least 50", never sum it), `visible_result_count` = current page only, hardcoded `KNOWN_PRODUCT_TOTAL = 333` / 7-page ceiling must never be emitted, `product_ids` 100-char cap, denormalized `min_price`/`max_price`/`variant_count` are indicative not authoritative, `search_type` on submit is always `"name"` today, and the 500 ms / 250 ms close delays mean events fire **at the handler**, never after the delay.
6. **Adapter contract (AC3)** — `track(event: AnalyticsEvent): void` from `src/shared/analytics/`; discriminated-union event type; provider registry array of `{ name, send(event) }`; **PII redaction pass over string parameters inside `track()`, before provider dispatch** (email pattern + long digit run → fixed marker), stated as a mandatory adapter behavior with its GA4-ToS rationale; **disclosure model with a single boolean choke point in `track()`** per the section above (satisfies AC3's gate requirement without designing consent UI — say explicitly that no banner, cookie, or route is in scope, and that the theme cookie flow in `src/shared/lib/global.lib.ts` + `/api/preferences` is the precedent if an opt-out is ever needed); client-only with a `typeof window` guard so SSR imports are safe; no dependency. Name the GA4 limits it must satisfy: 40-char event/param names, 100-char text param values, 25 params per event.
7. **App Router `page_view` gap** — client navigations (`router.push`, `next/link`) do not fire GA4 `page_view`; the provider adapter owns a manual `page_view` on `pathname`+`searchParams` change or pages 2-7 are invisible. Keep this in its own adapter-concern section, separate from the PLP event catalogue.
8. **Edge cases** — strip `?notice=end` from any captured URL; fire results-viewed only from the render effect so the page-1 redirect (`src/app/page.tsx:48-53`) is not reported as an empty page; use the trimmed/allowlisted search term, redact PII patterns, **then** truncate to 100 chars — order matters: truncating first can cut an email mid-address so it no longer matches the pattern and leaks a fragment; omit `min_price`/`max_price` when null rather than sending `0` (mirrors the SEO `ItemList` omitting `offers`).
9. **Recommendations** — GA4 first; second-provider criteria (session-replay accepts this as-is; product-analytics needs no compromise; Meta Pixel needs a name mapping in its adapter); ship only the primary three events in the first instrumentation story.
10. **Decisions log** — settled: disclosure-not-consent, `search_term` sent verbatim behind the adapter PII guard, `product_ids` capped flat string at 10. Still open for sign-off: second provider (deferred by the user), and whether `catalog_search_mode_changed` is wanted. Each open item states the recommendation so sign-off is a yes/no.

### Success Criteria

- **Automated:** none required — no `src/**` change. `grep -rn "gtag\|dataLayer" src/` returns nothing and `git diff package.json` is empty (AC4).
- **Manual review pass** (the real gate): every event row cites a `file:line` that exists and holds the named handler; every payload field maps to a value actually in scope at that trigger site; no field claims a catalog total the app cannot compute.

---

## Phase 2 — Index the doc

### Changes Required

- **Modify `CLAUDE.md`**, "See Also" list (after line 187): add
  `- \`docs/ANALYTICS_EVENT_CONTRACT.md\` — PLP analytics event contract (spec only; no analytics code ships yet)`
- **Modify `REPO_CONTEXT.md`**, its docs/See-Also list: same one-line pointer, phrased to match surrounding entries.

Do **not** scatter event names into component comments — the doc is the single source.

### Success Criteria

- **Automated:** `pnpm lint` (harmless, proves nothing — markdown only).
- **Manual:** both index lines render and the relative path resolves.

## Verification Coverage

| Area/File | Check | Verification reference |
|---|---|---|
| `docs/ANALYTICS_EVENT_CONTRACT.md` | Every event has name + `file:line` trigger + typed payload + required/conditional marks (AC1); caveats section present (AC2); adapter section complete (AC3); `add_to_cart` marked blocked (AC5) | manual review pass against `src/features/Home/Home.tsx` and `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` |
| `package.json`, `src/**` | No analytics dependency, no `gtag`/`dataLayer` (AC4) | `git diff package.json` empty + `grep -rn "gtag\|dataLayer" src/` |
| `CLAUDE.md`, `REPO_CONTEXT.md` | Doc discoverable from the index | manual |

No Jest work: nothing under `src/` changes, so there is nothing to test. The pure event-builder functions worth testing belong to the future instrumentation story, per `docs/UNIT_TESTING_GUIDELINES.md`.

## Cross-Cutting Concerns

- **Trust boundary note only:** search terms are user free text and flow into payloads; the doc states the trimmed/allowlisted value is used and truncated. No code enforces this yet.
- **Server/client boundary:** documented as an adapter requirement (`typeof window` guard), not implemented.

## Out Of Scope

- Any `track()` implementation, `src/shared/analytics/` module, event constants, or types.
- GA4 or any provider script, `@next/third-parties`, the disclosure notice UI/copy, any consent banner or cookie, or an `/api/consent` route.
- Adding `customId` to the product GraphQL queries.
- Lifting `searchMode` out of `CatalogSearchDrawer`.
- Wiring `add_to_cart` (blocked on the cart story) or un-commenting the `ProductCard` CTA.

## Open Questions

Carried into the doc's sign-off section, not resolved by this plan:

- **Second provider** (Analytics Contract I) — deferred by the user; contract stays neutral.
- **`catalog_search_mode_changed`** (IV) — deferred to marketing/business sign-off.

Settled, no longer open: disclosure-not-consent plus the adapter PII guard (II), `product_ids` capped flat string at 10 (III). Neither blocks the instrumentation story.
