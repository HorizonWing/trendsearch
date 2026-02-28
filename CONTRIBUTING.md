# Contributing

Thanks for your interest in contributing!

## Development

1. Fork and clone the repository.
2. Install dependencies: `bun install`.
3. Create a focused branch from `main`.
4. Make your changes.
5. If your PR changes package behavior/API/metadata, add a changeset:
   `bun run changeset`.
6. Run the full quality gate: `bun run check:all`.
7. Submit a pull request.

## Guidelines

- Follow the existing code style (enforced by Ultracite).
- Write tests for new features and fixes.
- Keep commits focused and descriptive (Conventional Commits).
- Update documentation as needed.
- Do not manually edit `dist/` artifacts.

## Changesets and Releases

- This repository uses Changesets for versioning and changelog management.
- Releasable changes must include a `.changeset/*.md` file.
- Merging PRs with changesets into `main` will update/open a release PR.
- Merging the release PR publishes to npm via trusted publishing (OIDC) only
  when `NPM_PUBLISH_ENABLED=true` is configured in repository variables.
- Package owners should follow `MAINTAINERS.md` for the full release runbook.

## Reporting Issues

- Check existing issues before opening a new one.
- Include reproduction steps when reporting bugs.
- Be clear and concise.
