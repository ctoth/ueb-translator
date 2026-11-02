# Declarative groupsign policy

## Goal

Move the Grade 2 candidate restrictions selected by contraction spellings in
composition.ts into the existing contextual rule data, preserving behavior.
Q authorized execution and opening a PR. No merge or release is requested.

## State

Working on refactor/declarative-groupsign-policy, based on integrated main in
an isolated worktree. The original checkout's unrelated files are preserved.

## Decisions and why

- Smallest change: two operand-free contextual guards for stable following
  modes and stable adjacent modes, authored on the existing rule records.
  Extend the existing isStableSpan context callback to report these facts.
  Estimated handwritten production change is about 100-180 lines excluding
  generated data, tests and documentation.
- The existing word-start guard already rejects a preceding letter, including
  modified letters and letters before medial apostrophes. Every affected
  initial groupsign and the be wordsign already declares it. Delete the
  duplicate composition condition rather than adding another predicate.
- Declare following-mode stability on be (both wordsign and groupsign), con
  and dis; declare adjacent-mode stability on ea/bb/cc/ff/gg. Keep those
  declarations beside their inventory entries, not in a separate lookup.
- Keep universal interior mode-span stability in the transducer using the
  same existing context callback; delete the separate canApply callback.
- Keep unrelated compiler syllable and precedence policies outside this slice.
- Source evidence: composition.ts candidate callback and contractionRanges;
  contextual-transducer.ts guard evaluator; contextual-schema.ts;
  contextual-compiler.ts; grade2-rules.ts and program.ts; existing compiler,
  contextual-transducer and Grade 2 tests; CI and oracle workflows.
- Normative page images read in the original checkout:
  papers/ICEB_2024_RulesUnifiedEnglishBraille/pngs/page-154.png through
  page-158.png, printed pages 127-131. Rules 10.6.2-3 describe initial
  groupsign placement and following capitals; 10.6.6 describes capitals
  adjacent to internal lower groupsigns. This extraction preserves the
  current generic mode handling and does not change policy semantics.

## Surprises

- be is both a wordsign and a groupsign; annotate both to preserve behavior.
- Previous-boundary checks currently use map membership, while following
  checks inspect nonempty indicator strings. Preserve that distinction.
- Normal PR oracle CI includes full dictionary and retained-corpus sweeps,
  but not release fuzz replay. The existing nightly workflow has no seed
  input. After publication, run the existing fuzz runner with the recorded
  baseline seed against this branch using the already installed WSL oracle;
  do not change workflows or use local suite runs to gate publication.

## Iteration 1

Target owner: authored contextual guards and their existing compiler/runtime.
Delete: spelling-based groupsign classifications and duplicate eligibility
callback in composition.ts; runContextualTransducer's canApply parameter.
Rewrite: isStableSpan and canCollapseModeSpan to express generic adjacency.
Keep: parsing, lexical ranges, ambiguity handling, mode emission, precedence,
syllable policies and oracle ledgers.

## Next step

Implemented both guards in the existing schema/compiler/interpreter and
authored them on nine existing rules, including both be rules. Deleted the
composition spelling classifications and canApply callback. Reused word-start
for preceding-letter eligibility. The generated program retains its existing
rule IDs and outputs, adding only guards and corresponding compact offsets.
Focused compiler/runtime tests passed. Added rule-data tests that apply the
same restrictions to different spellings and allow the former special
spellings when no restriction is declared.

Commit/push/open the PR. Do not run CI's suite as a local push gate.
Follow PR CI through npm run check and full dictionary/
corpus sweeps, and run a fuzz replay. Inspect pushed-head results. If evidence
changes, review each disagreement against local ICEB images and preserve
distinct digests. Do not weaken checks or add new gates.
