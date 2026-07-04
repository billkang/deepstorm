# Tide — 产品侧需求讨论与 PRD 工作流

## Purpose

Tide 是 DeepStorm 产品侧套件，提供 BMAD 多角色需求讨论 → PRD 自动生成 → 知识库推送 → 任务拆分 → Issue 创建的全流程支持。所有数据存储在本地文件系统，不依赖外部服务。发布流程根据用户实际安装的 MCP 服务动态适配。

## Requirements

### Requirement: 数据存储层自动初始化

Tide SHALL 在启动时自动创建 `tide-data/{sessions,archive,prds,abandoned}` 四个子目录（相对于 `$PWD`）。会话索引文件 `tide-data/sessions/.index.json` SHALL 在首次创建会话时自动生成。

#### Scenario: 首次启动创建目录
- **WHEN** Tide 首次启动且 `tide-data/` 目录不存在
- **THEN** 系统自动创建 `tide-data/sessions/`、`tide-data/archive/`、`tide-data/prds/`、`tide-data/abandoned/` 四个目录

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

### Requirement: services 命名空间持久化

Session JSON SHALL 新增 `services` 字段记录外部服务交互结果，取代硬编码的 `dingtalkUrl`、`jiraUrls` 等专属字段。旧字段保留为向后兼容别名。

#### Scenario: 写操作使用新格式

- **WHEN** 知识库推送成功
- **THEN** 写入 `services.knowledgeBase`，不再修改 `dingtalkUrl`

#### Scenario: 读操作优先新格式

- **WHEN** 查看 session 详情
- **THEN** 优先读取 `services` 命名空间中的值
- **THEN** `services` 不存在时降级到 `dingtalkUrl` / `jiraUrls`

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
- **WHEN** 4a 推送到飞书前发现 PRD Markdown 文件不存在
- **THEN** 优先从 JSON 快照恢复，其次从 session steps 恢复，告知用户文件已恢复

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

### Requirement: 归档

Tide SHALL 在会话达到终态时自动归档，减少入口列表噪音。会话废弃（superseded）时，已生成的 PRD 文件 SHALL 移入 `tide-data/abandoned/` 目录。

#### Scenario: completed 自动归档
- **WHEN** 4c 全部成功（status → completed）
- **THEN** 立即将 session JSON 从 `sessions/` 移动到 `archive/`

#### Scenario: superseded 自动归档
- **WHEN** 用户选择放弃或变更需求（status → superseded）
- **THEN** 立即将 session JSON 从 `sessions/` 移动到 `archive/`

#### Scenario: superseded 时清理 PRD 文件
- **WHEN** 会话进入 superseded 状态
- **THEN** 检查 `tide-data/prds/{sessionId}-prd.md` 和 `tide-data/prds/{sessionId}-prd.json` 是否存在
- **THEN** 存在的 PRD 文件移动到 `tide-data/abandoned/`
- **AND** PRD 文件不存在时不报错（静默跳过）

#### Scenario: 归档后不展示在入口
- **WHEN** 入口扫描
- **THEN** 不读取 `archive/` 目录的会话，仅在参数查询时同时搜索两个目录

#### Scenario: 已完成会话的操作
- **WHEN** 用户通过参数查询访问到 `completed` 会话
- **THEN** 展示 PRD 内容和所有工单链接（只读）

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
- **WHEN** DONE（工单创建成功，已归档）
- **THEN** 告知用户后问"还有其他需求吗？"或等待用户自然继续
- **WHEN** SUP（已放弃/归档）
- **THEN** 告知用户后问是否新建其他需求
- **WHEN** EXIT（稍后处理）
- **THEN** 回到入口列表

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
- **THEN** AI 读取 `.claude/skills/deepstorm-mcp-{provider-id}-write/SKILL.md`（或 `-read`，按操作类型）获取工具调用指南
- **THEN** 按指南执行操作

#### Scenario: 检查 PRD 文件存在性（4a 前置）

- **WHEN** 4a 知识库推送前
- **THEN** 检查 `tide-data/prds/{sessionId}-prd.md` 是否存在；不存在则按优先级恢复

