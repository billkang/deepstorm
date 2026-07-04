## Context

`reef-start` SKILL.md.tmpl 的实现阶段（原 Phase 4）使用子代理直接编码的 A→E 循环，缺少 superpowers 检查门闸和 TDD 纪律。这与 `deepstorm-discuss` 修复前的问题相同——AI 在实现阶段直接写代码，跳过了 Skill 工具加载和 TDD 流程。

由于 `reef-start` 是独立分发的 skill 模板（通过 CLI setup 部署到用户项目），不能依赖 `deepstorm-discuss` 等其他 skill 来补充门闸逻辑。所有门闸和实现纪律必须自包含在 `SKILL.md.tmpl` 中。

## Goals

- 在 `reef-start` 的 SDD 生成阶段（Phase 3）和实现阶段之间增加强制 superpowers 检查门闸
- 替换子代理 A→E 实现为 TDD（RED → GREEN → REFACTOR）循环
- 增加步骤追踪机制（`📍 当前步骤`）
- 所有变更自包含在 `SKILL.md.tmpl` 中，不引入外部依赖

## Non-Goals

- 不改动 `reef-start` 的 Jira 集成逻辑（Phase 1-2）
- 不改动 `reef-start` 的 openspec SDD 生成（Phase 3）
- 不改动 code-audit（Phase 4.3）和分支结束处理（Phase 4.4）
- 不修改其他 reef skill（reef-review, reef-harden 等）
- 不修改 openspec 工具链本身

## Decisions

### Decision 1: 自包含门闸而非委托给 deepstorm-discuss
- **选择：** 在 `SKILL.md.tmpl` 中内嵌完整的 superpowers 检查和 TDD 实现流程
- **原因：** reef-start 通过 CLI setup 部署到用户项目，无法保证 `deepstorm-discuss` 存在
- **备选方案：** 委托给 `deepstorm-discuss` → 否决（不可移植）

### Decision 2: TDD 而非子代理编码
- **选择：** 逐 task 的 RED → GREEN → REFACTOR 循环
- **原因：** 子代理编码一次性生成大量代码，无法保证"先写测试再写实现"的纪律。TDD 确保每个行为改动都有测试覆盖
- **备选方案：** 子代理 A→E 循环 → 否决（缺少 TDD 纪律，导致本 session 的问题）

### Decision 3: 保留 code-audit（4.3）和分支结束（4.4）
- **选择：** 保留原有的 code-audit 和分支结束阶段，不做改动
- **原因：** 这两个阶段不涉及实现纪律问题，由 `reef-review` skill 处理，工作正常

### Decision 4: 增加步骤追踪
- **选择：** 在 flowchart 后添加 `📍 当前步骤` 声明机制
- **原因：** 每次上下文窗口刷新后 AI 需要知道自己处于流程的哪个位置，避免因上下文丢失而跳步

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 用户认为 TDD 太慢，跳过门闸 | Red Flags 自省机制 + 强制约束语言（"不可协商"） |
| 用户项目没有测试框架 | TDD 兜底策略：先搭框架再 TDD |
| 配置/文档类 task 不应走 TDD | 作业类型判断表明确列出豁免条件 |
| 已修改的代码已有测试？ | 本次变更只改 SKILL.md.tmpl（豁免 TDD），现有代码不受影响 |

## API Contract

无 API 变更。本次变更只修改 SKILL.md 模板文档。
