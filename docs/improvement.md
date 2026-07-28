# BE

Reliable product counts:

- Current frontend cannot know a reliable total product count from GraphQL responses.
- Current workaround is response-length inference: 50 results means another page may exist; fewer than 50 means last page.
- This is enough for next/previous navigation but not enough for accurate `333 productos`, `pagina 2 de 7`, filtered result totals, analytics result counts, or SEO summaries.
- Recommended BE improvement is a count-capable product query or metadata field that returns total count for the same filters used by the product list.
- Count behavior should work for unfiltered catalog, name search, category search, brand search, and combined filters if BE supports them.
- A reliable count should come from the backend/source of truth, not from the frontend fetching all pages and counting locally.

Suggested BE contract shape:

- Product list response includes `items` and `pageInfo`/`meta` with `total`, `page`, `pageSize`, `pageCount`, `hasNextPage`, and `hasPreviousPage`.
- If changing the product list response is too large, expose a lightweight count query that accepts the same `ProductFiltersInput`.
- Keep count semantics clear around published/draft state so frontend counts match visible products.

## Product aggregate fields are unmaintained

Raised during Story 3 planning (`ai-planning/stories/plp-product-detail-signals.story3.md`, Phase 4). This is the backend half of that story's AC4.

- `minPrice`, `maxPrice`, `variantCount`, and `hasOneProductVariant` are **stored scalar columns** on the Product content type (`store-tehesa-api/src/api/product/content-types/product/schema.json`), not computed resolvers.
- There are no lifecycle hooks anywhere in the backend repo (`find src -name "lifecycles*"` returns nothing) and both product services are default `createCoreService` scaffolds. Nothing recomputes these four fields when a `product_variant` is added, edited, or removed.
- They are therefore import-time snapshots that can silently drift from the `product_variants` relation. Add a variant in the admin today and `variantCount` is immediately stale.
- Measured against the live catalog on 2026-07-27: 333 products, **zero drift** between `variantCount` and `hasOneProductVariant`, and 35 genuine single-variant products. The data is currently accurate — it is just structurally unguarded.
- Recommended fix: a lifecycle hook on `product-variant` (`afterCreate` / `afterUpdate` / `afterDelete`) that recomputes the parent product's four aggregate fields from the relation. That makes the defect class unrepresentable rather than merely detectable.
- Story 3 deliberately did **not** add a frontend sweep script for this. A frontend check can only observe drift after it ships; the write side is where it can be prevented, and that is this repository's concern.

## Catalog data defects to correct

Found during Story 3 planning by querying live Strapi. Three products out of 333. Confirmed with the user on 2026-07-27 that the zero prices are **not** legitimate — these are missing prices, not free items.

| Product | `documentId` | Defect |
|---------|--------------|--------|
| Broca Larga Acero A.V. | `w7jb86625axak2ux4hg1crfs` | `variantCount`, `minPrice`, `maxPrice` all null |
| Llave Hexagonal MM Punta de Bola Bondhus | `rcwaiqdmd7bag2ihg5nvrxfm` | `variantCount: 0`, `minPrice`/`maxPrice` of `0` |
| Broquero jacobs | `nk159rp5neguu1lne6c7ihgc` | `variantCount: 1`, `minPrice`/`maxPrice` of `0` |

- Correct the three records, then prevent recurrence. `$0.00` is never a valid catalog price, so the backend should reject or flag it rather than relying on anyone to notice.
- Suggested guards, alongside the lifecycle hook above: a positive-value validation on `minPrice`/`maxPrice`, and blocking publish for a product with zero variants.
- Frontend context: Story 3 deliberately ships no fallback UI for these. Today they render as a card with no price block, a `Explorar las 0 variantes` action, or a `$0.00 MXN` price — all of which read as broken to a buyer. The agreed handling is to fix the data, so these products stay visibly wrong until the records are corrected.

# FE

- Investigate graphql on the server using api from next js
- Change the title and meta description of SEO of the page as the current we have is for the landing.
- Analytics, other than GA4, we can do our own analytics or search analytics tools
- Show a notification error when the theme is changed but the cookie persistance failed

## Catalog API follow-up

- Story 1a (`ai-research/plp-catalog-api.story.md`) ships the initial catalog API routes with fixed page sizes (50 for products, 100 for variants) to keep the spike thin and match current server-action behavior.
- Caller-controlled page size with sane bounds is a deliberate follow-up, not part of Story 1a.
- This should be addressed by a later story once the API is in use and we know the realistic upper bounds callers need.

## Cart feature follow-up

Pick this up when the cart feature reaches develop. Deferred from Story 3 (`ai-research/stories/plp-product-detail-signals.story3.md`, open question UI V).

- `ProductVariantsDrawer` keys its selection state by array index (`selectedVariantIndexes`, `quantities`). Decide then whether to re-key it by `internalId`; Story 3 deliberately left it alone because nothing consumed the value yet.
- Story 3 retains `internalId` on every mapped variant (`ProductVariantUI`) precisely so the cart does not have to refetch variants for a product the user already opened. The drawer is the only place `internalId` is ever fetched — no product list query returns it — so do not drop it from the selected-variant shape.
- A selected line already carries everything a cart line needs: `internalId`, `diameter`, `price`, and quantity. No extra Strapi call should be required to build the cart payload.
- `Agregar al carrito` exists but is inert in two places: `ProductCard.tsx` (handler commented out) and the drawer footer (currently just closes the drawer). Both need wiring, and the card-level action needs a product-level decision since the card has no variant selection.
- Prices are already formatted as `$1,234.50 MXN` by the shared `formatNumberToCurrency`; reuse it rather than formatting cart totals separately.
