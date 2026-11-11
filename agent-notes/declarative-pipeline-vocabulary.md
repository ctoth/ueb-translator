# declarative-pipeline-vocabulary (TypeScript side)

## Goal
Compiler-side declarative cleanup shared with the Python package (branch of the same name in `ueb-translator-py`; its note `agent-notes/declarative-pipeline-vocabulary.md` covers the Python side and the full brief):
1. Pipeline inputs routed as one group (Python round trip removal).
2. `"^[a-z]+$"` literal in `expansion-pipeline.json` replaced with the `latinLetters` spelling idiom.
3. String shorthand for pipeline references in `pipeline.ts`.
4. Official citation hosts stated once in JSON and checked once.
5. Technical vocabularies derived from rule JSON keys.

## State
Item 1 DONE: `sources.json` routes `"pipeline": {"program": "expansion-pipeline.json", "inputs": {expansion, groups, families, shortforms, appendix, constraints, longerShortforms, shortformSuffixes}}`; `expansion.ts` hand-written INPUTS list deleted; `pipeline.ts` exports `record`. typecheck, rules:typecheck, lint clean; grade1/grade2 generate:check exit 0.
Item 2 DONE: the ambiguity table's eligibility-word suffix filter tests `spell(guard.word, latinLetters) != null` instead of `^[a-z]+$`. Equivalent: latinLetters is exactly a–z (expansion-policy.json latinPattern), and the empty word is excluded by the neighbouring `startsWith(guard.word, row.rule.input)` (rule inputs are non-empty). grade1/grade2 generate:check exit 0.

## Decisions and why
See the Python note for item 1's reasoning (the routing file says which sources the pipeline reads).

## Surprises

## Next step
Item 3.
