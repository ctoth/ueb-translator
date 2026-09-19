# Reviewed Grade 2 repairs

Authority: [ICEB Rules of Unified English Braille, 2024](https://iceb.org/wp-content/uploads/2025/10/Rules-of-Unified-English-Braille-2024.pdf),
checked against the local extracted rulebook. Liblouis 3.38.0 remains a non-normative comparator.

- **First syllables, 10.6.1 and 10.10.4:** add the reviewed lexical exceptions
  `been`, `beautiful`, `beautifully`, `dish`, and `dishes` to the existing
  syllable restriction data. This does not claim automatic pronunciation
  inference for arbitrary words. Existing capitalization, punctuation, possessive,
  and explicit-boundary handling continues to apply.
- **Shortforms plus endings, 10.9.5:** all 75 base shortforms retain their
  contraction with `s` or apostrophe-`s`, with the explicit exceptions `abouts`,
  `almosts`, and `hims`. Eligibility now examines the complete lexical spelling.
- **Groupsign-created ambiguity, 10.9.6:** derive forbidden collision spellings
  from the project-owned shortform and Appendix 1 inventories. Reuse the longer
  shortform position/vowel guards for cases such as `chnj`. Suppress only
  groupsigns overlapping the conflicting abbreviation; other legal contractions
  remain available. Mode indicators inside the abbreviation prevent the collision,
  so mixed-capital inputs such as `ChNz` and `HerF` retain their legal groupsigns.

Each repair was reproduced by failing regressions before implementation.
Tests cover every base shortform's suffix eligibility, the official `mst`,
`Herf`, and `somesch` examples, the website counterexample, punctuation,
capitals, longer-word collisions, and alternative contractions outside the
conflicting span.

## Evidence reconciliation

The baseline is commit `d8899d8`. Reusable `oracle:reconcile:audit` replays both
versions against the pinned oracle and verifies each previous evidence digest.
`oracle:reconcile` records explicit reviewed token transitions and produces a
candidate ledger, retaining separate evidence digests even where case IDs repeat.

The dictionary audit verified 71 resolved records. The corpus audit verified
24,120 resolved records and 1,689 partially repaired records. All 178 distinct
corpus token transitions were reviewed. In `been—about` and `been—the`, the
initial `be` repair preserves the exact existing dash discrepancy. Other
residual differences also retain their previous verdict; this is not a fresh
claim that the remaining sentences conform to UEB.

The prior `mst`/`MST's` permitted-alternative classification was incorrect:
unknown pronunciation does not override 10.9.6. The corrected outputs now agree,
so that evidence is removed rather than retained under the old rationale.

Five exact fuzz records are classified as Liblouis errors under 10.9.3/10.9.6:
`a'chn`, `fstpa`, `(fstz)`, a quoted `fstz` with a trailing apostrophe, and
`fsthxbev`. In the last case, rejecting the conflicting `st` still allows `th`.
The mixed-capital fuzz discrepancy was a translator regression and was fixed,
not accepted into the ledger.

The exploratory seed `628265697` also finds `a-monofa`, an independent,
unreviewed boundary/pronunciation discrepancy. It remains pending. The release
seed `-679952479` completed 100,000 cases after the reviewed repairs and oracle
adjudications. This work does not close the entire exploratory review queue.

## Reproduction

Run `npm run check`, `npm run oracle:build`, the full dictionary and retained
corpus checks, and the release fuzz replay. On Windows use the documented
`tools/liblouis-oracle/run-wsl.ps1` wrapper. See the oracle README for baseline
audit and candidate-ledger commands. Preserve generated audit logs and approvals
under `.oracle-artifacts`; never reconcile by case ID alone.
