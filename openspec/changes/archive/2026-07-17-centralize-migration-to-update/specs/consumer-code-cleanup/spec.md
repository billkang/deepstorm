# Spec: consumer-code-cleanup

移除各消费方代码中的旧数据源兼容判断逻辑，使其只读 `.deepstorm/settings.json`。

## ADDED Requirements

### Requirement: env-manager.mjs 不再接受 envMap 参数

`env-manager.mjs` 的所有导出函数 SHALL NOT 接受 `envMap` 参数，数据源统一为 `.deepstorm/settings.json`。

#### Scenario: getDefaultEnv 无参
- **WHEN** 调用 `getDefaultEnv()`
- **THEN** 从 settings.json 的 `sweep.environments.default` 读取默认环境名
- **AND** 若未配置则返回 `'test'`

#### Scenario: listEnvs 无参
- **WHEN** 调用 `listEnvs()`
- **THEN** 从 settings.json 的 `sweep.environments` 读取所有非 `default` 字段
- **AND** 返回 `[{ name, key, url }]` 格式的环境列表
- **AND** 若 settings.json 未配置则返回空数组

#### Scenario: resolveEnv 无 .env fallback
- **WHEN** 调用 `resolveEnv(envName)`
- **THEN** 仅从 settings.json 的 `sweep.environments` 解析目标环境
- **AND** 若 settings.json 无 environments 配置，baseUrl 返回 null，availableEnvs 返回空数组

### Requirement: sweep-init SKILL.md 移除 .sweep-init 兼容

`sweep-init/SKILL.md` SHALL NOT 包含 `.sweep-init` 标记文件的检查或读取逻辑。

#### Scenario: 初始化检查只读 settings.json
- **WHEN** sweep-init 检查项目是否已初始化 E2E 项目
- **THEN** 仅检查 `.deepstorm/settings.json` 中 `sweep.e2eProjectPath` 是否已配置
- **AND** 不再读取 `.sweep-init` 文件

### Requirement: sweep-run SKILL.md 移除 .sweep-init fallback

`sweep-run/SKILL.md` SHALL NOT 包含 `.sweep-init` 标记文件的 fallback 读取逻辑。

#### Scenario: 环境配置只读 settings.json
- **WHEN** sweep-run 步骤 1.2 解析测试环境配置
- **THEN** 仅从 `.deepstorm/settings.json` 读取环境配置
- **AND** 不再判断 `.sweep-init` 存在性

### Requirement: sweep-plan SKILL.md.tmpl 移除 .sweep-init 引用

`sweep-plan/SKILL.md.tmpl` SHALL NOT 包含 `.sweep-init` 路径引用。

#### Scenario: 项目路径只读 settings.json
- **WHEN** sweep-plan 需要定位 E2E 项目目录
- **THEN** 仅从 settings.json 的 `sweep.e2eProjectPath` 获取路径
- **AND** 不再参考 `.sweep-init` 文件内容

### Requirement: reef-scope-check.sh 移除 scope-config.json fallback

`reef-scope-check.sh` SHALL NOT 读取 `.deepstorm/scope-config.json` 作为 scope 配置源。

#### Scenario: scope 配置只读 settings.json
- **WHEN** reef-scope-check.sh 的 `read_config()` 函数读取 scope 配置
- **THEN** 仅从 `.deepstorm/settings.json` 的 `reef.scope` 字段读取
- **AND** 不再 fallback 到 scope-config.json

### Requirement: reef-scope-setup.sh 移除旧迁移逻辑

`reef-scope-setup.sh` SHALL NOT 包含 scope-config.json → settings.json 的迁移逻辑。

#### Scenario: scope setup 不再搬移旧数据
- **WHEN** 用户运行 `reef-scope-setup.sh install`
- **THEN** 安装脚本直接读写 settings.json 的 `reef.scope` 字段
- **AND** 不再检测或迁移 scope-config.json

### Requirement: reef-scope SKILL.md 更新文档

`reef-scope/SKILL.md` SHALL 更新 scope-config.json 相关的说明文字，指向 update 命令。

#### Scenario: scope-config.json 说明改为 update 命令
- **WHEN** 用户阅读 SKILL.md 中的"配置文件"章节
- **THEN** 看到 scope-config.json 已不再使用
- **AND** 旧数据由 `deepstorm update` 统一迁移
