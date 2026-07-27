---
name: plan
description: Convert a Tehesa research doc into an implementation plan under ai-planning/.
---

# /plan - Story Planning Workflow

You are running the **planning phase** for `fe-tehesa` (Next.js 15 App Router + React 19 + TypeScript, pnpm, Apollo/Strapi, HeroUI, Tailwind v4, next-themes, Zustand). Input is a completed, sign-offed research document; output is an actionable implementation plan under `ai-planning/`.

## Inputs the user may provide

- A research doc path, e.g. `ai-research/{story-name}.story.md`, `ai-research/<epic-name>/<story-name>.story-<story-number>.md`, or `ai-research/epics/<epic-name>.epic.md` - ideal
- Nothing - list available research docs recursively under `ai-research/` and ask which one to plan

Parse `$ARGUMENTS` and the conversation for the research doc path.

## Step 1 - Load shared context first

Read in order:

1. **The research document** provided by the user, or selected recursively from `ai-research/`. This is the source of truth for scope, affected files, ACs, and open questions. If the research doc is not sign-offed, stop and ask the user.
2. `REPO_CONTEXT.md` - architecture map, catalog data flow, theme/cookie flow, conventions, CI, and open questions.
3. `AGENTS.md` - compact commands, env, app structure, test status, styling, and PR/release guidance.
4. `package.json` - dependencies and scripts (`pnpm dev | build | start | lint | test | test:watch | sync:prompts`).
5. Relevant executable config if the story touches it: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `tailwind.config.js`.
6. CI files when release/PR behavior matters: `.github/workflows/check-label.yml`, `.github/workflows/develop-pipeline.yml`, and `.github/workflows/test.yml`.
7. When the plan includes test work, also read `docs/UNIT_TESTING_GUIDELINES.md` for canonical test-authoring rules. Reference the guide instead of duplicating the policy.

## Step 2 - Verify research is plan-ready

Before drafting the plan, confirm:

- All research-doc open questions are resolved or explicitly deferred with a recorded assumption.
- Each acceptance criterion is unambiguous, testable, and traces to a concrete change in this repo.
- The affected areas still match the current layout (`src/app`, `src/features`, `src/components`, `src/shared`, `src/zustand`).
- Strapi/GraphQL contract dependencies are known from this repo's queries/actions/types or are explicitly recorded as assumptions.

If anything is unresolved, ask the user before proceeding. Do not guess answers left open by research.

## Step 2.5 - Scope discipline

The plan covers **only** what the story explicitly asks for. Every file, helper, constant, prop, test, or refactor must trace to one of:

1. A specific acceptance criterion.
2. A direct technical prerequisite of an acceptance criterion.
3. A repo convention from `REPO_CONTEXT.md` or `AGENTS.md`.
4. A research-doc finding the user explicitly accepted.

If an item does not trace to one of those, it is out of scope.

Common temptations to refuse:

- Speculative error handling beyond the boundary behavior the story requires.
- Telemetry, logging, caching, or broad cleanup not mentioned by the story.
- Refactors of nearby components/server actions just because they look inconsistent.
- Tests for invented behavior not present in the plan.
- New state libraries; this repo already has local React state, cookies/server actions, next-themes, and Zustand.
- Backend changes outside this repository. If Strapi behavior is unknown, surface it as an open question or assumption.

## Step 3 - Define phases

Break work into phases, each independently verifiable. Common phase patterns for this repo:

| Story type                        | Phase pattern                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Catalog UI feature                | Types/constants if needed -> feature component(s) under `src/features/<Feature>/` -> page/wiring -> focused verification     |
| Product data change               | GraphQL query/type update -> server action in `src/shared/lib/global.lib.ts` -> client caller update -> focused verification |
| New or changed API route          | Request/response shape -> route handler under `src/app/api/**/route.ts` -> callers -> focused verification                   |
| New page                          | `src/app/<route>/page.tsx` -> feature UI -> navigation/metadata behavior -> focused verification                             |
| Theme/state change                | cookie/server action or Zustand store update -> UI wiring -> theme persistence verification                                  |
| Bug fix                           | Root cause -> smallest fix -> regression check if available -> focused verification                                          |
| Test/tooling explicitly requested | Exact scope -> minimal config/test command -> focused verification                                                           |

Do not create phases for linting, formatting, code review, CI release, or changelog work.

## Step 4 - Specify changes per phase

For each phase, include a **Changes Required** section.

For each file change, specify:

- **Exact path** - e.g. `src/features/Home/Home.tsx`, `src/features/ProductListing/DropdownBrands.tsx`, `src/shared/lib/global.lib.ts`, `src/shared/queries/global.queries.ts`, `src/app/api/preferences/route.ts`.
- **Action** - Create / Modify / Delete.
- **For modifications** - line range, function/component name, or "near <symbol>".
- **Code structure** - function signatures, key props, state shape, critical conditionals. Do not write full implementations.
- **Edge cases** - only non-obvious ones, such as server/client component boundaries, hardcoded 5-page pagination ceiling, page size 50, Strapi field shape, category/brand filters hiding pagination, search only filtering the current working set, or theme cookie/default mismatch.
- **Rationale** - 1-2 sentences only when not self-evident.

Stay concise. Show the implementer what to build, not the complete code. Target **200-500 lines** for the whole plan depending on story size.

## Step 5 - Specify success criteria per phase

Each phase needs:

- **Automated** - exact commands using pnpm, choosing the narrowest useful verification:
  - `pnpm exec tsc --noEmit` for TypeScript-only verification.
  - `pnpm lint` for lint verification.
  - `pnpm build` for full production verification when server/client integration or data fetching changed.
  - `pnpm test` and `pnpm test -- <relative test path>` when the story includes tests. No coverage threshold; treat the test command as the verification step.
- **Manual** - specific user-facing steps when UI behavior is affected, including mobile/desktop when responsive behavior matters.

Do not tell implementers to run `pnpm install` unless the plan intentionally changes dependencies.

## Step 6 - Specify checks, not test code

There is no test runner configured. Add a table like this and keep it honest:

| Area/File                          | Coverage/check areas                                            | Verification reference                                |
| ---------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| `src/features/Home/Home.tsx`       | search/filter/pagination interaction required by ACs            | manual browser check + `pnpm lint` / `pnpm build`     |
| `src/shared/lib/global.lib.ts`     | Strapi variables, return shapes, error behavior in scope        | `pnpm exec tsc --noEmit` + targeted manual data check |
| `src/app/api/preferences/route.ts` | required theme payload, success/error response shape if touched | manual API call or integration check + `pnpm build`   |

If the story explicitly adds a test framework, plan only the minimum test setup required by that story. Jest 30 + Testing Library are already configured; do not reinvent them. Do not invent Vitest, Playwright, or other test frameworks.

Describe **what** to verify, not full test implementations.

## Step 7 - Write the planning doc

File path: retain the research document's relative path and filename, replacing the `ai-research/` prefix with `ai-planning/`; create the target directory if needed. Do not add a `planning-` prefix.

- `ai-research/epics/<epic-name>.epic.md` becomes `ai-planning/epics/<epic-name>.epic.md`.
- `ai-research/<epic-folder-name>/<story-name>.story-<story-number>.md` becomes `ai-planning/<epic-folder-name>/<story-name>.story-<story-number>.md`.
- `ai-research/<story-name>.story.md` becomes `ai-planning/<story-name>.story.md`.

The planning doc should include:

1. **Header** - story name, source research doc path, sign-off status/date, and any assumptions.
2. **Acceptance Criteria** - copied from the research doc in order.
3. **Affected files** - grouped by area: `src/app/**`, `src/app/api/**`, `src/features/**`, `src/components/**`, `src/shared/**`, `src/zustand/**`, docs/config if relevant.
4. **Phases** - one section per phase with Changes Required, Success Criteria, and Verification Coverage.
5. **Cross-cutting concerns** - only those implied by ACs, e.g. Strapi env vars, GraphQL response shape, server/client boundary, theme cookies, responsive UI.
6. **Open Questions / Out-of-scope items** - unresolved items plus nearby changes deliberately excluded.

## Step 8 - Capture planning insights

If planning reveals a verified, broadly useful, non-obvious repo fact, add it to `REPO_CONTEXT.md`. Skip story-specific details.

If you update `.opencode/command/plan.md`, run `pnpm sync:prompts` afterward so its GitHub prompt and Claude skill stay in sync.

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
- Do not run tests, builds, lint, typecheck, `pnpm install`, or package manager changes during planning.
- Do not include full code implementations.
- Do not repeat the research doc wholesale; link to it and plan the work.
- Do not add phases for tooling-only concerns like formatting, CI release, changelog, or version bumps.
- Do not assume TanStack Query, Flowbite, auth/session cookies, shipping workflows, finance domains, or external backend repository access; those are not present in this repo. Jest and Testing Library are present.
- Do not manually bump `package.json` version or edit `CHANGELOG.md` for normal PR work; the develop merge workflow handles release automation.
