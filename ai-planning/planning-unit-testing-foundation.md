# Plan: Establish the Jest Testing Foundation

## Header

- **Story:** Establish the Jest Testing Foundation
- **Source research:** [`ai-research/unit-testing-foundation.story.md`](../ai-research/unit-testing-foundation.story.md)
- **Research sign-off:** Confirmed by the user on 2026-07-12
- **Plan status:** Awaiting implementation sign-off
- **Assumptions:**
  - The answered decisions at the end of the story research are part of the signed-off scope, including the shared render helper, `matchMedia` shim, coverage output, watch script, and CI workflow.
  - `src/features/ProductListing/SearchInput.tsx` remains unchanged and is the component proof target.
  - `src/shared/utils/global.utils.ts#formatNumberToCurrency` remains unchanged and is the unit proof target for TypeScript execution and `@/*` alias resolution.
  - `STRAPI_HOST` and `STRAPI_API_TOKEN` are not needed because no test imports or executes Apollo/Strapi code.

## Acceptance Criteria

1. Jest runs through `next/jest` with `jsdom` and resolves the existing `@/*` alias.
2. `@testing-library/jest-dom` is loaded once for all tests.
3. The dependency set includes `@testing-library/user-event` because interactions must not use `fireEvent`.
4. Browser API shims are limited to APIs required by tested code or HeroUI.
5. No TanStack Query dependency or `QueryProviderMock` is introduced because the repository does not use TanStack Query.

## Affected Files

### Root Config And Dependencies

- `package.json` - modify scripts and development dependencies.
- `pnpm-lock.yaml` - modify through pnpm when adding the approved development dependencies.
- `jest.config.ts` - create the Next/Jest configuration.
- `jest.setup.ts` - create the single shared test setup.

### Tests

- `__tests__/test-utils.tsx` - create the minimal shared render helper approved by research.
- `__tests__/product-listing/SearchInput.test.tsx` - create the component proof test.
- `__tests__/shared/global.utils.test.ts` - create the TypeScript/alias proof test.

### CI

- `.github/workflows/test.yml` - create the approved Node 22 test workflow.

### Production Source

- No files under `src/app/**`, `src/app/api/**`, `src/features/**`, `src/components/**`, `src/shared/**`, or `src/zustand/**` are changed.

## Phase 1: Add The Minimal Jest Foundation

### Changes Required

#### `package.json`

- **Action:** Modify `scripts` and `devDependencies`.
- Add `test` as the one-shot Jest command with coverage output.
- Add `test:watch` as the separate watch command without making watch mode the default.
- Add only these development dependencies:
  - `jest`
  - `jest-environment-jsdom`
  - `@types/jest`
  - `@testing-library/react`
  - `@testing-library/dom`
  - `@testing-library/jest-dom`
  - `@testing-library/user-event`
  - `ts-node`
- Do not add `ts-jest`, Babel transforms, TanStack Query packages, network-mocking packages, snapshot packages, or coverage service packages.
- Do not change the package version; the develop merge workflow owns version bumps.

#### `pnpm-lock.yaml`

- **Action:** Modify via the pnpm dependency-add operation used during implementation.
- Lock exactly the development dependencies added to `package.json` and their transitive dependencies.
- Preserve pnpm lockfile version 9 and the existing importer.

#### `jest.config.ts`

- **Action:** Create.
- Import and invoke `next/jest` with `dir: "./"`, then export the generated Jest configuration.
- Set `testEnvironment: "jsdom"`.
- Set `setupFilesAfterEnv` to the root `jest.setup.ts` file.
- Map `^@/(.*)$` to `<rootDir>/src/$1` so Jest mirrors `tsconfig.json`.
- Limit discovery to tests under the root `__tests__` directory.
- Enable coverage output without a threshold; do not add speculative transforms or module mocks.
- Let `next/jest` handle Next/SWC, styles, and font behavior rather than adding `ts-jest` or Babel.

#### `jest.setup.ts`

- **Action:** Create.
- Import `@testing-library/jest-dom` once so all suites receive its matchers.
- Define only a configurable `window.matchMedia` shim, matching the signed-off mobile-test decision and returning a standards-shaped object with listener methods required by consumers.
- Do not add `scrollTo`, `ResizeObserver`, `IntersectionObserver`, pointer-event, `fetch`, router, `next/image`, Apollo, or GraphQL globals until a real test requires one.

#### `__tests__/test-utils.tsx`

