# Unit Testing Foundation and Retrospective Coverage Epic

## Research Mode

- Mode: full research.
- Scope: cross-cutting epic.
- Coverage strategy: risk-based, not exhaustive file coverage or a percentage target.
- Guidance deliverables: repository Markdown guide and a dedicated OpenCode skill.
- Research date: 2026-07-12.

## Story Definition

### Epic Title

Add unit testing infrastructure, risk-based coverage, and reusable testing guidance.

### Epic Description

The repository currently has no test runner, test dependencies, test configuration,
test script, test files, shared test utilities, or dedicated testing guidance.
This epic establishes a Jest and Testing Library baseline suitable for the current
Next.js 15 App Router and React 19 application, then protects the highest-risk
behavior developed so far.

The goal is confidence in behavior, not a test for every source file. Tests should
prioritize trust boundaries, data transformations, state transitions, and critical
user flows. Static types, constants, GraphQL document declarations, framework-owned
behavior, and visual styling do not require direct tests unless they expose distinct
application behavior.

### Epic Acceptance Criteria

1. The repository has a working Jest configuration, jsdom environment, Testing
   Library matchers, TypeScript support, `@/*` resolution, and a `pnpm test` script.
2. Risk-based tests cover catalog validation and API envelopes, catalog client
   behavior, critical catalog interactions, theme persistence, and reusable state.
3. User interactions use `@testing-library/user-event`; tests use semantic queries
   and do not assert implementation-only styling or mock internal React components.
4. A repository Markdown guide and dedicated OpenCode unit-testing skill encode the
   approved rules, current project boundaries, commands, and mock policy.
5. The resulting targeted tests pass with `pnpm test -- <relative path>`, and the
   complete suite, lint, and TypeScript checks pass before delivery.

## Epic Structure

### Story 1: Establish the Jest Testing Foundation

Description: add only the configuration and shared setup needed to execute TypeScript
unit and component tests in this Next.js application.

Acceptance criteria:

1. Jest runs through `next/jest` with jsdom and resolves the existing `@/*` alias.
2. `@testing-library/jest-dom` is loaded once for all tests.
3. The dependency set includes `@testing-library/user-event` because interactions
   must not use `fireEvent`.
4. Browser API shims are limited to APIs required by tested code or HeroUI.
5. No TanStack Query dependency or `QueryProviderMock` is introduced because the
   repository does not use TanStack Query.

### Story 2: Publish and Enforce Unit-Test Guidance

Description: add durable instructions for humans and agents creating future tests.
Landing this story before authoring tests ensures the dependency decisions, mock
boundaries, and project-specific rules are captured in one source of truth before
any test code references them.

Acceptance criteria:

1. A repository Markdown file documents test placement, commands, query priorities,
   interaction rules, mock boundaries, typing rules, and known Next/HeroUI concerns.
2. A dedicated OpenCode unit-testing skill references or mirrors the approved guide
   without conflicting duplicate rules.
3. Router support is documented as conditional and provides `push` as `jest.fn()`;
   no nonexistent `__tests__/home.test.tsx` is cited as a repository reference.
4. Query-provider guidance is explicitly conditional on TanStack Query being added
   in future, rather than introducing unused infrastructure now.
5. The guide preserves intentional `it.skip()` and `test.skip()` calls unless a task
   explicitly requests fixing those tests.

### Story 3: Protect Data and API Boundaries

Description: add focused tests around catalog validation, response envelopes,
client fetch handling, Strapi query adapters, and theme cookie persistence.

Acceptance criteria:

1. Catalog parameter validation covers valid defaults and representative invalid
   boundary values for pages, fixed page sizes, IDs, and search terms.
2. Catalog API client tests cover successful data extraction, typed catalog errors,
   and fallback Spanish error copy without real network access.
3. Server data adapter tests verify GraphQL variables and null-data fallbacks using
   response shapes matching the actual implementation.
