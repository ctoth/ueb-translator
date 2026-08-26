# Structured technical UEB contract

`ueb-translator/technical` translates technical UEB without guessing a visual
notation tree from plain text. It has two entry points:

- `translateTechnicalText` preserves the print characters in a raw string and
  applies their ordinary UEB identities. A linear slash remains a slash; it is
  never promoted to a stacked fraction.
- `translateTechnical` accepts a `TechnicalDocument` whose closed variants
  carry the structure that print layout otherwise leaves ambiguous.

Both return discriminated success/failure unions and never return partial
Braille after an invalid value or unsupported character.

## Source precedence

The active international ruleset is the 2014 ICEB *Guidelines for Technical
Material*, corrected by its errata, with the October 2018 replacement Section 3
and July 2025 replacement Section 1.7 taking precedence over their old text.
The optional BANA May 2026 profile is a regional supplement for the United
States and Canada; it does not replace ICEB sign mappings.

- [ICEB technical publications and replacement sections](https://iceb.org/publications/ueb/)
- [2014 Guidelines for Technical Material, official BRF](https://iceb.org/wp-content/uploads/2025/02/guidelines_for_technical_material_2014.brf)
- [2014 errata, official BRF](https://iceb.org/wp-content/uploads/2025/02/errata_gtm_2014.brf)
- [2018 replacement Section 3, official BRF](https://iceb.org/wp-content/uploads/2025/02/GTM3_OperationComparison.brf)
- [2025 replacement Section 1.7, official BRF](https://iceb.org/wp-content/uploads/2026/02/GTM-1.7-Grade-1-indicators-Approved.brf)
- [BANA mathematics and science guidance](https://brailleauthority.org/node/50)

Tests cite these controlling sections and convert literal official BRF examples
to Unicode Braille only inside the test suite. Liblouis is not a source for any
runtime cell or rule.

## Closed structure

`TechnicalExpression` covers identifiers, numbers, sequences, operations,
comparisons, negation, simple and general fractions, six script placements,
square and indexed radicals, grouping, functions, postfix modifiers, simple
arrows, standard shapes, and chemical element symbols. `TechnicalBlock` adds
expressions, matrices, and displayed computer notation.

Finite choices are literal unions backed by exhaustive typed records. Matrix
rows are nonempty tuples and are checked for a uniform column count. Computer
blocks require the caller to choose Grade 1 or Grade 2 and ordinary or
significant spacing. Significant spacing follows GTM Section 17: in a run of
three or more spaces, only internal spaces become visible-space cells.
The Grade 2 block variant also requires a typed translator function, normally
`translateGrade2` from `ueb-translator/grade2`; this preserves support without
pulling the contraction program into the default technical browser bundle.

## Profiles and grade-1 scope

An international profile explicitly selects spaced or unspaced operation
signs. A `bana-2026` profile explicitly selects standardized production or a
teaching presentation; only the teaching profile spaces operations.
Comparison signs remain spaced under the ordinary rules.

`grade1: "preferred"` implements the symbols-sequence counts in the July 2025
replacement Section 1.7: one required protection uses a symbol indicator, more
than one in a sequence uses a word indicator, and three protected sequences in
one expression use a passage. `grade1: "all-technical"` selects the permitted
whole-expression passage policy directly.

## Deliberate boundary

The runtime does not invent transcriber-defined symbols, choose a wide-matrix
runover from page width, draw tactile diagrams, or recover vertically arranged
fractions, scripts, chemistry, or spatial arithmetic from a flat string. Those
operations require explicit caller structure or a later layout layer. Nemeth,
music Braille, and IPA Braille are outside this UEB package.
