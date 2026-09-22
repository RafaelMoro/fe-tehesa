# Story: Variants drawer is cut off on the home page (mobile)

**Status:** research complete (round 2): the new observations trace back to the root cause confirmed earlier
**Date:** 2026-09-22
**Branch:** `fix/drawer-homepage` (round 1 was researched on `fix/home-product-variant-drawer-ui`)
**Type:** bug fix, single story

---

## Story Definition

### Description

On the home page (`/`), at phone widths, opening a product's variants drawer gives three
symptoms:

1. The drawer is **cut off at the right edge** of the screen.
2. A strip of the page stays **un-dimmed** beside the drawer.
3. *(new in round 2)* The page **moves behind the open drawer**. Swiping or wheeling
   shifts the drawer and page upward and uncovers un-dimmed page below the drawer
   (reported screenshot 2).

The same drawer, from the same component, behaves correctly on `/categorias/<slug>`.

The drawer component is not the cause. The home page **overflows horizontally**: its
document is 496px wide inside a 390px viewport. That overflow widens (and, at scale 1,
lengthens) the mobile *layout* viewport, which is what `position: fixed` overlays
resolve against. Symptoms 1 and 2 are the drawer laid out against a 496px-wide box.
Symptom 3 is the *visual* viewport panning inside that enlarged layout viewport; the
document scroll itself is already locked.

The overflow comes from a single element: the base-mode pagination row in
`src/features/Home/Home.tsx`. It is a non-wrapping flex row that holds two full-label
page-nav buttons plus the five numbered `Pagination` items.

The user also asked for a **design change** in round 2: below `md` the drawer panel
should take **100% of the screen width** instead of HeroUI's default 320px / 85vw
panel. This is independent of the bug. A full-width panel on a 496px layout viewport
would still be cut, so the overflow fix is still required.

### Acceptance criteria

1. At viewport widths from 320px to 767px, `document.documentElement.scrollWidth`
   equals `clientWidth` on `/` and `/?page=N`: no horizontal overflow and no sideways
   page scroll.
2. Below `md` (< 768px, the same breakpoint as `useMediaQuery().isMobile`), the open
   variants drawer's dialog is **exactly the viewport width**: left edge at 0, right
   edge at `clientWidth`, with no strip of page visible beside it. At `md`+ the
   existing widths are kept (`md:w-[440px]`, `lg:w-[520px]`).
3. With the drawer open on `/` at 390px, wheel and touch-swipe over the drawer do not
   move the page: `window.scrollY` **and** `visualViewport.offsetTop` stay unchanged,
   and no un-dimmed page appears above or below the drawer. Scrolling *inside* the
   drawer body (`Drawer.Body`, `overflow-y-auto`) still works. Closing the drawer
   restores the page's scroll position.
4. Home pagination stays fully usable at 320px: previous, next, and every numbered page
   remain reachable, and hit-target height is preserved (`min-h-10`).
5. `/categorias/<slug>`, `/marcas`, `/cotizar` and home's filtered mode (`?mode=…`) keep
   their current page layout and stay overflow-free. The drawer is full width below
   `md` on these pages too (see Open Question V).
6. `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm design:lint` pass.

### Task breakdown

1. Stop the base-mode pagination row from overflowing below `sm` (`Home.tsx`). This
   fixes AC 1, the cut-off half of AC 2, and all of AC 3.
2. Make the variants drawer dialog full width below `md`
   (`ProductVariantsDrawer.tsx`, the `Drawer.Dialog` className). This covers the width
   half of AC 2.
3. Browser re-verification at 320/360/390/768px on every catalog route, light and dark,
   using Claude in Chrome (see *Verification*).
4. Add the cheap structural regression guards in Jest (see Open Question III).

---

## Technical Research

### Evidence: round 1 (horizontal cut)

Measured with headless Chromium against the running dev server, iPhone 13 profile,
390×664 viewport, drawer opened from a card mid-list.

Route sweep, `clientWidth -> scrollWidth`:

| Viewport | Route | Result |
| --- | --- | --- |
| 390px | `/` | 390 -> **496 (+106)** |
| 390px | `/?page=3` | 390 -> **496 (+106)** |
| 390px | `/?mode=category&category=Brocas&page=1` | 390 -> 390 ok |
| 390px | `/categorias/extraccion-reparacion-fijaciones` | 390 -> 390 ok |
| 390px | `/marcas` | 390 -> 390 ok |
| 390px | `/cotizar` | 390 -> 390 ok |
| 360px | `/` | 360 -> **481 (+121)** |
| 768px | all of the above | ok |

