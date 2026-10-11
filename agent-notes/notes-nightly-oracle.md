# Nightly oracle repair checkpoint — 2026-09-17

- User authorized the diagnosed apostrophe fix, regression tests, and nightly artifact retention repair; no publication requested.
- Isolated worktree: C:/Users/Q/code/ueb-translator-nightly-fix, branch fix/nightly-oracle-apostrophe; original edits preserved.
- ICEB 2024 2.6.3 confirms trailing apostrophes preserve standing alone; regressions failed before repair and grade2.test.ts passes after repair.
- Nightly upload now includes hidden files. Oracle build is running (session 38346); local pinned binary exists under Temp/ueb-translator-liblouis-3.38.0/win64.
- Next: run pinned oracle comparison, static checks and broader verification; inspect scope and leave changes reviewable locally.

## Verification checkpoint — 2026-09-17
- Repair is limited to composition.ts, Grade 2 regression tests, and include-hidden-files in oracle-nightly.yml; changes remain uncommitted in the isolated worktree.
- The Windows Liblouis directory was empty; verified and used WSL /tmp/ueb-liblouis-ci-check/install/bin/lou_translate, version 3.38.0. The repaired issue91 case and selected elisions match its output.
- npm run check reaches the existing release metadata failure (2.0.0 expected, package 2.1.0); those files are unchanged from HEAD. Excluding that test, all tests and 100% coverage pass; browser, package verification, size, static checks pass.
- Linux seed -679952479 replay now reaches a different a'sh disagreement at run 99; base HEAD produces the same a'sh output. Evidence retained in the worktree at .oracle-artifacts/issue91-replay.json.
- No workflow dispatched and no publication performed; nightly upload behavior is configured but awaits a hosted run.

## Iteration checkpoint — 2026-09-17
- User now authorizes code fixes, commits, push, and iteration. Branch fix/nightly-oracle-apostrophe pushed through d1eea40; prior fix is 5623bf5.
- Fixed a'sh and related internal-apostrophe groupsigns with red/green regression coverage, source authority ICEB 10.4.1–2 and 10.12.12.
- Replay seed -679952479 now reaches a-ac at run 499: local uses word indicator, oracle symbol indicator. ICEB 10.9.7 explicitly requires the symbol indicator for standalone shortform spellings.
- Updated affected test expectations and added a-ac; observed eight red regressions before product change. Next simplify required grade1 positions to the first symbol, verify, commit/push, replay.
- Existing release metadata baseline failure remains separate; no changes to original working-tree edits.

## Iteration checkpoint — shortform reconciliation
- Committed deccfac for ICEB 10.9.7 single-symbol ambiguity indicators; pending push after subsequent checks.
- Removed 27 resolved grade1-word-scope-liblouis ledger cases after verifying current output equals each recorded oracle output; their prior Liblouis-bug verdict contradicted 10.9.7.
- Added aggha-a as pronunciation-dependent permitted alternative (10.10.5, 10.11.2, 10.12.7–8); ledger uses groupId and groups, not inline verdicts. Initial schema mismatch corrected before continuation.
- Replay now reaches ThAt: the chosen whole-word contraction crosses a capital indicator and is discarded after selection, losing valid th fallback.
- Next: constrain contraction eligibility before path selection, add official mixed-case regressions, verify broader suites and push the resulting narrow commits.

