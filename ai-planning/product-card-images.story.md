# Plan: Product Card Images

**Source research:** `ai-research/product-card-images.story.md` (2026-09-20, branch `feat/add-images`).
**Sign-off status:** no explicit sign-off line; every open question (Strapi I–II, UI/product I–IV, Verification I) is `answered` and D1–D7 are recorded as decided with the user on 2026-09-20. Treated as signed off — same basis as `ai-planning/product-card-redesign.story.md`. **Confirm before `/implement`.**
**Plan date:** 2026-09-20.

## Assumptions

- **Broken-image test uses `fireEvent.error`.** `docs/UNIT_TESTING_GUIDELINES.md` bans `fireEvent` for *interactions* ("replace it with the equivalent `userEvent` action"). An `<img>` load failure is not a user interaction and `userEvent` has no equivalent, so the one AC6 `error` case imports `fireEvent` from `@__tests__/test-utils` (already re-exported) with a one-line comment saying why. No guideline edit; this is a single documented exception, not a new pattern.
- **`imageUrl` truthiness** (`!product.imageUrl || imageFailed`) is the only "no image" check — covers `null`, `undefined`, `""` per the research edge-case note.
- **Skeleton block mirrors the photo wrapper classes** (`aspect-[4/3] max-sm:aspect-video rounded-[10px]`) — the research says "matching aspect-ratio", nothing more; no extra height/width constants.
- Env: `.env.local` has `STRAPI_HOST` / `STRAPI_API_TOKEN`; dev-server checks assume `pnpm dev` on `http://localhost:3000`. Backend has ~130/333 products with `imageUrl`, so page 1 of `/` is expected to show both states; if page 1 happens to be all one state, check `?page=2`.
- D1–D7 are taken as decided; no re-litigation.

## Acceptance Criteria

1. **Data.** `Product` gains `imageUrl?: string | null`, and every product-list query that feeds a card selects it: `GET_PRODUCTS`, `GET_PRODUCTS_BY_CATEGORY`, `GET_PRODUCTS_BY_BRAND`, `GET_PRODUCTS_BY_NAME`, `GET_ALL_PRODUCTS`. `GET_PRODUCTS_BY_IDS` (quote revalidation) and the variant queries do not change. The `/api/catalog/*` routes are pass-through and need no edit.
2. **Image present.** A product with a non-empty `imageUrl` renders the existing image block (4/3 at `sm`+, 16/9 below, `rounded-[10px] bg-gray-100 dark:bg-gray-800`, `object-cover`) as a plain `<img>` with `alt={product.name}`, `loading="lazy"`, `decoding="async"`. No `next/image`, no `next.config.ts` change.
3. **Image absent or failed.** A product with `imageUrl` null/empty — or whose `<img>` fires `onError` — renders the comp's **"Estado sin imagen"** block at the same aspect ratio and radius: `bg-gray-50 border border-dashed border-gray-200` (dark: `bg-gray-800 border-gray-700`), a centered 30px line-style image icon in `text-gray-400` (dark `text-gray-500`), `aria-hidden`, and the caption `Imagen no disponible` at 11px in `text-gray-500` (dark `text-gray-400`), 8px gap. The block is never omitted — `ProductCard` no longer takes an `image` prop; it derives everything from `product.imageUrl`.
4. **Loading state.** `ProductCardSkeleton` gains a matching aspect-ratio `Skeleton` block above the kicker so the loading grid has the same vertical rhythm as the loaded grid.
5. **SEO.** `buildProductListItem` in `src/shared/utils/seo.utils.ts` adds `image: product.imageUrl` to the `Product` node only when `imageUrl` is present (omitted otherwise, same pattern as `brand`).
6. **Tests.** `__tests__/product-listing/ProductCard.test.tsx` swaps the two image-prop cases for `imageUrl` present → `img` with the product name as accessible name, no caption / absent → no `img`, `Imagen no disponible` caption present / present but `error` fired → caption present, no `img`. `__tests__/seo/seo.utils.test.ts` covers `image` present/omitted. Existing tests keep passing.

