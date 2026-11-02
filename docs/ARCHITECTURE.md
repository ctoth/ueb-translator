# Compiler and runtime architecture

## Boundary

The repository contains two deliberately separate layers:

1. `rules/ueb-2024/` holds readable, cited source rules plus the live symbol,
   mode, policy, and contextual compilers. It is development-only.
2. `src/` holds generated compact programs, browser runtime contracts, and
   deterministic interpreters. Published entry points cannot import authored
   rules or compiler modules; ESLint enforces that boundary.

The `files` allowlist in `package.json` publishes `dist`, `LICENSE`, and `README.md`. It cannot include readable rules, compiler code, research papers, Liblouis tooling, fixtures, traces, or oracle output.

## Live rule compilation

`rules/ueb-2024/contextual-compiler.ts` compiles the cited Grade 2 inventory used
by the product. It canonicalizes inputs, sorts each initial-character bucket,
deduplicates guard operands, and flattens typed rules and guards into compact
tuples. Compilation rejects missing citations, conflicting identifiers,
duplicate guards, unreachable inputs, and unresolved precedence before any
generated program reaches `src/generated/ueb-2024/`.

The Grade 2 inventory declares each rule's precedence alongside its output and
guards, using the same closed precedence type as the contextual compiler.
Inventory rules carry their declared priority directly into the existing
runtime tuple. Explicit contextual variants retain their own priorities.

Individual inventory entries also declare word-position and preceding-character
restrictions in their authored guards. The compiler combines those with shared
category guards and exception-derived guards before canonicalizing the program.

The Grade 1 symbol, mode, and composition-policy compilers use the same
source-to-runtime boundary. Generated modules contain only opaque runtime data
and stable provenance identifiers. There is no second development compiler and
no public general-purpose transducer runner.

## Runtime layout

The contextual matcher stores a sorted input table with a compact initial
index. Fixed-width strings encode per-initial input, rule, and guard offsets
and per-input counts. Aligned rule tuples carry Braille, precedence, and guard
count; guard tuples reference a deduplicated operand pool. The browser runtime
selects a single initial bucket, checks its exact prefixes, evaluates typed
guards, and applies Bellman's backward recurrence to the resulting acyclic
segmentation graph.

## Contracted contextual program

Grade 2 source rules compile their 180 distinct print inputs once into the
contextual runtime's sorted prefix table. A 26-way initial index
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

Rules also declare whether their span must preserve following or both adjacent
mode boundaries. These operand-free guards use the same span-stability context
as the universal interior-indicator restriction. Composition computes indicator
positions; it does not classify contraction spellings to select these policies.
The existing word-start guard owns preceding-letter restrictions, including
letters outside the matchable range. Ports must implement these generic guard
semantics as well as matching and mode resolution; the declarations travel with
the compiled rule program.

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

Operations and comparisons resolve semantic print references through the symbol
inventory. Eight signs reuse general symbol definitions; six additions are
authored in `rules/ueb-2024/technical-signs.ts` with citations to the October 2018
replacement Section 3. The existing symbol compiler validates the combined
inventory and references; the existing Grade 1 generator emits a separate
technical program containing only additions and semantic maps. These additions
are loaded only for structured technical sign lookup, preserving ordinary
Grade 1 and raw technical-text support. Negation uses the same minus mapping.

The same technical program declares each script's indicator and whether its
expression appears before or after the base. These six descriptors are cited
to GTM Section 7. The renderer uses the declared position for concatenation and
protection offsets, without classifying left-script names in code.

The program also carries Braille grouping, fraction and radical delimiters,
cited to GTM Sections 6–8. Ordinary enclosures reference the shared symbol
inventory (Section 5); enlarged matrix enclosures add the declared dot 6 prefix
to those same cells (Section 15.1). The compiler resolves these references once,
so the renderer reads compiled delimiter cells without its own sign tables.
Indexed radicals reuse the declared right-superscript indicator.

Its twelve modifier cell strings are cited to the GTM Section 12 indicator list
on page 57. The renderer appends the declared cells to the item and retains
the existing grade-1 protection offsets.

Script and root-index item grouping reads a cited per-kind boolean map and
Unicode identifier pattern from the same generated program (GTM 7.1 and 12.1).
The expression types live once in the shared technical contract and retain
their public exports. Group delimiters and protection offsets remain renderer
mechanics.

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

Compilation returns a separate provenance object containing normalized source
rules aligned with the generated runtime rules. It is never part of the runtime
object. Compilation fails for:

- an empty rule set or empty input, which cannot produce a traceable reachable rule;
- conflicting print entries or rule identifiers in closed symbol and mode data;
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
