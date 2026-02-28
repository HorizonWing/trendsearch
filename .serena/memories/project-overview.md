# trendsearch 项目概述

## 项目目的
trendsearch 是一个现代 Google Trends SDK，适用于 Node.js 和 Bun。基于原生 `fetch`、严格的 Zod 验证和生产友好的客户端 API 构建。

## 技术栈
- **语言**: TypeScript (strict mode)
- **运行时**: Bun (主要) / Node.js >=20
- **包管理器**: bun@1.3.9
- **构建工具**: tsdown
- **测试框架**: bun test
- **Lint/Format**: ultracite (oxlint + oxfmt)
- **类型检查**: tsc
- **Schema 验证**: Zod v4
- **HTTP**: 原生 fetch
- **重试**: p-retry
- **限速**: p-queue
- **CLI**: commander + @clack/prompts
- **版本管理**: changesets

## 主要功能
- Google Trends API 封装（稳定端点 + 实验性端点）
- CLI 工具 (`trendsearch`)
- Cookie 持久化支持
- 内置重试/退避 + 速率限制
- ESM-only 包

## 包信息
- 入口: `./dist/index.mjs`
- 类型: `./dist/index.d.mts`
- ESM-only (不支持 CJS require)
- 默认导出 createClient 及预构建的默认客户端方法
