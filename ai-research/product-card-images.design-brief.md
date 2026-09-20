# Product Card Images — Design Agent Brief

Companion to `ai-research/product-card-images.story.md`. The design agent has no repository access: it sees only the
screenshots listed below plus `DESIGN.md`. Every prompt is self-contained.

## 1. Screenshot capture guide

Run `pnpm dev` on the `feat/add-images` branch **after Phase 1 is implemented** (queries select `imageUrl`) so real
Cloudinary images appear; the current branch shows no images yet. Capture at ~390px (phone) and ~1440px (desktop).

| ID | Capture | Viewport | Theme | Why |
| --- | --- | --- | --- | --- |
| S1 | `/` page 1, top of the product grid, at least one row with an imaged and an image-less card side by side | 1440 | light | The mixed-row problem the placeholder solves — the agent must see the misalignment before designing the fix |
| S2 | Same as S1 | 1440 | dark | Dark ground/icon contrast |
| S3 | `/` scrolled to two consecutive cards, one imaged, one not | 390 | light | 16/9 mobile block and single-column rhythm |
| S4 | Same as S3 | 390 | dark | Mobile dark |
| S5 | One imaged card, cropped tight, showing the photo's crop against the gray ground (pick a product whose photo has white background) | 1440 | light | Shows how `object-cover` treats a white-background product shot on `#F3F4F6` — the agent must decide whether the ground should show |
| S6 | `/` while loading (throttle network or reload fast) — the skeleton grid | 1440 | light | Closest precedent for the loading rhythm |

Closest visual precedent for anything new: the existing card itself (S1). There is no other image surface in the app.

## 2. Briefs

### Brief 1 — Product card image block + placeholder

**Attach:** S1–S6, `DESIGN.md`.

**Prompt:**

```
You are designing one component for Tehesa, a Mexican industrial-supplies catalog (bolts, abrasives, drill bits,
brands like Weston). The app is a Next.js catalog where buyers browse product cards and build a quote list — it is
not a checkout, there is no cart total to pay, and nothing on a card is "Buy".

WHY THIS BRIEF EXISTS
Product photos are arriving gradually. Today roughly 130 of 333 products have a photo; the rest have none, and that
ratio will shift over months. Almost every grid row therefore mixes cards with a photo and cards without. Until now
the card simply omitted the image block when there was no photo, which — as the attached screenshots show — makes
the category label, title and price sit at different heights across one row. The fix is to always reserve the image
area, and show a quiet placeholder when there is no photo.

WHAT TO DESIGN — three states of the same card, at 1440px (cards ~280–340px wide, 4 per row) and at 390px (single
column):

1. Photo present. The image area is a rounded rectangle at the top of the card, aspect ratio 4:3 on desktop and
   16:9 on phone, corner radius 10px inside a card with radius 14px, background #F3F4F6 (dark theme: #1F2937). The
   photo fills it with cover-crop. Photos are product shots, often on a white background — decide and show whether
   the gray ground should be visible around the photo (contain) or the photo should fill fully (cover). Recommend
   one and state why in one sentence.

2. No photo (placeholder). Same rectangle, same ground color. Inside: a single centered line-style "image" glyph,
   about 24px, in a muted gray (light: #9CA3AF; dark: #4B5563). Nothing else. The placeholder must read as "the
   space where a photo goes", not as an error, not as a call to action, and it must not compete with the title.

3. A mixed row: two photo cards and two placeholder cards side by side, so alignment of label / title / price /
   buttons across the row is visible. Also show a mobile pair (one of each stacked).

Everything below the image area is already built and must be reproduced exactly as in the screenshots: uppercase
category kicker (e.g. "TORNILLERÍA / HEXAGONAL"), a "N variantes" pill, the product title (up to 3 lines), a brand
chip with a tag icon, then "Desde" + a price like "$12.50 MXN" with "hasta $40.00 MXN" beneath, then a primary button
"Explorar las 4 variantes" and an outline button "Agregar y elegir después" (or a single "Agregar 1 pieza" button for
one-variant products).

HARD CONSTRAINTS
- Do not add any text to the placeholder ("Sin imagen", "Foto próximamente", the brand name, the category name).
- Do not add a dashed border, a broken-image icon, a spinner, a shimmer, or a photo-frame illustration.
- Do not overlay anything on the photo: no badges, stock, "Nuevo", discount, image count, zoom/expand icon, favorite.
- Do not make the image clickable or add hover effects on the image itself (the card already has a hover shadow —
  keep it as shown).
- Do not change any copy, colors, type sizes, spacing or button styles below the image area.
- Do not propose a lightbox, carousel, or product detail page.
- Use only colors from the attached DESIGN.md tokens.

DELIVERABLE
Three frames per viewport (photo / placeholder / mixed row) in light and dark themes, plus one sentence each on: the
cover-vs-contain choice, and the placeholder glyph you chose.
```

**Check the output for — reject and re-run if:**

- Any text inside the placeholder, or a dashed/dotted border around it.
- A badge, label, or icon overlaid on the photo.
- The placeholder ground differs from the photo ground (they must be the same rectangle, same color).
- The image area's aspect ratio differs between the photo and placeholder states, or between cards in the mixed row.

## 3. Closing note

Bring back to the research doc: the cover-vs-contain call (record under D-list as D6; the story assumes `object-cover`
as shipped) and the placeholder glyph (D4 currently assumes `RiImageLine`). If the agent recommends `contain`, note
that it is a one-class change (`object-contain`) with no other impact.

Implementation follows the acceptance criteria in the research doc, not the comps. AC1 (query/type changes), AC5
(JSON-LD `image`) and AC6 (tests) have no visual expression at all; AC4 (skeleton) is derived from the Brief 1
output, not separately designed. Brief 1 is the only brief; once it is filed under `comps/product-card-images/` via
`/check-design`, the whole story is unblocked.
