## ADDED Requirements

### Requirement: Jump Issue 外部依赖
开放讨论路径 SKIP Issue 获取、PRD 获取、设计稿获取三个外部依赖步骤。

#### Scenario: 跳过 Issue 获取
- **WHEN** 进入 Path B
- **THEN** AI SHALL NOT 要求用户提供 Issue 编号或 URL，SHALL NOT 调用任何 issue_tracker MCP 服务，SHALL NOT 询问"你的 Issue 是什么"

#### Scenario: 跳过 PRD 获取
- **WHEN** 进入 Path B
- **THEN** AI SHALL NOT 要求用户提供 PRD 链接或知识库链接，SHALL NOT 调用任何 knowledge_base MCP 服务

#### Scenario: 跳过设计稿获取
- **WHEN** 进入 Path B
- **THEN** AI SHALL NOT 要求用户提供设计稿链接，SHALL NOT 调用任何 design_tools MCP 服务

### Requirement: 需求讨论与记录（BMAD 风格）
开放讨论路径以结构化的自由讨论开始，并将讨论记录为 brainstorming 文件。

#### Scenario: 创建 OpenSpec change
- **WHEN** 进入 Path B
- **THEN** AI SHALL 立即创建 OpenSpec change（变更名根据用户输入摘要自动生成 kebab-case 名称），然后展开需求讨论

#### Scenario: 结构化需求讨论
- **WHEN** AI 已创建 OpenSpec change 并开始讨论
- **THEN** AI SHALL 按以下框架引导讨论：
  1. **核心意图**：你想解决什么问题或做什么功能？
  2. **具体范围**：具体要改什么？哪些模块？
  3. **边界定义**：第一版明确不做什么？
  4. **注意事项**：有没有已知约束、依赖或风险？
  讨论 SHALL 以对话方式推进，AI 逐步引导而非一次性问完所有问题。讨论过程中 AI SHALL 记录关键信息。

#### Scenario: 产出 brainstorming 文件
- **WHEN** 需求讨论已基本收敛（用户 no 就"做什么"和"不做什么"达成一致）
- **THEN** AI SHALL 将讨论内容整理为 `_bmad-output/brainstorming/brainstorming-session-{date}-{seq}.md`，作为后续 SDD 流程的输入来源

### Requirement: 进入 SDD 子流程
讨论完成后，进入标准的 proposal → specs → design → tasks → superpowers 门禁 → 实现流程。

#### Scenario: 讨论完成后进入 SDD
- **WHEN** brainstorming 文件已产出且需求已清晰
- **THEN** AI SHALL 基于 brainstorming 内容创建 proposal，然后按 /opsx:continue 顺序推进 specs → design → tasks

#### Scenario: 不创建 git 分支
- **WHEN** 进入 Path B
- **THEN** AI SHALL NOT 自动创建 git 分支。分支创建推迟到实现阶段开始时（在 superpowers 门禁通过后、Stage 4 TDD 实现前）
