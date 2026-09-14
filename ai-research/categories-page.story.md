# Categories Page (`/categorias`) — Research

**Date:** 2026-09-14
**Branch:** `feat/add-categories-page`
**Scope:** standalone story (single deliverable, ~3 phases)
**Design source:** Claude Design project "Tehesa UI mocks v1"
(https://claude.ai/design/p/4b99241e-42ab-4ca4-ac4e-c1cd49a75385):

- `header.dc.html` — the header **with** the new `Ver todas las categorías` row (desktop ≥1024, tablet, mobile side
  menu; light + dark). **This is the header of record.**
- `categories.dc.html` — a comps board that iframes `pagina-categorias.dc.html` at 390 / 834 / 1440 in light and
  dark. It carries no design of its own.
- `pagina-categorias.dc.html` — the `/categorias` page. Its inline header is a stale copy (no `Ver todas las
  categorías` row, theme toggle inside the mobile menu) — **ignore it** and use `header.dc.html`.
- `pagina-tornilleria.dc.html` — a future `/categorias/tornilleria` page. Out of scope here; noted only because the
  category card CTA will eventually point at it.
- `support.js` — the generic Claude Design runtime, no design content.

## Story Definition

### Title

Add a `/categorias` index page listing every live Strapi category, and link to it from the header's `Categorías`
dropdown / mobile accordion with a `Ver todas las categorías` row.

### Description

Today the only way to reach a category is `/?mode=category&category=<name>` via the catalog search drawer; the
header's `Categorías` dropdown lists categories as **disabled** items (header-navigation story, D4) because no
category pages exist. This story adds the first of those pages — the index — and the header entry point to it:

- **Header (all breakpoints, both themes).** The `Categorías` desktop dropdown and the mobile-menu `Categorías`
  accordion gain a final, visually separated row `Ver todas las categorías` (arrow icon, tinted background, link
  colour `#125D03` light / `#4DF527` dark) that navigates to `/categorias`. The category items above it stay disabled
  (they flip on per `/categorias/<slug>` story). The `Categorías` trigger shows the active underline on `/categorias`
  the same way `Productos` does on `/` (comp `pagina-categorias.dc.html` desktop header).
- **`/categorias` page.** Breadcrumb `Inicio / Categorías`, a hero (kicker `Catálogo`, H1 `Catálogo de herramienta
  industrial`, intro paragraph with the live category count) with a dark "Cotiza por WhatsApp" panel beside it on
  desktop / below it on mobile, a `N categorías` counter, and a responsive grid of category cards (initial-letter
  badge, `N productos` pill, category name, a `Ver categoría` CTA). Cards come from the live Strapi taxonomy.
- **Decisions already taken with the user** (see Decision record): card CTAs render **disabled** until each
  `/categorias/<slug>` page ships; cards show **name + product count only** (no description/tags — Strapi has no such
  fields); the hero CTA is the **WhatsApp link**; the comp's client-side "Buscar una categoría…" filter is **dropped**.

### Acceptance criteria

1. **Header entry point.** On every route and at every breakpoint, the `Categorías` dropdown (≥ `md`) and the mobile
   menu's `Categorías` accordion end with a `Ver todas las categorías` row that is a real `next/link` anchor to
   `/categorias`, separated from the disabled items above it (border-top + tinted background per the comp), in light
   and dark. Selecting it closes the dropdown / drawer. The existing category items stay `isDisabled`. When the
   taxonomy is empty (Strapi failure) the dropdown/accordion is not rendered at all — unchanged from today — so the row
   is not rendered either.
2. **Active state.** On `/categorias` the desktop `Categorías` trigger carries the same active underline
   (`border-b-2 border-[#4DF527]`) that `Productos` carries on `/`, and `Productos` is not underlined. In the mobile
   menu the `Categorías` accordion trigger is highlighted (tint + inset green bar per `header.dc.html`'s
   active-row treatment) and `Productos` loses `aria-current`.
3. **Page structure.** `GET /categorias` is a server-rendered route (`src/app/categorias/page.tsx`) that fetches
   `fetchCategories()` (plus the per-category count query, Strapi contract I) and renders, inside one `<main>`: a breadcrumb `nav[aria-label="Ruta"]` (`Inicio` links to `/`;
   `Categorías` is plain text with `aria-current="page"`), the hero (kicker, `<h1>`, paragraph whose category count
   is the live `categories.length`), the WhatsApp panel (`Cotizar ahora` → `buildWhatsappUrl(WHATSAPP_NUMBER,
   WHATSAPP_HEADER_MESSAGE)`, `target="_blank" rel="noopener noreferrer"`; the whole panel is hidden when
   `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset), a `N categorías` counter, and one `<article>` card per category in a
   `repeat(auto-fill, minmax(270px, 1fr))` grid, in the order Strapi returns them. Zero categories renders an empty
   state (`No hay categorías disponibles por ahora.`) instead of an empty grid; a Strapi failure propagates to
   `src/app/error.tsx` like `/` does.
4. **Card anatomy.** Each card shows the initial-letter badge (`aria-hidden`), the product-count pill
   (`N productos`, `es-MX` grouping via `Intl.NumberFormat`, sourced from the aliased `products_connection` query in
   Strapi contract I; the pill is hidden when that query fails), the category name as an `<h2>`, and a `Ver categoría` CTA rendered as a non-focusable
   `<span aria-disabled="true">` (never `href="#"`) until that category's page exists. Cards render name + count only:
   no description, no tags, no image placeholder.
5. **SEO + resilience + tests.** `generateMetadata` returns a literal title/description (new `CATEGORIES_TITLE` /
   `CATEGORIES_DESCRIPTION` in `seo.constants.ts`), canonical `/categorias`, `robots: index, follow`; `sitemap.ts`
   lists `/categorias` among the base pages (so it survives a Strapi outage); the page renders a `BreadcrumbList`
   JSON-LD via `toJsonLdHtml`. `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, and `pnpm test` pass; new tests
   cover AC1–AC2 (row href, dropdown/drawer close on select, active underline on `/categorias`) and AC3–AC4 (card
   count, disabled CTA, empty state, WhatsApp panel hidden when the number is unset) plus the sitemap entry.

### Task breakdown (for the planner)

1. **Header row + active state** — `Header.tsx` `TaxonomyDropdown` gets an `allHref`/footer row (only the
   `Categorías` instance passes it); `MobileMenu.tsx` `TaxonomyAccordionSection` likewise; `isCategories =
   pathname.startsWith("/categorias")` drives the underline / accordion highlight. Update `__tests__/shared/Header.test.tsx`.
2. **Route + feature** — count query/server action in `global.queries.ts`/`global.lib.ts`; `src/app/categorias/page.tsx`
   (server shell: metadata, `fetchCategories()` + counts with degrade-on-failure, JSON-LD,
   `<main>`) rendering a `src/features/CategoriesPage/` feature (`CategoriesPage.tsx` layout, `CategoryCard.tsx`).
   No client state is needed after dropping the search box, so the feature can stay a server component unless a
   HeroUI primitive forces `"use client"`.
3. **SEO + sitemap + docs** — constants, `sitemap.ts` base-page entry, `ai-skills/REPO_CONTEXT.md` / `CLAUDE.md`
   route inventory, tests for metadata/sitemap.

## Design Agent Handoff

**No design-brief file is produced for this story.** The comps exist in the Claude Design project above with every
state, breakpoint, and theme. Export PNGs into `comps/categories-page/` (`/check-design`) so the implementer can
reference them without the design MCP: `header.dc.html` desktop + mobile menu with the `Categorías` dropdown/accordion
open (light + dark), and `pagina-categorias.dc.html` at 390 and 1440 (light + dark).

### User goal, and what this is not

A buyer who does not know Tehesa's range wants to see, on one page, every category the store carries and how deep
each one is, then jump into one. This page is an **index of the taxonomy**; it is not a product listing, not a
search surface, and not a filter UI — it never fetches products and never adds a catalog `mode`. Until the per-category
pages exist it is also not a navigation hub: its cards are inert.

### Surface index

| Surface | File | States | Brief |
| --- | --- | --- | --- |
| `Categorías` dropdown footer row | `src/shared/ui/organisms/Header.tsx` | default, hover, focus-visible, light/dark, empty taxonomy (not rendered) | — (comp done) |
| `Categorías` accordion footer row | `src/shared/ui/organisms/MobileMenu.tsx` | same as above, ≥44px tall | — |
| `Categorías` trigger active state | `Header.tsx` / `MobileMenu.tsx` | on `/categorias` vs elsewhere | — |
| Breadcrumb | `src/features/CategoriesPage/CategoriesPage.tsx` | single state | — |
| Hero + WhatsApp panel | `CategoriesPage.tsx` | number set / unset (panel hidden), 1-col < 1024, 2-col ≥ 1024 | — |
| Category card | `src/features/CategoriesPage/CategoryCard.tsx` | default, hover (shadow + stronger border), CTA disabled; later: CTA enabled | — |
| Empty state | `CategoriesPage.tsx` | zero categories | — (no comp; copy in AC3) |

### Rules that override design instinct

- Never render `href="#"` or a `<button>` that does nothing for a CTA whose target does not exist yet — use the
  non-focusable `<span aria-disabled="true">` pattern already used by `Home.tsx`'s pagination.
- Never invent card content Strapi cannot supply (description, tags, image). The comp's descriptions/tags are
  placeholder copy.
- The product count is a live number or nothing — never a hardcoded figure, never `0` as a stand-in for "unknown".
- The page uses the shared `Header` from the root layout; it must not render a second header/utility bar.

### Implementation-facing constraints

**Responsive.** Class-only (`md:`/`lg:` Tailwind); `useMediaQuery` returns `false` on the server and must not gate
layout. Comp breakpoints: hero becomes 2-column (`minmax(0,1fr) 340px`) and the counter/search row appears at ≥ 1024;
H1 48px ≥ 1024 / 36px ≥ 768 / 28px below; page padding 20px / 16px. The header's own breakpoint is `md` (768), per the
header-navigation story D3 — keep that; only the page hero uses `lg`.

**Accessibility.** Breadcrumb is `<nav aria-label="Ruta">` with `aria-current="page"` on the last crumb. Cards are
`<article>` with an `<h2>`; the initial-letter badge is `aria-hidden` (it duplicates the name). The disabled CTA is not
focusable and carries `aria-disabled="true"`. Dropdown footer row: react-aria `MenuItem` supports `href` and renders an
`<a>`; without a `RouterProvider` it does a full-page navigation — acceptable, but the planner may wrap the item in
`next/link` semantics via `onAction` + `useRouter` instead. `aria-current` is stripped by `MenuItem` (known gotcha) —
the active state on `/categorias` lives on the trigger, not the row. All tappable rows ≥ 44px.

**Visual patterns.** Colours are the existing header set: light tint `#F5FFEF`, link `#125D03`, kicker `#23890C`;
dark surface `#0B1A02`, subtle `#12250A`, chip `#16300A`, border `#1E3608`, link `#4DF527`/hover `#B4FE99`; utility
panel `#0F2001` (`primary-950`). Green `#4DF527` fill + `#0D3401` text for the WhatsApp CTA (`DESIGN.md:110-112`).
Cards: `border-default-200` / `dark:border-[#1E3608]`, `rounded-[14px]`, hover shadow. `pnpm design:lint` after any
`DESIGN.md` edit (none expected).

**Content.** Spanish copy from the comp verbatim: kicker `Catálogo`, H1 `Catálogo de herramienta industrial`, intro
`Tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. {N} categorías con existencia en Puebla.
Cotiza por WhatsApp.`, panel title `Cotiza por WhatsApp`, panel body `Envía tu lista de medidas y cantidades;
confirmamos existencia el mismo día.`, CTA `Cotizar ahora`, counter `{N} categorías`, pill `{N} productos`, card CTA
`Ver categoría`, header row `Ver todas las categorías`. Number formatting: `Intl.NumberFormat("es-MX")` — do not reuse
`formatNumberToCurrency` (it appends `$…MXN`).

**Out of scope.** `/categorias/<slug>` pages and the slug scheme; enabling card/dropdown category links; the
client-side category search box; category descriptions/tags/images; brand index page; the "Cambiar tema" placement
shown inside `pagina-categorias.dc.html`'s stale mobile menu.

### Decision record

- **D1 — Card CTA disabled now.** Decided (user, 2026-09-14): `Ver categoría` renders as `aria-disabled` span until
  the matching `/categorias/<slug>` story enables it. Rejected: linking to `/?mode=category` (would be a throwaway
  redirect later) and emitting the future URL (404s).
- **D2 — Name + count only.** Decided (user): no description/tags. Strapi `category` has only `name`, `customId`,
  `products` (REPO_CONTEXT, verified 2026-09-14). Count comes from the aliased `products_connection` query (Strapi contract I).
- **D3 — Hero CTA is WhatsApp.** Decided (user): same `buildWhatsappUrl` + `WHATSAPP_HEADER_MESSAGE` as the header;
  panel hidden when the number is unset (matches the header's "never throw on unset" rule).
- **D4 — Drop the search box.** Decided (user): 16 categories fit; no client state on the page. The mobile `Buscar`
  toggle and the desktop input go with it; the `N categorías` counter stays.
- **D5 — Header of record is `header.dc.html`.** Decided (user): ignore the inline header in
  `pagina-categorias.dc.html` (no footer row, theme toggle in the mobile menu instead of the footer).
- **D6 — Card order = Strapi order.** Assumed: `GET_CATEGORIES` passes no `sort`; Strapi has no order field. The comp
  lists alphabetically, which is what Strapi returns today. Add `sort: ["name:asc"]` only if the live order drifts —
  see Catalog behavior I.
- **D7 — `/categorias` is `index, follow` and in the sitemap.** Assumed: it is a real content page, unlike `/cotizar`
  (`noindex`). Listed as a base page so a taxonomy outage never drops it.

## Technical Research

### Affected areas

| Area | Files | Change |
| --- | --- | --- |
| Header | `src/shared/ui/organisms/Header.tsx`, `MobileMenu.tsx` | footer row in the `Categorías` dropdown/accordion; `isCategories` active state |
| Route | `src/app/categorias/page.tsx` (new) | server shell: `generateMetadata`, `fetchCategories()`, JSON-LD, `<main>` |
| Feature | `src/features/CategoriesPage/CategoriesPage.tsx`, `CategoryCard.tsx` (new) | page layout + card |
| Query | `src/shared/queries/global.queries.ts`, `src/shared/lib/global.lib.ts`, `src/shared/types/global.types.ts` | new aliased `products_connection` count query + server action (Strapi contract I); `CategoryWithCount` type |
| SEO | `src/shared/constants/seo.constants.ts`, `src/app/sitemap.ts` | title/description constants; base-page entry |
| Tests | `__tests__/shared/Header.test.tsx`, `__tests__/seo/sitemap.test.ts`, new `__tests__/categories/*` | AC1–AC5 |
| Docs | `ai-skills/REPO_CONTEXT.md`, `CLAUDE.md` | route inventory, header description |

### Existing patterns to follow

- **Route shell:** `src/app/cotizar/page.tsx` — literal `generateMetadata`, one `<main>`, feature component inside.
  `/categorias` differs in being a server component that awaits `fetchCategories()` (like `src/app/page.tsx`) and in
  being indexable.
- **Taxonomy fetch:** `fetchCategories()` in `global.lib.ts` (`GET_CATEGORIES`, returns `TaxonomyItem[]`). The root
  layout already fetches it per request for the header; the page will fetch it again (same accepted duplication as
  `/`, see the layout's `ponytail:` note). Failure propagates to `src/app/error.tsx`.
- **Disabled-target CTA:** `Home.tsx` pagination — `<span aria-disabled="true">` instead of a link when there is no
  target.
- **Env-gated WhatsApp link:** `Header.tsx` computes `whatsappUrl` per render from `WHATSAPP_NUMBER` and renders
  nothing when null.
- **JSON-LD:** `buildCatalogJsonLd`'s `BreadcrumbList` shape + `toJsonLdHtml` (escapes `<`) in `seo.utils.ts`;
  category names are Strapi-sourced, so they must go through it.
- **Dropdown items:** `Dropdown.Item` is react-aria `MenuItem` (`href` supported; `aria-*` stripped). `Dropdown.Section`
  exists if the planner prefers a section over a styled last item.
- **Accordion rows:** `MobileMenu.tsx` renders plain `<span aria-disabled>` rows; the new footer row is a `next/link`
  with `onClick={state.close}` like the existing `Productos` link.

### Verification rules

`pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` (targeted: `pnpm test -- __tests__/shared/Header.test.tsx`,
`__tests__/seo/sitemap.test.ts`, new categories tests). Dev-server curl checks per phase: `curl -s localhost:3000/categorias |
grep -c "<article"` should equal the live category count; `curl -s localhost:3000/sitemap.xml | grep categorias`.
No `pnpm install`.

### Dependencies / integration points

No new dependencies. Env: `STRAPI_HOST`/`STRAPI_API_TOKEN` (page data), `NEXT_PUBLIC_WHATSAPP_NUMBER` (panel),
`NEXT_PUBLIC_SITE_URL` (canonical/sitemap). `@remixicon/react` already provides the arrow icon (`RiArrowRightLine`).

### Edge cases and constraints

- **Category count in the hero and counter** is `categories.length` from the live fetch — never a constant.
- **Long names:** the longest live category name is 57 chars (`Herramientas de diagnóstico de electricidad y
  electrónica`); the card `<h2>` must wrap (`text-wrap: pretty`, no truncation); the dropdown row already uses
  `whitespace-normal`.
- **Product count of 0** for a category is a legitimate value and renders `0 productos` (Abrasivos is 0 today); a
  *missing* count (count query failed) hides the pill rather than showing `0`. The 7 products with no category are
  not surfaced anywhere on this page.
- **Draft & Publish:** `fetchCategories()` returns published categories only; a count query must count published
  products only too, or the pill overstates.
- **Every collection query needs explicit `pagination`** (default page size is 10, silently). `GET_CATEGORIES` passes
  none today and gets 16 rows back — it is already over the default and only works because Strapi's `categories`
  default happens to be higher for this endpoint or the total fits; the planner must confirm with the live count and
  add `pagination: { pageSize: 100 }` if it needs to (Strapi contract II).
- **Sticky header + anchor:** none needed; no in-page anchors.
- **`force-dynamic`** is already set at the layout, so the new route is dynamic without extra config.

## Open Questions

### Strapi contract

- I: Question: Can one GraphQL query return a published-product count per category?
  Status: answered
  Answer: Not through `Category` (its `products` relation exposes no count and `categories { products_connection }`
  returns empty nodes), but a **single request with one aliased `products_connection` per category** works:
  `c0: products_connection(filters: { category: { customId: { eq: "tornilleria" } } }, pagination: { pageSize: 1 })
  { pageInfo { total } }` × 16. Verified live 2026-09-14 by the `backend-research` subagent: totals are
  Abrasivos 0, Adhesivos y selladores 2, Calibrador 5, Carburo 18, Equipo de seguridad 1, Extracción y Reparación de
  fijaciones 2, Herrajes y accesorios para cable 1, Herramientas de corte y conformado 75, Herramientas de diagnóstico
  de electricidad y electrónica 1, Herramientas de impacto o forja 2, Llaves y herramientas de apriete 33,
  Lubricantes multifuncionales 1, Perforación y accesorios para taladro 51, Roscado y herramientas para roscas 21,
  Sujeción 6, Tornillería 107 (sum 326) + 7 products with `category: null` = 333, matching
  `products_connection { pageInfo { total } }`.
  Context: the planner adds a `fetchCategoryProductCounts(customIds)` server action (or folds it into a
  `fetchCategoriesWithCounts`) that builds the aliased document dynamically — aliases must be GraphQL names
  (`c0`, `c1`, …, not the hyphenated `customId`s) and map back by index. Connection queries honour Draft & Publish,
  so counts are published-only. One extra request per `/categorias` render; failure of this second query should
  degrade to cards without the pill (wrap in `try`/`catch` in the page, same as the layout does for taxonomy) rather
  than failing the page. Zero is a real value (`Abrasivos` → `0 productos`).
- II: Question: Does `GET_CATEGORIES` (no `pagination` arg) reliably return all categories?
  Status: answered
  Answer: Today yes — 16 published categories and the header shows all 16 — but the subagent confirmed the count with
  an explicit `categories(pagination: { pageSize: 100 })`. The planner may add that arg to `GET_CATEGORIES` as
  cheap insurance for when the taxonomy grows past whatever the default is; not required for this story.
  Context: the `customId` values are already URL-safe slugs (`tornilleria`, `perforacion-accesorios-taladro`, …), a
  useful input for the future `/categorias/<slug>` routing decision — outside this story.
- III: Question: Why did `products(pagination: { pageSize: 1000 })` return only 100 rows when REPO_CONTEXT records
  `limit: 1000` returning 1000?
  Status: pending
  Context: observed live 2026-09-14 by the subagent (page-based `pageSize` appears capped at 100; offset-based
  `limit` may not be). Not needed for this story (counts come from `pageInfo.total`), but any future "fetch all
  products" code must use `pageInfo.total` + paging, never a single oversized `pageSize`.

### Catalog behavior

- I: Question: Is Strapi's default category order (creation order, effectively alphabetical today) acceptable, or
  should the query add `sort: ["name:asc"]` so the page and dropdown always match the comp's alphabetical list?
  Status: pending
  Context: D6 assumes Strapi order; a one-line `sort` arg would lock it in and also change the header's order.

### UI/product decisions

- I: Question: Card CTA state while `/categorias/<slug>` pages do not exist?
  Status: answered
  Answer: disabled `aria-disabled` span (D1).
- II: Question: Card content beyond name?
  Status: answered
  Answer: name + product count only (D2).
- III: Question: Hero `Cotizar ahora` target?
  Status: answered
  Answer: WhatsApp link, hidden when the number is unset (D3).
- IV: Question: Keep the client-side category search box?
  Status: answered
  Answer: dropped (D4).
- V: Question: Should the `Ver todas las categorías` row also appear when the page is already `/categorias`, or be
  hidden there?
  Status: pending
  Context: the comp's stale page header omits it, but that header is not of record (D5). Assumed **always shown**
  (simplest, consistent), the trigger's underline already signals the current page.

### Theme/persistence

- I: Question: none — the page uses the existing `dark:` class variants; no theme changes.
  Status: answered
  Answer: n/a.

### Verification

- I: Question: Does `__tests__/shared/Header.test.tsx` need a `useRouter` mock if the dropdown row uses `useRouter`
  for client navigation instead of `MenuItem href`?
  Status: pending
  Context: the current mock only covers `usePathname`/`useSearchParams`; a `next/link` row needs no router mock.
