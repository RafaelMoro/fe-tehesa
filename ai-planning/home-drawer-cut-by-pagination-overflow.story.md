# Plan: Variants drawer is cut off on the home page (mobile)

**Source research:** `ai-research/home-drawer-cut-by-pagination-overflow.story.md`
**Research status:** complete (round 3), all open questions answered, 2026-09-22
**Branch:** `fix/drawer-homepage` → PR to `develop`, label `patch`
**Type:** bug fix + small design change

**Assumptions (from research, kept as-is):**
- "Mobile" for the drawer = `< 768px` (`md`), matching `useMediaQuery().isMobile`.
- Pagination switches at `lg` (1024px), per the comp. The two breakpoints stay separate.
- No custom scroll-lock code. react-aria's lock already works; removing the overflow removes the visual-viewport pan.
- No new Jest tests (Open Question III). Existing suites must stay green.
- `PRODUCT_PAGE_MAX` stays 5, but nothing in the plan depends on its value.

---

## Acceptance Criteria

1. At viewport widths from 320px to 767px, `document.documentElement.scrollWidth` equals `clientWidth` on `/` and `/?page=N`: no horizontal overflow and no sideways page scroll.
2. On `/`, below `md` (< 768px, the same breakpoint as `useMediaQuery().isMobile`), the open variants drawer's dialog is **exactly the viewport width**: left edge at 0, right edge at `clientWidth`, with no strip of page visible beside it. At `md`+ the existing widths are kept (`md:w-[440px]`, `lg:w-[520px]`).
3. With the drawer open on `/` at 390px, wheel and touch-swipe over the drawer do not move the page: `window.scrollY` **and** `visualViewport.offsetTop` stay unchanged, and no un-dimmed page appears above or below the drawer. Scrolling *inside* the drawer body (`Drawer.Body`, `overflow-y-auto`) still works. Closing the drawer restores the page's scroll position.
4. Home base-mode pagination matches the comp. Below `lg` (< 1024px) the card shows a centered `Mostrando <strong>X-Y</strong> de 333 productos`, then a three-column row: `← Anterior` | `Página <strong>N</strong> de M` | `Siguiente →`. There are no numbered page items, and both buttons are 44px tall. At `lg`+ the current desktop row (full labels plus numbered pages) is unchanged. At 320px both buttons and the indicator fit on one line without overflow. The accessible names stay `Página anterior` / `Página siguiente`.
5. `/categorias/<slug>`, `/marcas`, `/cotizar` and home's filtered mode (`?mode=…`) are unchanged. Their page layout stays as it is, they stay overflow-free, and the drawer they open keeps HeroUI's default mobile width (320px / 85vw).
6. `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm design:lint` pass.

---

## Affected files

**`src/features/**`**
- `src/features/Home/Home.tsx` — base-mode pagination block (`activeCatalogMode === null` branch, ~lines 403–494), `PAGE_NAV_BUTTON_CLASSES` (~line 46), `<ProductVariantsDrawer>` call site (~line 550).
- `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` — `ProductVariantsDrawerProps` (~line 35) and `Drawer.Dialog` className (~line 231).

**Not touched:** `CategoryPage`, `BrandPage`, `QuotePage` (must not pass the new prop), `CatalogSearchDrawer`, HeroUI slot CSS, filtered-mode pagination, tests.

---

## Phase 1 — Home pagination to the comp (root-cause fix)

Fixes AC 1, AC 3, the cut-off half of AC 2, and AC 4.

### Changes Required

**`src/features/Home/Home.tsx` — Modify**

1. **`PAGE_NAV_BUTTON_CLASSES`** (near line 46). Keep the `ponytail:` comment above it. Change the suffix:
   - `min-h-10` → `min-h-11 lg:min-h-10`. `min-height` beats HeroUI's fixed `.button` height, so no `!` is needed; 44px below `lg`, 40px at `lg`+ (desktop unchanged).
   - add `min-w-0 px-3 lg:px-4` so the button can shrink inside its `minmax(0,1fr)` grid track (comp: `min-width: 0`, padding `0 12px`). Confirm at `lg` the desktop padding matches today's `buttonVariants` md padding; if `buttonVariants` already gives `px-4`, drop `lg:px-4`.
   - add one more constant for the next button's comp emphasis, below `lg` only:
     ```ts
     const PAGE_NAV_NEXT_BUTTON_CLASSES =
       PAGE_NAV_BUTTON_CLASSES + " max-lg:border-default-400 max-lg:font-semibold"
     ```
     `border-default-400` is the repo's existing "stronger border" (`CategoryCard`/`BrandCard` hover). Use it for both next-button branches (`<Link>` and `<span>`).

2. **Outer card** (`<div className="flex flex-col gap-3 rounded-xl border … sm:flex-row sm:items-center sm:justify-between">`): move the `sm:` switch to `lg:` (`lg:flex-row lg:items-center lg:justify-between`). Keep the existing card (border, radius, padding); do not add a second card.

