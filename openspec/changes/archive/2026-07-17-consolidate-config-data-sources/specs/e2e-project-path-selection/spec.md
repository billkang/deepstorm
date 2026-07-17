## ADDED Requirements

### Requirement: sweep-init 支持路径选择
`sweep-init` 在执行初始化时 SHALL 先询问用户目标生成位置，根据用户选择确定所有文件的写入前缀。

#### Scenario: 独立项目路径选择
- **WHEN** 用户执行 `/sweep-init`，且选择"独立项目（根目录）"
- **THEN** 所有 E2E 项目文件生成在当前工作目录下
- **THEN** `settings.json` 中 `sweep.e2eProjectPath` 设置为 `"."`

#### Scenario: 混放项目 — 预设子目录
- **WHEN** 用户执行 `/sweep-init`，且选择"混放项目 → `e2e/`"或"`tests/e2e/`"
- **THEN** 所有 E2E 项目文件生成在所选子目录下
- **THEN** `settings.json` 中 `sweep.e2eProjectPath` 设置为所选路径（如 `"e2e"`）

#### Scenario: 混放项目 — 自定义路径
- **WHEN** 用户执行 `/sweep-init`，且选择"混放项目 → 自定义路径"
- **THEN** AI 询问用户输入目标路径
- **THEN** 用户输入的路径 SHALL 被验证（不能为空、不能是绝对路径、不能包含 `..`）
- **THEN** 所有 E2E 项目文件生成在用户指定的子目录下
- **THEN** `settings.json` 中 `sweep.e2eProjectPath` 设置为用户输入的路径

#### Scenario: 子目录已存在
- **WHEN** 用户选择的子目录已存在且非空
- **THEN** AI 输出警告并询问用户是否确认继续
- **THEN** 用户确认后覆盖写入

### Requirement: sweep-plan 支持路径导航
`sweep-plan` 在初始化检查时 SHALL 从 `settings.json` 读取 `sweep.e2eProjectPath`，根据路径值决定工作目录。

#### Scenario: E2E 项目在根目录
- **WHEN** `sweep.e2eProjectPath` 为 `"."` 或未设置
- **THEN** `sweep-plan` 在当前目录直接执行，无需切换

#### Scenario: E2E 项目在子目录
- **WHEN** `sweep.e2eProjectPath` 为 `"e2e"` 等子路径
- **THEN** `sweep-plan` 切换到对应子目录后执行
- **THEN** 输出提示 `"📂 切换到 E2E 项目目录: {路径}"`

#### Scenario: 配置不存在时的回退
- **WHEN** `settings.json` 中 `sweep.e2eProjectPath` 未设置，且 `.sweep-init` 文件存在
- **THEN** `sweep-plan` 根据旧 `.sweep-init` 文件（实体或重定向）导航
- **THEN** 输出提示 `"ℹ️ 使用旧 .sweep-init 标记导航，建议运行 /sweep-init 刷新配置"`

#### Scenario: 未初始化
- **WHEN** `settings.json` 中 `sweep.e2eProjectPath` 未设置，且 `.sweep-init` 文件也不存在
- **THEN** `sweep-plan` 输出错误 "❌ 未检测到 E2E 项目，请先运行 /sweep-init" 并退出

#### Scenario: 切换后目标目录缺失
- **WHEN** `sweep.e2eProjectPath` 指向的目录不存在
- **THEN** `sweep-plan` 输出错误并建议重新运行 `/sweep-init`

### Requirement: sweep-run 支持路径导航
`sweep-run` 在初始化检查时 SHALL 复用与 sweep-plan 相同的路径导航逻辑。

#### Scenario: 导航逻辑复用
- **WHEN** `sweep-run` 执行
- **THEN** 使用与 sweep-plan 相同的导航逻辑（读 settings.json → 切换目录 → 检查目标存在）
- **THEN** 路径切换前输出提示

### Requirement: Level 2 导航支持（向上查找）
当用户在子目录中执行 sweep 命令时，系统 SHALL 支持向上查找 settings.json 中的配置。

#### Scenario: 在子目录中执行
- **WHEN** 用户在 E2E 项目的子目录（如 `e2e/flows/`）中执行 `/sweep-plan`
- **THEN** 系统向上查找父目录中的 `.deepstorm/settings.json`
- **THEN** 找到 `sweep.e2eProjectPath` 后，正确解析为相对于项目根的路径
