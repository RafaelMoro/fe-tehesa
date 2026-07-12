# Story 2 Research: Publish and Enforce Unit-Test Guidance

## Research Mode

- Mode: full research.
- Scope: single cross-cutting documentation/tooling story.
- Parent epic: `ai-research/unit-testing.epic.md`.
- Prerequisite: Story 1 testing foundation is implemented successfully.
- Research date: 2026-07-12.

## Story Definition

### Title

Publish and enforce unit-test guidance.

### Description

Create one canonical repository guide for authoring and repairing Jest tests, then
make that guide available through an OpenCode `unit-test` skill and `/unit-test`
command. Correct existing agent and workflow documentation that still claims no test
framework exists, so all execution paths agree with the implemented Story 1 setup.

The command supports both creating tests and diagnosing/fixing failing tests. It may
update production code when a failing test exposes behavior that the approved task
requires, but it must not weaken assertions or change unrelated behavior merely to
make a test pass.

### Acceptance Criteria

1. `docs/UNIT_TESTING_GUIDELINES.md` is the canonical source for test placement,
   commands, query/interaction rules, mock boundaries, typing, Next.js/HeroUI
   constraints, skipped tests, and verification.
2. `.opencode/skills/unit-test/SKILL.md` is a valid, discoverable, thin skill that
   loads the canonical guide and directs create/fix requests to `/unit-test`.
3. `.opencode/command/unit-test.md` defines a create-and-fix testing workflow and is
   synchronized byte-for-byte to `.github/prompts/unit-test.prompt.md`.
4. Existing `research`, `plan`, and `implement` commands and generated prompts no
   longer claim Jest is absent and load or reference the testing guide when test work
   is in scope.
5. `AGENTS.md`, `REPO_CONTEXT.md`, and prompt-sync documentation accurately describe
   the implemented Jest setup and `/unit-test` workflow without duplicating the full
   canonical rules.

## Scope

### In Scope

- Canonical unit-testing guidelines.
- New OpenCode skill and command named `unit-test`.
- New generated GitHub prompt.
- Prompt-sync mapping for the new command.
- Removal of stale no-test-framework claims from active repository instructions.
- Concise references to the canonical guide from existing workflows.
- Documentation verification and prompt byte-equivalence checks.

### Out of Scope

- Adding application or route tests; Stories 3 and 4 own test coverage.
- Changing Jest dependencies, transforms, aliases, setup, or coverage behavior.
- Changing production behavior identified by the epic.
- Adding TanStack Query or a `QueryProviderMock`.
- Creating the future Strapi fixture layer.
- Rewriting historical research documents that accurately describe their past state.
- Enforcing a coverage threshold.

## Implemented Story 1 Baseline

The new guidance must describe the current files, not the parent epic's earlier
proposal:

- `package.json`: `pnpm test` runs `jest --coverage`; `pnpm test:watch` runs
  `jest --watch`.
- `jest.config.ts`: uses `next/jest.js`, jsdom, root `__tests__` discovery, V8-style
  Jest coverage collection across `src/**/*.{ts,tsx}`, and no threshold.
- `jest.setup.ts`: loads `@testing-library/jest-dom`; the only global browser shim is
  `window.matchMedia`.
- `__tests__/test-utils.tsx`: re-exports Testing Library, exports `userEvent`, and
  wraps the custom render with the real `Providers` component.
- `tsconfig.json`: resolves `@/*` and `@__tests__/*`.
- `jest.config.ts`: maps `@heroui/react` directly to its ESM distribution.
- `next.config.ts`: transpiles the HeroUI/React-Aria dependency graph needed by Jest.
- `.github/workflows/test.yml`: runs lint and tests on pull requests and pushes to
  `develop`, then uploads `coverage/`.
- `.gitignore` and `eslint.config.mjs`: explicitly ignore generated coverage output.

## Technical Research

### Canonical Guide

