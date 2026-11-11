# Declarative runtime predicates (TypeScript side)

The Python side and the full record of decisions are in the sibling repository's note of the same name (`ueb-translator-py`, `agent-notes/declarative-runtime-predicates.md`, branch `declarative-runtime-predicates`).

## Goal
Runtime-side declarative cleanup, translation behaviour unchanged:
1. Typeform modes from `runtime-facts.json` `typeforms.modes`, not the `typeform-` name prefix.
2. One condition form for `grade1Required.rules` and `quotes.rules`, one interpreter.
3. Compiled composition policies built from the vocabulary; compilers and generator name no policy.
4. The profile field that selects operation spacing lives in `technical-operation-spacing-rules.json`.
5. (Python only) duplicate imports.

## State
All four TypeScript items edited.
- Item 1: `src/backtranslation.ts` TYPEFORM_MODE_IDS from `GRADE1_RUNTIME_FACTS.typeforms.modes`.
- Item 2: `rules/ueb-2024/runtime-facts.json` (`sets` + `rules[].when` conditions in both groups; `openingContext`, `closingContext`, `possessiveLetter` replaced by sets `opening`, `closing`, `possessive`); `src/grade1-runtime.ts` (`RuleCondition`, `RuleState`, `ruleState`, `letterRunEnd`, `conditionTest`, exported `compileRules`; deleted the grade1Required compiled-rule types and matcher, the three ASCII quote context helpers and the 11-name switch); `src/backtranslation.ts` apostrophe regex from `quotes.sets.opening`; `test/grade1.test.ts` (unknown-condition test removed, close-without-open test via `compileRules`).
- Item 3: `rules/ueb-2024/grade1-vocabulary.ts` `isCompositionPolicies` (one string per POLICY_NAMES entry); `rules/ueb-2024/policies/compiler.ts` builds `runtime` with `Object.fromEntries` over the vocabulary-ordered provenance (the guard is the "policy is missing" error; the v8-ignored second missing check and the seven-name literal are gone); `scripts/generate-grade1.mts` `compositionPolicies` checks against the keys of `grade1-vocabulary.json`.
- Item 4: `rules/ueb-2024/technical-operation-spacing-rules.json` `field` per jurisdiction; `src/technical-program.ts` `TechnicalOperationSpacing<Value>`; `rules/ueb-2024/technical-signs.ts` source type and compile lines; `rules/ueb-2024/rule-json.ts` reader; `scripts/generate-grade1.mts` isOperationSpacing; `src/technical.ts` operationSpaced.
- Generated: `src/generated/ueb-2024/grade1-program.ts` (facts block: grade1Required and quotes) and `src/generated/ueb-2024/technical-program.ts` (operationSpacing gains `field`/`definitions`) hand-seeded, then confirmed by `grade1:generate:check` exit 0. `grade2:generate:check` exit 0. Composition policies output unchanged.
- Checked locally: `npm run build`, `npm run typecheck`, `npm run rules:build`, both generate checks, eslint on changed files, `npx vitest run test/grade1.test.ts --coverage.enabled=false` (60 passed). Old-vs-new differential (base commit built in the session scratchpad vs this worktree): 3000 generated strings through translateGrade1, translateGrade2, resolveContextualPunctuation, resolveCompositionModes, back-translation, plus 6 technical profiles: identical.

## Decisions and why
See the Python note. Short form: conditions test classes (one-to-one with the old unit kinds for these tests), named sets, edge, skip, not; `elisionEnd` and `elisionWord` stay engine primitives (state written by a rule action; dictionary lookup of the following letter run).

## Surprises
A profile whose `jurisdiction` is outside the type (untyped callers) used to fall back to the bana-2026 table; it now throws a TypeError. Typed inputs are unchanged.

## Next step
Full vitest with the coverage gate, lint over the repository and the remaining typechecks run in CI on the pull request (not run locally by instruction).