4. Theme cookie tests verify default retrieval and secure cookie options.
5. External calls are mocked at the network, Apollo client, or Next cookie boundary;
   internal components and pure utilities remain real.

### Story 4: Protect Critical Client Behavior

Description: test the highest-risk state transitions and user-visible catalog and
theme behavior through real component trees where practical. This is sequenced last
because the guidance from Story 2 and the boundaries from Story 3 are its inputs.

Acceptance criteria:

1. Catalog tests cover stacked local filters, clearing filters, catalog-wide mode
   changes, pagination navigation, and opening product details.
2. Catalog search tests cover trimmed input, loading, success, empty results, mapped
   failures, pagination, and reset behavior.
3. Variant drawer tests cover open-triggered fetch, price ordering and formatting,
   and close cleanup.
4. Theme tests cover store updates and persistence-driven theme changes.
5. Tests use semantic Testing Library queries and `userEvent.setup()` interactions.

## Technical Research

### Current Baseline

- `package.json` has no `test` script and no testing dependencies.
- No `*.test.*`, `*.spec.*`, `__tests__`, Jest configuration, or shared test setup
  currently exists.
- The repository uses TypeScript strict mode and includes all `*.ts` and `*.tsx`
  files through `tsconfig.json`.
- The path alias `@/*` maps to `./src/*` and must resolve in tests.
- Node 22 is used in CI.
- The app uses Next.js 15.5.9, React 19.1, HeroUI v3, Apollo Client v4,
  next-themes, Zustand v5, and Tailwind v4.
- TanStack Query is not installed and has no source usage.
- There is no `AppRouterContextProviderMock`, `QueryProviderMock`, or external
  `__tests__/home.test.tsx` in this repository.

### Dependency Fitness

#### Proposed and Fit

- `jest`: fit; requested runner and supported through Next's `next/jest` integration.
- `jest-environment-jsdom`: fit; required for React component and browser-like tests.
- `@types/jest`: fit; required for Jest globals and mock typing in TypeScript tests.
- `@testing-library/react`: fit; renders React components and exposes semantic queries.
- `@testing-library/dom`: fit; an explicit peer used by current Testing Library setup
  and included in Next's official Jest installation list.
- `@testing-library/jest-dom`: fit; supplies accessible DOM matchers and should load
  once from the Jest setup file.

#### Missing but Required by the Guidelines

- `@testing-library/user-event`: required. The supplied rules prohibit `fireEvent`,
  and Testing Library recommends `userEvent.setup()` for realistic interactions.
  The initial dependency list cannot satisfy its own interaction requirement without
  this package.

#### Conditional

- `ts-node`: fit only if `jest.config.ts` is selected. Next's current Jest guide lists
  it and shows a TypeScript config. A JavaScript ESM config can avoid this dependency.
  The implementation phase should choose one configuration format and keep only the
  dependency that format needs.

#### Not Required

- TanStack Query and related test providers are not required. No current production
  code imports `useQuery`, `useMutation`, `QueryClient`, or `QueryClientProvider`.
- A coverage-reporting dependency is not required because Jest can use V8 coverage.
- A separate transformer such as `ts-jest` or Babel is not required; `next/jest`
  configures the Next compiler transform.
- Snapshot-specific packages are not required. Snapshot testing is not a priority
  for behavior-focused coverage.

### Configuration Considerations

- Use `next/jest` so styles, image imports, `next/font`, environment loading, and SWC
  transforms follow Next conventions.
- Use `testEnvironment: "jsdom"` for component tests. Node-only tests can still run
  under jsdom unless measured performance justifies per-file environments later.
- Load `@testing-library/jest-dom` via `setupFilesAfterEnv`.
- Map `^@/(.*)$` to `<rootDir>/src/$1` because the TypeScript alias is not sufficient
  for Jest resolution by itself.
- Test discovery should cover the selected repository convention without matching
  generated `.next` output.
