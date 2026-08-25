# Implement UEB technical material with explicit structure

## Problem

Technical notation cannot be recovered reliably from visually ambiguous plain
text. The API needs explicit structure and the current official UEB rules.

## Scope

- Define a small discriminated-union input model for mathematical, scientific,
  and computer notation.
- Implement the 2014 Guidelines for Technical Material, revised Section 3
  (2018), the grade-1-indicator revision approved July 14, 2025, and subsequent
  official ICEB updates.
- Treat BANA's May 2026 US/Canada guidance as a selectable regional supplement,
  not a replacement for ICEB.
- Provide explicit raw-text and structured-input entry points; do not guess a
  technical AST from ambiguous plain text.
- Exclude Nemeth, music, and IPA Braille.

## Acceptance criteria

- Every technical construct is a closed, exhaustively handled TypeScript variant.
- Tests cite the controlling ICEB rule/revision and, where selected, BANA guidance.
- Regional behavior is explicit in the input type and cannot change silently.
- Technical code/data are separately importable from literary translation.

## Normative sources

- ICEB UEB publications and approved GTM revisions:
  <https://iceb.org/publications/ueb/>
- BANA, *Guidance on Transcribing Mathematics and Science in UEB*, adopted May
  2026: <https://www.brailleauthority.org/unified-english-braille-codebooks>
