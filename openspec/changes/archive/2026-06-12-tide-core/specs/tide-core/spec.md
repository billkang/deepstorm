# Tide — 产品侧需求讨论与 PRD 工作流

## ADDED Requirements

### Requirement: 数据存储层自动初始化

Tide SHALL 在启动时自动创建 `tide-data/{sessions,archive,prds}` 三个子目录（相对于 `$PWD`）。

#### Scenario: 首次启动创建目录
- **WHEN** Tide 首次启动且 `tide-data/` 目录不存在
- **THEN** 系统自动创建 `tide-data/sessions/`、`tide-data/archive/`、`tide-data/prds/` 三个目录

#### Scenario: 目录已存在不重复创建
- **WHEN** Tide 启动时 `tide-data/` 目录已存在
- **THEN** 跳过目录创建，不报错

---

### Requirement: 会话 ID 生成

会话 ID 格式 SHALL 为 `tide-YYYYMMDD-NNN`，通过 `tide-data/sessions/.sequence` 文件维护自增序列号。

- YYYYMMDD = 当前日期
- NNN = 当日递增序列号（从 001 开始）
- 跨天时 NNN 重置为 001

#### Scenario: 正常自增
- **WHEN** 创建新会话且当日已存在 N 个会话
- **THEN** 新会话的 NNN 为 N+1，.sequence 文件更新为新值

#### Scenario: 跨天重置
- **WHEN** 创建新会话且日期与 .sequence 记录不一致
- **THEN** NNN 重置为 001

#### Scenario: .sequence 文件损坏
- **WHEN** .sequence 文件内容格式错误
- **THEN** 忽略损坏文件，基于 sessions/ 目录现有文件的最大序列号 + 1 计算新序列号；目录为空时从 001 开始

---

### Requirement: Feature ID 生成

Feature ID 格式 SHALL 为 `MODULE-FUNCTION-SUBFUNCTION`（全大写 + 连字符），不超过 5 个英文单词。

#### Scenario: 根据需求生成 featureId
- **WHEN** 用户描述一个需求
- **THEN** AI 将需求翻译为英文，提取 2-4 个核心关键词按模块-功能-子功能层级排列

#### Scenario: AI 拿不准时提供备选
- **WHEN** AI 对 featureId 中的关键词选择不确定
- **THEN** 提供 2-3 个备选方案让用户选择

---

### Requirement: Session JSON 持久化

Tide SHALL 将会话数据持久化为 JSON 文件，包含完整的状态和步骤记录。

#### Scenario: 创建新会话
- **WHEN** Step 1 完成初始化
- **THEN** 在 `tide-data/sessions/` 下创建 `{sessionId}.json`，初始 `status` 为 `active`

#### Scenario: 更新会话状态
- **WHEN** 工作流进入新的步骤（如 PRD 生成、发布成功）
- **THEN** session JSON 的 `status` 字段更新为对应状态

#### Scenario: 角色讨论进度持久化
- **WHEN** 每轮角色讨论后
- **THEN** 更新 `steps[].checklist` 中对应项的 `done` 值，写入文件

#### Scenario: 发布进度持久化
- **WHEN** 发布流程每步完成或失败
- **THEN** 更新 `publishChecklist` 字段，支持断点续传

---

### Requirement: 状态流转

Session 状态 SHALL 按以下路径流转：`active → prd_ready → published → completed`，失败时进入 `publish_error`，变更/放弃时进入 `superseded`。

#### Scenario: 正常流转
- **WHEN** 必需角色讨论完成 → PRD 生成
- **THEN** 状态从 `active` 变为 `prd_ready`
- **WHEN** PRD 成功推送到钉钉
- **THEN** 状态从 `prd_ready` 变为 `published`
- **WHEN** 所有 Jira Issue 创建成功
- **THEN** 状态从 `published` 变为 `completed`，自动归档

#### Scenario: 发布失败
- **WHEN** 推送到钉钉或创建 Jira Issue 失败
- **THEN** 状态变为 `publish_error`，用户可选择重试或放弃

#### Scenario: 需求变更 / 放弃
- **WHEN** 用户选择变更需求、放弃或重来
- **THEN** 状态变为 `superseded`，设置 `supersededBy` 指向新会话（如有），自动归档

---

### Requirement: 入口扫描与触发

Tide SHALL 在启动时扫描 `tide-data/sessions/` 目录，根据用户输入决策进入哪个功能分支。

#### Scenario: 自然语言触发
- **WHEN** 用户说出"我想做一个…"、"我们讨论一下…"等明确需求表达
- **THEN** Tide 自动激活并进入工作流

#### Scenario: 不触发场景
- **WHEN** 用户只是随口抱怨（"这个按钮好丑"）或表达模糊想法
- **THEN** Tide 不自动激活

#### Scenario: /tide 显式触发
- **WHEN** 用户输入 `/tide`
- **THEN** Tide 激活，扫描会话列表并展示

#### Scenario: 讨论中不自动开启新会话
- **WHEN** 当前已有正在进行的角色讨论，用户又提出另一个需求
- **THEN** 提示用户选择：结束当前开始新的，还是先记录继续当前

