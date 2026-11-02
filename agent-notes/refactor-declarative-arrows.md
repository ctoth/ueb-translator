# Goal

Move the eight arrow direction-to-print references into the existing technical
rule data/compiler/generator in one independent main-based PR. Preserve public
SimpleArrowDirection values, shared symbol cells and rendering behavior.

# State

Branch refactor/declarative-arrows starts from integrated main containing #157.
Implemented the eight arrow print references in the existing mappings/program,
extended compiler reference validation and generator closed-map validation,
and removed runtime ARROW_PRINT/arrowCell. The public direction values and
protection offsets remain unchanged. Existing fixed BRF arrow tests are untouched.
Read the shared contract, technical source/compiler, generator and runtime
arrow callers, plus existing eight fixed BRF arrow cases. Visually read original
GTM 2014 Section 13.1 printed page 60 (page-065.png); its eight simple arrow
directions and cells agree with the existing shared symbol inventory.

# Decisions and why

Smallest slice is roughly 60-100 handwritten changed lines: add an arrows
semantic print-reference map alongside operations/comparisons, extend the
existing closed-map validation, and delete runtime ARROW_PRINT and arrowCell.
Derive the unchanged public direction type from one shared direction inventory.
No new cell definitions, source modules, DSL, public entry points or workflows.
The source comment distinguishes GTM 13.1 arrows from the 2018 Section 3 signs.

Use apply_patch for writes. Run the existing generator and only the compiler
test file being edited after source edits complete; full hosted CI belongs to
parent publication. General Grade 1/2 artifacts and oracle ledgers stay unchanged.

# Surprises

Only the generated technical program changed. General Grade 1/2 generated
artifacts and oracle ledgers have no diff. No cell definitions were copied.
The arrow-spacing prose on GTM p.60 does not expand this mapping-only slice;
current spacing behavior is preserved.

Ran npm ci --ignore-scripts, npm run grade1:generate, and
npx vitest run --coverage.enabled=false test/grade1-rule-compiler.test.ts.
Generation and the edited test file passed; git diff --check is clean.
No full local CI or other test files were run.

# Next step

Locally committed; hand the completed diff plus .oracle-artifacts/pr-body.md
draft to parent. Parent inspects, publishes and waits for hosted CI/oracles.
This worker never pushes, opens a PR, posts comments/reviews or merges.
