# Plan: Spike 4S — WhatsApp Delivery Mechanisms (Options, Cost, Tier)

**Source research:** `ai-research/epics/cart-quote-whatsapp.epic.md`, section "Spike 4S" (lines 202-234), plus Decision 3, WhatsApp I-IV, and Strapi Contract IV for context.
**Research status:** the epic header still reads *"Awaiting human sign-off"*, but Stories 1-3 were planned and implemented from it and every epic-level open question is answered (2026-07-31). Planning proceeded on that basis. **Confirm sign-off before `/implement`.**
**Date:** 2026-09-13 · **Open questions answered by the user:** 2026-09-13 (volume, seller setup, multi-part acceptance)
**Timebox:** one working day. Output is prose appended to the epic — **no source, test, config, or dependency changes**.

## Why This Plan Looks Different

This is a research spike, not a feature. There is no code, no route, no dev server to hit. The `/plan` phase structure is kept (each phase independently verifiable), but:

- "Changes Required" describes **sections of the epic document**, not files under `src/`.
- Dev-server validation is **skipped in every phase** — nothing reachable at runtime changes.
- Verification is "every figure carries a dated, source-cited link" and `git diff --stat` shows only the epic (and optionally `docs/improvement.md`) touched.

## Assumptions

- **Quote volume: fewer than 100 quotes/month** (user, 2026-09-13). Price the table at **50 and 100**; the epic's 500 bracket is dropped as unrealistic.
- **The seller answers customers on `222 441 7330` from the WhatsApp Business app today** (user, 2026-09-13). Phase 1 records this as fact; the "both branches" fallback is not needed. Number exclusivity (Phase 3 item 1) is therefore a live operational cost, not a hypothetical.
- **The seller accepts 2-3 sequential messages for a large quote** (user, 2026-09-13). Closes the WhatsApp II/III sub-question; Story 4's batched sends are acceptable to the reader.
- The spike compares mechanisms **for this flow only**: a buyer on `/cotizar` handing a quote to one Tehesa seller. It does not price a general messaging platform.
- Figures known from memory (per-message pricing model since mid-2025, free service conversations, On-Premises sunset) are **hypotheses to verify at source**, never citations. The plan names them only so the spike knows what to look for.

## Acceptance Criteria

Derived from the spike section, which has no numbered ACs. Each traces to a sentence in lines 202-234.

