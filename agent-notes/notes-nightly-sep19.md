# Nightly oracle repair, September 19

- Isolated worktree `C:/Users/Q/code/ueb-translator-nightly-sep19`, branch `fix/nightly-oracle-september-19`, base origin/main 0dac140; original unpublished version commit and notes preserved.
- Run 35427072799 seed -1856687544 fails BrL; reproduced three mixed-case shortform regressions, fixed ambiguity check with canCollapseModeSpan. All 845 Grade 2 tests pass.
- Dictionary full sweep passed 658033/11353 known/0 stale/0 untriaged. Corpus session36139 ongoing; npm check session73118 near completion. WSL UCS4 oracle /tmp/ueb-liblouis-ci-check/install/bin/lou_translate and node /root/.nvm/versions/node/v22.18.0/bin/node.
- Full 100k scans of Sep19 and Sep18 seeds (-1856687544,1963908687) found29 and26 additional disagreements; ignored .oracle-artifacts/fuzz-sep19.json and fuzz-scan.json retain evidence. Need individually adjudicate; no ledgers edited yet.
- Next: adjudicate exact scan evidence plus Sep18 minimal (aggha?, replay both seeds, finish full checks/sweeps, commit/push and verify exact-head oracle CI. No merge authorized.

## Pushed repair and evidence review
- Pushed 366b9ff (capitals fix and six regressions) and39819ce645cc6d9ebf949ac57c395e39fde87963 (56 exact adjudications). All prior ledger records unchanged; corpus ledger untouched.
- Reviewed56:45 permitted alternatives,2 Liblouis bugs,9 records of pre-existing local defects (children ambiguity6, plural eis2, bee1), explicitly our-bug with issue59. Verified every added local output equals prior merged implementation.
- All three100000-case replays pass: -1856687544,1963908687,-679952479. First full npm check passed1433 tests+4browser+85oracle; final-head rerun session53966 ongoing after renaming temporary review helper that ESLint accidentally discovered.
- Exact-head oracle CI35428634703 passed inventory and dictionary; corpus ongoing. Local corpus session36139 ongoing with no emitted new evidence; dictionary passed658033/11353known/0stale/0untriaged.
- Need final local corpus summary, final check exit0 and CI success before final report. Worktree clean, no PR or merge performed.

## Validation complete
- Final-head npm check exited0:1433 unit tests,4 browser tests,85 oracle tests, coverage/build/type/lint/package checks passed.
- Local retained corpus sweep passed441223cases/62012known/0stale/0untriaged; dictionary658033/11353known/0stale/0untriaged. No corpus ledger change or evidence removal was needed.
- Oracle CI35428634703 succeeded on39819ce645cc6d9ebf949ac57c395e39fde87963. All three100k fuzz replays passed locally.
- Branchfix/nightly-oracle-september-19 pushed and clean. No PR or merge; main nightly does not use the repair until merged.

## Merge and expanded exploration authorized
- User requested merge, million fuzz cases and new corpus targets, then reusable tooling. PR106 normally merged as37a4ecab44e1b7e43b9c8c30340b86883855faff after CI35428960575 and oracle35428960581 passed; verified two parents and identical tested tree.
- Current isolated worktree remains ueb-translator-nightly-sep19, now on tools/oracle-exploration (based on39819ce). Added two failing test files for ExplorationTracker and corpus snapshot comparison; implementation pending.
- Prepared Wikinews20260901; archive SHA1 abc9721f42340c8fc073078a44d98ee8d3a74959 and all22250 extracted documents exactly equal20260801. No new coverage from date change. Downloaded Alice11 and Moby-Dick2701, with pinned raw digests and manifests; .oracle-artifacts/new-books.jsonl records paths.
- Temporary helpers node_modules/.cache/million-fuzz.mjs, prepare-new-books.mjs, explore-corpora.mjs ready, but million/new-books sweeps NOT started. User tooling request now means implement reusable scan/progress/evidence and snapshot-comparison commands, then run them.
- Keep exploration separate from ledgers; retain distinct evidence digests sharing case IDs, report semantic signatures separately. Original main unpublished version commit/notes preserved. New tooling not yet committed or pushed; no authorization to merge later tooling inferred.

## Exploration and reusable tooling complete
- Local commit fbd4077 on tools/oracle-exploration adds oracle:fuzz:scan, oracle:corpus:compare, oracle:corpus:scan, oracle:corpus:prepare-book; README instructions and8 new tests. Worktree clean; tooling not pushed/merged.
- Million scan seed628265697 completed1000000cases:964792agreements,34978known-signature occurrences,230untriaged occurrences,213distinct evidence digests,162semantic signatures. Normal replay shrank first unknown to(chnj), path67:14:9:0,68runs/3shrinks; known children-ambiguity family.
- New book sweeps completed:Alice1382cases/233differences;Moby-Dick10079cases/1929differences. All require ICEB review; no new findings accepted into ledgers. September archive/documents identical to August verified with reusable tool.
- Full npm check passed1441tests+4browser+93oracle, including coverage/type/lint/package checks. Live commands validated full scans, snapshot digest verification, book cache reuse and rejecting existing scan output without modifying evidence.
- Report and evidence links at isolated worktree .oracle-artifacts/exploration-report.md. User-authorized original repair PR106 merged37a4eca; new tooling local commitfbd4077 only. Final response should distinguish merge status and exploratory differences from confirmed bugs.

## Review underway; reusable tooling explicitly demanded
- User asked to review findings, then strongly rejected throwaway scripts/ugly one-liners. Reusable oracle:review command now implemented (uncommitted): index/list/show/evidence/decide/report/ledger, source-digest preservation, scoped append-only decisions, partial-sentence accounting. No more ad-hoc transformation snippets.
- Workspace tools/oracle-exploration atfbd4077; new files src/review.ts,review-cli.ts,test/review.test.ts plus ledger parser exports/package/README. Nine targeted tests pass, including a reproduced/fixed separator-only discrepancy disappearing from review. Full check session48343 began before latest separator fix; inspect completion then final relevant validation.
- Persistent .oracle-artifacts/review-session indexes2375evidence/2455groups/3288occurrences. Authored review-first-decisions.json applied:535differences judged our-bug;365records fully reviewed;2753occurrences pending. Been452,afterwards27,besides53,mst3.
- ICEB10.6.1 forbids be in been;10.9.5 requires shortform+s;10.9.6 explicitly cites mst. Ledger search confirms existing mst and MST's permitted-alternative verdicts wrong; review-only so no ledgers changed. Five initial-ing fuzz cases are definite Liblouis bugs under10.4.3; next decisions also beautiful/dish10.6.1.
- Next: append reviewed second decisions with command, finish full check, document reviewer findings/remaining counts, commit reusable tooling. Original current source/accepted ledger unchanged; no push/merge of new tooling authorized.

## Reusable review tooling committed and validated
- Local commit d8899d8 on tools/oracle-exploration adds the documented oracle:review command and nine regression tests; isolated worktree is clean. Not pushed.
- Final npm run check exited 0: 1450 main tests, four browser tests, and 102 oracle tests. Log: .oracle-artifacts/review-tooling-final-check.log.
- Saved review now covers 581 difference occurrences: 576 translator errors and five Liblouis errors; 399 evidence records fully reviewed, 2707 occurrences pending.
- Findings and reproducible continuation commands: .oracle-artifacts/review-session/findings.md; append-only decisions and decision-report.jsonl are alongside it.
- No translator or accepted ledger changes in this review commit. Earlier nightly repair remains merged in PR106; exploration tooling is local commits fbd4077 and d8899d8.

## Root-cause repairs authorized and underway
- User authorized fixing reviewed translator errors. Isolated worktree now branch fix/reviewed-contraction-rules; main preserved.
- Commit 53e2b4c adds reviewed be/dis first-syllable exceptions after eight failing regressions. Commit 4fc7927 fixes suffix eligibility for all 75 base shortforms, with the three ICEB exceptions; 958 targeted tests passed.
- Seven new failing 10.9.6 tests cover mst/msts/possessives/caps/hyphens, Herf, somesch; www.sch.edu.au is a passing negative control. Next implement compiler-derived collision exclusions, not hardcode mst.
- Full dictionary/corpus sweeps, reconciliation preserving digests, check, fuzz replay, and exact pushed-head oracle CI still required. No ledgers changed yet.

## Root repairs implemented; reconciliation underway
- Commit 726209d derives groupsign collision exclusions from shortforms plus Appendix1 (mst, Herf, somesch, plural/possessive forms), with a new standing-only guard; 966 targeted tests passed. Also fixed inventory example selection exposed by suffix guards.
- Dictionary sweep complete:658033 cases/11282 disagreements/71 stale/0 untriaged (.oracle-artifacts/root-dictionary.jsonl). Corpus sweep session86171 still running. Full check first failed inventory examples; fixed and targeted tests green, final check pending.
- Baseline detached worktree C:/Users/Q/code/ueb-translator-oracle-baseline at d8899d8 has built dist and junction node_modules. New uncommitted reusable run-wsl.ps1 and reconcile-audit-cli.ts plus empirical-inputs.ts load source cases and replay exact old/current digests; latest oracle:build passed.
- Next run audit-dictionary/audit-corpus using baseline /mnt/c/Users/Q/code/ueb-translator-oracle-baseline/dist/grade2.js, inspect every changed token/evidence, safely reconcile ledgers, full checks and sweeps/fuzz/CI. Never print minified ledger whole files (huge output).

## Longer-word ambiguity and audit tooling
- Commit 09ed0cb extends groupsign-collision guards to general longer shortforms (first/children) with overlap-scoped patterns; 970 targeted tests pass. Dictionary root2 sweep still 71 stale/0new. First corpus sweep finished441223cases/37893differences/25808stale/1689changed; root2 corpus session28238 running.
- Dictionary baseline audit verified all71 stale records now agree. root-dictionary-audit.jsonl complete. Inventory root2 passes1048cases/1known. Fuzz million seed628265697 now reaches a'chn; release seed-679952479 reaches fstpa. Both appear oracle violations of10.9.3/10.9.6, verdict saved .oracle-artifacts/longer-shortform-oracle-verdict.json but not yet ledgered.
- New uncommitted reconcile-audit-cli.ts, reconcile-review-cli.ts, reconciliation-audit.ts/test, empirical-inputs.ts, run-wsl.ps1 and npm commands implement reusable baseline replay and explicit per-transition approvals preserving source digests. Last oracle:build passes; recent lint was clean before latest CLI addition; need final check.
- Dictionary repair list reviewed includes71 tokens: syllable fixes, shortform+s, collision abbreviations, plus today'll and your'n losing invalid whole-word shortforms. Next audit corpus, inspect changes, author exact repair approvals, apply candidate ledgers, fuzz adjudication/replay, final sweeps/check/pushedCI. No accepted ledgers changed yet.

## Corpus audit and mixed-capital collision correction
- Dictionary ledger now reconciled with71 verified removals and three explicitly adjudicated Liblouis fuzz bugs (a'chn, fstpa, (fstz)); no corpus ledger edits yet. oracle:reconcile CLI has list/approve/apply/fuzz with exclusive candidate outputs. All71 dictionary transitions individually read; approvals saved.
- Root2 corpus completed441223cases/37892differences/25809stale/1689changed. root1 audit complete24119resolved/1689changed; root2 audit session19922 running (selected-case loader now avoids translating irrelevant sentences). Root1 transition list177 entries .oracle-artifacts/corpus-repairs.jsonl; read first100, remaining77 to review.
- Full100k release scan found3 exact new records: quoted fstz apostrophe, FhSiTxChNz, fsthxbev. Mixed capitals exposed real guard regression; added two failing then passing tests ChNz/HerF and context.isStableSpan gates in both collision guards. Uncommitted source correction; targeted972tests pass. Need final full sweeps again after this runtime change.
- Coverage initially failed dead compiler branches; refactored shared shortformSuffixes and derived longer collision constraints from longerShortform guards. Source generation unchanged; full npm test before mixedcase fix was100% allmetrics. Added direct guard20/21 test for absent mode policy. Last oracle:build passed.
- Next finish corpus transition review/audit/apply; add remaining explicitly reviewed fst-family fuzz evidence (not mixedcase), run fullcheck/fuzz/finaldictionary+corpus, push and exactheadCI. Explore seed remains pending unrelated a-monofa (do not auto-permit). No PR/push yet.

## Root repairs pushed; final validation underway
- Branch fix/reviewed-contraction-rules pushed at ac02d13. Commits1a738cc (mode-boundary fix), ec5c20b (reusable baseline audit/reconciliation/WSL tooling), ac02d13 (ledgers/report). Worktree clean. No new PR or merge yet; exact-head CI starting.
- Both corpus audits complete; latest25809stale=24120resolved+1689changed,178distincttoken transitions all reviewed. Corpus ledger now37892records, test asserts every digest unique and repeated case IDs preserved. Two been—about/the repairs keep the exact original dash discrepancy; audit verifies corrected prefix + unchanged suffix.
- Final dictionary passed658033cases/11282known/0stale/0new. Final release fuzz -679952479 passed100000cases. Five exact fst/chn Liblouis bugs adjudicated; mixedcase discrepancy fixed. Final corpus session69591 still running; .oracle-artifacts/final-corpus.jsonl.
- Fullcheck session32558 running to .oracle-artifacts/verified-check.log. Earlier checks failed while new tests/ledgers were still being edited (latest was old corpus count); count corrected and targeted11 tests passed. Do not edit source during current check. Need inspect exit0/coverage, corpus0stale/new, exact pushed oracleCI and standardCI, create/update PR and final report without merging.

## Root-cause repair delivery complete
- PR107 https://github.com/ctoth/ueb-translator/pull/107 ready for review, not merged. Head ac02d1349352e66a3b941dc642d6f3c1861574b9; worktree clean.
- npm run check exit0:1558main+4browser+107oracle tests;100% coverage. Final dictionary658033cases/11282known and corpus441223cases/37892known both0stale/0untriaged. Release fuzz seed-679952479 completed100000cases.
- Exact pushed-head oracleCI35432934986 success; PR oracle35432984823 success; standardCI35432984844 success. PRmergeState CLEAN; report docs/oracle-root-causes-2026-09-19.md and reusable tooling documented in oracleREADME.
- Review scope remains bounded: pronunciation data for reviewed be/dis families, general base suffix rules and groupsign-created shortform collisions. Exploratory seed628265697 still finds independent unreviewed a-monofa; broader exploration queue not closed. Baseline worktree and audit artifacts retained for reproducibility.
