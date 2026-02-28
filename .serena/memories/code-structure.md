# 代码结构

## 目录布局
```
src/
├── index.ts                    # 公开 API 入口点
├── errors.ts                   # 错误类再导出
├── client/
│   ├── create-client.ts        # createClient() 工厂函数
│   └── public-types.ts         # 公开 TypeScript 类型
├── core/
│   ├── http/
│   │   ├── fetch-json.ts       # HTTP 请求核心 (fetchGoogleJson, fetchText)
│   │   ├── build-url.ts        # URL 构建工具
│   │   ├── strip-prefix.ts     # 响应前缀剥离
│   │   └── validate-schema.ts  # Zod schema 验证
│   ├── resilience/
│   │   ├── retry.ts            # p-retry 封装
│   │   └── rate-limiter.ts     # p-queue 速率限制
│   └── session/
│       └── cookies.ts          # Cookie 持久化 (MemoryCookieStore)
├── endpoints/                  # 稳定端点实现
│   ├── autocomplete.ts
│   ├── explore.ts
│   ├── interest-over-time.ts
│   ├── interest-by-region.ts
│   ├── related-queries.ts
│   ├── related-topics.ts
│   ├── daily-trends.ts
│   ├── real-time-trends.ts
│   ├── shared.ts               # 共享端点工具
│   ├── utils.ts
│   └── experimental/           # 实验性端点
│       ├── trending-now.ts
│       ├── trending-articles.ts
│       ├── category-picker.ts
│       ├── geo-picker.ts
│       ├── top-charts.ts
│       ├── interest-over-time-multirange.ts
│       ├── csv.ts
│       └── hot-trends-legacy.ts
├── schemas/                    # Zod schema 定义
│   ├── index.ts
│   ├── common.ts
│   └── [endpoint-name].ts      # 每个端点对应的 schema
├── parsers/
│   ├── select-widget.ts        # Widget 选择解析器
│   └── parse-batchexecute.ts   # batchexecute 响应解析器
├── errors/                     # 错误类
│   ├── index.ts
│   ├── trendsearch-error.ts
│   ├── rate-limit-error.ts
│   ├── transport-error.ts
│   ├── schema-validation-error.ts
│   ├── endpoint-unavailable-error.ts
│   └── unexpected-response-error.ts
└── cli/                        # CLI 实现
    ├── main.ts
    ├── program.ts
    ├── manifest.ts
    ├── wizard.ts
    ├── output.ts
    ├── errors.ts
    ├── config.ts
    └── completion.ts

tests/
├── unit/                       # 单元测试
├── contracts/                  # 契约测试（使用 fixtures）
├── cli/                        # CLI 测试
├── live/                       # Live 端点测试（需要网络）
├── fixtures/raw/               # 原始响应 fixtures（JSON/text）
└── helpers.ts                  # 测试辅助工具
```

## 架构模式
- **客户端模式**: createClient() 工厂，返回 TrendSearchClient
- **端点函数**: 每个端点是独立函数，接收 context + input + options
- **Schema 验证**: 使用 Zod 对所有响应进行严格验证
- **错误层次**: TrendSearchError 基类 → 各种具体错误类
- **速率限制**: RateLimiter 类封装 p-queue，默认单并发 + 1000ms 延迟
- **重试**: p-retry 封装，默认最多 3 次，指数退避
