# Design Agent Briefs — Cart And WhatsApp Quote Epic

**For:** an external design agent with no repository access. Everything it needs must arrive as an attachment or as text in the prompt.

**Companion to:** `ai-research/epics/cart-quote-whatsapp.epic.md` (Design Agent Handoff). That section holds the surface index, the implementation-facing constraints (`R1`-`R5`), and the decision record (`R6`). This file is how the work actually gets run — what to attach, and what to paste.

## How To Use This File

Four briefs, run in order. Each has three parts:

1. **Attach** — screenshots and files to upload.
2. **Prompt** — copy the fenced block verbatim. It is written to be self-contained; the agent cannot look anything up.
3. **Check the output for** — what to reject and re-run.

Briefs 1 and 2 together fully specify Story 1 and can be run today. Brief 3 covers Stories 2 and 3, Brief 4 covers Story 4.

Do not merge briefs. One design ask per conversation produces better results than one prompt covering four surfaces, and a bad result in one surface does not then contaminate the rest.

## Screenshot Capture Guide (do this once, before Brief 1)

Run `pnpm dev` and capture the following. Everything is on `/`.

| # | Shot | Viewport | Theme | Why it is needed |
|---|---|---|---|---|
| S1 | Catalog grid, full page | ~1440px | Light | Establishes grid, spacing, typography scale |
| S2 | Catalog grid, full page | ~390px | Light | One-column layout, real card width on a phone |
| S3 | Catalog grid, full page | ~1440px | Dark | Dark mode is not an afterthought here |
| S4 | Single product card, tight crop, **multi-variant** (footer shows `Explorar las N variantes`) | ~1440px | Light | The component being redesigned |
| S5 | Single product card, tight crop, **single-variant** (footer shows `Explorar la variante`) | ~1440px | Light | The 35-product case that gets its own footer |
| S6 | Header, tight crop | ~1440px | Light | Where the cart badge goes |
| S7 | Header, tight crop | ~390px | Light | Header at its tightest |
| S8 | Variants drawer open, **with 2-3 variants checked and quantities entered** | ~390px | Light | The footer's count/pieces/total is the pattern `/cotizar` inherits |
| S9 | Same as S8 | ~1440px | Light | Drawer is full-width at every breakpoint — worth showing |
| S10 | Variants drawer open, any state | ~1440px | Dark | Drawer in dark mode |

Notes:

- S5: single-variant products are the ones whose card says `Explorar la variante` (singular). Use the browser search or scroll — 35 of 333 qualify.
- S8 matters more than it looks. It is the only existing surface that lists items with quantities and a running total, so it is the visual precedent for the `/cotizar` line list.
- Capture full pages, not cropped viewports, for S1-S3. The agent needs to see how far the content runs.

Also have ready as a file attachment: **`DESIGN.md`** (repo root).

---

## Brief 1 — Product Card Footers ✅ DONE (2026-07-31)

Unblocks Story 1. The highest-value single brief: the same card renders 333 times and it is where a buyer's quote silently degrades.

**Output:** `comps/desktop-{light,dark}-brief-1-cart-state.png`, `comps/mobile-{1,2}-brief-1-cart-state.png`. All four rejection criteria below passed on the first run. What the comps settle, plus the three implementation checks they cannot show, is recorded in `ai-research/cart-quote-whatsapp/cart-state-persistence.story-1.md` → "Delivered Comps".

### Attach

- `DESIGN.md`
- S1, S2, S3 (grid, so the agent sees the card in context)
- S4, S5 (the two card cases, close up)

### Prompt

