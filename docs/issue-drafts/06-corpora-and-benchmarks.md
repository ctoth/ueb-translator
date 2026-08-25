# Build reproducible Gutenberg and modern-news corpus benchmarks

## Problem

Official rules establish correctness, but broad natural-language corpora are
needed to expose performance, coverage, and compression behavior.

## Scope

- Extract semantic reading text from the user's EPUB corpus with Calibre tooling.
- Add a reproducible Project Gutenberg acquisition path as the primary literary
  corpus.
- Add a reproducible English Wikinews dump path for modern journalistic prose.
- Record snapshot identifiers, licenses, hashes, extraction rules, and train/test
  partitioning.
- Keep downloaded texts, generated translations, and private EPUBs out of git and
  the npm package.

## Acceptance criteria

- One command prepares each available corpus without requiring it for package
  installation or ordinary unit tests.
- Held-out material is never used to choose or compress rules.
- Benchmarks report input bytes, output cells, throughput, peak memory, and raw,
  minified, Brotli, and gzip package sizes.
- Corpus failures cannot override a rule-linked conformance result.

## Sources

- Project Gutenberg: <https://www.gutenberg.org/policy/robot_access.html>
- Official English Wikinews dumps: <https://dumps.wikimedia.org/enwikinews/>
- Wikimedia licensing terms: <https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use>
