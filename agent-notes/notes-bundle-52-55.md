## 2026-08-27 checkpoint
- Finding: npm test nests build, package verification, size bundling, and Playwright; CI then repeats build and size.
- State: live issues #52 and #55 read; isolated worktree installed with npm ci; focused metadata and cleaner tests are red as expected.
- Scope: one deterministic check flow, clean standalone corpus/oracle scripts, stale-cache prevention, and the listed hygiene fixes; no PR.
- Blocker: none.
- Next: implement shared cleaning and dedicated verification scripts, then run focused tests and npm run check once.

## 2026-08-27 checkpoint 2
- Finding: native Node 22.18 source execution requires the cleaner's `.mts` import; the focused corpus smoke caught and verified that clean-checkout path.
- State: focused tests pass (717), build verification passes, ordered typecheck passes, lint passes, and Chromium is installed.
- Blocker: none.
- Next: run `npm run check` exactly once, audit the diff, and commit only issue-owned files.
