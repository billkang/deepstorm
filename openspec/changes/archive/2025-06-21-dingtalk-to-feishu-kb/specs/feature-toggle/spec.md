## MODIFIED Requirements

### Requirement: 配置路径规范

**From**: `dingtalkUpload` **To**: `feishuUpload`

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
- `<feature>` — 功能点名称，camelCase（如 `feishuUpload`）
- `enabled` — boolean，`true` 启用 / `false` 禁用

#### Scenario: 完整配置路径
- **WHEN** 用户配置飞书上传开关
- **THEN** 嵌套路径为 `deepstorm → tide → feishuUpload → enabled`，值为 `true` 或 `false`

### Requirement: 配置读取优先级

**Modified fields**: 示例中的 feature toggle 名称从 `dingtalkUpload` 更新为 `feishuUpload`

Feature toggle SHALL 按以下优先级读取：`settings.local.json` → `settings.json` → 代码默认值。

- `settings.local.json` 中的值覆盖 `settings.json`
- 两者均未配置时使用组件定义的默认值

#### Scenario: local 覆盖 project
- **WHEN** `.claude/settings.local.json` 中 `deepstorm.tide.feishuUpload.enabled` 为 `false`，`.claude/settings.json` 中为 `true`
- **THEN** 实际生效值为 `false`（local 优先）

#### Scenario: 仅 project 配置
- **WHEN** `.claude/settings.local.json` 不存在，`.claude/settings.json` 中配置 `deepstorm.tide.feishuUpload.enabled` 为 `false`
- **THEN** 实际生效值为 `false`

#### Scenario: 均未配置
- **WHEN** 两个文件中均未配置 `deepstorm.tide.feishuUpload.enabled`
- **THEN** 使用默认值 `true`
