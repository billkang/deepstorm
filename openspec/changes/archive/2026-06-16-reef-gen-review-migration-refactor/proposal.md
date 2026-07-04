## Why

reef 的 `reef-style-backend` 和 `reef-style-frontend` 已实现根据用户语言/框架选择的动态内容生成（`.tmpl` + `variants/` + `fragments/`），但 `reef-gen-backend`、`reef-gen-frontend`、`reef-review` 仍存在硬编码的 Java/Liquibase 假设或过时内容。`reef-migrate` 完全硬编码为 Liquibase 专用，而数据库迁移指导已通过 `reef-style-backend` 的 fragments 提供，功能重复。

本次改造将剩余技能对齐到统一的模板化模式，消除硬编码，为未来支持更多语言和框架奠定基础。

## What Changes

1. **`reef-gen-backend`**: 由静态 `.md` 转为 `.tmpl` + `variants/` 模式。通用工作流骨架放入 `.tmpl`，语言/框架特有的生成步骤（编码顺序、构建命令、路径）放入 `variants/java/steps.md`
2. **`reef-gen-frontend`**: 同上，框架特有的生成步骤放入 `variants/angular/steps.md`
3. **`reef-review`**: 修复 agent 路径引用（`../reef/agents/` → `../../agents/`）、移除硬编码 Liquibase 路径、精简冗余的派发表格
4. **`reef-migrate`** (**BREAKING**): 整包删除。数据库迁移指导已由 `reef-style-backend` 的 `fragments/java/db-migration/liquibase/` 覆盖，生成迁移的工作流合并为 `reef-gen-backend` 中的一个条件块
5. **`wizard.json`**: 将 `reef-gen-backend` 和 `reef-gen-frontend` 加入对应选项的 `affectedTemplates`

## Capabilities

### New Capabilities
- `gen-backend-dynamic`: 使后端代码生成技能根据所选语言/框架动态调整内容
- `gen-frontend-dynamic`: 使前端代码生成技能根据所选框架动态调整内容

### Modified Capabilities
- （无现有 spec 变更——gen-backend 和 gen-frontend 当前没有独立 spec 文件）

## Impact

- `packages/reef/skills/reef-gen-backend/` — 重构为 `.tmpl` + `variants/`
- `packages/reef/skills/reef-gen-frontend/` — 重构为 `.tmpl` + `variants/`
- `packages/reef/skills/reef-review/SKILL.md.tmpl` — 内容修复和清理
- `packages/reef/skills/reef-migrate/` — 整包删除
- `packages/reef/wizard.json` — 新增 `affectedTemplates`
- `packages/cli/src/template/renderer.ts` — 无需修改（已有完整能力支持）
