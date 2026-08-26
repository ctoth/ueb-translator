---
title: "Guidelines for Technical Material, Section 3: Signs of Operation and Comparison"
authors: "International Council on English Braille"
year: 2018
venue: "International Council on English Braille"
doi_url: "https://iceb.org/GTM3_Operation%26Comparison.pdf"
produced_by:
  agent: "codex-gpt-5"
  skill: "paper-reader"
  plugin_version: "4.9.0"
  timestamp: "2026-08-26T17:00:09Z"
---
# Reading notes: Signs of Operation and Comparison

## Scope and authority

- This is the October 2018 approved replacement for Section 3 of ICEB's *Unified English Braille: Guidelines for Technical Material*. It defines the technical-UEB cells and layout rules for mathematical operation and comparison signs. [pp. 1-11]
- The section is not a complete mathematics code. It routes fraction lines to Section 6; set, group, and logic operators to Section 10; comparison arrows to Section 13; ASCII signs to Section 17; function-name spacing to Section 9.3; and literary uses to the main UEB rulebook. [p. 2]
- The mappings below transcribe the source's cells into Unicode Braille Patterns. Several distinct print code points intentionally share one Braille sequence, so input must preserve the selected print/semantic token until translation. [pp. 1-2]

## Operation-sign inventory

| Print | Code point | Unicode Braille | Role |
|---|---:|---|---|
| `+` | U+002B | `⠐⠖` | plus |
| `−` | U+2212 | `⠐⠤` | mathematical minus distinguished from hyphen |
| `×` | U+00D7 | `⠐⠦` | multiplication cross |
| `⋅` | U+22C5 | `⠐⠲` | dot operator |
| `·` | U+00B7 | `⠐⠲` | middle dot used for multiplication |
| `∙` | U+2219 | `⠐⠲` | bullet operator used for multiplication |
| `÷` | U+00F7 | `⠐⠌` | division |
| `±` | U+00B1 | `⠸⠖` | plus-minus |
| `∓` | U+2213 | `⠸⠤` | minus-plus |
| `∶` | U+2236 | `⠒` | ratio |
| `∘` | U+2218 | `⠐⠴` | hollow-dot/ring composition operator |
| `∗` | U+2217 | `⠐⠔` | mathematical asterisk/star |

All mappings in this table are controlled by the source's operation-sign table. [p. 1]

## Comparison-sign inventory

| Print | Code point | Unicode Braille | Role |
|---|---:|---|---|
| `=` | U+003D | `⠐⠶` | equality |
| `≠` | U+2260 | `⠐⠶⠈⠒` | equality followed by cancellation |
| `<` | U+003C | `⠈⠣` | less-than |
| `>` | U+003E | `⠈⠜` | greater-than |
| `≤` | U+2264 | `⠸⠈⠣` | less-than-or-equal |
| `≥` | U+2265 | `⠸⠈⠜` | greater-than-or-equal |
| `≪` | U+226A | `⠨⠈⠣` | much-less-than |
| `≫` | U+226B | `⠨⠈⠜` | much-greater-than |
| `≡` | U+2261 | `⠸⠿` | identical/congruent/equivalent |
| `⦀` | U+2980 | `⠼⠸⠇` | triple vertical-bar delimiter |
| `⫴` | U+2AF4 | `⠼⠸⠇` | triple vertical-bar binary relation |
| `⫼` | U+2AFC | `⠼⠸⠇` | large triple vertical-bar operator |
| `∼` | U+223C | `⠈⠔` | tilde operator/similarity |
| `~` | U+007E | `⠈⠔` | ASCII tilde used as a midline tilde |
| `≃` | U+2243 | `⠸⠔` | tilde over horizontal line |
| `≈` | U+2248 | `⠘⠔` | tilde over tilde |
| `≅` | U+2245 | `⠐⠸⠔` | tilde over equals |
| `≑` | U+2251 | `⠨⠐⠶` | equals dotted above and below |
| `≏` | U+224F | `⠘⠐⠶` | equals with a raised/bumped top bar |
| `∝` | U+221D | `⠸⠐⠶` | proportional-to |
| `∷` | U+2237 | `⠒⠒` | proportion/as |
| `∥` | U+2225 | `⠼⠇` | parallel-to |
| `⟂` | U+27C2 | `⠼⠤` | perpendicular/orthogonal-to |

All mappings in this table are controlled by the source's comparison-sign tables. [pp. 1-2]

## Spacing model

- The default is category-dependent: operation signs attach to their operands, while comparison signs receive surrounding Braille spaces. Spacing is semantic structure used to parse the expression, not a copy of incidental print typography. [pp. 2-7]
- A teaching presentation may temporarily space operation signs before transitioning readers to the default unspaced form. This is an explicit presentation mode, not a different operator mapping. [p. 7]
- A comparison sign inside a non-baseline construct, such as a summation or integral limit, is unspaced. The layout position must therefore be represented in structured input. [p. 8]
- A comparison sign may be unspaced to prevent an expression from being split across Braille lines. This is a line-layout decision that cannot be inferred from a context-free token mapping. [p. 8]
- Operation signs may be spaced when quantities already contain spaces between values and units and the added spacing makes the grouping unambiguous. [p. 8]
- When neighboring content is prose rather than a wholly mathematical expression, operation and comparison signs follow the print spacing. The examples cover signed endpoints, an inline negative fraction, a comparison embedded in prose, and an approximation adjoining a unit. [p. 9]

