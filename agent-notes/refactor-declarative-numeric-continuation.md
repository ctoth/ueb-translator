# Goal

Extract the existing technical numeric-continuation selectors into typed rule data, independently from integrated main. Parent publishes the PR. No JSON migration, merge, or behavior expansion.

## State

Implemented and published as independent PR #163 against main. Parent inspected the source, runtime, generated data and tests. Full hosted CI and both oracle runs passed. Actual logs: 1,048 inventory, 658,033 dictionary and 441,223 corpus cases, zero stale/untriaged; accepted disagreements unchanged at 1/10,358/35,962. PR description links verified runs. Only technical generated data changed; general Grade 1/Grade 2 artifacts and ledgers unchanged. No merge authorized.

# Decisions and why

The smallest change adds one technical rule descriptor containing preceding expression kinds and the lowercase identifier prefix pattern, then threads it through the existing compiler and generator. Approximately 100 handwritten lines plus generated data and test call updates. Preserve the number/simple-fraction structural selector, raw case-sensitive prefix, requirement offsets, unsupported propagation, and existing numeric-mode scope exclusions. No cell map is needed: the descriptor selects raw input and existing insertion mechanics own the cells.

# Surprises

An initial mechanical argument update also touched structuredClone; inspecting the diff caught it, and it is corrected. No runtime behavior departure was found.

## Next step

Q authorized merging all four. PRs #161 and #162 are normally merged. Resolving #163 against integrated main, retaining all policy descriptors and tests; regenerate, push and verify hosted checks before merge. JSON migration and compiler port remain outside this batch.
