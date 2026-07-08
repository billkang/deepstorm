## ADDED Requirements

### Requirement: CLAUDE.md 合规审查
每个代码审查 agent 在审查变更时 MUST 读取项目 CLAUDE.md 文件，并将其中与当前审查领域相关的规范条款纳入审查 Checklist。

#### Scenario: CLAUDE.md 存在且包含相关规范
- **WHEN** 项目中存在 CLAUDE.md 且包含与当前 agent 领域相关的规范条款
- **THEN** agent 的 workflow 中 MUST 有一个「阅读 CLAUDE.md」步骤，列出适用的规范条款
- **THEN** 如果变更违反了 CLAUDE.md 中的明确规范条款，agent MUST 在 🟡 级别标注该问题，证据来源标记为 🧾

#### Scenario: CLAUDE.md 不存在
- **WHEN** 项目中不存在 CLAUDE.md
- **THEN** agent 应跳过 CLAUDE.md 合规审查步骤，不发告警

### Requirement: 代码注释合规审查
每个代码审查 agent 在审查变更时 MUST 检查变更是否触及或影响了代码注释标记的特殊区域。

#### Scenario: 变更触及 FIXME/HACK/SECURITY 注释区域
- **WHEN** 变更修改或删除的行附近存在 `// FIXME`、`// HACK`、`// SECURITY` 注释标记
- **THEN** agent MUST 在 🟡 级别标注该变更，说明变更触及了已知问题/安全风险区域
- **THEN** 证据来源标记为 📝 并引用注释原文

#### Scenario: 变更涉及 WARNING 注释
- **WHEN** 变更删除了 `// WARNING` 注释
- **THEN** agent MUST 在 🟢 级别提醒开发者处理了告警但未确认其影响

### Requirement: Git history 上下文审查
每个代码审查 agent 在审查变更时 MUST 使用 git log 和 git blame 识别反复修改的脆弱区域。

#### Scenario: 文件有反复修改历史
- **WHEN** `git log --oneline -15 -- <file>` 显示同一文件同一逻辑区域被修改 >=3 次
- **THEN** agent MUST 在 🟡 级别标注该区域，说明其处于高频变更范围，变更需特别关注
- **THEN** agent 应对相关行执行 `git blame -L <start>,<end> -- <file>` 追溯修改原因
- **THEN** 证据来源标记为 📜 并引用相关 commit hash
