---
title: "Incremental Construction of Minimal Acyclic Finite-State Automata"
authors: "Jan Daciuk, Stoyan Mihov, Bruce W. Watson, Richard E. Watson"
year: 2000
venue: "Computational Linguistics 26(1)"
doi_url: "https://doi.org/10.1162/089120100561601"
pages: "3-16"
source_url: "https://aclanthology.org/J00-1002/"
reading_method: "Every rendered page image inspected"
---

# Incremental Construction of Minimal Acyclic Finite-State Automata

## One-Sentence Summary

The paper gives sorted- and unsorted-input algorithms that construct a minimal,
deterministic, acyclic finite-state automaton incrementally, avoiding the memory
cost of constructing a complete trie before minimization. *(pp.3, 6-15)*

## Problem Addressed

A conventional finite dictionary build first constructs a trie and then minimizes
it. Even when minimization is linear, the intermediate trie can exceed available
memory. The paper asks which states may still change after a new word is added and
how insertion can minimize the number of affected states. *(pp.5-8)*

## Key Contributions

- Defines minimality through pairwise-distinct right languages plus reachability,
  providing the exact equivalence relation used by the register. *(p.5)*
- Gives an incremental algorithm specialized for lexicographically sorted input;
  only the path of the previously inserted word can remain mutable. *(pp.8-10)*
- Gives a more complex incremental algorithm for unsorted input, including
  confluence detection, cloning, and propagation of changed equivalence classes.
  *(pp.10-15)*
- States two direct transducer extensions: use paired input/output labels, or
  associate output strings with final states and emit them after recognition.
  *(p.15)*

## Mathematical Definitions

A deterministic finite-state automaton is the five-tuple

$$
M = (Q, \Sigma, \delta, q_0, F)
$$

where $Q$ is the finite state set, $\Sigma$ the finite alphabet, $q_0$ the start
state, $F \subseteq Q$ the final states, and $\delta:Q\times\Sigma\to Q$ a partial
transition function. *(p.4)*

The extended transition function is

$$
\delta^*(q, \epsilon) = q
$$

and

$$
\delta^*(q, ax) =
\begin{cases}
\delta^*(\delta(q,a),x) & \text{if } \delta(q,a) \ne \bot \\
\bot & \text{otherwise.}
\end{cases}
$$

Here $a\in\Sigma$ and $x\in\Sigma^*$. A deterministic automaton is acyclic when
there is no nonempty $w$ with $\delta^*(q,w)=q$. *(p.4)*

The accepted language is

$$
\mathcal{L}(M)=\{x\in\Sigma^*\mid\delta^*(q_0,x)\in F\}.
$$

*(p.4)*

The right language of a state is

$$
\overrightarrow{\mathcal{L}}(q)=
\{x\in\Sigma^*\mid\delta^*(q,x)\in F\}.
$$

It is recursively the union of each outgoing label prefixed to its child's right
language, plus $\epsilon$ exactly when the state is final. *(pp.4-5)*

The chosen minimality criterion is

