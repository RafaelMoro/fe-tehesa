# Plan: `/marcas` Index Redesign (v2 design) (Story 4 of `brands-browsing`)

**Source research:** `ai-research/brands-browsing/brands-index-redesign.story-4.md` (2026-09-27, branch
`feat/redesign-brand-page`).
**Sign-off status:** Signed off by the user on 2026-09-28. The research doc's status line was updated to match.
**Plan date:** 2026-09-28.
**Design of record:** `comps/brands-browsing/design-source/pagina-marcas-v2/pagina-marcas v2.dc.html` (gitignored,
local-only). The comp wins over this plan on any visual detail. The research "Design spec" section transcribes every
string, size, and color, so this plan points at it and does not repeat it.

## Assumptions

- All seven configured brands, Bohrcraft included, are live in the Strapi instance behind `.env.local` (true since
  Story 3). If the local instance lacks one, the missing card or panel is an environment gap, not a defect.
- The Cloudinary URLs are reachable from the browser. They are loaded client-side only, and the server never fetches
  them.
- The `BRAND_PAGES` card copy already matches the comp (28/28, research "Brand data"), so no card text changes.
- `/marcas/[slug]` receives the extended `BrandPageConfig` but ignores the new `logo` field. The type is additive, so
  `BrandPage` needs no change.

## Acceptance Criteria

1. **Hero:** `/marcas` renders the breadcrumb `Inicio / Marcas`, the kicker `Distribuidor directo`,
   `<h1>Marcas que distribuimos</h1>`, the distributor paragraph verbatim, and the temporary Cloudinary store photo
   in a 4:5 rounded frame (`object-cover`, focal point ≈ `44% 50%`, `alt="Fachada de la tienda Tehesa Industrial en
   Puebla"`, not lazy-loaded). On ≥1024px the photo sits beside the text and is at most 420px wide; below 1024px it
   stacks under the text. The old kicker/H1/intro, the `N marcas en almacén` counter, and
   `Ordenadas por fondo de catálogo` are gone.
2. **Featured Bohrcraft panel:** when `bohrcraft` is in both `BRAND_PAGES` and the live taxonomy, a panel renders
   below the hero with the kicker `Marca diferenciadora`, `<h2>BOHRCRAFT — Precisión alemana</h2>`, the featured
   paragraph verbatim, the Bohrcraft logo on a white rotated tile, and a `Ver catálogo Bohrcraft` link to
   `/marcas/bohrcraft`. Bohrcraft does **not** also appear in the grid. When Bohrcraft is not live, the panel is
   absent and nothing else changes.
3. **Brand grid:** under `<h2>El resto del catálogo</h2>` plus the aside `Cada marca abre el catálogo filtrado`, one
   card renders per remaining configured-and-live brand, in design order: Weston, King Tony, Bondhus, Precision
   Brand, Cleveland, Völkel. Each card shows, top to bottom, a 96px logo tile (brand logo on its `LOGO_BG`), `<h3>`
   name, origin, identity, the `En almacén` label plus stock paragraph, tag pills, and a `Ver productos` link to
   `/marcas/<slug>`. Only the CTA is a link. The card itself is not a link. The order comes from a `/marcas`-only
   list, and `BRAND_PAGES` insertion order is untouched. When no card would render, the heading row is hidden too.
4. **Unchanged surfaces:** the tornillería note (links `CATEGORY_PAGE_HREFS.tornilleria`), the `¿No ves tu marca?`
   panel (`Buscar por categoría` → `/categorias`, plus `Cotizar por WhatsApp` gated on `NEXT_PUBLIC_WHATSAPP_NUMBER`
   with `WHATSAPP_BRANDS_MESSAGE`), `generateMetadata`, `BreadcrumbList` JSON-LD, the sitemap, the Home `BrandStrip`
   order, and `/marcas/[slug]` all behave exactly as today. Both light and dark themes render per the comp's token
   table.
5. **Verification:** `__tests__/brands/BrandsPage.test.tsx` is updated to the new copy and structure. That covers
   the featured panel present/absent, the grid excluding Bohrcraft, design order, logo `alt`, CTA hrefs, and the
   WhatsApp gating kept. `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` all pass.

## Affected files

- `src/app/**`
  - `src/app/marcas/page.tsx`: Modify. Pass the live brand ids instead of a pre-built card list.