- Keep setup global and minimal. Add `window.matchMedia`, `window.scrollTo`, pointer,
  resize, or observer shims only when a real tested path requires them.
- Do not globally mock `next/image`. `next/jest` handles image imports, while the
  component should remain real where it is rendered.
- Environment-sensitive modules may need isolated module loading because
  `src/app/apollo-client.ts` reads environment variables at module evaluation time.

### Next.js Constraint

The official Next Jest guide states that Jest does not currently support async Server
Components. `src/app/page.tsx` is async and awaits `searchParams`, product data, theme,
categories, and brands. It should not be treated as a normal jsdom component test.
Its page-number normalization and data composition can be covered through extracted
pure behavior only if implementation later makes that behavior independently testable,
or left to a future end-to-end layer. This epic should not refactor the page solely to
increase a coverage number.

### Affected Areas

- Routes/pages: `src/app/page.tsx` is an unsupported async Server Component test target;
  `layout.tsx` and `providers.tsx` are low-value framework composition; test
  `apollo-client.ts` only at its Strapi URI/token boundary.
- API handlers: prioritize `src/app/api/catalog/_utils.ts`, then representative route
  wiring under `src/app/api/catalog/**/route.ts` and theme input handling in
  `src/app/api/preferences/route.ts`. Invoke handlers with real `Request` objects and
  avoid repeating the shared validation matrix in every route.
- Feature UI: prioritize `src/features/Home/{Home.tsx,useCatalogSearch.ts}` and
  `src/features/ProductVariantsDrawer/ProductVariantsDrawer.tsx`; cover ProductListing
  controls and `CatalogSearchDrawer` through integrated behavior where practical.
- Shared product card: cover `src/components/ProductCard.tsx` through listing flows;
  add focused coverage only for explicit zero-value or responsive requirements.
- Shared code: prioritize `src/shared/utils/catalog-api.utils.ts`,
  `src/shared/utils/global.utils.ts`, `src/shared/lib/global.lib.ts`, and
  `src/shared/ui/atoms/ToggleDarkMode.tsx`. Constants, types, and GraphQL ASTs do not
  need direct tests.
- Zustand: test `src/zustand/store/change-theme.store.ts` behavior and provider
  isolation only where useful; preserve the provider-created store pattern.

HeroUI controls use `onPress`, `onAction`, overlays, and portals. Interact through
accessible roles and global `screen` queries rather than render-container internals.

### Risk-Based Coverage Priorities

#### Priority 0: Trust Boundaries

- Catalog validation in `src/app/api/catalog/_utils.ts`.
- Catalog API envelope handling in `src/shared/utils/catalog-api.utils.ts`.
- Representative catalog route wiring and upstream failures.
- Theme preference route input and secure cookie persistence.

These paths validate untrusted URL, environment, network, and cookie inputs. A small
number of table-driven cases can cover meaningful boundaries without duplicating tests.

#### Priority 1: Stateful Catalog Flows

- Stacked local name/category/brand filtering in `Home`.
- Mutually exclusive catalog-wide name/category/brand modes.
- Clearing local versus catalog-wide state.
- Router pagination and `window.scrollTo`.
- Wide-search pagination based on the current mode.
- Product selection and variant drawer opening.
- Catalog search hook loading, errors, empty results, and resets.

#### Priority 2: Data Adapters and Persistence

- GraphQL operation variables and response fallbacks in `global.lib.ts`.
- Variant fetch mapping and sort behavior.
- Theme store and theme-cookie interactions.
- Currency formatting at representative numeric boundaries.

#### Deferred Direct Coverage

- Static constants and TypeScript-only types.
- Tailwind classes, colors, fonts, spacing, responsive layout, and visual appearance.
- HeroUI's own focus, keyboard, portal, and accessibility implementation.
- Root provider pass-through behavior.
- GraphQL document snapshots.
- Async Server Component rendering.
- Exhaustive prop combinations with identical user-visible outcomes.

### Mock Policy for This Repository

#### Mock

