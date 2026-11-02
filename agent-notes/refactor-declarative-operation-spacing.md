# Goal

Move operation-spacing policy into existing technical rule data in one
independent PR from main. Preserve public profiles and current output.
The smallest change declares the four profile-option results, removes
operationIsSpaced and moves existing profile types into the shared contract:
roughly 80-130 handwritten changed lines plus type moves/generated data/tests.

# State

Own refactor/declarative-operation-spacing only. Other workers own arrows and
value-pattern branches. Read current runtime, shared contract, compiler,
generator, technical docs and existing profile output tests before editing.

# Decisions and why

- International spaced/unspaced remain caller-selected choices, not an
  inferred formatting decision. BANA standardized is unspaced; the existing
  teaching API option chooses the permitted spaced presentation.
- Read original GTM page-006.png (printed p.1, 1.1.2), replacement Section3
  page-001.png (printed p.2, 3.1.1), and BANA page-001.png (printed p.2,
  Introduction and Section2). BANA permits an agency decision for beginning
  readers; do not describe all teaching material as mandated to be spaced.
- Use existing source/compiler/generator/contract owners, typed boolean maps,
  and the existing profile discriminant to read its selected option. No DSL,
  selector framework, new entry point, workflow or copied type hierarchy.
- Preserve comparison/function spacing, grade-1 offsets and general Grade1/2
  generated data. Do not change oracle ledgers.
- Workers never publish. Commit locally with this note and draft PR body to
  .oracle-artifacts/pr-body.md. Parent inspects, publishes and reads hosted CI.

# Surprises

The generator already validated the item-policy boolean map inline. Extracted
that same closed boolean-map reader once and reused it for the item policy and
both operation-spacing option maps. Citation validation stays in the existing
loop; the source authority selects its required official host.

Generation succeeded and changed only the generated technical program.
The edited compiler and technical test files passed. All four existing profile
choices now have fixed BRF outputs in the existing spacing test. Comparison,
function, grade-1 and remaining technical tests are unchanged for hosted CI.
No general Grade1/Grade2 artifact or oracle-ledger changes; no full local CI.

# Next step

Parent published independent PR #160. Its earlier standalone head passed full
hosted CI and both oracle runs with zero stale/untriaged disagreements.
Q then authorized normal merges. After #158 and #159 merged, parent began a
merge from integrated main into this worktree and assigned its resolution.

Resolved eight shared owners. All arrow, value-pattern and spacing fields,
source citations, validators, public exports and compiler tests are retained.
The value-pattern invalid cases in technical-variants.test.ts are unchanged
against integrated main. Compiler arguments now pass valuePatterns followed
by operation-spacing source. Generation succeeded and only the generated
technical program differs from integrated main; general Grade1/Grade2 outputs
are unchanged. The two edited compiler/technical test files passed after
completed source edits; no full local CI ran.

The integration is locally committed. Parent must inspect, push and wait for the
new head's hosted CI/oracle checks before normally merging PR #160. This
worker does not push, publish or merge. No release requested.
