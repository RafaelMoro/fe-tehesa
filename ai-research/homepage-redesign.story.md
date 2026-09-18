# Homepage Redesign (`/`) — Research

**Date:** 2026-09-17
**Branch:** `feat/add-homepage`
**Scope:** standalone story, ~3 phases
**Design source:** Claude Design project "Tehesa UI mocks v1"
(https://claude.ai/design/p/4b99241e-42ab-4ca4-ac4e-c1cd49a75385?file=pagina-home.dc.html):

- `pagina-home.dc.html` — the `/` page of record (light + dark via `data-theme`; breakpoints at 1024 / 768; a
  `showImages` prop that defaults **on** — see D2). Its inline utility bar, header, and mobile drawer are a
  simplified re-draw of `header.dc.html` — **ignore them**, the shared `Header` from the root layout is already
  built from its own comp (`ai-research/header-navigation.story.md`).
- `image-slot.js`, `support.js` — Claude Design runtime only (`DCLogic` base class, drag-to-fill image placeholder).
  No design content beyond "a rectangle where a photo goes".

## Story Definition

### Title

Replace the current `/` catalog page chrome with the `pagina-home.dc.html` layout: new hero copy and search panel, a
"Marcas en almacén" strip, a filter-row hint line, comp no-result copy, restyled pagination, and a
closing "Ya tienes la lista?" panel.

### Description

`/` already does everything the comp shows — server-rendered 50-product pages, in-memory local filters, the
catalog-wide search drawer, the variants drawer, numbered pagination, the redesigned `ProductCard`. This story
changes **what wraps the grid**, not how the catalog works. Top to bottom, versus today's `Home.tsx` +
`CatalogHero.tsx`:

1. **Hero** (`CatalogHero`). Kicker `Suministro industrial` → `Catálogo con precio · Puebla`; H1 unchanged
   (`Distribuidor de herramienta industrial en Puebla`); intro → `Busca por categoría, por marca o por nombre de
   producto. Cada variante trae su precio y su clave de parte; pon cantidades y manda la lista a cotizar.` Right
   column: count label `333 productos en catálogo` (D3) above a dark panel retitled `¿No aparece con los filtros?`
   (search icon, not share icon) with new body copy, a full-width `Buscar en todo el catálogo` button that opens the
   existing `CatalogSearchDrawer` (D4), and a new footer line `Elige categoría o marca, una a la vez. La búsqueda
   por nombre reemplaza el filtro activo.`
2. **Brand strip** (new). Label `MARCAS EN ALMACÉN`, then the six stocked brands as inline links separated by `·`
   in `BRAND_PAGES` insertion order (Weston · King Tony · Bohrcraft · Bondhus · Precision · Cleveland — same as the
   `/marcas` cards, D5), and a right-aligned `Explorar el catálogo por marca →` link to `/marcas`. Brand links go to
   `/marcas/<slug>`, not the comp's `?mode=brand`.
3. **Filter row.** Same `SearchInput` + `DropdownCategories` + `DropdownBrands`, new placeholder `Buscar por nombre:
   broca, machuelo, dado…`. The `¿Qué significa este filtro?` popover now reads `Filtra solo entre los productos que
   estás viendo. Puedes combinar categoría, marca y texto.` but keeps today's trigger — icon-only, shown only while
   a local filter is active (D8; the comp's permanent underlined text button was rejected). A hint line `Escribe el
   nombre del producto. Ejemplo: broca cobalto, machuelo NPT, dado de impacto.` renders below the row when no local
   filter is active. Row sits above a top border.
4. **No-result copy** (D6, `/` only). Local search term with zero matches → `Nada con "<término>". Prueba con otra
   palabra del nombre (broca, machuelo, dado) o mándanos la clave o la medida por WhatsApp.` Category/brand local
   filter with zero matches and no term → `Ninguno de los productos que estás viendo coincide. Quita un filtro o
   busca en todo el catálogo.` Each paragraph is followed by the same two actions `ProductListing`'s panel offers
   today — `Buscar en todo el catálogo` (opens the drawer) and `Limpiar filtros` — so nothing is lost; the tinted
   panel itself is no longer reached from `/`.
5. **Pagination** (D1). Keep the crawlable numbered `1..7` links, prev/next, and `Mostrando X-Y de 333`; restyle the
   prev/next controls to the comp's outlined 40px `Página anterior` / `Página siguiente` buttons and add the comp's
   left-hand copy `Llegaste al final de esta lista. Cambia el filtro o busca en todo el catálogo.` on the last base
   page / when the filtered mode has no next page.
6. **Closing panel** (new). Dark `#0F2001` panel: H2 `Ya tienes la lista?`, body `Tu lista llega con la clave de
   cada parte ya puesta. Un vendedor de Tehesa te regresa la cotización formal.`, primary `Ver mi lista de
   cotización →` (`next/link` to `/cotizar`), secondary outline `Cotizar por WhatsApp` (`buildWhatsappUrl` with
   `WHATSAPP_HEADER_MESSAGE`, hidden when `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset — D7).

Unchanged: `page.tsx` data fetching/redirects/JSON-LD, `useCatalogSearch`, the drawer, local-filter logic, the
`Limpiar filtros` / `Limpiar búsqueda` buttons, `pageFeedback` messages, `ProductCard`, `Header`.

### Acceptance criteria

1. **Hero.** `/` renders the comp kicker, H1, and intro verbatim; the right column shows `{KNOWN_PRODUCT_TOTAL}
   productos en catálogo` on base mode and today's `{N} producto(s)` on `?mode=` pages; the dark panel carries the
   comp title/body/footer copy and its `Buscar en todo el catálogo` button opens the `Búsqueda ampliada` drawer
   (same handler as today). `loading.tsx` / `error.tsx` keep rendering `CatalogHero` — loading shows `Contando
   productos…`, error shows the disabled button — without new props being required.
2. **Brand strip.** Below the hero, a strip labelled `Marcas en almacén` lists every live brand that has a
   `BRAND_PAGE_HREFS` entry, in `BRAND_PAGES` key order, labelled `getBrandDisplayName(customId) ?? name`, each a `next/link` to its
   `/marcas/<slug>`, with `·` separators marked `aria-hidden`; plus `Explorar el catálogo por marca →` to `/marcas`.
   When no brand qualifies (Strapi failure → empty taxonomy) the strip is not rendered at all.
3. **Filter row + hint.** The row is `SearchInput` (comp placeholder) + the two dropdowns; the `¿Qué significa
   este filtro?` popover keeps today's behavior (icon button, only while a local filter is active) but its text
   becomes the comp copy. The example hint line renders only while no local search/category/brand is active.
   Existing `Limpiar filtros` (local) and `Limpiar búsqueda` (wide) behavior is unchanged.
4. **No results.** With a local search term and zero matches, `/` renders the `Nada con "…"` paragraph (term
   echoed verbatim, trimmed); with only a category/brand local filter and zero matches, the `Ninguno de los
   productos…` paragraph, each followed by a `Buscar en todo el catálogo` button (opens the drawer) and a
   `Limpiar filtros` button (resets local filters). Neither renders `ProductListing`'s panel. `/categorias/[slug]`
   and `/marcas/[slug]` still render the panel (untouched).
5. **Pagination.** Base mode keeps numbered `1..7` real links / non-link current page, `Mostrando X-Y de 333`, and
   prev/next as real links or `aria-disabled` spans — never `href="#"` — now labelled `Página anterior` / `Página
   siguiente` in the comp's outlined style. The `Llegaste al final…` copy appears on the last base page and on a
   filtered mode with no `Siguiente`. Filtered `Anterior` / `Siguiente` URLs are unchanged.
6. **Closing panel.** After pagination, the panel renders its H2/body, `Ver mi lista de cotización` as a `next/link`
   to `/cotizar`, and `Cotizar por WhatsApp` as `target="_blank" rel="noopener noreferrer"` only when
   `WHATSAPP_NUMBER` is set; never throws when unset.
7. **Tests.** `__tests__/home/Home.test.tsx` updated for the new labels (`Buscar en todo el catálogo` now exists
   both in the hero and inside the drawer — scope queries with `within(dialog)` / outside it), the brand strip
   (links, hidden when empty), hint visibility, the two no-result paragraphs, pagination labels and end copy, and
   panel gating. Follow `docs/UNIT_TESTING_GUIDELINES.md`.

### Task breakdown (for the planner)

1. **Hero + closing panel** — `CatalogHero.tsx` copy/icon/footer line/count label; new `HomeQuotePanel` (or inline
   `<section>` in `Home.tsx`, sibling of `/marcas`'s closing panel markup); `Home.test.tsx` label updates.
2. **Brand strip + filter row** — new `BrandStrip` under `src/features/Home/` fed from the `brands` prop already
   passed to `Home`; `SearchInput` placeholder via its existing `placeholder` prop; popover copy; hint line.
3. **No-result copy + pagination restyle** — home-local empty paragraphs before `ProductListing`; prev/next
   restyle + end copy; tests.

## Design Agent Handoff

**No design-brief file is produced for this story.** The page is fully designed in the Claude Design project (every
breakpoint, light + dark). Export PNGs via `/check-design` into `comps/homepage-redesign/`: `pagina-home.dc.html`
at 390 and 1440, light + dark, with `showImages` **off** (`?show-images=false` or the prop panel) so the card matches
what ships.

### User goal, and what this is not

A buyer landing on `/` wants to know what Tehesa sells, see that prices are public, and start finding a part —
by category, brand, or name — then send a list to quote. The page is the **catalog entry point**: hero, brand
shortcuts, filters, the first 50 products, pagination, and a nudge toward `/cotizar` / WhatsApp. It is not a new
search surface (the drawer already exists), not a marketing landing with sections the app can't back (no
testimonials, no stats, no image hero — Strapi has no media), and not a checkout.

### Surface index

| Surface | File | States | Brief |
| --- | --- | --- | --- |
| Hero (kicker, H1, intro) | `src/features/Home/CatalogHero.tsx` | single; H1 48/36/28px | — (comp done) |
| Count label | `CatalogHero.tsx` | base (`333 productos en catálogo`), mode (`N productos`), loading (`Contando productos…`) | — |
| Search panel | `CatalogHero.tsx` | enabled, disabled (loading/error/busy) | — |
| Brand strip | new `src/features/Home/BrandStrip.tsx` | ≥1 brand, none (hidden); hover `#125D03` | — |
| Filter row + tip + hint | `Home.tsx` | no filter (hint shown, tip hidden), filter active (hint hidden, `Limpiar filtros` + tip shown), tip open/closed | — |
| No-result paragraphs + actions | `Home.tsx` | term-no-match, filter-no-match; each with `Buscar en todo el catálogo` + `Limpiar filtros` | — |
| Pagination | `Home.tsx` | base numbered, filtered prev/next, end-of-list copy, pending | — |
| Closing panel | `Home.tsx` (or `HomeQuotePanel.tsx`) | WhatsApp set / unset | — |

### Rules that override design instinct

- Never drop the numbered page links or `Mostrando X-Y de 333` (D1) — the comp's prev/next-only footer is a mock
  simplification, and the crawlable links are an SEO deliverable.
- Never link a brand to `?mode=brand&brand=…` (D5); `/marcas/<slug>` is the brand page of record. Never show the raw
  Strapi name `Clevaland`.
- Never render a second header/utility bar/mobile drawer from the comp; the root layout's `Header` owns them.
- Never render the card image slot; `ProductCard` ships image-less (no Strapi media). Never add a secondary-CTA
  change to the card — it is its own story, already shipped.
- Never `href="#"`; disabled pagination stays a non-focusable `<span aria-disabled="true">`.

### Implementation-facing constraints

**Responsive.** Class-only (`md:`/`lg:`); `useMediaQuery` returns `false` on the server and `CatalogHero` renders
in `loading.tsx`. Comp: hero grid `minmax(0,1fr) 340px` ≥1024, one column below; H1 48/36/28; page padding 20/16px
(today's `CatalogPageLayout` uses `p-4 sm:p-6` — keep); brand strip is `flex-wrap`, the `Explorar…` link
`margin-left:auto` and wraps under on phone; filter row `flex-wrap` with the input `flex:1; min-width:220px`; closing
panel `flex-wrap`, buttons wrap under the copy. Card grid unchanged (`ProductListing`).

**Accessibility.** Hero H1 stays the only `<h1>`; panel title and closing panel title are `<h2>`. The hero panel is
an `<aside>` today — keep. `¿Qué significa este filtro?` stays HeroUI `Popover`'s icon button with its
`aria-label`. Brand strip `·` separators `aria-hidden="true"`; strip wrapped in
`<nav aria-label="Marcas en almacén">`. Pagination prev/next keep `aria-label="Página anterior"/"Página siguiente"`
(tests assert them). No-result paragraphs use `role="status"` like `pageFeedback`. External WhatsApp link
`target="_blank" rel="noopener noreferrer"`. Hit targets ≥40px desktop / 44px touch.

**Visual patterns.** Same palette as `/categorias` / `/marcas`: kicker `#23890C` / dark `#4DF527`; tint `#F5FFEF` /
dark `#12250A`–`#16300A`; borders `default-200` / dark `#1E3608`; primary fill `#4DF527` text `#0D3401` hover
`#3BD11A` (`DESIGN.md:110-112`); dark panels `bg-[#0F2001]` white text, secondary button `border-white/25` hover
`bg-white/10` (`BrandsPage.tsx` closing panel is the sibling); outlined prev/next `border-default-300` 40px `rounded-[10px]`.
`CatalogHero`'s current `bg-emerald-950` should become `#0F2001` to match the rest of the app. `pnpm design:lint`
only if `DESIGN.md` changes (none expected).

**Content.** All Spanish copy verbatim from the comp (listed in Description). Count: `KNOWN_PRODUCT_TOTAL` via
`Intl.NumberFormat("es-MX")` for consistency with `CategoryCard` (`333` has no separator either way); never
`formatNumberToCurrency`. Brand display names via `getBrandDisplayName` (`brand.constants.ts`). WhatsApp prefill:
`WHATSAPP_HEADER_MESSAGE` (D7).

**Out of scope.** `ProductCard` (comp's single-CTA card is a mock simplification; the shipped two-CTA card stays),
`Header`/`MobileMenu`, `CatalogSearchDrawer` internals, `page.tsx` fetching/redirects/SEO metadata/JSON-LD, the
`showImages` image slot, live `products_connection` total (D3), `?mode=brand` URL redirects, category/brand page
empty states (D6).

### Decision record

- **D1 — Numbered pagination stays; restyle only.** Decided (user, 2026-09-17). Rejected: comp's prev/next-only
  footer (loses six crawlable links from the SEO story). Adopt labels, outlined style, and the end-of-list copy.
- **D2 — Card image slot off.** Assumed: the comp's `showImages` defaults `true`, but Strapi has no media field and
  `ProductCard`'s `image` prop has no caller (`product-card-redesign.story.md` D5). Nothing to wire.
- **D3 — Count is `KNOWN_PRODUCT_TOTAL` on base mode; modes keep `N productos`.** Decided (user, 2026-09-17). No new
  query. Upgrade path: `products_connection { pageInfo { total } }` in `page.tsx` (open decision in
  `plp-seo-readiness.story4.md`, Catalog Behavior I) — would also replace the stale constant in `Mostrando … de 333`.
- **D4 — Hero button opens `CatalogSearchDrawer`.** Decided (user, 2026-09-17). The comp focuses the local input
  because the mock has no drawer; the panel copy ("Busca en el catálogo completo por nombre") describes the drawer.
- **D5 — Brand strip links to `/marcas/<slug>`, `BRAND_PAGES` insertion order, config-gated.** Decided (user,
  2026-09-17): iterate `Object.keys(BRAND_PAGES)` (product-count desc, same as `/marcas` cards) and keep those
  present in the live taxonomy (drops `libre`, drops unpublished brands). Rejected: the comp's alphabetical order,
  and its `?mode=brand&brand=<slug>` href (that URL style takes a Strapi *name*, not a slug, and the brand page
  exists).
- **D6 — Comp no-result copy on `/` only.** Decided (user, 2026-09-17). `ProductListing`'s panel stays for
  `/categorias/[slug]` and `/marcas/[slug]`. Mechanism: `Home` short-circuits before rendering `ProductListing`
  when `filteredProducts.length === 0 && isLocalFilterActive` and renders the comp paragraph plus the same two
  actions the panel has (`Buscar en todo el catálogo` → `catalogSearchDrawerState.open`, `Limpiar filtros` →
  `clearLocalFilters`) — decided UI III (user, 2026-09-17).
- **D7 — Closing panel WhatsApp reuses `WHATSAPP_HEADER_MESSAGE`; hidden when unset.** Decided (user,
  2026-09-17), same gating as `Header`/`WhatsappPanel`/`BrandsPage`. The comp's prefill (`Hola, quiero cotizar un
  producto de Tehesa`) is a mock string; no new constant.
- **D8 — Tip popover keeps today's behavior.** Decided (user, 2026-09-17): icon-only button shown only while a
  local filter is active; only the popover copy changes to the comp's. ~~Comp's always-visible underlined text
  button~~ rejected.

## Technical Research

### Affected areas

- **Route:** `src/app/page.tsx` — no change expected (already passes `brands`, `products`, mode props to `Home`).
  `src/app/loading.tsx` / `src/app/error.tsx` — consume `CatalogHero`; must keep working with the new copy
  (loading label `Contando productos…` replaces `Cargando productos...` when `productCount == null`; verify
  `loading.tsx`'s sr-only `Cargando productos...` status stays).
- **Feature UI:** `src/features/Home/CatalogHero.tsx` (copy, icon `RiSearchLine` for the title, count label, footer
  line, panel color), `src/features/Home/Home.tsx` (brand strip mount, filter row tip/hint, no-result paragraphs,
  pagination labels/style/end copy, closing panel), new `src/features/Home/BrandStrip.tsx`, optional
  `src/features/Home/HomeQuotePanel.tsx`. `src/features/ProductListing/SearchInput.tsx` — no change (placeholder
  is already a prop). `CatalogDisabledFilters.tsx` — pass the new placeholder so loading/error match.
- **Shared:** `src/shared/constants/brand.constants.ts` (`BRAND_PAGE_HREFS`, `getBrandDisplayName` — reuse),
  `src/shared/constants/whatsapp.constants.ts` (reuse `WHATSAPP_HEADER_MESSAGE`; new constant only if UI IV says
  so), `src/shared/constants/catalog.constants.ts` (`KNOWN_PRODUCT_TOTAL` — reuse).
- **Tests:** `__tests__/home/Home.test.tsx` (label changes: hero button `Buscar en catálogo completo` → `Buscar en
  todo el catálogo`; the drawer's submit button already has that name, so hero queries need `screen.getAllByRole`
  or an outside-dialog scope; prev/next `aria-label`s unchanged so pagination tests survive), new cases per AC 7.
  No route/API tests change.

### Existing patterns to follow

- `BrandsPage.tsx` closing panel (`<section>` dark panel + `next/link` primary + gated WhatsApp `<a>`) — copy the
  markup for the home closing panel; `WhatsappPanel.tsx` shows the same `WHATSAPP_NUMBER ? buildWhatsappUrl(...)
  : null` gate.
- `Header.tsx` `brandItems` mapping — `getBrandDisplayName(brand.customId) ?? brand.name` + `BRAND_PAGE_HREFS[
  customId]` gate is exactly the brand-strip data shape.
- `Home.tsx` pagination — `buttonVariants()` / `pagination__link` class approach for `<a>`/`<span>` controls; keep it
  and swap `isIconOnly` for labelled outlined buttons (`variant: "outline"` — HeroUI v3 has no `bordered`).
- `Home.tsx` `Popover` for the tip — already present; only its copy changes.
- `ProductListing.tsx` empty-state actions — the `Buscar en todo el catálogo` + `Limpiar filtros` button pair to
  mirror under the home no-result paragraphs (same handlers: `catalogSearchDrawerState.open`, `clearLocalFilters`).
- `CategoryCard` — `Intl.NumberFormat("es-MX")` for counts.
- Server/client split: `BrandStrip` needs no hooks and can be a plain component; `Home.tsx` stays `"use client"`.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
- `pnpm test -- __tests__/home` for the story's tests; full `pnpm test` before PR.
- `pnpm dev` + curl `/`, `/?page=7`, `/?mode=brand&brand=Weston&page=1`, `/?mode=name&q=zzz&page=1` to check the
  count label, end-of-list copy, and no-result rendering per the dev-server validation practice.
- Do not run `pnpm install`; no new dependency.

### Dependencies / integration points

- No new packages. Icons from `@remixicon/react` (`RiSearchLine`, `RiArrowRightLine` already imported in Home).
- `NEXT_PUBLIC_WHATSAPP_NUMBER` optional; unset hides the panel's secondary button.
- PR label: `minor` (new user-visible surfaces, no contract change).

### Edge cases and constraints

- **Duplicate button name.** `Buscar en todo el catálogo` will exist in the hero and inside the drawer (its submit).
  Fine for a11y (the drawer is a modal dialog), but tests must scope.
- **Brand taxonomy empty** (Strapi failure in `page.tsx` propagates to `error.tsx`, so `Home` never sees an empty
  list in practice; `layout.tsx` degrades to `[]` only for the `Header`). Still guard: zero qualifying brands → no
  strip.
- **`libre` / `Marca Libre`** has no `BRAND_PAGE_HREFS` entry → excluded from the strip (matches the comp's six).
- **Count label on base pages > 1** still reads `333 productos en catálogo` (it is a catalog total, not a page
  count); `Mostrando X-Y de 333` remains the per-page indicator. Both drift together with `KNOWN_PRODUCT_TOTAL`.
- **End-of-list copy on base mode:** show on page `PRODUCT_PAGE_MAX` only; on filtered modes when
  `!hasNextCatalogPage || isEndNotice`. Do not show while `isRoutePending`.
- **No-result precedence:** a term with zero matches wins over the filter message (comp: `showNoResults` checks the
  term first; `showNoLocal` requires an empty term).
- **`filteredProducts` reset** on navigation (existing `useEffect`) also resets the hint visibility — no extra state.
- **Hydration:** nothing in the new surfaces reads `localStorage`/`window` at render; the closing panel's WhatsApp
  gate is module-scope env, same as `WhatsappPanel`.

## Open Questions

### Strapi contract

- I: Question: Does the page need any new Strapi field or query?
  Status: answered
  Answer: No. Brands come from the existing `fetchBrands()` prop; the count is `KNOWN_PRODUCT_TOTAL` (D3); the
  product grid is unchanged.
  Context: `products_connection { pageInfo { total } }` exists (REPO_CONTEXT, verified 2026-07-27) and is the
  documented upgrade path if the user later wants a live total.

### Catalog behavior

- I: Question: Should the hero's count show the catalog total or the current result count on filtered modes?
  Status: answered
  Answer: `KNOWN_PRODUCT_TOTAL` on base mode; today's `N producto(s)` on `?mode=` pages (user, 2026-09-17).
- II: Question: Keep numbered pagination or adopt the comp's prev/next-only footer?
  Status: answered
  Answer: Keep numbered `1..7` + `Mostrando`; restyle prev/next and add the end-of-list copy (user, 2026-09-17).

### UI/product decisions

- I: Question: Hero `Buscar en todo el catálogo` — open the drawer or focus the local input?
  Status: answered
  Answer: Open `CatalogSearchDrawer` (user, 2026-09-17).
- II: Question: Comp no-result paragraphs on `/` only, everywhere, or keep the current panel?
  Status: answered
  Answer: On `/` only; `ProductListing`'s panel stays for category/brand pages (user, 2026-09-17).
- III: Question: Should the no-result paragraphs still offer an action (the current panel has `Buscar en todo el
  catálogo` + `Limpiar filtros`)? The comp has none — the copy says "busca en todo el catálogo" but nothing is
  clickable there.
  Status: answered
  Answer: Yes, offer the actions (user, 2026-09-17). Today `ProductListing`'s panel already does: `Buscar en todo
  el catálogo` (only on `/`, gated on `onOpenCatalogSearch`) + `Limpiar filtros` (all three listing pages). Home's
  paragraphs get the same pair.
- IV: Question: Reuse `WHATSAPP_HEADER_MESSAGE` for the closing panel, or add a home-specific prefill (comp: `Hola,
  quiero cotizar un producto de Tehesa`)?
  Status: answered
  Answer: Reuse `WHATSAPP_HEADER_MESSAGE` (user, 2026-09-17).
- V: Question: Brand strip order — alphabetical (comp) or `BRAND_PAGES` insertion order (`/marcas` card order,
  product-count desc)?
  Status: answered
  Answer: `BRAND_PAGES` insertion order (user, 2026-09-17), matching the `/marcas` cards.
- VI: Question: Should `¿Qué significa este filtro?` stay always visible (comp, D8) or keep today's
  only-while-filtering behavior?
  Status: answered
  Answer: Keep today's behavior — icon button, only while filtering; adopt the comp copy (user, 2026-09-17).

### Theme/persistence

- I: Question: Any theme change?
  Status: answered
  Answer: No. Dark tokens in the comp match the ones `/categorias` and `/marcas` already use as raw hex classes;
  `CatalogHero`'s `bg-emerald-950` aligns to `#0F2001`.

### Verification

- I: Question: Which existing Home tests change?
  Status: answered
  Answer: The three `getByRole("button", { name: "Buscar en catálogo completo" })` queries (lines 127, 154, 181,
  186) rename and need scoping against the drawer's identically named submit; `Mostrando` and `Página anterior/
  siguiente` assertions survive. New assertions per AC 7.
