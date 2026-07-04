## Why

DeepStorm 目前缺乏标准化的外部服务集成机制。用户在安装任何 DeepStorm 套件（tide、reef 等）之前，都需要手动配置 MCP 服务器来集成项目使用的第三方工具（Jira、GitHub、Figma、钉钉云文档等）。这些 MCP 服务器是 DeepStorm 所有套件共用的基础设施，不特定于某个套件。需要将 MCP 配置纳入 DeepStorm CLI setup 流程，让用户通过交互式选择即可自动生成 `.mcp.json`。

## What Changes

### 新增

- **Setup 流程新增 Step 1：MCP 工具选择** — 在现有套件选择之前，先让用户选择要集成的外部服务
- **MCP 配置定义**：在 `packages/cli/mcp/` 下按 domain/service 组织 MCP server JSON 配置文件，覆盖四个领域：
  - 项目管理：Jira（`jira-mcp`）
  - 知识管理：钉钉云文档（`dingtalk-wiki`）
  - 代码托管：GitHub（`ghcr.io/github/github-mcp-server`、Docker）
  - 设计工具：Figma（`figma-developer-mcp`）
- **注册表 `mcpTools` 段**：build-registry 扫描 `mcp/` 目录，聚合 MCP 工具元数据到 `registry.json`
- **`--mcp-tools` 非交互模式参数**：`deepstorm setup --non-interactive --mcp-tools jira,github`
- **动态 env stub 生成**：仅对用户选中的服务写入对应的 `DEEPSTORM_*` 环境变量到 `.env`
- **cmd MCP server 合并**：在 setup 流程中调用已有的 `mergeMcpServers()` 生成 `.mcp.json`
- **Install tracking**：记录 `deepstorm.installedMcpServers`，支持 `setup --reconfigure` 和 `uninstall` 清理

### 修改

- `packages/cli/src/commands/setup.ts` — 在 Step 2（套件选择）前插入 Step 1（MCP 工具选择）
- `packages/cli/src/wizard/tool-select.ts` — 新增 MCP 工具选择逻辑
- `packages/cli/src/wizard/reconfigure.ts` — MCP tracking 去重逻辑（幂等性）
- `packages/cli/src/wizard/guide.ts` — 输出 MCP 安装摘要
- `packages/cli/scripts/build-registry.mjs` — 新增 `mcpTools` 段扫描
- `packages/cli/src/types/registry.ts` — 新增 `McpToolEntry` 类型
- `packages/cli/config-schema.json` — 新增 `mcp.installedMcpServers` 字段
- `packages/cli/src/commands/doctor.ts` — 修复预存的 `loadValidConfigKeys()` 路径 bug

### 不修改

- 任何套件包（reef、tide、sweep、atoll）— MCP 是 DeepStorm 基础设施层，不耦合于套件
- `mergeMcpServers()` 函数本身 — 已实现并测试，只需接通调用
- `.env` 追加逻辑（`appendEnvVars`）— 已有，改为动态按需追加
- `config set` 命令 — MCP 不走此路径，只通过 setup/reconfigure 管理

## Capabilities

### New Capabilities

- `mcp-tool-selection`: 用户在 setup 流程中分步选择 MCP 工具并生成 `.mcp.json` 的能力，支持交互式和非交互式模式
- `mcp-server-config`: 四个领域的外部服务 MCP server 配置定义，包括 Jira（project-management）、钉钉云文档（knowledge-base）、GitHub（code-hosting）、Figma（design-tools），按 package 内建 JSON 模板分发

### Modified Capabilities

- 无（全新变更，不修改已有 capability）

## Impact

| 影响范围 | 类型 | 说明 |
|---------|------|------|
| `packages/cli/mcp/` | 新增 | 4 个 MCP 服务 JSON 文件，按 domain/service 组织 |
| `packages/cli/src/commands/setup.ts` | 修改 | 插入 MCP 选择步骤 |
| `packages/cli/src/wizard/` | 修改 | tool-select / reconfigure / guide |
| `packages/cli/scripts/build-registry.mjs` | 修改 | 新增 mcpTools 扫描段 |
| `packages/cli/src/types/registry.ts` | 修改 | 新增 McpToolEntry |
| `packages/cli/config-schema.json` | 修改 | 新增 mcp 字段 |
| `packages/cli/src/commands/doctor.ts` | 修改 | 修复 schema 校验路径 bug |
| docker | 运行时依赖 | GitHub MCP 需本地 Docker 环境 |
