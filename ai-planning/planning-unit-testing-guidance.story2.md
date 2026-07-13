# Plan: Publish and Enforce Unit-Test Guidance

## Header

- **Story:** Publish and enforce unit-test guidance
- **Source research:** [`ai-research/unit-testing-guidance.story2.md`](../ai-research/unit-testing-guidance.story2.md)
- **Research sign-off:** Confirmed by the user on 2026-07-12
- **Plan status:** Awaiting implementation sign-off
- **Assumptions:**
  - Story 1 is the current source of truth: Jest 30 runs through `next/jest`, `pnpm test` emits coverage, and the existing configuration is not changed.
  - The root `__tests__/` directory and `@__tests__/*` alias remain the test placement/import convention.
  - `docs/UNIT_TESTING_GUIDELINES.md` is the sole complete test-authoring reference; every other file stays concise and links to it.
  - OpenCode must be restarted after implementation for the new skill and command to become discoverable.

## Acceptance Criteria

1. `docs/UNIT_TESTING_GUIDELINES.md` is the canonical source for test placement, commands, query/interaction rules, mock boundaries, typing, Next.js/HeroUI constraints, skipped tests, and verification.
2. `.opencode/skills/unit-test/SKILL.md` is a valid, discoverable, thin skill that loads the canonical guide and directs create/fix requests to `/unit-test`.
3. `.opencode/command/unit-test.md` defines a create-and-fix testing workflow and is synchronized byte-for-byte to `.github/prompts/unit-test.prompt.md`.
4. Existing `research`, `plan`, and `implement` commands and generated prompts no longer claim Jest is absent and load or reference the testing guide when test work is in scope.
5. `AGENTS.md`, `REPO_CONTEXT.md`, and prompt-sync documentation accurately describe the implemented Jest setup and `/unit-test` workflow without duplicating the full canonical rules.

## Affected Files

### Canonical Documentation And OpenCode Skill

- `docs/UNIT_TESTING_GUIDELINES.md` - create canonical testing rules.
- `.opencode/skills/unit-test/SKILL.md` - create thin discoverable skill.

### Command Sources And Prompt Generation

- `.opencode/command/unit-test.md` - create focused create-and-fix test workflow.
- `.opencode/command/research.md` - modify stale test assumptions and conditional guide loading.
- `.opencode/command/plan.md` - modify stale test assumptions and conditional guide loading.
- `.opencode/command/implement.md` - modify stale test assumptions, test verification, and conditional guide loading.
- `scripts/sync-opencode-commands.mjs` - modify the hardcoded mapping list.
- `.github/prompts/unit-test.prompt.md` - create only through prompt synchronization.
- `.github/prompts/research.prompt.md` - regenerate only through prompt synchronization.
- `.github/prompts/plan.prompt.md` - regenerate only through prompt synchronization.
- `.github/prompts/implement.prompt.md` - regenerate only through prompt synchronization.

### Shared Repository Instructions

- `AGENTS.md` - modify concise test commands, placement, and guide reference.
- `REPO_CONTEXT.md` - modify testing/prompt-sync/CI facts and add guide/skill/command paths.

### Explicitly Unchanged

- `package.json`, `pnpm-lock.yaml`, `jest.config.ts`, `jest.setup.ts`, `next.config.ts`, `tsconfig.json`, `.gitignore`, `eslint.config.mjs`, and `.github/workflows/test.yml`.
- All files under `src/**` and existing files under `__tests__/**`.

## Phase 1: Establish The Canonical Guide And Skill

### Changes Required

#### `docs/UNIT_TESTING_GUIDELINES.md`

- **Action:** Create.
- Follow the concise, rule-oriented structure used by `docs/IMPLEMENTATION_GUIDELINES.md`; this is the only full copy of test rules.
- Document the implemented stack and commands exactly:
  - Jest 30 and Testing Library through `next/jest`.
  - `pnpm test`, `pnpm test:watch`, and targeted `pnpm test -- <relative test path>`.
  - Root `__tests__/` placement, supported test filename patterns, and `@__tests__/*` imports.
  - `render`, `screen`, and `userEvent` from `@__tests__/test-utils` for component tests.
  - Coverage output without a threshold and the expected noisy full-source collection during targeted runs.
