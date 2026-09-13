---
name: check-design
description: File completed design screenshots for a research brief and record the comps in the relevant epic and stories.
---

# /check-design - Design Comp Filing Workflow

Use this command after the user supplies screenshots produced for a design-agent brief. Do not design or implement anything. File the supplied images, give them useful names, and record only the design decisions the comps actually settle.

## Inputs

Use `$ARGUMENTS`, the conversation, and supplied image attachments/paths to identify:

- The design brief file and brief number. A brief heading is `## Brief N`.
- The epic or standalone research artifact the brief belongs to.
- The completed screenshot files, which may be separate images or one composite image containing all comps.

If any of these is unclear, ask one question before moving files. Do not guess an epic, brief number, or image source.

## Step 1 - Read the design context

Read the complete brief section, including its `Attach`, `Prompt`, and `Check the output for` sections. Then read:

1. The linked epic, if one exists.
2. Every story named by the brief's `Covers Story ...` line or its surface descriptions.
3. Every existing reference to that brief number, `comps/`, or the surface it designs in those epic/story files.

Use the brief as the source of truth for expected states. Inspect every supplied screenshot before naming it. Do not infer its content from the original upload filename.

## Step 2 - Create the comp destination

For an epic, derive the research name from `ai-research/epics/<epic-name>.epic.md` and use:

`comps/<epic-name>/brief-<N>/`

For a standalone research artifact, use:

`comps/<research-name>/brief-<N>/`

Create `comps/<research-name>/` if it does not exist, then create `brief-<N>/` if it does not exist. Keep existing files untouched. Never put a later brief directly in `comps/` or directly in the epic folder.

## Step 3 - Name and move screenshots

Rename each supplied image before moving it into the brief folder. Use lowercase kebab-case:

`<desktop|mobile|both>-<light|dark|both>-<description>.png`

- Determine `desktop` or `mobile` from the actual viewport.
- Determine `light`, `dark`, or `both` from the actual theme coverage.
- `<description>` is a clear description of the visible state in **six words or fewer**. Do not use generic names such as `screenshot`, `design`, `final`, or `image`.
- Preserve the source extension when it is not PNG.
- If two images would produce the same name, add the smallest meaningful state distinction, not a numeric suffix.

### Composite images

Prefer one referenced composite image when it clearly shows all relevant states. Name it with `both` for each dimension it covers, for example `both-both-clear-list-states.png`. In documentation, reference the same file for each state and identify the visible section it covers. This keeps the delivered artifact intact and avoids crop coordinates becoming another source of truth.

Crop a composite only when the user requests individual image files or a relevant epic/story needs distinct images that cannot be clearly referenced in the composite. Crop only the states that need separate paths, retain the composite as the source, and name each crop by its actual viewport, theme, and state. Use an already-installed image tool if one is available; do not install a library just to crop screenshots.

Move the original files rather than copying them. Before moving, list the planned source-to-destination mapping to the user. Do not overwrite a file: if the target exists, stop and ask whether it is the same comp or needs a different description.

## Step 4 - Record what the comps settle

Update the epic and relevant story files only when the screenshots resolve a visual, content, responsive, accessibility, or UX decision.

- Replace or update the brief's output/reference line with the exact `comps/<research-name>/brief-<N>/...` paths.
- Add a compact `Delivered Comps` table to a relevant story when it does not have one. Include each file and what it covers.
- Update an existing `Delivered Comps`, `Design Agent Handoff`, design gap, decision record, or open question instead of adding a duplicate section.
- Mark a design gap or question as answered only when the screenshots clearly settle it. Record the decision and exact comp path.
- Keep implementation behaviour, acceptance criteria, and unresolved decisions unchanged when the screenshots do not settle them.
- If no epic or story needs an update, do not create one. State that the comps were filed without a research-document change.

## Step 5 - Report

End with:

1. The brief and every final comp path.
2. The epic/story files updated and the decisions recorded.
3. Any brief rejection criterion that the screenshots fail or cannot prove.
4. Any remaining design gap or ambiguity.

## Don'ts

- Do not modify application source, tests, `DESIGN.md`, or implementation plans.
- Do not create placeholder images, fabricate screenshots, or rename files without inspecting them.
- Do not claim a screenshot proves behaviour it cannot show.
- Do not flatten comp folders or use upload-generated filenames.
