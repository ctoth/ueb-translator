# Significant computer whitespace rules

## Goal
Move the visible-space marker, minimum significant run length, and ordinary edge length into cited technical rule data. Preserve runtime scanning, callbacks, and failure indexes.

## State

Implemented and published as independent PR #164 against main. Parent inspected the source, runtime, generated data and tests. Full hosted CI and both oracle runs passed. Actual logs: 1,048 inventory, 658,033 dictionary and 441,223 corpus cases, zero stale/untriaged; accepted disagreements unchanged at 1/10,358/35,962. PR description links verified runs. Only technical generated data changed; general Grade 1/Grade 2 artifacts and ledgers unchanged. No merge authorized.

## Decisions and why
The existing technical source, compiler, shared contract, and generator own the new descriptor. Original ICEB GTM 2014 page images 088 and 089 (printed pages 83-84), personally viewed, specify dots 346, runs of three or more ordinary spaces, and retaining the first and last space. The runtime retains traversal and expansion mechanics. No unrelated normative corrections.

Smallest change is the descriptor and its existing compiler/generator plumbing, approximately 50-90 handwritten lines plus tests and generated output. No new modules or framework.

## Surprises
Paper image files are available in the main checkout, not this isolated worktree.

## Next step

Q authorized merging all four. PRs #161-#163 are normally merged. Resolving #164 against integrated main while retaining all policy descriptors and tests; regenerate, push and verify hosted checks before merge. JSON migration and compiler port remain outside this batch.
