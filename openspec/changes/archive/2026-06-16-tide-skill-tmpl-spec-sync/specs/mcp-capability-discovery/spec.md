## MODIFIED Requirements

### Requirement: 运行时交叉引用 installedMcpServers

#### Scenario: 引用 MCP skill 指南
- **WHEN** AI 需调用某 provider（如 Jira）的 MCP 工具
- **THEN** AI 读取 `.claude/skills/deepstorm-mcp-{provider-id}-write/SKILL.md`（或 `-read`，按操作类型）获取工具调用指南
- **THEN** 按指南执行操作
