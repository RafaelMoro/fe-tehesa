# Design agent briefs — variants drawer, two-step mobile flow

Companion to `ai-research/variants-drawer-mobile-two-step.story.md`.

**Read this first.** The layout for this story is already designed: panel `#1b` of `Variantes mobile.dc.html` in the claude.ai design project *Tehesa UI mocks v1* (`4b99241e-42ab-4ca4-ac4e-c1cd49a75385`). There is **no brief for the happy-path light-theme layout** — implementation reads the comp directly.

| Brief | Covers | Status |
|---|---|---|
| A | Dark theme + loading / error / empty bodies | **Answered** — artboards `2a`–`2i` in the same file. See §2. |
| B | Narrow-phone grid behaviour (≤360px) + `variante`/`medida` copy consistency | **Open** — run this next. See §3. |

If the comp answers a question, the comp wins.

---

## 1. Screenshot capture guide

Run `pnpm dev`, open `/`, and press *Ver detalles* on a product with several medidas (a `Cortador vertical A.V. 2F`-style product with 8+ variants is ideal). Capture at a 390px-wide viewport with device emulation on. Toggle the theme with the header's sun/moon control.

| Shot ID | Capture | Viewport | Theme | Why it is needed | Used by |
|---|---|---|---|---|---|
| `S1` | The drawer as it renders **today** on mobile — the current stacked checkbox + stepper + price cards | 390px | light | The "before". The agent needs to see what it is replacing, and which HeroUI surfaces/borders are actually in play. | A ✅ |
| `S2` | Same as S1 | 390px | dark | The only existing evidence of how this drawer's surfaces, borders and muted text resolve in dark mode. | A ✅ |
| `S3` | The drawer immediately after pressing *Ver detalles*, while `Cargando variantes...` is on screen | 390px | dark | The loading body was undesigned; the agent needed the current bare `<p role="status">` to judge how much chrome to add. | A ✅ |
| `S4` | The drawer's error body — easiest by stopping the dev server or blocking `/api/catalog/variants` in devtools, then reopening | 390px | dark | Same, for `role="alert"`. | A ✅ |
| `S5` | Any existing **selected** state elsewhere in the app in dark mode | 390px | dark | The nearest visual precedent for "selected" in dark mode. | A ✅ |
| `S6` | The desktop drawer at `md`+ | 1440px | light | Proof of what must **not** change, so the agent does not redesign it. | A ✅, B |
| `S7` | The drawer's step-1 grid (or, before implementation, the current variant list) at **320px** and at **360px** | 320 + 360px | light | Brief B's whole question. The comp is drawn at 390px only; the two-column grid has never been seen at the widths where it might break. | **B** |
| `S8` | The **desktop** drawer footer close-up, showing the live `N variante(s) · M pieza(s)` summary line | 1440px | light | Brief B compares that string against the mobile comp's `N medidas elegidas`. Crop tight to the footer. | **B** |

`S7` and `S8` are the only new captures needed. `S6` can be reused from the Brief A set.

---

## 2. Brief A — Dark theme and non-happy states — **ANSWERED**

**Attached:** `S2`, `S3`, `S4`, `S5`, `S6`, `DESIGN.md`, comp panel `#1b`.

The prompt that was run is preserved in git history of this file. What came back:

**Artboards** (all 390px, in `Variantes mobile.dc.html`):

| ID | State |
|---|---|
| `2a` | Step 1 dark, nothing selected |
| `2b` | Step 1 dark, three medidas selected |
| `2c` | Step 2 dark, quantities |
| `2d` / `2e` | Loading, dark / light |
| `2f` / `2g` | Error, dark / light |
| `2h` / `2i` | Empty, dark / light |

**Token table.** Complete light/dark pairs for every surface, border, text role, rail segment, footer element, stepper, skeleton and button state. Folded into the research doc's *Visual patterns to preserve*; the canonical copy is the table at the bottom of the design file.

**Behavioural decisions it returned** (these are what change the ACs, not the colours):

