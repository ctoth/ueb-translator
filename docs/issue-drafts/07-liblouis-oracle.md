# Add a process-isolated Liblouis UEB-2024 differential oracle

## Problem

A second implementation can reveal gaps and regressions, but Liblouis is GPL and
is not the normative UEB specification.

## Scope

- Pin and install Liblouis externally in development and CI.
- Expose a machine-readable subprocess interface for forward translation using
  the closest available official UEB-2024 tables.
- Report translator/Liblouis disagreements as evidence for ICEB adjudication.
- Add a smoke test that proves the oracle is callable without making it a package
  dependency.

## Acceptance criteria

- No Liblouis source, binary, table, fixture, trace, test, generated translation,
  or derived rule is committed or packed.
- CI identifies the exact Liblouis version and table names used.
- Ordinary package tests run without Liblouis installed.
- Disagreements fail with both outputs and the local rule/test identifier; they
  are never resolved automatically in Liblouis's favor.

## Non-normative implementation source

- Liblouis project documentation: <https://liblouis.io/documentation/liblouis.html>
