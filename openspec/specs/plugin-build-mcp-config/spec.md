# plugin-build-mcp-config Specification

## Purpose

Defines how the `plugin build` command generates MCP-related configuration files (`.env`, `.mcp.json`) in the plugin output directory. Each selected MCP service should produce the corresponding env stubs in `.env` and, where applicable, a server definition in `.mcp.json`.

## Requirements

### Requirement: 插件构建生成环境变量模板

`plugin build` 输出的 `.env` 文件中 SHALL 包含用户通过交互式向导所选择的所有 MCP 服务对应的环境变量模板。

#### Scenario: 选中 figma/github/jira/context7 时生成对应的 env stub
- **WHEN** 用户运行 `plugin build` 并选中 figma、github、jira、context7 作为 MCP 服务
- **THEN** 生成的 `.deepstorm/plugins/deepstorm/.env` 文件中 SHALL 包含以下环境变量模板：
  - `FIGMA_API_KEY`
  - `GITHUB_PERSONAL_ACCESS_TOKEN`
  - `JIRA_INSTANCE_URL`、`JIRA_USER_EMAIL`、`JIRA_API_KEY`
  - `CONTEXT7_API_KEY`

#### Scenario: 选中 playwright 时不生成环境变量
- **WHEN** 用户运行 `plugin build` 并选中 playwright 作为 MCP 服务
- **THEN** 生成的 `.env` 文件中 SHALL **不**包含 Playwright 相关的环境变量模板
- **AND** Playwright MCP 的连接地址已硬编码在 `.mcp.json` 中，无需环境变量配置

#### Scenario: 未选中任何 MCP 服务时不生成内容
- **WHEN** 用户运行 `plugin build` 且未选择任何 MCP 服务
- **THEN** 生成的 `.env` 文件可能仅包含注释头，不应包含具体环境变量模板

### Requirement: 插件构建生成 MCP 服务器定义

`plugin build` 输出的 `.mcp.json` 文件中 SHALL 包含用户所选所有 MCP 服务（具有 `mcpServers` 运行时定义的服务）对应的 `deepstorm-{name}` 条目。

#### Scenario: 选中 context7 时生成 deepstorm-context7
- **WHEN** 用户运行 `plugin build` 并选中 context7 作为 MCP 服务
- **THEN** 生成的 `.deepstorm/plugins/deepstorm/.mcp.json` 中 SHALL 包含 `deepstorm-context7` 条目，类型为 stdio，通过 `npx -y @upstash/context7-mcp` 启动
- **THEN** 启动命令 SHALL 前置 `dotenv-cli -e .env` 以从 `.env` 加载环境变量

#### Scenario: 选中 figma 时生成 deepstorm-figma
- **WHEN** 用户运行 `plugin build` 并选中 figma 作为 MCP 服务
- **THEN** 生成的 `.mcp.json` 中 SHALL 包含 `deepstorm-figma` 条目，通过 `npx -y figma-developer-mcp --stdio` 启动

#### Scenario: 选中 github 时生成 deepstorm-github
- **WHEN** 用户运行 `plugin build` 并选中 github 作为 MCP 服务
- **THEN** 生成的 `.mcp.json` 中 SHALL 包含 `deepstorm-github` 条目，通过 Docker 运行 `ghcr.io/github/github-mcp-server`

#### Scenario: 选中 jira 时生成 deepstorm-jira
- **WHEN** 用户运行 `plugin build` 并选中 jira 作为 MCP 服务
- **THEN** 生成的 `.mcp.json` 中 SHALL 包含 `deepstorm-jira` 条目，通过 `npx -y jira-mcp --stdio` 启动
