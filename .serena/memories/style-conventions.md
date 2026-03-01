# 代码风格与约定

## TypeScript 配置

- strict: true, noUnusedLocals: true
- verbatimModuleSyntax: true（import type 用于纯类型导入）
- ESNext target，ESM-only 模块
- 使用 `import type` 明确区分类型导入和值导入

## 命名约定

- 文件名：kebab-case (e.g., `create-client.ts`, `interest-over-time.ts`)
- 函数/变量：camelCase
- 类型/接口：PascalCase
- 常量：SCREAMING_SNAKE_CASE（部分）或 camelCase

## 端点函数模式

每个端点遵循固定模式：

```ts
export const [endpointName]Endpoint = (
  context: EndpointContext,
  input: [EndpointName]Request,
  options?: EndpointDebugOptions
): Promise<[EndpointName]Response> => { ... }
```

## Schema 定义模式

- 每个端点有对应的 Zod schema 文件在 src/schemas/
- Schema 从 src/schemas/index.ts 统一导出

## 测试约定

- 使用 bun test
- 单元测试: tests/unit/
- 契约测试使用 fixtures（录制的真实响应），不访问网络
- Live 测试需要 `TRENDSEARCH_LIVE=1` 环境变量

## 格式化/Lint

- 格式化工具: oxfmt (via ultracite)
- Lint 工具: oxlint (via ultracite)
- Pre-commit: lint-staged 自动运行 ultracite fix

## 不变性原则

- 创建新对象，不修改现有对象
- 函数式风格
