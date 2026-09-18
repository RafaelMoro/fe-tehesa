# Brands Index Page (`/marcas`) — Research (Story 1 of `brands-browsing`)

**Date:** 2026-09-17
**Branch:** `feat/add-brand-page`
**Epic:** `ai-research/epics/brands-browsing.epic.md`
**Scope:** single story, ~3 phases
**Design source:** Claude Design project "Tehesa UI mocks v1"
(https://claude.ai/design/p/4b99241e-42ab-4ca4-ac4e-c1cd49a75385):

- `pagina-marcas.dc.html` — the `/marcas` page of record (light + dark via `data-theme`; breakpoints at 1024 / 768).
  Its inline header is stale — **ignore it** (user instruction).
- `header.dc.html` — the header of record: `Marcas` dropdown (desktop ≥1024, tablet) and mobile accordion each end
  with a `Ver todas las marcas` row → `allBrandsHref` (`/marcas`), styled exactly like the existing `Ver todas las
  categorías` row. Brand rows remain inert (`mkList(BRANDS, null)`).
- `support.js`, `image-slot.js` — Claude Design runtime only. `image-slot` backs the card logo slot, which the comp
  ships **off** (`showLogos` default `false`).

## Story Definition

### Title

Add a `/marcas` index page presenting the six brands Tehesa stocks as editorial cards, and link to it from the
header's `Marcas` dropdown / mobile accordion with a `Ver todas las marcas` row.

### Description

Today a buyer can only reach a brand through the catalog filter `/?mode=brand&brand=<name>` (from the search drawer),
and the header's `Marcas` menu lists brands as disabled rows. This story adds the brand index and its header entry
point, following the `/categorias` story (`ai-research/categories-page.story.md`) closely enough that most of the code
is a copy of `CategoriesPage`/`CategoryCard`/`Header`'s `allHref` path:

- **Header (all breakpoints, both themes).** The `Marcas` desktop dropdown and mobile-menu `Marcas` accordion gain a
  final, separated `Ver todas las marcas` row → `/marcas`, using the very same `allHref` prop the `Categorías`
  instances already pass. The `Marcas` trigger gets the active underline / accordion highlight on `/marcas*`, as
  `Categorías` does on `/categorias*`. Brand rows stay `isDisabled` (they flip on in Story 2).
- **`/marcas` page.** Breadcrumb `Inicio / Marcas`; hero (kicker `Catálogo`, H1 `Explora el catálogo por marca`, intro
  `Seis marcas en almacén. Entra a la tuya y filtra por medida.`); a counter row (`{N} marcas en almacén` /
  `Ordenadas por fondo de catálogo`); a responsive grid of brand cards, each with name, origin line, one-line identity,
  an `En almacén` kicker + stock summary, tag pills and a full-width green `Ver productos` CTA; a one-line note that
  tornillería is unbranded and links to the Tornillería category page; and a dark closing panel `¿No ves tu marca?`
  with `Buscar por categoría` (→ `/categorias`) and `Cotizar por WhatsApp` (brand-specific prefill).
- **Decisions already taken with the user** (see Decision record): per-brand pages (`/marcas/[slug]`) are Story 2,
  so card CTAs render **disabled** now; the card's editorial copy is **hardcoded** frontend config (Strapi's brand
  has only `name`/`customId`); the closing panel stays with a **new brand-specific WhatsApp message**.

### Acceptance criteria

1. **Header entry point.** On every route, the `Marcas` dropdown (≥ `md`) and the mobile menu's `Marcas` accordion end
   with a `Ver todas las marcas` row — a real `next/link` anchor to `/marcas`, separated from the disabled brand rows
   above it (border-top + tinted background, light and dark, identical to the `Ver todas las categorías` row).
   Selecting it closes the dropdown / drawer. The row is **not rendered on `/marcas`**. Brand rows stay `isDisabled`.
   When the brand taxonomy is empty (Strapi failure) the dropdown/accordion is not rendered at all — unchanged — so
   the row isn't either.
2. **Active state.** On `/marcas` (and any future `/marcas/*`) the desktop `Marcas` trigger carries the active
   underline (`border-b-2 border-[#4DF527]` + sr-only ` (actual)`), and the mobile `Marcas` accordion trigger gets the
   same highlight `Categorías` gets on `/categorias*`. `Productos` and `Categorías` are not active there.
