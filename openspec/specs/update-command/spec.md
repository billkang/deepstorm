# Update Command

## Purpose

`deepstorm update` provides a single-command mechanism for keeping a DeepStorm installation up to date. It combines CLI version checking with incremental asset synchronization (skills, agents, hooks) based on what the user has installed, while protecting user modifications from being silently overwritten.

The command supersedes the old multi-flag pattern (`--check`, `--cli`, `--skills`) and the separate `template upgrade` subcommand, consolidating all update logic into a single zero-option command.

## Requirements

### Requirement: CLI version check and self-update
`deepstorm update` SHALL check the npm registry for the latest `@deepstorm/cli` version and automatically update if a newer version is available.

#### Scenario: New version available
- **WHEN** user runs `deepstorm update` and npm registry has a newer version of `@deepstorm/cli`
- **THEN** CLI SHALL display current version and latest version
- **THEN** CLI SHALL automatically run `npm install -g @deepstorm/cli@latest`
- **THEN** CLI SHALL display success message after update completes

#### Scenario: Network failure during version check
- **WHEN** user runs `deepstorm update` and network is unreachable during version check
- **THEN** CLI SHALL display error message and continue to skill sync without aborting

#### Scenario: Already on latest version
- **WHEN** user runs `deepstorm update` and current version matches npm latest
- **THEN** CLI SHALL display "已是最新版本" and proceed to skill sync

### Requirement: Incremental sync based on installed tools
`deepstorm update` SHALL read the deepstorm configuration from `.claude/settings.json` and only sync assets for tools and skills the user has explicitly installed.

#### Scenario: Sync only installed skills
- **WHEN** user runs `deepstorm update` and `deepstorm.installedSkills` contains `["tide-discuss", "reef-commit"]`
- **THEN** CLI SHALL only sync those two skills to `.claude/skills/`
- **THEN** CLI SHALL NOT sync any skills not in the installed list

#### Scenario: No installed skills found
- **WHEN** user runs `deepstorm update` and `.claude/settings.json` has no `deepstorm.installedSkills` or file does not exist
- **THEN** CLI SHALL display a message and skip skill sync

#### Scenario: Config-aware skill rendering during update
- **WHEN** user runs `deepstorm update` and a skill has `.tmpl` templates that depend on configuration values (e.g., `reef.frontend.framework`)
- **THEN** CLI SHALL re-render those templates using the current config from `deepstorm.*` in settings.json

### Requirement: Sync hooks and agents
`deepstorm update` SHALL sync not only skills but also hooks and agents for the installed tools.

#### Scenario: Sync installed hooks
- **WHEN** user runs `deepstorm update` and installed tools have associated hooks
- **THEN** CLI SHALL update the hooks in `.claude/hooks/` for those tools

#### Scenario: Sync installed agents
- **WHEN** user runs `deepstorm update` and installed tools have associated agents
- **THEN** CLI SHALL update the agents in `.claude/agents/` for those tools

### Requirement: User modification protection
`deepstorm update` SHALL detect files that the user has modified and preserve them before overwriting with new versions.

#### Scenario: User-modified file detected
- **WHEN** a system file in `.claude/skills/` or `.claude/agents/` has been modified by the user since last install
- **THEN** CLI SHALL rename the modified file with a `.bak` suffix (or timestamp-based marker) to preserve the user's version
- **THEN** CLI SHALL install the new system version of the file
- **THEN** CLI SHALL report to the user which files were backup and replaced

#### Scenario: Unmodified file
- **WHEN** a system file matches the distributed version
- **THEN** CLI SHALL overwrite it silently without backup

### Requirement: Replace `template upgrade` subcommand
The `template upgrade` subcommand SHALL be removed, with its functionality fully subsumed by `deepstorm update`.

#### Scenario: template upgrade is no longer available
- **WHEN** user runs `npx @deepstorm/cli template upgrade`
- **THEN** the command SHALL return an error indicating the subcommand no longer exists and redirect to `deepstorm update`

