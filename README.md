# trendsearch 📈

Modern Google Trends SDK for Node.js and Bun, built with native `fetch`, strict Zod validation, and a production-friendly client API.

## ✨ Highlights

- 🔒 Strict schema validation by default (Zod-backed)
- 🧠 Full TypeScript-first API and exported inferred types
- ⚡ Native `fetch` transport (Node 20+ and Bun)
- 🧱 ESM-only package contract
- 🛡️ Built-in retry/backoff + rate limiting (`p-retry` + `p-queue`)
- 🍪 Optional cookie persistence support
- 🖥️ First-class `trendsearch` CLI for every endpoint
- 🌐 Stable Google Trends API endpoints + experimental RPC/picker/CSV/top charts endpoints
- 🧪 Deterministic fixture contracts + optional live endpoint tests

## 📦 Install

### Install as a library dependency

```bash
bun add trendsearch
npm install trendsearch
pnpm add trendsearch
yarn add trendsearch
```

### Run the CLI without installing globally (always latest)

```bash
npx trendsearch@latest --help
pnpm dlx trendsearch@latest --help
yarn dlx trendsearch@latest --help
bunx trendsearch@latest --help
```

### Install the CLI globally (`@latest`)

Use `@latest` so your global binary is always installed from the newest published version.

```bash
npm install --global trendsearch@latest
pnpm add --global trendsearch@latest
bun add --global trendsearch@latest
yarn global add trendsearch@latest
```

For Yarn Berry/Modern, prefer `yarn dlx trendsearch@latest` (shown above) instead of global install.

### Update an existing global install to latest

Re-run your package manager's global install command with `@latest`.

## ✅ Runtime Contract

- 🟢 Node.js `>=20`
- 🟢 Bun `>=1.3.9`
- 🟢 ESM-only package
- 🔴 CommonJS `require("trendsearch")` is intentionally unsupported

If you are in a CJS project, use dynamic import:

```js
const trendsearch = await import("trendsearch");
```

## 🚀 Library Usage Guide

### 1) Quick start with endpoint helpers

```ts
import { interestOverTime } from "trendsearch";

const result = await interestOverTime({
  keywords: ["typescript"],
  geo: "US",
  time: "today 3-m",
});

console.log(result.data.timeline.length);
```

### 2) Reuse shared defaults with `createClient`

```ts
import { createClient } from "trendsearch";

const client = createClient({
  hl: "en-US",
  tz: 0,
  timeoutMs: 15_000,
});

const result = await client.relatedQueries({
  keywords: ["typescript"],
  geo: "US",
});

console.log(result.data.top.length);
```

### 3) Use exported schemas/types when you need stricter boundaries

```ts
import { schemas, type ExploreRequest } from "trendsearch";

const request: ExploreRequest = {
  keywords: ["typescript", "javascript"],
  geo: "US",
};

const validated = schemas.exploreRequestSchema.parse(request);
```

## 🖥️ CLI Usage Guide

`trendsearch` ships with a production-ready CLI that wraps all stable and
experimental endpoints.

### 1) Start with help

```bash
trendsearch --help
trendsearch explore --help
```

### 2) Run common endpoint commands

```bash
trendsearch autocomplete typescript --output json
trendsearch explore typescript --geo US --time "today 3-m" --output pretty
trendsearch interest-over-time typescript --geo US --time "today 3-m"
trendsearch related-queries typescript --geo US --time "today 12-m"
trendsearch experimental trending-now --geo US --language en --hours 24
```

### 3) Pass request payloads with `--input`

`--input` accepts inline JSON, a JSON file path, or `-` for stdin.

```bash
trendsearch explore --input '{"keywords":["typescript"],"geo":"US"}' --output json
trendsearch explore --input ./requests/explore.json --output json
cat ./requests/explore.json | trendsearch explore --input - --output json
```

### CLI Output Modes

- `--output pretty` (human-friendly, default in TTY)
- `--output json` (single JSON envelope, default outside TTY)
- `--output jsonl` (JSON per line)

Success envelope:

```json
{
  "ok": true,
  "endpoint": "autocomplete",
  "request": { "keyword": "typescript" },
  "data": { "topics": [] },
  "meta": {
    "command": "autocomplete",
    "durationMs": 120,
    "timestamp": "2026-02-14T00:00:00.000Z",
    "output": "json"
  }
}
```