- Define query and interaction rules: role/accessibility/visible-text queries first, test IDs only when no semantic query exists, `userEvent.setup()` per interaction test, awaited actions, and no `fireEvent`, direct DOM selectors, or visual/style assertions.
- Define mock and typing boundaries: mock only unavailable/external boundaries; keep internal components, pure utilities/constants, `next/image`, and renderable HeroUI behavior real; mocks must preserve exact named export/response shapes and avoid new `any` or `unknown`.
- Document Next.js/HeroUI constraints: do not directly render async Server Components; preserve existing HeroUI ESM mapping and `transpilePackages`; query portalled overlays through global `screen`; use the global `matchMedia` shim and add other browser APIs locally only when a tested path needs them.
- Document conditional patterns without adding infrastructure: the minimum router context when `useRouter` fails, and a fresh production-equivalent TanStack Query client only if production later adopts that dependency. State explicitly that TanStack Query and `QueryProviderMock` are not current dependencies.
- Preserve skipped tests: do not remove/enable existing `it.skip` or `test.skip` unless specifically requested; never use a new skip to report a failing task as complete.
- Define the create/fix scope: trace callers for regression tests, fix production source only when the approved contract requires it, and never weaken a correct assertion to pass.
- Keep examples structural and concise; do not add test suites, fixtures, router helpers, provider mocks, coverage thresholds, or configuration changes.

#### `.opencode/skills/unit-test/SKILL.md`

- **Action:** Create with `name: unit-test` frontmatter matching its directory name.
- Use a third-person description that makes the skill discoverable for unit tests, Jest, Testing Library, coverage, test creation, and failing-test repair.
- Keep the body thin: direct the agent to read `docs/UNIT_TESTING_GUIDELINES.md` before edits, invoke `/unit-test` for create/fix work, use existing test utilities, and preserve the no-internal-mock policy.
- Do not duplicate the canonical guide or define a second workflow.

### Success Criteria

**Automated**

- No executable code changes occur in this phase; defer repository commands to the final synchronization phase.

**Manual**

- Review the guide against every required subject in Acceptance Criterion 1.
- Confirm the skill frontmatter has a lowercase hyphenated `unit-test` name, a trigger-oriented description, and a short body linking to the guide.
- Confirm only the guide contains full rules; the skill contains no copied policy sections.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `docs/UNIT_TESTING_GUIDELINES.md` | Implemented commands, placement, interactions, mock/typing boundaries, framework constraints, skips, verification, source-fix scope | Required-section review against research |
| `.opencode/skills/unit-test/SKILL.md` | Valid discoverable metadata, guide-first behavior, `/unit-test` handoff, thin-source-of-truth boundary | Frontmatter/body inspection; restart OpenCode after implementation |

## Phase 2: Add And Synchronize Test Workflows

### Changes Required

#### `.opencode/command/unit-test.md`

- **Action:** Create with a concise frontmatter description and `$ARGUMENTS`-aware command body.
- Define one focused workflow for both test creation and failure diagnosis/repair:
  1. Parse requested behavior, paths, and failure output from arguments and conversation context.
  2. Read the canonical testing guide, implementation guide, repository context, agent instructions, package scripts, and relevant source/tests.
  3. Ask when expected behavior is ambiguous rather than encoding assumptions in assertions.
  4. Trace the production behavior and callers before adding a regression test.
  5. Write the smallest behavior-focused test below root `__tests__/`, using real internal code and only approved boundary mocks.
  6. Run `pnpm test -- <relative test path>`, repair failures, then run `pnpm test`, `pnpm lint`, and relevant TypeScript checks.
  7. Change source only when the requested contract requires it; never weaken a correct test merely to pass.
  8. Report files, test/source changes, commands, and remaining skips or failures.
