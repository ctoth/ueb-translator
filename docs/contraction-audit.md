# Contraction eligibility audit, 2026-09-16

This is a targeted audit prompted by `centimeters`, not a complete conformance
assessment. Run `npm run build`, then
`node scripts/audit-contraction-families.mts` for current output and rule traces.

## Corrected in this change

Exact-word exclusions did not cover reviewed inflections, and possessives lost
the exclusion even when their base was listed. The source now explicitly expands
reviewed word families; the compiler adds possessive spellings to all word
exclusion guards, including final groupsigns. That first repair changed source
data and compilation only; the follow-up below fixes runtime context handling.

| Restriction | Reproduced affected words now covered |
| --- | --- |
| 10.7.8, time pronunciation | centimeters, altimeters, centimes, sentiments, sentimental, sentimentally, multimeter(s), Mortimer's |
| 10.7.5, name/here syllable | enamels, enameled, enamelling, ornaments, ornamented, hereditary |
| 10.7.6, one syllable | baronets, colonels, anemones |
| 10.7.7, some syllable | somersaults, somersaulting, gasometers |
| 10.8.4, feminine ending | villainesses, villainess's |
| 10.3.1, compound boundary | microfilming |
| 10.6.1, first syllable | beaded, cones |

`centimeters` now produces `⠉⠢⠞⠊⠍⠑⠞⠻⠎`. ASCII possessives and capitalized
forms have exact-output tests. The follow-up also checks curly possessive
emission, including within directional single quotes. Positive controls retain
valid contractions in times, timed, timely, sometimes, maritime, names, named,
honey, monetary, hereafter, happiness, conifer, and become.

The rule citations apply to the restrictions. Additional word forms are our
applications of those restrictions, not a claim that ICEB enumerates every form.
This remains bounded lexical coverage, not a pronunciation engine or a general
solution for every derivative. Suffixes are explicitly reviewed per family;
unconditional stemming or prefix matching would incorrectly propagate some
restrictions, such as Monet to monetary.

## Context defects fixed in the follow-up

1. **Hyphenated components lose exclusions.** `centimeter-long` and
   `centimeters-long` previously applied `UEB-10.7-time`. In `composition.ts`, the
   eligibility word spans lexical joiners. The not-word guard ignores hyphens
   and compares the resulting entire string, so `centimeterlong` misses the
   exclusion. Exclusions now check both the current component and the complete
   lexical spelling; shortform eligibility retains its original coordinates.
2. **Surrounding single quotes lose exclusions.** ASCII `'centimeter'` still
   applied `UEB-10.7-time`. Quote/apostrophe characters entered the lexical extent;
   neither the base nor its possessive matched. Additional exclusion spellings
   now remove outer apostrophe marks while retaining internal apostrophes and
   possessive s. Both complete and component spellings are checked, preserving
   the exclusion in quoted `hoity-toity` as well.
3. **Curly apostrophes emit quotation marks.** In `centimeter’s`, eligibility
   correctly blocked time after the first change, but U+2019 emitted `⠠⠴`
   instead of the apostrophe `⠄`. Shared contextual punctuation resolution now
   emits the apostrophe between letters in both grades and document paths.
   Directional single quote pairs retain their opening/closing cells, including
   quoted plurals and quoted possessives.

The inverse translator shares the contextual curly-apostrophe edge and retains
both straight and curly print candidates when both retranslate to the same
cells. It prunes impossible left contexts before expanding paths, then applies
the existing forward-validation step. The original curly-apostrophe round-trip
test remains intact, with an additional Grade 2 round-trip regression.

## Remaining scope and ambiguity

The punctuation resolver also treats a leading right single quote before letters
as elision and an unmatched right single quote after s as a possessive. These
are explicit heuristics under 7.6.13; they do not solve every ambiguous quotation,
dialectal omission, or punctuation split across independent document text runs.
ASCII apostrophe emission is unchanged; this repair removes surrounding ASCII
apostrophes from exclusion spellings without adding general ASCII single-quote
classification.

The current guards also rely on callers for many compound and syllable
boundaries. Passing the enumerated example tests does not establish coverage of
arbitrary plain-text words. Further work should exercise each restriction with
inflections, punctuation, hyphenated contexts, and allowed near-neighbours.

Source: [ICEB, Rules of UEB, Third Edition (2024), Section 10](https://iceb.org/wp-content/uploads/2025/10/Rules-of-Unified-English-Braille-2024.pdf).
