# Product Card Images — Research

**Date:** 2026-09-20
**Branch:** `feat/add-images`
**Scope:** standalone story (single deliverable, 2-3 phases)
**Builds on:** `ai-research/product-card-redesign.story.md` (D5 — the optional `image` prop slot that shipped
image-less), `ai-research/homepage-redesign.story.md` (D2 — card image slot off).

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
3. **Image absent.** A product with `imageUrl` null/empty renders the **same block dimensions** with a placeholder:
   the same gray ground and a single centered `RiImageLine` icon (`@remixicon/react`, already installed), `aria-hidden`,
   no text. The block is never omitted — `ProductCard` no longer takes an `image` prop; it derives everything from
   `product.imageUrl`.
4. **Loading state.** `ProductCardSkeleton` gains a matching aspect-ratio `Skeleton` block above the kicker so the
   loading grid has the same vertical rhythm as the loaded grid.
5. **SEO.** `buildProductListItem` in `src/shared/utils/seo.utils.ts` adds `image: product.imageUrl` to the `Product`
   node only when `imageUrl` is present (omitted otherwise, same pattern as `brand`).
6. **Tests.** `__tests__/product-listing/ProductCard.test.tsx` swaps the two image-prop cases for `imageUrl`
   present → `img` with the product name as accessible name / absent → no `img`, placeholder icon present.
   `__tests__/seo/seo.utils.test.ts` covers `image` present/omitted. Existing tests keep passing.

### Task breakdown

- **Phase 1 — contract:** `Product` type + the five list queries. Verify with `pnpm exec tsc --noEmit`.
- **Phase 2 — card + skeleton:** replace the `image` prop with `product.imageUrl` branching; placeholder; `loading`/
  `decoding` attributes; skeleton block; update the `eslint-disable` comment reason. Verify with `pnpm lint` and the
  targeted tests.
- **Phase 3 — SEO + docs:** JSON-LD `image`; refresh the stale "no media field" notes in `ai-skills/REPO_CONTEXT.md`
  (lines 168, 236, 306, 327, 383) and `docs/improvement.md:53`.

## Design Agent Handoff

**User goal.** A buyer scanning the catalog should recognize a product by its photo where one exists, and still get an
evenly laid-out grid where one does not. This is **not** a gallery, a lightbox, a zoom, a multi-image carousel, or a
product detail page — one image per card, no interaction on the image.

### Surface index

| Surface | File | States | Story | Brief |
| --- | --- | --- | --- | --- |
| Product card, image present | `src/components/ProductCard.tsx` | rest / hover / dark | this | Brief 1 |
| Product card, placeholder | `src/components/ProductCard.tsx` | rest / hover / dark | this | Brief 1 |
| Mixed grid (imaged + placeholder side by side) | `src/features/ProductListing/ProductListing.tsx` | 1 / 2 / auto-fill columns, light + dark | this | Brief 1 |
| Card skeleton | `src/components/ProductCardSkeleton.tsx` | loading | this | derived from Brief 1 (no separate brief) |

### Rules that override design instinct

- **The placeholder is quiet.** Gray ground + one icon. No "Sin imagen" / "Foto próximamente" text, no dashed border,
  no brand logo, no category illustration. It exists to hold the space, not to draw the eye.
- **Never present the price as an amount to pay** — `Desde $X MXN` (+ `hasta $Y MXN`) is unchanged (redesign story
  rule).
- **Do not invent data.** No badges over the image (stock, "nuevo", discount), no image count, no zoom affordance.
- **Copy is unchanged.** Every existing string on the card stays as-is.

### Implementation-facing constraints

**Responsive.** The block is `aspect-[4/3]` at `sm`+ and `aspect-video` below `sm`, exactly as D5 shipped. Grid
columns (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]`) do not change. No
`useMediaQuery` (`REPO_CONTEXT.md` hook gotcha) — class-only.

**Accessibility.** Real image: `alt={product.name}` (the only alt source the contract offers; no `alternativeText`
field exists). Placeholder: the icon is `aria-hidden="true"` and the wrapper has no role — a missing photo is not
information a screen-reader user needs announced per card. No `title` attributes.

**Visual patterns to preserve.** Image ground `gray-100` / `dark:gray-800` (`DESIGN.md:26`), radius `10px` inside the
`14px` card, `overflow-hidden` only on the image wrapper (redesign story). Placeholder icon color: `text-gray-400`
light / `dark:text-gray-600` (low contrast is intentional — decorative). Run `pnpm design:lint` after styling.

**Content.** Cloudinary URLs are absolute and already `.webp`; the frontend does not transform them. If sizing is
ever needed, Cloudinary's URL transforms (`/upload/w_600,f_auto,q_auto/`) are available without a frontend dependency
— out of scope here.

**Out of scope.** `next/image` / `remotePatterns`; image in `ProductVariantsDrawer`; image in the `/cotizar` line
rows; OG/Twitter share images; a `onError` broken-image fallback (see UI/product II); backend `imageUrl` coverage
(the mapping script lives in the backend repo).

### Decision record

- **D1 — Placeholder vs. hidden block.** *Decided (user, 2026-09-20):* reserve the slot with a placeholder when
  `imageUrl` is null. Rationale: ~60% of products have no image today, so nearly every grid row mixes both states;
  hiding the block (the D5 default from the redesign story, chosen when *no* product had an image) puts kicker/title/
  price at different heights across a row. Supersedes redesign D5's "no placeholder" rule — that rule targeted the
  all-image-less catalog, which no longer exists. Rejected: placeholder on desktop only (two behaviors for one
  state; the mobile single column would still shift when scrolling between imaged and image-less cards).
- **D2 — Renderer.** *Decided (user, 2026-09-20):* keep the plain `<img>` (D5) and add `loading="lazy"` +
  `decoding="async"`. Rejected: `next/image` + `remotePatterns` — more config, an image-optimizer dependency for a
  catalog of ≤333 already-WebP assets, and a deviation from D5 with no measured need.
- **D3 — Prop → data.** *Assumed:* drop the `image?: { src; alt }` prop and read `product.imageUrl` directly. The prop
  existed only because no data existed (D5: "the follow-up story maps `product.image.url` → this prop"); now that the
  data is on `Product`, a prop that every caller would fill the same way is indirection. `ProductListing` and the
  category/brand pages need no change beyond the query fields.
- **D4 — Placeholder icon.** *Assumed:* `RiImageLine` at 24px, centered. Any single neutral glyph from the installed
  `@remixicon/react` set is acceptable; the brief lets the design agent propose the glyph but not add text.
- **D5 — JSON-LD.** *Decided (user, 2026-09-20):* add `image` to the `Product` node when present. In scope because it
  is one conditional field on an existing builder.

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
  `getByRole("img", { name })` — reuse. The placeholder icon is `aria-hidden`, so assert its absence/presence via a
  `data-testid` on the placeholder wrapper or by `container.querySelector("svg")` — follow
  `docs/UNIT_TESTING_GUIDELINES.md` on which is sanctioned.

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

- I: Question: Is `container.querySelector` / `data-testid` sanctioned for asserting an `aria-hidden` placeholder icon?
  Status: pending
  Context: `docs/UNIT_TESTING_GUIDELINES.md` governs; the planner should pick the compliant assertion. Alternative:
  assert the *absence* of `img` only, and leave the placeholder untested (it is markup with no logic).
