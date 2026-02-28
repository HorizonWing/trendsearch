# Package Owner Guide

This document is for package owners and maintainers of the trendsearch package.
It explains the full operational flow for versioning, release, publishing, and
incident handling.

For a beginner-first walkthrough, see `GETTING_STARTED.md`.

## What This Package Optimizes For

- Google Trends API fetching library (TypeScript)
- ESM-only package contract
- Bun-first development and CI tasks
- Changesets-managed versioning and changelog updates
- npm trusted publishing with OIDC and provenance

## Key Files You Should Know

- `package.json`: package contract, scripts, engines, publish metadata
- `.changeset/config.json`: versioning/changelog configuration
- `.github/workflows/ci.yml`: quality checks, compatibility matrix, changeset guard
- `.github/workflows/release.yml`: release PR and publish automation
- `.github/workflows/security-audit.yml`: scheduled audit checks
- `CHANGELOG.md`: release history (Changesets-managed)
- `SECURITY.md`: disclosure and response policy

## One-Time Setup Checklist (Per Repository)

1. Update package metadata in `package.json`:
   - `name`, `description`, `author`, `homepage`, `repository`, `bugs`
2. Ensure npm package ownership is correct:
   - maintainers/org permissions on npm
3. Configure npm Trusted Publishing:
   - npm package settings -> Publishing access -> add GitHub Actions trusted publisher
   - workflow file must match `release.yml`
4. Add repository variable `NPM_PUBLISH_ENABLED`:
   - default unset/false to prevent accidental publish
   - set to `true` only when you are ready to publish from `main`
5. Ensure GitHub branch protections on `main`:
   - require passing CI checks
   - require PR reviews as needed by your team
6. Confirm repository Actions are enabled.

## Daily Development and Release Model

1. Contributor opens PR with code changes.
2. If package-impacting files changed, PR includes a `.changeset/*.md` file.
3. `ci.yml` runs:
   - quality gate (`bun run check:all`)
   - Node compatibility matrix (20/22/24)
   - changeset-required guard on PRs
4. PR merges to `main`.
5. `release.yml` runs `changesets/action`:
   - if pending changesets exist: opens or updates a release PR
   - if release commit is on `main`: publishes to npm with provenance only when
     `NPM_PUBLISH_ENABLED=true`
6. Release PR merges:
   - versions and `CHANGELOG.md` updates are applied
   - package is published automatically

## Versioning Rules

Use semantic versioning through Changesets:

- `patch`: bug fixes, internal improvements without API expansion
- `minor`: backward-compatible features, new exports, additive behavior
- `major`: breaking API/runtime/contract changes

Choose the bump level at `bun run changeset` prompt. The release PR applies the
selected bump.

## Commands Owners Use Most

```bash
# Check pending release plan
bun run release:status

# Create a changeset
bun run changeset

# Apply version/changelog updates locally (rare; usually CI handles this)
bun run version-packages

# Publish manually (rare fallback)
bun run release

# Full quality gate before merging critical changes
bun run check:all

# CLI smoke checks
bun run cli --help
bun run cli autocomplete typescript --output json
```

## CLI Operations

The package ships a first-class `trendsearch` binary (same npm package, no separate
CLI package). Maintainer expectations:

- Keep command wrappers aligned with all SDK endpoints.
- Keep experimental wrappers aligned with internal-route coverage:
  - `experimental.topCharts`
  - `experimental.interestOverTimeMultirange`
  - `experimental.*Csv` variants
  - `experimental.hotTrendsLegacy`
- Keep JSON envelopes stable for automation users.
- Keep exit-code mapping stable:
  - `2` usage
  - `3` endpoint unavailable
  - `4` rate limited
  - `5` transport failure
  - `6` schema/response drift
  - `1` unknown fallback
- Keep spinner/diagnostics on stderr and machine payloads on stdout.
- Keep completion command working (`trendsearch completion bash|zsh|fish`).
- Preserve rate-limit diagnostics (including `retryAfterMs` when available) for JSON automation consumers.

For isolated automation and tests, set `TRENDSEARCH_CONFIG_DIR` to redirect
persisted CLI config away from user defaults.

## Internal Endpoint Risk Posture

Google internal Trends routes are undocumented and can change without notice. Maintainers should assume:

- elevated `429` rates under modest traffic,
- intermittent `400`/`401`/`404`/`410` behavior on some routes,
- occasional response-shape drift requiring schema updates and fixture refreshes.

Operational guidance:

1. Keep live checks running daily and review failures quickly.
2. Favor low default concurrency and conservative retries for unstable routes.
3. Honor `Retry-After` guidance when Google sends it, and keep that behavior intact.
4. Treat experimental endpoint live checks as best-effort if failures match known unstable statuses.
5. Encourage users to migrate production workloads to the official Google Trends API alpha when available.

## Publishing and Provenance

Publishing is handled by GitHub Actions using trusted publishing:

- No long-lived npm token is required.
- Workflow requires `id-token: write`.
- Release runner uses Node 22+ and npm 11+.
- Provenance is enabled via npm config env (`NPM_CONFIG_PROVENANCE=true`).

After publish, verify on npm:

1. New version appears on package page.
2. Provenance checkmark/details are visible for the release.
3. Install and smoke-test from a clean environment if the change is high risk.

## Changeset Requirement Policy

PRs must include a changeset when they change package-impacting files:

- `src/**`
- `package.json`
- `tsconfig.json`
- `tsconfig.typecheck.json`
- `tsdown.config.ts`

PRs touching only docs/tests/CI usually do not need changesets.

## Hotfix Flow

1. Branch from `main` (or from a release branch if your team uses them).
2. Apply fix and add a `patch` changeset.
3. Merge with normal CI checks.
4. Merge generated release PR to publish fast.

This template uses a fix-forward model by default.

## Incident and Rollback Guidance

npm unpublish is usually restricted and not recommended for established versions.
Prefer one of these:

1. Publish a quick patch fix.
2. Deprecate the bad version:

```bash
npm deprecate <package-name>@<bad-version> "Deprecated: use <good-version>"
```

3. If severe, communicate issue and mitigation in release notes and repository.

## Security and Dependency Operations

- `security-audit.yml` runs weekly (`bun audit --production`).
- Dependabot keeps npm and GitHub Actions dependencies updated.
- Use `SECURITY.md` process for vulnerability intake and coordinated disclosure.

## Troubleshooting

### Release PR is not created

- Check that merged PRs contain `.changeset/*.md`.
- Check `release.yml` run logs.
- Confirm Actions permissions and branch protections.

### Publish failed with auth/provenance errors

- Confirm trusted publisher mapping on npm package settings.
- Confirm workflow file name is `release.yml`.
- Ensure release job runs on GitHub-hosted runners.

### CI says missing changeset unexpectedly

- Confirm whether PR touches package-impacting paths.
- Add a changeset via `bun run changeset` if behavior/contract changed.
- For non-releasable refactors, validate affected files and adjust scope.
