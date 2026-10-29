# Resolve latest conformance reports

## Goal

Resolve Q's request: "Please resolve the latest conformance issues" and "we should have an issue". Q subsequently authorized: "Resolve what we can, pr/merge the work". Deliver the supported ten latest reports (#133–#139 and #141–#143), with the shared apostrophe correction also covering #115. Publication and normal merge are authorized.

## State

Read the ten issue bodies, current source, oracle adapter instructions, reconciliation instructions and CI workflows. Reproduced all ten reported outputs on 2026-10-29 directly from current TypeScript source, transpiled and linked in memory without writing generated files. Compared each input with the existing WSL Liblouis binary at `/tmp/ueb-liblouis-ci-check/install/bin/lou_translate`, using its installed tables and `unicode.dis,en-ueb-g2.ctb`. The current source and live comparator reproduce every reported pair below. The binary's paths and outputs were checked; its build flags have not been independently reverified this turn.

Main checkout has an unrelated untracked `report-source.md`; preserve it. Work is on isolated branch `fix/latest-conformance`. The two translator fixes, their focused regressions, raw latest-report fixtures and eight individual exact adjudications are implemented. The local comparator's config.status confirms --enable-ucs4. Full dictionary/corpus results and pushed-head CI are still pending.

### Captured observations

These are raw output observations, not expected-output assertions. Issue bodies also retain the original seed and shrink path.

| Issue | Input | Current source | Live comparator |
|---|---|---|---|
| #143 | `onenonea` | ⠕⠝⠢⠐⠕⠁ | ⠐⠕⠝⠕⠝⠑⠁ |
| #142 | `a'goodna` | ⠁⠄⠛⠙⠝⠁ | ⠁⠄⠛⠕⠕⠙⠝⠁ |
| #141 | `bevmyofa` | ⠆⠧⠍⠽⠷⠁ | ⠃⠑⠧⠍⠽⠕⠋⠁ |
| #139 | `aencenced` | ⠁⠢⠉⠰⠑⠙ | ⠁⠰⠑⠝⠉⠫ |
| #138 | `isomeda'a` | ⠊⠐⠎⠙⠁⠄⠁ | ⠊⠎⠕⠍⠫⠁⠄⠁ |
| #137 | `(sthea)` | ⠐⠣⠎⠮⠁⠐⠜ | ⠐⠣⠌⠓⠑⠁⠐⠜ |
| #136 | `a-oneaa` | ⠁⠤⠕⠝⠂⠁ | ⠁⠤⠐⠕⠁⠁ |
| #135 | `(llp:` | ⠐⠣⠇⠇⠏⠒ | ⠐⠣⠰⠇⠇⠏⠒ |
| #134 | `a-aongha` | ⠁⠤⠁⠕⠝⠣⠁ | ⠁⠤⠁⠰⠛⠓⠁ |
| #133 | `beonea` | ⠃⠑⠐⠕⠁ | ⠆⠕⠝⠑⠁ |

## Decisions and why

Primary authority read visually: local `papers/ICEB_2024_RulesUnifiedEnglishBraille/pngs/`, especially page-167/168 (10.7.6), page-174/176 (10.9.2–3), page-178/179 (10.9.5–9), page-180/181/182/183 (10.10 preferences), page-195/196 (10.12.6–10). No extracted paper text was used.

