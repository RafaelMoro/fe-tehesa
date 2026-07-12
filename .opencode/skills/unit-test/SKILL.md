---
name: unit-test
description: Use when the user wants to create, run, or fix Jest unit tests or component tests for the Tehesa catalog. Triggers on unit test, test, jest, testing library, coverage, failing test, fix test, write test, add test.
---

# Unit testing skill

Run the `/unit-test` command. The full workflow prompt lives in `.github/prompts/unit-test.prompt.md`.

Before writing or editing any test, read `docs/UNIT_TESTING_GUIDELINES.md` and follow it for the whole task. The guide is the only source of truth for placement, queries, interactions, mock boundaries, Next/HeroUI constraints, and the create/fix scope rule.

Use the existing `__tests__/test-utils.tsx` for component rendering and `userEvent`; do not redefine a local render helper. Preserve the no-internal-mock policy: only mock unavailable or external boundaries, and keep internal components, pure utilities, and renderable HeroUI behavior real.
