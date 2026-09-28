# `/marcas` Index Redesign (v2 design) — Research (Story 4 of `brands-browsing`)

**Date:** 2026-09-27
**Branch:** `feat/redesign-brand-page`
**Epic:** `ai-research/epics/brands-browsing.epic.md` (Stories 1–3 complete)
**Scope:** single story, ~3 phases. Presentation-only change to one existing route: no new route, query, Strapi
field, or dependency.
**Status:** Signed off (user, 2026-09-28). The only files written were this doc and the design snapshot.

## Design source: re-read this, don't assume

The page of record is **Claude Design → `pagina-marcas v2.dc.html`**, in project
https://claude.ai/design/p/4b99241e-42ab-4ca4-ac4e-c1cd49a75385?file=pagina-marcas+v2.dc.html.

The files were imported verbatim through the `claude_design` MCP on 2026-09-27 and saved to
**`comps/brands-browsing/design-source/pagina-marcas-v2/`**. **`/comps` is gitignored** (`.gitignore:26`), so this
snapshot exists only on the machine that ran the research. It was not moved into a tracked folder, because
`support.js` / `image-slot.js` would then fall under `pnpm lint` (the ESLint flat config ignores only build output).
If the folder is missing, re-import the same four files through the `claude_design` MCP (`DesignSync` `get_file`)
and re-download the Cloudinary URLs listed in the Brand data table. This doc's "Design spec" section transcribes
every string, size, and color, so it stands on its own without the snapshot. Folder contents:

- `pagina-marcas v2.dc.html` holds the markup, tokens, breakpoints, and the `BRANDS` / `LOGO_BG` data. **Read it
  before implementing any section.** The "Design spec" section below transcribes it, but the file wins on any
  disagreement.
- `support.js` and `image-slot.js` are the Claude Design runtime and placeholder component. They carry no design
  content.
- `assets/cloudinary/*.webp` are the seven partner logos plus the temporary store photo.
- `README.md` records provenance, the Cloudinary URLs, intrinsic sizes, and logo contrast notes.

**Ignore in the comp:** the inline utility bar, both `<header>`s, the category/brand dropdowns, and the mobile
`<aside>` menu. They are stale copies of the header. `src/shared/ui/organisms/Header.tsx` is the header of record,
the same instruction Story 1 followed. Also ignore the comp's `href`s (`?mode=brand&brand=<slug>`,
`pagina-*.dc.html`, `#`). The real targets are listed in the spec.

## Story Definition

### Title

Redesign `/marcas` to the v2 layout: a distributor hero with the store photo, a featured Bohrcraft panel, and brand
cards with logos.

### Description

Story 1 shipped `/marcas` as a text-only editorial grid: kicker `Catálogo`, `<h1>Explora el catálogo por marca`, a
count row, seven equal cards, a tornillería note, and a closing panel. The v2 comp repositions the page around
Tehesa as a **direct distributor**:

- a two-column hero (pill kicker, new `<h1>`, green rule, distributor paragraph, portrait store photo);
- a dark, orange-accented **Bohrcraft "marca diferenciadora" panel**, pulled out of the grid;
- a grid headed `El resto del catálogo` of the other six brands, each card now topped by a logo tile on a
  brand-colored background;
- the tornillería note and the `¿No ves tu marca?` closing panel, carried over unchanged.

The user supplied the logos and the (temporary) hero photo as Cloudinary URLs.

### Acceptance criteria

1. **Hero:** `/marcas` renders the breadcrumb `Inicio / Marcas`, the kicker `Distribuidor directo`,
   `<h1>Marcas que distribuimos</h1>`, the distributor paragraph verbatim, and the temporary Cloudinary store photo
   in a 4:5 rounded frame (`object-cover`, focal point ≈ `44% 50%`, `alt="Fachada de la tienda Tehesa Industrial en
   Puebla"`, not lazy-loaded).
   On ≥1024px the photo sits beside the text and is at most 420px wide; below 1024px it stacks under the text. The
   old kicker/H1/intro, the `N marcas en almacén` counter, and `Ordenadas por fondo de catálogo` are gone.
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

### Task breakdown (for `/plan`, not a plan)

1. Config: add per-brand logo URL and logo background to the brand editorial config. Add the featured-Bohrcraft copy
   and a `/marcas`-only display order (see Open Question UI/product I).
2. Feature UI: rework `BrandsPage.tsx` (hero, featured panel, grid heading, empty state) and `BrandCard.tsx` (logo
   tile, `<h3>`).
3. Tests plus docs: update `BrandsPage.test.tsx`, then the `REPO_CONTEXT.md` `BrandsPage/` row and the epic status.

## Design Agent Handoff

**User goal:** a buyer landing on `/marcas` should understand that Tehesa is a direct distributor of a short list of
serious brands, spot the brand Tehesa is proudest of (Bohrcraft), and reach any brand's product page in one click.
**This is not** a brand comparison tool, a catalog with prices, or a place for product counts, stock levels, or
"measures" numbers. The comp's `products` and `measures` fields in `BRANDS` are internal data and are never
rendered. The page stays a static, server-rendered index.

