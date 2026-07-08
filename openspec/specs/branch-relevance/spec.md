## Purpose

reef-commit 执行提交流程时自动检查当前分支是否与待提交任务匹配，并在不匹配时创建新分支。确保代码提交在正确的分支上，维护分支管理和代码追溯的规范性。

## Requirements

### Requirement: 分支 main/master 检测与自动创建
reef-commit 在提交流程的「审查待提交文件」步骤之前，SHALL 检查当前 Git 分支名。如果当前分支是 `main` 或 `master`，SHALL 自动创建新分支并将变更迁移到新分支上，不得询问用户意见。

#### Scenario: 在 main 分支上执行 reef-commit
- **WHEN** 当前分支是 `main`，用户执行 reef-commit
- **THEN** 系统检测到分支为 main，自动暂存所有未提交变更，切换到 main 分支并拉取最新代码，基于 main 创建并切换到新分支，恢复暂存的变更，然后在新分支上继续提交流程

#### Scenario: 在 master 分支上执行 reef-commit
- **WHEN** 当前分支是 `master`，用户执行 reef-commit
- **THEN** 系统检测到分支为 master，自动暂存所有未提交变更，切换到 master 分支并拉取最新代码，基于 master 创建并切换到新分支，恢复暂存的变更，然后在新分支上继续提交流程

### Requirement: 临时分支名检测与建议
reef-commit SHALL 检测当前分支名是否以临时性前缀开头（如 `temp/`、`wip/`、`test/`、`tmp/`、`dev/`），并向用户提示建议创建更有意义的分支名。

#### Scenario: 临时分支上执行 reef-commit
- **WHEN** 当前分支名为 `temp/fix-bug`、`wip/user-auth` 等临时名称，用户执行 reef-commit
- **THEN** 系统提示用户当前分支名为临时分支，建议创建新分支，询问用户是否创建新分支

### Requirement: OpenSpec 任务匹配
reef-commit SHALL 扫描 `openspec/changes/*/` 目录，查找与当前变更内容（staged + unstaged）最匹配的 OpenSpec 任务。LLM SHALL 根据变更内容的 diff 语义判断最合适的任务。

#### Scenario: 匹配到对应 OpenSpec 任务
- **WHEN** 当前变更内容与某个 `openspec/changes/<task>/proposal.md` 描述的功能一致
- **THEN** 系统使用该 `<task>` 作为新分支名的候选

#### Scenario: 未匹配到 OpenSpec 任务
- **WHEN** 没有发现与变更内容匹配的 OpenSpec 任务
- **THEN** LLM 根据变更内容自行推导合适的分支名

### Requirement: 新分支自动创建
当 reef-commit 判定需要创建新分支时，SHALL 自动执行以下流程：暂存当前所有变更（staged + unstaged）→ 切换到 main → 拉取最新代码 → 基于 main 创建并切换到新分支 → 恢复暂存的变更。整个过程对用户透明。

#### Scenario: 自动创建新分支并保留变更
- **WHEN** 需要创建新分支
- **THEN** 系统自动执行 git stash → git checkout main → git pull origin main（尝试）→ git checkout -b <new-branch>（基于 main）→ git stash pop，所有未提交变更完整保留在新分支上

### Requirement: 分支名生成规则
当需要生成新分支名时，SHALL 按以下优先级确定：
1. OpenSpec 任务名（`openspec/changes/<task>/` 的目录名）
2. LLM 根据变更内容推导的 kebab-case 分支名

分支名 SHALL 包含 Conventional Commit 前缀（如 `feat/`、`fix/`、`chore/`、`refactor/` 等），前缀 SHALL 由 LLM 根据变更意图自动判定。

#### Scenario: 基于 OpenSpec 任务生成分支名
- **WHEN** 匹配到 OpenSpec 任务 `openspec/changes/add-user-auth/`
- **THEN** 新分支名为 `feat/add-user-auth`（前缀由 LLM 根据变更意图判定）

#### Scenario: 无 OpenSpec 时 LLM 推导分支名
- **WHEN** 没有匹配的 OpenSpec 任务，且当前变更为修复登录超时 bug
- **THEN** 新分支名可能为 `fix/login-timeout`（kebab-case，含前缀）
