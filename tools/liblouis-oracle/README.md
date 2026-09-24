# Liblouis conformance oracle

This directory defines an optional, external development oracle. Liblouis is
not a dependency of `ueb-translator`, is not shipped in its npm package, and is
never a source of normative rules.

## The hard boundary

- UEB conformance is decided from the official ICEB sources listed in
  [`docs/SOURCES.md`](../../docs/SOURCES.md).
- Do not copy or derive translator code, rules, tables, fixtures, tests,
  traces, or generated translations from Liblouis.
- Do not copy oracle output into translator rules, tests, fixtures, or package
  artifacts. The tracked disagreement ledger is the sole exception: it retains
  exact differential evidence plus an ICEB/BANA-sourced adjudication verdict.
- A disagreement is a report to adjudicate against ICEB. It is never an
  automatic change to `ueb-translator`.
- The GPL-licensed `lou_translate` command runs as a separate process. Neither
  it nor its LGPL-licensed tables are distributed with this MIT package.

## Why version 3.38.0

The oracle pins the official [Liblouis 3.38.0 release][release] and verifies
the release asset's published SHA-256 digest before building it. The tagged
release exposes [grade 1][g1], [grade 2][g2], and [English unified math][math]
tables. Its UEB table metadata names the UEB system, but does not state
conformance to the ICEB 2024 rulebook; the headers currently ask for an
official-documentation reference. Consequently, 3.38.0 is our closest current
UEB oracle, not a UEB 2024 authority.

The mapping is deliberately explicit:

| mode | Liblouis table list |
| --- | --- |
| `grade1` | `en-ueb-g1.ctb` |
| `grade2` | `en-ueb-g2.ctb` |
| `technical` | `en-ueb-g2.ctb,en-ueb-math.ctb` |

The technical mapping only exposes what Liblouis names as unified English math
definitions. It does not imply that Liblouis accepts our eventual structured
technical input or implements every current ICEB technical rule.

## JSON Lines interface

Build the adapter, point it at an exact 3.38.0 `lou_translate` executable, set
`LOUIS_TABLEPATH` if the tables are not installed in the executable's standard
location, then send one JSON object per line:

```powershell
npm.cmd run oracle:build
$env:LIBLOUIS_ORACLE_BIN = "C:\path\to\lou_translate.exe"
$env:LOUIS_TABLEPATH = "C:\path\to\share\liblouis\tables"
'{"id":"example","direction":"forward","mode":"grade2","text":"Braille"}' |
  npm.cmd run --silent oracle
```

Requests have exactly four fields: a non-empty string `id`, `forward` or
`backward` `direction`, `grade1`, `grade2`, or `technical` `mode`, and string
`text`. Responses are also JSON Lines. Successful responses contain the
translation and the exact engine/table identity; failures contain a stable
error code and message. The adapter always requests Unicode Braille through
`unicode.dis`, as documented by [`lou_translate`][cli].

Run `npm run oracle:test` without Liblouis to verify the boundary protocol.
Run `npm run oracle:smoke` with the environment above to verify the pinned
binary and all table mappings. The smoke check validates only process health
and Unicode Braille output; it contains no expected Liblouis translations.
CI builds the pinned release with `--enable-ucs4`, and the smoke includes a
non-BMP print character so a 16-bit Liblouis build cannot silently pass.

## Differential failures

`npm run oracle:compare` accepts project-owned local results, invokes only a
forward Liblouis translation, and compares the two ephemeral outputs. A case
must identify its local evidence with one of two closed variants:

```json
{"caseId":"example","local":{"kind":"rule","ruleId":"UEB-10.3-and"},"localOutput":"⠯","mode":"grade2","print":"and"}
```

The alternative local variant is
`{"kind":"test","testId":"path:test-name"}`. A disagreement exits nonzero
and emits the input, both outputs, the local identifier, Liblouis version and
tables, plus an instruction to adjudicate against ICEB. It never edits or
accepts a fixture, test, rule, or translation.

CI runs `oracle:inventory:check` after the process smoke. The inventory obtains
each local output from the current project translator at runtime. Every authored
Grade 2 provenance rule contributes a source example and a second context, and
the inventory retains relevant official-example Grade 1, Grade 2, and raw
technical fixtures. Construction fails below 1,000 uniquely identified cases or
when a case does not exercise its claimed rule provenance.
Case identifiers are stable reconciliation keys; change one only when its input
or local evidence identity changes, so obsolete ledger entries remain visible.

