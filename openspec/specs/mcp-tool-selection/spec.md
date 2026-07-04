# mcp-tool-selection Specification

## MODIFIED Requirements

### Requirement: Setup 流程 Step 2 — MCP 工具选择（按工具过滤）

用户在运行 `deepstorm setup` 时，SHALL 在完成工具套件选择（Step 1）之后，根据已选工具展示 MCP 服务列表。

- **SHALL** 在工具套件选择（Step 1）之后展示 MCP 工具选择（Step 2）
- **SHALL** 展示每个 MCP 服务的 label、description、领域分组和来源工具标注
- **SHALL** 仅展示与已选工具套件有关联的 MCP 服务
- **SHALL** 允许用户多选 MCP 服务
- **SHALL** 允许用户跳过 Step 2（不选任何 MCP 服务）
- **SHALL** Context7 在列表中使用 `docs-reference` 领域展示，仅当已选工具中包含 reef 时可见
- **SHALL** 在交互模式下 Context7 默认勾选（`initialValues: ['context7']`）——仅当其出现在过滤后列表中时生效
- **SHALL** 仅生成 `mcpServers` 的 MCP 服务（如 Jira、GitHub、Playwright）才写入 `.mcp.json`；仅 env 类服务（如 Context7）仅写入 `.env` stub 和 guide 输出（Playwright 除外：其 URL 已硬编码在 `.mcp.json` 中，不再写入 env stub）
- **SHALL** 新增 `e2e-testing` 领域分组，用于展示 Playwright 等 E2E 测试工具

#### Scenario: 按工具过滤后选择 MCP 服务
- **WHEN** 用户运行 `deepstorm setup`
- **AND** 在 Step 1 中选择了 reef
- **THEN** Step 2 展示 reef 关联的 MCP 列表：Jira、GitHub、Figma、飞书知识库、Context7
- **AND** 用户选择 Jira 和 GitHub
- **AND** 用户确认选择
- **THEN** 进入 Step 3 问卷

#### Scenario: 跳过 MCP 选择
- **WHEN** 用户运行 `deepstorm setup`
- **AND** 在 Step 1 中选择了工具
- **AND** 在 MCP 选择列表中未选任何服务直接回车
- **THEN** 进入 Step 3 问卷
- **AND** `.mcp.json` 不会被创建
- **AND** 不会写入任何 MCP 相关的 env stub

#### Scenario: Context7 默认勾选
- **WHEN** 用户选择了 reef（包含 context7 映射）
- **AND** 进入 MCP 选择页面
- **THEN** Context7 在选项列表中处于选中状态
- **AND** 用户可直接回车确认使用默认选择

#### Scenario: 选择 Sweep 时 Playwright 可见
- **WHEN** 用户在 Step 1 中选择了 Sweep
- **THEN** Step 2 的 MCP 列表中 Playwright 在 `e2e-testing` 领域分组下展示
- **AND** label 为 "Playwright"，description 为 "Browser automation for E2E testing"
- **AND** 标注来源 "Sweep"

### Requirement: MCP 配置安装

用户选择 MCP 服务后，系统应自动生成 `.mcp.json` 并写入 env stub。新增 Playwright MCP 支持，Playwright 使用 SSE 连接方式。

- **SHALL** 调用 `mergeMcpServers()` 将选中的 MCP server 配置合并到当前工作目录的 `.mcp.json`
- **SHALL** MCP server 在 `.mcp.json` 中使用 `deepstorm-{name}` 命名（如 `deepstorm-jira`、`deepstorm-playwright`）
- **SHALL** 将选中的 MCP 服务名列表写入 `deepstorm.installedMcpServers`
- **SHALL** 写入前去重：`[...new Set([...existing, ...selected])]`
- **SHALL** 仅对选中的服务写入对应的 env stub 到 `.env`（Playwright 除外——其连接地址已硬编码在 `.mcp.json` 中）
- **SHALL NOT** 覆盖用户已有的 `.mcp.json` 中非 DeepStorm 管理的 MCP server
- **SHALL NOT** 在 MCP JSON 中声明 `env` 字段（凭据通过 `dotenv-cli` 运行时加载）
- **SHALL** Playwright MCP 的 `url` 使用硬编码地址 `http://localhost:54321/sse`，不再从环境变量读取

#### Scenario: 安装 Playwright MCP
- **WHEN** 用户选择了 Playwright MCP
- **THEN** `.mcp.json` 中增加 `deepstorm-playwright` MCP server 条目，使用 SSE 连接
- **AND** **不**在 `.env` 中写入 Playwright 相关的 env stub（地址已硬编码）
- **AND** `deepstorm.installedMcpServers` 包含 `["playwright"]`

#### Scenario: 已有 `.env` 时 Playwright 不追加 stub
- **WHEN** `.env` 已经存在
- **AND** 用户新选择了 Playwright
- **THEN** `.env` 中**不**追加 Playwright 环境变量（地址已硬编码在 `.mcp.json` 中） 行
- **AND** 已有的环境变量行保持不变

### Requirement: Setup guide MCP 摘要（更新）

安装完成后，应展示 MCP 安装结果和环境变量提示。新增 Playwright MCP 的展示。

#### Scenario: Guide 展示 MCP 信息（含 Playwright）
- **WHEN** 安装完成
- **AND** 用户选择了 Jira、GitHub、Playwright
- **THEN** 输出包含：
  ```
  ✔ 已安装 3 个外部服务
    • jira（project-management）
    • github（code-hosting）
    • playwright（e2e-testing）
    请配置以下环境变量到 .env：
    DEEPSTORM_JIRA_TOKEN=               ← Jira API Token
    DEEPSTORM_GITHUB_TOKEN=             ← GitHub Personal Token
    Playwright 无需环境变量配置（地址已硬编码在 .mcp.json 中）
  ```
