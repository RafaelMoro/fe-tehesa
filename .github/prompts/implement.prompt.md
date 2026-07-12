---
description: Execute an approved Tehesa planning doc phase by phase and report results.
---

# /implement - Story Implementation Workflow

You are running the **implementation phase** for `fe-tehesa` (Next.js 15 App Router + React 19 + TypeScript, pnpm, Apollo/Strapi, HeroUI, Tailwind v4, next-themes, Zustand). Input is a sign-offed planning document; output is completed code changes and a structured completion report.

## Inputs the user may provide

- A planning doc path, e.g. `ai-planning/planning-{story-name}.md` - ideal
- Nothing - list available planning docs under `ai-planning/*.md` and ask which one to implement

Parse `$ARGUMENTS` and the conversation for the planning doc path.

## Step 1 - Load shared context first

Read in order:

1. **The planning document** provided by the user, or selected from `ai-planning/*.md`. This is the source of truth for implementation; do not invent changes that are not in the plan.
2. `docs/IMPLEMENTATION_GUIDELINES.md` - project-wide implementation guidelines. Apply them throughout; they override defaults when in conflict.
3. `REPO_CONTEXT.md` - architecture map, catalog data flow, theme/cookie flow, conventions, CI, and open questions.
4. `AGENTS.md` - compact commands, env, app structure, test status, styling, and PR/release guidance.
5. `package.json` - dependencies and scripts.
6. The research doc the plan references, usually `ai-research/{story-name}.story.md` or `ai-research/{story-name}.epic.md`, for ACs and assumptions.
7. For React/Next.js changes, load the `vercel-react-best-practices` skill from `.agents/skills/vercel-react-best-practices/` before writing code.

There is no test framework configured and no `pnpm test` script. Do not invent test commands.

## Step 2 - Confirm plan-ready

Before writing code, confirm:

- The plan exists at `ai-planning/planning-{story-name}.md` and all blocking open questions are resolved.
- The user approved implementation; assume yes if they invoked `/implement` with a planning doc.
- The plan's affected files still exist or have obvious current equivalents.
- Strapi/GraphQL contract assumptions are explicit if the plan depends on behavior not verifiable from this repo.

Inspect `git status` before edits. If the worktree is dirty, do not ask the user to stash or discard by default; avoid modifying unrelated files and never revert changes you did not make.

## Step 3 - Execute phase by phase

For each phase in the plan:

1. Make the file changes specified in the phase's **Changes Required** section. Stay faithful to the plan; fill implementation details pragmatically.
2. Run the phase's automated success criteria, using the narrowest useful commands from the plan.
3. Fix failures before moving to the next phase.
4. Update any implementation checklist in the planning doc if the plan includes one.
5. **Stop at the end of each phase and wait for explicit user sign-off before starting the next phase.** Do not auto-continue across phase boundaries even if the plan does not say to pause. The user must say "continue", "go", or otherwise approve the next phase. While waiting, summarize the completed phase (files touched, what was built, what was verified) and ask for sign-off.

## Step 4 - Apply repo conventions while implementing

These are non-negotiable. If the plan violates one, stop and ask because the plan may be wrong.