[`disagreements.json`](../disagreements.json) is a tracked, versioned report of
the exact disagreements from the pinned release. Every entry records both
outputs, rule/test evidence, the Liblouis version and tables, and one closed
verdict: `our-bug`, `liblouis-bug`, or `permitted-alternative`. A verdict must
include a rationale and official ICEB/BANA source URLs. CI fails when it sees a
new or changed disagreement until that exact evidence is adjudicated and
committed; it also fails when a ledger entry becomes stale, so resolved drift is
reviewed rather than silently retained. Liblouis remains non-normative: only the
cited official source decides the verdict.

## Empirical dictionary, corpus, and fuzz channels

`npm run oracle:empirical:prepare` reacquires SCOWL 2020.12.07 level 95 from
the pinned archive URL, verifies SHA-256
`5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc`,
and records upstream Git commit `5ef55f9c42730ebe4394a78b77855468a6f15dd2`.
The ignored development cache retains SCOWL's copyright notice. It also
prepares Wikinews snapshot 20260801 and expands the repository-retained,
gzip-compressed Project Gutenberg ebook 1342 bytes identified by SHA-256
`74f2665d6e6925fc2c17dec644bec9e87df478a0f1836822125e8acbb3777806`.
Fresh CI runners never depend on the mutable Gutenberg URL retaining those
exact bytes.

CI runs all 658,033 prepared SCOWL entries and every bounded sentence chunk
from both prepared corpora. `empirical-disagreements.json` retains the exact
dictionary evidence. The much larger corpus channel uses exact SHA-256
comparison keys plus bounded changed-window repro previews in
`empirical-corpus-disagreements.json`; full candidate JSONL remains ignored
and is retained as a CI failure artifact. Both ledgers fail closed for new,
changed, or stale evidence, and every entry references a source-backed verdict
group. An `our-bug` verdict carries the owning GitHub issue number.

The separate scheduled workflow runs fast-check with a fresh signed 32-bit
seed and records the seed, shrink path, shrink count, minimal input, exact
evidence, and stable semantic fingerprint. Reproduce a run by setting
`ORACLE_FUZZ_SEED` and `ORACLE_FUZZ_NUM_RUNS`. `npm run oracle:fuzz` prints
the outcome and evidence to the log and exits 1 for a divergence or error.
Scheduled divergences upload the result, then report through an issue instead
of failing the job: a fingerprint marker finds an open issue, reopens a closed
one with the new replay evidence, or creates one. Infrastructure errors,
filing failures, and divergences found by manual runs leave the job failed.

### Divergence families

Generated strings reproduce an adjudicated divergence type in endless new
contexts, which an exact fingerprint cannot recognize. `src/fuzz-families.ts`
describes such types as rule-level predicates. A fuzz divergence counts as
triaged when its fingerprint is ledgered or when every differing braille run
(split along the longest common subsequence) matches a family. A family has no
verdict of its own: it extends an existing ledger group whose ICEB rationale,
here 10.12.7-10.12.8 for contrived words with unknown syllabification or
pronunciation, covers every string the predicate accepts. Families apply to
the fuzz channel only; dictionary and corpus evidence stays exact.

