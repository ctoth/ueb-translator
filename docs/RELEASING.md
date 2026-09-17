# Releasing to npm

Pushing a stable `vX.Y.Z` tag runs the Release workflow. The tag must match
`package.json` and both lockfile versions, and its commit must be on `main`.
Prerelease tags are rejected.

The workflow runs the reusable CI and Liblouis oracle workflows against the
tagged commit. Publishing waits for `npm run check`, the full dictionary and
retained-corpus sweeps, and 100,000 fuzz cases with seed `20260917`.
It builds and packs the package, publishes the tarball with provenance, checks
the registry's integrity against that tarball, and creates a GitHub release.

PRs changing these workflows also rehearse the CI and oracle jobs, including
the fuzz replay. Tag validation and publishing run only for tag pushes.

## One-time npm setup

In the npm package settings for `ueb-translator`, configure a GitHub Actions
trusted publisher:

- Organization or user: `ctoth`
- Repository: `ueb-translator`
- Workflow filename: `release.yml`
- Environment: leave blank
- Allowed action: direct `npm publish`

The GitHub-hosted publishing job uses Node 24 and npm's OIDC authentication.
No npm token secret is needed. npm must be at least version 11.5.1.

## Cut a release

1. Merge the release workflow setup before cutting the first release.
2. Update the package and lockfile versions together in a release PR, using
   `npm version X.Y.Z --no-git-tag-version`.
3. Merge the PR after its checks pass.
4. Tag that merged commit with `git tag vX.Y.Z` and push that tag explicitly:
   `git push origin vX.Y.Z`.
5. Check the Release run and the exact version in npm before declaring the
   release complete.

Existing local tags are not moved automatically. A tag pointing to a commit
without `release.yml` cannot trigger this workflow. Resolve any pre-existing
local release commit or tag deliberately before cutting the first release.

If publishing fails, inspect the npm registry before retrying: npm versions
cannot be overwritten. If npm publication succeeded but registry verification
or GitHub release creation failed, verify the published artifact and finish the
GitHub release separately; do not republish the same version.
