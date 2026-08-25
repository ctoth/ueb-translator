# Ship tiny browser entry points for literary and technical UEB

## Problem

Consumers need explicit, tree-shakeable browser APIs without loading modes or
diagnostics they do not use.

## Scope

- Define stable ESM exports for core cells, uncontracted UEB, contracted UEB,
  technical UEB, and backtranslation.
- Model translation mode and technical input with discriminated unions.
- Support modern browsers without Node polyfills or runtime dependencies.
- Verify package exports and declarations from a packed tarball.

## Acceptance criteria

- Each entry point imports in a clean browser fixture.
- Importing grade 1 does not retain grade 2 or technical rule data.
- Public declarations contain no `any`, unsafe assertion escape hatch, or Node
  type dependency.
- `npm pack` contains only the intended runtime, declarations, README, and license.
- Size reports are generated for each entry point and the combined package.