**Design is already complete.** The v2 comp is final and supplied by the user, so **no design brief file (Step 7b)
is written**. There is nothing for a repo-blind design agent to produce. The one design gap, the featured H2's
size on mobile, was closed by a Claude Design update on 2026-09-28 (`--h2f`, UI/product V). No design gaps are open.

### Surface index

| Surface | File | States | Story | Covered by |
| --- | --- | --- | --- | --- |
| Breadcrumb + hero (kicker, H1, rule, paragraph, photo) | `src/features/BrandsPage/BrandsPage.tsx` | light/dark; ≥1024 two-column, <1024 stacked; photo loaded / failed | 4 | comp: hero `<section>` |
| Featured Bohrcraft panel | `BrandsPage.tsx` (or a new sibling component, planner's call) | light = dark (fixed colors); ≥1024 two-column with ring, <1024 stacked, no ring; absent when Bohrcraft not live | 4 | comp: `<a aria-label="Ver catálogo Bohrcraft">` block |
| Grid heading row | `BrandsPage.tsx` | wraps on narrow widths | 4 | comp: `El resto del catálogo` row |
| Brand card with logo tile | `src/features/BrandsPage/BrandCard.tsx` | light/dark; hover lift; logo loaded / failed | 4 | comp: `visibleBrands` `sc-for` |
| Empty state | `BrandsPage.tsx` | zero live brands | 4 | **not in comp**, current copy kept (Decision D6) |
| Tornillería note + closing panel | `BrandsPage.tsx` | WhatsApp set / unset | 1 (unchanged) | comp: identical copy |

### Rules that override design instinct

1. **Only the CTA is a link** (user decision, 2026-09-27). This applies to both the Bohrcraft panel and the brand
   cards, even though the comp wraps each in an `<a>`. The visual hover lift may stay, but the whole surface must not
   become a click target or carry an `aria-label` that replaces its content.
2. **The config ∩ live-taxonomy rule from Story 1 still decides what renders.** A brand that is configured but not
   live (including Bohrcraft for the featured panel) is not rendered. The comp's `.filter(b => b.products > 0)` is
   **not** the rule.
3. **Never render counts.** No product counts, no measures, no `N marcas` counter. The comp removed the counter.

### Mobile / desktop

- Comp breakpoints are `max-width:1023px` and `max-width:767px`, which map exactly to Tailwind `lg` (1024) and `md`
  (768) as min-width variants. This is the same mapping Story 1 used.
- **Container:** the comp frame is `max-width:1400px` with 20/16px padding. Every route in this repo uses
  `max-w-6xl p-4 md:p-5` (`src/app/marcas/page.tsx:53`). At `max-w-6xl` the `minmax(360px,1fr)` grid fits **2**
  columns (1112px content), not the comp's 3. **Decided: keep `max-w-6xl`, 2 columns** (UI/product III).
- The hero stacks below 1024px. The 4:5 photo then spans full width, so it is ~490px tall at 390px viewport. The comp
  does this on purpose.
- The featured panel's ring decoration (`--ring`) is hidden below 1024px, and the logo tile drops under the text.
- No hooks are needed: `BrandsPage` stays a server component. Everything responsive is CSS-only, and
  `useMediaQuery`-style logic is neither needed nor wanted.

### Accessibility

- Heading outline: `h1` (hero) → `h2` (featured `BOHRCRAFT — Precisión alemana`) → `h2` (`El resto del catálogo`) →
  `h3` per card → `h2` (`¿No ves tu marca?`). Cards move from `<h2>` (today) to `<h3>`.
- Keep the breadcrumb `<nav aria-label="Ruta">` with `aria-current="page"` on `Marcas`. The comp drops
  `aria-current`, but the current code and tests have it, so it stays.
- Logo `<img alt>` = the brand's display name (`b.name` in the comp, e.g. `WESTON`). The `<h3>` repeats the name, so
  planning may choose `alt=""` to avoid a double announcement. Decide it once, in the plan, and test it.
- Hero photo alt: `Fachada de la tienda Tehesa Industrial en Puebla` (UI/product IV). The comp's placeholder has no
  alt.
- Focus rings: the comp uses `outline:2px solid #24AD02; outline-offset:2px` on cards and `3px solid #FF6A1A` on
  the featured panel. Under the CTA-only rule these move onto the CTAs.
- CTA height: the comp uses 42px for card CTAs and 52px for the Bohrcraft pill. The repo convention is `min-h-11`
  (44px). Keep `min-h-11` (Decision D5).
- The decorative ring `<span>` and the green rule under the H1 are `aria-hidden`.

### Visual patterns to preserve

- Accent scale and neutrals per `DESIGN.md` lines 5–36: primary `#4DF527`, hover `#3BD11A`, on-primary `#0D3401`,
  kicker `#23890C` (dark `#4DF527`), panel `#0F2001` = `primary-950`. The dark surface/border values (`#0B1A02`,
  `#12250A`, `#1E3608`, `#244310`) are already in use as arbitrary values in `BrandCard.tsx`/`BrandsPage.tsx`.
- **New, brand-specific colors not in `DESIGN.md`**, used only in the featured panel and logo tiles: `#1B1C1F` panel,
  `#F4F4F5` panel text, `#B4B6BC` panel body, `#FF6A1A` Bohrcraft orange, `#FF8A4C` highlight, and the logo tiles
  `#141414` / `#d7141a` / `#003f7d` / `#ffffff`. They are identical in both themes. Treat them as brand data, not
  design tokens, and don't add them to `DESIGN.md` (Decision D4). `pnpm design:lint` is only needed if `DESIGN.md` is
  edited.
- Dark mode stays class-based (`dark:` variants). The comp's `data-theme` attribute is design-tool plumbing
  (`DESIGN.md` line 116).
- Geist Sans is already loaded app-wide. The comp's Google Fonts `<link>` is not needed.

### Content constraints

- All copy is Spanish and verbatim from the comp (transcribed below). The user confirmed the business claims on
  2026-09-27.
- Brand name, origin, identity, stock, and tags keep coming from `BRAND_PAGES`. The comp's `BRANDS` entries match
  the current config text 1:1 (checked 2026-09-27), so there are no copy changes to card bodies.
- WhatsApp prefill stays `WHATSAPP_BRANDS_MESSAGE`, which equals the comp's `waHref` text, built by
  `buildWhatsappUrl`.

### Out of scope

The header and mobile menu, `/marcas/[slug]` (`BrandPage`), Home `BrandStrip`, SEO title/description, sitemap,
Strapi (no logo field is added; logos stay frontend config, like all brand editorial data), `next/image` or a
`next.config.ts` `images` block, a replacement hero photo, and the `Clevaland` / `Volkel` Strapi name fixes.

### Decision record

- ~~D1: Whole-card link vs CTA-only.~~ **CTA-only** for cards and the Bohrcraft panel (user, 2026-09-27). This
  preserves Story 1's behavior and gives short link names.
- ~~D2: Card order.~~ **Design order**: Weston, King Tony, [Bohrcraft featured], Bondhus, Precision, Cleveland,
  Völkel (user, 2026-09-27). This differs from `BRAND_PAGES` insertion order, which is product-count order with
  Völkel second and also drives Home `BrandStrip`. How to scope the order is UI/product I.
- ~~D3: Hero photo framing.~~ **Keep the 4:5 slot**, use the temp photo with `object-cover`, and flag it as temporary
  (user, 2026-09-27). Focal point `object-position` ≈ `44% 50%` (UI/product II).
- ~~D9: `/marcas` order vs `BRAND_PAGES`.~~ A separate `/marcas`-only order list. `BRAND_PAGES` and Home
  `BrandStrip` stay as they are (user, 2026-09-27).
- ~~D10: Empty grid heading.~~ Hide `El resto del catálogo` whenever the grid has no cards (user, 2026-09-27).
- ~~D11: Asset URLs.~~ Use the Cloudinary URLs verbatim, with intrinsic `width`/`height` on each `<img>`
  (recommendation accepted, 2026-09-27).
- ~~D12: Featured H2 mobile size.~~ The comp now defines `--h2f`: 46px (≥1024) → 36px (768–1023) → 28px (<768)
  (Claude Design update, 2026-09-28; UI/product V).
- ~~D4: Brand colors.~~ Brand-specific hex values live with brand config or feature classes, not `DESIGN.md`. They
  are unique to one brand or logo and have no reuse.
- ~~D5: CTA height.~~ Keep `min-h-11` (44px) over the comp's 42px, to match the repo touch-target convention. The
  Bohrcraft pill is 52px, above the minimum, so keep it.
- ~~D6: Empty state.~~ The comp has none. Keep today's `No hay marcas disponibles por ahora.` in place of the grid
  when zero brands are live. The hero and closing panel still render.
- ~~D7: Copy claims.~~ `Distribuidor directo`, `más de 20 años…`, and `la mayoría de los distribuidores de la región
  no maneja` ship as written (user, 2026-09-27).
- ~~D8: Images.~~ Use plain `<img>` with the `ProductCard.tsx:141` precedent (`eslint-disable-next-line
  @next/next/no-img-element`, because Cloudinary already serves sized WebP). There is no `images.remotePatterns` in
  `next.config.ts`, and adding one is out of scope.

## Design spec (transcribed from the comp, verbatim strings)

### Tokens (`:root` / `:root[data-theme="dark"]`)

| Token | Light | Dark | Used by |
| --- | --- | --- | --- |
| `--bg` / `--fg` | `#FFFFFF` / `#171717` | `#0A0A0A` / `#EDEDED` | page |
| `--surface` | `#FFFFFF` | `#0B1A02` | card background |
| `--subtle` | `#F9FAFB` | `#12250A` | hero photo frame fallback |
| `--border` / `--border-strong` | `#E5E7EB` / `#D1D5DB` | `#1E3608` / `#244310` | card and logo tile border / card hover border, breadcrumb `/` |
| `--muted` | `#6B7280` | `#9CA3AF` | breadcrumb, origin, grid aside |
| `--muted-strong` | `#374151` | `#D1D5DB` | hero paragraph, identity, tags, breadcrumb leaf |
| `--body` | `#4B5563` | `#9CA3AF` | stock paragraph, tornillería note |
| `--title` | `#111827` | `#FFFFFF` | H1, H2 grid heading, card H3 |
| `--accent-text` / `--accent-kicker` | `#125D03` / `#23890C` | `#B4FE99` / `#4DF527` | links / `En almacén` label |
| `--panel` / `--panel-body` | `#0F2001` / `#E5E7EB` | `#061000` / `#E5E7EB` | closing panel |
| `--shadow` | `0 8px 24px rgba(17,24,39,.08)` | `0 8px 24px rgba(0,0,0,.6)` | card hover |
| `--h1` | 56px (≥1024) · 40px (768–1023) · 32px (<768) | same | H1 |
| `--gap` / `--pad` | 20px / 20px; <1024 gap 16px; <768 pad 16px | same | grid gap / page padding |
| `--cards` | `repeat(auto-fill,minmax(360px,1fr))`; <768 `minmax(260px,1fr)` | same | grid (today's classes already match) |
| `--hero` | `minmax(0,1fr) minmax(0,420px)`; <1024 `minmax(0,1fr)` | same | hero grid |
| `--feat` / `--feat-pad` | `minmax(0,1fr) 300px` / 52px; <1024 `1fr` / 32px; <768 pad 20px | same | featured panel |
| `--h2f` | 46px (≥1024) · 36px (768–1023) · 28px (<768) | same | featured Bohrcraft H2 (added 2026-09-28) |

### Sections, top to bottom (`src/features/BrandsPage/BrandsPage.tsx`)

1. **Breadcrumb** `<nav aria-label="Ruta">`: `Inicio` (link `/`) · `/` · `Marcas`. 13px, `--muted`, padding
   22px 0 26px.
2. **Hero** `<section>`, grid `--hero`, gap 48px, `align-items:center`, padding 24px 0 64px.
   - Left column (flex column, gap 20px, max-width 600px):
     - Pill kicker `Distribuidor directo`: 12px/600, uppercase, `.04em` tracking, bg `#4DF527`, text `#0D3401`,
       fully rounded, padding 6px 14px.
     - `<h1>Marcas que distribuimos</h1>`: `--h1`, line-height 1.05, weight 800, `-.02em`, `--title`.
     - Rule: 88×4px, radius 2px, `#4DF527`.
     - `<p>`: 17px, line-height 1.6, `--muted-strong`: «En más de 20 años abasteciendo a la industria poblana, hemos
       elegido trabajar con las marcas que resisten el uso exigente. Somos distribuidores directos: eso significa
       mejor precio, existencia real y respaldo técnico sobre cada herramienta que sale de nuestro almacén.»
   - Right column: `aspect-ratio:4/5`, full width (max 420px via the grid), radius 10px, `overflow:hidden`, bg
     `--subtle`. The image is the temp photo (see README).
3. **Featured panel**, Bohrcraft. Radius 18px, bg `#1B1C1F`, text `#F4F4F5`, padding `--feat-pad`, grid `--feat`,
   gap 48px, `align-items:end`, `overflow:hidden`. Hover (comp): `translateY(-4px)` plus
   `0 28px 56px rgba(255,106,26,.28)`.
   - Ring (≥1024 only): 260×260 circle, `border:40px solid #FF6A1A`, opacity .9, positioned right -60 / top -60.
   - Text column (gap 18px): kicker `Marca diferenciadora` (12px/700, uppercase, `.1em`, bg `#FF6A1A`, text
     `#1B1C1F`, radius 4px, padding 5px 10px) · `<h2>BOHRCRAFT — <span>Precisión alemana</span></h2>` (`--h2f`:
     46/36/28px, lh 1.02, weight 800, `-.03em`; the span is `#FF8A4C`) · `<p>` (16px, lh 1.6, `#B4B6BC`, max 620px): «Nuestra marca
     diferenciadora. Bohrcraft fabrica en Alemania brocas y machuelos de precisión para trabajos donde la tolerancia
     no admite error. Es una marca que la mayoría de los distribuidores de la región no maneja, y que nosotros
     tenemos disponible de forma directa.» · CTA pill `Ver catálogo Bohrcraft` plus a right arrow (52px tall,
     padding 0 26px, fully rounded, bg `#FF6A1A`, text `#1B1C1F`, 16px/700) → **`/marcas/bohrcraft`**.
   - Logo tile: white `#FFFFFF`, radius 12px, height 170px, padding 24px, `rotate(-2deg)`,
     `0 20px 40px rgba(0,0,0,.4)`, max-width 340px. Logo max-height 100px, `object-fit:contain`, alt `Bohrcraft`.
   - The H2 steps down at the same breakpoints as the H1: 46px (≥1024, Tailwind `lg:`), 36px (768–1023, `md:`),
     28px (<768, base). Claude Design's `_check-390.html` shows the panel at 390px in light and dark.
4. **Grid heading row** (flex, wrap, baseline, space-between, gap 12px, padding-top 72px):
   `<h2>El resto del catálogo</h2>` (30px, lh 1.15, weight 800, `-.02em`, `--title`) plus `Cada marca abre el
   catálogo filtrado` (14px, `--muted`).
5. **Grid** (`--cards`, gap `--gap`, padding-top 24px, stretch). Card (`BrandCard.tsx`): flex column, gap 14px,
   padding 20px, 1px `--border`, radius 14px, bg `--surface`. Hover: `--shadow`, `--border-strong`,
   `translateY(-2px)`.
   - Logo tile: height 96px, 1px `--border`, radius 10px, bg = `LOGO_BG[slug]`, padding 10px, logo centred,
     `object-fit:contain`, max 100% × 100%.
   - Name block (gap 5px): `<h3>` name (22px, lh 1.15, weight 800, `-.01em`, `--title`) plus origin (12.5px,
     `--muted`).
   - Identity `<p>`: 14.5px, lh 1.5, `--muted-strong`.
   - Stock block (gap 5px): `En almacén` (11px/600, uppercase, `.06em`, `--accent-kicker`) plus stock `<p>` (13px,
     lh 1.55, `--body`).
   - Tags: pills 11px, `--muted-strong`, 1px `--border`, fully rounded, padding 3px 9px, gap 6px.
   - CTA `Ver productos` plus a right arrow: `margin-top:auto`, radius 10px, bg `#4DF527`, text `#0D3401`,
     14.5px/600, full width → `BRAND_PAGE_HREFS[customId]`.
6. **Tornillería note**: 14px, lh 1.6, `--body`, max 760px, margin-top 28px. «La tornillería (tornillos, tuercas,
   pijas, rondanas, varilla) es de línea, sin marca: **búscala por categoría**.» The link is weight 600 and points to
   `CATEGORY_PAGE_HREFS.tornilleria`.
7. **Closing panel**: margin 56px 0 96px, bg `--panel`, radius 14px, padding 32px, flex wrap, gap 28px.
   `<h2>¿No ves tu marca?</h2>` (26px/700) · «El catálogo también se busca por categoría o directo por medida. Y si lo
   que usas no está aquí, mándanos la clave por WhatsApp.» (15px, `--panel-body`) · `Buscar por categoría` plus an
   arrow (46px, radius 10px, `#4DF527`/`#0D3401`, 15px/600) → `/categorias` · `Cotizar por WhatsApp` (46px,
   radius 10px, `1px rgba(255,255,255,.25)` border, transparent, white, 15px/500, hover `rgba(255,255,255,.1)`).
   This matches today's panel except for small size and weight differences.

### Brand data (comp `BRANDS` + `LOGO_BG`, mapped to real `customId`s)

| Order | `customId` | Display name (`BRAND_PAGES.name`) | Logo | `LOGO_BG` | Where |
| --- | --- | --- | --- | --- | --- |
| 1 | `weston` | WESTON | `weston-logo_cwahti.webp` (white) | `#141414` | grid |
| 2 | `king-tony` | KING TONY | `king-tony-logo_mdqyej.webp` (white) | `#d7141a` | grid |
| — | `bohrcraft` | BOHRCRAFT | `bohrcraft-logo_qhptej.webp` | white tile | **featured panel only** |
| 3 | `bondhus` | BONDHUS | `bhondus-logo_gun8z7.webp` | `#ffffff` | grid |
| 4 | `precision` | PRECISION BRAND | `precision-brand-logo_sylhpn.webp` | `#ffffff` | grid |
| 5 | `cleveland` | CLEVELAND | `cleveland-logo_l78txe.webp` (portrait) | `#ffffff` | grid |
| 6 | `volkel` | VÖLKEL | `volkel-logo_trxl3c.webp` (white) | `#003f7d` | grid |

Logo URLs (all `https://res.cloudinary.com/dov7g4avx/image/upload/` + the path below; all transparent WebP):

- `weston`: `v1790362301/weston-logo_cwahti.webp` (250×80)
- `volkel`: `v1790362300/volkel-logo_trxl3c.webp` (105×32)
- `precision`: `v1790362299/precision-brand-logo_sylhpn.webp` (260×70)
- `king-tony`: `v1790362298/king-tony-logo_mdqyej.webp` (288×76)
- `cleveland`: `v1790362298/cleveland-logo_l78txe.webp` (1902×2272)
- `bohrcraft`: `v1790362297/bohrcraft-logo_qhptej.webp` (173×105)
- `bondhus`: `v1790362297/bhondus-logo_gun8z7.webp` (250×64, misspelled upstream)
- Hero photo (temporary): `v1790362578/tehesa-temp-image_ujtodk.webp` (1787×880, opaque landscape storefront)

The comp's `origin`, `identity`, `stock`, and `tags` strings equal the current `BRAND_PAGES` values. A
field-by-field script comparison on 2026-09-27 found 28/28 matches.

### What changes vs. today (Story 1 build)

| Area | Today (`BrandsPage.tsx` / `BrandCard.tsx`) | v2 |
| --- | --- | --- |
| Kicker | `Catálogo` (green text) | `Distribuidor directo` (green pill) |
| H1 | `Explora el catálogo por marca`, 28/36/48px bold | `Marcas que distribuimos`, 32/40/56px extrabold, plus an 88px green rule |
| Intro | `Siete marcas en almacén. Entra a la tuya y filtra por medida.` | distributor paragraph (above) |
| Hero media | none | 4:5 store photo, right column |
| Counter row | `N marcas en almacén` · `Ordenadas por fondo de catálogo` | **removed**, replaced by `El resto del catálogo` · `Cada marca abre el catálogo filtrado` |
| Bohrcraft | normal card, 4th in grid | featured dark/orange panel, excluded from grid |
| Card | no logo, `<h2>` 18px | 96px logo tile, `<h3>` 22px extrabold |
| Order | `BRAND_PAGES` insertion (Weston, Völkel, King Tony, …) | design order (D2) |
| Link surface | CTA only | CTA only (D1; the comp's whole-card `<a>` is overridden) |

## Technical Research

### Affected areas

- `src/features/BrandsPage/BrandsPage.tsx`: server component. Hero, featured panel, grid heading, and order
  selection change. Tornillería note and closing panel stay.
- `src/features/BrandsPage/BrandCard.tsx`: logo tile, `<h3>`, spacing. The `BrandCardItem` type gains logo fields.
- `src/shared/constants/brand.constants.ts`: `BrandPageConfig` gains logo URL plus logo background (all seven,
  since Bohrcraft's logo is used by the panel). Add a home for the featured copy and the `/marcas` display order.
  Note the comment at line 29–30, which ties insertion order to the "Siete" hero copy. That copy is deleted by this
  story, so update the comment.
- `src/app/marcas/page.tsx`: today it builds `brands` from `Object.entries(BRAND_PAGES)` ∩ live ids. It may need to
  pass the featured brand separately or pass an ordered list. Metadata and JSON-LD are untouched.
- `__tests__/brands/BrandsPage.test.tsx`: 7 tests. Three pin copy that disappears (lines 68–87 counter/hero, 124–128
  empty-state counter). The fixture needs logo fields.
- `ai-skills/REPO_CONTEXT.md`: the `BrandsPage/` feature row (line 102) says "No logo slot, no product-count pill,
  no whole-card link" and "static 'Siete marcas...' intro". It must be updated after implementation.
- `ai-research/epics/brands-browsing.epic.md`: add Story 4 to the story list and status table.

**Not affected:** `src/features/Home/BrandStrip.tsx` iterates `Object.keys(BRAND_PAGES)` for its order. Reordering
`BRAND_PAGES` itself would silently reorder the Home strip (see UI/product I). Also not affected: `Header.tsx` /
`MobileMenu.tsx` (hrefs and labels only, no order dependency on this change), `/marcas/[slug]`, `sitemap.ts`,
`seo.constants.ts`.

### Existing patterns to follow

- Server component feature, `next/link` for internal links, a plain `<a target="_blank" rel="noopener noreferrer">`
  for WhatsApp. This is today's `BrandsPage.tsx`, so keep it.
- Editorial brand data is a `customId`-keyed frontend config, like `BRAND_PAGES` / `CATEGORY_PAGES`. Strapi `brand`
  has only `name`, `customId`, `products` (REPO_CONTEXT line 178), so logos cannot come from Strapi.
- Tailwind v4 arbitrary values for comp-specific hex (current files already do this). Use `dark:` variants for the
  dark theme and `lg:` / `md:` for the comp's two breakpoints.
- Images: plain `<img>` plus eslint-disable comment (`src/components/ProductCard.tsx:141`). Give intrinsic
  `width`/`height` to avoid CLS. Use `loading="lazy"` for grid logos. The hero photo is above the fold on desktop, so
  **don't lazy-load it**.
- Test rules: `docs/UNIT_TESTING_GUIDELINES.md` (not duplicated here).

### Verification rules

`pnpm test -- __tests__/brands/BrandsPage.test.tsx` while iterating, then full `pnpm test`, `pnpm lint`,
`pnpm exec tsc --noEmit`, `pnpm build`. Manual: `pnpm dev`, `/marcas` at ~390px and ~1440px in light and dark,
compared side by side with the comp opened from the snapshot folder or the Claude Design link. No `pnpm install`,
because there are no new deps.

### Dependencies / integration points

None new. Images load from `res.cloudinary.com` at runtime, the same host `ProductCard` already uses. No env var
changes. `NEXT_PUBLIC_WHATSAPP_NUMBER` gating is unchanged.

### Edge cases and constraints

- **Bohrcraft not live** → no panel, and the grid shows the remaining brands. **Only Bohrcraft live** → panel plus
  no heading row and no grid (D10: the heading is hidden when the grid is empty).
- **Zero live brands** → D6 empty state. The featured panel is absent too.
- **Logo fails to load** → the tile keeps its `LOGO_BG` and the `<h3>` still names the brand, so nothing is lost.
  There is no fallback UI in the comp, and none is required.
- **White logos** (Weston, King Tony, Völkel) disappear if `LOGO_BG` is dropped or replaced by the theme surface.
  `LOGO_BG` must be applied in both themes.
- **Völkel's logo is 105×32 px**, so it will look soft or small in a 96px tile. It is an asset quality issue, not a
  code issue. The URL is used verbatim, so note it in manual QA (D11).
- **Cleveland's logo is 1902×2272 px / 28 KB** for a ~76px-tall slot. The URL is used verbatim, and the size is
  accepted (D11).
- **Hero photo is landscape 1787×880** in a 4:5 frame. `object-cover` keeps the full height and a 704px-wide strip
  (~39% of the width). That covers the whole facade, including the "TEHESA INDUSTRIAL" sign. The Truper signage stays in frame, which is
  accepted for a temporary photo (UI/product II: `object-position` ≈ `44% 50%`).
- **Strapi `Volkel` / `Clevaland` names never reach this page**, because display names come from `BRAND_PAGES.name`.
- **2-column grid at `max-w-6xl`**: 6 cards give 3 rows × 2 columns instead of the comp's 2 × 3.

## Open Questions

### UI/product decisions

- I: Question: Where does the "design order" live? The options are reordering `BRAND_PAGES` (which also reorders
  Home's `BrandStrip`) or adding a `/marcas`-only order list and leaving `BRAND_PAGES` / `BrandStrip` as they are.
  - Status: answered
  - Answer: Use a separate, `/marcas`-only order (user, 2026-09-27). `BRAND_PAGES` insertion order stays as it is
    and keeps driving Home's `BrandStrip`. The new order is Weston, King Tony, Bondhus, Precision, Cleveland,
    Völkel, with `bohrcraft` as the featured id outside that list.
  - Context: `BrandStrip.tsx:16` reads `Object.keys(BRAND_PAGES)`, so reordering the shared map would have moved the
    Home strip too. AC4 ("`BrandStrip` order unchanged") holds as written.
- II: Question: Which hero photo ships, and how is it cropped into the 4:5 frame?
  - Status: answered
  - Answer: Use the temporary Cloudinary store photo
    (`https://res.cloudinary.com/dov7g4avx/image/upload/v1790362578/tehesa-temp-image_ujtodk.webp`) (user,
    2026-09-27). Crop with `object-cover` and `object-position` ≈ `44% 50%`, which centres the storefront facade.
    Replacing the photo later should only mean changing the URL (plus the alt text, see IV).
  - Context (corrected 2026-09-27): the earlier note that a centre crop "loses TEHESA INDUSTRIAL" was **wrong**.
    `object-cover` into 4:5 scales the 1787×880 photo to full height and keeps a 704px-wide vertical strip, so the
    whole "TEHESA INDUSTRIAL" sign stays visible. A centre crop (x 541–1245) also clips the facade's left edge. At
    44% (x ≈ 477–1181) the black sign, orange facade, both "TRUPER" signs, and both worker illustrations are framed.
    Previews: `comps/…/pagina-marcas-v2/assets/crop_center.png` and `crop_p45.png` (local-only). The Truper
    branding stays in frame whichever crop is used. That is accepted, since the photo is temporary.
- III: Question: Keep the repo-wide `max-w-6xl` container (2-column grid) or widen `/marcas` to the comp's 1400px
  frame (3-column grid)?
  - Status: answered
  - Answer: Keep `max-w-6xl` (user, 2026-09-27). The grid shows 2 columns on desktop (6 cards → 3 rows).
  - Context: Every route uses `max-w-6xl p-4 md:p-5`. Story 1 made the same call against a 1400px comp frame.
- IV: Question: What alt text should the hero photo have?
  - Status: answered
  - Answer (recommendation, per user's request, 2026-09-27): descriptive `alt="Fachada de la tienda Tehesa
    Industrial en Puebla"`.
  - Context: The photo is the only element on the page showing Tehesa is a real, physical distributor, so it carries
    meaning and should not be `alt=""`. The alt names what is actually shown (the storefront), not the design's
    intended future subject (a workshop scene). The alt must change when the real photo replaces it. Keep the alt
    string next to the URL in one constant so the two can't drift.
- V: Question: The featured H2 is 46px in the comp with no mobile override. Should it scale down below 768px?
  - Status: answered
  - Answer: Yes. Claude Design added the `--h2f` token (2026-09-28): 46px at ≥1024px, 36px at ≤1023px, 28px at
    ≤767px, set in the same `:root` media queries as `--h1`, and the H2 now uses `font-size:var(--h2f)`. Nothing else
    in `pagina-marcas v2.dc.html` changed (re-imported and diffed 2026-09-28; `support.js` / `image-slot.js`
    byte-identical). The project also has a new `_check-390.html`, which shows the page in two 390×900 iframes
    (`?theme=light` and `?theme=dark`), saved to the snapshot folder.
  - Context: at 46px/800 the heading wrapped to about 4 lines in a ~310px content box (390px viewport).
  - Prompt that was sent to Claude Design (kept for the record):

    ```text
    In pagina-marcas v2, the featured Bohrcraft panel's <h2> ("BOHRCRAFT — Precisión alemana") is a fixed
    46px / weight 800 at every width, while the page H1 steps down 56 → 40 → 32px at the 1023px and 767px
    breakpoints. At a 390px phone width the panel's content box is ~310px wide, so the H2 wraps to about 4 lines.
    Please define the H2's size at ≤1023px and ≤767px (add it to the :root media queries like --h1), and show the
    panel at 390px in light and dark so I can check the wrap. Don't change anything else on the page.
    ```

    Done 2026-09-28: the "Featured panel" spec, the token table, and D12 are updated, and the snapshot is
    re-imported.
- VI: Question: Hide the `El resto del catálogo` heading row when the grid would be empty (only Bohrcraft live)?
  - Status: answered
  - Answer: Yes, hide it (user, 2026-09-27). With Bohrcraft live and no other brand, the page renders hero → panel →
    tornillería note → closing panel. With zero brands live, the D6 empty state replaces the grid and the heading is
    not rendered either.
- VII: Question: Should the supplied Cloudinary URLs be used verbatim, or with transform parameters (e.g. `w_…`) to
  shrink Cleveland (1902×2272) and ask for a sharper Völkel (105×32)?
  - Status: answered
  - Answer (recommendation, per user's request, 2026-09-27): use all eight URLs **verbatim**, with no transform
    parameters. Give each `<img>` its intrinsic `width`/`height` from the Brand data table so the browser reserves
    the right aspect ratio.
  - Context: Cleveland's 28 KB is too small to justify changing the asset contract in a presentation story. Völkel's
    105×32 source will look soft in the 96px tile. That is an asset-quality issue for whoever owns the Cloudinary
    library, not a code change. Note it for manual QA, and re-point the URL when a sharper file exists.
- VIII: Question: Whole-card link vs CTA-only?
  - Status: answered
  - Answer: CTA-only, for both cards and the Bohrcraft panel (user, 2026-09-27). See D1.
- IX: Question: Card order?
  - Status: answered
  - Answer: Design order (user, 2026-09-27). See D2 and question I for where it lives.
- X: Question: Can the hero and Bohrcraft business claims ship as written?
  - Status: answered
  - Answer: Yes, confirmed (user, 2026-09-27). See D7.
- XI: Question: How should the landscape temp photo be handled against the 4:5 slot?
  - Status: answered
  - Answer: Keep 4:5, use the photo, and flag it as temporary (user, 2026-09-27). See D3 and question II.

### Strapi contract

- I: Question: Does Strapi hold brand logos or brand colors?
  - Status: answered
  - Answer: No. `brand` has only `name`, `customId`, `products`.
  - Context: Verified 2026-09-14 and 2026-09-17 (backend repo plus live introspection), recorded in
    `ai-skills/REPO_CONTEXT.md` line 178. Logos and colors are frontend config. Not re-delegated, because this story
    adds no Strapi reads.

### Verification

- I: Question: Can the redesigned page be compared against the comp without the Claude Design MCP?
  - Status: answered
  - Answer: Yes. Open `comps/brands-browsing/design-source/pagina-marcas-v2/pagina-marcas v2.dc.html`, served from
    that folder so `support.js` / `image-slot.js` resolve, or use the Claude Design link. Append `?theme=dark` to
    force dark mode (comp `componentDidMount`). Grid logos in the local copy point at `assets/logos/<slug>.png`,
    which are not in the snapshot, so they appear broken locally. Compare logos against `assets/cloudinary/` instead.

## Assumptions

- The v2 comp is final for this story, so no design-agent brief is written.
- Header, mobile menu, and brand pages are untouched, and the comp's header markup is ignored (Story 1 precedent).
- The `BRAND_PAGES` card copy is unchanged, because the comp matches it.
- `BRANDS_TITLE` / `BRANDS_DESCRIPTION` stay as they are. The comp carries no metadata.
