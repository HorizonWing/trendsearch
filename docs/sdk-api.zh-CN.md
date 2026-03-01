# TrendSearch SDK 接口文档（中文）

本文档基于包入口 `src/index.ts` 的实际导出整理，覆盖当前 SDK 的全部对外接口。

## 1. 适用范围

- 包名：`@hz/trends`
- 模块格式：ESM
- Node 版本要求：`>=20`
- 入口导出：`import ... from "@hz/trends"`

## 2. 对外导出总览

当前 SDK 从包入口暴露以下运行时接口：

- `createClient(config?)`
- `autocomplete(...)`
- `explore(...)`
- `interestOverTime(...)`
- `interestByRegion(...)`
- `relatedQueries(...)`
- `relatedTopics(...)`
- `dailyTrends(...)`
- `realTimeTrends(...)`
- `trendingNow(...)`
- `trendingArticles(...)`
- `experimental`（实验性命名空间）
- `MemoryCookieStore`
- 错误类：
- `TrendSearchError`
- `RateLimitError`
- `TransportError`
- `SchemaValidationError`
- `UnexpectedResponseError`
- `EndpointUnavailableError`
- `schemas`（Zod schema 集合）

当前 SDK 从包入口暴露以下类型接口：

- 客户端配置与通用类型：
- `CreateClientConfig`
- `TrendSearchClient`
- `EndpointDebugOptions`
- `ResponseCacheConfig`
- `ResponseCacheEndpoint`
- 业务类型（请求/响应/数据结构）：
- `AutocompleteRequest` / `AutocompleteResponse`
- `ExploreRequest` / `ExploreResponse`
- `InterestOverTimeRequest` / `InterestOverTimeResponse`
- `InterestByRegionRequest` / `InterestByRegionResponse`
- `RelatedQueriesRequest` / `RelatedQueriesResponse`
- `RelatedTopicsRequest` / `RelatedTopicsResponse`
- `DailyTrendsRequest` / `DailyTrendsResponse`
- `RealTimeTrendsRequest` / `RealTimeTrendsResponse`
- `TrendingNowRequest` / `TrendingNowResponse`
- `TrendingArticlesRequest` / `TrendingArticlesResponse`
- `TopChartsRequest` / `TopChartsResponse`
- `GeoPickerRequest` / `GeoPickerResponse`
- `CategoryPickerRequest` / `CategoryPickerResponse`
- `HotTrendsLegacyRequest` / `HotTrendsLegacyResponse`
- 其他数据类型：
- `Topic`
- `ExploreWidget`
- `GeoMapData`
- `RelatedQueryItem`
- `RelatedTopicItem`
- `DailyTrendItem`
- `DailyTrendArticle`
- `TrendingNowItem`
- `TrendingArticleItem`
- `TopChart`
- `TopChartListItem`
- `InterestOverTimePoint`
- `InterestOverTimeMultirangePoint`
- `MultirangeColumnData`
- `ArticleKey`
- `GoogleProperty`
- `Resolution`
- `PickerNode`
- `RealTimeStory`

## 3. 核心创建接口

## `createClient(config?)`

用于创建可复用的客户端实例，建议在生产场景统一使用该方式。

```ts
function createClient(config?: CreateClientConfig): TrendSearchClient;
```

### `CreateClientConfig` 关键字段

- `fetch`：自定义 `fetch` 实现。
- `timeoutMs`：请求超时毫秒。
- `baseUrl`：Google Trends 基础地址。
- `hl`：默认语言，如 `en-US`。
- `tz`：默认时区偏移（分钟）。
- `retries`：重试策略，含 `maxRetries/baseDelayMs/maxDelayMs`。
- `rateLimit`：本地速率限制，含 `maxConcurrent/minDelayMs`。
- `adaptiveRateLimit`：429 自适应冷却，含 `baseCooldownMs/maxCooldownMs`。
- `responseCache`：SDK 级响应缓存配置。
- `userAgent`：自定义 UA。
- `cookieStore`：Cookie 存储实现（默认可用 `MemoryCookieStore`）。
- `proxyHook`：请求前 URL/init 改写钩子。

### 默认值（`createClient`）

- `timeoutMs`: `15000`
- `baseUrl`: `https://trends.google.com`
- `hl`: `en-US`
- `tz`: `new Date().getTimezoneOffset()`
- `retries.maxRetries`: `3`
- `retries.baseDelayMs`: `500`
- `retries.maxDelayMs`: `8000`
- `rateLimit.maxConcurrent`: `1`
- `rateLimit.minDelayMs`: `1000`
- `adaptiveRateLimit.baseCooldownMs`: `5000`
- `adaptiveRateLimit.maxCooldownMs`: `300000`
- `responseCache.enabled`: `false`
- `responseCache.ttlMs`: `300000`

## 4. 响应格式约定

