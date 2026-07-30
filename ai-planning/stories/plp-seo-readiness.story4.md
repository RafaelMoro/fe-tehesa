# Plan: Improve PLP SEO Readiness

## Header

- **Story:** Story 4 — Improve PLP SEO Readiness (`ai-research/epics/plp-functionality-seo.epic.md:125-145`).
- **Research doc:** `ai-research/stories/plp-seo-readiness.story4.md`
- **Sign-off:** research signed off; every open question is answered or explicitly deferred.
- **Scope:** option I, SEO only. The four product queries, `KNOWN_PRODUCT_TOTAL`, and the `Mostrando X-Y de 333` copy stay untouched (Catalog Behavior I).
- **Assumptions carried from research:** no new npm dependency; approved Spanish copy ships verbatim (including unaccented `Tornilleria` / `Pagina` and `Cotiza por WhatsApp`); `NEXT_PUBLIC_SITE_URL` falls back to `http://localhost:3000`; no `Organization` / `LocalBusiness` JSON-LD; no OG image; no Search Console meta tag; no WhatsApp CTA; `CatalogHero` `h1` unchanged.

### Verified During Planning (2026-07-30)

Checked directly in `node_modules`, because Phase 3 depends on it:

- `@heroui/react/dist/components/pagination/pagination.js` — `Pagination.Root` / `Content` / `Item` are polymorphic `dom.nav` / `dom.ul` / `dom.li` wrappers that only apply a class; `Pagination.Root` renders `<nav role="navigation" aria-label="pagination">`. Keeping them costs nothing.
- `Pagination.Link` renders a `react-aria-components/Button` with `className="pagination__link"`, `data-active="true"`, `aria-current="page"`, `data-slot="pagination-link"`. It cannot take an `href`.
- `@heroui/styles/dist/components/pagination.css:26-83` — `.pagination__link` is a plain CSS class, element-agnostic, with `&:focus-visible`, `&[aria-disabled="true"] { @apply status-disabled }`, and `&[data-active="true"]` rules. **An `<a class="pagination__link">` is pixel-identical to the current button**, so Phase 3 is a semantic change only and needs no new Tailwind classes.

No `public/robots.txt` exists, so `src/app/robots.ts` has no conflict.

## Acceptance Criteria

1. Root metadata is the approved production Spanish copy (SEO answer I) with a configurable absolute site origin, replacing the `Tehesa MVP` placeholder and its `// TODO`.
2. Every valid catalog URL emits a deliberate title, description, self-referencing canonical (with transient params stripped), and explicit robots directive, per the policy table in research.
3. Pages 2-7 and the category/brand result URLs are reachable by a crawler through real `<a href>` links in the server-rendered HTML, and product names are verified present in the initial HTML response.
4. Indexability of filter/search URLs follows the decided policy: category and brand URLs are indexable and sitemap-listed; `?mode=name&q=` URLs are `noindex, follow`.
5. `robots.ts`, `sitemap.ts`, and JSON-LD ship using only verified data; no fabricated image, product URL, SKU, availability, or total-count values.

## Affected Files

| Area | File | Action |
|------|------|--------|
| `src/shared/**` | `src/shared/constants/seo.constants.ts` | Create — origin, copy, robots policy |
| `src/shared/**` | `src/shared/utils/seo.utils.ts` | Create — pure metadata + JSON-LD builders |
| `src/features/**` | `src/features/Pagination/utils.pagination.ts` | Modify — extract pure parser, export canonical/href builders |
| `src/features/**` | `src/features/Pagination/types.pagination.ts` | Modify — `CatalogUrlState` type |
| `src/app/**` | `src/app/layout.tsx` | Modify — `metadataBase` + production metadata |
| `src/app/**` | `src/app/page.tsx` | Modify — `generateMetadata`, JSON-LD script |
| `src/app/**` | `src/app/robots.ts` | Create |
| `src/app/**` | `src/app/sitemap.ts` | Create |
| `src/app/**` | `src/app/category/` | Delete — empty untracked directory, no route |
| `src/features/**` | `src/features/Home/Home.tsx` | Modify — anchor pagination (both modes) |
| tests | `__tests__/seo/seo.utils.test.ts` | Create |
| tests | `__tests__/seo/robots.test.ts` | Create |
| tests | `__tests__/seo/sitemap.test.ts` | Create |
| tests | `__tests__/catalog/pagination-urls.test.ts` | Create — pure parser + canonical builders |
| tests | `__tests__/home/Home.test.tsx` | Modify — pagination anchors |
| docs | `REPO_CONTEXT.md`, `AGENTS.md`, `CLAUDE.md`, `.env.example` if adopted | Modify — new env var + SEO surface |

