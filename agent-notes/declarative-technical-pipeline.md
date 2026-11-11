# declarative-technical-pipeline (TypeScript side)

## Goal
Technical-notation compilation as a second pipeline file run by the existing interpreter (`rules/ueb-2024/pipeline.ts`; Python `src/ueb_compiler/pipeline.py`). Hand-written compile step, readers and generator shape validators deleted. Generated output unchanged. The Python branch of the same name (`ueb-translator-py`, note `agent-notes/declarative-technical-pipeline.md`) covers the Python side, the full brief and the check-by-check table.

## State
DONE on this branch, committed:
- `rules/ueb-2024/technical-pipeline.json`: step `citations` (cites every technical group; output unused, a bad citation fails) and step `program` (the compiled record). Output `program` is a one-row table.
- `sources.json`: `"technical": {"program": "technical-pipeline.json", "inputs": {...14 files...}}`; `source-files.ts` registers the file.
- `pipeline.ts` additions: step op `row`; expressions `each` over a record (maps values, keeps keys), `without`, `source`, `isInteger`, `less`, `add`.
- `technical-signs.ts`: only `compileTechnicalSigns(overrides = {}, general = SYMBOL_RULES)`: decodes the additional symbol rules (`readSymbolRules`), compiles general+additional symbols (`compileSymbols`), runs the pipeline with inputs `documents`, `compiled` and the routed sources, takes the one row, checks `isTechnicalLayouts`.
- `grade1-program.ts`: `TECHNICAL_SIGN_PROGRAM` is the pipeline's JSON record; its shape is checked by tsc where `generate-grade1.mts` emits it as `TechnicalSignProgram`.
- Deleted: 14 typed source constants and the 15-argument compiler (`technical-signs.ts` 234 -> 23 lines), the 14 `readTechnical*` readers and `isPair` (`rule-json.ts` 255 -> 167; `mapOf` no longer exported), the generator's `technicalProgram` and 12 shape validators (`generate-grade1.mts` 347 -> 224).
- Tests rewritten to feed the pipeline: `test/grade1-rule-compiler.test.ts` (technical block), `test/technical-layouts.test.ts` (last two cases), `test/rule-json.test.ts` (reader cases removed; source path), `test/pipeline.test.ts` (new ops).
Verified locally: `npm run build` 0; `npm run typecheck`, `rules:typecheck`, `browser:typecheck`, `oracle:typecheck`, `corpus:typecheck` clean; `npm run lint` clean; `grade1:generate:check` and `grade2:generate:check` exit 0 (generated `technical-program.ts` and `technical-vocabulary.ts` byte-identical); vitest on the four edited test files 296 passed (coverage disabled, per brief).
Not run locally: full vitest with the 100% coverage gate, tools/liblouis-oracle tests (CI on the PR).

## Decisions and why
- Record output is a one-row table from the new `row` step; the caller flattens the output tables and takes the single row. No change to `outputs` semantics, so expansion consumers are untouched.
- Groups are copied whole and only transformed fields are replaced (`merge`, `each`), so an unknown key still reaches tsc on the generated file. Consequence: an extra key inside an enclosure pair, shapes definitions, item or numeric-continuation definitions is now rejected (tsc excess-property check) where the old readers dropped it silently. Rejects more, never less.
- Shape checks (exact key sets, string/boolean values, script position, spacing booleans) are guaranteed by tsc on `src/generated/ueb-2024/technical-program.ts` (declared `TechnicalSignProgram`, key unions from the generated vocabulary) plus `grade1:generate:check` (vocabulary and program must regenerate byte-identically). Value checks are pipeline `fail`s.

## Surprises
- `noUncheckedIndexedAccess` plus the 100% branch gate: the single output row is taken with `Object.values(tables).flat()` and `record(toJson(row))` so no `?.`/`??` branch is added.

## Next step
Lead pushes and opens the PR; CI runs the full suite and coverage gate.
