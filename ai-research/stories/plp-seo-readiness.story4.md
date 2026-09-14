# Research: Improve PLP SEO Readiness

## Story Definition

### Story Title

Story 4 - Improve PLP SEO Readiness

### Source

- Epic: `ai-research/epics/plp-functionality-seo.epic.md`
  - Story definition: lines 125-145
  - Current status audit (0% implemented): lines 608-618
  - Answered SEO decisions: lines 473-497 (SEO I-IV)
  - Answered Strapi contract decisions: lines 396-419 (Strapi I-IV)
- Predecessors: Stories 1, 1a, 1b, 1c, 2 are DONE; Story 3 is partial (image sub-scope blocked).

### Story Description

Make the catalog route search-engine friendly using App Router metadata APIs, crawlable
server-rendered markup, and structured data limited to fields the backend actually returns.
The catalog is a single route (`/`) whose state lives entirely in query params, so all SEO work
targets `/` plus its `?page=`, `?mode=category`, `?mode=brand`, and `?mode=name` variants.

### Acceptance Criteria

1. Root metadata is the approved production Spanish copy (SEO answer I) with a configurable
   absolute site origin, replacing the `Tehesa MVP` placeholder and its `// TODO`.
2. Every valid catalog URL emits a deliberate title, description, self-referencing canonical
   (with transient params stripped), and explicit robots directive, per the policy table below.
3. Pages 2-7 and the category/brand result URLs are reachable by a crawler through real
   `<a href>` links in the server-rendered HTML, and product names are verified present in the
   initial HTML response.
4. Indexability of filter/search URLs follows the decided policy: category and brand URLs are
   indexable and sitemap-listed; `?mode=name&q=` URLs are `noindex, follow`.
5. `robots.ts`, `sitemap.ts`, and JSON-LD ship using only verified data; no fabricated image,
   product URL, SKU, availability, or total-count values.

### Task Breakdown

| Phase | Deliverable |
|-------|-------------|
| 1 | SEO constants + `NEXT_PUBLIC_SITE_URL` plumbing; production root metadata + `metadataBase` in `layout.tsx` |
| 2 | `generateMetadata` in `page.tsx`: per-mode/per-page titles, canonicals, robots directives; canonical path builder in `src/features/Pagination/utils.pagination.ts` |
| 3 | Crawlable pagination: real anchors for numbered pages, prev/next, and filtered Anterior/Siguiente |
| 4 | `src/app/robots.ts` + `src/app/sitemap.ts` (base pages + category + brand URLs from live taxonomy) |
| 5 | JSON-LD: `WebSite` + `SearchAction`, and per-page `ItemList` of products with verified fields only |
| 6 | Tests for metadata/canonical/robots/sitemap/JSON-LD builders; manual SSR verification against a real build |

### Scope Assessment

Single story, 6 phases. Confirmed with the user: all five ACs stay in one research/plan/implement
cycle rather than splitting structured data into a follow-up.

### Dependencies

- No new npm dependencies. Everything uses Next 15 built-ins (`Metadata`, `generateMetadata`,
  `MetadataRoute.Robots`, `MetadataRoute.Sitemap`), `next/link`, and inline JSON-LD.
- New environment variable `NEXT_PUBLIC_SITE_URL` (value pending, see Open Questions).
- `sitemap.ts` depends on the existing `fetchCategories` / `fetchBrands` server actions.
- Blocked sub-scopes: `Organization` / `LocalBusiness` JSON-LD (no business data in repo),
  Open Graph / Twitter images (no image asset in repo), product-level `Product` rich results
  (no image, no product URL, no availability).

## Design Agent Handoff

### User Goal And Affected Surface

The user-facing behavior should not change. The only visual surface touched is the pagination
control at the bottom of the catalog (`Home.tsx:362-427`), where interactive buttons become
navigational links so crawlers can follow them. Everything else in this story is invisible markup
(`<head>` tags, `robots.txt`, `sitemap.xml`, a JSON-LD script block).

### Required States

- Default: numbered pages 1-7 with the current page visually active; prev/next icon controls.
- Active/current page: must keep its current active styling and gain `aria-current="page"`.
- Disabled/unavailable: first page has no previous target, last page has no next target, and
  filtered modes disable Siguiente when `hasNextCatalogPage` is false or the end notice is showing.
  These must render as non-navigable elements, never as `href="#"`.