Not touched: `src/shared/queries/global.queries.ts`, `src/shared/lib/global.lib.ts`, `src/shared/constants/catalog.constants.ts`, any API route, `src/features/Home/CatalogHero.tsx`, `package.json`.

---

## Phase 1 — SEO constants, env plumbing, root metadata (AC1)

### Changes Required

**`src/shared/constants/seo.constants.ts`** — Create. Strings and the origin only; no logic.

```ts
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
export const SITE_NAME = "Tehesa"
export const SITE_TITLE = "Herramienta Industrial y Tornilleria en Puebla | Tehesa"
export const SITE_DESCRIPTION =
  "Distribuidores directos de Bohrcraft, King Tony y Cleveland en Puebla. Tornilleria, brocas y herramienta de corte. Cotiza por WhatsApp."
export const SITE_LOCALE = "es_MX"
// title fragments used by the per-mode builders in Phase 2
export const TITLE_BASE = "Herramienta Industrial y Tornilleria en Puebla"
export const TITLE_TAXONOMY_SUFFIX = "Herramienta industrial en Puebla"
```

Copy ships verbatim from epic SEO answer I, unaccented spellings included. `SITE_URL` is read once at module scope — `NEXT_PUBLIC_*` is inlined at build, so there is no per-request cost and no runtime assertion. Never throw when it is unset.

**`src/app/layout.tsx`** — Modify, lines 18-22. Delete the `// TODO: Change metadata` comment and the placeholder object.

```ts
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: { /* type website, siteName, locale, title, description, url "/" */ },
  twitter: { /* card "summary", title, description */ },
}
```

No `title.template` — Phase 2 returns complete titles and a template would silently re-suffix them. No `verification` key (DNS ownership, Verification I). No `images` key anywhere (SEO VII).

### Edge Cases

- `new URL()` on a malformed `NEXT_PUBLIC_SITE_URL` throws at import time and breaks every route. The fallback covers "unset"; a garbage value is a deploy misconfiguration and should fail loudly — do not defensively try/catch it.
- The fallback keeps `pnpm build`, `pnpm test`, and CI green without secrets.

### Success Criteria

- Automated: `pnpm exec tsc --noEmit`, `pnpm lint`.
- Manual: `pnpm dev`, view source at `/`, confirm `<title>` and `<meta name="description">` are the approved copy and `og:url` is absolute.

---

## Phase 2 — Per-URL metadata, pure parser, canonical builder (AC2, AC4)

### Changes Required

**`src/features/Pagination/types.pagination.ts`** — Modify. Add the pure state shape (no closure, no feedback):

```ts
export type CatalogUrlState = {
  mode: CatalogMode
  value: string | null
  page: number
}
```

**`src/features/Pagination/utils.pagination.ts`** — Modify.

1. Add `export const parseCatalogParams = (params: MainPageSearchParams): CatalogUrlState | null`. It applies the existing `DIGITS_ONLY` / range / `parseModeValue` rules and returns `null` instead of calling `redirect()`.
2. Refactor `getCatalogSelection` to call `parseCatalogParams` first: `null` → `redirectToBase()`, otherwise build the `fetchProducts` closure, `hasPrevious`, and `feedback` from the parsed state exactly as today. **One source of parsing truth** — do not copy the rules into a second function (research non-obvious finding 5).
3. Add `export const buildCanonicalPath = (state: CatalogUrlState): string`:
   - `base` + `page === 1` → `/` (research: `/` and `/?page=1` are duplicates by construction).
   - `base` + `page > 1` → `/?page=N`.
   - otherwise → the existing private `buildModeUrl(mode, value, page)` with **no `notice`**.
