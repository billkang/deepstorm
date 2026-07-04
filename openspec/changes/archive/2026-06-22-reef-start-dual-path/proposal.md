## Why

当前 reef-start skill 只支持"Issue 驱动"一条路径：用户必须提供 Jira/issue tracker 信息才能启动流程。当用户没有 Jira ticket（如内部重构、技术改进、新功能 brainstorm）时，skill 仍然强制走 issue 获取流程，体验割裂。需要增加第二条路径：**无 Issue 信息时，直接创建 OpenSpec change → 自由讨论需求 → SDD 文档 → superpowers 门禁 → 实现**。

## What Changes

- **新增入口路由决策**：在 reef-start 最开头增加一个分支判断。用户提供 Issue 信息 → Path A（现有 Issue 驱动流程）；用户未提供 Issue 信息 → Path B（新的开放讨论流程）
- **Path B（开放讨论流程）**：跳过 Issue 获取/PRD/设计稿等外部依赖步骤，直接执行 `openspec new change` → 需求讨论（BMAD 风格） → proposal → specs → design → tasks → superpowers 门禁 → TDD 实现
- **Path A（Issue 驱动流程）**：当前流程不变（Issue 获取 → PRD → 设计稿 → 分支 → SDD → 实现），仅调整入口描述
- **两条路径在 superpowers 门禁处汇合**，后续实现流程完全一致

## Capabilities

### New Capabilities
- `entry-decision`: 入口路由决策逻辑。根据用户输入中是否包含 Issue 信息，路由到 Path A 或 Path B
- `open-discussion-flow`: 无 Issue 时的开放讨论流程。跳过外部依赖获取，直接创建 OpenSpec change，围绕需求进行结构化的自由讨论（BMAD 风格），产出 brainstorming 文件，再进入 SDD 流程

### Modified Capabilities
- `issue-driven-flow`: 当前 reef-start 的 Issue 驱动流程。功能不变，但入口描述和阶段一结构需要调整为与 Path B 对齐

## Impact

- `packages/reef/skills/reef-start/SKILL.md.tmpl` — 主要修改文件，新增入口路由和 Path B 流程
- 不影响其他技能或套件
- 不影响已有用户（仅新增路径，不修改现有路径行为）
