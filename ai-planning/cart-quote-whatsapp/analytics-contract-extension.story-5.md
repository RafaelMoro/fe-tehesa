# Plan: Story 5 — Analytics Contract Extension For The Cart Funnel

**Source research:** `ai-research/epics/cart-quote-whatsapp.epic.md`, "Story 5: Analytics Contract Extension For The Cart Funnel" (lines 263-272), plus Persistence II (line 727) and the Spike 4S opt-in note (line 625) for the PII wording.
**Research status:** epic header still reads "Awaiting human sign-off," but Stories 1-4 and Spike 4S were planned and implemented from it; this is the last story. **Confirm sign-off before `/implement`.**
**Date:** 2026-09-13
**Story type:** documentation-only. No source files, no tests, no dependencies. `docs/ANALYTICS_EVENT_CONTRACT.md` stays a spec — nothing here adds `track()`, a provider, or any instrumentation code.

**Assumptions:**

- Trigger sites are final: Stories 1-4 are complete on `develop` (commit `dc02e5d`), which is the precondition the epic's Next Steps item 4 named.
- The epic's `product_card` origin covers both card CTAs (`Agregar y elegir después` and the single-variant `Agregar 1 pieza`). The AC names exactly two origin values; a third is not invented.
- `docs/improvement.md` "Cart feature follow-up" was already rewritten to "resolved" by Story 1. AC 4's "reflect what shipped" therefore means: record that the cart funnel is now specified in the contract, and fix the stale FE analytics bullet — not rewrite the section.

## Acceptance Criteria

Copied from the epic, in order:

1. `add_to_cart` moves out of "Conversion (blocked)" with both `origin` values (`variants_drawer`, `product_card`) resolved to real trigger sites.
2. `remove_from_cart`, `view_cart`, `begin_checkout`, and `generate_lead` are specified with flat payloads, keeping GA4's reserved names.
3. The contract states explicitly that the buyer's name and email are **never** sent to any provider — the adapter's mandatory PII redaction (`ANALYTICS_EVENT_CONTRACT.md:75`) is a backstop, not the control.
4. `docs/improvement.md` "Cart feature follow-up" is updated to reflect what shipped.

## Affected Files

**docs**
- `docs/ANALYTICS_EVENT_CONTRACT.md` (modify) — AC 1, 2, 3.
- `docs/improvement.md` (modify) — AC 4.
- `ai-research/epics/cart-quote-whatsapp.epic.md` (modify) — Story 5 completion status, per the close-out convention every prior story followed (`266f5c9`).

No `src/**`, `__tests__/**`, or config changes.

## Real trigger sites (verified 2026-09-13)

The contract cites file:line for every trigger. These are the current ones; the implementer re-verifies line numbers against the working tree before writing them.

| Action | File | Symbol | Notes |
|---|---|---|---|
| Add from drawer | `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx:122` | `handleAdd`, non-upgrade branch, after `addVariantLines` returns (`:147`) | One call adds N variant lines; `result` carries `added`/`incremented`/`rejected` |
| Add from card (variant-less) | `src/components/ProductCard.tsx:41` | `handleAddProductLine`, after `addProductLine` (`:42`) | Line has `unitPrice: null` |
| Add from card (single variant) | `src/components/ProductCard.tsx:58` | `handleAddSingleVariant`, after `addVariantLines` (`:72`) | Preceded by a `/api/catalog/variants` fetch; a fetch failure is not an add |
| Remove one line | `src/features/QuotePage/QuotePage.tsx:125` | `handleRemove` | `Quitar` on a row |
| Clear list | `src/features/QuotePage/QuotePage.tsx:319-322` | `Vaciar lista` confirm `onPress` → `clearLines()` | Only after the `AlertDialog` confirmation, never on the trigger button |
| Quote page viewed | `src/features/QuotePage/QuotePage.tsx:41-44` | the `mounted` effect | Same hydration gate `useQuoteRevalidation` uses (`:58`) |
| Open a WhatsApp part | `src/features/QuotePage/WhatsappCta.tsx:77` | `markOpened`, called from the single-part anchor (`:88`) and each multi-part anchor (`:142`) | `openedParts` is per-mount React state |

Cart mutations that are deliberately **not** events (name them in the contract so nobody wires them ad hoc): `upgradeLine` (`Elegir medida` replaces a line in place), `setLineQuantity`, `archiveAndClearLines` (`Empezar una nueva cotización` — post-lead housekeeping, not a removal), `restoreLastQuote` / `dismissLastQuote`, `setContact` / `clearContact`.

