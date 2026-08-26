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

Grade 2 source rules compile into aligned rule tuples, guard-opcode tuples, and
a deduplicated operand pool. The compiler normalizes source order, rejects
duplicate guards and unresolved equal-precedence overlaps, and emits provenance
in a separate module. The browser runtime has no contraction classes, named
exceptions, or rule vocabulary: it indexes tuples by their first input scalar
and exhaustively interprets the closed opcode union.

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
