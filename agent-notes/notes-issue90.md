# Issue #90 — `'ags)` grade 1 indicator (reopened 2026-10 nightly)

## Observed (main facc698, dist built Sep 30)

- Nightly reopened #90: input `'ags)`, local `⠄⠁⠛⠎⠐⠜`, Liblouis 3.38.0 `⠄⠰⠁⠛⠎⠐⠜`.
- Original #90 input `'q)` still agrees (local `⠄⠰⠟⠐⠜`).
- Local probes via `translateUeb({mode:"grade2"})`:
  - `ag` → `⠰⠁⠛`, `ag's` → `⠰⠁⠛⠄⠎`, `ags` → `⠁⠛⠎` (no indicator)
  - `agains` → `⠁⠛⠎` — same cells as `ags`. Real collision, not just an oracle disagreement.
  - `abouts` → `⠁⠃⠳⠞⠎`, `almosts` → `⠁⠇⠍⠕⠌⠎`, `hims` → `⠓⠊⠍⠎` (the three 10.9.5 exceptions spell out)
  - `abs`, `alms`, `hms`, `tns`, `lls`, `yrs`, `brls`, `grts`, `cds`, `qs` → all no indicator.
- The apostrophe/paren in the fuzz input are incidental; bare `ags` has the same defect.

## Rule text (ICEB 2024 3rd ed., pp.151-152, pdftotext of papers/ICEB_2024_RulesUnifiedEnglishBraille/paper.pdf)

- 10.9.5: s or apostrophe-s added to any shortform word keeps the shortform when standing alone; exceptions abouts, almosts, hims.
- 10.9.7: grade 1 symbol indicator before a standing-alone letters-sequence that "would otherwise be read as a shortform word under rules 10.9.1 or 10.9.5".

## Code

- `src/composition.ts:424-440`: indicator added when `exact` letter run is in `grade1Ambiguities` and `isCompleteAmbiguityLiteral`.
- `isCompleteAmbiguityLiteral` (`src/composition.ts:244`) accepts the run alone or run + apostrophe + `s`; it has no plain-`s` branch.
- `grade1Ambiguities` (generated, `src/generated/ueb-2024/grade2-program.ts`) has 72 entries: bare shortforms and letter wordsigns only. No `Xs` forms.
- `rules/ueb-2024/program.ts:272` cites 10.9.5; `test/grade2.test.ts:169,550` cover 10.9.5 / 10.9.7.

## Fix in progress (branch fix/shortform-plural-grade1)

- Ambiguity table is `GRADE2_AMBIGUOUS_LETTER_SEQUENCES` in `rules/ueb-2024/program.ts`, derived from compiled rule braille.
- First attempt: add `base+s` entries to that table. Worked for `ags` → `⠰⠁⠛⠎`, exceptions and `qs` unchanged,
  but `ags's` changed from `⠁⠛⠎⠄⠎` to `⠰⠁⠛⠎⠄⠎`. `agains's` is spelled out (`⠁⠛⠁⠔⠎⠄⠎`), so that indicator is not required by 10.9.7.
- Second design (current): separate `GRADE2_AMBIGUOUS_SUFFIXED_SEQUENCES` (rules) → `grade1SuffixedAmbiguities` (program field),
  derived from each rule's `word-with-affixes` letter affixes. `isCompleteAmbiguityLiteral` takes `allowPossessive`; false for suffixed-only matches.
- Edited so far: `rules/ueb-2024/program.ts`, `src/contextual-transducer.ts`, `src/composition.ts`.
- Still to do: `scripts/generate-grade2.mts` (load/validate/emit new field), 4 test fixtures in `test/grade2-rule-compiler.test.ts`,
  new tests, regenerate, `npm run check`, fuzz replay, dictionary + corpus sweeps, PR, oracle CI on pushed head.

## State after implementation

