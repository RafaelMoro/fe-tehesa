---
description: Convert a Kraft Envios research doc into an implementation plan under ai-planning/.
---

# /plan - Story Planning Workflow

You are running the **planning phase** for `kraft-envios-fe` (Next.js 14 App Router + React 18 + TypeScript, pnpm, TanStack Query, Tailwind v4 + Flowbite React, Jest). Input is a completed, sign-offed research document; output is an actionable implementation plan under `ai-planning/`.

## Inputs the user may provide

- A research doc path, e.g. `ai-research/{story-name}.md` - ideal
- Nothing - list available research docs under `ai-research/*.md` and ask which one to plan

Parse `$ARGUMENTS` and the conversation for the research doc path.

## Step 1 - Load shared context first

Read in order:

1. **The research document** provided by the user, or selected from `ai-research/*.md`. This is the source of truth for scope, affected files, ACs, and open questions. If the research doc is not sign-offed, stop and ask the user.
2. `REPO_CONTEXT.md` - architecture map, route handler inventory, auth/cookie flow, testing notes, conventions, and open questions.
3. `AGENTS.md` - compact commands, env, app structure, API-route, test, and styling guidance.
4. `.github/copilot-instructions.md` - unit test conventions. Treat it as a hard constraint for test planning.
5. `package.json` - dependencies and scripts (`pnpm dev | build | start | lint | test`).
6. Relevant executable config if the story touches it: `next.config.mjs`, `jest.config.ts`, `tsconfig.json`, `postcss.config.mjs`.

There are no CI workflow files in this checkout. Do not assume branch, label, release, changelog, or deployment automation unless the user provides it.

## Step 2 - Verify research is plan-ready

Before drafting the plan, confirm:

- All research-doc open questions are resolved or explicitly deferred with a recorded assumption.
- Each acceptance criterion is unambiguous, testable, and traces to a concrete change in this repo.
- The affected areas still match the current layout (`src/app`, `src/features`, `src/shared`, `__tests__`).
- Backend/API contract dependencies are known from this repo's route handlers/types or are explicitly recorded as assumptions.

If anything is unresolved, ask the user before proceeding. Do not guess answers left open by research.

## Step 2.5 - Scope discipline

The plan covers **only** what the story explicitly asks for. Every file, helper, constant, prop, test, or refactor must trace to one of:

1. A specific acceptance criterion.
2. A direct technical prerequisite of an acceptance criterion.
3. A repo convention from `REPO_CONTEXT.md`, `AGENTS.md`, or `.github/copilot-instructions.md`.
4. A research-doc finding the user explicitly accepted.

If an item does not trace to one of those, it is out of scope.

Common temptations to refuse:

- Speculative error handling beyond the boundary behavior the story requires.
- Telemetry, logging, caching, or broad cleanup not mentioned by the story.
- Refactors of nearby route handlers/components just because they look inconsistent.
- Tests for invented behavior not present in the plan.
- New state libraries; this repo currently uses local React state, cookies/server actions, TanStack Query, and local-storage helpers, not Zustand.
- Backend changes outside this repository. If backend behavior is unknown, surface it as an open question or assumption.

## Step 3 - Define phases

Break work into phases, each independently testable. Common phase patterns for this repo:

| Story type               | Phase pattern                                                                                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| New feature UI           | Types/constants if needed -> feature component(s) under `src/features/<Domain>/` -> route/page/dashboard wiring -> tests                                                                   |
| New or changed API route | Shared request/response types -> route handler under `src/app/api/**/route.ts` following existing auth/proxy shape -> callers/hooks -> tests -> update `REPO_CONTEXT.md` if broadly useful |
| New page                 | `src/app/<route>/page.tsx` -> feature UI -> navigation/redirect behavior -> tests                                                                                                          |
| Form feature             | Yup schema/constants -> `react-hook-form` integration -> submit/mutation behavior -> success/error UI required by ACs -> tests                                                             |
| Bug fix                  | Root cause -> smallest fix -> regression test -> focused verification                                                                                                                      |
| Test-only/refactor       | Exact scope -> change -> focused tests -> no behavior-change verification                                                                                                                  |

Do not create phases for linting, formatting, code review, CI release, or changelog work.

## Step 4 - Specify changes per phase

For each phase, include a **Changes Required** section.

For each file change, specify:

