## Why

DeepStorm CLI 的安装流程存在两处重复问答的用户体验问题：`deepstorm init` 选过的技术方案在 `deepstorm setup` 的 reef 安装中又被问一次；tide 安装时配置过的 MCP 服务在 reef 安装时又提示选择和配置。此外，`setup` 二次运行时缺乏增量感知，所有问题和选择都从头来过。这些问题降低了工具的丝滑度，需要通过配置共享和状态检测来消除重复操作，让安装体验更流畅。

## What Changes

- `deepstorm init` 结束时将已选择的技术方案写入 `.claude/settings.json` 的 `deepstorm.reef.*` 命名空间
- `deepstorm init` 完成后提示用户是否继续安装 DeepStorm 环境，选 Yes 后直接进入 setup 流程
- `deepstorm setup` 启动时读取 `.claude/settings.json` 中的已有 `deepstorm` 配置，用已有值初始化 `configuredKeys`，跳过已配置的问卷问题
- `deepstorm setup` 对于已有完整技术方案的套件（如 reef），跳过整组问卷
- `deepstorm setup` 的 MCP 选择流程读取 `installedMcpServers` + `.env` key 完整性，隐藏已装且 key 完整的 MCP 服务
- `deepstorm setup` 二次运行时检测已有安装的工具，默认勾选，仅对新选择的工具展示对应问卷和配置
- `deepstorm setup` 完成后的 guide 按 MCP 服务分组展示环境变量配置状态（✅ 已配 / ⚠️ 缺 key / ❌ 未配）
- 以上所有改动保持向后兼容，不影响已有配置的已有项目

## Capabilities

### New Capabilities

- `init-config-share`: init 结束后将技术方案写入 settings.json 的 deepstorm.reef.* 命名空间，并引导用户继续 setup 流程
- `setup-read-existing`: setup 启动时读取已有 deepstorm 配置来跳过已配问卷、隐藏已装 MCP、默认勾选已有工具
- `setup-incremental`: setup 二次运行时支持智能增量追加安装新工具，不重新问旧工具的问题
- `guide-env-status`: guide 按 MCP 服务分组展示环境变量配置状态，替代当前平铺列表

### Modified Capabilities

无（本次不修改现有 spec，只新增 CLI 行为能力）

## Impact

- **packages/cli/src/commands/init.ts**: 新增写入配置和引导跳转逻辑
- **packages/cli/src/commands/setup.ts**: 无直接改动，通过 wizard-flow 传递已有状态
- **packages/cli/src/wizard/wizard-flow.ts**: 新增读取已有配置、过滤已装 MCP 的逻辑
- **packages/cli/src/wizard/tool-select.ts**: 支持传入 initialValues 默认勾选
- **packages/cli/src/wizard/mcp-select.ts**: 支持传入已有 MCP 列表进行过滤
- **packages/cli/src/wizard/questionnaire.ts**: 支持全组跳过逻辑
- **packages/cli/src/wizard/guide.ts**: 新增 MCP 分组状态展示
- **packages/cli/src/wizard/mcp-env.ts**: 导出部分内部函数供 guide 和 mcp-select 使用