`docs/UNIT_TESTING_GUIDELINES.md` should follow the concise, rule-oriented structure
of `docs/IMPLEMENTATION_GUIDELINES.md`. It is the only full copy of the rules; commands,
skills, `AGENTS.md`, and `REPO_CONTEXT.md` link to it rather than repeating it.

Required sections:

- Current stack and commands.
- Root `__tests__/` placement and `@__tests__/*` imports.
- Required use of `__tests__/test-utils.tsx` for component rendering and `userEvent`.
- Semantic query order: role/accessibility first, test ID last.
- User interaction rule: `userEvent.setup()` and awaited actions; no `fireEvent`.
- Prohibited direct DOM selectors and visual/style assertions.
- Mock policy and response-shape typing.
- Next App Router handling.
- HeroUI ESM, overlay, portal, and browser-API constraints.
- Async Server Component limitation.
- Conditional TanStack Query guidance.
- Skipped-test preservation.
- Targeted and full verification commands.
- Scope rule for fixing production code versus weakening tests.

### Test Placement

- All executable tests live under root `__tests__/`, next to `src/`.
- Tests use `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx`.
- Component tests import `render`, `screen`, and `userEvent` from
  `@__tests__/test-utils`.
- Route coverage in Story 3 will use per-route folders under
  `__tests__/catalog/<route>/`.
- Shared helpers beyond current `test-utils.tsx` should be introduced only after two
  tests demonstrate the same need.

### Interaction and Query Rules

- Instantiate `const user = userEvent.setup()` inside each interaction test.
- Await user actions.
- Do not import or use `fireEvent`.
- Prefer `getByRole`/`findByRole`, accessible names, labels, and visible text.
- Use `getByTestId` only when no stable semantic query exists.
- Do not use `document.querySelector()` or `document.getElementById()`.
- Do not assert Tailwind classes, CSS values, colors, fonts, spacing, or layout.
- Test distinct behavior rather than styling variants with identical expectations.

### Mock Boundaries

Mock only external or unavailable boundaries:

- Network requests and global `fetch`.
- Apollo client/Strapi calls.
- `next/headers` cookies.
- `next/navigation` router behavior.
- Browser APIs absent from jsdom.
- Third-party hooks with complex side effects only when the real boundary is
  impractical.

Keep real:

- Internal components under `@/features`, `@/shared`, and `@/components`.
- Pure utilities and constants.
- `next/image`; do not add a project-level manual mock.
- HeroUI components when jsdom can render the behavior under test.

Mocks must use explicit types and match the real function's exact export and response
shape. New test code must not introduce `any` or `unknown`. If `jest.mock()` must target
an internal custom hook, use the relative path required by the approved epic guidance
and document why the external boundary could not be used.

### Router Guidance

Router setup is conditional. When a component using `useRouter` fails with
`invariant expected app router to be mounted`, provide the smallest App Router context
wrapper needed by that test. Its `push` member must be `jest.fn()` so navigation is
assertable. Do not cite `__tests__/home.test.tsx`; that file does not exist.

### Query Provider Guidance

TanStack Query is not installed. Do not add `QueryClient`, `QueryClientProvider`, or
`QueryProviderMock`. The guide may state that if production later adopts TanStack Query
and tests report `No QueryClient set`, use a fresh production-equivalent client/provider
per test. This is conditional documentation, not current infrastructure.

### Next.js and HeroUI Constraints

- Jest does not directly render async Server Components such as `src/app/page.tsx`.
  Test extracted synchronous behavior or defer the composition path to future E2E
  coverage; do not refactor solely for coverage.
- HeroUI v3 is ESM-only. Preserve the implemented direct module mapping and
  `transpilePackages` list; test authors should not add alternate mocks to bypass it.
- HeroUI overlays can portal outside the render container. Query through global
  `screen` and interact through roles/accessibility names.
