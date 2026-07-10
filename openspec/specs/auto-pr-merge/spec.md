## ADDED Requirements

### Requirement: 自动推送到远程
commit 执行后，系统 SHALL 自动将当前分支推送到远程仓库。

#### Scenario: 新分支首次推送
- **WHEN** 当前分支是新建分支，尚未建立远程跟踪分支
- **THEN** 系统执行 `git push -u origin <branch-name>` 建立远程跟踪

#### Scenario: 已有远程跟踪分支
- **WHEN** 当前分支已存在远程跟踪分支
- **THEN** 系统执行 `git push`

#### Scenario: Amend 后的推送
- **WHEN** 用户选择了 `--amend` 模式，且分支已被推送到远程
- **THEN** 系统执行 `git push --force-with-lease`

### Requirement: 自动创建 Pull Request
推送成功后，系统 SHALL 自动创建 Pull Request，目标分支固定为 `main`，并在 PR 描述中引用 OpenSpec change 上下文。

#### Scenario: 正常创建 PR
- **WHEN** 推送完成，且当前分支尚未有对应 PR
- **THEN** 系统使用 `gh pr create` 创建 PR，target branch 为 `main`，title 使用 commit 的 title，body 包含提交信息和 OpenSpec change 引用

#### Scenario: 分支已有对应 PR
- **WHEN** 推送完成后检测到当前分支已存在对应 PR
- **THEN** 系统提示用户已有 PR 存在，不创建重复 PR，询问是否继续自动合并

#### Scenario: PR 创建失败（gh 未安装）
- **WHEN** 创建 PR 时 `gh` CLI 不可用或未认证
- **THEN** 系统提示 `gh` 未安装/认证，告知用户手动创建 PR，并显示 push 后的分支名

### Requirement: 启用自动合并
PR 创建成功后，系统 SHALL 为该 PR 启用自动合并（squash merge 模式）。

#### Scenario: 启用 auto-merge
- **WHEN** PR 创建成功
- **THEN** 系统执行 `gh pr merge <pr-url> --auto --squash` 启用自动合并

#### Scenario: PR 已存在但 auto-merge 未启用
- **WHEN** 发现已有 PR 且用户确认继续自动合并
- **THEN** 系统执行 `gh pr merge <pr-url> --auto --squash` 启用自动合并

### Requirement: Amend 模式跳过 PR
当用户选择 `--amend` 模式时，系统 SHALL 仅执行推送，跳过创建 PR 和自动合并步骤。

#### Scenario: Amend 后无需 PR
- **WHEN** 用户选择 `--amend` 模式
- **THEN** 系统仅执行 `git push --force-with-lease`，不创建 PR，不启用 auto-merge
- **THEN** 提示用户 amend 后变更仍在原分支上

### Requirement: CI 失败时保留 PR
启用 auto-merge 后如果 CI 失败，系统 SHALL 保留 PR 供用户查看和修复。

#### Scenario: CI 失败的处理
- **WHEN** auto-merge 已启用但 CI 检查失败
- **THEN** GitHub 自动取消合并，PR 保持 open 状态
- **THEN** 系统提示用户检查 CI 失败原因