- Busy: while a route transition is pending, controls must stay visually non-interactive as they do
  today (`isRoutePending` / `isBusy`).
- Loading and error states are unchanged (`src/app/loading.tsx`, `src/app/error.tsx`).

### Mobile And Desktop Expectations

Preserve the existing responsive layout of the pagination row (stacked on small screens, spread
row from `sm:` up). No new breakpoints.

### Accessibility Requirements

- Keep the existing `aria-label="Página anterior"` / `"Página siguiente"` labels.
- Links must be keyboard-reachable with a visible focus ring equivalent to the current buttons.
- Preserve the `nav` landmark that HeroUI's `Pagination.Root` renders.
- Disabled targets must be removed from the tab order rather than being focusable dead links.

### Visual Patterns To Preserve

HeroUI v3 component styling and the existing Tailwind classes. Do not introduce a new pagination
visual language; the change is semantic (`<button>` to `<a href>`), not cosmetic. Validate with
`pnpm design:lint` if any token-bearing class changes.

### Content And Technical Constraints

- Titles and descriptions are Spanish and must not claim totals the backend cannot confirm
  (`Página 2`, never `Página 2 de 7`).
- Every link target must be a canonical catalog URL built by the shared URL helpers, not an
  ad-hoc template string.

### Explicitly Out Of Scope

Card visuals, drawer visuals, hero copy, product images, Open Graph image design, and any new
route or landing page.

### Unanswered Design Questions

- Should the `h1` change (see Open Questions, UI And Product Decisions I)?
- Do we want a designed Open Graph / social share image, or none for now?

## Technical Research

### Affected Areas

| Path | Change |
|------|--------|
| `src/app/layout.tsx` | Replace placeholder metadata + `// TODO`; add `metadataBase` |
| `src/app/page.tsx` | Add `generateMetadata`; render JSON-LD alongside existing content |
| `src/app/robots.ts` | New |
| `src/app/sitemap.ts` | New |
| `src/features/Home/Home.tsx` | Anchor-based pagination for base and filtered modes |
| `src/features/Pagination/utils.pagination.ts` | Export a canonical/href path builder (currently `buildModeUrl` is module-private) |
| `src/shared/constants/seo.constants.ts` | New: site origin, title/description copy, robots policy per mode |
| `src/shared/utils/` | New pure helper for the JSON-LD payload (keeps `page.tsx` thin and testable) |
| `__tests__/seo/` | New tests for metadata, canonical building, robots, sitemap, JSON-LD payload |
| `REPO_CONTEXT.md`, `AGENTS.md`, `CLAUDE.md` | Document the new env var and the SEO surface |
| `src/app/category/` | Stray empty, untracked directory — no route, no files. Delete it or ignore it deliberately; an empty dir here is misleading |

### Verified Current State

Grep across `src/` and `next.config.ts` for `generateMetadata`, `robots`, `sitemap`,
`metadataBase`, `canonical`, and `ld+json` returns **zero matches**. Story 4 really is at 0%.

- `src/app/layout.tsx:18-22` still holds `// TODO: Change metadata`, `title: "Tehesa MVP"`,
  `description: "Esto es un MVP de Tehesa"`. No `metadataBase`, so any relative `alternates.canonical`
  would resolve against a Next-inferred origin.
- Only two env vars are read anywhere in `src/`: `STRAPI_HOST` and `STRAPI_API_TOKEN`
  (`src/app/apollo-client.ts:4`, `src/app/api/catalog/_utils.ts:62`). There is no `NEXT_PUBLIC_*`
  variable in the codebase yet, so this story introduces the first one.
- `src/app/` contains only `favicon.ico` as an asset — no `opengraph-image`, no `icon.*`.
- **Pagination is not crawlable.** `Home.tsx:378-396` uses HeroUI `Pagination.Link` with `onPress`.
  `node_modules/@heroui/react/dist/components/pagination/pagination.d.ts:40` defines
  `PaginationLinkProps extends ComponentPropsWithRef<typeof ButtonPrimitive>` where `ButtonPrimitive`
  is `react-aria-components/Button` — it renders a `<button>` and accepts no `href`. Pages 2-7
  currently exist only behind a JavaScript `router.push`, so a crawler that does not execute the
  click handler sees exactly one catalog page.
