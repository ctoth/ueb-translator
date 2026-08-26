---
title: "Errata for Guidelines for Technical Material, October 2008"
authors: "International Council on English Braille"
year: 2014
venue: "International Council on English Braille"
doi_url: "https://iceb.org/publications/ueb/"
produced_by:
  agent: "codex-gpt-5"
  skill: "paper-reader"
  plugin_version: "4.9.0"
  timestamp: "2026-08-26T17:16:43Z"
---
# Reading notes: GTM errata

## Scope

- This August 2014 document lists only corrections that ICEB considered material to understanding or using the October 2008 GTM; unlisted spelling and punctuation fixes are intentionally omitted. Unless marked print-only or Braille-only, a correction affects both editions. [p. 1]
- References use the 2008 print and Braille pagination, so implementations must key overlays by section number rather than current PDF index. [p. 1]

## Corrections affecting translation behavior

- Section 2.10 clarifies that print may use an apostrophe for foot/minute and a nondirectional double quote for inch/second. The parser must retain semantic unit choice instead of treating these glyphs as ordinary punctuation. [p. 1]
- Section 3.6 corrects the Braille-edition dot locator for the first listed symbol. [p. 1]
- Section 4.1.1 replaces obsolete line-mode guidance with the current UEB Rule 16 line-mode and guide-dot rules. [pp. 1-2]
- Section 6.4 removes an erroneous `dis` groupsign in the speed/fraction example: a general fraction opening indicator is not the beginning of a word under UEB 10.6.2. [p. 2]
- Section 6.5 supplies three corrected Braille fraction examples and fixes its cross-reference to Section 6.4. These corrections must override the base examples in any conformance corpus. [p. 2]
- Section 8.1 corrects a print multiplication sign that had been shown as the letter `x`; the structured token must remain multiplication rather than an identifier. [p. 2]
- Sections 9.3.1-9.3.3 replace examples governing function names and arguments, including multiple sine forms. Tests for function spacing must use these corrected forms. [p. 3]
- Section 11 corrects the ampersand symbol listing. Section 11.2 also fixes a cross-reference to 11.5.7. [p. 3]
- Section 12.1 changes definition item 8 from `next` to `previous`; this reverses the affected directional condition and is normative logic, not editorial wording. Its final example is also replaced. [p. 4]
- Sections 13.2 and 15.2/15.6 replace arrow and shape examples; Section 13.3 and 14.3.3 repair cross-references. [pp. 4-5]
- Section 16 swaps the first two *print* equilibrium/trend arrow symbols while retaining the already-correct Braille cells and names. A mapping imported from the uncorrected print column would therefore attach the two semantics backwards. [p. 5]
- Sections 16.3, 16.5, and 16.6 correct chemical/nuclear verbalizations and add a charged-lead equilibrium example. Section 16.7 routes tactile line drawing to current UEB Rule 16. [p. 5]

## Implementation consequences

- Apply this document as an ordered overlay on the base GTM: replacements win over the same section/example in the base text, while unaffected rules remain inherited. [pp. 1-5]
- Preserve a distinction among semantic corrections, Braille-only corrections, print-only corrections, and reference-only corrections. Only the first two can change emitted cells. [pp. 1-5]
- Exclude superseded base examples from conformance fixtures; retaining both would create contradictory expected outputs. [pp. 1-5]

## Collection Cross-References

### Already in Collection

- [Unified English Braille: Guidelines for Technical Material](../ICEB_2014_GuidelinesTechnicalMaterial/notes.md) - strong link to the exact base document corrected by this overlay.

### New Leads (Not Yet in Collection)

- International Council on English Braille - *The Rules of Unified English Braille*, Rule 16 and 10.6.2 - controls the updated line-mode and contraction conditions.

### Supersedes or Recontextualizes

- [Unified English Braille: Guidelines for Technical Material](../ICEB_2014_GuidelinesTechnicalMaterial/notes.md) - strong corrective overlay: affected base wording and examples are invalid where this errata supplies replacements.

### Cited By (in Collection)

- [Unified English Braille: Guidelines for Technical Material](../ICEB_2014_GuidelinesTechnicalMaterial/notes.md) - records this errata as a controlling overlay.

### Conceptual Links (not citation-based)

- [Guidelines for Technical Material, Section 3: Signs of Operation and Comparison](../ICEB_2018_OperationComparison/notes.md) - strong precedence link: both are official overlays on the GTM, but the 2018 replacement Section 3 is later and controls that section where their scopes meet.
