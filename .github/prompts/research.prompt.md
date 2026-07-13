---
description: Research a Tehesa catalog feature or bug and write an ai-research note without changing source code.
---

# /research - Research Workflow

You are running the **research phase** for `fe-tehesa` (Next.js 15 App Router + React 19 + TypeScript, pnpm, Apollo/Strapi, HeroUI, Tailwind v4, next-themes, Zustand). Your goal is to gather information, ask clarifying questions, and write a research document under `ai-research/`.

## Inputs the user may provide

- A free-form description of the work
- Neither, in which case ask for at least one before proceeding

Parse whatever the user supplied from `$ARGUMENTS` and the conversation.

## Step 1 - Load shared context first

Before any codebase exploration, read these files and do not re-discover what is already documented:

1. `REPO_CONTEXT.md` - architecture map, catalog data flow, theme/cookie flow, conventions, CI, and open questions
2. `AGENTS.md` - compact toolchain, commands, env, tests, structure, and PR/release guidance
3. `package.json` - dependencies and scripts (`pnpm dev | build | start | lint | test | test:watch | sync:prompts`)
4. Relevant executable config: `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `tailwind.config.js`
5. CI files when release/PR behavior matters: `.github/workflows/check-label.yml`, `.github/workflows/develop-pipeline.yml`, and `.github/workflows/test.yml`
6. When the story includes test work, also read `docs/UNIT_TESTING_GUIDELINES.md` for canonical test-authoring rules. Do not duplicate the rules in the research doc; reference them.

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

- **Single story** - 1-3 phases, clear ACs, e.g. fix catalog filtering, adjust variant drawer behavior, or update theme persistence
- **Multiple stories** - separate deliverables across different screens, data flows, UI components, or API behavior
- **Epic** - complex initiative spanning catalog queries, Strapi contract changes, UI flows, state management, and verification

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
- Respect the current layout: domain UI belongs in `src/features/<Feature>/`; cross-cutting code belongs in `src/shared/`; `src/components` currently only contains `ProductCard`.
- Backend/Strapi knowledge must come from this repo's GraphQL queries, server actions, types, constants, env docs, and user-provided details. Do not clone or shell into an external backend repo.
- Preserve the existing Apollo/Strapi data access pattern unless the story explicitly asks to replace it.

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

4. **Other story-specific clarifications** - e.g. Strapi/GraphQL contract uncertainty, catalog pagination limits, category/brand filter behavior, variant pricing semantics, HeroUI/accessibility expectations, mobile/desktop behavior, theme/cookie expectations, release label requirements.

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
  - API route handlers: `src/app/api/**/route.ts` (currently only `/api/preferences`)
  - Feature UI: `src/features/{Home,ProductListing,ProductVariantsDrawer}`
  - Shared product card: `src/components/ProductCard.tsx`
  - Shared code: `src/shared/{constants,hooks,lib,queries,types,ui,utils}`
  - Zustand theme state: `src/zustand/{provider,store}`
  - Tests: Jest 30 + Testing Library through `next/jest.js`; root `__tests__/` discovery; `pnpm test` runs once with coverage, `pnpm test:watch` is interactive, `pnpm test -- <relative path>` is targeted. See `docs/UNIT_TESTING_GUIDELINES.md` for the full policy.
- **Existing patterns to follow** - App Router server/client split, server actions in `src/shared/lib/global.lib.ts`, per-call Apollo client factory in `src/app/apollo-client.ts`, HeroUI components, Tailwind v4 class styling, next-themes class dark mode, Zustand provider-wraps-store pattern
- **Verification rules to follow** - use `pnpm lint`, `pnpm build`, and `pnpm exec tsc --noEmit` when relevant; use `pnpm test` / `pnpm test -- <relative path>` when the story touches tests; do not run `pnpm install` during research
- **Dependencies / integration points** - new deps require `package.json` and `pnpm-lock.yaml` changes; Strapi env vars are `STRAPI_HOST` and `STRAPI_API_TOKEN`; prompt sync uses `pnpm sync:prompts`
- **Edge cases and constraints** - hardcoded 5-page catalog ceiling, page size 50 for products, page size 100 for variants, no GraphQL pagination metadata documented, category/brand lists are hardcoded, theme defaults differ between next-themes and cookie fallback, filtered lists hide pagination, search filters only the current working set

### Open Questions

- Separate questions into categories such as `Strapi contract`, `Catalog behavior`, `UI/product decisions`, `Theme/persistence`, and `Verification`.
- List questions within each category using Roman numerals (`I`, `II`, `III`, `IV`, ...).
- Use this format for every question:
  - `I: Question: ...`
  - `Status: pending / answered`
  - `Answer: ...` when answered
  - `Context: ...` when extra context helps
  - `Explanation: ...` when the question needs clarification
- Keep answered questions in the section; do not delete them after the user answers.
- Flag ambiguous requirements and missing Strapi/GraphQL contract information as `Status: pending`.

Focus on **high-level actions** needed to accomplish the task. Do not include implementation code beyond illustrative file references.

## Step 7 - Capture non-obvious findings

If research surfaces a non-obvious constraint or domain fact future work would benefit from, add it to `REPO_CONTEXT.md` only if it is verified and broadly useful. Skip this for story-specific details.

If you update `.opencode/command/research.md`, run `pnpm sync:prompts` afterward so `.github/prompts/research.prompt.md` stays in sync.

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
- Do not run tests, builds, `pnpm install`, or package manager changes during research.
- Do not assume TanStack Query, Flowbite, auth/session cookies, shipping workflows, finance domains, or external backend repository access; those are not present in this repo. Jest and Testing Library are present.
- Do not manually bump `package.json` version or edit `CHANGELOG.md` for normal PR work; the develop merge workflow handles release automation.
