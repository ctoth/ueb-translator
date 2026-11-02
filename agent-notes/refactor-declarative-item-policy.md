# Goal

Implement Q's approved fourth slice after normal merges of PRs #154-156:
move script/root-index item grouping into cited technical rule data, publish
one independent PR from integrated main and finish its hosted checks.

# State

Branch refactor/declarative-item-policy starts from main containing all three
merged sign extractions. Main's unrelated dirty notes are preserved there.
Read the existing expression types, isOneItem switch, renderScriptValue and its
script/root callers, technical source/compiler/generator and grouping tests.
Primary evidence is the original GTM Section 7.1 p.34 and 12.1 p.57 page images.

# Decisions and why

Smallest change: relocate existing expression types and SimpleArrowDirection
to the existing shared technical contract, re-export public types, add a cited
boolean map for the fifteen non-identifier kinds plus the identifier Unicode
pattern, and delete isOneItem. Roughly 80-120 handwritten lines plus type moves
and the existing test updates. No new framework, module or public entry point.

Preserve eight true kinds, seven false kinds, and the exact one-letter followed
by combining-marks predicate. Preserve render failures, delimiters, profiles
and grade-1 requirement offsets for scripts and indexed radicals. The separate
standing-value classification remains outside this slice.

Strengthen the existing all-variants test to fixed BRF output, retain nested GTM
cases and preferred-grade1 expectations, and cover supported accented and
decomposed identifiers. Existing hosted CI/oracle workflow is the full gate;
only edited test files may be run locally after source edits finish.

# Surprises

The edited all-variants test now asserts complete fixed output for every kind,
including precomposed/decomposed accented identifiers and multi-letter input.
The existing indexed-root test also checks both grouped and atomic identifiers.
Generation changed only the technical artifact; general Grade 1/2 data and
oracle ledgers have no diff. The edited compiler and technical-variants test
files passed. No full CI ran locally.

# Next step

Implementation and existing-generator output are complete. The boolean map
and identifier pattern are cited to GTM 7.1/12.1; the compiler validates the
pattern and citation, and the generator checks the closed map shape.
isOneItem is deleted; the renderer consumes generated policy directly.
Commit/push/open the PR and wait for full hosted CI and oracle sweeps.
No merge of this new PR or release has been requested.