#### Scenario: 重试时从 services.taskBreakdown 读取

- **WHEN** 4c 重试部分失败的 Issue
- **THEN** 优先从 session JSON 的 `services.issueTracker.taskBreakdown` 读取确认后的任务清单
- **THEN** 如 `services.issueTracker.taskBreakdown` 不存在，降级到旧字段 `jiraTaskBreakdown`

---

### Requirement: Step 3 MCP 能力发现前置检查

Tide SHALL 在 Step 3 生成 PRD 后、向用户展示操作选项之前，先执行 MCP 能力发现。不能等到进入 Step 4 才做。

#### Scenario: Step 3 完成后执行 MCP 发现
- **WHEN** 所有必需角色（analyst + pm）讨论完成，PRD 已生成（status → prd_ready）
- **THEN** AI **必须先执行 MCP 能力发现**（读取 `{{tide_capabilities}}` + 交叉引用 `deepstorm.installedMcpServers`）
- **THEN** AI 根据能力映射结果**只展示可用的操作选项**
- **AND** `knowledge_base.available = true` → 展示"推送到知识库（4a）"选项
- **AND** `issue_tracker.available = true` → 展示"拆分为任务（4b）"选项
- **AND** 始终展示"查看 PRD"和"稍后再处理"选项
- **AND** 全部不可用时，自动全部跳过（4a+4b+4c 标记 skipped），`status` → `completed`，告知用户后自动归档

---

### Requirement: Step 2 角色讨论约束规则

Tide SHALL 在 Step 2 角色讨论中遵循以下行为约束：单角色、单问题、不替用户决策、语言跟随用户。

#### Scenario: 一次只扮演一个角色
- **WHEN** 进入 Step 2 角色讨论
- **THEN** AI SHALL 一次只扮演一个角色
- **AND** 不在一轮对话中扮演两个不同角色

#### Scenario: 一次只问一个问题
- **WHEN** AI 向用户提问
- **THEN** AI SHALL 一次只问一个问题
- **AND** 不同时抛出多个问题让用户回答

#### Scenario: 不替用户做决定
- **WHEN** 用户面临选择或决策
- **THEN** AI SHALL 引导用户自己决策
- **AND** 不给用户施加倾向性引导导致替用户做决定

#### Scenario: 讨论语言跟随用户
- **WHEN** 用户使用某种语言（如中文、英文）讨论
- **THEN** AI SHALL 使用同一种语言进行讨论

---

### Requirement: 上下文隔离

Tide SHALL 在通过「新建」「变更需求」「重来」等操作创建新会话时，执行上下文隔离双重保障：AI 先以固定句式宣告切换，再引导用户执行 `/clear` 清空终端。不引用旧会话的内容（需求、决策、方案等），除非用户主动提及。

#### Scenario: 新建会话时执行双重隔离
- **WHEN** 通过「新建」「变更需求」「重来」等操作进入 Step 1
- **THEN** AI SHALL 以固定句式宣告上下文切换
- **AND** 引导用户执行 `/clear`
- **AND** 不引用旧会话的讨论内容（需求、决策、方案）
- **AND** 将旧会话视为已完结篇章
- **WHEN** 用户主动提及旧会话内容
- **THEN** AI SHALL 引用用户提到的旧内容辅助说明

---

### Requirement: 参考文件索引

SKILL.md SHALL 在末尾维护一个参考文件索引行，列出所有引用的 reference 文件。索引行中的文件名 SHALL 随合并策略动态调整。

#### Scenario: 索引列出合并后的 reference 文件
- **WHEN** SKILL.md 末尾展示参考文件索引
- **THEN** 索引行 SHALL 包含以下文件：`data-format.md`、`role-prompts.md`、`checklists.md`、`prd-template.md`、`publish-flow.md`
- **AND** 文件名之间以 `·` 分隔

---

### Requirement: Feature ID 字数限制

Feature ID SHALL 不超过 5 个英文单词（如 `AUTH-LOGIN-WECOM` 计为 3 个，`PAYMENT-ORDER-REFUND-V2` 计为 4 个）。

