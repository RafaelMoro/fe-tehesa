# Research: Establish the Jest Testing Foundation

## Story Definition

### Story Title

Establish the Jest Testing Foundation

### Source

`ai-research/unit-testing.epic.md:46-59`

### Description

Add only the configuration and shared setup needed to execute TypeScript unit
and component tests in this Next.js application.

This is a single infrastructure story. It should not change catalog behavior,
theme behavior, Strapi queries, app routes, or production UI code except where a
minimal proof test exposes an already-approved precondition from the epic.

### Acceptance Criteria

1. Jest runs through `next/jest` with `jsdom` and resolves the existing `@/*`
   alias.
2. `@testing-library/jest-dom` is loaded once for all tests.
3. The dependency set includes `@testing-library/user-event` because interactions
   must not use `fireEvent`.
4. Browser API shims are limited to APIs required by tested code or HeroUI.
5. No TanStack Query dependency or `QueryProviderMock` is introduced because the
   repository does not use TanStack Query.

### Scope Assessment

Single story.

This story is independently deliverable because it only establishes test tooling,
shared test setup, scripts, and the smallest proof tests needed to verify that the
foundation works.

### Task Breakdown

1. Add the minimal Jest and Testing Library dependency set.
2. Add Jest configuration using Next's `next/jest` integration.
3. Add one shared setup file that loads `@testing-library/jest-dom` and only the
   browser shims demanded by real rendered code.
4. Add scripts that run Jest once and, if desired, in watch mode.
5. Add minimal proof tests that exercise alias resolution, jsdom rendering,
   `jest-dom`, and `user-event` without turning this story into broad coverage.
6. Verify with the new test command plus the existing lint/build/typecheck rules
   when implementation reaches verification.

### Not In Scope

- Broad component coverage.
- Route handler test suites for every catalog API route.
- App Router page tests for async Server Components.
- Coverage thresholds.
- TanStack Query, query-client providers, or mock query providers.
- A custom test framework abstraction.
- Production refactors solely to improve testability.

## Technical Research

### Required Context Read

The following files were read before exploration:

- `REPO_CONTEXT.md`
- `AGENTS.md`
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `postcss.config.mjs`
- `tailwind.config.js`
- `.github/workflows/check-label.yml`
- `.github/workflows/develop-pipeline.yml`
- `ai-research/unit-testing.epic.md:46-59`

### Current Test State

- No Jest config exists.
- No `*.test.*`, `*.spec.*`, or root `__tests__` suite exists.
- No `pnpm test` script exists.
- No test framework dependency exists in `package.json`.
- `pnpm lint`, `pnpm build`, and `pnpm exec tsc --noEmit` are the current
  verification commands.
- `package.json` uses pnpm and already includes Next 15.5.9, React 19.1,
  TypeScript 5, HeroUI v3, Apollo Client v4, next-themes, and Zustand v5.

### Affected Areas

Routes/pages: `src/app/**`

- `src/app/layout.tsx` is an async-free server layout using `next/font/local` and
  `next-themes`.
- `src/app/page.tsx` is an async Server Component. The official Next/Jest
  guidance says Jest does not support async Server Components directly, so this
  story should not target the page as a component test.
- `src/app/providers.tsx` currently returns `children` unchanged. It is not a
  HeroUI provider wrapper in the current code.

API route handlers: `src/app/api/**/route.ts`

- The only non-catalog API route is `/api/preferences`.
- Catalog route handlers use shared helpers from `src/app/api/catalog/_utils.ts`.
- `_utils.ts` contains pure-ish validation surfaces that can be proof-tested
  without Strapi or Apollo if this story needs a TypeScript unit test target.

Feature UI: `src/features/{Home,ProductListing,ProductVariantsDrawer}`

- `src/features/Home/Home.tsx` uses `useRouter`, HeroUI overlays, `fetch`, and
  `window.scrollTo`; it is not the smallest proof target for the first setup.
- `src/features/ProductListing/SearchInput.tsx` is a small client component using
  HeroUI `TextField`, `Label`, `Input`, and `Description`; it is a good minimal
  component proof target for jsdom, semantic queries, and `user-event`.
