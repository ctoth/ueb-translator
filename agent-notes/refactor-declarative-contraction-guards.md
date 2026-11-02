# Declarative spelling-specific contraction guards

## Goal

Move four existing guards into authored rule data: ing not-word-start; ever
previous-not ei; one previous-not o; under previous-not ao. Delete the matching
compiler branches, preserve generated behavior, and publish a PR. Q authorized
execution of this bounded follow-up. Merge and release are outside the request.

## State

Working on refactor/declarative-contraction-guards, based on integrated main
after PR #150, in an isolated worktree. Preserve unrelated main-checkout files.

Implemented all four declarations using the existing inventory helper and
guards arrays, deleted their compiler branches, and documented the source
ownership. The generator completed successfully; both tracked generated files
are unchanged. No schema, runtime, test or ledger modifications were needed.

## Decisions and why

- Smallest change: use the existing inventory helper and guards field to
  author the four restrictions; compileGrade2RuleGuards retains only their
  existing shared category/exception guards. Roughly 40-70 handwritten changed
  lines, with no new guard, schema, helper, protocol or runtime machinery.
- Keep all other guard policies, exceptions, contextual variants, priorities,
  runtime and oracle ledgers outside this slice.
- Current source defines the behavior being preserved. Do not reinterpret
  normative rules or change oracle adjudications as part of this extraction.
- Source read: grade2-rules.ts; compileGrade2RuleGuards and contextualRule in
  program.ts; ContextualRuleGuard in contextual-compiler.ts; relevant existing
  compiler and Grade 2 behavior tests; architecture docs and oracle workflow.
- Regeneration should leave both tracked generated files unchanged. Existing
  translation and compiler tests provide behavior coverage; do not add tests
  that merely repeat the four data assignments.

## Surprises

- The source inventory order may change when entries with distinct guards
  are grouped separately. The compiler canonicalizes rule order; verify
  generated artifacts remain identical rather than assuming this is harmless.

## Iteration 1

Owner: existing authored guards arrays in Grade2RuleSource.
Move: ing word-position guard and ever/one/under preceding-character guards.
Delete: corresponding spelling conditionals in compileGrade2RuleGuards.
Keep: generic structural guards, initial exception-word guards and all other
rule construction. Search the compiler for those four literal comparisons
after editing; other semantic uses remain outside this scope.
Validate through the existing generator, then PR npm run check, dictionary
and retained-corpus sweeps, and recorded-seed fuzz replay on pushed code.
Do not run CI's suite locally to gate publication or add new checks.

## Next step

Publish and follow checks to terminal results. If
generated output or oracle evidence changes, diagnose it before proceeding.
The note travels with the substantive implementation commit; final validation
updates may remain local without a bookkeeping commit.
