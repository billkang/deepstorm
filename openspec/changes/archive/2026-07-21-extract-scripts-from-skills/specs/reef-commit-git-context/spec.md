## ADDED Requirements

### Requirement: 分支名合法性检查
reef-commit 在提交流程开始时，SHALL 通过 `branch-check.mjs` 脚本检查当前分支是否合法，而非由 LLM 自行推理判断。

#### Scenario: 当前在 main/master 分支上
- **WHEN** 当前 git 分支是 `main` 或 `master`
- **THEN** 脚本输出 `{ "isValid": false, "reason": "不允许在 main/master 直接提交", "action": "create-branch" }`

#### Scenario: 分支名包含临时标识
- **WHEN** 分支名匹配 `^(temp|wip|test|tmp|dev)(/.*)?$`
- **THEN** 脚本输出 `{ "isValid": true, "warning": true, "action": "suggest-rename", "reason": "分支名像临时分支，建议改名" }`

### Requirement: git 上下文统一收集
reef-commit 的 Step 7 SHALL 通过 `collect-git-context.mjs` 一次性收集所有上下文，输出结构化 JSON，替代当前五段分散的内嵌 bash 命令。

#### Scenario: 正常收集（有 fork point）
- **WHEN** 当前分支有与 main 的 merge-base
- **THEN** 脚本输出包含 `branch`、`forkPoint`、`diffStat`、`commitLog`、`openspecChanges`、`jiraRef` 字段的 JSON

#### Scenario: 无 openspec/changes/ 目录
- **WHEN** `openspec/changes/` 目录不存在或为空
- **THEN** 脚本的 `openspecChanges` 字段为 `null`，不报错

#### Scenario: 无可追踪的远程分支
- **WHEN** `git merge-base` 失败
- **THEN** 脚本以 `{ "branch": "<current>", "forkPoint": null, "error": "无法找到基准点" }` 输出，exit code 0

### Requirement: 分支切换脚本
reef-commit 的 Step 3 SHALL 使用 `stash-and-switch.sh` 处理分支切换，取代内嵌 bash。

#### Scenario: 有未提交变更
- **WHEN** 当前工作区有未提交变更
- **THEN** 脚本先 `git stash`，切换分支后 `git stash pop`

#### Scenario: 无未提交变更
- **WHEN** 当前工作区干净
- **THEN** 脚本直接切换分支，跳过 stash/pop

### Requirement: 测试运行脚本
reef-commit 的 Step 6 SHALL 使用 `run-tests.sh` 运行测试（已存在 `packages/reef/hooks/reef-run-tests.sh` 供参考）。

#### Scenario: 项目有 Java 后端测试
- **WHEN** 检测到 `build.gradle` 或 `pom.xml`
- **THEN** 运行 `./gradlew test` 并输出 JSON 结果

#### Scenario: 项目有前端测试
- **WHEN** 检测到 `package.json` 且有 `test` 脚本
- **THEN** 运行 `pnpm test` 并输出 JSON 结果

### Requirement: OpenSpec 状态检查
reef-commit 的 Step 6.5 SHALL 使用 `check-openspec-status.mjs` 检查关联 OpenSpec change 的状态。状态判断通过路径检测（`archive/` 目录）和 `tasks.md` checkbox 完成度来确定。

#### Scenario: change 目录在 archived 状态下
- **WHEN** 扫描 `openspec/changes/` 发现目录路径包含 `archive/`
- **THEN** 脚本排除 archive 目录，不纳入活跃 change 列表

#### Scenario: 活跃 change 且 tasks 全部完成
- **WHEN** change 目录下 `tasks.md` 的所有 checkbox 均为 `[x]`
- **THEN** 输出包含 `{ "tasksAllDone": true, "tasksComplete": N }`，表明 change 可归档

#### Scenario: 活跃 change 但 tasks 未完成
- **WHEN** change 目录下 `tasks.md` 存在未完成的 checkbox
- **THEN** 输出包含 `{ "tasksAllDone": false, "tasksComplete": M, "tasksTotal": N }`

#### Scenario: 多个活跃 change
- **WHEN** 有多个活跃 change 目录
- **THEN** 脚本输出全部匹配结果数组，由 AI 根据分支名或提案标题判断