所有 endpoint 调用都遵循统一输出外壳：

```ts
type EndpointOutput<TData, TRaw = unknown> = {
  data: TData;
  raw?: TRaw;
};
```

调试选项：

```ts
type EndpointDebugOptions = {
  debugRawResponse?: boolean;
};
```

## 5. 稳定端点接口（`TrendSearchClient`）

下列方法既可通过 `client.xxx()` 调用，也可通过包入口快捷函数直接调用（签名一致）。

## `autocomplete`

```ts
autocomplete(
  input: { keyword: string; hl?: string; tz?: number },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ topics: Topic[] }>>
```

## `explore`

```ts
explore(
  input: {
    keywords: string[];
    geo?: string | string[];
    time?: string;
    category?: number;
    property?: "" | "images" | "news" | "youtube" | "froogle";
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<
  EndpointOutput<{
    widgets: ExploreWidget[];
    comparisonItem: { keyword: string; geo?: string; time: string }[];
  }>
>
```

## `interestOverTime`

```ts
interestOverTime(
  input: {
    keywords: string[];
    geo?: string | string[];
    time?: string;
    category?: number;
    property?: "" | "images" | "news" | "youtube" | "froogle";
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ timeline: InterestOverTimePoint[] }>>
```

## `interestByRegion`

```ts
interestByRegion(
  input: {
    keywords: string[];
    geo?: string | string[];
    time?: string;
    category?: number;
    property?: "" | "images" | "news" | "youtube" | "froogle";
    resolution?: "COUNTRY" | "REGION" | "CITY" | "DMA";
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ regions: GeoMapData[] }>>
```

## `relatedQueries`

```ts
relatedQueries(
  input: {
    keywords: string[];
    geo?: string | string[];
    time?: string;
    category?: number;
    property?: "" | "images" | "news" | "youtube" | "froogle";
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ top: RelatedQueryItem[]; rising: RelatedQueryItem[] }>>
```

## `relatedTopics`

```ts
relatedTopics(
  input: {
    keywords: string[];
    geo?: string | string[];
    time?: string;
    category?: number;
    property?: "" | "images" | "news" | "youtube" | "froogle";
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ top: RelatedTopicItem[]; rising: RelatedTopicItem[] }>>
```

## `dailyTrends`

```ts
dailyTrends(
  input: {
    geo: string;
    category?: string | number;
    date?: string | Date;
    ns?: number;
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<
  EndpointOutput<{
    days: DailyTrendsResponse["default"]["trendingSearchesDays"];
    trends: DailyTrendsResponse["default"]["trendingSearchesDays"][number]["trendingSearches"];
  }>
>
```

## `realTimeTrends`

```ts
realTimeTrends(
  input: {
    geo: string;
    category?: string | number;
    fi?: number;
    fs?: number;
    ri?: number;
    rs?: number;
    sort?: number;
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ stories: Record<string, unknown>[] }>>
```

## `trendingNow`

```ts
trendingNow(
  input: { geo?: string; language?: string; hours?: 4 | 24 | 48 | 168 },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ items: TrendingNowItem[] }>>
```

## `trendingArticles`

```ts
trendingArticles(
  input: { articleKeys: [number, string, string][]; articleCount?: number },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ articles: TrendingArticleItem[] }>>
```

## 6. 实验性端点（`client.experimental`）

`experimental` 下接口可能随 Google 上游变化而调整，建议在生产使用时做好错误兜底和版本锁定。

```ts
experimental.trendingNow(
  input: { geo?: string; language?: string; hours?: 4 | 24 | 48 | 168 },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ items: TrendingNowItem[] }>>

experimental.trendingArticles(
  input: { articleKeys: [number, string, string][]; articleCount?: number },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ articles: TrendingArticleItem[] }>>

experimental.geoPicker(
  input?: { hl?: string },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ items: GeoPickerResponse }>>

experimental.categoryPicker(
  input?: { hl?: string },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ items: CategoryPickerResponse }>>

experimental.topCharts(
  input?: {
    date?: number | string | Date;
    geo?: string;
    isMobile?: boolean;
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ charts: TopChart[]; items: TopChartListItem[] }>>

experimental.interestOverTimeMultirange(
  input: {
    keywords: string[];
    geo?: string | string[];
    time?: string;
    category?: number;
    property?: "" | "images" | "news" | "youtube" | "froogle";
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ timeline: InterestOverTimeMultirangePoint[] }>>

experimental.interestOverTimeCsv(
  input: {
    keywords: string[];
    geo?: string | string[];
    time?: string;
    category?: number;
    property?: "" | "images" | "news" | "youtube" | "froogle";
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ csv: string; contentType?: string }>>

experimental.interestOverTimeMultirangeCsv(
  input: {
    keywords: string[];
    geo?: string | string[];
    time?: string;
    category?: number;
    property?: "" | "images" | "news" | "youtube" | "froogle";
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ csv: string; contentType?: string }>>

experimental.interestByRegionCsv(
  input: {
    keywords: string[];
    geo?: string | string[];
    time?: string;
    category?: number;
    property?: "" | "images" | "news" | "youtube" | "froogle";
    resolution?: "COUNTRY" | "REGION" | "CITY" | "DMA";
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ csv: string; contentType?: string }>>

experimental.relatedQueriesCsv(
  input: {
    keywords: string[];
    geo?: string | string[];
    time?: string;
    category?: number;
    property?: "" | "images" | "news" | "youtube" | "froogle";
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ csv: string; contentType?: string }>>

experimental.relatedTopicsCsv(
  input: {
    keywords: string[];
    geo?: string | string[];
    time?: string;
    category?: number;
    property?: "" | "images" | "news" | "youtube" | "froogle";
    hl?: string;
    tz?: number;
  },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ csv: string; contentType?: string }>>

experimental.hotTrendsLegacy(
  input?: { hl?: string; tz?: number },
  options?: EndpointDebugOptions
): Promise<EndpointOutput<{ payload: HotTrendsLegacyResponse }>>
```

