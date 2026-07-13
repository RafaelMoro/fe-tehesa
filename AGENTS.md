# AGENTS.md

Compact guidance for OpenCode sessions working in this repo.

## Commands

- Package manager is **pnpm** (lockfile + `.npmrc` hoist rule for `@heroui/*`). Do not use npm/yarn.
- `pnpm dev` — dev server (Next.js + **Turbopack**).
- `pnpm build` — production build (Turbopack); also runs type checking.
- `pnpm lint` — ESLint flat config (`eslint.config.mjs`), extends `next/core-web-vitals` + `next/typescript`.
- `pnpm test` — one-shot Jest run with coverage output (no threshold). `pnpm test:watch` for interactive; `pnpm test -- <relative test path>` for targeted runs. Tests live in root `__tests__/` (not co-located). Canonical rules in `docs/UNIT_TESTING_GUIDELINES.md`; create and fix tests through the `/unit-test` skill/command.
- No dedicated typecheck script; run `pnpm exec tsc --noEmit` if you need a standalone check.

## Environment

- `STRAPI_HOST` and `STRAPI_API_TOKEN` must be set (see `.env.local`, gitignored). Without them, Apollo queries in server components silently fail / return empty.
- Node 22 in CI.

## Architecture

- Next.js 15 App Router, React 19. Router root is `src/app`; path alias `@/*` → `./src/*`.
- Data flow: server components call server actions in `src/shared/lib/global.lib.ts` (`"use server"`), which create a **per-request ApolloClient** from `src/app/apollo-client.ts` against Strapi. GraphQL operations live in `src/shared/queries/global.queries.ts`.
- Theme persistence: next-themes (`attribute="class"`, **light default**) + cookie via `POST /api/preferences` → `saveThemeCookie`. Cookie key in `src/shared/constants`. `AppTheme` is validated at the cookie helper and the route — only `"light"` or `"dark"` are accepted, anything else falls back to `light` without mutating the cookie.
- State: Zustand stores under `src/zustand/store`, SSR-safe providers under `src/zustand/provider`. Follow the provider-wraps-store pattern there when adding stores.
- UI stack: **HeroUI v3** (`@heroui/react`, formerly NextUI) + Tailwind v4 via `@tailwindcss/postcss`. `darkMode: "class"`. For HeroUI docs, prefer the `heroui-react` MCP (configured in `opencode.json`); fallback to the LLM docs at https://heroui.com/react/llms.txt. Note: `tailwind.config.js` `content` only lists HeroUI's theme dist — Tailwind v4 auto-detects app content; do not break this.
- Directory layout: `src/features/<Feature>/` (scoped UI), `src/shared/{constants,data,hooks,lib,queries,types,ui,utils}` (cross-cutting). `src/shared/ui` is split into `atoms` and `organisms`. `src/components` only holds the shared `ProductCard`.
- Base catalog pagination derives 7 pages from `KNOWN_PRODUCT_TOTAL = 333` and `PRODUCT_PAGE_SIZE = 50`; filtered modes keep Previous/current/Next until Strapi exposes filtered totals.

## Release / PR workflow (CI-enforced)

- Target branch for PRs is **`develop`**, not `main`.
- Every PR **must** carry exactly one of the labels `major`, `minor`, or `patch` — CI fails otherwise (`check-label.yml`).
- On merge, CI auto-bumps `package.json` version, tags `vX.Y.Z`, pushes tags, and regenerates `CHANGELOG.md` from the PR. **Do not manually bump the version or edit `CHANGELOG.md`.**
