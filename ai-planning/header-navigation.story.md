# Plan: Header Navigation (Utility Bar + Desktop Dropdowns + Mobile Side Menu)

**Source research:** `ai-research/header-navigation.story.md` (2026-09-14, branch `feat/enhance-header`).
**Sign-off status:** the research file carries no explicit sign-off line, but every open question (UI I–VII, Catalog I–II, Strapi I, Theme I, Verification I) is answered and dated 2026-09-14 and D1–D16 are all `settled`. Treated as signed off — same basis as `planning-plp-catalog-api.story1a.md`. **Confirm before `/implement`.**
**Plan date:** 2026-09-14.

## Assumptions

- **Every route stays dynamic, explicitly.** D15 removes `await getThemePreference()` from `layout.tsx`, which was the only thing forcing `/cotizar` dynamic. The header now fetches taxonomy in the root layout; if `/cotizar` prerendered statically, its header would carry *build-time* taxonomy (empty in CI, where Strapi env is absent) and `useSearchParams` in the header would fail `pnpm build` without a Suspense boundary. `export const dynamic = "force-dynamic"` in `src/app/layout.tsx` keeps the documented "every route is dynamic" invariant as a one-line config instead of a cookie side effect. Because of it, no `<Suspense>` around `useSearchParams` is planned (the research called it "cheap insurance"; with `force-dynamic` at the root it is dead code — if the config is ever removed, `pnpm build` fails loudly).
- **Taxonomy fetch shape (1):** fetch in `layout.tsx`, accept the duplicate query on `/` (16 + 7 rows), `ponytail:` note; no `React.cache` module.
- **Search-drawer seam (a):** a `CustomEvent` on `window`; no new store/provider.
- **Empty taxonomy** (Strapi down): the `Categorías`/`Marcas` triggers and the matching mobile accordions are **not rendered** (research: "hiding avoids an empty popover").
- **Sticky overlap:** `/cotizar`'s focus-to-list-region scroll and `Home`'s `scrollTo({ top: 0 })` may land under the sticky bar; accepted (research: "planner's call"), recorded under Out of scope.
- **D3 breakpoints:** desktop nav row from `md:` (768px); the two-part utility-bar sentence from `lg:` (1024px), the mobile one-liner below `lg`. The implementer verifies at 768px and moves any other piece to `lg:` if it wraps — no third layout.
- **Ordering:** Strapi's default order (already alphabetical) — no client-side sort.
- Env available: `.env.local` has `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER`. Dev-server checks assume `pnpm dev` on `http://localhost:3000`.

## Acceptance Criteria

1. **Desktop nav.** At ≥ 768px (D3) the header renders the wordmark (links to `/`), `Productos` (links to `/`, shows the active underline only on `/`), and `Categorías` / `Marcas` triggers. Each trigger opens a dropdown listing every live category / brand from Strapi as a **disabled item** (D4 — no `href="#"`, no navigation) until the dedicated category/brand pages ship; the entry matching the current URL's `category`/`brand` is highlighted; the dropdown closes on outside click, `Escape`, and item selection. The cart badge and the theme toggle stay to the right and keep their current behavior.
2. **Mobile side menu.** Below 768px the nav row collapses to wordmark + lupa + cart + hamburger. The hamburger (`aria-expanded`) opens a right-side drawer (backdrop, `Escape`/backdrop/`Cerrar` close, focus trapped and returned to the trigger) with `Productos`, `Categorías` and `Marcas` accordions (one open at a time, `aria-expanded` on each header) listing the same links as AC1, and a footer with `Solicitar cotización` and `Cambiar tema`. Every tappable row/button is ≥ 44px tall.
3. **Lupa opens the existing drawer.** On `/`, the mobile lupa opens the already-implemented `CatalogSearchDrawer` (`Búsqueda ampliada`) — no second search UI is built. On routes where that drawer is not mounted (`/cotizar`) the lupa is hidden (D11).
4. **Utility bar → WhatsApp.** The utility bar renders the chosen copy (D6) on desktop and the one-line variant on mobile; its link and the side-menu `Solicitar cotización` button open `https://wa.me/<NEXT_PUBLIC_WHATSAPP_NUMBER>?text=<prefilled>` in a new tab (`target="_blank" rel="noopener noreferrer"`), built with the existing `buildWhatsappUrl`. When `NEXT_PUBLIC_WHATSAPP_NUMBER` is unset the link and the side-menu button are hidden (D12) and nothing throws.
5. **Resilience + theme.** The header is sticky (D10), renders on every route, in light and dark per the comp's token mapping, and a Strapi taxonomy failure at layout level degrades to a header without dropdown items (no `global-error`, `pnpm build` still passes). Existing `Header`/`CartCount` tests are updated and new tests cover AC1–AC4 behaviors that are testable in jsdom (link hrefs, `aria-expanded`, active item, drawer open/close, WhatsApp href, unset-number case).

