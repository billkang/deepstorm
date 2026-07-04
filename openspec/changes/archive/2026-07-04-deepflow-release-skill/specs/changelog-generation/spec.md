## ADDED Requirements

### Requirement: 按 Conventional Commits 分类生成

DeepStorm Release SHALL 将 git 提交历史按 Conventional Commits 类型分类整理为 CHANGELOG 条目。

#### Scenario: 正常分类

- **WHEN** 提交历史中包含多种 Conventional Commits 前缀
- **THEN** AI 将提交按类型分组，使用以下分类标题：`### Features`（`feat:`）、`### Bug Fixes`（`fix:`）、`### Performance Improvements`（`perf:`）、`### Code Refactoring`（`refactor:`）、`### Documentation`（`docs:`）、`### Maintenance`（`chore:`、`test:`、`style:`、`build:`、`ci:`）

#### Scenario: 无对应分类的提交

- **WHEN** 提交前缀不在已知分类映射中
- **THEN** AI 将此类提交归入 `### Miscellaneous` 分类

### Requirement: AI 汇总同类变更

DeepStorm Release SHALL 允许 AI 汇总多个同类型提交为简洁的 CHANGELOG 条目，而非逐条罗列。

#### Scenario: 合并同类变更

- **WHEN** 同一分类下有多个相似主题的提交（如多个 `feat:` 都是关于模板管理）
- **THEN** AI SHALL 合并为 1-2 句自然语言描述，而非逐条复制 commit message

#### Scenario: 独特性提交保留

- **WHEN** 同一分类下某个提交的内容与其他提交无关联
- **THEN** AI SHALL 单独列出该条目

### Requirement: 处理破坏性变更标注

DeepStorm Release SHALL 在 CHANGELOG 中突出标注 breaking changes。

#### Scenario: 破坏性变更

- **WHEN** 提交历史中包含 breaking changes（`!` 标记或 `BREAKING CHANGE:` 正文）
- **THEN** CHANGELOG SHALL 在文件顶部单独增加 `### ⚠ BREAKING CHANGES` 章节，列出所有破坏性变更，包括变更内容和迁移指引

### Requirement: 追加到已有文件

DeepStorm Release SHALL 将新生成的 CHANGELOG 内容追加到已有的 `CHANGELOG.md` 文件开头（新内容在上方）。

#### Scenario: CHANGELOG.md 已存在

- **WHEN** 项目根目录已存在 `CHANGELOG.md`
- **THEN** AI SHALL 在新条目前插入版本号标题（`## [version]`）和日期（`YYYY-MM-DD`），然后将新内容插入到已有内容的**前面**

#### Scenario: CHANGELOG.md 不存在

- **WHEN** 项目根目录不存在 `CHANGELOG.md`
- **THEN** AI SHALL 创建新的 `CHANGELOG.md`，在文件开头添加版本信息和日期

### Requirement: 版本号标题格式

CHANGELOG 中每个版本 SHALL 使用 `## [version] - YYYY-MM-DD` 格式作为标题。

#### Scenario: 格式验证

- **WHEN** AI 生成 CHANGELOG 条目
- **THEN** 版本标题 SHALL 遵循 `## [X.Y.Z] - YYYY-MM-DD` 格式

### Requirement: 引用 commits

CHANGELOG 中的每个条目 SHOULD 引用关联的 commit hash 或 PR 号。

#### Scenario: 引用 commit

- **WHEN** CHANGELOG 条目基于某个 git commit 生成
- **THEN** 条目末尾 SHALL 添加 `(<commit-hash-abbrev>)` 引用