#### Scenario: 入口无参数
- **WHEN** 用户输入 `/tide` 无附加参数
- **THEN** 展示所有未完结会话（active / prd_ready / published / publish_error），按状态分组列出

#### Scenario: 入口有参数（sessionId / featureId / 关键词）
- **WHEN** 用户输入 `/tide {sessionId}` 或 `/tide {featureId}` 或 `/tide {需求描述}`
- **THEN** 同时搜索 `sessions/` 和 `archive/` 目录，按状态分组展示结果

#### Scenario: 自动归档遗留文件
- **WHEN** 入口扫描发现 `sessions/` 中存在 `status` 为 `completed` 或 `superseded` 的文件
- **THEN** 自动移动到 `archive/` 目录并提示用户

#### Scenario: 文件损坏跳过
- **WHEN** 扫描时某个 JSON 文件解析失败
- **THEN** 跳过该文件继续加载其他文件，回复中提示用户发现损坏文件

---

### Requirement: Step 1 初始化会话

Tide SHALL 在明确需求后完成会话初始化：提炼 brief、生成 sessionId、生成 featureId、创建 session JSON 文件。

#### Scenario: 有上下文预填
- **WHEN** 入口传入了 featureId / brief 预填值
- **THEN** 直接用预填值，不重复澄清需求

#### Scenario: 无上下文自动提炼
- **WHEN** 无预填值
- **THEN** 向用户澄清需求后，AI 提炼为不超过 50 字的中文概要存入 `brief`

#### Scenario: 关联旧会话
- **WHEN** 入口关联了旧会话（parent）
- **THEN** 新会话 JSON 中设置 `parent` 字段为旧 sessionId

#### Scenario: Step 1 → analyst 过渡
- **WHEN** Step 1 完成后进入 analyst 角色
- **THEN** analyst 先简要复述已提炼的 brief，再深入讨论（不重复问"你想做什么"）

---

### Requirement: Step 2 BMAD 角色讨论

Tide SHALL 按固定顺序引导用户完成 5 个 BMAD 角色的讨论：analyst（必需）→ pm（必需）→ architect（可选）→ designer（可选）→ po（可选）。

#### Scenario: 正常顺序讨论
- **WHEN** 进入 Step 2
- **THEN** 从 analyst 开始，一次只扮演一个角色，一次只问一个问题

#### Scenario: 必需角色门禁
- **WHEN** analyst 和 pm 的 checklist 全部完成
- **THEN** 允许进入 Step 3 生成 PRD；否则阻塞

#### Scenario: 可选角色跳过
- **WHEN** 用户同意跳过可选角色
- **THEN** 在 steps[] 中记录 `skipped: true`，不阻塞 PRD 生成

#### Scenario: 可选角色开始后需完成
- **WHEN** 用户开始讨论一个可选角色
- **THEN** 该角色需要全部 checklist 完成才算通过

#### Scenario: 用户说"差不多"
- **WHEN** 角色讨论中用户说"差不多"或想提前结束
- **THEN** 检查 checklist 中是否有未完成项并追问；用户仍坚持则标记已协商完成

#### Scenario: 用户岔开话题
- **WHEN** 用户问到非当前角色的问题
- **THEN** 先简要回应（不超过 1 句），然后自然引导回当前话题

#### Scenario: 用户问非当前角色的问题
- **WHEN** 如 analyst 阶段用户问技术实现问题
- **THEN** 记录为待办项，说"这个问题留给架构师 Winston"，回到当前角色话题

#### Scenario: 讨论中收到 /tide 命令
- **WHEN** Step 2 讨论中用户输入 `/tide`
- **THEN** 保存当前进度到文件，退出角色，回到入口列表

#### Scenario: 恢复会话时跳过已完成角色
- **WHEN** 从入口恢复一个 active 会话
- **THEN** 按角色顺序找到第一个 `completedAt: null`（且非 skipped）的角色继续

#### Scenario: 恢复时的 checklist 重建
- **WHEN** 恢复一个 active 会话
- **THEN** 从 session JSON 的 `steps[].checklist` 读取已持久化的进度，仅展示未完成项

---

### Requirement: 角色 Checklist

每个角色 SHALL 有固定的讨论 checklist，AI 进入角色时展示全部，讨论后逐项更新状态。

#### Scenario: 进入时展示全部 checklist
- **WHEN** AI 进入一个角色
- **THEN** 立即展示全部 checklist 项（均标记 ⬜），然后只追问第一项未完成项

#### Scenario: 每轮讨论后更新
- **WHEN** 用户每轮回答后
- **THEN** AI 评估哪些项已覆盖充分，更新 checklist 状态（⬜ → ☑️）

#### Scenario: Checklist 持久化三步走
- **WHEN** 进入角色时
- **THEN** 在 session JSON 的 `steps[]` 中追加骨架记录（含 checklist 定义，全部 `done: false`），写入文件
- **WHEN** 每轮讨论后
- **THEN** 更新对应项的 `done` 值，写入文件
- **WHEN** 角色完成时
- **THEN** 补全 summary、decisions、requirements，设置 `completedAt`，写入文件

