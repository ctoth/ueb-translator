---
title: "Unified English Braille Guidelines for Technical Material"
authors: "International Council on English Braille Maths Focus Group"
year: 2014
venue: "International Council on English Braille"
doi_url: "https://iceb.org/publications/ueb/"
produced_by:
  agent: "codex-gpt-5"
  skill: "paper-reader"
  plugin_version: "4.9.0"
  timestamp: "2026-08-26T17:16:42Z"
---
# Reading notes: Guidelines for Technical Material

## Edition and scope

- The working source is the international 2008 GTM updated through August 2014. ICEB's Maths Focus Group produced it to support mathematics, science, and computer notation in UEB. [front matter pp. i-iii]
- The document has 17 sections: general principles; numbers/abbreviations; operations/comparisons/omissions; spatial layout; grouping; fractions; scripts; radicals; functions; set/group/logic; miscellaneous symbols; modifiers; arrows; shapes; matrices/vectors; chemistry; and computer notation. [front matter pp. iv-vi]
- Later official replacement sections and errata are authoritative overlays. In particular, the July 2025 Section 1.7 and October 2018 Section 3 must replace the base text rather than coexist as equal rules. [front matter and overlay sources]

## Section 1: general principles

### Spacing and layout

- Preserve print layout only where it conveys structure; do not reproduce inconsistent print spacing as if it were mathematical semantics. [p. 1]
- The base production default leaves operation signs unspaced and comparison signs spaced. Teaching material may space both; comparisons may be unspaced off-baseline or to avoid a harmful line division; isolated calculations in prose may follow print. [p. 1]
- Displayed expressions use indentation and runovers. Embedded expressions should move whole to the next line unless an obvious structural break is available. Break before comparisons, then operations, then a whole structural unit such as a fraction, function, radical, modified item, shape/arrow, grouped item, or number with unit/coordinates. Avoid page breaks. [pp. 3-4]
- A dot-5 continuation indicator follows the last cell of the initial line only when indentation alone would still allow the two portions to be misread as separate expressions. [p. 4]

### Grade 1 and numeric modes

- Grade-1 protection is required when a cell could otherwise be interpreted as a contraction or numeric meaning. Standalone single letters other than `a`, `i`, and `o`, and standalone letter sequences matching shortforms, are key cases. The literary standing-alone definition controls boundaries. [p. 2]
- Numeric mode begins with dots 3456 followed by a digit, comma, or decimal point. Only digits, full stop, comma, numeric space, simple fraction line, and continuation indicator persist in numeric mode; a space or other sign terminates it. [p. 2]
- Numeric mode also establishes grade-1 mode. That grade-1 scope ends at space, hyphen, or dash, but mathematical minus does not end it. Lowercase `a-j` immediately after a digit, full stop, or comma still need explicit grade-1 protection. [p. 2]
- The base Section 1.7 recommends no indicators for simple numeric arithmetic, symbol indicators for some simple algebra, broad passages for complex equations, word indicators for complex unspaced expressions, and passage controls on their own lines for worked examples. It assumes grade 2 and prioritizes consistency/clarity over minimum cell count. [pp. 5-7]
- The July 2025 replacement supplies a more exact symbols-sequence algorithm and supersedes these base Section 1.7 recommendations. [pp. 5-7; 2025 overlay]

### Print identity, typeform, and capitals

- A core UEB design rule assigns one Braille equivalent to each print symbol regardless of subject meaning. Undefined print characters use transcriber-defined print or shape symbols. The typed input must therefore preserve print identity while separately carrying structural role. [p. 3]
- Mathematical italics used merely to distinguish variables are normally omitted; bold or another face that distinguishes vector/matrix or other semantic classes must be retained through typeform indicators. [p. 4]
- Strings of capitals in technical material remain uncontracted and normally use capital-word indicators. Frequent mixed-case domains such as chemistry/genetics may prefer the same systematic capitalization treatment. [p. 4]

## Section 2: numbers and abbreviations (through 2.10)