- State that `/unit-test` is execution-oriented and does not require an implementation plan, unlike `/implement`.
- Do not promise router helpers or provider mocks that do not exist.

#### `.opencode/command/research.md`

- **Action:** Modify the shared-context and technical-research sections near the current test-status statements.
- Replace stale “no test framework” language with the implemented Jest/Testing Library baseline and valid test commands.
- Require loading `docs/UNIT_TESTING_GUIDELINES.md` when researching test work; retain research-only boundaries and do not run tests during research.
- Update test-area and verification guidance so research documents describe current tests/tooling accurately without prescribing implementation.
- Remove Jest from “do not assume” lists while retaining the prohibition on uninstalled TanStack Query and unrelated test tooling.

#### `.opencode/command/plan.md`

- **Action:** Modify the shared-context, verification-coverage, and exclusions text near stale test-status statements.
- Replace stale claims with the existing Jest commands and require guide loading when tests are in plan scope.
- Update verification guidance to use targeted or full Jest checks when the story includes tests, without inventing test frameworks for stories that do not.
- Remove Jest from the non-existent dependency list; retain TanStack Query as absent.

#### `.opencode/command/implement.md`

- **Action:** Modify the shared-context, verification, final-verification, and exclusions text near stale test-status statements.
- Require the testing guide when the approved plan includes test work and permit `pnpm test -- <relative test path>` followed by `pnpm test` as relevant verification.
- Preserve the plan-driven phase/sign-off workflow and existing production verification rules; this command must not become a duplicate `/unit-test` workflow.
- Remove Jest from the non-existent dependency list while retaining the no-TanStack-Query constraint.

#### `scripts/sync-opencode-commands.mjs`

- **Action:** Modify the `files` mapping array.
- Add exactly `unit-test.md` -> `unit-test.prompt.md`; preserve the current explicit mapping approach and missing-source behavior.
- Do not generalize the script into file discovery or change its filesystem behavior.

#### `.github/prompts/{research,plan,implement,unit-test}.prompt.md`

- **Action:** Regenerate through `pnpm sync:prompts`; do not hand-edit generated prompts.
- Ensure every generated file is byte-identical to its corresponding `.opencode/command/*.md` source after synchronization.

### Success Criteria

**Automated**

- Run `pnpm sync:prompts` after all command-source and mapping edits.
- Compare all four command/prompt pairs byte-for-byte:
  - `.opencode/command/research.md` / `.github/prompts/research.prompt.md`
  - `.opencode/command/plan.md` / `.github/prompts/plan.prompt.md`
  - `.opencode/command/implement.md` / `.github/prompts/implement.prompt.md`
  - `.opencode/command/unit-test.md` / `.github/prompts/unit-test.prompt.md`

**Manual**

- Confirm `/unit-test` covers both creating and repairing tests without requiring a planning document.
- Confirm `research`, `plan`, and `implement` reference the canonical guide only when test work is in scope and retain their distinct responsibilities.
- Confirm no command promises an unimplemented router helper, test provider, fixture layer, or TanStack Query setup.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `.opencode/command/unit-test.md` | Create/fix flow, ambiguity handling, targeted/full verification, source-fix boundary, reporting | Command source inspection + generated-prompt comparison |
| `.opencode/command/{research,plan,implement}.md` | No stale no-Jest claims; conditional guide loading; real Jest commands; preserved workflow boundaries | Command source inspection + generated-prompt comparison |
| `scripts/sync-opencode-commands.mjs` | Explicit fourth mapping and unchanged copy behavior | `pnpm sync:prompts` |
| `.github/prompts/*.prompt.md` | Derived prompts are byte-identical to all four command sources | Byte-equivalence comparison after synchronization |

## Phase 3: Align Shared Repository Instructions

### Changes Required

#### `AGENTS.md`

- **Action:** Modify the `Commands` section near the stale no-test statement.
- Replace it with concise `pnpm test`, `pnpm test:watch`, and targeted-test command guidance.
- Add root `__tests__/` placement and a link/reference to `docs/UNIT_TESTING_GUIDELINES.md` and `/unit-test`; retain detailed rules only in the canonical guide.
- Preserve package manager, architecture, environment, and release guidance unchanged.