- `matchMedia` is globally available. Add `scrollTo`, observer, pointer, or other
  browser APIs locally only when a tested path requires them.

### Skipped Tests

Preserve existing `it.skip()` and `test.skip()` calls. The `/unit-test` workflow must
not remove or enable them unless the user explicitly requests those specific tests.
New skips should not be used to claim a failing task is complete.

### Unit-Test Skill

Create `.opencode/skills/unit-test/SKILL.md` with valid frontmatter:

- `name: unit-test`.
- A third-person description that triggers on creating tests, unit tests, Jest,
  Testing Library, fixing failing tests, and coverage.
- A short body directing the agent to run `/unit-test` and read
  `docs/UNIT_TESTING_GUIDELINES.md` before edits.
- A reminder to use the implemented test utilities and preserve the no-internal-mock
  policy.

The skill must remain thin. Copying the entire guide into `SKILL.md` creates two sources
of truth and is explicitly avoided.

### Unit-Test Command

Create `.opencode/command/unit-test.md` with frontmatter description and a workflow that:

1. Parses `$ARGUMENTS` and conversation context for requested behavior, source paths,
   test paths, or failure output.
2. Reads `docs/UNIT_TESTING_GUIDELINES.md`, `docs/IMPLEMENTATION_GUIDELINES.md`,
   `REPO_CONTEXT.md`, `AGENTS.md`, `package.json`, and relevant source/tests.
3. Checks story quality and asks for ambiguous expected behavior rather than encoding
   assumptions in assertions.
4. Traces the production behavior and all callers before writing a bug-regression test.
5. Writes the smallest behavior-focused test under root `__tests__/`.
6. Uses real internal components and mocks only approved boundaries.
7. Runs `pnpm test -- <relative path>`, fixes failures, then runs `pnpm test`, lint,
   and TypeScript checks when relevant.
8. May update affected source when the requested contract requires it, but never
   weakens a correct test merely to pass.
9. Reports exact files, tests, source fixes, commands, and remaining skips/failures.

The command should not require a planning document. It is an execution workflow for a
specific testing request, unlike `/implement`, but it still must ask when expected
behavior is unclear.

### Prompt Synchronization

`scripts/sync-opencode-commands.mjs` currently hardcodes three mappings. Add:

- `unit-test.md` -> `unit-test.prompt.md`.

Run `pnpm sync:prompts` after editing any command. Generated files under
`.github/prompts/` must not be edited directly. Verify the new source and generated
prompt are byte-identical.

### Existing Workflow Corrections

Update these source commands, then regenerate their prompts:

- `.opencode/command/research.md`.
- `.opencode/command/plan.md`.
- `.opencode/command/implement.md`.

Required corrections:

- Remove claims that no test framework or `pnpm test` script exists.
- Remove “do not assume Jest” language.
- Document `pnpm test -- <relative path>` and `pnpm test` as valid verification.
- Require loading `docs/UNIT_TESTING_GUIDELINES.md` when research, planning, or
  implementation includes tests.
- Preserve each workflow's existing phase boundaries and responsibilities.

Regenerate:

- `.github/prompts/research.prompt.md`.
- `.github/prompts/plan.prompt.md`.
- `.github/prompts/implement.prompt.md`.
- `.github/prompts/unit-test.prompt.md`.

### Shared Documentation Corrections

- `AGENTS.md`: replace the stale no-tests statement with the real test commands,
  root placement, and canonical guide reference.
- `REPO_CONTEXT.md`: add the guide/skill/command paths; correct prompt-sync target for
  `implement.prompt.md`; state that `coverage/` is explicitly gitignored; describe CI
  as pull requests plus pushes to `develop`.
- Do not rewrite historical research notes whose old baseline was accurate when written.

## Affected Files

### Add

- `docs/UNIT_TESTING_GUIDELINES.md`.
- `.opencode/skills/unit-test/SKILL.md`.
- `.opencode/command/unit-test.md`.
- `.github/prompts/unit-test.prompt.md` (generated).

