# Product Card Images — Research

**Date:** 2026-09-20
**Branch:** `feat/add-images`
**Scope:** standalone story (single deliverable, 2-3 phases)
**Builds on:** `ai-research/product-card-redesign.story.md` (D5 — the optional `image` prop slot that shipped
image-less), `ai-research/homepage-redesign.story.md` (D2 — card image slot off).
**Design source:** Claude Design project "Tehesa UI mocks v1", file `PLP.dc.html`
(https://claude.ai/design/p/4b99241e-42ab-4ca4-ac4e-c1cd49a75385?file=PLP.dc.html), read via the design MCP on
2026-09-20. **In scope from the comp:** the card's image block (`showImages=true` grid card, lines 63-66), the
"Adaptación responsiva" and "Tema oscuro" card image wrappers, and the **"Estado sin imagen"** section (lines 553-731:
desktop 314px / tablet 352px / mobile 343px, light + dark). **Out of scope:** everything else on the page — hero,
filter row, drawer, spec tables, and the `image-slot.js` / `support.js` runtime chrome (drag-to-fill, "Drop an
image", dashed *ring*), which is tooling, not design.

## Story Definition

### Title

Render Strapi product images in `ProductCard`, with a placeholder when a product has none.

### Description

Strapi's `Product` content-type now carries `imageUrl` — a plain, optional string holding an absolute Cloudinary URL
(added to the backend 2026-09-20; see Strapi contract I). About **130 of 333 products** have one; the rest are
`null`. `ProductCard` already has an unused `image?: { src; alt }` prop that renders a plain `<img>` block only when
supplied (D5). This story wires the real data into that slot on every list surface, and — because most grids will mix
imaged and image-less products for a while — reserves the slot with a placeholder when `imageUrl` is null, so rows
stay aligned.

### Acceptance criteria

1. **Data.** `Product` gains `imageUrl?: string | null`, and every product-list query that feeds a card selects it:
   `GET_PRODUCTS`, `GET_PRODUCTS_BY_CATEGORY`, `GET_PRODUCTS_BY_BRAND`, `GET_PRODUCTS_BY_NAME`, `GET_ALL_PRODUCTS`.
   `GET_PRODUCTS_BY_IDS` (quote revalidation) and the variant queries do not change. The `/api/catalog/*` routes are
   pass-through and need no edit.
2. **Image present.** A product with a non-empty `imageUrl` renders the existing image block (4/3 at `sm`+, 16/9
   below, `rounded-[10px] bg-gray-100 dark:bg-gray-800`, `object-cover`) as a plain `<img>` with
   `alt={product.name}`, `loading="lazy"`, `decoding="async"`. No `next/image`, no `next.config.ts` change.
3. **Image absent.** A product with `imageUrl` null/empty renders the comp's **"Estado sin imagen"** block at the
   same aspect ratio and radius: `bg-gray-50 border border-dashed border-gray-200` (dark: `bg-gray-800
   border-gray-700`), a centered 30px line-style image icon in `text-gray-400` (dark `text-gray-500`), `aria-hidden`,
   and the caption `Imagen no disponible` at 11px in `text-gray-500` (dark `text-gray-400`), 8px gap. The block is
   never omitted — `ProductCard` no longer takes an `image` prop; it derives everything from `product.imageUrl`.
4. **Loading state.** `ProductCardSkeleton` gains a matching aspect-ratio `Skeleton` block above the kicker so the
   loading grid has the same vertical rhythm as the loaded grid.
5. **SEO.** `buildProductListItem` in `src/shared/utils/seo.utils.ts` adds `image: product.imageUrl` to the `Product`
   node only when `imageUrl` is present (omitted otherwise, same pattern as `brand`).
6. **Tests.** `__tests__/product-listing/ProductCard.test.tsx` swaps the two image-prop cases for `imageUrl`
   present → `img` with the product name as accessible name, no caption / absent → no `img`, `Imagen no disponible`
   caption present.
   `__tests__/seo/seo.utils.test.ts` covers `image` present/omitted. Existing tests keep passing.

### Task breakdown

- **Phase 1 — contract:** `Product` type + the five list queries. Verify with `pnpm exec tsc --noEmit`.
- **Phase 2 — card + skeleton:** replace the `image` prop with `product.imageUrl` branching; placeholder; `loading`/
  `decoding` attributes; skeleton block; update the `eslint-disable` comment reason. Verify with `pnpm lint` and the
  targeted tests.
- **Phase 3 — SEO + docs:** JSON-LD `image`; refresh the stale "no media field" notes in `ai-skills/REPO_CONTEXT.md`
  (lines 168, 236, 306, 327, 383) and `docs/improvement.md:53`.

## Design Reference (from the comp)

No external design agent pass is needed: `PLP.dc.html` already draws both card states at every breakpoint and theme.
This section is the extract; the comp is the source of truth if they ever disagree.

**User goal.** A buyer scanning the catalog recognizes a product by its photo where one exists and still gets an
evenly laid-out grid where one does not. This is **not** a gallery, lightbox, zoom, carousel, or detail page — one
image per card, no interaction on the image.

### Image block — photo present

| Breakpoint | Aspect | Card padding / gap | Wrapper |
| --- | --- | --- | --- |
| Mobile `<600` (comp) → `max-sm` in code | 16/9 | 14px / 12px | `rounded-[10px] overflow-hidden bg-gray-100 dark:bg-gray-800` |
| Tablet `600–1023` → `sm`+ | 4/3 | 16px / 14px | same |
| Desktop `≥1024` → `lg`+ | 4/3 | 16px / 14px | same |

Comp wrapper: `position:relative; aspect-ratio:4/3 (16/9 mobile); border-radius:10px; overflow:hidden; background:#F3F4F6`
(dark `#1F2937`). The `image-slot` inside defaults to `fit="cover"` → `object-cover` in code. Both match what
`ProductCard.tsx` already renders for the `image` prop; **no change to the present-state markup beyond the source
of `src`/`alt`**.

### Image block — "Estado sin imagen" (comp lines 553-731)

Comp copy: *"El hueco conserva la misma proporción y radio que la foto, para que la rejilla no se desalinee. Dentro va
un ícono de imagen en trazo y la leyenda "Imagen no disponible": el borde punteado y el fondo un paso más claro que la
tarjeta dejan claro que falta contenido y no que la imagen se rompió. Nada de logotipo ni de ilustración de producto,
que se leerían como una foto real."*

| Role | Light (hex → token) | Dark (hex → token) |
| --- | --- | --- |
| Ground | `#F9FAFB` → `bg-gray-50` | `#1F2937` → `dark:bg-gray-800` |
| Border | `1px dashed #E5E7EB` → `border border-dashed border-gray-200` | `#374151` → `dark:border-gray-700` |
| Icon stroke | `#9CA3AF` → `text-gray-400` | `#6B7280` → `dark:text-gray-500` |
| Caption | `#6B7280` → `text-gray-500` | `#9CA3AF` → `dark:text-gray-400` |

- Layout: `flex flex-col items-center justify-center gap-2`; same `aspect-[4/3] max-sm:aspect-video rounded-[10px]`
  as the photo state. Same at 314 / 352 / 343px card widths — the comp shows no per-breakpoint change other than
  the aspect ratio.
- Icon: 30×30, stroke-only picture glyph (rounded rect + circle + two mountain paths; comp SVG on line 568). Nearest
  installed equivalent: `RiImageLine` from `@remixicon/react` at `size={30}`. Use it rather than pasting the comp
  SVG — every other icon on the card is Remix.
- Caption: `Imagen no disponible`, 11px / 400. Plain `<span>`, not `aria-hidden` (it is real, if low-value, text).
- Note the ground differs between states on purpose: photo ground is `gray-100`, placeholder ground is `gray-50`
  ("un paso más claro que la tarjeta"). In dark both are `gray-800`.

### Rules that override design instinct

- **The placeholder is exactly the comp's.** No logo, no category illustration, no "Foto próximamente", no spinner,
  no shimmer — and no dashed *ring* from `image-slot.js` (that is the runtime's drop-target, not the design).
- **Never present the price as an amount to pay** — `Desde $X MXN` (+ `hasta $Y MXN`) is unchanged.
- **Do not invent data.** No badges over the image (stock, "nuevo", discount), no image count, no zoom affordance.
- **Nothing outside the image block changes.** Kicker, pill, title, chip, price, buttons, hover, skeleton rows below
  the image, grid columns — all stay as shipped by the redesign story.

### Implementation-facing constraints

**Responsive.** Class-only (`max-sm:aspect-video` vs `aspect-[4/3]`), no `useMediaQuery` (`REPO_CONTEXT.md` hook
gotcha). The comp's 600px mobile/tablet boundary maps to the code's existing `sm` (640px) split — the redesign story
already made that call; do not introduce a new breakpoint.

**Accessibility.** Photo: `alt={product.name}` (the only alt source the contract offers; no `alternativeText`
field). Placeholder: icon `aria-hidden="true"`, caption is visible text and is read as-is. No `title` attributes, no
`role` on the wrapper.

**Visual patterns to preserve.** All hexes above are `DESIGN.md` tokens (`gray-50/200/400/500/700/800`, lines 25-33).
Run `pnpm design:lint` after styling. `overflow-hidden` only on the photo wrapper.

**Content.** Cloudinary URLs are absolute and already `.webp`; the frontend does not transform them. Cloudinary URL
transforms (`/upload/w_600,f_auto,q_auto/`) are available later without a frontend dependency — out of scope.

**Out of scope.** `next/image` / `remotePatterns`; image in `ProductVariantsDrawer`; image in `/cotizar` line rows;
OG/Twitter share images; an `onError` broken-image fallback (UI/product II); backend `imageUrl` coverage (mapping
script lives in the backend repo); any other part of `PLP.dc.html`.

### Decision record

- **D1 — Placeholder vs. hidden block.** *Decided (user, 2026-09-20):* reserve the slot with a placeholder when
  `imageUrl` is null. Rationale: ~60% of products have no image today, so nearly every grid row mixes both states;
  hiding the block (redesign D5, chosen when *no* product had an image) puts kicker/title/price at different heights
  across a row. Supersedes redesign D5's "no placeholder" rule. Rejected: placeholder on desktop only.
- **D2 — Renderer.** *Decided (user, 2026-09-20):* keep the plain `<img>` (D5) and add `loading="lazy"` +
  `decoding="async"`. Rejected: `next/image` + `remotePatterns` — more config, an image-optimizer dependency for a
  catalog of ≤333 already-WebP assets, no measured need.
- **D3 — Prop → data.** *Assumed:* drop the `image?: { src; alt }` prop and read `product.imageUrl` directly. The
  prop existed only because no data existed (D5: "the follow-up story maps `product.image.url` → this prop").
- **D4 — Placeholder design.** *Decided (user, 2026-09-20):* use the comp's "Estado sin imagen" state verbatim
  (dashed border, `gray-50` ground, icon + `Imagen no disponible` caption) — supersedes the earlier "icon only, no
  text" assumption. Icon glyph: `RiImageLine` as the Remix equivalent of the comp's stroke SVG.
- **D5 — JSON-LD.** *Decided (user, 2026-09-20):* add `image` to the `Product` node when present. One conditional
  field on an existing builder; no visual expression.
- **D6 — Photo fit.** *From comp:* `image-slot` default `fit="cover"` → keep `object-cover` as shipped.

## Technical Research

### Affected areas

| Area | File | Change |
| --- | --- | --- |
| Types | `src/shared/types/global.types.ts` (`Product`) | add `imageUrl?: string \| null` |
| Queries | `src/shared/queries/global.queries.ts` | add `imageUrl` to `GET_PRODUCTS`, `GET_PRODUCTS_BY_CATEGORY`, `GET_PRODUCTS_BY_BRAND`, `GET_PRODUCTS_BY_NAME`, `GET_ALL_PRODUCTS` |
| Card | `src/components/ProductCard.tsx` | remove `image` prop; branch on `product.imageUrl`; placeholder; `loading`/`decoding`; update eslint-disable reason |
| Skeleton | `src/components/ProductCardSkeleton.tsx` | add aspect-ratio `Skeleton` block |
| SEO | `src/shared/utils/seo.utils.ts` (`buildProductListItem`) | conditional `image` |
| Tests | `__tests__/product-listing/ProductCard.test.tsx`, `__tests__/seo/seo.utils.test.ts` | per AC6 |
| Docs | `ai-skills/REPO_CONTEXT.md`, `docs/improvement.md` | retire "no media field" notes |

Not touched: `src/shared/lib/global.lib.ts` (server actions return whatever the query selects), `src/app/api/catalog/**`
(pass-through), `ProductListing.tsx`, `CategoryPage`, `BrandPage`, `next.config.ts`, `package.json`.

### Existing patterns to follow

- Query fields are selected per-query, not via fragments — add `imageUrl` to each list query by hand, matching how
  `subcategory` was added to `GET_ALL_PRODUCTS` (Tornillería story).
- Conditional JSON-LD fields use `undefined` to drop the key (`brand`, `category`, `offers` in `seo.utils.ts:120-128`).
- Card conditionals are inline JSX (`product.category && …`); the image branch is a ternary inside the existing
  wrapper `div`, not a new component.
- `@next/next/no-img-element` is a warning under `next/core-web-vitals`; keep the one-line `eslint-disable-next-line`
  and change the reason from "no host known" to "D2: plain `<img>`, Cloudinary already serves sized WebP".
- Tests: `__tests__/product-listing/ProductCard.test.tsx` already uses `screen.queryByRole("img")` /
  `getByRole("img", { name })` — reuse. The placeholder is asserted through its visible caption
  (`getByText("Imagen no disponible")`); the icon is `aria-hidden` and needs no assertion of its own.

### Verification rules

- `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test -- __tests__/product-listing/ProductCard.test.tsx`,
  `pnpm test -- __tests__/seo/seo.utils.test.ts`, then `pnpm build`.
- Manual (per `feedback_no-dev-server` memory the implementer starts `pnpm dev` and curl-checks; clicks/layout stay
  manual): `/` page 1 should show a mix of real images and placeholders; `/categorias/tornilleria` and a brand page
  likewise; `/cotizar` unaffected.

### Dependencies / integration points

- No new dependencies. `@remixicon/react` (icon) and Tailwind `aspect-*` utilities are already in use.
- Cloudinary host `res.cloudinary.com` is the only external image origin. No CSP is configured in `next.config.ts`
  today, so nothing blocks it.
- Backend: `imageUrl` is populated by `scripts/set-product-images.js` from `data/product-images.json` in
  `store-tehesa-api`. Coverage grows only when that script is re-run — the frontend has no lever.

### Edge cases and constraints

- `imageUrl` may be `null`, `undefined` (older cached responses), or `""`. Treat all three as "no image" — one
  truthiness check, not `!= null`.
- A URL that 404s renders the browser's broken-image glyph on the gray ground. Not handled in this story (UI/product
  II); the card's `bg-gray-100` ground keeps it from looking like a hole.
- Product names are long (`line-clamp-3` on the title); as `alt` they are fine — screen readers read the full name
  once for the image and once for the heading. Acceptable duplication; an empty `alt=""` would make the photo
  decorative, which it is not.
- Adding a block to every card grows the page height by one image row per grid row. The `lg` auto-fill grid stays at
  4 columns at 1400px; nothing else about layout changes.
- The homepage brand strip, filter row, drawer and pagination are untouched; the search working set behaves the same
  since `imageUrl` is not searched.

## Open Questions

### Strapi contract

- I: Question: Does any content type carry an image field the card can bind to, and what shape is it?
  Status: answered
  Answer: `Product.imageUrl` — `string`, not required, added in backend commit `837d827` (2026-09-20). Selected in
  GraphQL as the scalar `imageUrl`. `ProductVariant`, `Category`, `Brand` have none. It is **not** a Strapi media
  field: no `formats`, `alternativeText`, `width`/`height`; no upload provider is configured.
  Context: backend-research subagent — `store-tehesa-api/src/api/product/content-types/product/schema.json:24-26`;
  values are absolute Cloudinary URLs (`https://res.cloudinary.com/<cloud>/image/upload/v…/….webp`) written by
  `scripts/set-product-images.js` from `data/product-images.json` (130 entries). No lifecycle default/placeholder
  logic exists in the backend.
- II: Question: How many products have an image?
  Status: answered
  Answer: 130 mapped in `data/product-images.json` vs. 333 products total (`REPO_CONTEXT.md` count) — ~39%. Not
  verified live (backend not reachable from the subagent's environment); the mapping file is the source.

### UI/product decisions

- I: Question: Placeholder or hide the block when `imageUrl` is null?
  Status: answered
  Answer: placeholder — see D1.
- II: Question: Should a failed image load (`onerror`) fall back to the placeholder instead of the browser's
  broken-image glyph?
  Status: pending
  Context: Costs a `useState` per card and an `onError` handler. Cloudinary URLs are stable once written, so
  breakage is unlikely; recommend deferring until observed.
- III: Question: `alt` source — product name, or empty (decorative)?
  Status: answered
  Answer: product name (the contract has no `alternativeText`). See Accessibility.
- IV: Question: Keep the `image` prop for the design/Storybook-style use, or remove it?
  Status: answered
  Answer: remove — see D3.

### Verification

- I: Question: How to assert the placeholder in tests?
  Status: answered
  Answer: `screen.getByText("Imagen no disponible")` — the comp's caption is visible text, so no `data-testid` or
  `querySelector` is needed. Absent-image case: `queryByRole("img")` is null **and** the caption is present; present
  case: `getByRole("img", { name: product.name })` and no caption.