- `src/features/ProductListing/DropdownCategories.tsx` and
  `src/features/ProductListing/DropdownBrands.tsx` use HeroUI `Dropdown`; these
  may require more browser/event shims than a first proof test should introduce.
- `src/features/CatalogSearchDrawer/CatalogSearchDrawer.tsx` uses HeroUI
  `Drawer`, form submission, dropdowns, spinner, and field errors; it is useful
  later but too broad for the foundation proof.
- `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx` likely needs
  network mocking and overlay behavior; it is not needed for Story 1.

Shared product card: `src/components/ProductCard.tsx`

- Uses HeroUI `Card`, `Chip`, and `Button` plus `useMediaQuery()`.
- `useMediaQuery()` depends on `window.matchMedia` when available.
- The button uses HeroUI `onPress`, so a realistic interaction test should use
  `userEvent`, not `fireEvent`.
- This is a possible proof target, but `SearchInput.tsx` is smaller.

Shared code: `src/shared/{constants,hooks,lib,queries,types,ui,utils}`

- `src/shared/utils/global.utils.ts` has `formatNumberToCurrency`, a simple pure
  function, and `saveThemeApi`, which depends on `fetch`.
- `src/shared/utils/catalog-api.utils.ts` depends on `fetch` and JSON envelopes.
- `src/shared/hooks/useMediaQuery.tsx` safely returns false flags when
  `window.matchMedia` is absent, so `matchMedia` is only required when testing
  mobile-aware branches.
- `src/shared/lib/global.lib.ts` is server-action and Strapi-facing; avoid it for
  the foundation proof.
- `src/shared/queries/global.queries.ts` should not be tested in this story.

Zustand theme state: `src/zustand/{provider,store}`

- Theme state is not required for the foundation proof.
- If tested later, keep the provider-wraps-store pattern and create a fresh store
  per render.

Tests

- None are configured yet.
- The epic already answered that tests should live in a root `__tests__`
  directory, not co-located with source files.

### Existing Patterns To Follow

- Next.js 15 App Router with server/client split.
- Server actions live in `src/shared/lib/global.lib.ts` and create a per-call
  Apollo Client through `src/app/apollo-client.ts`.
- Client catalog reads use `/api/catalog/**` route handlers and `fetchCatalog`.
- HeroUI v3 components are used directly from `@heroui/react`.
- Tailwind v4 is configured through `@tailwindcss/postcss`; `tailwind.config.js`
  currently only sets `darkMode: "class"`.
- Theme persistence uses next-themes class mode plus `/api/preferences`.
- Zustand stores use the SSR-safe provider-wraps-store pattern.
- Existing UI copy is Spanish.
- Use pnpm only.

### Jest Configuration Findings

- `next/jest` is the right integration point because this is a Next.js app and it
  handles Next/SWC transforms, styles, fonts, and common module behavior.
- The `@/*` alias in `tsconfig.json` must be mirrored for Jest resolution.
- `testEnvironment: "jsdom"` is required for React component tests.
- `setupFilesAfterEnv` should load one shared setup file.
- The existing epic has an answered decision to use `jest.config.ts` and retain
  `ts-node` so the TypeScript config can load.
- Avoid `ts-jest`; Next's Jest integration already handles transforms.
- Avoid global `next/image` mocks unless a real rendered test requires it.

### Dependency Research

Current `package.json` has no testing dependencies.

Dependencies that fit this story:

- `jest`
- `jest-environment-jsdom`
- `@types/jest`
- `@testing-library/react`
- `@testing-library/dom`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `ts-node`, only because the epic answered that `jest.config.ts` is preferred

Dependencies that do not fit this story:

- `ts-jest`
- Babel-specific Jest transformers
- TanStack Query packages
- Query-provider mocks
- Snapshot-specific packages
- Coverage service packages

### Browser API Shim Findings

Repository search found these browser/API usages in source:

- `window.scrollTo` in `src/features/Home/Home.tsx`
- `window.matchMedia` in `src/shared/hooks/useMediaQuery.tsx`
- `fetch` in `src/shared/utils/global.utils.ts`
- `fetch` in `src/shared/utils/catalog-api.utils.ts`

Implications:

- A foundation setup file may not need any shim if the first proof test targets a
  simple component like `SearchInput`.
- Add `matchMedia` only when a test renders code that expects mobile/desktop
  behavior from `useMediaQuery()`.
- Add `scrollTo` only when testing `Home` pagination behavior.
- Mock `fetch` per test or per suite when testing fetch helpers; do not install a
  network mocking dependency for this story.
- HeroUI overlay/dropdown tests may later need pointer, resize, or observer
  support, but those should be added only when a failing real test proves it.

### First Proof Test Candidates

Best minimal proof candidate:

- `src/features/ProductListing/SearchInput.tsx`

Why:

- Small component.
- Uses HeroUI enough to prove jsdom rendering works.
- Has accessible label text.
- Supports a real `userEvent` typing interaction.
- Does not need router, fetch, Strapi env, `matchMedia`, or `scrollTo`.

Secondary pure unit candidate:

- `src/shared/utils/global.utils.ts` with `formatNumberToCurrency`

Why:

- Proves TypeScript test execution and alias import resolution with almost no
  runtime setup.
- Does not require jsdom, but can still run under the global jsdom environment.

Possible validation candidate:

- `src/app/api/catalog/_utils.ts`

Why:

- Uses route helper validation and constants.
- Can verify the Jest alias mapping and Next environment can import route helper
  code.
- Might be more than needed for the foundation proof because it imports
  `NextResponse` and route-related types.

Avoid for the first proof:

- `src/app/page.tsx` because it is an async Server Component.
- `Home.tsx` because it needs router, fetch, overlay state, and `scrollTo`.
- HeroUI dropdown/drawer tests because they are more likely to require shims.
- Strapi/Apollo server actions because they depend on env and network contracts.

### Verification Rules To Follow

- Do not run nonexistent `pnpm test` until implementation adds it.
- Do not run `pnpm install` during research.
- In implementation, package changes must update both `package.json` and
  `pnpm-lock.yaml` using pnpm.
- Existing checks remain `pnpm lint`, `pnpm build`, and
  `pnpm exec tsc --noEmit` when relevant.
- Once the test script exists, run the new one-shot test command.
- No coverage threshold is required by this story.

### Dependencies And Integration Points

- New dev dependencies require `package.json` and `pnpm-lock.yaml` changes.
- `STRAPI_HOST` and `STRAPI_API_TOKEN` are not required for the recommended proof
  tests.
- Apollo/Strapi server actions should not be invoked by this story.
- Prompt sync uses `pnpm sync:prompts`; not relevant unless command prompts are
  edited.
- CI currently handles release labels and develop merge changelog/version bumping,
  not tests.
- The epic has an answered decision for adding a future GitHub Actions test job,
  but this Story 1 source acceptance criteria only asks for local foundation.

### Edge Cases And Constraints

- Hardcoded catalog pagination ceiling is 5 pages.
- Product page size is 50.
- Variant page size is 100.
- No GraphQL pagination metadata is documented.
- Category and brand lists have dynamic API reads but older hardcoded types still
  exist.
- Theme defaults differ between next-themes and cookie fallback.
- Filtered catalog modes hide pagination.
- Local search filters only the current working set.
- Jest should not be used to test async Server Components directly.
- Keep shims minimal; a broad jsdom polyfill file is future debt.

### Non-Obvious Findings Captured

`REPO_CONTEXT.md` was updated during research because two broadly useful facts had
drifted from source:

- `src/app/providers.tsx` currently returns children unchanged and is not a
  HeroUI provider wrapper.
- `tailwind.config.js` currently only sets class dark mode and no longer lists
  HeroUI theme content.

## Open Questions

### Strapi Contract

I: Question: Does this story need any Strapi-backed test coverage?
Status: answered
Answer: No.
Context: The story is a Jest/Testing Library foundation. Recommended proof tests
avoid Apollo, Strapi env vars, and GraphQL.