The overflow floor is the row's min-content width, about 496px. It is **base mode
only**: the filtered-mode branch (`Anterior` / `Página N` / `Siguiente`) does not
overflow. The only elements that overflow on `/` at 390px are the "Página anterior"
span (left edge at -106) and the "Página siguiente" link (right edge at 496).

Drawer state with the drawer open:

| | `/` | `/categorias/<slug>` |
| --- | --- | --- |
| `--page-width` (react-aria inline var on the backdrop) | **496px** | 390px |
| backdrop computed width | **496px** | 390px |
| dialog rect | left **176**, width 320 -> right **496** | left 70, width 320 -> right 390 |
| portal parent | `<body>` | `<body>` |
| ancestors creating a containing block | none | none |

### Evidence: round 2 (scroll lock)

Same setup, re-run for iPhone 13 (390×664) and Pixel 7 (412×839). With the drawer open,
the probe applied a synthesized touch swipe (`Input.synthesizeScrollGesture`) and then
a mouse wheel over the dimmed area.

| | `/` iPhone 13 | `/` Pixel 7 | `/categorias/<slug>` (both) |
| --- | --- | --- | --- |
| `<html>` inline style while open | `overflow: hidden` | `scrollbar-gutter: stable; overflow: hidden` | `overflow: hidden` |
| `window.scrollY` before -> after | unchanged | 678 -> 678 | unchanged |
| `visualViewport.offsetTop` after wheel | **181** | **194** | 0 |
| expected pan = `vvH × scrollW / clientW − vvH` | 664×496/390−664 = **180** | 839×508/412−839 = **195** | 0 |
| dialog width | 320 (right edge 496) | 320 (right edge 508) | 320 (flush right) |

Reading:

- **The page scroll lock already works.** HeroUI's `Drawer` is react-aria
  `ModalOverlay`. Its `useModalOverlay` calls `usePreventScroll`, which sets
  `overflow: hidden` on `<html>` (react-aria 3.50,
  `dist/private/overlays/usePreventScroll.mjs`). `scrollY` never changes on either
  page.
- **What moves is the visual viewport.** At scale 1, a 496px-wide layout viewport keeps
  the screen's aspect ratio, so it is also taller than the screen (about 844px against
  664px). The visual viewport can pan that 180px extra vertically, and `overflow:
  hidden` on the root does not stop that pan. The fixed backdrop and dialog are sized
  to `--visual-viewport-height` (664px) but anchored to the layout viewport, so panning
  moves them up and uncovers un-dimmed page below. That is reported screenshot 2.
- The measured pans (181 and 194) match the predicted values (180 and 195) to within a
  pixel, and the category page shows zero pan. Symptom 3 is therefore the same
  horizontal overflow.
- Caveat: in headless mode the synthesized touch gesture did not pan. The pan was
  reproduced with the mouse wheel. Touch has to be confirmed on a real or emulated
  device during verification (AC 3).

**Consequence:** no scroll-lock code should be written. A hand-rolled
`document.body.style.overflow` / `position: fixed` lock in `ProductVariantsDrawer` or
`Home` would duplicate react-aria's lock and fight its restore logic
(`preventScrollCount`, the iOS `touchmove` path). It would also not stop a
visual-viewport pan, because that pan is not a document scroll.

### Mechanism

1. `Home.tsx`'s base-mode pagination row is `flex items-center justify-center gap-2`,
   with no wrapping and no responsive collapse. It holds two
   `buttonVariants({ variant: "outline", size: "md" })` buttons with full labels and
   arrow icons (about 165px and 174px) and a five-item `<Pagination>`. Its min-content
   width is about 496px.
2. The document therefore overflows horizontally by 106px at 390px.
3. HeroUI v3's `Drawer` is react-aria `ModalOverlay` + `Modal`, portaled to
   `<body>`. Its backdrop and content slots are `position: fixed; inset: 0; width:
   100%; height: var(--visual-viewport-height); z-index: 50`.
4. On mobile Chrome the containing block for a fixed element is the **layout**
   viewport, and that viewport widens to the document's scroll width.
   `width: 100%` resolves to 496px, and react-aria writes `--page-width: 496px`.
5. `drawer__content--right` is `justify-content: flex-end`, so the 320px dialog is
   pinned 106px off-screen. That produces the horizontal cut and the un-dimmed strip.
6. The widened layout viewport is also taller than the visual viewport, so the visual
   viewport can pan vertically even though `<html>` is `overflow: hidden`. That
   produces the vertical shift and the page "scrolling" behind the drawer.

