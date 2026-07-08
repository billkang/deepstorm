## ADDED Requirements

### Requirement: Eligibility 预检
SKILL.md 在启动 agent 审查之前 MUST 先对变更进行 eligibility 预检，跳过不适合审查的变更以节省 token。

#### Scenario: 变更仅包含 lock 文件
- **WHEN** `git diff --name-only` 的结果仅包含 `package-lock.json`、`yarn.lock`、`pnpm-lock.yaml`、`poetry.lock` 等 lock 文件
- **THEN** SKILL.md MUST 跳过整个审查流程，输出「lock 文件变更，无需审查」

#### Scenario: 变更仅包含文档文件
- **WHEN** `git diff --name-only` 的结果仅包含 `.md` 文件且不包含代码文件
- **THEN** SKILL.md MUST 跳过 agent 审查，输出「纯文档变更，无需审查」

### Requirement: 上下文收集
SKILL.md 在启动 agent 之前 MUST 收集三类上下文信息并注入到每个 agent 的 prompt 中。

#### Scenario: CLAUDE.md 收集
- **WHEN** 当前项目中存在 CLAUDE.md 文件
- **THEN** SKILL.md MUST 读取并提取其规范条款，作为上下文注入 agent prompt
- **THEN** agent 可直接引用这些条款而不必自行搜索文件系统

#### Scenario: Git history 摘要收集
- **WHEN** 变更涉及多个文件
- **THEN** SKILL.md 可收集每个变更文件的 `git log --oneline -15 -- <file>` 摘要，注入 agent prompt
- **THEN** agent 可在此基础上决定是否执行更精细的 git blame

#### Scenario: 代码注释标注收集
- **WHEN** 变更文件包含 `FIXME`/`HACK`/`WARNING`/`SECURITY`/`NOTE` 等特殊注释标注
- **THEN** SKILL.md MUST 将这些注释标注区域（含行号）打包注入 agent prompt

### Requirement: False Positive 抑制规则
SKILL.md MUST 为 agent 提供 false positive 抑制规则，减少无效告警。

#### Scenario: 包含 false positive 规则说明
- **WHEN** agent 启动审查
- **THEN** prompt 中 MUST 包含针对当前项目的常见 false positive 模式的描述
- **THEN** agent SHOULD 在 Checklist 检查阶段主动排除这些已知的 false positive 模式