3. **Range + end-of-list block** (`<div className="flex flex-col gap-1">`): add `text-center lg:text-left`. Keep `{visibleProductStart}-{visibleProductEnd}` (hyphen; the comp's en dash is cosmetic, not adopted). Keep the `Llegaste al final…` notice exactly as is.

4. **Control row** (`<div className="flex items-center justify-center gap-2">`) becomes a grid below `lg`, flex at `lg`+:
   ```
   grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2
   lg:flex lg:justify-center
   ```
   Children, in DOM order (one control set; no duplicated links):
   - **prev** (`<Link>` / `<span aria-disabled>` — both branches): replace the text `Página anterior` with
     ```tsx
     <span className="lg:hidden">Anterior</span>
     <span className="hidden lg:inline">Página anterior</span>
     ```
     `aria-label="Página anterior"` stays, so the accessible name is unchanged.
   - **numbered `<Pagination>`**: hide below `lg` (`className="hidden lg:flex"` on `<Pagination>`; if HeroUI's root doesn't forward `className`, wrap it in `<div className="hidden lg:block">`). Being `display:none`, it takes no grid track, so the grid sees exactly 3 children.
   - **indicator** (new, between Pagination and next):
     ```tsx
     <span className="whitespace-nowrap text-[13px] text-muted lg:hidden">
       Página <strong className="font-semibold text-foreground">{currentPage}</strong> de {totalPages}
     </span>
     ```
   - **next** (both branches): same label swap (`Siguiente` / `Página siguiente`), `PAGE_NAV_NEXT_BUTTON_CLASSES`.

### Edge cases
- Four label sites (prev/next × Link/span) must all get the span swap; the span branch also renders when `isRoutePending`.
- CSS-only switching. Do **not** use `useMediaQuery` here (SSR renders `isMobile=false` → desktop row → overflow until hydration).
- `Home.test.tsx:265` asserts `toHaveTextContent("Página siguiente")`. jsdom renders both spans, so text is `SiguientePágina siguiente` — substring match still passes. `getByRole("link", { name: "Página siguiente" })` still resolves by `aria-label`; one element, no duplicates.
- 320px fit: available row width ≈ 320 − page gutter − card padding. If the Chrome check shows the row still overflows at 320px, tighten `gap-2` → `gap-1.5` or card padding to the comp's 14px (`p-3.5 lg:px-4 lg:py-3`) — nothing else.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test -- __tests__/home/Home.test.tsx`

**Dev-server validation** (`pnpm dev`)
- `curl -s -o /dev/null -w '%{http_code}' localhost:3000/` → `200`; `/?page=3` → `200`; `/?page=5` → `200`.
- `curl -s localhost:3000/?page=3` contains `aria-label="Página anterior"` and `aria-label="Página siguiente"` as `<a href=` elements, contains `>Anterior<`, `>Siguiente<`, `>Página anterior<`, `de <!-- -->5` or equivalent indicator text, and `lg:hidden`.
- `curl -s localhost:3000/?page=5` contains `Llegaste al final de esta lista` and `aria-disabled="true"` on the next control.
- `curl -s 'localhost:3000/?mode=category&category=Brocas&page=1'` → `200`, still renders `Página 1` filtered pagination (unchanged markup).
- No server-log errors, no hydration warnings.

**Claude in Chrome** (per `feedback_browser-checks-claude-in-chrome`)
- `/` and `/?page=3` at 320/360/390/768/1024px: `scrollWidth === clientWidth`.
- `/` at 320/375/430px: pagination card matches comp frames (centered range, 3-column row, buttons 44px tall via `getBoundingClientRect().height`, no numbered pills). At 1024px+: today's desktop row with numbered pills.

**Manual** — none beyond Phase 3.

---

## Phase 2 — Full-width drawer below `md`, home only

Covers the width half of AC 2 and the drawer half of AC 5.

### Changes Required

**`src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` — Modify**
- `ProductVariantsDrawerProps`: add `isFullWidthOnMobile?: boolean` (default `false`, destructured in the signature).
- `Drawer.Dialog` className (line ~231): append the opt-in classes when true:
  ```tsx
  className={`flex h-full flex-col md:w-[440px]! lg:w-[520px]!${
    isFullWidthOnMobile ? " max-md:w-full! max-md:max-w-none!" : ""
  }`}
  ```
  Both HeroUI defaults must be beaten below `md`: width (`w-80` / `sm:w-96`) and cap (`max-w-[85vw]`). `max-md:` keeps the `md`/`lg` overrides untouched. No scroll-lock, no position overrides.

**`src/features/Home/Home.tsx` — Modify** (near line 550)
- `<ProductVariantsDrawer product={productDetails} state={drawerState} isFullWidthOnMobile />`

### Edge cases
- `CategoryPage`, `BrandPage`, `QuotePage` call sites are not edited → default `false` → today's 320px / 85vw (AC 5).
- Full width leaves no backdrop to tap; close via header `Cerrar`, Escape, drag-dismiss. No new control (research).
- The two-step mobile flow (`isMobile`) and the full-width panel share the 768px breakpoint, so they always appear together.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx`

**Dev-server validation**
- `curl` `/`, `/categorias/extraccion-reparacion-fijaciones`, `/marcas`, `/cotizar` → all `200`, no server-log errors. (Drawer markup is client-only after a click, so width is checked in Chrome below.)

**Claude in Chrome**
- `/` at 320/390/640/767px, drawer open: dialog `getBoundingClientRect()` → `left === 0`, `right === clientWidth`.
- `/` at 768px and 1024px: dialog width 440 / 520.
- `/categorias/<slug>` at 390px: dialog width 320, flush right; at 320px: 272 (85vw).

---

## Phase 3 — Full verification sweep

No code changes. Proves AC 3, AC 5, AC 6 end to end.

### Success Criteria

**Automated**
- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm test`
- `pnpm design:lint`
- `pnpm build`

**Dev-server validation**
- `curl` → `200` for `/`, `/?page=2`, `/?page=5`, `/?mode=category&category=Brocas&page=1`, `/categorias`, `/categorias/extraccion-reparacion-fijaciones`, `/marcas`, `/cotizar`. No `CAT_ERR_*`, no hydration warnings in the server log.

**Claude in Chrome** (320/360/390/768px, light and dark)
- Every route above: `scrollWidth === clientWidth` (AC 1, AC 5).
- `/` at 390px, drawer open: record `scrollY` and `visualViewport.offsetTop`, wheel over the drawer header, re-read → both unchanged; no un-dimmed page above/below (AC 3).
- `Drawer.Body` scrolls with a long medida list; close drawer → `scrollY` restored (AC 3).

**Manual (user)**
- Real-device touch swipe over the open drawer on `/` (Android Chrome; iOS Safari if available). Headless touch synthesis didn't pan during research, so this is the final proof for AC 3.

---

## Verification coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/features/Home/Home.tsx` pagination | responsive labels, indicator, hidden numbered pages, 44px buttons, no overflow | existing `Home.test.tsx` (names, disabled states, end notice) + dev-server `curl` + Chrome measurements |
| `src/features/Home/Home.tsx` drawer call site | opt-in prop passed | `tsc` + Chrome dialog rect on `/` |
| `ProductVariantsDrawer.tsx` | optional prop, default width preserved for other callers | existing `ProductVariantsDrawer.test.tsx` + Chrome dialog rect on `/categorias/<slug>` |

No new tests (Open Question III).

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 - no horizontal overflow on `/`, `/?page=N` at 320–767px | Phase 1, 3 | `GET /?page=3` 200 with compact controls markup; Chrome `scrollWidth === clientWidth` | Cannot validate | Layout not observable over curl; proven by Claude in Chrome measurement |
| AC2 - drawer exactly viewport width on `/` below `md`, `md`/`lg` widths kept | Phase 1, 2 | Chrome dialog rect `left 0`/`right clientWidth` | Cannot validate | Drawer is client-rendered after click; proven by Claude in Chrome |
| AC3 - no page/visual-viewport movement with drawer open | Phase 1, 3 | Chrome `scrollY` + `visualViewport.offsetTop` before/after wheel | Cannot validate | Needs interaction; Chrome wheel check + user real-device touch check |
| AC4 - pagination matches comp below `lg`, desktop unchanged, names kept | Phase 1 | `GET /?page=3` 200, contains `aria-label="Página siguiente"`, `>Anterior<`, `>Siguiente<`, `lg:hidden` | Cannot validate | Markup confirmed via curl on `/?page=3` (compact labels, indicator `Página N de M`, `lg:hidden`), `/?page=7` (end notice + disabled next), and `Home.test.tsx` (aria-labels, disabled states unchanged). Claude in Chrome tool is unavailable in this session, so visual comp match / 44px height / 320px fit still need a Chrome pass |
| AC5 - other routes and filtered mode unchanged, default drawer width | Phase 2, 3 | `GET /categorias/<slug>`, `/marcas`, `/cotizar`, `/?mode=category…` all 200, filtered pagination markup unchanged | Not validated | Drawer width on other routes confirmed in Chrome |
| AC6 - lint, tsc, test, design:lint pass | Phase 3 | n/a (commands) | Not validated | |

---

## Cross-cutting concerns

- **Server/client boundary:** all pagination switching is Tailwind breakpoint classes on server-rendered markup; no `useMediaQuery` for pagination.
- **HeroUI slot specificity:** drawer width overrides need `!` (existing pattern); button height uses `min-h-*` which wins without `!`.
- **Responsive UI / theming:** check light and dark in Phase 3; `text-muted`, `text-foreground`, `border-default-400` are existing tokens.

## Open Questions / Out of scope

**Open:** none.

**Out of scope (deliberately excluded):**
- Custom scroll-lock code.
- Full-width drawer on `/categorias`, `/marcas`, `/cotizar`.
- `CatalogSearchDrawer`, HeroUI slot CSS, drawer internals/copy/two-step flow.
- Filtered-mode pagination.
- En dash in the range text; comp's `<button disabled>` / opacity .45 (repo keeps `<span aria-disabled>` + current disabled styling).
- New Jest tests.
- The `/api/catalog/variants` error from the round-1 screenshot.
