# Unit Testing Guidelines

Canonical rules for authoring and repairing Jest tests in `fe-tehesa`. This is the only full copy of the policy; skills, commands, `AGENTS.md`, and `REPO_CONTEXT.md` link to it instead of repeating it.

## Stack And Commands

- Jest 30 wired through `next/jest.js` in `jest.config.ts`; jsdom is the global test environment.
- Testing Library: `@testing-library/react` for render and queries, `@testing-library/jest-dom` for matchers, `@testing-library/user-event` for interactions.
- Commands:
  - `pnpm test` — one-shot run with coverage output, no threshold.
  - `pnpm test:watch` — interactive watch mode.
  - `pnpm test -- <relative test path>` — targeted run while iterating. It still collects coverage from all of `src/`; noisy output is expected and not a reason to change config.
  - `pnpm lint` and `pnpm exec tsc --noEmit` — when a test touches the surrounding type or lint surface.

## Test Placement

- All executable tests live under root `__tests__/`, next to `src/`. Do not co-locate tests with source files.
- Filename patterns: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`. Discovery in `jest.config.ts` uses `__tests__/**/*.{test,spec}.{ts,tsx}`.
- Component tests import `render`, `screen`, and `userEvent` from `@__tests__/test-utils`. The helper already wraps `render` with the real `Providers` component from `@/app/providers`.
- `tsconfig.json` must list both `@/*` and `@__tests__/*` in `paths`; Jest mirrors that mapping and adds `@__tests__/(.*)` → `<rootDir>/__tests__/$1`.

## Queries And Interactions

- Prefer semantic queries in this order:
  1. `getByRole` / `findByRole` with an accessible name.
  2. `getByLabelText` / `getByPlaceholderText` / `getByText` for HeroUI inputs and static text.
  3. `getByDisplayValue` for inputs whose value matters.
  4. `getByTestId` only when no stable semantic query exists.
- Do not use `document.querySelector`, `document.getElementById`, or any direct DOM selector.
- Do not assert Tailwind class names, computed CSS values, colors, fonts, spacing, or layout. Test behavior, not styling.
- For every interaction test:
  - `const user = userEvent.setup()` inside the `it` block.
  - Await every `user.*` call.
  - Do not import or call `fireEvent`; replace it with the equivalent `userEvent` action.

## Mocks And Typing

- Mock only unavailable or external boundaries: network `fetch`, Apollo/Strapi, `next/headers` cookies, `next/navigation` router behavior, browser APIs missing from jsdom, and third-party hooks whose real boundary is impractical.
- Keep real: internal components under `@/features`, `@/shared`, and `@/components`; pure utilities and constants; `next/image` (do not add a project-wide manual mock); HeroUI components whenever jsdom can render the behavior under test.
- Mocks must match the real function's exact named export and response shape. If a response type is hard to type, import the production type and reuse it in the mock.
- New test code must not introduce `any` or `unknown`. When `jest.mock()` targets an internal custom hook, use the relative path and document why the external boundary was not viable.
- Two test files must demonstrate the same need before adding a new shared helper beyond `__tests__/test-utils.tsx`.

## Next.js And HeroUI Constraints

- Jest does not directly render async Server Components. Do not write a test that imports `src/app/page.tsx` and calls `render` on it; instead, test the extracted synchronous behavior or defer the composition path to a future E2E story.
- `@heroui/react` v3 is ESM-only. The implemented `jest.config.ts` direct mapping and the `transpilePackages` list in `next.config.ts` are the only resolution path; do not add alternate HeroUI mocks to bypass them.
- HeroUI overlays and dialogs can portal outside the render container. Query them through the global `screen` and interact through roles and accessible names.
- `window.matchMedia` is globally shimmed. Add `scrollTo`, `ResizeObserver`, pointer, or other browser APIs locally inside a single test or suite only when a tested path requires them; do not add them to `jest.setup.ts` speculatively.

## Conditional Patterns

- **Router context:** When a component using `useRouter` fails with `invariant expected app router to be mounted`, provide the smallest App Router context wrapper that the test needs. The wrapper's `push` member must be `jest.fn()` so navigation is assertable. Do not promise a global router helper; only add one after a second test needs it.
- **Query provider:** TanStack Query is not installed. Do not add `QueryClient`, `QueryClientProvider`, or `QueryProviderMock`. If production later adopts TanStack Query and a test reports `No QueryClient set`, use a fresh production-equivalent client and provider per test, not a shared singleton.

## Skipped Tests

- Preserve existing `it.skip()` and `test.skip()` calls. The `/unit-test` workflow must not remove or enable them unless the user explicitly requests those specific tests.
- Do not introduce a new skip to claim a failing task is complete. If a test must be skipped, the implementation is incomplete until it is fixed or the user agrees to defer it.

## Create And Fix Scope

- A failing test that reflects the approved contract is correct; fix the production source, not the test. A test that is wrong is wrong; fix the test, not the production code.
- For bug-regression tests, trace every caller of the affected function before writing the assertion. A guard in the shared function is a smaller diff than a guard in every caller.
- Never weaken a correct assertion to make a test pass. Never delete a check to claim completion.
- The smallest behavior-focused test is the right test. Avoid scaffolding fixtures, helpers, or providers until a second test proves the need.

## Verification

- During iteration: `pnpm test -- <relative test path>`.
- Before declaring done: `pnpm test`, then `pnpm lint`, and `pnpm exec tsc --noEmit` when the surrounding surface changed.
- Do not run `pnpm build` for a docs/test-tooling change; reserve it for production behavior changes.
- Coverage is emitted by `pnpm test` but no threshold is enforced. Coverage from `src/**/*.{ts,tsx}` is the canonical surface; targeted runs still scan it, so noisy output is expected.