- **Action:** Create.
- Export a custom `render(ui, options?)` that delegates to Testing Library and wraps the UI with the existing `Providers` component from `@/app/providers`.
- Re-export Testing Library's public query utilities so component tests use one import point.
- Keep this helper limited to rendering; do not add router, theme, Zustand, Apollo, or query-client providers.
- The current production `Providers` component is pass-through, but using it preserves the explicitly approved app-provider seam without changing production code.

### Success Criteria

**Automated**

- `pnpm test` starts Jest once, uses jsdom, loads the shared setup, emits coverage, and exits.
- `pnpm exec tsc --noEmit` accepts the TypeScript Jest config, setup, helper, and Jest globals.
- `pnpm lint` accepts all new configuration and test files.

**Manual**

- Inspect `package.json` and `pnpm-lock.yaml` to confirm all testing packages are development-only.
- Confirm no TanStack Query package, `QueryProviderMock`, custom transformer, or unrelated browser shim was added.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `package.json`, `pnpm-lock.yaml` | Approved scripts and minimal dev dependency set | dependency diff + `pnpm test` |
| `jest.config.ts` | `next/jest`, jsdom, alias mapping, setup loading, root test discovery, coverage without threshold | `pnpm test` + `pnpm exec tsc --noEmit` |
| `jest.setup.ts` | Global `jest-dom`; only approved `matchMedia` browser shim | proof tests + source inspection |
| `__tests__/test-utils.tsx` | Existing app provider seam and Testing Library render/query exports | SearchInput proof test + `pnpm lint` |

## Phase 2: Add Focused Foundation Proof Tests

### Changes Required

#### `__tests__/product-listing/SearchInput.test.tsx`

- **Action:** Create.
- Import `SearchInput` through `@/features/ProductListing/SearchInput` to exercise alias resolution on a real client component.
- Render through `__tests__/test-utils.tsx` with a controlled value and a Jest callback.
- Query the input by its accessible Spanish label, proving HeroUI renders in jsdom and `jest-dom` matchers are available.
- Use `userEvent.setup()` and `user.type(...)`; assert the callback receives interaction updates without using `fireEvent`.
- Keep the test focused on render/accessibility and typing. Do not test Home, routing, fetch, overlays, filtering behavior, or responsive layout.

#### `__tests__/shared/global.utils.test.ts`

- **Action:** Create.
- Import `formatNumberToCurrency` through `@/shared/utils/global.utils`.
- Assert one stable currency-formatting result, proving TypeScript test execution and alias mapping without network or environment setup.
- Do not test `saveThemeApi`; fetch behavior and theme persistence are outside this story.

### Success Criteria

**Automated**

- `pnpm test` passes both proof suites and emits a coverage report without enforcing a percentage.
- `pnpm exec tsc --noEmit` passes with test imports and Jest matcher types.
- `pnpm lint` passes without disabling rules for the tests.
- `pnpm build` passes, confirming the new tooling does not affect the production Next build.

**Manual**

- Review the test run to confirm both `SearchInput` and `global.utils` suites are discovered from root `__tests__`.
- Confirm the component proof uses an accessible query and `userEvent`, with no `fireEvent` import.
- Confirm the proof suite does not require Strapi environment variables or network access.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `__tests__/product-listing/SearchInput.test.tsx` | jsdom render, HeroUI compatibility, accessible query, global `jest-dom`, `user-event`, alias import | `pnpm test` |
| `__tests__/shared/global.utils.test.ts` | TypeScript execution, stable pure-function assertion, alias import | `pnpm test` |
| Existing production app | Test tooling introduces no production behavior regression | `pnpm build` |

## Phase 3: Run The Foundation In CI

### Changes Required

#### `.github/workflows/test.yml`

- **Action:** Create.
- Trigger on pull requests and pushes to `develop`, matching the signed-off research wording of pull requests and merges to develop.
- Use one Ubuntu job with Node 22 and pnpm.
- Check out the repository, configure Node 22, enable pnpm through Corepack without introducing a package-manager version change, and run `pnpm install --frozen-lockfile`.
- Run `pnpm lint` and `pnpm test --coverage` as explicitly approved by research.
- Upload the generated coverage directory as an artifact, including an explicit behavior for a missing artifact so a silently absent report cannot look successful.
- Do not duplicate PR label enforcement, release versioning, tagging, or changelog behavior from existing workflows.

### Success Criteria

**Automated**

- GitHub Actions validates the workflow when pushed and runs install, lint, and Jest successfully on a pull request.
- The workflow run publishes the Jest coverage artifact.
- Local implementation verification remains `pnpm test`, `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build`; do not attempt to execute GitHub Actions locally unless existing tooling is later added.

