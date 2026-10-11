2026-09-17 checkpoint: CI publishing setup is in isolated worktree ../ueb-translator-ci-publish, branch ci/npm-publishing, PR #103, head 9e04874647a7f7dd056bc1ec6cd216b7ed32dca8.
Release workflow calls reusable CI and oracle checks (full dictionary/corpus plus 100000 fuzz cases, seed 20260917), validates stable tags/main ancestry, publishes via OIDC, verifies integrity, creates GitHub release; workflow PRs rehearse checks without publication.
Local npm run check and actionlint v1.7.12 passed; exact-head GitHub CI/oracle/rehearsal runs are pending. No translation or ledger changes.
Chrome new_page tool remains pending in functions cell 8; user asked asynchronously to approve/enable Chrome remote debugging. npm trust inspection previously required interactive authentication.
Local main has unpublished version commit 957b76b and local-only v2.2.0 tag; remote main is ffd6ac7. Preserve those and existing notes. Next: configure npm trusted publisher, verify PR checks, finish setup without moving tag or implicitly cutting a release.

2026-09-17 checkpoint: PR #103 rehearsal 35253540307 passed npm checks and full dictionary/corpus sweeps but arbitrary new seed 20260917 failed at run 1254 on (gh), shrink path 1253:4; publication was skipped.
Evidence downloaded to C:/Users/Q/AppData/Local/Temp/ueb-release-rehearsal-35253540307/fuzz-result.json; exact local output is contracted gh, oracle spells gh. Existing ledger group fuzz-unexpanded-ar-gh already covers related exact strings, not this one.
Read local ICEB PDF rules 10.4.1, 10.4.2, 10.12.1-2: gh permitted generally, omitted from six stand-alone restrictions, uncertainty about expanded abbreviations supports existing group's context distinction. No ledger or translation edits made.
Historical project notes record adjudicated 100000-case seed -679952479. Asked user optional choice: use established replay and retain exploratory finding separately, or expand into adjudicating novel seed. Awaiting reasonable response interval.
Chrome cell 8 completed with 300-second tool timeout; no npm settings changed. Earlier pending shell then attempted duplicate worktree creation and safely failed because branch already existed. User asked to enable Chrome remote debugging; PR remains unmerged.

2026-09-17 checkpoint: Used established seed -679952479 after optional scope question went unanswered; documented exploratory (gh) finding and artifact in PR rather than changing ledger/translation. Final head aea6835013d3f652ae43189e5ca8f6fa65b25671.
All final-head PR checks passed, including Release rehearsal 35254372425 and full dictionary/corpus/fuzz. Standalone CI 35254371959 passed attempt 2 after a branch-coverage miss; identical reusable check passed first try.
PR #103 merged normally at 0dac1400f67f166eb1e58ce586a87b7fef929b04, two parents verified, merged tree equals tested head tree 0d8facf7a45f050a89b05889fce2994f3be12bfb. Original local main/version tag untouched; no npm version published.
Chrome retry cell 37 also timed out. Fallback npm trust github ueb-translator --file release.yml --repo ctoth/ueb-translator --allow-publish --yes is running in PTY session 51696; pressed Enter to open npm authentication page.
User has been asked to authenticate that npm browser page (supersedes Chrome debugging request). Poll session 51696 for trust creation, verify configuration if auth permits; npm publishing setup is not complete until trust succeeds. Worktree remains clean, notes uncommitted.

2026-09-17 final checkpoint: Browser npm authentication succeeded; PTY 51696 exited 0 after creating trusted publisher a7d333ab-fdc2-4426-814f-c8e0e722ef25.
Independent npm trust list ueb-translator --json verified GitHub repository ctoth/ueb-translator, workflow release.yml, permissions createPackage and createStagedPackage, no environment restriction.
PR #103 body updated with completed trust configuration. Code setup merged and publisher configured; future stable tags on updated main trigger gated publication. No package version was published in this task.
Final PR-head oracle checks/rehearsal passed; merge commit 0dac140 has identical tree. Main follow-up runs 35255102577 (oracle) and 35255102711 (CI) were in progress at last query, not yet claimed verified.
Existing local main 957b76b and local v2.2.0 were preserved and predate release.yml; resolve their first-release handling explicitly when a release is requested. Exploratory seed 20260917 (gh) finding remains recorded in PR/evidence, no ledger edits.