- All edits done: rules/program.ts, generate-grade2.mts, contextual-transducer.ts, composition.ts, regenerated grade2-program.ts, tests in grade2.test.ts and grade2-rule-compiler.test.ts.
- `grade1SuffixedAmbiguities` has 46 entries (abvs acrs acs afns afs afws ags alrs als alts alws bls brls cds ... yrs yrvss). No abs/alms/hms, no wordsign+s.
- `npm run check` exit 0: 1615 + 4 + 148 tests passed (uncommitted, on branch fix/shortform-plural-grade1).
- Next: fuzz replay (seed -1461269147 path 2799), dictionary sweep, corpus sweep. These need the WSL oracle binary; its path is not yet known.

## Oracle validation (2026-10-10)

- WSL oracle: /tmp/ueb-liblouis-ci-check/install/bin/lou_translate; node /root/.nvm/versions/node/v22.18.0/bin/node.
- Corpus caches junctioned into this checkout's .corpus-cache from ../ueb-translator-issue-54 (scowl, prepared/gutenberg-1342-…, prepared/wikinews-20260801). Junctions are gitignored; remove when done.
- Artifacts in .oracle-artifacts/issue90/.
- Nightly-seed replay (-1461269147, 100000 runs): passed the `'ags)` case (path 2799), then FAILED at run 26200 on a different input:
  `(aonea)` local `⠐⠣⠁⠐⠕⠁⠐⠜` vs Liblouis `⠐⠣⠁⠕⠝⠑⠁⠐⠜`, fingerprint 44d23827…, unledgered.
  Same local output on the main-equivalent build (../ueb-translator-fuzz-families/dist) → predates this change; it is the `one` contraction, not a grade 1 indicator.
- CI release replay seed is -679952479 (liblouis-oracle.yml:108). Not yet run locally.
- Dictionary and corpus sweeps not yet run.

## Release replay fails BECAUSE of this change (seed -679952479, path 24734:1:0)

- `a-frs` local `⠁⠤⠰⠋⠗⠎`, Liblouis `⠁⠤⠋⠗⠎`. Fingerprint 623231612ac8….
- Direct Liblouis queries (lou_translate unicode.dis,en-ueb-g2.ctb, LOUIS_TABLEPATH=share/liblouis/tables) over all 46 suffixed spellings:
  - 34 agree with the new local output (incl. ags yrs tns als alts brls cds eis tds; exceptions abs/alms/hms and qs also agree).
  - 12 differ, Liblouis omits the indicator: bls dclgs dcvgs frs gds grts lls lrs qks rcvgs rjcgs xss.
  - Liblouis contracts the words themselves to the same cells (friends `⠋⠗⠎`, goods `⠛⠙⠎`, littles agree with local), so in Liblouis `frs` and `friends` collide.
    10.9.5 says "any shortform word" + s → by 10.9.7 the indicator is required. Local is right by the rule text for these 12.
  - `ags's`: local `⠁⠛⠎⠄⠎`, Liblouis `⠰⠁⠛⠎⠄⠎`. `agains's` agrees (both spell out), so the Liblouis indicator there protects against no shortform reading.
- So the fix leaves two Liblouis divergence types that need ledger/family adjudication before the release replay can pass:
  (1) suffixed productive/-ing shortform spellings Liblouis leaves unprotected; (2) possessive of a suffixed spelling Liblouis over-protects.
- Dictionary and corpus sweeps still not run.

## Sweeps started 2026-10-10 (background, sources frozen until both exit)

- dictionary → .oracle-artifacts/issue90/dictionary.jsonl (+ .result.json)
- corpus → .oracle-artifacts/issue90/corpus.jsonl (+ .result.json)
- Fuzz family mechanism: tools/liblouis-oracle/src/fuzz-families.ts; a family extends an existing ledger group in tools/liblouis-oracle/disagreements.json (keys: version, disagreements).
- Nothing committed yet. No ledger touched yet.

## Dictionary sweep 1 result (exit 1, as expected before reconciliation)