Error envelope (`json`/`jsonl`):

```json
{
  "ok": false,
  "error": {
    "code": "TRANSPORT_ERROR",
    "message": "Request failed",
    "details": {},
    "exitCode": 5
  }
}
```

### 4) Persist defaults, use wizard, and generate completion

```bash
trendsearch config set output json
trendsearch config set hl en-US
trendsearch config get output
trendsearch config list
trendsearch config unset hl
trendsearch config reset
trendsearch wizard
trendsearch completion zsh
```

Config precedence:

`flags > env > persisted config > defaults`

Supported env vars include:

- `TRENDSEARCH_OUTPUT`
- `TRENDSEARCH_SPINNER`
- `TRENDSEARCH_HL`
- `TRENDSEARCH_TZ`
- `TRENDSEARCH_BASE_URL`
- `TRENDSEARCH_TIMEOUT_MS`
- `TRENDSEARCH_MAX_RETRIES`
- `TRENDSEARCH_RETRY_BASE_DELAY_MS`
- `TRENDSEARCH_RETRY_MAX_DELAY_MS`
- `TRENDSEARCH_MAX_CONCURRENT`
- `TRENDSEARCH_MIN_DELAY_MS`
- `TRENDSEARCH_USER_AGENT`
- `TRENDSEARCH_CONFIG_DIR` (override where persisted CLI config is stored)

## 🧭 API Surface

### Stable Endpoints

- `autocomplete`
- `explore`
- `interestOverTime`
- `interestByRegion`
- `relatedQueries`
- `relatedTopics`
- `trendingNow`
- `trendingArticles`
- `dailyTrends` (legacy compatibility)
- `realTimeTrends` (legacy compatibility)

### Experimental Endpoints

- `experimental.trendingNow`
- `experimental.trendingArticles`
- `experimental.geoPicker`
- `experimental.categoryPicker`
- `experimental.topCharts`
- `experimental.interestOverTimeMultirange`
- `experimental.interestOverTimeCsv`
- `experimental.interestOverTimeMultirangeCsv`
- `experimental.interestByRegionCsv`
- `experimental.relatedQueriesCsv`
- `experimental.relatedTopicsCsv`
- `experimental.hotTrendsLegacy`

⚠️ Experimental endpoints are semver-minor unstable because Google can change internal RPC payloads.

ℹ️ `dailyTrends` and `realTimeTrends` are kept for compatibility and may throw `EndpointUnavailableError` if Google retires those legacy routes.

### Operational Caveats (Important)

- Internal/undocumented Google Trends routes can throttle aggressively (`HTTP 429`) even at low request volume.
- Some route families can intermittently fail with `HTTP 400`, `401`, `404`, or `410` depending on backend changes.
- For production use, keep concurrency low, cache aggressively, and use longer backoff windows.
- Prefer the official Google Trends API (alpha) when available for long-lived production integrations.
- Related data endpoints can validly return empty lists for some keywords/time windows.

### Reducing `429` in Practice

`trendsearch` automatically retries on `429`, and when Google sends a `Retry-After` header,
the client respects that wait window before retrying.

Recommended profile for unstable/internal routes:

```ts
import { MemoryCookieStore, createClient } from "trendsearch";

const client = createClient({
  timeoutMs: 30_000,
  retries: {
    maxRetries: 5,
    baseDelayMs: 2_500,
    maxDelayMs: 45_000,
  },
  rateLimit: {
    maxConcurrent: 1,
    minDelayMs: 5_000,
  },
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  cookieStore: new MemoryCookieStore(),
});
```

## 🧰 Client Configuration

Use `createClient` when you want shared runtime defaults and transport controls:

```ts
import { MemoryCookieStore, createClient } from "trendsearch";

const client = createClient({
  timeoutMs: 15_000,
  baseUrl: "https://trends.google.com",
  hl: "en-US",
  tz: 240,
  retries: {
    maxRetries: 3,
    baseDelayMs: 500,
    maxDelayMs: 8_000,
  },
  rateLimit: {
    maxConcurrent: 1,
    minDelayMs: 1_000,
  },
  userAgent:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  cookieStore: new MemoryCookieStore(),
  proxyHook: async ({ url, init }) => ({ url, init }),
});
```

