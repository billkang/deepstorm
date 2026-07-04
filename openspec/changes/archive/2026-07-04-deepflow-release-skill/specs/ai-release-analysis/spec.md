## ADDED Requirements

### Requirement: 读取 git 提交历史

DeepStorm Release SHALL 读取从最近一次 git tag 到 HEAD 之间的提交历史，作为版本号分析和 CHANGELOG 生成的输入。

#### Scenario: 正常读取

- **WHEN** 当前仓库存在至少一个 git tag
- **THEN** Skill 执行 `git log --oneline <last-tag>..HEAD` 获取提交列表

#### Scenario: 无历史 tag

- **WHEN** 当前仓库没有任何 git tag
- **THEN** Skill 从仓库的第一次提交开始分析全部历史

#### Scenario: 无新提交

- **WHEN** 自上次 tag 以来没有任何新提交
- **THEN** Skill SHALL 提示用户"自上次发布以来无变更"，并退出流程

### Requirement: 检查工作区状态

DeepStorm Release SHALL 在开始任何修改前检查 git 工作区是否为干净状态，避免误提交未完成的开发内容。

#### Scenario: 工作区有未提交变更

- **WHEN** `git status --porcelain` 返回非空结果
- **THEN** Skill SHALL 列出所有未提交变更，并提示用户先提交或暂存当前工作

#### Scenario: 工作区干净

- **WHEN** `git status --porcelain` 返回空
- **THEN** Skill SHALL 继续进入下一步分析

### Requirement: AI 分析变更范围并建议版本号

DeepStorm Release SHALL 使用大模型分析 git 提交历史，按 Conventional Commits 约定确定语义化版本变更类型（major / minor / patch），并展示分析摘要供用户确认。

#### Scenario: 包含特性提交

- **WHEN** 提交历史中包含一个或多个 `feat:` 前缀的提交
- **THEN** AI 建议版本号为 **minor** 升级（如 0.1.2 → 0.2.0）

#### Scenario: 包含破坏性变更

- **WHEN** 提交历史中包含带 `!` 标记（如 `feat!:`）或 `BREAKING CHANGE:` 正文的提交
- **THEN** AI 建议版本号为 **major** 升级（如 0.1.2 → 1.0.0）

#### Scenario: 仅包含修复和杂项

- **WHEN** 提交历史中只有 `fix:`、`chore:`、`refactor:`、`docs:` 等非特性提交
- **THEN** AI 建议版本号为 **patch** 升级（如 0.1.2 → 0.1.3）

#### Scenario: 混合类型提交

- **WHEN** 提交历史中包含多种类型（feat、fix、chore 混合）
- **THEN** AI SHALL 按最高影响级别建议版本号，同时在分析摘要中展示各类提交的数量统计

#### Scenario: 提交不符合 Conventional Commits

- **WHEN** 部分或全部提交不使用 Conventional Commits 前缀格式
- **THEN** AI SHALL 根据提交消息的正文内容推断变更类型，并在摘要中注明哪些提交是非标准格式

#### Scenario: 版本号确认

- **WHEN** AI 给出版本号建议
- **THEN** Skill SHALL 展示变更摘要（各类提交数量 + breaking changes 标注）和建议版本号，等待用户确认或手动输入覆盖

#### Scenario: 用户覆盖建议版本号

- **WHEN** 用户输入了与 AI 建议不同的版本号
- **THEN** Skill SHALL 使用用户提供的版本号继续流程

### Requirement: 支持 pre-release 版本

DeepStorm Release SHOULD 支持 pre-release 版本号（如 `0.2.0-beta.1`、`0.2.0-rc.1`）。

#### Scenario: pre-release 版本建议

- **WHEN** 用户或 AI 确定的版本号包含 pre-release 标签（如 `-beta.1`）
- **THEN** AI SHALL 在版本号和 CHANGELOG 中正确处理 pre-release 标记，npm publish 时使用 `--tag next` 而非 `latest`
