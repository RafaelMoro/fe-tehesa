---
name: implement
description: Use when the user wants to implement, build, code, or execute an approved plan. Triggers on implement, build, code, execute plan.
---

# Implementation workflow

Run the `/implement` command. The full workflow prompt lives in `.github/prompts/implement.prompt.md`.

Before writing any code, read `docs/IMPLEMENTATION_GUIDELINES.md` and follow it for the whole task. These guidelines are project-wide and take precedence over defaults when they conflict with anything else in this skill or the prompt.

When the implementation touches React or Next.js code, load `vercel-react-best-practices` before writing code and use it while implementing. After edits, do one focused pass over the touched React/Next.js files for missed performance or Server/Client boundary issues.

## Plan deviations

The plan is the source of truth, but implementation can surface a real obstacle (missing dependency, test-environment limitation, third-party contract gap, etc.) that forces a deviation. When that happens:

1. Stop and surface the deviation in the final report for that phase. Do not silently rewrite the plan.
2. After the phase is sign-offed, append a `## Plan deviation` section at the bottom of the planning doc under `ai-planning/`, grouped by phase. State the original requirement, the obstacle, the options considered, and the chosen path with a one-line rationale.
3. The deviation note is the audit trail for "why the implementation differs from the plan"; it is read by the next person who picks up the story. Keep it concise and factual — no prose defending the choice, just the decision.
4. Do not edit earlier sections of the planning doc to hide the deviation; the original plan text stays as approved and the deviation is appended.

