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

## Object literals

- **Object literals returned from a function: always break across multiple lines.** One key per line, trailing commas off, closing `}` on its own line. Even for short objects (2 keys) and even for "obvious" one-liners. This keeps the shape scannable in diffs and matches the repo's house style (see `src/app/api/catalog/_utils.ts:88-93`). Avoid the form at `src/app/api/catalog/_utils.ts:67` and `src/app/api/catalog/_utils.ts:76`.

  ```ts
  // ponytail: object literal on multiple lines, even for two keys
  return {
    ok: true,
    value: fixedSize
  }
  ```
