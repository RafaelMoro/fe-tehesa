# Plan: Story 4 — Contact Form And The WhatsApp `Cotizar` CTA

**Source research:** `ai-research/epics/cart-quote-whatsapp.epic.md`, "Story 4: Contact Form And The WhatsApp `Cotizar` CTA" (lines 235-262), plus Decision 3, WhatsApp I-IV, Persistence II-III, UI III/V/VI, and the Brief 4 comp notes for context.
**Research status:** epic header still reads "Awaiting human sign-off," but Stories 1-3 were planned and implemented from it and Spike 4S (2026-09-13) confirmed **stay on click-to-chat** — AC 5/AC 6 stand as written, no backend. **Confirm sign-off before `/implement`.**
**Date:** 2026-09-13
**Gate cleared:** Spike 4S. **New decisions made during this planning session (2026-09-13, user):**
- Open Question V — pull `Restaurar lista` (durable quote recovery) into this story rather than deferring it.
- Open Question VI — the cart clears (archiving a recovery copy) only on pressing `Empezar una nueva cotización`, never automatically on opening the last part.

## Acceptance Criteria

Copied from the epic, in order:

1. Name, last name, and email are captured with `react-hook-form`, with a required check, a length cap, and an email pattern on each field.
1b. The form is only rendered when there are no valid saved details, or when the buyer presses the control to use different information. With valid saved details the page shows a read-only summary and goes straight to `Cotizar`, feeding the saved values into the message. Revealing the form prefills it with the saved values and moves focus into it.
1c. Saved details are validated on rehydrate **and** again at message-build time, from one shared pure validator consumed by both paths. Details that fail fall back to the expanded form, prefilled with whatever survived — never a summary of a half-valid record, never a silent send.
1d. A visible, reversible "olvidar mis datos" affordance wipes stored contact details without clearing browser storage. The contact slice clears independently of the cart.
2. Every value interpolated into the message — product names from Strapi and form values from the buyer — is stripped of newlines, control characters, and WhatsApp markdown characters before interpolation.
3. The message contains, per line, the `internalId` (or `Sin clave interna`), product name, variant, quantity, unit price, and line total; plus the buyer's details, the subtotal, and a short quote reference. Approved wording is Option A (formal, purchase-order style) from the epic's WhatsApp II.
4. The CTA is a real anchor when the form is valid and a non-focusable `aria-disabled` span when it is not, disabled with an explanatory message when `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset.
5. The encoded URL length is measured against `WHATSAPP_URL_MAX_ENCODED_LENGTH = 1800`; on overflow the quote splits across several messages on cart-line boundaries. Part 1 carries the quote reference, contact details, line count, and subtotal; every part carries `Parte N de M` and the same reference; line numbering is continuous across parts.
6. When there is more than one part, the UI presents them in order, marks each as *opened* (never *sent*), and keeps every part re-sendable. A one-part quote renders a single CTA with no stepper.
7. The message builder is a pure function `buildQuoteMessages(lines, contact): string[]` under `src/shared/utils/`, unit-tested against escaping, empty-variant lines, subtotal exclusion, a one-part cart, and a forced split (asserting the split lands on a line boundary and part 1 alone carries contact + subtotal). Split threshold is `WHATSAPP_URL_MAX_ENCODED_LENGTH` measured on the full URL.
8. The cart clears after hand-off, but only once the buyer presses `Empezar una nueva cotización` (this planning session's answer to Open Question VI) — never silently, and never merely from opening the last part. **Extended by Open Question V (pulled in this session):** clearing archives a recovery copy in a second persisted slot; a later visit with an empty cart and a recovery copy present offers `Restaurar lista` beside `Empezar una nueva cotización`.

## Affected Files

**`src/shared/constants/`**
- `whatsapp.constants.ts` (new) — WhatsApp number, split threshold, markdown/control-char patterns, quote-reference prefix.
- `cart.constants.ts` (modify) — bump `CART_SCHEMA_VERSION`.

**`src/shared/utils/`**
- `contact-validation.utils.ts` (new) — shared pure contact validator, consumed by RHF, rehydrate, and message-build time.
- `whatsapp-message.utils.ts` (new) — `sanitizeForWhatsapp`, `buildQuoteMessages`, `buildWhatsappUrl`, `generateQuoteReference`.

**`src/zustand/store/cart.store.ts`** (modify) — recovery slice (`lastQuoteLines`), `archiveAndClearLines`/`restoreLastQuote`/`dismissLastQuote`; `sanitizeContact` delegates to the new shared validator.

**`src/features/QuotePage/`**
- `ContactForm.tsx` (new) — RHF form.
- `ContactSection.tsx` (new) — collapsed/expanded gate + "olvidar mis datos".
- `WhatsappCta.tsx` (new) — CTA, multi-part stepper, all-opened state.
- `quote.utils.ts` (modify) — add `getEffectiveLines(lines, checks)`.
- `QuotePage.tsx` (modify) — wire `ContactSection`, `WhatsappCta`, and the recovery empty-state.

**`package.json`** — add `react-hook-form` (the epic's one sanctioned new dependency, added in this story only).

**`__tests__/cart/`** — new test files per phase (below).

## Phase 1 — Constants And The Shared Contact Validator

Delivers the trust-boundary half of AC 1/1c and the constants AC 4/5/7 depend on. No UI yet.

### Changes Required

**`src/shared/constants/whatsapp.constants.ts`** (new)
```ts
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
export const WHATSAPP_URL_MAX_ENCODED_LENGTH = 1800
export const WHATSAPP_URL_PREFIX_MAX_LENGTH = 40 // safe upper bound for `https://wa.me/<15-digit number>?text=`
export const WHATSAPP_CONTROL_CHAR_PATTERN = /[\r\n\x00-\x1F\x7F]/g
export const WHATSAPP_MARKDOWN_CHAR_PATTERN = /[*_~`]/g
export const QUOTE_REFERENCE_PREFIX = "TH"
```
Follows the `SITE_URL` pattern in `seo.constants.ts:1` (read once at module scope, never throw when unset — AC 4 handles the unset case in the UI, not here).

**`src/shared/constants/cart.constants.ts`** — bump `CART_SCHEMA_VERSION` to `2` (near line 2). The store's existing `migrate: () => defaultCartState` already drops an older cart on mismatch; this is the mechanism that safely introduces Phase 2's new `lastQuoteLines` field without a manual migration.

**`src/shared/utils/contact-validation.utils.ts`** (new)
```ts
export const isValidContactName = (value: unknown): value is string => ...
export const isValidContactEmail = (value: unknown): value is string => ...
export const validateContact = (
  candidate: unknown,
): { contact: CartContact | null; partial: Partial<CartContact> }
```
`isValidContactName`/`isValidContactEmail` are the exact rules currently inlined in `cart.store.ts:130-142` (non-empty, `CONTACT_TEXT_MAX_LENGTH`, `CONTACT_EMAIL_PATTERN` for email). `validateContact` runs both against `firstName`/`lastName`/`email`: `contact` is non-null only if all three pass (unchanged strict behavior for the rehydrate boundary); `partial` independently keeps whichever fields pass their own rule, for AC 1c's "prefilled with whatever survived" in a component that isn't built until Phase 4.

**`src/zustand/store/cart.store.ts`** — delete the local `sanitizeContact` (lines 123-149) and its call site; `sanitizeCartState` calls `validateContact(candidate.contact).contact` instead. No behavior change at this boundary — this is the refactor the epic calls "the trap in this story": one validator, two consumers, instead of the RHF form growing its own copy in Phase 4.

### Success Criteria

- **Automated:** `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test -- __tests__/cart/cart.rehydrate.test.ts __tests__/cart/cart.store.test.ts` (must still pass unchanged — this phase is a refactor, not a behavior change), `pnpm test -- __tests__/cart/contact-validation.test.ts` (new).
- **Dev-server validation:** `curl http://localhost:3000/cotizar` still 200, page still renders (no behavior change reaches the UI yet).
- **Manual:** none beyond the dev-server check — nothing new is interactive yet.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `contact-validation.utils.ts` | name/email pass/fail boundaries (empty, over length, bad email shape), `partial` keeps only the fields that pass | `pnpm test -- __tests__/cart/contact-validation.test.ts` |
| `cart.store.ts` rehydrate | unchanged all-or-nothing contact sanitize behavior after the refactor | existing `cart.rehydrate.test.ts` must pass unmodified |

---

## Phase 2 — Cart Store: Last-Quote Recovery Slice

Delivers the store half of AC 8 (Open Question V/VI). Still no UI.

### Changes Required

**`src/zustand/store/cart.store.ts`**
- `CartState` gains `lastQuoteLines: CartLine[] | null` (default `null`).
- New actions on `CartActions`:
  - `archiveAndClearLines: () => void` — snapshots current `lines` into `lastQuoteLines`, then sets `lines: []`. No-ops if `lines` is already empty (nothing to archive).
  - `restoreLastQuote: () => void` — if `lastQuoteLines` is non-null, sets `lines: lastQuoteLines, lastQuoteLines: null`; no-op otherwise.
  - `dismissLastQuote: () => void` — sets `lastQuoteLines: null`.
- `sanitizeCartState` validates `candidate.lastQuoteLines` the same way it validates `lines` (`Array.isArray` → slice to `CART_MAX_LINES` → `filter(isValidCartLine)`; empty/invalid → `null`), since it comes from the same `localStorage` trust boundary.
- `defaultCartState` gains `lastQuoteLines: null`.

### Success Criteria

- **Automated:** `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test -- __tests__/cart/cart.store.test.ts __tests__/cart/cart.rehydrate.test.ts` (extend, don't replace, these two existing files).
- **Dev-server validation:** none — no component reads these fields yet. State explicitly.
- **Manual:** none this phase.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `cart.store.ts` | `archiveAndClearLines` snapshots then empties; no-op on empty cart; `restoreLastQuote` round-trips lines and clears the slot; `dismissLastQuote` clears without restoring | `__tests__/cart/cart.store.test.ts` (extended) |
| rehydrate | a tampered/oversized `lastQuoteLines` in the persisted blob drops to `null` rather than throwing | `__tests__/cart/cart.rehydrate.test.ts` (extended) |

---

## Phase 3 — WhatsApp Message Builder (Pure)

Delivers AC 2, AC 3, AC 5, AC 6's data shape, and AC 7 in full.

### Changes Required

**`src/shared/utils/whatsapp-message.utils.ts`** (new)

```ts
export const sanitizeForWhatsapp = (value: string): string
// strips WHATSAPP_CONTROL_CHAR_PATTERN then WHATSAPP_MARKDOWN_CHAR_PATTERN; applied to
// every interpolated value (product name, diameter, contact fields) — never to the template's
// own *bold* markers, per the epic's WhatsApp II implementation note.

export const generateQuoteReference = (now: Date = new Date()): string
// `${QUOTE_REFERENCE_PREFIX}-${yymmdd}-${4-char uppercase hex}`, e.g. TH-260913-A4F2

export const buildQuoteMessages = (
  lines: CartLine[],
  contact: CartContact,
  reference: string = generateQuoteReference(),
): string[]

export const buildWhatsappUrl = (waNumber: string, message: string): string
// `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`
```

Design notes for `buildQuoteMessages` (Option A wording, epic WhatsApp II):

- Operates on already-effective lines (current price, gone lines excluded) — the caller resolves that from `checks` in Phase 6's `getEffectiveLines`; this function has no knowledge of revalidation.
- Per priced line: `N) <internalId or "Sin clave interna"> · <productName>` then `   <diameter> · <qty> pz · $<unit> c/u · $<lineTotal>`. Per no-variant line: `N) <internalId or "Sin clave interna"> · <productName>` then `   Sin variante seleccionada · <qty> pz` (no price, no `c/u`, matches the epic's exact example).
- Line numbering (`N)`) is continuous across parts (a part starting mid-cart continues from where the previous part left off, never restarts at 1).
- Single-part output matches the epic's literal Option A template: `*Solicitud de cotización* · <ref>` header, blank line, `Cliente:`/`Correo:` block, blank line, numbered lines, blank line, `*Subtotal (líneas con precio):* $<subtotal> MXN`, then `<productCount> productos · <pieceCount> piezas` with `· <N> línea(s) sin variante` appended only when that count is > 0.
- Multi-part output reflows the header: because part 1's subtotal must reflect the **whole** cart (not just the lines that fit in part 1), the `Cliente`/`Correo`/subtotal/line-count block moves to the **top** of part 1, before its numbered lines — the epic's AC 5 says "part 1 carries" this data, not that it stays at the bottom. Every part (including part 1) is prefixed with `*Solicitud de cotización* · <ref> — Parte <N> de <M>`.
- Splitting: greedy line-boundary packing. Build each candidate part's full text (header + accumulated lines so far), measure `encodeURIComponent(candidate).length + WHATSAPP_URL_PREFIX_MAX_LENGTH` against `WHATSAPP_URL_MAX_ENCODED_LENGTH`; when the next line would overflow, close the current part and start a new one. `M` is only known once packing finishes, so headers are built in a second pass once `M` is fixed (cheap — parts are already small arrays of lines at that point).
- Money is accumulated in cents throughout (epic edge case: quote-time float drift) and formatted locally as `$X.XX` (no `MXN` suffix on per-line prices — `MXN` appears only once, on the subtotal line, per the literal Option A example).
- A cart that is empty after `getEffectiveLines` filtering (all lines gone/no-price) is the caller's problem (Phase 6 disables the CTA before calling this); `buildQuoteMessages` assumes at least one line.

### Success Criteria

- **Automated:** `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test -- __tests__/cart/whatsapp-message.utils.test.ts` (new).
- **Dev-server validation:** skipped — pure function, nothing reachable at runtime yet.
- **Manual:** none this phase.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `sanitizeForWhatsapp` | strips `\n`/`\r`/control chars and `*_~\`` from a product name and a contact field; leaves normal Spanish text (accents, `°`, `"`) intact | `whatsapp-message.utils.test.ts` |
| `buildQuoteMessages` — one part | matches the exact Option A template shape for a two-line cart (priced + no-variant line), including the `1 línea sin variante` suffix | `whatsapp-message.utils.test.ts` |
| `buildQuoteMessages` — subtotal exclusion | a no-variant (`CartProductLine`) line contributes to piece/product counts but not to the subtotal cents total | `whatsapp-message.utils.test.ts` |
| `buildQuoteMessages` — forced split | a cart sized to exceed `WHATSAPP_URL_MAX_ENCODED_LENGTH` splits on a line boundary (never mid-line), every part's text contains `Parte N de M` and the same `reference`, only part 1 contains `Cliente:`/`Subtotal`, and line numbers are continuous (part 2 starts at the number after part 1's last) | `whatsapp-message.utils.test.ts` |
| `buildWhatsappUrl` | produces a `https://wa.me/<number>?text=<encoded>` string; encoding round-trips (`decodeURIComponent` recovers the message) | `whatsapp-message.utils.test.ts` |

---

## Phase 4 — Contact Form (`react-hook-form`) And Collapsed/Expanded UX

Delivers AC 1, AC 1b, AC 1c (the form-facing half), AC 1d.

### Changes Required

**`package.json`** — `pnpm add react-hook-form`. Verified fact for this plan: HeroUI's `Input` (`node_modules/@heroui/react/dist/components/input/input.d.ts`) types its props as `ComponentPropsWithRef<typeof InputPrimitive>` (react-aria-components' native-`<input>`-backed primitive) — it forwards a real DOM ref and accepts `name`/`onChange`/`onBlur`/`ref` directly, so RHF's `register()` attaches to it exactly like a native input. **No `Controller` needed** — this resolves the epic's "HeroUI v3 integration is unverified" flag. Confirm `pnpm exec jest --listTests` still resolves `react-hook-form` by name (it's a CJS+ESM dual package; the epic expects no `moduleNameMapper` entry needed, unlike `@heroui/react`) before relying on it in Phase 4/5 tests.

**`src/features/QuotePage/ContactForm.tsx`** (new, `"use client"`)
```ts
interface ContactFormProps {
  defaultValues: Partial<CartContact>
  onSubmitValid: (contact: CartContact) => void
  onCancel?: () => void // only rendered when a saved contact already exists ("Cancelar cambios", Brief 4 comp)
}
```
- `useForm<CartContact>({ defaultValues })`.
- Three fields via HeroUI `TextField`/`Label`/`Input`, each `register`ed with `required`, `maxLength: CONTACT_TEXT_MAX_LENGTH`, and `validate: isValidContactName` (email field additionally `pattern: CONTACT_EMAIL_PATTERN`, `validate: isValidContactEmail`) — the same shared validator from Phase 1, not new inline rules.
- Per-field error text as a plain `<p role="alert" id="<field>-error">{errors.<field>?.message}</p>`, wired with `aria-invalid`/`aria-describedby` on the `Input` (skip HeroUI's `FieldError`, which expects react-aria's own validation state, not RHF's — an unnecessary integration for three fields).
- Error copy matches the comps: `Escribe tu nombre.` / `Escribe tus apellidos.` / `Escribe un correo válido.`
- Submit button disabled while `!formState.isValid`, no separate "submit" vs "disabled" copy needed here (that's the CTA in Phase 5, not this form's own submit).

**`src/features/QuotePage/ContactSection.tsx`** (new, `"use client"`)
- Mounted-guard pattern (`Header.tsx:15-21`) — render nothing/skeleton until mounted, since `contact` comes from `localStorage`.
- Reads `contact` via `useCartStore((s) => s.contact)`, `setContact`, `clearContact`.
- `const { contact: valid, partial } = validateContact(rawContact)`.
- State: `mode: "summary" | "form"`, derived on mount as `valid ? "summary" : "form"`; a "Usar otros datos" button flips `summary → form` (prefilling with `valid` itself, since it's the full saved record); a "Cancelar cambios" button (only in edit-of-summary mode) flips back to `"summary"` without saving.
- When rendering the form because `valid` is null but `partial` has entries, prefill with `partial` (AC 1c's "prefilled with whatever survived") and move focus into the first field via a `ref.current?.focus()` in a `useEffect` gated on the mode transition (announces via the field itself receiving focus — no separate live region needed, matches the comps' "revealing the form must move focus into it").
- `onSubmitValid` calls `setContact(contact)` then sets `mode: "summary"`.
- Summary view: read-only three-column `Nombre`/`Apellidos`/`Correo`, `Solo en este dispositivo`, `Usar otros datos` (bordered secondary) and `Olvidar mis datos` (text action) per the comps.
- "Olvidar mis datos": an `AlertDialog` confirmation (same HeroUI pattern as `QuotePage.tsx`'s `Vaciar lista`, `AlertDialog.Trigger`/`Backdrop`/`Container`/`Dialog`) — confirming calls `clearContact()` and sets `mode: "form"`. Reversible in the sense that nothing is lost from the cart; the buyer can immediately refill and resubmit.

**`src/features/QuotePage/QuotePage.tsx`** — render `<ContactSection />` between the line list and the (Phase 5) `WhatsappCta`, only when `lines.length > 0` (no point collecting contact details for an empty cart).

### Success Criteria

- **Automated:** `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test -- __tests__/cart/ContactSection.test.tsx` (new).
- **Dev-server validation:** `curl http://localhost:3000/cotizar` 200; visually the contact block is markup-present in the response (server-rendered shell; the client hydrates it) — grep the HTML for `Tus datos de contacto` or the summary heading is enough smoke coverage from `curl`, full interaction is manual.
- **Manual:** with a cart line present, load `/cotizar` with no saved contact → form shown expanded; fill and submit → collapses to summary and survives a reload; `Usar otros datos` → prefilled form, `Cancelar cambios` discards edits; `Olvidar mis datos` → confirm dialog → contact cleared → form re-shown empty.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `ContactForm.tsx` | required/length/email validation blocks submit with the exact Spanish error copy; valid submit calls `onSubmitValid` once | `ContactSection.test.tsx` |
| `ContactSection.tsx` | no saved contact → form; valid saved contact → summary, no form in the DOM; invalid/partial saved contact → form prefilled with only the surviving fields; "Olvidar mis datos" round-trip | `ContactSection.test.tsx` |
| `cart.store.ts` integration | `setContact`/`clearContact` reflected immediately in `ContactSection` without a reload | `ContactSection.test.tsx` |

---

## Phase 5 — WhatsApp CTA, Multi-Part Stepper, And Hand-Off Archive

Delivers AC 4, AC 6 (UI half), and the hand-off half of AC 8 (archive-on-`Empezar una nueva cotización`, Open Question VI).

### Changes Required

**`src/features/QuotePage/quote.utils.ts`** — add
```ts
export const getEffectiveLines = (lines: CartLine[], checks?: LineChecks): CartLine[]
// excludes product-gone/variant-gone lines; for a "priced" check, returns the line with
// unitPrice swapped to check.currentPrice; otherwise returns the line unchanged.
// Mirrors getQuoteTotals's per-line resolution — extracted so WhatsappCta and getQuoteTotals
// agree on "what counts," without getQuoteTotals importing WhatsApp-specific code.
```

**`src/features/QuotePage/WhatsappCta.tsx`** (new, `"use client"`)
```ts
interface WhatsappCtaProps {
  lines: CartLine[]
  checks: LineChecks
  contact: CartContact | null
  onArchiveAndClear: () => void
}
```
- `effectiveLines = getEffectiveLines(lines, checks)`.
- Disabled states (render a `<span aria-disabled="true">`, never `href="#"`, per `Home.tsx:356-372`):
  - `!WHATSAPP_NUMBER` → `No podemos abrir WhatsApp porque falta la configuración de Tehesa. Inténtalo más tarde.` (also reassures `Tus datos y tu lista permanecen guardados en este dispositivo.`, per the Brief 4 comp).
  - `!validateContact(contact).contact` → `Completa tus datos de contacto para continuar.`
  - `effectiveLines.length === 0` → `No hay líneas con datos suficientes para cotizar.` (defensive; only reachable if every line is gone/no-price).
- Enabled: `messages = buildQuoteMessages(effectiveLines, contact)`, `urls = messages.map((m) => buildWhatsappUrl(WHATSAPP_NUMBER, m))`.
  - `urls.length === 1`: single real `<a href={urls[0]} target="_blank" rel="noopener noreferrer">Cotizar</a>` with the supporting copy `Se abrirá WhatsApp con el mensaje preparado. Tú decides si lo envías.` (Brief 4 comp, carries the "never claim sent" rule). No local "opened" state needed for a single part.
  - `urls.length > 1`: local `openedParts: Set<number>` state (component-local, not persisted — resets on reload by design, since a reload also means the buyer can re-open any part from scratch). Renders:
    - Before any part opened: `Esta cotización necesita <M> partes`, all parts `Pendiente`, primary CTA subtitled `Abrir parte 1 de <M> en WhatsApp`.
    - Mid-flight: `Continúa con la parte <k> de <M>`, opened parts marked `Abierta en WhatsApp · vuelve a abrirla si hace falta` with a `Volver a abrir` action (still a real anchor).
    - All opened: `Abriste las <M> partes en WhatsApp` / `No podemos confirmar si las enviaste. Puedes volver a abrir cualquier parte.`, plus an `Empezar una nueva cotización` button that calls `onArchiveAndClear()`. Every part stays re-openable even in this state (per AC 6, "keeps every part re-sendable").
  - Every anchor click marks that part index `opened` (adds to the `Set`) — the browser cannot observe delivery, so "opened" is tracked from the click handler, never inferred.

**`src/features/QuotePage/QuotePage.tsx`** — render `<WhatsappCta lines={lines} checks={checks} contact={contact} onArchiveAndClear={archiveAndClearLines} />` after `ContactSection`, before `Vaciar lista`. Read `contact` and `archiveAndClearLines` from `useCartStore`.

### Success Criteria

- **Automated:** `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test -- __tests__/cart/WhatsappCta.test.tsx` (new).
- **Dev-server validation:** `curl http://localhost:3000/cotizar` 200; env var checked two ways: with `NEXT_PUBLIC_WHATSAPP_NUMBER` unset in `.env.local`, curl the page and grep for the "falta la configuración" copy in the server-rendered shell (it's static text, not client-only); this is a real regression check, not just a manual one.
- **Manual:** with `NEXT_PUBLIC_WHATSAPP_NUMBER` set locally and a valid contact: small cart → single `Cotizar` anchor opens WhatsApp Web/app with the exact Option A text (verify escaping survives a product name containing `*` or a newline if one exists in Strapi data, or fabricate one via a test product); large cart (many lines / long names) → multi-part stepper appears, each part opens with continuous line numbering and the same reference; clicking `Empezar una nueva cotización` on the all-opened state clears the visible list.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `WhatsappCta.tsx` — disabled states | missing env var, invalid/missing contact, and zero effective lines each render the `aria-disabled` span with the matching copy, never a clickable anchor | `WhatsappCta.test.tsx` |
| `WhatsappCta.tsx` — single part | one real anchor, correct `href`, no stepper markup present | `WhatsappCta.test.tsx` |
| `WhatsappCta.tsx` — multi-part | N part links rendered in order; clicking one marks it opened and re-clickable; `Empezar una nueva cotización` appears only once every part is opened and calls `onArchiveAndClear` exactly once | `WhatsappCta.test.tsx` |
| `getEffectiveLines` | swaps in a `checks` current price, excludes gone lines, leaves an unchecked line's stored price untouched | `WhatsappCta.test.tsx` or a dedicated `quote.utils.test.ts` addition |

---

## Phase 6 — Quote Recovery: The Returning-Buyer Empty State

Delivers the recovery half of AC 8 (Open Question V, pulled into this story).

### Changes Required

**`src/features/QuotePage/QuotePage.tsx`** — the existing `lines.length === 0` branch (currently the plain "Tu lista está vacía" block) splits in two:
- `lastQuoteLines` present (read via `useCartStore((s) => s.lastQuoteLines)`) → new recovery empty-state: `Abrimos WhatsApp para ti` / `No podemos confirmar si enviaste el mensaje. La lista se limpió en este dispositivo, pero conservamos una copia para recuperarla.`, with `Restaurar lista` (primary, calls `restoreLastQuote`) beside `Empezar una nueva cotización` (secondary, calls `dismissLastQuote` — there is nothing left to clear, this just dismisses the recovery offer per the comps' state 5).
- `lastQuoteLines` is `null` → the existing plain empty state, unchanged (`Tu lista está vacía` / `Volver al catálogo`).

No new component file — this is small enough to stay inline in `QuotePage.tsx`'s existing empty-state branch; a separate file would be the "unrequested abstraction" the repo's guidelines warn against for a two-branch conditional.

### Success Criteria

- **Automated:** `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test -- __tests__/cart/QuotePage.recovery.test.ts` (new, or extend an existing `QuotePage` test file if one exists by this point — check before creating a new one, per the "don't duplicate" rule).
- **Dev-server validation:** not independently checkable via `curl` (the state depends on client-side store contents seeded through a prior interaction) — this phase is **manual-only** for dev-server purposes; state so explicitly.
- **Manual:** archive a cart via Phase 5's `Empezar una nueva cotización` flow, reload `/cotizar` → recovery empty-state appears; `Restaurar lista` brings the exact same lines back (same quantities, same order) and clears the recovery slot; `Empezar una nueva cotización` from this screen dismisses the offer and the plain empty state shows on the next reload.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|---|---|---|
| `QuotePage.tsx` recovery branch | renders only when `lines` is empty and `lastQuoteLines` is non-null; `Restaurar lista` round-trips the exact archived lines; `Empezar una nueva cotización` here dismisses without restoring | `QuotePage.recovery.test.ts` |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
|---|---|---|---|---|
| AC1 — RHF, required/length/email per field | Phase 4 | `curl /cotizar` 200, contains contact heading | Not validated | Interaction proof is manual + `ContactSection.test.tsx` |
| AC1b — collapsed vs expanded, prefill + focus | Phase 4 | n/a — client state | Not validated | Manual + `ContactSection.test.tsx` |
| AC1c — shared validator, rehydrate + message-build time | Phase 1 (validator), Phase 4 (form consumer), Phase 5 (message-build consumer via `validateContact` gate) | n/a | Not validated | `contact-validation.test.ts` + `ContactSection.test.tsx` + `WhatsappCta.test.tsx` |
| AC1d — olvidar mis datos | Phase 4 | n/a | Not validated | Manual + `ContactSection.test.tsx` |
| AC2 — escaping | Phase 3 | n/a — pure function | Not validated | `whatsapp-message.utils.test.ts` |
| AC3 — message content, Option A wording | Phase 3 | n/a | Not validated | `whatsapp-message.utils.test.ts` |
| AC4 — anchor vs disabled span, env var | Phase 5 | `curl /cotizar` with `NEXT_PUBLIC_WHATSAPP_NUMBER` unset, grep for the disabled-state copy | Not validated | Regression-checkable via curl since the copy is server-rendered |
| AC5 — split threshold, part 1 contract | Phase 3 (logic), Phase 5 (UI) | n/a | Not validated | `whatsapp-message.utils.test.ts` forced-split case |
| AC6 — multi-part stepper, opened/re-sendable | Phase 5 | n/a | Not validated | Manual + `WhatsappCta.test.tsx` |
| AC7 — pure `buildQuoteMessages`, test coverage | Phase 3 | n/a | Not validated | `whatsapp-message.utils.test.ts` |
| AC8 — clear on `Empezar una nueva cotización`, recovery | Phase 2 (store), Phase 5 (archive trigger), Phase 6 (recovery UI) | n/a | Not validated | Manual end-to-end + `cart.store.test.ts` + `QuotePage.recovery.test.ts` |

## Cross-Cutting Concerns

- **`NEXT_PUBLIC_WHATSAPP_NUMBER` must be added to `.env.local`** locally to test Phases 5-6 end to end (`522224417330`, per the epic's WhatsApp I — verify the `52…` vs `521…` variant resolves to the right chat before relying on it, per the epic's own 30-second check). This repo's `CLAUDE.md` "Required env vars" section does not currently list it; updating that doc is not part of this plan's scope (docs-only, not requested) but the implementer should flag it as a follow-up.
- **`react-hook-form` is the epic's one sanctioned new dependency**, added only in Phase 4. No resolver package (`zod`/`yup`) — RHF's built-in `required`/`maxLength`/`pattern`/`validate` cover three text fields, per the epic's explicit call.
- **Schema version bump (Phase 2)** means any cart already in a tester's browser from Stories 1-3 development gets dropped on next load (`migrate: () => defaultCartState`). This is accepted, existing behavior — not a new risk introduced here — but worth a heads-up before manual QA so an empty cart after this phase isn't mistaken for a bug.
- **Money stays in cents** through `buildQuoteMessages`, matching `getQuoteTotals`'s existing approach — no shared helper is introduced between them since the formatting output differs (`$X.XX` with no suffix vs. `formatNumberToCurrency`'s `$X.XX MXN`), and one line of duplicated rounding logic isn't worth a cross-module dependency.
- **`getEffectiveLines` (Phase 5) intentionally lives in `quote.utils.ts`, not in the new shared WhatsApp utils.** It needs `LineChecks`, a `QuotePage`-local type; keeping it there avoids the shared layer depending on a feature-local type.
- **No per-part "opened" persistence.** Phase 5's `openedParts` is component state, not written to `localStorage` — not required by any AC, and reloading mid-multi-part-send already re-offers every part as openable, which satisfies "never sent, always re-sendable" without extra state.

## Open Questions / Out Of Scope

**Resolved during this planning session (2026-09-13, user):**
- Open Question V: durable recovery (`Restaurar lista`) is in scope — Phase 2 + Phase 6.
- Open Question VI: the cart clears only on `Empezar una nueva cotización`, never automatically — Phase 5's archive trigger.

**Deliberately excluded, though adjacent:**
- The `52…` vs `521…` WhatsApp number variant check and the on-device 1800-character-cap measurement (WhatsApp I/IV) are manual QA of a business fact and a device measurement, not code; they belong to whoever configures `.env.local` and does final QA, not to a phase here.
- Migrating off click-to-chat — Spike 4S said stay; out of scope by that verdict.
- Any analytics instrumentation for the events this story unblocks (`add_to_cart` already fires from Stories 1-3; `begin_checkout`/`generate_lead` would fire from this story's CTA) — that's Story 5, documentation-only, no instrumentation code in either story.
- Persisting per-part "opened" state across a reload — see Cross-Cutting Concerns; not required by any AC.

## Out-of-scope implementation changes

**Phase 4 — HeroUI `TextField` owns the controlled value, not `Input` (2026-09-13, implementer correction, user-approved via phase sign-off).**

- **Changed:** `src/features/QuotePage/ContactForm.tsx`.
- **What changed:** `defaultValue` for each of the three fields is set on the HeroUI `TextField` wrapper, not on the inner `Input` as the plan's Phase 4 "Changes Required" implied.
- **Why:** the plan's verified fact ("HeroUI's `Input`... forwards a real DOM ref and accepts `name`/`onChange`/`onBlur`/`ref` directly, so RHF's `register()` attaches to it exactly like a native input") is accurate for event wiring but incomplete for prefill: HeroUI v3's `TextField` (built on `react-aria-components`) manages its own controlled `value` internally via `useTextField`/`useControlledState` and passes it down through context to `Input`, overriding any `defaultValue` or ref-imperative value set directly on `Input`. Isolated debug tests (`Input`-level `defaultValue` vs. `TextField`-level `defaultValue`) confirmed the DOM's `value` attribute stayed empty in the first case and populated correctly in the second, with typed input still reaching RHF's tracked state in both cases (confirmed via `handleSubmit`).
- **Verification:** `__tests__/cart/ContactSection.test.tsx` — "Usar otros datos reveals a form prefilled with the saved contact" and "shows the form prefilled with only the surviving fields" both assert `getByDisplayValue` on the prefilled fields and would fail under the `Input`-level approach.
