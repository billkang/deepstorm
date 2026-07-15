# skill-restructure Specification

## Purpose
TBD - created by archiving change reef-start-skill-restructure. Update Purpose after archive.
## Requirements
### Requirement: SKILL.md.tmpl 精简为核心路由

reef-start SKILL.md.tmpl SHALL 精简为仅包含入口路由、前置条件、6 个阶段流程路由、Mermaid 流程图和核心原则。所有参考信息和详细执行指令 SHALL 外置到 references/ 目录中。

#### Scenario: SKILL.md.tmpl 保留内容
- **WHEN** 变更完成
- **THEN** SKILL.md.tmpl SHALL 保留以下段落的完整内容：
  - 功能概述
  - 入口路由
  - 运行时 MCP 服务发现（流程描述，JSON 示例可外置）
  - Path A 阶段一（1.1-1.6，含上下文地图更新）
  - Path A 阶段二（分支创建）
  - Path B 阶段一（B1.1-B1.5，含上下文地图更新）
  - 阶段三 SDD 文档生成（含 grill-me、writing-plans、语言规范）
  - Superpowers 门禁规则 + 流程
  - 风险路由判断流程 + Mode 切换规则
  - 阶段四流程图 + 核心原则
  - 关键原则 + 注意事项
- **AND** SKILL.md.tmpl SHALL 删除或替换为引用指令的段落：
  - 两个模式的声明模板（Plan Mode / TDD Mode）
  - 安全检查清单
  - Red Flags 表格
  - 逐 task 实现的详细指令
  - 框架自适应验证命令表
  - code-audit 检查清单
  - verify-report 生成指令
  - 分支结束处理

#### Scenario: SKILL.md.tmpl 引用指令格式
- **WHEN** 原 inline 内容被外置
- **THEN** SKILL.md.tmpl 在原位置 SHALL 写入引用指令，格式为：
  ```
  执行[xx]时，SEE: references/[文件路径].md
    - 内容A → 见该文件"[标题]"
    - 内容B → 见该文件"[标题]"
  ```
- **AND** 引用指令 SHALL 使用 SHALL/MUST 要求 Agent 读取对应文件

### Requirement: superpowers-gate.md 外置

reef-start SHALL 将 superpowers 门禁的声明模板、安全检查清单和 Red Flags 外置到 `references/superpowers-gate.md`。

#### Scenario: 文件内容完整
- **WHEN** `references/superpowers-gate.md` 被读取
- **THEN** 该文件 SHALL 包含：
  - Plan Mode 声明模板（含风险路由、已加载技能、纪律确认）
  - TDD Mode 声明模板（含风险路由、已加载技能、纪律确认）
  - 安全检查清单（增强版）
  - Red Flags 表格
- **AND** 内容 SHALL 与当前 SKILL.md 中对应段落完全一致（仅行号变化）

### Requirement: stage-4-implementation.md 外置

reef-start SHALL 将阶段四实现细节外置到 `references/stage-4-implementation.md`。

#### Scenario: 文件内容完整
- **WHEN** `references/stage-4-implementation.md` 被读取
- **THEN** 该文件 SHALL 包含：
  - 4.1 准备工作（获取 change 名、创建分支、记录计划文件路径）
  - 4.2 逐 task 实现（plan mode 和 tdd mode 两条路径的详细指令）
  - 框架自适应验证命令表（Java/Python/Node/Go + 兜底）
  - 4.3 code-audit 检查清单（含 AC-to-test 回溯）
  - 4.4 生成验证报告（JSON 格式定义）
  - 4.5 分支结束处理（提交/PR/保留/丢弃）

#### Scenario: 内容一致性
- **WHEN** 变更完成
- **THEN** stage-4-implementation.md 的内容 SHALL 与移植后 SKILL.md.tmpl 中对应段落的行为描述完全一致

### Requirement: 不改变流程图和行为逻辑

本次变更 SHALL NOT 修改任何流程图的拓扑结构、步骤顺序、纪律规则或行为约束。

#### Scenario: 流程图不变
- **WHEN** 变更完成
- **THEN** 阶段四入口流程图（Mermaid）的拓扑结构和文本标注 SHALL 保持不变

#### Scenario: 纪律规则不变
- **WHEN** 变更完成
- **THEN** 核心原则、mode 切换规则、门禁规则 SHALL 与变更前完全一致

### Requirement: pnpm build 通过

变更完成后 SHALL pnpm build 编译通过，不产生新的构建错误或警告。

#### Scenario: 构建验证
- **WHEN** 变更完成
- **THEN** `pnpm build` SHALL 正常退出
- **AND** dist/ 目录 SHALL 包含新外置的 references 文件

