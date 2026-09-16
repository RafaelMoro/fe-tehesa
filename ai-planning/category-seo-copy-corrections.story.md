# Plan: SEO copy corrections (`/categorias/impacto-forja`, `/categorias`, `/`, `/cotizar`)

**Source research:** `ai-research/category-seo-copy-corrections.story.md` (2026-09-16, branch `fix/category-seo-copy-sync`).
**Sign-off status:** no explicit sign-off line; both open questions (Verification I, UI/product I) are `answered` by the user on 2026-09-16 and the scope widening to all four routes is recorded as the user's decision. Treated as signed off — same basis as `ai-planning/impacto-forja-category-page.story.md`. **Confirm before `/implement`.**
**Plan date:** 2026-09-16.

## Assumptions

- Copy is taken verbatim from the research doc's AC strings (the user's SEO table). No spelling/grammar review of those strings here — e.g. `Pagina` (unaccented) in the pagination suffix stays, per research.
- The hero kicker `Suministro industrial`, hero sub-copy, and `/cotizar` sub-copy `Revisa productos, medidas y cantidades.` are not in the table and stay untouched.
- Env: `.env.local` has `STRAPI_HOST`, `STRAPI_API_TOKEN` (needed for `/` and `/categorias/impacto-forja` to render products) and `NEXT_PUBLIC_WHATSAPP_NUMBER`. Dev-server checks assume `pnpm dev` on `http://localhost:3000`.
- Sequencing with `remaining-category-pages.story.md` is the user's call (research: land this first, or fold in — not both). This plan assumes it lands first, on its own PR to `develop` with label `patch`.

## Acceptance Criteria

1. `generateMetadata()` of `src/app/categorias/impacto-forja/page.tsx` returns description
   `Martillos y herramienta de hojalatería para industria y taller. Abasto en Puebla. Cotiza con Tehesa Industrial.`
   and the page's hero intro renders the same text (it is the same constant).
2. `generateMetadata()` of `src/app/categorias/page.tsx` returns title
   `Catálogo de Herramienta Industrial en Puebla | Tehesa` and description
   `Tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. 16 categorías con existencia en Puebla. Cotiza por WhatsApp.`
3. `/` renders `<title>Herramienta Industrial y Tornillería en Puebla | Tehesa</title>` (accented), the accented
   description, paginated titles `Herramienta Industrial y Tornillería en Puebla | Pagina N | Tehesa`, and
   `<h1>Distribuidor de herramienta industrial en Puebla</h1>`.
4. `/cotizar` returns title `Solicita tu Cotización | Tehesa Industrial Puebla`, description
   `Cotiza herramienta industrial, tornillería y corte. Respuesta rápida por WhatsApp o correo. Tehesa Industrial, Puebla.`
   and renders `<h1>Solicita tu cotización</h1>`.
5. No URL changes; the touched metadata tests assert the literal table strings (Verification I);
   `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` pass.

## Affected files

**`src/shared/**`**
- `src/shared/constants/seo.constants.ts` — Modify (8 string literals)

**`src/features/**`**
- `src/features/Home/CatalogHero.tsx` — Modify (H1 literal, line 25)
- `src/features/QuotePage/QuotePage.tsx` — Modify (H1 literal, line 29)

**Tests (`__tests__/**`)**
- `__tests__/seo/seo.utils.test.ts` — Modify (line 77 literal)
- `__tests__/seo/impacto-forja-metadata.test.ts` — Modify (description → literal)
- `__tests__/seo/categories-metadata.test.ts` — Modify (title + description → literals)
- `__tests__/seo/quote-metadata.test.ts` — Modify (title + description → literals)

No changes under `src/app/**`, `src/app/api/**`, `src/components/**`, `src/zustand/**`, docs, or config. Every metadata consumer (`layout.tsx`, `seo.utils.ts`, the three `generateMetadata` routes, `CATEGORY_PAGES["herramientas-impacto-forja"].intro`) already imports the constants — verified with `grep -rn "SITE_TITLE\|SITE_DESCRIPTION\|TITLE_BASE" src`.

---

## Phase 1 — Copy swap + literal test assertions

Single phase: eight constant edits, two JSX text edits, four test edits. All runtime-reachable.

### Changes Required

**`src/shared/constants/seo.constants.ts`** — Modify. Replace only the string values; keep every export name, order and formatting:

| Constant                    | New value                                                                                                                          |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_TITLE`                | `Herramienta Industrial y Tornillería en Puebla \| Tehesa`                                                                          |
| `SITE_DESCRIPTION`          | `Distribuidores directos de Bohrcraft, King Tony y Cleveland en Puebla. Tornillería, brocas y herramienta de corte. Cotiza por WhatsApp.` |
| `TITLE_BASE`                | `Herramienta Industrial y Tornillería en Puebla`                                                                                    |
| `QUOTE_TITLE`               | `Solicita tu Cotización \| Tehesa Industrial Puebla`                                                                                |
| `QUOTE_DESCRIPTION`         | `Cotiza herramienta industrial, tornillería y corte. Respuesta rápida por WhatsApp o correo. Tehesa Industrial, Puebla.`            |
| `CATEGORIES_TITLE`          | `Catálogo de Herramienta Industrial en Puebla \| Tehesa`                                                                            |
| `CATEGORIES_DESCRIPTION`    | `Tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. 16 categorías con existencia en Puebla. Cotiza por WhatsApp.` |
| `IMPACTO_FORJA_DESCRIPTION` | `Martillos y herramienta de hojalatería para industria y taller. Abasto en Puebla. Cotiza con Tehesa Industrial.`                   |

Edge case: `SITE_TITLE`/`SITE_DESCRIPTION` also feed `layout.tsx` OpenGraph/Twitter and `seo.utils.ts`' mode/page-1 fallbacks; `TITLE_BASE` feeds `${TITLE_BASE} | Pagina N | Tehesa`. No consumer change needed — the accent propagates by construction.

**`src/features/Home/CatalogHero.tsx`** — Modify, line 25: `<h1>` text `Piezas precisas para trabajo exigente.` → `Distribuidor de herramienta industrial en Puebla`. Same element, same classes. This is shared by every catalog mode (`/`, `?mode=category|brand|name`).

**`src/features/QuotePage/QuotePage.tsx`** — Modify, line 29 in `QuoteHeading`: `<h1>` text `Solicitar cotización` → `Solicita tu cotización`. Do **not** touch `Header.tsx:133` / `MobileMenu.tsx:188` (CTA label, out of scope per research) or `__tests__/shared/Header.test.tsx`.

**`__tests__/seo/seo.utils.test.ts`** — Modify, line 77: literal → `Herramienta Industrial y Tornillería en Puebla | Pagina 3 | Tehesa`. This is the one existing test that fails on the constant change.

**`__tests__/seo/impacto-forja-metadata.test.ts`** — Modify: `expect(metadata.description).toBe(IMPACTO_FORJA_DESCRIPTION)` → `.toBe("Martillos y herramienta de hojalatería para industria y taller. Abasto en Puebla. Cotiza con Tehesa Industrial.")`; drop the now-unused `IMPACTO_FORJA_DESCRIPTION` import (lint `no-unused-vars`). Keep `toBe(IMPACTO_FORJA_TITLE)` — the title is not touched by this story.

**`__tests__/seo/categories-metadata.test.ts`** — Modify: both `toBe(CATEGORIES_TITLE)` / `toBe(CATEGORIES_DESCRIPTION)` → the AC2 literals; remove the constants import entirely.

**`__tests__/seo/quote-metadata.test.ts`** — Modify: both `toBe(QUOTE_TITLE)` / `toBe(QUOTE_DESCRIPTION)` → the AC4 literals; remove the constants import entirely.

Rationale for literals (Verification I): `toBe(<constant>)` passed with the wrong copy, which is how this drift went unnoticed.

No H1 tests are added: research confirmed no test queries the home or quote H1, and AC5 only asks for the metadata tests to be literal.

### Success Criteria

**Automated**
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test -- __tests__/seo` (targeted, during iteration), then `pnpm test`
- `pnpm build` (production metadata is rendered at build time for the static routes)

**Dev-server validation** (`pnpm dev`, then for each route):

```sh
curl -s localhost:3000<path> | grep -o '<title>[^<]*\|name="description" content="[^"]*"\|<h1[^>]*>[^<]*'
```

