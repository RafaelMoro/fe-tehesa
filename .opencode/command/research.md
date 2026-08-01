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
- Backend/Strapi knowledge comes first from this repo's GraphQL queries, server actions, types, constants, and env docs. For factual schema/contract questions this repo can't answer, delegate to the `backend-research` subagent (Step 5) instead of guessing or exploring the backend repo directly yourself.
- Preserve the existing Apollo/Strapi data access pattern unless the story explicitly asks to replace it.

## Step 5 - Route backend/Strapi questions

As backend/Strapi questions come up during exploration, classify each one before it goes into Open Questions:

- **Factual** (schema shape, field/type existence, required args, relations, pagination metadata, content-type structure) - delegate to the `backend-research` subagent instead of guessing. It checks the local backend repo at `/home/rafael/projects/tehesa/store-tehesa-api` first, then falls back to a live GraphQL introspection query against `STRAPI_HOST`/`STRAPI_API_TOKEN`. Launch it through the runner's subagent mechanism (`subagent_type: "backend-research"`), wait for its answer, and record the result in Open Questions as `Status: answered` with the subagent's evidence as `Context:`.
- **Judgment** (product/business decisions, scope calls, UX tradeoffs, anything needing a human opinion) - do not delegate. Flag it to the user (Step 7/9) as `Status: pending`.

**Claude Code and OpenCode:** the `backend-research` subagent is configured in `.claude/agents/backend-research.md` and `.opencode/agents/backend-research.md`, respectively. In other runners, do not attempt delegation — treat every backend/Strapi question (factual or judgment) as `Status: pending` and flag it to the user, noting that automatic backend delegation is unavailable in this environment.

If the subagent can't resolve a factual question either, leave it `Status: pending` and note what it checked.

## Step 6 - Ask about scope and complexity

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

## Step 7 - Write the research doc

File path:

- Epic: `ai-research/epics/<epic-name>.epic.md`. Create `ai-research/epics/` if needed.
- Story belonging to an epic: first check for `ai-research/<epic-folder-name>/`; create it when absent, then write `ai-research/<epic-folder-name>/<story-name>.story-<story-number>.md`.
- Standalone story: `ai-research/<story-name>.story.md`.

- Design brief for a story or epic that includes UI work: see Step 7b.

Use lowercase kebab-case names. An epic folder name is the epic name without the `.epic.md` suffix. Do not put epic stories in `ai-research/epics/` or flatten them into `ai-research/`.

Length target: **~200-500 lines** for full mode, **~100-200 lines** for quick mode. Cut aggressively for small stories.

The research doc must include:

### Story Definition

- Story title and description
- Acceptance criteria - 2-5 clear, testable criteria
- Task breakdown if complex
- Epic structure if scope is too large

### Design Agent Handoff

Include this section only when the story creates or materially changes UI, user flows, visual states, responsive behavior, or other design work. Omit it for backend-only, data-only, tooling-only, or non-visual stories.

**Design work is split across two files.** The design agent is external — it has no repository access, and it is fed screenshots plus `DESIGN.md` by hand. So the research doc holds what a *developer or planner* needs, and a separate brief file (Step 7b) holds what a *repo-blind design agent* needs. Do not duplicate content between them; each constraint lives on the side that acts on it.

Keep in the research doc:

- A one-paragraph statement of the user goal, and what the feature is **not** (this is the framing that stops a quote page becoming a checkout).
- A **surface index table**: surface, the file it lives in, its states, the story it belongs to, and which brief covers it. This is the planner's-eye view no single brief can give, because each brief sees only its own slice.
- The two to four rules that override any design instinct to the contrary, when the feature has them (e.g. "never present a total as a price the buyer will pay").
- **Implementation-facing constraints**, as short reference subsections the stories point at: mobile/desktop expectations with the repo gotchas that matter (hook limitations, breakpoint sources), accessibility requirements with concrete `aria-*` and focus rules, visual patterns to preserve with `DESIGN.md` line references and `pnpm design:lint`, content constraints naming the real helpers (`formatNumberToCurrency`), and explicit out-of-scope work.
- A **decision record** of design questions: what was decided, why, and what is still open. Strike through settled entries rather than deleting them, so a decision is not reopened by accident.

