# trendsearch API 文档

> **版本**: 0.1.0 · **运行时**: Node.js ≥20 / Bun ≥1.3.9 · **模块系统**: ESM-only

---

## 目录

- [快速开始](#快速开始)
- [createClient](#createclient)
  - [CreateClientConfig](#createclientconfig)
- [稳定端点](#稳定端点)
  - [autocomplete](#autocomplete)
  - [explore](#explore)
  - [interestOverTime](#interestovertime)
  - [interestByRegion](#interestbyregion)
  - [relatedQueries](#relatedqueries)
  - [relatedTopics](#relatedtopics)
  - [dailyTrends](#dailytrends)
  - [realTimeTrends](#realtimetrends)
  - [trendingNow](#trendingnow)
  - [trendingArticles](#trendingarticles)
- [实验性端点](#实验性端点-experimental)
  - [experimental.trendingNow](#experimentaltrendingnow)
  - [experimental.trendingArticles](#experimentaltrendingarticles)
  - [experimental.geoPicker](#experimentalgeopicker)
  - [experimental.categoryPicker](#experimentalcategorypicker)
  - [experimental.topCharts](#experimentaltopcharts)
  - [experimental.interestOverTimeMultirange](#experimentalinterestovertimemultirange)
  - [CSV 系列端点](#csv-系列端点)
  - [experimental.hotTrendsLegacy](#experimentalhottrends)
- [类型定义](#类型定义)
- [错误处理](#错误处理)
- [高级用法](#高级用法)

---

## 快速开始

```ts
// 方式一：使用默认客户端（直接导入端点函数）
import { interestOverTime } from "trendsearch";

const result = await interestOverTime({
  keywords: ["typescript"],
  geo: "US",
  time: "today 3-m",
});

console.log(result.data.timeline.length);

// 方式二：创建自定义客户端
import { createClient } from "trendsearch";

const client = createClient({
  hl: "zh-CN",
  tz: -480,
  retries: { maxRetries: 5 },
  rateLimit: { minDelayMs: 2000 },
});

const result2 = await client.interestOverTime({
  keywords: ["typescript", "javascript"],
  geo: "CN",
});
```

---

## createClient

```ts
import { createClient } from "trendsearch";

const client = createClient(config?: CreateClientConfig): TrendSearchClient
```

创建一个配置好的 Google Trends 客户端实例。所有配置项均可选，未提供时使用默认值。

### CreateClientConfig

| 参数          | 类型                      | 默认值                        | 说明                                |
| ------------- | ------------------------- | ----------------------------- | ----------------------------------- |
| `fetch`       | `typeof globalThis.fetch` | 全局 `fetch`                  | 自定义 fetch 实现                   |
| `timeoutMs`   | `number`                  | `15000`                       | 请求超时时间（毫秒）                |
| `baseUrl`     | `string`                  | `"https://trends.google.com"` | API 基础 URL                        |
| `hl`          | `string`                  | `"en-US"`                     | 界面语言（如 `"zh-CN"`、`"ja"`）    |
| `tz`          | `number`                  | 系统时区偏移                  | 时区偏移（分钟，北京时间为 `-480`） |
| `retries`     | `RetryConfig`             | 见下方                        | 重试配置                            |
| `rateLimit`   | `RateLimitConfig`         | 见下方                        | 速率限制配置                        |
| `userAgent`   | `string`                  | —                             | 自定义 User-Agent                   |
| `cookieStore` | `CookieStore`             | —                             | Cookie 持久化存储                   |
| `proxyHook`   | `ProxyHook`               | —                             | 请求代理钩子                        |

### RetryConfig

| 参数          | 类型     | 默认值 | 说明                 |
| ------------- | -------- | ------ | -------------------- |
| `maxRetries`  | `number` | `3`    | 最大重试次数         |
| `baseDelayMs` | `number` | `500`  | 初始退避延迟（毫秒） |
| `maxDelayMs`  | `number` | `8000` | 最大退避延迟（毫秒） |

### RateLimitConfig

| 参数            | 类型     | 默认值 | 说明                       |
| --------------- | -------- | ------ | -------------------------- |
| `maxConcurrent` | `number` | `1`    | 最大并发请求数             |
| `minDelayMs`    | `number` | `1000` | 两次请求间最小间隔（毫秒） |

---

## 公共参数说明

以下参数在多个端点中通用：

| 参数       | 类型                 | 说明                                        |
| ---------- | -------------------- | ------------------------------------------- |
| `keywords` | `string[]`           | 搜索关键词数组，至少 1 个                   |
| `geo`      | `string \| string[]` | 地区代码（如 `"US"`、`"CN"`）；省略则为全球 |
| `time`     | `string`             | 时间范围，见下表                            |
| `category` | `number`             | 类别 ID（整数，`0` 表示全部）               |
| `property` | `GoogleProperty`     | 搜索属性                                    |
| `hl`       | `string`             | 覆盖客户端语言设置                          |
| `tz`       | `number`             | 覆盖客户端时区设置                          |

### 时间范围格式

| 值                        | 含义                |
| ------------------------- | ------------------- |
| `"now 1-H"`               | 过去 1 小时         |
| `"now 4-H"`               | 过去 4 小时         |
| `"now 1-d"`               | 过去 1 天           |
| `"now 7-d"`               | 过去 7 天           |
| `"today 1-m"`             | 过去 1 个月         |
| `"today 3-m"`             | 过去 3 个月（默认） |
| `"today 12-m"`            | 过去 12 个月        |
| `"today 5-y"`             | 过去 5 年           |
| `"all"`                   | 所有时间            |
| `"2020-01-01 2021-01-01"` | 自定义日期范围      |

### GoogleProperty

| 值          | 含义             |
| ----------- | ---------------- |
| `""`        | 网页搜索（默认） |
| `"images"`  | 图片搜索         |
| `"news"`    | 新闻搜索         |
| `"youtube"` | YouTube          |
| `"froogle"` | Google 购物      |

---

## 端点调试选项

所有端点均接受可选的第二个参数 `options`：

```ts
interface EndpointDebugOptions {
  debugRawResponse?: boolean; // true 时，result.raw 包含原始响应
}
```

所有端点返回 `Promise<EndpointOutput<TData>>`：

```ts
interface EndpointOutput<TData, TRaw = unknown> {
  data: TData; // 解析并 Zod 验证后的数据
  raw?: TRaw; // 原始响应（仅在 debugRawResponse: true 时存在）
}
```

---

## 稳定端点

### autocomplete

自动补全关键词，获取 Google 知识图谱主题建议。

```ts
client.autocomplete(input, options?)
```

**输入参数**

| 参数      | 类型     | 必填 | 说明       |
| --------- | -------- | ---- | ---------- |
| `keyword` | `string` | 是   | 搜索关键词 |
| `hl`      | `string` | 否   | 语言       |
| `tz`      | `number` | 否   | 时区       |

**返回值** `Promise<EndpointOutput<{ topics: Topic[] }>>`

```ts
interface Topic {
  mid: string; // Google 知识图谱 ID
  title: string; // 主题名称
  type: string; // 主题类型（如 "Programming language"）
}
```

**示例**

```ts
const result = await client.autocomplete({ keyword: "react" });
console.log(result.data.topics[0]); // { mid: "/m/012l1vxv", title: "React", type: "..." }
```

---

### explore

获取 Google Trends Explore 的原始 widget 数据，用于高级场景或自定义查询。

```ts
client.explore(input, options?)
```

**输入参数**（[通用参数](#公共参数说明)）

**返回值**

```ts
Promise<
  EndpointOutput<{
    widgets: ExploreWidget[];
    comparisonItem: { keyword: string; geo?: string; time: string }[];
  }>
>;
```

---

### interestOverTime

获取关键词随时间变化的搜索兴趣趋势（0-100 相对值）。

```ts
client.interestOverTime(input, options?)
```

**输入参数**（[通用参数](#公共参数说明)）

**返回值** `Promise<EndpointOutput<{ timeline: InterestOverTimePoint[] }>>`

```ts
interface InterestOverTimePoint {
  time: string; // Unix 时间戳字符串
  formattedTime?: string; // 格式化时间（如 "Jan 1, 2024"）
  formattedAxisTime?: string; // 坐标轴标签
  value: number[]; // 各关键词兴趣值（0-100），与 keywords 顺序对应
  formattedValue?: (string | number)[]; // 格式化值
  hasData?: boolean[]; // 是否有数据
  isPartial?: boolean | string; // 是否为不完整数据（当前时间段）
}
```

**示例**

```ts
const result = await client.interestOverTime({
  keywords: ["vue", "react", "angular"],
  geo: "US",
  time: "today 12-m",
});

for (const point of result.data.timeline) {
  console.log(point.formattedTime, point.value); // "Jan 2024" [45, 80, 20]
}
```

---

### interestByRegion

获取按地理区域分布的搜索兴趣数据。

```ts
client.interestByRegion(input, options?)
```

**输入参数**

| 参数         | 类型                                       | 必填 | 说明       |
| ------------ | ------------------------------------------ | ---- | ---------- |
| `keywords`   | `string[]`                                 | 是   | 关键词     |
| `geo`        | `string \| string[]`                       | 否   | 地区       |
| `time`       | `string`                                   | 否   | 时间范围   |
| `category`   | `number`                                   | 否   | 类别 ID    |
| `property`   | `GoogleProperty`                           | 否   | 搜索属性   |
| `resolution` | `"COUNTRY" \| "REGION" \| "CITY" \| "DMA"` | 否   | 地图分辨率 |
| `hl`         | `string`                                   | 否   | 语言       |
| `tz`         | `number`                                   | 否   | 时区       |

**Resolution 说明**

| 值          | 含义                   |
| ----------- | ---------------------- |
| `"COUNTRY"` | 按国家（默认全球范围） |
| `"REGION"`  | 按省/州                |
| `"CITY"`    | 按城市                 |
| `"DMA"`     | 按美国市场区域（DMA）  |

**返回值** `Promise<EndpointOutput<{ regions: GeoMapData[] }>>`

```ts
interface GeoMapData {
  geoCode?: string; // 地区代码（如 "US-CA"）
  geoName: string; // 地区名称（如 "California"）
  value: number[]; // 各关键词兴趣值（0-100）
  formattedValue?: string[]; // 格式化值
  hasData?: boolean[]; // 是否有数据
  maxValueIndex?: number; // 兴趣值最高的关键词索引
  coordinates?: { lat: number; lng: number };
}
```

**示例**

```ts
const result = await client.interestByRegion({
  keywords: ["typescript"],
  geo: "US",
  resolution: "REGION",
});

for (const region of result.data.regions) {
  console.log(region.geoName, region.value[0]); // "California" 85
}
```

---

### relatedQueries

获取与关键词相关的搜索词（按热度 top 和增长速度 rising 分组）。

```ts
client.relatedQueries(input, options?)
```

**输入参数**（[通用参数](#公共参数说明)）

**返回值** `Promise<EndpointOutput<{ top: RelatedQueryItem[]; rising: RelatedQueryItem[] }>>`

```ts
interface RelatedQueryItem {
  query: string; // 相关查询词
  value: number; // top: 0-100 热度；rising: 增长百分比
  formattedValue?: string; // 格式化值（如 "+850%"、"Breakout"）
  hasData?: boolean;
  link?: string; // Google Trends 详情链接
}
```

**示例**

```ts
const result = await client.relatedQueries({
  keywords: ["bun runtime"],
  geo: "US",
});

console.log(
  "热门:",
  result.data.top.slice(0, 3).map((q) => q.query)
);
console.log(
  "飙升:",
  result.data.rising.slice(0, 3).map((q) => q.query)
);
```

---

### relatedTopics

获取与关键词相关的知识图谱主题（按热度和增长速度分组）。

```ts
client.relatedTopics(input, options?)
```

**输入参数**（[通用参数](#公共参数说明)）

**返回值** `Promise<EndpointOutput<{ top: RelatedTopicItem[]; rising: RelatedTopicItem[] }>>`

```ts
interface RelatedTopicItem {
  topic: {
    mid: string; // 知识图谱 ID
    title: string; // 主题名称
    type: string; // 主题类型
  };
  value: number | string;
  formattedValue?: string;
  hasData?: boolean;
  link?: string;
}
```

---

### dailyTrends

获取指定地区的每日热门搜索趋势。

```ts
client.dailyTrends(input, options?)
```

**输入参数**

| 参数       | 类型               | 必填 | 说明                       |
| ---------- | ------------------ | ---- | -------------------------- |
| `geo`      | `string`           | 是   | 地区代码（如 `"US"`）      |
| `category` | `string \| number` | 否   | 类别                       |
| `date`     | `string \| Date`   | 否   | 日期（ISO 格式），默认今日 |
| `ns`       | `number`           | 否   | 新闻服务 ID                |
| `hl`       | `string`           | 否   | 语言                       |
| `tz`       | `number`           | 否   | 时区                       |

**返回值**

```ts
Promise<
  EndpointOutput<{
    days: TrendingSearchDay[]; // 按日分组
    trends: DailyTrendItem[]; // 扁平化条目（第一天数据）
  }>
>;

interface DailyTrendItem {
  title: { query: string }; // 热搜词
  formattedTraffic?: string; // 搜索量（如 "200K+"）
  relatedQueries?: string[];
  image?: {
    newsUrl?: string;
    source?: string;
    imageUrl?: string;
  };
  articles?: Array<{
    title?: string;
    timeAgo?: string;
    source?: string;
    url?: string;
    snippet?: string;
  }>;
}
```

**示例**

```ts
const result = await client.dailyTrends({ geo: "US" });

for (const trend of result.data.trends) {
  console.log(trend.title.query, trend.formattedTraffic);
}
```

---

### realTimeTrends

获取实时热门新闻故事。

```ts
client.realTimeTrends(input, options?)
```

**输入参数**

| 参数       | 类型               | 必填 | 说明         |
| ---------- | ------------------ | ---- | ------------ |
| `geo`      | `string`           | 是   | 地区代码     |
| `category` | `string \| number` | 否   | 类别         |
| `fi`       | `number`           | 否   | 内部过滤参数 |
| `fs`       | `number`           | 否   | 内部过滤参数 |
| `ri`       | `number`           | 否   | 结果数量参数 |
| `rs`       | `number`           | 否   | 结果数量参数 |
| `sort`     | `number`           | 否   | 排序方式     |
| `hl`       | `string`           | 否   | 语言         |
| `tz`       | `number`           | 否   | 时区         |

**返回值** `Promise<EndpointOutput<{ stories: Record<string, unknown>[] }>>`

每条 story 包含：`id`、`title`、`entityNames`、`image`、`articles` 等字段（结构因 Google API 而异）。

---

### trendingNow

获取当前热门搜索词列表。

```ts
client.trendingNow(input?, options?)
```

**输入参数**

| 参数       | 类型                   | 必填 | 默认值 | 说明             |
| ---------- | ---------------------- | ---- | ------ | ---------------- |
| `geo`      | `string`               | 否   | `"US"` | 地区代码         |
| `language` | `string`               | 否   | `"en"` | 语言代码         |
| `hours`    | `4 \| 24 \| 48 \| 168` | 否   | `24`   | 时间窗口（小时） |

**返回值** `Promise<EndpointOutput<{ items: TrendingNowItem[] }>>`

```ts
interface TrendingNowItem {
  keyword: string; // 热门关键词
  traffic: number; // 搜索量
  trafficGrowthRate: number; // 增长率
  activeTime: string; // 活跃时间
  relatedKeywords: string[]; // 相关关键词
  articleKeys: [number, string, string][]; // 文章标识符（供 trendingArticles 使用）
}
```

**示例**

```ts
const result = await client.trendingNow({ geo: "JP", hours: 24 });

for (const item of result.data.items) {
  console.log(item.keyword, item.traffic);
}
```

---

### trendingArticles

根据文章标识符批量获取热门文章内容。通常配合 `trendingNow` 使用。

```ts
client.trendingArticles(input, options?)
```

**输入参数**

| 参数           | 类型                         | 必填 | 说明                                  |
| -------------- | ---------------------------- | ---- | ------------------------------------- |
| `articleKeys`  | `[number, string, string][]` | 是   | 从 `TrendingNowItem.articleKeys` 获取 |
| `articleCount` | `number`                     | 否   | 每个 key 返回的文章数量               |

**返回值** `Promise<EndpointOutput<{ articles: TrendingArticleItem[] }>>`

**示例**

```ts
const trending = await client.trendingNow({ geo: "US" });
const keys = trending.data.items
  .flatMap((item) => item.articleKeys)
  .slice(0, 10);
const articles = await client.trendingArticles({ articleKeys: keys });
```

---

## 实验性端点（experimental）

> **注意**: 实验性端点调用非官方 Google API，结构可能随时变化，不保证稳定性。

通过 `client.experimental.*` 访问，或使用默认客户端导出：

```ts
import { experimental } from "trendsearch";
```

---

### experimental.trendingNow

功能同 [`trendingNow`](#trendingnow)，使用实验性请求路径。参数与返回值完全相同。

---

### experimental.trendingArticles

功能同 [`trendingArticles`](#trendingarticles)，使用实验性请求路径。参数与返回值完全相同。

---

### experimental.geoPicker

获取所有可用地区列表（用于填充地区选择器 UI）。

```ts
client.experimental.geoPicker(input?, options?)
```

| 参数 | 类型     | 必填 | 说明 |
| ---- | -------- | ---- | ---- |
| `hl` | `string` | 否   | 语言 |

**返回值** `Promise<EndpointOutput<{ items: GeoPickerResponse }>>`

---

### experimental.categoryPicker

获取所有可用类别列表（用于填充类别选择器 UI）。

```ts
client.experimental.categoryPicker(input?, options?)
```

| 参数 | 类型     | 必填 | 说明 |
| ---- | -------- | ---- | ---- |
| `hl` | `string` | 否   | 语言 |

**返回值** `Promise<EndpointOutput<{ items: CategoryPickerResponse }>>`

---

### experimental.topCharts

获取 Google Trends 年度/月度 Top Charts 榜单。

```ts
client.experimental.topCharts(input?, options?)
```

**输入参数**

| 参数       | 类型                       | 必填 | 说明                                     |
| ---------- | -------------------------- | ---- | ---------------------------------------- |
| `date`     | `number \| string \| Date` | 否   | 年份整数（如 `2023`）、ISO 字符串或 Date |
| `geo`      | `string`                   | 否   | 地区代码                                 |
| `isMobile` | `boolean`                  | 否   | 是否返回移动端格式                       |
| `hl`       | `string`                   | 否   | 语言                                     |
| `tz`       | `number`                   | 否   | 时区                                     |

**返回值** `Promise<EndpointOutput<{ charts: TopChart[]; items: TopChartListItem[] }>>`

```ts
interface TopChart {
  date?: string;
  formattedDate?: string;
  listItems: TopChartListItem[];
}

interface TopChartListItem {
  title?: string;
  value?: number;
  formattedValue?: string;
}
```

**示例**

```ts
const result = await client.experimental.topCharts({ date: 2023, geo: "US" });

for (const chart of result.data.charts) {
  console.log(chart.formattedDate, chart.listItems.slice(0, 5));
}
```

---

### experimental.interestOverTimeMultirange

获取跨多个时间段的搜索兴趣数据（多范围对比）。

```ts
client.experimental.interestOverTimeMultirange(input, options?)
```

**输入参数**（同[通用参数](#公共参数说明)）

**返回值** `Promise<EndpointOutput<{ timeline: InterestOverTimeMultirangePoint[] }>>`

---

### CSV 系列端点

以下端点均返回 CSV 格式原始数据，适用于数据导出场景：

| 端点                                                | 说明                                     |
| --------------------------------------------------- | ---------------------------------------- |
| `experimental.interestOverTimeCsv(input)`           | 随时间变化的兴趣数据（CSV）              |
| `experimental.interestOverTimeMultirangeCsv(input)` | 多时间段兴趣数据（CSV）                  |
| `experimental.interestByRegionCsv(input)`           | 按地区兴趣数据（CSV，支持 `resolution`） |
| `experimental.relatedQueriesCsv(input)`             | 相关查询词数据（CSV）                    |
| `experimental.relatedTopicsCsv(input)`              | 相关主题数据（CSV）                      |

所有 CSV 端点返回：`Promise<EndpointOutput<{ csv: string; contentType?: string }>>`

**示例**

```ts
import { writeFileSync } from "fs";

const result = await client.experimental.interestOverTimeCsv({
  keywords: ["typescript"],
  geo: "US",
  time: "today 12-m",
});

writeFileSync("trends.csv", result.data.csv, "utf-8");
```

---

### experimental.hotTrendsLegacy

获取热门趋势（遗留端点，格式与现代端点不同）。

```ts
client.experimental.hotTrendsLegacy(input?, options?)
```

| 参数 | 类型     | 必填 | 说明 |
| ---- | -------- | ---- | ---- |
| `hl` | `string` | 否   | 语言 |
| `tz` | `number` | 否   | 时区 |

**返回值** `Promise<EndpointOutput<{ payload: HotTrendsLegacyResponse }>>`

---

## 类型定义

### CookieStore

用于在请求间持久化 session cookie，提升请求稳定性：

```ts
interface CookieStore {
  getCookieHeader(url: string): Promise<string | undefined>;
  setCookieHeaders(url: string, setCookieHeaders: string[]): Promise<void>;
}
```

内置 `MemoryCookieStore`（内存存储，进程结束后丢失）：

```ts
import { MemoryCookieStore, createClient } from "trendsearch";

const client = createClient({
  cookieStore: new MemoryCookieStore(),
});
```

### ProxyHook

拦截并修改每次请求的 URL 和 init 参数，用于实现代理：

```ts
type ProxyHook = (input: {
  url: string;
  init: RequestInit;
}) =>
  | { url?: string; init?: RequestInit }
  | Promise<{ url?: string; init?: RequestInit }>;
```

**示例**

```ts
const client = createClient({
  proxyHook: ({ url, init }) => ({
    url: `https://my-proxy.example.com/fetch?target=${encodeURIComponent(url)}`,
    init,
  }),
});
```

---

## 错误处理

所有端点均可能抛出以下错误类，全部继承自 `TrendSearchError`：

```ts
import {
  TrendSearchError,
  TransportError,
  RateLimitError,
  SchemaValidationError,
  UnexpectedResponseError,
  EndpointUnavailableError,
} from "trendsearch";
```

| 错误类                     | 触发场景                           |
| -------------------------- | ---------------------------------- |
| `TrendSearchError`         | 所有 trendsearch 错误的基类        |
| `TransportError`           | 网络错误、超时、fetch 失败         |
| `RateLimitError`           | 超出速率限制（HTTP 429）           |
| `SchemaValidationError`    | 响应数据不符合 Zod schema 定义     |
| `UnexpectedResponseError`  | 非预期的 HTTP 状态码或响应格式     |
| `EndpointUnavailableError` | 端点不可用（如必要 widget 未找到） |

**错误处理示例**

```ts
import {
  interestOverTime,
  TrendSearchError,
  RateLimitError,
  SchemaValidationError,
} from "trendsearch";

try {
  const result = await interestOverTime({
    keywords: ["typescript"],
    geo: "US",
  });
  console.log(result.data.timeline);
} catch (error) {
  if (error instanceof RateLimitError) {
    console.error("请求过于频繁，请稍后重试");
  } else if (error instanceof SchemaValidationError) {
    console.error("响应格式异常:", error.message);
  } else if (error instanceof TrendSearchError) {
    console.error("趋势搜索错误:", error.message);
  } else {
    throw error;
  }
}
```

---

## 高级用法

### 访问原始响应

```ts
const result = await client.interestOverTime(
  { keywords: ["typescript"] },
  { debugRawResponse: true }
);

console.log(result.raw); // 原始 Google Trends API 响应对象
```

### 多关键词对比

```ts
const result = await client.interestOverTime({
  keywords: ["typescript", "javascript", "python"],
  geo: "US",
  time: "today 12-m",
});

// value 数组长度与 keywords 数组一致
for (const point of result.data.timeline) {
  const [ts, js, py] = point.value;
  console.log(point.formattedTime, { ts, js, py });
}
```

### 多地区对比

```ts
// geo 支持字符串数组，实现跨地区对比
const result = await client.interestOverTime({
  keywords: ["bun"],
  geo: ["US", "JP", "DE"],
  time: "today 3-m",
});
```

### 完整工作流示例

```ts
import { createClient, MemoryCookieStore } from "trendsearch";

const client = createClient({
  hl: "zh-CN",
  tz: -480, // 北京时间 UTC+8
  cookieStore: new MemoryCookieStore(),
  rateLimit: { minDelayMs: 2000 },
  retries: { maxRetries: 5, maxDelayMs: 15000 },
});

// 1. 自动补全获取规范关键词
const suggestions = await client.autocomplete({ keyword: "人工智能" });
const keyword = suggestions.data.topics[0]?.title ?? "人工智能";

// 2. 时间趋势
const timeline = await client.interestOverTime({
  keywords: [keyword],
  geo: "CN",
  time: "today 12-m",
});

// 3. 地区分布
const regions = await client.interestByRegion({
  keywords: [keyword],
  geo: "CN",
  resolution: "REGION",
});

// 4. 相关查询
const queries = await client.relatedQueries({
  keywords: [keyword],
  geo: "CN",
});

console.log("时间线数据点数:", timeline.data.timeline.length);
console.log("地区数:", regions.data.regions.length);
console.log(
  "热门相关查询:",
  queries.data.top.slice(0, 5).map((q) => q.query)
);
```
