## ADDED Requirements

### Requirement: Release 分支自动创建

`/deepstorm-release` 在发布完成后，SHALL 自动从 main 分支创建 `release/v{version}` 分支。

#### Scenario: 发布成功后自动创建 release 分支
- **WHEN** npm publish + git push 成功完成
- **THEN** 系统自动从 main 分支创建名为 `release/v{version}` 的分支，其中 `{version}` 为本次发布的 SemVer 版本号

#### Scenario: 已有同名 release 分支的处理
- **WHEN** 创建的 release 分支名称与已有分支重名
- **THEN** 系统 SHALL 跳过创建并给出提示，不影响已完成的发布状态

### Requirement: Pull Request 自动创建

系统 SHALL 在创建 release 分支后，自动从 `release/v{version}` 向 `main` 创建 Pull Request。

#### Scenario: PR 正常创建
- **WHEN** release 分支创建成功
- **THEN** 系统自动创建从 `release/v{version}` 到 `main` 的 PR
- **THEN** PR 标题 SHALL 包含版本号，如 `Release v{version}`
- **THEN** PR 描述 SHALL 包含本次发布的 CHANGELOG 内容

#### Scenario: PR 自动合并
- **WHEN** PR 创建成功
- **THEN** 系统 SHALL 启用 auto-merge（squash merge）

#### Scenario: PR 创建失败的处理
- **WHEN** GitHub API 返回错误或 PR 创建失败
- **THEN** 系统 SHALL 输出错误信息，提示用户手动创建 PR
- **THEN** 系统 SHALL 继续执行（不阻断后续流程）
