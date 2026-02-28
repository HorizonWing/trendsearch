# 常用开发命令

## 构建
```bash
bun run build          # 构建项目 (tsdown)
bun run dev            # 开发模式（watch）
```

## 测试
```bash
bun run test           # 运行所有测试 (unit + cli + contracts)
bun run test:unit      # 仅单元测试
bun run test:cli       # 仅 CLI 测试
bun run test:contracts # 仅契约测试（使用 fixtures）
bun run test:live      # Live 端点测试 (需要 TRENDSEARCH_LIVE=1)
```

## Lint / Format / 类型检查
```bash
bun run lint           # 检查 lint (ultracite check)
bun run format         # 自动修复格式 (ultracite fix)
bun run typecheck      # TypeScript 类型检查
```

## 完整检查（发布前）
```bash
bun run check:all      # lint + typecheck + test + build + pack + package + consumer
```

## CLI 调试
```bash
bun run cli -- --help  # 运行 CLI (开发模式)
```

## 发布相关
```bash
bun run changeset           # 创建 changeset
bun run release:status      # 查看发布状态
bun run version-packages    # 更新版本
bun run release             # 发布
```

## Fixtures 录制
```bash
bun run fixtures:record     # 录制测试 fixtures
```
