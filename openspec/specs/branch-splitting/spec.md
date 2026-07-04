# Branch Splitting

## Purpose

当分支范围门禁检测到多领域时，自动生成拆分方案并将多领域分支拆分为多个独立分支，每个分支只专注一个业务领域。

## Requirements

### Requirement: System MUST generate a branch splitting plan on multi-domain detection

当门禁检测到多领域时，系统 MUST 自动生成一个分支拆分方案，将当前分支的变更按业务领域拆分为多个独立分支。

#### Scenario: 生成两领域拆分方案

- **WHEN** 当前分支涉及 `order` 和 `payment` 两个业务领域
- **THEN** 系统生成如下拆分方案：

  1. 分支 `feat/order-update`：
     - 文件：`src/order/create.ts`, `src/order/query.ts`
     - 说明：订单创建和查询功能
  2. 分支 `feat/payment-integration`：
     - 文件：`src/payment/gateway.ts`, `src/payment/refund.ts`
     - 说明：支付网关接口变更

#### Scenario: 重复文件检测

- **WHEN** 某个文件同时被 assign 到多个领域（如 `src/common/utils.ts`）
- **THEN** 该文件 SHOULD 被归入变更意图最明确的领域，或在拆分方案中标明"共有依赖"

### Requirement: User MUST confirm the splitting plan before execution

生成的拆分方案 MUST 先向用户展示，用户确认后系统才执行。用户拒绝方案时，拆分流程终止。

#### Scenario: 确认并执行拆分

- **WHEN** 用户审阅拆分方案后确认执行
- **THEN** 系统按方案自动执行：创建新分支 → 按分支整理文件 → git commit 每个分支

#### Scenario: 拒绝拆分方案

- **WHEN** 用户审阅拆分方案后拒绝
- **THEN** 拆分流程终止，当前分支保持不变，提交仍被阻断

### Requirement: Splitting execution MUST preserve commit history per branch

执行拆分时，系统 MUST 按业务领域重新组织文件变更，确保每个新分支都包含该领域完整且有意义的变更内容。

#### Scenario: 执行拆分

- **WHEN** 用户确认拆分方案，选择执行
- **THEN** 系统为每个子分支执行以下操作：
  - 从当前分支（或目标基准分支）创建新分支
  - 只保留属于该领域的文件变更
  - 生成合适的 commit message 后提交
  - 输出每个子分支的创建结果

#### Scenario: 拆分后当前分支状态

- **WHEN** 拆分执行完成
- **THEN** 原当前分支保持拆分前的未提交状态不变，不被删除
