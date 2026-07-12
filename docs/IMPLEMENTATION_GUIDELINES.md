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

## Error messages

- **Validation error messages must be specific.** A generic string like `"Invalid pageSize parameter"` (see `src/shared/constants/catalog.constants.ts:15`) hides what actually went wrong. The message should name the failing input and the rule it violated — expected value/range/type, and ideally the offending value (sanitized). This is what the API client gets back and what shows up in logs; "invalid" with no context is a debug trap.
- Build messages at the call site, not in the constants file. Constants hold error **codes** and short **labels**; the human-readable detail (expected vs. actual, allowed range, format) is composed where the validation runs. See the bad pattern in `src/app/api/catalog/_utils.ts:95-103` where `MSG_CAT_VAL_002` is returned as-is with no context about `fixedSize` or `value`.

  ```ts
  // ponytail: compose the message at the call site, include both expected and actual
  return {
    ok: false,
    error: {
      code: CAT_VAL_002,
      message: `pageSize must equal ${fixedSize}, got ${String(value)}`
    }
  }
  ```
