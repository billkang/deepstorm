## Why

当前 `deepstorm-commit` 技能在 commit 完成后就结束了——推送、创建 PR、合并这些步骤需要用户手动完成。对于 DeepStorm 自身开发场景，每次变更都要经历「提交 → push → 打开 GitHub → 创建 PR → squash merge」的重复劳动。本变更将 PR 创建和自动合并（squash merge）嵌入 commit 工作流末端，实现端到端自动化。

## What Changes

- **新增步骤 10「推送到远程」**：commit 完成后自动执行 `git push -u origin <branch>`，改为自动推送（原步骤 10 为「仅在用户明确要求时」，现在变为流程的一环）
- **新增步骤 11「创建 Pull Request」**：使用 `gh` CLI 创建 PR，目标分支固定为 `main`
- **新增步骤 12「启用自动合并」**：创建 PR 后自动启用 squash merge，等待 CI 通过后自动合并
- 如果用户使用 `--amend`，则推送使用 `--force-with-lease`，并跳过 PR 创建（amend 意味着变更尚未完成或正在修改中）

## Capabilities

### New Capabilities
- `auto-pr-merge`: commit 后自动推送、创建 PR、启用 squash merge 自动合并

### Modified Capabilities
<!-- 无 spec 层面的变更，deepstorm-commit 是 skill 文件，现有 spec 不需要修改 -->

## Impact

- `.claude/skills/deepstorm-commit/SKILL.md` — 修改步骤 10 行为（从可选变为自动）、新增步骤 11-12
- 依赖 `gh` CLI（GitHub CLI），需确保环境可用
- 需要 `GITHUB_TOKEN` 或 `gh` 认证状态有效
