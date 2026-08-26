# Liblouis conformance oracle

This directory defines an optional, external development oracle. Liblouis is
not a dependency of `ueb-translator`, is not shipped in its npm package, and is
never a source of normative rules.

## The hard boundary

- UEB conformance is decided from the official ICEB sources listed in
  [`docs/SOURCES.md`](../../docs/SOURCES.md).
- Do not copy or derive translator code, rules, tables, fixtures, tests,
  traces, or generated translations from Liblouis.
- Do not commit oracle output. Differential results are ephemeral CI or local
  diagnostics.
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

CI runs `oracle:differential:smoke` after the process smoke. That script obtains
each local output from the current project translator at runtime, so no
Liblouis-derived expected output or generated translation is committed. Its
project-owned cases cover Grade 1, the generated Grade 2 rule identifier, and
raw technical text. Each JSON result names the exact Liblouis version and table
list. Any disagreement fails the job while preserving both outputs as CI
evidence for ICEB adjudication.

[release]: https://github.com/liblouis/liblouis/releases/tag/v3.38.0
[g1]: https://github.com/liblouis/liblouis/blob/v3.38.0/tables/en-ueb-g1.ctb
[g2]: https://github.com/liblouis/liblouis/blob/v3.38.0/tables/en-ueb-g2.ctb
[math]: https://github.com/liblouis/liblouis/blob/v3.38.0/tables/en-ueb-math.ctb
[cli]: https://liblouis.io/documentation/liblouis/lou_005ftranslate-_0028program_0029.html
