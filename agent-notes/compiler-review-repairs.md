# Goal

Resolve Q's compiler review findings in both implementations and commit the JavaScript work locally. Python remains uncommitted; no push or external posting.

# State

Implementation and focused verification are complete. The full edited Python file passes, including CLI/scoped-decoder/reserved-route/Unicode regressions. An additional exhaustive test matches all Unicode code-point case mappings against the current Node runtime; both runtimes use Unicode 16. Strict Pyright and Ruff pass, including the final Citation-field structural-validation refinement and focused boundary tests. Both edited TS test files pass, and Grade 1/2 generation plus oracle compilation succeed. Grade 1, technical and provenance bundles are unchanged; Grade 2 adds two collision guards and changes their operand/offset encoding. Preserved prior dirty work.

Full pinned-oracle dictionary sweep passed all 658,033 cases, corpus all 441,223 cases and inventory all 1,048 cases, each with zero stale/untriaged. Fixed seed 628265697 requested 100,000 fuzz cases but stopped at case 10,397 with an unledgered disagreement for "'llxa}" after two shrinks. Raw evidence: .oracle-artifacts/compiler-review-fuzz.json. Independently loaded the pre-change generated Grade 2 program directly from Git in memory and composed it with the unchanged Grade 1 program: baseline and repaired outputs are both exactly ⠄⠰⠇⠇⠭⠁⠸⠜ with no applied contextual rules; Liblouis outputs ⠄⠇⠇⠭⠁⠸⠜. This existing disagreement is not adjudicated or hidden by a ledger edit; the fuzz replay is not passing. No full npm run check or hosted CI has run, and publication is not authorized by the commit-only request.

# Decisions and why

Smallest repair keeps compile_sources(Sources) public: the compiler validates typed inputs and semantic invariants; the codec checks representation and primitive shape. Correct the false single-trust-boundary documentation first. Decode citation references with a scoped cattrs hook selected by the declared field type, without raw key rewriting or typed/raw round trips; construct Sources with typed expanded symbols once. Enforce inventory counts. Move expansion facts into one shared policy source, including precedence/citation/ID metadata, kind membership, plural and possessive suffix policy. Enumerate collision decodings once per shortform and index by rule used; fail on missing base substitutions and conflicting ambiguity entries. Centralize case conversion and document which string operations intentionally use scalar semantics. Preserve exact opcode ABI. Estimated 500-800 changed implementation lines across both compilers plus focused independent tests, no interpreter framework or new delivery workflow.

# Surprises

The be/bb and con/cc source records share Braille cells; source order previously chose the collision reading. The review's code-unit and implicit-Python-version claims do not match current source and will be addressed by documented, tested existing contracts rather than changing them incorrectly.

# Next step

Implementation and permitted verification are complete. The authorized local commit includes only JavaScript source/data/generated program/tests and this note; Python and unrelated dirty files remain uncommitted. Do not push, open a PR or post anything. Report the existing baseline fuzz disagreement and missing full CI explicitly; do not claim a passing fuzz replay or fully green CI.
