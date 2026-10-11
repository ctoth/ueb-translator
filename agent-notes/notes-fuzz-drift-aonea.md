# Fuzz ledger drift + `(aonea)` (follow-up to PR 131, started 2026-10-10)

## Context

- PR 131 merged as fe1c72a (main). Branch, temp worktree main-baseline and .corpus-cache junctions removed. Checkout is on main.
- Q replied "yes of course" to my summary listing two open items; I read that as "deal with them" and said so. Not a confirmed instruction beyond that.
- No merge of any new PR is authorized.

## Observed on main fe1c72a (dist built from the same tree)

- Local API: `translateGrade2(s).braille` from dist/grade2.js.
- Live Liblouis: `wsl -e bash -c 'LOUIS_TABLEPATH=/tmp/ueb-liblouis-ci-check/install/share/liblouis/tables /tmp/ueb-liblouis-ci-check/install/bin/lou_translate unicode.dis,en-ueb-g2.ctb'`, inputs on stdin (MSYS_NO_PATHCONV=1).
- Fuzz ledger records in tools/liblouis-oracle/empirical-disagreements.json: 112. Live Liblouis equals the recorded oracle output for all 112.
- 16 records' local output differs from the ledgered local output:
  - 14 now AGREE with live Liblouis (stale): `bea` (fuzz-first-syllable-be), `chnfpnbnbn'elkrctczesds`, `chnbwn-yomhamttvaga` (fuzz-children-ambiguity),
    `its'mugontw` (fuzz-its-apostrophe-extension), `{bee.` (fuzz-sep19-bee-first-syllable),
    `[bef?`, `"beuodqhsrbm.`, `'beyx!`, `(beytgxiefp?`, `[beh,` (fuzz-sep19-first-syllable),
    `'ytlsschn'`, `[chnqpzmkxa.`, `"jzguymhkchnp'`, `(chnbvthqmehs;` (fuzz-sep19-children-ambiguity).
  - 2 changed but still differ (both in fuzz-sep19-children-ambiguity, our-bug for ch+n; ch+n is now spelled on both sides):
    - `conchnpyyozxtl` local `⠒⠉⠓⠝⠏⠽⠽⠕⠵⠭⠞⠇`, Liblouis `⠉⠕⠝⠉⠓⠝…` → residual = local con vs spelled con (type of fuzz-sep19-first-syllable).
    - `conegachnth` local `⠒⠑⠛⠁⠉⠓⠝⠹`, Liblouis `⠉⠐⠕⠛⠁⠉⠓⠝⠹` → residual = con+e vs c+one (type of `coneaucjglbxfme` in fuzz-unknown-syllable-preference).
- `(aonea)`: local `⠐⠣⠁⠐⠕⠁⠐⠜`, Liblouis `⠐⠣⠁⠕⠝⠑⠁⠐⠜`. Probes: local one / Liblouis spelled for aonea bonea eonea stonea aonel xonez zonea ionea;
  both agree on aone onea aoneb aoned and on real words phone anemone baroness pioneer honest money colonel krone lonely done toner boned sooner.
- Existing ledger group for this type: fuzz-sep19-one-syllable (permitted-alternative, 10.7.6 + 10.10.7 + 10.12.7-8): `…sonez`, `caez-onedihp`, `jrkwoneex-o`. No fuzz family points at it.
- ICEB 10.7.6 (paper.pdf, pdftotext line 7497): use one when its letters are pronounced as one syllable, or word ends "oney", or honest/monetary; not after "o" or when other rules limit.
  Local rule: initial-letter-contraction with exception-word list (constraints.ts:164) + previous-not "o" (program.ts:226).

## Mechanics

- Fuzz families: tools/liblouis-oracle/src/fuzz-families.ts (hunk-level predicates, lowercase inputs only, each extends an existing ledger group).
- Ledger commands (README ~line 290-316): `oracle:reconcile -- supersede LEDGER AUDIT GROUP OUTPUT PREVIOUS_PREFIX...`, `regroup LEDGER GROUP OUTPUT PREFIX...`. Not read in detail yet.
- Sweeps do not flag stale fuzz records; the 4 removed in PR 131 were removed by hand with Edit.

