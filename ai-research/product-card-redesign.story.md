# Product Card Redesign — Research

**Date:** 2026-09-14
**Branch:** `feat/add-product-card-v2`
**Scope:** standalone story (single deliverable, ~2-3 phases)
**Design source:** Claude Design project "Tehesa UI mocks v1", file `PLP.dc.html`
(https://claude.ai/design/p/4b99241e-42ab-4ca4-ac4e-c1cd49a75385?file=PLP.dc.html). `PLP no images.dc.html` is the
same page imported with `show-images={{ false }}` — that is the state this story ships. `image-slot.js` is the comp's
drag-to-fill placeholder web component (no design content beyond "a rectangle where a photo goes"); `support.js` is
the generic Claude Design runtime and carries no design content.

**In scope from the comp (user decision, D1):** the grid card at the top of the page (the `<sc-for list="{{ products }}">`
article), the "Anatomía" spec table, the "Adaptación responsiva" mobile/tablet comps and breakpoint table, and the
type/color/state tables. **Out of scope:** the "Tres variantes propuestas" section (A/B/C) and its recommendation;
the hero, filter row, and variant drawer also drawn on the page (they already exist in the app and are not part of
this story).

## Story Definition

### Title

Rebuild `ProductCard` to the PLP comp's anatomy, with an optional image slot that stays empty until Strapi serves
product images.

### Description

Today `src/components/ProductCard.tsx` is a HeroUI `Card` with a `category / brand` kicker, a large bold name, a
`Desde | Hasta` two-column price grid (or a single `Precio` for one-variant products), and a footer with
`Explorar las N variantes` + `Agregar y elegir después` (or `Agregar 1 pieza` for one-variant products). The comp
keeps every behavior and re-lays the card so only the name and the minimum price carry weight:

1. **Image block** (top, optional) — 4/3 on tablet/desktop, 16/9 on mobile, `#F3F4F6` ground, 10px radius. Strapi
   has **no media field on any content type today** (Open Questions › Strapi contract I), so the block is a prop the
   card accepts and renders only when given; the default render — and everything the catalog shows this story — is
   the card **without** the block, exactly as `PLP no images.dc.html`.
2. **Kicker row** — category (11px / 500 / +0.08em / uppercase / `primary-500 #23890C`, one line, ellipsis) on the
   left; a variant-count pill (`N variantes`, 11px / 400 / gray-500 on gray-100, full radius) pinned right.
3. **Name** — 17px / 600 / line-height 1.35 / gray-900, up to three lines.
4. **Brand chip** — outline chip (gray-200 border, full radius, tag icon, 11px / 400 / gray-700) below the name.
   Rendered only when the product has a brand: "Marca Libre" is a real Strapi brand record, not a frontend fallback
   (Strapi contract II).
5. **Price block** — `DESDE` label (11px / 400 / uppercase / gray-500), min price 21px / 600 / -0.015em + `MXN`
   12px gray-500, then `hasta $X MXN` 12px / 400 / gray-500 on its own line (desktop/tablet) or right-aligned beside
   the price (mobile).
6. **Primary action** — `Explorar N variantes` + arrow-right icon, green fill, 40px desktop / 44px touch, 10px
   radius, opens the variants drawer (unchanged handler).
7. **Secondary action** — `Agregar y elegir después`, outline on tablet/desktop, ghost (no border) on mobile,
   same height as the primary. Unchanged handler (adds a variant-less line).

The one-variant card keeps today's behavior restyled (D2): same anatomy, the price block shows the single price
with no `hasta` line, the pill reads `1 variante`, and the footer is a single `Agregar 1 pieza` primary (same fetch +
`addVariantLines` path, same inline `role="alert"` failure message). Card states: rest (gray-200 border, no shadow),
hover (gray-300 border + `0 8px 24px rgba(17,24,39,.08)`, 200ms), focus (2px outline on the primary button).

### Acceptance criteria

1. **Anatomy.** Every product card on `/` renders, top to bottom: kicker row (category left, `N variantes` pill
   right), name, brand chip (only when `product.brand` exists), price block, actions — in that order, with the
   type scale, colors, radii, and gaps listed under "Visual patterns to preserve". No image block renders when no
   image is supplied. Products with `category: null` render without the kicker text but keep the pill; products
   with `brand: null` render without the chip; products with `minPrice`/`maxPrice` `null`/`undefined` render without
   the price block (today's behavior).
2. **Behavior parity.** Multi-variant cards keep `Explorar N variantes` → `handleProductClick(product)` and
   `Agregar y elegir después` → `addProductLine` (+ existing success/limit toasts). One-variant cards keep
   `Agregar 1 pieza` → single `/api/catalog/variants` fetch → `addVariantLines`, with the spinner-while-adding,
   `role="alert"` failure message, and toasts unchanged. `variantCount == null` keeps the `Ver variantes` fallback
   label. The existing `__tests__/product-listing/ProductCard.test.tsx` behaviors pass after their copy/DOM
   assertions are updated to the new anatomy.
3. **Responsive.** Below `sm` (D3) the card uses the mobile layout: 14px padding, 16px name, brand chip + variant
   pill together in one wrapping row under the name (no pill in the kicker row), `hasta` right-aligned beside the
   price, both actions 44px, secondary without border. From `sm` up it uses the tablet/desktop layout: 16px
   padding, pill in the kicker row, `hasta` on its own line, secondary outlined; actions are 44px below `md` and
   40px from `md` (HeroUI `size="lg"` does exactly this). The grid is 1 column below `sm`, 2 columns `sm`–`lg`, and
   `auto-fill, minmax(280px, 1fr)` (or 3 columns, D4) from `lg`, gap 16px/20px. Layout switches are CSS-only — no
   `useMediaQuery` (SSR-false, hydration mismatch).
4. **Image slot.** `ProductCard` accepts an optional image prop (shape in D5). When present it renders the image
   block above the kicker at 4/3 (`sm`+) / 16/9 (`<sm`) with `alt` text; when absent nothing renders — no
   placeholder, no "Foto del producto" text, no reserved height. No query, type, or server-action change is made
   for images in this story.
5. **Dark mode + skeleton.** The card is legible in dark mode using the token mapping in D6 (no light-only hex
   leaks; `pnpm design:lint` still passes). `ProductCardSkeleton` mirrors the new anatomy (kicker line + pill,
   name, chip, price lines, two full-width buttons) so `/` does not shift when data lands. `pnpm lint`,
   `pnpm exec tsc --noEmit`, `pnpm build`, and `pnpm test` pass.

### Task breakdown (for the planner)

- **Phase 1 — card + skeleton + grid.** Rewrite `ProductCard.tsx` markup/classes to the anatomy; keep every
  handler, constant, and toast string; add the optional image prop; update `ProductCardSkeleton.tsx`; change the
  grid classes in `ProductListing.tsx` and `src/app/loading.tsx` together (they must match).
- **Phase 2 — tests.** Update `__tests__/product-listing/ProductCard.test.tsx` assertions (`Hasta` → `hasta`,
  pill text, chip presence/absence, image prop present/absent) via `/unit-test`. Add nothing for hover/shadow.
- **Phase 3 — dark-mode pass.** Verify both themes at ~390px and ~1440px with `pnpm dev`; adjust D6 tokens if a
  contrast issue shows up. Manual clicks only for the drawer/add flows (they are already unit-tested).

## Design Agent Handoff

The design is **done** — comps exist in the Claude Design project above — so this section records what the comps
settle and what the repo decided for the gaps. No design-agent brief file is written for this story (same precedent
as `header-navigation.story.md`, which consumed `Header.dc.html` from the same project).

### User goal, and what this is not

A buyer scanning 50 cards per page needs to compare **minimum price** and **what the product is** at a glance, then
either explore sizes or drop the product into the quote list to size later. The card is **not** a product page (no
description, no stock, no SKU list), **not** a checkout (the price is a range/starting price, never an amount the
buyer will pay), and **not** an image gallery — until Strapi serves media the card ships image-less and must look
finished that way.

### Surface index

| Surface | File | States | Covered by |
| --- | --- | --- | --- |
| Product card, multi-variant | `src/components/ProductCard.tsx` | rest / hover / primary focus / adding (secondary) / no category / no brand / no price | comp grid card (desktop), tablet + mobile comps |
| Product card, one-variant | `src/components/ProductCard.tsx` | rest / adding (spinner) / add failed (`role="alert"`) | **not in comp** — D2 |
| Product card, with image | `src/components/ProductCard.tsx` | image present (4/3, 16/9 mobile) | comp grid card with `showImages=true`; ships **disabled** |
| Card skeleton | `src/components/ProductCardSkeleton.tsx` | loading | derived from anatomy (no comp) |
| Card grid | `src/features/ProductListing/ProductListing.tsx`, `src/app/loading.tsx` | 1 / 2 / auto-fill columns | comp breakpoint table — D4 |
| Dark theme, all of the above | same files | dark | **not in comp** — D6 |

### Rules that override design instinct

- **Never present the price as an amount to pay.** It is `Desde $X MXN` (+ `hasta $Y MXN`); one-variant products
  show one price with no `hasta`. Never a total, never "Comprar".
- **No image placeholder.** When no image is supplied the block does not exist — no gray box, no icon, no
  "Foto del producto", no reserved aspect-ratio space. The image-less card is the shipped default, not a fallback.
- **Do not invent data.** No stock, no SKU, no size previews (that was proposal B, out of scope), no "Marca Libre"
  text when `brand` is null — render nothing.
- **Copy is unchanged.** `Explorar N variantes`, `Ver variantes`, `Agregar y elegir después`, `Agregar 1 pieza`,
  `Desde`, `hasta`, `MXN`, `N variantes`, and all toast/alert strings stay exactly as they are in code today.

### Implementation-facing constraints

**Mobile/desktop.** Breakpoints are Tailwind's (`sm` 640, `md` 768, `lg` 1024) — see D3 for the comp → Tailwind
mapping. All layout differences are class-driven (`max-sm:`, `sm:`, `md:`, `lg:`); `useMediaQuery` returns `false`
on the server (`ai-skills/REPO_CONTEXT.md` › `src/shared/hooks`) and must not decide card layout. The secondary
button's outline-vs-ghost switch is a **class** switch on one `Button` (`border-0 sm:border`, or `variant="outline"`
plus `max-sm:border-0`), not two buttons and not a variant chosen at runtime. Touch targets: `size="lg"` gives
`h-11 md:h-10` out of the box (`@heroui/styles/dist/components/button.css`), matching the comp's 44/40px.

**Accessibility.** The product name is a heading (`h2`, matching the comp and the page's `h1` hero); the primary
action's accessible name is its visible text (`Explorar N variantes`), icon `aria-hidden="true"`; the failure
message keeps `role="alert"`; the spinner keeps `aria-hidden` (button text already says what is happening). The
variant pill and brand chip are plain text — not interactive, no `role`. Focus ring: HeroUI's `--focus` is already
remapped to `#4DF527` in `src/app/globals.css`; the comp draws `#24AD02` (`primary-400`) — keep the global ring
(D7). Hover shadow must not be the only hover cue for keyboard users; the focus ring covers that.

**Visual patterns to preserve** (tokens are in `DESIGN.md`, exposed as Tailwind utilities by the `@theme` block in
`src/app/globals.css`; run `pnpm design:lint` if `DESIGN.md` is touched — it should not be):

| Element | Spec (comp "Anatomía" + type/color tables) | Tailwind / token |
| --- | --- | --- |
| Card | 1px gray-200 border, 14px radius, white, 16px padding (14px `<sm`), column gap 14px (12px `<sm`) | `rounded-[14px] border p-4 max-sm:p-3.5 gap-3.5` on the HeroUI `Card` (its base is `p-4 gap-3 shadow-surface` — override the shadow to none at rest) |
| Hover | border gray-300, `0 8px 24px rgba(17,24,39,.08)`, 200ms | `hover:border-gray-300 hover:shadow-[…] transition-[box-shadow,border-color] duration-200` |
| Category | 11 / 500 / +0.08em / uppercase / `#23890C`, one line | `text-[11px] font-medium tracking-[.08em] uppercase text-primary-500 truncate` |
| Variant pill | 11 / 400 / gray-500 on gray-100, full radius, `3px 8px` | HeroUI `Chip size="sm"` or a `span` with `rounded-full bg-gray-100 text-gray-500` |
| Name | 17 / 600 / 1.35 / gray-900 (16px `<sm`), ≤ 3 lines | `text-[17px] max-sm:text-base font-semibold leading-[1.35] line-clamp-3` |
| Brand chip | outline gray-200, tag icon 12px gray-500, 11 / 400 / gray-700, `3px 9px 3px 7px` | `RiPriceTag3Line` (already in `@remixicon/react`) + `rounded-full border` |
| `Desde` label | 11 / 400 / +0.08em / uppercase / gray-500 | `text-[11px] tracking-[.08em] uppercase text-gray-500` |
| Min price | 21 / 600 / -0.015em / gray-900 (20px `<sm`) + `MXN` 12 / 400 / gray-500 | `formatNumberToCurrency(minPrice)` — **check whether it already appends `MXN`** (it does today: tests assert `"$0.00 MXN"`); the comp splits number and currency into two spans, so either split the formatted string or keep it whole (D8) |
| `hasta` line | 12 / 400 / gray-500 | `text-xs text-gray-500` |
| Primary | 40/44px, 10px radius, `#4DF527` fill, `#0D3401` text, 14 / 500, arrow-right | `Button variant="primary" size="lg" fullWidth className="rounded-[10px]"` + `RiArrowRightLine` (HeroUI base is `rounded-3xl`, override) |
| Secondary | same height, outline gray-200 / text `#125D03` / 14 / 400; hover fills `#0F4804` with white text; ghost `<sm` | `Button variant="outline" size="lg" fullWidth className="rounded-[10px] font-normal text-primary-700 max-sm:border-0"` — HeroUI's outline hover is a gray mix, the comp's is `primary-800` fill (D9) |

**Content constraints.** Prices go through `formatNumberToCurrency` (`src/shared/utils/global.utils.ts`); never
hand-format. `N variantes` uses `product.variantCount` verbatim (the existing `Explorar las 0 variantes` test
fixture shows `0` is a legal value and must still render). The comp's `Explorar 25 variantes` drops today's `las`
(`Explorar las 25 variantes`) — D10.

**Out of scope.** Product images in Strapi, `next.config.ts` `images.remotePatterns`, the `Product` type/query
changes an image field will need; the "Tres variantes propuestas" designs; hero/filters/drawer restyling; the
1.8s "Agregado al carrito" secondary-label swap drawn in the comp's state table (D11); analytics events.

### Decision record

- **D1 — Which comp is the target.** *Decided:* the grid card + mobile/tablet comps and the anatomy/type/color/state
  tables. The "Tres variantes propuestas" section and its "Recomendación: A" note are ignored (user, 2026-09-14).
- **D2 — One-variant card.** *Decided:* keep today's behavior, restyled: one price (no `hasta`), pill `1 variante`,
  single `Agregar 1 pieza` primary, same fetch/alert path (user, 2026-09-14). Not drawn in the comp.
- **D3 — Breakpoint mapping.** *Decided (assumption):* comp "Móvil <600" → Tailwind `<sm` (640); "Tablet 600–1023"
  → `sm`–`lg`; "Escritorio ≥1024" → `lg`. Button height flips at `md` because that is where HeroUI's `size="lg"`
  flips, one breakpoint earlier than the comp's 1024 — accepted for zero custom height CSS.
- **D4 — Grid.** *Decided (assumption):* replace `grid-cols-1 lg:grid-cols-3 gap-4` with
  `grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 lg:gap-5` in both
  `ProductListing.tsx` and `loading.tsx`. If auto-fill yields 4 narrow columns at 1440px that the user dislikes,
  fall back to `lg:grid-cols-3`. Open Questions › UI I.
- **D5 — Image slot contract.** *Decided (assumption):* an optional prop on `ProductCard`,
  `image?: { src: string; alt: string }`, rendered with `next/image` (`fill` + `object-cover`) inside a
  `aspect-[4/3] max-sm:aspect-video rounded-[10px] overflow-hidden bg-gray-100` wrapper only when present. Nothing
  is added to `Product`, the GraphQL queries, or `global.lib.ts`; `ProductListing` never passes it this story. When
  Strapi ships media, the follow-up story maps `product.image.url` → this prop and adds the host to
  `next.config.ts` `images.remotePatterns`. Open Questions › UI II.
- **D6 — Dark mode.** *Decided (assumption, comp is light-only):* card surface = HeroUI `bg-surface` (dark
  `#0A0A0A`-ish default), border `border-gray-800`, hover border `gray-700`, no shadow in dark; name `gray-50`,
  secondary text `gray-400`, category `primary-200` (`#4DF527`, as `--accent-soft-foreground` already does in
  `.dark`), pill `bg-gray-800 text-gray-400`, brand chip `border-gray-700 text-gray-300`, image ground
  `bg-gray-800`. Primary button unchanged (green on dark is the header story's precedent). Verify in Phase 3.
- **D7 — Focus ring.** *Decided:* keep HeroUI's global `--focus` (`#4DF527`) rather than the comp's `#24AD02` —
  one ring color app-wide beats a per-card override.
- **D8 — `MXN` split.** *Open:* `formatNumberToCurrency` returns `"$350.92 MXN"` as one string; the comp renders the
  number at 21px and `MXN` at 12px. Either split on the last space in the card (cheap, but couples the card to the
  formatter's output shape) or render the whole string at 21px and skip the two-tone. Open Questions › UI III.
- **D9 — Secondary hover.** *Decided (assumption):* keep HeroUI's outline hover (gray mix) instead of the comp's
  `primary-800` fill + white text. `DESIGN.md` › `button-secondary-hover` documents the `primary-800` target, so if
  the user wants it, it is `hover:bg-primary-800 hover:text-white hover:border-primary-800` on the one button.
- **D10 — CTA copy.** *Open:* comp says `Explorar 25 variantes`; code and tests say `Explorar las 25 variantes`.
  Copy is declared unchanged above; flagging because the comp differs. Open Questions › UI IV.
- **D11 — "Agregado al carrito" label swap.** *Decided (assumption):* skip. The app already confirms adds with
  `toast.success(...)` via `Toast.Provider`; a second, timer-based confirmation on the button is redundant and adds
  a `setTimeout` to clean up. Open Questions › UI V.

## Technical Research

### Affected areas

- `src/components/ProductCard.tsx` — the whole render; every handler, constant, and state stays.
- `src/components/ProductCardSkeleton.tsx` — mirror the new anatomy.
- `src/features/ProductListing/ProductListing.tsx` — grid classes only (D4).
- `src/app/loading.tsx` — the same grid classes (it duplicates the listing grid for the skeleton).
- `__tests__/product-listing/ProductCard.test.tsx` — assertion updates (AC2) + two image-prop cases (AC4).
- Not touched: `src/shared/types/global.types.ts`, `src/shared/queries/global.queries.ts`,
  `src/shared/lib/global.lib.ts`, `src/features/Home/Home.tsx` (`handleProductClick` unchanged),
  `src/features/ProductVariantsDrawer/*`, `src/zustand/*`, `DESIGN.md`, `src/app/globals.css`.

### Existing patterns to follow

- **Component system.** Stay on HeroUI `Card` (`Card.Header/Content/Footer` today) or drop to a plain `<article>`
  with the same classes — either is fine; the comp is a padded article with no internal borders, so today's
  `border-t` between header and content goes away. `Card`'s base is `p-4 gap-3 shadow-surface` (`card.css`); the
  comp wants no shadow at rest, so override it or use `<article>`. Planner picks; do not add a third card primitive.
- **Buttons.** HeroUI v3 has exactly `primary | secondary | tertiary | ghost | outline | danger | danger-soft`
  (`button.styles.js`). The comp's secondary is `outline` (desktop) / `ghost` (mobile); today's card uses `tertiary`
  with border/background stripped by classes — replace with `outline` + `max-sm:border-0`.
- **Chips.** HeroUI `Chip` exists (`chip.css`: `rounded-2xl px-2 py-0.5 text-xs`, variants
  `primary|secondary|soft|tertiary`, sizes `sm|md|lg`). The comp's two chips are 11px with 3px vertical padding —
  close enough to `Chip size="sm"` with a `rounded-full` override, or a bare `span`. Do not create a chip atom.
- **Icons.** `@remixicon/react` is already the icon set (`RiArrowRightLine` is used in `ProductListing.tsx`;
  `RiPriceTag3Line` is in the same package). Do not inline the comp's SVGs.
- **Currency.** `formatNumberToCurrency` in `src/shared/utils/global.utils.ts` (D8).
- **Dark mode.** `dark:` variant via `@custom-variant dark (&:is(.dark *))`; the green scale is
  `text-primary-N` / `bg-primary-N` from the `@theme` block; grays are Tailwind defaults (`DESIGN.md` neutrals).
- **Responsive.** Class-only, as `Header.tsx` does for its desktop/mobile groups.
- **Tests.** `render` from `@__tests__/test-utils` (wraps `Providers` → `CartStoreProvider` + `Toast.Provider`);
  `ResizeObserver` and `fetch` mocks already exist in the card test; follow `docs/UNIT_TESTING_GUIDELINES.md`.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` after Phase 1; `pnpm test -- __tests__/product-listing/ProductCard.test.tsx`
  after Phase 2; full `pnpm test` before the PR.
- `pnpm dev` + curl smoke of `/` (200, card markup present) per phase; light/dark at ~390px and ~1440px by eye
  (clicks/layout are manual — memory `feedback_no-dev-server`).
- `pnpm design:lint` only if `DESIGN.md` changes (it should not).
- Do not run `pnpm install`.

### Dependencies / integration points

- No new dependencies. `next/image` (for the image slot, D5), `@remixicon/react`, `@heroui/react`, Tailwind v4 are
  all installed.
- `next.config.ts` has **no** `images` block today; it is not needed until a real remote image URL is passed
  (out of scope).
- Env: none new. `STRAPI_HOST`/`STRAPI_API_TOKEN` as usual for `pnpm dev`.

### Edge cases and constraints

- `variantCount` is `0` for some products (existing test fixture) → pill `0 variantes`, CTA `Explorar las 0
  variantes` — unchanged semantics; do not hide the pill on `0`.
- `variantCount` `undefined` → no pill (or `Ver variantes` label path); AC2 keeps the `Ver variantes` fallback.
- `minPrice`/`maxPrice` nullable in Strapi (schema confirmed) → price block hidden when either is null (today's
  guard `minPriceString && maxPriceString`).
- `minPrice === maxPrice` on a multi-variant product → comp still shows `hasta $X MXN`; keep it (no special case).
- `category: null` → kicker row still renders so the pill stays right-aligned; use `justify-end`/an empty left
  slot rather than collapsing the row.
- Long names: `line-clamp-3` (Tailwind v4 built-in); long categories: `truncate` (comp: one line, ellipsis).
- Card height equalization in the grid: `h-full` on the card + `flex-1` on the middle block (comp uses `flex:1` on
  the text block) so footers align across a row.
- `Card`'s `overflow-hidden` (today) would clip the hover shadow → use `overflow-visible` (HeroUI default) and put
  `overflow-hidden` only on the image wrapper.
- Hover shadow on touch devices: wrap in `@media (hover: hover)` semantics — Tailwind v4's `hover:` already does.
- Stale docs: `ai-skills/REPO_CONTEXT.md` said `ProductCard` uses `useMediaQuery()` and has commented-out image
  code; both were removed in `4915c10` ("first draft of the new design"). Corrected in this research pass.
  `CLAUDE.md` › "Catalog images: Currently commented out" is equally stale — fix in the same PR (docs-only line).

## Open Questions

### Strapi contract

- I: Question: Does any content type carry a media/image field the card could bind to?
  Status: answered
  Answer: No. `product`, `product_variant`, `category`, and `brand` have no media attribute.
  Context: `backend-research` subagent — `store-tehesa-api/src/api/product/content-types/product/schema.json`
  lines 13-67 (all attributes; none of type `media`); sibling schemas checked. So the image slot cannot be wired
  to real data in this story (D5).
- II: Question: Is `brand` (and `category`) required on `product`, and is "Marca Libre" a real record or a
  frontend fallback?
  Status: answered
  Answer: Both relations are nullable `oneToOne` (no `required: true`, schema lines 30-39). "Marca Libre"
  (`customId: "libre"`) is a real seeded brand (`data/data.json`), so the comp's "los genéricos muestran Marca
  Libre" is satisfied by the data — the card renders no chip when `brand` is null and never synthesizes the label.
- III: Question: Can `minPrice`, `maxPrice`, `variantCount`, `hasOneProductVariant` be null?
  Status: answered
  Answer: Yes — all four are nullable (schema lines 40-52; `hasOneProductVariant` defaults to `false`). The card's
  existing null guards stay.

### UI/product decisions

- I: Question: Desktop grid — `auto-fill, minmax(280px, 1fr)` as the comp says (4 columns at 1400px content
  width), or keep 3 fixed columns?
  Status: pending
  Context: D4 assumes auto-fill; `ProductListing.tsx` and `loading.tsx` must change together. Cheap to flip.
- II: Question: Image prop shape — `image?: { src; alt }` on `ProductCard` (D5), or a `renderImage?: ReactNode`
  slot? Any preference for how the future Strapi story hands it in?
  Status: pending
  Context: `{ src, alt }` keeps `next/image` inside the card (one place to set sizes/aspect); a `ReactNode` slot is
  more flexible but pushes aspect-ratio/`fill` knowledge to every caller. Recommendation: `{ src, alt }`.
- III: Question: Split `formatNumberToCurrency`'s `"$350.92 MXN"` into a 21px number + 12px `MXN` (comp), or render
  it whole at 21px?
  Status: pending
  Context: D8. Splitting on the last space is one line but couples the card to the formatter's output; the
  existing tests assert the joined `"$0.00 MXN"` text on the label's parent, which still passes either way if both
  spans share the parent.
- IV: Question: Keep `Explorar las N variantes` (code/tests) or adopt the comp's `Explorar N variantes`?
  Status: pending
  Context: D10. Pure copy; the doc assumes copy is unchanged.
- V: Question: Implement the comp's 1.8s `Agregado al carrito` label swap on the secondary button, or rely on the
  existing toast?
  Status: pending
  Context: D11 assumes skip (toast already confirms). If wanted it is a `useState` + `setTimeout` with cleanup.
- VI: Question: Secondary hover — HeroUI outline default (gray) or the comp/`DESIGN.md` `primary-800` fill + white?
  Status: pending
  Context: D9 assumes default; the override is three classes.

### Catalog behavior

- I: Question: None — `handleProductClick`, the drawer, search, filters, and pagination are untouched.
  Status: answered
  Answer: Confirmed by reading `Home.tsx` (`handleProductClick` only sets `productDetails` + opens the drawer) and
  `ProductListing.tsx` (grid + empty states; the card is the only child that changes).

### Theme/persistence

- I: Question: Is the dark palette in D6 acceptable, given the comp is light-only?
  Status: pending
  Context: Derived from `DESIGN.md` neutrals and the existing `.dark { --accent-soft-foreground: #4df527 }`
  remap; the header story set the precedent of green-on-dark for accents. Phase 3 verifies by eye.

### Verification

- I: Question: Which existing card-test assertions change?
  Status: answered
  Answer: `getByText("Hasta")` → the lowercase `hasta …` line (or a `getByText(/hasta/)`); `"Precio"` label on the
  one-variant card is not in the comp — D2 keeps one price with the `Desde` label or no label (planner picks; the
  test follows); `Explorar las 0 variantes` depends on UI IV. New cases: image prop absent → no `img`; present →
  `img` with the given `alt`. Everything under "adds…", "fetches once…", "recoverable alert…", "empty variant
  result…" is untouched.
