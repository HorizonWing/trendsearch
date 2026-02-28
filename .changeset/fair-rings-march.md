---
"trendsearch": minor
---

Stabilize live endpoint support and API surface:

- Add stable root `trendingNow` and `trendingArticles` methods (with experimental aliases preserved).
- Add `EndpointUnavailableError` for legacy `dailyTrends`/`realTimeTrends` when upstream routes return `404/410`.
- Fix picker paths to `/trends/api/explore/pickers/*`.
- Broaden related topic value typing to `number | string`.
- Improve RPC schema-validation consistency and expand live/contract coverage.
