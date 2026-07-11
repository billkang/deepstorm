## ADDED Requirements

### Requirement: Change 自动归档

系统 SHALL 提供 `archiveChange(projectDir, change)` 函数，当 change 的所有 tasks 状态均为 `completed` 时，将 change 目录从 `openspec/changes/<name>/` 移至 `openspec/changes/archive/<date>-<name>/`。

#### Scenario: 全部 task 完成时归档

- **WHEN** change 的所有 tasks 状态均为 `completed`
- **THEN** 系统 SHALL 将 `openspec/changes/<name>/` 目录整体移至 `openspec/changes/archive/<YYYY-MM-DD>-<name>/`
- **THEN** 归档日期 SHALL 使用当天日期

#### Scenario: 存在失败 task 时跳过归档

- **WHEN** change 中存在状态为 `failed` 或 `skipped` 的 task
- **THEN** 系统 SHALL 不执行归档操作
- **THEN** 系统 SHALL 输出提示信息，告知用户需人工处理

#### Scenario: 归档前验证目录完整性

- **WHEN** 执行归档前
- **THEN** 系统 SHALL 验证 change 目录存在且包含 `tasks.md`
- **THEN** 如目录不存在 SHALL 跳过归档并记录警告

### Requirement: runPilot 结束时触发归档

系统 SHALL 在 `runPilot` 执行完所有 tasks 后、释放锁之前，检查 change 的完成状态并决定是否触发归档。

#### Scenario: 所有 task 完成触发归档

- **WHEN** `runPilot` 执行完所有 tasks 且全部 status 为 `completed`
- **THEN** 系统 SHALL 调用 `archiveChange` 归档当前 change
- **THEN** 系统 SHALL 在 summary 中记录归档操作

#### Scenario: 有 task 失败不触发归档

- **WHEN** `runPilot` 执行完所有 tasks 但存在 `failed` 或 `skipped` 的 task
- **THEN** 系统 SHALL 跳过归档
- **THEN** 系统 SHALL 在 summary 中提示用户手动处理