## Affected Files

**`src/app/`**
- `layout.tsx` — Modify: drop `getThemePreference`, add `export const dynamic = "force-dynamic"`, fetch taxonomy with try/catch, pass `categories`/`brands` to `Header`.

**`src/features/`**
- `Home/Home.tsx` — Modify: subscribe to the open-search `CustomEvent` and call `catalogSearchDrawerState.open()`.

**`src/shared/`**
- `ui/organisms/Header.tsx` — Rewrite: utility bar, wordmark, desktop nav + dropdowns, mobile row (lupa, cart, hamburger), sticky shell.
- `ui/organisms/MobileMenu.tsx` — Create: right-side HeroUI `Drawer` with `Accordion` sections and footer actions.
- `ui/atoms/ToggleDarkMode.tsx` — Modify: sun/moon swap, Spanish accessible name, optional text label, no pre-mount `null`.
- `ui/atoms/CartCount.tsx` — Modify: green restyle only.
- `constants/catalog.constants.ts` — Modify: `CATALOG_SEARCH_OPEN_EVENT` name.
- `constants/whatsapp.constants.ts` — Modify: `WHATSAPP_HEADER_MESSAGE` (D6 option A).

**`__tests__/`**
- `cart/CartCount.test.tsx` — Modify: delete `describe("Header")` (D16).
- `shared/Header.test.tsx` — Create.
- `home/Home.test.tsx` — Modify: one test for the `CustomEvent` → drawer path.

**Docs**
- `ai-skills/REPO_CONTEXT.md`, `CLAUDE.md` — Modify: layout invariant, `Header` description, env var note.

Untouched, deliberately: `public/tehesa-logo*.webp` (unreferenced, kept), `src/features/Pagination/utils.pagination.ts` (D4), `global.lib.ts`, `globals.css`/`DESIGN.md` (D14: no `--primary-*` remap), `useMediaQuery`.

---

## Phase 1 — Layout Taxonomy + Desktop Header

Delivers AC1, the sticky/every-route/degrade parts of AC5, and the `Header`/`CartCount` test move. Mobile below `md` renders wordmark + cart + toggle only (the lupa/hamburger arrive in Phase 2), so the app is never broken between phases.

### Changes Required

**`src/app/layout.tsx`** — Modify `RootLayout`

- Remove the `getThemePreference` import and `await` (D15). Add `export const dynamic = "force-dynamic"` with a one-line comment: header taxonomy must be live per request and the header reads `useSearchParams` (see Assumptions).
- Fetch taxonomy exactly like `src/app/sitemap.ts` lines 22-41: `try { const [categories, brands] = await Promise.all([fetchCategories(), fetchBrands()]) } catch (error) { console.warn("layout: failed to fetch category/brand taxonomy, rendering header without dropdown items", error); categories = []; brands = [] }`. Inline in the layout — no helper module. Add `// ponytail: duplicates page.tsx's taxonomy query on /; React.cache() module if it shows in Strapi logs.`
- Render `<Header categories={categories} brands={brands} />` inside `NextThemesProvider`, unchanged position.

Edge: a throw here is *not* caught by `src/app/error.tsx` (page-segment boundary) — the try/catch is the only guard, so it must wrap both fetches.

**`src/shared/ui/organisms/Header.tsx`** — Rewrite (`"use client"`)

```ts
interface HeaderProps { categories: TaxonomyItem[]; brands: TaxonomyItem[] }
```