- **Loading** — six skeleton cards in the step-1 grid shape, not a text line. The progress rail renders but inert (both labels `gray-500`, no active segment). The footer stays, total reads `—`, CTA disabled. Explicit goal: *"el alto del cajón no salta al llegar los datos"* — the drawer must not jump height when data arrives.
- **Error** — no red panel. `#C81E1E` appears only on an 18px glyph; all text is neutral. Copy is `No pudimos cargar las medidas.` + `Revisa tu conexión e inténtalo de nuevo.`, with a **bordered `Reintentar` button**. Footer summary reads `Sin medidas seleccionadas`, CTA disabled.
- **Empty** — the progress rail is dropped entirely ("no hay pasos que recorrer"). Sub-copy `Cierra este panel para volver al catálogo.` is added, and the green CTA is replaced by a bordered `Cerrar` at the same footer height.
- **Decrement to 0** — confirmed on `2c`: *"Al bajar a 0 el renglón se retira y se vuelve al conteo del paso 1."* Matches AC4 as written.

**Two deviations from comp `#1b` it flagged for a decision** (its own recommendation: apply both to the light theme too, so the two themes do not diverge):

1. The disabled CTA moves from pale green `#C6F7B4` to a **neutral** fill in both themes (`gray-100` / text `gray-400` light; `gray-800` / text `gray-500` dark).
2. The selected card gains a **solid checkmark**, so selection survives grayscale rather than resting on the green fill alone.

**Not adopted wholesale — two items need a product call before they reach an AC:**

- The `Reintentar` button is **new behaviour**, not a restyle. There is no retry path in `ProductVariantsDrawer.tsx` today; adding one means re-running the fetch effect. It is cheap (the loader is already a named function) but it is scope the story did not previously have.
- The error copy is **not always a fixed string**. `catalogErrorToSpanish(code)` supplies a specific message for typed catalog failures; the design's `No pudimos cargar las medidas. / Revisa tu conexión e inténtalo de nuevo.` can only be the untyped fallback. The two-line shape (headline + guidance) still applies — the second line is the fixed one, the first is the dynamic message.

Both are recorded as open questions in the research doc.

---

## 3. Brief B — Narrow phones and `variante` vs `medida`

**Attach:** `S6`, `S7`, `S8`, plus `DESIGN.md`, plus comp panels `#1b` and `2a`/`2b` from the design file.

**Prompt** (copy verbatim):

