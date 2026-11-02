# Significant computer whitespace rules

## Goal
Move the visible-space marker, minimum significant run length, and ordinary edge length into cited technical rule data. Preserve runtime scanning, callbacks, and failure indexes.

## State
Implementation complete. `npm run grade1:generate` succeeded; edited compiler and technical test files passed with coverage disabled. Only generated technical program changed; general Grade 1, Grade 2, and oracle ledgers unchanged. No publication or merge performed by this worker. Hosted CI and oracle validation remain unverified.

## Decisions and why
The existing technical source, compiler, shared contract, and generator own the new descriptor. Original ICEB GTM 2014 page images 088 and 089 (printed pages 83-84), personally viewed, specify dots 346, runs of three or more ordinary spaces, and retaining the first and last space. The runtime retains traversal and expansion mechanics. No unrelated normative corrections.

Smallest change is the descriptor and its existing compiler/generator plumbing, approximately 50-90 handwritten lines plus tests and generated output. No new modules or framework.

## Surprises
Paper image files are available in the main checkout, not this isolated worktree.

## Next step
Parent verifies the committed diff, publishes the independent PR, and waits for hosted full CI/oracle checks. Draft is `.oracle-artifacts/pr-body.md`.