4. Add `export const buildBasePagePath = (page: number)` (`/` for 1, `/?page=N` otherwise) and export `buildModeUrl` for Phase 3's filtered prev/next hrefs. Keep `buildPageOneUrl` / `buildPreviousNoticeUrl` unchanged — redirect targets are not canonicals.

**`src/shared/utils/seo.utils.ts`** — Create. Pure, no imports from `global.lib`, no fetching.

```ts
export const buildCatalogMetadata = (params: MainPageSearchParams): Metadata
```

- Calls `parseCatalogParams`. `null` → return the root title/description with `robots: { index: false, follow: true }` (the page redirects anyway; do not emit an indexable canonical for a URL that 307s).
- Titles:
  | Mode | Title |
  |------|-------|
  | base, page 1 | `SITE_TITLE` |
  | base, page N | `${TITLE_BASE} \| Pagina N \| Tehesa` |
  | category / brand, page 1 | `${value} \| ${TITLE_TAXONOMY_SUFFIX} \| Tehesa` |
  | category / brand, page N | `${value} \| ${TITLE_TAXONOMY_SUFFIX} \| Pagina N \| Tehesa` |
  | name | `Resultados para "${value}" \| Tehesa` (+ `\| Pagina N` before `\| Tehesa`) |
- Never `de 7` in any title (epic SEO answer II).
- Descriptions: base → `SITE_DESCRIPTION`; category/brand → value-interpolated Spanish copy that claims no counts and no stock; name → `Resultados de búsqueda para "${value}" en el catálogo de Tehesa.`
- `alternates: { canonical: buildCanonicalPath(state) }` — relative, resolved by `metadataBase`.
- `robots: { index: mode !== "name", follow: true }`.
- `openGraph` / `twitter` reuse the same title, description, and canonical `url`.

**`src/app/page.tsx`** — Modify. Add above `MainPage`:

```ts
export const generateMetadata = async ({ searchParams }: { searchParams: Promise<MainPageSearchParams> }): Promise<Metadata> =>
  buildCatalogMetadata(await searchParams)
```

### Edge Cases

- **`generateMetadata` must never fetch products** — Apollo clients are per-call with no dedupe, so a fetch here doubles every catalog query (research finding 4). It must also never call `getCatalogSelection`, which can `redirect()`.
- `notice=end` must not appear in any canonical; `buildCanonicalPath` simply never passes it.
- Name-mode values are echoed into the title. They are already trimmed, ≤100 chars, and `SEARCH_TERM_PATTERN`-constrained; `noindex` covers the rest.

### Success Criteria

- Automated: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test -- __tests__/catalog/pagination-urls.test.ts` (Phase 6 authors it; run it once written).
- Manual: `pnpm dev`, view source on `/`, `/?page=3`, `/?mode=category&category=Brocas&page=2`, `/?mode=name&q=broca&page=1&notice=end` — confirm the title, the canonical (no `notice`), and `robots` per the table.

---

## Phase 3 — Crawlable pagination anchors (AC3)

### Changes Required

**`src/features/Home/Home.tsx`** — Modify, lines 362-427. Import `Link` from `next/link` plus the URL builders from `utils.pagination.ts`. Keep every existing class, `aria-label`, and the responsive layout.

Base-mode block (lines 362-408):

- Keep `Pagination`, `Pagination.Content`, `Pagination.Item` (they are `nav` / `ul` / `li`, the landmark stays).
- Replace `Pagination.Link` with:
  - current page → `<span className="pagination__link" data-active="true" aria-current="page">` (not navigable, out of the tab order).
  - other pages → `<Link href={buildBasePagePath(page)} className="pagination__link" data-slot="pagination-link">`.
  - `// ponytail: pagination__link is HeroUI's own slot class (pagination.css); an <a> gets identical styling. Revisit if HeroUI renames it.`
- Prev/next icon `Button`s → `<Link href={buildBasePagePath(currentPage - 1)} aria-label="Página anterior">` when a target exists; when there is none (`currentPage === 1` / `=== totalPages`), render the same markup as a `<span aria-disabled="true">` instead of an `href="#"` anchor.

Filtered-mode block (lines 409-427):