## Minus and signed numbers

- U+2212 has the technical minus sequence `⠐⠤`. A print mark that cannot be distinguished from U+002D may instead retain the ordinary Braille hyphen. This is a source-token distinction; normalizing both characters to one generic dash before translation destroys required information. [p. 9]
- When a plus or minus denoting a signed number is printed in superscript position, Braille uses the superscript indicator before the sign. A transcriber's note may describe the presentation instead, so the structured model needs an explicit choice rather than a guessed layout. [p. 10]
- The source distinguishes superscript placement from ordinary signs in an exponent: the layout indicator belongs to the signed-number token, not to a surrounding expression by accident. [p. 10]

## Hollow dot and asterisk

- U+2218 as a mathematical operation is always the hollow-dot sequence `⠐⠴`. The source distinguishes that operation from the literary bullet and degree sign handled by other UEB rules. [pp. 10-11]
- Function composition and algebraic use share the same hollow-dot mapping. Parentheses and adjacency remain ordinary expression structure around that operator. [p. 11]
- U+2217 as a mathematical operation uses `⠐⠔` and is normally unspaced. Both midline and raised print asterisks use this technical cell sequence when they are mathematical operations. [p. 11]
- ASCII and literary asterisks are explicitly routed to other rules, so code-point shape alone is insufficient to choose the technical mapping. [p. 11]

## Implementation consequences

- Model `operation` and `comparison` as separate closed variants because the class controls default spacing and exception handling. [pp. 1-2]
- Preserve the exact Unicode scalar and semantic role. The three multiplication dots, two tilde code points, and three triple-bar code points collapse to shared output sequences only after the input token has been validated. [pp. 1-2]
- Represent spacing context explicitly: `baseline`, `nonBaseline`, teaching presentation, line-break avoidance, quantity-with-unit grouping, and mixed prose are materially different source conditions. [pp. 2, 7-9]
- Represent the mathematical-minus/hyphen choice and superscript signed-number position as typed data. Neither decision can be recovered safely from an already-normalized string. [pp. 9-10]
- Keep technical operator translation separately importable from literary translation; several visually similar signs are deliberately delegated to literary or computer-notation rules. [pp. 2, 10-11]
- Treat each table row and each spacing subsection as a rule-linked test contract. Tests should cite the page and subsection without copying the source's prose or full examples. [pp. 1-11]

## Limits of this source

- This section does not define fractions, roots, matrices, arrows, set theory, logic, computer notation, or complete mathematical layout. Those require the referenced GTM sections. [p. 2]
- It predates the 2024 third edition of the main UEB rules and later approved technical revisions. Later official notices must be applied as explicit overlays rather than assumed to be incorporated here. [title/footer throughout]
- It does not define a raw-print parser. The examples demonstrate transcription results but do not remove ambiguity from plain-text source notation. [pp. 3-11]

## Open implementation questions

- [ ] Determine whether line-break avoidance belongs in the translator or a later Braille layout engine. [p. 8]
- [x] The base GTM, including Section 9.3 function-name spacing, is ingested as a separate official source. [base GTM pp. 42-47]
- [x] The approved July 2025 Section 1.7 revision is ingested and retained as a separate precedence overlay.

## Collection Cross-References

### Already in Collection

- [Unified English Braille: Guidelines for Technical Material](../ICEB_2014_GuidelinesTechnicalMaterial/notes.md) - strong link to the base document whose Section 3 this source replaces.
- [Section 1.7: Choice and Placement of Grade 1 Indicators](../ICEB_2025_Grade1Indicators/notes.md) - controls grade-1 scope around the operation and comparison signs defined here.
- [Guidance on Transcribing Mathematics and Science in UEB](../BANA_2026_MathScienceGuidance/notes.md) - regional guidance applying these signs and spacing rules.

### New Leads (Not Yet in Collection)

- International Council on English Braille - *The Rules of Unified English Braille*, current edition, Sections 3.3, 3.5, 3.11, and 3.17 - controls the literary forms explicitly excluded from this technical section.

### Supersedes or Recontextualizes

- [Unified English Braille: Guidelines for Technical Material](../ICEB_2014_GuidelinesTechnicalMaterial/notes.md) - strong replacement link: this approved 2018 source controls Section 3.

### Cited By (in Collection)

- [Section 1.7: Choice and Placement of Grade 1 Indicators](../ICEB_2025_Grade1Indicators/notes.md) - uses these sign classes in its scope algorithm.
- [Guidance on Transcribing Mathematics and Science in UEB](../BANA_2026_MathScienceGuidance/notes.md) - applies these operation/comparison rules regionally.

### Conceptual Links (not citation-based)

- [Incremental Construction of Minimal Acyclic Finite-State Automata](../Daciuk_2000_MinimalAcyclicAutomata/notes.md) - moderate connection: this standard supplies the finite, exact sign inventory that the project's Daciuk-derived build-time dictionary compiler can minimize.
- [Finite-State Transducers in Language and Speech Processing](../Mohri_1997_FiniteStateTransducers/notes.md) - moderate connection: the standard's context-sensitive but deterministic mappings form part of the sequential rule program executed by the project's Mohri-derived runtime.