- 658033 cases, 11274 disagreements, stale 16, untriaged 8.
- Stale 16 (all previously `exact-grade1-insertion` our-bug, now agree): ACS AFS AGS ALS CDS EIS PDS RCVS SDS TMS YRS ags als alts sds yrs.
- Untriaged 8 (Liblouis omits the indicator): BLS FRS Frs GDS LRS bls frs gds.
- Existing ledger: tools/liblouis-oracle/empirical-disagreements.json (groups 43, disagreements 11393). Group `fuzz-sep19-plural-shortform-ambiguity`
  (our-bug, cites 10.9.5/10.9.7, issue 59) already adjudicated `{eis}` / `{eis!`; fuzz entries `"wds:` and `(pds,` are under `exact-grade1-insertion`.
- Verdict kinds in ledger: permitted-alternative 23, liblouis-bug 11, our-bug 9.
- Reconcile procedure: README "Reconciliation after translator repairs"; baseline module = ../ueb-translator-fuzz-families/dist/grade2.js (src/rules identical to main).
- Corpus sweep still running.

## Corpus sweep 1 + audits

- Corpus: 441223 cases, 37859 disagreements, stale 56, untriaged 23. Most untriaged are previously ledgered sentences (German `als`, `EIS`, `ACS`, `SDS`, `cds`)
  whose shortform+s window now agrees while other, already-adjudicated differences in the sentence remain. Genuinely new windows: `XSS`, `FRS`, `LLS` (Liblouis omits indicator).
- Audits vs baseline /mnt/c/Users/Q/code/ueb-translator-fuzz-families/dist/grade2.js (src/rules unchanged a9ac28b..facc698):
  - audit-dictionary.jsonl: 16 reconciliation-evidence records, exit 1 "Unreconciled evidence: 0 stale, 8 new".
  - audit-corpus.jsonl: 56 reconciliation-evidence records, exit 1 "Unreconciled evidence: 0 stale, 3 new".
  - i.e. every stale digest was recovered; the only unreconciled items are the new Liblouis-omits disagreements (8 dictionary, 3 corpus).
- Ledger generation: tools/liblouis-oracle/adjudicate-candidates.mts has EXPECTED_COUNTS (exact-grade1-insertion 37, shortform-s-extension 11, …); corpus has adjudicate-corpus-candidates.mts.
- Next: read how new disagreements get a verdict group (adjudicate-candidates clusters), `oracle:reconcile list/approve/apply` for the stale ones, `oracle:reconcile fuzz` for a-frs.

## Reconciliation mechanics (learned 2026-10-10)

- reconcile-audit throws "Unreconciled evidence … N new" (audit left without summary = "Incomplete audit") while genuinely new disagreements are unledgered.
  Order must be: ledger new evidence → re-sweep → re-audit → `oracle:reconcile list` → review → `approve` → `apply`.
- `oracle:reconcile fuzz LEDGER SOURCE VERDICT OUTPUT [DIGEST_PREFIX]` adds one evidence as group `reviewed-fuzz-<digest16>`; outputs are created exclusively (wx).
- Verdict authored: .oracle-artifacts/issue90/verdict-suffixed-shortform-unprotected.json (liblouis-bug, 10.9.5 + 10.9.7).
  Verified directly: Liblouis and local both give letters `⠇⠗⠎`, blinds `⠃⠇⠎`, quicks `⠟⠅⠎`, greats `⠛⠗⠞⠎`, declarings/deceivings/receivings/rejoicings, itss `⠭⠎⠎` — same cells as the literal spellings.
- Fuzz-channel ledger entries `{eis}`, `{eis!`, `"wds:`, `(pds,` now agree with Liblouis (verified directly). Sweeps do not flag fuzz entries as stale; they need removal by hand
  (group fuzz-sep19-plural-shortform-ambiguity then has no entries).
- Dictionary ledger is pretty-printed (fuzz 111 + scowl 11282 entries); corpus ledger is single-line compact (version 2).
- adjudicate-candidates.mts EXPECTED_COUNTS["exact-grade1-insertion"] is 37 and may be asserted by tests — check after ledger change.
- `ags's` (local no indicator, Liblouis indicator) has no real producer yet (I typed it); not ledgered.