1. **Direction fit is answered first** (line 208): whether a programmatic API can deliver a *buyer's* quote to the *seller* without an opt-in the buyer has not given, and what each viable framing changes about who is talking to whom. If the answer is "no viable framing", the cost questions are recorded as moot and the spike stops early.
2. **Each of the five mechanisms** in the table (lines 212-218) is assessed against its "What to establish" column: click-to-chat baseline, WhatsApp Business app (seller side), Cloud API (Mexico rates, categories, free tier, template approval), BSPs (markup + platform fee vs what they add), On-Premises API (sunset status, dismissed in one line if dead).
3. **The five non-price questions** (lines 222-227) are answered: phone-number exclusivity, business verification, the 24-hour customer-service window, opt-in/consent storage, and the gain/cost ledger (delivery receipt, server-side record, no length budget vs backend, secrets, webhook, bill).
4. **A mechanism × monthly-cost table** at 50 and 100 quotes/month (the epic suggests 50 and 500 at line 229; brackets narrowed per the user's volume answer), every figure cited to Meta's own pricing documentation with the retrieval date and the Mexico rate (line 231). BSP figures cite the BSP's own pricing page, dated, and are labelled as vendor-published.
5. **A recommendation: stay on click-to-chat or migrate in Story 4** (line 229), stated so it can be disproved (line 233), including what Story 4 inherits either way — specifically whether Story 4 AC 5 and AC 6 (length budget, batched sends) survive or disappear (line 239).
6. **The written recommendation is appended to the epic** (line 204) — no code — and the epic's Story Overview row and Next Steps are updated so the epic stays the single record.

## Affected Files

**`ai-research/epics/`**
- `cart-quote-whatsapp.epic.md` — Modify: new section `## Spike 4S Outcome: WhatsApp Delivery Mechanisms` inserted before `## Open Questions`; update the `Spike 4S` row in "Epic Story Overview"; update "Next Steps" items 1 and 3; add a WhatsApp V open question recording the decision.

**`docs/`**
- `improvement.md` — Modify (only if the recommendation is *migrate*): the "PDF / email quote" sequencing note at `:135` already defers to this spike; update it with the outcome. If *stay*, leave it untouched.

**Untouched, deliberately:** everything under `src/`, `__tests__/`, `package.json`, `.env*`, `ai-skills/REPO_CONTEXT.md` (unless Phase 4 surfaces a repo-level fact — none expected).

---

## Phase 1 — Direction Fit And The Seller's Current Setup

Delivers AC 1 and the first half of AC 2 (rows 1-2 of the mechanism table). AC 4 brackets are 50 and 100 quotes/month throughout (see Assumptions). This is the gate: if no API framing delivers buyer→seller without buyer opt-in, Phases 2-3 shrink to a one-paragraph dismissal.

### Changes Required

**`ai-research/epics/cart-quote-whatsapp.epic.md`** — Create section `## Spike 4S Outcome` with subsection `### 1. Does a programmatic API fit this flow?`

Answer with the two candidate framings written out, and a verdict per framing:

- **Framing A — system→seller.** Tehesa's WhatsApp Business Account (WABA) sends the quote to the *seller's* phone. The seller is the "customer" of the WABA. Establish from Meta's docs: (i) the recipient must have opted in — trivially satisfiable since the recipient is Tehesa's own employee, but must be recorded; (ii) outside a 24-hour window opened by the seller, only a pre-approved template can be sent, so a quote arriving at 9am after a quiet weekend is a **template message** and priced as such — which category (utility is the expected answer; verify); (iii) whether the *sender* number can be the same `222 441 7330` the seller answers on today (feeds Phase 3's exclusivity question).
- **Framing B — system→buyer.** The WABA messages the *buyer*, who has just given name and email on `/cotizar`. Establish: this delivers nothing to the seller, so it cannot replace click-to-chat; it only adds a buyer-side confirmation. Requires buyer opt-in captured on the form (Story 4 AC 1 grows a checkbox) and the buyer's phone number, which the form does not collect. Expected verdict: not a substitute; note it and move on.
- **Framing C — hybrid.** Click-to-chat stays as the delivery; the Cloud API is used only for a server-side record or a seller notification. Establish whether this earns anything the free path lacks (delivery receipt of *our* notification ≠ delivery of the buyer's message).

**Subsection `### 2. Seller-side setup today`** — record the answered fact (user, 2026-09-13): the seller answers customers on `222 441 7330` from the WhatsApp Business app. Consequence to state: a Cloud API migration on that number forces either a second number or moving the seller off the app (Phase 3 item 1).

### Success Criteria

- **Automated:** none applicable. `git status --porcelain` shows only `ai-research/epics/cart-quote-whatsapp.epic.md` modified.
- **Dev-server validation:** skipped — the phase produces prose only; nothing reachable at runtime changes.
- **Manual:** the section states a yes/no verdict per framing, each backed by a link to the Meta doc page that establishes it (opt-in policy, messaging windows, template requirement), each link dated. If Framing A's verdict is "no", the section says so in bold and Phases 2-3 are collapsed to a dismissal paragraph.

### Verification Coverage

| Area | Check | Reference |
|---|---|---|
| Framing A/B/C verdicts | Each cites the Meta page (URL + retrieval date) that decides it | Manual read of the new section |
| Seller setup | Recorded with date and its exclusivity consequence | Manual read |

---

## Phase 2 — Price The Mechanisms At Source

Delivers the remainder of AC 2 (rows 3-5) and AC 4's raw inputs. Runs only in full if Phase 1 found a viable framing; otherwise records "not priced — no viable framing" and the On-Premises one-liner.

### Changes Required

**Same epic section** — subsection `### 3. Mechanism assessment` with one block per remaining row:

- **Cloud API (Meta-hosted).** From Meta's pricing documentation, retrieve and cite, dated: the current pricing model (per-message vs per-conversation — expected per-message since 2025, verify); the **Mexico** rate per category (utility, marketing, authentication, service); which categories are free and under what condition (expected: service/user-initiated free within the 24h window — verify); the monthly free allowance if any still exists; template pre-approval requirement and stated turnaround. Map Framing A's message to a category and state the per-quote price explicitly.
- **BSPs.** Pick three to four with published pricing (Twilio, 360dialog, Infobip, Gupshup, Wati are the epic's list — use whichever publish a page; skip any that require a sales call and say so). For each: Meta pass-through vs markup, monthly platform fee, and the one or two features that matter for a seller with no CRM (shared inbox, multi-agent). Cite the vendor page, dated, labelled "vendor-published".
- **On-Premises API.** One line: sunset status with the Meta announcement link and date. Expected: sunset; if so, dismiss.

Every number in this subsection is either a cited figure or the literal string `not published` — never a remembered or estimated figure presented as a rate.

### Success Criteria

- **Automated:** none. `git status --porcelain` shows only the epic modified.
- **Dev-server validation:** skipped — prose only.
- **Manual:** every currency figure in the subsection has an adjacent citation with a retrieval date; the Mexico rate is stated per category, not as a global/US figure; the On-Premises row is one line.

### Verification Coverage

| Area | Check | Reference |
|---|---|---|
| Cloud API rates | Mexico, per category, dated Meta citation; category for Framing A named | Manual read |
| BSP rows | 3-4 vendors, each with markup + platform fee or `not published`, dated | Manual read |
| On-Premises | Sunset link + date, one line | Manual read |

---

## Phase 3 — Non-Price Constraints And The Gain/Cost Ledger

Delivers AC 3. Skipped to a one-paragraph note if Phase 1 found no viable framing.

### Changes Required

**Same epic section** — subsection `### 4. What a migration would require`, five short entries, each with a cited source and a one-line consequence for Tehesa:

1. **Phone-number exclusivity.** Can a number registered to the Cloud API still run in the WhatsApp Business app? (Expected: no — one number, one surface; verify.) Consequence, given Phase 1's seller-setup answer: second number, or the seller migrates to an API-fed inbox.
2. **Business verification.** What Meta Business Verification requires (documents, legal entity), typical stated turnaround, and who at Tehesa would own it — note `docs/improvement.md:62-70` records that the repo holds no legal name or address, i.e. the same missing business data.
3. **24-hour customer-service window.** What it permits without a template, and how Framing A's timing interacts with it (a seller who last messaged the WABA >24h ago forces a template).
4. **Opt-in.** Whose consent (seller under Framing A; buyer under B), captured where, stored how — and the Mexican data-protection angle (LFPDPPP) for storing a buyer's phone number if B is ever pursued. Under A, the buyer's PII still leaves the device via *our* server, which is a new fact for Story 4 AC 5 / Story 5 AC 3.
5. **Gains vs costs ledger.** Two columns, no prose: gains (delivery receipt, server-side quote record, 4096-char body and no URL → batching disappears, structured payload) vs costs (a backend route holding a non-`NEXT_PUBLIC_` secret, a webhook endpoint, a recurring bill, verification lead time, number exclusivity). Note that "a backend" in this repo means a Next.js route handler with server-only env vars — the same shape as `/api/catalog/*` — not a separate service.

### Success Criteria

- **Automated:** none. `git status --porcelain` shows only the epic modified.
- **Dev-server validation:** skipped — prose only.
- **Manual:** five entries present, each with a source link and a Tehesa-specific consequence; the ledger is a two-column list, not paragraphs.

### Verification Coverage

| Area | Check | Reference |
|---|---|---|
| Exclusivity / verification / window / opt-in | Each cites Meta's doc page, dated | Manual read |
| Ledger | Every gain and cost from lines 226-227 appears | Manual read against the epic's bullets |

---

## Phase 4 — Cost Table, Recommendation, And Epic Bookkeeping

Delivers AC 4, AC 5, AC 6.

### Changes Required

**Same epic section** — subsection `### 5. Monthly cost at 50 and 100 quotes/month`:

| Mechanism | 50 quotes/mo | 100 quotes/mo | Fixed monthly | What is *not* in the number |
|---|---|---|---|---|
| `wa.me` click-to-chat | $0 | $0 | $0 | buyer abandonment mid-batch, no record |
| Cloud API direct (Framing A, category X) | rate × 50 (× parts if multi-message) | rate × 100 | $0 | verification lead time, second number, backend |
| BSP 1..n | pass-through + markup | … | platform fee | … |

Rates are MXN or USD as Meta publishes them — state which, do not convert. Every cell traces to a Phase 2 citation. If a cell cannot be computed from published figures, write `not published` rather than estimate.

**Subsection `### 6. Recommendation`** — one of:

- **Stay on click-to-chat for v1** (the epic's expected outcome). State the number being declined per month at each bracket, name the trigger that would flip the decision (e.g. measured abandonment between part 1 and part N, or the seller rejecting multi-part sends — the sub-question left open at WhatsApp II/III), and confirm Story 4 proceeds **as written**: AC 5 and AC 6 stand, `react-hook-form` remains the only new dependency, no backend.
- **Migrate in Story 4.** State the chosen mechanism and framing, and list what Story 4 must be re-planned around: AC 5/AC 6 removed, a server route with a server-only secret, template approval as a prerequisite, the cart clear now tied to an observable delivery result (revisits UI III/VI), and Story 5 AC 3's "never sent to any provider" statement narrowed to analytics providers only. Per line 239: **re-plan Story 4, do not patch its existing plan.**

Also record, regardless of verdict, that the seller accepts 2-3 sequential messages (user, 2026-09-13) — close the WhatsApp II/III sub-question in the epic with that date.

**Epic bookkeeping (same file):**

- "Open Questions → WhatsApp Integration": add **V** — *Which delivery mechanism does v1 use?* Status answered, date, one-line answer pointing at the outcome section.
- "Epic Story Overview": `Spike 4S` row → `Complete`, evidence "Spike 4S Outcome section", remaining work "None"; `Story 4` row's blocker → "Unblocked — proceed as written" or "Re-plan around <mechanism>".
- "Next Steps": strike item 1; reword item 3 to reflect the verdict.
- "Overall Completion": unchanged — the spike carries no ACs in the 37 count. Say so in one line so nobody recounts.

**`docs/improvement.md`** — Modify only on *migrate*: update the sequencing note at `:135` ("If that spike recommends the WhatsApp Cloud API, a backend appears anyway…") with the outcome and date.

### Success Criteria

- **Automated:** none. `git status --porcelain` shows the epic and, only on *migrate*, `docs/improvement.md`; nothing under `src/`, `__tests__/`, or `package.json`.
- **Dev-server validation:** skipped — prose only.
- **Manual:** the cost table has a row per mechanism assessed in Phase 2 with both brackets filled or `not published`; the recommendation names the mechanism and what Story 4 inherits; the Story Overview and Next Steps are updated; the spike's elapsed time is recorded against the one-day timebox.

### Verification Coverage

| Area | Check | Reference |
|---|---|---|
| Cost table | Each cell traces to a Phase 2 citation or reads `not published` | Manual read |
| Recommendation | Stay/migrate stated; Story 4 AC 5/6 fate stated; disprovable trigger named | Manual read |
| Epic bookkeeping | WhatsApp V added, Overview row + Next Steps updated | Manual read |

---

## AC Validation Summary

Every AC here is documentary, so every row is `Cannot validate` by dev-server check — the proof is a manual read of the epic section. `/implement` should update Status to `Validated` after that read.

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
|---|---|---|---|---|
| AC1 — Direction fit answered first, per framing, cited | Phase 1 | none — prose only | Validated | Three framings written with verdicts, cited to Meta docs (pricing, overview, send-messages), dated 2026-09-13. Framing A viable, gate passed |
| AC2 — Five mechanisms assessed per "What to establish" | Phase 1 (rows 1-2), Phase 2 (rows 3-5) | none — prose only | Validated | One block per row (click-to-chat, WhatsApp Business app, Cloud API, Twilio + 360dialog as BSPs, On-Premises one-liner with sunset date) |
| AC3 — Five non-price questions answered + ledger | Phase 3 | none — prose only | Validated | Five numbered entries (exclusivity, verification, 24h window, opt-in, ledger) each cited; two-column gains/costs table present |
| AC4 — Cost table at 50/100, every figure cited and dated, Mexico rate | Phase 4 | none — prose only | Validated | Table present; Mexico per-message rate is `not published` (CSV not fetchable from this environment) rather than estimated, per the plan's rule; BSP figures cited and dated |
| AC5 — Stay/migrate recommendation, disprovable, Story 4 AC 5/6 fate | Phase 4 | none — prose only | Validated | Recommendation: stay on click-to-chat; disprovable trigger named (batch abandonment or seller rejecting sequential sends); AC 5/AC 6 stand |
| AC6 — Appended to the epic, no code, Overview/Next Steps updated | Phase 4 | `git status --porcelain` shows only the epic (+ `docs/improvement.md` on migrate) | Validated | `git status --porcelain` shows only `ai-research/epics/cart-quote-whatsapp.epic.md` modified; recommendation is "stay," so `docs/improvement.md` correctly left untouched; Story Overview, Overall Completion note, Next Steps, and WhatsApp V all updated |

## Cross-Cutting Concerns

- **Source discipline is the whole risk.** Line 231 is explicit: WhatsApp pricing has changed model more than once. The implementer uses `WebFetch` on Meta's developer documentation directly (`developers.facebook.com/docs/whatsapp/...` pricing and policy pages) and records the retrieval date beside each figure. Search results, blog posts, and BSP marketing summaries of Meta's rates are not citations.
- **Timebox.** One day. If Phase 2's BSP research is eating it, cap BSPs at two with published pricing and note the rest as `pricing on request`.
- **PII path changes under any migration.** Today the buyer's name/email leave the device only inside a message the buyer sends. Any API framing routes them through a Tehesa server. Phase 3 item 4 must state this plainly because it touches Story 4 AC 5, Story 5 AC 3, and Persistence II's "never transmitted anywhere except into the WhatsApp message" claim.
- **`NEXT_PUBLIC_WHATSAPP_NUMBER` may change meaning.** Under a migration, the seller's number becomes a server-side recipient, not a public link target. The recommendation must say whether the env var survives.

## Open Questions / Out Of Scope

**Inputs from the user — all answered 2026-09-13, recorded under Assumptions:** volume < 100/month; seller uses the WhatsApp Business app on the number; sequential messages are acceptable. No open inputs remain.

**Deliberately excluded, though adjacent:**

- The `52…` vs `521…` link check (WhatsApp I) and the device URL-length measurement (WhatsApp IV). Both are manual QA of the click-to-chat baseline and the epic explicitly says neither gates Story 4. They belong in Story 4's manual QA, not in a pricing spike.
- Any prototype, test account, WABA creation, or Meta App registration. The spike reads documentation; it does not sign up for anything.
- Pricing the PDF/email quote idea in `docs/improvement.md:119-135`. It is noted as sharing a backend with a migration, nothing more.
- Editing `ai-skills/REPO_CONTEXT.md`. The spike produces no repo-level fact; if one appears, it is recorded in the epic and flagged in the `/implement` report.
