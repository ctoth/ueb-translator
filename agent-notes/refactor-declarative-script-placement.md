# Declarative technical script placement

## Goal

Declare the existing six script indicators and before/after-base placement in
technical rule data. Delete the runtime indicator table, its accessor and the
two named left-script comparisons. Preserve behavior and publish a PR.
Q authorized execution and PR creation; merge and release are outside scope.

## State

Working on refactor/declarative-script-placement in an isolated worktree based
on integrated main after #152. Preserve unrelated main-checkout notes/files.

Implementation and generation completed. The existing technical program now
contains six indicator/position descriptors; the runtime consumes their
position without named left-script comparisons. The general generated
programs are unchanged. Edited compiler tests passed, including empty/non-
Braille indicators and missing/off-site citations. Existing fixed BRF script
expectations remain unchanged and will run in PR CI.

## Decisions and why

- Smallest change: extend the existing TechnicalSignProgram with six script
  descriptors (indicator and before/after position), author them in the existing
  technical source, and extend the existing compiler/generator. Expected scope
  roughly 100-150 handwritten changed lines including focused tests.
- Move the existing script-placement names into the shared data contract and
  preserve the public type export, as with operations/comparisons in #152.
- Group the six definitions under one cited source record for GTM Section 7.
  It is a descriptor table, not print-scalar data: do not invent Unicode print
  symbols to make these indicators fit SymbolProgram.
- Reuse the existing position-dependent renderer and offset calculations;
  replace its named cases with the descriptor's position. Keep grouping,
  grade-1 policies, profiles, symbols, modifiers, shapes and radicals unchanged.
- Read technical.ts scriptIndicator and complete script renderer; the shared
  technical contract; technical-signs.ts compiler; generator; compiler and
  technical-variants tests. Existing fixed BRF tests cover all six placements.
- Normative evidence read visually: ICEB_2014_GuidelinesTechnicalMaterial
  images page-039.png through page-045.png, printed pages 34-40. Indicator list
  on p.34; Section 7.3 gives ordinary right scripts, 7.8 on p.38 puts left
  scripts before the base, and 7.9 on p.39 defines directly-above/below signs.

## Surprises

- Scripts are not ordinary print scalars. The new field belongs in the
  existing technical program, without adding symbols to text translation.
- Preserve current public type names and request shapes. The existing rule
  authoring boundary forbids imports from public technical.ts.

## Iteration 1

Owner: existing technical rule source, generated technical program and shared
data contract. Move: indicator definitions and placement choice. Delete:
SCRIPT_INDICATORS, scriptIndicator and named left-script condition. Keep:
rendering, grouping and offset mechanics. Search for those old surfaces after
editing; generated Grade 1/Grade 2 programs must remain unchanged.

## Next step

Publish the PR
and follow its existing full CI and dictionary/corpus sweeps to completion.
Do not run CI's suite locally as a push gate or add CI gates. Preserve fixed
BRF expectations rather than deriving expected output from the new table.
Final CI updates may remain local without a bookkeeping commit.
