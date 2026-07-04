## Why

DeepStorm 的 hooks（意图检测、危险命令拦截、文件保护、自动格式化等）在 plugin 模式下完全不触发，在 standalone 模式下也可能因 `${CLAUDE_PLUGIN_ROOT}` 未定义而静默失败。根因是 `plugin.json` 缺少 `"hooks"` 声明字段，Claude Code 不加载插件目录下的 hooks；同时 hook 路径使用了仅 plugin 模式可用的环境变量。

## What Changes

- **plugin.json 补全 hooks 声明**：在插件构建流程的 hooks 安装阶段之后，更新 `.claude-plugin/plugin.json` 增加 `"hooks": "./hooks/hooks.json"` 字段
- **hooks 路径改为相对路径**：`packages/*/hooks/hooks.json` 中的 `${CLAUDE_PLUGIN_ROOT}/hooks/` 改为 `./`，使 standalone 和 plugin 两种模式下都能正确解析
- **setup 流程确认 hooks 被部署**：现有 setup 的 Step 5 有合并 hooks 的逻辑，但在 `/Users/billkang/workspace/ai` 等实际项目中没有生效 — 需要排查并修复

## Capabilities

### New Capabilities
- `plugin-hooks-declaration`: 在 `plugin.json` 中声明 hooks 路径，使 Claude Code 识别并加载插件 hooks

### Modified Capabilities
- `plugin-build`: 补充 requirement — 当用户选中的工具套件包含 hooks 时，`plugin.json` SHALL 包含 `"hooks"` 字段声明
- `hook-deployment`: 补充 requirement — hooks.json 中的脚本路径在 standalone 和 plugin 两种模式下均 SHALL 正确解析；setup 流程 SHALL 确保 hooks 被部署到目标项目

## Impact

- `packages/cli/src/commands/plugin-build.ts` — 新增 `updatePluginJsonHooks()` 函数调用
- `packages/cli/src/engine/plugin-builder.ts` — 无改动（hooks 声明在 build 后补充）
- `packages/reef/hooks/hooks.json` — `${CLAUDE_PLUGIN_ROOT}/hooks/` → `./`
- `packages/sweep/hooks/hooks.json` — 同上
- `packages/tide/hooks/hooks.json` — 同上
- `packages/cli/src/commands/setup.ts` — 排查 Step 5 hooks 部署未生效的原因（如 `ai` 项目）
