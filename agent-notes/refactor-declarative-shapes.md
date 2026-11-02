# Declarative shape signs

## Goal
Move the existing eight shape names, three fill prefixes and optional terminator into the existing cited technical-sign source and generated program. Preserve the public shape API and rendering behavior.

## State
Implemented on independent branch `refactor/declarative-shapes` from integrated main. The existing technical source now owns the shape inventory and citation; the generator emits `TechnicalSignProgram.shapes`; the renderer reads it. The public shape name and fill values are preserved.

Completed `npm ci --ignore-scripts`, `npm run grade1:generate`, and `npx vitest run --coverage.enabled=false test/grade1-rule-compiler.test.ts`. Generation compiled the rule source successfully; the edited compiler test file passed. The generated diff changes only `src/generated/ueb-2024/technical-program.ts`; general Grade 1 and Grade 2 programs are unchanged. Full CI was not run locally and remains for parent publication.

## Decisions and why
The smallest change adds `shapes` to `TechnicalSignProgram`, compiles cited names/fills/terminator through the existing generator, and replaces runtime literals with lookups (roughly 100-160 handwritten changed lines). Shape concatenation and caller-selected termination stay in the interpreter. No print scalar mappings are needed for semantic shape signs.

Read original GTM Section 14 images `papers/ICEB_2014_GuidelinesTechnicalMaterial/pngs/page-070.png` (printed p.65: shape indicators and specific shapes) and `page-071.png` (printed p.66: termination rules). Existing cells agree with the sign inventory. Source citation will reference Section 14, pp.65-66.

## Surprises
None.

## Next step
Parent verifies and publishes the local commit as an independent PR against main, then reads hosted CI. PR body draft is `.oracle-artifacts/pr-body.md`. This worker does not push or publish.