- Category and brand navigation is the same shape: `handleCategorySelect` / `handleBrandSelect`
  (`Home.tsx:208-220`) call `router.push` from dropdown `onPress` inside a drawer. There is no
  anchor anywhere in the app pointing at a `?mode=` URL.
- Product detail is a drawer (`handleProductClick` → `ProductVariantsDrawer`), not a route. There is
  **no per-product URL**, which is the hard constraint on structured data (see AC5 analysis).
- The `h1` is `Piezas precisas para trabajo exigente.` (`src/features/Home/CatalogHero.tsx:24-26`).
  It is brand copy and shares no keyword with the approved title
  (`Herramienta Industrial y Tornilleria en Puebla | Tehesa`).
- `Home` is a client component but is rendered by the server component `page.tsx`, so React SSR
  should emit product names into the initial HTML. `ProductCard` no longer calls `useMediaQuery`,
  so nothing defers card content to the client. **This is inference, not verification** — AC3
  requires checking a real build response.
- Nothing in the repo contains a WhatsApp link, phone number, street address, or the word `Puebla`
  (grep over `src/` and `DESIGN.md` is clean). The approved meta description promises
  `Cotiza por WhatsApp` but the app offers no such path.

### Metadata And Indexability Policy (Decided)

`notice=end` is a transient UI flag (`page.tsx:38`, `utils.pagination.ts:90-101`) and must never
appear in a canonical URL. `page` is canonical-bearing; `mode`, `q`, `category`, `brand` are too.

| URL shape | Title | Canonical | Robots |
|-----------|-------|-----------|--------|
| `/` and `/?page=1` | `Herramienta Industrial y Tornilleria en Puebla \| Tehesa` | `/` | `index, follow` |
| `/?page=N` (2-7) | `Herramienta Industrial y Tornilleria en Puebla \| Pagina N \| Tehesa` | `/?page=N` | `index, follow` |
| `?mode=category&category=X&page=1` | `X \| Herramienta industrial en Puebla \| Tehesa` | self | `index, follow` |
| `?mode=category&...&page=N` | same + `\| Pagina N` | self | `index, follow` |
| `?mode=brand&brand=X&page=N` | brand equivalent | self | `index, follow` |
| `?mode=name&q=T&page=N` | `Resultados para "T" \| Tehesa` | self | `noindex, follow` |
| any URL carrying `notice=end` | as above | same URL **without** `notice` | as above |

Rationale, per epic SEO answer II: page 2+ holds different products, so canonicalizing everything to
page 1 would hide products. Per the user's decision on filter URLs: category and brand values come
from a finite live taxonomy and behave like landing pages, while `?q=` is unbounded user input that
would generate near-duplicate thin pages, so it stays out of the index but keeps its links followed.

Two additional constraints:

- `/` and `/?page=1` both render page 1 (`parseBasePage` defaults `page` to `"1"`), so they are
  duplicates by construction. Both canonicalize to `/`.
- Do not put `de 7` in any title. `PRODUCT_PAGE_MAX` is derived from the hardcoded
  `KNOWN_PRODUCT_TOTAL = 333` (`catalog.constants.ts:32-35`), and epic SEO answer II explicitly
  forbids claiming totals the backend does not provide.

### Implementation Constraints Worth Knowing Before Planning

- **`generateMetadata` must not fetch products.** Apollo clients are created per call
  (`src/app/apollo-client.ts`) with no request-level dedupe, so any product fetch inside
  `generateMetadata` would double every catalog query. Titles and canonicals must be derived from
  `searchParams` alone. This is why JSON-LD (which needs product data) belongs in the page body,
  not in metadata.
- `getCatalogSelection` has side effects — it calls `redirect()` on invalid params and returns a
  `fetchProducts` closure. `generateMetadata` should use a **pure** parse of the same params, or
  reuse `getCatalogSelection` while never invoking the returned closure. Duplicating the parsing
  rules in a second place is the risk to avoid; extract a shared pure parser instead.
- **JSON-LD injection is a trust boundary.** Product names and taxonomy values come from Strapi.
  Serialize with `JSON.stringify` and escape `<` (or at minimum `</script`) before writing into
  `<script type="application/ld+json">`. Do not skip this.