3. **Page structure.** `GET /marcas` is a server-rendered route (`src/app/marcas/page.tsx`) that fetches
   `fetchBrands()` and renders, inside one `<main>`: a breadcrumb `nav[aria-label="Ruta"]` (`Inicio` → `/`; `Marcas`
   plain text with `aria-current="page"`), the hero, the counter row, the card grid, the tornillería note and the
   closing panel. Cards are rendered for the brands in `BRAND_PAGES` **that also exist in the live taxonomy**
   (matched on `customId`), in `BRAND_PAGES` insertion order (= comp order = product count desc). The hero intro and
   counter use the rendered count (`{N} marcas en almacén`; `Seis` in the comp is that number spelled out — render
   the digit, see UI IV). Zero renderable brands → a Spanish empty-state line, no grid.
4. **Brand card.** An `<article>` with `<h2>` = config `name` (comp spelling, uppercase as designed — never the raw
   Strapi name), origin line, identity paragraph, `En almacén` kicker + stock paragraph, tag pills (`aria-hidden`-free
   plain text; a `<ul>` if the planner prefers), and a `Ver productos` CTA that is a `next/link` when
   `BRAND_PAGE_HREFS[customId]` is defined, otherwise a non-focusable `<span aria-disabled="true">` styled per the
   comp. No logo slot, no product-count pill (comp renders neither).
5. **Closing panel + note.** The note `La tornillería (…) es de línea, sin marca: búscala por categoría.` links to
   `CATEGORY_PAGE_HREFS.tornilleria`. The panel's `Buscar por categoría` links to `/categorias`; `Cotizar por
   WhatsApp` is `buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_BRANDS_MESSAGE)` (new constant), `target="_blank"
   rel="noopener noreferrer"`, and is **hidden** when `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset (never throws).
6. **SEO.** `generateMetadata` returns `BRANDS_TITLE` / `BRANDS_DESCRIPTION` (new `seo.constants.ts` entries),
   canonical `/marcas`, `robots: { index: true, follow: true }`; a 2-item `BreadcrumbList` JSON-LD via `toJsonLdHtml`;
   `sitemap.ts` lists `/marcas` as a base page (survives a taxonomy outage).
7. **Tests.** Header row + active state (`__tests__/shared/Header.test.tsx` pattern), page/feature rendering (cards,
   disabled CTA, empty state, WhatsApp gating), metadata + sitemap entry. Follow `docs/UNIT_TESTING_GUIDELINES.md`.

### Task breakdown (for the planner)

1. **Header** — `Header.tsx`: `isBrands = pathname.startsWith("/marcas")`, `isBrandsIndex = pathname === "/marcas"`;
   the `Marcas` `TaxonomyDropdown` gets `allHref={isBrandsIndex ? undefined : "/marcas"}`, `isActiveRoute={isBrands}`,
   and the `allHref` label must become a prop (today it is the hardcoded string `Ver todas las categorías` and
   `id="ver-todas"`). Same for `MobileMenu`'s `TaxonomyAccordionSection` (`brandsAllHref`, `isActiveRoute`). Tests.
2. **Constants + route + feature** — `src/shared/constants/brand.constants.ts` (`BRAND_PAGE_HREFS: Record<string,
   string>` = `{}` for now, `BRAND_PAGES: Record<string, BrandPageConfig>` with the six comp entries),
   `WHATSAPP_BRANDS_MESSAGE`, `BRANDS_TITLE`/`BRANDS_DESCRIPTION`; `src/app/marcas/page.tsx` (server shell: metadata,
   `fetchBrands()`, config∩taxonomy, JSON-LD, `<main>`); `src/features/BrandsPage/{BrandsPage,BrandCard}.tsx` as
   server components (no client state needed).
3. **Sitemap + docs** — `sitemap.ts` base entry; `ai-skills/REPO_CONTEXT.md` / `CLAUDE.md` route inventory; tests.

## Design Agent Handoff

