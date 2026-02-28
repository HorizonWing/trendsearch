# Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for
versioning and changelog generation.

## When to create a changeset

Create a changeset for any pull request that changes the published package
behavior, API, or metadata.

Common examples:

- New features in `src/`
- Bug fixes in `src/`
- Breaking changes
- `package.json` export/runtime contract updates

Docs-only, test-only, and CI-only changes usually do not require one.

## How to add a changeset

Run:

```bash
bun run changeset
```

Then follow the prompts:

1. Select the package (`trendsearch` in this starter).
2. Pick bump type (`patch`, `minor`, or `major`).
3. Write a short summary of the change.

Commit the generated markdown file from `.changeset/`.

## Release flow

1. Merge PRs with changesets into `main`.
2. GitHub Actions opens/updates a \"Version Packages\" PR.
3. Merge that PR to publish to npm with provenance using trusted publishing.