```
You are designing a change to the product card in an existing Next.js catalog
for Tehesa, an industrial tool and hardware distributor in Puebla, Mexico. The
interface is in Spanish. I have attached the project's design system
(DESIGN.md) and screenshots of the current catalog grid and two product card
variants.

CONTEXT — WHAT THIS APP DOES

This is not a store. Nothing is ever purchased here. A buyer (usually a
purchasing contact at a workshop, usually on a phone) collects products into a
list and sends that list to a Tehesa salesperson over WhatsApp as a quote
request. The salesperson replies with real prices and availability.

Products have variants, which differ by diameter (for example 1/4", 3/8").
Each variant has its own price. A product may have many variants, exactly one,
or — in three broken records — none.

THE PROBLEM

The card footer currently has two buttons of near-equal weight, side by side:

  [ Agregar al carrito ]  [ Explorar las 12 variantes ]

Both are currently inert. Once wired, they do materially different things:

- "Explorar las N variantes" opens a drawer where the buyer picks sizes and
  quantities. Result: a line with a size and a price the salesperson can quote
  directly.
- "Agregar al carrito" adds the product with NO size and NO price. The
  salesperson has to call the buyer back and ask which size they need.

So the button carrying the conventional, familiar label is the one that
produces the worse outcome. A buyer who taps it out of habit degrades their own
quote and gets no signal that they did. That is the problem to solve.

Important nuance: the no-size path is legitimate. A buyer who genuinely does
not know their size should be able to add the product and sort it out later. Do
not make that button feel like a mistake or a punishment — make it feel like a
different, deliberate choice.

WHAT TO DESIGN

Three footer variants of the same card component.

1. MULTI-VARIANT CARD (most products)
   - Primary: "Explorar las N variantes"
   - Tertiary: "Agregar y elegir después"
   The visual hierarchy must communicate that these are different kinds of
   action, not two ways to do the same thing.

2. SINGLE-VARIANT CARD (35 of 333 products)
   - One button only: "Agregar 1 pieza"
   - No second button. There is nothing to explore and nothing to choose later.
   - This button makes a network request when pressed, so it needs a PENDING
     state and a FAILURE state. It is the only card button that can fail.

3. BROKEN-DATA CARD (3 records, variant data missing)
   - Identical to the multi-variant card. The fix is in the data, not here.

Design all three in light and dark mode, at both a ~390px phone width and the
3-column desktop grid.

HARD CONSTRAINTS

- Follow the attached DESIGN.md exactly. HeroUI v3 components, Tailwind
  utilities, the existing emerald accent, border-default-200 dividers, Geist
  Sans. Do not introduce a new component library, new colors, or new fonts.
- Do not use Geist Mono for prices.
- No product images exist and none are coming. Do not add or reserve image
  space.
- Spanish copy only. Use the exact button labels given above.
- Do not invent stock levels, availability badges, delivery estimates,
  shipping, tax, ratings, or discounts. None of that data exists.
- Do not redesign the card's price block, title, or badges. Only the footer and
  whatever hierarchy changes the footer requires.

DELIVERABLE

Annotated designs for the three footer variants across the stated breakpoints
and themes, plus a one-paragraph rationale for how the multi-variant hierarchy
signals the difference between the two actions. Flag anything in DESIGN.md that
made this harder than it needed to be.
```

### Check the output for

- Did it keep both actions available on the multi-variant card, or did it quietly hide the tertiary one? Hiding it is wrong — it is a legitimate path.
- Does the single-variant card have a visible pending state? Most agents skip it.
- Did it add an image placeholder anyway? Common failure.
- Did it invent a stock or availability indicator? Reject.

---

## Brief 2 — Header Cart Badge And Add-Confirmation Toast

Completes Story 1. Two small surfaces, one brief, because they are the same feedback loop.

### Attach

- `DESIGN.md`
- S6, S7 (header, desktop and mobile)
- S8, S9 (drawer open with selections — this is what closes on add)
- S3 or S10 (a dark-mode shot)

### Prompt

