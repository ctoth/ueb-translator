# Compiler and runtime architecture

## Boundary

The repository contains two deliberately separate layers:

1. `rules/` and `tools/rule-compiler/` hold readable, cited source rules, validation, construction, and provenance. They are development-only.
2. `src/` holds browser runtime contracts and deterministic walkers. Published
   grade entry points import only generated compact programs and runtime code.

The `files` allowlist in `package.json` publishes `dist`, `LICENSE`, and `README.md`. It cannot include readable rules, compiler code, research papers, Liblouis tooling, fixtures, traces, or oracle output.

## Selected construction

The compiler follows Daciuk, Mihov, Watson, and Watson's lexicographically sorted incremental construction of a minimal deterministic acyclic finite-state automaton. After each input's common prefix, the previous word's mutable suffix is registered bottom-up. A state is merged only when its final output and every sorted input-label-to-canonical-child edge agree. This is the paper's final-output transducer extension, specialized to one output per accepted rule.

This avoids first materializing a full trie. Sorting by Unicode scalar value and deterministic breadth-first flattening make the emitted arrays reproducible regardless of source order.

Mohri's sequential transducer model supplies the runtime contract: at most one outgoing transition exists for an input scalar at a state, so application is linear in examined input and emitted output rather than rule-set size. General powerset determinization is unnecessary because the source is already a finite function and the graph is acyclic. General output pushing is also omitted: whole outputs on final states make rule provenance direct, and final-output identity is part of the chosen state equivalence.

Sources:

