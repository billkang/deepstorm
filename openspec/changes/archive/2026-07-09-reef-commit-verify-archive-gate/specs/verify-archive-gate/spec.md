## ADDED Requirements

### Requirement: 提交前自动检查 OpenSpec 归档状态
deepstorm-commit 在执行 git 提交前，SHALL 自动检查当前分支关联的活跃 OpenSpec change 的归档状态。

#### Scenario: 有关联的活跃 change
- **WHEN** 当前分支名匹配 `openspec/changes/*/` 下的某个活跃 change 目录名
- **THEN** 系统读取该 change 的 `.openspec.yaml`，检查 `status` 字段

#### Scenario: 无关联的活跃 change
- **WHEN** 扫描 `openspec/changes/*/` 后没有找到与当前分支匹配的活跃 change
- **THEN** 跳过 OpenSpec 检查，直接进入后续提交流程

#### Scenario: 多个活跃 change
- **WHEN** 存在多个匹配或部分匹配的活跃 change
- **THEN** 系统应询问用户选择正确的 change，不得自动猜测

#### Scenario: change 已归档
- **WHEN** 关联 change 的 `.openspec.yaml` 中 `status: archived`
- **THEN** 跳过 verify 和 archive 检查，直接进入后续提交流程

### Requirement: 提交前自动完成验证
如果关联的活跃 OpenSpec change 尚未完成验证，deepstorm-commit SHALL 自动调用 `/opsx:verify` 完成验证。

#### Scenario: tasks 全部完成但未验证
- **WHEN** 关联 change 的 `tasks.md` 中所有 checkbox 均为 `[x]`，且 `status` 非 `verified` 或 `archived`
- **THEN** 自动通过 Skill 工具调用 `/opsx:verify`
- **AND THEN** 验证结果应报告给用户

#### Scenario: 存在未完成的任务
- **WHEN** `tasks.md` 中仍有 `[ ]` 未完成的 task
- **THEN** 提示用户「存在未完成任务，请先完成所有 task 再提交」，并中止提交流程

#### Scenario: 验证发现 CRITICAL 问题
- **WHEN** `/opsx:verify` 返回 CRITICAL 级别的问题
- **THEN** 提示用户修复后再提交，中止提交流程

#### Scenario: 验证仅含 WARNING/SUGGESTION
- **WHEN** `/opsx:verify` 返回的问题仅包含 WARNING 或 SUGGESTION 级别
- **THEN** 视为验证通过，继续下一步归档流程

### Requirement: 提交前自动完成归档
验证通过后，deepstorm-commit SHALL 自动调用 `/opsx:archive` 完成归档。

#### Scenario: verify 通过后自动 archive
- **WHEN** `/opsx:verify` 已通过（无 CRITICAL 问题）
- **THEN** 自动通过 Skill 工具调用 `/opsx:archive`
- **AND THEN** 归档后确认 `openspec/changes/archive/` 下已有对应 change 目录

#### Scenario: archive 执行失败
- **WHEN** `/opsx:archive` 执行失败（如文件权限、路径冲突等）
- **THEN** 提示用户手动处理归档问题，中止提交流程

### Requirement: reef-commit 通用模板同步
本变更涉及 `deepstorm-commit` 和 `reef-commit` 两套技能。`reef-commit` SKILL.md.tmpl SHALL 同步新增对应的 verify/archive 检查步骤，确保下游用户项目的 reef-commit 也能使用此能力。

#### Scenario: deepstorm-commit 修改后同步 reef-commit
- **WHEN** `deepstorm-commit` SKILL.md 的步骤 5 和步骤 6 之间新增了 OpenSpec 检查步骤
- **THEN** `packages/reef/skills/reef-commit/SKILL.md.tmpl` 的对应位置也 SHALL 被同步更新
- **AND THEN** 两份文件中的步骤编号、判断逻辑、bash 命令块 SHALL 保持一致