- `metadataBase` needs an absolute origin. With `NEXT_PUBLIC_SITE_URL` unset, fall back to
  `http://localhost:3000` so `pnpm build`, `pnpm test`, and CI stay green without secrets
  (consistent with epic Verification answer I). Do not throw at build time.
- `robots.txt` must **not** `Disallow` the `?mode=name` URLs. A disallowed URL is never crawled, so
  the `noindex` directive would never be read. `Disallow: /api/` plus a `Sitemap:` line is the right
  content; noindex is expressed in page metadata.
- `sitemap.ts` should list `/`, `/?page=2..7`, and one URL per live category and brand (from
  `fetchCategories` / `fetchBrands`). Query-string URLs in a sitemap are valid. It must not list
  `?mode=name` URLs. No `lastModified` value is available — the product/taxonomy queries select no
  timestamp field — so omit it rather than invent one.
- The 7-page count in the sitemap inherits the same `KNOWN_PRODUCT_TOTAL` staleness as the Story 2
  caveat. If the catalog grows, the sitemap silently under-reports pages. Same root cause, one fix —
  and that fix is now available, because `products_connection { pageInfo { pageCount } }` exists
  (Strapi Contract I). Decide the scope before planning; do not let it leak in as a side effect.
- Invalid catalog URLs are handled by `redirect()`, which is a 307 in Next. Acceptable for URLs that
  should never have been linked; `permanentRedirect` would be marginally better SEO but changes
  existing tested behavior. Out of scope unless the plan says otherwise.

### Structured Data Analysis (AC5)

What the list queries actually return (`src/shared/queries/global.queries.ts`, all four product
queries): `name`, `documentId`, `minPrice`, `maxPrice`, `variantCount`, `hasOneProductVariant`,
`category { name }`, `brand { name }`. Nothing else.

What Strapi *has* but the frontend never asks for: `description` (text) and `customId` (unique
string). Still genuinely absent from the schema: image/media, `slug`, product-level SKU,
`availability`/`stock`, `currency` (see Strapi Contract V).

Consequences:

- A `Product` node cannot carry `image`, `url`, or `sku`. Google's product rich-result experiences
  effectively require an image and a product URL, so `Product` markup here will **not** produce rich
  snippets. It is still worth emitting as machine-readable catalog data, but the story should not
  promise rich results.
- Feasible and honest today:
  - `WebSite` with a `SearchAction` whose `target` is `/?mode=name&q={search_term_string}`. Fully
    verified — that URL exists and works.
  - `ItemList` per catalog page: `position` + a `Product` item with `name`, `brand`, `category`, and
    an `AggregateOffer` (`lowPrice: minPrice`, `highPrice: maxPrice`, `priceCurrency: "MXN"`,
    `offerCount: variantCount`). Omit `offers` entirely when `minPrice`/`maxPrice` are null — the
    three known defective zero-variant products documented in `docs/improvement.md` would otherwise
    emit `null` prices.
  - Collapse to a single `Offer` instead of `AggregateOffer` when `hasOneProductVariant === true`,
    mirroring the card's own price rendering.
  - `BreadcrumbList` on category and brand URLs (`Catálogo` → value) is cheap and truthful.
  - Optional, pending the scope call in Catalog Behavior I: add `description` to the product queries
    and emit `Product.description`. Truthful, no fabrication, but it widens the story into the data
    layer.
- Blocked: `Organization` / `LocalBusiness` needs name, address, phone, hours, and social/WhatsApp
  URL. None of that exists in the repo. This is the highest-value local-SEO item for a Puebla
  distributor and it is blocked on the user, not on code.
- Emit no `ItemList` when the page has zero products.

### Existing Patterns To Follow

- Server component fetches via `"use server"` actions in `src/shared/lib/global.lib.ts`; never call
  internal HTTP routes from `page.tsx` / `sitemap.ts`.
- Canonical URL construction belongs with the existing builders in
  `src/features/Pagination/utils.pagination.ts` (`buildModeUrl`, `buildPageOneUrl`,
  `buildPreviousNoticeUrl`), which already own `URLSearchParams` ordering. Extend, don't duplicate.
- Copy constants and validation constants live in `src/shared/constants/`; error/message constants
  there are already the precedent for centralized strings.