### Requirement: No sub-options on update command
`deepstorm update` SHALL accept no command-line options (`--check`, `--cli`, `--skills` are removed).

#### Scenario: Running update with --check flag
- **WHEN** user runs `deepstorm update --check`
- **THEN** CLI SHALL treat `--check` as an unknown option and display an error

### Requirement: 旧数据源迁移入口集成

`deepstorm update` SHALL 在执行模板同步和版本检查之前，先自动调用旧数据源迁移函数。

#### Scenario: 迁移作为 update 第一步
- **WHEN** 用户运行 `deepstorm update`
- **THEN** 系统先执行旧数据源迁移，再执行模板同步和版本检查

### Requirement: 4 类旧数据源迁移

迁移引擎 SHALL 支持以下 4 类旧数据源的检测和迁移：

| 旧数据源 | 新位置 |
|----------|--------|
| `.claude/settings.json` → `deepstorm` key | `.deepstorm/settings.json` 顶层字段 |
| `.sweep-init` 标记文件 | `sweep.e2eProjectPath = "."` |
| `.env` 中的 `BASE_URL_*` / `DEFAULT_ENV` | `sweep.environments` |
| `.deepstorm/scope-config.json` | `reef.scope` |

#### Scenario: 迁移 .claude/settings.json deepstorm 配置
- **WHEN** `.claude/settings.json` 中存在 `deepstorm` 字段且字段非空
- **THEN** 将该字段内容 deepMerge 到 `.deepstorm/settings.json`，并从 `.claude/settings.json` 中删除该字段

#### Scenario: 迁移 .sweep-init 标记文件
- **WHEN** 项目根目录存在 `.sweep-init` 文件
- **AND** `.deepstorm/settings.json` 中尚未配置 `sweep.e2eProjectPath`
- **THEN** 写入 `sweep.e2eProjectPath = "."` 到 settings.json，并删除 `.sweep-init` 文件

#### Scenario: 迁移 .env BASE_URL 环境配置
- **WHEN** `.env` 文件中包含 `BASE_URL_*` 或 `DEFAULT_ENV` 行
- **AND** settings.json 中尚未配置 `sweep.environments`
- **THEN** 将这些变量转换为 `sweep.environments` 对象写入 settings.json，并从 `.env` 中移除这些行，保留其他行

#### Scenario: 迁移 scope-config.json
- **WHEN** `.deepstorm/scope-config.json` 文件存在
- **AND** settings.json 中尚未配置 `reef.scope`
- **THEN** 读取 `enabled` / `ciEnabled` / `domains` 字段写入 `reef.scope`，并删除 scope-config.json 文件

### Requirement: Watermark 不覆盖原则

迁移 SHALL 遵循 Watermark 模式——目标字段已存在时，不覆盖，仅删除旧数据源。

#### Scenario: 目标字段已存在时不覆盖
- **WHEN** settings.json 中目标字段（如 `sweep.environments`）已有数据
- **THEN** 跳过该字段的迁移，但仍删除旧数据源文件
- **AND** 输出提示信息告知用户字段已存在、未被覆盖

### Requirement: 迁移容错

单个数据源迁移失败 SHALL NOT 阻塞其他数据源的迁移。

#### Scenario: 单个迁移失败不影响其他
- **WHEN** 某个旧数据源迁移抛出异常（如 JSON 解析错误）
- **THEN** 记录警告信息
- **AND** 继续执行后续旧数据源的迁移

### Requirement: 迁移报告

迁移函数 SHALL 返回已执行迁移项的列表，供主流程输出摘要。

#### Scenario: 输出迁移摘要
- **WHEN** 迁移完成
- **THEN** update 命令输出 `✔ 已完成 N 项旧数据源迁移`
- **AND** 当迁移项数为 0 时不输出