#### `REPO_CONTEXT.md`

- **Action:** Modify the `Commands`, `Prompt Sync`, `CI And Release Workflow`, `Testing`, and `Key Files` sections.
- Add the canonical guide, skill, and command paths to the relevant maps/lists.
- Add the fourth prompt-sync mapping and correct the generated target for `implement` to `.github/prompts/implement.prompt.md`.
- Correct coverage wording: `coverage/` is explicitly gitignored in `.gitignore` and also ignored by ESLint; it is not only implicitly ignored.
- Preserve current Jest facts: `next/jest`, jsdom, root discovery, both aliases, `jest-dom`, `matchMedia`, direct HeroUI ESM mapping, `transpilePackages`, no coverage threshold, and CI on pull requests plus pushes to `develop`.
- Do not duplicate the canonical behavioral rules or modify unrelated architecture, catalog, theme, or release facts.

### Success Criteria

**Automated**

- Run `pnpm lint` to validate the modified sync script and ensure generated coverage remains ignored by linting.
- Run `pnpm test` to confirm documentation/command additions did not disturb the existing Jest foundation.
- Do not run `pnpm exec tsc --noEmit` because this story changes no TypeScript source, and do not run `pnpm build` because it changes no application or Next configuration.

**Manual**

- Search active instructions to confirm stale “no test framework,” “no `pnpm test`,” and “do not assume Jest” claims are absent from `AGENTS.md`, command sources, and generated prompts.
- Confirm `AGENTS.md` and `REPO_CONTEXT.md` point to the guide instead of reproducing its full rules.
- Restart OpenCode and confirm `unit-test` skill/command discovery.

### Verification Coverage

| Area/File | Coverage/check areas | Verification reference |
| --- | --- | --- |
| `AGENTS.md` | Real test commands, root placement, canonical guide and `/unit-test` reference | Documentation review + stale-claim search |
| `REPO_CONTEXT.md` | Prompt mapping, exact coverage ignore state, test CI trigger, testing entry points | Documentation review + source/config comparison |
| Repository test foundation | Command/documentation changes preserve existing Jest execution | `pnpm test` |
| Repository tooling | Sync script edit remains lint-valid | `pnpm lint` |

## Cross-Cutting Concerns

- **Single source of truth:** Keep detailed test-authoring policy in `docs/UNIT_TESTING_GUIDELINES.md`; skills, commands, prompts, and repository context must link or summarize only.
- **Generated artifacts:** Edit `.opencode/command/*.md` sources, then run `pnpm sync:prompts`; never manually edit `.github/prompts/*.prompt.md`.
- **OpenCode lifecycle:** Skills and commands are config-time files; restart OpenCode after implementation before testing discoverability.
- **Existing foundation:** The story documents the implemented Jest/HeroUI setup and must not alter dependencies, aliases, transforms, setup shims, coverage behavior, or CI.
- **Test scope:** No production code, test suites, fixtures, route coverage, or provider abstractions are introduced. TanStack Query remains conditional documentation only.

## Open Questions

None. The research document records all questions as answered.

## Out Of Scope

- Changes to Jest dependencies, lockfile, scripts, configuration, aliases, coverage collection, browser shims, HeroUI mapping/transpilation, or test CI behavior.
- Application, API route, Strapi/Apollo, theme, Zustand, or production UI changes.
- New executable tests, fixtures, router helpers, provider mocks, query clients, or a Strapi fixture layer.
- TanStack Query, `QueryProviderMock`, coverage thresholds, and broad test-framework abstractions.
- Rewriting historical research files whose description of an earlier no-test baseline was accurate at the time.
- Manual edits to generated GitHub prompts, version bumps, changelog changes, or release-workflow changes.

## Decisions Beyond The Research Document

- None. The plan uses the smallest documented change set: one guide, one thin skill, one command, one sync mapping, regenerated prompts, and concise corrections to active instructions.