- Pure helpers live in `src/shared/utils/` (`formatNumberToCurrency`, `catalog-api.utils.ts`).
- Spanish UI copy throughout; `lang="es"` is already set on `<html>` (`layout.tsx:30`).
- Tests live in root `__tests__/`, mirroring source folders. Canonical rules are in
  `docs/UNIT_TESTING_GUIDELINES.md` — follow them, they are not restated here.

### Verification Rules To Follow Later

- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test`.
- `pnpm design:lint` if any styled class in the pagination markup changes.
- AC3 needs a real check, not inference: run a production build and inspect the raw HTML for
  product names, the canonical tag, and the JSON-LD block (e.g. `curl -s <url> | grep`). Confirm
  `/robots.txt` and `/sitemap.xml` respond.
- Tests must mock Strapi at the server-action boundary and must not require `STRAPI_HOST` /
  `STRAPI_API_TOKEN` or `NEXT_PUBLIC_SITE_URL` (epic Verification answer I).
- Do not run `pnpm install`. Do not bump the version or edit `CHANGELOG.md`; PR targets `develop`
  with exactly one of `major` / `minor` / `patch`.

### Edge Cases And Constraints

- `notice=end` stripped from canonicals; `page=1` folded into `/` for base mode.
- Category/brand titles interpolate user-supplied params. They are already validated
  (`SEARCH_TERM_PATTERN`, 100-char cap, `parseModeValue`) before reaching the page, so titles are
  constrained; name-mode titles echo arbitrary allowlisted input, mitigated by `noindex`.
- Empty page 1 renders an empty state and must still emit valid metadata and no `ItemList`.
- Page > 1 with zero results redirects, so metadata for those URLs is never served.
- Single locale — no `alternates.languages` needed.
- No `next/image` anywhere; nothing image-related to optimize for Core Web Vitals in this story.
- `favicon.ico` exists; richer icon/OG metadata is a nice-to-have needing assets.

## Open Questions

### Strapi Contract

I: Question: Can Strapi expose a reliable total product count (pagination metadata) for accurate
page counts in the sitemap and for result summaries?
Status: answered — **and it contradicts the epic**
Answer: Yes. Live GraphQL introspection confirms `products_connection(pagination: $pagination)`
returning `pageInfo { total page pageSize pageCount }` alongside `nodes { ... }`. The real total is
available today; the frontend simply never queries it.
Context: Verified by the backend-research subagent against the live schema. Epic Strapi answer I
(`ai-research/epics/plp-functionality-seo.epic.md:398-402`), `REPO_CONTEXT.md`, and `AGENTS.md` all
state that no pagination metadata exists. That statement is wrong.
Explanation: This unblocks a correct sitemap page list and a truthful result count, and it removes
the `KNOWN_PRODUCT_TOTAL = 333` staleness at its root (`catalog.constants.ts:32-35`). Switching the
product queries to `products_connection` is a real change to the data layer and to the four product
queries, so it is **not** silently absorbed into this story — see Catalog Behavior I for the scope
decision. If it stays out, the sitemap derives its page list from `PRODUCT_PAGE_MAX` and inherits
the stale-total risk.

II: Question: Are product image URLs available for Open Graph or `Product.image` structured data?
Status: answered
Answer: No. Products have no image field in Strapi yet (epic Strapi answer III). Image-bearing
structured data and OG images stay out of scope, same blocker as Story 3 AC2.

III: Question: Is a product slug or any public product URL identifier available, so structured data
could carry `Product.url`?
Status: answered
Answer: No slug exists (epic Strapi answer IV), and this frontend has no product detail route —
detail is a drawer. `Product.url` and `@id` must be omitted.

IV: Question: Do product, category, or brand records expose an updated-at timestamp usable for
`sitemap.lastModified`?
Status: answered
Answer: No. The backend does not expose these fields, confirmed by the user on 2026-07-27.
Explanation: `sitemap.ts` therefore omits `lastModified` entirely. Do not substitute a build
timestamp, `new Date()`, or any other stand-in — a fabricated date is worse than an absent one,
because crawlers act on it. `changeFrequency` and `priority` are also omitted; Google ignores both,
so they would be noise rather than signal.

V: Question: Which descriptive product fields exist in Strapi but are simply not selected by the
frontend queries?
Status: answered
Answer: `description` (text) and `customId` (string, unique) exist on the Product content-type. No
list query selects either (`src/shared/queries/global.queries.ts`).
Context: Verified against
`store-tehesa-api/src/api/product/content-types/product/schema.json` by the backend-research
subagent. Confirmed still absent: image/media, `slug`, product-level `sku`, `availability`/`stock`,
`currency`. `internalId` remains a ProductVariant field only.
Explanation: Adding `description` to the product queries is a one-line-per-query change that would
let JSON-LD carry a real `Product.description` and could feed per-category meta descriptions,
without fabricating anything. `customId` is unique and stable, so it is a viable public identifier
for a future product-detail route — relevant to `Product.url`, but that route does not exist and is
out of scope here. Whether to select `description` in this story is a scope call: see Catalog
Behavior I.

VI: Question: Is there any Strapi-side SEO field the frontend could consume instead of hardcoding
copy?
Status: answered
Answer: A shared `seo` component exists (`store-tehesa-api/src/components/shared/seo.json`) with
`metaTitle`, `metaDescription`, and `shareImage`, but it is **not attached** to Product, Category, or
Brand. It is defined and unused.
Explanation: Backend-owned follow-up, not a frontend change. If attached later, category and brand
pages could serve editor-authored titles/descriptions and a share image — which would also unblock
the Open Graph image sub-scope. Worth adding to `docs/improvement.md` alongside the existing
lifecycle-hook follow-up. This story hardcodes copy in `src/shared/constants/`.

### SEO And Product Decisions

I: Question: What is the production canonical origin for `metadataBase`, canonicals, and the
sitemap?
Status: answered
Answer: Not decided yet. Plan it as a new `NEXT_PUBLIC_SITE_URL` environment variable with a
localhost development fallback; the real domain is filled in at deploy time.
Context: The repo has no `NEXT_PUBLIC_*` variable today and `REPO_CONTEXT.md:323` already notes the
deployment target is undocumented.

II: Question: Should Story 4 also ship crawlable anchors, or metadata only?
Status: answered
Answer: Ship real anchors for the pagination controls (numbered pages, prev/next, and the filtered
Anterior/Siguiente). Without them, pages 2-7 are unreachable by a crawler and ACs 2-3 would be
cosmetic.
Context: `Pagination.Link` is a react-aria `Button` and takes no `href`.

III: Question: Which filter/search URLs should be indexable?
Status: answered
Answer: `?mode=category` and `?mode=brand` are indexable, self-canonical, and sitemap-listed.
`?mode=name&q=` is `noindex, follow`.

IV: Question: What business data can we use for `Organization` / `LocalBusiness` JSON-LD — legal
name, street address, city, postal code, phone, WhatsApp number, opening hours, logo URL, social
profiles?
Status: deferred — tracked, not blocking
Answer: Leave it pending and track it as an improvement item. Story 4 ships without
`Organization` / `LocalBusiness` JSON-LD. Recorded in `docs/improvement.md` under
"Business data for local SEO structured data (pending)".
Context: Nothing of the sort exists anywhere in the repo. The approved meta description already
promises `Cotiza por WhatsApp`, so at minimum a WhatsApp URL is implied.
Explanation: For a Puebla-based distributor this remains the single highest-value structured-data
item, and it is blocked only on the business data, not on code. Adding the node later is additive —
one more JSON-LD object, no refactor of anything this story builds.

V: Question: Should the `h1` change from `Piezas precisas para trabajo exigente.` to something
keyword-aligned with the approved title?
Status: answered
Answer: No, not for now. The `h1` copy stays exactly as it is.
Context: `src/features/Home/CatalogHero.tsx:24-26`.
Explanation: `CatalogHero` is therefore untouched by this story. The keyword signal lives in the
`<title>`, meta description, and per-mode titles only. Noted as a known, accepted gap rather than an
oversight — revisit if the SERP performance of the catalog page ever needs it.

VI: Question: The approved meta description promises `Cotiza por WhatsApp`, but no WhatsApp entry
point exists in the app. Ship the copy anyway, or add the CTA?
Status: answered
Answer: Ship the approved copy verbatim. The WhatsApp quote CTA belongs on the **cart**, and lands
with the cart feature — not on the PLP and not in this story.
Explanation: There is a temporary mismatch between the SERP snippet and the landing page until the
cart ships. That is accepted deliberately. No WhatsApp link, button, or `wa.me` URL is added
anywhere in Story 4; adding one to the PLP would be scope invention. Cross-referenced in
`docs/improvement.md` so the cart story picks it up.

VII: Question: Do we want Open Graph / Twitter card images?
Status: answered
Answer: No. No Open Graph or Twitter card image.
Context: `src/app/` has only `favicon.ico`; no `opengraph-image` asset exists.
Explanation: Textual Open Graph / Twitter metadata (title, description, type, locale, siteName) still
ships, since it is free and comes from the same constants as the page metadata — only the *image* is
dropped. No image asset is created, requested, or generated. If `shareImage` is ever attached to the
Strapi `seo` component (see Strapi Contract VI), the image becomes available without frontend design
work.

### Catalog Behavior

I: Question: How much of the `products_connection` opportunity belongs in this story — real page
count for the sitemap, the `de 333 productos` copy fix, and/or `description` in the queries?
Status: answered
Answer: **Option I — SEO only.** The four product queries stay untouched. No `products_connection`
adoption, no `description` selection, no `Mostrando X-Y de 333` copy change in this story.
Context: Backend research overturned the epic's "no pagination metadata" assumption
(Strapi Contract I), and `description` turns out to be available (Strapi Contract V). The rejected
alternatives were: II, add a `products_connection` count read for the sitemap and the result summary;
III, also select `description` to enrich JSON-LD.
Explanation: Consequences of option I, accepted deliberately:
  - `sitemap.ts` derives its page list from `PRODUCT_PAGE_MAX` (7), so it inherits the
    `KNOWN_PRODUCT_TOTAL = 333` staleness. If the catalog grows past 350 products, the sitemap
    under-reports pages until the constant is updated.
  - Titles say `Página N`, never `Página N de 7`.
  - `Product` JSON-LD carries no `description`.
  - The Story 2 caveat (`Mostrando X-Y de 333 productos`) stays open.
Options II and III are now unblocked backend-wise and belong in their own story. The correction is
recorded in `REPO_CONTEXT.md` and `docs/improvement.md` so the next planner does not re-derive it.

### Verification

I: Question: Will a Search Console / Bing verification token be needed in metadata, and who owns
the property?
Status: answered
Answer: Yes — Google Search Console will be used. The property gets created and verified once the
production domain exists. Story 4 still ships **no** verification meta tag: verify by DNS `TXT`,
which needs no code. If you later prefer the HTML-meta method instead, it is a one-line addition
(`metadata.verification.google`) to Phase 1.
Post-deploy checklist this implies, outside the code: create the property, verify ownership, submit
`/sitemap.xml`, then confirm pages 2-7 are indexed and `?mode=name` URLs are excluded as
`noindex`.
Context: Yes, "Search Console" means **Google Search Console** (`search.google.com/search-console`),
Google's free dashboard for a site you own. Once a domain is verified there it reports which queries
show the site, which pages are indexed or excluded and why, canonical and duplicate decisions,
sitemap processing status, structured-data validity, and crawl errors. It is the only place to see
whether the indexability policy in this story actually took effect. "Bing" means the equivalent
Bing Webmaster Tools; optional, and it can import from Google.
Explanation: Verification is proving domain ownership to Google, done once, in one of several ways —
a DNS `TXT` record, an uploaded HTML file, a Google Analytics/Tag Manager link, or an HTML `<meta>`
tag. Only the last one touches this codebase: `metadata.verification.google = "<token>"` in
`layout.tsx`, one line. DNS is generally preferable — it verifies every subdomain and survives
frontend rewrites — so this story needs no code for it.

II: Question: Automated tests must not depend on real env vars — confirmed?
Status: answered
Answer: Yes. Tests mock Strapi at the server-action boundary; manual QA uses the live config (epic
Verification answer I). `NEXT_PUBLIC_SITE_URL` therefore needs a development/test fallback rather
than a required-var assertion.

## Assumptions Made

- Full research template (5 ACs, six phases, new route conventions) rather than quick mode.
- All five ACs stay in one story, per the user's answer.
- No new npm dependency; Next 15 built-ins cover metadata, robots, sitemap, and JSON-LD.
- The approved title and meta description copy from epic SEO answer I ships verbatim, accents as
  written in the epic.
- `NEXT_PUBLIC_SITE_URL` is the env var name; a missing value falls back to `http://localhost:3000`
  and never fails a build or a test.
