# Brainstorming Session — 2026-06-17

## 参与角色

- **用户（开发者）**：报告 bug，明确预期

## 讨论主题

`plugin build` 输出的 MCP 相关配置文件不完整。

## 问题 1：.env.example 为空

### 现象

插件构建后 `.deepstorm/plugins/deepstorm/.env.example` 只有两行注释头，没有任何 MCP 环境变量模板。

### 根因

`packages/cli/src/engine/plugin-builder.ts` 第 102 行：
```typescript
const envExampleFile = path.join(cliDir, 'env-examples', `${mcpName}.md`)
```

实际文件名使用 `.env-example` 扩展名（如 `jira.env-example`），但代码硬编码为 `.md`。`fs.existsSync()` 永远返回 false，env stub 全部被跳过。

### 预期

根据用户在 plugin-build 中 selectedMcpTools 的选择，将对应 MCP 服务的 env stub 逐条追加到 `.env.example`。

## 问题 2：.mcp.json 缺少 deepstorm-context7

### 现象

```
selectedMcpTools: ["figma", "github", "jira", "context7"]
```

`.mcp.json` 只包含 `deepstorm-figma`、`deepstorm-github`、`deepstorm-jira`，缺少 `deepstorm-context7`。

### 根因

`packages/cli/mcp/docs-reference/context7.json` 仅定义了 `envStubs`，没有 `mcpServers` 字段。`readMcpServerConfig()` 函数按 `content.mcpServers` 查找，返回 null。

### 预期

context7 作为 MCP 服务，应使用 `@upstash/context7-mcp` 的 npx 启动命令：

```json
{
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
```

### 延伸影响（用户补充）

`context7.json` 缺少 `mcpServers` 的根因同样作用于以下 `.mcp.json`：

| 文件 | 生成方式 | 同一致病 |
|------|---------|---------|
| `.deepstorm/plugins/deepstorm/.mcp.json` | `plugin-builder.ts` → `readMcpServerConfig()` | 读取 `context7.json`，无 `mcpServers` → null |
| `packages/cli/test-project/.mcp.json` | `setup.ts` → `loadMcpServerConfigs()` | 同上 |
| 根目录 `.mcp.json` | `setup.ts` → `loadMcpServerConfigs()` | 同上 |

所有三个 `.mcp.json` 文件共享同一个根因，修复 `context7.json` 即可同时修复三处。

## 问题 3：test-project .env 缺少 Playwright 环境变量

### 现象

`packages/cli/test-project/.env` 包含 context7、figma、github、jira 的 env stub，但缺少 Playwright 所需的 `已废弃的环境变量（地址现硬编码在 .mcp.json 中）`。而该目录的 `.mcp.json` 已正确包含 `deepstorm-playwright`（WebSocket 方式）。

### 根因

test-project 的 `.env` 是手动维护的示例文件，仅列出了当时已知的 MCP 服务，Playwright 被遗漏。

### 预期

补上 Playwright 配置段：

```
# Playwright MCP 服务器
#
# 用途：浏览器自动化 E2E 测试
#   - 执行基于 .flow.md 测试意图文档的 E2E 测试
#
# 说明：Playwright MCP 通过 WebSocket 连接本地运行的 Playwright 服务。
#       默认地址为 ws://localhost:54321，可通过 已废弃的环境变量（地址现硬编码在 .mcp.json 中） 配置。
#
# 启动方式：
#   1. 安装 Playwright: npx playwright install
#   2. 启动 Playwright MCP Server: npx @anthropic-ai/playwright-mcp
已废弃的环境变量（地址现硬编码在 .mcp.json 中）=ws://localhost:54321
```

## 影响范围

| 模块 | 影响 |
|------|------|
| `packages/cli/mcp/docs-reference/context7.json` | 需新增 `mcpServers` 字段（使用 `@upstash/context7-mcp`） |
| `packages/cli/src/engine/plugin-builder.ts` | 扩展名 `.md` → `.env-example`（第 102 行） |
| `packages/cli/test-project/.env` | 手动补上 Playwright 的 env stub 段 |

### 影响文件清单（修复后自动生效）

- `.deepstorm/plugins/deepstorm/.mcp.json` — 新增 `deepstorm-context7`
- `.deepstorm/plugins/deepstorm/.env.example` — 包含 context7 的 env stub
- `packages/cli/test-project/.mcp.json` — 下次 `pnpm test:setup` 后自动包含
- 根目录 `.mcp.json` — 下次 `deepstorm setup` 后自动包含

## 决定

- 这两个问题属于同一个变更：`fix-plugin-build-mcp-output`
- 修复后需 `pnpm build && pnpm cli plugin build` 重建验证
