# Design agent briefs — variants drawer, two-step mobile flow

Companion to `ai-research/variants-drawer-mobile-two-step.story.md`.

**Read this first.** The layout for this story is already designed: panel `#1b` of `Variantes mobile.dc.html` in the claude.ai design project *Tehesa UI mocks v1*. There is **no brief for the happy-path light-theme layout** — implementation reads the comp directly. This file covers only the two things the comp does not show:

- the **dark theme** of the two-step drawer, and
- the **loading / error / empty** bodies, which the comp omits entirely.

If the comp answers a question, the comp wins. Only run Brief A.

---

## 1. Screenshot capture guide

Run `pnpm dev`, open `/`, and press *Ver detalles* on a product with several medidas (a `Cortador vertical A.V. 2F`-style product with 8+ variants is ideal). Capture at a 390px-wide viewport with device emulation on. Toggle the theme with the header's sun/moon control.

| Shot ID | Capture | Viewport | Theme | Why it is needed |
|---|---|---|---|---|
| `S1` | The drawer as it renders **today** on mobile — the current stacked checkbox + stepper + price cards | 390px | light | The "before". The agent needs to see what it is replacing, and which HeroUI surfaces/borders are actually in play. |
| `S2` | Same as S1 | 390px | dark | The only existing evidence of how this drawer's surfaces, borders and muted text resolve in dark mode. **This is the primary input for Brief A.** |
| `S3` | The drawer immediately after pressing *Ver detalles*, while `Cargando variantes...` is on screen | 390px | dark | The loading body is undesigned; the agent must see the current bare `<p role="status">` to judge how much chrome to add. |
| `S4` | The drawer's error body — easiest by stopping the dev server or blocking `/api/catalog/variants` in devtools, then reopening | 390px | dark | Same, for `role="alert"`. |
| `S5` | Any existing **selected** state elsewhere in the app in dark mode — a checked variant row in this drawer, or a selected dropdown item in the header's Categorías menu | 390px | dark | The nearest visual precedent for "selected" in dark mode. This is what stops the agent inventing a selection treatment the app does not use. |
| `S6` | The desktop drawer at `md`+ | 1440px | light | Proof of what must **not** change, so the agent does not redesign it. |

`S2` and `S5` are the load-bearing ones. If only two shots are captured, capture those.

---

## 2. Brief A — Dark theme and non-happy states for the two-step mobile drawer

**Attach:** `S2`, `S3`, `S4`, `S5`, `S6`, plus `DESIGN.md`, plus a screenshot or export of comp panel `#1b`.

**Prompt** (copy verbatim):

