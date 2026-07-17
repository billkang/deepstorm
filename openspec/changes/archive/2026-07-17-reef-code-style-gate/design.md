## Context

DeepStorm reef 工作流当前的核心门禁（superpowers gate）位于 reef-start 的阶段三→阶段四之间，只检查 `superpowers:test-driven-development` 和 `superpowers:verification-before-completion`，遗漏了 `reef:reef-style-backend` 和 `reef:reef-style-frontend`（code-style 技能）。这导致 AI 在生成代码时缺少项目编码规范上下文约束。

代码生成技能（`reef-gen-backend` / `reef-gen-frontend`）中虽然提到了加载 code-style，但只是建议性步骤（Step 2 "查阅规范"），AI 可以跳过直接进入代码编写。

## Goals / Non-Goals

### Goals
- 在 reef-start 的 superpowers 门禁中增加 `reef-style-backend`/`reef-style-frontend` 作为硬性加载项
- 将 `reef-gen-backend`/`reef-gen-frontend` 的 step 2 从"查阅规范"改为"前置门禁"
- 在 `stage-4-implementation.md` 的逐 task 实现流程中增加 code-style 确认点
- 同步更新 `superpowers-gate.md` 的声明模板和安全检查清单

### Non-Goals
- 不修改 code-style 技能本身的内容（`reef-style-backend` 和 `reef-style-frontend` 的规范内容不变）
- 不引入新的 hook 或自动化脚本（仅在 skill 流程层面增加门禁）
- 不修改 CLI 安装流程（技能注册和配置逻辑不变）

## Decisions

### Decision 1: 在 superpowers 门禁中加载，而非在 PreToolUse hook 中强制

**方案**：在 reef-start 的 superpowers 门禁（SKILL.md.tmpl 第 371-456 行）的加载列表中，显式增加 `reef:reef-style-backend` / `reef:reef-style-frontend`。

**理由**：
- superpowers 门禁是阶段三→阶段四的唯一通道，在此处加载可确保所有进入实现的 AI 都经过 code-style 检查
- PreToolUse hook 是 prompt 级别的提醒，不够强（AI 可以忽略）
- 将 code-style 与其他 superpowers（TDD、verification）放在同一层面，体现同等重要性

### Decision 2: reef-gen-backend/frontend step 2 改为硬性门禁

**方案**：将 step 2 的标题从 "查阅规范" 改为 "加载编码规范（硬性门禁）"，并在描述中明确 "**必须先加载 code-style 技能，否则不得进入后续步骤**"。

**理由**：
- 即使 superpowers 门禁已检查过，进入 gen 技能时再次确认可防止上下文丢失或跳步
- 双重门禁（上游 gate + 技能内 gate）提供冗余保护
- step 5（提交前自检）保留作为后置检查，形成前后夹击

### Decision 3: stage-4-implementation 逐 task 流程增加确认点

**方案**：在 Plan Mode 和 TDD Mode 的入口增加 "检查 code-style 技能是否已加载" 的确认步骤。这是一个轻量级检查（非重新加载），流程如下：

```
逐 task 入口 → 确认 code-style 已加载 → 进入实现
                                   ↓
                             未加载时暂停并先加载
```

**理由**：
- 长时间实现过程中，AI 上下文可能因 token 限制丢失之前加载的技能
- 每个 task 的起始点是最安全的检查点，确保每段代码都受规范约束

## 修改清单

| 文件 | 修改类型 | 说明 |
|------|---------|------|
| `packages/reef/skills/reef-start/SKILL.md.tmpl` | 修改 | superpowers 门禁加载列表增加 code-style 技能 |
| `packages/reef/skills/reef-start/references/superpowers-gate.md` | 修改 | 声明模板表格和安全检查清单增加 code-style 项 |
| `packages/reef/skills/reef-start/references/stage-4-implementation.md` | 修改 | 4.2 逐 task 流程增加 code-style 确认点 |
| `packages/reef/skills/reef-gen-backend/SKILL.md.tmpl` | 修改 | Step 2 改为前置门禁 |
| `packages/reef/skills/reef-gen-frontend/SKILL.md.tmpl` | 修改 | Step 2 改为前置门禁 |

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|---------|
| 门禁过多导致流程变得冗长 | code-style 加载仅需一次 Skill tool 调用 + 快速阅读 quick-reference，耗时约 10-15 秒，成本可控 |
| AI 在 skip 模式下可能忽略技能加载 | 双重门禁（superpowers gate + gen skill 内 gate + 逐 task 确认）提供三层保障 |
| 纯后端项目加载前端 code-style（或反之） | 门禁逻辑 SHOULD 根据 tasks.md 中涉及的文件类型智能判断加载哪个技能；如果涉及前后端代码则都加载 |
| 模板渲染后内容与源文件不一致 | 修改 .tmpl 文件，构建时自动编译到 dist/，无需额外同步步骤 |

## Open Questions

- 对于纯 PC/配置变更（无代码），code-style 加载豁免条件是否需要更明确的判断标准？
