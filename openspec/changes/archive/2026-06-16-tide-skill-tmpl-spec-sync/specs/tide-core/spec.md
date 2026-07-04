## ADDED Requirements

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

Tide SHALL 在通过「新建」「变更需求」「重来」等操作创建新会话时，主动重置讨论上下文，不引用旧会话的内容（需求、决策、方案等），除非用户主动提及。

#### Scenario: 新建会话时不引用旧内容
- **WHEN** 通过「变更需求」「重来」等操作创建新会话
- **THEN** AI SHALL 重置讨论上下文
- **AND** 不引用旧会话的讨论内容（需求、决策、方案）
- **AND** 以全新心态开始新一轮需求引导
- **AND** 将旧会话视为已完结篇章
- **WHEN** 用户主动提及旧会话内容
- **THEN** AI SHALL 引用用户提到的旧内容辅助说明

---

### Requirement: 参考文件索引

SKILL.md SHALL 在末尾维护一个参考文件索引行，列出所有引用的 reference 文件。

#### Scenario: 索引列出所有 reference
- **WHEN** SKILL.md 末尾展示参考文件索引
- **THEN** 索引行 SHALL 包含以下文件：`entry-details.md`、`data-format.md`、`role-prompts.md`、`checklists.md`、`prd-template.md`、`publish-flow.md`、`session-ops.md`、`archive.md`
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
