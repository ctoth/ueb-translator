# Corpus preparation and benchmarks

Corpora measure performance and unsupported print coverage. They never define
correct Braille: only rule-linked conformance tests against official braille
sources do that. A corpus failure therefore cannot override a conformance
result or alter the generated rule program.

All downloads, private EPUBs, extracted text, manifests, and benchmark inputs
live below `.corpus-cache/`. That directory is ignored by git and absent from
the npm package.

## Prepare a corpus

Each source has one explicit, discriminated command. Snapshot identifiers are
required; there is no mutable default.

```console
npm run corpus:prepare -- epub --input D:\Books --snapshot private-20260826
npm run corpus:prepare -- gutenberg --snapshot 20260826
npm run corpus:prepare -- wikinews --snapshot 20260801
```

`--cache PATH` may replace `.corpus-cache` for any preparation command.
Preparation refuses to replace an existing snapshot directory.

### Private EPUBs

The EPUB path recursively selects `.epub` files and invokes Calibre's
`ebook-convert` with UTF-8, Unix newlines, plain-text output, and line wrapping
disabled. Calibre heuristic processing remains disabled. The manifest records
the exact Calibre version and the caller-supplied private snapshot identifier;
private content is never redistributed.

Calibre documents the `ebook-convert input_file output_file [options]`
interface and its plain TXT output controls:
<https://manual.calibre-ebook.com/generated/en/ebook-convert.html>.

### Project Gutenberg

The Gutenberg path runs the English plain-text variant of the exact robot
harvest command documented by Project Gutenberg:
<https://www.gutenberg.org/policy/robot_access.html>. It extracts content
between each ebook's explicit START/END markers and records every normalized
document's SHA-256 digest.

Project Gutenberg states that ebook files change frequently. Consequently the
required snapshot is an acquisition label, while the document hashes are the
authoritative identity of what was measured. Repeating an acquisition against
the live harvest may produce a new corpus and must use a new snapshot label.
The Project Gutenberg License and each ebook's copyright status continue to
apply: <https://www.gutenberg.org/policy/license.html>.

### English Wikinews

The Wikinews path rejects `latest` and accepts only a `YYYYMMDD` dump
identifier exposed by <https://dumps.wikimedia.org/enwikinews/>. It downloads
`pages-articles.xml.bz2`, obtains the matching digest from that snapshot's
official `sha1sums.txt`, verifies the archive before extraction, and retains
main-namespace, non-redirect reading text.

Wikinews requires attribution to its contributors. Text published before
2005-09-25 is public domain; text from 2005-09-25 through 2024-12-15 is CC BY
2.5; later text is CC BY 4.0 unless otherwise specified. The manifest preserves
that mixed-license description and the official policy URL:
<https://en.wikinews.org/wiki/Wikinews:Copyright>.

## Immutable manifest and sealed holdout

Every prepared directory contains `manifest.json` and content-addressed
document records. Each record stores its source identifier, relative path,
UTF-8 byte count, SHA-256 digest, and partition.

The partition algorithm reads the first SHA-256 byte. Prefixes `00` through
`32` (51 of 256 values, approximately 20%) are `held-out`; the remainder are
`training`. This versioned boundary is fixed before translation and follows the
SHA-256 definition in NIST FIPS 180-4. Held-out documents must not be inspected
to choose, add, remove, order, or compress translation rules.

## Run a benchmark

```console
npm run corpus:benchmark -- \
  --corpus .corpus-cache/prepared/wikinews-20260801 \
  --partition held-out
```

The JSON report records source and snapshot identity, partition, input UTF-8
bytes, output Braille cells, elapsed time, byte throughput, translated and
unsupported document counts, sampled peak V8 heap, process peak resident set,
and raw/minified/Brotli/gzip browser-package sizes. Node defines `maxRSS` in
kibibytes; the report converts it to bytes:
<https://nodejs.org/api/process.html#processresourceusage>.

The benchmark intentionally reports unsupported documents instead of silently
dropping characters or guessing their Braille. It writes no generated
translation fixtures.