- `src/features/**`
  - `src/features/BrandsPage/BrandsPage.tsx`: Modify. Hero, selection, grid heading, and empty state.
  - `src/features/BrandsPage/FeaturedBrandPanel.tsx`: Create. The Bohrcraft panel.
  - `src/features/BrandsPage/BrandCard.tsx`: Modify. Logo tile, `<h3>`, and v2 styling.
- `src/shared/**`
  - `src/shared/constants/brand.constants.ts`: Modify. Logo data, the `/marcas` order, the featured id, and the hero
    photo.
- Tests: `__tests__/brands/BrandsPage.test.tsx` (rewrite).
- Docs: `ai-skills/REPO_CONTEXT.md`, `ai-research/epics/brands-browsing.epic.md`.

**Not touched:** `BrandStrip.tsx` (it still reads `Object.keys(BRAND_PAGES)`), `BrandPage/*`, `/marcas/[slug]/*`,
`sitemap.ts`, `seo.constants.ts`, `Header`/`MobileMenu`, `next.config.ts`, `DESIGN.md`.

---

## Phase 1: Brand config (logos, `/marcas` order, featured id, hero photo)

### Changes Required

**`src/shared/constants/brand.constants.ts`** (Modify)

- `BrandPageConfig` gains a required `logo` field:
  ```ts
  export type BrandLogo = { src: string; width: number; height: number; background: string }
  export type BrandPageConfig = { name; origin; identity; stock; tags; logo: BrandLogo }
  ```
  `width`/`height` are the intrinsic sizes from the research table (D11) and exist only to reserve the aspect ratio.
  `background` is the comp's `LOGO_BG` hex, which is brand data, not a design token (D4).
- Add `logo` to each of the seven `BRAND_PAGES` entries. Every URL is
  `https://res.cloudinary.com/dov7g4avx/image/upload/` + the path below, used verbatim with no transforms (D11):

  | `customId` | path | w×h | background |
  | --- | --- | --- | --- |
  | `weston` | `v1790362301/weston-logo_cwahti.webp` | 250×80 | `#141414` |
  | `volkel` | `v1790362300/volkel-logo_trxl3c.webp` | 105×32 | `#003f7d` |
  | `king-tony` | `v1790362298/king-tony-logo_mdqyej.webp` | 288×76 | `#d7141a` |
  | `bohrcraft` | `v1790362297/bohrcraft-logo_qhptej.webp` | 173×105 | `#ffffff` |
  | `bondhus` | `v1790362297/bhondus-logo_gun8z7.webp` | 250×64 | `#ffffff` |
  | `precision` | `v1790362299/precision-brand-logo_sylhpn.webp` | 260×70 | `#ffffff` |
  | `cleveland` | `v1790362298/cleveland-logo_l78txe.webp` | 1902×2272 | `#ffffff` |

  Keep the `bhondus` misspelling. It is the upstream asset name.
- Rewrite the comment above `BRAND_PAGES`. Insertion order now drives only Home's `BrandStrip` (live product-count
  order). `/marcas` uses `BRANDS_INDEX_ORDER`. Drop the "Siete" hero reference, since that copy is deleted.
- Add, after `BRAND_PAGES`:
  ```ts
  // /marcas only (UI/product I): the featured brand renders in its own panel and is not in this list.
  // A brand added to BRAND_PAGES must also be added here to appear on /marcas.
  export const BRANDS_FEATURED_ID = "bohrcraft"
  export const BRANDS_INDEX_ORDER: string[] = ["weston", "king-tony", "bondhus", "precision", "cleveland", "volkel"]
  ```
- Add the hero photo as one constant, so the URL and the alt text can't drift (UI/product IV):
  ```ts
  // Temporary storefront photo (D3). Replace src and alt together.
  export const BRANDS_HERO_PHOTO = {
    src: "https://res.cloudinary.com/dov7g4avx/image/upload/v1790362578/tehesa-temp-image_ujtodk.webp",
    alt: "Fachada de la tienda Tehesa Industrial en Puebla",
    width: 1787,
    height: 880,
  }
  ```

