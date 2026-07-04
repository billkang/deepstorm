## 1. 修复构建增量更新问题

- [x] 1.1 修改 `packages/cli/src/build-registry.ts` 块 4b（mcp 配置复制，行 351-363）：移除 `fs.existsSync(dest) continue` 跳过检查，`force: false` → `force: true`
- [x] 1.2 修改 `packages/cli/src/build-registry.ts` 块 4c（mcp-skills 复制，行 365-378）：移除 `fs.existsSync(dest) continue` 跳过检查，`force: false` → `force: true`
- [x] 1.3 修改 `packages/cli/src/build-registry.ts` 块 4d（env-examples 复制，行 380-393）：移除 `fs.existsSync(dest) continue` 跳过检查，`force: false` → `force: true`

## 2. 移除 setup 中 context7 默认选中

- [x] 2.1 修改 `packages/cli/src/commands/setup.ts` 第 94 行：将 `['context7']` 改为 `[]`

## 3. 新增 playwright.env-example

- [x] 3.1 创建 `packages/cli/env-examples/playwright.env-example`，包含 `❗已废弃的 Playwright 环境变量（地址现硬编码在 .mcp.json 中）` 的注释和占位值

## 4. 构建验证

- [x] 4.1 运行 `pnpm build` 重新构建
- [x] 4.2 验证 `dist/mcp/docs-reference/context7.json` 包含 `mcpServers` 字段
- [x] 4.3 验证 `dist/env-examples/playwright.env-example` 存在
