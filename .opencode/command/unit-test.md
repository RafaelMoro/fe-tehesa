---
description: Create or fix Jest unit/component tests for the Tehesa catalog without requiring an approved planning doc.
---

# /unit-test - Test Creation And Repair Workflow

You are running a focused test workflow for `fe-tehesa` (Next.js 15 App Router + React 19 + TypeScript, pnpm, Apollo/Strapi, HeroUI, Tailwind v4, Zustand, Jest 30 via `next/jest.js`). Input is a request to create a new test, fix a failing test, or expand existing test coverage. Output is a behavior-focused test under root `__tests__/` plus, when the approved contract requires it, a small source change.

`/unit-test` is execution-oriented and does not require a planning document. It is not a replacement for `/implement`; it stays focused on test work.

## Inputs The User May Provide

- A description of the behavior to cover, with optional source paths and test paths.
- A failing test output or `pnpm test` failure excerpt.
- A relative test path to repair.
- Nothing - ask which test or behavior to work on before writing code.

Parse `$ARGUMENTS` and the conversation for the requested behavior, paths, and failure output. If a failure is mentioned, capture the assertion text and stack frames verbatim before editing.

## Step 1 - Load Shared Context First

Read in order before writing code:

1. `docs/UNIT_TESTING_GUIDELINES.md` - canonical test-authoring rules. Follow it for the whole task.
2. `docs/IMPLEMENTATION_GUIDELINES.md` - project-wide code style rules.
3. `REPO_CONTEXT.md` - architecture map, data flow, conventions, CI.
4. `AGENTS.md` - compact commands, env, structure, PR guidance.
5. `package.json` - dependencies and scripts (`pnpm test | test:watch | lint`).
6. The relevant source files and any existing test files for the same module.

If the request touches React or Next.js code, load the `vercel-react-best-practices` skill before writing.

## Step 2 - Confirm The Request Is Actionable

Before writing code, confirm:

- The expected behavior is clear, or ask. Do not encode assumptions in assertions when the user has not specified the contract.
- For fix requests, you have the failing assertion or stack frames, or the relative test path. If not, ask.
- The affected source file and any callers are reachable from the test path; if a deep relative import would be needed, prefer the existing `@/` and `@__tests__/` aliases.

If the request is ambiguous, ask the user before continuing. Do not guess contracts.

## Step 3 - Trace The Production Behavior

For a new test, read the production function or component and the callers it affects. A guard in the shared function is a smaller diff than a guard in every caller; the lazy fix IS the root-cause fix.

For a bug regression, grep every caller of the function under test. A test that only covers the reported symptom leaves sibling callers still broken.

For a failing test, read the test, the production source, and the failure output together. Decide whether the test or the production code is wrong before editing either.

## Step 4 - Write The Smallest Behavior-Focused Test

Place the test under root `__tests__/`. Use the existing filename pattern (`*.test.ts` / `*.test.tsx` / `*.spec.ts` / `*.spec.tsx`).

- Import `render`, `screen`, and `userEvent` from `@__tests__/test-utils` for component tests.
- Use real internal components and pure utilities; mock only the unavailable or external boundaries approved by the guide.
- Prefer semantic queries (`getByRole` with accessible name, `getByLabelText`, `getByText`). Use `getByTestId` only when no semantic query exists.
- For interactions, `const user = userEvent.setup()` inside the test, then `await user.type(...)` or the equivalent. Never `fireEvent`.
- One test, one behavior. Do not bundle multiple assertions of unrelated behavior into a single `it`.
- Preserve existing `it.skip` / `test.skip` calls. Never add a new skip to claim a failing task is complete.

If a single test would need a router wrapper, a `QueryClient` provider, or any other infrastructure that does not exist yet, stop and confirm the conditional pattern from the guide instead of inventing a new helper.

## Step 5 - Run The Test And Repair

Run the targeted test first:

```
pnpm test -- <relative test path>
```

Fix the test, the production source, or both, depending on which side is wrong. Never weaken a correct assertion to make it pass. When you change production source, keep the diff scoped to the approved contract.

Then run the full suite:

```
pnpm test
```

If lint or typecheck is in scope, run:

```
pnpm lint
pnpm exec tsc --noEmit
```

## Step 6 - Decide Whether To Change Production Source

A failing test that reflects the approved contract is correct; change production source to make it pass. A test that misstates the contract is wrong; change the test, never the contract, unless the user explicitly approves a new contract.

Do not:

- Weaken an assertion to make a failing test pass.
- Delete a check to claim completion.
- Add a new `it.skip` to hide a failure.
- Refactor unrelated production code while fixing a test.

If a production change is required, keep the diff scoped to the approved contract and surface it in the report.

## Step 7 - Report

End the turn with:

1. Files created or modified (tests and, if needed, source).
2. The exact test command(s) run and their results.
3. Any production source change with rationale.
4. Remaining skips, failures, or deferred work.

Do not commit, push, or open a PR without explicit approval. Do not start a new story to address follow-ups without going through `/research` again.

## Don'ts

- Do not write tests outside root `__tests__/`.
- Do not redefine a local render helper; use `__tests__/test-utils.tsx`.
- Do not add `any` or `unknown` to a test.
- Do not import `fireEvent` or assert on Tailwind classes, colors, or layout.
- Do not mock internal components, pure utilities, or renderable HeroUI behavior.
- Do not promise a router helper, provider mock, fixture layer, or TanStack Query setup that does not exist. The guide states those are conditional.
- Do not edit `CHANGELOG.md`, `package.json` version, or release workflows.
- Do not run `pnpm build` for a test-only change unless production source moved.