```
You are designing two new UI elements for an existing Next.js catalog for
Tehesa, an industrial tool and hardware distributor in Mexico. Interface is in
Spanish. I have attached the design system (DESIGN.md), screenshots of the
current header at desktop and phone widths, and screenshots of the product
variants drawer with items selected.

CONTEXT

Buyers add products to a quote list, then send that list to a salesperson over
WhatsApp. Adding happens from two places:

1. The variants drawer (shown in the screenshots) — the buyer checks one or
   more sizes, sets a quantity for each, and presses the footer button. THE
   DRAWER THEN CLOSES.
2. The product card in the grid — a single button, no drawer involved.

Neither surface currently gives any feedback that something was added.

WHAT TO DESIGN

ELEMENT 1 — HEADER CART BADGE

The header currently holds a logo and a dark-mode toggle. Add a cart control
that links to the quote page.

- Always visible, including when the count is zero. It shows "0", not nothing.
- The count sits at the bottom-right of the cart icon.
- Because it never appears or disappears, there is no layout shift. Design it
  so the space is reserved once.
- CRITICAL: "0" must read as EMPTY, not as a notification. A filled accent pill
  showing 0 looks like an unread alert and is wrong here.
- Design for counts of 0, 1, 9, and 99+ — the last one must not break the
  header at 390px width.
- Light and dark mode, desktop and phone.

ELEMENT 2 — ADD-CONFIRMATION TOAST

One shared toast component serving both add surfaces. It must be shared because
the drawer closes on add (so anything inside the drawer is destroyed at the
moment it would be read) and the product card has no surface to host an inline
message.

Design these messages:

- "3 variantes agregadas"                         (drawer, multiple sizes)
- "Producto agregado, elige la medida después"    (card, no size chosen)
- "1 pieza agregada"                              (single-variant card)
- "Cantidad actualizada"                          (the product was already in
                                                   the list, so its quantity
                                                   went up instead of a
                                                   duplicate line appearing)

The last one matters more than it looks: without it, a buyer who adds the same
size twice assumes the second add was ignored.

Specify: placement on phone and desktop, how long it stays, whether it stacks
if the buyer adds several products quickly, and how it interacts with the
drawer closing underneath it.

HARD CONSTRAINTS

- Follow the attached DESIGN.md exactly. HeroUI v3 components, Tailwind
  utilities, existing colors, Geist Sans. If HeroUI v3 ships a toast
  component, design around it rather than inventing one.
- Spanish copy only. Use the exact strings above.
- The toast is an accessibility live region, so it must be readable at a glance
  and must not rely on color alone to convey success.
- Do not design an error/destructive variant of the toast in this brief — only
  the confirmations listed.
- Do not add a mini-cart dropdown or flyout to the header. That was explicitly
  rejected. The badge links to a full page.

DELIVERABLE

Annotated designs for both elements across the stated counts, breakpoints, and
themes, plus your recommendation on toast duration and stacking behaviour.
```

### Check the output for

- Did it design a mini-cart dropdown anyway? Explicitly rejected — reject the output.
- Does `0` look like an alert? That is the single most likely miss.
- Does 99+ still fit at 390px?
- Did it handle the toast appearing as the drawer closes beneath it?

---

## Brief 3 — The Quote Page: Line List, Subtotal, And Line States

Covers Stories 2 and 3. The largest brief, and the first entirely new screen.

### Attach

- `DESIGN.md`
- S8, S9 (drawer with selections — the existing count/pieces/total pattern this page inherits)
- S1, S2 (grid, for typography and spacing language)
- S3 (dark mode)

### Prompt

