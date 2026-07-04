## Context

`plugin build` 命令通过 `buildPlugin()` 函数将 MCP 配置信息输出到 `.deepstorm/plugins/deepstorm/` 目录。当前存在两处 Bug：

1. `buildPlugin()` 在读取环境变量模板文件时使用 `.md` 扩展名（第 102 行），但 `env-examples/` 目录下的文件实际使用 `.env-example` 扩展名
2. `context7.json` 缺少 `mcpServers` 字段，导致 `readMcpServerConfig()` 无法为该服务生成 MCP 服务器定义

另外，`test-project/.env` 作为手动维护的示例文件，漏掉了 Playwright 的 `❗已废弃的 Playwright 环境变量（地址现硬编码在 .mcp.json 中）` 环境变量。

## Goals / Non-Goals

### Goals
- `plugin build` 输出的 `.env.example` 包含所有选中 MCP 服务对应的环境变量模板
- `plugin build` 输出的 `.mcp.json` 包含所有选中 MCP 服务（包括 context7）的服务器定义
- `test-project/.env` 包含 Playwright 的配置段

### Non-Goals
- 不修改 `setup.ts` 中 `loadMcpServerConfigs()` 的逻辑
- 不重构 env-example 文件的读取机制
- 不改变 `test-project/run.sh` 或 `mergeMcpServers()` 的数据流

## Decisions

| 决策 | 选择 | 理由 |
|------|------|------|
| Bug A 修复方案 | `plugin-builder.ts:102` 将 `.md` 改为 `.env-example` | 最小改动，其他文件命名规范一致 |
| Bug B 修复方案 | 在 `context7.json` 中新增 `mcpServers` 字段 | 与其他 MCP JSON 结构统一，无需修改代码逻辑 |
| Bug C 修复方案 | 手动编辑 `test-project/.env` | 该文件非自动生成，手动维护最直接 |

### context7 MCP 启动方式

参考 `@upstash/context7-mcp` 的 stdio 模式，复用与其他 MCP 服务一致的 `dotenv-cli` 模式：

```json
{
  "mcpServers": {
    "context7": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "dotenv-cli",
        "-e",
        ".env",
        "--",
        "npx",
        "-y",
        "@upstash/context7-mcp"
      ]
    }
  }
}
```

与 `jira.json`、`figma.json` 的 `mcpServers` 结构完全一致，仅替换启动包名。

### 验证方式

| 验证项 | 方法 |
|--------|------|
| `.env.example` 完整性 | `pnpm build && pnpm cli plugin build` 后检查输出文件 |
| `.mcp.json` 完整性 | 同上，检查 `deepstorm-context7` 条目 |
| test-project `.env` | 直接查看文件内容 |

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| context7 MCP 启动命令未来可能变更 | plugin 产出过时配置 | 当 `@upstash/context7-mcp` 更新时对应更新 `context7.json` |
| `env-examples/` 文件名约定变更 | 再次断裂 | 考虑未来将扩展名常量提取为配置，但当前阶段最小改动足够 |
