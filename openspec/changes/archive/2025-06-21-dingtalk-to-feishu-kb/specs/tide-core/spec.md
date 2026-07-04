## MODIFIED Requirements

### Requirement: services 命名空间持久化

**Modified**: 4a 知识库推送成功后，写路径更新为飞书 provider（feishu-wiki），不再修改 `dingtalkUrl`。

Session JSON SHALL 新增 `services` 字段记录外部服务交互结果，取代硬编码的 `dingtalkUrl`、`jiraUrls` 等专属字段。旧字段保留为向后兼容别名。

#### Scenario: 写操作使用新格式
- **WHEN** 知识库推送成功
- **THEN** 写入 `services.knowledgeBase.provider` 为 `feishu-wiki`
- **THEN** 不再修改 `dingtalkUrl`

#### Scenario: 读操作优先新格式
- **WHEN** 查看 session 详情
- **THEN** 优先读取 `services` 命名空间中的值
- **THEN** `services` 不存在时降级到 `dingtalkUrl` / `jiraUrls`

### Requirement: 发布流程（Step 4）

**Modified**: MCP skill 引用路径从 `deepstorm-mcp-dingtalk-wiki-write` 更新为 `deepstorm-mcp-feishu-wiki-write`。整体流程逻辑不变。

Tide SHALL 分三步完成发布：**4a 知识库推送**（取决于 knowledge_base MCP 可用性） → **4b 任务拆分**（用户确认任务清单） → **4c 创建工单**（取决于 issue_tracker MCP 可用性）。每步记录 publishChecklist 支持断点续传。

#### Scenario: 4a 知识库推送 — 单服务可用
- **WHEN** `installedMcpServers` 中恰好有一个 knowledge-base 领域的 MCP 服务
- **THEN** AI 自动使用该服务推送 PRD，无需用户选择
- **THEN** 成功后记录 `services.knowledgeBase`（provider 为 `feishu-wiki`），publishChecklist[0].done = true，status 变为 published

#### Scenario: 4a 知识库推送 — 多服务需选择
- **WHEN** `installedMcpServers` 中有多个 knowledge-base 领域的 MCP 服务
- **THEN** AI 展示可用服务列表由用户选择
- **THEN** 用户选择后按对应 provider 的 MCP skill 执行推送

#### Scenario: 4a 知识库推送 — 无可用服务
- **WHEN** `installedMcpServers` 中没有 knowledge-base 领域的 MCP 服务
- **THEN** 跳过 Step 4a，publishChecklist[0] 记录 `{step:"knowledge_base_push", done:true, skipped:true, note:"无可用知识库服务"}`
- **THEN** status 直接变为 published

### Requirement: MCP 集成

**Modified**: 能力映射中的知识库 provider ID 从 `dingtalk-wiki` 更新为 `feishu-wiki`。MCP skill 引用路径更新。

Tide SHALL 通过 MCP 能力映射机制与外部系统集成（知识库、工单跟踪），不绑定具体 MCP 服务。

#### Scenario: 引用 MCP skill 指南
- **WHEN** AI 需调用知识库 provider（如飞书）的 MCP 工具
- **THEN** AI 读取 `.claude/skills/deepstorm-mcp-feishu-wiki-write/SKILL.md`（或 `-read`，按操作类型）获取工具调用指南
- **THEN** 按指南执行操作

## ADDED Requirements

### Requirement: 飞书发布成功状态

Tide SHALL 在发布至飞书知识库成功时，services.knowledgeBase 记录为飞书格式。

#### Scenario: 4a 推送飞书成功
- **WHEN** PRD Markdown 成功推送到飞书知识库
- **THEN** 保存 `services.knowledgeBase`（`provider:"feishu-wiki"` 和飞书文档 url），publishChecklist[0].done = true，status 变为 published

### Requirement: Markdown 文件丢失恢复

#### Scenario: 4a 推送前检查文件
- **WHEN** 4a 推送到飞书前发现 PRD Markdown 文件不存在
- **THEN** 优先从 JSON 快照恢复，其次从 session steps 恢复，告知用户文件已恢复