- Structured data ships as `WebSite` + `SearchAction`, per-page `ItemList` with `Product` +
  `AggregateOffer` (MXN), and `BreadcrumbList` on category/brand URLs. `Organization` /
  `LocalBusiness` is out, deferred to `docs/improvement.md`.
- `CatalogHero` is not touched — the `h1` copy stays as-is (decision SEO V).
- Textual Open Graph / Twitter metadata ships; no OG image asset (decision SEO VII).
- The approved meta description ships verbatim including `Cotiza por WhatsApp`; no WhatsApp CTA is
  added anywhere — that lands on the cart with the cart feature (decision SEO VI).
- Google Search Console will be used, but no verification meta tag ships; ownership is verified by
  DNS after the domain exists (decision Verification I).
- `sitemap.ts` emits URLs only — no `lastModified` (backend exposes no timestamps), and no
  `changeFrequency` / `priority` (Google ignores both).
- Product names are already in the SSR HTML; this is treated as an assumption to be verified during
  implementation, not a fact.
- Existing catalog URL semantics, redirects, and validation stay unchanged; this story adds SEO
  surface, it does not restructure routing. No `/categoria/[slug]` route in this story.
- The four product queries stay untouched (Catalog Behavior I, option I) until you say otherwise, so
  the sitemap's page list still derives from `PRODUCT_PAGE_MAX` and JSON-LD carries no
  `description`, even though the backend can now supply both.