- Strapi/Apollo network access at `createApolloClient` or its query method.
- Global `fetch` for internal catalog and preference API calls.
- `next/headers` cookies for server cookie tests.
- `next/navigation` only where router behavior is under test.
- Browser APIs absent from jsdom when a tested path needs them, including
  `matchMedia` and `scrollTo`.
- Third-party hooks with side effects only when using the real provider would obscure
  application behavior; prefer real HeroUI rendering first.

#### Do Not Mock

- Internal React components under `src/features`, `src/shared`, or `src/components`.
- Pure utilities and constants.
- `next/image` as a project-level manual mock.
- Child components merely to avoid rendering their internals.
- CSS classes or visual output.

Mocks must use explicit types matching the real return values. Before mocking a
function, tests must read its implementation and reproduce its exact response shape.
No `any` or `unknown` should be introduced in test code. Existing code assertions do
not establish a precedent for loosely typed new tests.

When `jest.mock()` targets a custom hook or internal module because no cleaner external
boundary exists, the supplied guideline requires a relative path rather than `@/`.
This should remain exceptional; testing the real component tree is preferred.

### Router Guidance

`Home.tsx` is the only current direct user of `useRouter`; it calls `push` for page
changes. If real rendering produces `invariant expected app router to be mounted`, a
minimal App Router context wrapper is appropriate. Its router object must expose
`push` as `jest.fn()` and only the additional members required by Next's current
context type.

There is no repository `__tests__/home.test.tsx` to copy. The future guide should point
to the shared wrapper created by Story 1 or describe the minimal local setup. It should
not claim a nonexistent file is authoritative.

### Query Provider Guidance

No current component uses TanStack Query. A `QueryProviderMock`, `QueryClient`, or
TanStack dependency would be unused scaffolding and should not be added. The future
guide may retain one conditional sentence: if production code later adopts TanStack
Query and a test reports `No QueryClient set`, render through the production-equivalent
provider with a fresh client per test. That future concern does not belong in current
shared setup.

### Test Authoring Rules to Preserve

- Use `userEvent.setup()` and await interactions; do not use `fireEvent`.
- Query by role, accessible name, label, visible text, or test ID as a last resort.
- Do not use `document.querySelector()` or `document.getElementById()`.
- Do not assert classes with `toHaveClass()` except for a separately approved critical
  behavioral contract.
- Do not test colors, fonts, positioning, spacing, or visual layout.
- Do not duplicate tests whose only difference is a styling prop.
- Do not include source file extensions in imports.
- Preserve existing `it.skip()` and `test.skip()` unless explicitly tasked to fix them.
- Invalid email examples must contain `@`; no current feature accepts email, so this is
  future guidance rather than current coverage.
- Mocks should use named exports rather than default exports when the mocked module's
  real contract is named. Mocks must still match the real module export shape.
- Prefer behavior assertions over internal state, hook call counts, or component props.

### Existing Patterns to Follow

- Preserve the App Router server/client split and do not import `"use server"` modules
  into client tests as production client dependencies.
- Preserve route handlers as thin wrappers over `src/shared/lib/global.lib.ts`.
- Preserve per-call Apollo clients from `src/app/apollo-client.ts`.
- Preserve HeroUI compound components and test through accessible interactions.
- Preserve Tailwind v4 and class-based next-themes behavior without styling assertions.
- Preserve the Zustand provider-wraps-store pattern and verify behavior through public
  selectors and actions.
- Preserve Spanish UI and error copy in user-visible assertions.

### Dependencies and Integration Points

- New dev dependencies require both `package.json` and `pnpm-lock.yaml` changes.
- Package management must use pnpm.
- `STRAPI_HOST` and `STRAPI_API_TOKEN` are production integration points; tests must not
  contact Strapi or depend on developer `.env.local` values.
- Next's Jest integration can load environment files. Tests should set and restore only
  variables needed by each scenario to avoid local-environment coupling.
