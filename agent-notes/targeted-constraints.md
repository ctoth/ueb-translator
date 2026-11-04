# Goal

Finish the authorized contract tightening and normalize the five exception families into targeted guard data in both compilers. Preserve compiled behavior. Q subsequently authorized a local TypeScript commit; Python stays uncommitted.

# State

Captured pre-edit emitted bundle. Migrated five exception JSON files to constraints.json and replaced TypeScript source types/readers/family dispatch with targeted guards. Rules build, both generators and edited reader/translation test files pass; src/generated has no drift. Both final emitted bundles match the baseline after all source edits. Python full differential/Hypothesis file and focused final boundary checks pass, as do strict Pyright, final Ruff lint and formatting. DATA.md and Python README describe the new format and type-driven validation. Unrelated dirty notes remain preserved.

# Decisions and why

Smallest change: one constraints.json containing citation, target {kind, print}, and a typed guards list. Three source guard shapes cover existing behavior: not-word with reviewed words/possessives/ignored characters, not-word-ending with endings, and following-not-vowel-y-except-words with characters/reviewed words/possessives. Expand reviewed families and explicit possessives into existing guard shapes, then join by target. Validate targets against actual authored contractions rather than maintain five separate contraction vocabularies. Keep pinpoint locators in the existing closed domain, including Python variants. Delete obsolete family-specific files/types/readers and dispatch. Rough estimate 250-350 implementation lines touched per compiler plus focused tests; no new rule language/framework or runtime port.

Q additionally requested removing the technical field/citation checklist. Python validation now discovers Cited records and Literal-keyed mappings through existing attrs annotations, at the JSON boundary and direct technical compilation entry point. Existing completeness/citation helpers have one owner in validation.py. The TypeScript checked readers retain their existing explicit closed domains; emitted output is unchanged.

# Surprises

The old family-specific source IDs are not emitted runtime rule IDs. Citation evidence and guard operands must still survive normalization exactly. Source-array order and finite reviewed word expansion remain significant.

# Next step

Implementation and authorized local verification are complete. Focused TypeScript checks: rules:build, grade1:generate, grade2:generate, and Vitest test/rule-json.test.ts plus test/grade2.test.ts. No PR CI, full oracle sweeps or fuzz replay were run locally; runtime translation output is unchanged. Q now requests the local TypeScript commit with related task notes. Python stays uncommitted; no publication.
