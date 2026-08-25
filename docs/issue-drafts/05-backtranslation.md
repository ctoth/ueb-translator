# Define and implement principled UEB backtranslation

## Problem

Braille-to-print is not always uniquely invertible, especially for contracted
Braille. The package must expose ambiguity rather than hide guesses behind a
string-returning API.

## Scope

- Specify exact behavior for grade 1 and grade 2 backtranslation.
- Return a discriminated result for unique, ambiguous, and invalid input.
- Separate standards-determined decoding from optional caller policy for choosing
  among print candidates.
- Reuse forward-rule provenance and cite any inversion algorithm selected.

## Acceptance criteria

- Grade 1 round trips for every supported symbol and mode.
- Grade 2 tests retain all valid candidates where UEB does not determine one.
- No frequency corpus, dictionary, or Liblouis output silently selects an answer.
- The default browser entry point adds no heuristic language model or dictionary.

## Normative source

- ICEB, *Rules of Unified English Braille*, Third Edition, 2024:
  <https://iceb.org/publications/ueb/>