```
You are resolving two small, specific questions about a screen of Tehesa, a
Spanish-language industrial-tool catalog web app. Tehesa is not a store: the buyer
assembles a list of parts and sends it as a quote request over WhatsApp. Nothing here
is a purchase, and the totals shown are reference figures for that quote, never an
amount anyone pays on this screen.

THE SCREEN

A drawer, opened from a product card, where the buyer picks which "medidas" (sizes) of
one product they need and how many pieces of each.

On a phone it is a two-step flow, already designed and attached (panels 1b, 2a, 2b):
  Step 1 "Medidas"    — a TWO-COLUMN grid of tappable cards, one per medida. Each card
                        shows the medida (e.g. 3/8 - 16"), its unit price
                        ($502.40 MXN), and a small internal code (23018-2). Minimum
                        card height 74px, 10px gap, 22px drawer side padding.
  Step 2 "Cantidades" — only the chosen medidas, each with a -/number/+ stepper.
A fixed footer holds a summary line, a total, and one full-width green pill button.

On a desktop it is NOT a two-step flow. It is a single scrolling list, one medida per
row: checkbox, medida, stepper, price, all on one line. Shot S6 shows it. That layout
is frozen and is not what either question is about.

QUESTION 1 — THE GRID AT NARROW WIDTHS

Every phone artboard so far is drawn at 390px. At that width each card is about 168px
wide and the three lines fit comfortably. But a meaningful share of buyers are on
320-360px devices, and nobody has looked at the grid there. Shot S7 shows the drawer at
320px and 360px.

The real medida strings are longer and uglier than the comp suggests. These are actual
values from the catalog:

    8 - 32"      10 - 24"     1/4 - 20"    5/16 - 18"
    3/8 - 16"    7/16 - 14"   1/2  -13"    5/8 - 11"

Note that 1/2  -13" contains a DOUBLE SPACE and a missing space before the quote mark.
That is real data, it is not a typo to fix, and it will render exactly like that. The
longest realistic string is around 11 characters. Prices go up to $1,089.19 MXN.

Decide and show: at 320px and at 360px, does the grid stay two columns, or drop to one?
If it stays two, show how the medida, the price and the code survive the narrower card —
smaller type, tighter line-height, dropping the code line, wrapping, something else.
If it drops to one, show what a full-width card looks like, because a 336px-wide card
holding only three short lines will look empty unless the layout changes shape.
Pick one answer per width and show it as an artboard, rather than listing options.

A deliberate constraint worth respecting: the whole point of the two-column grid is that
8 medidas fit one screen without scrolling. A one-column fallback gives that up. Say
plainly whether you think that trade is worth making at 320px, and why.

QUESTION 2 — "VARIANTE" OR "MEDIDA"

The app currently calls these things two different names in two places:

  - The DESKTOP drawer footer says:   "3 variantes · 7 piezas"
  - The MOBILE step-1 footer says:    "3 medidas elegidas"
  - The mobile step-2 footer says:    "3 medidas · 7 piezas"
  - The drawer's own body copy says:  "Selecciona una o más medidas..."

"Variante" is the engineering word (it is what the database calls the record).
"Medida" is what a buyer in a Mexican hardware or industrial supply shop actually says.
Shot S8 is the live desktop footer.

Decide the wording, and apply it consistently across BOTH the desktop and the mobile
footers. Give the exact Spanish strings for every count, including:
  - zero selected
  - exactly one selected  (singular form)
  - several selected
  - the step-1 form, which counts medidas only and shows no pieces
  - the step-2 / desktop form, which counts both medidas and pieces
  - the button label that carries a count (today: "Agregar 3 al carrito")

Then say whether the drawer's helper sentence and its section headings need to change to
match, or already do.

The DESKTOP LAYOUT DOES NOT CHANGE — only the words inside its existing footer line may.
Do not move, resize or restyle anything on shot S6.

HARD CONSTRAINTS (both questions)

- Colors come from the attached DESIGN.md token list, and the dark-theme pairs already
  settled in the token table at the bottom of the design file. Do not introduce a new hue.
- Typeface is Geist Sans throughout. No monospace for prices, codes or IDs.
- Built on the HeroUI v3 component library — design within what a button, a drawer and a
  number field can look like, not a bespoke widget.
- DO NOT add a product image or an image placeholder. This catalog has no per-medida imagery.
- DO NOT invent stock levels, availability, delivery estimates, discounts or ratings.
  That data does not exist.
- DO NOT add tax, shipping or a "Pagar" button.
- Touch targets stay at least 44px tall, at every width.
- All copy in Spanish (Mexico).

DELIVERABLE

For Q1: step-1 artboards at 320px and at 360px, both themes, showing 8 real medidas from
the list above with two of them selected. Plus one sentence on the two-column trade-off.
For Q2: a plain table of every count string, in the singular and plural forms, for both
the desktop footer and the two mobile steps — the exact text to ship, nothing else.
```

**Check the output for:**

- **A 320px artboard drawn with the tidy comp strings** (`3/8 - 16"`) rather than the ugly real ones (`1/2  -13"`, `5/16 - 18"`). If the hardest string is not on the artboard, the width question was not actually answered — reject and re-run.
- **Two options presented instead of one decision.** The prompt asks for a pick per width. A deliverable that says "you could do either" leaves the question exactly where it started.
- **A copy table that only covers the plural.** Spanish singular/plural is the entire cost of this question (`1 medida` vs `3 medidas`, `1 pieza` vs `7 piezas`); a table missing the singular row is unusable.
- **Any desktop restyle smuggled in with the copy change.** Shot S6's layout is frozen; only the words inside the footer line may move.

---

## 4. Closing note

Already brought back to `ai-research/variants-drawer-mobile-two-step.story.md` from Brief A: the token table, the loading/error/empty decisions (AC5 amended), and D6/D7 covering the two flagged deviations.

To bring back from Brief B:

- the narrow-width grid decision, as a new AC or as a clause on AC2;
- the final count strings, replacing the provisional `medidas` wording in D3 and closing open question II;
- anything that contradicts D1–D7, so a decision gets revisited deliberately rather than by accident.

File the resulting screenshots with `/check-design`, following the `comps/brief-N` convention already in `comps/`.

**Implementation follows the acceptance criteria, not the comps.** AC1 (desktop layout unchanged), AC3 (the `CartVariantLine[]` shape matching the desktop path), AC4 (decrement-to-0 removal) and half of AC5 have no visual expression at all — no artboard will tell you whether they pass. The tests will.

**Stopping point:** the story is implementable **now**. Comp `#1b` covers the light happy path and Brief A covers dark plus all three non-happy states. Brief B resolves two refinements — narrow-phone layout and copy consistency — neither of which blocks building steps 1 and 2.
