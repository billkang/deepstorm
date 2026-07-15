# SDD Language Constraint

## Purpose

确保 DeepStorm 所有 SDD 文档（proposal/specs/design/tasks）、commit message 和 PR 模板统一使用中文正文，仅代码实体名、API 路径、技术术语等专业名词保留英文。

## ADDED Requirements

### Requirement: SDD 文档语言约束
SDD 文档（proposal/specs/design/tasks）的正文 MUST 使用中文编写，仅代码实体名、API 路径、技术术语等专业名词保留英文。

#### Scenario: proposal 正文使用中文
- **WHEN** LLM 生成 proposal.md
- **THEN** `## Why` 和 `## What Changes` 等章节的正文 MUST 使用中文描述
- **AND** Capabilities 的 kebab-case 名称（如 `sdd-language-constraint`）保留英文
- **AND** Impact 表格中的技术路径（如 `packages/reef/`）保留英文

#### Scenario: spec 正文使用中文
- **WHEN** LLM 生成 spec.md
- **THEN** Requirement 描述 MUST 使用中文，WHEN/THEN 的条件和预期也 MUST 使用中文
- **AND** 约束关键词 MUST 保留英文（SHALL/MUST/AND）
- **AND** 代码实体、文件路径、API 端点等技术引用保留英文

#### Scenario: design 正文使用中文
- **WHEN** LLM 生成 design.md
- **THEN** Context、Decisions、Risks 等章节的正文 MUST 使用中文
- **AND** 技术术语（DTO、API、REST 等）保留英文

#### Scenario: tasks 正文使用中文
- **WHEN** LLM 生成 tasks.md
- **THEN** 分组标题和 task 描述 MUST 使用中文
- **AND** checkbox 编号格式（`1.1`、`2.1` 等）保留不变

### Requirement: 语言规范进入 SDD 生成流程
SDD 生成流程 MUST 在指令中携带语言约束，LLM 在生成 artifact 时能感知到「中文正文 + 英文专有名词」的语言规范。

#### Scenario: opsx:continue 携带语言约束
- **WHEN** 用户执行 `/opsx:continue` 创建 artifact
- **THEN** LLM 收到的指令中 MUST 包含语言约束说明
- **AND** 约束内容与 `deepstorm-discuss` skill 的语言规范章节一致

#### Scenario: reef-start 工作流传递语言约束
- **WHEN** reef-start 流程进入 SDD 文档生成阶段
- **THEN** 传递给 LLM 的 prompt 中 MUST 包含语言约束
- **AND** 语言约束在 SDD 全流程（proposal → specs → design → tasks）中一致生效

### Requirement: commit message 使用中文
DeepStorm 项目自身和下游项目的 commit message MUST 使用中文正文，仅技术专有名词和引用链接保留英文。

#### Scenario: deepstorm-commit 生成中文 commit
- **WHEN** 用户执行 `/deepstorm-commit`
- **THEN** 生成的 commit title MUST 使用 `{prefix}: 中文描述` 格式，如 `feat: 新增用户认证功能`
- **AND** commit body MUST 使用中文描述
- **AND** 技术术语（DTO、API、JIRA 等）和引用链接保留英文

#### Scenario: release commit 使用中文
- **WHEN** release 流程自动创建 commit
- **THEN** commit message MUST 为 `chore: 发布 v{version}` 而非 `RELEASING: Releasing v{version}`
- **AND** 此行为在 `release.ts` 和 `deepstorm-release` skill 中均应生效

### Requirement: PR 模板标题统一使用中文
PR 描述正文的标题 MUST 统一使用中文，避免英文/中文混排。

#### Scenario: PR 正文标题为中文
- **WHEN** LLM 生成 PR 描述
- **THEN** `## Summary` 标题 MUST 改为 `## 概要`（或其他合适的中文标题）
- **AND** `## Test plan` 标题 MUST 改为 `## 测试计划`
- **AND** `## 关联`、`## 变更清单` 等已是中文的标题保持不变