- Prompt synchronization uses `pnpm sync:prompts`, but creating a skill does not require
  editing `.opencode/command/research.md`.
- The skill belongs under the repository's established OpenCode configuration area;
  its exact registration pattern must be confirmed during implementation because no
  project-local skill files are currently visible in the ordinary file inventory.

### Verification Rules

During implementation, use:

- `pnpm test -- <relative path>` while iterating on a specific test file.
- `pnpm test` for the full suite.
- `pnpm lint` for source and test lint rules.
- `pnpm exec tsc --noEmit` for standalone TypeScript verification.
- `pnpm build` for final Next production compatibility when environment requirements
  are satisfied.

Research itself must not run tests, builds, installs, or mutate package files. None were
run during this phase.

CI currently validates PR labels and release behavior but does not run lint, build, or
tests. Whether the test suite becomes a required GitHub Actions check is not specified
and remains an open verification decision.

### Edge Cases and Constraints

- Catalog product pages are intentionally limited to 1 through 5.
- Product page size is fixed at 50; variant page size is fixed at 100.
- Catalog-wide filtered pagination infers another page when exactly 50 results return.
- Search terms are trimmed, capped at 100 characters, and allowlisted for Unicode
  letters/numbers plus selected punctuation.
- Current integer parsing accepts numeric prefixes such as `1abc`; tests should first
  capture the intended contract rather than silently bless or change this behavior.
- Category and brand lists used for API validation come from live Strapi taxonomy.
- Category and brand server helpers currently swallow Apollo errors and return
  `undefined`; route behavior around this case needs an explicit expected contract.
- Local search filters only the current working set; catalog-wide search calls the API.
- Only one catalog-wide mode is active at a time, while local filters stack.
- Theme defaults differ: next-themes defaults to dark while cookie retrieval defaults
  to light when the cookie is absent.
- Product image support is unfinished and should remain outside this testing epic.
- HeroUI overlays may render in portals and require jsdom browser API shims.
- Tests must not rely on the order of unrelated asynchronous state updates.
- No GraphQL schema or pagination metadata exists in the repository.

## Non-Obvious Findings

- The supplied dependency list is copied exactly by the current official Next Jest
  guide, but it is incomplete for this project's stricter user-event-only rule.
- Async Server Components remain outside Jest's supported direct rendering model.
- `AppRouterContextProviderMock` and `QueryProviderMock` are external concepts, not
  existing project assets.
- TanStack Query guidance is inapplicable to current production code.
- Risk-based coverage yields more value by testing `_utils.ts` once and route wiring
  selectively than by repeating validation matrices across seven routes.
- No broadly useful verified architecture fact beyond testing scope was added to
  `REPO_CONTEXT.md`; that file should be updated after the testing foundation actually
  exists, not during research.

## Open Questions

### Testing Scope

I: Question: Should route coverage include every catalog route or one representative
route per distinct behavior pattern?
Status: pending
Context: Shared validation is centralized in `_utils.ts`; testing every route for every
invalid parameter would duplicate expectations.

II: Question: Should current numeric-prefix parsing such as `page=1abc` be accepted as
existing behavior or treated as invalid input?
Status: pending
Context: Both catalog validation and `src/app/page.tsx` use `Number.parseInt`.

### Data and Strapi Contract

I: Question: When category or brand Apollo calls fail, should the route return a
`CAT_ERR_001` failure or a successful empty product list?
Status: pending
Context: `fetchProductsByCategory` and `fetchProductsByBrand` catch errors and return
`undefined`, unlike the other server adapters.

II: Question: Are query document and variable assertions sufficient for the Strapi
adapter, given that no schema fixture is available?
Status: pending

### UI and Product Decisions

I: Question: Are zero-valued product prices and variant counts expected to be visible?
Status: pending
Context: `ProductCard` currently hides zero values through truthiness checks; tests
should not define a product rule accidentally.

II: Question: Should catalog category/brand failures remain console-only, or is visible
error feedback required before those flows receive UI tests?
Status: pending