- `Anterior` → `<Link href={buildModeUrl(activeCatalogMode, catalogValue, initialCatalogPage - 1)}>` when `initialHasPreviousCatalogPage`, else a disabled `<span aria-disabled="true">`.
- `Siguiente` → same, disabled when `!initialHasNextCatalogPage || isEndNotice`.
- `Página {initialCatalogPage}` label unchanged.

Busy handling: when `isBusy` / `isRoutePending`, render the disabled `<span>` variant so controls stay visually non-interactive as they do today. `handlePageChange` and `handleCatalogPageChange` become dead once nothing calls them — delete them and the now-unused `navigateTo` call sites, but keep `navigateTo` itself (`clearWideAndLocalFilters` and the drawer handlers still use it).

### Edge Cases

- `<Link>` scrolls to top by default, replacing the manual `window.scrollTo` these two paths used. Do not re-add it.
- Only the pagination controls change. Category/brand selection stays inside the drawer dropdowns (`router.push`); their crawlable entry point is the sitemap, per research — do not turn dropdown items into links.
- Keyboard: anchors are focusable natively and `.pagination__link:focus-visible` already applies `status-focused`.

### Success Criteria

- Automated: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm design:lint` (no token-bearing class should change; run it to prove that).
- Manual: pages 2-7 open via middle-click / new tab and show a real URL on hover; current page is not clickable and reads `aria-current="page"`; first page shows no previous target and page 7 no next target; keyboard tab order reaches only enabled controls; layout unchanged at mobile and `sm:` up.

---

## Phase 4 — `robots.ts` and `sitemap.ts` (AC4, AC5)

### Changes Required

**`src/app/robots.ts`** — Create.

```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/api/",
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
```

Do **not** disallow `?mode=name` — a disallowed URL is never crawled, so its `noindex` would never be read (research finding 8).

**`src/app/sitemap.ts`** — Create.

```ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap>
```

- Base entries: `${SITE_URL}/` plus `${SITE_URL}${buildBasePagePath(n)}` for `n = 2..PRODUCT_PAGE_MAX`.
- Taxonomy entries: `fetchCategories()` and `fetchBrands()` in `Promise.all`, one URL each via `buildModeUrl("category" | "brand", item.name, 1)`, absolute-prefixed.
- `url` only — **no `lastModified`, no `changeFrequency`, no `priority`** (Strapi Contract IV; a fabricated date is worse than an absent one).
- No `?mode=name` URLs.
- Wrap the two taxonomy fetches in a single `try/catch` that falls back to the base pages and logs a warning. This is a deliberate exception to the repo's "throw at the boundary" rule: `sitemap.ts` is statically generated, so an unreachable Strapi during `pnpm build` would fail the whole build. Mark it `// ponytail: sitemap must not fail a build; degrade to base pages.`

**`src/app/category/`** — Delete. Empty, untracked, no route, misleading name (research finding 9).

### Edge Cases

- Taxonomy names go through `URLSearchParams`, so encoding is already handled by `buildModeUrl`; do not hand-encode.
- The page list derives from `PRODUCT_PAGE_MAX` (7) and inherits the `KNOWN_PRODUCT_TOTAL = 333` staleness — accepted under Catalog Behavior I option I, not a defect to fix here.

### Success Criteria

- Automated: `pnpm build`, `pnpm lint`, `pnpm exec tsc --noEmit`.
- Manual: `pnpm build && pnpm start`, then `curl -s localhost:3000/robots.txt` (has `Disallow: /api/` and the `Sitemap:` line, no `?mode=name` disallow) and `curl -s localhost:3000/sitemap.xml` (7 base URLs + one per live category and brand, no `<lastmod>`). Also confirm the build succeeds with `STRAPI_HOST` unset and emits base pages only.

---

## Phase 5 — Structured data (AC5)

### Changes Required

**`src/shared/utils/seo.utils.ts`** — Modify. Add pure builders:

```ts
export const buildCatalogJsonLd = (state: CatalogUrlState, products: Product[]): object
export const toJsonLdHtml = (payload: object): string
```

`buildCatalogJsonLd` returns `{ "@context": "https://schema.org", "@graph": [...] }` where the graph holds:

- `WebSite` — `name`, `url: SITE_URL`, and `potentialAction: SearchAction` with `target` `${SITE_URL}/?mode=name&q={search_term_string}` and `query-input: "required name=search_term_string"`. Emit on base mode only.
- `ItemList` — one entry per product on the current page: `position` (1-based within the page), `item` as a `Product` with `name` plus `brand: { "@type": "Brand", name }` and `category` when present. **Omit the whole `ItemList` when `products.length === 0`.**
  - Offers: when `hasOneProductVariant === true` → a single `Offer` with `price: minPrice`, `priceCurrency: "MXN"`; otherwise `AggregateOffer` with `lowPrice: minPrice`, `highPrice: maxPrice`, `priceCurrency: "MXN"`, `offerCount: variantCount`.
  - **Omit `offers` entirely when `minPrice` or `maxPrice` is null/undefined** — the three known zero-variant products in `docs/improvement.md` would otherwise emit `null` prices.
  - No `image`, no `url`, no `@id`, no `sku`, no `availability`, no `description`. None exist (Strapi Contract II, III, V).
- `BreadcrumbList` — category and brand modes only: `Catálogo` (`SITE_URL/`) → the value (self canonical). Cheap and truthful.

`toJsonLdHtml` = `JSON.stringify(payload).replace(/</g, "\\u003c")`. **This is the trust boundary** — product names and taxonomy values come from Strapi and land inside `<script>`. Do not skip it, do not hand-roll a partial `</script` replacement.

