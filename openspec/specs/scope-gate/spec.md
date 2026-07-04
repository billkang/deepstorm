# Scope Gate

## Purpose

在 git commit 和 CI/PR 阶段执行分支范围门禁检查，当检测到分支涉及多个业务领域时阻断提交，确保每个分支只专注一个业务领域。

## Requirements

### Requirement: Git commit MUST be blocked when branch scope spans multiple business domains

系统 SHALL 在 `git commit` 时作为 pre-commit hook 自动触发范围检测。如果检测到分支涉及多个业务领域，MUST 阻止本次提交，并给出拆分建议。

#### Scenario: 单领域提交通过

- **WHEN** 分支 diff 仅涉及单一业务领域（如仅 `order`）
- **THEN** pre-commit hook 检查通过，提交正常继续

#### Scenario: 多领域提交被阻断

- **WHEN** 分支 diff 同时涉及 `order` 和 `payment` 两个业务领域
- **THEN** pre-commit hook 阻断提交，输出阻断信息，列出检测到的所有领域

#### Scenario: 文档变更豁免

- **WHEN** 分支 diff 仅包含文档类变更（`documentation`）
- **THEN** commit 门禁 SHOULD 允许通过，不因单领域内的文档变更而阻断

#### Scenario: 仅单个领域但有文档变更

- **WHEN** 分支 diff 主要涉及 `order` 领域，同时包含少量文档变更
- **THEN** commit 门禁 SHOULD 允许通过（文档不新增业务领域）

### Requirement: CI/PR MUST enforce scope gate as a mandatory check

系统 SHALL 在 CI/PR 流程中作为强制检查步骤，对 PR 的 diff 执行范围检测。如果涉及多个业务领域，CI 状态 MUST 标记为失败，阻止合并。

#### Scenario: CI 检查通过

- **WHEN** PR 的 diff 仅涉及一个业务领域
- **THEN** CI 范围检查步骤通过，MR/PR 可正常合入

#### Scenario: CI 检查失败

- **WHEN** PR 的 diff 涉及多个业务领域
- **THEN** CI 范围检查步骤失败，PR 合并按钮被锁定，并给出失败原因和拆分建议

### Requirement: Gate MUST output a human-readable report on failure

门禁阻断时 MUST 输出格式化的检查报告，包含检测到的所有业务领域、可信度评分、分类解释，以及初步的拆分建议。

#### Scenario: 查看阻断报告

- **WHEN** commit 或 CI 被门禁阻断
- **THEN** 系统输出如下格式的报告：

  ```
  🚫 分支范围检查未通过
  
  检测到以下业务领域（预期：1 个）：
    - order (0.92) — 涉及订单创建和查询逻辑
    - payment (0.85) — 涉及支付网关接口变更
  
  建议拆分为独立分支：
    - feat/order-update
    - feat/payment-integration
  ```

### Requirement: Gate MUST be configurable (enabled/disabled per project)

门禁的启用/禁用 SHOULD 可通过项目配置文件控制，支持按环境区分（本地 commit vs CI）。

#### Scenario: 禁用本地门禁

- **WHEN** 开发者在项目配置中将本地门禁设置为 `disabled`
- **THEN** pre-commit hook 跳过范围检查
