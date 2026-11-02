# Goal

Move the existing function-boundary spacing predicates into cited technical rule data, preserving current translation output.

# State

Implemented in this independent branch. The source/compiler/program/generator now carries the function spacing patterns and selected shared-symbol cell identities. Runtime reads that generated data at both existing boundaries. No publication or merge authorized for this agent.

# Decisions and why

The smallest change is a technical function-spacing descriptor containing a print-symbol selection pattern and the existing function-name prefix pattern, compiled into shared-inventory letter cells and a normalized name pattern. Runtime keeps AST discrimination, first/last-cell access, concatenation and requirement offsets. Expected handwritten scope is about 80-130 lines, plus generated data and focused tests.

The source is GTM 2014 Section 9.3, printed pages 43-44, inspected through page-048.png and page-049.png. The existing lowercase-name predicate is preserved exactly. The Latin cell identities come from the canonical symbols rather than a second alphabet.

# Surprises

Only the generated technical program changed; general Grade 1/Grade 2 artifacts and oracle ledgers are untouched. Source mutation tests demonstrate that changing a selected canonical symbol changes the compiled boundary cells.

`npm ci --ignore-scripts` and `npm run grade1:generate` completed. The edited compiler and technical variant tests passed with `npx vitest run --coverage.enabled=false test/grade1-rule-compiler.test.ts test/technical-variants.test.ts`. Fixed BRF expectations cover lowercase, uppercase, Greek and bracketed argument boundaries plus uppercase predecessor and function-name boundaries. Existing composite predecessor cases remain.

Full checks and oracle validation belong to the PR's hosted CI and have not run locally.

# Next step

Parent verifies this local branch and draft, publishes the independent PR, then reads hosted CI including oracle results before reporting completion.
