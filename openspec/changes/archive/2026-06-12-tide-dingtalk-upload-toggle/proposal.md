## Why

Tide 的 Step 4a（推送到钉钉云文档）已在 spec 中有定义，但实际能力尚未完全打通。部分项目可能不需要钉钉集成（如个人项目、暂未配置钉钉 MCP 的环境），或者需要渐进式启用。当前缺少一个全局开关来控制是否启用 PRD 上传钉钉的能力。

提供一个 feature toggle，让用户可以在项目级别的 `.claude/settings.json` 或 `settings.local.json` 中控制钉钉云文档上传功能的开关状态，默认开启，同时保持向后兼容。

## What Changes

- 新增嵌套 JSON 结构的 feature toggle，路径为 `deepstorm → tide → dingtalkUpload → enabled`，控制 Tide 是否启用钉钉云文档上传能力
  - 默认值：`true`（开启）
  - 配置位置：项目 `.claude/settings.json` 或 `.claude/settings.local.json`
- 修改 Tide Step 4a 发布流程，在尝试推送到钉钉前检查该配置项
  - 启用时：按现有流程执行钉钉上传
  - 禁用时：跳过钉钉上传步骤，直接进入 4b Jira 任务拆分（或提示用户该能力未开启）
- Tide SKILL.md 和 publish-flow.md 中补充配置说明

## Capabilities

### New Capabilities

- `feature-toggle`: 提供 Tide 各能力的 feature toggle 机制，通过 `.claude/settings.json` 或 `settings.local.json` 读取配置项，支持 hook 或 skill 运行时读取

### Modified Capabilities

- `tide-core`: 发布流程（Step 4）的 4a 步骤新增配置检查前置条件：仅在 `deepstorm.tide.dingtalkUpload.enabled` 为 `true` 时执行钉钉上传，否则跳过或提示

## Impact

- **Tide skill**（`packages/tide/skills/tide/SKILL.md`）：Step 4a 逻辑需加入配置项检查
- **publish-flow.md**：补充配置项说明和异常流程
- **Tide 插件**：无新增依赖，配置读取能力通过 Claude Code 的 settings 机制原生支持
