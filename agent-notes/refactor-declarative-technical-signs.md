# Declarative technical operation and comparison signs

## Goal

Implement the approved technical.ts extraction: the seven operation and seven
comparison signs, preserving public translation behavior, and publish a PR.
Q authorized execution. Merge and release remain outside the request.

## State

Read the runtime sign tables, their lookup/rendering callers, the existing
symbol source/compiler/runtime, Grade 1 compilation and generation, package
checks, technical documentation and both technical test owners. PR #151 is
still open; this follow-up can be independent against integrated main because
it does not depend on that PR's contraction changes. Do not stack PRs.

Implemented the cited additions and print-reference maps with compileSymbols,
the existing generator, and symbolCell. Focused compiler/technical tests passed.
General Grade 1/Grade 2 generated files remain unchanged; the new technical
program contains only six additional symbols and the 14 print references.

## Decisions and why

Smallest implementation: reuse SymbolRuleSource, compileSymbols and
SymbolProgram. Author the two semantic-name-to-print maps and six additional
technical-only symbol rules in rules/ueb-2024/technical-signs.ts. Emit their
data through the existing generate-grade1 workflow into a separate generated
technical-program.ts. Do not add a new interpreter, expression language,
symbol representation, generator command or CI workflow.

Estimated scope: roughly 150-220 handwritten changed lines, excluding
generated output, across the source records, existing citation/symbol compiler
types, generator, runtime lookups and focused boundary tests. This is larger
than the preceding compiler-only extractions because six mappings do not yet
have an authored owner or generated program.

Eight mappings already belong to the general symbol inventory:

- operation asterisk -> *, divide -> division sign, minus -> U+2212,
  multiply -> multiplication sign, plus -> +;
- comparison equals -> =, greater-than -> >, less-than -> <.

Reuse those records; do not copy their cells into technical data. The six new
technical-only records are dot -> U+22C5, plus-or-minus -> U+00B1,
approximately-equal -> U+2248, greater-than-or-equal -> U+2265,
less-than-or-equal -> U+2264 and not-equal -> U+2260. Preserve their current
Braille strings exactly.

Use the existing RuleCitation shape for the ICEB October 2018 replacement
Section 3, with its actual document title and table/page locators. Extend the
symbol source citation type to accept that cited document rather than falsely
labelling the rules as the 2024 general rulebook. Retain citation validation.

The technical runtime combines the existing general symbol program with only
the six technical-only symbols for semantic sign lookups. Operation and
comparison maps resolve through the existing symbolCell path; negation uses
the same minus lookup. Delete OPERATION_CELLS, COMPARISON_CELLS and the literal
MATHEMATICAL_MINUS definition. The general Grade 1 program stays unchanged.
translateTechnicalText continues to call translateGrade1 directly, so this
must not add support for six new characters to ordinary text translation.

Generation uses existing symbol validation for the six entries and verifies
that all 14 semantic mappings resolve in the combined inventory, without
duplicate print definitions. The typed maps remain exhaustive over existing
TechnicalOperation and TechnicalComparison unions. Citations stay in the
development layer; generated runtime data contains only symbols and maps.

## Source evidence

- src/technical.ts: OPERATION_CELLS, COMPARISON_CELLS, symbolCell, arrowCell,
  enclosureCells, operation/comparison rendering, negation, renderPrintValue
  and translateTechnicalText. Arrows/enclosures already demonstrate reuse.
- rules/ueb-2024/symbols/source.ts contains all eight reusable cell mappings.
- symbols/compiler.ts accepts one-scalar symbol records, validates cited
  inputs and duplicates, and emits the existing SymbolProgram shape.
- scripts/generate-grade1.mts already owns symbol generation and its --check
  reproducibility path; extend that owner rather than adding a second pipeline.
- test/technical-variants.test.ts independently exercises all seven operations
  and seven comparisons with fixed BRF expectations. technical.test.ts covers
  profiles, grouping, negation and grade-1 protection.
- Read original page images of ICEB_2018_OperationComparison, page-000.png
  and page-001.png: the operation/comparison sign tables defining this slice.
  Earlier 2014 pages were inspected for navigation only; the 2018 replacement
  tables control this plan. Local original images remain in papers/.

## Surprises

- The two runtime tables are already declarative TypeScript objects. The
  improvement is one cited source and generated portable data, plus deleting
  duplicated cell definitions; this does not yet make expression layout data.
- Adding the six symbols to the general Grade 1 inventory would change public
  text support. Keep them in the technical-only program instead.
- Shared cells do not imply shared syntax: use the mathematical minus scalar,
  not the hyphen, and the dot operator scalar, not a full stop.
- Rule authoring cannot import public technical.ts, per the existing ESLint
  boundary. The existing operation/comparison names now live once in
  src/technical-program.ts as a shared typed data contract; technical.ts keeps
  its public type exports. No new public runtime entry point is introduced.
- Generation caught a missing explicit declaration annotation, then a .js
  import in the directly executed .mts script. Added the required type and
  used the .ts runtime import, matching the existing script execution model.
  The generator then completed; no checks were bypassed or added.

## Implementation order and validation

1. Add the cited technical-only source records and exhaustive semantic print
   maps; compile using the existing symbol compiler and current general data.
2. Extend the existing compilation/generator owner to emit the separate
   technical program, retaining existing general programs unchanged.
3. Replace the runtime tables and negation's literal minus with those lookups.
   Keep profiles, spacing, grade-1 protection, offsets and rendering unchanged.
4. Retain fixed BRF expectations for all 14 signs. Add focused coverage for
   technical-only inventory resolution, missing references/collisions, and
   preserving ordinary Grade 1/raw technical-text acceptance. Do not add a
   second copy of the mapping table or equality tests between copied tables.
5. Regenerate and inspect the diff, publish an independent PR, and follow
   existing PR CI through its full checks and oracle sweeps. No new gates or
   local rerun of CI as a publication gate.

## Next step

Publish refactor/declarative-technical-signs and follow PR CI. Scripts,
modifiers, shapes, fraction/radical delimiters,
expression layout, profile spacing and grade-1 policy are outside this first
slice. They can be considered separately after it. Implementation is complete
in the isolated worktree based on integrated main.
