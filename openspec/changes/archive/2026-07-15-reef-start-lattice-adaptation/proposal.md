## Why

DeepStorm 的 reef-start 开发工作流（SDD → TDD 实现）当前对所有代码变更走统一的 TDD 模式，缺乏风险自适应的执行档位。Lattice 项目的 PrismSpec 工作流提供了 plan/tdd 风险自适应模式、后置验证门禁和结构化证据闭环等设计，可以在不改动 DeepStorm 基础设施的前提下，通过修改 reef-start SKILL.md 的流程描述来借鉴这些能力，提升开发效率和质量可信度。

## What Changes

- **风险自适应执行模式** — superpowers 门禁阶段增加风险路由卡，让 Agent 根据变更类型和风险级别自动选择 plan mode（直接实现 + 后置验证）或 tdd mode（完整 RED→GREEN→REFACTOR 循环）
- **后置验证门禁** — 每个 task 标记完成前增加 build + lint + test 强制验证步骤，通过后才允许标完成
- **上下文地图** — 新增 `.deepstorm/context.md` 项目上下文索引文件，CLI setup 时初始化模板，reef-start 阶段一结束时检测变更后按需更新。CLAUDE.md 仅添加一行指引引用
- **AC-to-test 回溯** — code-audit 检查清单增加验收标准到测试的显式回溯项
- **统一证据收敛** — code-audit 之后、分支结束之前生成结构化验证报告（verify-report.json）

## Capabilities

### New Capabilities

- `risk-adaptive-mode`: 风险自适应的 plan/tdd 执行模式选择，含风险路由卡和两种模式的具体执行策略
- `post-task-verification`: 每个 task 完成后的 build + lint + test 后置强制验证门禁
- `project-context-map`: 项目上下文索引文件（`.deepstorm/context.md`）的维护和管理
- `verification-report`: 统一的结构化验证报告生成
- `ac-test-trace`: 验收标准到测试的显式回溯检查

### Modified Capabilities

- （无）— 所有改动都在 reef-start SKILL.md 的流程层面，不修改现有 spec 级别的需求

## Design Decisions

### Context Map 定位（BMAD 讨论结论）

> **问题：** CLAUDE.md + OpenSpec 已经存在的情况下，Context Map 这层是否仍有价值？
>
> **结论：** 有独立价值。CLAUDE.md 是 Agent 行为规范（怎么做），OpenSpec 是变更深描（这个 change 是什么），Context Map 是项目全貌快速索引（这是什么项目）。三层角色不同，互补不重复。
>
> **维护者：** reef-start 阶段一需求获取结束时，基于采集的项目信息与已有 context.md 做 diff，有实质性变化才更新，避免 git 噪音。
>
> **存储：** 独立 `.deepstorm/context.md` 文件，不嵌入 CLAUDE.md。CLAUDE.md 仅加一行 `> 项目事实见 .deepstorm/context.md`。

## Impact

- `packages/reef/skills/reef-start/SKILL.md` — 核心改动文件，修改 superpowers 门禁逻辑和阶段四实现流程
- `packages/reef/skills/reef-start/references/` — 新增风险路由卡参考文档
- `packages/cli/src/commands/setup/` — CLI setup 初始化 `.deepstorm/context.md` 模板
- 无 API/DB/外部系统影响，纯 skill 流程描述变更
