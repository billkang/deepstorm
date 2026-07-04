# mcp-playwright Specification

## Purpose

Defines the Playwright MCP service — a new MCP service managed by the CLI setup wizard. Playwright MCP provides browser automation capabilities via WebSocket, used by the Sweep suite for E2E test execution. The service is selectable in the setup wizard when the Sweep tool suite is chosen, and its configuration is managed alongside other MCP services (Jira, GitHub, etc.) through the unified CLI setup flow.

## ADDED Requirements

### Requirement: Playwright MCP 服务定义

CLI SHALL 提供 Playwright MCP 服务的标准定义，包含 MCP server 配置、环境变量 stub 和使用指南 skill。

#### Scenario: 创建 Playwright MCP 配置
- **WHEN** 用户在 setup 流程中选择了 Sweep 工具套件
- **AND** 在 MCP 选择步骤中选中了 Playwright
- **THEN** CLI SHALL 将 Playwright MCP server 配置合并到 `.mcp.json` 的 `mcpServers` 字段
- **AND** MCP server 在 `.mcp.json` 中使用 `deepstorm-playwright` 命名
- **AND** Playwright MCP 连接地址已硬编码在 `.mcp.json` 中（默认 `http://localhost:54321/sse`），不再通过环境变量配置

#### Scenario: 安装 Playwright 使用指南 skill
- **WHEN** 用户选中了 Playwright MCP 服务
- **THEN** CLI SHALL 将 `deepstorm-mcp-playwright-read` 使用指南 skill 安装到 `.claude/skills/`
- **AND** 不安装 write 版本（Playwright MCP 为只读操作模式）

#### Scenario: Playwright 不生成 env stub
- **WHEN** 用户选中了 Playwright MCP 服务
- **THEN** CLI SHALL **不**在 `.env` 中追加 Playwright 相关的环境变量 stub
- **AND** 连接地址已硬编码在 `.mcp.json` 中，无需环境变量配置

### Requirement: Playwright MCP 仅与 Sweep 关联

Playwright MCP 服务在 setup 流程中 SHALL 仅当用户选择了 Sweep 工具套件时才出现在 MCP 选择列表中。

#### Scenario: 选择 Sweep 时 Playwright 可见
- **WHEN** 用户在工具选择步骤中选中了 Sweep
- **THEN** 在 MCP 选择步骤中，Playwright 出现在选项列表中
- **AND** Playwright 标注来源为 Sweep

#### Scenario: 未选 Sweep 时 Playwright 不可见
- **WHEN** 用户未选择 Sweep 工具套件
- **THEN** Playwright MCP 选项不在 MCP 选择列表中展示
- **AND** 用户无法通过交互界面选择 Playwright

### Requirement: Playwright MCP 配置移至 CLI 统一管理

Playwright MCP 的配置管理 SHALL 从 Sweep skill（sweep-init）迁移到 CLI setup wizard 统一管理，与已有 MCP 服务（Jira、GitHub 等）使用同一套配置流程。

#### Scenario: setup 配置 Playwright MCP
- **WHEN** 用户通过 setup 选择了 Playwright MCP
- **THEN** Playwright MCP 的 server 配置写入 `.mcp.json`
- **AND** env stub 写入 `.env`
- **AND** sweep-init 不再在 `.claude/settings.json` 中独立配置 Playwright MCP
- **AND** sweep-run 从 `.mcp.json` 读取 Playwright MCP 配置，而非从 `.claude/settings.json`

#### Scenario: reconfigure 清理 Playwright MCP
- **WHEN** 用户运行 `deepstorm setup --reconfigure`
- **AND** 之前安装了 Playwright MCP
- **THEN** `.mcp.json` 中的 `deepstorm-playwright` 条目被删除
- **AND** `deepstorm.installedMcpServers` 中的 `playwright` 被清理

### Requirement: MCP 选择列表中 Playwright 的领域分类

Playwright MCP 在 MCP 选择列表中 SHALL 归属于 `e2e-testing` 领域分组。

#### Scenario: 展示领域分组
- **WHEN** 用户在 MCP 选择步骤中看到 Playwright 选项
- **THEN** Playwright 在 `e2e-testing`（端到端测试）领域分组下展示
- **AND** label 为 "Playwright"，description 为 "Browser automation for E2E testing"