### Default Client Values

- `timeoutMs`: `15000`
- `baseUrl`: `https://trends.google.com`
- `hl`: `en-US`
- `tz`: host timezone offset (`new Date().getTimezoneOffset()`)
- `retries.maxRetries`: `3`
- `retries.baseDelayMs`: `500`
- `retries.maxDelayMs`: `8000`
- `rateLimit.maxConcurrent`: `1`
- `rateLimit.minDelayMs`: `1000`

## 🧪 Request/Response Pattern

All endpoint calls return:

```ts
{
  data: ..., // normalized typed payload
  raw?: ...  // included only when debugRawResponse=true
}
```

Enable raw payload diagnostics per request:

```ts
const result = await client.explore(
  { keywords: ["typescript"], geo: "US" },
  { debugRawResponse: true }
);

console.log(result.raw);
```

## 📚 Endpoint Usage

### `autocomplete`

```ts
import { autocomplete } from "trendsearch";

const result = await autocomplete({ keyword: "typescri" });
console.log(result.data.topics);
```

Input:

- `keyword` (required)
- `hl`, `tz` (optional)

Output:

- `data.topics`: topic list (`mid`, `title`, `type`)

### `explore`

```ts
import { explore } from "trendsearch";

const result = await explore({
  keywords: ["typescript", "javascript"],
  geo: "US",
  time: "today 12-m",
  category: 0,
  property: "",
});

console.log(result.data.widgets);
```

Input:

- `keywords` (required, array)
- `geo` (string or string[])
- `time`, `category`, `property`, `hl`, `tz`

Output:

- `data.widgets`: exploration widgets
- `data.comparisonItem`: normalized comparison items used in `req`

### `interestOverTime`

```ts
import { interestOverTime } from "trendsearch";

const result = await interestOverTime({
  keywords: ["typescript"],
  geo: "US",
  time: "today 3-m",
});

console.log(result.data.timeline);
```

Output:

- `data.timeline`: timeline points (`time`, `value`, `formattedTime`, `isPartial`, ...)

### `interestByRegion`

```ts
import { interestByRegion } from "trendsearch";

const result = await interestByRegion({
  keywords: ["typescript"],
  geo: "US",
  resolution: "REGION",
});

console.log(result.data.regions);
```

Output:

- `data.regions`: geo map entries (`geoCode`, `geoName`, `value`, ...)

### `relatedQueries`

```ts
import { relatedQueries } from "trendsearch";

const result = await relatedQueries({
  keywords: ["typescript"],
  geo: "US",
});

console.log(result.data.top);
console.log(result.data.rising);
```

Output:

- `data.top`
- `data.rising`
- `value` can be `number | string` (`"Breakout"`-style upstream values are preserved)
- `data.top` and `data.rising` may be empty arrays for some requests

### `relatedTopics`

```ts
import { relatedTopics } from "trendsearch";

const result = await relatedTopics({
  keywords: ["typescript"],
  geo: "US",
});

console.log(result.data.top);
console.log(result.data.rising);
```

Output:

- `data.top`
- `data.rising`
- `data.top` and `data.rising` may be empty arrays for some requests

### `dailyTrends`

```ts
import { dailyTrends } from "trendsearch";

const result = await dailyTrends({
  geo: "US",
  category: "all",
});

console.log(result.data.days);
console.log(result.data.trends);
```

Input:

- `geo` (required)
- `category`, `date`, `ns`, `hl`, `tz`

Output:

- `data.days`: day-grouped payload
- `data.trends`: flattened trend list

### `realTimeTrends`

```ts
import { realTimeTrends } from "trendsearch";

const result = await realTimeTrends({
  geo: "US",
  category: "all",
});

console.log(result.data.stories);
```

Input:

- `geo` (required)
- `category`, `fi`, `fs`, `ri`, `rs`, `sort`, `hl`, `tz`

Output:

- `data.stories`: story summaries

### `trendingNow`

```ts
import { trendingNow } from "trendsearch";

const result = await trendingNow({
  geo: "US",
  language: "en",
  hours: 24,
});

console.log(result.data.items[0]?.articleKeys);
```

### `trendingArticles`

