## ADDED Requirements

### Requirement: 用 Mermaid 流程图替代文字流程描述
Skill 文档中代表流程逻辑的部分（决策路由、步骤流转、分支判断）SHALL 使用 Mermaid `flowchart` 图替代等效的文字描述，以提升可读性并减少行数。

#### Scenario: 入口门禁路由
- **WHEN** SKILL.md 文档了基于消息类型的多分支路由逻辑
- **THEN** 一个 Mermaid 决策树 SHALL 替代文字路由表，直观展示各消息类型对应的步骤分支

#### Scenario: 步骤间流转
- **WHEN** SKILL.md 文档了一个带条件分支的步骤序列
- **THEN** 一个 Mermaid 流程图 SHALL 使用菱形节点表示条件判断、矩形节点表示操作步骤

#### Scenario: 正误路径对比
- **WHEN** SKILL.md 文档了两种互斥的执行路径（正确做法 vs 错误做法）
- **THEN** 一个 Mermaid 流程图 SHALL 用并行分支或子图直观对比两条路径

### Requirement: SKILL.md.tmpl 中的流程图使用
SKILL.md.tmpl 模板 SHALL 使用 Mermaid 流程图表示阶段过渡和任务分类逻辑。

#### Scenario: 阶段过渡总览
- **WHEN** 模板文档了多个开发阶段及其前后置条件
- **THEN** 一个 Mermaid 流程图 SHALL 整合分散在各章节的阶段过渡文字

#### Scenario: 任务类型判断
- **WHEN** 模板文档了"是否走 TDD"的判断逻辑（代码改动 vs 配置/文档）
- **THEN** 一个 Mermaid 决策分支 SHALL 整合到已有的 TDD 流程图中

### Requirement: 图的准确性与可维护性
Mermaid 图 SHALL 准确反映被替代的流程逻辑，不损失信息。修改流程逻辑时 SHALL 同步更新 Mermaid 图。

#### Scenario: 逻辑等价性
- **WHEN** Mermaid 图替代了文字流程
- **THEN** 原流程中的所有条件、分支、终止状态都 SHALL 在图中有对应表示

#### Scenario: 唯一事实来源
- **WHEN** 流程逻辑发生变更
- **THEN** Mermaid 图 SHALL 同步更新，被替代的文字描述 SHALL 移除或精简，避免双源冲突
