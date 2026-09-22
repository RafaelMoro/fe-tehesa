# Story: Variants drawer is cut off on the home page (mobile)

**Status:** research complete — root cause confirmed with live instrumentation
**Date:** 2026-09-22
**Branch:** `fix/home-product-variant-drawer-ui`
**Type:** bug fix, single story

---

## Story Definition

### Description

On the home page (`/`), at phone widths, opening a product's variants drawer renders
the drawer **cut off at the right edge of the screen**, and a strip of the page stays
**un-dimmed** beside/below it. The same drawer, on the same component, behaves
correctly on `/categorias/<slug>`.

The drawer component is not at fault. The home page **overflows horizontally**: its
document is 496px wide inside a 390px viewport. A `position: fixed` overlay resolves
against the *layout* viewport, which mobile Chrome widens to the document width when
the document overflows. The drawer is right-anchored, so it is laid out 106px past the
right edge of the screen.

The overflow comes from a single element: the base-mode pagination row in
`src/features/Home/Home.tsx`, a non-wrapping flex row holding two full-label page-nav
buttons plus the five numbered `Pagination` items.

### Acceptance criteria

1. At viewport widths from 320px to 768px, `document.documentElement.scrollWidth`
   equals `clientWidth` on `/` and `/?page=N` — no horizontal overflow, no sideways
   page scroll.
