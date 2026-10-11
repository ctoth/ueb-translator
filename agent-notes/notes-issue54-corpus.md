Checkpoint 2026-08-26: PR #62 is merged at 4d7cca8 and is the issue #54 baseline.
Key finding: corpus preparation materializes whole inputs and Wikinews XML; benchmark reads one document at a time.
Current state: reusable corpus manifests and oracle comparison/ledger APIs exist, including pinned Liblouis CI.
Blocker: issue #54 still needs streaming sentence/word ingestion plus deterministic SCOWL and scheduled fuzz seams.
Next action: finish the read-only module/test/CI map and report it to the parent agent.
Checkpoint 2026-08-26: issue #54 baseline inspection has mapped the current tooling interfaces.
Key finding: `oracle:compare` already streams JSONL, but each Liblouis call spawns a process and buffers its full output.
Current state: `.corpus-cache/` is ignored; prepared manifests seal source snapshot, digest, extraction version, and partition.
Blocker: acquisition functions directly bind network, processes, and filesystem, so deterministic SCOWL tests need injected adapters.
Next action: report concrete reuse and streaming/test design seams without implementation.
Checkpoint 2026-08-26: SCOWL divergence clustering is beginning from the ignored issue-54 cache.
Key finding: prior run reports 658,033 evaluated cases and 19,318 divergences; exact clustering is not yet verified.
Current state: task is read-only analysis of Braille diff shape, morphology, provenance, and likely UEB family.
Blocker: none known until the cache artifact and schema are inspected.
Next action: locate the cache, compute deterministic clusters and representative cases, then identify minimal official citations.
Checkpoint 2026-08-26: issue #54 empirical infrastructure is implemented in the isolated worktree and grouped adjudication is underway.
Key finding: exact SCOWL 2020.12.07 level 95 evaluates 658,033 words with 19,318 pinned-Liblouis divergences across 2,327 raw provenance signatures.
Current state: batched streaming reconciliation, deterministic SCOWL/corpus acquisition, fuzz controls, and 13 lossless pre-fix review cases type-check and pass focused tests.
Blocker: none from scale; every exact candidate still needs a source-backed deterministic group and unmatched cases must fail closed.
Next action: finish the version-2 grouped ledger generator/parser, emit cluster counts and representatives, then wire CI and scheduled issue filing.
Checkpoint 2026-08-26: the provisional broad empirical verdict classifier is rejected as not source-safe.
Current state: deterministic SCOWL and fixed corpus preparation completed; focused tests/build/typecheck were green before classifier replacement.
Exact dictionary evidence contains 19,318 candidates and the supplied 15-category precedence/count invariant will replace broad fallback rules.
The three residuals are captainess, today'll, and your'n; captainess matches ICEB 10.10.2 locally, while apostrophe cases require exact 7.6/10.9 adjudication.
Next: implement exact clustering with fail-closed unmatched evidence, rerun dictionary/corpus/fuzz gates, then package/full verification.
Checkpoint 2026-08-26: exact clustering build passes, but the count invariant is still red while predicates are refined.
The dominant ness signatures are local ⠢⠑⠎ vs oracle ⠑⠰ (3,545) and local ⠔⠑⠎ vs oracle ⠊⠰ (2,105), explaining why complete-sign-only association misses the queue.
Current mismatch includes capitalization 1,160 vs 1,138 and ness 3 vs 5,888; no long sweep is running.
Verdict review also requires capitalization to remain permitted unless an exact indicator violation is proven, and oracle-only cases need shortform-specific analysis.
Next: reproduce all supplied cluster counts with morphology plus trace precedence, then refine verdict evidence before regenerating the committed ledger.
Checkpoint 2026-08-26: exact clustering now reproduces all 19,318 candidates and the full 658,033-word dictionary reconciliation is green.
The oracle-only queue was split into 11 mechanically proven shortform-plus-s our-bugs and 19 context-dependent permitted alternatives.
Corpus capture exposed non-CR/LF line separators causing 2,002 Liblouis lines for a 2,000-case batch.
Focused separator normalization test (6 tests), oracle typecheck, and oracle build are now green; no acceptance blocker remains.
Next: restart corpus capture, adjudicate its exact ledger evidence, then run fuzz, docs, package/full gates, and scoped commits.
Checkpoint 2026-08-26: corpus capture passed the long-line failure after deterministic 512-character sentence chunking.
Liblouis then exposed an unmappable dot-9 output; recursive batch isolation is implemented to identify the exact request without losing other evidence.
The restarted sweep is active under WSL PIDs 52668/72736 and has written 16,347,335 bytes of ignored candidate JSONL.
The 11 shortform-plus-s our-bug verdict group now carries validated issue reference 59.
Next: finish/isolate corpus capture, commit exact corpus evidence if representable, then fuzz, docs, package/full gates, and scoped commits.
Checkpoint 2026-08-26: full corpus capture completed with 441,223 cases and 160,670 divergences; ignored raw JSONL is 197,433,125 bytes.
Per the size gate, full sentence/local/oracle output will not be committed; compact SHA-256 evidence entries retain exact reconciliation identity.
Compact entries include caseId, evidence digest, groupId, and bounded input/local/oracle changed-window repro previews.
Parser/reconciler types and tests now cover matching digests plus changed-output/new/stale detection; generator streaming implementation is added.
Next: make compact tests/build green, generate/validate compact corpus ledger, rerun corpus green, then fuzz/docs/package/full gates and commits.
Checkpoint 2026-08-26: Liblouis stdin escaping is now tested for literal backslash, backslash-9, backslash-apostrophe, and neighboring text.
The corrected corpus run produced 160,661 divergences with a fail-closed delta of 22 stale and 13 new exact digests.
Delta application removed the invalid comparator-unrepresentable verdict group and yielded a parser-valid 160,661-entry compact ledger.
Current compact ledger validation is green; dictionary remains green at 658,033 cases / 19,318 known divergences.
Next: rerun all 441,223 corpus cases to zero stale/untriaged, then fuzz, docs/package/full gates, and scoped commits.
Checkpoint 2026-08-26: pinned Liblouis 3.38.0 now builds with --enable-ucs4 and the non-BMP adapter smoke is green.
The 79 former UTF-32 failures all translate; compact replacement was 79 removed / 79 added, total 160,661 with no unicode-limit group.
Full UCS4 reconciliation is green: corpus 441,223 / 160,661 and SCOWL 658,033 / 19,318, each with zero stale or untriaged.
Seed 123 still shrinks to bea, revealing dictionary-to-fuzz fingerprint dedup remains defective despite the intended cross-channel guard.
Next: repair dedup by preserving fingerprints in the compact dictionary ledger, replay fuzz, then package/full gates and scoped commits.
Correction: exact ledger and SCOWL search found no input `bea`; the seed-123 result is a genuinely new fuzz-only divergence, not a cross-channel dedup defect.
The intended behavior is therefore exit 1 with retained minimal evidence and stable fingerprint, followed by idempotent scheduled issue filing.
Next: replay seed 123 for byte-stable evidence, exercise filer dedup tests, then package/full gates and scoped commits.
Checkpoint 2026-08-26: seed 123 replay is byte-stable and shrinks to exact fuzz-only `bea` evidence; root adjudicated it as the first-syllable be defect owned by #59.
The empirical ledger must retain that exact our-bug evidence so nightly replay becomes known instead of filing it.
Package containment is green at 29 files / 40,422 packed bytes; no empirical data or oracle tooling is shipped.
The ordinary full gate currently stops at 35 narrow lint errors in new oracle scripts/tests; no product test failure is present.
Next: add the `bea` ledger group/evidence, repair lint, replay seed 123 green, rerun full check, then scoped commits.
Checkpoint 2026-08-26: exact `bea` evidence is now in the empirical ledger as an our-bug owned by #59.
Difference-signature fingerprinting skips that known defect; seed 123 advances to distinct minimized unknown `0a`, as expected for nightly filing.
Filer tests cover a separate unknown, all-state stable-marker dedup, one create, and propagation of filing failure.
All 35 new-scope lint errors are repaired; `npm.cmd run lint` now exits 0 with no findings.
Next: rerun oracle focused gates and the ordinary full check, inspect/stage exact scope, make narrow commits, and stop for root review.
Checkpoint 2026-08-26: final SCOWL reconciliation is 658,033 / 19,318 with zero stale/untriaged and empty stderr.
Final seed-123 fuzz skips triaged `bea` and minimizes distinct unknown `0a` at path 3:1:0; scheduled filing remains the intended failure path.
Package verification is green at 29 files / 40,422 packed bytes; the exact-head full check passes 1,016 tests and 100% ordinary coverage.
`git diff --check` is clean; tracked scope contains only issue-54 files and ignored caches/artifacts are absent.
Next: commit standalone 13-case review evidence, commit empirical/UCS4/fuzz delivery, report hashes/status, and stop for root local review.