```ts
import { trendingArticles } from "trendsearch";

const result = await trendingArticles({
  articleKeys: [[1, "en", "US"]],
  articleCount: 5,
});

console.log(result.data.articles);
```

## 🧪 Experimental Endpoint Usage

`experimental.trendingNow` and `experimental.trendingArticles` are aliases of the stable root methods and remain available for backward compatibility.

### `experimental.geoPicker`

```ts
import { experimental } from "trendsearch";

const result = await experimental.geoPicker({ hl: "en-US" });
console.log(result.data.items);
```

### `experimental.categoryPicker`

```ts
import { experimental } from "trendsearch";

const result = await experimental.categoryPicker({ hl: "en-US" });
console.log(result.data.items);
```

### `experimental.topCharts`

```ts
import { experimental } from "trendsearch";

const result = await experimental.topCharts({
  date: 2024,
  geo: "GLOBAL",
});

console.log(result.data.charts);
console.log(result.data.items);
```

### `experimental.interestOverTimeMultirange`

```ts
import { experimental } from "trendsearch";

const result = await experimental.interestOverTimeMultirange({
  keywords: ["typescript"],
  geo: "US",
  time: "today 3-m",
});

console.log(result.data.timeline);
```

### CSV Variants (`experimental.*Csv`)

```ts
import { experimental } from "trendsearch";

const result = await experimental.relatedQueriesCsv({
  keywords: ["typescript"],
  geo: "US",
});

console.log(result.data.csv);
```

`experimental.interestOverTimeCsv`, `experimental.interestOverTimeMultirangeCsv`,
`experimental.interestByRegionCsv`, `experimental.relatedQueriesCsv`, and
`experimental.relatedTopicsCsv` currently return raw CSV text (`data.csv`) in v1.

### `experimental.hotTrendsLegacy`

```ts
import { experimental } from "trendsearch";

const result = await experimental.hotTrendsLegacy();
console.log(result.data.payload);
```

## 🧾 Schemas and Types

All request/response schemas and inferred types are exported:

```ts
import {
  schemas,
  type InterestOverTimeRequest,
  type InterestOverTimeResponse,
} from "trendsearch";

const req: InterestOverTimeRequest = {
  keywords: ["typescript"],
};

const parsed = schemas.interestOverTimeResponseSchema.parse(rawPayload);
```

`schemas` includes stable + experimental schema exports, plus `z`.

## 🚨 Errors

Typed errors:

- `TrendSearchError`
- `TransportError`
- `RateLimitError`
- `SchemaValidationError`
- `EndpointUnavailableError`
- `UnexpectedResponseError`

Example:

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
    console.error("Rate limited:", error.status);
    console.error("Retry after ms:", error.retryAfterMs);
  }

  if (error instanceof SchemaValidationError) {
    console.error("Schema drift:", error.issues);
  }

  if (error instanceof EndpointUnavailableError) {
    console.error("Legacy endpoint unavailable:", error.replacements);
  }
}
```

## 🧪 Testing and Quality Gates

Run tests:

```bash
bun run test:unit
bun run test:contracts
bun run test:all
TRENDSEARCH_LIVE=1 bun run test:live
```

Live test notes:

- The live suite is intentionally slower (conservative pacing) to reduce `429`.
- Experimental routes are best-effort and can be unavailable depending on backend state.

Package checks:

```bash
bun run build
bun run check:package
bun run check:pack
bun run test:consumer
```

Full local gate:

```bash
bun run check:all
```

## 📼 Fixture Workflow

Record/update fixtures from live endpoints:

```bash
bun run fixtures:record
```

Fixtures are stored under:

- `tests/fixtures/raw/*`

Contract tests use those fixtures for deterministic CI.

## 🤖 CI Notes

- `CI` workflow runs deterministic tests and package quality checks.
- `Live Endpoints` workflow (`.github/workflows/live-endpoints.yml`) runs nightly + manual and executes `test:live`.

## 🔁 Migration

Migrating from `google-trends-api`?

👉 See `MIGRATION.md` for method mapping and before/after examples.

## 🛠️ Development Scripts

- `bun run dev` - watch build
- `bun run build` - build dist
- `bun run typecheck` - TypeScript checks
- `bun run lint` - format/lint checks
- `bun run format` - format/fix
- `bun run changeset` - add release note

## 📄 License

MIT
