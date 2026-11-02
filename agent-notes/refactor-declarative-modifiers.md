# Declarative modifier signs

## Goal
Move the twelve modifier cell strings into the existing cited technical source and generated program, preserving the public modifier names and rendering behavior. The smallest change extends the current technical contract/compiler/generator and deletes the runtime table and accessor, roughly 100 handwritten lines.

## State
Implemented the twelve mappings as cited source data, compiled into the technical program. The public TechnicalModifier type is re-exported from the shared contract. Deleted the runtime modifier table and accessor; postfix placement and protection offsets remain unchanged.

## Decisions and why
Use semantic modifier names directly, without invented print characters. Reuse the existing technical source, citation validation and generator. Keep fixed BRF expectations unchanged. This branch starts from integrated main independently of the shape and delimiter branches.

## Surprises
The general Grade 1 program/provenance and every Grade 2 generated file have no diff; only the generated technical program changed. No Grade 2 translation or oracle ledger changes were made.

## Verification
Read original GTM 2014 page images for printed pages 57-59. Ran npm ci --ignore-scripts, npm run grade1:generate, and npx vitest run --coverage.enabled=false test/grade1-rule-compiler.test.ts successfully. The edited compiler tests cover malformed modifier cells and missing/offsite citations. Existing fixed BRF renderer tests remain untouched for hosted CI. No local full CI suite was run.

## Next step
Parent inspects and publishes this independent branch, then waits for hosted CI. Draft PR text is in .oracle-artifacts/pr-body.md. This worker has not published, pushed or opened a PR.