## Phase 1 — Extend `docs/ANALYTICS_EVENT_CONTRACT.md` (AC 1, 2, 3)

### Changes Required

**`docs/ANALYTICS_EVENT_CONTRACT.md`** (modify)

1. **Header** (`:9-10`): add the cart epic as a second source line — `ai-research/epics/cart-quote-whatsapp.epic.md` (Story 5). Keep the "Status" block as is; it is still true (no code ships).

2. **Rename "Conversion (blocked)" → "Conversion (cart funnel)"** (`:40-46`) and replace the single blocked row with five rows. Same four columns as the primary/secondary tables (`Event | Trigger | Payload | Required / conditional`). Payloads are flat primitives, `snake_case`, ≤40-char names, ≤100-char text values — the existing naming convention section already binds them.

   | Event | Trigger | Payload | Required / conditional |
   |---|---|---|---|
   | `add_to_cart` | The three add sites above, **after** the store call returns and only when `result.rejected` is `false` | `origin` (`"variants_drawer" \| "product_card"`), `product_doc_id`, `product_name` (≤100), `line_count` (int, lines in this add — N from the drawer, 1 from the card), `added_line_count` (int, `result.added`), `incremented_line_count` (int, `result.incremented`), `pieces` (int, sum of quantities in this add), `has_variant` (bool, `false` only for `Agregar y elegir después`), `variant_doc_ids` (string, comma-joined, capped at 10 — same cap rule as `product_ids`), `value` (number, MXN), `currency` (`"MXN"`) | `value` and `variant_doc_ids` conditional — omitted for the variant-less line; rest required |
   | `remove_from_cart` | `handleRemove` (`origin: "line_remove"`) and the `Vaciar lista` confirmation (`origin: "clear_list"`) | `origin`, `product_doc_id`, `variant_doc_id`, `quantity` (int), `line_count` (int), `pieces` (int), `value` (number, MXN), `currency` | `line_remove`: `product_doc_id` + `quantity` required, `variant_doc_id`/`value` conditional (absent on a variant-less line), `line_count`/`pieces` omitted. `clear_list`: `line_count` + `pieces` + `value` required (whole list), product/variant fields omitted |
   | `view_cart` | `QuotePage`'s `mounted` effect, once per mount, after `localStorage` rehydration | `line_count` (int), `pieces` (int), `unpriced_line_count` (int), `value` (number, snapshot subtotal of priced lines), `currency`, `is_empty` (bool) | All required |
   | `begin_checkout` | `markOpened` — the **first** part opened in this mount (`openedParts.size` goes 0 → 1) | `part_count` (int), `line_count` (int), `pieces` (int), `unpriced_line_count` (int), `value` (number, effective subtotal after revalidation), `currency` | All required |
   | `generate_lead` | `markOpened` — the call that makes `openedParts.size === part_count` for the first time. A one-part quote fires `begin_checkout` and `generate_lead` on the same click | `part_count` (int), `line_count` (int), `pieces` (int), `value` (number), `currency` | All required |

   Rules to state in prose directly beneath the table (each is one or two sentences, not a subsection):
   - All five keep GA4's reserved names so the ecommerce funnel report works with no mapping; the neutral payload never carries GA4's nested `items` — the GA4 adapter expands `variant_doc_ids` / `product_doc_id` into `items`, exactly as it already does for `product_ids`.
   - `value` is a decimal in MXN units, derived from the same integer-cents arithmetic as `getQuoteTotals` (`src/features/QuotePage/quote.utils.ts`), divided once. Never a float sum. `view_cart` reports the snapshot price (revalidation is async and may not have returned); `begin_checkout`/`generate_lead` report the effective price via `getEffectiveLines`.
   - `add_to_cart` fires on an increment too (AC 5 dedupe) — `added_line_count: 0, incremented_line_count: N` is a valid payload. A cart-full rejection (`result.rejected`) fires nothing; a single-variant fetch failure fires nothing.
   - `internalId` never enters any payload. It is seller-facing display text (epic UI IV), non-unique, and a long digit run would trip the redaction pass anyway.
   - **Opened is not sent.** `begin_checkout` and `generate_lead` measure that a `wa.me` link was opened; the browser cannot observe whether the buyer sent the message. Re-opening a part fires neither event. Funnel reports must label the last step "abrió WhatsApp", not "envió".
   - The "not events" list from the trigger-site section above, verbatim, so the exclusions are recorded.