II: Question: Should tests mock GraphQL operations or Apollo Client in Story 1?
Status: answered
Answer: No.
Context: Apollo/Strapi integration belongs to later route/server-action stories.

### Catalog Behavior

I: Question: Should Story 1 test catalog pagination, category filters, brand
filters, or catalog-wide search behavior?
Status: answered
Answer: No.
Context: Those are behavior tests and would require router/fetch setup beyond the
minimal foundation acceptance criteria.

II: Question: Is a root `__tests__` directory preferred over co-located tests?
Status: answered
Answer: Yes, per `ai-research/unit-testing.epic.md:625-631`.
Context: The epic says root `__tests__` is the chosen convention.

### UI/Product Decisions

I: Question: Which first component is the lowest-cost proof that jsdom,
`jest-dom`, HeroUI, and `user-event` work together?
Status: answered
Answer: `src/features/ProductListing/SearchInput.tsx`.
Context: It has a label, an input, and a user typing path without router, fetch,
or overlay shims.

II: Question: Should implementation add a shared render helper or app test
provider now?
Status: answered
Answer: Yes.
Context: Add a minimal shared render helper now.
Explanation: A helper is the fastest way to ensure consistent app test provider
behavior and to avoid divergence across test files.

### Theme/Persistence

I: Question: Should Story 1 test next-themes or `/api/preferences` cookie
behavior?
Status: answered
Answer: No.
Context: Theme persistence is unrelated to Jest foundation setup.

II: Question: Should `window.matchMedia` be shimmed globally for theme or mobile
tests?
Status: answered
Answer: Shimmed for mobile tests.
Context: `useMediaQuery()` handles missing `matchMedia` by returning false flags.
Explanation: Add the `matchMedia` shim so mobile-aware code paths (e.g.
`ProductCard`) are reachable in jsdom.

### Verification

I: Question: Should `pnpm test` run once or in watch mode by default?
Status: answered
Answer: Run once with coverage output; expose watch separately if implemented.
Context: Answered in `ai-research/unit-testing.epic.md:646-652`.

II: Question: Should this story enforce a coverage threshold?
Status: answered
Answer: No.
Context: The epic says emit coverage without enforcing a percentage.

III: Question: Should this story add CI test workflow wiring?
Status: answered
Answer: Yes.
Context: The epic answered yes for the broader initiative. Add a
`.github/workflows/test.yml` job that installs with pnpm on Node 22, runs
`pnpm install --frozen-lockfile`, `pnpm lint`, and `pnpm test --coverage`, and
uploads the coverage artifact. The job runs on pull requests and on merges to
`develop`. PR label enforcement remains the responsibility of
`check-label.yml`.

IV: Question: Should `jest.config.ts` be used instead of a JavaScript config?
Status: answered
Answer: Yes, use TypeScript and retain `ts-node`.
Context: Answered in `ai-research/unit-testing.epic.md:620-623`.

## Assumptions

- The user selected full-template research.
- The user confirmed this is a single story.
- The user asked to prioritize config, first proof tests, and HeroUI shims.
- Jest is required, not Vitest.
- The implementation should stay minimal and avoid broad test utilities until
  repetition proves a need.
- `SearchInput.tsx` is acceptable as the first proof target unless the implementer
  intentionally chooses an even smaller pure unit plus a separate component smoke
  test.
- No production code should be changed just to make Jest setup pass.
- No package manager changes are made during research.
- Decision on global HeroUI dropdown/drawer shims is deferred to the Story 4
  research (`ai-research/unit-testing.epic.md:98-113`). It will be captured there
  because the dropdown/drawer testing surface lives in that story.

## Research Outcome

Story 1 is feasible as a small testing-foundation change. The shortest reliable
path is a `next/jest` config, one setup file loading `@testing-library/jest-dom`,
the required Testing Library/Jest dev dependencies including `user-event`, minimal
or zero browser shims at first, and one or two proof tests that avoid router,
fetch, Strapi, Apollo, async Server Components, and HeroUI overlays.
