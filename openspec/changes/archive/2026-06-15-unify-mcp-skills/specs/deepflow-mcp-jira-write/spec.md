## ADDED Requirements

### Requirement: Jira Issue 创建

deepstorm-mcp-jira-write skill SHALL 提供通过 Jira MCP 创建 Issue 的操作指南。

#### Scenario: 创建 Issue
- **WHEN** 用户需要将 PRD 拆解为 Epic/Story/Task 并在 Jira 中创建
- **THEN** skill 指南 SHALL 说明如何调用 Jira MCP 的创建 Issue 工具，包括项目 Key、Issue 类型（Epic/Story/Task/Bug/Sub-task）、摘要（Summary）、描述（Description）的填写

#### Scenario: 批量创建子任务
- **WHEN** 一个父 Issue 需要拆分为多个子任务
- **THEN** skill 指南 SHALL 说明如何为每条子任务分别调用创建工具，并关联父任务

### Requirement: Jira Issue 更新与状态流转

deepstorm-mcp-jira-write skill SHALL 提供更新 Issue 字段和流转状态的操作指南。

#### Scenario: 更新 Issue 字段
- **WHEN** 需要修改已有 Issue 的摘要、描述、优先级、经办人、标签等字段
- **THEN** skill 指南 SHALL 说明如何调用 Jira MCP 的更新 Issue 工具

#### Scenario: 状态流转
- **WHEN** 需要将 Issue 从一个状态移动到下一个状态（如 To Do → In Progress → In Review → Done）
- **THEN** skill 指南 SHALL 说明先查询可用 transitions，再执行流转

### Requirement: Jira Issue 评论

deepstorm-mcp-jira-write skill SHALL 提供在 Issue 上添加评论的操作指南。

#### Scenario: 添加评论
- **WHEN** 需要在 Issue 上回复或添加备注
- **THEN** skill 指南 SHALL 说明如何调用 Jira MCP 的添加评论工具，支持 Markdown 格式

### Requirement: MCP 服务未配置时的降级处理

deepstorm-mcp-jira-write skill SHALL 提供 Jira MCP 不可用时的降级方式说明。

#### Scenario: 降级处理
- **WHEN** `issue_tracker.available === false`
- **THEN** skill 指南 SHALL 说明跳过写入操作并记录，提示用户手动在 Jira 中操作