Do **not** put in the research doc: a step-by-step design process, copy-pasteable prompts, or screenshot lists. Those belong in the brief file, and keeping them in both places guarantees they drift.

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

## Step 7b - Write the design agent brief

Run this step **only** when the research doc includes a Design Agent Handoff.

File path: `ai-research/<epic-folder-name>/design-agent-briefs.md` for an epic, or `ai-research/<story-name>.design-brief.md` for a standalone story.

The design agent has no repository access. It cannot read `DESIGN.md`, cannot open a component, and cannot follow a reference to another document. **Every prompt must be self-contained** — inline the exact labels, the exact Spanish strings, and every constraint, rather than pointing at the epic.

The file has three parts.

**1. A screenshot capture guide**, written once at the top. A table of shot ID, what to capture, viewport (~390px phone and ~1440px desktop), theme (light and dark), and *why that shot is needed*. Name which existing surface is the closest visual precedent for anything new — that is what stops the agent inventing a pattern the app does not use. The user runs `pnpm dev` and captures these by hand; do not attempt it yourself.

**2. One brief per surface group**, each with:

- **Attach** — which shot IDs and which files (`DESIGN.md` at minimum, plus a previous brief's output when the new surface sits beside it).
- **Prompt** — a fenced block to copy verbatim. Structure it as: who you are and what the app is → **why the problem exists** → what to design, state by state → hard constraints → deliverable. Lead with the problem, not the task list: an agent that does not understand the problem solves a different one. State the anti-goals explicitly ("do not add an image placeholder", "do not invent stock levels") — an agent will otherwise fill gaps with e-commerce defaults that do not apply here.
- **Check the output for** — the two to four predictable failures for that surface, phrased as what to reject and re-run.

**3. A closing note** on what to bring back to the research doc, and a reminder that implementation follows the acceptance criteria, not the comps — several ACs typically have no visual expression at all.

Sizing: one surface group per brief. Do not merge them. Order them so the briefs that unblock the first story come first, and say explicitly where a valid stopping point is, so implementation can begin before the whole epic is designed.

## Step 8 - Capture non-obvious findings

If research surfaces a non-obvious constraint or domain fact future work would benefit from, add it to `REPO_CONTEXT.md` only if it is verified and broadly useful. Skip this for story-specific details.

If you update `.opencode/command/research.md`, run `pnpm sync:prompts` afterward so its GitHub prompt and Claude skill stay in sync.

## Step 9 - Present for review

End the turn with:

1. The path to the research doc
2. Story / epic structure if broken down
3. A bullet list of unresolved open questions
4. A bullet list of assumptions made
5. When design work is included: the path to the design brief file, how many briefs it contains, which stories each unblocks, and the screenshots the user needs to capture before running the first one

Do **not** start planning or writing code. Wait for human sign-off.

## Don'ts

- Do not propose implementation; that is the planning phase.
- Do not write or modify source files other than the research doc and its design brief file (Step 7b), except for a verified broadly useful `REPO_CONTEXT.md` note.
- Do not start the dev server or attempt to capture screenshots yourself; the screenshot guide is instructions for the user.
- Do not run tests, builds, `pnpm install`, or package manager changes during research.
- Do not assume TanStack Query, Flowbite, auth/session cookies, shipping workflows, or finance domains; those are not present in this repo. Jest and Testing Library are present.
- Do not read or shell into the backend repo yourself; backend repo access is scoped to the `backend-research` subagent (Step 5).
- Do not manually bump `package.json` version or edit `CHANGELOG.md` for normal PR work; the develop merge workflow handles release automation.
