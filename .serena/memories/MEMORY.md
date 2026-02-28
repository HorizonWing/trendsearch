# trendsearch 项目记忆索引

## 项目基本信息
- **名称**: trendsearch
- **类型**: Google Trends SDK (TypeScript, Node.js/Bun)
- **包管理器**: bun (bun@1.3.9)
- **语言**: TypeScript (strict, ESM-only)

## 记忆文件
- [project-overview.md](project-overview.md) - 项目目的、技术栈、主要功能
- [code-structure.md](code-structure.md) - 目录结构、架构模式
- [style-conventions.md](style-conventions.md) - 代码风格、命名约定、测试约定
- [suggested_commands.md](suggested_commands.md) - 常用开发命令

## 关键路径
- 入口: `src/index.ts`
- 客户端工厂: `src/client/create-client.ts`
- 端点: `src/endpoints/` (稳定) + `src/endpoints/experimental/` (实验性)
- Schema: `src/schemas/`
- CLI: `src/cli/main.ts`
- 测试: `tests/` (unit/contracts/cli/live)

## 任务完成后应执行
1. `bun run typecheck` - 类型检查
2. `bun run lint` - Lint 检查
3. `bun run test:all` - 运行所有测试（不含 live）
4. `bun run build` - 构建（如修改了公开 API）