- Dates, times, decimals, grouping separators, ordinals, and other numeric forms preserve the relevant print punctuation. Examples cover comma/space grouped integers, ranges, leading-decimal forms, multiple date orders, clock styles, and ordinal suffixes. [pp. 8-10]
- Roman numerals are letters governed by grade-1 rules, not numeric-mode digits; cells such as `v` and `x` can need grade-1 protection while `i` does not. [p. 11]
- A typeform change inside a number requires the numeric indicator to be repeated after the typeform control; if emphasis begins on the first digit, the typeform control precedes the initial number indicator. [p. 11]
- Ancient/non-UEB numeration systems use transcriber-defined symbols declared on a special-symbols page or in a note. Hexadecimal is treated as an ordinary alphanumeric string rather than a new numeric mode. [pp. 11-12]
- Currency, percent, degree, prime/double-prime units, and angstrom have defined special-symbol mappings. The 2014 update permits apostrophe/double-quote print forms for foot/minute and inch/second. [p. 12]
- Abbreviations follow print order, spacing, capitalization, and punctuation; if number-to-unit spacing is unclear or inconsistent, insert a Braille space. This requires source-preserving raw notation plus an explicit normalized structured form for unambiguous production. [pp. 13-14]
- Examples cover currencies, imperial/metric units, percentages, recipes, duration strings, electrical units, pattern shorthand, and scientific constants, demonstrating that the number/unit pair is a structural unit for later layout. [pp. 13-14]

## Section 3: operation, comparison, and omission signs

- Section 3 defines explicit cells for common and less-common operations and comparisons, the ratio sign, and omission marks. Its 2014 symbol inventory is superseded where the October 2018 replacement differs, but its contextual guidance remains relevant unless contradicted. [pp. 15-19; 2018 overlay]
- Operation signs are normally unspaced while comparison signs are spaced. For spacing purposes the ratio sign behaves as an operation even though it compares quantities. [pp. 16-17]
- Algebraic letters require grade-1 protection according to standing-alone and contraction ambiguity. A print hyphen may serve for minus only when print does not distinguish them; otherwise the dot-5 mathematical minus is used consistently. [pp. 17-18]
- Print superscript placement distinguishes signed numbers from binary addition/subtraction; preserve that structure using the superscript indicator rather than guessing from the glyph alone. [p. 18]
- Omission is not one generic token: centered line, low line, visible space, square, question mark, and unmarked gap retain distinct print identities. [p. 19]

## Section 4: spatial layout and diagrams

- Spatial calculations introduce horizontal-line mode, vertical-line segments, a spaced numeric indicator, and numeric-passage controls. The passage establishes numeric and grade-1 modes, suppresses per-number indicators, and requires grade-1 protection before lowercase `a-j`. [pp. 20-21]
- Addition, subtraction, long multiplication, division, stacked fractions, carries, cancellation, and numbered calculations depend on two-dimensional alignment and local teaching practice. These cannot be faithfully reconstructed from an unstructured linear string; they need a structured layout entry point. [pp. 20-25]
- Spatial division may use a vertical-line segment for the print division bracket, while horizontal-line mode constructs bars. Cancellation may be represented spatially or linearly, with pedagogy sometimes favoring a verbal explanation. [pp. 22-24]
- Tally groups, tables, and diagrams reuse line-mode cells. Tables generally separate columns by two spaces, right-align additive numbers, and use horizontal-line mode for headings. [pp. 25-27]
- Horizontal-line mode changes the interpretation of a whole unbroken Braille line from symbols to shapes. Arrow mode and dot patterns can participate without ending it. For tactile clarity a diagram may intentionally relax a technical disambiguator, so diagram production must be an explicit policy-bearing operation. [pp. 27-28]
- Compact diagram labels permit documented accommodations, including systematic two-cell letter labels, shorter negative-number/coordinate forms, unspaced equals signs, and omitted degree signs. These require a transcriber's note and must not be silently applied by general translation. [p. 29]

## Sections 5 and 6: grouping and fractions