The drawer is not at fault in either case. The only change it needs is the requested
full-width change.

Other consequences:

- Any right- or bottom-anchored overlay on `/` inherits this. `CatalogSearchDrawer` uses
  `placement="left"`, so it looks fine, but it has the same pan.
- The page on `/` can also be scrolled sideways with no overlay open. The same fix
  removes that.

### Full-width drawer below `md`

- HeroUI's default panel width for left/right placement comes from `@heroui/styles`
  `drawer.css`: `.drawer__dialog` gets `w-80 max-w-[85vw] sm:w-96`. At 390px that is
  320px. From 640px to 767px it is 384px.
- The current override on `Drawer.Dialog` is `md:w-[440px]! lg:w-[520px]!`, so nothing
  below `md` is overridden today. `Drawer.Content` already has `w-full`.
- "Mobile" in this component is already defined as `< 768px`:
  `useMediaQuery().isMobile` (`src/shared/hooks/useMediaQuery.tsx`, `max-width:
  767px`) gates the two-step flow. The full-width breakpoint should match it (`md`),
  so the two-step mobile flow and the full-width panel always appear together.
- Both HeroUI defaults have to be neutralised below `md`: the width (`w-80` /
  `sm:w-96`) and the cap (`max-w-[85vw]`). Overriding only one leaves the panel at 85vw
  or at 320/384px. The existing `!` overrides show that the slot classes need
  `!important` to win. Which exact utility spelling to use is a planning call.
- When the panel covers the whole screen, no backdrop is left to tap. The drawer can
  still be closed with the header close button (`aria-label="Cerrar"`), Escape, and
  HeroUI's drag-to-dismiss (`isDismissable` defaults to true). No new close control is
  needed.
- The drawer content was designed at 320–390px widths in the two-step story
  (`ai-research/variants-drawer-mobile-two-step.story.md`): single-column grid below
  390px, two columns from 390px. A full-width panel only gives that layout more room.
  Nothing at 320px gets narrower, because at 320px the panel was already 85vw ≈ 272px
  and now becomes 320px.

### Affected areas

- `src/features/Home/Home.tsx`: the base-mode pagination block (the
  `activeCatalogMode === null` branch) and `PAGE_NAV_BUTTON_CLASSES`. This is the root
  cause fix for AC 1 and AC 3.
- `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`: only the
  `Drawer.Dialog` className (line ~231), for the full-width change. No scroll-lock and
  no position overrides here.
- `src/features/CategoryPage/CategoryPage.tsx`, `BrandPage`, `QuotePage`: reference
  only. They mount the same drawer and pick up the full-width change automatically.
- `__tests__/home/Home.test.tsx`: where a pagination regression assertion belongs.
- `__tests__/product-variants/ProductVariantsDrawer.test.tsx`: where a dialog-class
  assertion could go. jsdom has no layout engine, so width and pan cannot be asserted.

### Existing patterns to follow

- Tailwind v4 utility classes inline, with responsive prefixes (`sm:`, `md:`, `lg:`) as
  already used in both files. The `!` suffix is how HeroUI slot defaults are overridden
  today (`md:w-[440px]!`).
- `buttonVariants` from `@heroui/styles` for non-`<button>` elements that must look like
  buttons. Keep that, and do not swap `<Link>` for `<Button>`.
- Preserve the existing `ponytail:` comment above `PAGE_NAV_BUTTON_CLASSES`.
- `DESIGN.md` tokens. Validate with `pnpm design:lint`.

### Edge cases and constraints

- `PRODUCT_PAGE_MAX` is 5. The fix should not break if that constant grows.
- The disabled pagination states are `<span aria-disabled="true">`, and each side is
  written out twice (four places total). Any responsive change must cover both the
  `<Link>` and `<span>` branches.
- `aria-label="Página anterior"` / `"Página siguiente"` are already on the elements.
- Filtered-mode pagination is already fine. Leave it alone.
- iOS Safari uses react-aria's other lock path (`preventScrollMobileSafari`, a
  `touchmove` preventDefault). It also depends on the document not being wider than the
  screen, so fixing the overflow is the fix for iOS too.