**No design-brief file is produced for this story.** Both surfaces are fully designed in the Claude Design project
(every breakpoint, light + dark). Export PNGs via `/check-design` into `comps/brands-index-page/`:
`header.dc.html` desktop + mobile with the `Marcas` dropdown/accordion open (light + dark), and
`pagina-marcas.dc.html` at 390 and 1440 (light + dark).

### User goal, and what this is not

A buyer who buys by brand ("I use Bohrcraft bits", "we standardised on King Tony") wants to see which brands Tehesa
stocks, what each one is good for, and jump into that brand's inventory. This page is an **editorial index of six
brands**; it is not a product listing, not a search or filter surface, and — until Story 2 — not a navigation hub
(its cards are inert). It never fetches products and never adds a catalog `mode`.

### Surface index

| Surface | File | States | Brief |
| --- | --- | --- | --- |
| `Marcas` dropdown footer row | `src/shared/ui/organisms/Header.tsx` | default, hover, focus-visible, light/dark, hidden on `/marcas`, not rendered when taxonomy empty | — (comp done) |
| `Marcas` accordion footer row | `src/shared/ui/organisms/MobileMenu.tsx` | same, ≥44px tall | — |
| `Marcas` trigger active state | `Header.tsx` / `MobileMenu.tsx` | on `/marcas*` vs elsewhere | — |
| Breadcrumb | `src/features/BrandsPage/BrandsPage.tsx` | single | — |
| Hero + counter row | `BrandsPage.tsx` | H1 48/36/28px by breakpoint; counter row is a flex row with the sort label right-aligned | — |
| Brand card | `src/features/BrandsPage/BrandCard.tsx` | default, hover (shadow + border + `translateY(-2px)`), focus ring, CTA disabled; later CTA enabled; logo slot **off** | — |
| Tornillería note | `BrandsPage.tsx` | single, link to Tornillería category page | — |
| `¿No ves tu marca?` panel | `BrandsPage.tsx` | WhatsApp number set / unset (secondary button hidden) | — |
| Empty state | `BrandsPage.tsx` | zero renderable brands | — (no comp; copy in UI V) |

### Rules that override design instinct

- Never render `href="#"` or a dead `<button>` for the card CTA while `/marcas/<slug>` does not exist — use the
  non-focusable `<span aria-disabled="true">` pattern (`Home.tsx` pagination, `CategoryCard`).
- Never show the raw Strapi brand name (`Clevaland`) or a Strapi-derived count on this page; all card text is
  frontend config. Never invent a logo, stock level or price.
- The page uses the shared `Header` from the root layout; it must not render a second header/utility bar (the comp's
  inline header is stale).
- The counter is the number of cards actually rendered, never a hardcoded `6`.

### Implementation-facing constraints

**Responsive.** Class-only (`md:`/`lg:`); `useMediaQuery` returns `false` on the server. Comp: card grid
`repeat(auto-fill, minmax(360px,1fr))` ≥768 / `minmax(260px,1fr)` below, gap 20/16px; H1 48px ≥1024, 36px ≥768,
28px below; page padding 20/16px; closing panel is `flex-wrap` with the buttons wrapping under the copy on narrow
widths. Header breakpoint stays `md` (header-navigation story D3).

**Accessibility.** Breadcrumb `<nav aria-label="Ruta">`, `aria-current="page"` on `Marcas`. Cards `<article>` +
`<h2>`; the whole card is **not** a link (the comp wraps the card in `<a>`, but with a disabled CTA that would be a
dead link — keep the CTA as the only interactive element, as `CategoryCard` does; revisit in Story 2). Dropdown
footer row: react-aria `MenuItem` strips `aria-current` (known gotcha) — active state lives on the trigger. Rows ≥44px.
External WhatsApp link: `target="_blank" rel="noopener noreferrer"`.

**Visual patterns.** Same palette as `/categorias`: kicker `#23890C` / dark `#4DF527`; tint `#F5FFEF` / dark
`#12250A`–`#16300A`; borders `default-200` / dark `#1E3608`; card `rounded-[14px]`, hover shadow + stronger border;
CTA fill `#4DF527` text `#0D3401` hover `#3BD11A` (`DESIGN.md:110-112`); tag pills 11px, 1px border, `rounded-full`;
closing panel `bg-[#0F2001]` text white, secondary button `border-white/25` hover `bg-white/10`. `pnpm design:lint`
only if `DESIGN.md` changes (none expected).

