## ADDED Requirements

### Requirement: PR 上下文统一收集
reef-pr 在创建 PR 前 SHALL 通过 `create-pr.mjs --collect` 收集所有上下文，输出结构化 JSON。该脚本 SHALL 复用 `collect-git-context.mjs` 的逻辑（直接 API 导入或 exec 调用）。

#### Scenario: 有未提交变更时中止
- **WHEN** `git status --porcelain` 非空
- **THEN** 脚本输出 `{ "hasUncommitted": true }`，exit code 0，由 AI 提示用户先提交

#### Scenario: 正常收集（有关联 OpenSpec）
- **WHEN** 检测到当前分支匹配 openspec change 且有 proposal.md
- **THEN** 输出包含 `branch`、`commitLog`、`diffStat`、`proposalTitle` 字段的 JSON

#### Scenario: 正常收集（无关联 OpenSpec）
- **WHEN** 当前分支不匹配任何 openspec change
- **THEN** 输出不包含 proposal 字段，`commitLog` 用第一个 commit 标题作为 PR 标题候选

### Requirement: PR 创建命令组装
reef-pr 的 Step 4 SHALL 通过 `create-pr.mjs --create` 组装并执行 `gh pr create` 命令。

#### Scenario: 首次推送
- **WHEN** 当前分支尚未推送到远程
- **THEN** 脚本先执行 `git push -u origin <branch>`，再调用 `gh pr create`

#### Scenario: 已有相同分支的 PR
- **WHEN** `gh pr view --json url` 返回已有 PR
- **THEN** 脚本输出 `{ "exists": true, "url": "..." }`，由 AI 询问是否 update

#### Scenario: 指定 reviewer 和 label
- **WHEN** 调用时传入 `--reviewer user1 --label bug`
- **THEN** `gh pr create` 追加 `--reviewer user1 --label bug` 参数
