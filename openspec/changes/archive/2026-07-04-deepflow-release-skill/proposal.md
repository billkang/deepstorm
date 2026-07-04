## Why

当前 `@deepstorm/cli` 的发版流程由 4 个分散的 npm scripts（`changeset`、`changeset version`、`release`、`release:publish`）拼凑而成，依赖开发者人工判断版本号并需在每个 PR 时手动运行 `changeset`，流程割裂且易遗漏。引入一个 AI 驱动的统一发版 Skill，从 git 提交历史自动分析变更范围、建议版本号、生成 CHANGELOG 并执行发布，可大幅降低发版认知负担和出错概率。

## What Changes

- **NEW** `.claude/skills/deepstorm-release/SKILL.md` — AI 驱动的统一发版 Skill
- **REMOVE** `changeset` 依赖及 `.changeset/` 目录
- **REMOVE** 根 `package.json` 中的 `changeset`、`changeset version`、`release`、`release:publish` 四个 scripts
- **REMOVE** `packages/cli/scripts/release.mjs` 及其相关逻辑
- **MODIFY** 根 `package.json` — 移除 `changeset` devDependency，精简 scripts 区
- **BREAKING** 废弃 `changeset` 作为版本管理工具，改为 Git Log + AI 分析

## Capabilities

### New Capabilities

- `ai-release-analysis`: 读取 git 提交历史，按照 Conventional Commits 前缀（`feat:` / `fix:` / `chore:` 等）分析变更范围，由大模型建议合适的版本号（major / minor / patch），经用户确认后进入下一步
- `changelog-generation`: 从 git 提交历史自动生成 CHANGELOG 条目，按 Conventional Commits 类型分类追加到已有 `CHANGELOG.md`，AI 负责汇总同类变更并润色表述
- `build-and-publish`: 更新版本号到各 `package.json`、创建 git tag（`v{version}`）、执行构建脚本、提交版本变更并推送、运行 `npm publish`

### Modified Capabilities

*（无 — 本变更新增发版能力，不修改已有 spec 的 requirement）*

## Impact

- **`packages/cli/package.json`** — 移除 `changeset` devDependency
- **根 `package.json`** — 移除 `changeset`、`version`、`release`、`release:publish` scripts，移除 `changeset` devDependency
- **`.changeset/`** — 整目录删除
- **`packages/cli/scripts/release.mjs`** — 删除（功能由 Skill 接管）
- **NEW** `.claude/skills/deepstorm-release/SKILL.md` — Skill 入口文件
- **`CHANGELOG.md`** — 后续每次发版自动追加内容
- **Git tags** — 每次发版自动创建 `v{version}` tag
