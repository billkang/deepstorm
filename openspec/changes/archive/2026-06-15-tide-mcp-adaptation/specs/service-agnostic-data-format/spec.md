## ADDED Requirements

### Requirement: Session JSON 新增 services 命名空间

Session JSON SHALL 新增顶级字段 `services`，一个对象类型，用于统一记录外部服务信息。`services` 包含 `knowledgeBase` 和 `issueTracker` 两个子字段。

#### Scenario: 4a 成功后写入 services.knowledgeBase

- **WHEN** Step 4a 知识库推送成功完成
- **THEN** `services.knowledgeBase` SHALL 记录 `{"provider":"dingtalk-wiki","url":"https://dingtalk.com/docs/xxx"}`
- **THEN** `provider` 为所选 MCP 服务的 ID（如 `dingtalk-wiki`）
- **THEN** `url` 为推送后返回的文档链接

#### Scenario: 4c 成功后写入 services.issueTracker

- **WHEN** Step 4c 工单创建成功完成（部分或全部）
- **THEN** `services.issueTracker.provider` SHALL 记录所选工单系统的 provider ID
- **THEN** `services.issueTracker.urls` SHALL 记录所有成功创建的 Issue URL 数组（自动去重）
- **THEN** `services.issueTracker.taskBreakdown` SHALL 记录 4b 用户确认后的任务清单

#### Scenario: 4b 跳过时 services.issueTracker 部分字段不存在

- **WHEN** 4b 和 4c 因无可用工单系统而跳过
- **THEN** `services` 中 SHALL 不包含 `issueTracker` 字段
- **THEN** `services` 中仍可能包含 `knowledgeBase`（如果 4a 执行成功）

### Requirement: publishChecklist 步骤名通用化

publishChecklist 中的步骤名 SHALL 从服务专属名称改为通用名称。三个步骤分别为 `knowledge_base_push`、`issue_task_split`、`create_issues`。

#### Scenario: 新建 session 使用新步骤名

- **WHEN** 新建 session 进入 Step 4 发布流程
- **THEN** `publishChecklist` SHALL 使用 `knowledge_base_push`、`issue_task_split`、`create_issues` 作为步骤名
- **THEN** 不再使用 `dingtalk_push`、`jira_task_split`、`create_jira_issues`

#### Scenario: 跳过步骤时记录 skipped

- **WHEN** 某步骤因无可用 MCP 服务而跳过
- **THEN** 对应 `publishChecklist` 条目 SHALL 包含 `skipped: true`
- **THEN** `done` SHALL 同时为 `true`
- **THEN** `note` SHALL 包含跳过原因

### Requirement: 向后兼容旧 session 字段

读操作 SHALL 优先使用 `services` 命名空间，在其不存在时降级到旧字段 `dingtalkUrl`、`jiraUrls`、`jiraTaskBreakdown`。

#### Scenario: 新 session 优先读 services

- **WHEN** session JSON 同时包含 `services.issueTracker.urls` 和 `jiraUrls`
- **THEN** AI SHALL 优先展示 `services.issueTracker.urls` 中的值
- **THEN** `jiraUrls` 被忽略

#### Scenario: 旧 session 无 services 时降级

- **WHEN** session JSON 不包含 `services` 字段
- **AND** `dingtalkUrl` 存在
- **AND** `jiraUrls` 存在
- **THEN** AI SHALL 使用 `dingtalkUrl` 作为知识库链接
- **THEN** AI SHALL 使用 `jiraUrls` 作为工单链接列表

#### Scenario: 旧 publishChecklist 步骤名兼容

- **WHEN** session JSON 的 `publishChecklist` 中包含 `dingtalk_push` 或 `jira_task_split` 或 `create_jira_issues`
- **THEN** AI SHALL 将其映射为对应的新步骤名语义处理
- **THEN** AI SHALL 不尝试修改旧 session 的数据格式