## Non-Obvious Findings

1. **Strapi does expose pagination metadata.** `products_connection { pageInfo { total page pageSize
   pageCount } nodes { ... } }` exists in the live schema. The epic
   (`plp-functionality-seo.epic.md:398-402`), `REPO_CONTEXT.md`, and `AGENTS.md` all assert the
   opposite, and `KNOWN_PRODUCT_TOTAL = 333` plus the `products.length === 50` next-page inference
   exist only because of that wrong assumption. Corrected in `REPO_CONTEXT.md`.
2. Strapi's Product has `description` and a unique `customId`; no frontend query selects either. The
   `shared.seo` component (`metaTitle`, `metaDescription`, `shareImage`) exists but is attached to
   nothing.
3. `Pagination.Link` in HeroUI v3 is a react-aria `Button`, not an anchor
   (`pagination.d.ts:40`). Any "crawlable pagination" claim in this repo is false until real `href`
   markup exists.
4. Because Apollo clients are per-call with no dedupe, product data must never be fetched inside
   `generateMetadata` — it would double every catalog query. Metadata comes from params; JSON-LD
   comes from the page body.
5. `getCatalogSelection` is not pure: it calls `redirect()` and returns a fetch closure. Metadata
   generation needs a pure parse extracted from it rather than a second copy of the parsing rules.
