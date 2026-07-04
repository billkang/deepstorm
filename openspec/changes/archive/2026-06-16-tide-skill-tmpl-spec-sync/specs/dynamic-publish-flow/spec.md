## MODIFIED Requirements

### Requirement: 4a 按 knowledge_base 能力可用性执行

#### Scenario: 单知识库可用时正常推送
- **WHEN** 能力映射中 `knowledge_base` 有 1 个可用 provider（如钉钉云文档）
- **THEN** AI SHALL 读取 `.claude/skills/deepstorm-mcp-{provider-id}-write/SKILL.md` 了解工具调用方式

### Requirement: 4c 按 issue_tracker 能力可用性执行

#### Scenario: 单工单系统正常创建
- **WHEN** 4b 中已确认任务清单，且 `issue_tracker` 有唯一可用 provider（如 Jira）
- **THEN** AI SHALL 读取 `.claude/skills/deepstorm-mcp-{provider-id}-write/SKILL.md` 了解工具调用方式