III: Question: Should tests cover responsive `useMediaQuery` branches even though the
hook intentionally does not subscribe to viewport changes?
Status: pending

### Theme and Persistence

I: Question: Which absent-preference default is authoritative: next-themes dark or the
cookie helper's light default?
Status: pending
Context: Tests can preserve current behavior, but they cannot resolve the product-level
inconsistency.

II: Question: Should `/api/preferences` reject values other than `light` and `dark`?
Status: pending
Context: The current route and cookie helper accept a string without a documented
runtime allowlist.

### Test Infrastructure

I: Question: Should Jest configuration use TypeScript and retain `ts-node`, or use an
ESM JavaScript config and omit `ts-node`?
Status: pending
Context: Both are viable; the smallest dependency set favors JavaScript configuration,
while the supplied and official Next list assumes TypeScript configuration.

II: Question: Should tests be co-located with source files or stored under a root
`__tests__` directory?
Status: pending

III: Question: What filename should hold the repository unit-testing guide?
Status: pending
Context: No testing-doc convention currently exists.

IV: Question: Should the OpenCode skill contain the full rules or remain a short entry
point that instructs agents to load the Markdown guide?
Status: pending
Context: A short skill avoids two sources of truth.

### Verification and CI

I: Question: Should `pnpm test` run once or in watch mode by default?
Status: pending
Context: A single-run default is more predictable for CI and agents; a separate watch
script can be added only if developers request it.

II: Question: Should this epic add a GitHub Actions test job, or is local verification
sufficient for the initial foundation?
Status: pending
Context: Current workflows only enforce release labels and post-merge release tasks.

III: Question: Is a coverage report desired without enforcing a percentage threshold?
Status: pending
Context: Risk-based coverage was selected; percentages can incentivize low-value tests.

## Answered Questions

### Scope and Complexity

I: Question: Should this use quick or full research?
Status: answered
Answer: Full epic research.

II: Question: Is this single-feature or cross-feature work?
Status: answered
Answer: Cross-cutting epic spanning infrastructure, API/data boundaries, client
features, theme state, documentation, and agent guidance.

III: Question: What coverage strategy should define “dev work so far”?
Status: answered
Answer: Risk-based coverage rather than all modules or a percentage threshold.

IV: Question: Should reusable guidance be Markdown, a skill, or both?
Status: answered
Answer: Both a Markdown guide and a dedicated OpenCode unit-testing skill.

V: Question: How should missing router/query-provider references be treated?
Status: answered
Answer: Adapt only when applicable. Add minimal router support for current Next usage;
do not add TanStack Query infrastructure unless production adopts it.

## Assumptions

- Jest is required rather than Vitest because the requested dependencies explicitly
  select Jest and Next provides first-party configuration support.
- Risk-based coverage does not require every presentational component to have a direct
  test file.
- The testing guide and skill are implementation deliverables, not files to create in
  this research phase.
- No production behavior should be changed merely to make a test pass; discovered bugs
  require explicit acceptance decisions or separate fixes.
- Existing internal components will render as part of integration-oriented component
  tests rather than being replaced with project-local mocks.
- Network, cookie, router, and unavailable browser APIs remain valid mock boundaries.
- A future implementation may add small shared test helpers only after repeated use
  demonstrates a need.

## External References

- Next.js, “How to set up Jest with Next.js”:
  https://nextjs.org/docs/app/guides/testing/jest
- Testing Library, “User Event Introduction”:
  https://testing-library.com/docs/user-event/intro/

## Research Outcome

The epic is feasible with the current stack. The proposed dependencies are generally
fit, with one required addition (`@testing-library/user-event`) and one conditional
dependency (`ts-node`). The shortest reliable path is a minimal `next/jest` foundation,
focused boundary and state tests, no TanStack Query scaffolding, no internal component
mocks, and one Markdown guide used as the source of truth by a small dedicated skill.