## Affected Files

**`src/shared/`**
- `types/global.types.ts` — Modify: `Product` type (line 24–35), add one field.
- `queries/global.queries.ts` — Modify: five list queries, add `imageUrl` scalar to each selection set.
- `utils/seo.utils.ts` — Modify: `buildProductListItem` (line ~117), one conditional field.

**`src/components/`**
- `ProductCard.tsx` — Modify: `ProductCardProps` (drop `image`), one `useState`, image block JSX (lines 125–134), icon import.
- `ProductCardSkeleton.tsx` — Modify: one `Skeleton` line above the kicker row.

**`__tests__/`**
- `product-listing/ProductCard.test.tsx` — Modify: replace the two image-prop cases (lines 110–142) with three `imageUrl` cases.
- `seo/seo.utils.test.ts` — Modify: `ProductJsonLd` test type gains `image?: string`; two new cases in `buildCatalogJsonLd`.

**Docs**
- `ai-skills/REPO_CONTEXT.md` — Modify: lines 168–169, 307, 328, 384 (stale "no media field" / "unused image prop" notes).
- `docs/improvement.md` — Modify: line 53 ("products still have no image field").

Not touched: `src/shared/lib/global.lib.ts`, `src/app/api/catalog/**`, `ProductListing.tsx`, `CategoryPage`, `BrandPage`, `next.config.ts`, `package.json`, `DESIGN.md`.

---

## Phase 1 — Contract: type + list queries

### Changes Required

**`src/shared/types/global.types.ts`** — Modify `Product` (near `subcategory?: string | null`):

```ts
imageUrl?: string | null
```

Optional because `GET_PRODUCTS_BY_IDS` and older cached responses omit it (research edge case).

**`src/shared/queries/global.queries.ts`** — Modify. Add the scalar `imageUrl` to the selection set of exactly these five queries, next to `documentId`:

- `GET_PRODUCTS` (line 3)
- `GET_PRODUCTS_BY_CATEGORY` (line 37)
- `GET_PRODUCTS_BY_BRAND` (line 59)
- `GET_PRODUCTS_BY_NAME` (line 81)
- `GET_ALL_PRODUCTS` (line 166, inside `nodes { … }`)

Leave `GET_PRODUCT_VARIANTS`, `GET_VARIANTS_BY_IDS`, `GET_PRODUCTS_BY_IDS`, `GET_CATEGORIES`, `GET_BRANDS` untouched. No fragments — match the per-query style (`subcategory` in `GET_ALL_PRODUCTS` is the precedent).

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit` passes.

**Dev-server validation** (`pnpm dev`)
- `GET /api/catalog/products?page=1` → 200, `{ success: true, data: [...] }`; every item has an `imageUrl` key; at least one item's value starts with `https://res.cloudinary.com/` and at least one is `null` (if page 1 is uniform, try `page=2`).
- `GET /api/catalog/products?mode=category&category=<any category name from /api/catalog/categories>&page=1` → 200, items carry `imageUrl`.
- `GET /api/catalog/products?mode=brand&brand=Bohrcraft&page=1` → 200, items carry `imageUrl`.
- `GET /api/catalog/products?mode=name&q=broca&page=1` → 200, items carry `imageUrl`.
- `GET /categorias/tornilleria` → 200 (exercises `GET_ALL_PRODUCTS`; no `CAT_ERR_*`, no GraphQL validation error in the server log — a typo in the field name shows here as a 500/error page).
- Server log: no `Cannot query field "imageUrl"` or other GraphQL errors.

