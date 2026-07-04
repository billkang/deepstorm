## MODIFIED Requirements

### Requirement: 上下文隔离

Tide SHALL 在通过「新建」「变更需求」「重来」等操作创建新会话时，执行上下文隔离双重保障：AI 先以固定句式宣告切换，再引导用户执行 `/clear` 清空终端。不引用旧会话的内容（需求、决策、方案等），除非用户主动提及。

#### Scenario: 新建会话时执行双重隔离
- **WHEN** 通过「新建」「变更需求」「重来」等操作进入 Step 1
- **THEN** AI SHALL 以固定句式宣告上下文切换（如"好的，现在开始全新的需求讨论"）
- **AND** 紧接着引导用户执行 `/clear`（"你也可以直接输入 `/clear` 来清空终端显示"）
- **AND** 不引用旧会话的讨论内容（需求、决策、方案）
- **AND** 将旧会话视为已完结篇章
- **WHEN** 用户主动提及旧会话内容
- **THEN** AI SHALL 引用用户提到的旧内容辅助说明

### Requirement: 参考文件索引

SKILL.md SHALL 在末尾维护一个参考文件索引行，列出所有引用的 reference 文件。索引行中的文件名 SHALL 随合并策略动态调整。

#### Scenario: 索引列出合并后的 reference 文件
- **WHEN** SKILL.md 末尾展示参考文件索引
- **THEN** 索引行 SHALL 仅包含保留的独立文件：`data-format.md`、`role-prompts.md`、`checklists.md`、`prd-template.md`、`publish-flow.md`
- **AND** 已内联的文件（`entry-details.md`、`session-ops.md`、`archive.md`）SHALL 从索引行中移除
- **AND** 文件名之间以 `·` 分隔

## ADDED Requirements

### Requirement: 入口点全覆盖

每个通往 S1（新建会话）的入口点 SHALL 包含上下文隔离指令。

#### Scenario: 入口点上下文隔离全覆盖
- **WHEN** 用户从入口列表选择「新建」
- **THEN** AI SHALL 执行上下文隔离双重保障
- **WHEN** 参数查询未找到匹配会话
- **THEN** AI SHALL 进入 Step 1 前先执行上下文隔离
- **WHEN** 用户选择「变更需求」或「重来」
- **THEN** 旧会话归档后、进入 Step 1 前 AI SHALL 执行上下文隔离
- **WHEN** 流程结束（DONE/SUP）用户表示要新建需求
- **THEN** AI SHALL 先执行上下文隔离再进入 Step 1
