# Spec: MCP 工具选择

## ADDED Requirements

### Requirement: Setup 流程 Step 1 — MCP 工具选择

用户在运行 `deepstorm setup` 时，必须先选择要集成的 MCP 服务，然后才能进行套件选择。

- **SHALL** 在现有套件选择（Step 2）之前插入 MCP 工具选择（Step 1）
- **SHALL** 展示每个 MCP 服务的 label、description 和领域分组
- **SHALL** 允许用户多选 MCP 服务
- **SHALL** 允许用户跳过 Step 1（不选任何 MCP 服务）
- **SHALL** 允许用户跳过 Step 2（不选任何套件）
- **SHALL** 两个步骤完全独立、互不强制

#### Scenario: 正常选择 MCP 服务
- **WHEN** 用户运行 `deepstorm setup`
- **THEN** 先展示 MCP 工具选择列表
- **AND** 用户选择 Jira 和 GitHub
- **AND** 用户确认选择
- **THEN** 进入 Step 2 套件选择
- **AND** Step 1 的选择不会影响 Step 2 的选项

#### Scenario: 跳过 MCP 选择
- **WHEN** 用户运行 `deepstorm setup`
- **AND** 在 MCP 工具选择列表中不选任何服务
- **THEN** 进入 Step 2 套件选择
- **AND** `.mcp.json` 不会被创建
- **AND** 不会写入任何 MCP 相关的 env stub

#### Scenario: 只选 MCP 不选套件
- **WHEN** 用户运行 `deepstorm setup`
- **AND** 在 Step 1 中选择了一个或多个 MCP 服务
- **AND** 在 Step 2 中不选任何套件
- **THEN** 仅生成 `.mcp.json` 和对应的 env stub
- **AND** 不安装任何 skills/agents/hooks

### Requirement: MCP 配置安装

用户选择 MCP 服务后，系统应自动生成 `.mcp.json` 并写入 env stub。

- **SHALL** 调用 `mergeMcpServers()` 将选中的 MCP server 配置合并到当前工作目录的 `.mcp.json`
- **SHALL** MCP server 在 `.mcp.json` 中使用 `deepstorm-{name}` 命名（如 `deepstorm-jira`）
- **SHALL** 将选中的 MCP 服务名列表写入 `deepstorm.installedMcpServers`
- **SHALL** 写入前去重：`[...new Set([...existing, ...selected])]`
- **SHALL** 仅对选中的服务写入对应的 `DEEPSTORM_*` env stub 到 `.env`
- **SHALL NOT** 覆盖用户已有的 `.mcp.json` 中非 DeepStorm 管理的 MCP server
- **SHALL NOT** 在 MCP JSON 中声明 `env` 字段（凭据通过 `dotenv-cli` 运行时加载）

#### 环境变量命名规范

| 服务 | Env Var |
|------|---------|
| Jira | `DEEPSTORM_JIRA_TOKEN` |
| GitHub | `DEEPSTORM_GITHUB_TOKEN` |
| Figma | `DEEPSTORM_FIGMA_TOKEN` |
| 钉钉云文档 | `DEEPSTORM_DINGTALK_TOKEN` |

#### Scenario: 安装多个 MCP 服务
- **WHEN** 用户选择了 Jira 和 GitHub
- **THEN** `.mcp.json` 中增加了 `deepstorm-jira` 和 `deepstorm-github` 两个 MCP server 条目
- **AND** `.env` 中增加了 `DEEPSTORM_JIRA_TOKEN=` 和 `DEEPSTORM_GITHUB_TOKEN=` 两行 stub
- **AND** `deepstorm.installedMcpServers` 包含 `["jira", "github"]`

#### Scenario: 已有 `.env` 时追加
- **WHEN** `.env` 已经存在且包含 `DEEPSTORM_JIRA_TOKEN=existing-value`
- **AND** 用户新选择了 Figma
- **THEN** `.env` 中追加 `DEEPSTORM_FIGMA_TOKEN=` 一行
- **AND** 已有的 `DEEPSTORM_JIRA_TOKEN` 行保持不变

#### Scenario: 幂等安装
- **WHEN** 用户第一次 setup 选择 Jira
- **AND** 第二次 setup（不带 `--reconfigure`）又选择 Jira
- **THEN** `.mcp.json` 中的 `deepstorm-jira` 内容不变
- **AND** `deepstorm.installedMcpServers` 仍为 `["jira"]`（去重后）