3. **New subsection "Buyer contact details are never analytics data"**, placed directly after the conversion table (AC 3). Content, in this order:
   - `firstName`, `lastName`, `email` — collected by `ContactForm`, persisted in the cart store's `contact` slice, interpolated into the WhatsApp message — are **never** a parameter on any event. No event in this contract has a field for them, and none may be added.
   - The adapter's redaction pass (`:75`) is a backstop for free-text fields like `search_term`; it is **not** the control for contact details. The control is that the fields do not exist in the payload types — with the discriminated union (`:73`), adding one is a visible diff in a type, not a runtime accident.
   - Scope of "never sent to any provider" = analytics providers. Per Spike 4S (epic line 625), a future WhatsApp Cloud API migration would transmit those same details through Tehesa's own server as a *non-analytics* path; that is out of this contract's jurisdiction and would need its own privacy review (LFPDPPP) — say so in one sentence so nobody reads this contract as covering it.
   - No quote reference in any payload either: `generateQuoteReference` is random and (see Open Questions) currently regenerates per render, so it is not a stable join key.

4. **Reliability caveats** (`:60-68`): add two bullets — `view_cart.value` is a snapshot price, and `line_count` on cart events is the persisted-line count (`CART_MAX_LINES` bound), not a product count.

5. **Recommendations** (`:91-98`): replace the "Keep `add_to_cart` … blocked on the cart story" bullet with: the cart funnel events are specified but stay in the *secondary* tier — the first instrumentation story still ships only the three primary search events; the funnel ships as its own follow-up once GA4 is live.

6. **Decisions log** (`:100-113`): under "Settled", add one line: cart funnel events specified 2026-09-13 from the shipped trigger sites; `origin` on `add_to_cart` has exactly two values and the single-variant card is `product_card`.

Do **not** touch the primary/secondary tables, the adapter contract, or the App Router `page_view` section. Their `Home.tsx` line references may be stale — out of scope (see Out-of-scope).

### Success Criteria