- Round, square, curly, angle, absolute-value, and multiline grouping devices have distinct opening/closing forms and are normally unspaced from their contents. [p. 30]
- A simple numeric fraction is limited to numeric-mode content in both numerator and denominator and uses the numeric fraction line, which continues numeric mode. A mixed number is two adjacent numeric items. A linear print slash remains the ordinary slash rather than being normalized to a stacked fraction. [pp. 31-32]
- Any non-simple stacked fraction uses explicit general-fraction open, separator, and close indicators. Numerator and denominator are recursively arbitrary expressions, including nested fractions. [pp. 32-33]
- The distinction is structural, not typographic guesswork: letters, currency, powers, operations, or other non-numeric components select general-fraction framing even when the printed visual bar looks identical. [p. 33]

## Section 7: level changes (opening)

- Subscript, superscript, directly-below, and directly-above indicators scope over the next `item`. An item is an entire number, general fraction, radical, arrow, shape, balanced grouping, Braille-grouped expression, or otherwise the next symbol. [p. 34]
- This explicit recursive scope is a parsing rule. A typed technical representation should model it as a discriminated expression node rather than reconstructing scope from emitted cells. [p. 34]

## Section 7: level changes (continued)

- A script appearing in grade-2 literary text may itself require grade-1 protection. The same level-change mechanism covers exponents, subscripts, footnote numbers, and chemical indices, while Braille grouping extends a script over an expression that is not one `item`. [pp. 35-36]
- Nested scripts require explicit grouping; negative exponents require grouping because the minus sign alone is an item. Chemistry demonstrates that a minus can instead be the complete superscript charge. [pp. 37-38]
- Simultaneous superscripts/subscripts are emitted bottom-to-top or left-to-right unless print placement communicates the reverse order. Left-displaced scripts are emitted before the base. [p. 38]
- Material directly above or below a term uses separate level indicators, not ordinary right-displaced script indicators. Common single modifiers such as bars and hats instead follow Section 12's modifier rules. [p. 39]

## Section 8: radicals

- A radical is an explicitly delimited recursive expression: opening radical, optional index as a superscript item, arbitrary radicand, then closing radical. Even a one-number square root is terminated. [pp. 40-41]
- Nested radicals therefore compose naturally in the same typed expression tree as fractions and scripts. A bare print root glyph without a vinculum is ambiguous; the standard permits the dot-5 isolated-symbol form when it is truly a graphic symbol, otherwise a contextually intended radical receives delimiters. [p. 41]

## Section 9: function names

- Preserve print spelling and capitalization of function names, while omitting mathematical italics used only to distinguish adjacent variables. [p. 42]
- Function boundaries determine spacing. Numbers adjacent to a function remain unspaced; a lowercase Latin argument following without an intervening indicator or bracket requires a space; a Latin variable preceding the name also requires a space. Existing capitalization, Greek, fraction, or bracket indicators can already disambiguate the boundary. [pp. 43-44]
- Trigonometric, hyperbolic, logarithmic, limit, statistical, and complex-number functions all use the same boundary rules. Inverse-function superscripts and logarithmic bases use the general script mechanism; structured fractions and directly-below limits reuse the same recursive nodes. [pp. 44-47]
- Function recognition cannot safely be an open-ended English word heuristic. A structured `function` node can preserve arbitrary print spelling while a bounded raw-text recognizer handles only standard names declared by the official source. [pp. 42-47]

## Sections 10 and 11: domain symbols

- Set, group, and logic notation adds a finite symbol inventory for union/intersection, membership, subset/superset variants, normal subgroups, Boolean operators, assertion, validity, and quantifiers. These symbols compose with ordinary grouping, scripts, and spacing rules. [pp. 48-49]
- The miscellaneous inventory covers calculus, geometry, logic, special punctuation, and seven transcriber-defined print symbols. Undefined print symbols must use an explicitly declared transcriber symbol or shape; the translator must not silently invent a mapping. [pp. 50-51]
- Symbol spacing generally follows print unless the symbol is functioning as an operation or comparison. Grade-1 indicators protect miscellaneous symbols whose cells also have grade-2 meanings. [p. 51]
- A fundamental invariant is one Braille equivalent per print symbol, even when the symbol has multiple semantic uses. For example, the vertical bar retains one representation across absolute value, probability, and set-builder notation. [p. 51]
- Integrals attach their limits through script nodes, remain unspaced from their integrand, and may leave a space before the differential. Binomial coefficients may be represented more readably as shapes than vectors. Hollow-dot operation must remain distinct from degree notation. [pp. 52-53]
- Complex examples show that arrows, quantifiers, grouping, relations, and transcriber-defined historical numerals compose rather than requiring expression-sized lookup entries. [p. 54]

