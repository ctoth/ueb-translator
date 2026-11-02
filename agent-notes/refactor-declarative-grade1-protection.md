# Goal

Extract the existing technical Grade 1 standing-value classifiers and protection thresholds into the existing typed technical rule data, preserving all rendered output.

# State

Implementation complete on `refactor/declarative-grade1-protection`, independently based on integrated main after PR #160. Local commit prepared for parent inspection and publication; no push or PR by this worker.

`npm ci --ignore-scripts`, `npm run grade1:generate`, and the edited test files via `npx vitest run --coverage.enabled=false test/grade1-rule-compiler.test.ts test/technical-variants.test.ts` succeeded. `git diff --check` succeeded. Only the technical generated artifact changed; general Grade 1, Grade 2 artifacts and oracle ledgers did not change. Existing fixed BRF expectations were retained.

# Decisions and why

The smallest change adds ordered pattern/flags/kind descriptors and the two numeric thresholds to the existing technical contract, source, compiler, generator and runtime (roughly 130–180 handwritten lines plus tests and generated data). Traversal, numeric-mode exclusion, forced standing-word handling and insertion offsets remain in the runtime. No new module or general rule language is needed.

Read original ICEB replacement Section 1.7 (2025), page images 000–002. Printed page 2, 1.7.3(a)/(b), supports one symbol indicator per sequence and passage escalation at three protected sequences; the note excludes lowercase a–j after numbers from these counts. The exact ordered standing-value regexes are preserved implementation classification, not a claimed transcription of that guidance.

# Surprises

The existing classifier uses Unicode case folding only for the single-symbol pattern; `iu` then `u` are preserved exactly. My first new assertion incorrectly expected a word indicator for adjacent identifier nodes x/y. The focused run returned unprotected xy. Reading `activeRequirements` confirmed that partial standing requirements do not cover the whole symbols sequence, so I corrected the new assertion to preserve the existing output. The runtime sequence mechanics were not changed.

# Next step

Parent inspects the local commit and ignored PR draft, publishes the independent PR, and waits for hosted CI. Full CI, dictionary/corpus oracle sweeps, and fuzz replay were not run locally, per the agreed CI-on-PR workflow. No merge is authorized for this batch.
