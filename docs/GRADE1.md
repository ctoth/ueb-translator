# Uncontracted UEB contract

`translateGrade1` implements whole-text grade 1 under ICEB's 2024 Rulebook.
It is a deterministic transcription API, not an OCR or semantic-guessing API.

## Plain strings

Plain strings cover the print distinctions that determine one UEB rendering:

| Rulebook section | Surface |
| --- | --- |
| 3 | listed general symbols, arrows, currency, primes, and signs |
| 4 | English and Greek letters, modifiers, eng, schwa, and sharp s |
| 5 | grade-1 disambiguation required inside whole-text grade 1 |
| 6 | numeric-mode entry, continuation, grade-1 interaction, and termination |
| 7 | directional and nondirectional punctuation and brackets |
| 8 | capital symbol, word, passage, and termination modes |

ASCII spaces become Braille blanks. LF and CRLF boundaries are preserved.
Other whitespace is unsupported. The first unsupported source grapheme returns
both its Unicode-scalar and UTF-16 code-unit offsets, with no partial output.

## Typed documents

Section 9 typeforms, Section 3 Braille grouping, and Section 4.3 joined-letter
ligatures are semantic distinctions that a plain string cannot carry.
`Grade1Document` represents them explicitly.
A typeformed run chooses symbol, word, repeated-word, or passage indicators from
its extent. Passage terminators close nested typeforms in reverse order.
`Grade1BrailleGroup` is a non-empty recursive node, so an empty group cannot be
constructed by a TypeScript caller.
`Grade1Ligature` requires at least two explicitly joined letter items and rejects
digits, symbols, unsupported letters, and multi-letter items at runtime.

Print constructs that need technical-layout semantics, a symbols-page
definition, or transcriber judgment remain explicit failures here. The
technical entry point owns those structures; the Grade 1 string path never
manufactures them from visual resemblance.

## Testing

Example and boundary tests name their controlling ICEB sections. `fast-check`
generates supported strings to test determinism, the output alphabet, and exact
failure offsets. The built `dist/index.js` entry point also runs in headless
Chromium through Vitest Browser Mode and Playwright.
