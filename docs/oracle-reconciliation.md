# September 2026 oracle reconciliation

Authority: the local `papers/ICEB_2024_RulesUnifiedEnglishBraille/paper.pdf`
and the [ICEB 2024 rules](https://iceb.org/wp-content/uploads/2025/10/Rules-of-Unified-English-Braille-2024.pdf).
Liblouis is a comparator, not the specification.

## Code corrections

- Rule 8.4.2 and its printed-page-91 examples terminate capitals word mode at
  an apostrophe. `DON'T` repeats the capital indicator after the apostrophe;
  `OK'd` does not need a capitals terminator. Forward and inverse translation
  now agree with these examples. The former continuation class was removed.
- Rule 10.4.3 defines the beginning of a word using spaces, hyphens and dashes.
  An internal apostrophe does not restart a word: `Ch'ing` uses `ing`.
- Rule 10.8.1 explicitly permits a final-letter groupsign after a modified
  letter. The accented letter before `ance` in `déchéance` must remain visible
  to this eligibility check even though it splits the matchable letter ranges.
  Likewise, `in` in `Féin` is part of a word, not an isolated lower wordsign.
- Rules 7.6.14–7.6.15 recommend an initial-elision dictionary and an opening
  single quote otherwise. The authored dictionary distinguishes `’Tis` from
  `’Word’`; closing double quotes are also recognized before punctuation.
- First-syllable groupsigns remain eligible after leading punctuation.
  Rule 10.6.1 exceptions cover the newly encountered `bend`, `beat`, `bear`,
  `bed`, `beep`, `best`, `better`, `bedrock`, `bedroom`, `Belfast`, `Benfica`,
  and `Conan` spellings and reviewed inflections.
- Standing-alone tests use each dash-separated component, so punctuation
  beyond the dash does not suppress the wordsign in `can't—“`.

## Evidence handling

Use Liblouis 3.38.0 built with `--enable-ucs4`, matching CI. A matching version
string alone does not establish the Unicode width of a local build.

Remove stale evidence only after replay establishes current local/oracle
agreement. For changed corpus evidence, reproduce the old evidence digest
using the last passing source revision before retaining its classification.
An unchanged residual difference may retain its existing verdict; correcting
another span of the sentence does not make that residual difference new.
Review differences outside the previous evidence separately.
Preserve distinct evidence digests for duplicate corpus text: the source
document identity is part of the evidence even when the content case ID repeats.

Rule 10.8.4 forbids `ness` for a feminine `ess` ending attached to an `en` or
`in` stem. The oracle's `ness` in `villainess's` and `villainesses` violates
that rule. Record the exact evidence as an oracle defect.

The isolated spelling `MST's` has no expansion. Rules 10.12.1–10.12.2 allow
contractions when pronunciation is uncertain, so its existing `st` difference
remains pronunciation-dependent after the capitals defect is removed.

A clean reconciliation means no stale or untriaged evidence. It does not mean
that all previously recorded implementation defects have been repaired or
that all local outputs are identical to Liblouis.

## Expanded nightly run

After reconciling the full sweeps, increase the nightly sample count from
10,000 to 100,000. Replay seed `-679952479` at that size. Its diagnostic pass
identified 38 additional exact inputs; also retain the minimized `(aggh)` case.
Five cases expose Liblouis contracting `bb` beside a capitals indicator, contrary
to 10.6.6. Twenty-six have unresolved pronunciation, syllabification, or
abbreviation context. Eight reproduce pre-existing shortform disambiguation,
apostrophe-extension, or hyphenated lower-wordsign defects; their outputs are
unchanged from the last passing source revision `951aa0c7` and remain explicitly
classified as implementation bugs. Every entry retains exact comparison evidence
and a cited verdict; the fuzz gate still rejects any unrecorded difference.