**Manual** — none.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/shared/types/global.types.ts` | `imageUrl` optional nullable on `Product` | `pnpm exec tsc --noEmit` |
| `src/shared/queries/global.queries.ts` | five list queries select `imageUrl`; others unchanged | dev-server `curl` of the four `/api/catalog/products` modes + `/categorias/tornilleria` |

---

## Phase 2 — Card + skeleton + card tests

### Changes Required

**`src/components/ProductCard.tsx`** — Modify.

- Imports: add `RiImageLine` to the existing `@remixicon/react` import.
- `ProductCardProps`: delete `image?: { src: string; alt: string }`; remove `image` from the destructured params.
- State (next to `addError`): `const [imageFailed, setImageFailed] = useState(false)`.
- Image block (replace lines 125–134). Always rendered; ternary on `product.imageUrl && !imageFailed`:

```tsx
{product.imageUrl && !imageFailed ? (
  <div className="aspect-[4/3] overflow-hidden rounded-[10px] bg-gray-100 max-sm:aspect-video dark:bg-gray-800">
    {/* eslint-disable-next-line @next/next/no-img-element -- D2: plain <img>, Cloudinary already serves sized WebP */}
    <img
      src={product.imageUrl}
      alt={product.name}
      loading="lazy"
      decoding="async"
      onError={() => setImageFailed(true)}
      className="size-full object-cover"
    />
  </div>
) : (
  <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-gray-200 bg-gray-50 max-sm:aspect-video dark:border-gray-700 dark:bg-gray-800">
    <RiImageLine size={30} aria-hidden="true" className="text-gray-400 dark:text-gray-500" />
    <span className="text-[11px] text-gray-500 dark:text-gray-400">Imagen no disponible</span>
  </div>
)}
```

Edge cases: the ternary's truthiness check is the single null/`undefined`/`""` guard. `overflow-hidden` only on the photo wrapper (research rule). No `role`/`title` on either wrapper. The placeholder caption is a plain `<span>` (not `aria-hidden`). Everything below the image block is untouched.

**`src/components/ProductCardSkeleton.tsx`** — Modify. Insert as the first child of the shell `<div>` (above the kicker row):

```tsx
<Skeleton className="aspect-[4/3] w-full rounded-[10px] max-sm:aspect-video" />
```

**`__tests__/product-listing/ProductCard.test.tsx`** — Modify. Replace the two cases at lines 110–142 with three:

1. `renders the image with the product name as alt when imageUrl is set` — product with `imageUrl: "https://example.test/tire.jpg"`; `getByRole("img", { name: product.name })` has `src` equal to the URL; `queryByText("Imagen no disponible")` is null.
2. `renders the placeholder when imageUrl is null` — product with `imageUrl: null`; `queryByRole("img")` is null; `getByText("Imagen no disponible")` is present. (One product with `imageUrl` omitted entirely is covered implicitly by every other existing case in the file — they all omit it and must still pass.)
3. `falls back to the placeholder when the image fails to load` — same product as (1); `fireEvent.error(screen.getByRole("img"))` (comment: load failure is not a user interaction; `userEvent` has no equivalent); then `queryByRole("img")` is null and the caption is present.

Import `fireEvent` from `@__tests__/test-utils` (it re-exports `@testing-library/react`). No class-name assertions (`docs/UNIT_TESTING_GUIDELINES.md`).

### Success Criteria

**Automated**
- `pnpm lint` passes (the `eslint-disable-next-line` keeps `@next/next/no-img-element` quiet; the `image` prop removal must not leave an unused-var).
- `pnpm exec tsc --noEmit` passes (no caller passes `image=` today — `ProductListing.tsx:64` is the only caller).
- `pnpm test -- __tests__/product-listing/ProductCard.test.tsx` passes.
- `pnpm design:lint` passes (all colors are `DESIGN.md` gray tokens).

**Dev-server validation** (`pnpm dev`)
- `GET /` → 200. The HTML contains at least one `<img` whose `src` starts with `https://res.cloudinary.com/`, with `alt="<product name>"`, `loading="lazy"`, `decoding="async"`; and at least one occurrence of `Imagen no disponible`. (Try `/?page=2` if page 1 is uniform.) No `<img` without `loading="lazy"`.
- `GET /categorias/tornilleria` → 200, same two-state check.
- `GET /marcas/bohrcraft` → 200, same two-state check.
- `GET /?mode=name&q=broca&page=1` → 200, cards render with `imageUrl`-driven blocks.
- `GET /cotizar` → 200, unchanged (no `Imagen no disponible`, no product `<img>`).
- Server log / browser console: no hydration warnings (the image block is derived from server-fetched data, so SSR and client agree; `imageFailed` starts `false` on both).