- #142: verified translator defect. `src/contextual-transducer.ts:305` handles the word-start guard by testing only `start === 0`. `src/composition.ts:488` already supplies `atWordStart: false` for a range following a word-internal apostrophe. The guard discards that information. Rule 10.9.3(c) allows good only at the beginning of the longer word. Current trace applies `UEB-10.9-good-longer-word` at input offset 2. Fix the existing guard to honor the supplied word context. Regression includes other start-restricted shortforms and punctuation/dash controls, not only good.
- #135: verified translator defect. `rules/ueb-2024/program.ts:398` derives finite whole-word and Appendix abbreviations. The unrestricted consonant suffixes of `longerShortform` at line 299 are missing. `src/composition.ts:425` checks exact membership only. Rule 10.9.8 requires a symbol indicator for ll+p because little may begin a longer word before p under 10.9.3(c). The solution must derive longer-word eligibility from existing authored shortform rules, not add llp as an isolated exception. Preserve vowels/y exclusions, standing-alone restrictions and mode boundaries. Account for the related 10.9.9 case where a permissible shortform would be read inside the longer sequence: it requires word Grade 1, not a symbol indicator at the internal position.
- #139: do not copy the oracle. Current trace contracts the second ence (offsets 4–8), followed by d. Rule 10.10.6 expressly requires ence in enced; the comparator consumes the first ence and writes ed at the end. Record the exact adjudication, preserving the current output for this report. The separate older #94 (`benced`) still reproduces a failure of that requirement; it is outside the proposed ten-report scope unless Q selects all reports.
- #134: current gh beats equal-length ong+h under 10.10.7, absent pronunciation information that would disallow gh. Do not change contraction preference to imitate the comparator.
- #137: current s+the+a uses fewer cells than st+h+e+a, following 10.10.2–3. No supplied pronunciation establishes that the h is aspirated (10.11.2). Retain current output and explain the pronunciation qualification in the exact adjudication.
- #133, #136, #138, #143: one/some/be eligibility depends on unknown pronunciation or syllabification. Rules 10.12.7–10 expressly permit differing software transcriptions for unfamiliar and contrived words. Preserve existing translation policy; record exact differences with their specific preference/syllable rationale, not a blanket exemption for all strings containing one/some/be.
- #141: review both differing spans explicitly: initial be and internal of. Rule 10.3.1 permits of wherever its letters occur; unknown pronunciation can qualify use under 10.10.8–9 and 10.12.7–10. This must not be described as solely a first-syllable difference.

## Proposed smallest change for the ten-report scope

1. Preserve original report inputs and exact output evidence in the existing oracle fixture/ledger workflow before editing production source. Add focused regression cases in existing test owners for the two verified defects.
2. Correct the existing word-start guard (roughly one production line plus focused tests).
3. Extend the existing compiled ambiguity representation to include the longer-shortform readings already described by the authored rules. Reuse their eligibility conditions for start, consonant/vowel/y, standing and mode stability. Select symbol versus word Grade 1 according to 10.9.8–9, retaining allowed contractions after a symbol indicator and suppressing them across a word-indicated sequence. Do not introduce a separate shortform inventory. Expected handwritten production change roughly 100–150 lines across the existing compiler, generator, composition and program types, plus focused tests and regenerated output.
4. Record individual exact adjudications for the other eight reports in the existing empirical ledger. No new fuzz family is necessary for these exact reports. References identify each issue and the primary rules deciding its distinct spans.
5. Use an isolated branch based on integrated main. Reconcile resulting dictionary/corpus ledger transitions through existing audit tools; preserve every evidence digest when content case IDs repeat. Remove only proven agreements and review every changed residual disagreement.
6. Publish a PR for the selected scope and monitor its checks in the same turn. Obtain `npm run check`, full dictionary sweep and full retained-corpus sweep from existing PR CI. Reconcile red results within scope, without weakening checks. Run the required fuzz replay through the existing runner; include the standard 100,000-case baseline and replay the reported seeds as needed to validate adjudication. PR oracle workflow does not run the release fuzz step by default: its `replay-fuzz` input is false, so a green PR oracle alone does not prove fuzz replay.
7. Report exact pushed-head results and remaining limitations. Q authorized normal merge and resolving supported issues. Do not mark reports resolved merely because their differences are hidden by an expanded predicate.

## Surprises

- #128 `(ags.` is still open but already agrees with Liblouis on the current source; the issue body alone is stale evidence for present behavior.
- The older #91 body still reports `(v'`, while its subsequent implementation history concerns other counterexamples; read comments before interpreting its current acceptance scope.
- Existing task notes contain historical revisions and outdated run status. They were context only; current source and live comparisons are the evidence above.

## Next step

Publish the scoped repair and follow CI, reconciling the full dictionary/corpus evidence before merge. The two known defects are repairs under Q's existing resolution request, not a new feature design. All new focused Grade 2 tests pass (1,027 tests in that file). The guard repair also needed to recognize that a whole matchable range after an apostrophe is not a whole word, preserving in/en groupsigns. General ambiguity patterns are derived from existing longer-shortform guards, including word Grade 1 for internal readings. No review/check result for the PR exists yet.
