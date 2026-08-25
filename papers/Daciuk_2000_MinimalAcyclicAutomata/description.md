---
tags: [finite-state, automata-minimization, compiler]
---
Daciuk, Mihov, Watson, and Watson present incremental construction algorithms for minimal deterministic acyclic automata from sorted and unsorted strings. The sorted algorithm maintains minimality while retaining only one mutable input path beyond the canonical-state register. It directly supports ueb-translator's build-time final-output rule dictionary and its reproducibility/minimality tests.
