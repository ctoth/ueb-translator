# Declarative composition scans (TypeScript side)

## Goal
Review 2026-11-11 item 1 (C5): state the composition scans in `src/composition.ts` as rule JSON interpreted by a generic engine, with no behaviour change. The Python side and the full record are in the Python repository's `agent-notes/declarative-composition-scans.md` (branch `declarative-composition-scans`).

## State
TypeScript side done and committed on branch `declarative-composition-scans`.
- `rules/ueb-2024/runtime-facts.json` gains two cited groups whose condition sets are the composition policies (names resolve against the `policies` argument of `compose`):
  - `standing` (2.6, locator from policies/rules.json): two conditions in the existing runtime-facts condition form; `previous` is tested at a component's first unit, `next` at its last.
  - `lowerSigns` (10.5, locator from the lowerPunctuation policy citation): `within` (condition that keeps a walk outward from the contraction range going) and `facts` (transducer input name -> rules in the existing `{when}` form; a fact holds when a rule holds at any walked unit).
- `src/grade1-runtime.ts`: exports `conditionTest`, `RuleState`, `RuleSets` (a set may be a list or a policy string; membership is `includes`, as before for each) and `unitRuleState(units)` (also used by resolveContextualPunctuation). `unitModeClasses` returns precomputed masks instead of calling `classMask` with spread arrays per unit (keeps the back-translation round-trip workload at base speed; see Decisions).
- `src/composition.ts`: `compose(symbols, modes, policies, scans, contractions?)`; `scans` is `CompositionScans` (callers pass GRADE1_RUNTIME_FACTS). Deleted `isStandingBoundary`, `standingAt`, `lowerSignContext`. Scan conditions are compiled once per `compose`.
- Callers updated: `grade1.ts`, `grade2.ts`, `foreign-language.ts` (2), `test/grade2-rule-compiler.test.ts` (7 compose calls).
- Generated: `src/generated/ueb-2024/grade1-program.ts` gains only the two groups inside GRADE1_RUNTIME_FACTS (106 added lines, no other change).

Checks run (all exit 0): `npm run build`, `typecheck`, `rules:typecheck`, `browser:typecheck`, `oracle:typecheck`, `corpus:typecheck`, `lint`, `grade1:generate:check`, `grade2:generate:check`; `npx vitest run test/grade2-rule-compiler.test.ts --coverage.enabled=false` 42 passed. Not run locally (by instruction): full vitest with the coverage gate, package verification, size report.

Differential (scratch, not in the repo): base commit archived and built; 3000 (seed 1) and 5000 (seed 99) generated inputs through translateGrade1, translateGrade2, translateGrade2Internal (applied rules), Grade 2 documents (word runs alone/joined, text runs, typeforms, foreign runs), back-translation of every fifth Grade 1 and Grade 2 result, and 2 technical documents: 0 differences. Sensitivity check: with the scan data mutated in `dist` (one skip set and one source set changed) 1000 inputs gave 200 differences, so the comparison sees these scans.

Timing (scratch replica of the "round trips generated lowercase words and sentences" workload, plain node, no coverage, 3 x 8 seeded runs alternating base/new): sums base 12.13 / 12.07 / 12.20 s, new 12.48 / 11.76 / 11.95 s. Before the unitModeClasses change new was 4-8% slower per run. The vitest file itself was not run (not a file I edited).

## Decisions and why
- Kept as code, reasons in the Python note: `isCompleteAmbiguityLiteral` (2.6.3 apostrophe-suffix alternative needs a multi-position, base-letter test), `dashComponentAt` and `exclusionComponent` (return ranges; their only UEB content is the policy set name, already data), the 10.9.7-10.9.9 indicator decision (its UEB inputs are already data in the Grade 2 program; the rest is engine facts).
- Policy strings are passed to the condition interpreter directly as sets (`includes` on a string), so composition keeps the substring membership it had (`isOneOf`); no symbol print has more than one code unit, and letter-with-mark and CRLF sources are never substrings of a policy string.
- Standing boundary = class `sequence-boundary` or source in `standingBoundaries`: same as the old `kind === "line-boundary" || isOneOf(source, standingBoundaries)` because space units always have source " ", which the policy lists. A caller passing a `standingBoundaries` without " " would now still treat spaces as boundaries; no caller does (`compose` is not a public export).
- `scans` is a separate parameter (data reaches `compose` as parameters; eslint forbids composition.ts importing generated data).
- unitModeClasses masks: the new per-translate `unitRuleState` adds one more classes pass; precomputing the six masks removes the per-unit spread allocations and brings the round-trip workload back to base speed.

## Surprises
- `npm run grade1:generate` builds `rules/` first, which type-checks `src/composition.ts`; an error there blocks regeneration until fixed.

## Next step
Lead pushes and opens the PR; CI runs the full vitest (100% coverage gate), package and size checks.
