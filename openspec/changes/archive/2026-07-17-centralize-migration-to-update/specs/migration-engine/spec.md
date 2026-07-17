# Spec: migration-engine

集中迁移引擎，负责 `deepstorm update` 中所有旧数据源的检测、迁移和清理。

## ADDED Requirements

### Requirement: 迁移入口集成

`deepstorm update` 命令的 action handler SHALL 在执行模板同步和版本检查之前，先调用迁移函数。

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

迁移引擎 SHALL 遵循 Watermark 模式——目标字段已存在时，不覆盖，仅删除旧数据源。

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
