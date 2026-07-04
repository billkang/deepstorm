# 动态发布流程

## Purpose

Step 4 发布流程不再假定钉钉和 Jira 存在，而是根据能力映射动态适配——知识库可用则执行 4a，否则跳过；工单系统可用则执行 4b+4c，否则跳过。当多个工单系统可用时，在 4b 入口询问用户选择。

## Requirements

### Requirement: 4a 按 knowledge_base 能力可用性执行

Step 4a SHALL 根据能力映射中 `knowledge_base` 的 provider 可用性决定是否执行知识库推送。provider 可用性由运行时 `installedMcpServers` 交叉匹配确定。

#### Scenario: 单知识库可用时正常推送

- **WHEN** 能力映射中 `knowledge_base` 有 1 个可用 provider（如飞书知识库）
- **THEN** AI SHALL 读取 `.claude/skills/deepstorm-mcp-feishu-wiki-write/SKILL.md` 了解工具调用方式
- **THEN** AI SHALL 按指南将 PRD Markdown 推送到飞书知识库
- **THEN** 成功后 `publishChecklist[0]` 记录 `{step:"knowledge_base_push", done:true}`
- **THEN** 成功后 `services.knowledgeBase` 记录 `{provider:"feishu-wiki", url:"..."}`
- **THEN** session `status` 改为 `published`

#### Scenario: 多知识库可用时由用户选择

- **WHEN** 能力映射中 `knowledge_base` 有 2 个或以上可用 provider
- **THEN** AI SHALL 展示可用列表让用户选择
- **THEN** 用户选择后，AI 按所选 provider 的 skill 指南执行推送
- **THEN** 所选 provider 记入 `services.knowledgeBase.provider`

#### Scenario: 无可用知识库时跳过 4a

- **WHEN** 能力映射中 `knowledge_base` 的 provider 数组为空或全部不可用
- **THEN** AI SHALL 在 `publishChecklist[0]` 中记录 `{step:"knowledge_base_push", done:true, skipped:true, note:"无可用知识库服务"}`
- **THEN** session `status` SHALL 直接改为 `published`
- **THEN** AI SHALL 告知用户"未检测到知识库服务，跳过 PRD 推送"

#### Scenario: 4a 执行失败

- **WHEN** 知识库 MCP 调用返回错误或超时
- **THEN** `publishChecklist[0]` 记录 `{step:"knowledge_base_push", done:false, note:"错误信息"}`
- **THEN** session `status` SHALL 改为 `publish_error`
- **THEN** AI SHALL 提示用户错误信息，提供重试或放弃发布选项

---

### Requirement: 4b 按 issue_tracker 能力可用性执行

Step 4b SHALL 根据能力映射中 `issue_tracker` 的 provider 可用性决定是否执行任务拆分。4b 本身不依赖 MCP 调用，仅在无可用工单系统时整步跳过。

#### Scenario: 有可用工单系统时正常拆分

- **WHEN** 能力映射中 `issue_tracker` 有至少 1 个可用 provider
- **THEN** AI SHALL 按第 4b 步流程将 PRD 拆分为候选任务清单
- **THEN** AI SHALL 展示给用户确认
- **THEN** 用户确认后，任务清单写入 `services.issueTracker.taskBreakdown`
- **THEN** `publishChecklist[1]` 记录 `{step:"issue_task_split", done:true}`

#### Scenario: 多工单系统可用时询问选择

- **WHEN** 能力映射中 `issue_tracker` 有 2 个或以上可用 provider
- **THEN** AI SHALL 在 4b 入口询问用户"检测到多个工单系统，本次使用哪个？"
- **THEN** 用户选择后，持久化到 `services.issueTracker.provider`
- **THEN** 同一 session 内后续 4c 使用同一 provider
- **THEN** 恢复该 session 时，直接读取 `services.issueTracker.provider`，不再重新询问

#### Scenario: 无可用工单系统时跳过 4b + 4c

- **WHEN** 能力映射中 `issue_tracker` 的 provider 数组为空或全部不可用
- **THEN** AI SHALL 在 `publishChecklist[1]` 中记录 `{step:"issue_task_split", done:true, skipped:true, note:"无可用工单系统"}`
- **THEN** AI SHALL 在 `publishChecklist[2]` 中记录 `{step:"create_issues", done:true, skipped:true, note:"无可用工单系统"}`
- **THEN** session `status` SHALL 直接改为 `completed`
- **THEN** AI SHALL 告知用户"未检测到工单系统，跳过任务拆分和 Issue 创建"

---

### Requirement: 4c 按 issue_tracker 能力可用性执行

Step 4c SHALL 根据能力映射和 4b 的选择执行工单创建。

#### Scenario: 单工单系统正常创建

- **WHEN** 4b 中已确认任务清单，且 `issue_tracker` 有唯一可用 provider（如 Jira）
- **THEN** AI SHALL 读取 `.claude/skills/deepstorm-mcp-jira-write/SKILL.md` 了解工具调用方式
- **THEN** AI SHALL 逐条创建 Issue
- **THEN** 全部成功时 `publishChecklist[2]` 记录 `{step:"create_issues", done:true, total:N, created:N}`
- **THEN** `services.issueTracker.urls` 记录所有创建成功的 Issue URL
- **THEN** session `status` 改为 `completed` 并自动归档

#### Scenario: 4c 部分失败

- **WHEN** 成功创建 M/N 个 Issue
- **THEN** `services.issueTracker.urls` 追加成功 URL（自动去重）
- **THEN** `publishChecklist[2]` 记录 `{step:"create_issues", done:false, total:N, created:M, failedItems:[...]}`
- **THEN** session `status` 改为 `publish_error`
- **THEN** AI SHALL 提示用户失败条目，下次恢复时从 `failedItems` 重建

#### Scenario: 4c 全部失败

- **WHEN** 0/N 个 Issue 创建成功
- **THEN** `publishChecklist[2]` 记录 `{step:"create_issues", done:false, total:N, created:0, failedItems:[...]}`
- **THEN** session `status` 改为 `publish_error`
- **THEN** AI SHALL 提示用户检查 MCP 连接

---

### Requirement: 恢复路径适配 publishChecklist skipped 语义

恢复 `published` 或 `publish_error` 状态的 session 时，AI SHALL 检查 `publishChecklist` 中的 `skipped` 标记，跳过已被跳过的步骤。

#### Scenario: 恢复已跳过 4a 的 published session

- **WHEN** session 的 `publishChecklist[0]` 为 `{step:"knowledge_base_push", done:true, skipped:true}`
- **THEN** AI SHALL 跳过 4a，不再执行知识库推送
- **THEN** AI SHALL 进入 4b 检查可用工单系统

#### Scenario: 恢复有 failedItems 的 publish_error session

- **WHEN** session 的 `publishChecklist[2]` 中有非空的 `failedItems`
- **AND** `services.issueTracker.taskBreakdown` 存在
- **THEN** AI SHALL 从 `taskBreakdown` 重建上下文，仅重试 `failedItems` 中的条目