## 7. 响应缓存接口（SDK 级）

缓存配置位于 `CreateClientConfig.responseCache`：

```ts
type ResponseCacheEndpoint =
  | "autocomplete"
  | "explore"
  | "interestOverTime"
  | "interestByRegion"
  | "relatedQueries"
  | "relatedTopics"
  | "dailyTrends"
  | "realTimeTrends"
  | "trendingNow"
  | "trendingArticles"
  | "experimental.trendingNow"
  | "experimental.trendingArticles"
  | "experimental.geoPicker"
  | "experimental.categoryPicker"
  | "experimental.topCharts"
  | "experimental.interestOverTimeMultirange"
  | "experimental.interestOverTimeCsv"
  | "experimental.interestOverTimeMultirangeCsv"
  | "experimental.interestByRegionCsv"
  | "experimental.relatedQueriesCsv"
  | "experimental.relatedTopicsCsv"
  | "experimental.hotTrendsLegacy";

type ResponseCacheConfig = {
  enabled?: boolean;
  ttlMs?: number;
  endpoints?: ResponseCacheEndpoint[];
  ttlByEndpoint?: Partial<Record<ResponseCacheEndpoint, number>>;
};
```

行为说明：

- 默认关闭缓存（`enabled: false`）。
- 仅在同一个 client 实例生命周期内生效（内存缓存）。
- `endpoints` 可做白名单。
- `ttlByEndpoint` 可覆盖默认 TTL。
- 当 `debugRawResponse` 不同时，缓存 key 会区分，不会串数据。

## 8. Cookie 存储接口

## `MemoryCookieStore`

一个内置的内存型 Cookie 存储实现，适合单进程短生命周期任务。

```ts
class MemoryCookieStore implements CookieStore {
  getCookieHeader(url: string): Promise<string | undefined>;
  setCookieHeaders(url: string, setCookieHeaders: string[]): Promise<void>;
}
```

如需跨进程持久化，你可以自行实现 `CookieStore` 接口并注入 `createClient({ cookieStore })`。

## 9. 错误模型

所有 SDK 错误都继承 `TrendSearchError`，并带有 `code` 字段。

## `TrendSearchError`

- 字段：`name`、`message`、`code`

## `RateLimitError`

- `code`: `RATE_LIMIT_ERROR`
- 字段：`url`、`status`（默认 429）、`retryAfterMs?`

## `TransportError`

- `code`: `TRANSPORT_ERROR`
- 字段：`url`、`status?`、`responseBody?`

## `SchemaValidationError`

- `code`: `SCHEMA_VALIDATION_ERROR`
- 字段：`endpoint`、`issues[]`

## `UnexpectedResponseError`

- `code`: `UNEXPECTED_RESPONSE_ERROR`
- 字段：`endpoint`

## `EndpointUnavailableError`

- `code`: `ENDPOINT_UNAVAILABLE_ERROR`
- 字段：`endpoint`、`status?`、`replacements[]`

## 10. 使用建议

- 需要可控重试/限流/缓存时，优先使用 `createClient`。
- 包入口快捷方法使用默认 client，无法注入你的自定义参数。
- 对 `experimental` 接口要显式处理降级和失败重试。
- 在批量请求场景下，建议配置 `rateLimit.maxConcurrent: 1`。
- 在批量请求场景下，建议配置 `rateLimit.minDelayMs: 3000~6000`。
- 在批量请求场景下，建议启用 `adaptiveRateLimit` 并设置较高 `maxCooldownMs`。
- 在批量请求场景下，建议结合 `MemoryCookieStore` 提高会话稳定性。