## Done so far (branch fix/fuzz-ledger-drift-one-family, nothing committed yet) — 16:17

- Ledger tools/liblouis-oracle/empirical-disagreements.json edited with Edit: 15 fuzz records removed (the 14 agreeing + `conchnpyyozxtl`,
  which matchFuzzFamilies already returns ['fuzz-sep19-first-syllable'] for), `conegachnth` kept with local output updated to `⠒⠑⠛⠁⠉⠓⠝⠹`
  and group → fuzz-unknown-syllable-preference. 5 emptied groups removed (fuzz-first-syllable-be, fuzz-children-ambiguity,
  fuzz-its-apostrophe-extension, fuzz-sep19-children-ambiguity, fuzz-sep19-bee-first-syllable). Now 10413 entries, 53 groups, no unused groups.
- Standing verdicts for local-one / oracle-spelled: 1897 ledger records, all permitted-alternative (traced-initial-letter 1873 etc.), none our-bug.
- divergenceHunks splits `⠐⠕` vs `⠕⠝⠑` into two runs (`⠐`/"" and ""/`⠝⠑`) because ⠕ is common. So: added `localStart` to DivergenceHunk and a
  third `context` arg ({hunks, index, local}) to family predicates; new family `unknown-syllable-one` → group fuzz-sep19-one-syllable accepts the two
  runs only as the adjacent pair around a local ⠕, input has "one" not after o. Inverse case (`caez-onedihp`, oracle contracts) deliberately not covered.
- Tests added in test/fuzz-families.test.ts (2 positive, 5 negative, 1 localStart). oracle typecheck clean; oracle tests 172 pass.
- Still to do: README families paragraph, npm run check, build + oracle:build, recreate .corpus-cache junctions (I removed them after PR 131;
  sources in ../ueb-translator-issue-54/.corpus-cache), dictionary + corpus sweeps, release replay (-679952479) and nightly seed replay (-1461269147),
  commit, push, PR, oracle CI on pushed head. Remove junctions afterwards.

## Validated and PR opened — 16:40

- npm run check exit 0. Dictionary sweep 658033 / 10316 / stale 0 / untriaged 0. Corpus sweep 441223 / 35875 / 0 / 0. Release replay (-679952479, 100000) clean.
  Artifacts in .oracle-artifacts/fuzz-drift/.
- Commits 403f8a3 (ledger) and 9c12be1 (family) pushed; PR #132 https://github.com/ctoth/ueb-translator/pull/132. CI `check` and both Liblouis oracle runs pass on 9c12be1.
- NOT merged: no merge authorized for #132. Checkout is on the PR branch fix/fuzz-ledger-drift-one-family.
- .corpus-cache junctions removed again.
- Nightly seed -1461269147 now passes (aonea) and stops at path 58992:1:0:11 on `a'fstj`: local `⠁⠄⠋⠎⠞⠚`, Liblouis `⠁⠄⠋⠌⠚`.
  Local treats letters after a word-internal apostrophe as a word start: `a'first` → `⠁⠄⠋⠌` (Liblouis `⠁⠄⠋⠊⠗⠌`), `a'firstj` → `⠁⠄⠋⠌⠚`.
  Not adjudicated; needs a reading of 10.9.3 on whether an apostrophe begins a word for shortform purposes. Unledgered.
- Process gap noted, not fixed: sweeps never flag stale fuzz ledger records.

## Plan (branch off main, PR, no merge)

1. Remove the 14 agreeing fuzz records (+ any group left empty).
2. Re-adjudicate the 2 changed records (new local output; group matching the residual difference).
3. `(aonea)`: fuzz family for invented-word one (local `⠐⠕` vs oracle `⠕⠝⠑`) extending fuzz-sep19-one-syllable; tests.
4. npm run check, dictionary + corpus sweeps, release replay + nightly seed -1461269147 replay, PR, oracle CI on pushed head.
