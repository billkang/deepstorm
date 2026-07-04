## Context

Tide（@deepstorm/tide）v0.1.0 已经实现从需求讨论到 Jira 创建的完整工作流，所有逻辑在 SKILL.md 中定义，通过 Claude Code 的 skill 机制运行。当前缺少 OpenSpec 基线规范文档，不便于后续迭代管理。本次变更纯文档性质，不修改任何代码或 skill 逻辑。

数据模型、流程定义、MCP 集成等已在现有 SKILL.md 和 references 中有完整定义，本次设计集中在如何将这些现有内容结构化为 OpenSpec 规范。

## Goals / Non-Goals

**Goals:**
- 建立 Tide 核心功能的技术规范（spec）
- 建立已实现 / 待迭代的任务清单（tasks）
- 规范的 spec 位于 `openspec/specs/tide-core/spec.md`
- 规范的 tasks 位于 `openspec/changes/tide-core/tasks.md`

**Non-Goals:**
- 不修改任何现有代码或 SKILL.md
- 不新增或修改功能
- 不涉及其他 DeepStorm 套件（reef / sweep / atoll）

## Decisions

1. **Capability 命名**：使用 `tide-core`，统一涵盖 Tide 所有现有功能（数据存储、工作流、角色讨论、发布、归档），不做子模块拆分。原因是当前功能耦合度高，拆分会导致 spec 间大量交叉引用，不利于首次基线建立。

2. **Spec 内容范围**：与现有 SKILL.md + references 保持一致，不做抽象简化或重新设计。基线 spec 应忠实反映当前状态。

3. **Tasks 分类方式**：按功能模块分组（数据存储层 / 工作流核心 / 发布流程 / 会话管理 / 文档），已实现项标记 ✅，未来迭代项标记 📋。方便后续迭代时快速找到可做的项。

## Risks / Trade-offs

- 无风险和取舍——本次纯文档变更，不涉及代码修改或架构调整。