**Content.** Spanish copy from the comp verbatim. Per-brand config (`BRAND_PAGES`), in this order:

| `customId` | `name` | `origin` | `identity` | `stock` | `tags` |
| --- | --- | --- | --- | --- | --- |
| `weston` | WESTON | Monterrey, México · +30 años | La marca mexicana para la industria; la línea más amplia del almacén. | Cortadores verticales de acero A.V., cobalto y carburo, brocas y broqueros, machuelos y rimas, avellanadores, calibradores de cuerda, limas rotativas y diamantadas, clamps y discos de corte. | Cortadores, Brocas, Machuelos, Discos |
| `king-tony` | KING TONY | Taichung, Taiwán · desde 1976 | Apriete profesional bajo norma DIN y ANSI. | Dados de 1/2" en estrella, bristol, torx, ribe y spline, dados de impacto, matracas, llaves combinadas de matraca, llaves de golpe y de gancho, pinzas de presión y martillos. | Dados, Matracas, Llaves, Pinzas |
| `bohrcraft` | BOHRCRAFT | Remscheid, Alemania · desde 1975 | Herramienta de corte alemana para trabajos de tolerancia cerrada. | Brocas de acero A.V., cobalto y carburo sólido TiAlN, juegos de brocas, machuelos A.V., BSP, NPT y STI, dados de tarraja, insertos roscados y kits reparadores de rosca. | Brocas, Machuelos, Tarrajas, Roscas |
| `bondhus` | BONDHUS | Monticello, Minnesota · desde 1964 | Inventor de la llave hexagonal de punta de bola; hecha en EUA con garantía de por vida del fabricante. | Llaves hexagonales milimétricas y estándar, cortas y largas, punta de bola, y llaves Torx cortas y largas. | Hexagonales, Punta de bola, Torx |
| `precision` | PRECISION BRAND | Downers Grove, Illinois · desde 1940 | Laina de acero para alinear maquinaria, montar motores y bombas y ajustar troqueles. | Rollos en acero azul templado, acero al carbón y acero inoxidable — 6" × 50" y 100", 150 mm × 1.25 m y 2.5 m — en varios espesores. | Laina, Alineación, Troqueles |
| `cleveland` | CLEVELAND | Cleveland Twist Drill, EUA · desde 1876 | Ciento cincuenta años haciendo herramienta de corte. | Buriles cuadrados de cobalto y buriles K-42 en 35 medidas, juegos de machuelos AAC y AAV y machuelos NPT. | Buriles, Cobalto, Machuelos |

Page strings: kicker `Catálogo`; H1 `Explora el catálogo por marca`; intro `{N} marcas en almacén. Entra a la tuya y
filtra por medida.`; counter `{N} marcas en almacén` / `Ordenadas por fondo de catálogo`; card kicker `En almacén`;
CTA `Ver productos`; note `La tornillería (tornillos, tuercas, pijas, rondanas, varilla) es de línea, sin marca:
búscala por categoría.`; panel H2 `¿No ves tu marca?`, body `El catálogo también se busca por categoría o directo
por medida. Y si lo que usas no está aquí, mándanos la clave por WhatsApp.`, buttons `Buscar por categoría` /
`Cotizar por WhatsApp`; header row `Ver todas las marcas`. WhatsApp prefill (comp): `Hola, busco una marca que no veo
en el catálogo de Tehesa: `. Number formatting: `Intl.NumberFormat("es-MX")` (single digit here, but stay consistent
with `CategoryCard`); never `formatNumberToCurrency`.

**Out of scope.** `/marcas/[slug]` pages, `fetchAllProductsByBrand`, enabling card CTAs / header brand rows (Story 2);
brand logos (`showLogos` off; Strapi has no media); per-brand product-count pills or live ordering (D5); fixing the
`Clevaland` typo in Strapi; redirecting `/?mode=brand` URLs; the comp's stale inline header.

### Decision record