#### Scenario: 不超 5 单词
- **WHEN** AI 生成 featureId
- **THEN** featureId SHALL 不超过 5 个英文单词
- **AND** 超过 5 个单词的 featureId SHALL 被截断或简化

---

### Requirement: PRD 模板引用

Step 3 PRD 生成的模板定义 SHALL 位于 `references/prd-template.md` 中。

#### Scenario: PRD 按模板生成
- **WHEN** Step 3 生成 PRD Markdown
- **THEN** AI SHALL 参考 `references/prd-template.md` 中的模板结构生成

---

### Requirement: 会话索引缓存

Tide SHALL 在 `tide-data/sessions/.index.json` 维护一个轻量摘要索引，记录每个 session 的元信息（sessionId、status、brief、createdAt、featureId）。索引文件 SHALL 在 session 创建、状态更新、归档时同步维护。

#### Scenario: 启动时优先读索引
- **WHEN** Tide 启动且 `tide-data/sessions/.index.json` 存在
- **THEN** 优先加载索引文件中的 session 摘要，不再逐个读入完整 JSON
- **AND** 仅当用户选中某个 session 时才读取完整的 `{sessionId}.json`

#### Scenario: 索引不存在时降级
- **WHEN** `.index.json` 不存在（首次运行或文件丢失）
- **THEN** 降级为扫描 `sessions/*.json` 完整读取（原行为）
- **AND** 不影响任何功能

#### Scenario: 创建会话时写入索引
- **WHEN** Step 1 完成 session 创建
- **THEN** 在 `.index.json` 中追加新 session 的摘要条目

#### Scenario: 状态更新时同步索引
- **WHEN** session 状态变更（如 active → prd_ready、prd_ready → published）
- **THEN** 更新 `.index.json` 中对应条目的 status 字段

#### Scenario: 归档时删除索引条目
- **WHEN** session JSON 从 `sessions/` 移入 `archive/`（completed / superseded）
- **THEN** 从 `.index.json` 中移除对应条目

---

### Requirement: MCP 能力发现缓存

Tide SHALL 在 Step 4 MCP 能力发现后，将结果缓存到 session JSON 的 `services.capabilities` 字段。恢复已发布的 session 时优先使用缓存值，避免重复发现。

#### Scenario: 首次发现后缓存
- **WHEN** Step 4 MCP 能力发现成功完成
- **THEN** 将发现结果写入 session JSON 的 `services.capabilities`
- **AND** 包含 `knowledge_base` 和 `issue_tracker` 两域的可用性和 provider 信息

#### Scenario: 恢复时使用缓存
- **WHEN** 恢复 `published` 或 `publish_error` 状态的 session
- **THEN** 检查 `services.capabilities` 是否存在
- **THEN** 存在时直接使用缓存值执行发布流程，跳过重新发现
- **THEN** 不存在时走完整发现逻辑

#### Scenario: 用户要求刷新缓存
- **WHEN** 用户明确要求"重试"、"刷新"或"重新检查"MCP 服务
- **THEN** 忽略 `services.capabilities` 缓存，重新发现并更新

---

### Requirement: 启动依赖检查

Tide SHALL 在入口扫描完成后检查 `deepstorm.installedSkills` 中是否包含 `bmad` 和 `grill-me` 两个依赖 skill，并根据结果提醒用户。

#### Scenario: bmad 未安装时警告
- **WHEN** `deepstorm.installedSkills` 中不包含 `bmad`
- **THEN** 提醒用户 bmad 是 tide-discuss 角色讨论的必需依赖
- **AND** 建议运行 `npx @deepstorm/cli setup` 安装
- **AND** 不阻止 tide-discuss 继续运行

#### Scenario: grill-me 未安装时提示
- **WHEN** `deepstorm.installedSkills` 中不包含 `grill-me`
- **THEN** 温和提示用户安装后可获得更好的需求追问体验
- **AND** 不阻止 tide-discuss 继续运行

#### Scenario: 仅入口执行一次
- **WHEN** 同一 session 的讨论过程中再次进入入口扫描
- **THEN** 不再重复检查依赖