```
You are designing two missing states for one screen of Tehesa, a Spanish-language
industrial-tool catalog web app. Tehesa is not a store: the buyer assembles a list of
parts and sends it as a quote request over WhatsApp. Nothing here is a purchase.

THE SCREEN

A bottom-to-top drawer on a 390px-wide phone, opened from a product card, where the
buyer picks which "medidas" (sizes) of one product they need and how many pieces of
each. Its light-theme layout is already designed and is attached (panel 1b). It is a
two-step flow:

  Step 1 "Medidas"   — a two-column grid of tappable cards, one per medida. Each card
                       shows the medida (e.g. 3/8 - 16"), its unit price ($502.40 MXN),
                       and a small internal code (23018-2). Selected card = green border
                       + pale green fill. No quantity controls anywhere on this step.
  Step 2 "Cantidades" — a single-column list of only the medidas chosen in step 1, each
                       with a round -/number/+ stepper. A "← Cambiar medidas" text button
                       returns to step 1.

Under the product title sits a progress rail: "1 · Medidas" ──── "2 · Cantidades".
A fixed footer holds a summary line, a total, and one full-width green pill button whose
label changes between steps.

WHY THIS BRIEF EXISTS

The attached comp is light-theme only, and it shows only the happy path. Two things are
undesigned, and if they are guessed at in code they will look like a different app:

  1. The entire flow in DARK THEME.
  2. The three non-happy bodies that replace the step content: loading, error, and
     "this product has no medidas".

WHAT TO DESIGN

A) Dark theme, for both steps and the footer. Produce the same two-step screen as the
   attached light comp, in dark. Specifically resolve:
   - the drawer surface and the card surface against it (they must be distinguishable
     without a heavy border),
   - the UNSELECTED card: border and background,
   - the SELECTED card: the attached light comp uses border #24AD02 on fill #E3FFD6.
     That fill is unusable on dark. Find the dark equivalent that still reads as
     "chosen" at a glance and still passes contrast for the medida text on top of it.
     Look at shot S5 first — whatever the app already does for a selected item in dark
     mode is the pattern to extend, not replace.
   - the price text and the small grey code text (the light comp uses #4B5563 and
     #9CA3AF — both are too dark on a dark surface),
   - the progress rail: the inactive segment, the active segment, and the two step labels,
   - the footer: its separator, the summary and total text, and the green pill button.
     The button's fill (#4DF527) and its dark text (#0D3401) should stay as they are —
     that pairing is the app's primary action in both themes. Confirm it rather than
     changing it.
   - the disabled state of that button, when nothing is selected yet.

B) The three replacement bodies, in BOTH themes. Each one replaces the step content
   between the header and the footer. Shots S3 and S4 show what exists today — a single
   unstyled line of text. Design:
   - LOADING: shown for roughly 300–800ms after the drawer opens. Spanish text is
     "Cargando variantes...". Decide whether this should stay a text line or become
     skeleton cards shaped like the step-1 grid, and show your choice.
   - ERROR: a short Spanish sentence plus, if you think it earns its place, a retry
     affordance. Keep it calm; this is a transient network failure, not a warning.
   - EMPTY: "No encontramos variantes para este producto." A quiet state, not an error.
   For all three: what happens to the progress rail and to the footer? Show your answer
   explicitly rather than cropping them out.

HARD CONSTRAINTS

- Colors come from the attached DESIGN.md token list. Do not introduce a hue that is not
  in it. The green ramp is keyed to primary-200 = #4DF527; neutrals are the Tailwind grey
  scale; danger is #C81E1E.
- Typeface is Geist Sans throughout. No monospace for prices, codes or IDs.
- The app is built on the HeroUI v3 component library. Buttons, the drawer, and the
  stepper are HeroUI components — design within what a button, a drawer and a number
  field can look like, not a bespoke widget.
- DO NOT redesign the desktop layout (shot S6). It stays exactly as it is.
- DO NOT add a product image or an image placeholder anywhere. This catalog has no
  per-medida imagery.
- DO NOT invent stock levels, availability badges, delivery estimates, discounts,
  ratings, or a "popular" marker. That data does not exist.
- DO NOT add tax, shipping or a "Pagar" button. The total is a reference figure for a
  quote request, never an amount the buyer pays here.
- DO NOT rely on color alone to mark a card as selected — the state must survive
  grayscale.
- All copy in Spanish (Mexico).

DELIVERABLE

One artboard per state at 390px wide: step 1 dark (nothing selected), step 1 dark (three
selected), step 2 dark, loading (light + dark), error (light + dark), empty (light + dark).
Plus a short color table listing every token you used and what you used it for, so the
values can be mapped to Tailwind classes directly.
```

**Check the output for:**

- **A selected-card fill that is just the light comp's `#E3FFD6` darkened.** A pale mint on near-black usually fails either contrast or the "reads as chosen" test. Reject if the medida text on the selected card is harder to read than on an unselected one.
- **An error state dressed as a destructive warning** — full-red panel, alert triangle, "¡Error!". This is a failed fetch. Reject and re-run asking for a calm, recoverable treatment.
- **Invented catalog data.** Any stock pill, "quedan 4", delivery line, or image box means the anti-goals were skimmed. Reject the whole artboard set, not just that element — the rest is usually contaminated too.
- **The footer cropped out of the loading/error/empty artboards.** The brief asks for it explicitly because "what happens to the CTA when there is nothing to add" is the actual question.

---

## 3. Closing note

Bring back to `ai-research/variants-drawer-mobile-two-step.story.md`:

- the dark-theme token table, folded into the *Visual patterns to preserve* subsection;
- the loading/error/empty decisions, which turn AC5's "render as they do today" into something more specific if the agent's answer is better than the status quo — if so, amend AC5 rather than letting the comp and the AC disagree;
- anything the agent flagged that contradicts a decision in the decision record, so D1–D5 get revisited deliberately rather than by accident.

File the resulting screenshots with `/check-design`, following the `comps/brief-N` convention already in `comps/`.

**Implementation follows the acceptance criteria, not the comps.** AC1 (desktop unchanged), AC3 (the `CartVariantLine[]` shape matching the desktop path), AC4 (decrement-to-0 removal) and half of AC5 have no visual expression at all — no artboard will tell you whether they pass. The tests will.

**Stopping point:** Brief A is the only brief. Once its dark-theme tokens are in hand, the story is fully unblocked. The light-theme happy path is already unblocked *now* by comp `#1b`, so step 1 and step 2 can be built before Brief A returns.
