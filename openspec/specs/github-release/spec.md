# GitHub Release

## Purpose

`/deepstorm-release` 在发布完成后，自动在 GitHub 仓库创建对应版本的 Release，包含完整的 CHANGELOG 内容，方便团队成员和用户查阅版本变更。

## Requirements

### Requirement: GitHub Release 自动创建

`/deepstorm-release` 在发布完成后，SHALL 自动在 GitHub 上创建对应版本的 Release。

#### Scenario: Release 正常创建
- **WHEN** npm publish + git push 成功完成
- **THEN** 系统 SHALL 在 GitHub 仓库创建 Release，tag 为 `v{version}`
- **THEN** Release 名称 SHALL 为 `v{version}`
- **THEN** Release 描述 SHALL 包含本次 CHANGELOG 的全部内容

#### Scenario: 已有同名 Release 的处理
- **WHEN** tag `v{version}` 对应 Release 已存在
- **THEN** 系统 SHALL 提示用户并跳过创建

#### Scenario: Release 创建失败的处理
- **WHEN** GitHub API 返回错误或 Release 创建失败
- **THEN** 系统 SHALL 输出错误信息，但 SHALL NOT 阻断 npm publish 成功的流程
