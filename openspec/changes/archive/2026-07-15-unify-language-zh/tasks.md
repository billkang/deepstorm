## 1. SDD 语言约束注入

- [x] 1.1 修改 `.claude/commands/opsx/continue.md` — 在 Artifact Creation Guidelines 中加入「SDD 文档正文使用中文，代码实体名/API路径/技术术语保留英文」的语言约束
- [x] 1.2 修改 `packages/reef/skills/reef-start/SKILL.md.tmpl` — 在 SDD 流程描述中加入语言约束规则引用

## 2. Release commit message 改为中文

- [x] 2.1 修改 `.claude/skills/deepstorm-release/SKILL.md` — 步骤 7 的 commit message 模板从 `"RELEASING: Releasing v{version}"` 改为 `"chore: 发布 v{version}"`
- [x] 2.2 修改 `packages/cli/src/commands/release.ts` — 第 167 行 `git commit -m "RELEASING: Releasing v${newVersion}"` 改为 `git commit -m "chore: 发布 v${newVersion}"`

## 3. PR 模板标题统一为中文

- [x] 3.1 修改 `packages/reef/skills/reef-pr/SKILL.md` — 将 PR 正文模板中的 `## Summary` 改为 `## 概要`，`## Test plan` 改为 `## 测试计划`
