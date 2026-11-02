# Goal

Mechanically move authored UEB rule data to JSON, preserving meaningful TypeScript types, compiler expansions and byte-identical generated programs. Q authorized the finished plan with "Make it so!". Deliver one atomic PR through hosted validation and normal merge; compiler port follows later.

# State

Published PR #165 against main on refactor/json-rule-data. Generated output unchanged; focused JSON tests passed. Hosted typechecks now pass after the extractor argument narrowing repair. Lint identified two numeric template interpolations and the deprecated boolean import-clause overload/isTypeOnly property. Converted numbers explicitly and switched to the installed TypeScript 6 phaseModifier overload after reading typescript.d.ts. Pushing this scoped repair; oracle runs remain in progress. Merge after all gates pass.

# Decisions and why

Smallest implementation is a task-specific TypeScript-AST extractor (approximately 250-400 lines), family JSON beside existing sources, retained typed source boundaries and existing compiler pipeline (approximately 300-600 integration lines). No new schema framework, external dependency or runtime artifact format. Parser handles the finite literal/helper forms actually present and refuses unsupported forms. All emitted files are applied through apply_patch.

Preserve compact canonical Latin tables and derive digit cells once. Preserve technical print references, constructor ordering, IDs/citations, regex sources/flags and exact numbers. Helpers still needed to expand compact JSON are compilation work. TypeScript types/unions and ABI metadata remain TypeScript. Read JSON through checked typed boundaries without assertions or any. Existing generators must produce unchanged runtime/provenance files.

# Surprises

Several rule files construct data with helpers, map/slice, family expansion, template strings and Number.MAX_SAFE_INTEGER. Pure syntax replacement or flattening every export would mishandle shared source relationships. Existing compiled exports supply reference values for complete records; AST supplies compact tables and helper arguments.

Generator compilation caught an object narrowing error, redundant import-type modifier, flatMap inference choosing one variant, and an exported metadata list missing its isolatedDeclarations annotation. These are corrected at their typed owners, without assertions or relaxed checks. The first comment scanner missed comments after template expressions; parser-owned comment ranges now preserve them in DATA.md.

# Next step

Wait for PR #165 full hosted CI and dictionary/corpus oracles; repair scoped failures, merge when gates pass, verify integrated main and clean up. Generated runtime/provenance, normative behavior and ledgers must remain unchanged. No second-language compiler port.