- At `md`+ the drawer does not change. Between 640px and 767px it goes from 384px to
  full width. That matches "mobile" as the two-step flow already defines it.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm design:lint`.
- `pnpm test -- __tests__/home/Home.test.tsx` and
  `pnpm test -- __tests__/product-variants/ProductVariantsDrawer.test.tsx`, then
  `pnpm test`. Test-authoring rules: `docs/UNIT_TESTING_GUIDELINES.md`.
- **Browser checks use Claude in Chrome** against the dev server, with device emulation
  at 320/360/390/768px. This replaces the ad-hoc Playwright probes used during
  research. Per route, with the drawer open:
  - `scrollWidth === clientWidth` (AC 1)
  - dialog `getBoundingClientRect()` gives `left === 0` and `right === clientWidth`
    below 768px (AC 2)
  - after a wheel or swipe over the drawer header, `scrollY` and
    `visualViewport.offsetTop` are unchanged (AC 3)
  - `Drawer.Body` still scrolls when the medida list is long
- A real-device touch check on `/` (Android Chrome, and iOS Safari if available) is the
  final proof for AC 3, because headless touch synthesis did not pan.
- Do not run `pnpm install`.

### Out of scope

- Custom scroll-lock code (see *Evidence: round 2*). react-aria already provides it.
- Redesigning mobile pagination (infinite scroll, compact picker, sticky pager).
- Any change to `CatalogSearchDrawer` or the HeroUI drawer slot CSS files.
- Changes to the drawer's internal layout, copy, or the two-step flow.
- The 26,058px-tall home document at 390px (50 cards).
- The "No pudimos cargar las variantes" error in the round-1 screenshot. That is a
  separate `/api/catalog/variants` failure.

---

## Open Questions

### UI/product decisions

**I: Question:** How should the home pagination row collapse below `sm`?
**Status:** pending
**Context:** Three candidates, each a one-file change. (a) Let the row wrap
(`flex-wrap` on the container), so the numbered pager drops to its own line. Smallest
diff, and every label is kept. (b) Hide the label text below `sm` and keep only the
arrow icons. `aria-label` already carries the accessible name, but the touch targets
shrink to icon-only. (c) Hide the two full-label nav buttons below `sm` and rely on the
numbered pager alone. Recommendation: (a).
**Explanation:** This is a visual call. It also decides Question II.

**II: Question:** Does this need a design pass / comps before implementation?
**Status:** pending
**Context:** Under (a) nothing new is designed. The full-width drawer is a width change
on an already-designed panel, so it does not need a comp either. Under (b) or (c), a
390px comp of the pagination row would be worth having.
**Explanation:** Answer I first.

**V: Question:** Should the full-width drawer apply on every page that mounts it
(`/categorias/<slug>`, `/marcas/<slug>`, `/cotizar`), or only on home?
**Status:** pending
**Context:** It is one shared component, and the change is one className. Scoping it
to home would need a new prop and would give the same drawer two mobile widths.
Recommendation: everywhere. AC 5 is written on that assumption.

**VI: Question:** Should the page be "blocked" by adding custom scroll-lock code?
**Status:** answered
**Answer:** No. The document scroll is already locked by react-aria
(`overflow: hidden` on `<html>`, `scrollY` unchanged in every probe). The movement the
user sees is the visual viewport panning inside an overflow-enlarged layout viewport.
It is removed by the pagination fix, and AC 3 verifies it.
**Context:** See *Evidence: round 2*. The iPhone 13 and Pixel 7 pans (181 and 194px)
match the predicted values; the category page shows no pan.

### Verification

**III: Question:** Do you want a regression guard in the test suite, and of what kind?
**Status:** pending
**Context:** jsdom cannot lay out, so overflow, width and pan cannot be asserted in
Jest. The achievable guards are structural: the pagination container carries its
wrapping class (`Home.test.tsx`), and the drawer dialog carries its full-width-below-`md`
classes (`ProductVariantsDrawer.test.tsx`). These pin the fix, not the behaviour. The
real check is the Claude in Chrome pass in *Verification rules*. Recommendation: both
structural assertions plus the browser pass.

### Catalog behavior

**IV: Question:** Should the sideways-scroll defect on `/` be part of this story?
**Status:** answered
**Answer:** Yes. Same overflow, same fix, covered by AC 1.

### Strapi contract

None. This is a client layout bug, so no `backend-research` delegation was needed.

---

## Assumptions made

- "Mobile" for the full-width drawer means `< 768px`, the same as
  `useMediaQuery().isMobile`, which already gates the two-step flow. The 640–767px
  range therefore changes from 384px to full width.
- "Block the scroll" is satisfied when neither the document nor the visual viewport
  moves while the drawer is open. Scrolling inside the drawer body is still expected.
- The full-width change applies on every page that mounts the drawer (Question V).
- `PRODUCT_PAGE_MAX` stays at 5.
- No change to the drawer's `md`/`lg` widths.
