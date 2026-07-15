# Risk Adaptive Execution Mode

> capability: `risk-adaptive-mode`

## ADDED Requirements

### Requirement: 风险路由卡门禁

reef-start SHALL 在 superpowers 门禁（阶段三→四之间）增加风险路由判断，根据变更类型自动推荐 plan 或 tdd 执行模式。

#### Scenario: 文档/配置/SKILL.md 变更走 plan mode
- **WHEN** 变更类型为文档（.md）、配置文件（.json/.yaml/.toml）或 SKILL.md 模板修改
- **THEN** superpowers 门禁推荐 plan mode（直接实现 + 后置验证），并输出推荐理由供用户确认

#### Scenario: 简单重构走 plan mode
- **WHEN** 变更仅涉及重构且已有充分测试覆盖（测试覆盖率 > 80%）
- **THEN** superpowers 门禁推荐 plan mode，并注明测试覆盖依据

#### Scenario: 新增业务逻辑走 tdd mode
- **WHEN** 变更为新增业务逻辑功能（Controller / Service / Repository）
- **THEN** superpowers 门禁推荐 tdd mode（完整 RED→GREEN→REFACTOR 循环）

#### Scenario: Bug fix 走 tdd mode
- **WHEN** 变更为缺陷修复
- **THEN** superpowers 门禁推荐 tdd mode，要求先写回归测试再修复

#### Scenario: 权限/安全/资金变更走 tdd mode
- **WHEN** 变更涉及权限校验、安全逻辑或资金计算
- **THEN** superpowers 门禁推荐 tdd mode，并标记为高优先级

#### Scenario: 数据库迁移/幂等性变更走 tdd mode
- **WHEN** 变更为数据库迁移脚本或幂等性相关逻辑
- **THEN** superpowers 门禁推荐 tdd mode，并提示滚动回滚验证

#### Scenario: 状态机/并发逻辑走 tdd mode
- **WHEN** 变更为状态机或并发/异步逻辑
- **THEN** superpowers 门禁推荐 tdd mode

### Requirement: plan → tdd 升级机制

Agent SHALL 在 plan mode 实现过程中主动识别复杂度超预期的情况，并自行升级为 tdd mode。

#### Scenario: plan mode 中发现复杂度超预期
- **WHEN** Agent 在 plan mode 实现过程中发现涉及多个模块联动、边界条件复杂或异常路径超出预期
- **THEN** Agent SHALL 主动暂停实现，向用户声明"复杂度超预期，建议升级为 tdd mode"，确认后切换

### Requirement: tdd → plan 禁止降级

Agent SHALL NOT 在判定为 tdd mode 后降级为 plan mode。

#### Scenario: tdd 判定后不得降级
- **WHEN** superpowers 门禁已判定变更为 tdd mode
- **THEN** Agent SHALL NOT 以任何理由降级为 plan mode，即使实现过程中发现变更比预期简单

### Requirement: 风险路由参考文档

reef-start SHALL 提供一份风险路由卡参考文档，作为 Agent 和用户共同的风险判断依据。

#### Scenario: 参考文档可查阅
- **WHEN** Agent 执行风险路由判断时
- **THEN** Agent SHALL 以 `references/risk-routing-card.md` 为判断依据，且该文档对用户可见

### Requirement: 默认 auto 模式

风险路由 SHALL 默认为 auto（自动推荐），Agent 推荐后等待用户确认。

#### Scenario: 自动推荐 + 人工确认
- **WHEN** superpowers 门禁触发风险路由
- **THEN** Agent SHALL 输出风险判断表格 + 推荐模式 + 推荐理由，等待用户确认后方可进入阶段四
