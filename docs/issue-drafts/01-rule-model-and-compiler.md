# Compile official UEB rules into a tiny deterministic runtime

## Problem

The browser package needs complete, inspectable UEB behavior without shipping a
general rule engine or hand-maintaining opaque generated tables.

## Scope

- Define an original, human-readable intermediate representation for UEB rules.
- Attach an ICEB/BANA source and rule identifier to every normative rule.
- Compile the rule representation into deterministic contextual prefix tables,
  typed guard tuples, and closed symbol/mode programs.
- Evaluate and cite the selected contextual matching and path-selection
  algorithms before implementing them.
- Reject ambiguous, unreachable, conflicting, or uncited rules at build time.
- Keep the compiler and readable rules out of browser entry points.

## Acceptance criteria

- Generated runtime data is byte-for-byte reproducible.
- Every generated runtime rule/output is traceable to repository-authored source rules.
- The npm artifact contains no Liblouis code, tables, fixtures, traces, rules,
  or generated translations.
- Raw, minified, Brotli, and gzip sizes are reported by a repeatable command;
  this issue does not invent a numeric size ceiling.
- Compiler and runtime tests pass under the repository's strict TypeScript and
  typed-lint configuration.

## Normative sources

- ICEB, *Rules of Unified English Braille*, Third Edition, 2024:
  <https://iceb.org/publications/ueb/>