**Edge case:** `BrandCardItem` (`BrandCard.tsx:7`) is `BrandPageConfig & { customId }`, so it picks up `logo`
automatically. The existing test fixture spreads `BRAND_PAGES.*`, so it keeps type-checking until Phase 2 rewrites
it.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm test -- __tests__/brands __tests__/brand-page __tests__/home`. These suites should still pass unchanged,
  because nothing reads the new fields yet.

**Dev-server validation** (`pnpm dev`)
- There is no visible change yet. Run a regression check only:
  - `GET /marcas` returns 200, still shows `Explora el catálogo por marca`, and has no server-log errors.
  - `GET /marcas/weston` returns 200.
  - `GET /` returns 200.

**Manual:** none.

---

## Phase 2: Redesigned `/marcas` UI, route wiring, and tests

### Changes Required

**`src/app/marcas/page.tsx`** (Modify, `BrandsRoute` body near line 41)
- Stop building `BrandCardItem[]` here, and drop the `BRAND_PAGES`/`BrandCardItem` imports.
- `const live = await fetchBrands()` → `<BrandsPage liveBrandIds={live.map((brand) => brand.customId)} />`.
- `generateMetadata`, `breadcrumbJsonLd`, and the `<main>` classes (`max-w-6xl … gap-8 p-4 md:p-5`, UI/product III)
  stay as they are.
- **Rationale:** the config ∩ live selection moves into the synchronous feature component, so Jest can cover design
  order, Bohrcraft exclusion, and panel present/absent (AC5). Async server components can't be rendered in Jest
  (`docs/UNIT_TESTING_GUIDELINES.md`).

**`src/features/BrandsPage/BrandsPage.tsx`** (Modify, whole component)
- Signature: `export const BrandsPage = ({ liveBrandIds }: { liveBrandIds: string[] })`.
- Selection (Story 1's config ∩ live rule, not the comp's `products > 0`):
  ```ts
  const live = new Set(liveBrandIds)
  const toItem = (customId: string): BrandCardItem | null =>
    BRAND_PAGES[customId] !== undefined && live.has(customId) ? { customId, ...BRAND_PAGES[customId] } : null
  const featured = toItem(BRANDS_FEATURED_ID)
  const brands = BRANDS_INDEX_ORDER.map(toItem).filter((item) => item !== null)
  ```
  Remove `countFormatter` and the `count` string.
- Render order, with each section's sizes and colors taken from research "Design spec" §1–7:
  1. The breadcrumb stays as it is (`<nav aria-label="Ruta">`, `aria-current="page"` on `Marcas`). Restyle it to
     13px / `--muted` only.
  2. Hero `<section>`: `grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]`, stacked below `lg`.
     - The left column (max-w 600px) holds, in order:
       - the pill kicker `Distribuidor directo` (`bg-[#4DF527] text-[#0D3401]`);
       - `<h1>Marcas que distribuimos</h1>` at `text-[32px] md:text-[40px] lg:text-[56px]`, extrabold, `leading-[1.05]`;
       - an `aria-hidden` 88×4 `#4DF527` rule;
       - the distributor `<p>` verbatim (research §2).
     - The right column is a `aspect-[4/5] overflow-hidden rounded-[10px]` frame with `bg-gray-50 dark:bg-[#12250A]`.
       It holds a plain `<img>` from `BRANDS_HERO_PHOTO` (`src`, `alt`, `width`, `height`) with
       `className="size-full object-cover object-[44%_50%]"`. Add **no** `loading` attribute, so the image loads
       eagerly (AC1). Put the `ProductCard.tsx:141` eslint-disable comment above it (D8).
  3. `{featured !== null && <FeaturedBrandPanel brand={featured} />}`.
  4. When `brands.length > 0`, render the grid heading row followed by the grid (keep today's grid classes, which
     already match `--cards`). The row is flex, wrapping, baseline-aligned with `justify-between`: `<h2>El resto del
     catálogo</h2>` (30px extrabold) and a `<p>Cada marca abre el catálogo filtrado</p>`. When `brands` is empty,
     render nothing here (D10), **except** when `featured === null` too. Then render today's
     `<p>No hay marcas disponibles por ahora.</p>` (D6).
  5. The tornillería note and the closing panel keep today's markup, copy, links, and WhatsApp gating. Optionally
     align their sizes to research §6–7 ("small size and weight differences"). Do not change hrefs or text.
- **Spacing:** `<main>` keeps `gap-8`. Where the comp's spacing differs a lot, adjust with margins on the section
  wrappers, not with `page.tsx` classes. For example, the grid heading row sits 72px after the panel.
- **Colors:** use the Tailwind gray scale for light-mode tokens, the same approach as `ProductCard.tsx`. Use the
  arbitrary dark values already in this feature.

  | Token | Light | Dark |
  | --- | --- | --- |
  | `--muted` | `gray-500` | `gray-400` |
  | `--muted-strong` | `gray-700` | `gray-300` |
  | `--body` | `gray-600` | `gray-400` |
  | `--title` | `gray-900` | `white` |
  | `--border` | `gray-200` | `[#1E3608]` |
  | `--border-strong` | `gray-300` | `[#244310]` |
  | `--surface` | `white` | `[#0B1A02]` |
  | `--accent-kicker` | `[#23890C]` | `[#4DF527]` |

**`src/features/BrandsPage/FeaturedBrandPanel.tsx`** (Create, server component, no `"use client"`)
- Signature: `export const FeaturedBrandPanel = ({ brand }: { brand: BrandCardItem })`. The copy is page-specific
  and inline, like every other string on this page. `brand` supplies `logo` and the CTA href
  (`BRAND_PAGE_HREFS[brand.customId]`).
- Root element: `<section className="relative grid overflow-hidden rounded-[18px] bg-[#1B1C1F] text-[#F4F4F5] …">`.
  - Grid columns are `lg:grid-cols-[minmax(0,1fr)_300px]`. Stack below `lg`.
  - Gap is 48px with `items-end`.
  - Padding is `p-5 md:p-8 lg:p-[52px]` (`--feat-pad`).
  - These are fixed colors, with no `dark:` variants.
  - The hover lift is optional (Rules 1). If kept, it must not make the section focusable or a link.
- It contains, in DOM order:
  1. The ring: `<span aria-hidden="true">` positioned `absolute -right-[60px] -top-[60px]`, 260px circle,
     `border-[40px] border-[#FF6A1A] opacity-90`, `hidden lg:block`.
  2. The text column (`relative flex flex-col items-start gap-[18px]`):
     - the kicker `Marca diferenciadora` (`bg-[#FF6A1A] text-[#1B1C1F]`);
     - `<h2>BOHRCRAFT — <span className="text-[#FF8A4C]">Precisión alemana</span></h2>` at
       `text-[28px] md:text-[36px] lg:text-[46px]` (`--h2f`, D12), extrabold, `leading-[1.02]`;
     - the featured `<p>` verbatim (research §3), `text-[#B4B6BC]`, max-w 620px;
     - a `Link` CTA `Ver catálogo Bohrcraft` plus `RiArrowRightLine aria-hidden`: a `min-h-[52px]` pill with
       `bg-[#FF6A1A] text-[#1B1C1F]` and `focus-visible:outline-[3px] outline-offset-[3px] outline-[#FF6A1A]`.
  3. The logo tile: `relative`, white, 12px radius, 170px tall, 24px padding, `-rotate-2`,
     `shadow-[0_20px_40px_rgba(0,0,0,.4)]`, `w-full max-w-[340px]`. It holds an `<img>` with `src`/`width`/`height`
     from `brand.logo`, `alt="Bohrcraft"` (comp), `max-h-[100px] max-w-full object-contain`, and `loading="lazy"`.
     Below `lg` the panel is a single column, so the tile drops under the text.
- **Edge case:** keep the `relative` on the text column and on the tile. That keeps both above the absolutely
  positioned ring, which is the comp's stacking.
- `BRAND_PAGE_HREFS.bohrcraft` always exists (Story 2), so the panel needs no disabled-CTA branch like
  `BrandCard`'s.

**`src/features/BrandsPage/BrandCard.tsx`** (Modify)
- `<article>`: `flex flex-col gap-3.5 rounded-[14px] border bg-white p-5 dark:bg-[#0B1A02]`, plus today's hover lift
  with the `--shadow` / `--border-strong` values. It stays a non-link `<article>` (D1).
- New first child, the logo tile:
  - Container: `<div className="flex h-24 items-center justify-center overflow-hidden rounded-[10px] border p-2.5"
    style={{ backgroundColor: brand.logo.background }}>`.
  - Use inline `style` for the background because the hex is per-brand data. It applies in **both** themes, since
    white logos vanish without it.
  - Inside: `<img src width height alt={brand.name} loading="lazy" className="h-auto max-h-full w-auto max-w-full
    object-contain">` with the eslint-disable comment.
  - Check that Cleveland (1902×2272) stays inside the tile.
- The name block (`gap-[5px]`): `<h2>` → **`<h3>`** (22px extrabold) followed by the origin.
- Group `En almacén` and the stock `<p>` into one block. The identity paragraph, the tags, and the CTA keep their
  semantics. Restyle them per research §5.
- CTA: keep `min-h-11` (D5) and the `href !== undefined` gate. Add
  `focus-visible:outline-2 outline-offset-2 outline-[#24AD02]`.
- **Logo alt decision (research "decide it once"):** `alt={brand.name}` (e.g. `WESTON`). That matches the comp and
  the featured panel's `alt="Bohrcraft"`, and makes each logo addressable by role in tests. The double announcement
  next to the `<h3>` is accepted.

**`__tests__/brands/BrandsPage.test.tsx`** (Rewrite; follow `docs/UNIT_TESTING_GUIDELINES.md`)
- Keep the `whatsapp.constants` getter mock and the `beforeEach`. Replace the `BrandCardItem[]` fixture with id
  arrays:
  - `ALL = [...Object.keys(BRAND_PAGES), "libre"]`. `libre` is live but unconfigured, so it must be ignored.
  - `WITHOUT_FEATURED = ALL.filter((id) => id !== "bohrcraft")`.
- Cases:
  1. **Hero (AC1):**
     - the breadcrumb `Inicio` link has `href="/"`, and `Marcas` has `aria-current="page"`;
     - the texts `Distribuidor directo` and the distributor paragraph are present;
     - the h1 is `Marcas que distribuimos`;
     - `getByRole("img", { name: BRANDS_HERO_PHOTO.alt })` has `src` equal to `BRANDS_HERO_PHOTO.src` and no
       `loading="lazy"`;
     - `queryByText` is null for `Explora el catálogo por marca`, `/marcas? en almacén/`, and
       `Ordenadas por fondo de catálogo`.
  2. **Featured panel present (AC2), with `ALL`:**
     - the h2 `BOHRCRAFT — Precisión alemana`, the kicker, and the paragraph are present;
     - the img `Bohrcraft` is present;
     - the link `Ver catálogo Bohrcraft` has `href="/marcas/bohrcraft"`;
     - no h3 is `BOHRCRAFT`, and no `Ver productos` link points to `/marcas/bohrcraft`.
  3. **Grid order, content, and CTA-only (AC3), with `ALL`:**
     - `getAllByRole("article")` has 6 entries;
     - the h3 texts equal `BRANDS_INDEX_ORDER.map((id) => BRAND_PAGES[id].name)`, which also asserts the literal
       `["WESTON","KING TONY","BONDHUS","PRECISION BRAND","CLEVELAND","VÖLKEL"]` so a reorder of the constant is
       caught;
     - each article has its logo img named `BRAND_PAGES[id].name`, its origin, identity, stock, and tags, and exactly
       one link, whose href is `/marcas/<slug>`;
     - `En almacén` appears 6 times;
     - the `El resto del catálogo` h2 and the aside are present.
  4. **Featured panel absent (AC2), with `WITHOUT_FEATURED`:** there is no `BOHRCRAFT — Precisión alemana` heading
     and no `Ver catálogo Bohrcraft` link. The grid heading and 6 articles are still present.
  5. **Only the featured brand live (D10), with `["bohrcraft"]`:**
     - the panel is present;
     - there is no `El resto del catálogo` heading and no articles;
     - there is no `No hay marcas disponibles por ahora.`
  6. **Zero live brands (D6), with `[]`:**
     - the empty text is present;
     - there is no panel, no grid heading, and no articles;
     - the hero h1 and `¿No ves tu marca?` are still present.
  7. **Tornillería note, category button, WhatsApp href/target/rel (AC4):** kept from today, rendered with `ALL`.
  8. **WhatsApp unset (AC4):** kept from today. It does not throw, the WhatsApp link is absent, and the category
     button is present.
- No class, color, or layout assertions. No `querySelector`. Replace today's `container.querySelector('a[href="#"]')`
  check with case 3's one-link-per-article assertion.

### Success Criteria

**Automated**
- `pnpm test -- __tests__/brands/BrandsPage.test.tsx` while iterating.
- `pnpm test`: the full suite, including the unchanged `__tests__/home` `BrandStrip` order test and
  `__tests__/brand-page`.
- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm build`

**Dev-server validation** (`pnpm dev`, `http://localhost:3000`). Use `curl -s` and grep the HTML.
- `GET /marcas` returns 200 and the HTML contains:
  - `Distribuidor directo`, `Marcas que distribuimos` inside an `<h1`, and `En más de 20 años abasteciendo a la
    industria poblana`;
  - `tehesa-temp-image_ujtodk.webp` and `alt="Fachada de la tienda Tehesa Industrial en Puebla"`, and that `<img`
    tag has no `loading="lazy"`;
  - `Marca diferenciadora`, `BOHRCRAFT — `, `Precisión alemana`, `Nuestra marca diferenciadora.`,
    `Ver catálogo Bohrcraft`, and `bohrcraft-logo_qhptej.webp`;
  - `El resto del catálogo` and `Cada marca abre el catálogo filtrado`;
  - `>WESTON<`, `>KING TONY<`, `>BONDHUS<`, `>PRECISION BRAND<`, `>CLEVELAND<`, and `>VÖLKEL<` in that source order,
    each inside an `<h3`;
  - no `<h3` containing `BOHRCRAFT`;
  - `Ver productos` exactly 6 times, and each of the six grid logo filenames;
  - `búscala por categoría`, `¿No ves tu marca?`, `Buscar por categoría`, and `Cotizar por WhatsApp` when
    `NEXT_PUBLIC_WHATSAPP_NUMBER` is set;
  - the unchanged `<title>` (`BRANDS_TITLE`), a canonical ending in `/marcas`, and the JSON-LD `BreadcrumbList` with
    `Inicio` and `Marcas`.
- `GET /marcas` must **not** contain `Explora el catálogo por marca`, `marcas en almacén`,
  `Ordenadas por fondo de catálogo`, or `Siete marcas`.
- `GET /marcas/bohrcraft` and `GET /marcas/weston` return 200 and look unchanged: the same `<h1>` as before this
  story.
- `GET /` returns 200. The Home `BrandStrip` labels keep `BRAND_PAGES` order (Weston, Völkel, King Tony, Bohrcraft,
  …) in the source.
- `GET /sitemap.xml` returns 200 and still lists all seven `/marcas/<slug>` URLs.
- No server-log errors and no hydration warnings in the browser console on `/marcas`.

**Manual** (390px and 1440px, light and dark, side by side with the comp)
- Hero:
  - at 1440px, two columns with the photo ≤420px wide;
  - at 390px, stacked, with the photo full width at 4:5;
  - the crop shows the whole `TEHESA INDUSTRIAL` sign.
- Featured panel:
  - the ring is visible only at ≥1024px;
  - the logo tile is rotated and drops under the text below 1024px;
  - the H2 is 46/36/28px, and wraps to about 2–3 lines at 390px;
  - the panel colors are identical in both themes.
- Cards:
  - the white logos (Weston, King Tony, Völkel) stay visible on their backgrounds in **both** themes;
  - Cleveland fits inside the tile;
  - Völkel looks soft, which is a known asset-quality issue, not a defect;
  - the grid is 2 columns at 1440px and 1 at 390px.
- Keyboard: Tab reaches only the CTAs. Focus rings are orange 3px on `Ver catálogo Bohrcraft` and green 2px on
  `Ver productos`. The card and panel surfaces are not focusable.
- Theme: the token table matches in light and dark.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `BrandsPage.tsx` | selection (config ∩ live, design order, featured exclusion), empty state, hidden heading, hero copy/photo, old copy removed | `BrandsPage.test.tsx` cases 1–6 + dev-server `curl /marcas` |
| `FeaturedBrandPanel.tsx` | copy, logo alt, CTA href, absent when not live | cases 2, 4, 5 + `curl /marcas` |
| `BrandCard.tsx` | `<h3>`, logo alt, one link per card, CTA href | case 3 + `curl /marcas` |
| `page.tsx` | passes live ids; metadata and JSON-LD unchanged | `pnpm build` + `curl /marcas` head |
| `brand.constants.ts` | `BRAND_PAGES` order untouched | existing `__tests__/home` `BrandStrip` test + `curl /` |
| Responsive / theme / focus | layout, colors, rings | manual |

---

## Phase 3: Docs

### Changes Required

**`ai-skills/REPO_CONTEXT.md`** (Modify)
- Line ~68 (`marcas/page.tsx` row) and ~357: `page.tsx` now passes `liveBrandIds`. `BrandsPage` owns the config ∩
  live selection, orders it by `BRANDS_INDEX_ORDER`, and pulls `BRANDS_FEATURED_ID` into a panel.
- Line ~102 (`BrandsPage/` row) and ~361: replace the Story 1 description. Remove "No logo slot", the "Siete
  marcas..." intro, and the counter row. Describe the v2 hero with the temp photo, `FeaturedBrandPanel`, the
  `<h3>` cards with a logo tile on a per-brand background (inline style, both themes), the hidden heading, and the
  D6 empty state. The CTA-only rule stays.
- Line ~109 (`brand.constants.ts` in the constants row): add `BrandPageConfig.logo`, `BRANDS_INDEX_ORDER`,
  `BRANDS_FEATURED_ID`, and `BRANDS_HERO_PHOTO`. Note that `BRAND_PAGES` insertion order now drives only Home's
  `BrandStrip`, and that a new brand must also be added to `BRANDS_INDEX_ORDER` to appear on `/marcas`.

**`ai-research/epics/brands-browsing.epic.md`** (Modify)
- Update the status-table row for Story 4 (line ~203) and the "Last updated" line with the Phase 2 evidence. Add a
  "Story 4 — … : Complete" subsection mirroring Story 3's.

### Success Criteria

**Automated:** none. This phase is docs-only.
**Dev-server validation:** skipped. Nothing here is reachable at runtime.
**Manual:** re-read the edited rows against the shipped code (the export names and the prop name `liveBrandIds`).

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 - Hero | 1, 2 | `GET /marcas` 200, contains `Distribuidor directo`, `<h1` `Marcas que distribuimos`, the paragraph, the photo URL + alt without `loading="lazy"`; no `Explora el catálogo por marca` / `marcas en almacén` / `Ordenadas por…` | Not validated | 420px max and ≥1024 vs <1024 layout is manual; object-position is manual |
| AC2 - Featured panel | 1, 2 | `GET /marcas` 200, contains `Marca diferenciadora`, `BOHRCRAFT — `, `Precisión alemana`, the paragraph, `bohrcraft-logo_qhptej.webp`, `Ver catálogo Bohrcraft`; no `<h3` with `BOHRCRAFT` | Not validated | The "not live → absent" branch can't be produced against live Strapi; proven by test cases 4–5 |
| AC3 - Brand grid | 1, 2 | `GET /marcas` 200, contains `El resto del catálogo` + the aside, 6 `<h3` names in design order, 6 `Ver productos`, the six logo filenames | Not validated | Hidden heading when empty and CTA-only are proven by test cases 3 and 5; BRAND_PAGES order by `GET /` |
| AC4 - Unchanged surfaces | 2 | `GET /marcas` keeps the tornillería link, the closing panel, WhatsApp, `<title>`, canonical, JSON-LD; `GET /sitemap.xml` has 7 brand URLs; `GET /` BrandStrip order unchanged; `GET /marcas/weston` 200 unchanged | Not validated | Light/dark token fidelity is manual only |
| AC5 - Verification | 2 | `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` all pass | Not validated | Proven by commands, not by a dev-server route |

## Cross-cutting concerns

- **Server/client boundary:** `BrandsPage`, `FeaturedBrandPanel`, and `BrandCard` stay server components. No
  hooks, no `onError`, and no `"use client"`. The responsive behavior is CSS-only (`md:`/`lg:`).
- **Images:** use plain `<img>` with the eslint-disable comment (D8). Do not add `next/image` or
  `images.remotePatterns`. The hero is eager and the logos are `loading="lazy"`. Intrinsic `width`/`height` on every
  `<img>` prevents layout shift.
- **Theme:** use class-based `dark:` variants. The featured panel and the logo backgrounds are theme-independent by
  design.
- **Strapi:** no query or type change. `fetchBrands()` still throws at the boundary, which the root `error.tsx`
  covers.

## Open Questions / Out of scope

**Open questions:** none. Every research question is answered.

**Out of scope, excluded on purpose:**
- the header and mobile menu;
- `/marcas/[slug]`;
- Home `BrandStrip` order and styling;
- SEO title and description, and the sitemap;
- a Strapi logo field;
- `next/image` and a `next.config.ts` `images` block;
- a replacement hero photo, and Cloudinary transforms for Cleveland and Völkel;
- the `Clevaland`/`Volkel` Strapi name fixes;
- adding the brand hex values to `DESIGN.md` (D4);
- widening the container to 1400px (UI/product III);
- a logo-load failure fallback (research edge cases: none required).
