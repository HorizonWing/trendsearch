# Migration Guide: `google-trends-api` -> `trendsearch`

`trendsearch` is a modern, ESM-only, strict-typed SDK with native `fetch` + Zod.

## Key Differences

- No callback API. Promise-only.
- No JSON-string return values. Methods return typed objects.
- Strict schema validation by default.
- Experimental RPC endpoints are namespaced under `experimental`.
- `trendingNow` and `trendingArticles` are stable root methods.
- `dailyTrends` and `realTimeTrends` are legacy compatibility methods and may raise `EndpointUnavailableError` when Google retires legacy routes.

## Method Mapping

| `google-trends-api`                  | `trendsearch`                                                     |
| ------------------------------------ | ----------------------------------------------------------------- |
| `autoComplete({ keyword })`          | `autocomplete({ keyword })`                                       |
| `interestOverTime({ keyword, ... })` | `interestOverTime({ keywords: [keyword], ... })`                  |
| `interestByRegion({ keyword, ... })` | `interestByRegion({ keywords: [keyword], ... })`                  |
| `relatedQueries({ keyword, ... })`   | `relatedQueries({ keywords: [keyword], ... })`                    |
| `relatedTopics({ keyword, ... })`    | `relatedTopics({ keywords: [keyword], ... })`                     |
| `dailyTrends({ geo, ... })`          | `trendingNow({ geo, ... })`                                       |
| `realTimeTrends({ geo, ... })`       | `trendingNow({ geo, ... })` + `trendingArticles({ articleKeys })` |

## Before / After

### Autocomplete

```ts
// before
const raw = await googleTrends.autoComplete({ keyword: "typescri" });
const parsed = JSON.parse(raw);

// after
const result = await autocomplete({ keyword: "typescri" });
console.log(result.data.topics);
```

### Interest Over Time

```ts
// before
const raw = await googleTrends.interestOverTime({
  keyword: "typescript",
  geo: "US",
});
const parsed = JSON.parse(raw);

// after
const result = await interestOverTime({
  keywords: ["typescript"],
  geo: "US",
});
console.log(result.data.timeline);
```

### Daily/Realtime Migration

```ts
// before
const raw = await googleTrends.realTimeTrends({ geo: "US" });

// after
const now = await trendingNow({ geo: "US", language: "en", hours: 24 });
const articleKeys = now.data.items[0]?.articleKeys ?? [];
const articles = await trendingArticles({
  articleKeys: articleKeys.slice(0, 1),
  articleCount: 5,
});
```

## Client Configuration Migration

`agent`/proxy/cookie usage migrates to `createClient` options:

```ts
import { createClient, MemoryCookieStore } from "trendsearch";

const client = createClient({
  userAgent: "...",
  cookieStore: new MemoryCookieStore(),
  proxyHook: async ({ url, init }) => ({ url, init }),
});
```

## Debug Raw Payloads

```ts
const result = await relatedQueries(
  { keywords: ["typescript"], geo: "US" },
  { debugRawResponse: true }
);

console.log(result.raw);
```

## Error Handling

```ts
import {
  EndpointUnavailableError,
  RateLimitError,
  SchemaValidationError,
} from "trendsearch";

try {
  await interestOverTime({ keywords: ["typescript"] });
} catch (error) {
  if (error instanceof RateLimitError) {
    // handle throttling
  }
  if (error instanceof SchemaValidationError) {
    // handle upstream payload drift
  }
  if (error instanceof EndpointUnavailableError) {
    // migrate from legacy dailyTrends/realTimeTrends to trendingNow/trendingArticles
  }
}
```
