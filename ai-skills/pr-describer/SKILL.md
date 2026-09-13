---
description: Write a PR description and title options from the current branch changes for fe-tehesa.
---

# /pr-describer - PR Description Workflow

Write a PR description from the changes on the current branch for `fe-tehesa`.

## Inputs

Use `$ARGUMENTS` and the conversation for an explicit base branch or focus area, if the user gave one. Otherwise use the current branch against its default base.

## Steps

1. Resolve the base branch: `git merge-base HEAD origin/develop` — PRs in this repo target `develop`, not `main`. If that fails, fall back to `git merge-base HEAD origin/main`. If the user names a base, use it.
2. Read the changes: `git log --oneline <base>..HEAD` and `git diff <base>...HEAD --stat`, then `git diff <base>...HEAD` for the files that matter. Skip `pnpm-lock.yaml`, `coverage/`, `.next/`, and `tsconfig.tsbuildinfo`.
3. Describe what the branch does and why, not the diff line by line. Group related edits into one bullet; drop noise (formatting, renames with no behaviour change) unless that is the whole PR.
4. Output exactly the template below and nothing else — no preamble, no commentary.
5. After the template, add one line reminding the user the PR needs exactly one of the `major`, `minor`, or `patch` labels (`check-label.yml` blocks merge without one) and that CI does not run lint/build/tests on label-only merges — those already ran in `test.yml` on the PR itself.

## Output format

```
## Title options
1. <title>
2. <title>
3. <title>

# PR Description
<1 to 4 lines explaining the changes in a concise way>

## Changes
- Change 1
- Change 2
```

Titles: imperative mood, under 72 characters, no trailing period. Match this repo's existing commit style (`feat: ...`, `fix: ...`, `phase N: <description>`, etc. — check `git log --oneline` for the closest precedent).

## Don'ts

- Do not commit, push, or open the PR. Output the description only.
- Do not invent scope not present in the diff.
- Do not manually reference a version bump or `CHANGELOG.md` entry; the develop merge workflow handles that.

If you update `ai-skills/pr-describer/COMMAND.md`, run `pnpm sync:prompts` afterward so its GitHub prompt and Claude skill stay in sync.
