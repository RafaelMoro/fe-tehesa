# Plan: Product Card Redesign

**Source research:** `ai-research/product-card-redesign.story.md` (2026-09-14, branch `feat/add-product-card-v2`).
**Sign-off status:** no explicit sign-off line; every open question (Strapi I–III, UI I–VI, Catalog I, Theme I–II, Verification I) is answered and dated 2026-09-14, and D1–D11 are decided. Treated as signed off — same basis as `header-navigation.story.md`. **Confirm before `/implement`.**
**Plan date:** 2026-09-14.

## Assumptions

- **Card primitive: plain `<article>`**, not HeroUI `Card`. The research leaves the choice to the planner; `<article>` avoids overriding `Card`'s `shadow-surface`, `bg-surface` (dark) and `gap-3` base, so every class on the card is the comp's value and nothing is a negation. The skeleton uses a plain `<div>` with the same shell classes + HeroUI `Skeleton` (already imported today).
- **Pill and brand chip are bare `<span>`s**, not HeroUI `Chip` (research: either is fine, no new atom). Avoids fighting `Chip`'s `rounded-2xl px-2 text-xs` base.
- **One-variant price label stays `Precio`** (D2 leaves it to the planner). It is today's copy, the "Copy is unchanged" rule covers it, and the existing `getByText("Precio")` assertions need no edit. Styled like the `Desde` label.
- **Dark name/price color:** `dark:text-[#EDEDED]` (`foreground-dark` is a `DESIGN.md` token but not a Tailwind utility — only the `primary-*` scale is exposed in `globals.css`'s `@theme`). HeroUI's `--foreground` in dark is `--snow`, not `#EDEDED`, so `text-foreground` is not used.
- **D3/D4/D5/D8/D9/D10/D11** are taken as decided in the research; no re-litigation here. Dark hover and dark secondary hover follow the D6 assumptions (border `gray-700`, no shadow; `primary-800` fill + white text).
- `MXN` split (D8): `minPriceString.lastIndexOf(" ")` inside the card — no formatter change, no new util.
- Env: `.env.local` has `STRAPI_HOST` / `STRAPI_API_TOKEN`; dev-server checks assume `pnpm dev` on `http://localhost:3000`.

## Acceptance Criteria

1. **Anatomy.** Every product card on `/` renders, top to bottom: kicker row (category left, `N variantes` pill right), name, brand chip (only when `product.brand` exists), price block, actions — in that order, with the type scale, colors, radii, and gaps listed under "Visual patterns to preserve". No image block renders when no image is supplied. Products with `category: null` render without the kicker text but keep the pill; products with `brand: null` render without the chip; products with `minPrice`/`maxPrice` `null`/`undefined` render without the price block (today's behavior).
2. **Behavior parity.** Multi-variant cards keep `Explorar N variantes` → `handleProductClick(product)` and `Agregar y elegir después` → `addProductLine` (+ existing success/limit toasts). One-variant cards keep `Agregar 1 pieza` → single `/api/catalog/variants` fetch → `addVariantLines`, with the spinner-while-adding, `role="alert"` failure message, and toasts unchanged. `variantCount == null` keeps the `Ver variantes` fallback label. The existing `__tests__/product-listing/ProductCard.test.tsx` behaviors pass after their copy/DOM assertions are updated to the new anatomy.
3. **Responsive.** Below `sm` (D3) the card uses the mobile layout: 14px padding, 16px name, brand chip + variant pill together in one wrapping row under the name (no pill in the kicker row), `hasta` right-aligned beside the price, both actions 44px, secondary without border. From `sm` up it uses the tablet/desktop layout: 16px padding, pill in the kicker row, `hasta` on its own line, secondary outlined; actions are 44px below `md` and 40px from `md` (HeroUI `size="lg"` does exactly this). The grid is 1 column below `sm`, 2 columns `sm`–`lg`, and `auto-fill, minmax(280px, 1fr)` from `lg` (4 columns at 1400px, D4), gap 16px/20px. Layout switches are CSS-only — no `useMediaQuery` (SSR-false, hydration mismatch).
4. **Image slot.** `ProductCard` accepts an optional `image?: { src; alt }` prop (D5). When present it renders a plain `<img>` block above the kicker at 4/3 (`sm`+) / 16/9 (`<sm`) with the given `alt`; when absent nothing renders — no placeholder, no "Foto del producto" text, no reserved height. No query, type, or server-action change is made for images in this story.
5. **Dark mode + skeleton.** The card matches the comp's "Tema oscuro" section per the D6 table (no light-only hex leaks; `pnpm design:lint` still passes). `ProductCardSkeleton` mirrors the new anatomy (kicker line + pill, name, chip, price lines, two full-width buttons) so `/` does not shift when data lands. `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, and `pnpm test` pass.

## Affected Files

**`src/components/`**
- `ProductCard.tsx` — Modify: whole JSX return + `ProductCardProps`; every handler, constant, hook, and state line stays.
- `ProductCardSkeleton.tsx` — Modify: whole component (mirror the new anatomy).

**`src/features/`**
- `ProductListing/ProductListing.tsx` — Modify: grid `className` on line 60 only.

**`src/app/`**
- `loading.tsx` — Modify: grid `className` (line 11) — must equal `ProductListing.tsx`'s.

**`__tests__/`**
- `product-listing/ProductCard.test.tsx` — Modify: `Hasta` assertions, pill/chip cases, two image-prop cases.

**Docs**
- `CLAUDE.md` — Modify: line 155 "Catalog images" gotcha (stale; research flagged it for this PR).
- `ai-skills/REPO_CONTEXT.md` — Modify: line 360 `ProductCard` row (tertiary → outline secondary, image prop).

**Not touched:** `src/shared/types/global.types.ts`, `src/shared/queries/global.queries.ts`, `src/shared/lib/global.lib.ts`, `src/shared/utils/global.utils.ts`, `src/features/Home/Home.tsx`, `src/features/ProductVariantsDrawer/*`, `src/zustand/*`, `DESIGN.md`, `src/app/globals.css`, `next.config.ts`, `package.json`.

---

## Phase 1 — Card, skeleton, grid

### Changes Required

**`src/components/ProductCard.tsx` — Modify**

Imports: drop `Card`; keep `Button, Spinner, toast`; add `RiArrowRightLine, RiPriceTag3Line` from `@remixicon/react`.

Props (near `interface ProductCardProps`):

```ts
interface ProductCardProps {
  product: Product
  handleProductClick: (product: Product) => void
  image?: { src: string; alt: string }   // D5 — presence is the switch
}
```

Derived values (replace `productType`; keep `isSingleVariant`, `minPriceString`, `maxPriceString`, `primaryButtonText` exactly as they are):

- Remove `productType` (the `category / brand` join is gone; category and brand render in separate slots).
- `const [minPriceAmount, minPriceCurrency] = splitCurrency(minPriceString)` where `splitCurrency` is a tiny module-local helper: split on `lastIndexOf(" ")` → `["$350.92", "MXN"]`; for `null` input return `[null, null]`. Keep it in this file (D8: do not touch the formatter).
- `const variantPill = product.variantCount != null ? \`${product.variantCount} variantes\` : null` — `1` → the literal `1 variante` (D2). `0` renders `0 variantes` (do not hide on `0`).

Handlers `handleAddProductLine` and `handleAddSingleVariant`, `ADD_LIMIT_MESSAGE`, `ADD_FAILURE_MESSAGE`, `isAdding`/`addError` state, both store selectors: **unchanged, byte for byte.**

JSX (replace the whole `<Card>…</Card>` return). Structure, top to bottom:

```
<article class="flex h-full flex-col gap-3.5 max-sm:gap-3 rounded-[14px] border border-gray-200 bg-white p-4 max-sm:p-3.5
                transition-[box-shadow,border-color] duration-200 hover:border-gray-300 hover:shadow-[0_8px_24px_rgba(17,24,39,.08)]
                dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:shadow-none">
  {image && <div class="aspect-[4/3] max-sm:aspect-video overflow-hidden rounded-[10px] bg-gray-100 dark:bg-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element -- no Strapi media host / remotePatterns yet (D5) */}
              <img src alt class="size-full object-cover" /></div>}
  <div class="flex flex-1 flex-col gap-2">                       ← text block, flex-1 so footers align
    <div class="flex items-center justify-between gap-2">        ← kicker row; always rendered (keeps pill right on category null)
      {category && <span class="truncate text-[11px] font-medium tracking-[.08em] uppercase text-primary-500 dark:text-primary-100">}
      {variantPill && <span class="max-sm:hidden …pill">}         ← pill hidden <sm here
    </div>
    <h2 class="line-clamp-3 text-[17px] max-sm:text-base font-semibold leading-[1.35] text-gray-900 dark:text-[#EDEDED]">{product.name}</h2>
    <div class="flex flex-wrap items-center gap-1.5">            ← chip row; render only when brand || variantPill
      {brand && <span class="…chip"><RiPriceTag3Line size={12} aria-hidden="true" />{brand.name}</span>}
      {variantPill && <span class="sm:hidden …pill">}            ← pill shown <sm here
    </div>
    {minPriceString && maxPriceString && <div class="mt-auto …price block">}
  </div>
  <div class="flex flex-col gap-2">                              ← actions (unchanged handlers)
</article>
```

Pill class (shared string constant, both breakpoints): `shrink-0 rounded-full bg-gray-100 px-2 py-[3px] text-[11px] text-gray-500 dark:bg-gray-800 dark:text-gray-400`.

Chip class: `inline-flex items-center gap-1 rounded-full border border-gray-200 py-[3px] pr-[9px] pl-[7px] text-[11px] text-gray-700 dark:border-gray-700 dark:text-gray-200` (icon `text-gray-500 dark:text-gray-400`).

Price block (inside the existing `minPriceString && maxPriceString` guard):

- Label `<span class="text-[11px] tracking-[.08em] uppercase text-gray-500 dark:text-gray-400">` — text `Desde` (multi) / `Precio` (single).
- Amount row `<div class="flex items-baseline justify-between gap-2 sm:flex-col sm:items-start sm:gap-0">` containing:
  - `<span>` (label's sibling — the parent of both must be the element that holds the label, so the existing `getByText("Desde").parentElement` → `toHaveTextContent("$0.00 MXN")` still holds): `<span class="text-[21px] max-sm:text-xl font-semibold tracking-[-0.015em] text-gray-900 dark:text-[#EDEDED]">{minPriceAmount}</span> <span class="text-xs text-gray-500 dark:text-gray-400">{minPriceCurrency}</span>` — keep a literal space between the two spans so text content reads `$0.00 MXN`.
  - `{!isSingleVariant && <span class="text-xs text-gray-500 dark:text-gray-400">hasta {maxPriceString}</span>}` — right-aligned beside the price `<sm` (flex row + `justify-between`), own line from `sm` (`sm:flex-col`).
- Wrap label + amount row in one `<div class="flex flex-col gap-0.5">` so `parentElement` semantics are: label's parent = this div (contains the full `$0.00 MXN` and the `hasta` line — fine, `toHaveTextContent` is substring).

Actions:

- Multi-variant:
  - `<Button variant="primary" size="lg" fullWidth className="rounded-[10px]" onPress={() => handleProductClick(product)}>{primaryButtonText}<RiArrowRightLine size={16} aria-hidden="true" /></Button>`
  - `<Button variant="outline" size="lg" fullWidth className="rounded-[10px] font-normal text-primary-700 max-sm:border-0 hover:border-primary-800 hover:bg-primary-800 hover:text-white dark:border-gray-700 dark:text-primary-100" onPress={handleAddProductLine}>Agregar y elegir después</Button>` (D9 + D6). One button, class-switched — never two buttons.
- Single-variant: `<Button variant="primary" size="lg" fullWidth className="rounded-[10px]" isDisabled={isAdding} onPress={handleAddSingleVariant}>{isAdding && <Spinner size="sm" aria-hidden="true" color="current" />}Agregar 1 pieza</Button>` + the existing `{addError && <p role="alert" className="text-sm text-danger">…}` below it.

Edge cases:

- `variantCount` `undefined` → no pill in either row, and `primaryButtonText` is `Ver variantes` (unchanged). The chip row still renders when `brand` exists; if neither brand nor pill, render nothing for that row (avoid an empty `gap` element).
- Hover shadow: `<article>` has no `overflow-hidden`; only the image wrapper does.
- No `Card.Title` anymore → `h2` is the heading (comp + page `h1` hero).
- Do not add `role`/`aria-*` to pill or chip; they are plain text.

**`src/components/ProductCardSkeleton.tsx` — Modify**

Replace the `Card` with `<div className="flex h-full flex-col gap-3.5 rounded-[14px] border border-gray-200 bg-white p-4 max-sm:p-3.5 dark:border-gray-800 dark:bg-gray-900">` and mirror the anatomy with HeroUI `Skeleton`:

- kicker row: `h-3 w-2/5` + `h-5 w-20 rounded-full` (pill), `justify-between`
- name: `h-[23px] w-4/5` (17px × 1.35) and a second `h-[23px] w-3/5` line
- chip: `h-5 w-24 rounded-full`
- price: `h-3 w-12` label, `h-7 w-1/2` amount, `h-3 w-1/3` hasta line
- actions: two `h-11 md:h-10 w-full rounded-[10px]`

No `Card.*` imports remain. Rationale: the skeleton is the `loading.tsx` fallback for the same grid; matching heights is what keeps `/` from shifting (AC5).

**`src/features/ProductListing/ProductListing.tsx` — Modify (line 60)**

`grid grid-cols-1 lg:grid-cols-3 gap-4` → `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] lg:gap-5` (D4).

**`src/app/loading.tsx` — Modify (line 11)**

Same class string as above, verbatim. Rationale: the two grids must match or the skeleton→data swap shifts columns.

**`CLAUDE.md` — Modify (line 155)**

Replace the "Catalog images: Currently commented out; implementation references localhost Strapi URLs…" bullet with: Strapi has no media field; `ProductCard` takes an optional `image?: { src; alt }` prop that nothing passes yet.

**`ai-skills/REPO_CONTEXT.md` — Modify (line 360)**

Update the `ProductCard.tsx` row: outline (not tertiary) secondary CTA, optional `image` prop, plain `<article>` (not HeroUI `Card`).

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint` — must be clean; the only `<img>` is behind the `eslint-disable-next-line @next/next/no-img-element` comment.
- `pnpm build`
- `pnpm test -- __tests__/product-listing/ProductCard.test.tsx` — **expected to fail** on `getByText("Hasta")` (two tests) until Phase 2; every other test in the file must still pass (behavior parity, AC2). Record which tests fail.

**Dev-server validation** (`pnpm dev`, `curl -s http://localhost:3000/…`)
- `GET /` → 200. HTML contains: `<article`, `Explorar las `, `Agregar y elegir después`, ` variantes</span>`, `hasta $`, `Desde`, `MXN</span>`, `lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]`. Must **not** contain `Foto del producto`, `<img`, `Hasta`, `Card`-only classes (`shadow-surface`), or `aspect-[4/3]` (no image passed → no wrapper).
- `GET /?page=2` → 200, same markers (different page, same card).
- `GET /?mode=category&category=<a live category>&page=1` → 200, cards render with the category kicker text uppercase-styled span containing the category name.
- Grep the `/` HTML for `<h2` count ≥ 1 per card (name is a heading).
- Server log: no errors; browser console: no hydration warnings on `/` (open once in a browser — this is the one non-curl check that matters here, because the layout is class-only and must not diverge server/client).

**Manual** (browser, `/`)
- Card rest: no shadow; hover: shadow + gray-300 border. Click `Explorar las N variantes` → drawer opens. Click `Agregar y elegir después` → success toast, `CartCount` increments. One-variant product (`variantCount === 1`): single `Agregar 1 pieza` button, spinner while adding, `1 pieza agregada` toast.
- ~390px: pill sits under the name beside the brand chip (not in the kicker row); `hasta …` is right of the price; secondary button has no border; both buttons 44px tall. ≥ 640px: pill in kicker row, `hasta` on its own line, secondary outlined. ≥ 768px: buttons 40px. 1400px content width: 4 columns.
- Tab to the primary button: green (`#4DF527`) focus ring, unchanged from today (D7).

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/components/ProductCard.tsx` | anatomy order, null category/brand/price guards, pill `0`/`1`/`undefined`, `MXN` split text, image absent | dev-server `curl` of `/` + `tsc` + existing test file (minus `Hasta`) |
| `src/components/ProductCard.tsx` | handlers/toasts/alert unchanged | existing "adds…", "fetches once…", "recoverable alert…", "empty variant result…" tests pass unchanged |
| `src/components/ProductCardSkeleton.tsx` | renders in `loading.tsx` without `Card` | `pnpm build` + throttled reload of `/` (manual) |
| `ProductListing.tsx` / `loading.tsx` | identical grid classes | `grep` both files for the same string; `curl /` shows the class |

---

## Phase 2 — Tests

Run via `/unit-test`. Follow `docs/UNIT_TESTING_GUIDELINES.md` (no class-name assertions, semantic queries, `userEvent` only).

### Changes Required

**`__tests__/product-listing/ProductCard.test.tsx` — Modify**

- "shows zero variant count and zero price range…": replace `screen.getByText("Hasta").parentElement` → `expect(screen.getByText(/^hasta /)).toHaveTextContent("hasta $0.00 MXN")`; keep the `Desde` parent assertion (D8 keeps `"$0.00 MXN"` under one parent). Add `expect(screen.getAllByText("0 variantes")).toHaveLength(2)` — both breakpoint pills exist in the DOM (CSS hides one; jsdom does not apply Tailwind). Add `expect(screen.getByText("Tubes")).toBeInTheDocument()` for the kicker.
- "shows a single price and one CTA…": keep `Precio` assertions; replace `queryByText("Hasta")` → `queryByText(/^hasta /)`; add `getAllByText("1 variante")` length 2.
- "renders when a product relation is missing" (`category: null`, brand Acme): keep `getByText("Acme")`; extend the fixture with `variantCount: 3` and assert `getAllByText("3 variantes")` has length 2 (AC1: null category keeps the pill).
- New: "renders no brand chip when brand is null" — `brand: null`, `category: { name: "Tubes" }`; `queryByText("Acme")` absent, `getByText("Tubes")` present.
- New: "renders no image when the image prop is absent" — `screen.queryByRole("img")` is `null`.
- New: "renders the image with its alt text when the image prop is present" — `render(<ProductCard … image={{ src: "https://example.test/tire.jpg", alt: "Llanta 205/55" }} />)`; `getByRole("img", { name: "Llanta 205/55" })` present, `toHaveAttribute("src", …)`.
- "hides the price block when the price range is missing": also assert `queryByText(/^hasta /)` absent.
- Untouched: "adds…", "fetches once…", "recoverable alert…", "treats an empty variant result…".

No hover/shadow/breakpoint tests (research: "Add nothing for hover/shadow"; styling is not asserted).

### Success Criteria

**Automated**
- `pnpm test -- __tests__/product-listing/ProductCard.test.tsx` — all green, no skips added.
- `pnpm test` — full suite green.
- `pnpm lint`, `pnpm exec tsc --noEmit`.

**Dev-server validation**
- `GET /` → 200 with the same markers as Phase 1 (regression only; this phase changes no runtime code).

**Manual** — none.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `__tests__/product-listing/ProductCard.test.tsx` | AC1 guards (category/brand/price null), pill text, `hasta` line, AC4 image present/absent, AC2 handlers | `pnpm test -- __tests__/product-listing/ProductCard.test.tsx` |

---

## Phase 3 — Dark-mode pass

No planned code change; this phase verifies D6 by eye and fixes only what the comparison against the comp's "Tema oscuro" section reveals. Any fix is a `dark:` class edit inside `ProductCard.tsx` / `ProductCardSkeleton.tsx` — nothing else.

### Changes Required

- None expected. If a dark value is off, correct the `dark:` class to the D6 table value; do not add hexes outside `DESIGN.md` tokens (`#EDEDED` is `foreground-dark`; everything else is a Tailwind gray or `primary-*`).
- `DESIGN.md` and `globals.css` stay untouched (`pnpm design:lint` therefore stays green by construction; run it once anyway as the AC asks).

### Success Criteria

**Automated**
- `pnpm design:lint`
- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` (AC5's full gate) — final run before the PR.

**Dev-server validation**
- `GET /` → 200; HTML contains `dark:bg-gray-900`, `dark:border-gray-800`, `dark:text-primary-100`, `dark:text-[#EDEDED]` (the D6 mapping is in the SSR output — no hydration-time theme branching). Must not contain `dark:text-emerald-400` or `text-emerald-700` (old kicker color).
- `GET /cotizar` → 200 (sanity: nothing on that route imports the card, but the layout is shared).

**Manual** (toggle theme with `ToggleDarkMode`)
- Dark, ~1440px: card `#111827` on the `#0A0A0A` page, `#1F2937` border, `#EDEDED` name and price, `#9CA3AF` secondary text, `#B4FE99` kicker, pill `#1F2937` bg, chip `#374151` border / `#E5E7EB` text, primary button unchanged green, secondary `#374151` border / `#B4FE99` text. Hover: border `#374151`, no shadow.
- Dark, ~390px: same colors; ghost secondary keeps `#B4FE99` text with no border.
- Light, both widths: matches the comp's light card (Phase 1 already verified this; re-check after any Phase 3 edit).
- Skeleton in dark (throttle network, reload `/`): same surface/border as the card, no white flash.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/components/ProductCard.tsx` | D6 dark tokens present in SSR HTML, no old emerald classes | dev-server `curl /` grep |
| `src/components/ProductCard.tsx`, `ProductCardSkeleton.tsx` | visual match to comp "Tema oscuro" | manual, both widths, both themes |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 - Anatomy | Phase 1, 2 | `GET /` 200, contains `<article`, ` variantes</span>`, `Desde`, `hasta $`, `MXN</span>`, `<h2`; no `<img`, no `Hasta`, no `Foto del producto`. Null-guard cases proven by Phase 2 tests. | Not validated | Order/type scale/colors are manual (browser at 1440px) |
| AC2 - Behavior parity | Phase 1, 2 | `GET /` 200 contains `Explorar las ` and `Agregar y elegir después`; the four untouched interaction tests pass in `pnpm test -- __tests__/product-listing/ProductCard.test.tsx` | Not validated | Drawer open + toasts are manual clicks |
| AC3 - Responsive | Phase 1 | `GET /` 200 contains `lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]` and `sm:grid-cols-2`; `grep` shows `loading.tsx` and `ProductListing.tsx` share the string | Cannot validate | Breakpoint layout (pill position, `hasta` placement, 44/40px, 4 columns at 1400px) is manual at ~390 / ~700 / ~1440px |
| AC4 - Image slot | Phase 1, 2 | `GET /` 200 with **no** `<img` and no `aspect-[4/3]`; image-present case proven by the Phase 2 `getByRole("img", { name })` test | Not validated | Nothing on `/` passes the prop this story; presence is unit-tested only |
| AC5 - Dark mode + skeleton | Phase 1, 3 | `GET /` 200 contains `dark:bg-gray-900`, `dark:text-primary-100`, `dark:text-[#EDEDED]`; `pnpm design:lint`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` all pass | Not validated | Visual match to "Tema oscuro" and skeleton no-shift are manual |

## Cross-cutting Concerns

- **Server/client boundary.** `ProductCard.tsx` stays `"use client"` (hooks, `toast`, `onPress`). `ProductCardSkeleton.tsx` has no hooks and is rendered from `loading.tsx` (server) — keep it directive-free. The `<article>` swap does not change the boundary.
- **Responsive = classes only.** `max-sm:` / `sm:` / `md:` / `lg:` variants; the pill is rendered twice (one per breakpoint, CSS-hidden) rather than chosen at runtime. Tests must expect two pill nodes.
- **Dark mode.** `dark:` variant via `@custom-variant dark (&:is(.dark *))`; do not rely on HeroUI's `--accent-soft-foreground` (remapped to `#4DF527` in dark, comp wants `primary-100`).
- **Lint.** `@next/next/no-img-element` is disabled on exactly one line with a reason; no other `<img>` may be added.
- **Strapi.** No query/type changes. `STRAPI_HOST`/`STRAPI_API_TOKEN` needed for the dev-server checks to return cards.

## Open Questions / Out of Scope

**Unresolved:** none. Dark hover / dark secondary hover follow the D6 assumptions and are confirmed by eye in Phase 3.

**Deliberately excluded**
- Product images from Strapi, `next/image`, `remotePatterns`, `Product` type/query changes (D5 follow-up story).
- "Tres variantes propuestas" (A/B/C), hero/filters/drawer restyling, app-wide dark-surface alignment (Theme II: card-only).
- The 1.8s `Agregado al carrito` label swap (D11), analytics events, `Explorar N variantes` copy (D10 keeps `las`).
- Removing `hasOneProductVariant` from the type (still queried; not this story).
- Any change to `formatNumberToCurrency` (shared with `/cotizar` and WhatsApp).
