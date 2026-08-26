---
title: "Guidance on Transcribing Mathematics and Science in UEB"
authors: "Braille Authority of North America"
year: 2026
venue: "Braille Authority of North America"
doi_url: "https://www.brailleauthority.org/unified-english-braille-codebooks"
produced_by:
  agent: "codex-gpt-5"
  skill: "paper-reader"
  plugin_version: "4.9.0"
  timestamp: "2026-08-26T17:16:43Z"
---
# Reading notes: BANA mathematics and science guidance

## Scope and precedence

- Approved in May 2026, this guidance applies in the United States and Canada as a regional supplement to the 2024 third-edition RUEB and ICEB's GTM. It offers clarification and preferred practices; it does not replace the international rules. [pp. 1-2]
- The main target is consistent production for textbooks, standardized tests, and transcriptions made without student/classroom context. Mandated curricula and instructional materials may choose other permitted presentations. [p. 2]
- Readability and clarity take precedence over mechanically copying print layout. When print format is changed, a transcriber's note may be needed under BANA Formats practice. [p. 2]

## Regional spacing preferences

- Default mathematical spacing follows ICEB: spaces surround comparison/relation signs, while operation signs attach to adjacent terms. [p. 2]
- An agency may choose spaced operations for beginning readers. This is a regional/document presentation policy, not a different cell mapping. [p. 2]
- Prefer an unspaced comparison sign when spacing would force a complex expression to break across lines, and when the comparison occurs off the baseline, such as in a limit. [pp. 2-3]

## General formatting

- Displayed technical material follows BANA's 2016 *Braille Formats* rules for literary displays, except that technical paragraphs are never blocked. The source points specifically to paragraph, displayed-material, exercise-direction, exercise-question, and glossary sections. [p. 3]

## Braille-line division algorithm

- Choose break sites from expression structure. Preference order begins before comparison signs, then before operation signs, then before a larger atomic unit. [p. 3]
- Do not split atomic units: a fraction (with numerator and denominator themselves treated as units), function, radical, modified item, shape/arrow, grouped content, number with its abbreviation or coordinates, molecule, or chemical bond. [p. 3]
- The same structural rules apply to displayed and embedded mathematics. Do not split one expression across Braille pages. [pp. 3-4]
- When an expression continues on another line, use the dot-5 continuation indicator unless the runover begins with an operation or comparison sign. Without that continuation cell, the end of the Braille line behaves as a space. [pp. 4-5]
- This makes layout a distinct phase over structured expressions: translation emits cells and break opportunities; a width-aware formatter selects the break and continuation behavior. [pp. 3-5]

## Regional grade-1 preference

- BANA adopts the 2025 GTM 1.7 framework and emphasizes that several indicator scopes can be correct. Its examples classify outputs as requiring no grade-1 indicator, symbol indicators, word indicators, or a passage. [pp. 5-8]
- A series of adjacent expressions may share one passage, including intervening punctuation. To preserve contractions in prose between groups, terminate before the words and begin another passage at the next mathematical group. [p. 8]
- A whole exercise set may be a passage. A passage continues across a Braille page boundary without a repeated opener, and final punctuation normally precedes the terminator. [p. 8]
- These are explicit regional preferences layered over ICEB's allowed choices; canonical BANA output and generic ICEB-conforming alternatives must remain separate test modes. [pp. 5-8]

## Spatial problems

- For textbooks and standardized tests, preserve print spatial layout. For a series of similar spatial problems, numeric passage mode is preferred and must be terminated after the series. [p. 9]
- Other UEB spatial presentations remain suitable for instruction when they make the procedure easier for new Braille readers. Thus standardized-production and teaching layouts are distinct regional policies. [pp. 9-10]

## Coverage and examples

- The examples cover equations, chemistry, fractions, matrices, modifiers, parallel relations, powers, radicals, multi-line derivations, continuation cells, grade-1 scope classes, equilibrium arrows, spatial arithmetic, limits, summations, and long arithmetic. [pp. 2, 4-10]
- Each grade-1 example cites the controlling RUEB/GTM clauses, making it suitable for rule-linked regional fixtures rather than an unlabelled corpus. [pp. 5-8]

## Implementation consequences

- Represent jurisdiction as an explicit closed value; selecting BANA may add formatting and canonical-choice preferences but must not silently replace ICEB mappings. [pp. 1-2]
- Separate translation, grade-1 scope planning, and width-aware layout. The line-break rules require tree structure and output width, while indicator decisions require symbols-sequence counts and prose boundaries. [pp. 3-8]
- Provide distinct production profiles for standardized/general BANA output and classroom/teaching presentation. Do not infer the profile from the mathematical tokens. [pp. 2, 9-10]
- Preserve provenance per behavior: international RUEB/GTM rule, 2025 ICEB update, or 2026 BANA preference. [pp. 1-11]

## Collection Cross-References

### Already in Collection

- [Unified English Braille: Guidelines for Technical Material](../ICEB_2014_GuidelinesTechnicalMaterial/notes.md) - international base that this regional guidance supplements.
- [Guidelines for Technical Material, Section 3: Signs of Operation and Comparison](../ICEB_2018_OperationComparison/notes.md) - BANA adopts its default spacing and line-break exceptions for operation/comparison signs.
- [Guidelines for Technical Material, Section 1.7: Choice and Placement of Grade 1 Indicators](../ICEB_2025_Grade1Indicators/notes.md) - BANA applies this algorithm while selecting regional preferred alternatives.

### New Leads (Not Yet in Collection)

- Braille Authority of North America, *Braille Formats: Principles of Print-to-Braille Transcription* (2016) - controls regional display formatting.
- UKAAF, *Additional Guidance for UEB Mathematics* - listed as a comparative technical resource, not North American authority.

### Supersedes or Recontextualizes

- (none; this is explicitly supplemental)

### Cited By (in Collection)

- (none found)

### Conceptual Links (not citation-based)

- [Finite-State Transducers in Language and Speech Processing](../Mohri_1997_FiniteStateTransducers/notes.md) - moderate connection: deterministic sign translation remains sequential, while BANA's width-aware break selection and regional preferences require explicit higher-level passes.

## Resources named by the source

- *The Rules of Unified English Braille*, third edition, 2024. [p. 11]
- *Guidelines for Technical Material*, including the 2025 Section 1.7 update. [p. 11]
- UKAAF's additional UEB mathematics guidance. [p. 11]
- BANA's *Braille Formats*, 2016. [p. 11]
