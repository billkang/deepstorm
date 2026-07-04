## MODIFIED Requirements

### Requirement: Session JSON 新增 services 命名空间

**Modified**: services.knowledgeBase 的 provider 值从 `dingtalk-wiki` 变更为 `feishu-wiki`；url 示例从 `dingtalk.com` 变更为飞书域名。

Session JSON SHALL 新增顶级字段 `services`，一个对象类型，用于统一记录外部服务信息。`services` 包含 `knowledgeBase` 和 `issueTracker` 两个子字段。

#### Scenario: 4a 成功后写入 services.knowledgeBase
- **WHEN** Step 4a 知识库推送成功完成
- **THEN** `services.knowledgeBase` SHALL 记录 `{"provider":"feishu-wiki","url":"https://feishu.cn/wiki/xxx"}`
- **THEN** `provider` 为所选 MCP 服务的 ID（如 `feishu-wiki`）
- **THEN** `url` 为推送后返回的文档链接

### Requirement: 向后兼容旧 session 字段

**Modified**: 降级读取的旧字段从 `dingtalkUrl` 变更为 `feishuUrl`（后续迁移），同时保留对 `dingtalkUrl` 的向后兼容。

读操作 SHALL 优先使用 `services` 命名空间，在其不存在时降级到旧字段。

#### Scenario: 新 session 优先读 services
- **WHEN** session JSON 同时包含 `services.issueTracker.urls` 和 `jiraUrls`
- **THEN** AI SHALL 优先展示 `services.issueTracker.urls` 中的值
- **THEN** `jiraUrls` 被忽略

#### Scenario: 旧 session 无 services 时降级
- **WHEN** session JSON 不包含 `services` 字段
- **AND** `dingtalkUrl` 存在
- **AND** `jiraUrls` 存在
- **THEN** AI SHALL 使用 `dingtalkUrl` 作为知识库链接（保留向后兼容）
- **THEN** AI SHALL 使用 `jiraUrls` 作为工单链接列表

#### Scenario: 新 session 使用 feishuUrl
- **WHEN** session JSON 在钉钉迁移后创建，且使用飞书知识库
- **THEN** `services.knowledgeBase.url` 的值为飞书文档链接
- **THEN** AI SHALL 不使用 `dingtalkUrl` 降级路径

### Requirement: publishChecklist 步骤名通用化

**Unchanged**: 此能力已正确实现为通用名称，不依赖具体 provider。

#### Scenario: 新建 session 使用新步骤名
- **WHEN** 新建 session 进入 Step 4 发布流程
- **THEN** `publishChecklist` SHALL 使用 `knowledge_base_push`、`issue_task_split`、`create_issues` 作为步骤名
- **THEN** 不再使用 `dingtalk_push`、`jira_task_split`、`create_jira_issues`
