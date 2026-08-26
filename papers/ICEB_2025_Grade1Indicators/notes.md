---
title: "Guidelines for Technical Material, Section 1.7: Choice and Placement of Grade 1 Indicators"
authors: "International Council on English Braille"
year: 2025
venue: "International Council on English Braille"
doi_url: "https://iceb.org/publications/ueb/"
produced_by:
  agent: "codex-gpt-5"
  skill: "paper-reader"
  plugin_version: "4.9.0"
  timestamp: "2026-08-26T17:16:43Z"
---
# Reading notes: technical grade-1 indicators

## Scope and terms

- This July 2025 approved replacement defines a technical expression as one uninterrupted group of mathematical or scientific symbols. It can include words, but ordinary prose establishes its outer boundary. [p. 1]
- A technical expression contains one or more *symbols-sequences*: unbroken Braille signs bounded by spaces, regardless of whether those signs are alphabetic. Indicator selection is computed over these sequences rather than over print tokens alone. [p. 2]
- The four controls are the grade-1 symbol indicator, word indicator, passage indicator, and passage terminator. [p. 1]
- The examples assume grade-2 mode before the technical expression; their grade-1 indicators are therefore not universal outputs independent of surrounding mode. [p. 13]

## Indicator-selection algorithm

1. Simple arithmetic made only of numbers, operation signs, numerical fractions, and mixed numbers requires no grade-1 indicators. [p. 1]
2. In simple algebra, standalone letters or letters following numbers may require grade-1 symbol indicators under the underlying UEB rules; fraction and superscript indicators can alter that need. [p. 1]
3. For each symbols-sequence, use at most one grade-1 symbol indicator. If that sequence would require more than one, place a grade-1 word indicator at the sequence start instead. Grade-1 indicators needed for lowercase `a` through `j` immediately after a number are excluded from this count. [p. 2]
4. Across the whole technical expression, use a grade-1 passage when at least three symbols-sequences would each require a grade-1 symbol or word indicator. Start the passage at the expression boundary and terminate it after the last symbols-sequence; intervening closing punctuation precedes the terminator even when that punctuation is not itself part of the expression. [pp. 2-3]
5. For long expressions, worked examples, or exercise sets, a grade-1 passage and terminator may occupy separate lines. When either control stands alone, precede it with the dot locator for use. [p. 3]

## Words inside technical expressions

- Mathematical function abbreviations such as `sin`, `arctan`, and `min` are symbols, not words, for this decision procedure. [p. 4]
- Within a symbols-sequence containing ordinary words, up to two grade-1 symbol indicators may be preferred when that preserves the words' usual contractions. If more than two are needed, use a word indicator. If at least three sequences in the expression still need symbol/word indicators, use a passage. [p. 4]
- A word indicator can begin immediately before the first sign vulnerable to contraction ambiguity, allowing earlier ordinary words in the same sequence to remain contracted. It need not always begin the entire sequence. [p. 4]
- Similarly, a passage may begin at the first symbols-sequence that needs grade-1 protection when doing so preserves preceding words in contracted form. [pp. 4-5]
- The default editorial strategy is to retain normal contractions where possible and apply these word-aware rules consistently through a text. [p. 5]

## Policy variants

- A transcriber may instead put every technical expression in grade-1 mode. This is an explicit document-level policy influenced by teaching practice, the local Braille authority, audience education and expectations, available tooling, and house production rules. [p. 5]
- Student-written mathematics is allowed a more permissive strategy when the eventual indicator count is unknown. A technically omitted indicator is not grounds for penalty when the mathematical meaning remains clear. This is assessment guidance, not the canonical production algorithm. [p. 5]

## Coverage demonstrated by the examples

- The preferred-selection examples exercise roots, superscripts, fractions, coordinates, modifiers above symbols, isotope and chemical notation, polynomial identities, nested fractions and radicals, function names, units, set notation, subscript chains, arrows, and multi-line laws. [pp. 5-12]
- Several examples compare a preferred narrow indicator with a valid broader grade-1 scope. The output model therefore needs to distinguish *canonical/preferred* production from merely conforming alternatives. [pp. 2, 5-12]
- Words and scientific units interact with the optimization: a passage can avoid repeatedly interrupting contractions, but unnecessarily broad grade-1 mode can reduce ordinary literary readability. [pp. 4-12]

## Implementation consequences

- Grade-1 planning is a separate scope-selection pass over an already structured technical expression. It needs the expression boundary, symbols-sequence boundaries, per-sign grade-1 requirements, ordinary-word regions, and surrounding Braille mode. [pp. 1-5]
- Use a typed document policy such as preferred minimal scope versus all-technical grade-1 mode. Do not infer regional/editorial policy from the expression text. [p. 5]
- The preferred algorithm is a small deterministic cost decision, not a heuristic parser: symbol and word choices are local to each sequence; passage choice uses the exact threshold of three qualifying sequences; word-preservation rules alter permitted start positions. [pp. 2-5]
- Preserve valid-alternative testing separately from canonical-output testing. Examples marked as alternatives should not make a single-string property test nondeterministic. [pp. 2, 5-12]
- Keep student leniency out of the production translator's output rules; it belongs in validation/assessment APIs if supported at all. [p. 5]

## Collection Cross-References

### Already in Collection

- [Unified English Braille: Guidelines for Technical Material](../ICEB_2014_GuidelinesTechnicalMaterial/notes.md) - strong link to the base Section 1.7 replaced by this source.
- [Guidelines for Technical Material, Section 3: Signs of Operation and Comparison](../ICEB_2018_OperationComparison/notes.md) - supplies the operation/comparison signs whose surrounding letters and sequence boundaries feed this indicator planner.
- [Guidance on Transcribing Mathematics and Science in UEB](../BANA_2026_MathScienceGuidance/notes.md) - regional supplement applying this algorithm and selecting preferred alternatives.

### New Leads (Not Yet in Collection)

- (none)

### Now in Collection (previously listed as leads)

- [The Rules of Unified English Braille, Third Edition 2024](../ICEB_2024_RulesUnifiedEnglishBraille/notes.md) - supplies the normative Grade 1 mode and per-sign disambiguation rules assumed by this replacement technical-expression scope planner; Section 10 also shows how Grade 1 indicators prevent contractions and shortforms from changing interpretation.

### Supersedes or Recontextualizes

- [Unified English Braille: Guidelines for Technical Material](../ICEB_2014_GuidelinesTechnicalMaterial/notes.md) - strong replacement link: this approved July 14, 2025 source controls Section 1.7.

### Cited By (in Collection)

- [Guidance on Transcribing Mathematics and Science in UEB](../BANA_2026_MathScienceGuidance/notes.md) - applies this algorithm in the BANA region.

### Conceptual Links (not citation-based)

- [Finite-State Transducers in Language and Speech Processing](../Mohri_1997_FiniteStateTransducers/notes.md) - moderate connection: per-sign translation is sequential, while this source adds a bounded expression-level planning pass whose decision depends on counts and scope boundaries.
- [The Rules of Unified English Braille, Third Edition 2024](../ICEB_2024_RulesUnifiedEnglishBraille/notes.md) - strong standards link: the rulebook supplies the Grade 1 semantics this replacement planner scopes, and both sources distinguish canonical production choices from other conforming alternatives that inverse APIs must retain rather than guess between.

## Open implementation questions

- [x] ICEB's publication index records approval on July 14, 2025 and publishes this file under revisions released for immediate use.
- [ ] Decide whether conforming non-preferred alternatives belong in a validator API or only in conformance fixtures.
