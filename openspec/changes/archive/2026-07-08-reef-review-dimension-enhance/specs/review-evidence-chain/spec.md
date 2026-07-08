## ADDED Requirements

### Requirement: 审查报告包含证据链
每个代码审查 agent 的输出报告 MUST 为每个 issue 附带证据来源符号，标注该问题是从哪个维度发现的。

#### Scenario: 输出审查报告
- **WHEN** agent 输出审查报告
- **THEN** 每个 issue 条目 MUST 包含 `**证据**：` 字段
- **THEN** 证据字段 MUST 使用以下符号之一标记来源类型：
  - 🧾 — CLAUDE.md 规范条款（带文件名和行号引用）
  - 📜 — git log / git blame 历史上下文（带 commit hash）
  - 📝 — 代码注释（带注释原文和行号）
  - 📚 — context7 官方文档比对
  - 🛠 — reef-style-* 编码规范

#### Scenario: Block 级别 issue 无证据链
- **WHEN** 一个 Block（🔴）级别的 issue 无法提供明确的证据来源
- **THEN** 该 issue SHOULD 被降级为 Request Changes（🟡），避免无依据的高严重度判断

### Requirement: 证据类型声明
审查报告末尾 MUST 包含证据类型符号说明表，便于 reviewer 理解符号含义。

#### Scenario: 报告末尾
- **WHEN** 审查报告包含证据链
- **THEN** 报告末尾 MUST 列出所有使用的证据类型符号及对应含义说明
