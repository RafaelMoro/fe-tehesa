---
description: Execute an approved Kraft Envios planning doc phase by phase and report results.
---

# /implement - Story Implementation Workflow

You are running the **implementation phase** for `kraft-envios-fe` (Next.js 14 App Router + React 18 + TypeScript, pnpm, TanStack Query, Tailwind v4 + Flowbite React, Jest). Input is a sign-offed planning document; output is completed code changes and a structured completion report.

## Inputs the user may provide

- A planning doc path, e.g. `ai-planning/planning-{story-name}.md` - ideal
- Nothing - list available planning docs under `ai-planning/*.md` and ask which one to implement

Parse `$ARGUMENTS` and the conversation for the planning doc path.

## Step 1 - Load shared context first

Read in order:

1. **The planning document** provided by the user, or selected from `ai-planning/*.md`. This is the source of truth for implementation; do not invent changes that are not in the plan.
2. `REPO_CONTEXT.md` - architecture map, route inventory, auth/cookie flow, testing notes, conventions, and open questions.
3. `AGENTS.md` - compact commands, env, app structure, API-route, test, and styling guidance.
4. `.github/copilot-instructions.md` - unit test conventions. Treat it as a hard constraint.
5. `package.json` - dependencies and scripts.
6. The research doc the plan references, usually `ai-research/{story-name}.md`, for ACs and assumptions.

There are no CI workflow files in this checkout. Do not assume branch, label, release, changelog, or deployment automation unless the user provides it.

## Step 2 - Confirm plan-ready

Before writing code, confirm:

- The plan exists at `ai-planning/planning-{story-name}.md` and all blocking open questions are resolved.
- The user approved implementation; assume yes if they invoked `/implement` with a planning doc.
- The plan's affected files still exist or have obvious current equivalents.
- Backend/API contract assumptions are explicit if the plan depends on behavior not verifiable from this repo.

Inspect `git status` before edits. If the worktree is dirty, do not ask the user to stash or discard by default; avoid modifying unrelated files and never revert changes you did not make.

## Step 3 - Execute phase by phase

For each phase in the plan:

1. Make the file changes specified in the phase's **Changes Required** section. Stay faithful to the plan; fill implementation details pragmatically.
2. Run the phase's automated success criteria, using the narrowest useful commands from the plan.
3. Fix failures before moving to the next phase.
4. Update any implementation checklist in the planning doc if the plan includes one.
5. **Stop at the end of each phase and wait for explicit user sign-off before starting the next phase.** Do not auto-continue across phase boundaries even if the plan does not say to pause. The user must say "continue", "go", or otherwise approve the next phase. While waiting, summarize the completed phase (files touched, what was built, what was verified) and ask for the sign-off.

## Step 4 - Apply repo conventions while implementing

These are non-negotiable. If the plan violates one, stop and ask because the plan may be wrong.

- **File layout**: domain UI belongs in `src/features/<Domain>/`; shared UI/code belongs in `src/shared/{ui,hooks,lib,utils,constants,types}`; App Router pages and route handlers belong under `src/app/**`.
- **Existing domains**: `Login`, `Dashboard`, `Quotes`, `Addresses`, `AutocompleteZipcode`, `Guides`, and `ProfitMargin`.
- **Path alias**: use `@/*` for `src/*` imports. Do not use deep relative imports for app code when the alias applies.
- **Server vs client**: add `'use client'` only to files that use React hooks, browser APIs, router hooks, event handlers, TanStack Query hooks, or client-only UI behavior. Do not add it to route handlers.
- **State strategy**: use local React state, cookies/server actions, TanStack Query, and local-storage helpers as existing code does. Do not add Zustand or another state library.
- **TanStack Query**: keep `QueryClient` creation inside `src/features/QueryProviderWrapper.tsx`'s `useRef`; never move it to module scope.
- **Auth**: never read session cookies from client components. API route handlers that need auth should use `getAccessToken()` from `@/shared/lib/auth.lib` and attach `Authorization: Bearer <token>` like existing handlers.
- **API routes**: preserve the existing route-handler style unless intentionally fixing a planned bug: missing-token `400`, `axios`, `NextResponse.json`, and current error-envelope behavior.
- **Product SAT**: `src/app/api/product-sat/route.ts` uses `NEXT_PUBLIC_GET_SAT_PRODUCT_URI`, not `BACKEND_URI`.
- **Forms**: prefer existing `react-hook-form` + `yup` patterns.
- **Styling**: use Tailwind v4 utility classes and existing Flowbite React/shared UI patterns. Do not add CSS-in-JS or new styling libraries unless explicitly planned.
- **Config**: preserve `withFlowbiteReact(nextConfig)` in `next.config.mjs` and `transpilePackages: ['jose']`.
- **Do not remove pre-existing `console.log` / `console.warn` / `console.error` statements** unless the plan explicitly says to remove them.
- **Do not edit `CHANGELOG.md` or manually bump `package.json` version** unless the user explicitly asks; no in-repo release automation is documented.