## Section 11: alphabets and typeform

- Embellished capital letters such as number-set symbols are represented with script typeform indicators rather than separate semantic symbols. [p. 55]
- Greek letters form a finite, explicit lower/uppercase alphabet under the Greek indicator. This is a natural compact generated table keyed by print code point and case. [p. 56]

## Section 12: modifiers

- Bar, line-through, arrow, dot, tilde, hat, and arc modifiers apply postfix to the previous `item`, using the same item definition as scripts but in the opposite direction. [p. 57]
- Grouping is necessary when a modifier should apply to less than the natural whole item, such as one digit within a recurring decimal. Repeated or nested modifiers preserve order through explicit grouping. [pp. 58-59]
- Two modifiers on one item require grouping to distinguish which applies first. This is another direct reason for recursive typed nodes rather than a flat token list. [p. 59]

## Section 13: arrows

- Simple arrows are delimited by an arrow-mode opener and a direction-specific closer; bold uses a distinct opener. Arrow mode handles grade-1 ambiguity, and arrows normally use comparison spacing except as attached function limits. [pp. 60-61]
- Unusual shafts are compositional sequences encoding length, count, broken/dotted form, curves, and turns. Length is represented only when semantically distinguishing print arrows. [pp. 61-62]
- Unusual tips are separate compositional atoms. Direction is derived deterministically from directional tips, then one-sided tips, otherwise a rightward/upward default. [pp. 62-63]
- Arrow internals are emitted in logical tail-to-head order even when that reverses print order. Omitted shaft and tip components have specified defaults, allowing compact structured representation without enumerating every whole arrow. [p. 63]
- Multiple arrows or vertically juxtaposed reaction arrows are compositions of arrow nodes, not new opaque glyph mappings. [p. 64]

## Section 14: shapes and composites

- Shape notation composes a mode indicator for ordinary, filled, shaded, or transcriber-assigned shapes with a finite shape identity. A terminator is omitted before a space but required before punctuation or an unspaced following symbol. [pp. 65-66]
- Transcriber-defined shapes must be declared to the reader and must not replace a shape already defined by UEB. Their description is intentionally short and explicit. [p. 66]
- Composite symbols combine a previous item with the next by physical enclosure, superposition, vertical juxtaposition, or horizontal juxtaposition. They are used only when print intends a single composite symbol, not for ordinary sequences or for structures already covered by modifiers/scripts. [pp. 67-68]

## Section 15: matrices and vectors

- Matrices, determinants, vectors, and systems of equations require row/column layout with enlarged grouping symbols. Columns are separated and aligned by policy; surrounding operations occupy the top line. [pp. 69-70]
- Omission dots retain their spatial row/column placement. Wide matrices require one of several documented runover layouts and a transcriber's note; no single flat-string translation can choose this without page width and layout policy. [pp. 70-72]
- Vector semantics may be expressed by bold, bar, arrow, or spatial vector coordinates according to print. Grouped equations use enlarged curly braces and preserve meaningful print spacing. [pp. 72-73]

## Section 16: chemistry (opening)

- Chemistry begins with compositional equilibrium arrows and systematic bond atoms for one through four lines, dashed lines, dots, crosses, and small circles. [p. 74]

## Section 16: chemistry

- Chemical names otherwise follow ordinary UEB. Formulae preserve element capitalization, never contract element letters, and use ordinary right/left scripts for counts and charges. Capital-passage mode is an available consistency policy, not a new chemistry alphabet. [pp. 75-76]
- Atomic mass/number and electronic-configuration notation reuse left-displaced and nested script structures; print spacing that clarifies attachment is retained. [p. 76]
- Chemical equations compose formula nodes with operations, comparisons, ordinary arrows, and equilibrium arrows. Material above or below a reaction arrow is an attached modifier/layout concern. [p. 77]
- Electron dots/crosses/circles and simple structural formulae can use explicit repeated symbols and line mode. More complex electron and structural diagrams should use ordinary tactile-diagram methods, not an invented linear encoding. [pp. 78-82]
- The document explicitly says a proposed compact linear structural-formula method was not yet documented as UEB. It must therefore remain outside a standards-conformant implementation unless a later official source adopts it. [p. 82]

