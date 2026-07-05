## ADDED Requirements

### Requirement: update 命令验证
验证脚本 SHALL 执行 playground 中的 `deepstorm update` 命令，验证模板同步和版本检查两项功能。

#### Scenario: L0 冒烟 — 同步模板正常 + 输出版本信息
- **WHEN** 执行 `DEEPSTORM_REGISTRY_URL=<fixture> node <CLI_BIN> update`，其中 fixture 指向 `test-fixtures/deepstorm-version-current.json`
- **THEN** 输出包含"同步完成"，且包含"当前版本"和"最新版本"，退出码为 0

#### Scenario: L0 冒烟 — 版本检查降级（registry 不可达）
- **WHEN** 执行 `DEEPSTORM_REGISTRY_URL=http://localhost:1 node <CLI_BIN> update`
- **THEN** 输出包含"无法检查更新"，且输出仍包含"同步完成"

#### Scenario: L1 全量 — 检测到更新并自动更新
- **WHEN** 执行 `DEEPSTORM_REGISTRY_URL=<fixture> DEEPSTORM_UPDATE_CMD="echo mock" node <CLI_BIN> update`，其中 fixture 指向 `test-fixtures/deepstorm-version-newer.json`
- **THEN** 输出包含"最新版本"、"正在自动更新"、"已更新"

### Requirement: doctor 命令验证
验证脚本 SHALL 执行 `deepstorm doctor` 命令，检查命令正常退出且有诊断和版本输出。

#### Scenario: L1 全量 — doctor 正常执行
- **WHEN** 执行 `node <CLI_BIN> doctor`
- **THEN** 退出码为 0，输出包含"CLI 版本"等诊断信息

### Requirement: 输出结果断言
验证脚本 SHALL 对 CLI 输出做字符串匹配和退出码检查，区分 PASS/FAIL。

#### Scenario: 输出匹配
- **WHEN** CLI 输出包含预期字符串
- **THEN** 脚本输出 ✅ 标记，继续执行下一场景

#### Scenario: 退出码检查
- **WHEN** CLI 退出码与预期不符
- **THEN** 脚本输出 ❌ 标记，显示实际退出码和期望退出码

#### Scenario: 输出不匹配
- **WHEN** CLI 输出不包含预期字符串
- **THEN** 脚本输出 ❌ 标记，显示期望值和前 10 行实际输出

### Requirement: 验证结果汇总
验证脚本 SHALL 在所有场景执行完成后汇总结果，以退出码标识最终状态。

#### Scenario: 全部通过
- **WHEN** 所有验证场景均标记为 PASS
- **THEN** 脚本退出码为 0

#### Scenario: 存在失败
- **WHEN** 任意验证场景标记为 FAIL
- **THEN** 脚本退出码为 1

### Requirement: 配置文件保护
验证脚本 SHALL 在运行前后保持 playground 的 `.claude/settings.json` 不变。

#### Scenario: 配置备份与恢复
- **WHEN** 验证脚本执行
- **THEN** 脚本运行前备份 settings.json，运行后恢复原始内容

#### Scenario: 异常退出时配置恢复
- **WHEN** 验证中途异常退出（SIGINT/SIGTERM）
- **THEN** 通过 `trap EXIT` 确保恢复执行，settings.json 不被破坏

### Requirement: CLI 入口验证
验证脚本 SHALL 先验证 CLI 构建物可正常启动，再执行功能验证。

#### Scenario: L0 冒烟 — CLI 入口正常退出
- **WHEN** 执行 `node <CLI_BIN> --help`
- **THEN** 退出码为 0，输出包含 DeepStorm 或 CLI 关键字

### Requirement: 脚本基础检查
验证脚本 SHALL 在运行验证场景之前先做前提检查，确保所有依赖的文件和路径可用。

#### Scenario: CLI_BIN 路径有效
- **WHEN** `CLI_BIN` 指向的脚本路径存在
- **THEN** 脚本继续执行，不报路径错误

#### Scenario: fixture 文件存在
- **WHEN** 验证脚本使用 `test-fixtures/` 下的文件
- **THEN** 文件已存在且可读

#### Scenario: 前提检查失败退出码为 2
- **WHEN** 任意前提检查失败
- **THEN** 脚本立即退出，退出码为 2，输出明确的原因

### Requirement: 运行速度
L0 冒烟测试 SHALL 在 30 秒内完成。

#### Scenario: 快速完成
- **WHEN** 执行冒烟测试
- **THEN** 在 30 秒内输出最终结果并退出

#### Scenario: 超时标记为 FAIL
- **WHEN** 任意验证场景执行时间超过 30 秒
- **THEN** 该场景标记为 ❌ 并继续下一场景，不阻塞脚本退出