- `usePathname()` → `isCatalog = pathname === "/"`; `useSearchParams()` → `activeCategory = get("mode") === "category" ? get("category") : null`, same for brand. Pass both to the dropdowns (and, in Phase 2, to `MobileMenu`).
- Structure: `<header className="sticky top-0 z-40 …">` (below HeroUI's `z-50` overlays and `Toast.Provider`'s `z-[60]`) → `[utility bar placeholder — Phase 3]` → nav row `<div className="flex h-16 items-center justify-between px-4 md:px-6">`:
  - Wordmark: `next/link` to `/` — `<span aria-hidden className="h-6 w-[3px] bg-[#4DF527]" />` + `Tehesa`, `aria-label="Tehesa, inicio"`.
  - Desktop nav `<nav aria-label="Principal" className="hidden md:flex …">`: `Productos` as `next/link` `href="/"` with `aria-current={isCatalog ? "page" : undefined}` and the underline class keyed on `isCatalog`; then `<TaxonomyDropdown label="Categorías" items={categories} activeName={activeCategory} />` and the `Marcas` twin — **rendered only when `items.length > 0`**.
  - Right cluster: `<CartCount />` + `<ToggleDarkMode />` (both variants), `md:hidden` slot reserved for lupa + hamburger (Phase 2).
- `TaxonomyDropdown` — module-private component in the same file (not exported; it is header-only):
  - HeroUI `Dropdown` → `Button` trigger (`variant="ghost"`, `RiArrowDownSLine`; RAC sets `aria-expanded`) → `Dropdown.Popover` → `Dropdown.Menu aria-label={label}` (`className="w-[350px] max-h-[420px] overflow-y-auto"` for categories, `w-[220px]` for brands — pass via a `menuClassName` prop) → one `Dropdown.Item` per item: `id={item.name}` `textValue={item.name}` **`isDisabled`** (D4; `Dropdown.Item` extends RAC `MenuItem`, verified in `node_modules/@heroui/react/dist/components/menu-item/menu-item.d.ts` — it also forwards `href`, so the later swap to real links is `href={buildModeUrl(...)}` minus `isDisabled`), `aria-current={item.name === activeName ? "page" : undefined}`, active classes `bg-[#F5FFEF] text-[#125D03] dark:bg-[#16300A] dark:text-[#B4FE99]`. Row: `min-h-11 leading-[1.3] whitespace-normal` so the 57-char category wraps.
  - No `onAction` — nothing navigates yet. RAC closes on `Escape`/outside click by default; item selection on a disabled item is a no-op, which satisfies "closes on selection" trivially (record in the test as the disabled-item assertion).
- Colors (D14): explicit hex classes only inside this file + `MobileMenu.tsx`: surface `bg-white dark:bg-[#0B1A02]`, border `border-b border-default-200 dark:border-[#1E3608]`, green `#4DF527`, hover `#3BD11A`, on-green text `#0D3401`, active `#B4FE99`.
- Delete: `next/image`, `useTheme`, `mounted`, `themeFetched`.

**`src/shared/ui/atoms/ToggleDarkMode.tsx`** — Modify

