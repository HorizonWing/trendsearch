# Repository Guidelines for Agents

This file is the agent-facing source of truth for working in this codebase.
Use it to understand architecture, release mechanics, and safe change patterns.

## 1) Project Purpose

`trendsearch` is a Google Trends API fetching library for Node.js and Bun, built as
a publishable TypeScript npm package with:

- ESM-only output
- Bun-first local workflow
- Changesets-managed versioning/changelog
- GitHub Actions CI + trusted publishing

## 2) Source of Truth Files

Read these first before making meaningful changes:

- `package.json` - scripts, publish contract, metadata
- `src/index.ts` - public package entrypoint
- `.github/workflows/ci.yml` - quality checks and PR gates
- `.github/workflows/release.yml` - release PR + publish automation
- `.changeset/config.json` - versioning rules
- `README.md` + `GETTING_STARTED.md` + `MAINTAINERS.md` - user/owner docs

## 3) Module + Publish Contract (Important)

The package is intentionally ESM-only.

- `"type": "module"`
- `exports["."].import` -> `./dist/index.mjs`
- `exports["."].types` -> `./dist/index.d.mts`
- `exports["."].require` -> `null`
- Node runtime floor: `>=20`

Do not switch to dual CJS/ESM unless explicitly requested.

## 4) Build/Test/Check Commands

Use Bun for all local workflows.

- `bun install`
- `bun run dev`
- `bun run build`
- `bun run test`
- `bun run lint`
- `bun run format`
- `bun run typecheck`
- `bun run check:pack`
- `bun run check:package`
- `bun run test:consumer`
- `bun run check:all`

Default validation target for changes is `bun run check:all`.

## 5) Release and Versioning Model

This repo uses Changesets.

- Contributors add `.changeset/*.md` for releasable changes.
- Merging to `main` triggers `release.yml`.
- Changesets action opens/updates a release PR.
- Merging the release PR applies version/changelog changes.
- Publish is guarded by repository variable `NPM_PUBLISH_ENABLED=true`.

Relevant scripts:

- `bun run changeset`
- `bun run release:status`
- `bun run version-packages`
- `bun run release`
- `bun run release:ci` (guarded CI publish path)

## 6) CI Overview

### `ci.yml`

- `quality` job on Node 20: full `check:all`
- `compat` matrix on Node 20/22/24: test + build + package checks
- `changeset-required` PR guard:
  - package-impacting paths require a `.changeset/*.md`

### `release.yml`

- Trigger: push to `main` + manual dispatch
- Runs quality gate before release action
- Uses npm trusted publishing (OIDC) with provenance
- Publish only when `NPM_PUBLISH_ENABLED=true`

### `security-audit.yml`

- Weekly production audit
- Adds `bun outdated` summary

## 7) Change Rules for Agents

1. Keep `dist/` generated; do not hand-edit output files.
2. If package behavior/API changes, add/update tests and changeset docs as needed.
3. Keep docs aligned with behavior changes (`README.md`, `GETTING_STARTED.md`,
   `CONTRIBUTING.md`, `MAINTAINERS.md`).
4. Favor Bun-native APIs for scripts where practical.
5. Preserve ESM-only package contract unless user asks otherwise.
6. Do not introduce secrets or token-based publishing patterns.

## 8) Typical Paths You Will Edit

- `src/*.ts` - implementation
- `tests/*.test.ts` - runtime tests
- `scripts/*.ts` - maintenance/consumer smoke scripts
- `.github/workflows/*.yml` - CI/CD behavior
- Docs at repository root

## 9) Documentation Map

- `README.md` - high-level usage + commands
- `GETTING_STARTED.md` - beginner full flow
- `CONTRIBUTING.md` - contributor expectations
- `MAINTAINERS.md` - owner operations and incident handling
- `SECURITY.md` - vuln reporting policy

## 10) Common Pitfalls

- Forgetting a changeset for package-impacting PRs
- Expecting publish to run while `NPM_PUBLISH_ENABLED` is false/unset
- Breaking the ESM-only contract by adding CJS assumptions
- Updating scripts/workflows without updating docs

<!-- opensrc:start -->

## Source Code Reference

Source code for dependencies is available in `opensrc/` for deeper understanding of implementation details.

See `opensrc/sources.json` for the list of available packages and their versions.

Use this source code when you need to understand how a package works internally, not just its types/interface.

### Fetching Additional Source Code

To fetch source code for a package or repository you need to understand, run:

```bash
npx opensrc <package>           # npm package (e.g., npx opensrc zod)
npx opensrc pypi:<package>      # Python package (e.g., npx opensrc pypi:requests)
npx opensrc crates:<package>    # Rust crate (e.g., npx opensrc crates:serde)
npx opensrc <owner>/<repo>      # GitHub repo (e.g., npx opensrc vercel/ai)
```

<!-- opensrc:end -->
