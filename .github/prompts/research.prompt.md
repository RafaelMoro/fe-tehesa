---
description: Research a Kraft Envios feature or bug and write an ai-research note without changing source code.
---

# /research - Research Workflow

You are running the **research phase** for `kraft-envios-fe` (Next.js 14 App Router + React 18 + TypeScript, pnpm, TanStack Query, Tailwind v4 + Flowbite React, Jest). Your goal is to gather information, ask clarifying questions, and write a research document under `ai-research/`.

## Inputs the user may provide

- A free-form description of the work
- Neither, in which case ask for at least one before proceeding

Parse whatever the user supplied from `$ARGUMENTS` and the conversation.

## Step 1 - Load shared context first

Before any codebase exploration, read these files and do not re-discover what is already documented:

1. `REPO_CONTEXT.md` - architecture map, route handler inventory, auth/cookie flow, conventions, open questions
2. `AGENTS.md` - compact toolchain, commands, env, tests, and structure guidance
3. `.github/copilot-instructions.md` - project-specific unit test conventions, wrappers, and mocking rules
4. `package.json` - dependencies and scripts (`pnpm dev | build | start | lint | test`)
5. Relevant executable config: `next.config.mjs`, `jest.config.ts`, `tsconfig.json`, `postcss.config.mjs`

There is no CI workflow directory in this checkout. Do not assume branch, label, release, or deployment rules unless the user provides them.

## Step 2 - Story quality check

Skim the task and flag any of these **before** spending tool calls on exploration:

- Missing or vague requirements
- Unclear success criteria / acceptance criteria
- Ambiguous user needs
- Lack of constraints or assumptions
- Undefined terms

If any flag fires, ask the user before continuing. Do not invent answers.

## Step 3 - Assess scope and formalize story

Before deep exploration, assess whether this is:

- **Single story** - 1-3 phases, clear ACs, e.g. fix a quote form bug or add one validation
- **Multiple stories** - separate deliverables across different screens or flows
- **Epic** - complex initiative spanning several features, API routes, UI flows, and tests

If the requirement is too broad or complex:

1. Break it into an epic with multiple stories.
2. Give each story 2-5 acceptance criteria.
3. Keep each story independently deliverable.
4. Ask the user which story to research first.

## Step 4 - Scope discipline

Apply these constraints **before** exploration:

- Only research what the story explicitly requests.
- Do not explore tangential refactors or "while we're here" cleanups.
- Do not invent features the story does not mention.
- If scope seems unclear, ask before exploring.
- Respect the current layout: domain UI belongs in `src/features/<Domain>/`; cross-cutting code belongs in `src/shared/`.
- Backend knowledge must come from this repo's route handlers, types, constants, and env docs unless the user provides backend details. Do not clone or shell into an external backend repo.

## Step 5 - Ask about scope and complexity

Ask answer-selection questions with the execution environment's native question UI:

- In opencode, use the `question` tool.
- In VS Code/GitHub Copilot, use the VS Code question/quick-pick tool.

Resolve at minimum:

1. **Quick or full research?** Estimate complexity. For a small bug fix or one-line behavior change, ask:

   > "This looks small. Want a quick research note (~100-200 lines, lightweight template) or the full template (~200-500 lines)?"
   > Default to full template if unclear.

2. **Cross-feature or single-feature?** If the story seems to touch multiple features or areas, ask:

   > "This looks like it might touch multiple features or areas of the codebase. Is that right? If so, I can cover all relevant areas in the research note."
   > Default to single feature if unclear.

3. **Specific areas to focus on?** If the story is complex, ask:

   > "Are there specific code areas or questions you want prioritized during research?"

4. **Other story-specific clarifications** - e.g. courier behavior, backend contract uncertainty, Flowbite vs local shared UI, accessibility expectations, mobile/desktop behavior, cookie/local-storage expectations.

Batch all of these into a single question UI call when the environment supports it. Do not invent answers.

## Step 6 - Write the research doc

File path: `ai-research/{name}.epic.md` if the research is an epic, or `ai-research/{name}.story.md` if it is a story (create the directory if it does not exist). Use the scope assessment from Step 3 to pick the suffix.

Length target: **~200-500 lines** for full mode, **~100-200 lines** for quick mode. Cut aggressively for small stories.

The research doc must include:

### Story Definition

- Story title and description
- Acceptance criteria - 2-5 clear, testable criteria
- Task breakdown if complex
- Epic structure if scope is too large

### Technical Research

- **Affected areas**, referencing this repo's layout:
  - Routes/pages: `src/app/**`
  - API route handlers: `src/app/api/**/route.ts`
  - Feature UI: `src/features/{Login,Dashboard,Quotes,Addresses,AutocompleteZipcode,Guides,ProfitMargin}`
  - Shared code: `src/shared/{ui,hooks,lib,utils,constants,types}`
  - Tests: `__tests__/feature/*`, `__tests__/components/*`, `__tests__/home.test.tsx`; helper dirs `__tests__/mocks/` and `__tests__/utils-test/` are ignored by Jest
- **Existing patterns to follow** - App Router server/client split, TanStack Query via `features/QueryProviderWrapper`, Flowbite React, Tailwind v4, `react-hook-form` + `yup`, route-handler proxy style
- **Testing rules to follow** - use `.github/copilot-instructions.md` for router/query wrappers, `userEvent`, mocking limits, import conventions, skipped-test preservation, and mock data shape checks
- **Dependencies / integration points** - new deps require `package.json` and pnpm lockfile changes; env vars are listed in `.env.example` and `AGENTS.md`
- **Edge cases and constraints** - httpOnly session cookies, mixed API response shapes, mobile/tablet dashboard branch, coverage always collected on tests, `product-sat` external SAT URI instead of `BACKEND_URI`

### Open Questions

- Separate questions into categories such as `Backend contract`, `Create payload`, `UI/product decisions`, and `Authorization`.
- List questions within each category using Roman numerals (`I`, `II`, `III`, `IV`, ...).
- Use this format for every question:
  - `I: Question: ...`
  - `Status: pending / answered`
  - `Answer: ...` when answered
  - `Context: ...` when extra context helps
  - `Explanation: ...` when the question needs clarification
- Keep answered questions in the section; do not delete them after the user answers.
- Flag ambiguous requirements and missing backend/API contract information as `Status: pending`.

Focus on **high-level actions** needed to accomplish the task. Do not include implementation code beyond illustrative file references.

## Step 7 - Capture non-obvious findings

If research surfaces a non-obvious constraint or domain fact future work would benefit from, add it to `REPO_CONTEXT.md` only if it is verified and broadly useful. Skip this for story-specific details.

## Step 8 - Present for review

End the turn with:

1. The path to the research doc
2. Story / epic structure if broken down
3. A bullet list of unresolved open questions
4. A bullet list of assumptions made

Do **not** start planning or writing code. Wait for human sign-off.

## Don'ts

- Do not propose implementation; that is the planning phase.
- Do not write or modify source files other than the research doc, except for a verified broadly useful `REPO_CONTEXT.md` note.
- Do not run tests, builds, or `pnpm install` during research.
- Do not assume Zustand, finance domains, CI labels, branch flow, changelog automation, or external backend repository access; those are not present in this repo.
