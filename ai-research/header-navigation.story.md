# Header Navigation — Research

**Date:** 2026-09-14
**Branch:** `feat/enhance-header`
**Scope:** standalone story (single deliverable, ~3 phases)
**Design source:** Claude Design project "Tehesa UI mocks v1", file `Header.dc.html`
(https://claude.ai/design/p/4b99241e-42ab-4ca4-ac4e-c1cd49a75385?file=Header.dc.html). `support.js` is the generic
Claude Design runtime and carries no design content.

## Story Definition

### Title

Replace the root `Header` with the comp's utility bar + navigation header (desktop dropdowns, mobile side menu).

### Description

Today `src/shared/ui/organisms/Header.tsx` is a logo (`<Image>` swapped by theme), a `CartCount` link, and a
`ToggleDarkMode` button, rendered once from `src/app/layout.tsx` on every route. The comp turns it into a real
site header:

- **Utility bar** (dark strip above the header): a tagline plus a "request a quote" link that opens the existing
  WhatsApp click-to-chat action.
- **Desktop (≥ 1024px):** green-bar + "Tehesa" wordmark (no logo image), a `Productos` link, `Categorías` and
  `Marcas` dropdowns listing the live Strapi taxonomy, then cart badge and theme toggle on the right.
- **Mobile (< 768px, see D3):** wordmark, a lupa that opens the existing catalog-wide search drawer, the cart badge,
  and a hamburger that opens a right-side menu with `Productos`, `Categorías`/`Marcas` accordions, and a footer with
  `Solicitar cotización` (same WhatsApp action) and `Cambiar tema`.
- **Dark theme** is fully specified in the comp (desktop + mobile): header surface `#0B1A02`, borders `#1E3608`,
  the green `#4DF527` unchanged, active item `#B4FE99`, and the toggle shows a **sun** in dark mode.

Category/brand items are rendered disabled for now (D4): dedicated category and brand pages are planned, and the
header will link to them once they exist. The header adds no new catalog mode.

### Acceptance criteria

1. **Desktop nav.** At ≥ 768px (D3) the header renders the wordmark (links to `/`), `Productos` (links to `/`, shows the
   active underline only on `/`), and `Categorías` / `Marcas` triggers. Each trigger opens a dropdown listing every
   live category / brand from Strapi as a **disabled item** (D4 — no `href="#"`, no navigation) until the dedicated
   category/brand pages ship; the entry matching the current URL's `category`/`brand` is highlighted; the dropdown closes on outside click, `Escape`, and item
   selection. The cart badge and the theme toggle stay to the right and keep their current behavior.
2. **Mobile side menu.** Below 768px the nav row collapses to wordmark + lupa + cart + hamburger. The hamburger
   (`aria-expanded`) opens a right-side drawer (backdrop, `Escape`/backdrop/`Cerrar` close, focus trapped and
   returned to the trigger) with `Productos`, `Categorías` and `Marcas` accordions (one open at a time, `aria-expanded`
   on each header) listing the same links as AC1, and a footer with `Solicitar cotización` and `Cambiar tema`. Every
   tappable row/button is ≥ 44px tall.
3. **Lupa opens the existing drawer.** On `/`, the mobile lupa opens the already-implemented `CatalogSearchDrawer`
   (`Búsqueda ampliada`) — no second search UI is built. On routes where that drawer is not mounted (`/cotizar`) the
   lupa is hidden (D11).
4. **Utility bar → WhatsApp.** The utility bar renders the chosen copy (D6) on desktop and the one-line variant on
   mobile; its link and the side-menu `Solicitar cotización` button open `https://wa.me/<NEXT_PUBLIC_WHATSAPP_NUMBER>?text=<prefilled>`
   in a new tab (`target="_blank" rel="noopener noreferrer"`), built with the existing `buildWhatsappUrl`. When
   `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset the link and the side-menu button are hidden (D12) and nothing throws.
5. **Resilience + theme.** The header is sticky (D10), renders on every route, in light and dark per the comp's token mapping, and a
   Strapi taxonomy failure at layout level degrades to a header without dropdown items (no `global-error`, `pnpm build`
   still passes). Existing `Header`/`CartCount` tests are updated and new tests cover AC1–AC4 behaviors that are
   testable in jsdom (link hrefs, `aria-expanded`, active item, drawer open/close, WhatsApp href, unset-number case).

### Task breakdown (for the planner)

1. **Taxonomy at layout level** — fetch categories/brands once per request for the header (see "Taxonomy fetch" below),
   degrade on failure; pass to `Header`.
2. **Desktop header** — wordmark, `Productos`, two HeroUI `Dropdown`s with link items, active states from
   `usePathname`/`useSearchParams`; drop `<Image>` + `themeFetched`.
3. **Mobile header + side menu** — HeroUI `Drawer` (placement `right`) + `Accordion`, footer actions; lupa wiring to
   `CatalogSearchDrawer` (see "Search drawer seam").
4. **Utility bar + WhatsApp** — copy from D6, `buildWhatsappUrl` with a short prefilled text, unset-number fallback.
5. **Tests + docs** — update `__tests__/cart/CartCount.test.tsx` (`describe("Header")`), add a header test file,
   update `ai-skills/REPO_CONTEXT.md` (layout invariants) and `CLAUDE.md` architecture summary.

## Design Agent Handoff

**No design-brief file is produced for this story.** The comps already exist in the Claude Design project above
(light + dark, desktop + mobile, all interactive states). Export PNGs of the four frames (desktop light/dark, mobile
light/dark with the menu open) into `comps/header-navigation/` so `/check-design` and the implementer can reference
them without the design MCP.

### User goal, and what this is not

A buyer landing anywhere in the app can reach the product catalog, jump straight to a category or brand, open their
quote list, and start a WhatsApp conversation — from the header, on any device. It is **not** a mega-menu, a search
redesign (the lupa reuses the existing drawer), a new catalog mode, or a logo refresh (the logo is deliberately
withheld "for the time being"; the wordmark is a placeholder decision, see D1).

### Surface index

| Surface | File today | States | Covered by |
|---|---|---|---|
| Utility bar (desktop two-part / mobile one-line) | new, inside `Header.tsx` | default, link hover, `NEXT_PUBLIC_WHATSAPP_NUMBER` unset | comp §Escritorio/§Móvil, D6, UI-III |
| Wordmark | `Header.tsx` (replaces `<Image>`) | light/dark | comp, D1 |
| Desktop nav: `Productos` | `Header.tsx` | active (on `/`), inactive | comp |
| Desktop dropdowns: `Categorías` (350px, 16 items, scroll at 420px) / `Marcas` (220px, 7 items) | new; existing `DropdownCategories`/`DropdownBrands` are the precedent (HeroUI `Dropdown`) | closed, open, item hover, item active (matches URL), empty (Strapi failed) | comp, D4, D5 |
| Cart badge | `src/shared/ui/atoms/CartCount.tsx` | 0 (neutral), 1+, 99+, `aria-current` on `/cotizar` | unchanged behavior; restyle only (D7) |
| Theme toggle | `src/shared/ui/atoms/ToggleDarkMode.tsx` | light (moon icon), dark (sun icon) | comp §Tema oscuro (icon swap is new) |
| Mobile lupa | new, `Header.tsx` | default; hidden or redirecting off `/` | UI-II |
| Mobile side menu | new (HeroUI `Drawer` right + `Accordion`) | closed, open, one accordion expanded, active category | comp §Móvil, D3 |
| Side-menu footer | inside the drawer | `Solicitar cotización` (WhatsApp), `Cambiar tema` (light/dark icon) | comp, D6 |

### Rules that override design instinct

- **The cart badge at `0` stays neutral.** The comp draws the badge green with `cartCount = 3`; the cart epic
  (Story 1, AC 7) decided `0` is styled neutrally so it reads as "empty", not as an unread notification. Keep that.
- **Category/brand items do not navigate yet (D4)** — disabled items, never `href="#"`. When the dedicated pages
  land, link by taxonomy `name`, never `customId`, matching the existing URL contract.
- **No new search UI.** The comp's inline mobile search input is superseded by the user's decision that the lupa
  opens the existing `CatalogSearchDrawer` (D2).
- **Never present the WhatsApp link as a cart action.** It opens a conversation with a short prefilled text; it does
  not send the quote list (that is `/cotizar`'s `WhatsappCta`).

### Implementation-facing constraints

**Responsive.** The comp labels desktop `≥ 1024px` and mobile `< 768px`, leaving 768–1023 undefined; D3 assigns the
desktop nav from `md` (768px) where it fits. Use Tailwind `md:`/`lg:` classes to switch layouts, **not**
`useMediaQuery` (`src/shared/hooks/useMediaQuery.tsx` is synchronous, non-reactive, returns `false` on the server, and
would hydrate-mismatch a layout-level component). Render both nav variants and hide with CSS, or render one drawer
whose trigger is `md:hidden`.

**Accessibility.** Desktop triggers carry `aria-expanded`; dropdown items are disabled (`isDisabled` / `aria-disabled="true"`, D4) and become real
anchors when the category/brand pages exist. Mobile hamburger: `aria-label="Menú"`, `aria-expanded`. The
side menu is a dialog with a focus trap and focus return (HeroUI `Drawer` gives this). Accordion headers are buttons
with `aria-expanded`. Active category/brand link gets `aria-current="page"`. Icon-only controls (`Buscar`, `Carrito`
via `CartCount`'s sr-only text, `Cambiar tema`, `Cerrar`) have Spanish accessible names. Touch targets ≥ 44px on
mobile (comp: 44px buttons, 52px rows, 46px sub-rows).

**Visual.** Tokens per `DESIGN.md` — green `primary-200 #4DF527`, on-primary `#0D3401`, hover `primary-300 #3BD11A`,
active-item text `primary-700 #125D03` on `#F5FFEF`; dark surfaces `#0B1A02` / `#12250A`, borders `#1E3608` /
`#244310`, active `#B4FE99` on `#16300A`. Note the known gap: HeroUI's `--primary-*` is still blue, so existing
surfaces (`CartCount`, `CatalogHero`) use explicit Tailwind `emerald-*` classes. The header is the first surface where
the comp's exact green matters; see Open Question UI-IV before choosing between explicit hex/`emerald` classes and the
global remap — **decided (D14): explicit classes, header only.** Run `pnpm design:lint` only if `DESIGN.md` itself changes.

**Content.** All copy is Spanish. Category names come from Strapi (16 today; longest is 57 characters —
"Herramientas de diagnóstico de electricidad y electrónica" — which wraps to two lines in the 350px dropdown and the
320px drawer; the comp's `line-height:1.3` and `min-height` rows accommodate this). Brands: 7, longest 11 characters.
There is no ordering field on either type (verified 2026-09-14 by `backend-research`): sort by `name` client-side or
accept Strapi's default order.

**Out of scope.** Logo image (kept in `public/`, not rendered); a tablet-specific third layout; a mega-menu
with product counts; removing the catalog page's own dropdowns/`CatalogHero`; remapping HeroUI `--primary-*`
globally (D14); analytics events.

### Decision record

| # | Decision | Why | Status |
|---|---|---|---|
| D1 | Brand slot = 3px green bar + "Tehesa" wordmark linking to `/`; `<Image>` and `themeFetched` prop dropped. | User: "let's not show the current logo"; comp draws the wordmark. | settled 2026-09-14 |
| D2 | Mobile lupa opens the existing `CatalogSearchDrawer`; the comp's inline collapsing input is not built. | User answer; avoids a second search UI with its own validation. | settled 2026-09-14 |
| D3 | Desktop nav from `md` (768px) — tablet shows the desktop nav if it fits; the planner verifies at 768px and falls back to `lg` for any piece that does not (the two-part utility-bar sentence is the likely one; it may use the mobile one-liner until `lg`). | User: "show what desktop nav does if it fits on tablet". | settled 2026-09-14 |
| ~~D4~~ | ~~Dropdown/accordion items are real links to `buildModeUrl(mode, name, 1)`.~~ **Superseded:** items are rendered **disabled, never `href="#"`** — HeroUI `Dropdown.Item isDisabled` on desktop, and the repo's pagination precedent (`<span aria-disabled="true">`, non-focusable) inside the mobile accordions — until the dedicated category/brand pages exist. Active highlight still derives from `useSearchParams` when the URL is in category/brand mode. | User (2026-09-14): dedicated brand/category pages are coming; items must not navigate yet, and the repo's never-`href="#"` rule (`Home.tsx` pagination) is kept. Disabled items are announced as such and cannot scroll/push history. | settled 2026-09-14 |
| D5 | Only one mobile accordion section open at a time (comp `mSection`). | Comp behavior; 16 categories + 7 brands both open would exceed the 720px frame. | settled |
| D6 | Utility bar copy + prefilled WhatsApp text: three tone options proposed below; **option A chosen**. | User asked for three tones, picked A. | settled 2026-09-14 |
| D7 | Cart badge keeps `0`-neutral / `1+`-green styling and the `Ver mi lista, N artículos` name; only colors move to the comp's green. | Cart epic Story 1 AC 7 overrides the comp's static `3`. | settled |
| D8 | Theme toggle shows moon in light, sun in dark (comp §Tema oscuro); the `/api/preferences` cookie flow is unchanged. | Comp; the "next state" icon convention. | settled |
| D9 | Utility bar (the dark strip above the nav row) is always rendered (comp's `showUtilityBar` prop is a preview toggle, not a runtime feature). | User confirmed: always on. | settled 2026-09-14 |
| D15 | Remove the now-unconsumed `await getThemePreference()` from `layout.tsx`. | User decision; `getThemePreference` stays exported/tested for `/api/preferences` symmetry. | settled 2026-09-14 |
| D16 | The `describe("Header")` block moves out of `__tests__/cart/CartCount.test.tsx` into `__tests__/shared/Header.test.tsx`. | User decision. | settled 2026-09-14 |
| D10 | Header is sticky (`position: sticky; top: 0`), utility bar included. | User decision. | settled 2026-09-14 |
| D11 | Mobile lupa is hidden on `/cotizar` (only rendered where `Home` mounts the search drawer). | User decision. | settled 2026-09-14 |
| D12 | WhatsApp link/button is hidden when `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset; the tagline stays. | User decision. | settled 2026-09-14 |
| D13 | Copy option **A** ships. | User decision. | settled 2026-09-14 |
| D14 | The comp's green is applied with explicit classes scoped to the header only; no HeroUI `--primary-*` remap. | User: "only use that emerald color background for the header". | settled 2026-09-14 |

#### D6 — three copy options (utility bar + WhatsApp prefilled text)

Each option is: desktop bar text · desktop link label · mobile one-liner · prefilled WhatsApp message.

| Tone | Desktop bar | Link | Mobile | Prefilled WhatsApp text |
|---|---|---|---|---|
| **A. Comp-faithful, service-oriented** | Soluciones para ferretería e instalación industrial · ¿Necesitas una medida especial? | Solicitar cotización | ¿Medida especial? **Cotizar** | Hola, Tehesa. Necesito una cotización para una medida especial. ¿Me pueden ayudar? |
| **B. Direct, industrial-buyer** | Tornillería, herramienta y consumibles para planta y taller · ¿Volumen o medida fuera de catálogo? | Cotizar por WhatsApp | ¿Fuera de catálogo? **Cotizar** | Hola, Tehesa. Quiero cotizar piezas que no encuentro en el catálogo. Les comparto medidas y cantidades. |
| **C. Warm, low-friction** | Estamos para ayudarte a encontrar la pieza exacta · ¿No la ves en el catálogo? | Escríbenos por WhatsApp | ¿No la encuentras? **Escríbenos** | Hola, Tehesa. Busco una pieza que no aparece en el catálogo. ¿Me pueden cotizar? |

Recommendation: **A** — it matches the comp's rendered copy and the mobile abbreviation already fits the 390px bar.
The prefilled text must pass `sanitizeForWhatsapp` (no `*_~\``, no control chars) and is far below
`WHATSAPP_URL_MAX_ENCODED_LENGTH`.

## Technical Research

### Affected areas

| Area | Path | Change |
|---|---|---|
| Root layout | `src/app/layout.tsx` | Fetch taxonomy for the header (degrading on failure); pass it to `Header`; `getThemePreference()` loses its only consumer once the logo goes (see "Consequences of dropping `themeFetched`"). |
| Header organism | `src/shared/ui/organisms/Header.tsx` | Rewritten: utility bar, wordmark, desktop nav + dropdowns, mobile row + side menu. Likely split into `Header.tsx` + `HeaderNav.tsx`/`MobileMenu.tsx` inside `src/shared/ui/organisms/` (cross-cutting, lives on every route → `src/shared`, not `src/features`). |
| Cart badge | `src/shared/ui/atoms/CartCount.tsx` | Restyle only (green per comp, 40px desktop / 44px mobile hit area). Behavior and accessible name unchanged. |
| Theme toggle | `src/shared/ui/atoms/ToggleDarkMode.tsx` | Green filled round button; `RiMoonLine` in light, `RiSunLine` in dark; a text-label variant (`Cambiar tema`) for the side-menu footer. |
| Search drawer seam | `src/features/Home/Home.tsx`, `src/features/Home/useCatalogSearch.ts`, `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx` | The drawer's `useOverlayState` lives inside `Home`; the header must be able to open it (see below). |
| WhatsApp | `src/shared/constants/whatsapp.constants.ts`, `src/shared/utils/whatsapp-message.utils.ts` | Reuse `WHATSAPP_NUMBER` + `buildWhatsappUrl` + `sanitizeForWhatsapp`; add one constant for the prefilled text. No new utility. |
| URL builders | `src/features/Pagination/utils.pagination.ts` | Not needed now (D4: disabled items). `buildModeUrl(mode, value, page)` is the builder to use when real category/brand pages exist. |
| Tests | `__tests__/cart/CartCount.test.tsx` (`describe("Header")` renders `<Header themeFetched="light" />` and asserts `getByRole("button")` is unique — both break), new `__tests__/shared/Header.test.tsx` | See "Tests". |
| Docs | `ai-skills/REPO_CONTEXT.md` (layout invariant, `Header` description, `useMediaQuery` note), `CLAUDE.md` architecture summary | Keep in sync after implementation. |

### Existing patterns to follow

- **Server/client split.** `layout.tsx` is an `async` server component; `Header` is `"use client"`. Taxonomy is
  fetched server-side via the `"use server"` actions `fetchCategories`/`fetchBrands` in `src/shared/lib/global.lib.ts`
  and passed as props — the client never imports `global.lib.ts`.
- **Degrade, don't throw, at layout level.** `src/app/sitemap.ts` wraps its taxonomy fetch in try/catch and falls
  back to base pages so a Strapi outage never fails the build. The layout must do the same: a throw in the root layout
  is not caught by `src/app/error.tsx` (that boundary wraps the page segment, not the root layout) and would surface as
  Next's default global error on every route.
- **HeroUI primitives already installed** (`node_modules/@heroui/react/dist/components/`): `dropdown` + `menu`
  (desktop menus; `DropdownCategories`/`DropdownBrands` are the in-repo precedent, using a `Button` trigger and
  `Dropdown.Item` with `onAction`), `drawer` (side menu; `CatalogSearchDrawer` uses `placement="left"`,
  `ProductVariantsDrawer` is the other precedent), `accordion` / `disclosure` (mobile sections). There is **no**
  `navbar` component in HeroUI v3 — the header row is plain Tailwind flex.
- **Anchors for navigation.** `Home.tsx` renders pagination as `next/link` anchors styled with HeroUI slot classes
  (`pagination__link`, `buttonVariants()`), never `href="#"`. D4 keeps that rule: dropdown/accordion items are disabled
  (`Dropdown.Item isDisabled`; `<span aria-disabled="true">` rows in the accordions) until real pages exist.
  react-aria-components' `MenuItem` accepts `href` and renders an `<a>`; verify at plan time that HeroUI's
  `Dropdown.Item`/`Menu.Item` forwards it so the later swap to real links is a one-line change.
- **Cart badge mounted-guard.** `CartCount` renders `0` until mounted to avoid a hydration mismatch with
  `localStorage`; the same guard applies to anything in the header that reads the cart or the theme
  (`ToggleDarkMode` returns `null` until mounted — note that this leaves an empty 40px slot on first paint; the comp
  reserves the space, so consider rendering a placeholder of the same size).
- **Icons:** `@remixicon/react` (`RiSearchLine`, `RiMenuLine`, `RiCloseLine`, `RiArrowDownSLine`, `RiMoonLine`,
  `RiSunLine`, `RiShoppingCart2Line`, `RiArrowRightLine`) — do not inline the comp's SVGs.
- **Copy specificity and control flow** per `docs/IMPLEMENTATION_GUIDELINES.md`.

### Taxonomy fetch: where and how

The header needs `categories`/`brands` on every route, but only `src/app/page.tsx` fetches them today, and Apollo
clients are per-call with no request-level dedupe (`ai-skills/REPO_CONTEXT.md` → SEO notes). Two viable shapes for the
planner:

1. **Fetch in `layout.tsx`, accept the duplicate on `/`.** Simplest; two extra small queries per catalog request
   (16 + 7 rows). `page.tsx` keeps its own fetch for `Home`'s dropdowns and validation.
2. **Dedupe with `React.cache`.** Wrap the two adapters in `cache()` in a plain (non-`"use server"`) module and import
   that from both `layout.tsx` and `page.tsx`. Caveat: `"use server"` files may only export async functions, so the
   `cache()` wrapper cannot live in `global.lib.ts` itself — it needs a sibling module (e.g.
   `src/shared/lib/taxonomy.cache.ts`). `cache()` dedupes within one server request only, which is exactly the scope
   needed.

Either way the layout fetch must be wrapped so failure → `{ categories: [], brands: [] }` (AC5). Recommend starting
with (1) plus a `ponytail:` note; move to (2) if the duplicate shows up in Strapi logs.

Layouts cannot pass props to pages, so `Home` still receives taxonomy from `page.tsx`; there is no way to "share" the
layout's copy with the page without (2).

### Search drawer seam (AC3)

`CatalogSearchDrawer` is rendered by `Home` (only on `/`), with its `useOverlayState` created inside
`useCatalogSearch`. The header is above `Home` in the tree and on every route. Options:

- **(a) Cross-tree open signal.** A tiny client store (Zustand, provider-wraps-store pattern like `cart.provider.tsx`)
  or a `CustomEvent` on `window` that `Home` subscribes to and calls `catalogSearchDrawerState.open()`. Smallest
  change to `Home`; the header stays ignorant of the drawer. On `/cotizar` nobody listens, so the lupa is hidden there (D11) — the
  header knows via `usePathname()`.
- **(b) Lift the drawer into the layout.** The drawer needs taxonomy (the header already has it) and the navigation
  handlers currently in `Home` (`handleCategorySelect`, `handleBrandSelect`, `handleCatalogNameSearchSubmit`, the
  close-then-navigate delays, `pageFeedback` reset). Lifting means moving `useCatalogSearch` and those handlers out
  of `Home` — a larger refactor of `Home.tsx`/`Home.test.tsx` than this story asks for.

Recommend (a) with a `CustomEvent` (no new store, no new provider) unless the planner finds `Home`'s `pageFeedback`
reset needs to be coordinated. Note `Home` also opens the drawer from `CatalogHero`'s `Buscar en catálogo completo`
and `ProductListing`'s empty state; the header becomes a third trigger of the same state.

### Consequences of dropping `themeFetched`

`getThemePreference()` in `layout.tsx` exists only to pick the logo asset before hydration. With the wordmark, the
prop and the `useTheme`+`mounted` dance in `Header.tsx` go away. If the `await getThemePreference()` is also removed,
`cookies()` is no longer called in the root layout, which un-forces dynamic rendering of `/cotizar` (harmless — it is
client-state driven and `noindex`) and removes a documented invariant in `ai-skills/REPO_CONTEXT.md` ("Key invariants",
first bullet). `getThemePreference`/`saveThemeCookie` and `POST /api/preferences` stay (the toggle still writes the
cookie); `NextThemesProvider defaultTheme="light"` is unchanged. Flag this as a deliberate cleanup in the plan or leave
the call in place — either is fine, but the doc must say which.

### Active-state derivation

`Productos` active ⇔ `usePathname() === "/"`. Category/brand active ⇔ `useSearchParams().get("mode")` is
`category`/`brand` and `get("category")`/`get("brand")` equals the item name (decoded names are what the URL carries).
`useSearchParams` in a client component rendered by the root layout should sit inside a `<Suspense>` boundary; all
routes are dynamic today, but the boundary is cheap insurance against a future static route failing `pnpm build` with
the "useSearchParams should be wrapped in a suspense boundary" error.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` (root layout changes affect every route; the build is the only
  check that catches a `global-error`-class failure and the `useSearchParams`/Suspense rule).
- `pnpm test -- __tests__/cart/CartCount.test.tsx __tests__/shared/Header.test.tsx` during work; full `pnpm test` before
  the PR (`Home.test.tsx` covers the drawer trigger path if (a) touches `Home`).
- Manual: desktop dropdown keyboard path (Tab → trigger, Enter/Space opens, arrows move, Esc closes, focus returns),
  mobile drawer at 390px in both themes, the 57-char category wrapping, `Escape` closing the side menu.
- Do not run `pnpm install`; no new dependencies.

### Dependencies / integration points

- No new packages. HeroUI `Dropdown`/`Menu`/`Drawer`/`Accordion`, `@remixicon/react`, `next/link`, `next/navigation`.
- Env: `STRAPI_HOST` + `STRAPI_API_TOKEN` (taxonomy), `NEXT_PUBLIC_WHATSAPP_NUMBER` (utility bar link). The latter is
  read at module scope in `whatsapp.constants.ts`; unset must degrade, never throw (same rule as `WhatsappCta`).
- Public assets `public/tehesa-logo.webp` / `public/tehesa-logo-negativo.webp` become unreferenced; leave them.

### Edge cases and constraints

- **Strapi down at layout level** → empty taxonomy → dropdown triggers either hidden or rendered disabled with no
  items (planner picks; hiding avoids an empty popover). Must not throw.
- **Disabled items (D4)**: a dropdown of 16 disabled entries is still readable (RAC keeps disabled items in the
  collection, skipped by arrow navigation but announced); nothing scrolls or pushes history.
- **Long category names** (57 chars) wrap inside the 350px desktop menu and the 320px drawer; rows use `min-height`
  not fixed `height`.
- **`CartCount` count at `0`** stays neutral (D7); `99+` must not widen the 390px row.
- **Theme toggle before mount** renders nothing today; the comp reserves 40/44px — reserve the slot.
- **`/cotizar`**: `Productos` not active; `CartCount` carries `aria-current="page"` (existing); lupa hidden (D11).
- **Sticky header (D10)**: needs a `z-index` below the drawers/toast (`z-50`/`z-[60]`) but above page content; `/cotizar`'s focus-to-list-region scroll and `Home`'s `window.scrollTo({ top: 0 })` should land below the sticky bar (use `scroll-margin-top` on the targets or accept the overlap — planner's call).
- **Drawer stacking**: `Toast.Provider` is `z-[60]` because HeroUI overlays are `z-50`; a second `Drawer` (side menu)
  is another `z-50` portal — a toast fired while the menu is open still stacks above it. The catalog search drawer and
  the side menu should never be open simultaneously (the lupa is outside the menu, so this is naturally true).
- **Mobile keyboard** is not a concern here (no input in the header after D2).
- **Existing test coupling**: `__tests__/cart/CartCount.test.tsx` mocks `next/navigation` with only `usePathname`;
  the new header also calls `useSearchParams` (and possibly `useRouter`) — the mock must grow, and jsdom has no
  layout, so `md:` visibility cannot be asserted; test both variants by role/name, not by visibility.

## Open Questions

### UI/product decisions

- I: Question: D3 — is a single `lg` (1024px) breakpoint acceptable, so 768–1023 (tablet) uses the mobile header?
  Status: answered
  Answer: No — show the desktop nav on tablet if it fits. Desktop layout from `md` (768px); the planner verifies at 768px and keeps only the pieces that do not fit (likely the two-part utility-bar sentence) on the mobile variant until `lg`.
  Context: The comp says desktop ≥ 1024 and mobile < 768 and shows nothing for the band between. Desktop nav with
  `Productos · Categorías · Marcas` + wordmark + two icons fits at 768px in principle, but the 350px dropdown and the
  utility bar's two-part sentence do not.
- II: Question: On `/cotizar`, where `CatalogSearchDrawer` is not mounted, should the mobile lupa be hidden, or
  navigate to `/` (and then open the drawer)?
  Status: answered
  Answer: Hide it on `/cotizar`.
  Context: Option (a) in "Search drawer seam" only works where `Home` is mounted. Hiding is simplest and honest;
  navigating-then-opening needs a query flag or a one-shot store value that `Home` consumes on mount.
- III: Question: When `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset, should the utility-bar link (and the side-menu button)
  fall back to a `/cotizar` link, render as a non-focusable `aria-disabled` span (the `WhatsappCta` pattern), or be
  hidden?
  Status: answered
  Answer: Hide the link (and the side-menu button); keep the tagline.
  Context: `WhatsappCta` renders a disabled span with an explanatory message; the utility bar has no room for a
  message. Recommendation: hide the link (keep the tagline) — a dead link in a header is worse than no link.
- IV: Question: Should this story use explicit green classes (hex/`emerald-*`, the `CartCount`/`CatalogHero`
  precedent) or is it the moment to remap HeroUI's `--primary-*` variables to the `DESIGN.md` scale?
  Status: answered
  Answer: Explicit green classes, scoped to the header only. No global remap in this story.
  Context: `DESIGN.md` and `ai-skills/REPO_CONTEXT.md` (Open Questions) both call the remap "a pending deliberate
  change". The header's filled green toggle/hamburger is the first primary-colored control that must match the comp
  exactly. Remapping changes every HeroUI `primary` button in the app at once — larger blast radius than this story.
  Recommendation: explicit classes now; remap as its own story.
- V: Question: D6 — which of the three copy options (A/B/C) ships?
  Status: answered
  Answer: A.
  Context: See the D6 table. Recommendation: A.
- VI: Question: D9 — is the utility bar always on (no runtime toggle)?
  Status: answered
  Answer: Yes, always on.
  Explanation: "Utility bar" = the thin dark strip (`#0F2001`) rendered *above* the white nav row in the comp — "Soluciones para ferretería e instalación industrial · ¿Necesitas una medida especial? Solicitar cotización" on desktop, "¿Medida especial? Cotizar" on mobile. It is not the hamburger menu. The comp has a `showUtilityBar` preview toggle; the question is whether the app ever hides that strip. Assumed: always shown.
  Context: The comp's `showUtilityBar` is a preview prop; nothing in the app would flip it.
- VII: Question: Should the header be sticky?
  Status: answered
  Answer: Yes, sticky (utility bar included).
  Context: The comp does not specify; today's header scrolls away. Sticky interacts with the `/cotizar` page's
  focus-to-list-region behavior and with the drawers' backdrops. Recommendation: not sticky in this story.

### Catalog behavior

- I: Question: Should dropdown/accordion items sort categories/brands alphabetically client-side, or keep Strapi's
  order?
  Status: answered
  Answer: No ordering field exists (`category`/`brand` schemas have only `name`, `customId`, `products`), so the
  choice is purely frontend. Keep Strapi's default order unless the comp order (alphabetical, which is what the live
  data already is) is meant to be enforced — sorting by `name` with `localeCompare("es")` is one line and stable.
  Context: `backend-research`, 2026-09-14, local schema + live introspection: 16 published categories (longest 57
  chars), 7 brands (longest 11), no `order`/`position` field, no parent/child relation.
- II: Question: Do dropdown links need client-side navigation (`next/link` / RAC `RouterProvider`) or is a full-page
  `<a>` acceptable?
  Status: answered
  Answer: Neither yet — dedicated brand and category pages are planned; for now items are rendered disabled, never
  `href="#"` (D4, repo rule kept). Revisit when those pages exist.
  Context: `Home.tsx` uses `router.push` for catalog navigation and `next/link` for pagination; `buildModeUrl` is
  the builder to reach for when real hrefs arrive.

### Strapi contract

- I: Question: Does the header need any new query or field?
  Status: answered
  Answer: No. `fetchCategories`/`fetchBrands` (`GET_CATEGORIES`/`GET_BRANDS`, `TaxonomyItem { name, customId }`)
  already return everything the comp shows. Both pass explicit `pagination` (mandatory — omitting it returns 10 rows).
  Context: `src/shared/queries/global.queries.ts`, `ai-skills/REPO_CONTEXT.md` → Data Flow.

### Theme/persistence

- I: Question: Remove the now-unconsumed `await getThemePreference()` from `layout.tsx`, or leave it?
  Status: answered
  Answer: Remove it (D15). Update the "every route is dynamic" invariant in `ai-skills/REPO_CONTEXT.md`.
  Context: See "Consequences of dropping `themeFetched`". Removing it is the smaller runtime; leaving it keeps the
  documented "every route is dynamic" invariant. Either way `getThemePreference` stays exported and tested.

### Verification

- I: Question: Should the new header tests live in `__tests__/shared/Header.test.tsx`, with the existing
  `describe("Header")` block moved out of `__tests__/cart/CartCount.test.tsx`?
  Status: answered
  Answer: Move it (D16).
  Context: `docs/UNIT_TESTING_GUIDELINES.md` governs; the current block exists only because Story 1 added the badge to
  the header. Recommendation: move it.
