## Why

部分团队不希望将 DeepStorm 的 skills/agents/hooks 文件直接安装到项目代码仓库的 `.claude/` 目录下。通过将 DeepStorm 构建为 Claude Plugin，团队可以通过 `/plugin install` 安装插件市场的方式使用 DeepStorm，无需将工具文件纳入仓库管理。

## What Changes

- `@deepstorm/cli` 新增 `plugin build` 子命令
- `plugin build` 复用 `setup` 的完整向导流程（MCP 选择、工具套件选择、语言/框架配置）
- 构建产出为完整 Claude Plugin 目录（结构参考 lc-toolkit）
- 构建产出目录为 `.deepstorm/plugins/deepstorm/`
- 支持用户自定义 plugin 市场名（marketplace name）
- 构建过程中自动确保 `.gitignore` 包含 `.deepstorm/` 忽略规则

## Capabilities

### New Capabilities
- `plugin-build`: 通过向导配置，将 DeepStorm 的工具套件构建为一个独立的 Claude Plugin 包，支持用户自定义市场名，产出物包含完整的 skills/agents/hooks/MCP 配置及文档

### Modified Capabilities

- `setup-wizard`: `plugin build` 复用 setup 的向导配置组件，但新增了市场名输入环节；向导核心逻辑可共享但走向不同输出路径

## Impact

- `@deepstorm/cli`：新增 `src/commands/plugin-build.ts` 或类似模块
- 安装引擎（installer）：需要支持输出到 plugin 目录而非 `.claude/`
- `.gitignore`：添加 `.deepstorm/` 忽略规则
- 构建产物不影响现有 `setup` 功能，两者独立运行
