## ADDED Requirements

### Requirement: init 将技术方案写入持久配置

`deepstorm init` 命令执行完成后，SHALL 将用户选择的技术方案写入 `.claude/settings.json` 的 `deepstorm.reef.*` 命名空间。

写入 SHALL 使用 `mergeDeepStormConfig` 函数，仅包含 init 交互中问过的字段，不主动设置未问过的字段。

#### Scenario: init 选择 Angular + Java 后写入配置
- **WHEN** 用户通过 `deepstorm init` 交互模式选择前端 Angular + 后端 Java/Spring Boot + ORM Hibernate + 数据库迁移 Liquibase + AI 框架 Spring AI
- **THEN** `settings.json` 的 `deepstorm.reef` 下 SHALL 包含以下字段：`techs: "frontend,backend"`、`frontend.framework: "angular"`、`backend.language: "java"`、`backend.java.orm: "hibernate"`、`backend.java.dbMigration: "liquibase"`、`backend.java.ai: "spring-ai"`

#### Scenario: init 只选前端时写入
- **WHEN** 用户通过 `deepstorm init` 交互模式只选择前端 Angular（后端选"不需要后端"）
- **THEN** `settings.json` 的 `deepstorm.reef` 下 SHALL 包含 `techs: "frontend"` 和 `frontend.*` 相关字段，SHALL NOT 包含 `backend.*` 字段

#### Scenario: init 只选后端时写入
- **WHEN** 用户通过 `deepstorm init` 交互模式只选择后端 Java（前端选"不需要前端"）
- **THEN** `settings.json` 的 `deepstorm.reef` 下 SHALL 包含 `techs: "backend"` 和 `backend.*` 相关字段，SHALL NOT 包含 `frontend.*` 字段

#### Scenario: 已有 settings.json 时不会覆盖无关字段
- **WHEN** `.claude/settings.json` 已存在且包含非 `deepstorm.reef.*` 的字段（如 `tide.issueTracker: "jira"`）
- **THEN** 执行 init 后，非 reef 字段 SHALL 原样保留，不被覆盖

### Requirement: init 完成后引导继续 setup

`deepstorm init` 完成脚手架生成后，SHALL 使用 `@clack/prompts` 的 `confirm` 询问用户是否继续安装 DeepStorm 开发环境。

#### Scenario: 用户选择继续安装
- **WHEN** init 完成并询问"是否继续安装 DeepStorm 开发环境？"，且用户选择 Yes
- **THEN** SHALL 打印 `deepstorm setup` 的指引命令，引导用户手动执行（在当前进程内调用 setup 的复杂度较高，指引方式实现同等效果且保持命令职责独立）
- **AND** 如果用户选择 No，SHALL 打印提示"你可以稍后运行 `deepstorm setup` 来配置开发环境"

#### Scenario: 用户选择不继续安装
- **WHEN** init 完成并询问"是否继续安装 DeepStorm 开发环境？"，且用户选择 No
- **THEN** SHALL 正常结束 init，打印"你可以稍后运行 `deepstorm setup` 来配置开发环境"
