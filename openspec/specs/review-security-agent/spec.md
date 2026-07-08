# review-security-agent Specification

## Purpose
TBD - created by archiving change reef-review-dimension-enhance. Update Purpose after archive.
## Requirements
### Requirement: 安全审查 agent 独立性
reef-review 的审查流程 MUST 包含一个专门的安全审查 agent（reef-review-security），与 backend/frontend/infra agent 并行执行，独立覆盖安全维度的审查。

#### Scenario: 触发代码审查
- **WHEN** reef-review 被调用
- **THEN** MUST 启动一个独立的 security agent，与 backend/frontend/infra 并行
- **THEN** security agent 的审查范围覆盖多租户隔离、认证授权、注入防护、敏感数据处理、依赖安全等维度

### Requirement: 安全审查 Checklist 分级
security agent 的 Checklist MUST 按 P0（数据安全事故）到 P5（建议）分级，确保高严重度问题被优先处理。

#### Scenario: 发现 P0 级别问题
- **WHEN** security agent 发现多租户数据隔离泄露、硬编码凭据等 P0 问题
- **THEN** 该 issue MUST 标记为 🔴 Block 级别
- **THEN** 证据来源 MUST 包含 🧾（CLAUDE.md 安全红线）或 📝（`// SECURITY` / `// @audit` 注释）

#### Scenario: 发现 P1-P2 问题
- **WHEN** security agent 发现 SQL 注入、越权访问、敏感数据暴露等问题
- **THEN** 该 issue MUST 标记为 🟡 Request Changes 级别

### Requirement: 安全历史追踪
security agent 的 workflow MUST 包含检查 git history 中安全修复相关 commit 的步骤。

#### Scenario: 变更发生在历史安全修复区域
- **WHEN** 变更的文件在 git log 中存在安全修复相关的 commit（commit message 包含 security/fix/vuln 等关键词）
- **THEN** agent MUST 标注该变更涉及历史安全修复区域，需特别审查

