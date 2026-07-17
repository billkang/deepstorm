## Why

用户反馈在实际项目中 reef 生成的代码质量不高，根本原因是在代码生成流程中没有强制加载 code-style 技能（`reef-style-backend` / `reef-style-frontend`）。当前 reef-start 的 superpowers 门禁只检查 TDD 和验证技能，遗漏了 code-style 加载这一关键环节；代码生成技能（`reef-gen-backend` / `reef-gen-frontend`）中 code-style 加载也只是建议性步骤而非前置门禁。这导致 AI 在生成代码时缺少项目编码规范的上下文约束，产出代码风格不一致、质量不稳定。

## What Changes

1. **reef-start superpowers 门禁增加 code-style 检查** — 在阶段三→四的门禁中，将 `reef:reef-style-backend` 和 `reef:reef-style-frontend` 列为硬性加载项，未加载不得进入阶段四
2. **reef-gen-backend 将 code-style 加载改为前置门禁** — Step 2 "查阅规范" 改为 "必须先加载 code-style 才能开始写代码" 的硬性要求
3. **reef-gen-frontend 同上**
4. **stage-4-implementation 逐 task 流程增加 code-style 确认点** — 每个 task 实现前增加"确认 code-style 已加载"的检查
5. **superpowers-gate 声明模板和安全检查清单同步更新**

## Capabilities

### New Capabilities
- `code-style-pre-gate`: 在代码生成前强制加载编码规范技能的门禁机制，确保所有生成代码受项目编码规范约束

### Modified Capabilities
- （无现有 capability 变更）

## Impact

- `packages/reef/skills/reef-start/SKILL.md.tmpl` — superpowers 门禁部分
- `packages/reef/skills/reef-start/references/superpowers-gate.md` — 声明模板和检查清单
- `packages/reef/skills/reef-start/references/stage-4-implementation.md` — 逐 task 实现流程
- `packages/reef/skills/reef-gen-backend/SKILL.md.tmpl` — 后端代码生成流程
- `packages/reef/skills/reef-gen-frontend/SKILL.md.tmpl` — 前端代码生成流程
- `packages/reef/hooks/hooks.json` — PreToolUse 门禁增强（可选）
