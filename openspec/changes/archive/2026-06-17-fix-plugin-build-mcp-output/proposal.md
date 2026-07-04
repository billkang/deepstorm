## Why

`plugin build` 命令输出的 MCP 相关配置文件（`.env.example` 和 `.mcp.json`）存在多处不完整问题，导致用户选择了 MCP 服务后，生成的配置文件中缺少对应的环境变量模板和 MCP 服务器定义。用户需要手动补全，违背了 plugin build "一键生成完整插件" 的设计目标。

## What Changes

1. **修改 `plugin-builder.ts` 中 env-example 文件扩展名引用**（第 102 行）：将 `${mcpName}.md` 修正为 `${mcpName}.env-example`，使 `.env.example` 能正确读取并聚合所有选中 MCP 服务的环境变量模板
2. **为 `context7.json` 补充 `mcpServers` 字段**：添加 `@upstash/context7-mcp` 的 npx 启动配置，使 `.mcp.json` 能正确产出 `deepstorm-context7` 服务定义
3. **手动补全 `test-project/.env` 中缺失的 Playwright 环境变量**：添加 `❗已废弃的 Playwright 环境变量（地址现硬编码在 .mcp.json 中）` 配置段

## Capabilities

### New Capabilities

- `plugin-build-mcp-config`: 确保 plugin build 能根据用户选择的 MCP 服务正确生成 `.env.example`（环境变量模板）和 `.mcp.json`（MCP 服务器定义），输出完整且可用的配置文件

### Modified Capabilities

（无。不涉及 spec 级别的行为变更，属于实现层面的 Bug 修复。）

## Impact

| 模块 | 影响 |
|------|------|
| `packages/cli/src/engine/plugin-builder.ts` | 第 102 行——环境变量模板文件扩展名校正 |
| `packages/cli/mcp/docs-reference/context7.json` | 新增 `mcpServers` 字段 |
| `packages/cli/test-project/.env` | 手动添加 Playwright 环境变量段 |

修复后以下文件将自动生效（需重建或重跑 setup）：
- `.deepstorm/plugins/deepstorm/.env.example` — 包含 figma/github/jira/context7 的 env stub
- `.deepstorm/plugins/deepstorm/.mcp.json` — 新增 `deepstorm-context7`
- 根目录 `.mcp.json`、`test-project/.mcp.json` — 下次 `deepstorm setup`/`pnpm test:setup` 后自动包含