- Jan Daciuk, Stoyan Mihov, Bruce W. Watson, and Richard E. Watson, [Incremental Construction of Minimal Acyclic Finite-State Automata](https://aclanthology.org/J00-1002/), 2000, sections 3 and 4.1.
- Mehryar Mohri, [Finite-State Transducers in Language and Speech Processing](https://aclanthology.org/J97-2003/), 1997, sections 2 and 3.7.

## Runtime layout

The generated graph uses five arrays:

- `stateEdgeOffsets`: CSR-style edge ranges with a final sentinel;
- `edgeLabels`: sorted Unicode scalar values;
- `edgeTargets`: parallel destination state indexes;
- `stateOutputIndexes`: final-output index or `-1`;
- `outputs`: deduplicated Unicode Braille strings.

The walker binary-searches each state's edge range and remembers the most recent final state, giving deterministic longest matching. Failures report the first unmatched Unicode scalar using both scalar and UTF-16 code-unit offsets and return no partial output.

## Contracted contextual program

Grade 2 source rules compile their 180 distinct print inputs once into a sorted
prefix table in the shared transducer runtime layer. A 26-way initial index
limits each exact `startsWith` match to one lowercase-letter bucket. Fixed-width
input rule counts, input guard counts, and per-initial offsets locate contiguous
rule and guard ranges without repeating each input across contextual variants or
constructing lookup maps in the browser. This representation measured smaller
than carrying final-output identity through a minimal automaton for this rule
set: distinct bucket outputs prevented useful suffix-state merging.

The aligned rule tuples, guard tuples, and deduplicated text-operand pool remain
separate from development-only provenance. Rule and guard offsets are recovered
from the compiled counts, which removes two high-entropy integers from every
runtime rule tuple.

Authored guards form a closed discriminated union. Compilation lowers them to
an exhaustive tuple union: guards without operands occupy one number, textual
predicates index the string pool, and boundary predicates carry a five-bit mask.
The generated module imports this runtime contract instead of reproducing it.
The compiler normalizes source order and rejects duplicate guards and unresolved
equal-precedence overlaps.

The shared contextual-transducer interpreter owns deterministic prefix matching,
guard evaluation, and path selection. The Grade 2 entry point supplies only the
explicit UEB context that cannot be recovered by the automaton itself, such as
standing-alone status and caller-provided structural boundaries. It contains no
contraction classes, named exceptions, guard opcodes, or rule-selection loop.

The Grade 2 generator also derives two closed tables from the same rule
inventory. The first maps every contraction output made solely from literary
letter cells back to the literal letter sequence that would otherwise collide
with it. The second finds strong groupsigns whose cells collide with a
standing whole-word sign. The composed runtime uses those tables to select
literal emission and Grade 1 symbol/word scope. No handwritten ambiguity list
can drift when a contraction is added or removed.

For each lexical position, permitted rules and the literal-letter fallback form
the outgoing edges of an acyclic segmentation graph. A backward dynamic program
uses Bellman's optimality recurrence to minimize emitted cells, then declared
precedence, then a deterministic output tie-break. This is exact shortest-path
selection over the compiled rule graph, not a corpus-trained or heuristic
choice.

## Compiled uncontracted program

Grade 1 input is parsed once into a closed discriminated union of validated
letters, digits, symbols, spaces, and line boundaries. That makes unsupported
input a perimeter result and leaves the resolver unable to observe a token
without a compiled output.

The cited symbol package compiles print scalars into cells and opaque class IDs.
The cited mode package compiles capitals, numeric, grade-1, and each typeform
from the same five-field data contract into indicator tuples and class bitsets.
The generic resolver knows only numeric IDs, masks, thresholds, and indicator
positions; it contains no UEB mode names, callbacks, or per-mode branches.
Numeric a-j ambiguity, punctuation continuation, sequence boundaries, and
capital word/passage selection therefore remain generated data rather than
runtime vocabulary.

The `compose(symbols, modes, policies, contractions?)` boundary parses once,
adds contextual classes, resolves modes, and replaces eligible literal spans
with contextual outputs. Grade 1 omits the contraction package. Grade 2 passes
it, so capitals passages, numeric protection, punctuation context, and
typeforms surround contraction rather than being reimplemented by a second
orchestrator. Explicit document nodes still carry typeform, boundary, and
Braille-grouping semantics that cannot be recovered from plain text.

## Structured technical runtime

The technical entry point is a closed recursive algebra over print identity and
layout semantics. One post-order traversal validates leaf values, emits the
official UEB cells, and carries grade-1 protection offsets with each successful
subtree. Offsets are shifted as fractions, scripts, radicals, groups,
modifiers, functions, shapes, and operations compose; invalid children return
through the same typed result path. There is no second parse and no recovery of
an expression tree from a visually ambiguous string.

For the preferred July 2025 grade-1 policy, a final linear scan partitions the
emitted expression at Braille spaces, filters standing-only protection sites,
and applies the source's symbol/word/passage counts. The alternative
`all-technical` policy wraps the expression directly. Both passes are linear in
the emitted cells and independent of rule-inventory size. Finite sign
inventories are exhaustive `satisfies Record<ClosedUnion, string>` tables, so a
new public atom cannot compile without a cell mapping.

Matrix rows and displayed computer lines remain explicit blocks. The matrix
walker preserves caller-provided rows, columns, enclosure, and gap policy;
computer spacing converts only internal cells of an explicitly significant
three-or-more-space run. Width-aware line breaking and tactile diagram drawing
are later layout concerns, not hidden translation heuristics.

## Inverse relation and canonical validation

Backtranslation reuses the forward runtime rather than compiling a second
linguistic table. Grade 1 inverts the generated symbol program, while Grade 2
inverts the compact contextual matcher's existing input ranges into
Braille-to-print edges at module initialization. A work-list
walk over the acyclic cell lattice retains every reachable print path and
deduplicates identical strings. Capital, numeric, Grade 1, modifier, whitespace,
and semantic-indicator modes are explicit closed decoder states.

Grade 2 context predicates and preference rules are intentionally not copied
into the inverse walker. Each cell-compatible print path is composed with the
canonical forward translator and survives exactly when the complete emitted
cell sequence equals the input. The surviving candidate carries the aligned
forward rule IDs. This is Mohri's finite-state relation/composition model used
as an exact recognizer, not as a heuristic ranking algorithm. Candidate
materialization is necessarily output-sensitive because some inputs have an
exponential number of valid print expansions.

Sources:

- Mehryar Mohri, [Finite-State Transducers in Language and Speech Processing](https://aclanthology.org/J97-2003/), 1997, finite-state relations, composition, and bounded ambiguity.
- International Council on English Braille, [The Rules of Unified English Braille, Third Edition 2024](https://iceb.org/wp-content/uploads/2025/10/Rules-of-Unified-English-Braille-2024.pdf), Section 10, contraction legality, preference, and expressly permitted alternative transcription.

## Provenance and rejection

Compilation returns a separate provenance object containing normalized source rules plus the rule identifiers responsible for every state and every output. It is never part of the runtime object. Compilation fails for:

- an empty rule set or empty input, which cannot produce a traceable reachable rule;
- duplicate input, which would make the source relation ambiguous;
- duplicate rule identifier, which would make provenance conflicting;
- a missing document/locator or a URL outside the named official authority.
- duplicate contextual guards or contextual rules with unresolved precedence.

Invariant-only defensive branches are explicitly excluded from coverage where their preconditions are established by the same closed compiler pipeline. Reachable malformed runtime arrays are tested to fail closed.

## Reproducible package and size verification

`npm run size` bundles every stable browser entry point plus the combined
forward dispatcher twice with pinned esbuild: once readable and once minified.
It reports raw and minified bytes, level-9 gzip and quality-11 Brotli bytes for
each minified bundle, and the actual packed/unpacked npm package sizes and file
count. The report measures the complete rule inventories rather than enforcing
an inferred threshold.

`npm run package:verify` builds an actual tarball and installs it into a clean
temporary package. A strict declaration walk rejects `any`, assertion escape
hatches, and Node type references. A separate consumer compilation uses only
ES2022 and DOM libraries. Pinned esbuild then resolves each public export for
the browser, and Playwright executes every resulting bundle in Chromium. The
Grade 1 metafile is also checked structurally for retained Grade 2 or technical
modules.