$$
Minimal(M) \equiv
(\forall q,q'\in Q, q\ne q' \Rightarrow
\overrightarrow{\mathcal{L}}(q)\ne
\overrightarrow{\mathcal{L}}(q')) \land Reachable(M).
$$

Thus each state in a minimal dictionary is the unique representative of one right
language. *(p.5)*

## Methods and Implementation Details

### State equivalence and the register

Two states are equivalent exactly when they are both final or both nonfinal, have
the same number of outgoing transitions, have identical corresponding labels, and
those transitions lead to states with equal right languages. Under bottom-up
processing, the child states are already canonical, so the last condition reduces
to transition targets being identical canonical states. *(p.7)*

The register contains one representative per equivalence class. A candidate state
is redirected to an existing representative or inserted as a new representative.
Leaves are processed first and all states remain reachable. *(pp.7-8)*

### Algorithm 1: lexicographically sorted input

1. Sort input strings lexicographically; this ordering is valid for ASCII and
   Unicode alphabets. *(p.8)*
2. For each word, find its longest prefix already accepted by the current graph.
   Only the previous word's path beyond that common prefix can still change.
   *(pp.8-9)*
3. Before adding the new suffix, recursively run `replace_or_register` from the
   previous word's last child toward the common-prefix state. *(pp.8-9)*
4. For each visited child, replace it with the register's equivalent state when
   present; otherwise register it. *(p.9)*
5. Append a fresh chain for the new word's remaining suffix and mark its last state
   final. *(p.9)*
6. After the final word, minimize the remaining mutable path by calling
   `replace_or_register` from the start state. *(p.8)*

The invariant is that all states are either already in the register or on the path
of the last inserted word. Registered states never need processing again.
Temporary memory is bounded by the final minimal dictionary plus the longest input
word. *(pp.9-10)*

### Algorithm 2: unsorted input

For arbitrary insertion order, a common-prefix path may contain a confluence state
with multiple incoming transitions. Mutating such a shared state can accidentally
add unintended words. The algorithm therefore identifies the first confluence,
clones every state from it through the common-prefix end, adds/minimizes the new
suffix, and propagates changed equivalence classes back toward the start.
*(pp.10-14)*

The paper illustrates the failure with a dictionary accepting `abd` and `bad`:
blindly adding `bae` through a shared state also admits `abe`. Correct insertion
clones the shared state before extending it. *(p.11, Fig. 3)*

### Transducer extension used by ueb-translator

The paper permits associating an output string with each final state, emitted only
after a valid input is recognized. For our deterministic mapping, terminal output
therefore participates in state equivalence: final states with different outputs
must not merge. This is the direct final-output extension described by the authors,
not a learned rule system. *(p.15)*

## Parameters

| Name | Symbol | Units | Default | Range | Page | Notes |
|---|---|---|---|---|---|---|
| State set | $Q$ | - | finite | - | 4 | Automaton states |
| Alphabet | $\Sigma$ | - | finite | - | 4 | Input symbols |
| Total input letters | $l$ | characters | - | positive integer | 10 | Complexity variable |
| Minimal state count | $n$ | states | - | positive integer | 10 | Register-size variable |
| Mutable path bound | - | states | longest word length | - | 10 | Extra construction memory |

## Complexity Results

- With a balanced-tree register, lookup/insertion is $O(\log n)$ per processed
  state and total time is $O(l\log n)$. *(p.10)*
- With hashing, average register lookup/insertion is almost constant; dictionary
  storage is proportional to states plus transitions, and register storage is
  proportional to states. *(p.10)*
- Each new state created by `add_suffix` is processed exactly once by
  `replace_or_register`. *(p.10)*
- Unsorted insertion has the same asymptotic estimate but a larger constant because
  changes may propagate back to the start state. *(pp.14-15)*

## Figures of Interest

- **Figures 1-2 (p.6):** Full trie versus the unique minimal dictionary for French
  verb endings; isomorphic suffix subtrees collapse into shared states.
- **Figure 3 (p.11):** Demonstrates why mutating a confluence state introduces a
  spurious accepted word.
- **Figure 4 (p.12):** Shows cloning from the first confluence before inserting an
  unsorted word.

## Limitations

- The simple, memory-efficient algorithm requires lexicographically sorted input.
  *(pp.8, 10)*
- Unsorted input requires cloning and repeated equivalence-class propagation; it
  keeps more isomorphic states alive and has worse constants. *(pp.12-15)*
- Minimal state count is only asymptotic compactness; additional compact data
  structures may reduce bytes further. *(p.15, footnote 4)*
- The paper's main formal development recognizes strings; output-bearing behavior
  is described as an extension rather than proved in equal detail. *(p.15)*

## Arguments Against Prior Work

- A complete trie followed by minimization may exhaust memory even when both build
  and minimization are individually linear. *(pp.5-6)*
- Revuz's reverse-sorted pseudominimization still requires a final minimization and
  may leave an intermediate dictionary up to eight times larger than minimal in a
  reported DELAF case. *(p.15)*
- Watson's length-sorted semi-incremental approach also requires a final
  minimization and does not preserve minimality during insertion. *(p.15)*

## Design Rationale

- Sort source rules once at build time so the smaller Algorithm 1 applies; the
  runtime never needs construction machinery. *(pp.8-10)*
- Represent Unicode input as scalar values because the paper requires an ordered
  alphabet and explicitly notes Unicode ordering. *(p.8)*
- Include terminal output in the equivalence signature so merging preserves the
  input-to-output function. *(p.15)*
- Use a hash-keyed register because the authors identify hashing as the practical
  near-constant-time implementation of equivalence lookup. *(p.10)*

## Testable Properties

- Every emitted state is reachable from the root. *(p.5)*
- No two emitted states have the same final/output status and identical labeled
  transitions to identical targets. *(pp.5, 7)*
- Source-order permutations compile identically after lexicographic sorting.
  *(p.8)*
- Every source string reaches a final state with its associated output; no other
  string reaches a final state. *(pp.4, 8-9, 15)*
- Peak mutable construction state is bounded by the minimized graph plus one input
  path. *(pp.9-10)*

## Relevance to Project

This is the construction algorithm for ueb-translator's build-time rule dictionary.
The compiler sorts repository-authored UEB rules, minimizes as each is added, and
emits flat deterministic arrays. The browser receives only those arrays and a tiny
walker; rule parsing, Maps, citations, and the register remain development-only.

## Open Questions

- [ ] Measure whether incremental construction actually improves build memory for
  the eventual UEB rule set versus a simpler bottom-up trie minimizer.
- [ ] Compare flat-array layouts independently of state minimization.

## Related Work Worth Reading

- Mehryar Mohri, *Finite-State Transducers in Language and Speech Processing*
  (1997), for sequential output semantics, determinization, and minimization. -> NOW IN COLLECTION: [Finite-State Transducers in Language and Speech Processing](../Mohri_1997_FiniteStateTransducers/notes.md)
- Dominique Revuz, *Dictionnaires et lexiques: méthodes et algorithmes* (1991),
  for pseudominimization.
- Bruce Watson, *A Taxonomy of Finite Automata Construction Algorithms* (1993),
  for construction variants.

## Collection Cross-References

### Already in Collection

- (none found)

### New Leads (Not Yet in Collection)

- Dominique Revuz (1991), *Dictionnaires et lexiques: methodes et algorithmes* - pseudominimization comparison.
- Bruce Watson (1993), *A Taxonomy of Finite Automata Construction Algorithms* - broader construction taxonomy.

### Now in Collection (previously listed as leads)

- [Finite-State Transducers in Language and Speech Processing](../Mohri_1997_FiniteStateTransducers/notes.md) - defines deterministic-input sequential and subsequential transducers, establishes input-linear application, and gives the general minimization framework that bounds this paper's acyclic final-output extension.

### Supersedes or Recontextualizes

- (none)

### Cited By (in Collection)

- (none found)

### Conceptual Links (not citation-based)

- [Finite-State Transducers in Language and Speech Processing](../Mohri_1997_FiniteStateTransducers/notes.md) - strong complement: both minimize finite-state dictionaries, but this paper's lexicographically sorted incremental acyclic register gives the concrete construction used after Mohri's model establishes that final-output dictionaries are subsequential.
