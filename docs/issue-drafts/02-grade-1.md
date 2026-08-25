# Implement complete uncontracted UEB (grade 1) translation

## Problem

The translator needs a complete standards-backed uncontracted mode, including
indicators and modes rather than a letters-only substitution table.

## Scope

- Implement UEB symbols, numeric mode, capitalization, grade-1 mode,
  typeform indicators, punctuation, grouping, and mode termination.
- Preserve whitespace and paragraph boundaries according to an explicit input
  contract.
- Report unsupported or malformed input explicitly; never silently guess.
- Link every test group to its controlling ICEB rule or symbol listing.

## Acceptance criteria

- All applicable 2024 Rulebook sections have traceable positive and boundary
  tests, including mode entry, continuation, and termination.
- The public API distinguishes uncontracted translation at the type level.
- Translation is deterministic and contains no language-model or heuristic path.
- Browser tests exercise the published ESM entry point.

## Normative source

- ICEB, *Rules of Unified English Braille*, Third Edition, 2024:
  <https://iceb.org/publications/ueb/>
