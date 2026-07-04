## MODIFIED Requirements

### Requirement: 状态流转

Session 状态 SHALL 按以下路径流转：`active → prd_ready → published → completed`，失败时进入 `publish_error`，变更/放弃时进入 `superseded`。其中 `published` 和 `completed` 状态的到达条件取决于已安装 MCP 服务的可用性，而非绑定特定服务。

#### Scenario: 正常流转（含全部 MCP 服务）

- **WHEN** 必需角色讨论完成 → PRD 生成
- **THEN** 状态从 `active` 变为 `prd_ready`
- **WHEN** 知识库推送成功或跳过
- **THEN** 状态从 `prd_ready` 变为 `published`
- **WHEN** 所有工单创建成功或全部跳过
- **THEN** 状态从 `published` 变为 `completed`，自动归档

#### Scenario: 发布失败

- **WHEN** 知识库推送或工单创建失败
- **THEN** 状态变为 `publish_error`，用户可选择重试或放弃

#### Scenario: 需求变更 / 放弃

- **WHEN** 用户选择变更需求、放弃或重来
- **THEN** 状态变为 `superseded`，设置 `supersededBy` 指向新会话（如有），自动归档

---

### Requirement: 发布流程（Step 4）

Tide SHALL 分三步完成发布：**4a 知识库推送**（取决于 knowledge_base MCP 可用性） → **4b 任务拆分**（用户确认任务清单） → **4c 创建工单**（取决于 issue_tracker MCP 可用性）。每步记录 publishChecklist 支持断点续传。MCP 服务可用性通过运行时读取 `deepstorm.installedMcpServers` 并与 SKILL.md 中的能力映射交叉匹配来确定。

#### Scenario: 4a 知识库推送 — 单服务可用

- **WHEN** `installedMcpServers` 中恰好有一个 knowledge-base 领域的 MCP 服务
- **THEN** AI 自动使用该服务推送 PRD，无需用户选择
- **THEN** 成功后记录 `services.knowledgeBase`，publishChecklist[0].done = true，status 变为 published

#### Scenario: 4a 知识库推送 — 多服务需选择

- **WHEN** `installedMcpServers` 中有多个 knowledge-base 领域的 MCP 服务
- **THEN** AI 展示可用服务列表由用户选择
- **THEN** 用户选择后按对应 provider 的 MCP skill 执行推送

#### Scenario: 4a 知识库推送 — 无可用服务

- **WHEN** `installedMcpServers` 中没有 knowledge-base 领域的 MCP 服务
- **THEN** 跳过 Step 4a，publishChecklist[0] 记录 `{step:"knowledge_base_push", done:true, skipped:true, note:"无可用知识库服务"}`
- **THEN** status 直接变为 published

#### Scenario: 4a 推送成功

- **WHEN** PRD Markdown 成功推送到知识库
- **THEN** 保存 `services.knowledgeBase`（含 provider 和 url），publishChecklist[0].done = true，status 变为 published

#### Scenario: 4a 推送失败

- **WHEN** 知识库推送失败
- **THEN** publishChecklist[0].done = false，status 变为 publish_error，提示用户错误信息

#### Scenario: 4b 任务拆分 — 有可用工单系统

- **WHEN** `installedMcpServers` 中有至少一个 project-management 领域的 MCP 服务
- **THEN** 将 PRD 拆解为 Epic + Story 层级，展示给用户确认
- **THEN** 用户确认后保存到 `services.issueTracker.taskBreakdown`，publishChecklist[1].done = true

#### Scenario: 4b 任务拆分 — 无可用工单系统

- **WHEN** `installedMcpServers` 中没有 project-management 领域的 MCP 服务
- **THEN** 跳过 Step 4b 和 4c，publishChecklist[1] 记录 `{step:"issue_task_split", done:true, skipped:true}`
- **THEN** publishChecklist[2] 记录 `{step:"create_issues", done:true, skipped:true}`
- **THEN** status 直接变为 completed，自动归档