- Props: `{ showLabel?: boolean }` (default `false`).
- Remove the `if (!mounted) return null` branch — always render the button so the 40px slot is reserved. Icon: `mounted && theme === "dark" ? <RiSunLine/> : <RiMoonLine/>` (server and first client render both show the moon → no hydration mismatch; D8 sun-in-dark after mount).
- `aria-label="Cambiar tema"` when icon-only (today the button has **no accessible name**); with `showLabel`, render the text `Cambiar tema` beside the icon and omit `aria-label`.
- Classes: green filled round `bg-[#4DF527] text-[#0D3401] hover:bg-[#3BD11A] size-10 md:size-10 rounded-full` (mobile row uses `size-11` via Phase 2's wrapper). Handler unchanged (`saveThemeApi` + `setTheme`).

**`src/shared/ui/atoms/CartCount.tsx`** — Modify lines 26-35 only

- Badge `1+` colors → `bg-[#4DF527] text-[#0D3401]` (light and dark; the comp keeps the green unchanged in dark). `0` stays neutral (D7). Hit area `size-10 md:size-10` desktop / `size-11` mobile — express as `size-11 md:size-10`. No behavior/name change.

**`__tests__/cart/CartCount.test.tsx`** — Modify: delete lines 100-109 (`describe("Header")`) and the `Header` import (D16).

**`__tests__/shared/Header.test.tsx`** — Create (per `docs/UNIT_TESTING_GUIDELINES.md`)

- Mock `next/navigation` with `usePathname` **and** `useSearchParams` (`jest.fn(() => new URLSearchParams(""))`), both overridable per test. Fixtures: 2 categories (one 57 chars), 2 brands.
- Checks (roles/names only, never `md:` visibility — jsdom has no layout): wordmark link `href="/"`; `Productos` link `href="/"` with `aria-current="page"` on `/` and without it on `/cotizar`; `Categorías` trigger has `aria-expanded="false"`, after `user.click` → `true` and a `menu` with N `menuitem`s, each `aria-disabled="true"` and none with `href`; with `useSearchParams` → `mode=category&category=<name>` the matching item has `aria-current="page"`; `Escape` closes (`aria-expanded="false"`); with `categories=[]` the `Categorías` trigger is absent; cart link (`Ver mi lista, 0 artículos`) and `Cambiar tema` button both present.

### Success Criteria

- **Automated:** `pnpm exec tsc --noEmit`; `pnpm test -- __tests__/shared/Header.test.tsx __tests__/cart/CartCount.test.tsx`; `pnpm build` (root layout changed — this is the only check for a `global-error`-class failure and for `force-dynamic` taking effect: the build output must list `/` and `/cotizar` as dynamic (`ƒ`), never static (`○`)).
- **Dev-server validation** (`pnpm dev`):
  - `GET /` → 200; body contains `Tehesa`, `Productos`, `Categorías`, `Marcas`, `Ver mi lista, 0 artículos`, `Cambiar tema`; the `Productos` anchor carries `aria-current="page"`; no `tehesa-logo` `<img>`; no `CAT_ERR_*`, no hydration warning in the server log.
  - `GET /cotizar` → 200; same header markup, `Productos` **without** `aria-current`.
  - `GET /?mode=category&category=<a live name>&page=1` → 200 (the highlighted item lives in a closed popover — not in SSR HTML; covered by the jest active-item check).
  - Degrade: restart with `STRAPI_HOST=http://127.0.0.1:9 pnpm dev` → `GET /cotizar` → 200, header rendered **without** `Categorías`/`Marcas`, server log shows the `layout: failed to fetch …` warning and **no** unhandled error; `GET /` shows the existing `error.tsx` boundary (page fetch fails — expected, unchanged behavior). Restore env afterwards.
- **Manual:** at ≥ 768px open `Categorías`: 16 disabled rows, the 57-char row wraps to two lines, scroll appears past 420px; keyboard path Tab → trigger, Enter opens, arrows skip disabled items, Esc closes and returns focus; header stays pinned while scrolling; dark theme shows `#0B1A02` surface and the sun icon.

### Verification Coverage

| Area/File | Check | Reference |
|---|---|---|
| `src/app/layout.tsx` | taxonomy passed, degrade path, dynamic rendering | `pnpm build` output + degrade `curl` |
| `src/shared/ui/organisms/Header.tsx` | links, `aria-current`, `aria-expanded`, disabled items, active item, hidden-when-empty | `__tests__/shared/Header.test.tsx` + `curl /` |
| `src/shared/ui/atoms/ToggleDarkMode.tsx` | accessible name, always rendered | Header test (`button` named `Cambiar tema`) + manual icon swap |
| `src/shared/ui/atoms/CartCount.tsx` | behavior unchanged | existing `__tests__/cart/CartCount.test.tsx` |

---

## Phase 2 — Mobile Row, Side Menu, Lupa Seam

Delivers AC2 and AC3.

### Changes Required

**`src/shared/constants/catalog.constants.ts`** — Modify: add `export const CATALOG_SEARCH_OPEN_EVENT = "tehesa:open-catalog-search"`.

**`src/features/Home/Home.tsx`** — Modify, near line 134 (`useEffect`)

```ts
useEffect(() => {
  const open = () => catalogSearchDrawerState.open()
  window.addEventListener(CATALOG_SEARCH_OPEN_EVENT, open)
  return () => window.removeEventListener(CATALOG_SEARCH_OPEN_EVENT, open)
}, [catalogSearchDrawerState])
```

`Home` stays the sole owner of the drawer; the header becomes the third trigger after `CatalogHero` and `ProductListing`'s empty state. No `pageFeedback` coordination is needed (opening the drawer never touched it before either).

**`src/shared/ui/organisms/MobileMenu.tsx`** — Create (`"use client"`)

```ts
interface MobileMenuProps {
  categories: TaxonomyItem[]; brands: TaxonomyItem[]
  isCatalog: boolean; activeCategory: string | null; activeBrand: string | null
  whatsappUrl: string | null   // Phase 3 wires it; Phase 2 passes null
}
```

- `const state = useOverlayState()`; trigger: HeroUI `Button isIconOnly aria-label="Menú" aria-expanded={state.isOpen} onPress={state.open}` (`RiMenuLine`, `size-11`, green fill per comp). Explicit `aria-expanded` — the trigger is outside `Drawer` so RAC does not set it.
- `<Drawer state={state}>` → `Drawer.Backdrop` (dismissable by default, `bg-black/55 dark:bg-black/65` like `CatalogSearchDrawer`) → `Drawer.Content placement="right" className="w-full max-w-[320px]"` → `Drawer.Dialog` (RAC dialog: focus trap + focus return to trigger for free) → `Drawer.Header` with `Drawer.Heading` `Menú` + `Drawer.CloseTrigger aria-label="Cerrar"` (`RiCloseLine`, `size-11`; the precedent at `CatalogSearchDrawer.tsx:90` shows the label override works) → `Drawer.Body` → `Drawer.Footer`.
- Body: `Productos` as a `next/link` row (`href="/"`, `min-h-[52px]`, `aria-current` when `isCatalog`, `onClick={state.close}`), then `<Accordion>` (HeroUI `Accordion` = RAC `DisclosureGroup`; `allowsMultipleExpanded` defaults to `false` → one open at a time, D5 for free) with one `Accordion.Item` per non-empty taxonomy: `Accordion.Heading` → `Accordion.Trigger` (a RAC `Button`, carries `aria-expanded`; `min-h-[52px]`) + `Accordion.Indicator`; `Accordion.Panel` → `Accordion.Body` → `<ul>` of `<li><span aria-disabled="true" aria-current={…} className="block min-h-[46px] leading-[1.3] …">{name}</span></li>` — the pagination precedent (`Home.tsx:373-379`), non-focusable, never `href="#"`.
- Footer: `Solicitar cotización` anchor (Phase 3 — render only when `whatsappUrl !== null`) and `<ToggleDarkMode showLabel />` (`min-h-11`).

**`src/shared/ui/organisms/Header.tsx`** — Modify the right cluster

- Mobile-only group `<div className="flex items-center gap-1 md:hidden">`: lupa `Button isIconOnly aria-label="Buscar" size-11` rendered **only when `isCatalog`** (D11), `onPress={() => window.dispatchEvent(new Event(CATALOG_SEARCH_OPEN_EVENT))}`; `<CartCount />`; `<MobileMenu … />`.
- Desktop group `hidden md:flex`: `<CartCount />` + `<ToggleDarkMode />`. `CartCount` is rendered twice (one per breakpoint group, CSS-hidden) — acceptable: it is a 40-line badge; tests query by role within the visible-agnostic DOM, so assert `getAllByRole("link", { name: /Ver mi lista/ })` length 2, not `getByRole`.

Edge: the side menu and the catalog search drawer are both `z-50` portals but can never be open together (the lupa is outside the menu). Toasts (`z-[60]`) still stack above.

**`__tests__/shared/Header.test.tsx`** — Extend

- Hamburger `Menú` has `aria-expanded="false"`; click → `dialog` named `Menú` appears, `aria-expanded="true"`; `Cerrar` click and `Escape` each remove the dialog and return focus to the hamburger (`expect(hamburger).toHaveFocus()`).
- Inside the dialog: `Productos` link `href="/"`; `Categorías` and `Marcas` buttons with `aria-expanded`; expanding `Categorías` lists N category names each with `aria-disabled="true"` and no `link` role; expanding `Marcas` collapses `Categorías` (D5); active category (via `useSearchParams`) carries `aria-current="page"`; `Cambiar tema` button present.
- Lupa: on `/` a `Buscar` button dispatches `CATALOG_SEARCH_OPEN_EVENT` (spy with `window.addEventListener` in the test); on `/cotizar` `queryByRole("button", { name: "Buscar" })` is null.

**`__tests__/home/Home.test.tsx`** — Modify: one test — `window.dispatchEvent(new Event(CATALOG_SEARCH_OPEN_EVENT))` inside `act` → `findByRole("dialog", { name: "Búsqueda ampliada" })`.

### Success Criteria

- **Automated:** `pnpm exec tsc --noEmit`; `pnpm test -- __tests__/shared/Header.test.tsx __tests__/home/Home.test.tsx`; `pnpm lint`.
- **Dev-server validation:**
  - `GET /` → 200; body contains `aria-label="Buscar"`, `aria-label="Menú"`, `aria-expanded="false"`; no hydration warning in the server log (the closed drawer renders nothing — that is expected).
  - `GET /cotizar` → 200; body contains `aria-label="Menú"` and **does not** contain `aria-label="Buscar"` (D11).
- **Manual (390px, both themes):** tap `Buscar` → `Búsqueda ampliada` drawer opens from the left; tap `Menú` → right drawer with backdrop; only one accordion open at a time; every row/button ≥ 44px (DevTools); backdrop tap, `Cerrar`, and `Escape` close it and focus lands back on the hamburger; `99+` badge does not widen the row; at exactly 768px the desktop nav shows and the mobile group is gone.

### Verification Coverage

| Area/File | Check | Reference |
|---|---|---|
| `src/shared/ui/organisms/MobileMenu.tsx` | open/close paths, focus return, one-open accordion, disabled rows, active row | `__tests__/shared/Header.test.tsx` |
| `src/shared/ui/organisms/Header.tsx` (mobile group) | lupa presence per route, event dispatch | Header test + `curl /` vs `curl /cotizar` |
| `src/features/Home/Home.tsx` | event → drawer opens | `__tests__/home/Home.test.tsx` + manual tap |

---

## Phase 3 — Utility Bar, WhatsApp, Docs

Delivers AC4 and the docs/test half of AC5.

### Changes Required

**`src/shared/constants/whatsapp.constants.ts`** — Modify: add
`export const WHATSAPP_HEADER_MESSAGE = "Hola, Tehesa. Necesito una cotización para una medida especial. ¿Me pueden ayudar?"` (D6 option A; contains no `*_~\`` or control chars — `sanitizeForWhatsapp` is a no-op on it, so do not call it).

**`src/shared/ui/organisms/Header.tsx`** — Modify

- Module scope: `const HEADER_WHATSAPP_URL = WHATSAPP_NUMBER ? buildWhatsappUrl(WHATSAPP_NUMBER, WHATSAPP_HEADER_MESSAGE) : null` — computed once, same "unset never throws" rule as `WhatsappCta.tsx:54`. Pass it to `MobileMenu` as `whatsappUrl`.
- Utility bar (D9, always rendered) as the first child of `<header>`: `<div className="bg-[#0F2001] text-white text-xs …">`:
  - `≥ lg`: `Soluciones para ferretería e instalación industrial · ¿Necesitas una medida especial?` + link `Solicitar cotización`.
  - `< lg`: `¿Medida especial?` + link `Cotizar`.
  - Render both spans with `hidden lg:inline` / `lg:hidden`; the anchor is one element with two labels swapped the same way, `href={HEADER_WHATSAPP_URL}`, `target="_blank" rel="noopener noreferrer"`, `min-h-11 md:min-h-0` tap height. **When `HEADER_WHATSAPP_URL === null` render no anchor at all** (D12); the tagline stays.

**`src/shared/ui/organisms/MobileMenu.tsx`** — Modify footer: `whatsappUrl !== null && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="… min-h-11 bg-[#4DF527] text-[#0D3401]">Solicitar cotización</a>` (plain anchor, not a `Button` — it is a navigation, and HeroUI `Button` renders `<button>`).

**`__tests__/shared/Header.test.tsx`** — Extend

- Mock `@/shared/constants/whatsapp.constants` with the getter-backed pattern from `__tests__/cart/WhatsappCta.test.tsx:12-22`, adding `WHATSAPP_HEADER_MESSAGE`. With the number set: the utility-bar link (name `Solicitar cotización`, its mobile label `Cotizar` lives in a sibling span) has `href` equal to `buildWhatsappUrl(number, WHATSAPP_HEADER_MESSAGE)` (import the real builder), `target="_blank"`, `rel="noopener noreferrer"`; the side-menu `Solicitar cotización` anchor has the same `href`. With the number unset: neither anchor exists, the tagline text is still present, render does not throw.

**`ai-skills/REPO_CONTEXT.md`** — Modify

- "Key invariants" first bullet (line 47): layout no longer awaits `getThemePreference()`; dynamic rendering is now `export const dynamic = "force-dynamic"` in `layout.tsx`, because the header fetches taxonomy per request and reads `useSearchParams`. Layout fetches `fetchCategories`/`fetchBrands` in a try/catch (degrades to empty lists, hides the dropdowns).
- `ui/organisms` row (line ~106): `Header` = utility bar + wordmark + desktop dropdowns (disabled items, D4) + `MobileMenu`; opens `CatalogSearchDrawer` via `CATALOG_SEARCH_OPEN_EVENT` on `/` only.
- `ui/atoms` row: `ToggleDarkMode` always renders (no pre-mount `null`), `showLabel` variant, sun-in-dark; `CartCount` rendered twice (per breakpoint group).
- `hooks` row / Conventions: `useMediaQuery` is synchronous and returns `false` on the server — never use it in layout-level components; switch layouts with `md:`/`lg:` classes.
- Environment Variables: `NEXT_PUBLIC_WHATSAPP_NUMBER` also drives the header's utility-bar link and side-menu button (hidden when unset).

**`CLAUDE.md`** — Modify: architecture box `Header` line + "Key flow invariant" sentence (taxonomy is also fetched in the root layout for the header, degrading on failure); add `NEXT_PUBLIC_WHATSAPP_NUMBER` to the env var section (the research flagged it as an unactioned docs gap).

### Success Criteria

- **Automated:** `pnpm test` (full — `Home.test.tsx`, `WhatsappCta.test.tsx`, and the new header file all touch the WhatsApp/drawer seams); `pnpm lint`; `pnpm exec tsc --noEmit`; `pnpm build`.
- **Dev-server validation:**
  - `GET /` → 200; body contains `Soluciones para ferretería e instalación industrial`, `¿Necesitas una medida especial?`, `Solicitar cotización`, `¿Medida especial?`, `Cotizar`, and an anchor `href="https://wa.me/<number>?text=Hola%2C%20Tehesa.%20Necesito%20una%20cotizaci%C3%B3n…"` with `target="_blank"` and `rel="noopener noreferrer"`.
  - `GET /cotizar` → 200; same utility bar.
  - Unset: restart with `NEXT_PUBLIC_WHATSAPP_NUMBER= pnpm dev` (empty) → `GET /` → 200; body contains the tagline and **no** `wa.me` string; no server-log error. Restore env.
- **Manual:** at 1024px the two-part sentence shows; at 768–1023 the one-liner; the link opens WhatsApp in a new tab with the prefilled text; the side-menu footer button does the same.

### Verification Coverage

| Area/File | Check | Reference |
|---|---|---|
| `src/shared/constants/whatsapp.constants.ts` | constant exported, message untouched by sanitizer | Header test `href` equality |
| `src/shared/ui/organisms/Header.tsx` (utility bar) | copy, href, target/rel, unset → hidden | Header test + `curl /` set/unset |
| `src/shared/ui/organisms/MobileMenu.tsx` (footer) | WhatsApp anchor + `Cambiar tema` | Header test |
| Docs | invariant + env var recorded | read-through |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
|---|---|---|---|---|
| AC1 – Desktop nav | Phase 1 | `GET /` 200 contains `Productos` with `aria-current="page"`, `Categorías`, `Marcas`; `GET /cotizar` `Productos` without `aria-current` | Validated | Confirmed via `curl`. Dropdown items/active highlight/close paths are in a closed popover (not in SSR HTML): proven by `__tests__/shared/Header.test.tsx` (12 tests) + still need the manual keyboard/wrap/scroll pass. Deviation: react-aria-components' `MenuItem` strips unrecognized `aria-*` props (confirmed empirically), so the active-item indicator uses a visually-hidden `" (actual)"` text suffix instead of a literal `aria-current` attribute on the dropdown item; behavior and visual highlight are unaffected. |
| AC2 – Mobile side menu | Phase 2 | `GET /` 200 contains `aria-label="Menú"` + `aria-expanded="false"` | Validated | Confirmed via `curl`. Drawer open/close (click + Escape), focus return to the hamburger, disabled/active accordion rows: `__tests__/shared/Header.test.tsx`. Still need the manual pass for 44px targets and one-open-at-a-time visual confirmation at 390px. |
| AC3 – Lupa opens existing drawer | Phase 2 | `GET /` contains `aria-label="Buscar"`; `GET /cotizar` does not | Validated | Confirmed via `curl` (present on `/`, absent on `/cotizar`). Open path: `Home.test.tsx` event test + `Header.test.tsx` dispatch test. Still need the manual tap check. |
| AC4 – Utility bar → WhatsApp | Phase 3 | `GET /` 200 contains copy A + `wa.me/<number>?text=…` anchor with `target="_blank" rel="noopener noreferrer"`; with `NEXT_PUBLIC_WHATSAPP_NUMBER` empty, tagline present and no `wa.me` | Validated | Confirmed via `curl` for both the set and unset (`NEXT_PUBLIC_WHATSAPP_NUMBER=`) cases; `__tests__/shared/Header.test.tsx` covers both links' hrefs and the unset-hides-both-without-throwing case. |
| AC5 – Resilience + theme | Phase 1 (sticky, degrade, every route), Phase 3 (tests/docs) | `GET /cotizar` 200 with `STRAPI_HOST` unreachable and no `Categorías`; `pnpm build` passes listing `/` and `/cotizar` as dynamic | Validated | Degrade path confirmed via `curl` with `STRAPI_HOST=http://127.0.0.1:9` (200, no `Categorías`/`Marcas`, warning logged, no unhandled error); `pnpm build` lists `/` and `/cotizar` as `ƒ` (dynamic). `pnpm test` green (380 passed, 1 pre-existing skip). Sticky positioning and dark-theme token colors are styling → still need the manual pass. |

## Cross-Cutting Concerns

- **Server/client boundary:** `layout.tsx` (server) fetches via `global.lib.ts` and passes plain arrays; `Header`/`MobileMenu` are `"use client"` and never import `global.lib.ts`.
- **Rendering mode:** `force-dynamic` in the root layout replaces the `cookies()` side effect. Confirm in the `pnpm build` route table.
- **Env:** `STRAPI_HOST`/`STRAPI_API_TOKEN` (taxonomy; failure degrades), `NEXT_PUBLIC_WHATSAPP_NUMBER` (unset hides the link; never throws).
- **Hydration:** nothing in the header reads `localStorage`/theme before mount except the existing `CartCount` guard and the new moon-first `ToggleDarkMode`; layouts switch via CSS only (no `useMediaQuery`).
- **Trust boundary:** category/brand names are rendered as text children (React-escaped), never as `href` or `dangerouslySetInnerHTML`.
- **Responsive:** `md:` for the nav row, `lg:` for the two-part utility sentence; both variants always in the DOM.

## Open Questions / Out of Scope

- **Sticky overlap** with `/cotizar`'s list-region focus scroll and `Home`'s `scrollTo(0)`: accepted for this story; add `scroll-margin-top` on those targets if QA reports the header covering the focused region.
- **Duplicate taxonomy query on `/`** (layout + page): accepted (`ponytail:` note); `React.cache` sibling module if it shows in Strapi logs.
- **Out of scope (research):** logo image; tablet-specific third layout; mega-menu/product counts; removing the catalog page's own dropdowns/`CatalogHero`; global HeroUI `--primary-*` remap (D14); analytics; real category/brand hrefs (D4 — swap `isDisabled` for `href={buildModeUrl(mode, name, 1)}` when the pages exist); client-side sorting; PNG export of the comps into `comps/header-navigation/` (design handoff, not implementation — do it via `/check-design`).

## Out-of-scope implementation changes

### Phase 1

- **File:** `src/shared/ui/organisms/Header.tsx`. **What changed:** the active desktop-dropdown taxonomy item is marked with a visually-hidden `" (actual)"` text suffix inside `Dropdown.Item` instead of a literal `aria-current="page"` attribute on that element. **Why:** empirically confirmed (via a throwaway HeroUI `Dropdown.Item` harness) that react-aria-components' `MenuItem` primitive strips unrecognized `aria-*` attributes from the rendered DOM node (it keeps `data-*`), so `aria-current` passed to `Dropdown.Item` had no effect — a library constraint discovered mid-implementation, not something the plan could have anticipated without running the code. **User approval:** reported inline in the Phase 1 summary; user replied `cnp`, accepting the phase as described. **Verification:** `__tests__/shared/Header.test.tsx` asserts the active item's accessible name includes `" (actual)"`; the existing visual highlight classes (`bg-[#F5FFEF] text-[#125D03] dark:bg-[#16300A] dark:text-[#B4FE99]`) are unchanged, so AC1's "highlighted" behavior is intact.
- **File:** `src/shared/ui/organisms/Header.tsx`. **What changed:** `WHATSAPP_HEADER_MESSAGE`/`whatsappUrl` (Phase 3) ended up computed inside the `Header` component body per render rather than at module scope as the plan's Phase 3 section specified. **Why:** module-scope computation cannot be flipped between "set" and "unset" across tests in the same file without `jest.resetModules()`, which the codebase's own `WhatsappCta.test.tsx` comment documents as unsafe (duplicate-React "Invalid hook call" errors); the referenced precedent (`WhatsappCta.tsx:54`) itself reads `WHATSAPP_NUMBER` inside the component body, not at module scope, so this brings `Header` in line with that precedent rather than diverging from it. **User approval:** reported inline in the Phase 3 summary alongside sign-off. **Verification:** `__tests__/shared/Header.test.tsx` covers both the set and unset cases via a getter-backed mock, matching `WhatsappCta.test.tsx`'s pattern.
