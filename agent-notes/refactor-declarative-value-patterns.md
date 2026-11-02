# Goal

Move the existing number, identifier, function-name and chemical-element
spelling grammars into the existing technical data program, independently from
the arrow and spacing slices. Commit locally for parent inspection/publication.

# State

Branch refactor/declarative-value-patterns starts from integrated main after
PR #157. Read the current technical runtime, contract, source/compiler,
generator, compilation entry point and existing compiler/technical tests.
The four API grammar strings now live in the existing technical source, compile
to valuePatterns, and are read by the existing generator. The runtime compiles
each once and reuses the numeric matcher for number and both fraction labels.
Deleted renderNumber. Other worktrees and main remain outside this worker.

# Decisions and why

Smallest change: four pattern strings in the existing technical source/program,
validated by the compiler and read by the generator. Compile them once for the
renderer. Reuse one numeric grammar for numbers and both simple-fraction fields.
Delete the one-use renderNumber wrapper. Expected 80-130 handwritten lines
plus generated data and existing test updates.

These strings describe our accepted API inputs, not new normative UEB claims.
The chemical spelling grammar checks one uppercase letter and optional lowercase
letter; it does not check whether the spelling names an actual chemical element.
Preserve Unicode matching, error labels, invalid/unsupported propagation and
all fixed output expectations. Do not move standing-value classification,
function spacing, numeric-mode transitions or item grouping.

# Surprises

The existing technical source uses citations for sign and grouping rules.
Keep API grammar data distinct from those normative citations rather than
inventing an ICEB citation for an implementation input constraint.

Generation changed only src/generated/ueb-2024/technical-program.ts; general
Grade 1/2 artifacts and oracle ledgers are unchanged. Existing invalid-field
cases now also cover digit-leading identifiers and Arabic-Indic numeric input,
preserving JavaScript's ASCII-digit grammar. Existing fixed BRF output cases
and unsupported-character cases remain unchanged.

Completed npm ci --ignore-scripts, npm run grade1:generate, and
npx vitest run --coverage.enabled=false test/grade1-rule-compiler.test.ts
test/technical-variants.test.ts. Both edited test files passed. git diff --check
is clean. No full local CI/typecheck/coverage gate was run.

# Next step

Implementation and note are committed locally. PR draft is available in the
ignored .oracle-artifacts/pr-body.md. Parent inspects, publishes and waits for
full hosted CI/oracle verification.
No push, PR publication, review, merge or release by this worker.