- **D1 — Per-brand pages are Story 2; card CTA disabled now.** Decided (user, 2026-09-17). Rejected: linking to
  `/?mode=brand&brand=<name>` (throwaway later) and emitting `/marcas/<slug>` before it exists (404s). Mechanism:
  `BRAND_PAGE_HREFS` map, empty in this story — the same gate `CategoryCard`/`Header` use for categories.
- **D2 — Card copy is hardcoded frontend config; only configured brands render.** Decided (user): `BRAND_PAGES`
  keyed by `customId`, comp copy verbatim. Consequence (assumed, confirm in UI I): a brand with no config entry —
  today `Marca Libre` (`libre`, 107 tornillería products) — does **not** get a card; the tornillería note covers it.
  A configured brand missing from the live taxonomy is also dropped, so a Strapi deletion never leaves a ghost card.
- **D3 — Header changes are in this story.** Decided (user, supplied `header.dc.html`): `Ver todas las marcas` row
  + active state now; brand rows stay disabled until Story 2.
- **D4 — Closing panel kept, new `WHATSAPP_BRANDS_MESSAGE`.** Decided (user). Same `buildWhatsappUrl` /
  `WHATSAPP_NUMBER` gating as the header. The hero-side `WhatsappPanel` used by `/categorias` is **not** rendered on
  `/marcas` (the comp has no side panel; one WhatsApp CTA per page).
- **D5 — Card order = `BRAND_PAGES` insertion order; no count query.** Assumed (confirm in UI II): the comp order is
  the live product-count order (90/26/19/13/6/5), so a per-brand `products_connection` count query would only
  reproduce a constant. `Ordenadas por fondo de catálogo` remains true by editorial maintenance. Upgrade path if the
  user wants it live: a brand twin of `fetchCategoryProductCounts` (same aliased-connection query with
  `brand.customId.eq`), sort desc, and drop the `products > 0` ones — the comp's own filter.
- **D6 — Whole-card link dropped for now.** Assumed: the comp's card is one big `<a>`; with the CTA disabled that
  would be a dead link. Card is an `<article>`, CTA is the only control (as `CategoryCard`). Story 2 may promote the
  card to a link.
- **D7 — `/marcas` is `index, follow` and in the sitemap.** Assumed, mirroring `/categorias` D7.
- **D8 — Display name is the config `name`, uppercase as designed.** Assumed: the comp renders `WESTON`, `PRECISION
  BRAND`, `CLEVELAND`; Strapi has `Weston`, `Precision`, `Clevaland`. Config wins; also sidesteps the typo.

## Technical Research

### Affected areas

- **Routes/pages:** new `src/app/marcas/page.tsx` (server, `generateMetadata`, JSON-LD, `<main>`). No `error.tsx` /
  `loading.tsx` of its own — the app-level `src/app/error.tsx` / `loading.tsx` cover it like they do `/categorias`
  (which has a folder-level pair only because `[slug]` sits under it).
- **Feature UI:** new `src/features/BrandsPage/{BrandsPage,BrandCard}.tsx` — server components (no hooks), same shape
  as `src/features/CategoriesPage/`.
- **Shared UI:** `src/shared/ui/organisms/Header.tsx` (`TaxonomyDropdown` footer row label/id become props;
  `isBrands`, `isBrandsIndex`; `Marcas` instance gets `allHref`/`isActiveRoute`), `MobileMenu.tsx`
  (`TaxonomyAccordionSection` likewise; new `brandsAllHref`, `isBrands` props).
- **Shared constants:** new `src/shared/constants/brand.constants.ts` (`BRAND_PAGE_HREFS`, `BrandPageConfig`,
  `BRAND_PAGES`); `whatsapp.constants.ts` (`WHATSAPP_BRANDS_MESSAGE`); `seo.constants.ts` (`BRANDS_TITLE`,
  `BRANDS_DESCRIPTION`).
- **Sitemap:** `src/app/sitemap.ts` — push `/marcas` next to `/categorias`.
- **Data:** `fetchBrands()` only — already exists, already called by the root layout. **No new query, no new server
  action, no API route.**
- **Tests (root `__tests__/`):** `shared/Header.test.tsx` (row + active state, both breakpoints), new
  `features/BrandsPage.test.tsx` and `app/marcas.test.tsx` mirroring the `/categorias` tests, `app/sitemap.test.ts`.