#### Scenario: 4b 用户中止

- **WHEN** 4b 用户说"先这样"不想继续确认
- **THEN** 保持 published 状态，publishChecklist[1].done = false，提示可随时继续

#### Scenario: 4c 创建工单 — 单服务

- **WHEN** 4b 确认了任务清单且 issue_tracker 仅有唯一 provider
- **THEN** AI 自动使用该服务创建 Issue，无需用户选择

#### Scenario: 4c 创建工单 — 多服务需选择

- **WHEN** 4b 确认了任务清单且 issue_tracker 有多个可用 provider
- **THEN** AI 在进入 4c 前询问用户选择
- **THEN** 选择结果持久化到 `services.issueTracker.provider`，后续恢复时不重复询问

#### Scenario: 4c 全部成功

- **WHEN** 所有 Issue 创建成功
- **THEN** 保存 `services.issueTracker.urls`，publishChecklist[2].done = true 并移除 failedItems，status 变为 completed，自动归档

#### Scenario: 4c 部分失败

- **WHEN** 只成功创建了部分 Issue
- **THEN** 成功 URL 加入 `services.issueTracker.urls`（自动去重），publishChecklist[2] 记录 failedItems，status 变为 publish_error

#### Scenario: 4c 全部失败

- **WHEN** 一个 Issue 都没创建成功
- **THEN** publishChecklist[2] 记录全部条目为 failedItems，status 变为 publish_error

#### Scenario: 发布重试

- **WHEN** 用户重试 publish_error 的会话
- **THEN** 检查 publishChecklist，跳过已完成步骤，只处理失败项（如 failedItems）

---

### Requirement: MCP 集成

Tide SHALL 通过 MCP 能力映射机制与外部系统集成（知识库、工单跟踪），不绑定具体 MCP 服务。能力映射在 SKILL.md.tmpl 安装时渲染，运行时 AI 交叉引用 `deepstorm.installedMcpServers` 确定可用服务。

#### Scenario: 运行时 MCP 发现

- **WHEN** 进入 Step 4 发布流程
- **THEN** AI 读取 `.claude/settings.json` 中的 `deepstorm.installedMcpServers` 数组
- **THEN** AI 与 SKILL.md 中的能力映射 JSON 交叉匹配，确定可用 provider
- **THEN** 按可用 provider 动态调整发布流程

#### Scenario: 引用 MCP skill 指南

- **WHEN** AI 需调用某 provider（如 Jira）的 MCP 工具
- **THEN** AI 读取 `.claude/skills/mcp-{provider.id}/SKILL.md` 获取工具调用指南
- **THEN** 按指南执行操作

#### Scenario: 检查 PRD 文件存在性（4a 前置）

- **WHEN** 4a 知识库推送前
- **THEN** 检查 `tide-data/prds/{sessionId}-prd.md` 是否存在；不存在则按优先级恢复

#### Scenario: 重试时从 services.taskBreakdown 读取

- **WHEN** 4c 重试部分失败的 Issue
- **THEN** 优先从 session JSON 的 `services.issueTracker.taskBreakdown` 读取确认后的任务清单
- **THEN** 如 `services.issueTracker.taskBreakdown` 不存在，降级到旧字段 `jiraTaskBreakdown`

---

## ADDED Requirements

### Requirement: services 命名空间持久化

Session JSON SHALL 新增 `services` 字段记录外部服务交互结果，取代硬编码的 `dingtalkUrl`、`jiraUrls` 等专属字段。旧字段保留为向后兼容别名。

#### Scenario: 写操作使用新格式

- **WHEN** 知识库推送成功
- **THEN** 写入 `services.knowledgeBase`，不再修改 `dingtalkUrl`

#### Scenario: 读操作优先新格式

- **WHEN** 查看 session 详情
- **THEN** 优先读取 `services` 命名空间中的值
- **THEN** `services` 不存在时降级到 `dingtalkUrl` / `jiraUrls`
