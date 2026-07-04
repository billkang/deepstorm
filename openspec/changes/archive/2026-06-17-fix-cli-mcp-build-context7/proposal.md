## Why

修复 CLI 包中 MCP 配置构建和生成的两处问题，确保 setup 流程产出的 `.mcp.json` 包含完整且正确的 MCP server 配置，同时调整默认行为以避免不必要的依赖选择。

## What Changes

1. **修复构建增量更新问题** — `build-registry.ts` 中 mcp 目录和 env-examples 目录的复制使用 `force: false` + `fs.existsSync(dest) continue`，导致源文件更新后不会被重新复制到 `dist/`，后续构建产出的 `dist/mcp/` 中 `context7.json` 缺少 `mcpServers` 字段
2. **调整 setup 默认选中值** — `setup.ts` 第 94 行的 `runWizardFlow(reader, registry, ['context7'])` 将 context7 设为默认预选，用户希望 setup 阶段不强制推荐 context7
3. **新增 playwright.env-example** — `env-examples/` 目录缺少 `playwright.env-example`，导致选中 playwright 时 `❗已废弃的 Playwright 环境变量（地址现硬编码在 .mcp.json 中）` 不会写入项目 `.env`
4. **验证 context7 运行时 token 依赖链** — 确认 `context7.env-example` → `.env` 生成 → `dotenv-cli` 加载的整条链路畅通

## Capabilities

### New Capabilities
- 无（这是修复类变更，不引入新能力）

### Modified Capabilities
- `mcp-server-config`: MCP server 配置的构建方式发生变更（增量复制改为覆盖复制）
- `setup-wizard`: setup 交互流程中 context7 的默认行为变更

## Impact

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `packages/cli/src/build-registry.ts` | 修改 | mcp 和 env-examples 目录复制逻辑：移除 `force: false` + `existsSync` 跳过，改为强制覆盖 |
| `packages/cli/src/commands/setup.ts` | 修改 | 移除/调整 context7 默认预选值 |
| `packages/cli/env-examples/playwright.env-example` | **新增** | 新增 playwright 环境变量模板 |
