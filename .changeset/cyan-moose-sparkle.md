---
"trendsearch": patch
---

Improve 429 resilience by applying rate limiting to each retry attempt and adding adaptive cooldown windows when Google responds with 429 without a `Retry-After` header.

Expose adaptive cooldown tuning via `createClient({ adaptiveRateLimit })` and CLI flags/env vars:

- `--adaptive-base-cooldown-ms` / `TRENDSEARCH_ADAPTIVE_BASE_COOLDOWN_MS`
- `--adaptive-max-cooldown-ms` / `TRENDSEARCH_ADAPTIVE_MAX_COOLDOWN_MS`

Add standard JSDoc annotations for externally consumed client APIs and top-level endpoint exports to improve IDE autocomplete/help visibility.

Add `scripts/related-queries-runner.ts` and `bun run related-queries:runner` for resilient related-query collection (single-session client, adaptive cooldown, and local cache support).

Add SDK-level response caching via `createClient({ responseCache })` with endpoint allowlists and per-endpoint TTL overrides. Response caching is disabled by default.