Predicates are deliberately narrow. Inputs containing capital letters or an
`encea`/`enced`/`encer` sequence (rule 10.10.6, #94) never match. Since #100
the translator spells `be` before a vowel unless the word is a reviewed
be-syllable word; the `spelled-be-before-vowel` family records Liblouis
contracting such contrived strings. Tests run every family over the ledger and
fail if a family matches nothing in the group it extends, gives a recorded fuzz
divergence a different verdict kind, or recognizes a recorded translator bug in
any channel. Dictionary verdicts may rest on a word's known pronunciation,
which contrived strings lack, so only translator bugs are guarded there.

## Exploring more cases

Build once with `npm run oracle:build` and set the pinned oracle environment
described above. A full-length scan continues through translation disagreements:

```powershell
$env:ORACLE_FUZZ_NUM_RUNS = "1000000"
$env:ORACLE_SCAN_DIRECTORY = ".oracle-artifacts/million-run"
npm run oracle:fuzz:scan
```

The output directory must be new. It retains `configuration.json` before any
translations, `evidence.jsonl` as findings arrive, and `summary.json` every
10,000 cases and at completion. Set `ORACLE_FUZZ_SEED` to replay a recorded seed.
`complete: true` means every requested case ran; `ok: false` and exit code 1
mean untriaged disagreements remain. Infrastructure errors stop the scan without
claiming completion. Use the same seed with `npm run oracle:fuzz` to shrink the
first unknown signature. Scans recognize ledgered fuzz signatures and
divergence families, but retain each distinct exact evidence digest; `uniqueFingerprints` and
`uniqueEvidence` deliberately count different things. No command edits a ledger.

Prepare and compare a candidate Wikinews snapshot before spending time sweeping
unchanged documents:

```powershell
npm run corpus:prepare -- wikinews --snapshot 20260901
npm run oracle:corpus:compare -- .corpus-cache/prepared/wikinews-20260801 .corpus-cache/prepared/wikinews-20260901
```

Comparison verifies every retained document digest and reports added, changed,
removed and unchanged source IDs. Equal text in different documents remains
separate evidence. Duplicate source IDs are rejected. A changed snapshot date
alone does not establish new coverage.

Acquire individual Gutenberg books without harvesting the entire catalog:

```powershell
npm run oracle:corpus:prepare-book -- 11
npm run oracle:corpus:prepare-book -- 2701
npm run oracle:corpus:scan -- PATH_FROM_FIRST_COMMAND PATH_FROM_SECOND_COMMAND > .oracle-artifacts/new-books.jsonl
```

Book preparation retains the downloaded bytes, their SHA-256 digest, extracted
text, and a source manifest. The exploratory corpus sweep reports progress and
an `exploration-summary`; it exits 1 for untriaged evidence. It compares exact
evidence against the retained ledger without calling unrelated baseline entries
stale or consuming known entries when a case repeats. Distinct source evidence
sharing a case ID is preserved. Review findings against ICEB before changing
translation rules or promoting a new corpus into the CI baseline.

## Reviewing retained findings

`oracle:review` turns scan artifacts into a persistent review workspace. It does
not change the translator or the accepted disagreement ledgers.

```powershell
npm run oracle:build
npm run oracle:review -- index .oracle-artifacts/review .oracle-artifacts/million-run/evidence.jsonl .oracle-artifacts/new-books.jsonl
npm run oracle:review -- list .oracle-artifacts/review
npm run oracle:review -- list .oracle-artifacts/review been
npm run oracle:review -- list .oracle-artifacts/review "*" 50
npm run oracle:review -- show .oracle-artifacts/review GROUP_ID_PREFIX
npm run oracle:review -- evidence .oracle-artifacts/review EVIDENCE_DIGEST_PREFIX
npm run oracle:review -- ledger tools/liblouis-oracle/empirical-disagreements.json mst
```

The index validates supplied evidence digests and preserves distinct source
records sharing a case ID. Exact duplicate records are counted once. Repeated
token differences are grouped only when their input, outputs, alignment, oracle
version and tables match. Word alignment is a review aid based on matching
whitespace-token counts and matching separators; it is not an adjudication. If
token counts or separators differ, the whole input stays together. `show`
presents ten source contexts at a time; pass
the returned `nextOffset` as its final argument to continue. `evidence` retrieves
the full original record. Group and evidence prefixes must be unambiguous.

Author decisions in a JSON file after checking ICEB/BANA sources and relevant
contexts. Use `groupId` for one group or `groupIds` for an explicitly selected
batch with the same reasoning:

```json
[
  {
    "groupId": "GROUP_ID_PREFIX",
    "rule": "ICEB 2024 10.6.1",
    "verdict": {
      "kind": "our-bug",
      "rationale": "Explain how the cited rule decides this exact difference.",
      "sources": ["https://iceb.org/publications/ueb/"]
    }
  }
]
```

```powershell
npm run oracle:review -- decide .oracle-artifacts/review decisions.json
npm run oracle:review -- report .oracle-artifacts/review
npm run oracle:review -- report .oracle-artifacts/review --decisions
```

An optional `evidenceDigests` array limits a decision to particular source
records. Otherwise the decision captures the group's current exact evidence
digests. The complete batch is validated before any decisions are appended.
Later decisions revise the selected scope while retaining earlier decisions in
the append-only history. A sentence counts as fully reviewed only when every
indexed difference in it has a decision; deciding one word never adjudicates
other differences in that sentence. Counts describe reviewed differences, not
distinct bugs. Unknown or uncertain cases remain pending instead of being
automatically labelled permitted alternatives.

[release]: https://github.com/liblouis/liblouis/releases/tag/v3.38.0
## Reconciliation after translator repairs

Build a baseline checkout's `dist/grade2.js` before changing its translator.
`oracle:reconcile:audit LEDGER SWEEP BASELINE_MODULE dictionary|corpus PATH...`
replays every stale record using both translator versions and the pinned oracle.
It fails unless every stale digest is recovered and every changed disagreement
is accounted for. Source identities sharing a case ID remain separate.

```powershell
npm run oracle:build
npm run oracle:reconcile -- list .oracle-artifacts/audit.jsonl
# After individually reviewing all displayed transitions against ICEB:
npm run oracle:reconcile -- approve .oracle-artifacts/audit.jsonl reviewed-verdict.json approvals.json
npm run oracle:reconcile -- apply ledger.json .oracle-artifacts/audit.jsonl approvals.json candidate-ledger.json
```

`approve` records an explicit review of all transitions in that audit; it does
not infer a verdict. Supply a verdict with a rationale and official source URLs.
`apply` refuses unapproved changes and changes not proven to reach agreement
at the corrected span. It removes only verified whole-input agreements. For partially repaired
sentences it retains the prior verdict on byte-identical residual differences.
It checks evidence counts and refuses digest collisions before writing a new
candidate file. Inspect that candidate before replacing the accepted ledger.

`oracle:reconcile fuzz LEDGER RESULT VERDICT OUTPUT` records an individually
adjudicated fuzz counterexample. To select a captured record from scan JSONL,
append its unique evidence digest prefix. All output files are created exclusively.

A translator change can also create disagreements the audit cannot account
for. The audit refuses to complete while untriaged sweep evidence is not a
transition of stale evidence, and `approve` refuses transitions that still
disagree. Three commands resolve those cases one reviewed group at a time;
each selects records by unique digest prefix:

```powershell
# New disagreements from a sweep: create a group with its verdict, or join one (-)
npm run oracle:reconcile -- add LEDGER SWEEP VERDICT_OR_- GROUP OUTPUT PREFIX...
# Audited transitions that still disagree: replace the old evidence under the
# group whose verdict describes the residual difference
npm run oracle:reconcile -- supersede LEDGER AUDIT GROUP OUTPUT PREVIOUS_PREFIX...
# Move recorded evidence to an existing group
npm run oracle:reconcile -- regroup LEDGER GROUP OUTPUT PREFIX...
```

Rerun the sweep and audit after each edit: the audit should then report only
transitions that reach agreement, which `approve` and `apply` remove.

On Windows, `run-wsl.ps1` provides the same retained corpus paths and portable
argument handling for `dictionary`, `corpus`, `inventory`, `fuzz`, `scan`,
`audit-dictionary`, and `audit-corpus`:

```powershell
./tools/liblouis-oracle/run-wsl.ps1 -Channel dictionary -Output .oracle-artifacts/dictionary.jsonl -OracleBinary /path/to/lou_translate -NodeBinary /path/to/node
./tools/liblouis-oracle/run-wsl.ps1 -Channel audit-corpus -Output .oracle-artifacts/audit.jsonl -OracleBinary /path/to/lou_translate -NodeBinary /path/to/node -Sweep .oracle-artifacts/corpus.jsonl -BaselineModule /path/to/baseline/dist/grade2.js
```

Run `npm run oracle:build` first. Audit paths passed to WSL must be WSL paths;
`-Output` is a Windows path. Fuzz/scan accept `-Seed` and `-Runs`. These commands
preserve the child exit code and refuse to replace existing logs.

[g1]: https://github.com/liblouis/liblouis/blob/v3.38.0/tables/en-ueb-g1.ctb
[g2]: https://github.com/liblouis/liblouis/blob/v3.38.0/tables/en-ueb-g2.ctb
[math]: https://github.com/liblouis/liblouis/blob/v3.38.0/tables/en-ueb-math.ctb
[cli]: https://liblouis.io/documentation/liblouis/lou_005ftranslate-_0028program_0029.html