### Requirement: `--reconfigure` MCP 清理

用户使用 `--reconfigure` 重新配置时，应正确清理 MCP 配置。

- **SHALL** 读取 `deepstorm.installedMcpServers` 列表
- **SHALL** 从 `.mcp.json` 中逐一删除 `deepstorm-{name}` 对应的 MCP server 条目
- **SHALL** 清空 `deepstorm.installedMcpServers`
- **SHALL NOT** 删除 `.mcp.json` 中非 DeepStorm 管理的 MCP server
- **SHALL NOT** 修改 `.env` 中的内容

#### Scenario: Reconfigure 清理 MCP
- **WHEN** 用户运行 `deepstorm setup --reconfigure`
- **AND** 之前安装了 Jira 和 GitHub
- **THEN** `.mcp.json` 中的 `deepstorm-jira` 和 `deepstorm-github` 被删除
- **AND** 用户重新选择 MCP 服务后，仅新选的服务被安装
- **AND** 用户之前自己手动配置的其他 MCP server 保持不变

### Requirement: `uninstall` MCP 清理

用户在卸载 DeepStorm 时，应正确清理 MCP 配置。

- **SHALL** `uninstallDeepStorm()` 通过 `cleanInstalled()` 清理 MCP
- **SHALL** 行为与 `--reconfigure` 一致

#### Scenario: Uninstall 清理 MCP
- **WHEN** 用户运行 `deepstorm uninstall`
- **THEN** `.mcp.json` 中所有 `deepstorm-*` MCP server 条目被删除
- **AND** 用户手动配置的其他 MCP server 保持不变

### Requirement: 非交互模式 MCP 选择

用户可以通过命令行参数在非交互模式中选择 MCP 服务。

- **SHALL** 新增 `--mcp-tools` 参数，接受逗号分隔的 MCP 服务名列表
- **SHALL** 与 `--tools` 参数独立使用
- **SHALL** `--mcp-tools` 为空时等价于不选择任何 MCP 服务

#### Scenario: 非交互模式安装
- **WHEN** 用户运行 `deepstorm setup --non-interactive --mcp-tools jira,github --tools reef`
- **THEN** 安装 Jira 和 GitHub 的 MCP 配置
- **AND** 安装 reef 套件的 skills/agents/hooks

#### Scenario: 非交互模式仅 MCP
- **WHEN** 用户运行 `deepstorm setup --non-interactive --mcp-tools figma`
- **THEN** 仅安装 Figma 的 MCP 配置
- **AND** 不安装任何套件

### Requirement: Setup guide MCP 摘要

安装完成后，应展示 MCP 安装结果和环境变量提示。

- **SHALL** 在安装完成后输出 MCP 安装摘要
- **SHALL** 列出已安装的服务名和服务所属领域
- **SHALL** 提示用户配置缺失的 `DEEPSTORM_*` 环境变量

#### Scenario: Guide 展示 MCP 信息
- **WHEN** 安装完成
- **AND** 用户选择了 3 个 MCP 服务
- **THEN** 输出包含：
  ```
  ✔ 已安装 3 个外部服务
    • Jira（project-management）
    • GitHub（code-hosting）
    • Figma（design-tools）
    请配置以下环境变量到 .env：
    DEEPSTORM_JIRA_TOKEN=   ← Jira API Token
    DEEPSTORM_GITHUB_TOKEN= ← GitHub Personal Token
    DEEPSTORM_FIGMA_TOKEN=  ← Figma Access Token
  ```

### Requirement: doctor 命令校验 MCP 安装

`deepstorm doctor` 报告应包含 MCP 状态。

- **SHALL** 检查 `.mcp.json` 的文件完整性
- **SHALL** 检查 `deepstorm.installedMcpServers` 中的服务是否在 `.mcp.json` 中真实存在
- **SHALL** 在 MCP 状态为 fail 时输出修复建议

#### Scenario: MCP 安装不完整
- **WHEN** `deepstorm.installedMcpServers` 包含 `["jira"]`
- **AND** `.mcp.json` 中不存在 `deepstorm-jira`
- **THEN** doctor 报告中 MCP 状态为 warn
- **AND** 提示"运行 deepstorm setup --reconfigure"
