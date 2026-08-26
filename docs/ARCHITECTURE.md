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

For each lexical position, permitted rules and the literal-letter fallback form
the outgoing edges of an acyclic segmentation graph. A backward dynamic program
uses Bellman's optimality recurrence to minimize emitted cells, then declared
precedence, then a deterministic output tie-break. This is exact shortest-path
selection over the compiled rule graph, not a corpus-trained or heuristic
choice.

## Uncontracted mode scanner

Grade 1 input is parsed once into a closed discriminated union of validated
letters, digits, symbols, spaces, and line boundaries. That makes unsupported
input a perimeter result and leaves the mode scanner unable to observe a token
without a standards-defined output. The scanner then makes one left-to-right
pass, carrying only numeric mode and the preceding unit required by UEB's
question-mark disambiguation rule. Maximal letter and symbols-sequence spans
select capital word and passage indicators; explicit document nodes carry
typeform and Braille-grouping semantics that cannot be recovered from plain
text. This is a specialized sequential transducer in Mohri's sense, with UEB
Sections 3-9 defining the transitions and outputs.

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

## Provenance and rejection

Compilation returns a separate provenance object containing normalized source rules plus the rule identifiers responsible for every state and every output. It is never part of the runtime object. Compilation fails for:

- an empty rule set or empty input, which cannot produce a traceable reachable rule;
- duplicate input, which would make the source relation ambiguous;
- duplicate rule identifier, which would make provenance conflicting;
- a missing document/locator or a URL outside the named official authority.
- duplicate contextual guards or contextual rules with unresolved precedence.

Invariant-only defensive branches are explicitly excluded from coverage where their preconditions are established by the same closed compiler pipeline. Reachable malformed runtime arrays are tested to fail closed.

## Reproducible size report

`npm run size` bundles the browser entry point twice with pinned esbuild: once readable and once minified. It reports raw and minified bytes, plus level-9 gzip and quality-11 Brotli bytes for the minified bundle. No numeric ceiling is inferred before the full rule inventories exist.