- **Exact path** - e.g. `src/app/api/quotes/route.ts`, `src/features/Guides/Mn/CreateGuideModalMn.tsx`, `src/shared/types/guides.types.ts`, `__tests__/feature/Guides/Mn/CreateGuideModalMn.test.tsx`.
- **Action** - Create / Modify / Delete.
- **For modifications** - line range, function/component name, or "near <symbol>".
- **Code structure** - function signatures, key props, state shape, critical conditionals. Do not write full implementations.
- **Edge cases** - only non-obvious ones, such as client/server component boundaries, httpOnly session cookies, mixed API response envelopes, mobile/tablet dashboard rendering, or `product-sat` using an external SAT URI instead of `BACKEND_URI`.
- **Rationale** - 1-2 sentences only when not self-evident.

Stay concise. Show the implementer what to build, not the complete code. Target **300-700 lines** for the whole plan depending on story size.

## Step 5 - Specify success criteria per phase

Each phase needs:

- **Automated** - exact commands using pnpm, choosing the narrowest useful verification:
  - `pnpm test -- __tests__/path/to/file.test.tsx` for focused tests.
  - `pnpm test` when the change crosses many areas; coverage is always collected.
  - `pnpm exec tsc --noEmit` for TypeScript-only verification.
  - `pnpm lint` for lint verification.
  - `pnpm build` for full production verification.
- **Manual** - specific user-facing steps when UI behavior is affected, including desktop/mobile when dashboard behavior can differ.

Do not tell implementers to run `pnpm install` unless the plan intentionally changes dependencies.

## Step 6 - Specify test coverage, not test code

Add a table like this:

| File                                   | Coverage areas                                                                | Pattern reference                                                                                 |
| -------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/app/api/quotes/route.ts`          | success, missing access token, upstream error shape if in scope               | Cookie/header mock pattern from `__tests__/home.test.tsx`; route style from existing API handlers |
| `src/features/Quotes/QuoteForm.tsx`    | form validation, submit behavior, visible result/error states required by ACs | Existing `__tests__/feature/Quotes/*.test.tsx`; Testing Library + `userEvent`                     |
| `src/features/Dashboard/Dashboard.tsx` | screen switching and mobile/desktop branches if touched                       | Existing dashboard tests; wrap router/query providers as needed                                   |

Test rules from `.github/copilot-instructions.md` to reflect in the plan:

- Use `userEvent`, not `fireEvent`.
- Do not mock internal components from `@/features` or `@/shared`; test real behavior unless absolutely necessary.
- Mock external API calls/network and unavailable browser APIs when needed.
- If mocking hooks with `jest.mock()`, use relative imports rather than `@/` aliases.
- Use Testing Library queries via `screen`; do not use `querySelector`, `getElementById`, or `container`.
- Do not assert on CSS classes or visual styling unless it is critical functionality.
- Preserve existing `it.skip()` / `test.skip()` unless the user explicitly asks to fix those tests.
- Mock data must match the real function return shape; read the implementation before specifying mocks.
- Do not include file extensions in import statements.
- Mocks should use named exports, not default exports.

Describe **what** to test, not full test implementations.

## Step 7 - Write the planning doc

File path: `ai-planning/planning-{story-name}.md` (create the directory if it does not exist).

The planning doc should include:

1. **Header** - story name, source research doc path, sign-off status/date, and any assumptions.
2. **Acceptance Criteria** - copied from the research doc in order.
3. **Affected files** - grouped by area: `src/app/**`, `src/app/api/**`, `src/features/**`, `src/shared/**`, `__tests__/**`, docs/config if relevant.
4. **Phases** - one section per phase with Changes Required, Success Criteria, and Test Coverage.
5. **Cross-cutting concerns** - only those implied by ACs, e.g. auth cookies, dashboard mobile branch, env vars, API response shape.
6. **Open Questions / Out-of-scope items** - unresolved items plus nearby changes deliberately excluded.

## Step 8 - Capture planning insights

If planning reveals a verified, broadly useful, non-obvious repo fact, add it to `REPO_CONTEXT.md`. Skip story-specific details.

## Step 9 - Present for review

End the turn with:

1. Path to the planning doc.
2. Phase summary - one line per phase.
3. Assumptions made.
4. Unresolved questions.
5. Decisions beyond the research doc and why.

Do **not** start implementing. Wait for human sign-off.

## Don'ts

- Do not write source files or tests while planning, except the planning doc and optional verified `REPO_CONTEXT.md` note.
- Do not run tests, builds, lint, typecheck, or `pnpm install` during planning.
- Do not include full code implementations.
- Do not repeat the research doc wholesale; link to it and plan the work.
- Do not add phases for tooling-only concerns like formatting, CI release, changelog, or version bumps.
- Do not assume Zustand, finance domains, branch labels, changelog automation, or external backend repository access.