## Step 5 - Tests

Tests are part of implementation. Follow `.github/copilot-instructions.md` as the source of truth for unit test rules.

Project-specific test notes:

- Components using `next/navigation` router should be wrapped with `AppRouterContextProviderMock` from `src/features/AppRouterContextProviderMock.tsx`; pass `push: jest.fn()` as needed.
- Components using TanStack Query should be wrapped with `QueryProviderWrapper` from `src/features/QueryProviderWrapper.tsx`.
- Components touching `next/headers` cookies can use patterns from `__tests__/home.test.tsx` if cookie mocks are needed.
- Browser APIs unavailable in jsdom, such as `window.matchMedia` or `IntersectionObserver`, should be mocked in the test or via helpers in `__tests__/utils-test/`.
- Test files live under `__tests__/`, commonly `__tests__/feature/*`, `__tests__/components/*`, and `__tests__/home.test.tsx`.
- `__tests__/mocks/` and `__tests__/utils-test/` are ignored by Jest and should only contain fixtures/helpers, not real tests.
- Coverage is always collected into `coverage/` on every `pnpm test` run.

Rules to enforce:

- Use `userEvent`, not `fireEvent`.
- Do not mock internal components from `@/features` or `@/shared`; test real behavior unless absolutely necessary.
- Mock external API calls/network and unavailable browser APIs when needed.
- If mocking hooks with `jest.mock()`, use relative imports rather than `@/` aliases.
- Use Testing Library queries via `screen`; do not use `querySelector`, `getElementById`, or `container`.
- Do not assert on CSS classes, inline styles, or visual layout unless critical behavior requires it.
- Preserve existing `it.skip()` / `test.skip()` unless explicitly asked to fix those tests.
- Mock data must match the real function return shape; read the implementation before creating mocks.
- Do not include file extensions in import statements.
- Mocks should use named exports, not default exports.

If a test fails, fix the implementation or test setup. Do not weaken assertions, over-mock the failing behavior, or comment out tests.

## Step 6 - Final steps before declaring done

- Update `REPO_CONTEXT.md` if you added or changed a broadly useful structural fact: route handler inventory, feature domain, shared helper, env var, cross-cutting convention, or non-obvious gotcha.
- Run the final verification appropriate for the change. Prefer focused checks first, then broader checks when warranted:
  - `pnpm test -- __tests__/path/to/file.test.tsx` for focused test coverage.
  - `pnpm test` for broad test coverage when many areas changed.
  - `pnpm exec tsc --noEmit` for TypeScript-only verification.
  - `pnpm lint` for lint verification.
  - `pnpm build` for full production verification.
- If the planning doc has an implementation checklist, check off completed items or call out deferred items in the report.

## Step 7 - Capture follow-ups

If implementation surfaces something outside the plan and it is not blocking:

- Note it as a deferred follow-up in the final report.
- Do not start a new story to address it without going through `/research` again.
- Add to `REPO_CONTEXT.md` only if it is verified, broadly useful, and not story-specific.

## Step 8 - Present for review

End the turn with:

1. Files created / modified / deleted.
2. Phase status and what was completed.
3. Test / typecheck / build / lint status with exact commands run.
4. Whether `REPO_CONTEXT.md` was updated and why.
5. Deferred follow-ups.
6. Suggested next step, without committing, pushing, or opening a PR unless explicitly asked.

## Don'ts

- Do not start implementation without an approved planning doc unless the user explicitly bypasses the workflow.
- Do not skip planned tests or verification.
- Do not push, force-push, commit, or open a PR without explicit approval.
- Do not add features beyond the plan. If something seems missing, stop and ask.
- Do not remove pre-existing console statements unless planned.
- Do not edit `CHANGELOG.md` or package version unless explicitly asked.
- Do not assume Zustand, finance domains, branch labels, release automation, or external backend repository access.
- Do not weaken failing tests to make them pass.