**Manual**
- Desktop ≥ `sm`: photo and placeholder blocks are 4/3 and the same height within a row; kicker/title/price align across a row that mixes both states.
- Below `sm` (DevTools mobile): both blocks are 16/9.
- Dark mode toggle: placeholder ground/border/icon/caption switch to the gray-800/700/500/400 set; photo ground is gray-800.
- Open DevTools → Network → block `res.cloudinary.com` → reload: imaged cards show the placeholder, not the broken-image glyph (D7).
- Navigate `/` → `/categorias/tornilleria` (or hit `/categorias/tornilleria` with throttling): the loading skeleton shows an image-sized block above the kicker with no layout shift when data lands.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/components/ProductCard.tsx` | photo vs. placeholder branch, `alt`/`loading`/`decoding`, `onError` fallback, no `image` prop | `pnpm test -- __tests__/product-listing/ProductCard.test.tsx` + dev-server `curl /` + manual Network-block check |
| `src/components/ProductCardSkeleton.tsx` | aspect-ratio block above kicker | manual throttled load of `/categorias/tornilleria` |
| `__tests__/product-listing/ProductCard.test.tsx` | AC6 three image cases; other cases unchanged | `pnpm test -- __tests__/product-listing/ProductCard.test.tsx` |

---

## Phase 3 — JSON-LD `image` + docs

### Changes Required

**`src/shared/utils/seo.utils.ts`** — Modify `buildProductListItem`, inside `item`, after `name`:

```ts
image: product.imageUrl || undefined,
```

`||` (not `??`) so `""` is dropped too; `undefined` is stripped by `JSON.stringify`, same as `brand`.

**`__tests__/seo/seo.utils.test.ts`** — Modify.
- `ProductJsonLd` test type: add `image?: string`.
- Two cases in `describe("buildCatalogJsonLd")`, following the `offers` present/omitted pattern (lines 178–208):
  1. `adds image when imageUrl is set` — `{ ...baseProduct, imageUrl: "https://res.cloudinary.com/x/y.webp" }` → `item.image` equals the URL.
  2. `omits image when imageUrl is null` — `{ ...baseProduct, imageUrl: null }` → serialized item `not.toHaveProperty("image")` (the `JSON.parse(JSON.stringify(...))` trick already used for `offers`).

**`ai-skills/REPO_CONTEXT.md`** — Modify (retire stale notes; keep each line to one or two sentences):
- Lines 168–169: fold the "Correction" into the main sentence — `Product.imageUrl` (optional string, absolute Cloudinary `.webp` URL, not a media field) is selected by the five list queries and rendered by `ProductCard`; still genuinely absent: `slug`, product-level SKU, `availability`/`stock`, `currency`. Drop "No frontend query selects it yet".
- Line 307: replace "Strapi has no media field … ships image-less …" with: `ProductCard` renders `product.imageUrl` as a plain lazy `<img>` (D2, no `next/image`) or the dashed "Imagen no disponible" placeholder; the block is always present so mixed rows stay aligned (D1).
- Line 328: replace "no Strapi media field exists yet … optional image prop …" with the same one-liner + "Do not reference localhost Strapi URLs."
- Line 384 (`ProductCard.tsx` key-file row): replace "Optional `image?: { src; alt }` prop, unused by any caller yet." with "Image block from `product.imageUrl` (photo or placeholder; `onError` → placeholder)."
- Line 237 (JSON-LD bullet): append that the `Product` node carries `image` when `imageUrl` is set.
- Update the `Last Updated` date.

**`docs/improvement.md`** — Modify line 53: products now have `imageUrl` (plain string, ~39% coverage); the remaining blocker is coverage + a real media/`alternativeText` field, not the absence of any image data. Keep the OG/share-image note as is (still out of scope).

### Success Criteria

**Automated**
- `pnpm test -- __tests__/seo/seo.utils.test.ts` passes.
- `pnpm test` (full) passes — existing suites unaffected.
- `pnpm build` passes.

**Dev-server validation** (`pnpm dev`)
- `GET /` → 200; the `<script type="application/ld+json">` block contains at least one `"image":"https://res.cloudinary.com/…"` inside an `ItemList` → `Product` item, and at least one `Product` item without an `image` key.
- `GET /?mode=name&q=broca&page=1` → 200; same check on the per-page `ItemList`.

**Manual** — none (docs edits are reviewed by reading the diff).

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/shared/utils/seo.utils.ts` | `image` present/omitted on the `Product` node | `pnpm test -- __tests__/seo/seo.utils.test.ts` + dev-server `curl /` JSON-LD grep |
| `ai-skills/REPO_CONTEXT.md`, `docs/improvement.md` | stale "no media field" notes retired | diff review |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 – Data: `imageUrl` on `Product` + five list queries | Phase 1 | `GET /api/catalog/products?page=1` (+ `mode=category`, `mode=brand`, `mode=name`) 200, every item has `imageUrl`; `GET /categorias/tornilleria` 200 | Not validated | `GET_PRODUCTS_BY_IDS` unchanged is a `tsc`/diff check |
| AC2 – Image present renders lazy `<img>` with name alt | Phase 2 | `GET /` 200 contains `<img src="https://res.cloudinary.com/…" alt="…" loading="lazy" decoding="async"` | Not validated | aspect/radius classes are manual + `design:lint` |
| AC3 – Absent or failed → "Imagen no disponible" placeholder, no `image` prop | Phase 2 | `GET /` 200 contains `Imagen no disponible`; `tsc` passes with prop removed | Not validated | `onError` path: Jest case 3 + manual Network-block check (not curl-able) |
| AC4 – Skeleton aspect-ratio block | Phase 2 | — | Cannot validate | Skeleton only renders during Suspense/loading; covered by manual throttled load of `/categorias/tornilleria` |
| AC5 – JSON-LD `image` when present | Phase 3 | `GET /` 200, ld+json has `"image":"https://res.cloudinary.com/…"` on some items and none on others | Not validated | |
| AC6 – Tests | Phase 2, Phase 3 | — | Cannot validate | `pnpm test -- __tests__/product-listing/ProductCard.test.tsx`, `pnpm test -- __tests__/seo/seo.utils.test.ts`, then full `pnpm test` |

## Cross-Cutting Concerns

- **Strapi contract:** `imageUrl` is a plain `String` scalar on `Product` (backend commit `837d827`). If the dev-server check in Phase 1 returns a GraphQL validation error, the backend the dev server points at predates that commit — stop and confirm `STRAPI_HOST`.
- **Server/client boundary:** `ProductCard` is already `"use client"`; `useState` for `imageFailed` is fine. The initial render is identical on server and client (`imageFailed === false`), so no hydration mismatch.
- **Responsive/theme:** class-only (`max-sm:aspect-video` / `dark:*`); no `useMediaQuery`. All colors are `DESIGN.md` gray tokens.
- **External origin:** `res.cloudinary.com`; no CSP configured, nothing to allowlist.

## Open Questions / Out of Scope

**Unresolved:** none.

**Deliberately excluded (research "Out of scope"):**
- `next/image` / `remotePatterns`; Cloudinary URL transforms.
- Image in `ProductVariantsDrawer`, `/cotizar` line rows, OG/Twitter share images.
- Backend `imageUrl` coverage.
- Any retry/logging on `onError` (D7: flip state only).
- Refactoring the image block into its own component — inline ternary per research "Existing patterns".
