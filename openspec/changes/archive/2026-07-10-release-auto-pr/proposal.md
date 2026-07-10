## Why

`/deepstorm-release` 命令目前只完成 npm 发布和 git push，缺少发布后的 Git 协作流程步骤。每次发布后需要手动创建 release 分支、提 PR、创建 GitHub Release，操作繁琐且容易遗漏。通过自动化这些步骤，确保每次发布都有完整的 Git 协作记录和可追溯的 release 分支。

## What Changes

- **新增**：发布完成后自动创建 `release/v{version}` 分支
- **新增**：从 release 分支到 `main` 的自动 PR 创建
- **新增**：PR auto-merge
- **新增**：创建 GitHub Release（含 release notes）
- **修改**：调整现有 deepstorm-release 的执行流程，在 Step 8（npm publish + git push）之后插入新的步骤

## Capabilities

### New Capabilities
- `release-branch-pr`：发布后自动创建 release 分支、PR、auto-merge 的全流程
- `github-release`：自动创建 GitHub Release（含 CHANGELOG 内容）

### Modified Capabilities
- 无（这是全新功能，不会改变已有 spec）

## Impact

- 只影响 `deepstorm-release` 这一个 skill 的 SKILL.md
- 需要依赖 GitHub API（通过 `gh` CLI）来创建 PR 和 Release
- 不影响现有 npm publish 流程
