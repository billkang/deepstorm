## ADDED Requirements

### Requirement: Jira Issue 获取

deepstorm-mcp-jira-read skill SHALL 提供通过 Jira MCP 获取 Issue 详情的操作指南。

#### Scenario: 通过 URL 解析 Issue Key 并获取详情
- **WHEN** 用户提供 Jira Issue 的完整 URL（格式如 `https://<instance>.atlassian.net/browse/LC-1234`）
- **THEN** skill 指南 SHALL 说明如何从 URL path 中提取 Issue Key

#### Scenario: 通过 Issue Key 直接获取
- **WHEN** 用户直接提供 Issue Key（如 `LC-1234`）
- **THEN** skill 指南 SHALL 说明如何调用 Jira MCP 的获取 Issue 工具

#### Scenario: 提取 Issue 元数据结构
- **WHEN** Jira MCP 返回 Issue 数据
- **THEN** skill 指南 SHALL 说明如何提取以下字段：key、title、url、type、status、description

#### Scenario: 提取自定义字段
- **WHEN** Issue 包含设计工具链接等自定义字段（如 `customfield_10032`）
- **THEN** skill 指南 SHALL 说明如何识别和提取这些字段的值

### Requirement: MCP 服务未配置时的降级处理

deepstorm-mcp-jira-read skill SHALL 提供 Jira MCP 不可用时的降级操作流程。

#### Scenario: 降级到手动输入
- **WHEN** `issue_tracker.available === false`
- **THEN** skill 指南 SHALL 说明如何引导用户手动粘贴 Issue 摘要和描述，并提取所需元数据

### Requirement: 运行时能力检测

deepstorm-mcp-jira-read skill SHALL 说明如何在运行时通过能力映射感知 Jira MCP 的可用性。

#### Scenario: 能力映射参考
- **WHEN** AI 需要确认 Jira MCP 是否可用
- **THEN** skill 指南 SHALL 说明读取 `.claude/settings.json` 的 `deepstorm.installedMcpServers` 进行确认
