# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Full architecture, data flow, conventions, and gotchas live in `ai-skills/REPO_CONTEXT.md` — read it before making non-trivial changes.** This file is a quick-start pointer only; it does not duplicate that detail.

## Quick Start

**Package manager:** pnpm (not npm or yarn). Lockfile + `.npmrc` hoisting for `@heroui/*`.

**Key scripts:**
- `pnpm dev` — dev server with Turbopack
- `pnpm build` — production build (also runs type checking)
- `pnpm lint` — ESLint (flat config)
- `pnpm test` — Jest with coverage; `pnpm test:watch` for interactive; `pnpm test -- <path>` for targeted runs
- `pnpm exec tsc --noEmit` — standalone TypeScript check (no dedicated script)

**Required env vars for local development:** `STRAPI_HOST` and `STRAPI_API_TOKEN` in `.env.local`. Without them, Apollo queries silently fail.

**Optional env vars:**
- `NEXT_PUBLIC_SITE_URL` — absolute production origin used by `metadataBase`, canonicals, `robots.ts`, and `sitemap.ts`. Falls back to `http://localhost:3000` when unset; never throws.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` — the seller's WhatsApp click-to-chat number, used by `/cotizar`'s `WhatsappCta`, the header's utility-bar link / mobile menu footer button, the `WhatsappPanel` shared by `/categorias` and `/categorias/tornilleria`, and `/marcas`'s closing-panel `Cotizar por WhatsApp` button. Unset hides the affected links/CTA instead of throwing.

## What This Is

**fe-tehesa** is a Next.js 15 App Router MVP for a Tehesa product catalog: paginated products from Strapi via GraphQL, client-side search/filtering, a variants-pricing drawer, a `/cotizar` quote page backed by a persisted cart, category pages under `/categorias`, and a brands index at `/marcas` with per-brand pages at `/marcas/<slug>`. See `ai-skills/REPO_CONTEXT.md` for the full architecture map, directory layout, data flow, theme/cookie handling, API route inventory, SEO surface, and conventions/gotchas.

## Release And PR Workflow

- **Target branch:** PRs go to `develop`, not `main`
- **Label enforcement:** Every PR must have exactly one of `major`, `minor`, or `patch` labels (CI fails otherwise)
- **Auto-release on merge:** CI auto-bumps `package.json` version, tags `vX.Y.Z`, pushes tags, and regenerates `CHANGELOG.md`
- **Do not manually:** Bump version or edit `CHANGELOG.md` for normal PR work

## Workflow Skills

`ai-skills/<skill>/` is the single source of truth for every skill and command (symlinked into `.claude/skills/`, `.opencode/`, `.github/prompts/`). Edit `ai-skills/<skill>/COMMAND.md` and run `pnpm sync:prompts`; see `ai-skills/REPO_CONTEXT.md`'s Prompt Sync section for the full mechanics.

- `/research` — investigate a story, write findings to `ai-research/`
- `/plan` — convert research doc into implementation steps under `ai-planning/`
- `/implement` — execute an approved plan phase by phase
- `/unit-test` — create or fix Jest tests without an approved plan
- `/check-design` — file completed design screenshots for a research brief into `comps/`
- `/task-effort-estimator` — estimate story or epic effort from a research doc
- `/pr-describer` — write a PR title/description from the current branch's changes

Use `/research` to kick off a feature or bug investigation, then `/plan`, then `/implement`.

## See Also

- `ai-skills/REPO_CONTEXT.md` — canonical architecture, data flow, API routes, SEO surface, conventions, gotchas, key files, open questions
- `AGENTS.md` — compact commands, env, architecture, release workflow
- `docs/IMPLEMENTATION_GUIDELINES.md` — control flow, object literals, error messages (must read before implementing)
- `docs/UNIT_TESTING_GUIDELINES.md` — Jest/Testing Library rules (canonical, not duplicated elsewhere)
- `DESIGN.md` — visual design tokens + Tailwind config (validate with `pnpm design:lint`)
- `docs/ANALYTICS_EVENT_CONTRACT.md` — PLP analytics event contract (spec only; no analytics code ships yet)