- **File layout**: domain UI belongs in `src/features/<Feature>/`; shared UI/code belongs in `src/shared/{ui,hooks,lib,utils,constants,types,queries}`; App Router pages and route handlers belong under `src/app/**`; `src/components` currently only contains shared `ProductCard`.
- **Existing domains**: `Home`, `ProductListing`, and `ProductVariantsDrawer`.
- **Path alias**: use `@/*` for `src/*` imports. Do not use deep relative imports for app code when the alias applies.
- **Server vs client**: add `"use client"` only to files that use React hooks, browser APIs, router hooks, event handlers, Zustand hooks, HeroUI hooks, or client-only UI behavior. Do not add it to route handlers or server-only libs.
- **Data access**: preserve the Apollo/Strapi pattern in `src/shared/lib/global.lib.ts` and `src/app/apollo-client.ts` unless the approved plan explicitly changes it.
- **Env vars**: Strapi reads require `STRAPI_HOST` and `STRAPI_API_TOKEN`.
- **Pagination**: `src/app/page.tsx` intentionally clamps catalog pages to `1..5`; do not replace this unless planned.
- **State strategy**: use local React state, cookies/server actions, next-themes, and the existing Zustand provider/store pattern. Do not add another state library.
- **Theme**: use `POST /api/preferences`, `saveThemeCookie()`, `THEME_COOKIE_KEY`, `NextThemesProvider`, and `ChangeThemeStoreProvider` rather than writing cookies directly from clients.
- **API routes**: existing route handler is `/api/preferences`; keep `NextResponse.json` style unless intentionally changing it.
- **Styling**: use Tailwind v4 utility classes and HeroUI/shared UI patterns. Do not add CSS-in-JS or new styling libraries unless explicitly planned.
- **Config**: preserve `tailwind.config.js` HeroUI theme content, `darkMode: "class"`, and the minimal `next.config.ts` unless the plan explicitly changes config.
- **Do not remove pre-existing `console.log` / `console.warn` / `console.error` statements** unless the plan explicitly says to remove them.
- **Do not edit `CHANGELOG.md` or manually bump `package.json` version** unless the user explicitly asks; the develop merge workflow handles release automation.
- **React/Next.js performance**: while writing React or Next.js code, apply the loaded `vercel-react-best-practices` guidance pragmatically. Prefer the smallest useful change; do not add dependencies or broad rewrites just to satisfy a performance guideline.

## Step 5 - Verification

There is no configured test runner. Follow the planning doc's verification section and use only real commands:

- `pnpm exec tsc --noEmit` for TypeScript-only verification.
- `pnpm lint` for lint verification.
- `pnpm build` for full production verification when server/client integration, routing, or data fetching changed.
- Manual browser/API checks when UI behavior, theme persistence, or route-handler behavior changed.

Do not run `pnpm test` unless the plan explicitly added a test script and framework.

If verification fails, fix the implementation or adjust the plan only with user approval. Do not weaken checks, ignore failures, or claim unrun verification passed.

## Step 6 - Final steps before declaring done

- Update `REPO_CONTEXT.md` if you added or changed a broadly useful structural fact: route handler inventory, feature domain, shared helper, env var, cross-cutting convention, or non-obvious gotcha.
- Run the final verification appropriate for the change. Prefer focused checks first, then broader checks when warranted:
  - `pnpm exec tsc --noEmit`
  - `pnpm lint`
  - `pnpm build`
- If the planning doc has an implementation checklist, check off completed items or call out deferred items in the report.
- If React/Next.js files changed, review only the touched files against `vercel-react-best-practices` before declaring done.
- If you update `.opencode/command/implement.md`, sync it to `.github/prompts/implement.prompt.md` afterward with the existing sync script.

## Step 7 - Capture follow-ups

If implementation surfaces something outside the plan and it is not blocking:

- Note it as a deferred follow-up in the final report.
- Do not start a new story to address it without going through `/research` again.
- Add to `REPO_CONTEXT.md` only if it is verified, broadly useful, and not story-specific.

## Step 8 - Present for review

End the turn with:

1. Files created / modified / deleted.
2. Phase status and what was completed.
3. Typecheck / build / lint / manual verification status with exact commands run.
4. Whether `REPO_CONTEXT.md` was updated and why.
5. Deferred follow-ups.
6. Suggested next step, without committing, pushing, or opening a PR unless explicitly asked.

## Don'ts

- Do not start implementation without an approved planning doc unless the user explicitly bypasses the workflow.
- Do not skip planned verification.
- Do not push, force-push, commit, or open a PR without explicit approval.
- Do not add features beyond the plan. If something seems missing, stop and ask.
- Do not remove pre-existing console statements unless planned.
- Do not edit `CHANGELOG.md` or package version unless explicitly asked.
- Do not assume TanStack Query, Flowbite, Jest, auth/session cookies, shipping workflows, finance domains, or external backend repository access; those are not present in this repo.
- Do not run `pnpm install` or package manager changes unless the plan intentionally changes dependencies.
