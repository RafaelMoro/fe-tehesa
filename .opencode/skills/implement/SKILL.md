---
name: implement
description: Use when the user wants to implement, build, code, or execute an approved plan. Triggers on implement, build, code, execute plan.
---

# Implementation workflow

Run the `/implement` command. The full workflow prompt lives in `.github/prompts/implement.prompt.md`.

When the implementation touches React or Next.js code, load `vercel-react-best-practices` before writing code and use it while implementing. After edits, do one focused pass over the touched React/Next.js files for missed performance or Server/Client boundary issues.