## Ledger step 1 done: new evidence recorded

- .oracle-artifacts/issue90/new-evidence.jsonl = the 8 dictionary + 3 corpus new records (digest-selected, so transcription verified by the tool).
- `oracle:reconcile fuzz` chained: dictionary ledger 11393 → 11402 (8 scowl + fuzz `a-frs`), corpus ledger 37892 → 37895. Each record has its own `reviewed-fuzz-<digest16>` group, all with the same liblouis-bug verdict.
- Installed into tracked paths by deleting the tracked ledger and letting the tool's last step write there (tool refuses to overwrite). cmp-identical to dict-ledger-9.json / corpus-ledger-3.json.
- Sweeps 2 running (dictionary2.jsonl, corpus2.jsonl). Expect stale 16 / 56, untriaged 0 / 20 (changed residuals only).
- Then: audit-dictionary2 / audit-corpus2 → list → review → approve → apply → install → sweeps 3 must be 0/0.
- Then: remove 4 agreeing fuzz entries by hand, fuzz family for a-frs, EXPECTED_COUNTS, oracle:test, release replay, npm run check, commit, PR, CI.

## Dictionary round 2 + DESIGN REVERSAL on possessives

- dictionary2: stale 16, untriaged 0. audit-dictionary2 complete: resolved 16, changed 0. Reviewed all 16 (ACS AFS AGS ALS CDS EIS PDS RCVS SDS TMS YRS ags als alts sds yrs): each gains `⠰` and equals oracle.
- Approved with verdict-repair-suffixed-shortform.json → approvals-dictionary.json; applied: dictionary ledger now 11386 entries, 52 groups.
- FOUND: remaining `exact-grade1-insertion` (our-bug) entries include SCOWL `ALS's` (Liblouis protects, local does not). That is a real producer of the `ags's` shape,
  and the ledger's standing verdict calls the missing indicator our bug. My second design (no possessive after a suffixed spelling) contradicts that standing verdict.
- DECISION: go back to the first design — suffixed spellings join GRADE2_AMBIGUOUS_LETTER_SEQUENCES, possessive allowed, no separate field. Matches Liblouis on `ags's` and the ledger on `ALS's`.
  Caveat to report to Q: by the letter of 10.9.5 `agains's` is not a shortform reading (both engines spell it out), so this indicator is cautious rather than strictly required.
- Consequence: translator output changes again for `<suffixed>'s`; sweeps must be re-run after the edit (dictionary round 3, corpus round 3). Corpus sweep 2 still running — no builds until it exits.
- Fuzz family added (uncommitted): suffixed-shortform-protection → group reviewed-fuzz-d35e49f5f897d3b1 (a-frs); tests in fuzz-families.test.ts (negative `ags's` case must be revisited after the reversal).
- tools/liblouis-oracle/test/empirical-ledger.test.ts:53 asserts corpus ledger length 37_892 — update after corpus apply.

## After reversal (single-table design), rebuilt

