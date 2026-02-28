---
"trendsearch": minor
---

Add a new experimental endpoint family for undocumented Google Trends routes:

- `experimental.topCharts`
- `experimental.interestOverTimeMultirange`
- CSV variants: `interestOverTimeCsv`, `interestOverTimeMultirangeCsv`, `interestByRegionCsv`, `relatedQueriesCsv`, `relatedTopicsCsv`
- `experimental.hotTrendsLegacy`

Also harden transport behavior by auto-populating `accept-language` from `hl` when missing and improving `401/429` diagnostics, with expanded CLI/docs/test coverage.