6. `notice=end` is a transient UI param that would otherwise leak into canonical URLs.
7. `/` and `/?page=1` are duplicates by construction, because `parseBasePage` defaults `page` to
   `"1"`.
8. `robots.txt` must not disallow the `?mode=name` URLs, or their `noindex` would never be read.
9. `src/app/category/` is an empty untracked directory — no route exists there despite the name.

## Research Outcome

Every open question is now answered. Story 4 is ready to plan as **option I, SEO only**: production root
metadata with an env-driven `metadataBase`, per-URL titles/canonicals/robots directives, crawlable
anchor pagination, `robots.ts`, `sitemap.ts`, and structured data limited to `WebSite` +
`SearchAction`, `ItemList`, and `BreadcrumbList`.

Deliberately excluded, each with a recorded reason: `Organization` / `LocalBusiness` JSON-LD (no
business data — `docs/improvement.md`), `h1` copy changes, any WhatsApp CTA (cart story), OG images,
Search Console verification tags, and every touch to the four product queries.

The only value still needed before deploy is the production domain for `NEXT_PUBLIC_SITE_URL`;
implementation does not have to wait for it. Post-deploy, outside this repo: create the Google
Search Console property, verify by DNS, submit `/sitemap.xml`, and confirm pages 2-7 are indexed
while `?mode=name` URLs are excluded. Ready for `/plan` on sign-off.
