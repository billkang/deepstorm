## Purpose

Feature toggle 为 DeepStorm 套件提供统一的能力开关机制，通过 Claude Code 原生配置（`.claude/settings.json` / `settings.local.json`）控制各能力的启用状态，无需修改代码或环境变量。

## Requirements

### Requirement: 配置路径规范

Feature toggle SHALL 使用嵌套 JSON 结构，路径为 `deepstorm.<module>.<feature>`，在目标 key 内使用 `enabled` 作为启用/禁用标志。

```json
{
  "deepstorm": {
    "<module>": {
      "<feature>": {
        "enabled": <boolean>
      }
    }
  }
}
```

- `deepstorm` — 顶层命名空间
- `<module>` — 套件名称，camelCase（如 `tide`、`reef`）
- `<feature>` — 功能点名称，camelCase（如 `dingtalkUpload`）
- `enabled` — boolean，`true` 启用 / `false` 禁用

#### Scenario: 完整配置路径
- **WHEN** 用户配置钉钉上传开关
- **THEN** 嵌套路径为 `deepstorm → tide → dingtalkUpload → enabled`，值为 `true` 或 `false`

#### Scenario: 插件间隔离
- **WHEN** Tide 和 Reef 各自有开关
- **THEN** 使用不同 module 层级（`deepstorm.tide.*` / `deepstorm.reef.*`），互不干扰

---

### Requirement: 配置读取优先级

Feature toggle SHALL 按以下优先级读取：`settings.local.json` → `settings.json` → 代码默认值。

- `settings.local.json` 中的值覆盖 `settings.json`
- 两者均未配置时使用组件定义的默认值

#### Scenario: local 覆盖 project
- **WHEN** `.claude/settings.local.json` 中 `deepstorm.tide.dingtalkUpload.enabled` 为 `false`，`.claude/settings.json` 中为 `true`
- **THEN** 实际生效值为 `false`（local 优先）

#### Scenario: 仅 project 配置
- **WHEN** `.claude/settings.local.json` 不存在，`.claude/settings.json` 中配置 `deepstorm.tide.dingtalkUpload.enabled` 为 `false`
- **THEN** 实际生效值为 `false`

#### Scenario: 均未配置
- **WHEN** 两个文件中均未配置 `deepstorm.tide.dingtalkUpload.enabled`
- **THEN** 使用默认值 `true`

---

### Requirement: 配置语法校验

Feature toggle SHALL 在读取配置时进行基本校验，值不能为 boolean 以外类型。

#### Scenario: 值格式错误
- **WHEN** 配置值为非 boolean（如 `"yes"`、`1`、`null`）
- **THEN** 忽略该配置，使用默认值并提示用户格式错误

#### Scenario: 配置文件解析失败
- **WHEN** `settings.json` 或 `settings.local.json` JSON 格式错误
- **THEN** 忽略该文件，回退到次级优先级源