**`src/app/page.tsx`** — Modify. Inside the returned tree, before `<CatalogPageLayout>`:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: toJsonLdHtml(buildCatalogJsonLd(selection, products)) }}
/>
```

`selection` already carries `mode`, `value`, and `page`, so no second parse is needed here.

### Edge Cases

- JSON-LD lives in the page body, never in `generateMetadata` (it needs product data; see Phase 2).
- Empty page 1 renders the empty state and an `@graph` without `ItemList` — still valid JSON-LD.
- Do not claim rich-result eligibility anywhere; without an image and a product URL, `Product` markup will not produce product rich snippets. It ships as honest machine-readable catalog data.

### Success Criteria

- Automated: `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`.
- Manual: `curl -s 'localhost:3000/' | grep -o 'application/ld+json'`, paste the block into Google's Rich Results Test / Schema Markup Validator, confirm no errors; check a product with `variantCount: 0` emits no `offers`.

---

## Phase 6 — Tests and SSR verification (AC3 verification, all ACs)

Follow `docs/UNIT_TESTING_GUIDELINES.md`; it is canonical and not restated here. Tests must not require `STRAPI_HOST`, `STRAPI_API_TOKEN`, or `NEXT_PUBLIC_SITE_URL`.

### Changes Required

**`__tests__/catalog/pagination-urls.test.ts`** — Create. `parseCatalogParams` (valid modes, malformed page, out-of-range base page, missing mode value → `null`) and `buildCanonicalPath` / `buildBasePagePath` / `buildModeUrl` (page 1 base → `/`, `notice` never present, mode value encoding).

**`__tests__/seo/seo.utils.test.ts`** — Create. `buildCatalogMetadata` per row of the policy table: title, description, `alternates.canonical`, `robots.index`. Plus `buildCatalogJsonLd` (empty products → no `ItemList`; missing prices → no `offers`; single-variant → `Offer`; multi-variant → `AggregateOffer` with `MXN`; category mode → `BreadcrumbList`) and `toJsonLdHtml` escaping a product name containing `</script>`.

**`__tests__/seo/robots.test.ts`** — Create. Import the route module and assert `/api/` is disallowed, `?mode=name` is not, and the sitemap URL is absolute.

**`__tests__/seo/sitemap.test.ts`** — Create. `jest.mock("@/shared/lib/global.lib")` for `fetchCategories` / `fetchBrands`; assert 7 base URLs, one URL per taxonomy item, no `lastModified` key, no `mode=name` entry, and the degraded base-only result when a fetch rejects.

**`__tests__/home/Home.test.tsx`** — Modify. Assert page 2 renders as a link with `href="/?page=2"`, the current page is not a link and carries `aria-current="page"`, and no control renders `href="#"`.

### Manual SSR Verification (AC3 — required, not inferred)

Against a real production build (`pnpm build && pnpm start`):

| Check | Command |
|-------|---------|
| Product names in initial HTML | `curl -s 'localhost:3000/?page=2' \| grep -c '<h'` and eyeball a known product name |
| Crawlable page links | `curl -s localhost:3000/ \| grep -o 'href="/?page=[0-9]"' \| sort -u` |
| Canonical present, no `notice` | `curl -s 'localhost:3000/?page=2&notice=end' \| grep canonical` |
| Robots directive on name mode | `curl -s 'localhost:3000/?mode=name&q=broca' \| grep 'name="robots"'` |
| JSON-LD block | `curl -s localhost:3000/ \| grep 'ld+json'` |
| Routes respond | `curl -s -o /dev/null -w '%{http_code}' localhost:3000/robots.txt` and `/sitemap.xml` |

### Success Criteria

- Automated: `pnpm test`, then `pnpm lint` and `pnpm exec tsc --noEmit`.
- Manual: every row of the table above passes on a real build.

---

## Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
|-----------|----------------------|------------------------|
| `src/features/Pagination/utils.pagination.ts` | pure parse, canonical/href building, existing redirect behavior unchanged | `__tests__/catalog/pagination-urls.test.ts` + existing catalog tests |
| `src/shared/utils/seo.utils.ts` | policy table, JSON-LD shape, `</script>` escaping | `__tests__/seo/seo.utils.test.ts` |
| `src/app/robots.ts` / `sitemap.ts` | rules, sitemap URL set, no fabricated fields, degraded fetch | `__tests__/seo/robots.test.ts`, `__tests__/seo/sitemap.test.ts` + `curl` on a real build |
| `src/app/page.tsx` (`generateMetadata`) | delegates to the pure builder, never fetches | `pnpm build` + manual view-source per mode |
| `src/features/Home/Home.tsx` | anchors with real `href`, `aria-current`, disabled targets non-navigable, layout unchanged | `__tests__/home/Home.test.tsx` + manual browser check + `pnpm design:lint` |
| `src/app/layout.tsx` | approved copy, absolute `metadataBase`, no OG image | manual view-source |

## Cross-Cutting Concerns

- **New env var `NEXT_PUBLIC_SITE_URL`** — document in `REPO_CONTEXT.md` (Environment Variables), `AGENTS.md` (Environment), and `CLAUDE.md` (Quick Start). Optional, falls back to `http://localhost:3000`, never throws when unset. First `NEXT_PUBLIC_*` variable in the repo.
- **Server/client boundary** — metadata, robots, sitemap, and JSON-LD are server-only; `Home` stays a client component and only gains `next/link`.
- **Trust boundary** — Strapi strings inside `<script type="application/ld+json">` are escaped by `toJsonLdHtml`.
- **Apollo per-call clients** — nothing in `generateMetadata` may fetch.
- **Release** — PR targets `develop` with exactly one of `major` / `minor` / `patch`. Do not bump the version or edit `CHANGELOG.md`.

## Open Questions

None blocking. The only value still missing is the production domain for `NEXT_PUBLIC_SITE_URL`; the fallback lets implementation and CI proceed without it.

## Out Of Scope (Deliberate)

- `Organization` / `LocalBusiness` JSON-LD — no business data in the repo; tracked in `docs/improvement.md`.
- Open Graph / Twitter **images** — no asset exists (SEO VII). Textual OG/Twitter tags still ship.
- Any WhatsApp CTA — lands with the cart story (SEO VI), despite the meta description promising it.
- `h1` copy changes; `CatalogHero` untouched (SEO V).
- Search Console verification meta tag — DNS `TXT` verification needs no code (Verification I).
- `products_connection` adoption, `description` in the product queries, and the `Mostrando X-Y de 333` copy fix — all unblocked backend-wise, all deferred to their own story (Catalog Behavior I option I).
- `permanentRedirect` for invalid catalog URLs — would change existing tested behavior.
- Turning category/brand dropdown items into anchors — sitemap covers their discoverability.

## Post-Deploy Checklist (Outside This Repo)

Create the Google Search Console property, verify by DNS `TXT`, submit `/sitemap.xml`, then confirm pages 2-7 are indexed and `?mode=name` URLs are excluded as `noindex`.
