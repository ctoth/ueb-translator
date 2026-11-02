# Declarative contraction precedence

## Goal

Move the existing precedenceFor priorities onto Grade2RuleSource records,
delete the selector, preserve compiled output, and open a PR. Q authorized
execution and PR creation. Merge and release are outside this request.

## State

Working on refactor/declarative-contraction-precedence, based on integrated
main after PR #149, in an isolated worktree. Preserve unrelated main-checkout
changes and notes.

Implemented the required source priority, explicit inventory group values,
direct contextualRule consumption, and deletion of precedenceFor. Updated
the two existing source fixtures and architecture documentation. The existing
generator completed and both generated runtime/provenance files are unchanged.
No runtime, ledger or contextual-variant edits were needed.

## Decisions and why

- Smallest change: add required ContextualPrecedence to Grade2RuleSource and
  the existing inventory authoring helper; specify each group's current
  priority in that source and consume rule.precedence in contextualRule.
  Delete precedenceFor instead of retaining a default or duplicate mapping.
  Estimated scope is 40-70 handwritten changed lines including fixture updates.
- Reuse the existing ContextualPrecedence type. No runtime, schema, guard,
  storage or protocol change is needed.
- Preserve the separate ence preference-exception variant at priority 4.
  This work does not extract that conditional variant or other guard policies.
- Existing inventory groups already separate initial lower groupsigns from
  internal lower groupsigns, so priorities 1 and 3 need no new classification.
- Current source is the authority for the behavior being preserved. No new
  normative interpretation or oracle disagreement adjudication is proposed.
- Read grade2-rules.ts, precedenceFor, contextualRule/contextualRules in
  program.ts, contextual-compiler.ts contracts, existing compiler fixtures,
  Grade 2 precedence behavior tests, architecture docs and oracle workflow.

## Surprises

- The source fixture objects passed to compileGrade2RuleGuards also need the
  required precedence field, even though that helper only produces guards.
- All existing contextual priorities already reside in generated tuples.
  Regeneration should leave the tracked runtime artifacts byte-for-byte
  unchanged; the improvement is to the authored rule data.

## Iteration 1

Owner: Grade2RuleSource and its existing inventory helper.
Delete: precedenceFor and its import of ContextualPrecedence in program.ts.
Rewrite: contextualRule to read rule.precedence directly; source fixtures.
Keep: contextual variants, guard construction, runtime and oracle ledgers.
Search: precedenceFor must have no production references after extraction.
Validation: regenerate with the existing generator and inspect its diff;
then publish and use PR CI for npm run check and full dictionary/corpus
sweeps. Run the existing recorded-seed fuzz replay against the pushed code.
Do not run CI's suite locally as a push gate or add new checks.

## Next step

Commit/push/open the PR and follow its checks through terminal results.
Existing priority-selection and compiler tests will run in CI; no new test
duplicating the authored priority assignments is needed. If oracle evidence changes,
investigate before modifying ledgers. Final status updates stay in this note;
do not create bookkeeping commits just to record CI results.