| Route                          | Status | Must contain                                                                                                                                                                                                                   |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/categorias/impacto-forja`    | 200    | `name="description" content="Martillos y herramienta de hojalatería para industria y taller. Abasto en Puebla. Cotiza con Tehesa Industrial."` **and** the same sentence as visible hero intro text (`grep -c` ≥ 2 for `hojalatería`) |
| `/categorias`                  | 200    | `<title>Catálogo de Herramienta Industrial en Puebla \| Tehesa</title>`; description `Tornillería, brocas, herramienta de corte, abrasivos y equipo de seguridad. 16 categorías con existencia en Puebla. Cotiza por WhatsApp.` |
| `/`                            | 200    | `<title>Herramienta Industrial y Tornillería en Puebla \| Tehesa</title>`; description containing `Tornillería, brocas`; `<h1 ...>Distribuidor de herramienta industrial en Puebla`                                              |
| `/?page=2`                     | 200    | `<title>Herramienta Industrial y Tornillería en Puebla \| Pagina 2 \| Tehesa</title>`                                                                                                                                            |
| `/?mode=category&category=Brocas&page=1` | 200 | `<h1 ...>Distribuidor de herramienta industrial en Puebla` (shared `CatalogHero`)                                                                                                                                           |
| `/cotizar`                     | 200    | `<title>Solicita tu Cotización \| Tehesa Industrial Puebla</title>`; description `Cotiza herramienta industrial, tornillería y corte. Respuesta rápida por WhatsApp o correo. Tehesa Industrial, Puebla.`; `<h1 ...>Solicita tu cotización` |

Must **not** appear anywhere in the above responses: `Tornilleria` (unaccented), `Piezas precisas`, `Solicitar cotización` inside an `<h1>` (it may still appear in the header CTA — that is expected), `Martillos y Herramientas de Impacto y Forja | Tehesa Puebla.` as a description. No server-log errors or hydration warnings.

Note: `/cotizar`'s `QuoteHeading` is client-rendered; if the `<h1>` is not in the initial HTML because the cart is not yet hydrated, mark AC4's H1 half as verified by manual check instead (see below) and say so in the validation summary.

**Manual**
- Open `/cotizar` in a browser with an empty cart and with one item: heading reads `Solicita tu cotización` in both states.

### Verification Coverage

| Area/File                                     | Coverage/check areas                                                   | Verification reference                                              |
| --------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `src/shared/constants/seo.constants.ts`       | eight literals match the table; accent propagates to paginated titles  | `pnpm test -- __tests__/seo` + dev-server `curl` of the six routes  |
| `src/features/Home/CatalogHero.tsx`           | H1 text on every catalog mode                                          | dev-server `curl` of `/` and `/?mode=category&...`                  |
| `src/features/QuotePage/QuotePage.tsx`        | H1 text                                                                | dev-server `curl` of `/cotizar` (or manual, see note)               |
| `__tests__/seo/*-metadata.test.ts`            | literal title/description regression guard                             | `pnpm test -- __tests__/seo`                                        |
| `__tests__/seo/seo.utils.test.ts`             | accented paginated title                                               | `pnpm test -- __tests__/seo/seo.utils.test.ts`                      |

---

## AC Validation Summary

| AC | Phase(s) | Dev-server check that proves it | Status | Notes |
| --- | --- | --- | --- | --- |
| AC1 - impacto-forja description + hero intro | Phase 1 | `GET /categorias/impacto-forja` 200, `hojalatería` sentence in `name="description"` and in body (count ≥ 2) | Not validated | |
| AC2 - `/categorias` title + description | Phase 1 | `GET /categorias` 200, `<title>Catálogo de Herramienta Industrial en Puebla \| Tehesa</title>` + table description | Not validated | |
| AC3 - `/` accented title/description, paginated title, new H1 | Phase 1 | `GET /` 200 with accented `<title>`, description, `<h1>Distribuidor de herramienta industrial en Puebla`; `GET /?page=2` 200 with `\| Pagina 2 \| Tehesa` | Not validated | Also `pnpm test -- __tests__/seo/seo.utils.test.ts` for the page-3 literal |
| AC4 - `/cotizar` title/description/H1 | Phase 1 | `GET /cotizar` 200 with table `<title>`, description, `<h1>Solicita tu cotización` | Not validated | If H1 is absent from SSR HTML, mark `Cannot validate` for the H1 half and cover with the manual browser check |
| AC5 - no URL change, literal tests, all commands green | Phase 1 | `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, `pnpm test` all exit 0; `git diff --stat` touches only the 7 listed files (no `src/app/**`) | Not validated | |

## Cross-cutting concerns

- **Strapi env vars:** `/` and `/categorias/impacto-forja` need `STRAPI_HOST` / `STRAPI_API_TOKEN` to render product content; metadata is unaffected by fetch failures, but the impacto-forja hero intro (AC1 body check) is on the page shell and renders regardless.
- **Stale `16 categorías`:** hardcoded in `CATEGORIES_DESCRIPTION` while the page renders a live counter. Accepted by research; not a code concern.
- **Shared hero:** the home H1 swap is visible on all four catalog modes — a UX copy change, not metadata only.

## Open Questions / Out-of-scope items

- None unresolved.
- Out of scope (deliberately excluded): header/mobile-menu CTA label `Solicitar cotización` (`Header.tsx:133`, `MobileMenu.tsx:188`) and its `Header.test.tsx` assertions; `/marcas`, `/marcas/bohrcraft`, `/contacto` (routes do not exist); `Pagina` accent in the pagination suffix; hero kicker/sub-copy; `ai-skills/REPO_CONTEXT.md` (no row quotes the copy).
