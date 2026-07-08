## ADDED Requirements

### Requirement: hooks.json 写入路径正确性

CLI setup 和 upgrade 流程 SHALL 将 hooks 配置写入项目根目录的 `.claude/hooks.json` 文件，MUST NOT 写入 `.claude/hooks/hooks.json` 或任何嵌套子目录路径。Claude Code 只从项目根 `.claude/hooks.json` 加载 hooks 配置。

#### Scenario: setup 流程写入正确路径
- **WHEN** 用户执行 `deepstorm setup` 且所选工具包含 hooks
- **THEN** setup 流程 Step 5 SHALL 将合并后的 hooks 配置写入 `.claude/hooks.json`（相对于项目根目录）
- **AND** SHOULD NOT 创建 `.claude/hooks/hooks.json` 文件

#### Scenario: upgrade 流程写入正确路径
- **WHEN** 用户执行 `deepstorm update` 触发模板升级
- **THEN** `mergeToolHooksJson()` SHALL 将 hooks 配置合并到 `.claude/hooks.json`
- **AND** MUST 与 setup 流程使用相同的目标路径

#### Scenario: reconfigure 清理旧路径
- **WHEN** reconfigure 流程执行清理
- **THEN** SHALL 同时清理 `.claude/hooks.json`（根路径）和 `.claude/hooks/`（旧嵌套目录，保留用户自定义 hook 脚本）

### Requirement: 套件 hooks.json 路径正确性

各套件（reef、sweep、tide）的 `hooks/hooks.json` 中 hook 脚本路径 SHALL 使用从项目根目录出发的相对路径格式 `.claude/hooks/{script-name}`。

#### Scenario: reef hook 命令路径
- **WHEN** reef 的 `hooks.json` 被安装到目标项目
- **THEN** 所有 `command` 字段的值 SHALL 以 `.claude/hooks/reef-` 为前缀
- **AND** MUST NOT 使用 `./reef-` 相对路径格式

#### Scenario: sweep hook 命令路径
- **WHEN** sweep 的 `hooks.json` 被安装到目标项目
- **THEN** `command` 字段的值 SHALL 以 `.claude/hooks/sweep-` 为前缀
- **AND** MUST NOT 使用 `./sweep-` 相对路径格式

#### Scenario: tide hook 命令路径
- **WHEN** tide 的 `hooks.json` 被安装到目标项目
- **THEN** `command` 字段的值 SHALL 以 `.claude/hooks/tide-` 为前缀
- **AND** MUST NOT 使用 `./tide-` 相对路径格式

### Requirement: hooks 路径单数据源

项目中涉及 hooks 路径的所有代码和文档 SHALL 使用同一目标路径定义，MUST NOT 出现多处硬编码路径不一致的情况。

#### Scenario: 代码中引用路径一致性
- **WHEN** 检查 `packages/cli/src/commands/setup.ts`、`template-upgrade.ts`、`merger/hooks.ts`、`wizard/reconfigure.ts`
- **THEN** 所有 hooks JSON 目标路径 SHALL 为 `.claude/hooks.json`
- **AND** 所有 JSDoc 和注释中的路径描述 SHALL 与代码行为一致