**Automated** — none applies to a Markdown-only change (`pnpm lint`/`tsc`/`test` don't read `docs/`). Use grep as the check:
- `grep -c "Conversion (blocked)" docs/ANALYTICS_EVENT_CONTRACT.md` → `0`
- `grep -E "^\| \`(add_to_cart|remove_from_cart|view_cart|begin_checkout|generate_lead)\`" docs/ANALYTICS_EVENT_CONTRACT.md | wc -l` → `5`
- `grep -n "never" docs/ANALYTICS_EVENT_CONTRACT.md | grep -i "email"` → at least one hit in the new subsection
- `grep -nE "email|first_name|last_name|firstName|lastName" docs/ANALYTICS_EVENT_CONTRACT.md` → hits only inside the "never analytics data" prose, none inside a table row
- Every cited `file:line` in the new rows resolves to the symbol named (open each with `sed -n`), since line numbers were captured at plan time.

**Dev-server validation** — skipped: the phase touches nothing reachable at runtime.

**Manual** — read the five rows once against the GA4 limits in `:14-16` (name ≤40 chars, ≤25 params, text ≤100). Longest name here is `incremented_line_count` (22).

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `docs/ANALYTICS_EVENT_CONTRACT.md` | 5 reserved-name events with flat payloads, both `add_to_cart` origins on real sites, PII statement present, no contact field in any table | greps above + `file:line` spot-check |

## Phase 2 — Close out in `docs/improvement.md` and the epic (AC 4)

### Changes Required

**`docs/improvement.md`** (modify)

- FE bullet `:59` ("Analytics: Story 5 defines the vendor-neutral event contract…") — rewrite in place: the contract now covers the PLP search events **and** the cart funnel (`add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `generate_lead`; cart epic Story 5, 2026-09-13). Still spec-only; GA4 remains the recommended first provider; instrumentation is a separate story.
- "Cart feature follow-up" (`:80-87`) — append one bullet: the cart funnel is specified in `docs/ANALYTICS_EVENT_CONTRACT.md` from the shipped trigger sites (Story 5, 2026-09-13); no instrumentation ships. Keep the "Resolved 2026-07-31" header intact.
- Nothing else. The "Quantity field on the single-variant product card" and "Product list query" subsections already name the evidence they wait on; do not retro-link them to event names.

**`ai-research/epics/cart-quote-whatsapp.epic.md`** (modify — close-out convention, same shape as Stories 1-4)

- Add a `### Story 5: Analytics Contract Extension — Complete` block above the "Epic Story Overview" table: AC 1-4 → the section of the contract / improvement.md that satisfies each, dated.
- "Epic Story Overview" (`:1004-1011`): Story 5 row → `Complete`.
- "Overall Completion" (`:1015-1017`): `36 / 36`; replace "The epic is not complete — Story 5 remains." with the epic-complete statement. Remaining work is only the deferred manual QA already listed for Stories 3 and 4.
- "Next Steps" (`:1024`): strike item 4 as done, same `~~…~~ **Done, 2026-09-13.**` pattern as items 1 and 3.

### Success Criteria

**Automated** — greps:
- `grep -n "cart funnel" docs/improvement.md` → 2 hits (FE bullet + cart follow-up)
- `grep -n "Story 5: Analytics contract extension | Complete" ai-research/epics/cart-quote-whatsapp.epic.md` → 1 hit
- `grep -c "Story 5 remains" ai-research/epics/cart-quote-whatsapp.epic.md` → `0`

**Dev-server validation** — skipped: documentation only.

**Manual** — none.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `docs/improvement.md` | FE analytics bullet current; cart follow-up records the contract extension | greps above |
| `ai-research/epics/cart-quote-whatsapp.epic.md` | Story 5 marked complete, totals reconciled, Next Steps 4 struck | greps above |

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
|---|---|---|---|---|
| AC1 — `add_to_cart` out of blocked, both origins on real sites | Phase 1 | n/a — docs only | Cannot validate | Proof is the grep for `Conversion (blocked)` = 0 and the `add_to_cart` row citing `ProductVariantsDrawer.tsx` + `ProductCard.tsx` |
| AC2 — four more reserved-name events, flat payloads | Phase 1 | n/a — docs only | Cannot validate | Proof is the 5-row grep and a read against the ≤40/≤25/≤100 limits |
| AC3 — name/email never sent; redaction is a backstop | Phase 1 | n/a — docs only | Cannot validate | Proof is the "never analytics data" subsection and no contact field in any table row |
| AC4 — `docs/improvement.md` reflects what shipped | Phase 2 | n/a — docs only | Cannot validate | Proof is the two `cart funnel` greps |

## Cross-cutting concerns

- **PII.** The only trust-boundary content in this story is the sentence that keeps contact details out of payloads. It is the control; write it as a prohibition, not a recommendation.
- **GA4 limits.** Reserved names and ≤40-char params are the whole reason this is "keep reserved names" rather than `cart_*`. `remove_from_cart` (16), `begin_checkout` (14), `generate_lead` (13) all fit.
- **No code.** If the implementer feels the urge to add a `track()` call "while here" — don't. The contract's Status block says no code ships by this doc, and that stays true.

## Open Questions / Out-of-scope

**Found during planning — not this story's, needs a decision:**

- **`generateQuoteReference` regenerates on every `WhatsappCta` render.** `buildQuoteMessages(effectiveLines, validContact)` (`WhatsappCta.tsx:74`) takes the reference as a defaulted third argument, and the default calls `generateQuoteReference()`, which has a random 4-hex suffix. `markOpened` sets state → re-render → part 2's URL carries a **different** reference from part 1, breaking Story 4 AC 5 ("every part carries … the same reference") and the seller's ability to reassemble a multi-part quote. The existing unit test passes because it calls the builder once. Fix shape: hold the reference in `useState(() => generateQuoteReference())` (or `useMemo` keyed on nothing) in `WhatsappCta` and pass it explicitly. One-line fix plus one test asserting two renders share a reference — but it is a Story 4 bug, so it should land as its own patch, not smuggled into a docs PR. **This is why no payload carries `quote_reference`.**

**Out of scope, deliberately:**

- Instrumentation (`track()`, `src/shared/analytics/`, GA4 snippet) — a separate story, still gated on product/marketing sign-off of the contract.
- Refreshing the primary/secondary tables' `Home.tsx:NNN` line references — they predate several Home changes and may drift, but the story doesn't ask and they are not wrong in symbol names.
- A third `add_to_cart` origin for the `/cotizar` upgrade path, or a `contact_saved` event for `ContactForm` submit — neither is in the ACs; the upgrade path is listed under "not events" so it's a recorded exclusion, not an omission.
- Events for `Restaurar lista` / recovery — `improvement.md` tied that feature to funnel evidence, but it shipped without it; naming an event now is speculative.
