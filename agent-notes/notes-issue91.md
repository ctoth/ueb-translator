# Issue 91 checkpoints

- 2026-09-30: User clarified #91, reopened for `(gdy'`; original `(v'` now agrees. #92 remains triaged.
- Current main facc698 reproduced missing Grade 1 before gdy; ICEB 5.7.2/10.9.8 and Appendix 1 goody require disambiguation.
- Isolated worktree C:/Users/Q/code/ueb-translator-issue91, branch fix/91-shortform-appendix-ambiguity; npm ci complete, retained corpus cache junction ready.
- Investigating compiler-derived ambiguity rules and composition; no source changes yet. Preserve existing untracked notes and PR #114 scope.
- Next: failing regression, minimal fix, full dictionary/corpus/check/replay, reconcile exact evidence, push PR and verify oracle CI; merge not yet authorized.

- Regression confirmed red (7 failures); generated Appendix initial literal aliases plus plurals, and retained later contraction eligibility after the Grade 1 symbol. Focused Grade 2/compiler tests green.
- First dictionary sweep: 658033 cases, four stale agreements (CDA, RCVR, aclys, rcvr), one new aflight difference. aflight collides with Appendix afterlight; review as oracle defect under 10.9.8.
- Corpus sweep still running; CDST new evidence is another Appendix couldst collision. Preserve source digests in reconciliation.
- Release replay -679952479 passed 100000. Today's seed 364064918 got past #91, then found unrelated acchns-a at 48569:4:1:20:15:15; retain artifact, do not broaden translator repair.
- npm check failed only two backtranslation test timeouts while sweeps ran. Next: finish sweeps, inspect all changed evidence, reconcile, rerun check without concurrent heavy work, verify exact-head CI.

- Hoisted ambiguity lookup sets to compose construction; focused Grade 2/backtranslation tests pass, and npm check2 completed successfully (exit 0).
- Full initial corpus sweep completed 441223 cases: 14 stale, 5 new. CDST is a new reviewed oracle omission; four CDA sentence changes retain pre-existing residual differences.
- Dictionary audit verified all four stale entries now agree; candidate ledger removes only those and adds aflight exact evidence, with digest count assertions. Candidate count 11390.
- Corpus audit running for all 14 stale source digests; individually reviewed CDA/coulda indicator transitions so far. Tooling-created additions use reviewed-fuzz IDs but retain exact SCOWL/corpus source identities.
- Next: finish corpus audit, inspect and apply candidates, rebuild final oracle adapter, full final sweeps/replay/check, commit and publish scoped PR, then verify pushed-head oracle CI.

- Corpus audit complete: 14 distinct source digests, ten whole-input agreements removed, four unchanged residual disagreements updated with prior verdicts; added exact CDST omission. Final corpus ledger count 37883, no evidence collapse.
- Final npm check initially found only the ledger count fixture; updated documented count to 37883. Final check2 exit 0, source/ledger tests all verified.
- Final dictionary sweep passed 658033 cases, zero stale/untriaged; final inventory passed; final release fuzz passed 100000. Direct `(gdy'` and `(v'` both agree with Liblouis 3.38.0.
- Committed/pushed c1574f0a8cca9599997936895d4150cac6d5ef61; draft PR #121 (Closes #91). CI runs 36685109548, oracle 36685109540/36685103573 in progress. Worktree clean.
- Final corpus sweep still running; next verify its summary and exact-head CI, mark PR ready. Separate acchns-a output verified unchanged from main; no merge authority yet.

- Final local corpus sweep passed 441223 cases, 37883 known disagreements, zero stale/untriaged; all local required validation terminal and green.
- PR #121 marked ready; exact pushed head remains c1574f0a8cca9599997936895d4150cac6d5ef61, worktree clean and remote branch matches.
- Standard CI 36685109548 success; pushed-head oracle 36685103573 success; PR oracle 36685109540 success, including inventory, full dictionary, and retained-corpus steps.
- #91 remains OPEN until merge; PR body contains literal Closes #91 and timeline cross-reference to #121. GraphQL closingIssuesReferences returns empty despite that body/reference.
- Delivery stops at ready PR because no merge instruction was given. Separate unchanged acchns-a discovery is disclosed in PR body and retained in ignored replay artifacts.

- User requested resolving acchns-a too; ICEB 10.6.5/10.9.6 confirms local cc is lawful and Liblouis is overrestrictive. Added four translation regressions and red/green exact-ledger coverage.
- Current PR worktree has uncommitted documentation/tests/ledger additions; cc evidence and quoted bea evidence preserve distinct source digests. Ledger now 11392 records.
- Daily seed advances past cc but repeatedly shrinks the known bea policy bug into different punctuation contexts; this is issue #100, whose existing PR #114 was verified to fix the captured output.
- Next capture the original generated bea case or narrowly classify its reviewed context family, then complete both fuzz replays, full dictionary/corpus sweeps, and npm check.
- Update PR #121 body/head and verify pushed-head oracle CI; original notes stay uncommitted and no merge has been requested.

- Live PR #114 merged at 2026-09-30 08:14:36 UTC; fetched origin/main f05e238 and merged into task branch (1f02c66). Captured bea/beu/bei cases now agree.
- Reapplied the already-reviewed #91 dictionary/corpus audit transitions to the merged main ledgers after asserting every old digest exists and every new output is unchanged. Four dictionary and fourteen corpus transitions verified; all other records unchanged and no digest collapse.
- Merged ledger counts: dictionary/fuzz 10438 with cc adjudication, corpus 35908. Restored cc regression/doc changes from stash; removed obsolete bea disagreements, preserving raw ignored evidence.
- Complete daily scan now has only two remaining exact cases: existing bare-llb Grade 1 defect in punctuation and invented of syllabification choice. Review against local ICEB, retain accurate exact verdicts, then finish full gates.
- Need commit/push final adjudication and verify exact-head CI; no merge authority. Original workspace remains untouched except appended notes.

- Final merged npm check passed, dictionary 658033 cases/10325 known/zero stale or untriaged, inventory passed, both 100000-case daily (364064918) and release (-679952479) replays passed.
- Complete daily scan's two residuals reviewed separately: {llb. is the already-ledgered general longer-shortform implementation defect; invented jpzc-ttbiofjloc has unknown syllabification and a permitted of choice. Ledger records retain exact truthful verdicts.
- Committed/pushed 4fef9b9030a5958fe6fbe466fd2ee9f3d8dd3fc4; PR #121 body updated, clean worktree, MERGEABLE against merged main f05e238. Original stash retained as a backup.
- Full local retained corpus sweep still running (session 50175). New CI 36690482799 and oracle runs 36690471842/36690482911 are queued/running at the pushed head.
- Next await local corpus summary and all exact-head CI; report cc adjudication and tested ready PR, with no merge or issue-closure claim.

- Final local corpus sweep completed exit 0: 441223 cases, 35908 known disagreements, zero stale/untriaged. All required local checks now passed at the final tree.
- Exact pushed head 4fef9b9030a5958fe6fbe466fd2ee9f3d8dd3fc4 verified on remote; standard CI 36690482799 and oracle runs 36690482911/36690471842 all SUCCESS.
- Both oracle CI runs completed the full dictionary and retained-corpus steps successfully; their optional release replay was skipped, while both required 100000-case local replays passed.
- PR #121 remains ready, OPEN, and MERGEABLE. cc is a verified oracle defect, original #91 translation repair remains intact, merged #114 fixes the captured be-vowel cases, and the existing llb bug stays explicitly classified.
- Task worktree clean; original workspace notes and backup stash preserved. No merge or issue closure performed.
