## Why

`reef-start` SKILL.md.tmpl 的实现阶段（Phase 4）使用子代理直接编码的 A→E 循环，缺少实现前的 superpowers 检查门闸和 TDD 纪律约束。这和 `deepstorm-discuss` 修复前的问题相同——AI 进入实现阶段后直接写代码，跳过了必须的 Skill 工具加载（superpowers:test-driven-development）和 TDD（Red → Green → Refactor）流程。

这导致用户在调用 `reef-start` 开发功能时，无法保证代码质量纪律——没有先写测试再写实现，没有 spec 驱动的验证闭环。

## What Changes

1. **替换实现前检查清单为 superpowers 硬性门闸** — 将原有的 6 行简单 checkbox 升级为完整的 superpowers 检查流程，包含 Skill 工具调用、Rigid 纪律声明和用户确认、Red Flags 自省
2. **替换 Phase 4 实现阶段为 TDD 循环** — 将子代理 A→E 直接编码替换为逐 task 的 RED → GREEN → REFACTOR 循环，配合作业类型判断表（哪些走 TDD、哪些豁免）
3. **增加步骤追踪机制** — 在入口 flowchart 后添加 `📍 当前步骤` 声明，每次进入 skill 时 AI 必须声明当前阶段
4. **标记引用文件已废弃** — `references/jira-start-subagent.md` 中标注旧版 A→E 流程已被 TDD 替代

## Capabilities

### New Capabilities

- `superpowers-check-gate`: 实现前必须检查 superpowers 的硬性门禁。包含 Skill 工具加载、Rigid/Flexible 技能分类、Rigid 纪律声明和用户确认、安全检查清单增强、Red Flags 自省机制
- `tdd-implementation`: 逐 task 的 TDD 实现流程。包含作业类型判断表（代码改动走 TDD、配置/文档豁免）、RED→GREEN→REFACTOR 循环说明、无测试框架时的兜底策略

### Modified Capabilities

- （无修改现有 capability）

## Impact

- `packages/reef/skills/reef-start/SKILL.md.tmpl` — 门闸和实现阶段重写
- `packages/reef/skills/reef-start/references/jira-start-subagent.md` — 标注废弃
- 无 API/DB/Permission 影响，纯 skill 文档变更
