## Why

当前分支命名规则限制分支名只能使用纯 kebab-case（不允许 feat/、fix/ 等前缀），这与行业通用的 Conventional Branch Naming 规范不一致。缺少前缀降低了分支的语义信息密度——只看分支名无法快速判断变更类型，也不利于分支归类和筛选。

## What Changes

- **引入强制前缀规则**：所有新分支必须使用 Conventional Commits 类型前缀
- **前缀全集（8 种）**：`feat/`、`fix/`、`chore/`、`refactor/`、`docs/`、`test/`、`perf/`、`style/`
- **覆盖所有分支创建入口**：`reef-start`（从 Issue 启动）、`bmad-quick-dev`（快速开发）等
- **更新命名规则文档**：`deepstorm-discuss`、`reef-start`、`deepstorm-commit`、`reef-pr`、`bmad-quick-dev` 中的分支命名相关描述

## Capabilities

### New Capabilities
- `branch-naming-convention`: 统一的分支命名规则定义，包括前缀类型、格式约束、长度建议，以及各 skill 中的引用方式

### Modified Capabilities
<!-- 无，本变更新增能力而非修改已有 spec 行为 -->

## Impact

- **`playground/.claude/skills/reef-start/SKILL.md`** — Phase 2（创建分支）逻辑，输出的分支名从 `kebab-case-name` 改为 `{prefix}/{kebab-case-name}`
- **`playground/.claude/skills/reef-pr/SKILL.md`** — PR 描述中分支名→title 的推导逻辑
- **`.claude/skills/deepstorm-discuss/SKILL.md`** — 语言映射表中的"变更名/分支名"规范说明
- **`.claude/skills/deepstorm-commit/SKILL.md`** — 分支名→提交信息的回退逻辑（分支名格式变化）
- **`.claude/skills/bmad-quick-dev/step-01-clarify-and-route.md`** — 分支名合理性检查逻辑
- **`.changeset/config.json`** — 分支名变化不影响 changeset，无需改动
