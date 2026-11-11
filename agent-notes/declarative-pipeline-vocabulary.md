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

Item 3 DONE. Expression language references (both interpreters, `pipeline.ts` evaluate / `pipeline.py` evaluate):
- A string expression starting with `$` is a bound-name reference: the rest is a dotted path whose first segment is a bound name (`row`, a variable bound by `each`/`where`/`find`/`some`, or a function parameter); list elements by decimal index (`$row.0`). Missing name → "Unbound name", missing field → "No field", missing index → "No index". (Was `{"get": path}`.)
- A string expression starting with `@` is an input reference: dotted path into the named pipeline inputs (`@expansion.ids.separator`). (Was `{"input": path}`.)
- `{"literal": s}` is the text `s` exactly as written (s must be a string); the only way to write a literal string beginning with `$` or `@`.
- Every other string expression is a literal. Only evaluated positions are affected: names that operators take unevaluated (table/field names of `spell` and `column`, the variable name of `each`/`where`/`find`/`some`, the function name of `call`, the path of `optional`, step fields such as `from`, `source`, `as`) are plain strings as before.
- `{"get": ...}` and `{"input": ...}` are deleted (now "Unknown expression operator"); `{"optional": path}` is unchanged.
`expansion-pipeline.json` rewritten: 228 references (203 get + 25 input), 16,729 → 14,855 bytes; a structural probe confirmed the new file equals the old with each get/input node replaced by its shorthand, and no literal in the old file began with `$` or `@`. Tests: `test/pipeline.test.ts` (new cases: bound name, whole row, input, literal `$`/`@` text, removed `get`, missing input, non-text literal; `$&` replacement now written `{"literal": "$&"}`), `test/grade2-rule-compiler.test.ts`. No DATA.md/README text describes the expression language, so none changed. Verified: typecheck, rules:typecheck, lint clean; vitest pipeline/grade2-rule-compiler/rule-json 180 passed; grade1/grade2 generate:check exit 0.

## Decisions and why
- Item 3 sigils `$`/`@`: no string literal in the pipeline file (or its tests) starts with either; regex fragments there start with `^`, `(`, `)`, `]`. Escape is an explicit `literal` operator rather than doubling so a reader never has to count sigils.
See the Python note for item 1's reasoning (the routing file says which sources the pipeline reads).

## Surprises

## Next step
Item 3.