- corpus2 result (pre-reversal build): stale 56, untriaged 20 — superseded.
- Reverted src/composition.ts, src/contextual-transducer.ts, scripts/generate-grade2.mts to HEAD; program.ts now adds affixed entries to GRADE2_AMBIGUOUS_LETTER_SEQUENCES.
- Regenerated + build + oracle:build. Direct Liblouis agreement: ags, ags's, ALS's, 'ags), abs, qs, agains, CDS's, yrs', ab's. Still differs (ledgered): a-frs.
- test/grade2.test.ts + grade2-rule-compiler.test.ts: 988 passed.
- Running round 3: dictionary3.jsonl, corpus3.jsonl. Ledgers at this point: dictionary 11386 (16 removed, 9 added), corpus 37895 (3 added, stale not yet applied).
- Then audits (dictionary3 expect stale = ALS's-type; corpus3 stale 56+), list/review/approve/apply, round 4 sweeps must be 0/0.

## Dictionary ledger final (pending round-4 confirmation sweep)

- dictionary3: stale 1 (`ALS's`), untriaged 0. Audit complete, reviewed, approved (verdict-repair-suffixed-possessive.json), applied → 11385.
- Removed by Edit: fuzz entries `"wds:`, `(pds,`, `{eis}`, `{eis!` (verified agreeing with Liblouis directly) and the now-empty group fuzz-sep19-plural-shortform-ambiguity.
  Ledger parses: 11381 entries, 51 groups, no unused groups.
- Replayed all 108 fuzz ledger inputs: this branch changes exactly one (`a-frs`, the newly ledgered record).
  11 other fuzz records already differ from their ledgered local output on main (chn…, its'…, [bef?, [beh, con…chn) — pre-existing drift, NOT touched; report to Q.
- Waiting on corpus3 → audit-corpus3 → list/review/approve/apply → update test length 37_892 → round 4 sweeps → oracle:build/test → release replay → npm run check → commit/PR/CI.

## Corpus ledger final (pending round-4 confirmation sweep)

- corpus3: stale 56, untriaged 20. audit-corpus3 complete: resolved 36, changed 20, evidence 56.
- Reviewed all 20 distinct transitions (57 occurrences): als ×16, TNS ×13, SDS ×4, PDS/cds/EIS/ACS/ALS/TMS variants with adjacent punctuation, `(SDS)`, `(ALS)`, `(TNS),`, `TNS-Sofres,`.
  Every one is a standing shortform+s spelling gaining `⠰` and equalling the oracle at that token.
- Approved (approvals-corpus3.json) and applied: corpus ledger 37895 → 37859 (36 whole-sentence agreements removed; 20 sentences keep prior verdict on residual differences).
- empirical-ledger.test.ts length assertion updated 37_892 → 37_859.
- Next: oracle:build, round-4 sweeps (must be stale 0 / untriaged 0), release replay, oracle tests, npm run check, commit, PR, CI.

## Final validation and PR

- Release fuzz replay seed -679952479, 100000 cases: "No unledgered divergence" (fuzz-release2.jsonl).
- dictionary4: 658033 cases, 11273 disagreements, stale 0, untriaged 0, ok true.
- corpus4: 441223 cases, 37859 disagreements, stale 0, untriaged 0, ok true.
- npm run check exit 0: 1618 + 4 + 151 tests.
- Temporary .corpus-cache junctions removed (source cache in ../ueb-translator-issue-54 intact).
- Commits 5d58605 (fix) and b8379b5 (ledgers + family) pushed on fix/shortform-plural-grade1; PR #131.
- Oracle CI run 38080296447 on b8379b5 in progress — must verify before calling this complete. No merge authorized.
- notes-issue90.md and .oracle-artifacts/issue90/ are untracked / ignored.

## Not yet checked

- How `rawAmbiguities` is derived in the rules compiler.
- Liblouis output for bare `ags`, `abs`, `hms`, `qs`, `lls` etc. (only `'ags)` is evidenced).
- Whether letter-wordsign + s (`qs`, `bs`) is covered by 10.9.7 — it cites 10.9.1/10.9.5 only, which are shortform rules.

## Making PR 131 mergeable (2026-10-10, Q: "Make 131 mergeable and get it merged")

- PR 131 head b8379b5 was CONFLICTING with main b9416d9 (main gained #114 be-before-vowel, #121 Appendix 1 shortform extensions).
- `git merge origin/main --no-commit` in progress in this checkout (merge commit, no force-push). 7 conflicted files.
- Resolved by keeping both sides: rules/ueb-2024/program.ts (one LATIN_CELL_BY_LETTER map, affix entries + main's 10.9.8 eligibility-word entries),
  tools/liblouis-oracle/src/fuzz-families.ts (both families).
- Still conflicted: test/fuzz-families.test.ts, test/empirical-ledger.test.ts (corpus length: branch 37_859, main 35_908 — final number comes from the re-reconciled ledger),
  src/generated/ueb-2024/grade2-program.ts (regenerate), both empirical ledgers.
- Ledger plan: take main's ledgers (`--theirs`), build merged translator, then redo this PR's reconciliation with baseline = main's dist/grade2.js:
  sweep → ledger new Liblouis-omits evidence (verdict-suffixed-shortform-unprotected.json) → re-sweep → audit → list/review → approve → apply → remove agreeing fuzz entries → final sweeps 0/0.
- Main added ledger commands (f3cd6c2: add, supersede, regroup) — read README/docs/oracle-reconciliation.md before using `fuzz` chaining again.
- Environment verified present: WSL lou_translate + node paths above; .oracle-artifacts/issue90/ verdict files; .corpus-cache has `prepared` and `smoke` only (junction state to check).
- ueb-translator-issue91 worktree is at 3473fef; tree identical to main b9416d9 (empty diff) → candidate baseline build.

### PR 131 merge: state after code resolution (2026-10-10 ~15:10)

- All code conflicts resolved (program.ts, fuzz-families.ts, both oracle tests); grade2-program.ts regenerated (+184 lines vs main, same as the PR's original delta).
  Ledgers = main's (`--theirs`). empirical-ledger.test.ts corpus length currently main's 35_908 — must be updated after corpus apply.
- Merge NOT committed yet (`git merge --no-commit` state). Build + oracle:build done; test/grade2*.test.ts 1037 pass.
- Baseline for audits: temp worktree `<scratchpad>/main-baseline` at origin/main b9416d9 (node_modules junction to this checkout), dist built.
  WSL path: /mnt/c/Users/Q/AppData/Local/Temp/claude/C--Users-Q-code-ueb-translator/4e464420-2c58-49e4-a26d-f25739cbc60b/scratchpad/main-baseline/dist/grade2.js
  REMOVE this worktree (`git worktree remove`) and the .corpus-cache junctions (scowl, prepared/gutenberg-…, prepared/wikinews-20260801) when done.
- Artifacts in .oracle-artifacts/pr131/.
- dictionary1: 658033 cases, 10316 disagreements, stale 17 (ACS AFS AGS ALS ALS's CDS EIS PDS RCVS SDS TMS YRS ags als alts sds yrs), untriaged 8 (BLS FRS Frs GDS LRS bls frs gds).
  Untriaged digests identical to the PR branch's ledgered records (and to issue90/new-evidence.jsonl).
- Dictionary new evidence recorded via `fuzz` chain (a-frs + 8 scowl, verdict-suffixed-shortform-unprotected.json): main 10440 → pr131/dict-8.json 10449. NOT yet installed in the tracked path.
- corpus1 sweep still running in background (task bbtptljtl). Do not rebuild until it exits.
- DICTIONARY LEDGER DONE (15:25): dictionary2 stale 17 / untriaged 0; audit-dictionary complete (resolved 17, changed 0); all 17 reviewed (each gains ⠰, equals oracle);
  approved with pr131/verdict-repair-suffixed-shortform.json; applied → 10432; hand-removed fuzz `"wds:`, `(pds,`, `{eis}`, `{eis!` (verified AGREE with Liblouis directly on merged build)
  and empty group fuzz-sep19-plural-shortform-ambiguity → 10428 entries, 58 groups, parses, no unused groups.
  Digest check: merged-vs-main delta == PR-vs-base delta exactly (9 added, 21 removed). Needs final confirmation sweep (dictionary3) after corpus work, expect 0/0.
- WSL calls from Git Bash need MSYS_NO_PATHCONV=1.
- dictionary3 (final dictionary ledger): 658033 cases, 10316 disagreements, stale 0, untriaged 0, ok true.
- CORPUS LEDGER DONE (~16:25): corpus1 stale 56 / untriaged 23; 3 new records added via fuzz chain (digests 41d14ba70f4c, 81c9076087d5, 2dcfb7dbcc75, identical to PR's) → 35911;
  corpus2 stale 56 / untriaged 20; audit-corpus complete (resolved 36, changed 20, evidence 56); 20 distinct transitions (57 occurrences) reviewed, all gain ⠰ and equal oracle;
  approved + applied → 35875 entries, 17 groups, parses, no digest collapse.
  Delta vs main == PR delta (23 added / 56 removed) except one sentence (wikinews:116481 "Mehr als 20 Tote bei …") whose evidence already differed on main because #114 changed `bei`.
- empirical-ledger.test.ts corpus length set to 35_875.
- Corpus sweeps take ~30 min each. `npm run check` rebuilds oracle output, so never run it while a sweep is running.
- Remaining: npm run check → final corpus sweep (corpus3, must be 0/0) + release fuzz replay (seed -679952479, 100000) → commit merge → push → verify oracle CI on pushed head → merge PR → cleanup
  (temp worktree main-baseline, .corpus-cache junctions, local/remote branch).
- corpus1 still running at 15:25 (output 23 KB, growing slowly; background task has a 10-minute cap — check whether it survives).
- Next: install dict-8 → dictionary2 sweep → audit-dictionary → list/review → approve (verdict-repair-suffixed-shortform.json; ALS's uses verdict-repair-suffixed-possessive.json) → apply →
  hand-remove fuzz entries `"wds:`, `(pds,`, `{eis}`, `{eis!` + group fuzz-sep19-plural-shortform-ambiguity (still present in main's ledger; verify they agree with Liblouis first).
  Corpus: same with 3 new records (digests 41d14ba70f4c, 81c9076087d5, 2dcfb7dbcc75 if unchanged) → audit → approve → apply → update test length.
  Then final sweeps 0/0, release fuzz replay seed -679952479, oracle tests, npm run check, commit merge, push, verify CI, merge PR, cleanup.

### New session 2026-10-10 15:36 (Q: "make the pr mergeable and get it merged")

- Found: merge still uncommitted (MERGE_HEAD b9416d9 == origin/main after fetch), everything staged, no unstaged changes, no sweep process running.
- pr131/check.log (15:27) FAILED: branch coverage 99.94% (1723/1724), program.ts:407. Index mtime 15:30 → program.ts was edited after that log.
  Fresh `vitest run` at 15:37 on the staged tree: 1680 tests pass, branches 1720/1720 (coverage-final.json in this session's scratchpad). Gap is gone.
- pr131/corpus3.jsonl is 0 bytes (15:29): final corpus sweep never completed. dictionary3 (15:09, 0/0) and fuzz-release (15:30, ok) may predate the last program.ts edit → rerun all three.
- Order now: npm run check → dictionary4 + corpus4 + fuzz-release2 in pr131/ → commit merge → push → oracle CI on pushed head → merge PR 131 → cleanup
  (worktree main-baseline, .corpus-cache junctions scowl + 2 prepared, branch).
- 15:39 `npm run check` exit 0 (1680 tests, 100% coverage, oracle:test 164). Then `npm run build` + `oracle:build`.
- 15:41 dictionary4: 658033 cases, 10316 disagreements, stale 0, untriaged 0, ok true.
- 15:45 fuzz-release2 (seed -679952479, 100000): No unledgered divergence, ok true.
- Ledger deltas vs origin/main checked by script: dictionary +9 / -21 (matches PR text), corpus +23 / -56, 35875 distinct, no unused/missing groups.
- corpus4 sweep started 15:40 DETACHED in WSL (nohup setsid, pid 682491) → pr131/corpus4.jsonl / corpus4.err. Output stays 0 bytes until it finishes. Do not rebuild until it exits.
- After corpus4 == 0/0: `git commit` (merge, no attribution lines) → push → `gh pr checks 131` + oracle workflow on the pushed head → `gh pr merge 131` → cleanup.
