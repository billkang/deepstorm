## Context

`/deepstorm-release` 目前的工作流在 Step 8（npm publish + git push）完成后就结束了。本次变更需要在 Step 8 之后插入两个新步骤：

1. **Release 分支 & PR** — 创建 `release/v{version}` 分支，自动提 PR 并 auto-merge
2. **GitHub Release** — 基于 STEP 8 git push 之后的状态创建 GitHub Release

这些步骤依赖于 GitHub API，通过 `gh` CLI 实现（已在 Step 8 中用于 git push，环境已就绪）。

## Goals / Non-Goals

**Goals:**
- 发布完成后自动创建 release 分支并提交 PR
- PR 启用 auto-merge（squash merge）
- 自动创建 GitHub Release，内容来自 CHANGELOG
- 失败时给出清晰错误提示，不阻断已有流程

**Non-Goals:**
- 不改动现有 npm publish 流程
- 不改动现有的版本号决定逻辑
- 不引入新的外部依赖（使用已有的 `gh` CLI）

## Decisions

| 决策 | 选择 | 备选方案 | 理由 |
|------|------|---------|------|
| API 工具 | `gh` CLI | GitHub MCP / curl + token | Step 8 已使用 `gh` 做 git push，环境统一；MCP 工具在此阶段可能无法直接用 gh CLI |
| 分支命名 | `release/v{version}` | `releases/v{version}` | 用户明确要求 `release/v{version}` |
| PR 标题格式 | `Release v{version}` | `chore: release v{version}` | 清晰表达意图，便于在 PR 列表中快速识别 |
| Auto-merge 策略 | squash merge | merge commit / rebase | squash 将 release 分支变为一个干净提交，保持 main 历史整洁 |

## Risks / Trade-offs

- **[Token 权限]** `gh` CLI 的认证 token 需要有 `contents:write` 和 `pull_requests:write` 权限 → 如果 token 权限不足，跳过并提示用户手动操作
- **[网络失败]** GitHub API 不可达 → 提示错误但不阻断已完成的 npm publish 流程
- **[重复 Release]** 同一个 tag 对应 Release 已存在 → 跳过创建并提示