## Iteration checkpoint — mixed case
- Added pre-selection canApply predicate to contextual transducer; composition now rejects mode-crossing candidates before selecting, preserving th/ch fallback in ThAt and ChIlD.
- ICEB 10.6.6 also required forbidding internal lower groupsigns adjacent to capitals; AaEaA, AaGgA, SeaWorld, EggHead, aEaa regressions red then green.
- Backtranslation now retains acceptance of a grade1 word indicator when the new canonical literal output uses only a symbol indicator; prior ab word-indicator regression retained.
- Liblouis incorrectly contracts bb beside capitals in AaBbA, recorded as source-backed oracle bug. Input-shape fingerprint length variants recur, so a diagnostic 10,000-case scan collected ten remaining signatures.
- Next inspect .oracle-artifacts/scan.json, classify or repair those findings, run coverage/static/package checks, commit narrowly and push. No PR or merge requested.
### Checkpoint: apostrophe eligibility and complete seed replay
- Added source-authored wordsign affix guard; five red regression cases now pass, including UEB more'n and t'do.
- Full tests excluding the known baseline release-metadata test pass with 100% coverage; removed unused ledger test helper flagged by typecheck.
- Read original checkout local ICEB PDF; recorded seven exact remaining signatures with rule-specific verdicts. Original 10,000-case seed replay exits zero.
- Remaining: rerun static/packaging/browser/oracle checks, inspect diffs, commit remaining changes and push branch; original checkout edits remain untouched.
### Checkpoint: committed and pushed final verified head
- Full npm run check exits zero, including generation, builds, lint/types, coverage, browser, package/size and oracle-tool tests.
- Original seed -679952479 completes 10,000 runs with no untriaged mismatch; exact evidence remains in ignored .oracle-artifacts/iteration-final.json.
- Commits deccfac, b54869d, e2a4ddf and 98914e8 pushed; remote branch verified at 98914e8094e16475bc52903420f6070ea26f56de.
- Worktree clean; original dirty package/test edits and notes preserved. No PR or merge. Ready to report completed branch and local verification.
### Checkpoint: full oracle reconciliation underway
- User authorized cleaning dictionary/corpus against local UEB, iterating until green, then increasing nightly count to 100000.
- Added red/green Ch'ing and decheance fixes with lexical-start versus preceding-letter guards; local rules 10.4.3 and 10.8.1 support these.
- Dictionary now has 151 stale and five untriaged: GI/KO/OK'ing capitals terminator plus two villainess forms (oracle violates 10.8.4).
- Corpus sweep still running (session 29894); hundreds of changed digests retain other known differences. Inspect helper/report under node_modules/.cache and .oracle-artifacts. Prepare completed; dictionary session done.
### Checkpoint: corrected capitals around apostrophes
- Local PDF extracted with PyMuPDF preserves braille: printed page 91 gives DON'T with repeated capital indicator and OK'd without terminator; previous tests were wrong.
- Removed capitals-continuation mode class and runtime logic; inverse now ends capitals word mode at symbols too. Focused forward/backtranslation tests pass.
- Full corpus first sweep still running; token review currently shows ~1300 distinct changed tokens, mostly existing first-syllable/indicator/lexical differences retained by old compact ledger.
- Need finish corpus, verify resolved stale entries, review changed evidence without blanket reclassification, rerun full checks and exact-head CI, then 100000 nightly replay and push.
### Checkpoint: CI-equivalent oracle rebuilt
- Cached WSL oracle was UCS2; rebuilt pinned 3.38.0 with --enable-ucs4, verified lou_charSize() = 4. Prior non-BMP corpus sweep is not accepted as final evidence.
- Current full sweeps: dictionary session 86645; corpus 96203. Full npm check session 49058 in tests. Forward/inverse capitals correction focused tests pass.
- Last-passing source 951aa0c compiled under node_modules/.cache/oracle-baseline for evidence lineage; initial replay comparator incorrectly reused current localOutput, fixed helper before next replay.
- Helpers reconcile-replay.mjs and reconcile-review.py replay only changed inputs, verify baseline digest, and approve inherited differences only when exact oracle-coordinate edits are a subset; pending cases require review. No ledger edits yet.
### Checkpoint: replay proves inherited corpus differences
- Full check passed (100% coverage). UCS4 dictionary: 571 stale, seven changed; replay removed 566 agreements, retained four existing shortform-indicator our-bug entries, classified MST's and two villainess forms.
- Corpus session 96203 still running (~60% at last estimate). Preview replay 2036 cases verified 2018 old digests; 1990 exact residual-edit subsets retain existing verdicts, 46 require manual review.
- Pending corpus differences mainly curly quote/apostrophe ambiguity; source 7.6.14-15 recommends elision dictionary then opening-quote fallback, whereas runtime currently treats every leading right quote as elision.
- Also found initial be/con/dis wrongly rejected after leading apostrophe by component.start check; needs a regression and first-letter-based boundary. All changes still uncommitted on fix/nightly-oracle-apostrophe.
### Checkpoint: complete corpus replay and remaining boundary cases
- Full UCS4 sweep 441223 cases: 13680 stale /2931 untriaged before newest quote fixes. Complete targeted replay now 13709 cases,10777 agreements,2863 inherited exact residuals,69 pending.
- Implemented cited initial-elision dictionary and leading-right-quote opening fallback; added right quote to standing-opening policy; leading be/con/dis now checks preceding letters, not punctuation index. Focused tests pass; npm check session86243 ongoing.
- Dictionary sweep session95842 exited zero after ledger reconciliation (before any next lexical fixes). Corpus pending report at corpus-decisions.json/manual review needed.
- Newly exposed quoted words need be exceptions (bend, bedrock, beating,best,Benfica,bedroom), con exception Conan. One pending can’t—“ lacks wordsign because component exclusion retains trailing opening-quote glyph; inspect trimming. No commits this turn yet.
### Checkpoint: reviewed ledger update and final sweep iteration
- Fixed quoted first-syllable exceptions, per-dash-component standing tests (can't—“), and closing double quotes before punctuation; focused tests972 passed and broader product tests1411/100%coverage passed.
- Updated corpus ledger after10942 verified agreements,2708 inherited residual subsets,59 manually reviewed cases in7 cited groups. Corpus count68662 before next sweep reconciliation.
- Latest dictionary sweep658033cases had45 stale/0untriaged; exact replay verified all45 agreements and removed them. Original10k fuzz replay now passes after recording exact eness unknown-syllabification evidence.
- Full corpus sweep session78544 still running; resulting current.jsonl needs replay/reconciliation. No nightly increase yet, no commit/push this turn yet. Need final counts/test fixture, full check, both sweeps+CI clean, then100000/config and final push.

### Checkpoint: second corpus iteration
- Corpus full sweep finished 441223 cases, 5240 stale and870 untriaged. Replay5250:4410 agreements814 inherited residuals26 manual cases.
- Reconciliation helper collapsed30 duplicate case IDs with distinct source digests; restored all30 from HEAD (none were in prior affected replay), fixed helper to preserve untouched array entries; new AGENTS guard added.
- Added failing regression cases for quoted bed/better/beep/Bear/Belfast and over-broad quote inference before ellipses. Need code fixes and regeneration, review remaining26, then full sweeps again.
- Active source test failures logged .oracle-artifacts/latest-red.log; corpus-previous-replay.jsonl preserves first iteration. No commit/push or nightly increase yet.

### Checkpoint: final product fixes and sweeps
- Fixed quoted bed/better/beep/Bear/Belfast; closing ASCII quote inference now scans terminal punctuation to whitespace/end, preserving ellipses within words. Added regressions, red/green recorded.
- Fixed en/in groupsign after a modified/non-program letter (Féin), updated foreign-letter regression; generated Grade2 and oracle adapter rebuilt.
- Replayed second corpus changes:4467 agreements772 inherited residuals11 individually reviewed punctuation/name-omission alternatives. Corpus ledger64235 entries with30 duplicate source identities preserved.
- Committed AGENTS alone604a85d. Current full corpus session17864, dictionary38463, npm check90355. Need reconcile any new findings, commit/push clean repairs, then100000nightly and exact-head CI.

### Checkpoint: product validation clean, corpus evidence in progress
- Full npm check passed (100%coverage), smoke/inventory passed, original10kseed passed. Dictionary rerun clean658033cases/11353known/0stale/0untriaged after33 verified agreements removed; dictionary ledger11364entries including11fuzz.
- Corpus session17864 still running (~8min); partial replay311cases verified all old digests.307 unchanged residuals4manual: GUID BED ed; quote before ?'; two Féin dash diffs are unchanged residuals split by contraction fix.
- Previous replay backup was seconditeration5250, not first13709. Reconstructed pre-latest-fix JS in node_modules/.cache/oracle-pre-lexicon-review; helper uses only outputs whose digest exactly matches existing ledger, restoring all311 provenance checks.
- Current corpusledger64235; latest npmcheck passed onthat. Await fullsweep, reconcile finalartifact, push repairs+verifyCI, then100000. Ignored fuzz-scan.mjs prepared but not executed; no nightly increase yet.

### Checkpoint: repairs pushed, awaiting exact-head oracle CI
- Latest corpus reconciliation2628replays all old digests verified;2221agreements407remaining. Preserved duplicate source records correctly. Ledger62014entries, updated fixture. Recorded existing numeric grade1 bug in044BED20 under6.5.1-3; two Féin dash differences were unchanged residual splits.
- Fixed nested quote before ?' with red/green regression. Full npm check passed again; dictionary clean658033/11353known/0stale/untriaged; final corpus rerun session65806 stillrunning with no emitted differences sofar.
- Commits604a85d(AGENTS),c1858e4(code),fa0c9d1(reconciliation/docs/artifacts) pushed branchfix/nightly-oracle-apostrophe. Need query current exact-head GitHub oracle run and verify completion.
- Nightly remains10000. After clean baseline, raise100000 and run larger fuzz, reconcile any new exact failures, commit/push, verify finalCI. Original main dirtyreleasework and notes preserved.

### Checkpoint: larger fuzz review
- Final local/CI corpus both441223cases62012disagreements0untriaged2stale; replayedbothagreements removed, fixture62012. CI35201570831 failed onlythose2nowremoved. Sourceunchanged, oracle:testpassed.
- Nightly env changed100000(uncommitted). Standard100kseed-679952479 failed11695shrunk(aggh); diagnosticfull100kscan38unknown exactcases .oracle-artifacts/fuzz-scan.json. Need adjudicate and rerun standard100k, commit/push/verifyCI.
- Compared38outputs to lastpassing951aa0c baseline:32unchanged;5Bb mixedcaps nowcorrectper10.6.6 (oraclebug);'bewgayb, newlycontractsbe withunknownsyllables. Existing failures include llr/wds/pds/blt grade1, in-hyphenlowerword, its'arbitraryshortform. Must label knownourbugs honestly, not permittedoutputs.
- Read PDF10.10.5strong-overlower,10.9.6-9shortformdisambiguation,10.5.3-4in acrosshyphen,6.5.1-3numericgrade1. Need investigate ar/gh standalone oracleliteral: notshortformaround/ghost (sourcegrepnone); likely standinggroupsignletterinterpretation. No furtherproductcodechanges yet.

### Checkpoint: final head pushed, waiting for green CI
- Adjudicated39 exact100kcases (38scan+minimizedaggh):5Liblouis Bb-capitals bugs,26pronunciation/abbreviation alternatives,8pre-existing ourbugs unchanged from951aa0c. Groups preserve explicit our-bug classifications; no blanket gate exceptions.
- Standard100000seed-679952479 now passes .oracle-artifacts/fuzz-100000.json. oracle:test passes. Source unchanged since full npmcheck/smoke/inventory/dictionary validations; only ledger/docs/nightlyconfig changed.
- Pushed a65bc9f(two resolved corpus records) and d94cbdbb2b4c4d68d83eb98e262a1e774d9d3661(100000nightly+adjudication). Worktree clean. Final exacthead oracleCI35202749920 running; previous35201570831 failed onlytwo stale records nowremoved.
- Need wait finalCI including dictionary+441223corpus tosuccess, inspect final logs summary0stale/untriaged, then concise finalbranch/head/test100k+knownbugsremaining. No PR/merge authorized; configuration lives onfix/nightly-oracle-apostrophe branch. Memorycite MEMORY.md2291 iffinalused.

### Completion: exact final-head oracle CI green
- CI35202749920 succeeded on d94cbdbb2b4c4d68d83eb98e262a1e774d9d3661; logs confirm inventory1048/1known, dictionary658033/11353known, corpus441223/62012known, all0stale0untriaged.
- Local npmruncheck passed; final ledger oracle:test passed; standard100000fuzzseed-679952479 passed0shrinks. Nightly config100000committed/pushed onfix/nightly-oracle-apostrophe.
- Verified remote branch SHA equals localHEAD and worktree gitstatusclean. Original main dirtyreleasework+notes remain untouched/uncommitted; no merge orPR performed.
- Known implementation bugs remain explicitly recorded; green means source-reconciled evidence, not universal Liblouis agreement or completeUEBconformance. Finalresponse should retainthat limitation.

### Merge requested: PR102 awaiting final oracle check
- User explicitly authorized merging all branch work. Created same-repository PR102 fromfix/nightly-oracle-apostrophe into main; head d94cbdb, base5e68f69, mergeable, normal merge enabled.
- PR CI35239302108 passed. PR oracle35239301972 is running the corpus sweep; prior exacthead oracle35202749920 already passed. Await currentPRcheck beforemerge.
- Merge with ghprmerge --merge --match-head-commit d94cbdbb2b4c4d68d83eb98e262a1e774d9d3661. Verify mergedstate, two parents, unchangedtree, and main nightly100000.
- Preserve original checkout dirtyreleasework and allnotes; do not pull or delete worktrees/branches as partofmerge.

### Merge completed
- PR102 merged at2026-09-17T15:23:14Z as ffd6ac78fe5a82b2854d19b22337125065731dd0 after allPRchecks passed.
- Verified parents5e68f6979835def68cfe2138a398c4e4edf50585 and d94cbdbb2b4c4d68d83eb98e262a1e774d9d3661: normaltwo-parentmerge. Main and testedhead trees both96dc49407a8dc8603dfe83c62bf1d32e157090e2.
- Main nightlyworkflow ORACLE_FUZZ_NUM_RUNS is100000. Worktreeclean; originaldirtycheckoutpreserved. No localmainpull orbranch/worktreedeletion performed.
- PowerShell revision selectors containing braces must be quoted; recovered a malformed unquoted HEAD^{tree} read with standalone literal-selector verification.