- **Docs:** `ai-skills/REPO_CONTEXT.md` (route table, feature table, key files, sitemap line), `CLAUDE.md` "What
  This Is" one-liner.

### Existing patterns to follow

- `src/app/categorias/page.tsx` → `src/features/CategoriesPage/CategoriesPage.tsx` / `CategoryCard.tsx`: server
  shell + server feature, breadcrumb markup, hero classes, grid `[grid-template-columns:repeat(auto-fill,minmax(…))]`,
  `aria-disabled` CTA fallback, `Intl.NumberFormat("es-MX")`.
- `CATEGORY_PAGE_HREFS` / `CATEGORY_PAGES` in `category.constants.ts` — copy the shape for `BRAND_PAGE_HREFS` /
  `BRAND_PAGES`; `CategoryPageConfig` → `BrandPageConfig { name, origin, identity, stock, tags }`.
- `Header.tsx` `TaxonomyDropdown`'s `allHref` row and `MobileMenu.tsx`'s equivalent — the only header change is
  parameterising the row's label (`Ver todas las marcas`) and `id`, then passing `allHref`/`isActiveRoute` on the
  `Marcas` instances. `isCategoriesIndex`/`isCategories` → add `isBrandsIndex`/`isBrands`.
- WhatsApp: `buildWhatsappUrl(WHATSAPP_NUMBER, …)` + null-gating exactly as `WhatsappPanel.tsx` / `Header.tsx`.
- Server actions stay in `global.lib.ts`; the page calls `fetchBrands()` directly (server component), never an API
  route. Keep "throw at the boundary": a `fetchBrands()` rejection propagates to `src/app/error.tsx`, as
  `/categorias` does for `fetchCategories()`.
- Root layout already calls `fetchBrands()` per request for the header; the page will call it again (per-call Apollo
  client, no dedupe) — same accepted duplication `/categorias` has with `fetchCategories()`.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` at the end of each phase.
- `pnpm test -- __tests__/shared/Header.test.tsx` etc. for targeted runs; `pnpm test` before the PR.
- Manual: `/marcas` light/dark at 390 and 1440 against the comps; header dropdown/accordion with the row; the row
  hidden on `/marcas`; WhatsApp button gone with `NEXT_PUBLIC_WHATSAPP_NUMBER` unset; `/sitemap.xml` contains
  `/marcas`.
- PR label: `minor` (new route + header change).

### Dependencies / integration points

- No new dependencies. HeroUI `Dropdown`/`Accordion` already carry the row pattern; `@remixicon/react`
  `RiArrowRightLine` for the CTA arrow.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` optional (hidden when unset). `STRAPI_HOST` / `STRAPI_API_TOKEN` required for
  `fetchBrands()` — without them the page reaches `error.tsx`, same as `/categorias`.

### Edge cases and constraints

- **Config ∩ taxonomy.** `BRAND_PAGES` has six entries; Strapi has seven brands. Render only the intersection, in
  config order. If Strapi someday adds a brand, it stays invisible until a config entry is written (D2) — that is the
  intended editorial gate, mirrored on the tornillería note for `libre`.
- **Empty taxonomy** (`fetchBrands()` resolves `[]`): the header hides the `Marcas` menu entirely (existing
  behaviour), and the page renders the hero + empty-state line + note + panel with `0 marcas en almacén`. Rejection
  (network/env) → `error.tsx`.
- **Header row hidden on `/marcas`** but the active underline shows there — same split as `/categorias`.
- **`aria-current` stripped by react-aria `MenuItem`** — active state on the trigger only (known gotcha).
- **Count wording.** `1 marcas en almacén` is wrong Spanish; pluralise (`1 marca` / `N marcas`) as `CategoryPage`'s
  filtered count already does.
- **Sitemap already lists `/?mode=brand&brand=<name>` for all seven brands** (including `Marca Libre` and
  `Clevaland`). Untouched here; Story 2 decides their fate.
- **No `product_variants`, no prices, no counts** are fetched — this page cannot regress the catalog's Strapi load.

## Open Questions