---

### Requirement: PRD 生成（Step 3）

Tide SHALL 在所有必需角色讨论完成后自动生成 PRD 文档（Markdown + JSON 快照）。

#### Scenario: 正常生成
- **WHEN** analyst 和 pm 的 checklist 全部完成
- **THEN** 自动生成 PRD Markdown 和 JSON 快照，保存到 `tide-data/prds/`，状态变为 `prd_ready`

#### Scenario: Markdown 文件丢失恢复
- **WHEN** 4a 推送到钉钉前发现 PRD Markdown 文件不存在
- **THEN** 优先从 JSON 快照恢复，其次从 session steps 恢复，告知用户文件已恢复

---

### Requirement: 发布流程（Step 4）

Tide SHALL 分三步完成发布：4a 推送到钉钉 → 4b 拆分 Jira 任务 → 4c 创建 Jira Issue，每步记录 publishChecklist 支持断点续传。

#### Scenario: 4a 推送到钉钉成功
- **WHEN** PRD Markdown 成功上传到钉钉云文档
- **THEN** 保存 dingtalkUrl，publishChecklist[0].done = true，status 变为 published

#### Scenario: 4a 推送到钉钉失败
- **WHEN** 上传到钉钉失败
- **THEN** publishChecklist[0].done = false，status 变为 publish_error，提示用户错误信息

#### Scenario: 4b 拆分 Jira 任务
- **WHEN** PRD 已推送到钉钉（published）
- **THEN** 将 PRD 拆解为 Epic + Story 层级，展示给用户确认；用户确认后保存到 jiraTaskBreakdown

#### Scenario: 4b 用户中止
- **WHEN** 4b 用户说"先这样"不想继续确认
- **THEN** 保持 published 状态，publishChecklist[1].done = false，提示可随时继续

#### Scenario: 4c 全部成功
- **WHEN** 所有 Jira Issue 创建成功
- **THEN** 保存 jiraUrls，publishChecklist[2].done = true 并移除 failedItems，status 变为 completed，自动归档

#### Scenario: 4c 部分失败
- **WHEN** 只成功创建了部分 Jira Issue
- **THEN** 成功 URL 加入 jiraUrls（自动去重），publishChecklist[2] 记录 failedItems，status 变为 publish_error

#### Scenario: 4c 全部失败
- **WHEN** 一个 Jira Issue 都没创建成功
- **THEN** publishChecklist[2] 记录全部条目为 failedItems，status 变为 publish_error

#### Scenario: 发布重试
- **WHEN** 用户重试 publish_error 的会话
- **THEN** 检查 publishChecklist，跳过已完成步骤，只处理失败项（如 failedItems）

---

### Requirement: 归档

Tide SHALL 在会话达到终态时自动归档，减少入口列表噪音。

#### Scenario: completed 自动归档
- **WHEN** 4c 全部成功（status → completed）
- **THEN** 立即将 session JSON 从 `sessions/` 移动到 `archive/`

#### Scenario: superseded 自动归档
- **WHEN** 用户选择放弃或变更需求（status → superseded）
- **THEN** 立即将 session JSON 从 `sessions/` 移动到 `archive/`

#### Scenario: 归档后不展示在入口
- **WHEN** 入口扫描
- **THEN** 不读取 `archive/` 目录的会话，仅在参数查询时同时搜索两个目录

#### Scenario: 已完成会话的操作
- **WHEN** 用户通过参数查询访问到 `completed` 会话
- **THEN** 展示 PRD 内容和所有 Jira issue 链接（只读）

#### Scenario: 已废弃会话的操作
- **WHEN** 用户查询到 `superseded` 会话
- **THEN** 展示原会话内容（只读），提示替代会话（如 supersededBy 有值），提供「重来」选项

#### Scenario: 会话关联展示
- **WHEN** 查看 `superseded` 会话
- **THEN** 加载关联会话信息一并展示，包含替代会话的 featureId、sessionId 和最新需求摘要

---

### Requirement: 结束行为

Tide SHALL 在工作流结束节点自动回到正常对话模式。

#### Scenario: 流程结束回到对话
- **WHEN** DONE（Jira 创建成功已归档）
- **THEN** 告知用户后问"还有其他需求吗？"或等待用户自然继续
- **WHEN** SUP（已放弃/归档）
- **THEN** 告知用户后问是否新建其他需求
- **WHEN** EXIT（稍后处理）
- **THEN** 回到入口列表

---

### Requirement: MCP 集成

Tide SHALL 支持通过 MCP 服务器与外部系统集成（钉钉云文档、Jira）。

#### Scenario: 检查 PRD 文件存在性（4a 前置）
- **WHEN** 4a 推送到钉钉前
- **THEN** 检查 `tide-data/prds/{sessionId}-prd.md` 是否存在；不存在则按优先级恢复

#### Scenario: 重试时从 jiraTaskBreakdown 读取
- **WHEN** 4c 重试部分失败的 Issue
- **THEN** 优先从 session JSON 的 `jiraTaskBreakdown` 读取确认后的任务清单
