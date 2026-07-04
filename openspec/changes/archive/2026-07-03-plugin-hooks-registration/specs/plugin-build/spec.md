## MODIFIED Requirements

### Requirement: 构建产出物为完整 Claude Plugin 目录
系统 SHALL 根据用户配置构建一个完整的、可安装的 Claude Plugin 目录。

#### Scenario: 产出物包含 .claude-plugin/ 元数据
- **WHEN** 系统完成构建
- **THEN** 产出物 MUST 包含 `.claude-plugin/marketplace.json` 和 `.claude-plugin/plugin.json`
- **THEN** `plugin.json` 中 `name` MUST 为 `"deepstorm"`
- **THEN** `plugin.json` 中 `version` MUST 从 root `package.json` 的 `version` 字段读取
- **THEN** `plugin.json` 中 `author` MUST 为 `{"name": "deepstorm"}`
- **THEN** `plugin.json` 中 `description` MUST 从 root `package.json` 的 `description` 字段读取

#### Scenario: 产出物包含 hooks
- **WHEN** 用户选择的工具套件包含 hooks
- **THEN** 产出物 MUST 包含对应的 hooks/ 目录及 `hooks.json`
- **THEN** `plugin.json` MUST 包含 `"hooks": "./hooks/hooks.json"` 字段声明，使 Claude Code 能够识别并加载插件的 hooks
