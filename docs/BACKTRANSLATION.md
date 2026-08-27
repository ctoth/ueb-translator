# UEB backtranslation contract

`backtranslateGrade1` and `backtranslateGrade2` decode Unicode Braille cells
without selecting a likely word. Their result is closed:

- `unique` carries one standards-valid candidate;
- `ambiguous` carries a compact iterable with typed `first` and `second`
  candidates, exact `bigint size`, indexed access, and lazy iteration;
- `invalid` reports either the first non-Braille scalar or the furthest cell
  position reachable by the standards decoder.

No default option accepts a corpus, dictionary, Liblouis result, or statistical
model. `selectBacktranslation` is a separate caller-policy helper and returns a
selection only when the policy returns the identical candidate object supplied
by the decoder. It cannot inject a new answer.

## Grade 1

The inverse scanner derives letters, digits, modifiers, and symbols by inverting
the generated Grade 1 symbol program. It restores capitals symbol/word/passage
modes, numeric mode and punctuation, Grade 1 indicators, Braille blanks, and
ASCII line endings. Unicode
spellings that have identical UEB cells remain distinct candidates where their
print identity differs, such as Greek sigma and final sigma.

Typeform, Braille-group, and ligature indicators are decoded as semantic
controls and the candidate's print text is normalized without those controls.
The original `Grade1Document` run boundaries are not reconstructed because
arbitrarily many equivalent run segmentations can emit the same cells.

## Grade 2

The inverse lattice uses the same 519 compiled, cited contextual rules as the
forward translator. It derives each rule's print input from the compact matcher
instead of shipping a duplicate reverse table.

This API chooses the extended-decoder contract (Option B): it accepts valid
capitals-passage scopes, the Grade 1 word indicator, and typeform indicators
even when the forward translator would choose a different indicator scope.
The decoder removes typeform controls and does not reconstruct their original
run boundaries. It still retains a candidate only when each lexical segment
recomposes through `traceGrade2`; alternate capitals scopes are compared after
their indicators are removed. The candidate's `rules` field is the resulting
ordered list of generated ICEB rule IDs.

This makes ambiguity observable without retaining readings that the forward
rules disambiguate. For example, `⠁⠃` is uniquely `about`: literal `ab` is
emitted as `⠰⠰⠁⠃` by the compile-time-derived Grade 1 pass. Greek sigma and
final sigma remain distinct candidates for `⠨⠎` because UEB gives them the same
cells and neither spelling needs a disambiguating control.

## Algorithm and complexity

The implementation follows the finite-state relation and composition model in
Mohri's 1997 survey. It enumerates cell-compatible paths with a deduplicating
work list, then composes Grade 2 paths with the canonical forward translator as
an exact legality predicate. ICEB 2024 Section 10 supplies the contractions,
contexts, forward preferences, and the cases where alternative transcription
is expressly permitted.

Runtime is linear in the visited lattice plus the number and total length of
materialized candidates. Whitespace-delimited Grade 2 segments are decoded
independently and their Cartesian product is retained symbolically, so merely
checking `kind`, `size`, `first`, or `second` does not expand every sentence.
Full iteration is inherently output-sensitive: a fixed cell string can encode
exponentially many print paths, and the API promises to retain them all rather
than truncate silently.

Sources:

- Mehryar Mohri, [Finite-State Transducers in Language and Speech Processing](https://aclanthology.org/J97-2003/), 1997.
- International Council on English Braille, [The Rules of Unified English Braille, Third Edition 2024](https://iceb.org/wp-content/uploads/2025/10/Rules-of-Unified-English-Braille-2024.pdf), Section 10.
