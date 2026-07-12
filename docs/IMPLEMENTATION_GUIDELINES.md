# Implementation Guidelines

Project-wide rules for writing code in `fe-tehesa`. Apply throughout; override defaults when in conflict with anything else.

## Control flow

- **One-line `if` returns: always use curly braces.** Even for a single `return` or assignment, wrap the body in `{ ... }`. This keeps diffs safe when adding a second statement later and matches the repo's house style (see `src/app/api/catalog/brand/route.ts:16-18`). Avoid the form at `src/app/api/catalog/brand/route.ts:19-20`.

  ```ts
  // ponytail: curly braces required even for one-liners
  if (!brandId.ok) {
    return failure(brandId.error.code, brandId.error.message)
  }
  ```