2. With the variants drawer open on `/` at 390px, the drawer dialog is fully visible
   (its right edge is at or inside the viewport's right edge) and the backdrop covers
   the full viewport.
3. Home pagination stays fully usable at 320px: previous, next, and every numbered page
   remain reachable and hit-target height is preserved (`min-h-10`).
4. `/categorias/<slug>`, `/marcas`, `/cotizar` and home's filtered mode (`?mode=…`) keep
   their current layout — they are already overflow-free and must stay that way.
5. `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test`, and `pnpm design:lint` pass.

### Task breakdown

1. Stop the base-mode pagination row from overflowing below `sm`.
2. Re-verify all catalog routes at 320/360/390/768px for `scrollWidth === clientWidth`.
3. Re-verify the drawer visually on `/` at 390px, light and dark.
4. Add a regression guard (see *Verification* below — the cheap one is a layout
   assertion, not a screenshot test).

---

## Technical Research

### Evidence (measured, not inferred)

Instrumented with headless Chromium (`playwright-core` from the npx cache, project
`node_modules` untouched) against the running dev server, iPhone 13 profile,
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

The overflow floor is the row's min-content width, ~496px: it appears on every viewport
narrower than that and disappears above it. It is **base mode only** — the filtered-mode
branch (`Anterior` / `Página N` / `Siguiente`) does not overflow.

Overflowing elements on `/` at 390px (nothing else in the document overflows):

| Element | left | right | width |
| --- | --- | --- | --- |
| `<span>` "Página anterior" (`button button--md button--outline …`) | **-106** | 59 | 165 |
| `<a>` "Página siguiente" (same classes) | 323 | **496** | 174 |

(the two nested `svg`/`path` arrow icons are children of those, not separate causes)

Drawer DOM state with the drawer open, both pages:

| | `/` | `/categorias/<slug>` |
| --- | --- | --- |
| `--page-width` (react-aria inline var on the backdrop) | **496px** | 390px |
| backdrop computed width | **496px** | 390px |
| backdrop computed height | 664px | 664px |
| dialog rect | left **176**, width 320 -> right **496** | left 70, width 320 -> right 390 |
| portal parent | `<body>` | `<body>` |
| ancestors creating a containing block | none | none |

The dialog's right edge lands at 496px — 106px beyond the 390px screen. That is exactly
the cut in the reported screenshot.

### Mechanism

1. `Home.tsx`'s base-mode pagination row is `flex items-center justify-center gap-2`
   with no wrapping and no responsive collapse. Its children are two
   `buttonVariants({ variant: "outline", size: "md" })` buttons carrying the full labels
   "Página anterior" / "Página siguiente" plus arrow icons (~165px and ~174px), and a
   `<Pagination>` with `PRODUCT_PAGE_MAX` = 5 numbered items. Min-content ≈ 496px.
2. The document therefore has 106px of horizontal overflow at 390px.
3. HeroUI v3's `Drawer` is react-aria `ModalOverlay` + `Modal`, portaled to
   `document.body`. Its slot CSS (`@heroui/styles`, `drawer__backdrop` /
   `drawer__content`) is `position: fixed; inset: 0; width: 100%; height:
   var(--visual-viewport-height); z-index: 50`.
4. On mobile Chrome the containing block for a fixed element is the **layout** viewport,
   which widens to the document's scroll width when the document overflows horizontally.
   `width: 100%` therefore resolves to 496px, not 390px. React-aria independently agrees:
   it writes `--page-width: 496px` onto the same element.
5. `drawer__content--right` is `justify-content: flex-end`, so the 320px dialog is pinned
   to the *496px* box's right edge — i.e. 106px off-screen. The un-dimmed strip is the
   part of the 496px-wide backdrop that sits outside the visible 390px.

Consequences worth noting:

- Any right- or bottom-anchored overlay on `/` inherits this. `CatalogSearchDrawer` uses
  `placement="left"`, so it is anchored at x=0 and *looks* fine — it hides the same bug.
- This also means the page can be scrolled sideways on `/` with no overlay open at all,
  which is its own (smaller) mobile defect that the same fix removes.

### Affected areas

- `src/features/Home/Home.tsx` — the base-mode pagination block (the
  `activeCatalogMode === null` branch) and the `PAGE_NAV_BUTTON_CLASSES` constant.
  **This is the only file that has to change.**
- `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` — *no change needed*;
  it is identical on both pages and behaves correctly once the document stops
  overflowing. Do not add defensive width/position overrides here.
- `src/features/CategoryPage/CategoryPage.tsx`, `BrandPage`, `QuotePage` — reference
  only; they mount the same drawer and already work.
- `__tests__/home/Home.test.tsx` — the existing home suite is where a pagination
  regression assertion belongs.
- `__tests__/product-variants/ProductVariantsDrawer.test.tsx` — reference only; jsdom
  has no layout engine, so the visual bug cannot be asserted here.

### Existing patterns to follow

- Tailwind v4 utility classes inline on the element; responsive prefixes (`sm:`, `lg:`)
  as used throughout `Home.tsx`.
- `buttonVariants` from `@heroui/styles` for non-`<button>` elements that must look like
  buttons — already used by `PAGE_NAV_BUTTON_CLASSES` and
  `FILTERED_PAGINATION_BUTTON_CLASSES`. Keep that; do not swap `<Link>` for `<Button>`.
- The existing `ponytail:` comment above `PAGE_NAV_BUTTON_CLASSES` documents why
  `pagination__link` is used on `<a>`/`<span>`. Preserve it.
- `DESIGN.md` tokens; validate with `pnpm design:lint`.

### Edge cases and constraints

- `PRODUCT_PAGE_MAX` is 5, so the numbered row is a fixed five items — the fix does not
  need to handle arbitrary page counts, but it should not break if that constant grows.
- The disabled states are `<span aria-disabled="true">`, not `<button disabled>`; any
  responsive change must apply to both the `<Link>` and `<span>` branches, which are
  written out twice per side (four places total).
- `aria-label="Página anterior"` / `"Página siguiente"` are already on the elements, so
  hiding the visible label text below `sm` does not lose the accessible name.
- Filtered mode (`activeCatalogMode !== null`) renders a different, already-fine
  pagination block — leave it alone.
- The surrounding wrapper is `flex flex-col … sm:flex-row sm:items-center
  sm:justify-between`; at phone widths it is already a column, so the nav row has the
  full content width to work with.

### Verification rules

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
- `pnpm test -- __tests__/home/Home.test.tsx` for the targeted run; `pnpm test` for the
  full suite with coverage. Test-authoring rules: `docs/UNIT_TESTING_GUIDELINES.md`.
- `pnpm design:lint` for DESIGN.md token conformance.
- Manual/browser check is the one that actually proves AC 1 and AC 2, because jsdom does
  not lay out. The one-line check, per route, at 390px:
  `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
- Do not run `pnpm install`.

### Out of scope

- Redesigning mobile pagination (infinite scroll, a compact page picker, sticky
  pager). The fix is to stop the existing row overflowing.
- Any change to `ProductVariantsDrawer`, `CatalogSearchDrawer`, or the HeroUI drawer
  slot CSS.
- The 26,058px-tall home document at 390px (50 cards × ~520px). It is expected given
  `PRODUCT_PAGE_SIZE` = 50 and is not related to this bug.
- The "No pudimos cargar las variantes" error visible in the reported screenshot — that
  is a separate `/api/catalog/variants` failure, not a layout issue.

---

## Open Questions

### UI/product decisions

**I: Question:** How should the home pagination row collapse below `sm`?
**Status:** pending
**Context:** Three candidates, all one-file changes. (a) Let the row wrap —
`flex-wrap` on the container, so the numbered pager drops to its own line. Smallest
diff, keeps every label. (b) Hide the label text below `sm` and keep only the arrow
icons — `aria-label` already carries the accessible name, so nothing is lost to screen
readers, but the touch targets shrink to icon-only. (c) Hide the two full-label nav
buttons entirely below `sm` and rely on the numbered pager alone. My recommendation is
(a): it is the shortest diff, it costs nothing in accessibility or discoverability, and
it does not introduce a mobile-only control set that has to be kept in sync.
**Explanation:** This is a visual call, so it is yours, not mine. It also decides
Question II.

**II: Question:** Does this need a design pass / comps before implementation?
**Status:** pending
**Context:** No Design Agent Handoff or design brief was written for this story. Under
option (a) above, nothing new is designed — an existing row wraps — so a brief would be
ceremony. Under (b) or (c) a phone-width comp of the pagination row would be worth
having, and I would write `ai-research/home-drawer-cut-by-pagination-overflow.design-brief.md`
with one surface group (home pagination row, 390px, light + dark) before planning.
**Explanation:** Answer I first; II follows from it.

### Verification

**III: Question:** Do you want a regression guard in the test suite, and of what kind?
**Status:** pending
**Context:** jsdom has no layout engine, so `scrollWidth` cannot be asserted in Jest —
the real invariant (no horizontal overflow) is not testable with the current stack. The
achievable guard is a class/structure assertion in `__tests__/home/Home.test.tsx` (e.g.
the pagination container carries the wrapping class), which pins the fix but not the
behaviour. A true guard would need a browser-based test runner, which this repo does not
have and which is well outside this story. Recommendation: the cheap structural
assertion, plus the manual `scrollWidth` check recorded in the plan's verification step.

### Catalog behavior

**IV: Question:** Should the sideways-scroll defect on `/` be treated as part of this
story's acceptance, or split out?
**Status:** answered
**Answer:** Part of this story.
**Context:** It is the same overflow, fixed by the same line. AC 1 covers it directly.

### Strapi contract

None. No backend/Strapi question arose — this is purely a client layout bug, so no
`backend-research` delegation was needed.

---

## Assumptions made

- The reported symptom is the one reproduced here: measured at 390px with the drawer
  opened from a mid-list card, the dialog's right edge lands at 496px. If you are also
  seeing a *vertical* cut (drawer shorter than the viewport), that is a second issue —
  the backdrop measured a correct 664px height on both pages — say so and I will dig
  again.
- `PRODUCT_PAGE_MAX` stays at 5; the fix is not being asked to scale to many pages.
- No change to the drawer's own width ramp (`md:w-[440px]` / `lg:w-[520px]`) is wanted;
  it is correct and unrelated.