```
You are designing a new page for an existing Next.js catalog for Tehesa, an
industrial tool and hardware distributor in Mexico. Interface is in Spanish. I
have attached the design system (DESIGN.md) and screenshots of the existing
catalog and of the product variants drawer.

CONTEXT — THIS IS A QUOTE, NOT A CHECKOUT

Buyers collect products into a list and send it to a salesperson over WhatsApp,
who replies with real prices and availability. Nothing is ever purchased in
this interface. There is no payment, no order, no account, no shipping, no tax.
The most important thing this page must never do is look like a checkout.

Pay attention to the drawer screenshots: its footer already shows a selection
count, a piece count, and a running total. That is the existing visual language
for "a set of things with quantities and a sum", and this page should feel like
its larger sibling.

WHAT TO DESIGN

The page /cotizar. Heading: "Solicitar cotización" — NOT "Carrito", NOT
"Checkout". This brief covers the line list and the subtotal only; the contact
form and send button are a separate brief, but leave room for them below.

LINE STATES — design each one

1. PRICED LINE — product name, the variant (e.g. 1/4"), a quantity control,
   unit price, line total.

2. LINE WITH NO SIZE CHOSEN — the buyer added this from the grid without
   picking a variant. Shows the product name, the text "Sin variante
   seleccionada", a quantity control, NO price, and a visible reason it has no
   price. It also carries an action labelled "Elegir medida" that opens the
   size picker and converts this line into a priced one. That action is
   important — it is the payoff for a button elsewhere that promised the buyer
   they could choose later — so it must be clearly available, not a
   de-emphasised afterthought.

3. PRICE CHANGED — prices are re-checked when this page loads. Show the
   previous price struck through or de-emphasised beside the current one, with
   a short explanation. The current price is what counts.

4. NO LONGER AVAILABLE — the variant or the whole product no longer exists.
   Distinct treatment per case, excluded from the subtotal, with a clear way to
   remove or replace it. This is NOT a rare edge case: lists never expire, so a
   months-old list hitting this is normal.

5. CHECKING PRICES — a brief non-blocking state while prices are re-checked.

6. PRICE CHECK FAILED — the saved prices are shown with a warning. The buyer
   must still be able to send their quote. This never blocks.

7. EMPTY LIST — Spanish copy and a route back to the catalog. Never show a bare
   "$0.00".

SUBTOTAL

- Label it "Subtotal estimado (líneas con precio)". Lines with no size and
  unavailable lines are excluded from it, and an unqualified number will be
  misread as the quote total.
- Directly beneath it, one line of supporting copy: "Precios de referencia. El
  vendedor confirma disponibilidad y precio final."
- That one line is the ENTIRE "this is a quote, not an order" treatment. Do not
  add a banner, a callout box, an info alert, or a confirmation dialog. The
  page heading and the button wording carry the rest.
- Show piece and product counts beside it, echoing the drawer's existing
  "N variantes · N piezas" phrasing.

HARD CONSTRAINTS

- Follow the attached DESIGN.md exactly. HeroUI v3 components, Tailwind
  utilities, existing colors, Geist Sans — including for prices. Do not use
  Geist Mono.
- Money is always formatted "$1,234.50 MXN".
- Quantities are always in PIECES ("piezas"). There is no box, pack, or case
  vocabulary — that data does not exist.
- No product images exist. Do not reserve image space in a line.
- Do not display any internal SKU or reference code in this UI.
- Do not invent stock levels, delivery dates, shipping, tax, discounts,
  coupons, or an order summary.
- Phone-first: a single column at ~390px where the subtotal is reachable
  without hunting. Then the desktop layout.
- Light and dark mode.

DELIVERABLE

The page in its normal state, plus each of the seven line states, at phone and
desktop widths in both themes. Include the empty state. Note anywhere you think
a buyer would misread the subtotal.
```

### Check the output for

- Did it produce a checkout page? Order summary panels, "proceed to payment" affordances, promo code fields — all wrong.
- Is `Elegir medida` prominent, or buried in an overflow menu? It must be visible.
- Did it design all seven line states, or stop at three?
- Did it add a banner explaining "this is a quote"? Explicitly rejected.

---

## Brief 4 — Contact Block, Send Button, And The Multi-Message Send

Covers Story 4. The hardest brief, because it contains the one state that is easy to design dishonestly. Run it after Brief 3, and attach Brief 3's output.

### Attach

- `DESIGN.md`
- **Brief 3's output** (the quote page design — this brief sits below it)
- S2 (phone-width catalog, for scale reference)

### Prompt

