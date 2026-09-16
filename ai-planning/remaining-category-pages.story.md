# Plan: Remaining category pages via `/categorias/[slug]`

**Source research:** `ai-research/remaining-category-pages.story.md` (2026-09-16).
**Sign-off status:** every open question is `answered` (user, 2026-09-16); D1–D6 decided. Treated as signed off. **Confirm before `/implement`.**
**Plan date:** 2026-09-16. **Branch:** `feat/category-slug-route`. **PR:** one PR to `develop`, label `minor`.

## Assumptions

- `category-seo-copy-corrections` already landed (PR #51 is in `develop`; `seo.constants.ts` carries the corrected strings). This PR does not re-apply it.
- **SEO copy source of truth** is Anexo A of `faber-customer-projects/Tehesa/estrategia-y-diagnostico/estrategia-web-paquete-base-fase1-tehesa.md` (lines 390–426) and its handoff `Tehesa/fase-1-tehesa/fase-2-tehesa/handoff-seo-categorias-restantes.fase2-tehesa.md` (v0.2.0, 2026-09-16). Both docs are outside this repo and gitignored there, so the strings are copied verbatim into Phase 2 below. Titles/descriptions of the 5 live pages and every locked field (slug, H1, URL) were cross-checked against Anexo A — no drift.
- **D1 revised (marketing 2026-09-16, confirmed by the user 2026-09-16):** hero `intro` is no longer `= description`. Anexo A ships a distinct 1–2 sentence intro per category (no CTA, no "en Puebla"), including new intros for the 5 live pages. `CategoryPageConfig.intro` already exists, so this is strings-only in `category.constants.ts` — no `src/features/CategoryPage` change. Folded into Phase 2.
- Slugs for rows 6–16 equal their Strapi `customId` (live-verified in research). Legacy slugs `tornilleria-fijacion` and `impacto-forja` stay as they are.
- Root layout is `force-dynamic`; no `generateStaticParams`.
- Env for dev-server checks: `STRAPI_HOST`, `STRAPI_API_TOKEN`, `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local`; `pnpm dev` on `http://localhost:3000`.

## Acceptance Criteria

1. **All 16 URLs resolve.** Every URL in the research table is server-rendered by `src/app/categorias/[slug]/page.tsx`, fetches its full set via `fetchAllProductsByCategory(customId)` and renders `CategoryPage` with the matching `CATEGORY_PAGES` config. The five existing URLs keep byte-identical `generateMetadata` output (title, description, `alternates.canonical`, `robots: { index: true, follow: true }`) and 3-item `BreadcrumbList` JSON-LD. Any other `/categorias/<x>` returns 404 via `notFound()`, rendered by a new app-level `src/app/not-found.tsx`.
2. **11 new pages carry the table copy.** For rows 6–16 the `<title>`, meta description, canonical, H1, hero intro (= description) and breadcrumb leaf (= Strapi name) match the table / conventions. Product counts render live; empty or single-product sets still show the full hero/breadcrumb/WhatsApp panel.
   *Plan amendment (D1 revised, see Assumptions):* hero intro = Anexo A intro, not the description — for all 16 pages.
3. **Entry points light up from config.** `CATEGORY_PAGE_HREFS` has 16 entries. Header `Categorías` dropdown and mobile accordion rows become links for all 16; `/categorias` cards all get a real `Ver categoría` link; `/sitemap.xml` lists all 16 static category URLs; header active state (`pageCategoryId`) works on every one.
4. **Static folders are gone.** The five `src/app/categorias/<slug>/` folders are deleted; one `[slug]/{page,error,loading}.tsx` replaces them. `error.tsx` still shows `No pudimos cargar los productos de <Strapi name>` for the failing category.
5. **Verification.** `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass. The five per-route metadata/error tests are replaced by table-driven tests over all 16 slugs; `sitemap.test.ts` and `CategoriesPage.test.tsx` assert from the map's size.

## Affected files

**`src/app/**`**
- `src/app/categorias/[slug]/page.tsx` — Create
- `src/app/categorias/[slug]/error.tsx` — Create
- `src/app/categorias/[slug]/loading.tsx` — Create
- `src/app/not-found.tsx` — Create
- `src/app/categorias/{tornilleria-fijacion,abrasivos,impacto-forja,herramientas-corte-conformado,perforacion-accesorios-taladro}/{page,error,loading}.tsx` — Delete (15 files)

**`src/shared/**`**
- `src/shared/constants/category.constants.ts` — Modify
- `src/shared/constants/seo.constants.ts` — Modify

**Tests (`__tests__/**`)**
- `__tests__/seo/category-slug-metadata.test.ts` — Create
- `__tests__/app/category-slug-error.test.tsx` — Create
- `__tests__/app/not-found.test.tsx` — Create
- `__tests__/seo/{tornilleria,abrasivos,impacto-forja,corte-conformado,perforacion-accesorios-taladro}-metadata.test.ts` — Delete
- `__tests__/app/{tornilleria,abrasivos,impacto-forja,corte-conformado,perforacion-accesorios-taladro}-error.test.tsx` — Delete
- `__tests__/seo/sitemap.test.ts` — Modify
- `__tests__/categories/CategoriesPage.test.tsx` — Modify
- `__tests__/category-page/CategoryPage.test.tsx` — Modify (one import)

**Docs**
- `ai-skills/REPO_CONTEXT.md` — Modify (route tables, sitemap/gotcha sentences)

No changes under `src/features/**`, `src/components/**`, `src/zustand/**`, `src/app/api/**`, `src/app/sitemap.ts`, `src/shared/ui/organisms/Header.tsx`.

---

## Phase 1 — Migrate the 5 existing categories to `[slug]` + app-level 404

Valid stopping point / separate commit. Output for the five existing URLs is byte-identical.

### Changes Required

**`src/shared/constants/seo.constants.ts`** — Modify. Replace the ten `TORNILLERIA_*` … `PERFORACION_*` exports (lines 16–35) with one map keyed by Strapi `customId`; the strings move verbatim:

```ts
export type CategorySeo = { title: string; description: string }

export const CATEGORY_SEO: Record<string, CategorySeo> = {
  tornilleria: { title: "Tornillería y Fijación Industrial en Puebla | Tehesa", description: "Tornillos, tuercas, ..." },
  abrasivos: { ... },
  "herramientas-impacto-forja": { ... },
  "herramientas-corte-conformado": { ... },
  "perforacion-accesorios-taladro": { ... },
}
```

Rationale: the route needs `id → { title, description }` in one lookup; 32 named exports would need a second map anyway. `seo.constants.ts` still imports nothing from `category.constants.ts` (keys are string literals, no cycle).

**`src/shared/constants/category.constants.ts`** — Modify.
- Drop the five `*_CATEGORY_ID` exports; key `CATEGORY_PAGE_HREFS` and `CATEGORY_PAGES` by string literal (`tornilleria`, `abrasivos`, `"herramientas-impacto-forja"`, …). Their only importers are the deleted routes/tests plus `CategoryPage.test.tsx` (one-line edit below).
- Import `CATEGORY_SEO` instead of the four `*_DESCRIPTION` constants; `intro: CATEGORY_SEO.abrasivos.description` etc. Tornillería keeps its literal `intro` (it differs from its description).
- Add, near `CATEGORY_PAGE_HREFS`:

```ts
export const getCategoryIdBySlug = (slug: string): string | undefined =>
  Object.keys(CATEGORY_PAGE_HREFS).find(
    (id) => CATEGORY_PAGE_HREFS[id] === `/categorias/${slug}`,
  )
```

  D5 as assumed: inverts the href map, so legacy slugs need no second map. `Header.tsx:105` does the same inline find against `pathname`; leave it (out of scope).

**`src/app/categorias/[slug]/page.tsx`** — Create (Next 15: `params` is a `Promise`).

```ts
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const id = getCategoryIdBySlug(slug)
  if (!id) notFound()
  const { title, description } = CATEGORY_SEO[id]
  return { title, description, alternates: { canonical: `/categorias/${slug}` }, robots: { index: true, follow: true } }
}

export default async function CategoryRoute({ params }: Props) {
  const { slug } = await params
  const id = getCategoryIdBySlug(slug)
  if (!id) notFound()
  const products = await fetchAllProductsByCategory(id)
  const breadcrumbJsonLd = { ...same 3-item BreadcrumbList as today, leaf name: CATEGORY_PAGES[id].name, item: `${SITE_URL}${CATEGORY_PAGE_HREFS[id]}` }
  return (<> <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLdHtml(breadcrumbJsonLd) }} /> <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 md:p-5"><CategoryPage products={products} config={CATEGORY_PAGES[id]} /></main> </>)
}
```

Edge cases: `notFound()` from `next/navigation` returns `never`, so TypeScript narrows `id` after the guard. The canonical uses the URL slug, not `CATEGORY_PAGE_HREFS[id]` — identical value, one fewer lookup. `fetchAllProductsByCategory` keeps its throw-at-the-boundary contract so `error.tsx` catches Strapi failures.

**`src/app/categorias/[slug]/error.tsx`** — Create, `"use client"`. Error boundaries receive no `params`:

```ts
const { slug } = useParams<{ slug: string }>()
const id = getCategoryIdBySlug(slug)
return <CategoryPageError categoryName={id ? CATEGORY_PAGES[id].name : "esta categoría"} reset={reset} />
```

Fallback is defensive only — unknown slugs `notFound()` in `page.tsx` before any fetch.

**`src/app/categorias/[slug]/loading.tsx`** — Create: `export { CategoryPageSkeleton as default } from "@/features/CategoryPage/CategoryPageSkeleton"`.

**`src/app/not-found.tsx`** — Create (D6). Server component, no data fetching, no category-config import so it stays valid for any URL. Same `<main>` container as the category routes; `<h1>Página no encontrada</h1>`, one line (`La página que buscas no existe o fue movida.`), one `next/link` to `/categorias` with text `Ver todas las categorías`. Plain markup + `Link` — no HeroUI `Button` needed.

**Delete** the five static folders (15 files).

**Tests**

- Delete the five `__tests__/seo/*-metadata.test.ts` and five `__tests__/app/*-error.test.tsx` per-route files.
- `__tests__/seo/category-slug-metadata.test.ts` — Create, `@jest-environment node`. `jest.mock("next/navigation", () => ({ notFound: jest.fn(() => { throw new Error("NEXT_NOT_FOUND") }) }))`. `it.each` over a `[slug, title, description]` table with **literal strings** (5 rows now, 16 after Phase 2 — a wrong paste fails): `await generateMetadata({ params: Promise.resolve({ slug }) })` → `title`, `description`, `alternates` `{ canonical: \`/categorias/${slug}\` }`, `robots` `{ index: true, follow: true }`. One extra `it`: slug `nope` rejects and `notFound` was called.
- `__tests__/app/category-slug-error.test.tsx` — Create, jsdom. `jest.mock("next/navigation", () => ({ useParams: () => ({ slug: mockSlug }) }))` with a `let mockSlug` toggled per test. `it.each` over `[slug, strapiName]` (5 rows now, 16 after Phase 2): heading `No pudimos cargar los productos de <name>`; one row clicks `Intentar de nuevo` and asserts `reset` called once. One extra `it`: slug `nope` → heading `... de esta categoría`.
- `__tests__/app/not-found.test.tsx` — Create, jsdom: renders heading `Página no encontrada` and a link `Ver todas las categorías` with `href="/categorias"`.
- `__tests__/seo/sitemap.test.ts` — Modify lines ~50–65 and ~98–113: replace the five `endsWith` assertions in both `it`s with `for (const href of Object.values(CATEGORY_PAGE_HREFS)) expect(result.some((e) => e.url.endsWith(href))).toBe(true)`. Length math already uses the map size.
- `__tests__/categories/CategoriesPage.test.tsx` — Modify: `linkCtas` length → `Object.keys(CATEGORY_PAGE_HREFS).length`; `disabledCtas` → `categories.length - Object.keys(CATEGORY_PAGE_HREFS).length`. Replace the `Sujeción` fixture entry (it becomes a real page in Phase 2) with a fake `{ name: "Sin página", customId: "sin-pagina", productCount: null }` so the disabled branch stays covered. Expected `hrefs` list stays as-is (5 entries) — `arrayContaining` tolerates Phase 2's growth.
- `__tests__/category-page/CategoryPage.test.tsx:5,9` — Modify: `CATEGORY_PAGES["tornilleria"]` instead of the deleted `TORNILLERIA_CATEGORY_ID`.

### Success Criteria

**Automated:** `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build`.

**Dev-server validation (`pnpm dev`):**

| Check | Expect |
| --- | --- |
| `for s in tornilleria-fijacion abrasivos impacto-forja herramientas-corte-conformado perforacion-accesorios-taladro; do curl -s -o /dev/null -w "$s %{http_code}\n" localhost:3000/categorias/$s; done` | all `200` |
| `curl -s localhost:3000/categorias/tornilleria-fijacion \| grep -o '<title>[^<]*\|name="description" content="[^"]*"\|rel="canonical" href="[^"]*"\|<h1[^>]*>[^<]*'` | title `Tornillería y Fijación Industrial en Puebla \| Tehesa`, description = `CATEGORY_SEO.tornilleria.description`, canonical `…/categorias/tornilleria-fijacion`, `<h1>` `Tornillería y fijación industrial` |
| same grep for `perforacion-accesorios-taladro` | title `Brocas Industriales y Perforación en Puebla \| Tehesa`, H1 `Perforación y accesorios de taladro` |
| `curl -s localhost:3000/categorias/abrasivos \| grep -o '"BreadcrumbList"\|"name":"Abrasivos"' ` | both present (3-item JSON-LD, leaf = Strapi name) |
| `curl -s localhost:3000/categorias/abrasivos \| grep -o '0 productos\|Solicitar cotización'` | both present (empty set still renders hero/WhatsApp) |
| `curl -s -o /dev/null -w '%{http_code}' localhost:3000/categorias/nope` | `404` |
| `curl -s localhost:3000/categorias/nope \| grep -o 'Página no encontrada\|href="/categorias"'` | both present |
| `curl -s -o /dev/null -w '%{http_code}' localhost:3000/no-existe` | `404`, same body markers (app-level, not route-level) |
| `curl -s localhost:3000/sitemap.xml \| grep -c '/categorias/'` | `6` static entries + the `?mode=category` ones (≥ 7 before `mode=` lines; exact: 1 index + 5) |
| server log | no errors, no `CAT_ERR_*`, no hydration warnings on any of the above |

**Manual:** none — every check above is HTTP-reachable. Header dropdown/active state is unchanged code and already covered by `Header.test.tsx`.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `src/app/categorias/[slug]/page.tsx` | slug→id lookup, metadata parity for 5 slugs, `notFound` on unknown | `category-slug-metadata.test.ts` + dev-server curls |
| `src/app/categorias/[slug]/error.tsx` | Strapi name in heading, fallback copy, reset | `category-slug-error.test.tsx` |
| `src/app/not-found.tsx` | heading + link | `not-found.test.tsx` + `curl /categorias/nope`, `/no-existe` |
| `src/shared/constants/{category,seo}.constants.ts` | map keys match, no cycle, `getCategoryIdBySlug` | `pnpm exec tsc --noEmit` + the two table tests |
| `src/app/sitemap.ts` (unchanged) | 5 static hrefs from the map | `sitemap.test.ts` + `curl /sitemap.xml` |

---

## Phase 2 — Add the 11 config entries

Config + test rows + docs only. No new files under `src/app`. All strings below are verbatim from Anexo A (`estrategia-web-paquete-base-fase1-tehesa.md:398-413`); the `|` in titles is a literal pipe. No `<`, `>` or straight double quotes appear in any of them.

### Changes Required

**`src/shared/constants/seo.constants.ts`** — Modify: 11 `CATEGORY_SEO` entries.

| `customId` | title | description |
| --- | --- | --- |
| `llaves-herramientas-apriete` | `Llaves, Dados y Herramientas de Apriete \| Tehesa Industrial` | `Dados, llaves, puntas y bristol King Tony para industria y taller. Existencia en Puebla. Solicita cotización con Tehesa Industrial.` |
| `roscado-herramientas-roscas` | `Machuelos, Terrajas y Herramientas de Roscado \| Tehesa Puebla` | `Machuelos, terrajas y juegos de roscado Bohrcraft para industria y taller. Distribuidor directo en Puebla. Cotiza por WhatsApp.` |
| `carburo` | `Limas Diamantadas y Herramientas de Carburo \| Tehesa Puebla` | `Limas diamantadas, puntas de diamante, limas rotativas y cortadores de carburo. Precisión industrial en Puebla. Cotiza hoy.` |
| `sujecion` | `Clamps y Herramientas de Sujeción Industrial \| Tehesa Puebla` | `Clamps verticales, horizontales y de jalar para sujeción industrial. Existencia en Puebla. Cotiza con Tehesa Industrial.` |
| `calibrador` | `Calibradores Industriales en Puebla \| Tehesa Industrial` | `Calibradores y cuenta hilos para medición industrial de precisión. Existencia en Puebla. Solicita tu cotización.` |
| `extraccion-reparacion-fijaciones` | `Extractores de Tornillos y Reparación de Fijaciones \| Tehesa` | `Extractores de tornillos y manerales para reparación de fijaciones. Distribuidor industrial en Puebla. Solicita tu cotización.` |
| `adhesivos-selladores` | `Adhesivos y Selladores Industriales en Puebla \| Tehesa` | `Adhesivos y selladores para fijación y sellado industrial. Abasto en Puebla. Cotiza con Tehesa Industrial.` |
| `equipo-seguridad` | `Equipo de Seguridad Industrial en Puebla \| Tehesa Industrial` | `Lentes y equipo de seguridad para entornos industriales. Existencia en Puebla. Cotiza con Tehesa Industrial.` |
| `herramientas-diagnostico-electricidad` | `Probadores y Herramientas de Diagnóstico Eléctrico \| Tehesa Puebla` | `Probadores eléctricos y herramienta de diagnóstico para electricidad y electrónica industrial. Puebla. Solicita tu cotización.` |
| `herrajes-accesorios-cable` | `Herrajes y Accesorios para Cable en Puebla \| Tehesa Industrial` | `Herrajes y accesorios para cable de acero en aplicaciones industriales. Existencia en Puebla. Cotiza hoy.` |
| `lubricantes-multifuncionales` | `Lubricantes Multifuncionales Industriales \| Tehesa Puebla` | `Lubricantes multifuncionales para mantenimiento industrial y taller. Abasto en Puebla. Cotiza con Tehesa Industrial.` |

The 5 existing entries are unchanged (Anexo A matches the code byte-for-byte).

**`src/shared/constants/category.constants.ts`** — Modify: 11 `CATEGORY_PAGE_HREFS` entries (`[customId]: "/categorias/<customId>"` — slug = `customId` for every new row) and 11 `CATEGORY_PAGES` entries. `intro` is a literal string (D1 revised), so `category.constants.ts` no longer needs to import `CATEGORY_SEO` at all — drop the import from Phase 1.

| `customId` | `name` (Strapi, D3) | `heading` (H1) | `searchPlaceholder` (D2) | `intro` (Anexo A) |
| --- | --- | --- | --- | --- |
| `llaves-herramientas-apriete` | Llaves y herramientas de apriete | Llaves y herramientas de apriete | Buscar dados, llaves, puntas... | `Dados, matracas, llaves combinadas, puntas y llaves bristol King Tony. Lo que necesita un taller o una línea de mantenimiento para apretar con el torque correcto sin barrer la tuerca.` |
| `roscado-herramientas-roscas` | Roscado y herramientas para roscas | Roscado y herramientas para roscas | Buscar machuelos, terrajas, juegos... | `Machuelos, terrajas y juegos completos de roscado Bohrcraft, en métrico y estándar. Para hacer rosca nueva o rescatar una dañada con herramienta que no se despunta a la tercera pieza.` |
| `carburo` | Carburo | Carburo y diamantados | Buscar limas, puntas de diamante, cortadores... | `Limas diamantadas, puntas de diamante, limas rotativas y cortadores de carburo para trabajar acero endurecido, fundición y materiales que una lima común no toca.` |
| `sujecion` | Sujeción | Sujeción industrial | Buscar clamps verticales, horizontales... | `Clamps verticales, horizontales y de jalar para fijar piezas en soldadura, ensamble y maquinado. Sujeción rápida y repetible, sin improvisar con prensas.` |
| `calibrador` | Calibrador | Calibradores | Buscar calibradores, cuenta hilos... | `Calibradores y cuenta hilos para medir con precisión antes de cortar, roscar o rechazar una pieza. Herramienta de medición para control de calidad en piso y taller.` |
| `extraccion-reparacion-fijaciones` | Extracción y Reparación de fijaciones | Extracción y reparación de fijaciones | Buscar extractores, manerales... | `Extractores de tornillos y manerales para sacar fijaciones barridas, rotas o corroídas sin dañar la pieza. Lo que resuelve el problema que detiene el mantenimiento.` |
| `adhesivos-selladores` | Adhesivos y selladores | Adhesivos y selladores | Buscar adhesivos, selladores... | `Adhesivos y selladores industriales para fijar roscas, sellar juntas y pegar donde un tornillo no cabe. Complemento directo de nuestra tornillería.` |
| `equipo-seguridad` | Equipo de seguridad | Equipo de seguridad industrial | Buscar lentes, equipo de seguridad... | `Lentes y equipo de protección personal para taller y planta. Protección básica que cumple la norma y se compra en el mismo lugar que la herramienta.` |
| `herramientas-diagnostico-electricidad` | Herramientas de diagnóstico de electricidad y electrónica | Diagnóstico de electricidad y electrónica | Buscar probadores, herramienta de diagnóstico... | `Probadores y herramienta de diagnóstico para revisar circuitos, continuidad y voltaje en instalaciones eléctricas y equipo electrónico industrial.` |
| `herrajes-accesorios-cable` | Herrajes y accesorios para cable | Herrajes y accesorios para cable | Buscar herrajes, accesorios para cable... | `Herrajes y accesorios para cable de acero: sujeción, tensión y terminación en izaje, anclaje y aplicaciones industriales.` |
| `lubricantes-multifuncionales` | Lubricantes multifuncionales | Lubricantes multifuncionales | Buscar lubricantes... | `Lubricantes multifuncionales para aflojar, proteger contra corrosión y lubricar piezas en mantenimiento industrial y de taller.` |

Note the capital `R` in `Extracción y Reparación de fijaciones` (`name`) vs lowercase in `heading` — intentional (D3, research UI/product II).

**Also replace the `intro` of the 5 live entries** (D1 revised; Anexo A "Intro del hero"):

| `customId` | `intro` |
| --- | --- |
| `tornilleria` | `Tornillos, tuercas, rondanas, pernos y varilla roscada en acero e inoxidable, por pieza o por caja. La base de cualquier ensamble o mantenimiento, con las medidas que la industria pide.` |
| `abrasivos` | `Discos de corte, discos de desbaste y puntas montadas para esmeril y rectificado. Abrasivos que cortan parejo y duran en trabajo pesado.` |
| `herramientas-impacto-forja` | `Martillos, marros y herramienta de hojalatería para golpear, formar y enderezar. Herramienta de impacto para taller y planta.` |
| `herramientas-corte-conformado` | `Machuelos, buriles y cortadores para torno, fresa y maquinado. Herramienta de corte que aguanta turnos completos sin perder filo.` |
| `perforacion-accesorios-taladro` | `Brocas Bohrcraft, juegos y accesorios para taladro en metal, concreto y madera. Precisión alemana para perforar sin quemar la broca ni la pieza.` |

**Tests**
- `__tests__/seo/category-slug-metadata.test.ts` — add 11 `[slug, title, description]` rows with the literal strings from the table.
- `__tests__/category-page/CategoryPage.test.tsx` — no edit; `intro` rendering is already covered through the Tornillería config, and per-page intros are proven by the dev-server grep below.
- `__tests__/app/category-slug-error.test.tsx` — add 11 `[slug, strapiName]` rows.
- `__tests__/categories/CategoriesPage.test.tsx` — fixture gains the 11 real categories (name + customId from the table, any counts incl. `1` and `null`); the fake `sin-pagina` entry stays. No assertion edits — they read the map's size since Phase 1.
- `sitemap.test.ts` — no edit (iterates the map).

**Docs — `ai-skills/REPO_CONTEXT.md`** — Modify:
- Routes table (lines ~67–71): collapse the five static rows into one `categorias/[slug]/page.tsx` row (dynamic route, `getCategoryIdBySlug` → `CATEGORY_PAGES`/`CATEGORY_SEO`, `notFound()` for unknown slugs, own `error.tsx` reading `useParams`). Add a `not-found.tsx` row.
- Line ~77 and ~235 (sitemap): "one static entry per `CATEGORY_PAGE_HREFS` value (16 today)" instead of the enumerated five.
- Line ~102 (`CategoryPage/`): "rendered by `/categorias/[slug]`".
- Line ~114 (Header): "(Tornillería and Abrasivos today)" → "(all 16 today)".
- Line ~328 gotcha: replace the "add the same pair for any future `<slug>` route" sentence with "new categories are a `CATEGORY_PAGE_HREFS` + `CATEGORY_PAGES` + `CATEGORY_SEO` entry, no route files".
- Key files table (lines ~353–357): one `[slug]` row + `not-found.tsx`.
- Line ~370 (`seo.constants.ts`): mention `CATEGORY_SEO` replaces the per-category `*_TITLE`/`*_DESCRIPTION` exports.

### Success Criteria

**Automated:** `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test`, `pnpm build`.

**Dev-server validation (`pnpm dev`):**

| Check | Expect |
| --- | --- |
| loop over all 16 slugs: `curl -s -o /dev/null -w "$s %{http_code}\n" localhost:3000/categorias/$s` | 16 × `200` |
| loop over the 11 new slugs: `curl -s localhost:3000/categorias/$s \| grep -o '<title>[^<]*\|name="description" content="[^"]*"\|rel="canonical" href="[^"]*"\|<h1[^>]*>[^<]*'` | title/description = Anexo A table, canonical `…/categorias/<slug>`, `<h1>` = table H1 |
| `curl -s localhost:3000/categorias/carburo \| grep -c 'que una lima común no toca'` and `curl -s localhost:3000/categorias/tornilleria-fijacion \| grep -c 'por pieza o por caja'` | `1` each — hero intro is the Anexo A intro, not the meta description (D1 revised), on a new and a live page |
| `curl -s localhost:3000/categorias/carburo \| grep -o '"name":"Carburo"\|aria-current="page">[^<]*'` | JSON-LD leaf and breadcrumb leaf = `Carburo` (Strapi name, not the H1) |
| `curl -s localhost:3000/categorias/llaves-herramientas-apriete \| grep -o '[0-9]* productos'` | `33 productos` (live count) |
| `curl -s localhost:3000/categorias/lubricantes-multifuncionales \| grep -o '1 producto\b\|Solicitar cotización'` | singular `1 producto` + WhatsApp panel present |
| `curl -s localhost:3000/categorias/extraccion-reparacion-fijaciones \| grep -o 'Filtrar subcategorías'` | absent (no `subcategory` outside Tornillería) |
| `curl -s localhost:3000/categorias \| grep -o 'href="/categorias/[^"]*"' \| sort -u \| wc -l` | `16` (every card CTA is a link) |
| `curl -s localhost:3000/sitemap.xml \| grep -o '<loc>[^<]*/categorias/[^<?]*</loc>' \| wc -l` | `16` |
| `curl -s localhost:3000/categorias/sujecion \| grep -c 'Sujeción (actual)'` | `≥ 1` (header active state from `pageCategoryId`) |
| `curl -s -o /dev/null -w '%{http_code}' localhost:3000/categorias/nope` | still `404` |
| server log | no errors, no `CAT_ERR_*`, no hydration warnings |

**Manual:** open the header `Categorías` dropdown and the mobile accordion on one new page — all 16 rows are links (the dropdown is client-rendered by HeroUI; `curl` only sees the SSR shell). Everything else is covered above.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `seo.constants.ts` `CATEGORY_SEO` | 11 literal titles/descriptions | `category-slug-metadata.test.ts` rows + title/description curls |
| `category.constants.ts` | 11 hrefs, names, headings, placeholders, `intro` = description | `category-slug-error.test.tsx` rows + H1/breadcrumb curls |
| `CategoriesPage`, `Header`, `sitemap.ts` (unchanged) | 16 links / 16 sitemap entries / active state | `CategoriesPage.test.tsx`, `sitemap.test.ts`, curls of `/categorias`, `/sitemap.xml`, `/categorias/sujecion` |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 — all 16 URLs resolve, 5 legacy byte-identical, unknown → 404 | 1, 2 | Phase 1: 5 × `200` + title/description/canonical/H1 grep parity + `BreadcrumbList` grep; `/categorias/nope` and `/no-existe` render `Página no encontrada`. | Validated (with a known gap) | Known Next.js 15.5.x limitation, confirmed with an isolated repro route and reproduced identically after upgrading to next@15.5.25 (reverted, no fix): `notFound()` called inside a dynamic `[slug]` segment page, under a root layout that is `force-dynamic` (required by `Header`'s `useSearchParams`) and with no `generateStaticParams`, renders the `not-found.tsx` body correctly but the HTTP response stays `200`, not `404`. `/no-existe` (no matching route segment at all) correctly returns `404` — same code path is unaffected. User decided (2026-09-16) to accept the UI-level 404 and ship as-is; tracked in `docs/improvement.md`, revisit on a future Next major/minor upgrade. |
| AC2 — 11 new pages carry table copy, live counts, empty/single sets render | 2 | per-slug title/description/canonical/H1 grep; intro grep on `carburo` + `tornilleria-fijacion`; `/categorias/carburo` leaf `Carburo`; `33 productos`; `1 producto` + WhatsApp on `lubricantes-multifuncionales` | Not validated | strings from Anexo A; intro ≠ description per D1 revised |
| AC3 — entry points light up (16 hrefs, cards, sitemap, active state) | 2 | `/categorias` → 16 unique `href="/categorias/…"`; `/sitemap.xml` → 16 static `<loc>`; `/categorias/sujecion` → `Sujeción (actual)` | Not validated | header dropdown/accordion rows are client-rendered → manual click check |
| AC4 — static folders gone, `[slug]` error copy per category | 1 | `ls src/app/categorias` shows only `[slug]`, `page.tsx`, `error.tsx`, `loading.tsx`; error copy | Cannot validate | error boundary needs a Strapi failure; proven by `category-slug-error.test.tsx` (16 rows after Phase 2) |
| AC5 — lint/tsc/build/test pass, table-driven tests, map-size counts | 1, 2 | n/a (automated commands) | Not validated | `pnpm lint && pnpm exec tsc --noEmit && pnpm test && pnpm build` |

## Cross-cutting concerns

- **Next 15 `params` is a Promise** in both `generateMetadata` and the page; `error.tsx` must use `useParams()` (client) since boundaries get no `params`.
- **Server/client boundary:** `page.tsx` and `not-found.tsx` are server components; `error.tsx` is `"use client"`. `category.constants.ts` is imported from both sides today already; `getCategoryIdBySlug` is pure and stays safe on both.
- **Strapi env:** dev-server checks need `STRAPI_HOST`/`STRAPI_API_TOKEN`; without them every category route hits `error.tsx` instead of rendering products.
- **Tornillería** is the only 2-page fetch (107 → 100 + 7) and the only category with `subcategory` values — unchanged behaviour, just re-routed.

## Open Questions / Out-of-scope

**Open**
- None. D1 revised confirmed by the user (2026-09-16): hero intro = Anexo A intro for all 16 pages.

**Follow-up stories (not this story; Paquete Base, after the category work — user 2026-09-16)** — source is
`/home/rafael/projects/faber/core-skills-faber/faber-customer-projects/Tehesa/estrategia-y-diagnostico/estrategia-web-paquete-base-fase1-tehesa.md`:
- **Manual category ordering** — §3, lines 84–101: a demand-based order over all 16 categories (Tornillería → Corte → Roscado → Perforación → Llaves → Abrasivos → Carburo → Sujeción → Extracción → Impacto → Adhesivos → Calibradores → Diagnóstico → Seguridad → Herrajes → Lubricantes) for the header dropdown/mobile accordion and the `/categorias` grid, replacing today's A→Z sort. Frontend-only — Strapi has no order field — so it is one ordered `customId` list in `category.constants.ts` applied wherever `fetchCategories()` results are sorted. Line 106: order gets revisited once Search Console has data.
- **`/marcas/bohrcraft`** brand page — §4 line 121 (pulled into Paquete Base); SEO row in Anexo A line 415 (row label still says `Fase 2`, stale).

**Out of scope (deliberately excluded)**
- Refactoring `Header.tsx:105`'s inline href-inversion to use `getCategoryIdBySlug` — works as-is; nearby-cleanup only.
- Making `CategoryPageConfig.intro` optional with a fallback to the description — would touch `src/features/CategoryPage` (excluded by the story).
- `generateStaticParams` — root layout is `force-dynamic`.
- The `/categorias` index description's hardcoded `16 categorías` — now correct anyway; owned by the copy-corrections story.
- Any Strapi rename for the six rows where `name` ≠ H1 (D3 keeps both).
