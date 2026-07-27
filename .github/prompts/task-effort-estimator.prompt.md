---
description: Estimate story or epic effort from a Tehesa research document in person-days.
---

# /task-effort-estimator - Task Effort Estimation

Estimate the effort required to take a researched Tehesa story or epic through any remaining research, design, backend work, planning, implementation, and verification.

## Input

The user may provide:

- A story research document under `ai-research/`.
- An epic research document under `ai-research/epics/`.
- Pasted research content.
- Nothing, in which case list research documents recursively under `ai-research/` and ask the user to select one.

Parse `$ARGUMENTS` and the conversation for the input. Read the complete selected document. For an epic, also read existing child-story research documents linked by the epic or matching its stories. Do not inspect unrelated code or documents.

## Estimation rules

- Estimate only accepted must-have scope and acceptance criteria. Exclude nice-to-haves, deferred work, and explicitly out-of-scope items.
- Report ranges as **low / likely / high person-days**. One person-day means one person's normal workday; it is effort, not an eight-hour promise.
- Use 0.5-day increments. Do not imply precision the research does not support.
- Include work already completed as `0` remaining days and identify it as completed. Estimate remaining effort, not sunk effort.
- Do not assume frontend work covers Strapi or another backend repository. Put required backend work in its own row and mark ownership or access as unknown when the document does not establish it.
- Do not invent backend, design, or documentation work. Use `0` when the acceptance criteria do not require it.
- Increase the range for unresolved decisions, unknown contracts, migrations, security-sensitive boundaries, unfamiliar integrations, or cross-feature changes. State which uncertainty widened it.
- Do not add a generic contingency percentage. The high estimate is the uncertainty allowance.
- Include automated tests and manual verification required by the acceptance criteria. Do not estimate release automation, changelog edits, or version bumps.

Use these bands as calibration, not automatic totals:

| Workstream          |                                                                                                                         Typical remaining effort |
| ------------------- | -----------------------------------------------------------------------------------------------------------------------------------------------: |
| Additional research |                                            0.5-1 day for a focused unresolved story; 0.5-1.5 days per missing epic child-story research document |
| Design              |    0.5-1 day for an existing-pattern adjustment; 1-3 days for a new responsive flow or several states; 3+ days only for multi-screen/system work |
| Backend             |              0.5-1 day for a small query/config change; 1-3 days for an endpoint or schema change; 3-8+ days for migration or cross-service work |
| Planning            |                                      0.5 day for a small story; 0.5-1 day for a medium story; 1-2 days for a complex story or epic decomposition |
| Development         | 0.5-1 day for a localized change; 1-3 days for a multi-file feature; 3-5 days for cross-cutting work; split work larger than 5 days into stories |
| Verification        |                   0.5 day for focused checks; 0.5-1 day for multi-layer tests/manual QA; 1-2 days for complex integration or regression coverage |

## Determine readiness

Before calculating, identify:

1. Whether the input is a standalone story or epic.
2. Which acceptance criteria are in scope.
3. Blocking and non-blocking open questions.
4. Required deliverables by workstream:
   - Additional research documents.
   - Product/UX design and design handoff.
   - Backend/Strapi/API work.
   - Planning documents.
   - Frontend or other development execution.
   - Automated tests, manual QA, review, and fixes.
5. Dependencies that force work to happen sequentially.

If the document is too incomplete to identify acceptance criteria or required systems, ask one concise clarification question instead of fabricating an estimate. Otherwise estimate with explicit assumptions.

## Story estimation

For a story, estimate each required workstream once. Keep planning separate from execution. Keep backend and design separate from frontend development even if one person may perform several roles.

Calculate:

- **Total effort:** sum of every workstream's person-days.
- **Sequential elapsed time:** the same range as total effort when one person performs all work serially.
- **Parallel elapsed time:** the critical-path range if design, backend, and frontend can be staffed independently. Omit this when dependencies or staffing are unknown rather than guessing.

## Epic estimation

For an epic:

- Estimate leaf stories, not both parent scope and child scope.
- Use existing child-story research documents when available.
- Add research effort only for missing or incomplete child-story documents.
- Put shared design, backend foundation, setup, or verification in an `Epic shared` row once; do not repeat it in every story.
- Respect story dependencies and show the critical path.
- Provide both per-story totals and an aggregate by workstream.
- Flag stories larger than 5 likely development days as candidates for further splitting.

## Output

Return the estimate in chat. Do not edit the research document or create an estimate file unless the user explicitly asks.

Use this structure:

```markdown
# Effort Estimate: <title>

Source: `<path or pasted research>`
Type: Story | Epic
Confidence: High | Medium | Low

## Scope Readiness

- <resolved scope, missing inputs, and exclusions>

## Assumptions

- <only assumptions that affect the estimate>

## Workstream Estimate

| Workstream             | Needed |   Low | Likely |  High | Basis / deliverable |
| ---------------------- | ------ | ----: | -----: | ----: | ------------------- |
| Additional research    | Yes/No |     0 |      0 |     0 | ...                 |
| Design                 | Yes/No |     0 |      0 |     0 | ...                 |
| Backend                | Yes/No |     0 |      0 |     0 | ...                 |
| Planning               | Yes/No |     0 |      0 |     0 | ...                 |
| Development execution  | Yes/No |     0 |      0 |     0 | ...                 |
| Verification and fixes | Yes/No |     0 |      0 |     0 | ...                 |
| **Total person-days**  |        | **0** |  **0** | **0** |                     |

## Schedule

- Sequential elapsed time: <range> working days.
- Parallel elapsed time: <range> working days, if supportable.
- Critical path: <ordered workstreams or stories>.

## Epic Breakdown

<For epics only: per-story low/likely/high totals, dependencies, and shared work.>

## Risks

- <only factors that materially change the range>

## Recommendation

<One concise readiness or story-splitting recommendation.>
```

Show the arithmetic behind totals. End with the likely total effort and the most important uncertainty in one sentence.

## Don'ts

- Do not plan or implement the work.
- Do not estimate optional scope as committed effort.
- Do not hide backend, design, research, planning, or verification effort inside a single development number.
- Do not convert person-days directly into dates without team capacity, holidays, and availability.
- Do not claim backend feasibility when the research document does not establish the contract or repository access.

If you update this command, run `pnpm sync:prompts` afterward so its GitHub prompt and Claude skill stay in sync.