```
You are designing the final section of a quote page for Tehesa, an industrial
tool and hardware distributor in Mexico. Interface is in Spanish. I have
attached the design system (DESIGN.md) and the design for the upper part of
this page (the list of products and the subtotal). Your work sits below it.

CONTEXT — HOW SENDING WORKS, AND WHAT WE CANNOT KNOW

The buyer's list is sent to a salesperson through WhatsApp. Pressing the send
button opens WhatsApp with a pre-filled message that the buyer must then press
send on themselves, inside WhatsApp.

This means the website CANNOT KNOW whether the message was ever sent. WhatsApp
may not be installed. The buyer may back out of the composer. They may be
signed into the wrong account. The strongest true statement this interface can
ever make is "we opened WhatsApp for you".

Designing anything that asserts delivery — a green check, the word "enviado", a
success screen — would be a lie the browser cannot back up. This is the single
most important constraint in this brief.

WHAT TO DESIGN

PART 1 — CONTACT DETAILS

We need the buyer's name, last name, and email. They are remembered on the
buyer's own device between visits, so there are three states:

a) NO SAVED DETAILS (first visit) — the form is shown expanded. It is the only
   way forward. Include the default state, a per-field error state, and the
   state where the form is incomplete.

b) SAVED DETAILS (the common case for a returning buyer) — NO FORM IS SHOWN.
   Instead: a read-only summary of the three values, a control to use different
   details, a control to forget the saved details, and the send button
   immediately available. A returning buyer should reach WhatsApp in two taps.
   THE DESIGN CHALLENGE HERE: three controls sit above the primary action
   without any of them competing with it. This is also the only place in the
   whole app that displays personal data, so "forget my details" must be
   findable but not alarming.

c) EDITING SAVED DETAILS — the form revealed, pre-filled with the saved values.

PART 2 — THE SEND BUTTON

Label: "Cotizar". States:

- Ready — the primary action of the page.
- Disabled because the details are incomplete — visibly inert, with the reason
  stated. Not an unexplained grey button.
- Disabled because WhatsApp is not configured on our side — different copy.
  This is our failure, not the buyer's, and it should read that way.

PART 3 — AFTER SENDING

WhatsApp opens in a separate app or tab. When the buyer comes back, their list
has been cleared. Design that moment: the clear must not be silent, because a
buyer who backed out of WhatsApp without sending would otherwise return to an
empty list with no explanation. Either an acknowledgement step or an
immediately available undo. Your recommendation on which.

PART 4 — THE MULTI-MESSAGE SEND (the hard one)

A long list does not fit in a single WhatsApp message, so it is split into
parts. WhatsApp cannot queue several pre-filled messages, so the buyer must:
send part 1 → leave WhatsApp → return to this page → press again for part 2 →
and so on. This cannot be automated away.

Design:

- SINGLE PART (the common case) — one button, no stepper, no hint that
  splitting exists. Most buyers must never learn this feature is there.
- MULTIPLE PARTS, BEFORE THE FIRST SEND — the buyer must understand BEFORE
  pressing that this takes several sends, or they will assume the first press
  finished the job and walk away. State the number of parts up front.
- MULTIPLE PARTS, IN PROGRESS — the next part is the page's primary action.
  Parts already opened stay visible and can be opened again, because the buyer
  may have backed out without sending.
- Each part's state is "OPENED", never "SENT". No green check, no "enviado".
  Something closer to "abierto — vuelve a abrir si no se envió".
- ALL PARTS OPENED — still not a success screen. Offer "empezar una nueva
  cotización" and nothing that claims the salesperson received anything.
- The buyer returns to this page mid-sequence on every part. That is the normal
  path on a phone, and it must not lose progress or reset to part 1.

HARD CONSTRAINTS

- Follow the attached DESIGN.md exactly, and match the page design attached.
- Spanish copy only.
- Phone-first at ~390px. The form sits ABOVE the send button, so verify the
  on-screen keyboard does not bury the button. Then the desktop layout.
- Light and dark mode.
- Do not design a payment step, an address field, a phone number field, an
  account, a login, or a terms checkbox. None exist.
- Do not use success iconography anywhere in Part 4.

DELIVERABLE

All states above at phone and desktop widths in both themes, plus your
recommendation for Part 3 (acknowledgement vs undo) with reasoning. If any
state feels dishonest to you, say so — that is more useful than a clean
comp.
```

### Check the output for

- **Any success state in Part 4.** Green checks, "enviado", confetti, a completion screen. This is the failure mode this brief exists to prevent — reject and re-run naming it explicitly.
- Did it collapse the saved-details case into a pre-filled form? The whole point is that no form is shown.
- Did it add a phone number field? Very common, and wrong — we message the seller, not the buyer.
- Is the send button still reachable with a phone keyboard open?

---

## After All Four

Bring back to the epic doc: anything the designer flagged as dishonest or unworkable, and any decision in `ai-research/epics/cart-quote-whatsapp.epic.md` (`R6`) they argued against. Those decisions were made without a designer in the room, so disagreement is signal.

Do not start implementation from the designs alone — the acceptance criteria in the epic are the contract, and several of them (validation on rehydrate, the escaping rules, the length cap) have no visual expression at all.
