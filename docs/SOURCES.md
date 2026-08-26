# Normative sources and provenance

## Normative UEB sources

1. International Council on English Braille, *The Rules of Unified English
   Braille*, Third Edition, 2024. This is the definitive rulebook.
   <https://iceb.org/publications/ueb/>
2. International Council on English Braille, *Unified English Braille:
   Guidelines for Technical Material*, 2014, including official revisions
   listed by ICEB. <https://iceb.org/publications/ueb/>
3. Braille Authority of North America, *Guidance on Transcribing Mathematics
   and Science in UEB*, adopted May 2026. This is a US/Canada regional
   supplement. <https://www.brailleauthority.org/unified-english-braille-codebooks>

Rule prose and examples are not copied into this MIT-licensed repository.
Implementation behavior is independently expressed and tests identify the
official rule or symbol being exercised.

## Algorithm and encoding sources

1. The Unicode Consortium, *The Unicode Standard*, Braille Patterns block,
   U+2800-U+28FF. Dot `n` is represented by bit `n - 1` in the code point's
   low byte. <https://www.unicode.org/charts/PDF/U2800.pdf>
2. Jan Daciuk, Stoyan Mihov, Bruce W. Watson, and Richard E. Watson,
   *Incremental Construction of Minimal Acyclic Finite-State Automata*, 2000.
   The sorted incremental construction and its terminal-output transducer
   extension define the rule compiler. <https://aclanthology.org/J00-1002/>
3. Mehryar Mohri, *Finite-State Transducers in Language and Speech Processing*,
   1997. Sequential transducer semantics and the determinization/minimization
   boundary define the browser runtime model. <https://aclanthology.org/J97-2003/>
4. Richard Bellman, *On the Theory of Dynamic Programming*, 1952. Bellman's
   optimality recurrence defines contracted-rule selection over the acyclic
   segmentation graph. <https://doi.org/10.1073/pnas.38.8.716>
5. National Institute of Standards and Technology, *Secure Hash Standard
   (SHS)*, FIPS PUB 180-4. SHA-256 content digests define the immutable corpus
   records and the sealed train/holdout partition.
   <https://csrc.nist.gov/pubs/fips/180-4/upd1/final>

Every additional algorithm must be cited here and at its implementation site.

## Test methodology

- `fast-check` supplies runner-independent property generation, reproducible
  seeds, and counterexample shrinking for deterministic translation invariants.
  <https://fast-check.dev/docs/introduction/>
- Vitest Browser Mode with its Playwright provider executes the built ESM entry
  point in headless Chromium. <https://vitest.dev/guide/browser/>

## Non-normative corpora

- Project Gutenberg will provide public-domain literary text for coverage,
  performance, and compression experiments.
- English Wikinews supplies modern journalistic prose from official Wikimedia
  dumps. Its text is public domain, CC BY 2.5, or CC BY 4.0 according to the
  article's publication date. Corpus snapshots and attribution remain outside
  the npm artifact. <https://en.wikinews.org/wiki/Wikinews:Copyright>

Corpora never establish expected Braille. Rule-linked tests from normative
sources do.

## Liblouis boundary

Liblouis may be invoked as a separately installed executable in development
and CI. Its output is differential evidence only. ICEB rules adjudicate every
disagreement. No Liblouis source, table, fixture, trace, or derived rule may be
copied into this repository or npm package.
