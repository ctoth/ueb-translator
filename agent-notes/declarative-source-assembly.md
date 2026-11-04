# Goal

Make source assembly declarative across the TypeScript and Python compilers, then assess remaining policy in compiler stages. Preserve existing output. Q subsequently authorized committing the TypeScript work locally; Python stays uncommitted.

# State

Implementation complete in both compilers. sources.json declares the source tree, citation catalog and ordered symbol families. TypeScript consumers use sourceData and its static import registry; Python assembles the tree and decodes it into Sources without a per-field filename/type checklist. Both symbol expanders consume the same typed descriptors. Shortform pair decoding belongs to the Python codec. Documentation updated in DATA.md and Python README. Both final complete emitted bundles exactly match the captured pre-edit bundle, and src/generated has no changes. Existing dirty work preserved; no commits.

Verification completed: grade1:generate, grade2:generate, edited Vitest rule-json.test.ts, Python tests/test_compiler.py including generated symbol-family differential cases, strict Pyright, Ruff lint/format and git diff --check for rules/tests. No hosted CI, full oracle sweeps or fuzz replay were run; runtime artifacts did not change.

# Decisions and why

Smallest change: a shared typed source manifest declaring the source tree's destinations and JSON filenames, plus ordered symbol-family descriptors. Python uses its existing attrs types to decode assembled raw records. TypeScript retains static JSON imports as a transport registry because its current tsc build copies imported JSON and its rules project does not enable Node APIs; the manifest controls assembly rather than introducing filesystem loading or a new asset-copy build step. Each language retains its own typed decoders. The manifest contains no Python class names, TypeScript reader names, arbitrary expressions, or executable callbacks.

Symbol descriptors declare the existing input tables, order, kind, citation, ID prefix and the few existing transformations (uppercase, first UTF-16 code-unit hex, digit mapping from Latin). Use a small discriminated union covering current cases, not an expression language. Preserve reviewed finite tables and all source/provenance ordering. Estimate 200-350 implementation lines touched per compiler plus the shared declarations and focused tests. Confirm the exact descriptor shape against all current symbol records before coding.

Assessment: grade1.py combines declarations of mode/class/policy vocabularies and wire order with compiler mechanics. Shared explicit wire-order data is a sensible next extraction, with existing language types retained. Sorting, duplicate detection, citation validation, bitmask construction and tuple lowering remain compiler functions. technical.py likewise contains real symbol-reference resolution and validation. Do not replace these algorithms with a generic policy interpreter. This assessment does not authorize an additional format migration beyond source assembly.

# Surprises

TypeScript rules compile with static JSON imports and no Node types. A filesystem manifest loader would require build changes; retaining a static transport registry avoids that expansion. Python Shortform records currently come from pairs, and symbol construction is derived, so merely replacing filenames with a dictionary would leave meaningful assembly hardcoded.

cattrs does not support raw object annotations by default. Its raw-value hook must match exactly object through a predicate; registering object with singledispatch also intercepts its subclasses. The exact-match hook preserves raw routing values until the completed Sources decoder checks destination schemas. Initial test failures from these hook choices were repaired; the final full test file passes.

# Next step

Authorized shared work and verification are complete. Q now requests a local TypeScript commit including related task notes; no push, PR or merge. Python stays uncommitted. Grade 1 wire-order extraction was subsequently completed in the separate declarative-grade1-vocabulary task. Validation, sorting, bitmasks, reference resolution and lowering remain compiler mechanics.
