# Goal

Apply the four authorized rule-format simplifications to shared JSON and the TypeScript compiler, coordinated with the Python compiler agent. Q has now authorized a local TypeScript commit; keep Python uncommitted and do not publish.

# State

Implemented shared JSON format, TypeScript contracts/readers and expansion; DATA.md documents the current format and labels the original extractor as historical. Removed static print-name guard branches, special ence compiler branch, longer-shortform/suffix word-name branches, structural-crossing source/reader and redundant authored exception IDs. Root verified current complete TypeScript and Python bundles match the original captured TypeScript output exactly; all expanded contextual records match after normalizing guard-array order only. Python owner reports full suite/static checks pass against current data.

Local permitted commands: npm run rules:build exited 0; npm run grade1:generate and npm run grade2:generate exited 0 (each includes rules build). npx vitest run --coverage.enabled=false test/rule-json.test.ts test/grade2-rule-compiler.test.ts exited 0, stdout reports both edited test files pass. git diff -- src/generated emitted nothing; runtime/provenance artifacts have no drift. git diff --check exited 0. After the final type-safe assertion adjustment, npx vitest run --coverage.enabled=false test/rule-json.test.ts exited 0 again. No npm run check, full TS CI, oracle sweeps or fuzz replay run locally, in accordance with uncommitted/local-CI instructions; translation/generated output is unchanged. No commits or publication.

# Decisions and why

Smallest design: shallow citation-document lookup; three explicit longer-shortform guard groups and default/exception suffix data; family metadata combining locators and static guards, with per-group guards and one explicit ence variant; derive existing exception IDs; one-line print/cell pairs preserving array order. Retain finite word expansion, possessives, exception joins, collision detection and current ABI. No generic rule framework, expressions, recursive inheritance or compatibility shims. Initial estimate was 100-150 executable lines net removed; actual TypeScript compiler source reduction is 33 lines across program.ts, rule-json.ts, grade2-rules.ts and source.ts because checked decoding/types for the explicit data add source code. This is separate from large JSON formatting savings.

# Surprises

Stable source ordering matters for equal-length collision spellings, so splitting groups must preserve original record order. Citations resolve to the existing full source contracts and emitted provenance; no new output format.

The first compact pair renderer replaced a quote-comma-quote substring in serialized arrays; for a comma scalar that substring belongs to the element itself. This changed the comma print to comma-plus-space. Corrected the renderer to serialize elements individually and join with comma-space, then corrected the affected general-symbol record. Existing scalar validation found it; no new guard was added.

# Next step

TypeScript work and permitted verification complete. Root independently recompiled both final implementations after the last source edits and confirmed both complete emitted bundles equal the captured original output. Generated runtime/provenance files remain unchanged. Both forked agents have finished and were stopped after root checked their work. Q subsequently requested committing the completed TypeScript work locally with its related task notes. Python remains uncommitted; no push or PR is authorized.
