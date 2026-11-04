# Goal

Share Grade 1 mode, member-class and composition-policy vocabulary and ordering between both compilers. Preserve existing IDs, masks, provenance and complete bundle output. Q subsequently authorized a local TypeScript commit; Python stays uncommitted.

# State

Complete in both compilers, all uncommitted. grade1-vocabulary.json declares explicit mode IDs, member-class IDs and policy provenance ordinals through the shared source manifest. Deleted the repeated runtime order lists and TypeScript's separate class-ID literal. TypeScript derives mode/class name types from JSON keys and checked-decodes the selected vocabulary. Python loads typed Grade1Vocabulary in Sources and passes it through lowering and provenance. Existing output field/tuple contracts remain explicit. Prior dirty work is preserved.

Both final complete bundles exactly match the captured baseline. grade1:generate and grade2:generate pass with no src/generated changes. Edited Vitest grade1-rule-compiler.test.ts and the full Python tests/test_compiler.py pass, including Hypothesis ID permutations compared against actual TypeScript compilation. Strict Pyright, Ruff lint/format and git diff --check for rules/tests pass. DATA.md and Python README updated. No hosted CI, full oracle sweeps or fuzz replay; runtime artifacts did not change.

# Decisions and why

Smallest change: one grade1-vocabulary.json containing named mode, member-class and policy ordinal maps, registered in the existing source manifest. Ordinals are explicit wire IDs rather than object insertion order. Both compilers validate complete, unique dense IDs and sort by those IDs. Delete duplicate runtime vocabulary arrays and TypeScript's separate class-ID literal. Python retains its Literal domain types; TypeScript derives mode/class name types from the JSON keys and retains the CompositionPolicies field contract. Keep lowering and validation as ordinary code. Estimate roughly 150-220 implementation lines touched across both compilers plus focused tests and declarations. No runtime format change, generic policy interpreter, new build stage or publication.

# Surprises

Python cannot load the corpus at import time: the rules directory is explicit. Vocabulary must travel in Sources to compile_modes/compile_policies and provenance emission. TypeScript's static JSON type information allows name unions to follow authored keys while its existing checked boundary validates the selected source data.

The first Python verification found one stale MODE_NAMES reference in provenance emission after deleting the constants. Replaced it with the vocabulary-derived order; final tests and static checks pass. No additional workflow gates were added.

# Next step

Authorized implementation and verification are complete. Q now requests committing the completed TypeScript compiler, rule-data and test changes with the four related task notes. Exclude older dirty notes and unrelated reports. Python stays uncommitted. No push, PR or merge is authorized. Sorting, mask construction, duplicate/citation validation and named-field/tuple lowering remain compiler code.
