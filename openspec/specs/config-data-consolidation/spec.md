## ADDED Requirements

### Requirement: `SweepConfig` 接口扩展
`DeepStormConfig` 的类型定义 SHALL 新增 `sweep.e2eProjectPath` 和 `sweep.environments` 字段。

#### Scenario: e2eProjectPath 字段
- **WHEN** 类型定义更新
- **THEN** `SweepConfig` SHALL 包含 `e2eProjectPath?: string` 字段
- **THEN** 该字段的值取值范围为 `"."`（根目录）、子目录路径（如 `"e2e"`），或未设置

#### Scenario: environments 字段
- **WHEN** 类型定义更新
- **THEN** `SweepConfig` SHALL 包含 `environments?: { test: { baseUrl: string }, staging: { baseUrl: string }, prod: { baseUrl: string }, default: 'test' | 'staging' | 'prod' }` 字段

### Requirement: `ReefConfig` 接口扩展
`DeepStormConfig` 的类型定义 SHALL 新增 `reef.scope` 字段替代 `.deepstorm/scope-config.json`。

#### Scenario: scope 字段
- **WHEN** 类型定义更新
- **THEN** `ReefConfig` SHALL 包含 `scope?: { enabled: boolean, ciEnabled: boolean, domains: string[] }` 字段

### Requirement: `.env` 的多环境 baseURL 迁移到 `settings.json`
`sweep-init` 收集的多环境 baseURL SHALL 写入 `settings.json` 的 `sweep.environments`，不再生成 `.env` 文件。

#### Scenario: 写入 environments 配置
- **WHEN** `/sweep-init` 执行 Step 4（收集多环境配置）
- **THEN** 用户输入的 test/staging/prod baseURL 写入 `settings.json` 的 `sweep.environments`
- **THEN** 默认目标环境写入 `sweep.environments.default`
- **THEN** 不生成 `.env` 文件

### Requirement: `env-manager.mjs` 配置源迁移
`sweep-run` 的 `env-manager.mjs` SHALL 仅从 `settings.json` 读取多环境配置，不再支持 `.env` 回退（旧 `.env` 数据由 `deepstorm update` 统一迁移）。

#### Scenario: 读取 settings.json
- **WHEN** `env-manager.mjs` 的 `resolveEnv()` 或 `listEnvs()` 被调用
- **THEN** 从 `.deepstorm/settings.json` 的 `sweep.environments` 读取配置
- **THEN** 若 settings.json 中无 `sweep.environments` 则返回空/默认值，不读 `.env`

#### Scenario: 统一返回格式
- **WHEN** `resolveEnv()` 或 `listEnvs()` 被调用
- **THEN** 返回格式保持一致：`resolveEnv()` → `{ env, baseUrl, availableEnvs }`，`listEnvs()` → `[{ name, key, url }]`

### Requirement: `reef-scope-setup.sh` 写入 `settings.json`
`reef-scope-setup.sh` SHALL 将 scope 配置写入 `.deepstorm/settings.json` 的 `reef.scope` 字段，不再创建独立的 `scope-config.json`（旧 scope-config.json 迁移由 `deepstorm update` 统一处理）。

#### Scenario: install 时写入 settings.json
- **WHEN** `reef-scope-setup.sh install` 执行
- **THEN** 读取 `.deepstorm/settings.json` 现有内容
- **THEN** 合并 `reef.scope` 字段（`{ enabled: true, ciEnabled: true, domains: [] }`）
- **THEN** 原子写入（先写 `.tmp` 文件再 rename）

### Requirement: `reef-scope-check.sh` 读取 `settings.json`
`reef-scope-check.sh` SHALL 仅从 `.deepstorm/settings.json` 的 `reef.scope` 读取 scope 配置（旧 scope-config.json 的读取由 `deepstorm update` 统一迁移）。

#### Scenario: 读取 settings.json
- **WHEN** `reef-scope-check.sh` 的 `read_config()` 或 `is_enabled()` 被调用
- **THEN** 读取 `.deepstorm/settings.json` 的 `reef.scope` 字段
- **THEN** 不读取旧 `scope-config.json`

### Requirement: `reef-scope-gate.sh` 配置源一致
`reef-scope-gate.sh` SHALL 与 `reef-scope-check.sh` 使用相同的配置读取逻辑。

#### Scenario: 配置源一致
- **WHEN** `reef-scope-gate.sh` 执行
- **THEN** 仅读取 `settings.json` 的 `reef.scope`
- **THEN** 不回退到旧 `scope-config.json`
