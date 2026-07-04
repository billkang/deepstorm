# Spec: MCP 服务配置

## ADDED Requirements

### Requirement: MCP JSON 文件结构

每个 MCP 服务对应一个独立的 JSON 配置文件，包含元数据和 MCP server 定义。

- **SHALL** 放在 `packages/cli/mcp/{domain}/{service}.json`
- **SHALL** 包含 `name`、`domain`、`label`、`description` 元数据字段
- **SHALL** 包含 `mcpServers` 字段，其结构与 Claude Code `.mcp.json` 的 `mcpServers` 兼容
- **SHALL NOT** 在 `mcpServers` 条目中声明 `env` 字段（凭据通过 `dotenv-cli` 运行时加载）
- **SHALL** MCP server 使用 `npx -y dotenv-cli -e .env -- npx -y <package>` 统一启动模式

#### 统一 JSON 模板

```json
{
  "name": "{service}",
  "domain": "{domain}",
  "label": "{显示名称}",
  "description": "{一句话描述}",
  "mcpServers": {
    "{service}": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "dotenv-cli", "-e", ".env", "--", "npx", "-y", "{mcp-package}"]
    }
  }
}
```

#### Scenario: JSON 文件可被 build-registry 解析
- **WHEN** build-registry.mjs 扫描 `packages/cli/mcp/` 目录
- **THEN** 读取 JSON 文件并提取 `name`、`domain`、`label`、`description`
- **AND** 注册到 `registry.mcpTools[name]`

### Requirement: 项目管理 — Jira

- **SHALL** domain 为 `project-management`
- **SHALL** 配置名为 `jira`
- **SHALL** MCP 包为 `jira-mcp`
- **SHALL** 要求用户配置 `DEEPSTORM_JIRA_TOKEN` 环境变量
- **SHALL** env stub 注释为 "Jira API Token — 从 https://id.atlassian.com/manage/api-tokens 获取"

#### Scenario: Jira MCP 启动
- **WHEN** Jira MCP server 被启动
- **THEN** 执行命令为 `npx -y dotenv-cli -e .env -- npx -y jira-mcp --stdio`
- **AND** 从 `.env` 中读取 `DEEPSTORM_JIRA_TOKEN` 映射为 `JIRA_TOKEN`

### Requirement: 代码托管 — GitHub

- **SHALL** domain 为 `code-hosting`
- **SHALL** 配置名为 `github`
- **SHALL** MCP 镜像为 `ghcr.io/github/github-mcp-server`（Docker 容器）
- **SHALL** 要求用户配置 `DEEPSTORM_GITHUB_TOKEN` 环境变量
- **SHALL** env stub 注释为 "GitHub Personal Access Token — 从 https://github.com/settings/tokens 获取"
- **SHALL** 在 guide 中提示 Docker 依赖

#### Scenario: GitHub MCP 启动
- **WHEN** GitHub MCP server 被启动
- **THEN** 执行命令为 `npx -y dotenv-cli -e .env -- docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server`
- **AND** 从 `.env` 中读取 `DEEPSTORM_GITHUB_TOKEN` 映射为 `GITHUB_PERSONAL_ACCESS_TOKEN`

### Requirement: 设计工具 — Figma

- **SHALL** domain 为 `design-tools`
- **SHALL** 配置名为 `figma`
- **SHALL** MCP 包为 `figma-developer-mcp`
- **SHALL** 要求用户配置 `DEEPSTORM_FIGMA_TOKEN` 环境变量
- **SHALL** env stub 注释为 "Figma Access Token — 从 Figma > Settings > Personal Access Tokens 获取"

#### Scenario: Figma MCP 启动
- **WHEN** Figma MCP server 被启动
- **THEN** 执行命令为 `npx -y dotenv-cli -e .env -- npx -y figma-developer-mcp --stdio`
- **AND** 从 `.env` 中读取 `DEEPSTORM_FIGMA_TOKEN` 映射为 `FIGMA_ACCESS_TOKEN`

### Requirement: 知识管理 — 钉钉云文档

- **SHALL** domain 为 `knowledge-base`
- **SHALL** 配置名为 `dingtalk-wiki`
- **SHALL** MCP 包为 `dingtalk-wiki@latest`
- **SHALL** 要求用户配置 `DEEPSTORM_DINGTALK_TOKEN` 环境变量
- **SHALL** env stub 注释为 "钉钉机器人 Token — 从群设置 > 机器人管理获取"

#### Scenario: 钉钉云文档 MCP 启动
- **WHEN** 钉钉云文档 MCP server 被启动
- **THEN** 执行命令为 `npx -y dotenv-cli -e .env -- npx -y dingtalk-wiki@latest`
- **AND** 从 `.env` 中读取 `DEEPSTORM_DINGTALK_TOKEN` 映射为 `DINGTALK_TOKEN`

### Requirement: 注册表 mcpTools 段

build-registry 可以聚合 MCP 服务元数据到 registry.json。

- **SHALL** 扫描 `packages/cli/mcp/**/*.json` 作为数据源
- **SHALL** 提取 JSON 文件中的 `name`、`domain`、`label`、`description` 字段
- **SHALL** 在 `registry.json` 中新增 `mcpTools` 顶层字段
- **SHALL** `mcpTools` 为 Record<string, McpToolEntry>，key 为服务 name

#### 注册表结构

```json
{
  "mcpTools": {
    "jira": {
      "domain": "project-management",
      "label": "Jira",
      "description": "任务跟踪与敏捷管理"
    }
  }
}
```

#### Scenario: 构建后 registry.json 包含 mcpTools
- **WHEN** 运行 `node scripts/build-registry.mjs`
- **THEN** registry.json 包含 `mcpTools` 字段
- **AND** 包含所有四个 MCP 服务的条目
- **AND** 每个条目的 key 与 JSON 文件中的 `name` 一致
