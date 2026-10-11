## 2026-09-16 checkpoint
- Reproduced 26 failures: exact-word exclusions lost through plurals, derivatives, and possessives across several contraction classes.
- Added reviewed source word families and compilation-time possessive forms; 837 focused tests pass, including 42 new regression/control cases.
- Curly apostrophes are separately emitted as closing quotes; contraction eligibility now works but punctuation remains incorrect.
- Full npm check is running; existing package.json, release-metadata test, and untracked notes are preserved.
- Next: complete checks, record additional reproducible gaps, review diff and source citations.

## Final verification
- Added 46 regression/control tests; full npm run check passes: 1,314 tests, 100% coverage, 4 browser tests, package verification, and 85 oracle tests.
- Final rule-generation freshness, type checks, lint, build verification, and git diff --check pass.
- Audit and reusable probe script record remaining hyphen/quote eligibility and curly-apostrophe emission defects; this is bounded family coverage.
- Initial full runs exposed a mixed-generation run during edits and a redundant helper coverage branch; final stable run resolves both.
- Work is uncommitted; unrelated dirty files are preserved. Full check log: %TEMP%/ueb-contraction-check-20260916-013940.log.

## Context follow-up checkpoint
- User authorized proceeding with the three recorded context defects; existing dirty changes remain intact.
- Reproduced 31 failures, then fixed exclusion checks with quote-trimmed lexical and current-component spellings while retaining shortform coordinates.
- Shared punctuation resolver fixes curly apostrophes across grades/documents and preserves directional quotes; leading elision and unmatched s-possessives use documented heuristics.
- Added combined quoted/divided-word regressions; all 40 focused tests pass, including exact output and source offsets.
- Full npm run check is running; docs now distinguish the fixes from remaining punctuation ambiguity and bounded lexical coverage.

## Inverse compatibility checkpoint
- Full forward tests exposed the existing promise to preserve curly apostrophe print candidates in backtranslation; the original assertion is retained.
- Added a shared contextual apostrophe edge to both inverse grades, with left-context pruning to prevent spurious symbol paths exhausting decoder limits.
- All 134 focused forward/backtranslation tests pass, including a new Grade 2 curly-apostrophe round trip.
- The full unit/coverage suite is running before the final full gate.
- No commits or publication; previous user edits remain untouched.

## Context follow-up final verification
- Final npm run check passes: 1,356 tests, 100% coverage, 4 browser tests, package verification, and 85 oracle tests.
- Added 42 tests in this follow-up; original round-trip expectations remain intact, including curly apostrophes and combining-accent coverage.
- Built-output audit confirms centimeter-long, quoted centimeter, and curly possessives no longer exhibit the recorded defects; git diff --check passes.
- Remaining heuristics and scope are documented in docs/contraction-audit.md; no general pronunciation or ASCII single-quote classifier was added.
- Work remains uncommitted. Logs moved to %TEMP%/ueb-context-check-20260916-124232.log and %TEMP%/ueb-context-tests-20260916-124232.log.
