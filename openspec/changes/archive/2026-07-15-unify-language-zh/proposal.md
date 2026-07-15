## Why

DeepStorm 定位为一套面向中文开发者的 AI 协同工具集，但目前生成的 SDD 文档（proposal/specs/design/tasks）和 commit message 经常使用英文而非中文。这导致：
- 国内开发者阅读和维护的门槛增加
- 与项目「中文正文 + 英文专有名词」的既定语言原则不一致
- 不同模块产出的文档语言不统一，缺少整体感

## What Changes

- **SDD 文档指令中加入中文语言要求**：在 SDD 生成的 instruction 或 skill 引导中加入「SDD 文档正文使用中文，代码实体名/API 路径/技术术语保留英文」的约束
- **修复 release 流程的英文 commit message**：将 `deepstorm-release` skill 和 `release.ts` 中的硬编码英文 commit message 改为中文
- **修复 PR 模板的英文/中文混排**：将 `reef-pr` SKILL.md 中的 `## Summary` 和 `## Test plan` 标题改为中文
- **新增 language-enforcement Capability**：作为强制语言规范的能力点，统一约束各套件生成内容的语言

## Capabilities

### New Capabilities
- `sdd-language-constraint`：在 SDD 文档生成流程中加入语言约束，确保 proposal/specs/design/tasks 的正文使用中文，仅代码实体名/API 路径/技术术语保留英文

### Modified Capabilities
- （无 — 本次不修改已有 capability 的 requirement，均为实现层面的变更）

## Impact

| 影响范围 | 变更类型 | 说明 |
|---------|---------|------|
| `packages/reef/skills/reef-start/SKILL.md.tmpl` | 修改 | SDD 流程中增加语言约束传递 |
| `.claude/skills/deepstorm-release/SKILL.md` | 修改 | commit message 模板 `RELEASING:` → `chore:` |
| `packages/cli/src/commands/release.ts` | 修改 | 硬编码英文 commit message 改为中文 |
| `packages/reef/skills/reef-pr/SKILL.md` | 修改 | PR 模板标题统一为中文 |
| `.claude/commands/opsx/continue.md` | 修改 | 在 artifact 创建指导中加入语言约束 |
| `packages/reef/hooks/hooks.json` | 可选 | PreToolUse 提示改为中文 |