## Section 17: computer notation

- Computer notation uses the same print-symbol mappings as literary and mathematical contexts. It adds explicit cursor, visible-space, continuation, continuation-with-space, and nondirectional ASCII-quote handling. [p. 83]
- Source line breaks and spaces are presumed significant when the formal syntax may make them significant. Translator-inserted line breaks use different continuation forms depending on whether they replace a space; arbitrary breaks should avoid splitting letters when practical. [pp. 83-84]
- Visible-space print variants normalize to the UEB visible-space cell only when they explicitly denote a space. Runs of three or more significant spaces use visible-space cells internally while retaining boundary spaces. [pp. 84-85]
- Displayed programs normally use grade 1, while inline addresses, filenames, URLs, and computer expressions normally use grade 2. This is an explicit caller-selected content/layout mode, not a lexical guess from punctuation. [pp. 86-87]

## Implementation synthesis

- The standard's compact core is compositional: finite symbol atoms, a deterministic mode machine, recursive `item` scope, and explicit layout policies. Whole-expression lookup tables are neither necessary nor desirable.
- A raw-text API can be complete only for information actually present in the string. A typed technical API must carry stacked fractions, scripts, radicals, modifiers, arrows, shapes, matrices, spatial calculations, chemistry diagrams, and significant layout without guessing.
- Versioned rule overlays are first-class. The base 2014 rules remain available for provenance, but corrected/replacement rules from the 2014 errata, 2018 Section 3, and 2025 Section 1.7 take precedence in the active ruleset.
- Unsupported or ambiguous structures must produce typed failures or require explicit policy. Silent normalization would violate print-symbol identity and could produce plausible but incorrect Braille.

<!-- Reading complete: all PDF indices 000-092 inspected. -->

## Collection Cross-References

### Already in Collection

- [Errata for Guidelines for Technical Material](../ICEB_2014_GTMErrata/notes.md) - strong corrective overlay on the base sections and examples.
- [Section 3: Signs of Operation and Comparison](../ICEB_2018_OperationComparison/notes.md) - strong replacement link for the base Section 3.
- [Section 1.7: Choice and Placement of Grade 1 Indicators](../ICEB_2025_Grade1Indicators/notes.md) - strong replacement link for the base Section 1.7.
- [Guidance on Transcribing Mathematics and Science in UEB](../BANA_2026_MathScienceGuidance/notes.md) - regional supplemental guidance for the United States and Canada.

### New Leads (Not Yet in Collection)

- International Council on English Braille - *The Rules of Unified English Braille*, Third Edition, 2024 - supplies the current underlying UEB rules delegated to throughout this source.

### Supersedes or Recontextualizes

- The 2014 update supersedes the October 2008 base edition; the separate errata document identifies changes for holders of that older edition.

### Cited By (in Collection)

- [Errata for Guidelines for Technical Material](../ICEB_2014_GTMErrata/notes.md) - corrects this source.
- [Section 3: Signs of Operation and Comparison](../ICEB_2018_OperationComparison/notes.md) - replaces this source's Section 3.
- [Section 1.7: Choice and Placement of Grade 1 Indicators](../ICEB_2025_Grade1Indicators/notes.md) - replaces this source's Section 1.7.
- [Guidance on Transcribing Mathematics and Science in UEB](../BANA_2026_MathScienceGuidance/notes.md) - supplements this source regionally.

### Conceptual Links (not citation-based)

- [Finite-State Transducers in Language and Speech Processing](../Mohri_1997_FiniteStateTransducers/notes.md) - moderate connection: linear symbol and mode behavior forms a deterministic sequential transduction, while structured layout is a separate pass.
