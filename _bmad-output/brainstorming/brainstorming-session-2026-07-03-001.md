# Brainstorming Session: Plugin Hooks Not Triggering

**日期**: 2026-07-03
**参与者**: billkang（用户）, Claude Code

## 背景

DeepStorm 的 hooks 机制在 plugin 模式下不触发。`.deepstorm/hooks/hooks.json` 定义了 reef 的 hook 配置（包含 intent detect、block dangerous commands、protect files、auto-format、run tests），但在实际项目（`/Users/billkang/workspace/ai`）中从未生效。

## 讨论内容

### 发现的问题

1. **`plugin.json` 缺少 `"hooks"` 声明**
   - Claude Code 插件需要通过 `plugin.json` 的 `hooks` 字段显式声明 hooks 路径
   - 当前生成 `.deepstorm/.claude-plugin/plugin.json` 没有包含 `"hooks": "./hooks/hooks.json"`
   - 对比官方示例：official plugin 的 plugin.json 包含 `"hooks": "./hooks/hooks.json"` 字段

2. **hooks 部署流程分析**
   - `pnpm build:plugin` 构建流程：
     - `buildPlugin()` 创建 `.deepstorm/` 结构 → 写入 `plugin.json`（不含 hooks 声明）
     - `renderToolAssets()` 复制 hooks 脚本到 `.deepstorm/hooks/reef-*.sh`
     - `mergePluginHooks()` 合并 tools 的 hooks.json 到 `.deepstorm/hooks/hooks.json`
     - **问题：plugin.json 在 hooks 安装之前写入，无法知道 hooks 是否存在**
   - `npx @deepstorm/cli setup` 流程（standalone 模式）：
     - 已有 Step 5 合并 hooks 到 `.claude/hooks/hooks.json`
     - `renderToolAssets()` 复制脚本到 `.claude/hooks/reef-*.sh`
     - **问题：`${CLAUDE_PLUGIN_ROOT}` 在 standalone 模式下可能未定义**

3. **`setup` 在 `ai` 项目的状况**
   - `.claude/hooks/` 目录不存在，说明 hooks 从未被成功部署到该目标项目

### 尝试的修复（已跳步）

已直接修改了两个文件：
- `packages/cli/src/engine/plugin-builder.ts`
- `packages/cli/src/commands/plugin-build.ts`

添加了 `updatePluginJsonHooks()` 函数，在 hooks 安装后补充 `plugin.json` 的 hooks 声明。

## 结论

- 根因是 `plugin.json` 缺少 `"hooks"` 声明
- 已做部分修复但未走完整开发流程
- 需要按 DeepStorm Flow 重新走一遍完整的 OpenSpec 变更流程

## 下一步

按照标准流程：
1. ✅ 产出 brainstorming 文件
2. → `/opsx:new` 创建变更
3. → proposal → specs → design → tasks
4. → 检查 superpowers
5. → TDD apply → verify → archive