### Modify

- `scripts/sync-opencode-commands.mjs`.
- `.opencode/command/research.md`.
- `.opencode/command/plan.md`.
- `.opencode/command/implement.md`.
- `.github/prompts/research.prompt.md` (generated).
- `.github/prompts/plan.prompt.md` (generated).
- `.github/prompts/implement.prompt.md` (generated).
- `AGENTS.md`.
- `REPO_CONTEXT.md`.

### Do Not Modify

- Jest configuration, setup, package dependencies, lockfile, or CI workflow.
- Source application behavior.
- Existing tests except if documentation examples reveal a verified factual error;
  no such error was found during research.

## Verification

Story 2 changes documentation and agent workflows, so verification is:

- Run `pnpm sync:prompts`.
- Compare each command with its generated prompt; all four pairs must be byte-identical.
- Run `pnpm lint` because Markdown changes are not linted, but the sync-script edit is.
- Run `pnpm exec tsc --noEmit` only if TypeScript files change; none are planned.
- Run `pnpm test` to ensure documentation/tooling changes did not disturb the
  implemented foundation.
- Do not run `pnpm build`; no application or Next configuration changes are planned.
- Restart OpenCode after adding the skill/command because config-time files are not
  hot-reloaded.

## Edge Cases and Constraints

- The new command must not conflict with `/implement`: `/unit-test` handles focused
  create/fix test requests without requiring a plan; `/implement` remains plan-driven.
- The command must not auto-enable skipped tests.
- Targeted `pnpm test -- <path>` still collects coverage from all `src`; noisy coverage
  is expected and is not a reason to change Story 1 configuration.
- `pnpm test --coverage` duplicates the script's `--coverage` flag but remains harmless
  in CI; this story documents the implemented command rather than changing CI.
- Relative `jest.mock()` guidance applies only when an internal custom hook truly must
  be mocked; normal app imports should keep using `@/*`.
- The guide must not promise a router helper that Story 1 did not create. It documents
  the conditional pattern only.
- The guide must not present TanStack Query as installed.
- Skill and command names are exactly `unit-test`.
- Generated prompts are derived artifacts; source commands remain authoritative.

## Open Questions

None.

## Answered Questions

### Research Scope

I: Question: Quick or full research?
Status: answered
Answer: Full template.

II: Question: Single-feature or cross-feature?
Status: answered
Answer: Single story spanning documentation and agent tooling; no application feature
or data-flow changes.

### Naming and Workflow

I: Question: What should the command and skill be named?
Status: answered
Answer: `unit-test` for both `/unit-test` and
`.opencode/skills/unit-test/SKILL.md`.

II: Question: Should `/unit-test` create tests, fix tests, or both?
Status: answered
Answer: Both create and fix tests.

III: Question: Should existing stale workflow prompts be corrected in Story 2?
Status: answered
Answer: Yes. Update all active workflow commands and regenerate their prompts so they
do not contradict the canonical guide or implemented Story 1 foundation.

## Assumptions

- Story 1 is accepted as the source of truth for current test tooling.
- `docs/UNIT_TESTING_GUIDELINES.md` is canonical; all other files stay concise.
- The new command is an execution workflow and does not require an approved planning
  document for focused test work.
- Existing app behavior and test coverage remain unchanged in this story.
- Prompt synchronization remains hardcoded rather than being generalized; adding one
  mapping is the smallest change consistent with the existing script.
- OpenCode must be restarted after implementation for the new command and skill to be
  discoverable.

## Research Outcome

Story 2 is ready for planning. The smallest complete implementation adds one canonical
guide, one thin skill, one create-and-fix command, one sync mapping, and the generated
prompt; it also removes stale no-Jest claims from active shared and workflow guidance.
No dependencies, Jest configuration, test coverage, CI behavior, or application source
need to change.
