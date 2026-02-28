# Getting Started: trendsearch

This guide covers local development and release workflow for the `trendsearch` package.

## 1. Install

```bash
bun install
```

## 2. Build and Test

Deterministic suites (used in PR CI):

```bash
bun run test:unit
bun run test:contracts
bun run test:all
```

Optional live suite (real Google endpoints):

```bash
TRENDSEARCH_LIVE=1 bun run test:live
```

Live suite covers:

- Stable: `autocomplete`, `explore`, `interestOverTime`, `interestByRegion`, `relatedQueries`, `relatedTopics`, `trendingNow`, `trendingArticles`
- Experimental: `experimental.trendingNow`, `experimental.trendingArticles`, `experimental.geoPicker`, `experimental.categoryPicker`, `experimental.topCharts`, `experimental.interestOverTimeMultirange`, `experimental.interestOverTimeCsv`, `experimental.interestOverTimeMultirangeCsv`, `experimental.interestByRegionCsv`, `experimental.relatedQueriesCsv`, `experimental.relatedTopicsCsv`, `experimental.hotTrendsLegacy`
- Legacy compatibility: `dailyTrends`, `realTimeTrends` (pass if data is returned, or if endpoint-unavailable/schema-drift behavior is observed)

## 3. Run the CLI Locally

```bash
bun run cli --help
bun run cli autocomplete typescript --output json
```

CLI supports all endpoint wrappers plus:

- `trendsearch config *`
- `trendsearch wizard`
- `trendsearch completion <bash|zsh|fish>`

## 4. Run Full Quality Gate

```bash
bun run check:all
```

This runs lint, typecheck, deterministic tests, build, package checks, and consumer smoke tests.

## 5. Update Fixtures from Live Endpoints

```bash
bun run fixtures:record
```

This script updates fixture payloads under `tests/fixtures/raw`.

## 6. Branch + PR Workflow

1. Branch from `main`.
2. Implement changes in `src/` and tests in `tests/`.
3. If behavior/API changed, add a changeset:

```bash
bun run changeset
```

4. Run `bun run check:all`.
5. Open PR.

## 7. Release Model

- Changesets opens/updates release PR on `main`.
- Merge release PR to publish.
- Publish runs only when `NPM_PUBLISH_ENABLED=true` in GitHub repo variables.

## 8. Live Endpoint Monitoring

Nightly and manual live checks run via:

- `.github/workflows/live-endpoints.yml`

This catches upstream Google payload drift without making PR CI flaky.

## 9. Reliability Notes for Internal Google Endpoints

- Expect possible `429` throttling even at low request rates.
- Expect occasional `400`/`401`/`404`/`410` on undocumented routes.
- Keep request concurrency low and rely on cache + backoff.
- The transport layer honors upstream `Retry-After` on `429` and exposes this as `RateLimitError.retryAfterMs`.
- `hl` is forwarded as `accept-language` when not set explicitly.
- Live checks for experimental endpoints are best-effort because Google may return temporary route-specific failures.
- Prefer the official Google Trends API alpha for long-term production integrations.