**Manual**

- Inspect the workflow trigger to confirm pull requests and pushes to `develop` are covered.
- Inspect a completed workflow run to confirm Node 22, frozen-lockfile installation, lint, tests, and the coverage artifact.
- Confirm `.github/workflows/check-label.yml` and `.github/workflows/develop-pipeline.yml` remain unchanged.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `.github/workflows/test.yml` | PR/develop triggers, Node 22, pnpm frozen install, lint, test coverage, artifact upload | GitHub Actions run + workflow inspection |
| Existing release workflows | No duplicated label or release responsibilities | git diff inspection |

## Cross-Cutting Concerns

- **Server/client boundary:** Test the synchronous client component directly; do not import or render async App Router Server Components.
- **HeroUI/jsdom:** Use the smallest HeroUI input surface. Add no overlay, observer, pointer, or image mocks unless this proof test actually fails and demonstrates the requirement.
- **Browser APIs:** `matchMedia` is the only approved global shim. Fetch remains per-suite mock territory for later stories.
- **Environment:** The proof tests must run without `STRAPI_HOST`, `STRAPI_API_TOKEN`, Apollo, GraphQL, or backend access.
- **Coverage:** Generate reports locally and in CI, but configure no percentage threshold.
- **Package management:** Use pnpm only and commit the resulting lockfile change.

## Open Questions

None. Every research question is answered or deferred to a later story.

## Out Of Scope

- Broad component, catalog route, App Router page, theme, Zustand, Apollo, GraphQL, or Strapi test coverage.
- Testing async Server Components with Jest.
- Production refactors or behavior changes made only for testability.
- Coverage thresholds or snapshot testing.
- TanStack Query, `QueryProviderMock`, router mocks, network-mocking dependencies, and a general test framework abstraction.
- Browser shims beyond `matchMedia`; overlay/dropdown shims remain deferred to the later story identified by research.
- Changes to existing label, release, version, tag, or changelog automation.
- Unit-testing documentation, OpenCode skills, or prompt changes from the broader epic; this story's accepted scope is the executable foundation and CI wiring only.

## Decisions Beyond The Acceptance Criteria

- Include a minimal app render helper because the signed-off story research explicitly answered yes, despite the broader epic's earlier rule to wait for repeated use. The story-level answer takes precedence and the helper stays provider-only.
- Include `matchMedia` as the sole global shim because the signed-off research explicitly requires it for mobile-aware tests; no additional shim is inferred from HeroUI.
- Include CI coverage execution because the signed-off research explicitly answered yes, while keeping release and label workflows separate.
- Use two proof tests rather than one: the component test proves jsdom, HeroUI, `jest-dom`, and `user-event`; the pure test isolates TypeScript and alias resolution at negligible scope.

## Plan deviation notes

### Phase 2 deviation

The plan said to "preserve `next.config.ts`" and not add "speculative transforms or module mocks". Two changes were required for the foundation to work because `@heroui/react` v3 is ESM-only and uses a strict `exports` field with only an `import` entry (no `default`/`require`).

1. `next.config.ts`: added `transpilePackages` for the HeroUI + React-Aria + Radix + Framer-Motion + tailwind-variants + input-otp + `@jridgewell/*` + `@cspotcode/*` ecosystem. Without this, SWC ignores ESM in `node_modules` and Jest fails with `SyntaxError: Unexpected token 'export'` on `.mjs` files like `@jridgewell/sourcemap-codec`. The plan's preserve rule assumed a CJS HeroUI; v3 is ESM-only.
2. `jest.config.ts`: added `testEnvironmentOptions.customExportConditions: ["node", "node-addons"]` and a `moduleNameMapper` entry mapping `^@heroui/react$` to its `dist/index.js` file. The package's `exports['.']` has only `import` and `types` (no `default`/`require`), so Jest's CJS resolver cannot find it via package-name lookup — the file-path mapping bypasses the `exports` field and lets the SWC transform handle the ESM.

Two supporting touches outside the plan's explicit change list:

- `tsconfig.json`: added `"@__tests__/*": ["./__tests__/*"]` to `paths` so TypeScript can resolve the test helper the same way Jest does. Without this, `pnpm exec tsc --noEmit` fails on the proof test even though the test passes.
- `eslint.config.mjs`: added `coverage/**` to `ignores`. The generated coverage report tripped a false `no-unused-vars` warning on a third-party `block-navigation.js` chunk.