### Strapi contract

- I: Question: What brands exist, with which `customId`s and product counts, and can products be filtered by
  `brand.customId`?
  - Status: answered (backend-research subagent, 2026-09-17, backend repo + live GraphQL)
  - Answer: 7 published brands — Weston `weston` (90), King Tony `king-tony` (26), Bohrcraft `bohrcraft` (19),
    Bondhus `bondhus` (13), Precision `precision` (6), Clevaland `cleveland` (5), Marca Libre `libre` (107, all
    Tornillería); 67 products carry no brand. `ProductFiltersInput.brand` is `BrandFiltersInput` with `customId:
    StringFilterInput` (`eq` works).
  - Context: counts via aliased `products_connection(filters: { brand: { customId: { eq } } }, pagination: { pageSize: 1
    }) { pageInfo { total } }`; schema at `store-tehesa-api/src/api/brand/content-types/brand/schema.json`.
- II: Question: Does `brand` carry any field beyond `name`/`customId`/`products` (logo, description, origin, order)?
  - Status: answered
  - Answer: No. All card copy is frontend config; no logo is possible (matches the product-image precedent).
- III: Question: Should the Strapi brand name `Clevaland` be corrected?
  - Status: pending (backend judgment; out of this repo's scope)
  - Context: The card shows the config name, so the typo is invisible on `/marcas`, but `/?mode=brand&brand=Clevaland`
    and its sitemap entry expose it today.

### Catalog behavior

- I: Question: Should `/marcas` call `fetchBrands()` at all, given the cards are config-driven?
  - Status: answered (assumption, confirm)
  - Answer: Yes — one cheap query, so a brand deleted/unpublished in Strapi drops off the page automatically and
    the counter stays honest. Rejected: rendering config alone (page could list a brand the store no longer carries).

### UI/product decisions

- I: Question: Confirm `Marca Libre` (`libre`) gets **no** card and is covered only by the tornillería note.
  - Status: pending
  - Context: Comp shows six brands and says "Seis marcas en almacén"; `libre` has 107 products, all Tornillería. D2's
    "only configured brands render" hides it by omission. Alternative: an explicit `HIDDEN_BRANDS` list — more code
    for the same result.
- II: Question: Confirm order = config order (no live count query) — D5.
  - Status: pending
  - Context: Comp order already equals live count-desc order. A live query costs one aliased request per page load
    and a sort; only worth it if counts are expected to reshuffle brands.
- III: Question: The comp's card is one large `<a>`; with the CTA disabled, keep the card inert and the CTA as the
  only control (D6)?
  - Status: pending
- IV: Question: Hero intro says `Seis marcas en almacén` — render the live digit (`6 marcas en almacén`) or spell it
  out?
  - Status: pending
  - Explanation: Spelling out requires a number-to-words map that breaks the moment a seventh brand is configured.
    Recommendation: digit, formatted with `Intl.NumberFormat("es-MX")`, pluralised.
- V: Question: Empty-state copy when no brand renders?
  - Status: pending
  - Explanation: No comp. Proposed: `No hay marcas disponibles por ahora.` (mirrors `/categorias`).
- VI: Question: Which `<meta>` title/description for `/marcas`?
  - Status: pending
  - Explanation: Proposed, following the `CATEGORIES_*` pattern — title `Marcas de Herramienta Industrial en Puebla |
    Tehesa`; description `Weston, King Tony, Bohrcraft, Bondhus, Precision Brand y Cleveland con existencia en Puebla.
    Explora el catálogo por marca y cotiza por WhatsApp.`
- VII: Question: Active-state treatment for the `Marcas` trigger on `/marcas` — `header.dc.html` shows no
  per-route active state for `Marcas`; mirror the `Categorías` treatment exactly?
  - Status: pending (assumed yes, AC2)

### Theme/persistence

- I: Question: Any theme/cookie impact?
  - Status: answered
  - Answer: None. Dark-mode classes only; the page reads no cookie and stores nothing.

### Verification

- I: Question: Does `__tests__/shared/Header.test.tsx` already exercise the `allHref` row so the brand instance can
  extend it, or does it need a new describe block?
  - Status: pending (planner to check; not opened during research)
